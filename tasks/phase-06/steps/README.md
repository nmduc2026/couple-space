# Phase 6 — Hướng dẫn từng bước

Mỗi file tương ứng một nhóm trong [../tasks.md](../tasks.md).

| File | Nhóm | Task |
|---|---|---|
| [a-map.md](a-map.md) | Bản đồ dấu chân | P6-01 → P6-10 |
| [b-wrapped.md](b-wrapped.md) | Wrapped | P6-11 → P6-21 |
| [c-albums-pdf.md](c-albums-pdf.md) | Album + xuất PDF | P6-22 → P6-31 |
| [d-export.md](d-export.md) | Xuất toàn bộ dữ liệu | P6-32 → P6-40 |
| [e-wishlist.md](e-wishlist.md) | Wishlist + kết | P6-41 → P6-50 |

> ⚠️ **Viết trước khi có code thật.** Tên file là dự kiến — tin code thật rồi sửa lại file này.

## ⚠️ Đọc trước: có nên làm Phase 6 bây giờ không?

Phase này **hầu như không tạo dữ liệu mới** — nó đọc lại những gì 5 phase trước đã tích.
Vì vậy nó chỉ có ý nghĩa khi app **đã dùng thật ít nhất vài tháng**.

| Tính năng | Cần gì để có ý nghĩa |
|---|---|
| Bản đồ dấu chân | Vài chục bài **có gắn địa điểm** |
| Wrapped | Gần trọn một năm dữ liệu |
| Album tự động | Ít nhất một chuyến đi có thật |
| Xuất PDF | Đủ ảnh để thành một cuốn sách |

**Nếu app mới dùng vài tuần: hoãn Phase 6.** Dùng app thêm vài tháng rồi quay lại — làm sớm
thì chỉ thấy màn hình rỗng và không biết nó đúng hay sai.

**Ngoại lệ:** nhóm [d-export.md](d-export.md) (xuất toàn bộ dữ liệu) **nên làm sớm**, không
cần chờ. Nó là **quyền của người dùng với dữ liệu của họ**, và nút của nó đã nằm sẵn ở màn
hình huỷ ghép đôi từ Phase 1 trong trạng thái "Sắp có". Nếu chỉ làm được một nhóm trong
Phase 6, làm nhóm đó.

## Thứ tự đề nghị

```
d-export   ← làm trước, không phụ thuộc lượng dữ liệu
a-map      ← cần địa điểm, và nuôi số liệu cho Wrapped
b-wrapped  ← cần a-map
c-albums   ← cần a-map (gom theo chuyến)
e-wishlist ← độc lập, làm lúc nào cũng được
```
