# Phase 4 — Hướng dẫn từng bước

Mỗi file tương ứng một nhóm trong [../tasks.md](../tasks.md).

| File | Nhóm | Task |
|---|---|---|
| [a-database.md](a-database.md) | Database chi tiêu + mục tiêu | P4-01 → P4-08 |
| [b-expense-entry.md](b-expense-entry.md) | Ghi chi tiêu | P4-09 → P4-15 |
| [c-expense-view.md](c-expense-view.md) | Xem chi tiêu | P4-16 → P4-23 |
| [d-goals.md](d-goals.md) | Mục tiêu | P4-24 → P4-31 |
| [e-loop.md](e-loop.md) | Vòng lặp khép kín | P4-32 → P4-35 |
| [f-home.md](f-home.md) | Home | P4-36 → P4-38 |

> ⚠️ **Viết trước khi có code thật.** Tên file ở đây là dự kiến — khi bắt tay vào Phase 4,
> nếu code thật khác thì tin code thật rồi sửa lại file này.

## Một điều phải nhớ suốt phase

> ### App **KHÔNG ghi nợ nhau.**

Không số dư, không nút "đã thanh toán", không chia đôi / bao trọn / theo tỉ lệ.
Đã chốt (**D6**) và đã gỡ khỏi schema. Lý do đầy đủ:
[p4-expenses.md](../../../docs/features/p4-expenses.md) mục 1.

**Nếu thấy mình đang viết code tính "ai nợ ai" — dừng lại.** Đó là thứ đã bỏ có chủ đích,
không phải thứ còn thiếu.

Cột `paid_by` vẫn có, nhưng **chỉ để thống kê** ("tháng này Minh trả nhiều hơn"), không bao
giờ dùng để tính ai phải trả lại ai.

## Vì sao phase này dễ hơn tưởng

Bỏ ghi nợ đi rồi thì Phase 4 chỉ còn là **CRUD + vài câu query thống kê** — không có logic
nghiệp vụ nào thực sự khó. Phần đáng đầu tư công sức nằm ở hai chỗ khác:

1. **Nhập liệu phải nhanh** (nhóm B) — form 4 trường, và khoản chi sinh thẳng từ bài Timeline.
2. **Dải nhận xét** (P4-20) — thứ biến một bảng số thành thông tin đọc được.
