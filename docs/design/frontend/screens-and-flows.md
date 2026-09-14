# Màn hình & User flow (MVP)

> 👉 **Xem trước bằng mắt:** [ui/prototype.html](ui/prototype.html) — prototype
> bấm được của cả 6 phase. Mở bằng trình duyệt.
>
> **Phạm vi file này: tầng giao diện** — điều hướng, bố cục màn hình, thứ tự thao tác.
> **Luật nghiệp vụ và ca biên nằm ở [docs/features/](../../features/README.md)**, không lặp lại ở đây.
> Thấy mâu thuẫn giữa hai nơi thì `docs/features/` là nguồn đúng.

## 1. Cấu trúc điều hướng

```
App
├── (chưa đăng nhập)
│   ├── Welcome
│   ├── Nhập email (tab OTP | tab Mật khẩu)
│   ├── Nhập mã OTP  /  Quên mật khẩu → Đặt lại mật khẩu
│   └── ─ đăng nhập xong ─┐
│                         │
├── (đã đăng nhập, CHƯA có space)
│   ├── Chọn: Tạo space mới  |  Nhập mã mời
│   ├── Thiết lập đôi (ngày bắt đầu, biệt danh, avatar)
│   └── Phòng chờ — "Đang đợi người ấy tham gia" + mã mời
│
└── (đã ghép đôi) ── Tab bar 4 tab + nút (+) ở giữa
    ├── 🏠 Nhà        → Home
    ├── 📷 Kỉ niệm    → Timeline / Lưới ảnh → Chi tiết bài
    ├── ➕ (nút giữa) → Bảng chọn hành động nhanh
    ├── 📅 Kế hoạch   → [Sự kiện | Mục tiêu]  (2 tab con)
    └── 💰 Chi tiêu   → Danh sách theo tháng + tổng kết

    Cài đặt: icon ⚙ ở góc phải header của Home (không chiếm 1 tab)
```

**Vì sao 4 tab + nút giữa:** hành động chính của app là *thêm một kỉ niệm*, phải đúng một chạm từ bất kỳ đâu. 5 tab phẳng làm loãng và không có chỗ cho hành động chính.

**Bảng chọn khi bấm (+):** Kỉ niệm mới · Chi tiêu mới · Sự kiện mới · Mục tiêu mới — theo đúng thứ tự tần suất dùng.

---

## 2. Flow: Onboarding & ghép đôi

Đây là flow quan trọng nhất, vì trước khi ghép xong app gần như vô dụng.

### Người thứ nhất (người khởi tạo)

```
Welcome
  │ "Bắt đầu"
  ▼
Nhập email ──► (tab Mã OTP, mặc định) ──► Nhập mã 6 số ──► Đăng nhập xong
       │
       └── (tab Mật khẩu, nếu đã đặt) ──► Đăng nhập xong
  ▼
"Bạn đã có mã mời chưa?"
  ├── Chưa, tạo không gian mới ──┐
  └── Rồi, nhập mã              │
                                 ▼
                    Thiết lập đôi
                    ├─ Ngày bắt đầu yêu   (bắt buộc)
                    ├─ Biệt danh của bạn   (bắt buộc)
                    ├─ Gọi người ấy là gì  (bắt buộc)
                    └─ Ảnh đại diện        (bỏ qua được)
                                 ▼
                    Phòng chờ
                    ├─ Mã mời cỡ lớn: A7K2M9
                    ├─ [Chia sẻ lời mời]  → mở share sheet hệ thống
                    ├─ Xem trước: "Đây là những gì sẽ có khi người ấy tham gia"
                    └─ [Cứ vào xem trước] → vào Home ở chế độ chờ
```

Chi tiết luật đăng nhập (OTP, mật khẩu, quên mật khẩu, đặt mật khẩu trong Cài đặt):
[p1-auth.md](../../features/p1-auth.md).

**Chi tiết quan trọng:**
- **Lời mời phải hấp dẫn, không phải một chuỗi ký tự khô khan.** Nội dung chia sẻ nên là: *"Anh vừa tạo một nơi để tụi mình lưu kỉ niệm 🤍 Vào bằng mã A7K2M9 nhé: [link]"* — kèm deep link mở thẳng màn hình nhập mã, mã điền sẵn.
- **Không chặn người dùng ở phòng chờ.** Cho vào Home xem trước, hiện banner "Đang chờ [tên] tham gia" kèm nút mời lại. Chặn cứng ở màn hình chờ là cách nhanh nhất để người ta bỏ app.
- Người thứ hai tham gia → **push cho người thứ nhất** + màn hình chúc mừng.

