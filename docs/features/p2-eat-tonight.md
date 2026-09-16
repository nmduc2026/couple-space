# Tính năng "Tối nay ăn gì?"

`Phase 2 → 5` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Nâng cấp từ mục 2.5 trong [overview.md](../../overview.md). Đây là tính năng có **tần suất dùng cao nhất** trong toàn bộ app — nên được đặc tả riêng.

## 1. Vì sao tính năng này đáng làm sớm

Mọi tính năng khác của Couple Space đều **lưu lại quá khứ**: kỉ niệm đã qua, tiền đã tiêu, ngày đã đếm. Cái này là tính năng duy nhất **giải quyết một vấn đề đang xảy ra**, và nó xảy ra gần như mỗi ngày.

Nó cũng khép kín vòng lặp với những gì đã thiết kế:

```
Lướt TikTok thấy quán ngon → thêm vào danh sách
                                    │
        "Tối nay ăn gì?" → quay ────┘
                │
                ▼
           Đi ăn thật
                │
    ┌───────────┴───────────┐
    ▼                       ▼
Đăng kỉ niệm            Ghi chi tiêu
    │                       │
    └───────────┬───────────┘
                ▼
   Tự cập nhật: lần thứ 4, trung bình 180k
                │
                └──► lần quay sau thông minh hơn
```

Không có tính năng nào khác trong app tạo được vòng lặp tự nuôi như vậy.

## 2. Hai khái niệm cần tách

Bạn mô tả gộp làm một ("mỗi món ăn thì có... địa chỉ ở đâu"), nhưng thực tế là hai câu hỏi khác nhau:

| | Ví dụ | Trả lời câu hỏi |
|---|---|---|
| **Món** | bún chả, lẩu thái, cơm tấm | *Hôm nay thèm gì?* |
| **Quán** | Bún chả Hàng Quạt, Lẩu Phan Đình Phùng | *Đi đâu?* |

Một món ăn được ở nhiều quán; một quán bán nhiều món. Nhưng **đừng tách thành hai bảng có quan hệ** — với hai người dùng thì đó là phức tạp hoá vô ích. Cách vừa đủ: **một bảng, thêm cột `kind`** để phân biệt. Quay ngẫu nhiên thì cho chọn: quay món, quay quán, hoặc trộn cả hai.

## 3. Nguyên tắc thiết kế quan trọng nhất

> **Thêm một mục phải chỉ tốn MỘT ô nhập: cái tên.**

Đây là chỗ tính năng này sống hoặc chết. Bạn muốn có đánh giá, giá cả, địa chỉ, số lần ăn — tất cả đều hữu ích, nhưng nếu thêm một quán phải điền 5 trường thì sau hai tuần không ai thêm nữa, danh sách đứng yên, và bánh xe quay mãi trên dữ liệu cũ. Tính năng chết.

Cách giữ cho nó sống:

| Thông tin | Lấy bằng cách nào |
|---|---|
| Tên | Nhập tay — **trường duy nhất bắt buộc** |
| Địa chỉ, link bản đồ | Dán link Google Maps, tuỳ chọn |
| Link nguồn (TikTok/Facebook) | Dán link, tuỳ chọn — dùng chia sẻ từ app khác vào |
| **Số lần ăn** | **Tự đếm** từ bảng lượt ghé |
| **Giá trung bình** | **Tự tính** từ chi tiêu đã gắn |
| **Lần cuối ăn** | **Tự suy ra** |
| Đánh giá | Hỏi **sau khi ăn**, một chạm — không hỏi lúc thêm |

Ba dòng "tự" ở giữa là phần thưởng của việc đã có Timeline và Chi tiêu từ trước.

## 4. Đánh giá: ba mức, không phải 5 sao

Mục đích duy nhất của đánh giá là **lọc cho lần quay sau**. Thang 1–5 sao tạo do dự ("cái này 3 hay 4 sao nhỉ?") mà không thêm thông tin dùng được.

Dùng ba mức, mỗi người một lựa chọn:

| | Ý nghĩa | Ảnh hưởng tới quay ngẫu nhiên |
|---|---|---|
| 😍 **Ngon, ăn lại** | | Tăng khả năng được chọn |
| 🙂 **Cũng được** | | Bình thường |
| 😕 **Thôi** | | Loại khỏi vòng quay |

**Cho mỗi người đánh giá riêng.** Đây là chi tiết hợp với app cặp đôi: "em thích, anh không" là thông tin thật và hữu ích — vòng quay mặc định chỉ chọn những chỗ **cả hai đều không chê**.

## 5. Quay ngẫu nhiên — cần thông minh hơn `random()`

Quay thuần ngẫu nhiên sẽ ra ngay món vừa ăn hôm qua, và người dùng mất tin tưởng sau vài lần. Bốn luật:

