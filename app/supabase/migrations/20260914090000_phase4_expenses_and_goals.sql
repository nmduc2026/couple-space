-- Phase 4 — Chi tiêu chung + Mục tiêu chung
-- Nguồn: docs/design/backend/database-schema.md mục 9, 10
--        docs/features/p4-expenses.md · p4-goals.md

-- ============================================================
-- 1. CHI TIÊU
-- App KHÔNG ghi nợ nhau (quyết định D6). Không có bảng settlements,
-- không có cột "đã thanh toán", không có cách chia. `paid_by` chỉ để
-- thống kê, KHÔNG BAO GIỜ dùng để tính ai phải trả lại ai.
-- ============================================================

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references public.couples(id) on delete cascade,
  post_id       uuid references public.posts(id) on delete set null,
  -- bigint, đơn vị đồng. Không dùng số thực cho tiền.
  amount_minor  bigint not null check (amount_minor > 0),
  currency      char(3) not null default 'VND',
  category      text,
  note          text,
  spent_on      date not null default current_date,
  paid_by       uuid not null references public.profiles(id),

  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists expenses_couple_spent_idx
  on public.expenses (couple_id, spent_on desc) where deleted_at is null;
create index if not exists expenses_post_idx on public.expenses (post_id);

drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch
  before update on public.expenses
  for each row execute function public.touch_updated_at();


-- ============================================================
-- 2. MỤC TIÊU
-- ============================================================

create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  description  text,
  emoji        text,
  -- checklist = tích từng bước · count = đếm tới đích · amount = quỹ chung
  kind         text not null default 'checklist'
               check (kind in ('checklist', 'count', 'amount')),
  target_count int,                -- cho kind = 'count'
  target_minor bigint,             -- cho kind = 'amount'
  current_count int not null default 0,
  due_date     date,
  status       text not null default 'active'
               check (status in ('active', 'done', 'archived')),
  completed_at timestamptz,
  -- bài kỉ niệm sinh ra khi hoàn thành; bỏ tích thì bài vẫn giữ nguyên
  celebrated_post_id uuid references public.posts(id) on delete set null,
  position     int not null default 0,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists goals_couple_status_idx
  on public.goals (couple_id, status, position) where deleted_at is null;

drop trigger if exists goals_touch on public.goals;
create trigger goals_touch
  before update on public.goals
  for each row execute function public.touch_updated_at();


create table if not exists public.goal_steps (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references public.goals(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  title      text not null check (length(trim(title)) > 0),
  is_done    boolean not null default false,
  done_at    timestamptz,
  done_by    uuid references public.profiles(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists goal_steps_goal_idx
  on public.goal_steps (goal_id, sort_order);


-- Quỹ chung: ghi tay, KHÔNG tự lấy từ bảng expenses.
-- Tiêu chung và để dành là hai việc khác nhau.
create table if not exists public.goal_contributions (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid not null references public.goals(id) on delete cascade,
  couple_id      uuid not null references public.couples(id) on delete cascade,
  user_id        uuid not null references public.profiles(id),
  amount_minor   bigint not null check (amount_minor > 0),
  note           text,
  contributed_on date not null default current_date,
  created_at     timestamptz not null default now()
);

create index if not exists goal_contributions_goal_idx
  on public.goal_contributions (goal_id, contributed_on desc);


-- ============================================================
-- 3. RLS
-- ============================================================

alter table public.expenses           enable row level security;
alter table public.goals              enable row level security;
alter table public.goal_steps         enable row level security;
alter table public.goal_contributions enable row level security;

drop policy if exists expenses_read  on public.expenses;
drop policy if exists expenses_write on public.expenses;
create policy expenses_read on public.expenses for select
  using (public.is_member_of(couple_id));
create policy expenses_write on public.expenses for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists goals_read  on public.goals;
drop policy if exists goals_write on public.goals;
create policy goals_read on public.goals for select
  using (public.is_member_of(couple_id));
create policy goals_write on public.goals for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists steps_read  on public.goal_steps;
drop policy if exists steps_write on public.goal_steps;
create policy steps_read on public.goal_steps for select
  using (public.is_member_of(couple_id));
create policy steps_write on public.goal_steps for all
  using (public.can_write_to(couple_id))
  with check (public.can_write_to(couple_id));

drop policy if exists contributions_read  on public.goal_contributions;
drop policy if exists contributions_write on public.goal_contributions;
create policy contributions_read on public.goal_contributions for select
  using (public.is_member_of(couple_id));
create policy contributions_write on public.goal_contributions for all
  using (public.can_write_to(couple_id) and user_id = auth.uid())
  with check (public.can_write_to(couple_id) and user_id = auth.uid());


-- ============================================================
-- 4. THỐNG KÊ THEO THÁNG — tính lúc cần, không lưu
-- Không có số dư nợ nào ở đây. Chỉ tổng chi, ai trả bao nhiêu,
-- và trung bình mỗi buổi hẹn.
-- ============================================================

create or replace function public.expense_summary(
  p_couple_id uuid,
  p_month date  -- ngày bất kỳ trong tháng muốn xem
)
returns table (
  total_minor      bigint,
  outing_count     int,
  avg_outing_minor bigint,
  by_category      jsonb,
  by_payer         jsonb
)
language sql stable security definer set search_path = public as $$
  with scope as (
    select e.*
    from public.expenses e
    where e.couple_id = p_couple_id
      and e.deleted_at is null
      and e.spent_on >= date_trunc('month', p_month)::date
      and e.spent_on <  (date_trunc('month', p_month) + interval '1 month')::date
      and public.is_member_of(p_couple_id)
  ),
  -- Khoản bất thường (vượt 10 lần trung vị) làm lệch "trung bình mỗi buổi
  -- hẹn" — mua vé máy bay không phải một buổi đi ăn. Loại khỏi trung bình,
  -- nhưng VẪN tính vào tổng chi.
  median as (
    select percentile_cont(0.5) within group (order by amount_minor) as m
    from scope
  ),
  typical as (
    select s.* from scope s, median
    where median.m is null or s.amount_minor <= median.m * 10
  )
  select
    coalesce((select sum(amount_minor) from scope), 0)::bigint,
    (select count(*) from scope)::int,
    coalesce((select avg(amount_minor) from typical), 0)::bigint,
    coalesce((
      select jsonb_object_agg(coalesce(category, 'other'), total)
      from (
        select category, sum(amount_minor) as total
        from scope group by category
      ) c
    ), '{}'::jsonb),
    coalesce((
      select jsonb_object_agg(paid_by::text, total)
      from (
        select paid_by, sum(amount_minor) as total
        from scope group by paid_by
      ) p
    ), '{}'::jsonb);
$$;

grant execute on function public.expense_summary(uuid, date) to authenticated;
