// Sinh sách ảnh PDF, chạy NỀN.
//
// Vì sao không làm đồng bộ: một cuốn sách vài trăm ảnh mất hàng chục giây.
// Client tạo một dòng `pdf_exports` trạng thái `queued` rồi gọi hàm này; hàm
// trả lời ngay, phần việc nặng chạy tiếp trong `EdgeRuntime.waitUntil`, xong
// thì ghi `storage_path` + `expires_at` và đẩy push. Client theo dõi dòng đó.
//
// Hai thứ đã kiểm chứng trước khi viết, đừng đổi nếu chưa kiểm lại:
//
//  1. Font 14 chuẩn của PDF KHÔNG có dấu tiếng Việt. Phải nhúng TTF thật,
//     xem assets/README.md.
//  2. Ảnh trong app lưu dạng **WebP** (lib/image.ts), mà pdf-lib chỉ nhúng
//     được JPEG/PNG. Vì vậy phải giải mã WebP rồi mã hoá lại JPEG.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import decodeWebp, { init as initWebp } from "npm:@jsquash/webp@1.5.0/decode.js";
import encodeJpeg, { init as initJpeg } from "npm:@jsquash/jpeg@1.6.0/encode.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = { ...cors, "Content-Type": "application/json" };

const MEDIA_BUCKET = "couple-media";
const EXPORT_BUCKET = "couple-exports";
const LINK_HOURS = 24;

/** Khổ giấy tính bằng point (1pt = 1/72 inch). */
const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
};

const MARGIN = 28;
const INK = rgb(0.165, 0.122, 0.15);
const MUTED = rgb(0.54, 0.455, 0.502);
const ACCENT = rgb(0.761, 0.255, 0.357);

const asset = (name: string) => new URL(`./assets/${name}`, import.meta.url);

let wasmReady: Promise<void> | null = null;
function initCodecs() {
  // Chỉ nạp một lần cho cả vòng đời instance — biên dịch wasm là phần đắt nhất
  wasmReady ??= (async () => {
    await initWebp(await WebAssembly.compile(await Deno.readFile(asset("webp_dec.wasm"))));
    await initJpeg(await WebAssembly.compile(await Deno.readFile(asset("mozjpeg_enc.wasm"))));
  })();
  return wasmReady;
}

/** Bytes ảnh bất kỳ → JPEG mà pdf-lib nhúng được.
 *  JPEG sẵn thì trả nguyên, không mã hoá lại cho mất chất lượng. */
async function toJpeg(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return bytes;

  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 &&
    bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!isWebp) return null;

  await initCodecs();
  const image = await decodeWebp(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const jpeg = await encodeJpeg(image, { quality: 82 });
  return new Uint8Array(jpeg);
}

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Cắt chữ cho vừa một dòng. Đo bằng chính font sẽ vẽ, không ước lượng theo
 *  số ký tự — chữ có dấu rộng khác chữ không dấu. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const VN_MONTH = (ymd: string) => `Tháng ${Number(ymd.slice(5, 7))}, ${ymd.slice(0, 4)}`;

function drawCover(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  subtitle: string,
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.969, 0.89, 0.91) });

  const size = width > 500 ? 34 : 26;
  const lines = wrap(title, fonts.bold, size, width - MARGIN * 4);
  let y = height / 2 + (lines.length * size) / 2;
  for (const line of lines) {
    const w = fonts.bold.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: (width - w) / 2,
      y,
      size,
      font: fonts.bold,
      color: ACCENT,
    });
    y -= size * 1.25;
  }

  const sw = fonts.regular.widthOfTextAtSize(subtitle, 12);
  page.drawText(subtitle, {
    x: (width - sw) / 2,
    y: y - 8,
    size: 12,
    font: fonts.regular,
    color: MUTED,
  });
}