1. **Loại trừ gần đây** — bỏ qua những chỗ đã ăn trong 14 ngày qua (cho chỉnh).
2. **Loại chỗ bị chê** — ai đó chọn 😕 thì không quay ra nữa.
3. **Ưu tiên chưa thử** — mục đích của app là đẩy hai người đi khám phá, không phải quay về chỗ cũ. Cho "chưa từng ăn" trọng số cao hơn.
4. **Lọc trước khi quay** — theo loại (món/quán), theo thẻ (`gần nhà`, `lẩu`, `rẻ`), theo khoảng giá.

### Một ý làm nó thú vị hơn hẳn

**Quay đồng bộ trên hai máy.** Một người bấm quay, **cả hai máy cùng chạy hoạt ảnh và cùng dừng ở một kết quả**. Biến thao tác một mình thành khoảnh khắc chung.

Realtime đã có sẵn trong stack (Supabase). Không cần bảng mới — dùng kênh broadcast, gửi kết quả đã chọn cho cả hai cùng hiển thị. Làm sau khi bản cơ bản chạy được.

## 6. Schema

Chạy khi bắt tay làm tính năng này, không phải bây giờ.

```sql
-- ------------------------------------------------------------
-- eat_items: món ăn hoặc quán muốn thử / đã thử
-- ------------------------------------------------------------
create table public.eat_items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples(id) on delete cascade,
  kind        text not null default 'place' check (kind in ('dish', 'place')),
  name        text not null check (length(trim(name)) > 0),

  address     text,
  map_url     text,        -- link Google Maps dán vào
  source_url  text,        -- link TikTok/Facebook nơi thấy quán này
  place_lat   double precision,
  place_lng   double precision,

  tags        text[] not null default '{}',   -- 'gần nhà', 'lẩu', 'rẻ'
  price_hint_minor bigint,                    -- giá ước chừng lúc thêm, tuỳ chọn
  note        text,

  status      text not null default 'want'
              check (status in ('want', 'picked', 'tried', 'archived')),
  -- want     = muốn thử — nguồn cho vòng quay
  -- picked   = đã chốt từ vòng quay, chưa đi thật
  -- tried    = đã đi ít nhất một lần
  -- archived = không quan tâm nữa (quán đóng cửa, hết thèm)

  added_by    uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index on public.eat_items (couple_id, status) where deleted_at is null;
create index on public.eat_items using gin (tags);

create trigger eat_items_touch
  before update on public.eat_items
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
-- eat_visits: mỗi lần đi ăn
-- Nối với posts và expenses → số lần ăn và giá tự suy ra
-- ------------------------------------------------------------
create table public.eat_visits (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  item_id    uuid not null references public.eat_items(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete set null,
  expense_id uuid references public.expenses(id) on delete set null,
  visited_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index on public.eat_visits (item_id, visited_on desc);
create index on public.eat_visits (couple_id, visited_on desc);


-- ------------------------------------------------------------
-- eat_ratings: mỗi người đánh giá riêng cho mỗi lượt ghé
-- ------------------------------------------------------------
create table public.eat_ratings (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  visit_id   uuid not null references public.eat_visits(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  verdict    text not null check (verdict in ('love', 'ok', 'nope')),
  note       text,
  created_at timestamptz not null default now(),
  unique (visit_id, user_id)
);
```

### Thống kê suy ra — không lưu, tính lúc cần

```sql
-- security_invoker = true để view tôn trọng RLS của người đang gọi.
-- Thiếu dòng này thì view chạy bằng quyền người tạo → lộ dữ liệu cặp đôi khác.
create view public.eat_item_stats
with (security_invoker = true) as
select
  i.id                                    as item_id,
  i.couple_id,
  count(distinct v.id)                    as visit_count,
  max(v.visited_on)                       as last_visited_on,
  avg(e.amount_minor)::bigint             as avg_price_minor,
  count(*) filter (where r.verdict = 'nope') > 0  as anyone_disliked
from public.eat_items i
left join public.eat_visits  v on v.item_id  = i.id
left join public.expenses    e on e.id       = v.expense_id and e.deleted_at is null
left join public.eat_ratings r on r.visit_id = v.id
where i.deleted_at is null
group by i.id, i.couple_id;
```

### Hàm quay ngẫu nhiên

```sql
create or replace function public.random_eat_pick(
  p_couple_id     uuid,
  p_kind          text    default null,   -- 'dish' | 'place' | null = cả hai
  p_exclude_days  int     default 14,
  p_tags          text[]  default null
)
returns setof public.eat_items
language sql stable security definer set search_path = public as $$
  select i.*
  from public.eat_items i
  left join public.eat_item_stats s on s.item_id = i.id
  where i.couple_id  = p_couple_id
    and i.deleted_at is null
    and i.status <> 'archived'
    and (p_kind is null or i.kind = p_kind)
    and (p_tags is null or i.tags && p_tags)
    and coalesce(s.anyone_disliked, false) = false           -- luật 2
    and (s.last_visited_on is null                            -- luật 1
         or s.last_visited_on < current_date - p_exclude_days)
  order by
    (s.visit_count is null or s.visit_count = 0) desc,        -- luật 3: ưu tiên chưa thử
    random()
  limit 1;
$$;
```

