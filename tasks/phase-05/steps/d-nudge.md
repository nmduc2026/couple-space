# D. Nhắc nhẹ (Nudge) — P5-29 → P5-34

Đặc tả: [p5-nudge.md](../../../docs/features/p5-nudge.md).
Xem trước: màn hình **P5-05** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Nhóm rẻ nhất Phase 5.** Đường ống push đã chạy từ Phase 1 — tính năng này về cơ bản chỉ
> là một nút gọi vào đó.
>
> Nhưng nó là chỗ duy nhất app chạm tới lãnh địa của Messenger, nên mọi quyết định ở đây đều
> nhằm **giữ nó không biến thành chat**.

---

## P5-29 · Bốn nudge cố định

**Các bước**

1. Bảng tra cứu trong app, không lưu database:

   | Icon | Nhãn | Nội dung push | Hành động khi chạm |
   |---|---|---|---|
   | 🤍 | Nhớ em | *"Linh đang nhớ bạn 🤍"* | Mở Home |
   | 🏠 | Về chưa? | *"Linh hỏi: về chưa? 🏠"* | Mở Home |
   | 🍜 | Đi ăn không? | *"Linh rủ đi ăn 🍜"* | **Mở thẳng vòng quay Ăn gì** |
   | ☕ | Nghỉ tí đi | *"Linh nhắc bạn nghỉ tí ☕"* | Mở Home |

2. **Cố định, không cho tự đặt câu.** Hai lý do: gửi nhanh hơn (một chạm, không gõ), và
   không mở đường dùng nudge như một kênh nhắn tin — đúng thứ tính năng này tránh.

3. Gọi Edge Function `send-notification` đã có từ
   [Phase 1](../../phase-01/steps/e-notifications.md). **Không viết hàm gửi mới.**

4. Bảng ghi tối thiểu để đếm tần suất (P5-30):
   ```sql
   create table public.nudges (
     id        uuid primary key default gen_random_uuid(),
     couple_id uuid not null references public.couples(id) on delete cascade,
     from_user uuid not null references public.profiles(id) on delete cascade,
     kind      text not null check (kind in ('miss','home','eat','rest')),
     sent_at   timestamptz not null default now()
   );
   create index on public.nudges (from_user, sent_at desc);
   ```
   Bảng này **chỉ để đếm**, không phải lịch sử để xem lại — xem P5-34.

**Xong khi:** chạm một nudge → máy kia kêu trong vài giây, nội dung đúng.

---

## P5-30 · Giới hạn tần suất

**Mục tiêu:** nudge không trở thành spam, vì spam làm người nhận tắt hết thông báo.

**Các bước**

1. Hai giới hạn:
   - **Tối đa 5 nudge / người / ngày**
   - **Cách nhau ít nhất 10 phút**

2. Kiểm ở **server** (trong function hoặc bằng policy), không chỉ ở app. Kiểm ở app thì chỉ
   cần mở devtools là lách được — không nghiêm trọng, nhưng làm cho đúng thì rẻ.

3. Chạm giới hạn → thông báo **nhẹ và có ích**, không phải lỗi:
   - Hết lượt ngày: *"Hôm nay gửi nhiều rồi — nhắn tin luôn đi 🙂"*
   - Chưa đủ 10 phút: *"Vừa gửi xong mà 😅 Đợi chút nha."*

4. Giọng ở đây quan trọng. Đây là lúc app nói "không" với người dùng — nói cộc là hỏng cảm giác.

**Xong khi:** gửi 5 cái liên tiếp (bỏ qua giãn cách bằng cách sửa `sent_at`) → cái thứ 6 bị
chặn với đúng câu trên.

---

## P5-31 · Bảng trượt + ba lối vào

**Các bước**

1. Nudge **không có màn hình riêng**. Nó là một bảng trượt từ dưới lên (bottom sheet):
   ```
   ────
   Gửi Linh một cái chạm
   Linh sẽ nhận được ngay một thông báo.

   [🤍 Nhớ em]      [🏠 Về chưa?]
   [🍜 Đi ăn không?] [☕ Nghỉ tí đi]

   Đóng
   ```

