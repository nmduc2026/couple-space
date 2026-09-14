-- Cột tiến độ cho việc sinh PDF.
--
-- Lần chạy thật đầu tiên bị treo ở `running` mà không ghi được lỗi nào: tiến
-- trình bị runtime kết liễu trước khi khối `catch` chạy. Không có tiến độ thì
-- không biết nó chết ở bước nào — và mỗi lần thử lại tốn cả phút.
alter table public.pdf_exports
  add column if not exists progress text;
