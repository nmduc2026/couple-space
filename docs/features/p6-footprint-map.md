# Bản đồ dấu chân

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: những nơi hai người đã đi cùng nhau, vẽ lên một tấm bản đồ.

## 1. Vì sao làm cái này thay vì chia sẻ vị trí realtime

Ý ban đầu là theo dõi vị trí thời gian thực. Đã loại, và đây là lý do:

| | Vị trí realtime | Bản đồ dấu chân |
|---|---|---|
| Tốn pin | Nhiều | Không |
| Quyền chạy nền | Cần, và PWA **không có** | Không cần |
| Cảm giác của người dùng | Dễ thành **giám sát** | Kỉ niệm |
| Dữ liệu cần thêm | Cả một hệ thống theo dõi | **Không có gì** — dùng địa điểm đã nhập ở Timeline |
| Giá trị mang lại | "Người kia đang ở đâu" | "Hai đứa đã đi những đâu" |

Dòng cuối là dòng quan trọng. Với một app về kỉ niệm, **câu hỏi thứ hai mới là câu đáng trả
lời**. Và nó lấy được 80% giá trị với gần 0% chi phí, vì dữ liệu đã nằm sẵn trong các bài
[Timeline](p2-timeline.md) từ Phase 2.

## 2. Luật nghiệp vụ

### Nguồn dữ liệu

Duy nhất một nguồn: cột địa điểm của bài Timeline. **Không thu thập GPS, không xin quyền vị
trí.** Bài nào không gắn địa điểm thì không lên bản đồ — và đó là lựa chọn của người dùng.

### Chuẩn hoá địa điểm — quyết định then chốt

Người dùng nhập tự do (*"Hàng Quạt"*, *"quán bún chả chỗ cũ"*). Muốn đếm được
*"5/63 tỉnh thành"* thì phải quy về tỉnh/thành.

Cách làm, theo thứ tự ưu tiên:

1. Bài có **toạ độ** (dán link Google Maps) → tra ngược ra tỉnh/thành.
2. Tên địa điểm **khớp danh sách 63 tỉnh/thành** (có xử lý dấu và cách viết) → dùng luôn.
3. Không khớp → **hỏi người dùng một lần**, ở màn hình bản đồ: *"'Hàng Quạt' thuộc tỉnh
   thành nào?"* → lưu lại để lần sau tự nhận.

Bước 3 là chỗ nhiều app bỏ qua và kết quả là bản đồ trống rỗng. Hỏi một lần, gọn, không
chặn — và mỗi lần trả lời làm dữ liệu tốt lên vĩnh viễn.

### Bản đồ hiển thị gì

- **Chấm đậm** = nơi đã đi, kèm tên và số lần ghé. Chạm vào → lọc Timeline theo nơi đó.
- **Chấm mờ** = tỉnh thành chưa tới. Đây là phần tạo động lực đi tiếp.
- Thống kê: `số tỉnh thành / 63` · tổng số địa điểm · nơi xa nhất.

Câu cuối màn hình: *"Còn **58 tỉnh thành** hai đứa chưa đặt chân tới."* — lời mời, không
phải lời trách.

## 3. Thư viện bản đồ

⚠️ **Ràng buộc của PWA:** không dùng được SDK bản đồ native. Ba lựa chọn:

| Cách | Chi phí | Ghi chú |
|---|---|---|
| **Bản đồ tĩnh SVG Việt Nam** | $0 | ✅ **Chọn cách này.** Một file SVG 63 tỉnh, tô màu tỉnh đã đi. Nhẹ, chạy offline, không phụ thuộc ai, và hợp với app chỉ dùng ở Việt Nam. |
| Leaflet + OpenStreetMap | $0 nhưng tốn băng thông tải tile | Đẹp hơn, nhưng cần tải ảnh từ ngoài — **CSP của PWA phải mở thêm**, và tốn băng thông mỗi lần mở. |
| Google Maps / Mapbox | Có phí sau hạn mức | Không đáng cho tính năng này. |

Đi xa hơn Việt Nam (du lịch nước ngoài) thì mới tính lại. Ở Phase 6 thì chưa cần.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Chưa bài nào có địa điểm | Bản đồ trống + *"Gắn địa điểm vào kỉ niệm để bắt đầu vẽ bản đồ"* + nút mở bài gần nhất để bổ sung. |
| Địa điểm không khớp tỉnh nào | Gom vào nhóm "Chưa xác định", hỏi một lần rồi thôi. Không hỏi lại mỗi lần mở. |
| Địa điểm nước ngoài | Đếm riêng: *"1 quốc gia khác"*. Không cố vẽ lên bản đồ Việt Nam. |
| Cùng một nơi, hai cách viết (*Sài Gòn* / *TP.HCM*) | Gộp khi chuẩn hoá. Danh sách đồng nghĩa viết sẵn cho các trường hợp phổ biến. |
| Xoá bài | Số lần ghé giảm. Về 0 thì chấm biến mất. |
| Bài do một người đăng | Vẫn tính là "hai đứa đã đi" — mọi dữ liệu thuộc về space, không thuộc người đăng. |
| Rất nhiều địa điểm trong một tỉnh | Chấm trên bản đồ gộp theo tỉnh; danh sách bên dưới liệt kê chi tiết. |

## 5. Ngoài phạm vi

- **Chia sẻ vị trí realtime.** Đã loại, xem mục 1.
- Check-in tại chỗ bằng GPS — có thể thêm sau, nhưng cần quyền vị trí và phải opt-in rõ ràng.
- Vẽ đường đi giữa các điểm.
- Bản đồ thế giới.
- Gợi ý nơi nên đi tiếp.

## 6. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Timeline](p2-timeline.md) | Nguồn dữ liệu duy nhất — cần đã tích được kha khá bài có địa điểm |

Nuôi: [Wrapped](p6-wrapped.md) — con số "đã đi bao nhiêu nơi trong năm" lấy từ đây.
