# Câu hỏi mỗi ngày

`Phase 5` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: mỗi ngày một câu hỏi cho cả hai — và **chỉ thấy câu trả lời của người kia sau khi
> mình đã trả lời**.

## 1. Vì sao đây là tính năng giữ chân mạnh nhất

Mọi tính năng khác cần **có chuyện gì đó xảy ra**: đi chơi thì mới có ảnh, tiêu tiền thì mới
có chi tiêu, tới dịp thì mới có sự kiện. Vào một ngày thứ Ba bình thường, cả hai đi làm, về
nhà, không có gì để đăng — app **không có lý do nào để mở**.

Câu hỏi mỗi ngày lấp đúng khoảng đó. Nó tạo nội dung từ con số 0 đầu vào.

Và cơ chế **che câu trả lời** là thứ làm nó hiệu quả: nó biến việc mở app từ *"xem có gì
mới không"* (thụ động, dễ bỏ) thành *"mình phải trả lời thì mới đọc được"* (có động cơ rõ
ràng, và người kia đang chờ).

## 2. Luật nghiệp vụ

### Cơ chế che — quan trọng nhất

| Trạng thái | Bạn thấy gì |
|---|---|
| Cả hai chưa trả lời | Câu hỏi + ô nhập |
| Người kia đã trả lời, mình chưa | Câu hỏi + ô nhập + **ô mờ** kèm dòng *"Linh đã trả lời rồi"* |
| Mình đã trả lời, người kia chưa | Câu trả lời của mình + *"Đang chờ Linh"* |
| Cả hai đã trả lời | Cả hai câu, mở khoá |

> ⚠️ **Che phải là che thật.** Nếu chỉ ẩn ở tầng giao diện thì dữ liệu vẫn đọc được qua API
> — và toàn bộ tính năng thành trò đùa. Phải chặn ở **RLS**: chỉ đọc được câu trả lời của
> người kia khi tồn tại câu trả lời của mình cho cùng câu hỏi đó.

Ô mờ hiển thị là **một khối giả có kích thước gần đúng**, không phải nội dung thật bị làm
mờ bằng CSS — CSS blur gỡ được bằng devtools.

### Một câu hỏi mỗi ngày, chung cho cả hai

- Câu hỏi của ngày N là **như nhau** với cả hai người.
- "Ngày" tính theo **múi giờ của space** — lấy múi giờ người tạo space. Nếu để mỗi máy tự
  tính thì hai người có thể nhận hai câu khác nhau, và cơ chế che vô nghĩa.
- Câu hỏi đổi lúc **00:00** giờ đó.

### Ngân hàng câu hỏi

- Khoảng **300 câu** viết sẵn, tiếng Việt, gói trong app (không gọi API bên ngoài).
- Chọn theo thứ tự **xáo trộn cố định theo `couple_id`** — mỗi cặp có một thứ tự riêng,
  nhưng luôn lặp lại được (không lưu trạng thái "đã dùng câu nào").
- Hết 300 câu (~10 tháng) thì quay vòng lại từ đầu. Lúc đó câu cũ đã đủ xa để trả lời lại
  thấy thú vị — và **so sánh với câu trả lời năm ngoái là một tính năng hay**, không phải lỗi.

Phân loại câu để giữ nhịp: nhẹ nhàng · vui · sâu · nhìn lại · nhìn tới. Không xếp liền hai
câu "sâu".

### Không trả lời thì sao

- **Không dồn câu cũ.** Mỗi ngày một câu, bỏ lỡ thì thôi.
- Câu chưa trả lời của hôm qua vẫn **trả lời được** trong 7 ngày, ở mục "Bỏ lỡ".
- **Không nhắc quá một lần.** Một push buổi tối nếu chưa ai trả lời, và chỉ thế.

### Sách hỏi đáp

Mọi câu đã mở khoá lưu lại thành danh sách xem theo thời gian, tìm được theo từ khoá.
Đây là thứ có giá trị tăng dần theo thời gian — sau một năm nó là một cuốn sách thật.

## 3. Luồng chính

```
Push buổi sáng: "Câu hỏi hôm nay đã sẵn sàng 💭"
  ▼
Mở app → thẻ Câu hỏi hôm nay (trên Home hoặc tab riêng)
  ▼
Đọc câu hỏi → gõ câu trả lời → [Gửi]
  ├─ Người kia chưa trả lời → "Đang chờ Linh" + push cho Linh
  └─ Người kia đã trả lời   → MỞ KHOÁ ngay, hiện cả hai + push cho Linh
```

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Sửa câu trả lời sau khi đã mở khoá | Cho sửa trong **24 giờ**, có ghi "đã chỉnh". Sau đó khoá — nếu không thì người ta sửa lại sau khi đọc câu người kia, và mất hết ý nghĩa. |
| Xoá câu trả lời của mình | Cho phép, nhưng **không khoá lại** câu của người kia (họ đã đọc rồi). |
| Hai người khác múi giờ | Dùng múi giờ của space, không phải của máy. Nói rõ trong Cài đặt. |
| Trả lời rỗng / chỉ dấu cách | Chặn. Đây là tính năng cần nội dung thật. |
| Câu trả lời rất dài | Không giới hạn cứng. Hiện gọn 4 dòng, chạm để mở hết. |
| Chưa ghép đôi | Ẩn hẳn tính năng. |
| Space `archived` (đã huỷ ghép) | Sách hỏi đáp vẫn đọc được. Không sinh câu hỏi mới. |
| Cả hai trả lời cùng lúc | Cả hai cùng mở khoá. Không có vấn đề thứ tự. |

## 5. Ngoài phạm vi

- Người dùng tự viết câu hỏi cho hôm sau.
- Trả lời bằng ảnh / giọng nói.
- Bình luận qua lại dưới câu trả lời — đó là chat, và app cố ý không làm chat.
- Streak cho câu hỏi. [Tâm trạng](p5-mood-checkin.md) đã có streak; hai streak là bắt đầu
  thành trò chơi tính điểm.

## 6. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Thông báo](p1-notifications.md) | Push buổi sáng và push khi người kia trả lời |
| RLS có điều kiện | Cơ chế che phải nằm ở database — xem [database-schema.md](../design/backend/database-schema.md) |

Liên quan: đây là một trong **ba ngoại lệ** của quyết định D3 "không có khu vực riêng tư" —
xem [overview.md](../../overview.md) mục 3. Ngoại lệ này là **giấu tạm thời có mục đích**,
và nó tự mở khoá.
