# A. Khởi tạo dự án — P1-01 → P1-05

Nhóm này chỉ dựng bộ khung, chưa có tính năng nào. Nhưng **hai quyết định ở đây theo dự án
tới cuối**: biến màu (P1-02) và cấu trúc thư mục (P1-01).

---

## P1-01 · Khởi tạo Vite + React + TypeScript

**Mục tiêu:** có một dự án chạy được bằng `npm run dev`.

**Các bước**

1. Mở PowerShell ở `C:\Work\couple-space`, tạo dự án:
   ```powershell
   npm create vite@latest app -- --template react-ts
   cd app
   npm install
   npm run dev
   ```
   Toàn bộ code nằm trong `app/`, tách khỏi `docs/` và `tasks/`.

2. Mở link `http://localhost:5173` mà terminal in ra. Thấy trang mẫu Vite là bước này xong.

3. Xoá phần mẫu: nội dung `src/App.tsx`, `src/App.css`, logo trong `src/assets/`.

4. Tạo sẵn cấu trúc thư mục:
   ```
   app/src/
   ├── components/     ← thành phần dùng lại được (nút, ô nhập, thẻ)
   ├── features/       ← chia theo tính năng: auth/, pairing/, home/
   ├── lib/            ← supabase client, hàm tiện ích (đếm ngày…)
   ├── hooks/          ← custom hook
   └── types/          ← kiểu TypeScript dùng chung
   ```

5. Kiểm tra `.gitignore` (Vite tạo sẵn) có `node_modules` và `.env*`.

**Xong khi:** `npm run dev` chạy, trang hiện chữ của bạn chứ không phải trang mẫu Vite.

**Bẫy**
- Chia thư mục theo **tính năng** (`features/pairing/`) chứ đừng theo loại file
  (`containers/`, `reducers/`). App này lớn dần theo tính năng, không theo tầng.
- Đừng cài thêm thư viện ngoài danh sách ở
  [tech-stack.md](../../../docs/decisions/tech-stack.md). Mỗi thư viện thừa là một thứ
  phải hiểu thêm khi có lỗi.

---

## P1-02 · Tailwind + biến màu + chế độ tối

**Mục tiêu:** viết giao diện bằng Tailwind, và đổi theme sau này **không phải sửa khắp nơi**.

**Các bước**

1. Cài Tailwind:
   ```powershell
   npm install tailwindcss @tailwindcss/vite
   ```
   Thêm plugin vào `vite.config.ts`, rồi trong `src/index.css` đặt `@import "tailwindcss";`
   — làm theo trang cài đặt chính thức của Tailwind cho Vite, bước này họ đổi khá thường.

2. **Định nghĩa màu bằng biến CSS, không dùng màu cứng.** Trong `src/index.css`:
   ```css
   :root {
     --color-bg: #fdfcfb;
     --color-surface: #ffffff;
     --color-text: #1c1917;
     --color-muted: #78716c;
     --color-accent: #e11d48;   /* màu chủ đạo — theme đổi chính là dòng này */
     --color-border: #e7e5e4;
   }
   .dark {
     --color-bg: #1c1917;
     --color-surface: #292524;
     --color-text: #fafaf9;
     --color-muted: #a8a29e;
     --color-accent: #fb7185;
     --color-border: #44403c;
   }
   ```
   Khai báo chúng thành màu Tailwind để dùng được `bg-bg`, `text-accent`…

3. Bật chế độ tối theo cài đặt máy, cho phép ghi đè bằng cách thêm/bớt class `dark`
   trên thẻ `<html>`.

4. Thêm tiện ích cho **vùng an toàn iPhone** (tai thỏ, thanh gạt dưới đáy):
   ```css
   .pt-safe { padding-top: env(safe-area-inset-top); }
   .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
   ```

**Xong khi:** đổi một biến trong `:root` thì cả app đổi màu theo; bật chế độ tối của iPhone
thì app tự chuyển tối.

**Bẫy**
- **Task dễ bỏ qua nhất, và đắt nhất nếu bỏ qua.** Rải `bg-rose-500` khắp 50 file rồi mới
  muốn làm tính năng đổi theme là phải sửa cả 50 chỗ.
- Chế độ tối phải tính từ đầu — app này hay được mở buổi tối.

---

## P1-03 · Đóng gói thành PWA

**Mục tiêu:** cài được ra màn hình chính iPhone, có icon riêng, mở toàn màn hình.

