# B. Mốc hệ thống — P3-05 → P3-08

Đặc tả: [p1-day-counter.md](../../../docs/features/p1-day-counter.md) mục 2 ·
[p3-events-reminders.md](../../../docs/features/p3-events-reminders.md) mục 2.

> **Nguyên tắc chi phối cả nhóm:** mốc hệ thống **không phải bản ghi, nó là phép tính.**
> Không lưu vào bảng `events`. Ngày bắt đầu yêu đổi thì mọi mốc tự đổi theo, không phải
> đi sửa dữ liệu.

---

## P3-05 · Hàm sinh mốc

**Mục tiêu:** từ một ngày bắt đầu yêu, sinh ra danh sách mốc sắp tới.

**Các bước**

1. Viết hàm SQL `upcoming_milestones(couple_id, limit)` — khung đã có sẵn ở
   [database-schema.md](../../../docs/design/backend/database-schema.md) mục 10.

2. Ba nguồn mốc, gộp lại rồi sắp theo ngày:

   | Loại | Cách tính | Ví dụ |
   |---|---|---|
   | Trăm ngày | `start_date + n` với n ∈ {100, 200, 300, 365, 500, 1000, 1095, 1825, 3650…} | ngày thứ 500 |
   | Tròn tháng | `start_date + interval 'n months'` | tròn 30 tháng |
   | Tròn năm | `start_date + interval 'n years'` | kỉ niệm 2 năm |

3. Mỗi mốc trả về: `key` (ổn định, ví dụ `day_500`, `year_2`), nhãn tiếng Việt,
   ngày, số ngày còn lại.

   **`key` phải ổn định** — nó là thứ dùng trong `reminder_sends` và `reminder_mutes`.
   Đổi cách đặt key sau này sẽ làm mọi bản ghi tắt nhắc mất tác dụng.

4. Chỉ trả về mốc **trong tương lai**, và giới hạn số lượng.

**Xong khi:** gọi hàm với một ngày bắt đầu yêu thật, ra danh sách mốc hợp lý, không trùng,
sắp đúng thứ tự.

**Bẫy**
- Tròn năm thứ 1 và mốc 365 ngày **rơi gần nhau nhưng không trùng** (năm nhuận). Giữ cả
  hai thì người dùng nhận hai thông báo cách nhau một ngày — khử bằng cách: nếu hai mốc
  cách nhau ≤ 2 ngày thì chỉ giữ mốc **tròn năm**.

---

## P3-06 · Ca biên ngày — viết test trước

**Mục tiêu:** không lệch ngày ở các trường hợp lịch khó.

**Các bước**

1. **Viết test trước khi viết hàm.** Đây là logic thuần, test được, và sai thì rất khó
   phát hiện muộn — cùng cách đã làm với hàm đếm ngày ở
   [Phase 1](../../phase-01/steps/f-home.md).

2. Bảng ca biên phải xanh hết:

   | Ngày bắt đầu | Ca | Kết quả đúng |
   |---|---|---|
   | 29/02/2024 | tròn 1 năm, 2025 không nhuận | **28/02/2025** |
   | 29/02/2024 | tròn 4 năm, 2028 nhuận | 29/02/2028 |
   | 31/01/2026 | tròn 1 tháng, tháng 2 có 28 ngày | **28/02/2026** |
   | 31/03/2026 | tròn 1 tháng, tháng 4 có 30 ngày | **30/04/2026** |
   | 15/03/2024 | mốc 365 và tròn 1 năm | Chỉ giữ **tròn 1 năm** |

3. PostgreSQL `+ interval '1 month'` **đã tự xử lý đúng** ngày cuối tháng. Đừng tự tính
   tay bằng cách cộng 30 ngày.

**Xong khi:** toàn bộ bảng trên xanh.

**Bẫy**
- Đừng test bằng `current_date`. Truyền ngày cố định vào hàm, nếu không test sẽ xanh hôm
  nay và đỏ vào 29/2 năm sau.

---

## P3-07 · Trộn hai nguồn thành một danh sách

**Mục tiêu:** người dùng thấy **một** danh sách sắp theo thời gian, không quan tâm mốc nào
là hệ thống.

**Các bước**

1. Một view hoặc RPC gộp:
   - sự kiện từ bảng `events` (đã tính ra lần xảy ra tiếp theo với `yearly`/`monthly`)
   - mốc từ `upcoming_milestones()`

2. Chuẩn hoá về cùng một hình dạng: `key` · nhãn · ngày · số ngày còn lại · `is_system` ·
   `is_muted` (theo người đang gọi).

3. **Tính lần xảy ra tiếp theo** cho sự kiện lặp — đây là phần dễ sai:
   - `yearly`: nếu ngày năm nay đã qua → lấy năm sau
   - `monthly`: tương tự theo tháng
   - `once`: giữ nguyên, quá rồi thì xếp vào "Đã qua"

4. Sắp tăng dần theo số ngày còn lại.

**Xong khi:** danh sách trộn hiển thị đúng, sinh nhật đã qua trong năm nay hiện là năm sau.

---

## P3-08 · Tắt nhắc mốc hệ thống

**Mục tiêu:** xoá thì không, nhưng im lặng thì được.

**Các bước**

1. Giao diện: mốc hệ thống có nhãn "hệ thống", **không có nút xoá**, có công tắc 🔔.

2. Tắt → ghi một dòng vào `reminder_mutes` với `milestone_key`.

3. Giải thích ngắn khi người dùng thử xoá:
   > *"Mốc này tính từ ngày bắt đầu yêu nên không xoá được — nhưng tắt nhắc thì được."*

4. Mặc định theo đặc tả:
   - Trăm ngày, tròn năm → **bật** nhắc (trước 3 ngày)
   - **Tròn tháng → tắt** nhắc, chỉ hiện trong danh sách

**Xong khi:** tắt nhắc một mốc trên máy A → máy A không nhận thông báo mốc đó, **máy B vẫn
nhận**.

**Bẫy**
- Nếu tròn tháng mặc định bật nhắc thì người dùng nhận thông báo mỗi tháng. Sau ba tháng
  họ tắt hết thông báo của app. Đây là chỗ "nhiều hơn" làm hỏng tính năng.
