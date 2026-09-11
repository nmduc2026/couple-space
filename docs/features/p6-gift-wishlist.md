# Wishlist quà tặng

`Phase 6` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: mỗi người liệt kê thứ mình thích — người kia xem được, nhưng **không biết mình đã
> xem gì**.

## 1. Vấn đề nó giải quyết

Hai vấn đề đối nghịch nhau, và tính năng này giải quyết cả hai cùng lúc:

- **Người tặng** không biết mua gì, hỏi thẳng thì mất bất ngờ.
- **Người nhận** có thứ mình thích, nói ra thì thành đòi quà.

Wishlist làm cho việc "nói ra" thành bình thường: không phải nói với ai cả, chỉ là ghi vào
danh sách. Và người kia xem lúc nào cũng được mà không ai biết.

Gắn với [sự kiện](p3-events-reminders.md): còn 12 ngày là sinh nhật → app nhắc *"xem wishlist
của Linh chưa?"*. Đây là lúc tính năng thật sự hữu ích.

## 2. Điều đặc biệt: ai đã xem gì là bí mật

> Đây là **ngoại lệ thứ ba và hẹp nhất** của quyết định **D3** — app không có khu vực riêng tư.

Cần phân biệt rõ hai thứ:

| | Ai thấy |
|---|---|
| **Nội dung** wishlist (các món, giá, link) | **Cả hai** — không giấu gì |
| **Hành vi**: ai đã xem mục nào, đã đánh dấu định mua món nào | **Chỉ người xem** |

Tức là nó **không giấu dữ liệu**, chỉ giấu **dấu vết**. Đây là khác biệt quan trọng khi
thiết kế RLS, và là lý do ngoại lệ này không mâu thuẫn với D3.

Cụ thể những gì bị giấu:

- Linh **không biết** Minh đã mở wishlist của mình bao nhiêu lần.
- Linh **không biết** Minh đã đánh dấu "định mua" món nào.
- Linh **không biết** Minh đã đánh dấu "đã mua" món nào — cho tới khi nhận được quà.

## 3. Luật nghiệp vụ

### Thêm nhanh, như mọi nơi khác

Một ô nhập, chỉ cần tên món. Tuỳ chọn thêm sau: giá ước chừng, link, ghi chú
(*"màu trắng nha"*), độ ưu tiên.

Nhận **chia sẻ link từ app khác** (Shopee, Tiki, TikTok Shop) → mở app với link điền sẵn,
chỉ gõ tên. Cùng cơ chế đã làm ở [Ăn gì](p2-eat-tonight.md) P2-22 — và cùng cảnh báo:
`share_target` trên iOS Safari hỗ trợ không đầy đủ, nên nút **"Dán link"** mới là đường
chính.

### Ba trạng thái, hai người thấy khác nhau

| Trạng thái | Ai đặt | Chủ wishlist thấy |
|---|---|---|
| `want` — muốn | Chủ wishlist | ✅ |
| `planned` — người kia định mua | Người kia | ❌ **Ẩn** |
| `bought` — đã mua | Người kia | ❌ **Ẩn** |

Món `bought` vẫn hiện bình thường trong wishlist của chủ nhân — nếu nó biến mất thì họ đoán
ra ngay, và bất ngờ mất.

### Chủ wishlist tự đánh dấu "đã có rồi"

Mua được rồi, hoặc hết thích → chuyển sang `archived`. Người kia **thấy** thay đổi này (để
khỏi mua nhầm) và nhận một thông báo nhẹ nếu họ đã đánh dấu `planned`:
*"Linh vừa bỏ 'Tai nghe Sony' khỏi wishlist"*.

Đây là chiều ngược lại, và nó phải công khai — để không ai tốn tiền vô ích.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Cả hai cùng đánh dấu `planned` một món | Không xảy ra — chỉ có hai người, và mỗi người chỉ xem wishlist của người kia. |
| Chủ wishlist xoá món mà người kia đã `bought` | Cho xoá. Người kia nhận thông báo. Quà đã mua rồi thì vẫn tặng thôi. |
| Rò rỉ qua thông báo | ⚠️ Chỗ nguy hiểm nhất. **Không bao giờ** gửi thông báo cho chủ wishlist về hành vi của người kia trên wishlist của họ. Kiểm tra kỹ mọi push liên quan. |
| Rò rỉ qua [Wrapped](p6-wrapped.md) hoặc xuất dữ liệu | Cùng luật: bản xuất của một người **không chứa** trạng thái `planned`/`bought` do người kia đặt. |
| Wishlist rỗng khi tới gần sinh nhật | Nhắc chủ nhân một lần: *"Sinh nhật bạn sắp tới — thêm vài món cho Minh đỡ vất vả 🙂"* |
| Space `archived` | Chỉ đọc, không thêm mới. |
| Link hỏng / sản phẩm hết hàng | Không tự kiểm tra. Người dùng tự dọn. |

## 5. Ngoài phạm vi

- Theo dõi giá, báo khi giảm giá.
- Mua hàng trong app.
- Chia sẻ wishlist cho người ngoài (bạn bè, gia đình).
- Gợi ý quà tự động.
- Lịch sử quà đã tặng qua các năm — hay, nhưng để sau.

## 6. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Sự kiện](p3-events-reminders.md) | Nhắc "sinh nhật sắp tới, xem wishlist chưa?" — lúc tính năng có ích nhất |
| RLS theo người, không theo space | Khuôn mẫu `couple_id` thông thường **không đủ** ở đây. Là bảng duy nhất trong app cần thiết kế riêng — xem [database-schema.md](../design/backend/database-schema.md) |

> **Lưu ý khi làm:** đây là tính năng duy nhất mà một lỗi phân quyền không gây rò rỉ dữ liệu
> nghiêm trọng, nhưng **làm hỏng toàn bộ ý nghĩa của nó**. Test kỹ phần "ai thấy gì" trước
> khi cho dùng thật.
