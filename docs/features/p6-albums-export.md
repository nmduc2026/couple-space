# Album & sao lưu

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: gom kỉ niệm thành album, in thành sách — và lấy được toàn bộ dữ liệu ra khỏi app
> bất cứ lúc nào.

## 1. Hai việc khác nhau trong một file

| | Album | Xuất dữ liệu |
|---|---|---|
| Mục đích | Sắp xếp lại kỉ niệm cho đẹp | Mang dữ liệu của mình đi |
| Cảm giác | Thú vị | An tâm |
| Bắt buộc? | Không | **Có** — xem mục 4 |

Chúng ở chung vì cùng thao tác trên một tập dữ liệu, nhưng đừng nhầm mức độ quan trọng:
album là tính năng hay; **xuất dữ liệu là nghĩa vụ**.

## 2. Album

### Ba cách gom

| Kiểu | Cách tạo | Ví dụ |
|---|---|---|
| **Tự động theo chuyến** | App gom các bài cùng địa điểm, gần nhau về thời gian | "Đà Lạt, tháng 8 · 64 ảnh · 4 ngày" |
| **Tự động theo hoạt động** | Gom theo loại hoạt động | "Tụi mình đi ăn · 187 ảnh" |
| **Tự tạo** | Người dùng chọn bài | "Sinh nhật Linh 2025" |

**Album tự động là mặc định.** Đây là điểm khác biệt: người dùng mở tab Album lần đầu đã
thấy sẵn 4–5 album, không phải một màn hình trống bảo họ tự tạo. Cùng nguyên tắc nhập liệu
tối thiểu như mọi chỗ khác trong app.

Ngưỡng gom tự động theo chuyến: **cùng tỉnh/thành, cách nhau không quá 2 ngày, ít nhất 3 bài.**

### Album không nhân bản ảnh

Album chỉ là **một cách xem**, không phải một bản sao. Xoá album không xoá bài; xoá bài thì
nó biến khỏi mọi album.

## 3. Xuất PDF — "cuốn sách tình yêu"

### Chạy ở đâu

⚠️ Đây là câu hỏi kỹ thuật lớn nhất của tính năng này.

| Cách | Đánh giá |
|---|---|
| Client (trình duyệt) | Vài chục ảnh thì được. **Vài trăm ảnh thì đứng máy** — và đó là trường hợp thường gặp sau một năm dùng. |
| **Edge Function** | ✅ **Chọn cách này.** Sinh phía server, xong thì gửi push *"Sách của bạn đã xong 📕"* kèm link tải có hạn. |

Sinh PDF là việc **chậm và nặng**, không thể bắt người dùng ngồi chờ màn hình quay. Làm nó
thành một **việc chạy nền có thông báo** ngay từ đầu, đừng làm đồng bộ rồi sửa sau.

### Bố cục sách

- Bìa: ảnh bìa đôi + tên + khoảng thời gian
- Trang mở đầu: số ngày bên nhau, số buổi hẹn (lấy từ [Wrapped](p6-wrapped.md))
- Nội dung theo tháng: ảnh + caption + ngày + địa điểm
- Cho chọn khổ giấy A4 / A5 và mật độ ảnh (1 / 2 / 4 ảnh mỗi trang)

Dùng **bản ảnh đã nén** (1920px) — đủ để in A5, và không làm file PDF nặng tới mức không
gửi được.

## 4. Xuất toàn bộ dữ liệu — phần bắt buộc

> Đây không phải tính năng cao cấp. Đây là **quyền của người dùng với dữ liệu của họ**, và
> là chỗ dựa cho flow [huỷ ghép đôi](p1-breakup.md).

Nút *"Tải toàn bộ dữ liệu về máy"* đã được đặt sẵn ở màn hình huỷ ghép đôi từ **Phase 1**,
ở trạng thái "Sắp có". Phase 6 là lúc nối nó vào thật.

### Định dạng

Một file **ZIP**, mở ra đọc được mà **không cần app**:

```
couple-space-export-2026-09-11.zip
├── README.txt          ← giải thích từng file là gì
├── ky-niem.json        ← bài đăng, caption, ngày, địa điểm, bình luận
├── chi-tieu.json
├── su-kien.json
├── muc-tieu.json
├── cau-hoi.json        ← sách hỏi đáp
├── thu-tuong-lai.json  ← chỉ thư đã mở
├── tam-trang.json
└── anh/
    ├── 2026-09-12-bun-cha-1.jpg
    └── …
```

Tên file ảnh mang **ngày và caption**, không phải UUID. Người mở ZIP ba năm sau phải hiểu
được nó là gì mà không cần tra cứu gì.

Kèm **`ky-niem.html`** — một file mở bằng trình duyệt là xem lại được timeline với ảnh.
Chi phí thêm nhỏ, giá trị lớn: dữ liệu JSON thì đúng nhưng không ai đọc.

### Ai xuất được gì

Cả hai xuất được **toàn bộ** dữ liệu của space, **kể cả ảnh do người kia đăng** — theo
quyết định **D5**. Kỉ niệm là của chung; xem [huỷ ghép đôi](p1-breakup.md) mục 6.

Ngoại lệ: thư tương lai **chưa tới ngày mở** không nằm trong bản xuất của người không viết
nó. Khoá là khoá.

## 5. Ca biên

| Tình huống | Xử lý |
|---|---|
| Xuất khi có 2000 ảnh | Chạy nền, push khi xong. Link tải có hạn 24 giờ. |
| Xuất giữa chừng mất mạng | Link vẫn còn hiệu lực, tải lại được. |
| Space `archived` | **Vẫn xuất được.** Đây chính là lúc người ta cần nó nhất. |
| Ảnh đã bị dọn (quá 6 tháng archived) | ZIP có phần chữ đầy đủ, `README.txt` nói rõ ảnh đã bị dọn và dọn từ khi nào. |
| Album tự động gom sai | Cho sửa: tách bài ra, đổi tên, hoặc chuyển thành album tự tạo. |
| Album tự động chỉ có 1–2 bài | Không tạo. Ngưỡng tối thiểu 3 bài. |
| Yêu cầu xuất liên tục | Giới hạn 1 lần / giờ. Sinh ZIP là việc nặng. |
| Bài bị xoá mềm | Không nằm trong bản xuất. |

## 6. Ngoài phạm vi

- Đặt in sách qua app. Xuất PDF là hết; in thì người dùng tự mang ra tiệm.
- Đồng bộ tự động lên Google Drive / iCloud.
- Nhập dữ liệu từ app khác vào.
- Album chia sẻ ra ngoài cho người thứ ba xem.

## 7. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Timeline](p2-timeline.md) | Nguồn ảnh và caption |
| [Bản đồ dấu chân](p6-footprint-map.md) | Chuẩn hoá địa điểm để gom album theo chuyến |
| [Wrapped](p6-wrapped.md) | Trang mở đầu của sách dùng lại số liệu |
| [Huỷ ghép đôi](p1-breakup.md) | Hoàn thiện nút đã đặt sẵn từ Phase 1 |