type PostRow = {
  id: string;
  caption: string | null;
  happened_on: string;
  place_name: string | null;
  post_media: { storage_path: string; position: number }[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  const { export_id } = await req.json().catch(() => ({ export_id: null }));
  if (!export_id) {
    return new Response(JSON.stringify({ error: "Thiếu export_id" }), {
      status: 400,
      headers: json,
    });
  }

  // Đọc yêu cầu bằng token NGƯỜI DÙNG: RLS tự lo phần "có phải space của
  // mình không", không cần kiểm tra lại bằng tay.
  const asUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: job } = await asUser
    .from("pdf_exports")
    .select("id, couple_id, requested_by, status, page_size, per_page, year")
    .eq("id", export_id)
    .single();

  if (!job) {
    return new Response(JSON.stringify({ error: "Không thấy yêu cầu" }), {
      status: 404,
      headers: json,
    });
  }
  if (job.status !== "queued") {
    return new Response(JSON.stringify({ status: job.status }), { headers: json });
  }

  // Từ đây dùng service role: ghi trạng thái và đọc file Storage.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  await admin.from("pdf_exports").update({ status: "running" }).eq("id", job.id);

  const work = build(admin, job).catch(async (err) => {
    await admin
      .from("pdf_exports")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  });

  // Trả lời ngay, làm tiếp ở nền
  EdgeRuntime.waitUntil(work);

  return new Response(JSON.stringify({ status: "running", id: job.id }), {
    headers: json,
  });
});

