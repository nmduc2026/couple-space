# B. Database — P1-06 → P1-10

Nhóm này là phần **khó sửa nhất về sau**. SQL đã viết sẵn ở
[database-schema.md](../../../docs/design/backend/database-schema.md) — việc ở đây chủ yếu
là chạy đúng thứ tự và **kiểm chứng RLS thật sự chặn**, chứ không phải tin là nó chặn.

---

## P1-06 · Supabase CLI + thư mục migration

**Mục tiêu:** mọi thay đổi database đều nằm trong file, commit được, chạy lại được.

**Các bước**

1. Cài CLI: `npm install -D supabase` (cài trong dự án, không cần cài toàn máy).

2. Khởi tạo và nối với project trên cloud:
   ```powershell
   npx supabase init
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```
   `project-ref` là đoạn mã trong URL project Supabase của bạn.

3. Tạo file migration đầu tiên:
   ```powershell
   npx supabase migration new init_foundation
   ```
   File SQL rỗng xuất hiện trong `supabase/migrations/`.

**Xong khi:** có thư mục `supabase/migrations/` trong dự án, và `npx supabase link` không báo lỗi.

**Bẫy**
- **Đừng sửa database bằng tay trong giao diện web Supabase.** Sửa tay thì không ai biết
  đã sửa gì, và máy khác chạy lại sẽ ra schema khác. Mọi thay đổi đi qua file migration.

---

## P1-07 · Migration nền móng + `profiles`

**Mục tiêu:** có bảng người dùng, tự tạo khi ai đó đăng ký.

**Các bước**

1. Chép phần SQL ở [database-schema.md](../../../docs/design/backend/database-schema.md)
   **mục 4** vào file migration vừa tạo.

2. Chạy: `npx supabase db push`

3. Vào Table Editor trên web Supabase, kiểm tra bảng `profiles` đã xuất hiện.

**Xong khi:** đăng ký một tài khoản thử (qua giao diện Auth của Supabase) → một dòng
tự động xuất hiện trong `profiles`.

**Bẫy**
- Bảng `profiles` phải được tạo **tự động bằng trigger** khi có user mới, chứ không phải
  do app tự chèn. App tự chèn thì sẽ có lúc quên, và lúc đó user tồn tại mà không có hồ sơ.

---

## P1-08 · Migration `couples` + `couple_members` + trạng thái space

**Mục tiêu:** có "không gian đôi" — gốc của toàn bộ data model.

**Các bước**

1. Migration mới, chép SQL ở
   [database-schema.md](../../../docs/design/backend/database-schema.md) **mục 5**.

2. Bổ sung cột trạng thái space cho [huỷ ghép đôi](../../../docs/features/p1-breakup.md):
   ```sql
   alter table public.couples
     add column status text not null default 'active'
       check (status in ('active', 'archived', 'deleted'));
   ```
   Làm ngay bây giờ, dù Phase 1 chỉ dùng tới `active` và `archived`.

3. `npx supabase db push`

**Xong khi:** tạo tay một dòng `couples` và hai dòng `couple_members` trỏ vào nó, không lỗi
ràng buộc.

**Bẫy**
- **Không hardcode "user A và user B".** Dù chỉ có 2 người dùng, vẫn phải là bảng
  `couple_members` nhiều dòng. Đây là điều khó gỡ nhất nếu làm sai từ đầu.
- Ngày bắt đầu yêu là kiểu **`date`**, không phải `timestamptz`. Sai chỗ này thì countdown
  lệch 1 ngày và rất khó phát hiện muộn.

---

## P1-09 · Hàm phân quyền

**Mục tiêu:** có hai hàm mà **mọi policy RLS về sau đều dùng**.

**Các bước**

1. Migration mới, chép SQL ở
   [database-schema.md](../../../docs/design/backend/database-schema.md) **mục 6**:
   `is_member_of(couple_id)` và `can_write_to(couple_id)`.

2. Hiểu khác biệt trước khi đi tiếp:

   | Hàm | Trả lời | Dùng cho |
   |---|---|---|
   | `is_member_of` | Tôi có thuộc space này không? | Quyền **đọc** |
   | `can_write_to` | Tôi có thuộc space này, **và space còn `active`** không? | Quyền **ghi** |

   Tách hai hàm chính là cách space `archived` trở thành chỉ đọc mà không phải sửa từng policy.

3. `npx supabase db push`

**Xong khi:** chạy `select public.is_member_of('<id-space-nào-đó>');` trong SQL Editor trả
về `true`/`false` hợp lý.

**Bẫy**
- Hàm phải đặt `security definer` và `set search_path = public` đúng như trong tài liệu —
  thiếu thì policy có thể bị lách.

---

## P1-10 · Bật RLS và kiểm chứng

**Mục tiêu:** chắc chắn **tài khoản ngoài space không đọc được gì**. Đây là task quan trọng
nhất nhóm B.

**Các bước**

1. Migration mới, chép SQL ở
   [database-schema.md](../../../docs/design/backend/database-schema.md) **mục 11**:
   `alter table ... enable row level security` cho **mọi** bảng, kèm policy.

2. `npx supabase db push`

3. **Kiểm chứng thật** — đừng bỏ bước này:
   - Tạo **hai tài khoản** thử: `a@test.com` và `b@test.com`
   - Cho A tạo một space và một dòng dữ liệu bất kỳ
   - Đăng nhập bằng B (**chưa ghép đôi với A**), thử đọc dữ liệu của A
   - Kết quả đúng: B nhận về **mảng rỗng**, không phải lỗi — RLS lọc chứ không chặn

4. Thử tiếp: cho space của A sang `archived`, kiểm tra A **vẫn đọc được** nhưng
   **không ghi được**.

**Xong khi:** cả hai phép thử trên cho đúng kết quả mong đợi.

**Bẫy**
- **Bảng nào quên bật RLS thì công khai với mọi người đăng nhập.** Sau mỗi lần thêm bảng
  mới (kể cả ở phase sau), việc đầu tiên là bật RLS cho nó.
- Nếu tạo `view`, nhớ `security_invoker = true`. Thiếu dòng này thì view chạy bằng quyền
  người tạo và **lộ dữ liệu cặp đôi khác**.
- Đừng kiểm tra RLS bằng SQL Editor trên web — chỗ đó chạy với quyền cao nhất và **luôn**
  thấy hết. Phải thử từ app, bằng tài khoản thật.
