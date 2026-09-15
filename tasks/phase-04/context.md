# Phase 4 — Cùng nhau

> **Mục tiêu:** khác biệt so với app cùng loại — chi tiêu chung và mục tiêu chung.

**Trạng thái:** 🔲 Chưa bắt đầu (chờ Phase 3 xong)
**Task:** [tasks.md](tasks.md) · **Hướng dẫn từng bước:** [steps/](steps/)

## 1. Định nghĩa hoàn thành (DoD)

- [ ] Ghi một khoản chi **dưới 15 giây**, form chỉ có 4 trường
- [ ] Đăng kỉ niệm kèm chi phí → khoản chi tự xuất hiện bên Chi tiêu, có icon 📷
- [ ] Màn hình tháng hiện đúng tổng, biểu đồ danh mục, và **dải nhận xét** sinh từ dữ liệu
- [ ] Sửa một khoản chi cũ → **không có gì phải tính lại**, không có số dư nào sai
- [ ] Tạo mục tiêu bằng **một ô nhập**, thêm bước con, tích tới bước cuối
- [ ] Tích bước cuối → hỏi "Đăng lên kỉ niệm?" → vào thẳng flow đăng bài, caption điền sẵn
- [ ] Mục tiêu quá hạn **không nhắc, không đỏ** — chỉ trôi xuống cuối
- [ ] Tìm khắp app: **không còn chữ "nợ" nào**

## 2. Phạm vi

| Tính năng | Đặc tả |
|---|---|
| Chi tiêu chung | [expenses.md](../../docs/features/p4-expenses.md) |
| Mục tiêu chung | [goals.md](../../docs/features/p4-goals.md) |
| Home: khối "Tháng này" + "Mục tiêu" | [home-dashboard.md](../../docs/features/p1-home-dashboard.md) |

> ✅ **Đã chốt (D6): app KHÔNG ghi nợ nhau.** Không số dư, không nút "đã thanh toán",
> không chia đôi / bao trọn. Quyết định này xoá luôn phần khó nhất của phase —
> xem [p4-expenses.md](../../docs/features/p4-expenses.md) mục 1.

Còn lại là chi tiêu thuần: ghi lại đã tiêu gì, ai trả, để thống kê và nhìn lại.

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
| 2026-09-11 | Chốt **D6: không ghi nợ nhau** — gỡ số dư, tất toán, cách chia khỏi đặc tả, schema và prototype. Viết đặc tả đầy đủ cho `p4-expenses.md` và `p4-goals.md` | Phase 4 đã có đặc tả, chưa chia task | Chờ Phase 3 đạt DoD |
| 2026-09-11 | Phase 4: migration `expenses`/`goals`/`goal_steps`/`goal_contributions` + RLS + hàm `expense_summary` (loại khoản bất thường khỏi trung bình). Frontend: tab Chi tiêu theo tháng + biểu đồ tròn conic-gradient, form ghi khoản có bàn phím số, Kế hoạch tách 2 tab con Sự kiện/Mục tiêu, mục tiêu 3 kiểu checklist/count/amount, màn chúc mừng nối sang soạn bài, khối Tháng này + Mục tiêu trên Home | Build/lint/test sạch, đã xem ảnh chụp. Chưa `db push` | P4-20 dải nhận xét · P4-22/23 sửa-xoá khoản chi · P4-35 gợi ý từ sự kiện |
| 2026-09-15 | Mục tiêu: vuốt trái hiện Xoá → ConfirmSheet (soft `deleted_at`); đưa nhãn tiến độ xuống cùng hàng với hạn để title rõ hơn | Chờ thử trên máy | Xoá các mục tiêu trùng bằng vuốt |
