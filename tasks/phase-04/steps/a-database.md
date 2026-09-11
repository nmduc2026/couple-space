# A. Database — P4-01 → P4-08

Đặc tả: [p4-expenses.md](../../../docs/features/p4-expenses.md) ·
[p4-goals.md](../../../docs/features/p4-goals.md).

Bốn bảng cho chi tiêu, ba bảng cho mục tiêu. Không bảng nào phức tạp — schema đã được
**đơn giản hoá đáng kể** sau khi bỏ ghi nợ.

---

## P4-01 · Migration `expenses`

**Mục tiêu:** có chỗ lưu khoản chi.

**Các bước**

1. Chép SQL ở [database-schema.md](../../../docs/design/backend/database-schema.md) **mục 9**.

2. Các cột:

   | Cột | Kiểu | Ghi chú |
   |---|---|---|
   | `amount_minor` | **`bigint`** | Đơn vị đồng, số nguyên |
   | `title` | `text` | Nội dung |
   | `category` | `text` | 7 giá trị cố định, `check` constraint |
   | `spent_on` | **`date`** | Ngày tiêu, không phải lúc bấm lưu |
   | `paid_by` | `uuid` | **Chỉ để thống kê** |
   | `post_id` | `uuid` null | Bài Timeline gắn kèm, nullable |
   | `deleted_at` | `timestamptz` null | Xoá mềm |

3. ✅ **Xác nhận schema đã sạch:** không còn `split_type`, `partner_share_minor`,
   `debt_minor`, và **không có bảng `settlements`**. Nếu thấy chúng trong file schema thì
   file đó là bản cũ — kiểm lại.

4. `npx supabase db push`

**Xong khi:** chèn tay một khoản chi, đọc ra đúng.

---

## P4-02 · Kiểm tiền và `paid_by`

**Mục tiêu:** không bao giờ lệch tiền, và không dùng nhầm `paid_by`.

**Các bước**

1. `amount_minor` phải là `bigint`. **Không bao giờ `numeric` hay `float`** cho tiền —
   sai số tích luỹ làm lệch mọi thống kê, và lỗi đó không thể sửa ngược.

2. Hiển thị: chia và định dạng ở **tầng giao diện**, database luôn giữ số nguyên.
   `180000` → `"180.000đ"`.

3. Viết một comment ngay trên cột `paid_by` trong migration:
   ```sql
   -- Ai trả. CHỈ dùng để thống kê ("tháng này Minh trả nhiều hơn").
   -- KHÔNG BAO GIỜ dùng để tính ai phải trả lại ai — app không ghi nợ.
   -- Xem docs/features/p4-expenses.md mục 1.
   ```
   Comment này là thứ ngăn một phiên làm việc sau (hoặc một AI khác) tự ý "bổ sung" tính
   năng ghi nợ vì tưởng là còn thiếu.

**Xong khi:** kiểu cột đúng, comment đã ở đó.

---

## P4-03 · Nối với bài Timeline

**Mục tiêu:** một khoản chi biết nó thuộc buổi hẹn nào.

**Các bước**

1. `post_id uuid references public.posts(id) on delete set null`

2. **`set null`, không phải `cascade`.** Xoá bài thì khoản chi **giữ lại**, chỉ gỡ liên kết.
   Tiền đã tiêu là sự thật, không phụ thuộc việc tấm ảnh còn hay mất.

3. Index cho truy vấn ngược (từ bài tìm ra khoản chi): `create index on expenses (post_id);`

**Xong khi:** xoá một bài có gắn chi phí → khoản chi vẫn còn, `post_id` thành `null`.

---

## P4-04 · RLS cho chi tiêu

**Các bước**

1. Bật RLS, policy theo khuôn mẫu: đọc `is_member_of`, ghi `can_write_to`.
2. Kiểm bằng tài khoản thứ ba → mảng rỗng.
3. Kiểm space `archived` → đọc được, ghi không được.

**Xong khi:** cả ba phép thử đúng.

---

