# E. Thông báo — P1-21 → P1-25

Đặc tả: [p1-notifications.md](../../../docs/features/p1-notifications.md).

> ⚠️ **Làm nhóm này sớm, đừng để cuối phase.** Đây là phần dễ vỡ kế hoạch nhất: nó phụ thuộc
> vào hành vi của iOS mà bạn không kiểm soát được. Phát hiện trục trặc ở tuần cuối thì hỏng
> cả lộ trình nhắc nhở của Phase 3.

**Tin tốt:** cả hai máy chạy **iOS 26**, thừa điều kiện (cần 16.4+). Và vì bỏ app native nên
**chỉ có một đường gửi duy nhất** — Web Push (VAPID), không cần FCM/APNs/Expo Push.

---

## P1-21 · Sinh cặp khoá VAPID

**Mục tiêu:** có cặp khoá để trình duyệt tin rằng thông báo đến từ server của bạn.

**Các bước**

1. Sinh khoá (chạy một lần duy nhất cho cả đời dự án):
   ```powershell
   npx web-push generate-vapid-keys
   ```
   Ra hai chuỗi: **Public Key** và **Private Key**.

2. Cất đúng chỗ:

   | Khoá | Cất ở đâu | Lý do |
   |---|---|---|
   | Public | `app/.env.local` → `VITE_VAPID_PUBLIC_KEY` | App cần nó để đăng ký, lộ ra không sao |
   | Private | **Supabase → Edge Function secrets** | Chỉ server dùng. **Không bao giờ** để trong code app |

3. Lưu lại cả hai vào nơi an toàn (trình quản lý mật khẩu). **Mất khoá riêng thì mọi đăng ký
   push hiện có đều hỏng**, phải bắt cả hai người đăng ký lại.

**Xong khi:** hai khoá đã nằm đúng hai chỗ, và `.env.local` vẫn nằm trong `.gitignore`.

---

## P1-22 · Đăng ký Web Push từ app

**Mục tiêu:** iPhone đăng ký nhận thông báo, và server biết gửi đi đâu.

**Các bước**

1. Migration bảng lưu đăng ký:
   ```sql
   create table public.push_subscriptions (
     id         uuid primary key default gen_random_uuid(),
     user_id    uuid not null references public.profiles(id) on delete cascade,
     endpoint   text not null unique,
     p256dh     text not null,
     auth       text not null,
     created_at timestamptz not null default now()
   );
   ```
   Nhớ **bật RLS** cho bảng này: mỗi người chỉ đọc/ghi đăng ký của chính mình.

2. Trong app, khi người dùng bấm bật thông báo:
   ```ts
   const perm = await Notification.requestPermission()
   const reg  = await navigator.serviceWorker.ready
   const sub  = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: <public key dạng Uint8Array>,
   })
   // lưu sub.endpoint + sub.keys.p256dh + sub.keys.auth vào database
   ```

3. Trong service worker, xử lý sự kiện `push` để hiện thông báo, và `notificationclick` để
   mở đúng màn hình.

**Xong khi:** bật thông báo trên iPhone → một dòng mới xuất hiện trong `push_subscriptions`.

**Bẫy**
- **Chỉ chạy được khi PWA đã được "Thêm vào Màn hình chính".** Mở trong tab Safari thì
  `requestPermission()` sẽ thất bại — không phải code sai.
- iOS **chỉ cho xin quyền ngay sau một thao tác của người dùng** (bấm nút). Gọi tự động lúc
  mở app sẽ bị từ chối thẳng.
- `applicationServerKey` phải chuyển từ chuỗi base64url sang `Uint8Array`. Đây là lỗi phổ
  biến nhất khi làm Web Push lần đầu.
- **Xin quyền đúng lúc.** Đừng hỏi ngay màn hình đầu tiên — hỏi sau khi người dùng vừa làm
  xong việc gì đó có ý nghĩa (tạo space xong). Bị từ chối một lần là iOS không hỏi lại nữa.

---

## P1-23 · Edge Function gửi thông báo

**Mục tiêu:** có một chỗ duy nhất để gửi thông báo, mọi tính năng sau này đều gọi vào đó.

**Các bước**

1. Tạo function:
   ```powershell
   npx supabase functions new send-notification
   ```

2. Nội dung function nhận vào: `user_id` người **nhận**, tiêu đề, nội dung, đường dẫn mở khi
   bấm vào. Rồi:
   - đọc mọi `push_subscriptions` của người đó
   - gửi bằng thư viện `web-push` với khoá riêng lấy từ secrets
   - đăng ký nào trả về lỗi 404/410 → **xoá khỏi database** (máy cũ, đã gỡ app)

3. Đặt secret và deploy:
   ```powershell
   npx supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=mailto:...
   npx supabase functions deploy send-notification
   ```

4. **Không bao giờ gửi thông báo về hành động của chính mình** — chặn ngay trong function này,
   đừng để mỗi nơi gọi tự nhớ.

**Xong khi:** gọi function bằng `curl` với `user_id` của mình → iPhone kêu.

**Bẫy**
- Đây là chỗ **duy nhất** được gửi push. Mọi tính năng sau (bài mới, bình luận, nhắc sự kiện)
  đều gọi vào đây. Viết rải rác mỗi nơi một kiểu thì sau này không sửa nổi.

---

## P1-24 · Thông báo đầu tiên

**Mục tiêu:** nối được đầu này với đầu kia — sự kiện thật sinh ra thông báo thật.

**Các bước**

1. Khi người thứ hai tham gia space (P1-19), gọi Edge Function gửi cho người thứ nhất:
   > *"Linh đã vào không gian của hai bạn 🎉"*

2. Bấm vào thông báo → mở app ở Home.

3. Gọi từ đâu? Hai cách, chọn một:
   - **Database trigger/webhook** khi có dòng `couple_members` mới — chắc chắn hơn
   - Gọi thẳng từ app sau khi tham gia thành công — đơn giản hơn

   Phase 1 chọn cách nào cũng được, nhưng từ Phase 2 trở đi nên chuyển sang trigger.

**Xong khi:** hai máy thật, người thứ hai bấm [Tham gia] → máy người thứ nhất kêu trong vài giây.

---

## P1-25 · Hướng dẫn "Thêm vào Màn hình chính"

**Mục tiêu:** không có bước này thì **không có push**, và cả nhóm E thành vô nghĩa.

**Các bước**

1. Phát hiện app đang chạy trong tab Safari hay đã cài ra màn hình chính:
   ```ts
   const isStandalone = window.matchMedia('(display-mode: standalone)').matches
   ```

2. Nếu **chưa** cài, hiện một màn hình hướng dẫn có hình minh hoạ:
   ```
   Để nhận được thông báo, hãy thêm app vào Màn hình chính:
     1. Bấm nút Chia sẻ ⬆️ ở thanh dưới
     2. Chọn "Thêm vào Màn hình chính"
     3. Bấm Thêm
   ```

3. Đặt bước này **trong onboarding**, ngay sau khi tạo/tham gia space — lúc người dùng đang
   có động lực cao nhất.

4. Cho phép **[Để sau]**, nhưng nhắc lại một lần ở Cài đặt. Không nài.

**Xong khi:** mở link trong Safari thấy hướng dẫn; mở từ icon màn hình chính thì hướng dẫn
biến mất.

**Bẫy**
- Người dùng rất hay mở link trong **Chrome trên iPhone** — mà Chrome iOS **không** có mục
  "Thêm vào Màn hình chính". Phải phát hiện và nói rõ: *"Hãy mở link này bằng Safari"*.
