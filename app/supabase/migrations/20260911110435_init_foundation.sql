-- ============================================================
-- PHẦN 1: NỀN MÓNG
-- ============================================================

create extension if not exists pgcrypto;

-- Hàm dùng chung: tự cập nhật updated_at mỗi khi sửa dòng
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ------------------------------------------------------------
-- profiles: hồ sơ người dùng
-- Supabase đã có sẵn bảng auth.users (email, mật khẩu, OTP...).
-- Ta không sửa bảng đó, mà tạo bảng riêng cho thông tin hiển thị.
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  timezone     text not null default 'Asia/Ho_Chi_Minh',  -- để tính ngày kỉ niệm đúng
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Khi có người đăng ký, tự tạo profile tương ứng
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
