# Phase 3 — Nhịp sống

> **Mục tiêu:** có lý do mở app hằng ngày — sự kiện, đếm ngược, nhắc nhở đúng lúc.

**Trạng thái:** 🔲 Chưa bắt đầu (chờ Phase 2 xong)
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

Kiểm trên **hai máy thật**:

- [ ] Tạo một sự kiện, **cả hai máy** đều nhận nhắc đúng ngày đã chọn
- [ ] Mốc ngày yêu tự sinh, hiện đúng trong danh sách, **xoá không được nhưng tắt nhắc được**
- [ ] Đặt sự kiện cho ngày mai, để máy qua đêm → push tới lúc 9:00 sáng
- [ ] Cùng ngày có nhiều dịp → nhận **một** thông báo gộp, không phải nhiều cái
- [ ] Bật giờ yên lặng, đặt nhắc lúc 23:00 → thông báo hoãn tới sáng
- [ ] Test ngày tháng xanh hết: 29/2, ngày 31 ở tháng ngắn, đổi múi giờ

## 2. Phạm vi

| Tính năng | Đặc tả |
|---|---|
| Sự kiện & nhắc nhở | [events-reminders.md](../../docs/features/p3-events-reminders.md) |
| Mốc ngày yêu tự sinh | [day-counter.md](../../docs/features/p1-day-counter.md) mục 2 |
| Home: khối "Sắp tới" | [home-dashboard.md](../../docs/features/p1-home-dashboard.md) |
| Push hằng ngày *"Hôm nay là ngày thứ 386 💕"* (bật/tắt được) | [notifications.md](../../docs/features/p1-notifications.md) |

**KHÔNG có:** widget (PWA trên iOS không hỗ trợ — xem [distribution.md](../../docs/decisions/distribution.md)).
Push hằng ngày là thứ thay thế cho widget, cùng mục đích nhắc nhớ nhưng rẻ hơn nhiều.

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
| 2026-09-11 | Viết đặc tả đầy đủ `p3-events-reminders.md` + dựng 4 màn hình prototype | Đã có đặc tả, chưa chia task | Chờ Phase 2 đạt DoD, rồi chia task và viết `steps/` |
| 2026-09-11 | Phase 3: migration `events`/`reminder_sends`/`milestone_mutes` + cột múi giờ & giờ yên lặng, hàm `upcoming_milestones`/`next_occurrence`/`upcoming_agenda`/`due_reminders`, Edge Function `send-reminders` + job pg_cron mỗi giờ. Frontend: tab Kế hoạch + vòng đếm ngược, màn tạo/sửa dịp, khối Sắp tới trên Home, giờ yên lặng + 5 công tắc nhắc trong Cài đặt. Test ca biên 29/2 và ngày 31 | Build/lint/test sạch (19 test). Chưa `db push`, chưa deploy function, chưa bật pg_cron | P3-21 nhắc số ngày hằng ngày · P3-28 thử push qua đêm trên máy thật |
