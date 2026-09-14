-- Màu nhấn chuyển từ KHÔNG GIAN sang TỪNG NGƯỜI.
--
-- Đặc tả ban đầu (docs/features/p1-couple-profile.md mục 2) xếp theme màu vào
-- nhóm "thuộc về space", và có cả luật đồng bộ realtime cho cả hai. Chủ dự án
-- chốt lại: hai người có gu khác nhau, ép chung một màu là sai — mỗi người tự
-- chọn màu của mình.
--
-- Vì sao là cột trong `profiles` chứ không phải localStorage: yêu cầu là "theo
-- NGƯỜI DÙNG chứ không theo máy", nên đổi màu trên điện thoại thì mở trên máy
-- tính phải thấy y như vậy. Sáng/tối thì vẫn là lựa chọn theo máy — cùng một
-- người có thể thích nền tối trên giường và nền sáng ngoài trời.
--
-- `couples.theme` giữ nguyên, không xoá: nó là màu của đôi lúc mới tạo không
-- gian và vẫn dùng làm giá trị khởi tạo cho người chưa chọn gì.

alter table public.profiles
  add column if not exists color_theme text;

-- Ai cũng đọc được hồ sơ của người trong space (để hiện biệt danh), nhưng chỉ
-- tự sửa được hồ sơ của mình. Policy sẵn có đã lo phần đó.
