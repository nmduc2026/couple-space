# Đưa app lên máy mà không lên store

**Tình huống:** **cả hai người dùng đều dùng iPhone** (iOS 26). Chủ dự án có thêm một máy
Android, chỉ dùng để xem thử. Chưa muốn phát hành công khai, **không muốn tốn $99/năm cho
Apple**. Máy làm việc chạy **Windows**, không có Mac.

**Kết luận: làm được, tổng chi phí $0**, và đơn giản hơn app native đáng kể.

> ### Quyết định đã chốt (2026-09-11)
>
> | | |
> |---|---|
> | **Cách phân phối** | **PWA** — web app cài ra màn hình chính iPhone |
> | **Công nghệ** | Vite + React, **không dùng Expo** — xem [tech-stack.md](tech-stack.md) mục D2 |
> | **Android** | Không cần bản riêng. PWA chạy trên Chrome Android còn tốt hơn iOS. |
> | **Widget** | **Để sau.** PWA không có widget; cả hai đều dùng iPhone nên không ai có. Thay bằng một push hằng ngày ở Phase 3. |
> | **Xem lại khi nào** | Nếu quyết định chi $99/năm. Khi đó dùng **Capacitor** bọc lại chính code hiện có — không viết lại. |

## 1. PWA là gì, và nó "thật" tới mức nào

PWA là một trang web được trình duyệt cho phép **cài ra màn hình chính**. Sau khi cài:

- Có **icon riêng** trên màn hình iPhone, nằm cạnh các app khác.
- Mở ra **toàn màn hình**, không có thanh địa chỉ Safari — nhìn không khác app thường.
- Có **màn hình khởi động** (splash screen) riêng.
- **Chạy được khi mất mạng** ở mức cơ bản (service worker cache).
- **Nhận được push notification** — từ iOS 16.4 trở lên. Cả hai máy chạy iOS 26 nên **không vướng gì**.

Người dùng gần như không phân biệt được với app tải từ App Store. Khác biệt thật sự nằm ở
những thứ họ không thấy: không có widget, không chạy nền liên tục, không vào được store.

### Cách cài trên iPhone

```
Mở link trong SAFARI  (phải là Safari, không phải Chrome)
  → nút Chia sẻ ⬆️
  → "Thêm vào Màn hình chính"
  → Thêm
```

> ⚠️ **Bước này bắt buộc để có push notification.** Mở trong tab Safari bình thường thì
> **không** nhận được thông báo. Vì vậy phần hướng dẫn "Thêm vào Màn hình chính" phải nằm
> ngay trong onboarding — xem [p1-notifications.md](../features/p1-notifications.md).

## 2. Quy trình từ lúc code tới lúc dùng

Toàn bộ chạy trên Windows, không cần Mac, không cần cài gì đặc biệt:

```
       viết code
           │
    npm run build          →  ra thư mục dist/
           │
   đẩy code lên GitHub     →  Vercel tự build và deploy
           │
  có link https://...      →  mở trên iPhone → Thêm vào MH chính
```

**Cập nhật app về sau chỉ là đẩy code lên GitHub.** Vercel build lại, lần mở app kế tiếp
đã là bản mới. Không gửi file, không cài lại, không chờ kiểm duyệt, không ai phải làm gì.

Đây là điểm mà PWA **hơn hẳn** app native: với app native, mỗi lần sửa lỗi là một lần
build lại và người kia phải cài lại.

### Chi phí

| Hạng mục | Chi phí |
|---|---|
| Vercel (hosting) | **$0** — gói miễn phí thừa sức cho 2 người dùng |
| Supabase | **$0** — xem [cost-estimate.md](cost-estimate.md) |
| Tài khoản nhà phát triển | **$0** — không cần |
| Tên miền riêng | $0 (dùng `*.vercel.app`) hoặc ~$10/năm nếu muốn tên đẹp |

**Tổng: $0.** Không store, không kiểm duyệt, không hết hạn, và link chỉ hai người biết.

## 3. Những lựa chọn đã cân nhắc và loại

| Lựa chọn | Vì sao loại |
|---|---|
| **Apple Developer + TestFlight** | $99/năm cho hai người dùng là không đáng. Bản build còn hết hạn sau 90 ngày, phải upload lại. |
| **Tài khoản Apple miễn phí, tự ký** | App **hết hạn sau 7 ngày**, cứ một tuần lại phải cắm máy cài lại. Không thể sống chung. |
| **Expo Go** | Chỉ là công cụ xem thử lúc code, không phải cách phân phối. Và **push từ xa không chạy trong Expo Go**. |
| **File APK Android** | Người yêu dùng iPhone → không giải quyết được vấn đề chính. Máy Android vẫn mở PWA bình thường. |

## 4. Ảnh hưởng ngược lại tới thiết kế

Vài điều nên tính từ đầu vì liên quan tới cách phân phối:

- **Widget coi như không có.** Đừng thiết kế gì phụ thuộc vào nó. Thứ thay thế: một push
  hằng ngày *"Hôm nay là ngày thứ 386 💕"* — cùng mục đích nhắc nhớ, rẻ hơn nhiều.
  Xem [p1-day-counter.md](../features/p1-day-counter.md) mục 4.
- **Thiết kế app sao cho vắng push vẫn dùng được.** Có kéo-để-tải-lại, có dấu chấm
  "có nội dung mới". Push là gia vị, không phải điều kiện sống.
- **Giữ giao diện đơn giản, tránh hiệu ứng nặng.** PWA chạy trên WebKit của Safari;
  animation phức tạp sẽ thấy khựng. Thiết kế phẳng, ít chuyển động — vốn cũng hợp với
  app kiểu này hơn.
- **Ảnh phải nén ở client.** Không có API ảnh cấp hệ thống như app native, nên cần xử lý
  cẩn thận bằng Canvas trước khi upload.
- **Nhớ thiết kế cho "vùng an toàn" của iPhone** (tai thỏ, thanh gạt dưới đáy) —
  dùng `env(safe-area-inset-*)` trong CSS, nếu không nội dung sẽ bị che.

## 5. Nếu sau này muốn lên App Store thật

Không có gì mất đi. Code React giữ nguyên; dùng **Capacitor** bọc thư mục `dist/` thành
app iOS/Android thật — có push native, có quyền hệ thống, và **có widget**.

Điều kiện khi đó:

| Cần gì | Ghi chú |
|---|---|
| $99/năm Apple Developer | Không tránh được, với bất kỳ con đường nào |
| Máy Mac để build bản iOS | Hoặc thuê dịch vụ build cloud (Codemagic, Ionic Appflow) |
| Qua kiểm duyệt App Store | Chỉ khi muốn phát hành công khai; TestFlight nội bộ thì không cần |

Quyết định đó nên đưa ra **sau khi đã dùng app thật vài tháng**, khi biết mình thật sự
thiếu gì — không phải đoán mò bây giờ.
