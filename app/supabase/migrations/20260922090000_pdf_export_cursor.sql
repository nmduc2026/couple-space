-- Con trỏ cho việc sinh PDF theo từng đợt.
--
-- Lần chạy thật cho thấy Edge Function không đủ bộ nhớ để giải mã + mã hoá lại
-- toàn bộ ảnh của một cuốn sách trong MỘT lượt chạy: heap wasm của mozjpeg
-- không trả lại sau mỗi tấm, nên tới tấm thứ mười mấy là bị cắt với
-- WORKER_RESOURCE_LIMIT — kể cả khi đã thu nhỏ ảnh trước.
--
-- Vì vậy việc được chia làm hai pha:
--   1. Đổi ảnh sang JPEG theo từng đợt nhỏ, mỗi đợt một lượt gọi hàm (worker
--      mới, bộ nhớ mới), kết quả cất tạm trong Storage. `cursor` nhớ đã làm
--      tới đâu.
--   2. Ghép PDF từ đống JPEG đã sẵn — bước này không đụng tới wasm nên nhẹ.
alter table public.pdf_exports
  add column if not exists cursor int not null default 0;
