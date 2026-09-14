-- Lịch chạy nhắc nhở. Chạy SAU khi đã deploy Edge Function `send-reminders`.
--
-- Cron cần hai giá trị: địa chỉ project và bí mật dùng chung với function.
-- Cách thường thấy là `alter database ... set app.xxx`, NHƯNG trên Supabase
-- role `postgres` không phải superuser nên câu đó bị từ chối
-- (42501: permission denied to set parameter). Vì vậy hai giá trị nằm trong
-- một bảng thuộc schema `private`.
--
-- `private` KHÔNG nằm trong danh sách schema mà PostgREST phơi ra
-- (xem `[api] schemas` trong config.toml), nên bảng này không có đường nào
-- gọi tới từ client — kể cả khi ai đó có khoá anon.
--
-- Điền giá trị sau khi push:
--   insert into private.app_config (key, value) values
--     ('project_url', 'https://<ref>.supabase.co'),
--     ('cron_secret', '<CRON_SECRET giống secret của function>')
--   on conflict (key) do update set value = excluded.value;

create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

create table if not exists private.app_config (
  key   text primary key,
  value text not null
);

revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

create or replace function private.config(p_key text)
returns text
language sql stable security definer set search_path = private as $$
  select value from private.app_config where key = p_key;
$$;

revoke all on function private.config(text) from public, anon, authenticated;

-- Xoá job cũ để chạy lại file này không sinh job trùng
do $$
begin
  if exists (select 1 from cron.job where jobname = 'couple-space-reminders') then
    perform cron.unschedule('couple-space-reminders');
  end if;
end $$;

-- Mỗi giờ, đúng phút 0. Hàm SQL `due_reminders()` mới là chỗ quyết định
-- ai được gửi lúc mấy giờ — cron chỉ cần gọi đủ dày.
select cron.schedule(
  'couple-space-reminders',
  '0 * * * *',
  $cron$
  select net.http_post(
    url := private.config('project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', private.config('cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- Dọn lịch sử nhắc cũ hơn 90 ngày, mỗi tuần một lần
do $$
begin
  if exists (select 1 from cron.job where jobname = 'couple-space-reminders-cleanup') then
    perform cron.unschedule('couple-space-reminders-cleanup');
  end if;
end $$;

select cron.schedule(
  'couple-space-reminders-cleanup',
  '0 3 * * 0',
  $cron$
  delete from public.reminder_sends where sent_at < now() - interval '90 days';
  $cron$
);
