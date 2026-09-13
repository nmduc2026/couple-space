# Phase 5 — Gắn kết

> **Mục tiêu:** giữ chân — những tính năng tạo lý do mở app mỗi ngày, kể cả ngày không có gì đặc biệt.

**Trạng thái:** 🔲 Chưa bắt đầu (chờ Phase 4 xong)
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

Hai dòng đầu là dòng quan trọng nhất — kiểm bằng **gọi API trực tiếp**, không phải nhìn màn hình:

- [ ] 🔒 Chưa trả lời câu hỏi → gọi API bằng token của mình **không lấy được** câu trả lời của người kia
- [ ] 🔒 Thư chưa tới ngày mở → gọi API **không lấy được** nội dung, chỉ có metadata
- [ ] Cả hai trả lời → mở khoá ngay trên cả hai máy
- [ ] Check-in tâm trạng → người kia thấy realtime; mức 😞 thì nhận push
- [ ] Biểu đồ 7 ngày đọc được sự lệch nhau giữa hai người
- [ ] Streak đứt → về 0, **không có thông báo nào**
- [ ] Gửi nudge → máy kia kêu trong vài giây; gửi cái thứ 6 trong ngày thì bị chặn
- [ ] "Ăn gì": đi ăn thật một lần → **số lần ăn và giá trung bình tự cập nhật**, không nhập tay
- [ ] Đánh dấu 😕 một quán → quán đó không còn ra khi quay

## 2. Phạm vi

| Tính năng | Đặc tả |
|---|---|
| Câu hỏi mỗi ngày ⭐ | [daily-question.md](../../docs/features/p5-daily-question.md) |
| Thư gửi tương lai | [future-letter.md](../../docs/features/p5-future-letter.md) |
| Check-in tâm trạng | [mood-checkin.md](../../docs/features/p5-mood-checkin.md) |
| Nhắc nhẹ (Nudge) | [nudge.md](../../docs/features/p5-nudge.md) |
| "Tối nay ăn gì?" — **phần B** (lượt ghé, đánh giá, giá trung bình) | [eat-tonight.md](../../docs/features/p2-eat-tonight.md) mục 8 |

Phần B của "Ăn gì" phải chờ tới đây vì **giá trung bình và số lần ăn chỉ tự tính được
khi đã có bảng chi tiêu** (Phase 4).

## 3. Tiến độ

### ✅ Đã xong
*(chưa có)*

### 🔄 Đang làm
*(chưa bắt đầu)*

### 🔲 Chưa làm
Toàn bộ — xem [tasks.md](tasks.md).

## 4. Quyết định đang treo

*(chưa có — thêm vào đây khi phát sinh)*

## 5. Nhật ký phiên

| Ngày | Đã làm | Dừng ở đâu | Bước tiếp theo |
|---|---|---|---|
| 2026-09-11 | Tạo khung phase | Chưa bắt đầu | Chờ phase trước đạt DoD |
| 2026-09-11 | Viết đặc tả đầy đủ 4 tính năng Phase 5 + dựng 6 màn hình prototype | Đã có đặc tả, chưa chia task | Chờ Phase 4 đạt DoD |
| 2026-09-11 | Phase 5: migration `question_answers`/`letters`/`mood_checkins`/`nudges`/`eat_ratings` + múi giờ của space. RLS có điều kiện: câu trả lời người kia chỉ đọc được sau khi mình trả lời; thư chưa tới `open_on` không trả `body`; nudge giới hạn 5 lần/ngày và cách 10 phút ngay trong policy. Frontend: màn câu hỏi 4 trạng thái (ô mờ là khối giả), thư tương lai, tâm trạng + biểu đồ + streak chung, bảng nudge trượt. 115 câu hỏi tiếng Việt | Build/lint/test sạch. Chưa `db push` | P5-06/P5-16 kiểm chứng RLS bằng API · P5-10/11 bỏ lỡ + sách hỏi đáp · P5-39→42 đánh giá quán |
