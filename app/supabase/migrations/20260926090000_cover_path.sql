-- Ảnh bìa: lưu ĐƯỜNG DẪN thay vì link đã ký.
--
-- Bản cũ ký một link hạn 1 năm rồi cất nguyên cái link đó vào `cover_url`.
-- Hết hạn là nền Home mất trắng, và không có gì tự ký lại — một quả bom hẹn
-- giờ đúng 365 ngày, nổ vào lúc không ai còn nhớ vì sao.
--
-- `post_media` đã làm đúng từ đầu: lưu `storage_path`, ký lúc đọc. Ảnh bìa
-- theo cách đó.
--
-- `cover_url` giữ lại, không xoá: bản xuất dữ liệu và bài cũ có thể còn trỏ
-- vào nó. Client đọc `cover_path` trước, không có mới rơi về `cover_url`.

alter table public.couples
  add column if not exists cover_path text;
