# Đăng nhập (Auth)

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: vào được app nhanh lần đầu (OTP), và lần sau có thể chọn mật khẩu nếu đã đặt.

## 1. Vì sao cần

Ghép đôi và mọi tính năng sau đều cần biết **ai** đang dùng. Auth phải nhẹ lúc
onboarding (không bắt tạo mật khẩu), nhưng bền về lâu dài: mở app lại không phải
chờ email mỗi lần nếu người dùng đã đặt mật khẩu.

## 2. Luật nghiệp vụ

| Luật | Chi tiết |
|---|---|
| Lần đầu / chưa có mật khẩu | Chỉ **email OTP** (mã 6 số). Tạo tài khoản qua OTP được. |
| Đăng nhập lại | **OTP** hoặc **mật khẩu** — mật khẩu chỉ dùng được sau khi đã đặt trong Cài đặt (hoặc qua quên mật khẩu). |
| Màn nhập email | Hai tab: **Mã OTP** (mặc định) và **Mật khẩu**. Không ẩn tab theo môi trường dev/prod. |
| Đặt / đổi mật khẩu | Trong **Cài đặt → Tài khoản**. Không bắt buộc lúc onboarding. |
| Quên mật khẩu | Từ tab Mật khẩu → gửi email đặt lại → mở link → nhập mật khẩu mới. |
| Phiên | Đăng nhập xong giữ phiên; lần mở sau không hỏi lại nếu còn phiên hợp lệ. |
| Kênh gửi OTP | Email. Template dùng **mã số** (`{{ .Token }}`), không dựa vào magic link (PWA dễ mất phiên nếu mở nhầm trình duyệt). |

## 3. Luồng chính

### Đăng ký / lần đầu (OTP)

```
Welcome → Nhập email (tab Mã OTP) → Nhập mã 6 số → Đăng nhập xong
  → tiếp [ghép đôi](p1-pairing.md)
```

### Đăng nhập bằng mật khẩu (đã đặt trước đó)

```
Welcome → Nhập email (tab Mật khẩu) → Nhập mật khẩu → Đăng nhập xong
```

### Đặt hoặc đổi mật khẩu (đã đăng nhập)

```
Cài đặt → Tài khoản → Đặt / đổi mật khẩu
  → nhập mật khẩu mới + nhập lại → Lưu
```

### Quên mật khẩu

```
Tab Mật khẩu → Quên mật khẩu?
  → nhập email → Gửi link
  → mở email trên máy → mở link về app
  → nhập mật khẩu mới → xong (vào app hoặc về màn đăng nhập)
```

## 4. Ca biên

| Tình huống | Xử lý |
|---|---|
| Chọn tab Mật khẩu nhưng chưa từng đặt | Báo rõ: dùng OTP, hoặc vào Cài đặt để đặt mật khẩu sau khi đã đăng nhập bằng OTP. Không lộ “email có tồn tại hay không” quá mức cần thiết. |
| OTP sai / hết hạn | Báo cụ thể; cho gửi lại (khoá ~60 giây giữa các lần). |
| Gửi OTP quá nhiều | Báo đợi vài phút (rate limit Supabase). |
| Email rơi spam | Nhắc kiểm tra hộp thư rác trên màn OTP. |
| Link quên mật khẩu hết hạn / đã dùng | Báo và dẫn gửi lại. |
| Mật khẩu mới quá ngắn | Chặn theo ngưỡng Supabase (thường tối thiểu 6 ký tự); báo ngay trên form. |
| Đăng nhập trên tab Safari rồi mới cài PWA | PWA có kho riêng — phải đăng nhập lại trong PWA. Hướng dẫn cài PWA vẫn nằm ở [p1-notifications.md](p1-notifications.md). |

## 5. Ngoài phạm vi

- Đăng nhập Google / Apple.
- Bắt buộc đặt mật khẩu ngay sau OTP lần đầu.
- “Passkey” / sinh trắc học hệ thống.
- Hiển thị chính xác “tài khoản này đã có mật khẩu chưa” trên màn login (Supabase client không cho biết chắc); dùng thông báo lỗi + hướng dẫn thay vì đoán.

## 6. Phụ thuộc

- Supabase Auth (Email OTP + Email/Password + reset email).
- Redirect URL quên mật khẩu trỏ về domain app (Vercel / PWA).
- [Ghép đôi](p1-pairing.md) — chạy **sau** khi đã đăng nhập.
- Prototype: [ui/prototype.html](../design/frontend/ui/prototype.html) (các màn `email`, `email-pw`, `forgot-pw`, `reset-pw`, `set-password`).
