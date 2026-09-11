# Nhắc nhẹ (Nudge)

`Phase 5` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: gửi một cái "chạm" — nhớ em / về chưa / đi ăn không — mà không cần mở cuộc trò chuyện.

## 1. Vì sao cần, và vì sao nó KHÔNG phải chat

App cố ý **không làm chat** ([overview.md](../../overview.md) Tầng 3): chi phí cao, và
không thắng nổi Messenger/Zalo.

Nhưng có một thứ Messenger làm **dở**: gửi đi một tín hiệu nhỏ mà không mở ra một cuộc hội
thoại. Nhắn *"nhớ em"* trên Messenger tạo kỳ vọng trả lời, tạo dấu "đã xem", tạo cảm giác
phải nói tiếp. Nudge thì không — nó là **một chạm, một tiếng chuông, hết**.

> Nudge lấy khoảng 20% giá trị của chat với 2% chi phí. Đó là toàn bộ lý do nó tồn tại.

Về mặt kỹ thuật nó gần như miễn phí: đường ống [push](p1-notifications.md) đã chạy từ
Phase 1, tính năng này chỉ là một nút gọi vào đó.

## 2. Luật nghiệp vụ

### Bộ nudge cố định

Phase 5 dùng **bốn** nudge viết sẵn, không cho tự đặt câu:

| | Nội dung push |
|---|---|
| 🤍 Nhớ em | *"Linh đang nhớ bạn 🤍"* |
| 🏠 Về chưa? | *"Linh hỏi: về chưa? 🏠"* |
| 🍜 Đi ăn không? | *"Linh rủ đi ăn 🍜"* |
| ☕ Nghỉ tí đi | *"Linh nhắc bạn nghỉ tí ☕"* |

Cố định vì hai lý do: gửi **nhanh hơn** (một chạm, không gõ), và không mở đường cho việc
dùng nudge như một kênh nhắn tin — mà đó chính là thứ tính năng này tránh.

"Đi ăn không?" chạm vào ở máy người nhận thì mở thẳng [vòng quay Ăn gì](p2-eat-tonight.md).
Đây là chi tiết nhỏ nhưng làm nudge có ích thật chứ không chỉ dễ thương.

### Giới hạn tần suất

> **Tối đa 5 nudge mỗi người mỗi ngày**, và **cách nhau ít nhất 10 phút**.

Không có giới hạn thì nudge thành spam, và người nhận sẽ tắt thông báo — kéo theo mất luôn
những thông báo quan trọng khác.

Chạm giới hạn thì nói thẳng và nhẹ: *"Hôm nay gửi nhiều rồi — nhắn tin luôn đi 🙂"*.

### Không có "đã xem", không có trả lời

- Người gửi **không biết** người kia đã đọc chưa. Cố ý: dấu "đã xem" tạo ra sự chờ đợi và
  trách móc, và đó là thứ app này không mang vào.
- Người nhận **gửi lại một nudge** được — đó là cách "trả lời" duy nhất, và nó đủ.

### Lối vào

Nudge không có màn hình riêng. Ba lối vào, đều ở nơi nó tự nhiên:

1. Nút dưới biểu đồ [tâm trạng](p5-mood-checkin.md) — thấy người kia 😞 thì đây là phản ứng
   tự nhiên nhất.
2. Nhấn giữ avatar người kia trên Home.
3. Mục trong bảng chọn của nút (+).

Mở ra dưới dạng **bảng trượt từ dưới lên** (bottom sheet), chọn xong đóng ngay.

## 3. Ca biên

| Tình huống | Xử lý |
|---|---|
| Người kia tắt thông báo | Nudge vẫn gửi, nhưng hiện dấu chấm trong app. Người gửi **không được báo** là người kia đã tắt — đó là thông tin riêng của họ. |
| Người kia chưa bao giờ mở app / chưa ghép đôi | Ẩn hẳn tính năng. |
| Gửi lúc nửa đêm | **Giờ yên lặng không áp dụng cho nudge.** Nudge là hành động chủ động của một con người, không phải thông báo tự động — hoãn nó tới sáng là làm hỏng ý nghĩa. Nhưng có cảnh báo trước khi gửi trong khung 23:00–06:00: *"Linh có thể đang ngủ — vẫn gửi chứ?"* |
| Gửi liên tiếp 5 cái | Chặn theo mục 2, thông báo nhẹ. |
| Mất mạng lúc gửi | Thử lại một lần rồi báo thất bại. **Không** xếp vào hàng đợi — một cái "nhớ em" gửi muộn 3 tiếng không còn đúng nữa. |
| Space `archived` | Ẩn hẳn. |

## 4. Ngoài phạm vi

- Nudge tự đặt câu (cân nhắc sau, nếu 4 câu cố định thấy thiếu).
- Nudge kèm ảnh / sticker / giọng nói.
- Lịch sử nudge đã gửi. Nó là khoảnh khắc, không phải bản ghi.
- Trạng thái "đang online" / "đã xem".
- Nudge hẹn giờ.

## 5. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Thông báo](p1-notifications.md) | Toàn bộ tính năng là một lần gọi vào Edge Function đã có |
| [Tâm trạng](p5-mood-checkin.md) | Lối vào chính, cùng phase |
| [Ăn gì](p2-eat-tonight.md) | Nudge "đi ăn không?" mở thẳng vòng quay |
