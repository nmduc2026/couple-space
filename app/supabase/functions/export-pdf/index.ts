// Sinh sách ảnh PDF, chạy NỀN và chia thành nhiều đợt.
//
// ---------------------------------------------------------------------------
// Vì sao kiến trúc lại rối thế này — ba thứ đã ĐO ĐƯỢC trên project thật,
// đừng rút gọn nếu chưa đo lại:
//
//  1. Font 14 chuẩn của PDF KHÔNG có dấu tiếng Việt. Phải nhúng TTF thật.
//     Xem assets/README.md.
//
//  2. Ảnh trong app lưu dạng **WebP** (lib/image.ts), mà pdf-lib chỉ nhúng
//     được JPEG/PNG. Nên phải giải mã WebP rồi mã hoá lại JPEG bằng wasm.
//
//  3. Làm cả hai việc trên cho cả cuốn sách trong MỘT lượt chạy thì Edge
//     Function bị cắt với `WORKER_RESOURCE_LIMIT`. Heap wasm của mozjpeg
//     không trả lại sau mỗi tấm nên bộ nhớ chỉ có tăng. Thu nhỏ ảnh trước
//     giúp đi xa hơn (chết ở tấm 5 → qua được cả 16 tấm) nhưng vẫn chết ở
//     bước tải lên.
//
// Vì (3), việc chia làm hai pha:
//
//   Pha 1 — đổi ảnh, THEO ĐỢT. Mỗi lượt gọi xử lý `CHUNK` bài rồi tự gọi lại
//           chính mình. Mỗi lượt là một worker mới, bộ nhớ sạch. `cursor`
//           trong DB nhớ đã tới đâu; JPEG tạm cất trong Storage.
//
//   Pha 2 — ghép PDF từ JPEG đã sẵn. `embedJpg` chỉ đọc header, không đụng
//           wasm, nên bước này nhẹ.
// ---------------------------------------------------------------------------

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

/** Số bài xử lý mỗi lượt. Đo trên project thật: 16 tấm trong một lượt là hết
 *  bộ nhớ, nên để thấp và đi nhiều lượt. Chậm hơn nhưng chạy tới nơi. */
const CHUNK = 4;

/** Khổ giấy tính bằng point (1pt = 1/72 inch). */
const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
};

const MARGIN = 28;
const INK = rgb(0.165, 0.122, 0.15);
const MUTED = rgb(0.54, 0.455, 0.502);
const ACCENT = rgb(0.761, 0.255, 0.357);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const asset = (name: string) => new URL(`./assets/${name}`, import.meta.url);

type Admin = ReturnType<typeof createClient>;

type Job = {
  id: string;
  couple_id: string;
  requested_by: string;
  status: string;
  page_size: string;
  per_page: number;
  year: number | null;
  cursor: number;
};

type PostRow = {
  id: string;
  caption: string | null;
  happened_on: string;
  place_name: string | null;
  post_media: { storage_path: string; position: number }[];
};

type Raw = { data: Uint8ClampedArray; width: number; height: number };

// --------------------------------------------------------------- tiện ích

async function step(admin: Admin, id: string, progress: string) {
  await admin.from("pdf_exports").update({ progress }).eq("id", id);
}

/** Header xác thực cho Storage.
 *
 *  Phải gửi CẢ `apikey` lẫn `Authorization`. Project mới của Supabase cấp khoá
 *  dạng `sb_secret_...` chứ không phải JWT; Storage cố đọc `Authorization` như
 *  một JWT và trả `Invalid Compact JWS`. Header `apikey` mới là chỗ nó chấp
 *  nhận khoá dạng mới. */
const storageAuth = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

/** Tải lên bằng fetch trần chứ không qua lớp storage của supabase-js: lớp đó
 *  gói dữ liệu qua Blob/FormData, tức thêm một bản sao — thứ đang thiếu ở đây
 *  chính là bộ nhớ. */
async function putObject(path: string, bytes: Uint8Array, type: string) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${EXPORT_BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        ...storageAuth,
        "Content-Type": type,
        "x-upsert": "true",
      },
      body: bytes,
    },
  );
  if (!res.ok) {
    throw new Error(`Tải lên ${path} thất bại (${res.status}): ${await res.text()}`);
  }
}