async function build(
  admin: ReturnType<typeof createClient>,
  job: {
    id: string;
    couple_id: string;
    requested_by: string;
    page_size: string;
    per_page: number;
    year: number | null;
  },
) {
  const [pageW, pageH] = PAGE_SIZES[job.page_size] ?? PAGE_SIZES.A5;

  const { data: couple } = await admin
    .from("couples")
    .select("start_date, couple_members(nickname)")
    .eq("id", job.couple_id)
    .single();

  let query = admin
    .from("posts")
    .select("id, caption, happened_on, place_name, post_media(storage_path, position)")
    .eq("couple_id", job.couple_id)
    .is("deleted_at", null)
    .order("happened_on", { ascending: true });

  if (job.year) {
    query = query
      .gte("happened_on", `${job.year}-01-01`)
      .lte("happened_on", `${job.year}-12-31`);
  }

  const { data: posts } = await query;
  const rows = (posts ?? []) as unknown as PostRow[];

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fonts: Fonts = {
    regular: await pdf.embedFont(await Deno.readFile(asset("BeVietnamPro-Regular.ttf")), {
      subset: true,
    }),
    bold: await pdf.embedFont(await Deno.readFile(asset("BeVietnamPro-Bold.ttf")), {
      subset: true,
    }),
  };

  const names = ((couple?.couple_members ?? []) as { nickname: string | null }[])
    .map((m) => m.nickname)
    .filter(Boolean)
    .join(" & ");

  // ---- Bìa ----
  drawCover(
    pdf.addPage([pageW, pageH]),
    fonts,
    names || "Chuyện của tụi mình",
    job.year ? `${job.year}` : `Từ ${couple?.start_date ?? ""}`,
  );

  // ---- Trang mở đầu: vài con số ----
  const intro = pdf.addPage([pageW, pageH]);
  let y = pageH - MARGIN - 40;
  intro.drawText("Một năm, tóm lại", {
    x: MARGIN,
    y,
    size: 22,
    font: fonts.bold,
    color: INK,
  });
  y -= 36;

  const photoTotal = rows.reduce((n, p) => n + p.post_media.length, 0);
  const places = new Set(rows.map((p) => p.place_name).filter(Boolean)).size;
  for (
    const line of [
      `${rows.length} kỉ niệm được ghi lại`,
      `${photoTotal} tấm ảnh`,
      `${places} nơi đã đi cùng nhau`,
    ]
  ) {
    intro.drawText(line, { x: MARGIN, y, size: 13, font: fonts.regular, color: MUTED });
    y -= 22;
  }

  // ---- Nội dung, chia theo tháng ----
  const perPage = [1, 2, 4].includes(job.per_page) ? job.per_page : 2;
  const cols = perPage === 1 ? 1 : 2;
  const rowsPerPage = perPage === 4 ? 2 : perPage === 2 ? 1 : 1;
  const cellW = (pageW - MARGIN * 2 - (cols - 1) * 10) / cols;
  const cellH = perPage === 1
    ? pageH - MARGIN * 2 - 80
    : (pageH - MARGIN * 2 - 60 - (rowsPerPage - 1) * 12) / rowsPerPage;

  let page: PDFPage | null = null;
  let slot = 0;
  let month = "";
  let skipped = 0;

  const newPage = (heading?: string) => {
    page = pdf.addPage([pageW, pageH]);
    slot = 0;
    if (heading) {
      page.drawText(heading, {
        x: MARGIN,
        y: pageH - MARGIN - 16,
        size: 13,
        font: fonts.bold,
        color: ACCENT,
      });
    }
    return page;
  };

  for (const post of rows) {
    const postMonth = VN_MONTH(post.happened_on);
    // Sang tháng mới thì sang trang mới — cuốn sách đọc theo thời gian
    if (postMonth !== month) {
      month = postMonth;
      newPage(month);
    }

    const media = [...post.post_media].sort((a, b) => a.position - b.position);
    const first = media[0];

    let jpeg: Uint8Array | null = null;
    if (first) {
      const { data: file } = await admin.storage
        .from(MEDIA_BUCKET)
        .download(first.storage_path);
      if (file) {
        try {
          jpeg = await toJpeg(new Uint8Array(await file.arrayBuffer()));
        } catch {
          jpeg = null;
        }
      }
      // Một tấm hỏng không được làm hỏng cả cuốn sách
      if (!jpeg) skipped++;
    }

    if (!page || slot >= perPage) newPage();
    const current = page!;

    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = MARGIN + col * (cellW + 10);
    const top = pageH - MARGIN - 34 - row * (cellH + 12);

    let imageBottom = top - cellH;
    if (jpeg) {
      const embedded = await pdf.embedJpg(jpeg);
      // Giữ đúng tỉ lệ ảnh, chừa chỗ cho hai dòng chữ dưới ảnh
      const box = embedded.scaleToFit(cellW, cellH - 34);
      current.drawImage(embedded, {
        x: x + (cellW - box.width) / 2,
        y: top - box.height,
        width: box.width,
        height: box.height,
      });
      imageBottom = top - box.height;
    }

    const meta = [post.happened_on, post.place_name].filter(Boolean).join(" · ");
    current.drawText(fit(meta, fonts.regular, 8, cellW), {
      x,
      y: imageBottom - 12,
      size: 8,
      font: fonts.regular,
      color: MUTED,
    });

    if (post.caption) {
      current.drawText(fit(post.caption, fonts.regular, 9, cellW), {
        x,
        y: imageBottom - 24,
        size: 9,
        font: fonts.regular,
        color: INK,
      });
    }

    slot++;
  }

  const bytes = await pdf.save();
  const path = `${job.couple_id}/${job.id}.pdf`;

  const { error: upErr } = await admin.storage
    .from(EXPORT_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) throw upErr;

  const expiresAt = new Date(Date.now() + LINK_HOURS * 3600_000);

  await admin
    .from("pdf_exports")
    .update({
      status: "done",
      storage_path: path,
      page_count: pdf.getPageCount(),
      error: skipped > 0 ? `${skipped} ảnh không đọc được, đã bỏ qua` : null,
      finished_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", job.id);

  // Push cho người đã bấm xuất — họ có thể đã đóng app từ lâu
  await notify(admin, job.requested_by, pdf.getPageCount());
}

async function notify(
  admin: ReturnType<typeof createClient>,
  userId: string,
  pages: number,
) {
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublic || !vapidPrivate) return;

  const webpush = (await import("npm:web-push@3")).default;
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@couple-space.app",
    vapidPublic,
    vapidPrivate,
  );

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  const payload = JSON.stringify({
    title: "Couple Space",
    body: `Sách ảnh ${pages} trang đã xong — tải về trong 24 giờ`,
    path: "/albums",
  });

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}
