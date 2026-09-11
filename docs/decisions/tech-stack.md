# Khuyến nghị nền tảng công nghệ

**Bối cảnh:** giai đoạn đầu chỉ 2 người dùng (bạn + người yêu), nhưng kiến trúc phải mở
đường để sau này nhiều người dùng vẫn phát triển tiếp được. Chủ dự án đang **vibe code**,
làm trên **Windows**, không có Mac.

> ### Quyết định D2 — đã chốt 2026-09-11
>
> **Dùng web thuần: Vite + React + TypeScript + Tailwind, đóng gói thành PWA.**
> **Không** dùng React Native / Expo.
>
> Lý do đổi so với khuyến nghị ban đầu: sau khi chốt cả hai người dùng iPhone và
> [đầu ra chính là PWA](distribution.md), toàn bộ lợi thế của Expo (build native, EAS,
> OTA update) đều **không dùng tới**, trong khi cái giá của nó thì vẫn phải trả.
> Chi tiết ở mục "Vì sao không dùng Expo nữa" bên dưới.

## Khuyến nghị

| Lớp | Chọn | Lý do |
|---|---|---|
| **Giao diện** | **Vite + React + TypeScript** | Công cụ web tiêu chuẩn. Chạy `npm run dev` là có ngay, sửa file thấy đổi liền. Ít thứ phải cấu hình nhất. |
| **CSS** | **Tailwind CSS** | Viết giao diện nhanh, và là thứ AI viết chuẩn nhất — quan trọng khi vibe code. Chế độ tối và biến màu có sẵn. |
| **Đóng gói PWA** | `vite-plugin-pwa` | Sinh manifest + service worker tự động. Cài ra màn hình chính iPhone như app thật. |
| **Backend** | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | Không đổi. Xem phân tích bên dưới. |
| **Push** | **Web Push (VAPID)** + Edge Function | Đường duy nhất cần làm, vì cả hai máy đều là iPhone/PWA. Đơn giản hơn hẳn so với phải nuôi hai nhánh. |
| **State/data** | TanStack Query + Zustand | Query lo cache/đồng bộ server, Zustand lo state UI. Không đổi. |
| **Điều hướng** | React Router | Tiêu chuẩn của web React. |
| **Ảnh** | `<input type="file">` + nén bằng Canvas + Supabase Storage | Nén **trước khi upload** ngay từ ngày đầu — về sau đây là khoản chi phí lớn nhất. |
| **Deploy** | Vercel (hoặc Netlify/Cloudflare Pages) | Nối với GitHub, đẩy code là tự deploy. Miễn phí ở quy mô này. |

### Trả lời thẳng câu hỏi "dev xong thì build dùng được chứ?"

Được, và thực ra còn **đơn giản hơn** app native:

```
npm run build      → ra thư mục dist/
đẩy lên Vercel     → có một đường link https://...
mở link trên iPhone → Safari → Chia sẻ → "Thêm vào MH chính"
```

Xong. Trên màn hình iPhone có icon riêng, mở ra **không thấy thanh địa chỉ Safari**,
chạy toàn màn hình như app thường. Không cần cài đặt, không qua store, không hết hạn.

**Cập nhật app cũng chỉ là đẩy code lên GitHub** — Vercel tự build, lần sau mở app đã là
bản mới. Không phải gửi file APK, không phải chờ ai cài lại gì.

## Vì sao không dùng Expo nữa

Khuyến nghị ban đầu là Expo, và nó đúng — **với giả định làm app native**. Giả định đó
đã đổi. Đặt cạnh nhau:

| | Expo (React Native) | Vite + React (PWA) |
|---|---|---|
| Lợi thế chính: build app native iOS/Android | ✅ | ❌ |
| …nhưng có dùng tới không? | **Không** — không mua Apple Developer $99/năm | — |
| Viết giao diện | `StyleSheet` của React Native, thẻ `<View>` `<Text>` | HTML + CSS/Tailwind thông thường |
| Lượng ví dụ trên mạng, chất lượng code AI sinh ra | Ít hơn, dễ lẫn giữa RN và RN-Web | **Nhiều nhất** — đây là loại code phổ biến nhất thế giới |
| Thư viện dùng được | Phải chọn loại hỗ trợ RN | Gần như mọi thư viện web |
| Xuất bản PWA | Có (`expo export --platform web`) nhưng là công dụng phụ, hay vướng | **Là mục đích chính** |
| Xem thử lúc code | Cần app Expo Go trên máy thật | Mở trình duyệt, F12 xem như trên điện thoại |
| Số lớp có thể hỏng | React → React Native → RN-Web → trình duyệt | React → trình duyệt |

Dòng cuối là dòng quan trọng nhất với người mới: **ít lớp hơn thì khi lỗi, dễ biết lỗi ở đâu.**

## Còn tương lai thì sao?