## P4-05 · Migration `goals`

**Mục tiêu:** một bảng cho cả ba kiểu mục tiêu.

**Các bước**

1. ```sql
   create table public.goals (
     id         uuid primary key default gen_random_uuid(),
     couple_id  uuid not null references public.couples(id) on delete cascade,
     kind       text not null default 'checklist'
                check (kind in ('checklist', 'count', 'amount')),
     title      text not null check (length(trim(title)) > 0),
     note       text,
     due_on     date,                    -- tuỳ chọn
     target_num int,                     -- cho kind = 'count'
     target_minor bigint,                -- cho kind = 'amount'
     completed_at timestamptz,
     post_id    uuid references public.posts(id) on delete set null,
     created_by uuid not null references public.profiles(id),
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     deleted_at timestamptz
   );
   ```

2. Một bảng, phân biệt bằng `kind` — cùng cách đã dùng cho
   [`eat_items`](../../../docs/features/p2-eat-tonight.md). Đừng tách ba bảng.

3. `post_id` lưu bài Timeline sinh ra khi hoàn thành — dùng ở [e-loop.md](e-loop.md).

**Xong khi:** tạo tay ba mục tiêu với ba `kind` khác nhau.

---

## P4-06 · Migration `goal_steps`

**Các bước**

1. ```sql
   create table public.goal_steps (
     id         uuid primary key default gen_random_uuid(),
     goal_id    uuid not null references public.goals(id) on delete cascade,
     title      text not null,
     sort_order int not null default 0,
     done_at    timestamptz,             -- null = chưa xong
     done_by    uuid references public.profiles(id),
     created_at timestamptz not null default now()
   );
   ```

2. `done_at` là timestamp chứ không phải boolean — biết được **khi nào** xong, dùng cho
   [Wrapped](../../../docs/features/p6-wrapped.md) sau này.

3. `sort_order` để kéo sắp xếp. Đánh số cách quãng (10, 20, 30) để chèn giữa không phải
   đánh lại cả danh sách.

**Xong khi:** thêm 3 bước cho một mục tiêu, đọc ra đúng thứ tự.

---

## P4-07 · Migration `goal_contributions`

**Mục tiêu:** quỹ chung — ai nạp bao nhiêu.

**Các bước**

1. ```sql
   create table public.goal_contributions (
     id         uuid primary key default gen_random_uuid(),
     goal_id    uuid not null references public.goals(id) on delete cascade,
     user_id    uuid not null references public.profiles(id),
     amount_minor bigint not null check (amount_minor > 0),
     noted_on   date not null default current_date,
     note       text,
     created_at timestamptz not null default now()
   );
   ```

2. ⚠️ **Đây là chỗ duy nhất trong app có khái niệm "ai góp bao nhiêu"** — và nó là *góp vào
   một cái chung*, không phải *nợ nhau*. Khác hẳn về mặt cảm giác, và đó là lý do nó không
   mâu thuẫn với D6.

3. **Không** tự lấy số từ bảng `expenses`. Nạp quỹ là hành động riêng, ghi tay — trộn hai
   thứ sẽ làm cả hai con số sai.

**Xong khi:** ghi hai lần nạp cho một mục tiêu, tổng cộng lại đúng.

---

## P4-08 · RLS cho mục tiêu

**Các bước**

1. Bật RLS cho `goals`, `goal_steps`, `goal_contributions`.
2. `goal_steps` và `goal_contributions` đi qua `goal_id` → `goals.couple_id`.
3. **Cả hai người sửa/tích/xoá được của nhau** — space-first. Không giới hạn theo `created_by`.
4. Kiểm bằng tài khoản thứ ba.

**Xong khi:** người B tích được bước con do người A tạo; tài khoản thứ ba không đọc được gì.

**Bẫy**
- Đừng dựa vào `created_by` để phân quyền ở bất kỳ bảng nào trong app này. Nó chỉ để hiển
  thị "ai tạo". Quy tắc này đã áp dụng từ Phase 1 — giữ nhất quán.
