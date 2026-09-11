# D. Gửi nhắc — P3-15 → P3-21

Đặc tả: [p3-events-reminders.md](../../../docs/features/p3-events-reminders.md) mục 3.

> **Nhóm khó nhất Phase 3.** Đây là lần đầu app làm việc khi **không ai mở nó**. Lỗi ở đây
> không hiện ra trên màn hình — phải để máy qua đêm mới biết.

**Làm đúng thứ tự này** để mỗi bước kiểm được ngay:

```
P3-16 viết hàm gửi  →  gọi TAY, thấy push tới   ← kiểm được trong 2 phút
   ↓
P3-15 nối cron      →  tự chạy mỗi giờ          ← kiểm được trong 1 giờ
   ↓
P3-17..P3-20 luật giờ, gộp, chống trùng
   ↓
P3-21 push hằng ngày
```

Nối cron trước rồi mới viết hàm là tự làm khó mình: mỗi lần sửa phải chờ một tiếng.

---

## P3-16 · Edge Function `send-reminders`

**Mục tiêu:** một hàm gọi tay được, gửi đúng nhắc cho đúng người.

**Các bước**

1. ```powershell
   npx supabase functions new send-reminders
   ```

2. Luồng bên trong:
   ```
   1. Lấy giờ hiện tại (UTC)
   2. Với mỗi space:
        - tính "bây giờ là mấy giờ" ở múi giờ từng thành viên
        - nếu chưa tới giờ gửi → bỏ qua người đó
   3. Gộp danh sách cần nhắc hôm nay:
        - sự kiện người dùng + mốc nhắc (bảng event_reminders)
        - mốc hệ thống từ upcoming_milestones()
   4. Bỏ những mục người đó đã tắt nhắc (reminder_mutes)
        và những loại họ đã tắt trong notification_prefs
   5. Chống trùng: insert vào reminder_sends ... on conflict do nothing
        → chỉ gửi khi insert THÀNH CÔNG
   6. Gọi hàm gửi thông báo đã có từ Phase 1
   ```

3. ⚠️ **Function chạy bằng `service_role` nên bỏ qua RLS.** Mọi phép lọc "gửi cho ai" phải
   nằm rõ ràng trong query — không được dựa vào RLS như phía app.

4. **Không viết hàm gửi push mới.** Gọi `send-notification` đã dựng ở
   [Phase 1 nhóm E](../../phase-01/steps/e-notifications.md). Một chỗ gửi duy nhất cho cả app.

5. Thêm tham số `dry_run` in ra danh sách sẽ gửi mà **không gửi thật** — thứ này tiết kiệm
   rất nhiều thời gian khi debug.

**Xong khi:** tạo một sự kiện cho ngày mai, gọi tay function bằng `curl` → iPhone kêu.

**Bẫy**
- Bước 5 phải đứng **trước** bước 6. Gửi xong mới ghi "đã gửi" thì lỗi mạng giữa chừng sẽ
  gửi lại ở lần chạy sau.

---

## P3-15 · pg_cron

**Mục tiêu:** function tự chạy, không cần ai mở app.

**Các bước**

