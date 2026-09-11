# Phase 2 — Kỉ niệm

> **Mục tiêu:** app có nội dung. Cả hai đăng ảnh vào một dòng thời gian chung, và
> có lý do mở app mỗi ngày ngay cả khi chưa đi chơi.

**Trạng thái:** 🔲 Chưa bắt đầu (chờ Phase 1 xong)
**Ước lượng:** 2–3 tuần
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

- [ ] Đăng một kỉ niệm có ảnh **xong dưới 30 giây**, chỉ cần gõ caption
- [ ] Ảnh **được nén ở client** trước khi upload — kiểm chứng bằng dung lượng thật
- [ ] Đăng khi mất mạng → vào hàng đợi, tự gửi khi có mạng lại
- [ ] Người kia nhận push và thấy bài mới
- [ ] Thả tim / bình luận hiện realtime trên máy kia
- [ ] "Tối nay ăn gì?" bản gọn: thêm quán bằng **một ô nhập** và quay ra kết quả hợp lý

## 2. Phạm vi

### Có trong phase này

| Tính năng | Đặc tả |
|---|---|
| Timeline: đăng, xem, sửa, xoá | [timeline.md](../../docs/features/p2-timeline.md) |
| Thả tim + bình luận realtime | [timeline.md](../../docs/features/p2-timeline.md) mục 5 |
| Ảnh: chọn, nén, upload, hàng đợi offline | [timeline.md](../../docs/features/p2-timeline.md) mục 6 |
| "Tối nay ăn gì?" — **phần A** | [eat-tonight.md](../../docs/features/p2-eat-tonight.md) mục 8 |
| Home: thêm khối "Kỉ niệm gần đây" + thẻ "Ăn gì" | [home-dashboard.md](../../docs/features/p1-home-dashboard.md) |

### KHÔNG có trong phase này

**Video** (phá vỡ mọi tính toán dung lượng) · sticker · xem theo bản đồ · album ·
thống kê số lần ăn và giá trung bình của "Ăn gì" (cần bảng chi tiêu → Phase 5).

## 3. Vì sao chèn "Ăn gì" vào đây

Trái với nguyên tắc "không nhảy phase", nhưng có lý do: phần A rẻ (chỉ một bảng +
danh sách + quay ngẫu nhiên), **không phụ thuộc phase nào sau**, và cho một lý do mở
app hằng ngày thứ hai bên cạnh việc đăng ảnh — đúng lúc cần thêm động lực nhất, ngay
sau khi app vừa dùng được thật.

## 4. Tiến độ

### ✅ Đã xong
*(chưa có)*

### 🔄 Đang làm
*(chưa bắt đầu)*

### 🔲 Chưa làm
Toàn bộ — xem [tasks.md](tasks.md).

## 5. Quyết định đang treo

| # | Câu hỏi | Chặn việc gì | Trạng thái |
|---|---|---|---|
| D7 | Mức nén ảnh: cạnh dài tối đa bao nhiêu px, chất lượng bao nhiêu? | P2-05 | ⏳ Đề xuất: cạnh dài **1920px**, JPEG **~0.8** — [steps/b-post.md](steps/b-post.md) đã viết theo mức này, đặt thành hằng số một chỗ để dễ đổi |
| D8 | Có giữ bản gốc không, hay chỉ giữ bản đã nén? | Chi phí lưu trữ | ⏳ Đề xuất: **chỉ bản nén**, ảnh gốc vẫn nằm trong máy người dùng |

## 6. Nhật ký phiên

| Ngày | Đã làm | Dừng ở đâu | Bước tiếp theo |
|---|---|---|---|
| 2026-09-11 | Viết đặc tả timeline + phạm vi phase | Chưa bắt đầu — chờ Phase 1 | Bắt đầu sau khi Phase 1 đạt DoD |
| 2026-09-11 | Viết 6 file hướng dẫn từng bước trong `steps/` (P2-01 → P2-26) | Tài liệu Phase 2 đã đủ để code | Chờ Phase 1 đạt DoD |