### Người thứ hai

```
Mở deep link (hoặc tự tải app)
  ▼
Nhập email ──► OTP (hoặc mật khẩu nếu đã đặt) ──► Đăng nhập xong
  ▼
Màn hình xác nhận lời mời
  ├─ Hiện avatar + biệt danh người mời + ngày bắt đầu yêu
  └─ [Tham gia]  |  [Không phải tôi]
  ▼
Thiết lập nhanh (biệt danh + avatar của mình)
  ▼
Home — đã ghép đôi 🎉
```

Người thứ hai **không** phải nhập lại ngày bắt đầu yêu — kế thừa từ space. Bớt một bước là bớt một chỗ rơi rụng.

---

## 3. Màn hình Home

Cuộn dọc, từ trên xuống:

```
┌──────────────────────────────────────┐
│  [ảnh bìa đôi]                    ⚙  │
│                                      │
│         Minh 🤍 Linh                 │
│                                      │
│            412                       │
│          ngày bên nhau               │
│   ── còn 88 ngày nữa là 500 ── │
├──────────────────────────────────────┤
│  SẮP TỚI                             │
│  🎂 Sinh nhật Linh      còn 12 ngày  │
│  💕 Kỉ niệm 2 năm       còn 41 ngày  │
├──────────────────────────────────────┤
│  KỈ NIỆM GẦN ĐÂY          Xem tất cả │
│  [ảnh] [ảnh] [ảnh] [ảnh]             │
├──────────────────────────────────────┤
│  THÁNG NÀY                           │
│  8 buổi hẹn · 2.450.000đ             │
│  Đi ăn 12 lần — nhiều nhất tháng này │
├──────────────────────────────────────┤
│  MỤC TIÊU                            │
│  Đi Đà Lạt        ████████░░  80%    │
└──────────────────────────────────────┘
```

Nguyên tắc: **mở app là thấy hết, không cần chạm gì**. Mỗi khối là một lối tắt vào tab tương ứng.

---

## 4. Flow: Đăng một kỉ niệm

Đây là hành động dùng nhiều nhất — phải xong trong dưới 30 giây.

```
(+) → "Kỉ niệm mới"
  ▼
Mở thẳng thư viện ảnh (không có màn hình trung gian)
  │ chọn 1–9 ảnh
  ▼
Màn hình soạn bài — MỘT màn hình duy nhất, không nhiều bước
  ├─ Ảnh đã chọn (kéo sắp xếp, xoá)
  ├─ Caption                          ← con trỏ đặt sẵn ở đây
  ├─ Ngày:      12/09/2026  ← tự điền từ EXIF ảnh đầu tiên
  ├─ Địa điểm:  [gợi ý các nơi đã đi] ← tuỳ chọn
  ├─ Hoạt động: 🍜 🍰 ✈️ 🎬 🏠 ...     ← chọn 1 chạm, tuỳ chọn
  └─ 💰 Thêm chi phí                  ← mở gọn xuống, tuỳ chọn
      ├─ Số tiền
      └─ Ai trả:  [Minh] [Linh]
  ▼
[Đăng]
  ├─ Ảnh upload nền, bài hiện ngay trên timeline ở trạng thái "đang tải"
  └─ Xong → push cho người kia: "Minh vừa thêm một kỉ niệm 📷"
```

**Điều quyết định thành bại:** mọi trường ngoài caption đều **tuỳ chọn** và đều có giá trị đoán sẵn hợp lý. Bắt buộc điền nhiều trường = không ai đăng.

---

## 5. Màn hình Kỉ niệm (Timeline)

- Hai chế độ xem, chuyển bằng nút ở header: **Dòng thời gian** (thẻ lớn, có caption và tương tác) và **Lưới ảnh** (3 cột, chỉ ảnh).
- Chia nhóm theo tháng, có tiêu đề dính (`Tháng 9, 2026`).
- Thẻ bài đăng: ảnh · caption · địa điểm · chi phí (nếu có) · ngày · ai đăng · ❤️ và 💬.
- Chạm vào → **Chi tiết bài**: xem ảnh toàn màn hình (vuốt ngang), phần bình luận bên dưới.
- Nhấn giữ → Sửa / Xoá (chỉ với bài của mình).
- Bộ lọc (nhẹ nhàng, ở header): theo năm, theo hoạt động.

---

## 6. Màn hình Kế hoạch

