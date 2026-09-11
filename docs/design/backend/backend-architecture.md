# Backend: dùng Supabase, hay tự viết Laravel / Spring Boot?

> Tài liệu này bổ sung cho [tech-stack.md](../../decisions/tech-stack.md), viết sau khi biết bạn đã có nền Laravel + Spring Boot.

## 1. Trả lời ngắn

**Supabase là backend luôn, không cần viết thêm tầng API.** Nó không phải "database thuê ngoài" — nó là một Backend-as-a-Service đầy đủ:

| Thứ bạn thường tự viết | Supabase đã có sẵn |
|---|---|
| Đăng ký / đăng nhập / JWT / refresh token | **Auth** (email OTP, Google, Apple...) |
| Middleware `auth`, policy, `$this->authorize()` | **RLS** — nằm trong database, không nằm trong code |
| Controller + Resource + route CRUD | **PostgREST** — API REST tự sinh từ schema |
| WebSocket cho tính năng realtime | **Realtime** — lắng nghe thay đổi bảng |
| Upload file, signed URL, quản lý bucket | **Storage** |
| Service/Job xử lý logic phức tạp | **Edge Functions** (Deno/TypeScript) |
| `php artisan schedule:run` (cron) | **pg_cron** |
| Migration | **Supabase migrations** (file SQL) |

Cái file [database-schema.md](database-schema.md) bạn vừa có — chạy xong là **API đã tồn tại**. Không cần viết controller nào.

### Cụ thể thì app gọi cái gì?

Trong Laravel bạn viết `GET /api/posts` → controller → policy → Eloquent → Resource. Ở đây app gọi thẳng:

```ts
// Lấy timeline. Không có controller nào ở giữa.
const { data } = await supabase
  .from('posts')
  .select('*, post_media(*), comments(count), profiles!author_id(display_name)')
  .is('deleted_at', null)
  .order('happened_on', { ascending: false })
  .limit(20)
```

Câu này dịch thành một câu SQL, và **RLS tự động chèn điều kiện `where is_member_of(couple_id)`**. Không cần truyền `couple_id`, không thể quên kiểm tra quyền, không thể đọc trộm dữ liệu cặp đôi khác kể cả khi app bị sửa. Đây là điểm khác biệt cốt lõi so với REST API tự viết: **phân quyền nằm ở dữ liệu, không nằm ở code**.

Bên dưới nó vẫn là HTTP REST thật (PostgREST). Bạn muốn gọi bằng `curl` cũng được — SDK chỉ là lớp bọc cho tiện.

---

## 2. Vậy có nên tự viết Laravel / Spring Boot không?

Đây là ngã ba thật sự, nên tôi đặt cạnh nhau sòng phẳng.

### Phương án A — Supabase thuần (khuyến nghị cho giai đoạn này)

**Được:**
- Từ schema tới app chạy được: tính bằng ngày, không phải tuần.
- Không có server để deploy, để trả tiền, để vá bảo mật, để thức dậy lúc 2 giờ sáng.
- Realtime, storage, auth, push token — có sẵn, không phải nối.
- RLS chặn ở tầng database: an toàn hơn hẳn so với việc bạn nhớ gọi đúng policy ở đúng chỗ.

**Mất:**
- Logic nghiệp vụ phức tạp phải viết bằng `plpgsql` hoặc TypeScript (Edge Function) — không sướng bằng viết Service class trong Laravel.
- Test tự động cho logic trong SQL khó hơn PHPUnit/JUnit.
- Phụ thuộc một nhà cung cấp (nhưng xem mục 4 — mức phụ thuộc thấp hơn bạn nghĩ).

### Phương án B — Tự viết REST API (Laravel hoặc Spring Boot) + Postgres

**Được:**
- Bạn làm chủ hoàn toàn, dùng đúng thứ mình đã thạo.
- Logic phức tạp viết thoải mái, test dễ.
- Giá trị portfolio rõ ràng, nếu đó là mục tiêu.

**Mất — và đây là phần hay bị đánh giá thấp:**
- Phải tự làm auth, refresh token, quên mật khẩu, xác thực email.
- Phải tự làm upload ảnh + signed URL + dọn file rác.
- Phải tự làm realtime (WebSocket server, hoặc chấp nhận không có).
- Phải tự deploy, cấu hình HTTPS, backup, giám sát.
- **Và quan trọng nhất: mất RLS.** Backend kết nối bằng quyền cao nhất → mọi kiểm tra "người này có thuộc space này không" quay về nằm trong code bạn viết, ở từng endpoint. Quên một chỗ là lộ dữ liệu. Đây chính xác là loại lỗi mà app cho cặp đôi không được phép mắc.

