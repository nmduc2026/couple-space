-- ============================================================
-- PHẦN 2: KHÔNG GIAN ĐÔI
-- ============================================================

create table public.couples (
  id             uuid primary key default gen_random_uuid(),
  start_date     date not null,          -- ngày bắt đầu yêu. KIỂU date, KHÔNG phải timestamp!
  cover_url      text,
  theme          text not null default 'rose',
  timezone       text not null default 'Asia/Ho_Chi_Minh',
  status         text not null default 'active'
                 check (status in ('pending', 'active', 'archived')),
  -- pending  = mới tạo, chờ người thứ hai
  -- active   = đủ hai người
  -- archived = đã huỷ ghép đôi, chỉ còn đọc
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  archived_at    timestamptz,
  deleted_at     timestamptz
);

create trigger couples_touch
  before update on public.couples
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
-- couple_members: ai thuộc space nào
-- ------------------------------------------------------------
create table public.couple_members (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  nickname   text,                      -- người kia gọi mình là gì trong space này
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  unique (couple_id, user_id)
);

-- Mỗi người chỉ ở trong ĐÚNG MỘT space đang hoạt động
create unique index one_active_couple_per_user
  on public.couple_members (user_id)
  where left_at is null;


-- ------------------------------------------------------------
-- invites: mã mời ghép đôi
-- ------------------------------------------------------------
create table public.invites (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  code       text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz,
  used_by    uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index on public.invites (code) where used_at is null;