2. Ba lối vào, đều ở nơi nó tự nhiên:

   | Lối vào | Vì sao ở đó |
   |---|---|
   | Nút dưới biểu đồ [tâm trạng](c-mood.md) | Thấy người kia 😞 thì đây là phản ứng tự nhiên nhất |
   | Nhấn giữ avatar người kia trên Home | Cử chỉ quen thuộc |
   | Mục trong bảng chọn nút (+) | Đường chính thức |

3. Chọn xong → **đóng ngay**, kèm một phản hồi ngắn (*"Đã gửi 🤍"*), không ở lại màn hình.

4. Vuốt xuống để đóng.

**Xong khi:** cả ba lối vào đều mở đúng bảng; gửi xong tự đóng.

---

## P5-32 · Nudge "đi ăn không?" mở vòng quay

**Mục tiêu:** chi tiết nhỏ làm nudge có ích thật, không chỉ dễ thương.

**Các bước**

1. Push của nudge `eat` mang `data.url = '/eat/spin'`.
2. Service worker xử lý `notificationclick` → mở đúng đường dẫn đó (cơ chế đã dựng ở
   [Phase 1](../../phase-01/steps/e-notifications.md)).
3. Người nhận chạm thông báo → mở thẳng [vòng quay](../../phase-02/steps/e-eat-tonight.md),
   không qua Home.

**Xong khi:** máy A gửi nudge 🍜 → máy B chạm thông báo → vào thẳng màn hình quay.

**Bẫy**
- Nếu app đang mở sẵn thì `notificationclick` cần điều hướng trong app, không mở tab mới.
  Kiểm cả hai trường hợp: app đóng và app đang mở.

---

## P5-33 · Cảnh báo ban đêm

**Mục tiêu:** không đánh thức người ta, nhưng cũng không chặn.

**Các bước**

1. ⚠️ **Giờ yên lặng KHÔNG áp dụng cho nudge.**

   Khác với thông báo tự động ở [Phase 3](../../phase-03/steps/d-reminders.md): nudge là
   hành động chủ động của một con người. Hoãn nó tới sáng là làm hỏng ý nghĩa — một cái
   "nhớ em" gửi lúc 23:00 mà tới lúc 8:00 sáng thì không còn đúng nữa.

2. Thay vì hoãn, **hỏi trước** khi gửi trong khung **23:00 – 06:00** (giờ người nhận):
   > *Linh có thể đang ngủ — vẫn gửi chứ?*
   > **[Vẫn gửi]** · [Thôi]

3. Hỏi **một lần mỗi đêm**, không hỏi lại ở nudge thứ hai cùng đêm.

4. Cần biết múi giờ người nhận — dùng `profiles.timezone` đã có từ
   [Phase 3](../../phase-03/steps/d-reminders.md#p3-17--gửi-đúng-giờ-theo-múi-giờ-người-nhận).

**Xong khi:** đổi giờ máy sang 1:00 sáng → gửi nudge → hiện câu hỏi xác nhận.

---

## P5-34 · Mất mạng và những thứ cố ý không làm

**Các bước**

1. **Mất mạng:** thử lại **một lần** rồi báo thất bại.

   ❌ **Không xếp vào hàng đợi đồng bộ.** Khác với ảnh và chi tiêu — một cái "nhớ em" gửi
   muộn 3 tiếng không còn đúng nữa. Thà báo thất bại để người ta gửi lại lúc khác.

2. Những thứ **cố ý không làm**, ghi rõ ở đây để phiên sau không "bổ sung" nhầm:

   | Không làm | Vì sao |
   |---|---|
   | Dấu "đã xem" | Tạo ra sự chờ đợi và trách móc |
   | Trả lời bằng chữ | Đó là chat |
   | Lịch sử nudge đã gửi | Nó là khoảnh khắc, không phải bản ghi |
   | Trạng thái "đang online" | Giám sát |
   | Nudge hẹn giờ | Mất tính tức thời |
   | Nudge kèm ảnh / sticker | Từng bước một là thành Messenger |

3. Cách "trả lời" duy nhất: **gửi lại một nudge**. Thế là đủ.

4. Comment trong code:
   ```
   // Nudge CỐ Ý không có: đã xem, trả lời chữ, lịch sử, online status.
   // Xem docs/features/p5-nudge.md mục 2.
   ```

**Xong khi:** bật chế độ máy bay → gửi nudge → báo thất bại rõ ràng, không kẹt ở hàng đợi nào.