**Các bước**

1. Cài plugin:
   ```powershell
   npm install -D vite-plugin-pwa
   ```

2. Thêm `VitePWA` vào `vite.config.ts`, đặt `registerType` là `autoUpdate`, và khai báo
   phần `manifest`:
   - `name`, `short_name` (tên dưới icon — nên ngắn: "Couple Space")
   - `display` đặt là `standalone` ← **dòng này là thứ làm mất thanh địa chỉ Safari**
   - `theme_color`, `background_color`
   - `icons`: tối thiểu 192×192 và 512×512, thêm một bản `maskable`

3. Tạo icon. Chưa có thiết kế thì làm tạm hình vuông màu chủ đạo với chữ cái đầu,
   đặt trong `public/`.

4. Thêm vào `index.html`:
   ```html
   <meta name="viewport"
         content="width=device-width, initial-scale=1, viewport-fit=cover">
   <meta name="apple-mobile-web-app-capable" content="yes">
   ```
   `viewport-fit=cover` là điều kiện để `env(safe-area-inset-*)` ở P1-02 có tác dụng.

**Xong khi:** `npm run build` rồi `npm run preview`, mở trên iPhone qua mạng LAN →
Safari → Chia sẻ → thấy **"Thêm vào Màn hình chính"**; cài xong mở ra **không thấy thanh
địa chỉ**.

**Bẫy**
- Service worker cache rất "lì". Lúc phát triển thấy sửa code mà app không đổi → xoá site
  data trong trình duyệt, hoặc tắt PWA ở chế độ dev.
- **Phải thử trên iPhone thật.** Chrome trên máy tính không giả lập đủ chính xác PWA iOS.

---

## P1-04 · React Router + khung điều hướng

**Mục tiêu:** app tự đưa người dùng tới đúng chỗ tuỳ trạng thái của họ.

**Các bước**

1. Cài: `npm install react-router`

2. Dựng ba nhóm route theo
   [screens-and-flows.md](../../../docs/design/frontend/screens-and-flows.md) mục 1:

   | Trạng thái | Route | Màn hình |
   |---|---|---|
   | Chưa đăng nhập | `/welcome`, `/login` | Welcome, nhập email, nhập OTP |
   | Đã đăng nhập, **chưa có space** | `/setup`, `/join`, `/waiting` | Tạo space / nhập mã / phòng chờ |
   | Đã có space | `/`, `/settings` | Home, Cài đặt |

3. Tạo component bọc (`RequireAuth`, `RequireCouple`) để tự chuyển hướng.
   Logic thật viết ở P1-14 — giờ chỉ dựng khung với dữ liệu giả.

4. Mỗi màn hình tạm thời chỉ cần một thẻ `div` ghi tên nó.

**Xong khi:** gõ tay từng đường dẫn trên trình duyệt đều ra đúng màn hình tương ứng.

**Bẫy**
- Chưa làm tab bar ở phase này. Phase 1 chỉ có Home + Cài đặt; tab bar 4 tab chỉ có nghĩa
  khi đã có Timeline (Phase 2).

---

## P1-05 · Kết nối Supabase

**Mục tiêu:** app gọi được tới Supabase.

**Các bước**

1. Vào [supabase.com](https://supabase.com), tạo tài khoản và một project mới.
   **Chọn region Singapore** — gần Việt Nam nhất, ảnh hưởng trực tiếp tới tốc độ.

2. Lưu lại hai giá trị trong Project Settings → API:
   - `Project URL`
   - `anon public key`

3. Cài client: `npm install @supabase/supabase-js`

4. Tạo `app/.env.local` (**không** commit lên GitHub):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

5. Tạo `src/lib/supabase.ts` khởi tạo client **một lần duy nhất** rồi export dùng chung.

6. Thử kết nối: gọi `supabase.auth.getSession()` và in kết quả ra console.

**Xong khi:** console in ra kết quả hợp lệ (session rỗng cũng được), không lỗi mạng.

**Bẫy**
- `anon key` là khoá **công khai**, lộ ra không sao — an toàn dựa vào RLS (P1-10), không
  dựa vào việc giấu khoá. Nhưng `service_role key` thì **tuyệt đối không** để trong code
  app: nó bỏ qua toàn bộ RLS.
- Thêm `.env.local` vào `.gitignore` **trước** khi commit lần đầu.
