# Check-in tâm trạng

`Phase 5` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: một chạm mỗi ngày để người kia biết hôm nay mình thế nào — kể cả khi không tiện nói.

## 1. Vì sao cần

Có những ngày người ta không muốn giải thích, nhưng vẫn muốn người kia **biết**. Một chạm
giải quyết đúng chỗ đó: nói mà không phải kể.

Giá trị thật nằm ở **biểu đồ theo tháng**, không phải ở từng lần check-in. Nhìn bảy ngày
liền cạnh nhau thì thấy được thứ mà từng ngày riêng lẻ không nói ra — *"tuần này em không
ổn"*, *"cứ thứ Tư là cả hai đuối"*. Đó là thông tin thật, và nó chỉ hiện ra khi có chuỗi.

## 2. Luật nghiệp vụ

### Năm mức, một chạm

| | Nghĩa |
|---|---|
| 😞 | tệ |
| 😕 | không ổn lắm |
| 😐 | bình thường |
| 🙂 | ổn |
| 😍 | rất vui |

Năm mức là đủ để vẽ biểu đồ có ý nghĩa, và ít tới mức không phải suy nghĩ. Ghi chú một dòng
là **tuỳ chọn** — phần lớn ngày sẽ không có ghi chú, và như vậy là đúng.

### Người kia thấy ngay

Check-in xong thì người kia thấy **realtime**, và nhận push **chỉ khi** tâm trạng ở mức
😞 hoặc 😕. Push mỗi lần check-in là spam; push khi người ta không ổn là đúng việc.

Nội dung push cố ý nhẹ: *"Linh vừa check-in — hôm nay không được ổn lắm"*. Không dùng từ
gây kịch tính.

### Một lần mỗi ngày, sửa được

- Mỗi người, mỗi ngày một bản ghi.
- **Sửa được cả ngày hôm đó** — tâm trạng thay đổi trong ngày là bình thường.
- Không cho check-in cho ngày quá khứ. Nhớ lại tâm trạng hôm kia là bịa.

### Streak — có, nhưng phải cẩn thận

> **Streak đứt thì tuyệt đối không nhắc.**

Streak đếm **chuỗi ngày cả hai cùng check-in**, không phải chuỗi của riêng ai. Lý do: streak
cá nhân biến nó thành nhiệm vụ; streak chung biến nó thành thứ hai người cùng giữ.

- Đứt streak → con số về 0, im lặng, không thông báo, không thống kê "đã đứt bao nhiêu lần".
- Không có huy hiệu, không có bảng xếp hạng, không có "cố lên còn 2 ngày nữa".

Nếu sau vài tháng thấy streak vẫn tạo cảm giác nghĩa vụ — **bỏ nó đi**. Nguyên tắc *không
biến tình yêu thành KPI* đứng trên tính năng này.

## 3. Biểu đồ

- Mặc định **7 ngày gần nhất**, chuyển được sang 30 ngày.
- Hai người, hai màu, đặt cạnh nhau theo từng ngày — phải đọc được sự **lệch nhau**, đó là
  toàn bộ giá trị.
- Dưới biểu đồ, một câu nhận xét sinh từ dữ liệu:
  *"Giữa tuần Linh có vẻ đuối. Cuối tuần thì cả hai đều ổn."*
- Chạm vào một cột → xem ghi chú của ngày đó.

Câu nhận xét chỉ hiện khi **có ít nhất 5 ngày dữ liệu của cả hai**. Nhận xét trên 2 điểm dữ
liệu là đoán mò, và đoán sai về tâm trạng người khác thì phản tác dụng.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Chưa đủ dữ liệu vẽ biểu đồ | Hiện biểu đồ trống có khung + *"Check-in vài ngày nữa là thấy được xu hướng"*. |
| Một người không bao giờ check-in | Biểu đồ vẫn vẽ một đường. Streak chung đứng ở 0, không nhắc. |
| Đổi múi giờ / du lịch | "Hôm nay" theo múi giờ máy. Có thể tạo ra ngày trùng hoặc ngày trống khi bay qua múi giờ — chấp nhận, không xử lý phức tạp. |
| Check-in 😞 nhiều ngày liền | **Không** làm gì đặc biệt. App không phải công cụ y tế, và tự ý can thiệp ở đây là vượt vai trò. |
| Người kia đang mở app lúc mình check-in | Cập nhật realtime. |
| Space `archived` | Biểu đồ cũ xem lại được, không check-in mới. |
| Ghi chú rất dài | Cắt gọn ở biểu đồ, xem đầy đủ khi chạm vào. |

## 5. Ngoài phạm vi

- Phân tích hay lời khuyên về tâm lý. Tuyệt đối không.
- Nhắc check-in nhiều hơn một lần mỗi ngày.
- Gắn tâm trạng với thời tiết, chu kì, hay dữ liệu sức khoẻ — chạm vào vùng nhạy cảm
  ở [Tầng 3](../../overview.md).
- Chia sẻ biểu đồ ra ngoài.
- Tâm trạng riêng tư chỉ mình thấy. Trái quyết định D3, và trái mục đích tính năng.

## 6. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Thông báo](p1-notifications.md) | Push khi người kia không ổn |
| Realtime (đã có từ Phase 2) | Người kia thấy ngay |

Nối vào: [nudge](p5-nudge.md) — thấy người kia 😞 thì gửi một cái chạm là phản ứng tự nhiên
nhất, đặt nút ngay dưới biểu đồ.
