-- peek_invite ghi invite_attempts (rate limit) nên không được đánh STABLE.
-- Postgres: INSERT chỉ cho phép trong hàm VOLATILE.
create or replace function public.peek_invite(p_code text)
returns table (inviter_name text, inviter_avatar text, start_date date, couple_id uuid)
language plpgsql security definer set search_path = public as $$
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