> RLS: cả ba bảng dùng đúng khuôn mẫu như mọi bảng khác — đọc `is_member_of(couple_id)`, ghi `can_write_to(couple_id)`. Xem [database-schema.md](../design/backend/database-schema.md) Phần 10.

## 7. Giao diện

### Lối vào: nút trên Home

**Không thêm tab thứ năm.** Đặt một thẻ nổi bật trên Home:

```
┌──────────────────────────────┐
│  🍜  Tối nay ăn gì?          │
│      23 chỗ đang muốn thử  › │
└──────────────────────────────┘
```

Lý do: đây là một **hành động**, không phải nơi lưu trữ. Người ta cần nó đúng lúc đang đói, và lúc đó họ đang ở Home.

### Màn hình quay

```
┌──────────────────────────────┐
│  [Món] [Quán] [Cả hai]       │
│  Thẻ: gần nhà · rẻ · lẩu     │
├──────────────────────────────┤
│                              │
│      🍜  Bún chả Hàng Quạt   │
│                              │
│      Đã ăn 3 lần · ~180k     │
│      Lần cuối: 2 tháng trước │
│      📍 Xem bản đồ           │
│                              │
├──────────────────────────────┤
│   [Quay lại]    [Chốt! 🎉]   │
└──────────────────────────────┘
```

- **Chốt** → tạo `eat_visits`, hỏi có mở luôn form đăng kỉ niệm không.
- Hoạt ảnh quay nên ngắn (~1.5 giây). Dài hơn thì lần thứ ba đã thấy phiền.

### Màn hình danh sách

- Hai tab: **Muốn thử** / **Đã đi**.
- Thêm nhanh: một ô nhập + nút, **không mở màn hình mới**.
- Nhận chia sẻ từ app khác (TikTok, Facebook, Maps) → mở app với `source_url` điền sẵn, chỉ cần gõ tên. Đây là cách thêm quán tự nhiên nhất, và là lúc người ta thật sự muốn thêm.
- Mỗi mục hiện: tên, số lần ăn, giá trung bình, đánh giá của hai người.

### Hỏi đánh giá

Sau khi tạo một lượt ghé, hiện một dải hỏi gọn — **ba nút, một chạm, bỏ qua được**:

```
Bún chả Hàng Quạt ngon không?
   😍        🙂        😕
```

Nếu người kia chưa đánh giá, hôm sau nhắc một lần rồi thôi. Đừng nài.

## 8. Vị trí trong lộ trình

Tính năng này chia làm hai phần, làm ở hai thời điểm khác nhau:

### Phần A — bản tối giản, chèn ngay sau Phase 2 *(2–3 ngày)*

Chỉ cần bảng `eat_items` + danh sách + quay ngẫu nhiên. **Không phụ thuộc chặng nào sau**, và cho ngay một lý do mở app hằng ngày thứ hai bên cạnh việc đăng ảnh.

Lý do chèn sớm dù trái nguyên tắc "không nhảy chặng": nó rẻ, độc lập, và đúng vào lúc bạn cần thêm động lực nhất — ngay sau khi app vừa dùng được thật.

### Phần B — bản đầy đủ, sau Phase 5 *(2–3 ngày)*

Thêm `eat_visits`, `eat_ratings`, view thống kê, và nối với Timeline + Chi tiêu. Phải chờ tới đây vì **giá trung bình và số lần ăn chỉ tự tính được khi đã có bảng chi tiêu**.

Làm ngược thứ tự này sẽ phải nhập tay giá và số lần — đúng cái bẫy đã cảnh báo ở mục 3.

## 9. Chốt lại

- **Đáng làm, và đáng làm sớm hơn tôi xếp ban đầu.** Đây là tính năng duy nhất giải quyết vấn đề hằng ngày thay vì lưu lại quá khứ.
- **Một bảng, phân biệt món/quán bằng cột `kind`.** Đừng tách hai bảng.
- **Thêm mục chỉ tốn một ô: cái tên.** Mọi thứ khác tuỳ chọn hoặc tự suy ra.
- **Đánh giá ba mức, mỗi người riêng.** Không dùng 5 sao.
- **Quay có luật**, không phải `random()` thuần.
- **Số lần ăn và giá tự tính** từ dữ liệu đã có — đây là phần thưởng của việc thiết kế Timeline và Chi tiêu tử tế từ đầu.
