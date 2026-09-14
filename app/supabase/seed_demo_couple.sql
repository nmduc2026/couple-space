-- Chay trong Supabase SQL Editor (role postgres).
-- Ghep 2 profile dau tien thanh 1 couple active de review Home/Settings.
-- Neu da co membership dang active thi bao roi thoat.

do $$
declare
  u1 uuid;
  u2 uuid;
  cid uuid;
  v_code text;
begin
  select id into u1 from public.profiles order by created_at asc limit 1;
  select id into u2 from public.profiles order by created_at asc offset 1 limit 1;

  if u1 is null or u2 is null then
    raise exception 'Can dung it nhat 2 dong trong profiles (tao 2 user Auth truoc).';
  end if;

  if exists (
    select 1 from public.couple_members
    where user_id in (u1, u2) and left_at is null
  ) then
    raise notice 'Da co space dang active — khong seed lai. Xem bang couples / couple_members.';
    return;
  end if;

  insert into public.couples (start_date, theme, status, created_by, invited_name)
  values (current_date - 100, 'rose', 'active', u1, 'Diên')
  returning id into cid;

  insert into public.couple_members (couple_id, user_id, nickname)
  values
    (cid, u1, 'Đức'),
    (cid, u2, 'Diên');

  v_code := public.generate_invite_code();
  insert into public.invites (couple_id, code, created_by, used_at, used_by)
  values (cid, v_code, u1, now(), u2);

  update public.profiles set display_name = 'Đức' where id = u1;
  update public.profiles set display_name = 'Diên' where id = u2;

  raise notice 'Seed OK. couple_id=% invite_code(used)=%', cid, v_code;
end $$;
