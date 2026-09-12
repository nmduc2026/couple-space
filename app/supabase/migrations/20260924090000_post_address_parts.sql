-- Địa chỉ có cấu trúc cho kỉ niệm.
--
-- Trước đây bài chỉ có `place_name` là một chuỗi người dùng tự gõ ("Quán Cây
-- Bàng") và toạ độ. Muốn lọc "những nơi đã đi ở phường Hoàn Kiếm" thì không có
-- dữ liệu nào để lọc: một tỉnh quá to, mà tên quán thì không suy ra được
-- phường.
--
-- Ba cột này được điền khi người dùng bấm "Lấy vị trí hiện tại" lúc soạn bài:
-- toạ độ máy → tra ngược ra địa chỉ. Bài cũ để trống, và màn Dấu chân vẫn gom
-- theo tên địa điểm như trước cho những bài đó.

alter table public.posts
  -- "Phường Hoàn Kiếm", "Xã Xuân Thọ"
  add column if not exists ward     text,
  -- "Quận Hoàn Kiếm", "Huyện Đức Trọng". Nhiều nơi không có cấp này.
  add column if not exists district text,
  -- Địa chỉ đầy đủ để hiện lại nguyên văn: "79 Phố Đinh Tiên Hoàng, Phường
  -- Hoàn Kiếm, Hà Nội"
  add column if not exists address  text;

create index if not exists posts_ward_idx
  on public.posts (couple_id, province_code, ward);
