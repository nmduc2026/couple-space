# Đưa lên Supabase thật + Vercel

> Các lệnh chạy trong thư mục `app/`. Project đã link sẵn
> (`supabase/.temp/project-ref`), không cần `supabase link` lại.

## Trạng thái

**Backend đã lên thật và đã chạy được** (12/09/2026). Kiểm trực tiếp, không
phỏng đoán:

| Thứ | Trạng thái |
|---|---|
| 22 migration | ✅ đã push hết |
| 4 Edge Function | ✅ đã deploy (`send-notification`, `send-reminders`, `export-data`, `export-pdf`) |
| Secrets | ✅ VAPID + CRON_SECRET |
| pg_cron | ✅ 3 job đang hoạt động |
| Dữ liệu mẫu | ✅ 16 bài · 20 ảnh · đủ mọi tính năng |
| RLS | ✅ kiểm bằng token thật của cả hai người, tất cả đạt |
| Xuất PDF | ✅ chạy thật: 16 bài → sách 13 trang |

Còn lại: Vercel + cài PWA lên iPhone (P1-34/35/36) và test push qua đêm
(P3-28). Cả bốn đều cần máy thật.

## Lệnh hay dùng

```bash
# Đổ lại dữ liệu mẫu (xoá sạch rồi seed lại)
SUPABASE_SERVICE_ROLE_KEY=... npm run seed -- --reset

# Kiểm chứng RLS bằng phiên thật của cả hai tài khoản
SUPABASE_SERVICE_ROLE_KEY=... npm run verify:rls
```

Lấy service role key: Dashboard → Settings → API → **service_role** (bản JWT
`eyJ...`, KHÔNG phải `sb_secret_...` vì API trả bản đó bị che). Đừng commit.

## Những cái bẫy đã vấp — ghi lại để khỏi vấp lại

Tất cả đều **build sạch** và chỉ lộ ra khi chạy thật:

| Vấp ở đâu | Chuyện gì xảy ra |
|---|---|
| `answers_read` | Policy tự truy vấn lại bảng nó bảo vệ → `42P17 infinite recursion`. Màn Câu hỏi trắng trơn vĩnh viễn. Phải bọc câu kiểm tra vào hàm `security definer` |
| `alter database ... set` | Bị từ chối: `postgres` trên Supabase không phải superuser. Tham số cron chuyển vào bảng trong schema `private` |
| `verify_jwt` | Mặc định BẬT, nên cron gọi `send-reminders` bằng `x-cron-secret` bị cổng API chặn trước khi hàm chạy. Phải tắt trong `config.toml` |
| `static_files` | Không khai báo thì CLI chỉ upload `index.ts` — font và wasm của `export-pdf` không đi theo |
| `WORKER_RESOURCE_LIMIT` | Đổi ảnh cả cuốn sách trong một lượt là hết bộ nhớ. Phải thu nhỏ ảnh trước **và** chia đợt qua nhiều lượt gọi |
| `Invalid Compact JWS` | Khoá service role dạng `sb_secret_` không phải JWT; Storage chỉ nhận nó ở header `apikey` |
| `try/catch` quá rộng | Bọc chung cả giải mã lẫn tải lên đã giấu mất lỗi trên suốt một vòng gỡ lỗi |

## Các bước đã chạy (để dựng lại từ đầu)

### 1. Sinh khoá và đặt secrets

```bash
# Sinh cặp VAPID + cron secret
node -e "
const c=require('crypto');
const {publicKey,privateKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const pub=publicKey.export({type:'spki',format:'der'}).subarray(-65);
console.log('VAPID_PUBLIC_KEY='+Buffer.from(pub).toString('base64url'));
console.log('VAPID_PRIVATE_KEY='+privateKey.export({format:'jwk'}).d);
console.log('CRON_SECRET='+c.randomBytes(32).toString('base64url'));
" > .vapid.env

npx supabase secrets set --env-file .vapid.env
```

`VAPID_SUBJECT` không cần đặt — function đã có mặc định
`mailto:hello@couple-space.app`. Đặt email thật vào đây nghĩa là gửi nó cho
push service của Apple/Google, cân nhắc trước khi làm.

**Chép `VAPID_PUBLIC_KEY` sang `app/.env`** (`VITE_VAPID_PUBLIC_KEY=`) — client
cần đúng khoá công khai đó để đăng ký push, lệch một ký tự là push im lặng
không tới.

Xong thì **xoá `.vapid.env`** (khoá riêng không thuộc về đĩa).

### 2. Deploy Edge Function

```bash
npx supabase functions deploy send-notification
npx supabase functions deploy send-reminders
npx supabase functions deploy export-data
npx supabase functions deploy export-pdf
```

`export-pdf` mang theo ~670KB tài sản trong `assets/` (2 font TTF + 2 file
wasm). Deploy xong kiểm tra chúng thật sự đi kèm:

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/export-pdf" \n  -H "Authorization: Bearer <token người dùng>" \n  -H "Content-Type: application/json" \n  -d '{"export_id":"<id vừa tạo>"}'
```

Lỗi `NotFound` khi đọc `assets/...` nghĩa là Supabase không đóng gói file
tĩnh — lúc đó phải chuyển sang nhúng font/wasm dạng base64 trong mã nguồn.

### 3. Đặt hai giá trị cho cron

Trong SQL Editor của Dashboard (thay `<ref>` và `<cron_secret>`):

```sql
alter database postgres set app.project_url = 'https://<ref>.supabase.co';
alter database postgres set app.cron_secret = '<cron_secret>';
```

### 4. Push migration

```bash
npx supabase db push --dry-run   # xem trước
npx supabase db push
```

### 5. Kiểm tra cron đã lên lịch

```sql
select jobname, schedule, active from cron.job;
```

Phải thấy `couple-space-reminders` (mỗi giờ) và
`couple-space-reminders-cleanup` (mỗi chủ nhật 3:00).

### 6. Gọi thử function bằng tay

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/send-reminders" \
  -H "x-cron-secret: <cron_secret>" -H "Content-Type: application/json" -d '{}'
```

Trả về `{"candidates":n,"sent":n,"failed":0}` là đường ống thông.

### 7. Vercel + PWA (P1-34, P1-35)

Push GitHub → import vào Vercel → đặt biến môi trường
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`
→ deploy → mở bằng Safari trên iPhone → Chia sẻ → Thêm vào Màn hình chính.

**Web Push trên iOS chỉ chạy khi mở từ icon màn hình chính**, không chạy
trong tab Safari. Thử push trong tab rồi kết luận "push hỏng" là kết luận sai.

### 8. Chạy checklist DoD Phase 1

Năm mục trong [phase-01/context.md](phase-01/context.md) mục 1.

## Còn phải làm bằng tay

| Task | Việc |
|---|---|
| P1-34 | Push GitHub → nối Vercel → deploy |
| P1-35 | Cài PWA lên iPhone cả hai người |
| P1-36 | Chạy checklist DoD ở [phase-01/context.md](phase-01/context.md) mục 1 |
| P3-28 | Đặt sự kiện cho ngày mai, để máy qua đêm, xác nhận push tới đúng giờ |

P5-06, P5-16 và P6-48 **đã xong** — `npm run verify:rls` làm thay, bằng phiên
đăng nhập thật của cả hai tài khoản.
