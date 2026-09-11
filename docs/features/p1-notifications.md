# Thông báo hai chiều

`Phase 1` · `Tầng 0 — Nền móng` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: bạn làm gì đó, người kia biết ngay. Đây là **mạch máu** của app.

## 1. Vì sao cần

Không có thông báo thì app chỉ là một cuốn nhật ký cá nhân. Có thông báo thì nó thành
một cuộc trò chuyện chậm giữa hai người.

Nhưng — **vắng push vẫn phải dùng được.** Push là gia vị, không phải điều kiện sống:
luôn có kéo-để-tải-lại và dấu chấm "có nội dung mới".

## 2. Hai đường gửi khác nhau

Đây là điểm phức tạp nhất, đến từ quyết định phân phối bằng PWA:

| Nền tảng | Cơ chế | Điều kiện |
|---|---|---|
| **iPhone (PWA)** — đường **duy nhất** | Web Push (VAPID) | iOS 16.4+ (✅ cả hai máy chạy **iOS 26**) và **đã "Thêm vào Màn hình chính"** |
| Android | Web Push (VAPID) | Chrome — cùng cơ chế, không phải làm riêng |

**Chỉ có một nhánh gửi.** Edge Function dùng thư viện `web-push` với cặp khoá VAPID —
không cần Expo Push, không cần FCM/APNs. Đây là phần thưởng của việc chốt bỏ app native:
xem [distribution.md](../decisions/distribution.md).

Điều kiện sống còn duy nhất: người dùng phải **"Thêm vào Màn hình chính"**. Mở trong tab
Safari bình thường thì iOS không cho đăng ký push.

## 3. Danh sách thông báo

| Sự kiện | Nội dung | Phase |
|---|---|---|
| Người kia tham gia space | *"Linh đã vào không gian của hai bạn 🎉"* | 1 |
| Người kia đăng kỉ niệm | *"Minh vừa thêm một kỉ niệm 📷"* | 2 |
| Thả tim / bình luận | *"Linh đã thả tim bài của bạn"* | 2 |
| Nhắc sự kiện | *"Còn 3 ngày là sinh nhật Linh 🎂"* | 3 |
| Mốc ngày yêu | *"Hôm nay tròn 500 ngày 💕"* | 3 |
| Nhắc nhẹ (nudge) | *"Linh đang nhớ bạn 🤍"* | 5 |

## 4. Luật nghiệp vụ

- **Không bao giờ gửi thông báo về hành động của chính mình.**
- **Gộp thông báo**: đăng 5 ảnh liên tiếp trong vài phút → một thông báo, không phải năm.
- Bật/tắt **riêng từng loại** trong Cài đặt. Người dùng phải tắt được thứ làm phiền
  mà không phải tắt hết.
- **Giờ yên lặng** (ví dụ 22:00–08:00): thông báo không khẩn thì hoãn tới sáng.
- Chạm vào thông báo → mở **đúng** màn hình liên quan, không phải Home.

## 5. Ca biên

| Tình huống | Xử lý |
|---|---|
| Từ chối quyền thông báo | App vẫn dùng bình thường. Nhắc lại **một lần duy nhất**, đúng lúc có giá trị (sau khi đăng bài đầu tiên). Không nài. |
| Trình duyệt không hỗ trợ push | Ẩn phần cài đặt thông báo, app vẫn chạy bình thường. Không xảy ra với iOS 26, nhưng vẫn phải phòng. |
| Chưa "Thêm vào màn hình chính" trên iOS | Hướng dẫn thao tác này **ngay trong onboarding** — không có nó thì không có push. |
| Đăng ký push hết hạn / máy mới | Dọn đăng ký chết khi gửi thất bại. |
| Người kia chưa bao giờ mở app | Không gửi. |

## 6. Ngoài phạm vi

- Thông báo có ảnh xem trước (rich notification).
- Trung tâm thông báo trong app — Phase 1 chỉ có push, chưa có lịch sử.

## 7. Phụ thuộc

Là nền móng: [ghép đôi](p1-pairing.md), [timeline](p2-timeline.md),
[sự kiện](p3-events-reminders.md), [nudge](p5-nudge.md) đều dựa vào nó.