Ước lượng: **3–5 tuần** làm hạ tầng trước khi có tấm ảnh kỉ niệm đầu tiên được đăng.

### Phương án C — Kết hợp (đường đi dài hạn)

Supabase làm nền (Auth + Postgres + RLS + Storage + Realtime), **và khi nào thật sự cần** thì thêm một service Laravel/Spring Boot nối vào **cùng cái Postgres đó**.

App gọi Supabase cho 90% việc (CRUD, realtime, ảnh), gọi service riêng cho phần nghiệp vụ nặng. Đây là cách nhiều đội đang làm thật, và là chỗ kỹ năng backend của bạn phát huy đúng lúc.

---

## 3. Khuyến nghị

**Giai đoạn 1 (bây giờ → app dùng được): Phương án A, Supabase thuần.**

Lý do không phải "Supabase xịn hơn Laravel". Lý do là **mục tiêu của bạn lúc này là có app để hai người dùng, không phải có backend đẹp.** Ba tuần dựng hạ tầng auth/storage/realtime là ba tuần không có kỉ niệm nào được lưu — mà app này chỉ có giá trị khi đã tích được dữ liệu.

Và nền Laravel/Spring Boot của bạn **không hề lãng phí**: nó là lý do bạn đọc file schema kia thấy dễ hiểu. Bạn đã quen thiết kế quan hệ, khoá ngoại, migration, transaction — đó là 80% việc ở đây. Chỉ có chỗ đặt logic là khác.

**Giai đoạn 2: thêm backend riêng khi gặp một trong bốn dấu hiệu sau.** Đừng thêm trước.

1. **Cần giữ bí mật khoá.** Gọi API trả phí, tích hợp AI, thanh toán — khoá không được nằm trong app.
2. **Xử lý nặng.** Sinh video/ảnh "Wrapped" cuối năm, xuất PDF cuốn album, xử lý ảnh hàng loạt.
3. **Logic viết bằng SQL thì đau.** Khi một Postgres function vượt quá ~100 dòng, đó là tín hiệu.
4. **Bạn muốn nó cho portfolio.** Đây là lý do chính đáng — nhưng hãy làm nó *sau* khi app đã chạy, không phải trước.

**Nếu tới lúc đó: chọn Laravel, không phải Spring Boot** — cho dự án cỡ này. Laravel có Queue (gửi push hàng loạt), Scheduler (nhắc sự kiện), Storage, Mail sẵn trong một gói; Spring Boot mạnh hơn nhưng cần nhiều cấu hình hơn cho cùng một kết quả. Spring Boot chỉ nên chọn nếu mục tiêu *chính là* rèn Spring Boot.

### ⚠️ Cái tuyệt đối đừng làm

**Đừng đặt Laravel làm lớp proxy CRUD ở giữa app và Supabase.**

```
App → Laravel → Supabase        ❌  tệ nhất trong mọi phương án
```

Vì bạn sẽ: mất realtime, mất RLS (Laravel kết nối bằng service key nên bỏ qua toàn bộ policy), gấp đôi độ trễ mỗi request, và viết lại bằng tay đúng những controller mà PostgREST đã cho không. Đây là cái bẫy phổ biến nhất khi một backend dev gặp BaaS lần đầu — cảm giác "phải có tầng API của mình" là thói quen nghề nghiệp, không phải nhu cầu kỹ thuật.

Kiến trúc đúng khi cần backend riêng là **song song, không phải nối tiếp**:

```
       ┌──────────────► Supabase (auth, CRUD, realtime, storage)
App ───┤
       └──────────────► Laravel  (chỉ những việc Supabase không làm được)
                            │
                            └──► cùng một Postgres
```

Laravel xác thực người dùng bằng cách **verify JWT do Supabase Auth cấp** (JWT chuẩn, có secret trong dashboard) — không tự làm auth riêng, tránh hai hệ thống tài khoản.

---

## 4. Mức phụ thuộc nhà cung cấp — thấp hơn bạn nghĩ

Đây là lo ngại chính đáng nhất, nên nói rõ:

| Thành phần | Rời đi có dễ không? |
|---|---|
| Database | **Rất dễ.** Postgres tiêu chuẩn. `pg_dump` là xong, schema và RLS chạy nguyên trên bất kỳ Postgres nào. |
| Storage | **Dễ.** Tương thích S3, file là file. |
| Auth | **Trung bình.** JWT chuẩn, nhưng bảng `auth.users` phải chuyển thủ công. |
| Edge Functions | **Phải viết lại** — nhưng chúng vốn nhỏ, và trong kiến trúc này chỉ có vài cái. |
| Realtime | Phải viết lại nếu tự host. |

