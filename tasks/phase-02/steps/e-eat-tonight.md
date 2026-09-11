# E. "Tối nay ăn gì?" — phần A — P2-20 → P2-25

Đặc tả: [p2-eat-tonight.md](../../../docs/features/p2-eat-tonight.md).

**Phần A là bản tối giản:** một bảng, danh sách, quay ngẫu nhiên có luật. Không có lượt ghé,
không có đánh giá, không có giá trung bình — những thứ đó cần bảng chi tiêu, để Phase 5.

> **Vì sao chèn vào đây dù trái nguyên tắc "không nhảy phase":** nó rẻ, độc lập hoàn toàn với
> các phase sau, và cho **lý do mở app hằng ngày thứ hai** bên cạnh việc đăng ảnh — đúng lúc
> cần thêm động lực nhất, ngay sau khi app vừa dùng được thật.
>
> Đây cũng là tính năng **duy nhất giải quyết một vấn đề đang xảy ra** thay vì lưu lại quá khứ.

---

## P2-20 · Migration `eat_items`

**Mục tiêu:** một bảng cho cả món ăn lẫn quán.

**Các bước**

1. Chép SQL `eat_items` ở [p2-eat-tonight.md](../../../docs/features/p2-eat-tonight.md)
   **mục 6**.

2. **Chỉ tạo `eat_items`.** Ba bảng còn lại (`eat_visits`, `eat_ratings`, view thống kê)
   để Phase 5 — tạo sớm chỉ tạo ra bảng rỗng gây nhầm lẫn.

3. Hiểu vì sao **một bảng, không phải hai**:

   | | Ví dụ | Trả lời câu hỏi |
   |---|---|---|
   | `kind = 'dish'` | bún chả, lẩu thái | *Hôm nay thèm gì?* |
   | `kind = 'place'` | Bún chả Hàng Quạt | *Đi đâu?* |

   Một món có ở nhiều quán, một quán bán nhiều món — nhưng với hai người dùng thì tách hai
   bảng có quan hệ là phức tạp hoá vô ích.

4. Bật RLS như mọi bảng khác: đọc `is_member_of`, ghi `can_write_to`.

5. `npx supabase db push`

**Xong khi:** thêm tay vài dòng với `kind` khác nhau, đọc ra đúng.

---

## P2-21 · Danh sách + thêm nhanh

**Mục tiêu:** **thêm một mục chỉ tốn MỘT ô nhập: cái tên.**

Đây là chỗ tính năng này sống hoặc chết. Nếu thêm một quán phải điền 5 trường thì sau hai
tuần không ai thêm nữa, danh sách đứng yên, và bánh xe quay mãi trên dữ liệu cũ.

**Các bước**

1. Màn hình hai tab: **Muốn thử** (`status = 'want'`) · **Đã đi** (`status = 'tried'`).

2. Thêm nhanh ngay trên đầu danh sách — **một ô nhập + một nút, không mở màn hình mới**:
   ```
   ┌────────────────────────────────┐
   │ Thêm quán hoặc món…        [+] │
   └────────────────────────────────┘
   ```
   Gõ tên, bấm +, xong. Mọi thứ khác để sau, sửa sau.

3. Mỗi dòng trong danh sách: tên · thẻ (nếu có) · ai thêm.
   Phase 2 **chưa** có số lần ăn và giá trung bình — đó là phần thưởng của Phase 5.

4. Chạm vào một mục → màn hình chi tiết, sửa được: địa chỉ, link bản đồ, link nguồn,
   thẻ, ghi chú, `kind`, `status`.

5. Vuốt để chuyển sang "Đã đi" hoặc lưu trữ (`archived`).

**Xong khi:** thêm 5 quán trong dưới 30 giây, không rời khỏi màn hình danh sách.

**Bẫy**
- Đừng bắt chọn `kind` (món hay quán) lúc thêm. Mặc định `place`, sửa sau nếu cần.
  Một câu hỏi thêm lúc nhập liệu là một lý do để không nhập.

---

## P2-22 · Nhận chia sẻ từ app khác

**Mục tiêu:** thấy quán ngon trên TikTok là thêm thẳng vào app — **đây là lúc người ta thật
sự muốn thêm**.

**Các bước**

1. Khai báo `share_target` trong manifest PWA (`vite.config.ts`, phần `manifest` đã làm ở
   [Phase 1 P1-03](../../phase-01/steps/a-setup.md)): app xuất hiện trong bảng chia sẻ của
   hệ thống, nhận vào một URL.

2. Mở app tại `/eat/add?url=...` với `source_url` **điền sẵn**, con trỏ đặt ở ô tên.
   Người dùng chỉ gõ tên rồi lưu.

3. Nhận diện link Google Maps → điền luôn vào `map_url` thay vì `source_url`.

