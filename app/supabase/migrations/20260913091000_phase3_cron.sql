-- Lịch chạy nhắc nhở. Chạy SAU khi đã deploy Edge Function `send-reminders`.
--
-- Trước khi chạy file này, đặt hai giá trị trong Dashboard → Settings → Vault
-- (hoặc sửa thẳng vào đây nếu chưa dùng Vault):
--   project_url  = https://<ref>.supabase.co
--   cron_secret  = chuỗi bí mật, đặt trùng với secret CRON_SECRET của function

create extension if not exists pg_cron;
create extension if not exists pg_net;

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
    url := current_setting('app.project_url', true) || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
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
