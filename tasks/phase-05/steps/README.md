# Phase 5 — Hướng dẫn từng bước

Mỗi file tương ứng một nhóm trong [../tasks.md](../tasks.md).

| File | Nhóm | Task |
|---|---|---|
| [a-daily-question.md](a-daily-question.md) | Câu hỏi mỗi ngày | P5-01 → P5-12 |
| [b-future-letter.md](b-future-letter.md) | Thư gửi tương lai | P5-13 → P5-21 |
| [c-mood.md](c-mood.md) | Check-in tâm trạng | P5-22 → P5-28 |
| [d-nudge.md](d-nudge.md) | Nhắc nhẹ | P5-29 → P5-34 |
| [e-eat-tonight-b.md](e-eat-tonight-b.md) | "Ăn gì" phần B | P5-35 → P5-42 |

> ⚠️ **Viết trước khi có code thật.** Tên file là dự kiến — tin code thật rồi sửa lại file này.

## ⚠️ Điều phải đọc trước khi bắt đầu

> ### Hai tính năng đầu có RLS **là** tính năng, không phải lớp bảo vệ.

| Tính năng | Nếu RLS sai |
|---|---|
| [Câu hỏi mỗi ngày](a-daily-question.md) | Đọc được câu trả lời của người kia mà chưa cần trả lời → **toàn bộ cơ chế vô nghĩa** |
| [Thư gửi tương lai](b-future-letter.md) | Đọc được thư trước ngày mở → **không còn gì để mong** |

Khác với mọi phase trước: ở đây, làm đúng ở tầng giao diện thì tính năng **vẫn trông đúng**
nhưng đã hỏng. Màn hình che, nút khoá, chữ mờ — tất cả đều là trang trí nếu API vẫn trả dữ liệu.

**Cách kiểm duy nhất chấp nhận được:** gọi thẳng API bằng token của người chưa đủ điều kiện,
xem nó trả về gì. Không phải nhìn màn hình.

```powershell
curl "https://<project>.supabase.co/rest/v1/question_answers?select=*" `
  -H "apikey: <anon>" -H "Authorization: Bearer <token cua nguoi CHUA tra loi>"
```

Kết quả đúng: **không có** câu trả lời của người kia trong đó.

## Ba tính năng còn lại thì nhẹ

Tâm trạng, nudge và "Ăn gì phần B" đều dùng lại hạ tầng đã có (realtime từ Phase 2, push từ
Phase 1, bảng chi tiêu từ Phase 4). Phần khó của chúng là **giữ đúng giọng sản phẩm**, không
phải kỹ thuật — đặc biệt là streak ở [c-mood.md](c-mood.md).
