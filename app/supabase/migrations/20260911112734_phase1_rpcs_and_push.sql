-- Phase 1: invited_name, auth helper fixes, RPCs, push tables, invite rate limit

alter table public.couples
  add column if not exists invited_name text;

create table if not exists public.invite_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now()
);

create index if not exists invite_attempts_user_hour
  on public.invite_attempts (user_id, created_at);

alter table public.invite_attempts enable row level security;

drop policy if exists invite_attempts_own on public.invite_attempts;
create policy invite_attempts_own on public.invite_attempts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subs_own on public.push_subscriptions;
create policy push_subs_own on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  partner_joined boolean not null default true,
  new_post boolean not null default true,
  comments boolean not null default true,
  reactions boolean not null default true,
  event_reminders boolean not null default true,
  quiet_hours_from time,
  quiet_hours_to time,
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists prefs_own on public.notification_prefs;
create policy prefs_own on public.notification_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.is_member_of(p_couple_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.couple_members m
    join public.couples c on c.id = m.couple_id
    where m.couple_id = p_couple_id
      and m.user_id = auth.uid()
      and (
        m.left_at is null
        or c.status = 'archived'
      )
  );
$$;

create or replace function public.my_couple_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select m.couple_id
  from public.couple_members m
  join public.couples c on c.id = m.couple_id
  where m.user_id = auth.uid()
    and m.left_at is null
    and c.deleted_at is null
  limit 1;
$$;

drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples for update
  using (public.can_write_to(id)) with check (public.can_write_to(id));

create or replace function public.generate_invite_code()
returns text
language plpgsql as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.create_couple(
  p_start_date date,
  p_my_nickname text,
  p_partner_nickname text,
  p_theme text default 'rose'
)
returns table (couple_id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_couple_id uuid;
  v_code text;
  v_tries int := 0;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  if p_start_date > current_date then
    raise exception 'Ngày bắt đầu không được ở tương lai';
  end if;

  if length(trim(p_my_nickname)) = 0 or length(trim(p_partner_nickname)) = 0 then
    raise exception 'Cần biệt danh của bạn và tên gọi người ấy';
  end if;

  if exists (
    select 1 from couple_members
    where user_id = auth.uid() and left_at is null
  ) then
    raise exception 'Bạn đã ở trong một không gian khác';
  end if;

  insert into couples (start_date, theme, status, created_by, invited_name)
  values (
    p_start_date,
    coalesce(nullif(p_theme, ''), 'rose'),
    'pending',
    auth.uid(),
    trim(p_partner_nickname)
  )
  returning id into v_couple_id;

  insert into couple_members (couple_id, user_id, nickname)
  values (v_couple_id, auth.uid(), trim(p_my_nickname));

  loop
    v_code := public.generate_invite_code();
    exit when not exists (select 1 from invites where code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then
      raise exception 'Không sinh được mã mời';
    end if;
  end loop;

  insert into invites (couple_id, code, created_by)
  values (v_couple_id, v_code, auth.uid());

  update profiles
  set display_name = trim(p_my_nickname)
  where id = auth.uid();

  return query select v_couple_id, v_code;
end;
$$;

create or replace function public.peek_invite(p_code text)
returns table (inviter_name text, inviter_avatar text, start_date date, couple_id uuid)
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is not null then
    select count(*) into v_count
    from public.invite_attempts a
    where a.user_id = v_uid and a.created_at > now() - interval '1 hour';

    if v_count >= 10 then
      raise exception 'Thử quá nhiều lần. Đợi một giờ rồi thử lại.';
    end if;

    insert into public.invite_attempts (user_id, code)
    values (v_uid, upper(trim(p_code)));
  end if;

  return query
  select
    coalesce(m.nickname, p.display_name) as inviter_name,
    p.avatar_url as inviter_avatar,
    c.start_date,
    c.id as couple_id
  from invites i
  join couples c on c.id = i.couple_id
  join profiles p on p.id = i.created_by
  left join couple_members m
    on m.couple_id = c.id and m.user_id = i.created_by and m.left_at is null
  where i.code = upper(trim(p_code))
    and i.used_at is null
    and i.expires_at > now()
    and c.deleted_at is null
    and c.status in ('pending', 'active');
end;
$$;

create or replace function public.redeem_invite(p_code text, p_my_nickname text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_count int;
  v_attempts int;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  if length(trim(p_my_nickname)) = 0 then
    raise exception 'Cần biệt danh của bạn';
  end if;

  select count(*) into v_attempts
  from public.invite_attempts a
  where a.user_id = auth.uid() and a.created_at > now() - interval '1 hour';

  if v_attempts >= 10 then
    raise exception 'Thử quá nhiều lần. Đợi một giờ rồi thử lại.';
  end if;

  insert into public.invite_attempts (user_id, code)
  values (auth.uid(), upper(trim(p_code)));

  select * into v_invite from invites
  where code = upper(trim(p_code))
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Mã mời không đúng hoặc đã hết hạn';
  end if;

  if v_invite.created_by = auth.uid() then
    raise exception 'Đây là mã của chính bạn';
  end if;

  if exists (
    select 1 from couple_members
    where user_id = auth.uid() and left_at is null
  ) then
    raise exception 'Bạn đã ở trong một không gian khác';
  end if;

  select count(*) into v_count from couple_members
  where couple_id = v_invite.couple_id and left_at is null;

  if v_count >= 2 then
    raise exception 'Không gian này đã đủ hai người rồi';
  end if;

  insert into couple_members (couple_id, user_id, nickname)
  values (v_invite.couple_id, auth.uid(), trim(p_my_nickname));

  update invites
  set used_at = now(), used_by = auth.uid()
  where id = v_invite.id;

  update couples
  set status = 'active'
  where id = v_invite.couple_id;

  update profiles
  set display_name = trim(p_my_nickname)
  where id = auth.uid();

  return v_invite.couple_id;
end;
$$;

create or replace function public.regenerate_invite(p_couple_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_tries int := 0;
begin
  if not public.can_write_to(p_couple_id) then
    raise exception 'Không có quyền';
  end if;

  update invites
  set expires_at = now()
  where couple_id = p_couple_id and used_at is null;

  loop
    v_code := public.generate_invite_code();
    exit when not exists (select 1 from invites where code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then
      raise exception 'Không sinh được mã mời';
    end if;
  end loop;

  insert into invites (couple_id, code, created_by)
  values (p_couple_id, v_code, auth.uid());

  return v_code;
end;
$$;

create or replace function public.unpair(p_couple_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if auth.uid() is null or not exists (
    select 1 from couple_members
    where couple_id = p_couple_id and user_id = auth.uid() and left_at is null
  ) then
    raise exception 'Không có quyền';
  end if;

  select count(*) into v_count
  from couple_members
  where couple_id = p_couple_id and left_at is null;

  if v_count < 2 then
    delete from couples where id = p_couple_id;
    return;
  end if;

  update couples
  set status = 'archived', archived_at = now()
  where id = p_couple_id;

  update couple_members
  set left_at = now()
  where couple_id = p_couple_id and left_at is null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.notification_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.notification_prefs (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

grant execute on function public.create_couple(date, text, text, text) to authenticated;
grant execute on function public.peek_invite(text) to authenticated;
grant execute on function public.redeem_invite(text, text) to authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;
grant execute on function public.unpair(uuid) to authenticated;
grant execute on function public.generate_invite_code() to authenticated;
grant execute on function public.my_couple_id() to authenticated;
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.can_write_to(uuid) to authenticated;
