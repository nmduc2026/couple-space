// Quét sự kiện tới hạn và gửi nhắc. pg_cron gọi mỗi giờ.
//
// Toàn bộ luật "ai cần nhắc lúc nào" nằm trong hàm SQL `due_reminders()`
// — giờ máy người nhận, giờ yên lặng, chống gửi trùng. Function này chỉ
// gộp theo người rồi đẩy ra Web Push.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

type DueRow = {
  user_id: string;
  couple_id: string;
  subject_key: string;
  title: string;
  emoji: string | null;
  target_date: string;
  days_before: number;
};

function phrase(row: DueRow) {
  const label = `${row.emoji ? row.emoji + " " : ""}${row.title}`;
  // "Hôm nay là ngày thứ 412" đã là câu hoàn chỉnh — đừng thêm "Hôm nay:"
  if (row.subject_key === "daily") return label;
  if (row.days_before === 0) return `Hôm nay: ${label}`;
  if (row.days_before === 1) return `Ngày mai: ${label}`;
  return `Còn ${row.days_before} ngày nữa: ${label}`;
}

/** Một người một lượt cron chỉ nhận MỘT thông báo, dù có mấy thứ tới hạn. */
function summarise(items: DueRow[]) {
  const daily = items.find((i) => i.subject_key === "daily");
  const letters = items.filter((i) => i.subject_key.startsWith("letter:"));
  const ratings = items.filter((i) => i.subject_key.startsWith("eat_rating:"));
  const events = items.filter(
    (i) =>
      i.subject_key !== "daily" &&
      !i.subject_key.startsWith("letter:") &&
      !i.subject_key.startsWith("eat_rating:"),
  );

  // Thư mở khoá quan trọng hơn mọi thứ khác trong ngày — cho nó cả thông báo
  if (letters.length > 0) {
    return {
      body: letters.length === 1
        ? "💌 Có một lá thư vừa mở khoá"
        : `💌 Có ${letters.length} lá thư vừa mở khoá`,
      path: "/letters",
    };
  }

  // Hỏi đánh giá là lời nhắc nhẹ nhất — chỉ gửi khi không có gì khác
  if (events.length === 0 && !daily && ratings.length > 0) {
    return {
      body: ratings.length === 1
        ? `Hôm qua đi ${ratings[0].title} — ngon không?`
        : "Hôm qua đi ăn — đánh giá một câu nhé?",
      path: "/eat",
    };
  }

  if (events.length === 0 && daily) {
    return { body: phrase(daily), path: "/" };
  }
  const eventBody = events.length === 1
    ? phrase(events[0])
    : `Hôm nay có ${events.length} dịp đặc biệt`;

  return {
    body: daily ? `${phrase(daily)} · ${eventBody}` : eventBody,
    path: "/plan",
  };
}

Deno.serve(async (req) => {
  // Chỉ cron và người vận hành được gọi — kiểm tra bí mật dùng chung.
  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ??
    "mailto:hello@couple-space.app";

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: "Missing VAPID secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("due_reminders");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = (data ?? []) as DueRow[];

  // Gộp theo người: cùng ngày có nhiều dịp thì một thông báo, không phải ba.
  const byUser = new Map<string, DueRow[]>();
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  let sent = 0;
  let failed = 0;

  for (const [userId, items] of byUser) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs?.length) continue;

    const { body, path } = summarise(items);

    const payload = JSON.stringify({
      title: "Couple Space",
      body,
      path,
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err) {
        failed++;
        // 404/410 = máy đó đã gỡ app; dọn đăng ký chết đi
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    // Đánh dấu đã gửi — kể cả khi push lỗi, để cron sau không dội lại.
    await supabase.from("reminder_sends").insert(
      items.map((i) => ({
        couple_id: i.couple_id,
        user_id: i.user_id,
        subject_key: i.subject_key,
        target_date: i.target_date,
        days_before: i.days_before,
      })),
    );
  }

  return new Response(
    JSON.stringify({ candidates: rows.length, sent, failed }),
    { headers: { "Content-Type": "application/json" } },
  );
});
