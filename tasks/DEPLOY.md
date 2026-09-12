# Đưa lên Supabase thật + Vercel

> Các lệnh dưới đây chạy trong thư mục `app/`. Project đã link sẵn
> (`supabase/.temp/project-ref`), không cần `supabase link` lại.

## Trạng thái lúc viết file này

Kiểm tra trực tiếp trên project, không phải phỏng đoán:

| Thứ | Trạng thái |
|---|---|
| 8 migration Phase 1 | ✅ đã push |
| 10 migration Phase 2–6 + 3 migration mới | ❌ chưa push |
| Edge Function | ❌ chưa deploy cái nào (`functions list` rỗng) — nay có **4** hàm |
| Secrets | ❌ chưa đặt (`secrets list` rỗng) |
| pg_cron | ❌ chưa bật (nằm trong migration chưa push) |

## Thứ tự — không đảo được

Migration `20260913091000_phase3_cron.sql` tạo cron job gọi
`/functions/v1/send-reminders` và đọc `app.project_url` / `app.cron_secret`
từ DB settings. Push nó **trước** khi deploy function và đặt hai giá trị đó
thì mỗi giờ sẽ có một job bắn vào hư không.

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

## Việc phải làm bằng tay sau khi lên thật

| Task | Việc |
|---|---|
| P5-06 | Gọi API `question_answers` bằng token người **chưa** trả lời — phải không thấy câu của người kia |
| P5-16 | Gọi API `letters` bằng token thường — thư chưa tới ngày mở phải không trả về `body` |
| P6-48 | Thử wishlist bằng **hai tài khoản thật** — chủ wishlist không được thấy dấu "đã tính mua" |
| P3-28 | Đặt sự kiện cho ngày mai, để máy qua đêm, xác nhận push tới đúng giờ |

Ba việc đầu là kiểm chứng RLS. Policy viết đúng không có nghĩa là chạy đúng —
và đây là ba chỗ mà sai thì hỏng đúng cái tính năng đang bán.
