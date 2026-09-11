# C. Đăng nhập — P1-11 → P1-14

Chỉ dùng **email OTP** (mã 6 số gửi qua email). Không làm đăng nhập Google/Apple ở Phase 1:
ít việc hơn, và không phụ thuộc cấu hình bên ngoài.

---

## P1-11 · Màn hình Welcome

**Mục tiêu:** màn hình đầu tiên người dùng thấy — và là thứ quyết định họ có đi tiếp không.

**Các bước**

1. Tạo `src/features/auth/WelcomeScreen.tsx`.

2. Nội dung tối giản:
   - Một hình/illustration hoặc chỉ một khối màu chủ đạo
   - Tên app + một câu định vị: *"Nơi hai người cùng viết lại chuyện tình của mình"*
   - Một nút duy nhất: **[Bắt đầu]** → `/login`

3. Dùng `pt-safe` / `pb-safe` từ P1-02 để không bị tai thỏ che.

**Xong khi:** mở `/welcome` trên iPhone thấy đẹp, không bị che, không cuộn ngang.

**Bẫy**
- Đừng làm onboarding nhiều trang vuốt ngang. Người dùng thứ hai vào đây khi đang được mời
  — họ muốn vào nhanh, không muốn đọc giới thiệu.

---

## P1-12 · Nhập email → gửi OTP

**Mục tiêu:** nhập email, nhận được mã 6 số trong hộp thư.

**Các bước**

1. Tạo `src/features/auth/EmailScreen.tsx`: một ô nhập email + nút [Tiếp tục].

2. Gọi Supabase:
   ```ts
   await supabase.auth.signInWithOtp({
     email,
     options: { shouldCreateUser: true },
   })
   ```

3. Xử lý ba trạng thái của nút: bình thường · đang gửi (khoá nút) · lỗi.

4. Gửi xong → chuyển sang màn hình nhập OTP, **mang theo email**.

5. Vào Supabase → Authentication → Email Templates, sửa lại nội dung email cho ra tiếng Việt
   và có tên app.

**Xong khi:** nhập email thật, trong vòng một phút nhận được email chứa mã 6 số.

**Bẫy**
- Mặc định Supabase gửi **magic link** (bấm vào link để đăng nhập) chứ không phải mã số.
  Cần sửa email template để hiển thị `{{ .Token }}` — mã số hợp với điện thoại hơn nhiều,
  vì bấm link hay mở nhầm trình duyệt khác và **mất phiên đăng nhập trong PWA**.
- Email hay rơi vào thư mục spam. Ghi sẵn dòng nhắc *"Không thấy email? Kiểm tra hộp thư rác"*.
- Supabase giới hạn số email gửi mỗi giờ ở gói miễn phí. Lúc test đừng bấm gửi liên tục.

---

## P1-13 · Nhập OTP → đăng nhập

**Mục tiêu:** nhập mã đúng thì vào được app, và **lần mở sau không phải đăng nhập lại**.

**Các bước**

1. Tạo `src/features/auth/OtpScreen.tsx`: 6 ô nhập (hoặc một ô `inputMode="numeric"`),
   tự chuyển ô, tự dán được mã copy từ email.

2. Xác thực:
   ```ts
   await supabase.auth.verifyOtp({ email, token, type: 'email' })
   ```

3. Thành công → Supabase tự lưu phiên vào `localStorage` và tự làm mới token.
   Tạo một hook `useSession()` lắng nghe `supabase.auth.onAuthStateChange`.

4. Thêm nút **[Gửi lại mã]**, khoá 60 giây sau mỗi lần gửi.

**Xong khi:** đăng nhập xong, **đóng hẳn app rồi mở lại vẫn còn đăng nhập**.

**Bẫy**
- **Thử kỹ trên PWA đã cài ra màn hình chính**, không chỉ trên tab Safari. PWA có kho lưu
  trữ riêng; nếu người dùng đăng nhập trong Safari rồi mới cài PWA thì PWA vẫn hỏi đăng nhập lại.
- Mã OTP có hạn (mặc định khoảng 1 giờ). Mã hết hạn phải báo rõ chứ đừng chỉ ghi "lỗi".
- iOS tự điền mã OTP từ tin nhắn/email — đặt `autoComplete="one-time-code"` để dùng được
  tính năng đó.

---

## P1-14 · Điều hướng theo trạng thái

**Mục tiêu:** mở app là vào **đúng** chỗ, không bao giờ thấy màn hình sai.

**Các bước**

1. Xác định ba trạng thái và thứ tự kiểm tra:

   ```
   Đang tải phiên?           → màn hình chờ (đừng nháy Welcome rồi mới nhảy vào Home)
     │
   Chưa đăng nhập?           → /welcome
     │
   Đã đăng nhập, chưa space? → /setup
     │
   Có space rồi              → /  (Home)
   ```

2. Viết hook `useCouple()`: đọc `couple_members` của user hiện tại, trả về
   `{ couple, isLoading }`. Dùng TanStack Query để cache, tránh gọi lại mỗi lần đổi màn hình.

3. Hoàn thiện `RequireAuth` và `RequireCouple` đã dựng khung ở P1-04.

4. **Trạng thái chờ giữa hai lần kiểm tra phải có màn hình riêng.** Đây là chỗ hay bị bỏ
   quên và gây nháy màn hình khó chịu mỗi lần mở app.

**Xong khi:** thử đủ bốn tình huống, mỗi lần mở app đều vào thẳng đúng màn hình, không nháy:
- chưa đăng nhập
- đã đăng nhập nhưng chưa tạo space
- đã tạo space, đang chờ người kia
- đã ghép đôi đủ hai người

**Bẫy**
- Người thứ nhất **đã tạo space nhưng chưa có người thứ hai** vẫn phải vào được Home —
  chỉ hiện thêm banner chờ. **Không chặn ở phòng chờ**: đó là cách nhanh nhất để người ta
  bỏ app. Xem [p1-pairing.md](../../../docs/features/p1-pairing.md) mục 3.
