# A. Database — P3-01 → P3-04

Đặc tả: [p3-events-reminders.md](../../../docs/features/p3-events-reminders.md).

Ba bảng, trong đó **bảng thứ ba (P3-03) là bảng hay bị quên nhất** và là nguyên nhân của
lỗi "nhận cùng một thông báo ba lần".

---

## P3-01 · Migration `events`

**Mục tiêu:** có chỗ lưu sự kiện do người dùng tạo.

**Các bước**

1. Migration mới, chép SQL ở
   [database-schema.md](../../../docs/design/backend/database-schema.md) **mục 8**.

2. Kiểm lại các cột dễ làm sai:

   | Cột | Phải là | Vì sao |
   |---|---|---|
   | `event_date` | **`date`** | Ngày lịch, không có giờ. Cùng lý do với ngày bắt đầu yêu. |
   | `repeat_kind` | `once` / `yearly` / `monthly` | Ba giá trị, `check` constraint |
   | `created_by` | có | Chỉ để hiển thị "ai tạo", không dùng phân quyền |

3. **Không** có cột `is_system`. Mốc hệ thống **không nằm trong bảng này** — chúng được
   *tính ra* ở [b-milestones.md](b-milestones.md). Nhét chúng vào bảng là sai hướng và
   sẽ gây rắc rối khi ngày bắt đầu yêu đổi.

4. `npx supabase db push`

**Xong khi:** chèn tay một sự kiện, đọc ra đúng.

**Bẫy**
- Dùng `timestamptz` cho `event_date` là lỗi kinh điển: sinh nhật 24/09 ở Việt Nam sẽ
  thành 23/09 với người ở múi giờ âm.

---

## P3-02 · Migration `event_reminders`

**Mục tiêu:** một sự kiện có **nhiều** mốc nhắc (3 ngày *và* 7 ngày).

**Các bước**

1. Bảng riêng, không phải mảng trong `events`:
   ```sql
   create table public.event_reminders (
     id         uuid primary key default gen_random_uuid(),
     event_id   uuid not null references public.events(id) on delete cascade,
     days_before int not null check (days_before in (0, 1, 3, 7, 30)),
     created_at timestamptz not null default now(),
     unique (event_id, days_before)
   );
   ```
   `days_before = 0` nghĩa là nhắc đúng hôm diễn ra.

2. Bảng riêng vì query gửi nhắc cần **join và lọc theo `days_before`** — với mảng thì
   câu query đó khó viết và không dùng được index.

3. Bảng tắt nhắc **riêng cho từng người**:
   ```sql
   create table public.reminder_mutes (
     user_id  uuid not null references public.profiles(id) on delete cascade,
     event_id uuid references public.events(id) on delete cascade,
     milestone_key text,          -- cho mốc hệ thống, ví dụ 'day_500'
     primary key (user_id, coalesce(event_id::text, milestone_key))
   );
   ```
   Một người tắt nhắc không ảnh hưởng người kia — đây là thứ duy nhất trong tính năng này
   thuộc về cá nhân.

**Xong khi:** một sự kiện có 2 mốc nhắc; thêm mốc trùng thì bị chặn bởi `unique`.

---

## P3-03 · Bảng "đã gửi" — chống gửi trùng

> **Đây là task quan trọng nhất nhóm A**, và là thứ dễ bỏ qua nhất vì lúc test tay không
> thấy vấn đề gì.

**Mục tiêu:** cron chạy lại bao nhiêu lần cũng chỉ gửi **một** thông báo.

**Vì sao cần**

Cron chạy mỗi giờ. Không có bảng này thì:
- 9:00 chạy → gửi
- 10:00 chạy → điều kiện "còn 7 ngày" **vẫn đúng** → gửi lại
- 11:00 → gửi lại…

Người dùng nhận cùng một nhắc **cả chục lần trong ngày**, rồi tắt hết thông báo — và mất
luôn mọi thông báo khác.

**Các bước**

1. ```sql
   create table public.reminder_sends (
     id          uuid primary key default gen_random_uuid(),
     user_id     uuid not null references public.profiles(id) on delete cascade,
     ref_key     text not null,   -- 'event:<uuid>:7' hoặc 'milestone:day_500:3'
     sent_for    date not null,   -- ngày sự kiện, không phải ngày gửi
     sent_at     timestamptz not null default now(),
     unique (user_id, ref_key, sent_for)
   );
   ```

2. **Ràng buộc `unique` là thứ chống trùng thật sự**, không phải một câu `if` trong code.
   Hàm gửi dùng `insert ... on conflict do nothing` và **chỉ gửi khi insert thành công**.

3. `sent_for` là **ngày diễn ra sự kiện**, không phải ngày gửi. Nhờ vậy sự kiện `yearly`
   năm sau vẫn gửi được vì đó là `sent_for` khác.

4. Dọn bản ghi cũ hơn 1 năm bằng một cron hằng tháng.

**Xong khi:** gọi tay hàm gửi nhắc **ba lần liên tiếp** → chỉ có **một** thông báo tới máy.

**Bẫy**
- Đừng chống trùng bằng cách "chỉ chạy cron một lần mỗi ngày". Cron có thể chạy lại sau
  lỗi, và bạn cũng sẽ muốn chạy tay lúc debug.

---

## P3-04 · Bật RLS

**Mục tiêu:** không lộ sự kiện của cặp đôi khác.

**Các bước**

1. Bật RLS cho `events`, `event_reminders`, `reminder_mutes`, `reminder_sends`.

2. Policy theo đúng khuôn mẫu đã dùng từ Phase 1:
   - `events`: đọc `is_member_of(couple_id)`, ghi `can_write_to(couple_id)`
   - `event_reminders`: đi qua `event_id` → `events.couple_id`
   - `reminder_mutes`, `reminder_sends`: **của riêng từng người** — `user_id = auth.uid()`

3. Kiểm chứng bằng tài khoản thứ ba: đọc `events` → **mảng rỗng**.

4. Edge Function gửi nhắc chạy bằng `service_role` nên **bỏ qua RLS** — đó là đúng, nhưng
   nghĩa là mọi phép lọc "gửi cho ai" phải nằm rõ ràng trong câu query của function, không
   dựa vào RLS.

**Xong khi:** tài khoản ngoài space không đọc được gì; và điểm 4 đã được ghi nhớ khi viết
[d-reminders.md](d-reminders.md).

**Bẫy**
- `reminder_sends` mà để `is_member_of` thì người kia thấy được bạn đã nhận thông báo nào.
  Vô hại, nhưng không cần thiết — cứ để riêng tư.