4. **Đường lùi bắt buộc:** thêm một nút "Dán link" ngay trong màn hình thêm nhanh
   (P2-21), đọc từ clipboard.

**Xong khi:** từ TikTok bấm Chia sẻ → chọn Couple Space → app mở với link đã điền sẵn.

**Bẫy**
- ⚠️ **`share_target` trên iOS Safari hỗ trợ không đầy đủ.** Rất có thể app **không** xuất
  hiện trong bảng chia sẻ. Làm bước 1–3 nhưng **đừng phụ thuộc vào nó** — nút "Dán link" ở
  bước 4 mới là đường chính trên iPhone.
- Thử trên máy thật sớm. Nếu không chạy, đừng tốn thời gian: chuyển hẳn sang dán link.

---

## P2-23 · Màn hình quay

**Mục tiêu:** biến một câu hỏi khó chịu hằng ngày thành một khoảnh khắc vui.

**Các bước**

1. Bộ lọc trên đầu: `[Món] [Quán] [Cả hai]` + chọn thẻ (`gần nhà`, `rẻ`, `lẩu`).

2. Nút quay lớn ở giữa. Hoạt ảnh **~1.5 giây** — tên các mục chạy qua rồi chậm dần và dừng.

3. Kết quả hiện:
   ```
      🍜  Bún chả Hàng Quạt
          📍 Xem bản đồ
   ───────────────────────────
      [Quay lại]     [Chốt! 🎉]
   ```

4. **[Chốt]** ở Phase 2 chỉ đặt `status = 'tried'` và hiện lời chúc mừng.
   Tạo lượt ghé + hỏi đánh giá là việc của Phase 5.

5. Rung nhẹ khi dừng (`navigator.vibrate`) — có trên Android, iOS thì bỏ qua, không sao.

**Xong khi:** quay 5 lần liên tiếp, mỗi lần ra kết quả khác nhau, hoạt ảnh không giật.

**Bẫy**
- **Hoạt ảnh đừng dài quá 1.5 giây.** Lần thứ ba là đã thấy phiền, và người ta sẽ ngừng dùng.
- Danh sách rỗng → đừng hiện lỗi. Hiện: *"Chưa có chỗ nào — thêm vài quán trước nhé"* + nút thêm.

---

## P2-24 · Hàm quay có luật

**Mục tiêu:** không phải `random()` thuần — nếu không, lần quay đầu ra ngay món ăn hôm qua
và người dùng mất tin tưởng.

**Các bước**

1. Viết hàm SQL `random_eat_pick` — bản rút gọn cho Phase 2 (chưa có bảng lượt ghé):

   | Luật | Phase 2 làm được? |
   |---|---|
   | 1. Loại chỗ vừa ăn trong 14 ngày | ⏸ Chờ `eat_visits` (Phase 5) |
   | 2. Loại chỗ bị chê | ⏸ Chờ `eat_ratings` (Phase 5) |
   | 3. **Ưu tiên chưa thử** | ✅ Dùng `status = 'want'` |
   | 4. **Lọc trước khi quay** (kind, thẻ) | ✅ Làm được |

2. Bản Phase 2:
   ```sql
   select * from eat_items
   where couple_id = p_couple_id
     and deleted_at is null
     and status <> 'archived'
     and (p_kind is null or kind = p_kind)
     and (p_tags is null or tags && p_tags)
   order by (status = 'want') desc,   -- luật 3: ưu tiên chưa thử
            random()
   limit 1;
   ```

3. Viết sao cho **thêm luật 1 và 2 ở Phase 5 chỉ là thêm điều kiện**, không phải viết lại.

**Xong khi:** có 10 mục trong đó 3 mục `want` → quay 10 lần, 3 mục kia ra rõ rệt nhiều hơn.

**Bẫy**
- Đừng sinh số ngẫu nhiên ở app rồi lấy phần tử thứ n. Lọc ở database thì mới áp dụng được
  các luật, và về sau mới thêm được thống kê.

---

## P2-25 · Thẻ trên Home

**Mục tiêu:** lối vào đúng lúc người ta đang đói.

**Các bước**

1. Thêm một thẻ nổi bật trên [Home](f-home.md):
   ```
   ┌──────────────────────────────┐
   │  🍜  Tối nay ăn gì?          │
   │      23 chỗ đang muốn thử  › │
   └──────────────────────────────┘
   ```

2. Chạm vào → **mở thẳng màn hình quay**, không phải danh sách. Người ta cần *một quyết định*,
   không cần *một danh sách*.

3. Danh sách rỗng → thẻ đổi thành *"Thêm quán đầu tiên"*.

**Xong khi:** từ Home tới lúc có kết quả quay chỉ mất **hai chạm**.

**Bẫy**
- **Không thêm tab thứ năm cho tính năng này.** Đây là một *hành động*, không phải một nơi
  lưu trữ — và lúc đói thì người ta đang ở Home.
