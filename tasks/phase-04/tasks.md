# Phase 4 — Danh sách task

Bối cảnh và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.
Đặc tả: [p4-expenses.md](../../docs/features/p4-expenses.md) ·
[p4-goals.md](../../docs/features/p4-goals.md)

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

> ✅ **D6 đã chốt: không ghi nợ nhau.** Không có task nào cho số dư, tất toán, hay cách chia
> — xem [p4-expenses.md](../../docs/features/p4-expenses.md) mục 1. Nếu thấy mình đang viết
> code tính "ai nợ ai", dừng lại: đó là thứ đã bỏ có chủ đích.

## A. Database — chi tiêu → [steps/a-database.md](steps/a-database.md)

- [ ] **P4-01** Migration `expenses` — [database-schema.md](../../docs/design/backend/database-schema.md) mục 9
- [ ] **P4-02** Kiểm lại: `amount_minor` là **`bigint`**, không phải số thực. `paid_by` chỉ để thống kê
- [ ] **P4-03** Khoá ngoại `post_id` (tuỳ chọn) nối với bài Timeline
- [ ] **P4-04** Bật RLS, kiểm chứng bằng tài khoản thứ ba

## B. Database — mục tiêu → [steps/a-database.md](steps/a-database.md)

- [ ] **P4-05** Migration `goals` với cột `kind` (`checklist` / `count` / `amount`)
- [ ] **P4-06** Migration `goal_steps` (bước con, có `sort_order`)
- [ ] **P4-07** Migration `goal_contributions` cho kiểu `amount` — ai nạp bao nhiêu vào quỹ chung
- [ ] **P4-08** Bật RLS cho cả ba bảng

## C. Ghi chi tiêu → [steps/b-expense-entry.md](steps/b-expense-entry.md)

- [ ] **P4-09** Mở tab **Chi tiêu** trong tab bar (đang ẩn)
- [ ] **P4-10** Form thêm chi tiêu: số tiền · nội dung · danh mục · ngày · ai trả — **hết, không có phần chia**
- [ ] **P4-11** Bàn phím số + định dạng tiền khi gõ (`180.000 đ`)
- [ ] **P4-12** Bộ danh mục cố định (7 loại), một chạm chọn
- [ ] **P4-13** Nối vào form soạn bài Timeline: mục "💰 Thêm chi phí" sinh thẳng một khoản chi
- [ ] **P4-14** Đoán sẵn danh mục theo hoạt động của bài (🍜 → ăn uống)
- [ ] **P4-15** Hàng đợi đồng bộ khi mất mạng — dùng lại cơ chế của Phase 2

## D. Xem chi tiêu → [steps/c-expense-view.md](steps/c-expense-view.md)

- [ ] **P4-16** Màn hình theo tháng, chuyển tháng bằng ◀ ▶
- [ ] **P4-17** Khối tổng: tổng chi · mỗi người trả bao nhiêu · trung bình mỗi buổi hẹn
- [ ] **P4-18** Biểu đồ tròn theo danh mục + chú thích (conic-gradient, không cần thư viện)
- [ ] **P4-19** Danh sách khoản chi; khoản sinh từ kỉ niệm có icon 📷, chạm mở bài đó
- [ ] **P4-20** **Dải nhận xét** sinh từ dữ liệu: *"tháng này đi ăn 12 lần — nhiều hơn tháng trước 4"*
- [ ] **P4-21** Loại khoản bất thường khỏi "trung bình mỗi buổi hẹn" (vượt 10 lần trung vị)
- [ ] **P4-22** Sửa / xoá khoản chi — **không có số dư nào phải tính lại**
- [ ] **P4-23** Xoá bài Timeline có gắn chi phí → hỏi rõ, mặc định **giữ** khoản chi

## E. Mục tiêu → [steps/d-goals.md](steps/d-goals.md)

- [ ] **P4-24** Tab con Mục tiêu trong Kế hoạch
- [ ] **P4-25** Thêm nhanh: **một ô nhập, chỉ cần tên**. Mặc định kiểu `checklist`
- [ ] **P4-26** Thẻ mục tiêu: tên · thanh tiến độ · `8/10 bước` · hạn nếu có
- [ ] **P4-27** Chi tiết: danh sách bước con, tích từng bước, tiến độ tự cập nhật
- [ ] **P4-28** Kiểu `count` (9/22 phim) và kiểu `amount` (quỹ chung)
- [ ] **P4-29** Ghi nạp quỹ chung — **ghi tay**, không tự lấy từ chi tiêu
- [ ] **P4-30** Mục "Đã hoàn thành" gập lại ở cuối
- [ ] **P4-31** **Quá hạn thì im lặng**: chỉ chuyển xuống cuối, chữ nhạt. Không nhắc, không đổi màu đỏ

## F. Vòng lặp khép kín → [steps/e-loop.md](steps/e-loop.md)

- [ ] **P4-32** Tích bước cuối → màn hình chúc mừng + **[Đăng lên kỉ niệm]** / **[Để sau]**
- [ ] **P4-33** [Đăng lên kỉ niệm] nhảy vào flow soạn bài với caption điền sẵn
- [ ] **P4-34** Bỏ tích sau khi đã sinh bài → mục tiêu quay lại "đang làm", **bài giữ nguyên**
- [ ] **P4-35** Nối gợi ý hành động của [sự kiện](../../docs/features/p3-events-reminders.md): *"đặt bàn chưa?"* → tạo nhanh mục tiêu

## G. Home → [steps/f-home.md](steps/f-home.md)

- [ ] **P4-36** Khối "THÁNG NÀY": số buổi hẹn + tổng chi
- [ ] **P4-37** Khối "MỤC TIÊU": mục tiêu đang dở + thanh tiến độ
- [ ] **P4-38** Home giờ đã đủ mọi khối — rà lại thứ tự và khoảng cách một lượt