1. Bật extension trong SQL Editor của Supabase:
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;
   ```

2. Tạo job chạy **mỗi giờ, phút 0**:
   ```sql
   select cron.schedule(
     'send-reminders-hourly', '0 * * * *',
     $$ select net.http_post(
          url := '<url edge function>',
          headers := jsonb_build_object('Authorization', 'Bearer <service key>')
        ); $$
   );
   ```

3. **Vì sao mỗi giờ, không phải mỗi ngày:** người dùng ở nhiều múi giờ, và "9:00 sáng giờ
   của họ" rơi vào những giờ UTC khác nhau. Chạy mỗi giờ rồi lọc theo múi giờ từng người là
   cách đơn giản nhất.

4. Kiểm lịch sử chạy: `select * from cron.job_run_details order by start_time desc limit 10;`

**Xong khi:** sau một giờ, `cron.job_run_details` có một dòng thành công.

**Bẫy**
- Service key nằm trong câu lệnh cron → nó ở trong database. Chấp nhận được với dự án này,
  nhưng **đừng commit câu lệnh đó vào git**. Ghi trong migration là `<service key>` và đặt
  tay trong SQL Editor.

---

## P3-17 · Gửi đúng giờ theo múi giờ người nhận

**Mục tiêu:** 9:00 sáng là 9:00 sáng **ở chỗ người nhận**.

**Các bước**

1. Cần lưu múi giờ của từng người. Nếu Phase 1 chưa có, thêm cột `timezone` vào `profiles`,
   app cập nhật mỗi lần mở bằng
   `Intl.DateTimeFormat().resolvedOptions().timeZone` → `"Asia/Ho_Chi_Minh"`.

2. Trong function, với mỗi người:
   ```sql
   (now() at time zone p.timezone)::time
   ```
   So với giờ gửi:

   | Trường hợp | Giờ gửi |
   |---|---|
   | Nhắc trước (còn N ngày) | **9:00** |
   | Sự kiện diễn ra **hôm nay** | **8:00** — sớm hơn để còn kịp làm gì đó |

3. Chấp nhận sai số trong vòng một giờ (cron chạy theo giờ). Không cần chính xác tới phút.

**Xong khi:** đổi múi giờ máy sang UTC-8, đặt nhắc, xác nhận thông báo tới lúc 9:00 giờ mới.

**Bẫy**
- Người chưa có `timezone` → mặc định `Asia/Ho_Chi_Minh`, đừng mặc định UTC.

---

## P3-18 · Giờ yên lặng

**Mục tiêu:** không đánh thức người ta lúc nửa đêm.

**Các bước**

1. Đọc `notification_prefs` của người nhận (bảng đã có từ Phase 1).

2. Rơi vào giờ yên lặng (mặc định 22:00–08:00) → **hoãn tới hết giờ yên lặng**, không bỏ.
   Cách đơn giản: không gửi, và **không ghi vào `reminder_sends`** → lần chạy cron sau,
   khi đã ra khỏi khung giờ, nó tự gửi.

3. ⚠️ **Giờ yên lặng không áp dụng cho [nudge](../../../docs/features/p5-nudge.md)** (Phase 5).
   Nudge là hành động của một con người, không phải thông báo tự động.

**Xong khi:** đặt giờ yên lặng 08:00–20:00, đặt nhắc, xác nhận thông báo chỉ tới sau 20:00.

---

## P3-19 · Gộp nhiều dịp cùng ngày

**Mục tiêu:** ba dịp trong một ngày → **một** thông báo.

**Các bước**

1. Trong function, gom theo `(user_id, ngày)` trước khi gửi.

2. | Số dịp | Nội dung |
   |---|---|
   | 1 | *"Còn 3 ngày là sinh nhật Linh 🎂"* |
   | 2 | *"Còn 3 ngày là sinh nhật Linh, và 3 ngày nữa là mốc 500 ngày"* |
   | ≥ 3 | *"Hôm nay có 3 dịp đặc biệt sắp tới 🎉"* |

3. Chạm vào → mở tab Kế hoạch (không mở một sự kiện cụ thể khi đã gộp).

4. `reminder_sends` vẫn ghi **từng mục riêng**, không ghi một dòng cho cả nhóm — nếu không,
   mục nào bị lỗi sẽ không bao giờ gửi lại được.

**Xong khi:** tạo ba sự kiện cùng ngày → nhận đúng một thông báo.

---

## P3-20 · Chống gửi trùng

**Mục tiêu:** cron chạy lại bao nhiêu lần cũng chỉ gửi một lần.

**Các bước**

1. Dùng bảng `reminder_sends` đã tạo ở [a-database.md](a-database.md#p3-03--bảng-đã-gửi--chống-gửi-trùng).

2. ```sql
   insert into reminder_sends (user_id, ref_key, sent_for)
   values (...) on conflict do nothing
   returning id;
   ```
   **Không có dòng trả về** → đã gửi rồi → bỏ qua.

3. Ràng buộc `unique` là thứ bảo đảm, không phải câu `if` trong code — hai lần cron chạy
   song song vẫn an toàn.

**Xong khi:** gọi tay function **năm lần liên tiếp** → đúng **một** thông báo tới máy.

> Đây là bài kiểm quan trọng nhất nhóm D. Làm thật, đừng chỉ đọc code rồi tin là đúng.

---

## P3-21 · Push hằng ngày "hôm nay là ngày thứ N"

**Mục tiêu:** thứ thay thế cho widget mà PWA không có.

**Các bước**

1. Job riêng hoặc nhánh riêng trong cùng function.
2. Nội dung: *"Hôm nay là ngày thứ 412 của hai đứa 💕"*
3. Gửi lúc **9:00** giờ máy nhận.
4. **Mặc định TẮT.** Bật trong Cài đặt.

   Vì sao mặc định tắt: một thông báo **mỗi ngày** là mức làm phiền cao nhất trong app.
   Người muốn nó sẽ tự bật; người không muốn mà bị mặc định bật sẽ tắt hết thông báo.

5. Đúng ngày có mốc → **không gửi** push hằng ngày, chỉ gửi thông báo mốc. Tránh hai cái
   liền nhau.

**Xong khi:** bật lên, hôm sau nhận đúng một thông báo với số ngày đúng.

**Bẫy**
- Đây chính là thứ [distribution.md](../../../docs/decisions/distribution.md) hứa sẽ thay
  widget. Nếu nội dung nhạt thì lời hứa đó không thành. Cân nhắc đổi câu chữ theo mốc:
  *"Còn 88 ngày nữa là 500 rồi đó 👀"*.