Hai tab con: **Sự kiện** | **Mục tiêu**

### Sự kiện
- Danh sách sắp tới, sắp theo ngày còn lại tăng dần, mỗi dòng có vòng tròn đếm ngược.
- Sự kiện hệ thống (mốc ngày yêu, kỉ niệm hằng năm) có nhãn riêng, không xoá được nhưng tắt nhắc được.
- Mục "Đã qua" gập lại ở cuối.
- Tạo/sửa sự kiện: tên · ngày · lặp (một lần / hằng năm) · nhắc trước (1/3/7/30 ngày) · ghi chú.

### Mục tiêu
- Thẻ mục tiêu: tên · thanh tiến độ · số bước đã xong / tổng · hạn (nếu có).
- Chi tiết: danh sách bước con, tích từng bước, tiến độ tự cập nhật.
- Tích bước cuối cùng → chúc mừng + hỏi *"Đăng lên kỉ niệm?"* → nhảy thẳng vào flow đăng bài, caption điền sẵn.

---

## 7. Màn hình Chi tiêu

```
┌──────────────────────────────────────┐
│  ◀   Tháng 9, 2026   ▶               │
├──────────────────────────────────────┤
│  Tổng chi        2.450.000đ          │
│  Minh trả 1.850.000 · Linh 600.000   │
│  Trung bình mỗi buổi hẹn  306.000đ   │
│                                      │
│  ▸ Tháng này đi ăn 12 lần — nhiều    │
│    hơn tháng trước 4 lần             │
├──────────────────────────────────────┤
│  [biểu đồ tròn theo danh mục]        │
├──────────────────────────────────────┤
│  12/09  🍜 Bún chả Hàng Quạt         │
│         180.000đ · Minh trả          │
│  10/09  🎬 Xem phim CGV              │
│         240.000đ · Linh trả          │
│  ...                                 │
└──────────────────────────────────────┘
```

- Khoản chi phát sinh từ bài kỉ niệm có icon 📷, chạm vào mở bài đó.
- **Không có số dư nợ nhau, không có nút "đã thanh toán", không có chia đôi / bao trọn.**
  Đã bỏ có chủ đích — xem [p4-expenses.md](../../features/p4-expenses.md) mục 1.
  Cột "ai trả" chỉ để thống kê.

---

## 8. Cài đặt

- **Không gian của chúng ta**: ảnh bìa, biệt danh hai người, ngày bắt đầu yêu, theme màu.
- **Thông báo**: bật/tắt riêng từng loại (bài mới, bình luận, nhắc sự kiện).
- **Tài khoản**: email, đăng xuất.
- **Vùng nguy hiểm**: Huỷ ghép đôi.

### Flow huỷ ghép đôi (MVP làm bản đơn giản nhưng tử tế)

```
[Huỷ ghép đôi]
  ▼
Màn hình giải thích — nói thẳng, không né tránh:
  • Không gian chuyển sang chế độ chỉ đọc, không ai đăng thêm được
  • Cả hai VẪN xem và tải được toàn bộ kỉ niệm
  • Không có gì bị xoá ngay
  • Muốn xoá vĩnh viễn thì cần cả hai cùng xác nhận
  ▼
[Tải toàn bộ dữ liệu về máy]   ← đặt nút này TRƯỚC nút xác nhận
  ▼
Gõ xác nhận → Huỷ ghép đôi
  ▼
Thông báo cho người kia (nhẹ nhàng, không kịch tính)
```

Xử lý phần này đàng hoàng là điều khiến app đáng tin. Đừng để nó thành cái nút đỏ vô cảm.

---

## 9. Ghi chú thiết kế xuyên suốt

- **Trạng thái rỗng phải có sức mời gọi.** Timeline trống không hiện "Chưa có dữ liệu" mà hiện *"Kỉ niệm đầu tiên của hai đứa nằm ở đây nè 📷"* + nút đăng.
- **Phản hồi lạc quan (optimistic).** Thả tim, bình luận, đăng bài hiện ngay lập tức, đồng bộ chạy nền. App cảm xúc mà giật lag thì mất hết cảm giác.
- **Theme màu chọn được**, dùng biến màu ngay từ đầu — nhét màu cứng khắp nơi rồi sửa sau là cực hình.
- **Toàn bộ chữ trong app dùng biệt danh thật của hai người**, không dùng "đối tác", "người dùng B".
- **Chế độ tối** tính từ đầu — app này hay được mở buổi tối.
