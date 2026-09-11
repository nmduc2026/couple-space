# Ghép đôi (Pairing)

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: đưa được **người thứ hai** vào không gian chung, càng nhanh càng tốt.

## 1. Vì sao cần

Trước khi ghép đôi xong, app **gần như vô dụng** — không có ai để chia sẻ, không có
dữ liệu chung. Đây là rủi ro chết app lớn nhất: người thứ nhất cài app, người thứ hai
không bao giờ vào, và tuần sau cả hai cùng quên.

**Mục tiêu đo được: người thứ hai tham gia trong 24 giờ đầu.**

## 2. Luật nghiệp vụ

| Luật | Chi tiết |
|---|---|
| Một người, một space | Một tài khoản chỉ thuộc **đúng 1 space** tại một thời điểm. Muốn vào space khác phải rời space cũ trước. |
| Một space, hai người | Space đầy khi có 2 thành viên. Mã mời của space đầy bị vô hiệu. |
| Mã mời | 6 ký tự, chữ IN HOA + số. **Bỏ các ký tự dễ nhầm**: `0 O 1 I L`. |
| Hạn mã mời | 7 ngày. Hết hạn thì tạo mã mới, mã cũ vô hiệu ngay. |
| Người tạo giữ quyền | Người tạo space nhập ngày bắt đầu yêu; người thứ hai **kế thừa**, không nhập lại. |
| Không chặn ở phòng chờ | Người thứ nhất vẫn vào Home xem trước được khi chưa có ai tham gia. |

## 3. Luồng chính

### Người thứ nhất

```
Welcome → Nhập email → Nhập mã OTP 6 số → Đăng nhập xong
  ▼
"Bạn đã có mã mời chưa?"
  ├── Chưa → Tạo không gian mới
  └── Rồi  → Nhập mã (sang luồng người thứ hai)
  ▼
Thiết lập đôi: ngày bắt đầu yêu · biệt danh của bạn · gọi người ấy là gì · avatar (bỏ qua được)
  ▼
Phòng chờ: mã mời cỡ lớn + [Chia sẻ lời mời] + [Cứ vào xem trước]
```

**Lời mời phải hấp dẫn, không phải một chuỗi ký tự khô khan.** Nội dung chia sẻ:

> *"Anh vừa tạo một nơi để tụi mình lưu kỉ niệm 🤍 Vào bằng mã **A7K2M9** nhé: [link]"*

Kèm deep link mở thẳng màn hình nhập mã với mã **điền sẵn** — người thứ hai không
phải gõ lại gì.

### Người thứ hai

```
Mở deep link (hoặc tự cài app) → Nhập email → OTP → Đăng nhập xong
  ▼
Màn hình xác nhận lời mời
  ├─ Hiện avatar + biệt danh người mời + ngày bắt đầu yêu
  └─ [Tham gia]  |  [Không phải tôi]
  ▼
Thiết lập nhanh: biệt danh + avatar của mình
  ▼
Home — đã ghép đôi 🎉   +   push cho người thứ nhất
```

Người thứ hai **không** nhập lại ngày bắt đầu yêu. Bớt một bước là bớt một chỗ rơi rụng.

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Nhập mã của space đã đủ 2 người | *"Không gian này đã đủ hai người rồi."* Không tiết lộ thông tin gì thêm. |
| Nhập mã không tồn tại / hết hạn | Thông báo chung, **không phân biệt** hai trường hợp (tránh dò mã). |
| Người đã ở trong space khác nhập mã mới | Chặn, giải thích: phải rời space hiện tại trước → dẫn sang [huỷ ghép đôi](p1-breakup.md). |
| Tự nhập mã của chính mình | Chặn, thông báo nhẹ nhàng. |
| Hai người cùng nhập một mã đúng lúc | Người trước thắng; người sau nhận thông báo space đã đầy. Cần xử lý ở tầng database, không ở app. |
| Người thứ nhất xoá tài khoản khi đang chờ | Space bị xoá, mã vô hiệu. |
| Dò mã bằng máy | Giới hạn số lần nhập sai (ví dụ 10 lần / giờ / tài khoản). 6 ký tự là không gian nhỏ. |

## 5. Ngoài phạm vi

- Đăng nhập bằng Google / Apple — **chỉ email OTP** ở Phase 1. Ít việc hơn, và
  không phụ thuộc cấu hình store.
- Space nhiều hơn 2 người.
- Chuyển space, gộp space.

## 6. Phụ thuộc

- Auth (email OTP) — Supabase Auth, có sẵn.
- [Hồ sơ đôi](p1-couple-profile.md) — màn hình thiết lập nằm trong luồng này.
- [Thông báo](p1-notifications.md) — push "người ấy đã tham gia".
- Deep link: trên PWA là URL thường; **đây là một lợi thế của PWA** — không cần cấu hình
  universal link như app native.