async function getObject(path: string): Promise<Uint8Array | null> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${EXPORT_BUCKET}/${path}`,
    { headers: storageAuth },
  );
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

// --------------------------------------------------------------- ảnh

let wasmReady: Promise<void> | null = null;
function initCodecs() {
  wasmReady ??= (async () => {
    await initWebp(await WebAssembly.compile(await Deno.readFile(asset("webp_dec.wasm"))));
    await initJpeg(await WebAssembly.compile(await Deno.readFile(asset("mozjpeg_enc.wasm"))));
  })();
  return wasmReady;
}

/**
 * Thu nhỏ ảnh RGBA bằng phép lấy mẫu theo ô.
 *
 * Ảnh gốc 1600px giải ra RGBA là ~10MB, mà in khổ A5 hai ảnh một trang thì mỗi
 * ảnh chỉ rộng chừng 180pt — phần lớn số điểm ảnh kia không bao giờ nhìn thấy
 * được, chỉ tốn bộ nhớ và thời gian mã hoá.
 */
function downscale(img: Raw, maxEdge: number): Raw {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  if (scale >= 1) return img;

  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const out = new Uint8ClampedArray(w * h * 4);

  const bx = img.width / w;
  const by = img.height / h;

  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * by);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * by));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * bx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * bx));

      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * img.width + sx) * 4;
          r += img.data[i];
          g += img.data[i + 1];
          b += img.data[i + 2];
          a += img.data[i + 3];
          n++;
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = a / n;
    }
  }

  return { data: out, width: w, height: h };
}

async function toJpeg(bytes: Uint8Array, maxEdge: number): Promise<Uint8Array | null> {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return bytes;

  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 &&
    bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!isWebp) return null;

  await initCodecs();
  const decoded = await decodeWebp(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  ) as Raw;

  const jpeg = await encodeJpeg(downscale(decoded, maxEdge), { quality: 80 });
  return new Uint8Array(jpeg);
}

// --------------------------------------------------------------- chữ

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

function drawCover(page: PDFPage, fonts: Fonts, title: string, subtitle: string) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.969, 0.89, 0.91) });

  const size = width > 500 ? 34 : 26;
  const lines = wrap(title, fonts.bold, size, width - MARGIN * 4);
  let y = height / 2 + (lines.length * size) / 2;
  for (const line of lines) {
    const w = fonts.bold.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (width - w) / 2, y, size, font: fonts.bold, color: ACCENT });
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

// --------------------------------------------------------------- dữ liệu

/** Thứ tự phải ỔN ĐỊNH giữa các lượt gọi: `cursor` là chỉ số trong danh sách
 *  này, nên đổi thứ tự giữa chừng là ghép nhầm ảnh vào bài. */
async function loadPosts(admin: Admin, job: Job): Promise<PostRow[]> {
  let query = admin
    .from("posts")
    .select("id, caption, happened_on, place_name, post_media(storage_path, position)")
    .eq("couple_id", job.couple_id)
    .is("deleted_at", null)
    .order("happened_on", { ascending: true })
    .order("id", { ascending: true });

  if (job.year) {
    query = query
      .gte("happened_on", `${job.year}-01-01`)
      .lte("happened_on", `${job.year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

function cellWidthFor(job: Job) {
  const [pageW] = PAGE_SIZES[job.page_size] ?? PAGE_SIZES.A5;
  const cols = job.per_page === 1 ? 1 : 2;
  return (pageW - MARGIN * 2 - (cols - 1) * 10) / cols;
}

// --------------------------------------------------------------- pha 1

async function transcodeChunk(admin: Admin, job: Job, posts: PostRow[]) {
  // Cỡ ảnh tối đa lấy từ bề rộng ô thật trên trang ở ~300dpi (1pt = 1/72 inch)
  const maxEdge = Math.min(1400, Math.round(cellWidthFor(job) * 4.17));
  const end = Math.min(job.cursor + CHUNK, posts.length);

  for (let i = job.cursor; i < end; i++) {
    await step(admin, job.id, `đổi ảnh ${i + 1}/${posts.length}`);

    const media = [...posts[i].post_media].sort((a, b) => a.position - b.position);
    const first = media[0];
    if (!first) continue;

    const { data: file } = await admin.storage
      .from(MEDIA_BUCKET)
      .download(first.storage_path);
    if (!file) continue;

    // Chỉ nuốt lỗi GIẢI MÃ: một tấm ảnh hỏng không được làm hỏng cả cuốn sách.
    // Lỗi tải lên thì KHÔNG nuốt — nó là lỗi hệ thống, và bọc chung một khối
    // try như trước đã giấu mất đúng một lỗi cấu hình xác thực.
    let jpeg: Uint8Array | null = null;
    try {
      jpeg = await toJpeg(new Uint8Array(await file.arrayBuffer()), maxEdge);
    } catch {
      jpeg = null;
    }
    if (jpeg) await putObject(`${job.couple_id}/${job.id}/${i}.jpg`, jpeg, "image/jpeg");
  }

  await admin.from("pdf_exports").update({ cursor: end }).eq("id", job.id);
  return end;
}

/** Gọi lại chính mình cho đợt kế tiếp. Mỗi lượt là một worker mới — đó chính
 *  là điều cần, vì bộ nhớ mới là thứ đang thiếu. */
async function kickNext(jobId: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/export-pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ export_id: jobId, internal: true }),
  });
}

