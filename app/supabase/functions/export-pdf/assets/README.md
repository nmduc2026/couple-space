# Font cho bản xuất PDF

`BeVietnamPro-Regular.ttf` · `BeVietnamPro-Bold.ttf` — lấy từ
[google/fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro),
giấy phép **SIL Open Font License 1.1** (`OFL.txt` kèm theo). OFL cho phép
nhúng và phân phối kèm sản phẩm, kể cả thương mại.

**Vì sao phải nhúng font vào repo:** PDF không có font hệ thống. Font 14 chuẩn
của PDF (Helvetica, Times…) chỉ có bảng mã WinAnsi — không có `ạ ầ ữ ợ đ ₫`.
Dùng chúng thì mọi dấu tiếng Việt biến thành ô vuông hoặc bị bỏ, và lỗi đó chỉ
lộ ra khi mở file, không lộ lúc sinh.

Bản đang dùng phủ đủ toàn bộ dấu tiếng Việt và ký hiệu ₫ (kiểm bằng cách đọc
bảng `cmap`, 459 glyph mỗi nét). Thay font khác thì kiểm lại đúng việc đó
trước, đừng tin vào tên file.
