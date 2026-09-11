# Phase 3 — Hướng dẫn từng bước

Mỗi file tương ứng một nhóm trong [../tasks.md](../tasks.md). Khuôn giống Phase 1–2:
**Mục tiêu** → **Các bước** → **Xong khi** → **Bẫy**.

| File | Nhóm | Task |
|---|---|---|
| [a-database.md](a-database.md) | Database | P3-01 → P3-04 |
| [b-milestones.md](b-milestones.md) | Mốc hệ thống | P3-05 → P3-08 |
| [c-plan-ui.md](c-plan-ui.md) | Giao diện Kế hoạch | P3-09 → P3-14 |
| [d-reminders.md](d-reminders.md) | Gửi nhắc | P3-15 → P3-21 |
| [e-home.md](e-home.md) | Home + Cài đặt | P3-22 → P3-24 |
| [f-time-tests.md](f-time-tests.md) | Kiểm thử thời gian | P3-25 → P3-28 |

> ⚠️ **Viết trước khi Phase 1–2 có code thật.** Tên file và cấu trúc thư mục ở đây là **dự
> kiến** theo quy ước đã đặt ở [Phase 1](../../phase-01/steps/a-setup.md). Khi bắt tay vào
> Phase 3, nếu code thật khác — **tin code thật**, rồi sửa lại file này.

## Điều khác biệt lớn nhất của phase này

Phase 1–2 làm việc với thứ người dùng **bấm**. Phase 3 làm việc với thứ xảy ra khi
**không ai bấm gì** — server tự thức dậy và gửi thông báo.

Ba hệ quả:

1. **Không nhìn màn hình mà biết đúng hay sai.** Phải để máy qua đêm rồi kiểm.
2. **Lỗi lặp lại được rất tốn thời gian.** Sai một lần là chờ tới hôm sau mới thử lại —
   nên phải có cách chạy tay hàm gửi nhắc để test ngay.
3. **Ngày tháng là nguồn bug chính**, và chúng chỉ lộ ra sau nhiều tháng. Đó là lý do
   nhóm F tồn tại và không được bỏ.
