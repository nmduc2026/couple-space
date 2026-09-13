# H. Đưa lên máy thật — P1-34 → P1-36

Đây là lúc app rời khỏi máy tính của bạn và vào điện thoại hai người.
Chi tiết cách phân phối: [distribution.md](../../../docs/decisions/distribution.md).

---

## P1-34 · GitHub + Vercel

**Mục tiêu:** đẩy code là app tự cập nhật, không phải làm gì thêm.

**Các bước**

1. Tạo repo trên GitHub (**để private**) và đẩy code lên:
   ```powershell
   git init
   git add .
   git commit -m "Phase 1"
   git remote add origin https://github.com/<ten>/couple-space.git
   git push -u origin main
   ```
   Kiểm tra `.env.local` **không** bị đẩy lên — đây là lỗi hay gặp và khó thu hồi.

2. Vào [vercel.com](https://vercel.com), đăng nhập bằng GitHub, import repo.

3. Cấu hình:

   | Mục | Giá trị |
   |---|---|
   | Framework Preset | Vite |
   | Root Directory | `app` ← **quan trọng**, vì code nằm trong thư mục con |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |

4. Thêm biến môi trường trong Vercel (Settings → Environment Variables):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`.

5. Deploy. Vercel trả về link dạng `https://couple-space-xxx.vercel.app`.

6. Đổi sang tên dễ nhớ trong Settings → Domains (vẫn miễn phí), ví dụ
   `https://minh-linh.vercel.app`. Hai người sẽ gõ link này một lần duy nhất, nên cũng nên dễ đọc.

**Xong khi:** mở link trên máy tính, app chạy đúng như ở local.

**Bẫy**
- **Biến môi trường không tự chuyển từ máy bạn sang Vercel.** Quên bước 4 thì app deploy
  thành công nhưng trắng trang, và console báo lỗi Supabase URL rỗng.
- Sửa biến môi trường xong phải **deploy lại** mới có tác dụng.
- Từ giờ mỗi lần `git push` là Vercel tự deploy. Không cần làm gì thêm.

---

## P1-35 · Cài PWA lên iPhone cả hai người

**Mục tiêu:** app nằm trên màn hình chính của cả hai, có icon riêng.

**Các bước**

1. Gửi link cho người kia (Zalo/Messenger đều được).

2. **Nhấn mạnh: phải mở bằng Safari.** Chrome trên iPhone không có "Thêm vào Màn hình chính".
   Nếu link mở trong app nhắn tin thì bấm nút "Mở trong Safari".

3. Trên iPhone: Safari → Chia sẻ ⬆️ → **Thêm vào Màn hình chính** → Thêm.

4. Mở app **từ icon vừa tạo** (không phải từ Safari), đăng nhập, bật thông báo.

5. Kiểm tra icon và tên hiển thị đúng, mở ra không có thanh địa chỉ.

**Xong khi:** cả hai máy có icon riêng trên màn hình chính, mở ra toàn màn hình, đăng nhập được.

**Bẫy**
- **Đăng nhập trong Safari rồi mới cài PWA thì phải đăng nhập lại** trong PWA — chúng là hai
  kho lưu trữ riêng. Nên: cài trước, đăng nhập sau.
- Push **chỉ hoạt động khi mở từ icon**. Nếu ai đó cứ mở bằng link Safari thì sẽ không bao
  giờ nhận được thông báo mà không hiểu vì sao.

---

## P1-36 · Chạy hết checklist DoD

**Mục tiêu:** xác nhận Phase 1 **thật sự xong**, không phải "chắc là xong".

**Các bước** — làm trên **hai máy thật**, không phải trình duyệt máy tính:

- [ ] Cả hai đăng nhập được bằng email OTP (và mật khẩu nếu đã đặt)
- [ ] Người thứ nhất tạo space, người thứ hai vào bằng mã mời → cả hai thấy **cùng một space**
- [ ] Home hiện đúng số ngày yêu
- [ ] Thử đổi múi giờ một máy → số ngày vẫn hợp lý, không lệch bậy
- [ ] Người thứ hai tham gia → người thứ nhất **nhận được push**
- [ ] Đóng app, mở lại → vẫn đăng nhập, vẫn đúng space
- [ ] Bật chế độ máy bay → app vẫn mở được, hiện dải "đang ngoại tuyến"
- [ ] Huỷ ghép đôi → space chuyển chỉ đọc, người kia được báo, tạo được space mới
- [ ] Thử bằng tài khoản thứ ba (ngoài space) → **không đọc được gì**

**Xong khi:** tất cả các dòng trên đều tick.

**Sau đó, bắt buộc:**
1. Cập nhật [../context.md](../context.md): đổi trạng thái sang ✅, thêm dòng nhật ký phiên
2. Cập nhật [../../README.md](../../README.md): đổi **Phase đang chạy** sang Phase 2
3. Trước khi bắt đầu Phase 2, viết nốt phần chi tiết cho
   [../../phase-02/context.md](../../phase-02/context.md) và tạo `phase-02/steps/`

> Nếu có dòng nào không tick được: **đừng sang Phase 2**. Ghi nó vào nhật ký phiên và xử lý
> nốt. Nợ kỹ thuật ở tầng nền móng là thứ đắt nhất.