// --------------------------------------------------------------- pha 2

async function assemble(admin: Admin, job: Job, posts: PostRow[]) {
  const [pageW, pageH] = PAGE_SIZES[job.page_size] ?? PAGE_SIZES.A5;
  await step(admin, job.id, "đang ghép sách");

  const { data: couple } = await admin
    .from("couples")
    .select("start_date, couple_members(nickname)")
    .eq("id", job.couple_id)
    .single();

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
  intro.drawText("Một năm, tóm lại", { x: MARGIN, y, size: 22, font: fonts.bold, color: INK });
  y -= 36;

  const photoTotal = posts.reduce((n, p) => n + p.post_media.length, 0);
  const places = new Set(posts.map((p) => p.place_name).filter(Boolean)).size;
  for (
    const line of [
      `${posts.length} kỉ niệm được ghi lại`,
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
  const rowsPerPage = perPage === 4 ? 2 : 1;
  const cellW = cellWidthFor(job);
  const cellH = perPage === 1
    ? pageH - MARGIN * 2 - 80
    : (pageH - MARGIN * 2 - 60 - (rowsPerPage - 1) * 12) / rowsPerPage;

  let page: PDFPage | null = null;
  let slot = 0;
  let month = "";
  let missing = 0;

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

  for (const [i, post] of posts.entries()) {
    const postMonth = VN_MONTH(post.happened_on);
    // Sang tháng mới thì sang trang mới — cuốn sách đọc theo thời gian
    if (postMonth !== month) {
      month = postMonth;
      newPage(month);
    }

    const jpeg = await getObject(`${job.couple_id}/${job.id}/${i}.jpg`);
    if (!jpeg && post.post_media.length > 0) missing++;

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

  const pageCount = pdf.getPageCount();
  const bytes = await pdf.save();
  const path = `${job.couple_id}/${job.id}.pdf`;

  await step(admin, job.id, `đang tải lên (${Math.round(bytes.length / 1024)}KB)`);
  await putObject(path, bytes, "application/pdf");

  await admin
    .from("pdf_exports")
    .update({
      status: "done",
      progress: null,
      storage_path: path,
      page_count: pageCount,
      error: missing > 0 ? `${missing} ảnh không đọc được, đã bỏ qua` : null,
      finished_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + LINK_HOURS * 3600_000).toISOString(),
    })
    .eq("id", job.id);

  // Dọn JPEG tạm — không dọn thì mỗi lần xuất để lại cả một thư mục
  await admin.storage
    .from(EXPORT_BUCKET)
    .remove(posts.map((_, i) => `${job.couple_id}/${job.id}/${i}.jpg`));

  await notify(admin, job.requested_by, pageCount);
}

// --------------------------------------------------------------- điều phối

async function run(admin: Admin, job: Job) {
  const posts = await loadPosts(admin, job);

  if (posts.length === 0) {
    await admin
      .from("pdf_exports")
      .update({
        status: "failed",
        error: "Chưa có kỉ niệm nào để làm sách.",
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return;
  }

  if (job.cursor < posts.length) {
    const next = await transcodeChunk(admin, job, posts);
    if (next < posts.length) {
      await kickNext(job.id);
      return;
    }
  }

  await assemble(admin, job, posts);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  const body = await req.json().catch(() => ({}));
  const exportId: string | null = body.export_id ?? null;
  // `internal`: lượt gọi do chính hàm này kích, để đi tiếp đợt sau
  const internal: boolean = body.internal === true;

  if (!exportId) {
    return new Response(JSON.stringify({ error: "Thiếu export_id" }), {
      status: 400,
      headers: json,
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Lượt đầu do người dùng gọi: đọc bằng token của họ để RLS tự lo phần "có
  // phải space của mình không". Lượt nối tiếp thì chính hàm này gọi.
  if (!internal) {
    const asUser = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: allowed } = await asUser
      .from("pdf_exports")
      .select("id")
      .eq("id", exportId)
      .maybeSingle();
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Không thấy yêu cầu" }), {
        status: 404,
        headers: json,
      });
    }
  }

  const { data: job } = await admin
    .from("pdf_exports")
    .select("id, couple_id, requested_by, status, page_size, per_page, year, cursor")
    .eq("id", exportId)
    .single();

  if (!job) {
    return new Response(JSON.stringify({ error: "Không thấy yêu cầu" }), {
      status: 404,
      headers: json,
    });
  }

  if (!internal && job.status !== "queued") {
    return new Response(JSON.stringify({ status: job.status }), { headers: json });
  }

  if (job.status === "queued") {
    await admin.from("pdf_exports").update({ status: "running" }).eq("id", job.id);
  }

  const work = run(admin, job as Job).catch(async (err) => {
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

async function notify(admin: Admin, userId: string, pages: number) {
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