Toàn bộ Supabase là **mã nguồn mở, tự host được** bằng Docker. Nghĩa là kịch bản xấu nhất không phải "mất hết", mà là "dựng lại trên VPS của mình". So với các BaaS đóng như Firebase thì đây là khác biệt lớn — và là lý do tôi khuyên Supabase ngay từ đầu.

---

## 5. Vậy còn "viết theo hướng RESTful"?

Câu trả lời gồm hai phần:

**Bạn đã có REST rồi, tự động.** PostgREST sinh ra endpoint REST đúng chuẩn từ schema: `GET /rest/v1/posts?select=*&order=happened_on.desc`, kèm filter, phân trang (`Range` header), quan hệ lồng nhau. Không cần thiết kế lại.

**Với phần logic không phải CRUD, đừng cố nhét vào REST.** Những thao tác như "dùng mã mời để ghép đôi" hay "huỷ ghép đôi" không phải là tạo/sửa/xoá một tài nguyên — chúng là **hành động**. Trong Laravel bạn hay giải quyết bằng một route kiểu `POST /api/invites/redeem`; ở đây tương đương chính xác là **RPC**:

```ts
await supabase.rpc('redeem_invite', { p_code: 'A7K2M9', p_my_nickname: 'Minh' })
```

Gọi ra `POST /rest/v1/rpc/redeem_invite` — vẫn là HTTP POST, vẫn có thể gọi bằng curl. Chỉ là nó ánh xạ tới một function trong database thay vì một controller. Ba hàm bạn đã có sẵn trong [database-schema.md](database-schema.md) (`create_couple`, `peek_invite`, `redeem_invite`) chính là "controller" của bạn, viết bằng plpgsql.

**Nguyên tắc phân chia cho dự án này:**

| Loại việc | Dùng gì |
|---|---|
| Đọc/ghi dữ liệu thông thường | Supabase SDK (PostgREST) — trực tiếp, có RLS bảo vệ |
| Thao tác chạm nhiều bảng, cần transaction | Postgres function + `rpc()` |
| Việc chạy theo lịch (nhắc sự kiện) | pg_cron → Edge Function → Web Push (VAPID) |
| Việc nặng / cần khoá bí mật | Edge Function, sau này là Laravel nếu cần |

---

## 6. Một ví dụ cụ thể: gửi thông báo nhắc sự kiện

Đây là thứ duy nhất trong MVP thật sự cần "chạy phía server", nên đưa vào đây cho dễ hình dung. Trong Laravel bạn sẽ làm bằng `Schedule::command()` + Queue. Tương đương ở đây:

```sql
-- pg_cron: mỗi ngày 8 giờ sáng giờ VN (01:00 UTC), gọi Edge Function
select cron.schedule(
  'daily-reminders',
  '0 1 * * *',
  $$
  select net.http_post(
    url     := 'https://<project>.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);
```

Edge Function `send-reminders` làm ba việc: truy vấn các sự kiện tới hạn nhắc → lấy `push_subscriptions` của thành viên (lọc theo `notification_prefs`) → gửi bằng thư viện `web-push`. Khoảng 50 dòng TypeScript.

Không có gì ma thuật ở đây — vẫn là cron gọi một hàm, y hệt tư duy Laravel Scheduler. Chỉ là bạn không phải nuôi một server chạy 24/7 để cron sống.

---

## 7. Chốt lại

- **Supabase là backend, không cần tầng API riêng ở giai đoạn này.**
- **REST bạn đã có sẵn**, sinh tự động từ schema; hành động không-phải-CRUD thì dùng RPC.
- **Đừng dựng Laravel làm proxy** trước app — mất RLS, mất realtime, được thêm việc.
- **Kỹ năng backend của bạn dùng vào việc thiết kế dữ liệu và RLS**, đó mới là phần quyết định chất lượng app này.
- **Khi nào cần thật thì thêm Laravel chạy song song**, cùng database, xác thực bằng JWT của Supabase.

Nếu sau khi cân nhắc bạn vẫn muốn tự viết backend ngay từ đầu — đó là lựa chọn hợp lý *nếu* mục tiêu học nghề quan trọng hơn tốc độ ra sản phẩm. Nói tôi biết, tôi sẽ dựng lại thiết kế theo hướng Laravel + Postgres, và schema hiện tại vẫn dùng lại được gần như nguyên vẹn — chỉ phần RLS chuyển thành Policy/Gate trong Laravel.
