# Hướng dẫn cài đặt Couple Space từ đầu

> **File này dành cho người không code.** Làm theo từ trên xuống, không cần
> hiểu bên trong chạy thế nào. Chỗ nào phải gõ lệnh thì đã viết sẵn nguyên
> câu — chép rồi dán.
>
> **Thời gian:** khoảng 1–2 giờ cho lần đầu.
> **Chi phí:** 0 đồng. Cả Supabase lẫn Vercel đều có gói miễn phí đủ dùng cho
> hai người.

---

## Mục lục

| Phần | Làm gì |
|---|---|
| [0. Chuẩn bị](#0-chuẩn-bị) | Tài khoản và phần mềm cần có |
| [1. Lấy mã nguồn](#1-lấy-mã-nguồn-về-máy) | Tải dự án về máy |
| [2. Tạo kho dữ liệu](#2-tạo-kho-dữ-liệu-supabase) | Tạo project Supabase |
| [3. Nối máy với kho](#3-nối-máy-của-bạn-với-kho-dữ-liệu) | Đăng nhập + link |
| [4. Tạo khoá thông báo](#4-tạo-khoá-cho-thông-báo-đẩy) | Sinh khoá VAPID |
| [5. Đưa 4 chương trình nền lên](#5-đưa-4-chương-trình-nền-lên) | Deploy Edge Function |
| [6. Tạo bảng dữ liệu](#6-tạo-bảng-dữ-liệu) | Chạy migration |
| [7. Khai báo cho bộ hẹn giờ](#7-khai-báo-cho-bộ-hẹn-giờ) | Tham số cron |
| [8. Khai báo cho app](#8-khai-báo-cho-app) | File `.env` |
| [9. Chạy thử trên máy](#9-chạy-thử-trên-máy) | Kiểm tra tại chỗ |
| [10. Đưa app lên mạng](#10-đưa-app-lên-mạng-vercel) | Vercel |
| [11. Cài lên iPhone](#11-cài-lên-iphone) | Thêm vào màn hình chính |
| [12. Kiểm tra lần cuối](#12-kiểm-tra-lần-cuối) | Danh sách đối chiếu |
| [Dữ liệu mẫu](#dữ-liệu-mẫu-tuỳ-chọn) | Đổ dữ liệu để thử |
| [Gặp lỗi thì xem đây](#gặp-lỗi-thì-xem-đây) | Lỗi thường gặp |

---

## 0. Chuẩn bị

### Ba tài khoản (đều miễn phí)

| Tài khoản | Dùng để làm gì | Đăng ký ở đâu |
|---|---|---|
| **GitHub** | Chứa mã nguồn | [github.com](https://github.com) |
| **Supabase** | Chứa dữ liệu, ảnh, gửi thông báo | [supabase.com](https://supabase.com) |
| **Vercel** | Chạy app trên mạng | [vercel.com](https://vercel.com) |

Mẹo: đăng ký Supabase và Vercel **bằng nút "Continue with GitHub"** để khỏi
nhớ thêm mật khẩu.

### Hai phần mềm

1. **Node.js** — [nodejs.org](https://nodejs.org), tải bản **LTS**.
   Cần từ phiên bản 20.19 trở lên.
2. **Git** — [git-scm.com](https://git-scm.com/downloads). Cứ bấm Next hết.

### Mở "cửa sổ dòng lệnh"

Mọi lệnh trong file này gõ ở đây.

- **Windows:** bấm phím Windows, gõ `PowerShell`, mở nó.
- **Mac:** bấm `Cmd + dấu cách`, gõ `Terminal`, mở nó.

Kiểm tra hai phần mềm đã cài đúng chưa — gõ:

```bash
node -v
git --version
```

Hiện ra hai dòng có số phiên bản là được, ví dụ `v20.19.6`. Nếu báo
*"not recognized"* hoặc *"command not found"* thì phần mềm chưa cài xong —
đóng cửa sổ dòng lệnh, mở lại, thử lại. Vẫn không được thì cài lại.

---

## 1. Lấy mã nguồn về máy

Nếu mã nguồn đã có sẵn trên máy thì bỏ qua, chỉ cần `cd` vào thư mục đó.

```bash
git clone https://github.com/<tên-tài-khoản>/couple-space.git
cd couple-space/app
npm install
```

`npm install` chạy vài phút để tải thư viện. Xong sẽ thấy dòng kiểu
*"added 400 packages"*.

> **Quan trọng:** từ đây trở đi, **mọi lệnh đều chạy trong thư mục `app`**.
> Lỡ đóng cửa sổ thì mở lại rồi `cd` vào đúng chỗ đó.

---

## 2. Tạo kho dữ liệu (Supabase)

1. Vào [supabase.com/dashboard](https://supabase.com/dashboard), bấm
   **New project**.
2. Điền:
   - **Name:** `couple-space`
   - **Database Password:** bấm **Generate a password**, rồi **lưu lại ngay**
     vào ghi chú hoặc trình quản lý mật khẩu. Mật khẩu này rất khó lấy lại.
   - **Region:** chọn **Southeast Asia (Singapore)** — gần Việt Nam nhất, app
     sẽ nhanh hơn.
3. Bấm **Create new project**, chờ 2–3 phút.

### Lấy "mã project"

Nhìn thanh địa chỉ trình duyệt, nó có dạng:

```
https://supabase.com/dashboard/project/abcdefghijklmnop
                                       └──────┬───────┘
                                        đây là mã project
```

Chuỗi đó gọi là **project ref**. Chép ra ghi chú, lát nữa dùng nhiều lần.

---

## 3. Nối máy của bạn với kho dữ liệu

### 3.1 Đăng nhập

```bash
npx supabase login
```

Lệnh này mở trình duyệt cho bạn bấm đồng ý. Xong quay lại cửa sổ dòng lệnh sẽ
thấy *"You are now logged in"*.

### 3.2 Nối

Thay `<mã-project>` bằng chuỗi bạn vừa chép ở bước 2:

```bash
npx supabase link --project-ref <mã-project>
```

Nếu nó hỏi **database password** thì dán mật khẩu đã lưu ở bước 2.

**Thấy gì là đúng:** *"Finished supabase link"*.

---

## 4. Tạo khoá cho thông báo đẩy

Thông báo đẩy cần một cặp khoá riêng. Trong thư mục `app`, chạy:

```powershell
node scripts/gen-vapid.cjs
```

Lệnh này tự tạo file `.vapid.env` gồm 3 dòng (ghi UTF-8, chạy được trên
PowerShell). Xem thử:

```powershell
Get-Content .vapid.env
```

Đại khái:

```
VAPID_PUBLIC_KEY=BIWXluicQB-K...
VAPID_PRIVATE_KEY=1Sut_GEpPzxb...
CRON_SECRET=G-YmmOT7p8zj...
```

Gửi ba khoá này lên Supabase:

```powershell
npx supabase secrets set --env-file .vapid.env
```

**Thấy gì là đúng:** `"count":3`.

> ⚠️ **Đừng đưa ba dòng này cho ai, đừng đăng lên mạng.** Ai có
> `VAPID_PRIVATE_KEY` là gửi được thông báo giả danh app của bạn.
>
> Nhưng **chưa xoá file `.vapid.env` vội** — bước 7 và bước 8 còn cần. Xoá ở
> [bước 12](#12-kiểm-tra-lần-cuối).
>
> **Đừng** dùng `node ... > .vapid.env` trên PowerShell — dấu `>` ghi file
> UTF-16, rồi lệnh `secrets set` sẽ báo *"No arguments found"*.

---

## 5. Đưa 4 chương trình nền lên

Bốn chương trình này lo: gửi thông báo, nhắc dịp đặc biệt, xuất dữ liệu, và
làm sách ảnh PDF.

```bash
npx supabase functions deploy send-notification
npx supabase functions deploy send-reminders
npx supabase functions deploy export-data
npx supabase functions deploy export-pdf
```

**Thấy gì là đúng:** mỗi lệnh kết thúc bằng *"Deployed Functions"*.

Riêng lệnh cuối phải thấy nó tải lên **6 file**, trong đó có 2 file `.ttf` và
2 file `.wasm`:

```
Uploading asset (export-pdf): .../assets/BeVietnamPro-Bold.ttf
Uploading asset (export-pdf): .../assets/BeVietnamPro-Regular.ttf
Uploading asset (export-pdf): .../assets/mozjpeg_enc.wasm
Uploading asset (export-pdf): .../assets/webp_dec.wasm
```

Chỉ thấy 2 file thì sách ảnh PDF sẽ hỏng về sau — xem
[Gặp lỗi thì xem đây](#gặp-lỗi-thì-xem-đây).

> **Vì sao bước này phải làm TRƯỚC bước 6?** Bước 6 tạo một bộ hẹn giờ, cứ mỗi
> tiếng lại gọi chương trình `send-reminders`. Làm ngược thứ tự thì mỗi tiếng
> nó gọi vào chỗ trống một lần.

---

## 6. Tạo bảng dữ liệu

Bước này tạo toàn bộ bảng, quy tắc phân quyền và bộ hẹn giờ.

Xem trước nó sẽ làm gì (chưa đụng vào dữ liệu):

```bash
npx supabase db push --dry-run
```

Thấy danh sách 20 file thì chạy thật:

```bash
npx supabase db push
```

**Thấy gì là đúng:** từng dòng *"Applying migration ..."*, cuối cùng là
*"Finished supabase db push"*.

### Kiểm tra bộ hẹn giờ đã lên lịch chưa

```bash
npx supabase db query --linked "select jobname, schedule, active from cron.job order by jobname"
```

Phải thấy đủ **3 dòng**:

| Tên | Chạy khi nào |
|---|---|
| `couple-space-reminders` | mỗi tiếng |
| `couple-space-reminders-cleanup` | mỗi chủ nhật 3 giờ sáng |
| `couple-space-exports-cleanup` | mỗi chủ nhật 3 giờ rưỡi sáng |

---

## 7. Khai báo cho bộ hẹn giờ

Bộ hẹn giờ vừa tạo ở bước 6 cần biết hai thứ: gọi đi đâu, và mật khẩu nào để
chứng minh nó là thật. Thiếu bước này thì nó vẫn chạy mỗi tiếng nhưng không
gửi được gì — và **không báo lỗi ở đâu cả**.

Chép nguyên khối dưới đây, **thay `<mã-project>` bằng mã của bạn**:

```bash
CRON=$(grep '^CRON_SECRET=' .vapid.env | cut -d= -f2)
npx supabase db query --linked "insert into private.app_config (key, value) values ('project_url', 'https://<mã-project>.supabase.co'), ('cron_secret', '$CRON') on conflict (key) do update set value = excluded.value"
```

**Trên Windows PowerShell** thì dòng đầu viết khác:

```powershell
$CRON = (Select-String '^CRON_SECRET=' .vapid.env).Line.Split('=')[1]
npx supabase db query --linked "insert into private.app_config (key, value) values ('project_url', 'https://<mã-project>.supabase.co'), ('cron_secret', '$CRON') on conflict (key) do update set value = excluded.value"
```

### Kiểm tra

```bash
npx supabase db query --linked "select key from private.app_config order by key"
```

Phải thấy đúng hai dòng: `cron_secret` và `project_url`.

---

## 8. Khai báo cho app

App cần biết ba thứ để nối được với kho dữ liệu.

### 8.1 Lấy hai giá trị từ Supabase

Vào Dashboard → biểu tượng ⚙️ **Project Settings** → **API Keys**. Chép:

- **Project URL** — dạng `https://<mã-project>.supabase.co`
- **publishable key** — dạng `sb_publishable_...`

> **Đừng lấy nhầm.** Trong trang đó còn có `service_role` và `secret` — hai
> khoá quản trị, bỏ qua mọi quy tắc phân quyền. Đưa chúng vào app là ai mở app
> cũng đọc được toàn bộ dữ liệu của người khác.

### 8.2 Tạo file `.env`

Trong thư mục `app`, tạo file tên đúng là `.env` (có dấu chấm ở đầu), gồm ba
dòng:

```
VITE_SUPABASE_URL=https://<mã-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_VAPID_PUBLIC_KEY=<dán VAPID_PUBLIC_KEY từ file .vapid.env>
```

Dòng thứ ba lấy từ `.vapid.env` ở bước 4 — chép đúng dòng `VAPID_PUBLIC_KEY`,
**không** phải dòng `PRIVATE`.

> Chép sai hoặc thiếu một ký tự ở dòng thứ ba thì app vẫn chạy bình thường,
> chỉ có thông báo đẩy là không bao giờ tới — mà không báo lỗi gì cả.

---

## 9. Chạy thử trên máy

```bash
npm run dev
```

Mở trình duyệt vào **http://localhost:5173**.

Làm thử cho hết một vòng:

1. Đăng nhập bằng email của bạn → Supabase gửi mã 6 số qua mail → nhập mã.
2. Tạo không gian, điền ngày bắt đầu yêu.
3. Màn hình chính hiện đúng số ngày.

Tới được đây nghĩa là **kho dữ liệu, phân quyền và đăng nhập đều đúng**.

Dừng lại: bấm `Ctrl + C` trong cửa sổ dòng lệnh.

---

## 10. Đưa app lên mạng (Vercel)

### 10.1 Đẩy mã nguồn lên GitHub

Nếu bạn `git clone` ở bước 1 thì bỏ qua. Nếu chưa có trên GitHub:

```bash
cd ..
git add -A
git commit -m "Cai dat lan dau"
git push
cd app
```

### 10.2 Nối Vercel

1. Vào [vercel.com/new](https://vercel.com/new), chọn kho `couple-space`.
2. **Đây là chỗ dễ sai nhất** — ở mục **Root Directory**, bấm **Edit** rồi
   chọn thư mục **`app`**.

   Mã nguồn nằm trong thư mục con; để trống mục này thì Vercel không tìm thấy
   gì và báo lỗi build.
3. Mở mục **Environment Variables**, thêm đúng ba dòng giống hệt file `.env` ở
   bước 8:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://<mã-project>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
   | `VITE_VAPID_PUBLIC_KEY` | khoá công khai ở bước 4 |

4. Bấm **Deploy**, chờ 1–2 phút.

Xong sẽ có địa chỉ dạng `https://couple-space-xxxx.vercel.app`. Mở thử bằng
máy tính trước cho chắc.

> **Sau này sửa gì thì sao?** Mỗi lần `git push`, Vercel tự deploy lại, không
> phải làm gì thêm.
>
> **Đổi biến môi trường thì sao?** Phải bấm **Redeploy** mới có hiệu lực — ba
> giá trị kia được nhúng vào lúc build chứ không đọc lúc chạy.

---

## 11. Cài lên iPhone

Làm trên **cả hai máy**.

1. Mở địa chỉ Vercel bằng **Safari** (bắt buộc Safari; Chrome trên iPhone
   không cài được).
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên đi lên, ở thanh dưới).
3. Kéo xuống, chọn **Thêm vào Màn hình chính**.
4. Bấm **Thêm**.

Giờ có một icon trên màn hình chính như app thật.

> ### ⚠️ Điều quan trọng nhất của bước này
>
> **Thông báo đẩy trên iPhone CHỈ chạy khi mở app từ icon màn hình chính.**
> Mở trong tab Safari thì không bao giờ có thông báo.
>
> Rất nhiều người thử trong tab Safari, không thấy thông báo, rồi kết luận là
> app hỏng. Nó không hỏng.

Mở app **từ icon**, vào **Cài đặt** trong app → bật **Bật thông báo trên máy
này** → iPhone hỏi quyền → chọn **Cho phép**.

Làm xong trên máy thứ hai thì ghép đôi: một người tạo mã mời, người kia nhập.

---

## 12. Kiểm tra lần cuối

Đánh dấu từng dòng:

- [ ] Cả hai người đăng nhập được bằng mã gửi qua email
- [ ] (Tuỳ chọn) Đặt mật khẩu trong Cài đặt → đăng xuất → đăng nhập bằng tab Mật khẩu
- [ ] Ghép đôi xong, cả hai thấy **cùng một không gian**
- [ ] Màn hình chính hiện **đúng số ngày yêu** trên cả hai máy
- [ ] Một người đăng ảnh → người kia **nhận được thông báo** trên iPhone
- [ ] Huỷ ghép đôi được, không gian chuyển sang chỉ đọc, người kia được báo

### Dọn dẹp

Xong hết rồi thì xoá file chứa khoá bí mật:

```bash
rm .vapid.env
```

(PowerShell: `Remove-Item .vapid.env`)

Khoá đã nằm an toàn trên Supabase rồi; giữ bản sao trên máy chỉ thêm rủi ro.
Sau này muốn đổi khoá thì làm lại bước 4 — nhớ cập nhật luôn cả `.env` và biến
môi trường trên Vercel.

---

## Dữ liệu mẫu (tuỳ chọn)

Muốn xem app trông thế nào khi đã dùng cả năm, mà không phải ngồi nhập tay.

**Điều kiện:** cả hai người đã đăng nhập ít nhất một lần và đã ghép đôi.

### Lấy khoá quản trị

Dashboard → ⚙️ **Project Settings** → **API Keys** → mục **service_role** →
bấm **Reveal** rồi chép. Khoá này dài, bắt đầu bằng `eyJ`.

> ⚠️ Khoá `service_role` **bỏ qua mọi quy tắc phân quyền**. Chỉ dùng trong cửa
> sổ dòng lệnh trên máy bạn. Không đưa vào `.env`, không đưa lên Vercel, không
> gửi cho ai.

### Chạy

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run seed
```

PowerShell:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
npm run seed
```

Sẽ có: 16 kỉ niệm kèm 20 ảnh, chi tiêu hai tháng, sự kiện sắp tới, mục tiêu,
câu hỏi 20 ngày, thư tương lai, tâm trạng 40 ngày, danh sách quán ăn, wishlist.

Muốn xoá sạch rồi đổ lại: thêm `-- --reset` vào cuối lệnh.

### Kiểm tra phân quyền

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run verify:rls
```

Lệnh này mở phiên đăng nhập thật của **cả hai người** rồi thử đọc trộm dữ liệu
của nhau. Phải thấy **"Tất cả đều đạt"**. Thấy dòng nào **HỎNG** thì dừng lại,
đừng dùng thật — nghĩa là có chỗ người này đọc được thứ chỉ người kia được
thấy.

---

## Gặp lỗi thì xem đây

| Hiện tượng | Nguyên nhân và cách sửa |
|---|---|
| `command not found: node` / `npx` | Chưa cài Node.js, hoặc cài xong chưa mở lại cửa sổ dòng lệnh. Đóng, mở lại. |
| `Cannot find project ref` | Chưa làm bước 3.2, hoặc đang đứng sai thư mục. Phải ở trong thư mục `app`. |
| `relation "private.app_config" does not exist` | Làm bước 7 trước bước 6. Làm bước 6 xong rồi quay lại bước 7. |
| Vercel build lỗi *"No framework detected"* | Quên đặt **Root Directory = `app`** ở bước 10.2. |
| App mở lên trắng trơn | Thiếu hoặc sai biến môi trường trên Vercel. Kiểm tra lại 3 dòng ở bước 10.3, sửa xong nhớ **Redeploy**. |
| Không nhận được email mã đăng nhập | Xem hộp thư rác. Gói miễn phí Supabase giới hạn vài email mỗi giờ — chờ một lát rồi thử lại. |
| Quên mật khẩu: bấm link email bị đá về Home / không đổi được MK | Thiếu Redirect URL. Dashboard → Authentication → URL Configuration → thêm `https://<app>.vercel.app/login/reset` (và localhost lúc dev). |
| `No arguments found. Use --env-file...` khi `secrets set` | File `.vapid.env` bị PowerShell ghi UTF-16 (thường vì dùng `>`). Chạy lại `node scripts/gen-vapid.cjs` rồi `npx supabase secrets set --env-file .vapid.env`. |
| Không có thông báo đẩy | Ba khả năng, theo thứ tự hay gặp: (1) đang mở trong tab Safari chứ không phải từ icon màn hình chính; (2) `VITE_VAPID_PUBLIC_KEY` sai hoặc thiếu; (3) chưa bấm Cho phép khi iPhone hỏi. |
| Nhắc dịp đặc biệt không tới, dù thông báo khác vẫn tới | Quên bước 7. Chạy lại bước 7 rồi kiểm bằng lệnh ở [Phụ lục A](#phụ-lục-a--cho-người-có-code). |
| Sách ảnh PDF chạy mãi không xong | Xem lại bước 5: lệnh deploy `export-pdf` có tải lên đủ 2 file `.ttf` và 2 file `.wasm` không. Thiếu thì chạy lại lệnh đó. |
| Màn "Câu hỏi mỗi ngày" trống trơn | Chưa chạy hết migration. Chạy lại `npx supabase db push`. |

### Xem app đang báo lỗi gì

Trên máy tính, mở app rồi bấm `F12` → chọn thẻ **Console**. Chữ đỏ ở đó là lỗi
thật, chép nguyên văn ra để tra hoặc đi hỏi.

### Xem chương trình nền đang báo lỗi gì

Dashboard → **Edge Functions** → chọn tên chương trình → thẻ **Logs**.

---

## Phụ lục A — Cho người có code

### Lệnh hay dùng

```bash
npm run dev              # chạy tại chỗ
npm run build            # build bản phát hành
npm run test             # chạy test
npm run lint             # soát mã app
npm run check:functions  # soát KIỂU cho Edge Function (Deno)
npm run shots            # chụp màn hình từng màn × 2 theme vào .shots/
```

> `npm run build` **không** kiểm Edge Function — `tsconfig.app.json` chỉ
> include `src`. Sửa function xong phải chạy `npm run check:functions`, nếu
> không thì lỗi kiểu chỉ lộ ra lúc chạy thật.
>
> Trong VS Code, mã function do **Deno LSP** lo (xem `.vscode/settings.json`).
> Thiếu tiện ích `denoland.vscode-deno` thì editor báo hàng chục lỗi giả kiểu
> *"Cannot find module 'npm:...'"* hoặc *"Cannot find name 'Deno'"* — đó là
> lỗi giả, cài tiện ích là hết.

### Gọi thử bộ nhắc bằng tay

```bash
curl -X POST "https://<mã-project>.supabase.co/functions/v1/send-reminders" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -H "Content-Type: application/json" -d '{}'
```

Trả về `{"candidates":n,"sent":n,"failed":0}` là đường ống thông. Trả 401 là
`CRON_SECRET` ở bước 4 và giá trị ở bước 7 không khớp nhau.

---

## Phụ lục B — Những cái bẫy đã vấp

Ghi lại để người sau khỏi mất thời gian. **Tất cả đều build sạch** và chỉ lộ
ra khi chạy trên hệ thống thật.

| Vấp ở đâu | Chuyện gì xảy ra |
|---|---|
| Quy tắc đọc `question_answers` | Quy tắc tự truy vấn lại chính bảng nó bảo vệ → `42P17 infinite recursion`, mọi lượt đọc đều hỏng, màn Câu hỏi trắng trơn vĩnh viễn. Phải bọc câu kiểm tra vào hàm `security definer` |
| `alter database ... set` | Bị từ chối: `postgres` trên Supabase không phải superuser. Tham số cron phải chuyển vào bảng trong schema `private` |
| `verify_jwt` | Mặc định BẬT, nên cron gọi `send-reminders` bằng `x-cron-secret` bị cổng API chặn trước khi hàm chạy. Phải tắt trong `config.toml` |
| `static_files` | Không khai báo thì CLI chỉ upload `index.ts` — font và wasm của `export-pdf` không đi theo |
| `WORKER_RESOURCE_LIMIT` | Đổi ảnh cả cuốn sách trong một lượt là hết bộ nhớ. Phải thu nhỏ ảnh trước **và** chia đợt qua nhiều lượt gọi |
| `Invalid Compact JWS` | Khoá `service_role` dạng `sb_secret_` không phải JWT; Storage chỉ nhận nó ở header `apikey` |
| `try/catch` quá rộng | Bọc chung cả giải mã lẫn tải lên đã giấu mất lỗi trên suốt một vòng gỡ lỗi |
| Link ký cất vào DB | `cover_url` từng lưu link ký hạn 1 năm — hết hạn là ảnh bìa biến mất, không gì ký lại. Lưu **đường dẫn**, ký lúc đọc |
| `auth.uid()` trong policy | Gọi thẳng thì Postgres tính lại **mỗi dòng**. Bọc `(select auth.uid())` mới thành InitPlan, tính một lần |
| Policy `FOR ALL` + policy `SELECT` | Hai policy permissive cùng phủ SELECT là mỗi lượt đọc chạy cả hai rồi OR. Tách `FOR ALL` thành INSERT/UPDATE/DELETE |
| `ReturnType<typeof createClient>` | Suy ra kiểu bảng là `never` → toàn bộ lời gọi DB trong file đó không hề được kiểm kiểu. Dùng thẳng `SupabaseClient` |
| Port `543xx` trên Windows | Dải 54306–54405 nằm trong danh sách Hyper-V giữ sẵn nên `supabase start` không bind được. `config.toml` đã dời sang `553xx` |

---

## Phụ lục C — Trạng thái hiện tại

Kiểm trực tiếp trên project ngày 12/09/2026:

| Thứ | Trạng thái |
|---|---|
| 20 migration | ✅ đã push |
| 4 Edge Function | ✅ đã deploy |
| Khoá VAPID + CRON_SECRET | ✅ đã đặt |
| Bộ hẹn giờ | ✅ 3 job đang chạy |
| Dữ liệu mẫu | ✅ 16 bài · 20 ảnh |
| Phân quyền | ✅ kiểm bằng phiên thật của cả hai, tất cả đạt |
| Xuất PDF | ✅ chạy thật: 16 bài → sách 13 trang |

Còn lại — đều cần máy thật, không làm hộ được:

| Task | Việc |
|---|---|
| P1-34 | Đẩy GitHub → nối Vercel → deploy (bước 10) |
| P1-35 | Cài PWA lên iPhone cả hai người (bước 11) |
| P1-36 | Chạy checklist (bước 12) |
| P3-28 | Đặt sự kiện cho ngày mai, để máy qua đêm, xác nhận push tới đúng giờ |