Đây là phần bạn hỏi, và là lý do lựa chọn này an toàn:

**Nếu sau này muốn app thật trên App Store** — dùng **Capacitor**. Nó lấy **đúng** thư mục
`dist/` vừa build, bọc lại thành app iOS/Android thật: có icon trong store, có push native,
có quyền truy cập camera/ảnh ở mức hệ thống.

> **Không phải viết lại gì.** Code React giữ nguyên, chỉ thêm một lớp bọc bên ngoài.

Điều kiện khi đó: $99/năm Apple Developer, và **cần máy Mac** để build bản iOS (hoặc thuê
dịch vụ build trên cloud). Nhưng đó là chuyện của lúc bạn đã dùng app vài tháng và biết
mình thật sự cần gì — không phải chuyện phải quyết bây giờ.

Nếu đi đường Expo thì lúc đó cũng vẫn phải trả $99 y hệt. Nên Expo **không** mua thêm
được sự tự do nào mà Capacitor không có.

### Cái thật sự mất khi bỏ Expo

Nói cho công bằng, có hai thứ:

- **Widget** — nhưng đã quyết để sau rồi, vì PWA không có widget và cả hai đều dùng iPhone.
- **Một số API sâu của hệ điều hành** (đọc danh bạ, chạy nền liên tục, truy cập ảnh ở mức
  thư viện). App này không cần thứ nào trong đó.

## Vì sao Supabase chứ không phải Firebase

Đây là quyết định quan trọng nhất, vì nó khó đảo ngược:

- **Postgres + Row-Level Security khớp chính xác với mô hình "space".** Mọi bảng mang `couple_id`, một policy `couple_id IN (SELECT ... FROM memberships WHERE user_id = auth.uid())` là cô lập được dữ liệu ở tầng database. Không phụ thuộc vào việc app nhớ lọc đúng — sai sót kiểu này ở app cho cặp đôi là thảm hoạ.
- **Chi tiêu và thống kê là bài toán quan hệ.** "Tổng chi theo danh mục theo tháng", "số dư nợ nhau", "Wrapped cuối năm" — trong SQL là vài câu query; trong Firestore là bảng đếm thủ công + cloud function cập nhật, dễ lệch số.
- **Có đường lùi.** Supabase là Postgres tiêu chuẩn, tự host được. Firestore thì khoá chặt.
- Realtime, Auth, Storage đều có sẵn — không cần tự dựng server ở giai đoạn đầu.

**Điểm yếu cần biết trước:** Supabase không có push notification tích hợp → phải tự nối
Web Push (VAPID), đẩy từ Edge Function / Database Webhook. Không khó, nhưng là việc thật —
xem [p1-notifications.md](../features/p1-notifications.md).

> **Cập nhật:** bạn có nền Laravel + Spring Boot → câu hỏi "vậy backend viết bằng gì" được trả lời riêng ở
> [backend-architecture.md](../design/backend/backend-architecture.md): Supabase **là** backend, không cần thêm tầng API;
> khi nào nên bổ sung Laravel và (quan trọng hơn) khi nào tuyệt đối không nên.

## Điều gì khiến tôi đổi khuyến nghị này

- **Bạn quyết định chi $99/năm cho Apple Developer** → lúc đó cân nhắc lại, nhưng cách rẻ
  nhất vẫn là giữ nguyên code và bọc bằng Capacitor, không phải viết lại bằng Expo.
- **Bạn thật sự cần widget màn hình khoá** → phải là app native, và phải có Mac.
- **Bạn đã thạo Flutter hoặc Kotlin** → dùng thứ mình quen; sự quen tay quan trọng hơn mọi
  lời khuyên ở đây. Supabase vẫn ghép được bình thường.

## Ba quyết định "làm ngay từ đầu" để sau mở rộng được

Đây là toàn bộ cái giá phải trả cho việc "thiết kế sẵn cho nhiều người dùng" — rất rẻ nếu làm từ đầu, rất đắt nếu sửa sau:

1. **Không hardcode một cặp đôi.** Ngay cả khi chỉ có 2 người dùng, vẫn tạo bảng `couples` và `couple_members`, mọi bảng đều mang `couple_id`. Đừng viết kiểu "user A và user B" — sau này gỡ ra không nổi.
2. **Bật RLS ngay từ bảng đầu tiên.** Bật sau đồng nghĩa phải rà lại toàn bộ query.
3. **Lưu ngày kỉ niệm dạng `date`, không phải `timestamp`.** Và tính số ngày theo lịch ở múi giờ của người dùng. Bỏ qua chỗ này thì countdown lệch 1 ngày, mà lỗi này rất khó phát hiện muộn.

Ngoài ba điều trên, cứ làm đơn giản nhất có thể. Đừng tối ưu cho lượng người dùng chưa tồn tại.
