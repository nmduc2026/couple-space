-- P6-27 → P6-31 — Xuất sách ảnh PDF, chạy nền.
--
-- Sinh PDF cho vài trăm tấm ảnh mất hàng chục giây, quá lâu cho một request
-- đồng bộ. Vì vậy đây là một HÀNG ĐỢI: client tạo một dòng `queued`, Edge
-- Function nhận rồi làm tiếp ở nền, xong thì ghi `storage_path` và đẩy push.
-- Client chỉ cần theo dõi dòng đó.

create table if not exists public.pdf_exports (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,

  -- 'queued' | 'running' | 'done' | 'failed'
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'done', 'failed')),

  -- Khổ giấy và mật độ ảnh mỗi trang — P6-29
  page_size    text not null default 'A5' check (page_size in ('A4', 'A5')),
  per_page     int  not null default 2 check (per_page in (1, 2, 4)),

  -- Giới hạn theo năm, null nghĩa là toàn bộ
  year         int,

  storage_path text,
  page_count   int,
  error        text,

  created_at   timestamptz not null default now(),
  finished_at  timestamptz,
  -- Link tải có hạn 24 giờ — P6-31
  expires_at   timestamptz
);

create index if not exists pdf_exports_couple_idx
  on public.pdf_exports (couple_id, created_at desc);

alter table public.pdf_exports enable row level security;

drop policy if exists pdf_read   on public.pdf_exports;
drop policy if exists pdf_insert on public.pdf_exports;

create policy pdf_read on public.pdf_exports for select
  using (public.is_member_of(couple_id));

-- Chỉ tạo được yêu cầu cho space của mình. Cập nhật trạng thái là việc của
-- Edge Function (service role), người dùng không tự đổi `status` được —
-- không có policy UPDATE nào ở đây, và đó là cố ý.
create policy pdf_insert on public.pdf_exports for insert
  with check (
    requested_by = auth.uid()
    and public.is_member_of(couple_id)
  );


-- ============================================================
-- Bucket riêng cho bản xuất. Không dùng chung `couple-media`:
-- file ở đó là kỉ niệm giữ mãi, file ở đây là bản tạm hết hạn sau 24 giờ.
-- Đường dẫn: <couple_id>/<export_id>.pdf
-- ============================================================

insert into storage.buckets (id, name, public)
values ('couple-exports', 'couple-exports', false)
on conflict (id) do nothing;

drop policy if exists "exports read" on storage.objects;

create policy "exports read" on storage.objects for select
  using (
    bucket_id = 'couple-exports'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

-- Không có policy insert/delete cho người dùng: chỉ service role ghi vào đây.


-- ============================================================
-- Dọn bản xuất đã hết hạn. Cùng lịch hằng tuần với dọn `reminder_sends`.
-- Xoá dòng DB; file trong Storage do lịch dọn của Storage lo, hoặc lần chạy
-- sau của Edge Function.
-- ============================================================

create or replace function public.purge_expired_exports()
returns int
language sql security definer set search_path = public as $$
  with gone as (
    delete from public.pdf_exports
    where expires_at is not null and expires_at < now()
    returning 1
  )
  select count(*)::int from gone;
$$;

revoke all on function public.purge_expired_exports() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'couple-space-exports-cleanup') then
    perform cron.unschedule('couple-space-exports-cleanup');
  end if;
exception
  when undefined_table then null;  -- pg_cron chưa bật thì bỏ qua
end $$;

select cron.schedule(
  'couple-space-exports-cleanup',
  '30 3 * * 0',
  $cron$ select public.purge_expired_exports(); $cron$
);
