# Tổng kết năm (Wrapped)

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: cuối năm, app kể lại một năm của hai người bằng vài con số và một tấm ảnh chia sẻ được.

## 1. Vì sao đây là tính năng cuối cùng, không phải tính năng đầu tiên

Wrapped **không tạo ra dữ liệu nào** — nó chỉ đọc lại mọi thứ năm phase trước đã tích. Làm
sớm thì không có gì để kể; làm cuối thì nó là phần thưởng cho toàn bộ công sức trước đó.

Nó cũng là **kênh lan truyền duy nhất** của app: nếu sau này phát hành, một tấm ảnh Wrapped
đẹp đăng lên mạng xã hội là quảng cáo miễn phí — cùng cơ chế đã làm nên Spotify Wrapped.

## 2. Kể chuyện gì

Con số được chọn theo nguyên tắc: **kể một câu chuyện, không đọc một báo cáo.**

| Nhóm | Lấy từ | Ví dụ |
|---|---|---|
| Thời gian | [đếm ngày](p1-day-counter.md) | *"Năm nay tụi mình bên nhau ngày thứ 320 → 685"* |
| Gặp gỡ | [Timeline](p2-timeline.md) | *"126 buổi hẹn"* · *"892 tấm ảnh"* · *"tháng 8 nhiều ảnh nhất"* |
| Nơi chốn | [bản đồ dấu chân](p6-footprint-map.md) | *"5 tỉnh thành"* · *"xa nhất: Đà Lạt"* |
| Tiền | [chi tiêu](p4-expenses.md) | *"31,2 triệu tiêu cùng nhau"* · *"đắt nhất: chuyến Đà Lạt"* |
| Ăn uống | [Ăn gì](p2-eat-tonight.md) | *"đi ăn 67 lần"* · *"quán quen: Bún chả Hàng Quạt"* |
| Việc đã làm | [mục tiêu](p4-goals.md) | *"11 mục tiêu hoàn thành"* |
| Lời nói | [câu hỏi mỗi ngày](p5-daily-question.md) | *"trả lời 87 câu hỏi cùng nhau"* |

**Chỉ hiện những nhóm có dữ liệu thật.** Thiếu nhóm nào thì bỏ nhóm đó, không hiện số 0.

Một câu kết viết bằng văn, không phải bảng:
> *"Năm nay tụi mình đi ăn 67 lần, xem 14 bộ phim, và đi được 5 tỉnh thành."*

## 3. Luật nghiệp vụ

### Tính ở đâu

**SQL view + một Edge Function**, không tính ở client. Lý do: cần quét toàn bộ dữ liệu một
năm, và client sẽ phải tải về mọi thứ chỉ để đếm.

Kết quả **lưu lại** thành một bản ghi Wrapped cho mỗi năm — xem lại được vĩnh viễn, và
không phải tính lại mỗi lần mở.

### Khi nào hiện

- Xuất hiện trên Home từ **15/12**, nhắc một lần qua push.
- Chốt số liệu vào **31/12**. Trước đó ghi rõ *"tạm tính tới hôm nay"*.
- Wrapped các năm cũ luôn xem lại được.

### Riêng tư khi chia sẻ

> Ảnh Wrapped ra ngoài internet. Mọi thứ trên đó phải là thứ người dùng **chủ động đồng ý** khoe.

- Mặc định ảnh chia sẻ **không có**: caption, tên địa điểm cụ thể, ảnh thật, con số tiền.
- Trước khi xuất, hiện màn hình **chọn thứ muốn khoe** — từng dòng bật/tắt riêng.
- Có **bản xem trước đúng như ảnh sẽ xuất ra**, không phải xem trước gần đúng.
- Cả hai đều xuất được, không cần người kia đồng ý — nhưng số liệu là của chung nên nội
  dung như nhau.

### Cặp đôi mới yêu vài tháng

Đây là ca phải thiết kế cho, không phải ca biên:

- Dưới 30 ngày dữ liệu → không hiện Wrapped năm, thay bằng *"Hẹn gặp lại cuối năm sau nhé"*.
- 30 ngày tới 6 tháng → Wrapped rút gọn, đổi cách kể: *"Tụi mình mới quen 4 tháng, mà đã đi
  được 23 buổi hẹn"* — nhấn vào **mật độ**, không vào tổng số.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Ghép đôi giữa năm | Chỉ tính từ ngày ghép đôi, ghi rõ *"từ tháng 5"*. |
| Huỷ ghép đôi trong năm | Vẫn xem được Wrapped của phần năm đã ở cùng nhau. Space `archived` thì không sinh Wrapped mới. |
| Một tháng không có dữ liệu | Không nhắc tới tháng đó. Không hiện "0 buổi hẹn tháng 7". |
| Số liệu trông tệ (ít gặp nhau) | **Không bao giờ so sánh theo hướng tiêu cực.** Không có câu *"ít hơn năm ngoái"*. Chỉ kể cái đã có. |
| Ảnh đã bị dọn (space cũ quá 6 tháng) | Wrapped là **chữ và số**, không bị dọn cùng ảnh. |
| Xuất ảnh trên PWA | ⚠️ Trình duyệt chặn tải file do script khởi tạo trong một số ngữ cảnh. Dùng `navigator.share()` với file ảnh — iOS hỗ trợ; đường lùi: hiện ảnh để người dùng **nhấn giữ và lưu**. |
| Nhiều ảnh trong Wrapped | Vẽ bằng Canvas rồi xuất PNG. Không dùng thư viện nặng. |

## 5. Ngoài phạm vi

- Wrapped theo tháng hoặc theo quý. Cả năm mới đủ để thành một câu chuyện.
- Video / ảnh động.
- So sánh với các cặp đôi khác. Trái hẳn định vị "riêng tư".
- Bảng số liệu chi tiết xuất Excel — đó là [xuất dữ liệu](p6-albums-export.md), việc khác.

## 6. Phụ thuộc

Phụ thuộc **mọi phase trước**. Đây là lý do nó nằm ở Phase 6:

[Timeline](p2-timeline.md) · [Ăn gì](p2-eat-tonight.md) · [sự kiện](p3-events-reminders.md) ·
[chi tiêu](p4-expenses.md) · [mục tiêu](p4-goals.md) · [câu hỏi mỗi ngày](p5-daily-question.md) ·
[bản đồ dấu chân](p6-footprint-map.md).

Wrapped chạy được kể cả khi thiếu vài nguồn — nhưng càng đủ thì càng hay.
