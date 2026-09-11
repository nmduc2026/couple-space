// Xuất toàn bộ dữ liệu của một space ra file ZIP.
//
// Đây là phần BẮT BUỘC, không phải tính năng phụ: nó là lời hứa rằng dữ
// liệu vẫn là của hai người kể cả khi họ không dùng app nữa. Vì vậy nó
// phải chạy được cả khi space đã `archived` — đó chính là lúc cần nhất.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { BlobWriter, TextReader, ZipWriter } from "npm:@zip.js/zip.js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = { ...cors, "Content-Type": "application/json" };

/** Tên file ảnh mang ngày và caption, không phải UUID — mở thư mục ra là
 *  đọc được, không cần app nào cả. */
function photoName(date: string, caption: string | null, i: number) {
  const slug = (caption ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
    .toLowerCase();
  return slug ? `${date}-${slug}-${i + 1}` : `${date}-${i + 1}`;
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

  // Client mang token của người dùng: mọi truy vấn dưới đây đi qua RLS,
  // nên bản xuất chỉ chứa đúng những gì người này được phép thấy.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user;
  if (!me) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", me.id)
    .maybeSingle();

  if (!membership) {
    return new Response(JSON.stringify({ error: "Chưa có space nào" }), {
      status: 404,
      headers: json,
    });
  }
  const coupleId = membership.couple_id as string;

  // Giới hạn một lần mỗi giờ: đóng gói ZIP tốn CPU và băng thông.
  const { data: recent } = await supabase
    .from("export_runs")
    .select("created_at")
    .eq("user_id", me.id)
    .gt("created_at", new Date(Date.now() - 3_600_000).toISOString())
    .maybeSingle();

  if (recent) {
    return new Response(
      JSON.stringify({ error: "Mỗi giờ chỉ xuất được một lần." }),
      { status: 429, headers: json },
    );
  }

  const tables = [
    "couples",
    "couple_members",
    "posts",
    "post_media",
    "reactions",
    "comments",
    "events",
    "expenses",
    "goals",
    "goal_steps",
    "goal_contributions",
    "eat_items",
    "eat_visits",
    "eat_ratings",
    "mood_checkins",
    "question_answers",
    "albums",
    "album_posts",
    "wishlist_items",
    // Cố ý KHÔNG có ở đây:
    //   letters          — thư chưa mở của người kia không được lọt ra;
    //                      lấy riêng bên dưới qua RLS của chính người gọi
    //   wishlist_marks   — dấu vết mua quà chỉ người đặt dấu mới thấy;
    //                      RLS đã chặn, nhưng không liệt kê cho chắc
    //   push_subscriptions, notification_prefs — của riêng từng máy
  ];

  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
  const summary: Record<string, number> = {};

  for (const table of tables) {
    const column = table === "couples" ? "id" : "couple_id";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, coupleId);
    if (error) continue;
    summary[table] = data?.length ?? 0;
    await zipWriter.add(
      `du-lieu/${table}.json`,
      new TextReader(JSON.stringify(data ?? [], null, 2)),
    );
  }

  // Thư: RLS tự lọc — thư chưa tới ngày mở của người kia sẽ không có mặt.
  const { data: letters } = await supabase
    .from("letters")
    .select("*")
    .eq("couple_id", coupleId);
  summary["letters"] = letters?.length ?? 0;
  await zipWriter.add(
    "du-lieu/letters.json",
    new TextReader(JSON.stringify(letters ?? [], null, 2)),
  );

  // Ảnh
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, happened_on, place_name, post_media(storage_path)")
    .eq("couple_id", coupleId)
    .is("deleted_at", null)
    .order("happened_on", { ascending: true });

  let photoCount = 0;
  const timelineRows: string[] = [];

  for (const post of posts ?? []) {
    const media = (post.post_media ?? []) as { storage_path: string }[];
    const names: string[] = [];
    for (const [i, m] of media.entries()) {
      const { data: file } = await supabase.storage
        .from("couple-media")
        .download(m.storage_path);
      if (!file) continue;
      const ext = m.storage_path.split(".").pop() ?? "jpg";
      const name = `${photoName(post.happened_on, post.caption, i)}.${ext}`;
      names.push(name);
      await zipWriter.add(`anh/${name}`, file.stream());
      photoCount++;
    }

    timelineRows.push(
      `<article><h2>${escapeHtml(post.happened_on)}</h2>` +
        (post.place_name ? `<p class="p">📍 ${escapeHtml(post.place_name)}</p>` : "") +
        (post.caption ? `<p>${escapeHtml(post.caption)}</p>` : "") +
        names.map((n) => `<img src="anh/${encodeURIComponent(n)}" alt="">`).join("") +
        `</article>`,
    );
  }

  // Một file HTML mở bằng trình duyệt là xem lại được, không cần app.
  await zipWriter.add(
    "ky-niem.html",
    new TextReader(`<!doctype html><html lang="vi"><meta charset="utf-8">
<title>Kỉ niệm</title>
<style>
body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:24px;
  background:#fbf8f9;color:#2a1f26;line-height:1.6}
article{background:#fff;border:1px solid #eadfe3;border-radius:16px;padding:16px;margin-bottom:16px}
h2{font-size:15px;color:#8a7480;margin:0 0 8px}
.p{color:#8a7480;font-size:14px;margin:0 0 8px}
img{width:100%;border-radius:10px;margin-top:8px}
</style>
<h1>Kỉ niệm của hai đứa</h1>
${timelineRows.join("\n")}
</html>`),
  );

  await zipWriter.add(
    "README.txt",
    new TextReader(`COUPLE SPACE — BẢN XUẤT DỮ LIỆU
Ngày xuất: ${new Date().toISOString().slice(0, 10)}

ky-niem.html   Mở bằng trình duyệt bất kỳ để xem lại dòng thời gian.
               Không cần cài gì, không cần mạng.
anh/           Toàn bộ ảnh, tên file là ngày + caption.
du-lieu/       Dữ liệu thô dạng JSON, mỗi bảng một file.

Ghi chú:
- Thư gửi tương lai chưa tới ngày mở của người kia KHÔNG nằm trong bản này.
- Dấu đánh trên wishlist quà là riêng của từng người, cũng không có ở đây.

Tổng: ${photoCount} ảnh.
${Object.entries(summary).map(([k, v]) => `  ${k}: ${v} dòng`).join("\n")}
`),
  );

  const blob = await zipWriter.close();
  await supabase.from("export_runs").insert({
    couple_id: coupleId,
    user_id: me.id,
  });

  return new Response(blob, {
    headers: {
      ...cors,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="couple-space-${
        new Date().toISOString().slice(0, 10)
      }.zip"`,
    },
  });
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
