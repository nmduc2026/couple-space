# E. Wishlist quà tặng + Kết — P6-41 → P6-50

Đặc tả: [p6-gift-wishlist.md](../../../docs/features/p6-gift-wishlist.md).
Xem trước: màn hình **P6-04** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Tính năng duy nhất trong app mà một lỗi phân quyền không gây rò rỉ nghiêm trọng — nhưng
> làm hỏng toàn bộ ý nghĩa của nó.**
>
> Linh biết Minh đã xem món nào = mất bất ngờ = tính năng thành vô dụng. Không ai báo lỗi,
> nó chỉ lặng lẽ vô nghĩa.

---

## P6-41 · Migration

**Các bước**

1. **Hai bảng**, và việc tách chúng ra chính là thiết kế:

   ```sql
   -- Nội dung: CẢ HAI đều đọc được
   create table public.wishlist_items (
     id         uuid primary key default gen_random_uuid(),
     couple_id  uuid not null references public.couples(id) on delete cascade,
     owner_id   uuid not null references public.profiles(id) on delete cascade,
     title      text not null check (length(trim(title)) > 0),
     price_hint_minor bigint,
     url        text,
     note       text,
     priority   int not null default 2 check (priority between 1 and 3),
     status     text not null default 'want'
                check (status in ('want', 'archived')),
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   -- Dấu vết: CHỈ người đặt đọc được
   create table public.wishlist_marks (
     item_id   uuid not null references public.wishlist_items(id) on delete cascade,
     marker_id uuid not null references public.profiles(id) on delete cascade,
     state     text not null check (state in ('planned', 'bought')),
     marked_at timestamptz not null default now(),
     primary key (item_id, marker_id)
   );
   ```

2. ⚠️ **`wishlist_items.status` chỉ có `want` và `archived`** — **không có** `planned`/`bought`.
   Nếu để chúng ở bảng này thì chủ wishlist đọc được, và tính năng hỏng ngay từ schema.

3. Đây là lý do phải tách hai bảng: một bảng cho *cái gì*, một bảng cho *ai đang làm gì với nó*.

**Xong khi:** hai bảng đã tạo, và `wishlist_items` không có cột nào chứa dấu vết của người kia.

---

## P6-42 · 🔒 RLS riêng

**Mục tiêu:** nội dung chung, dấu vết riêng.

**Các bước**

1. `wishlist_items` — khuôn mẫu thường:
   ```sql
   create policy wi_read  on public.wishlist_items for select
     using (public.is_member_of(couple_id));
   create policy wi_write on public.wishlist_items for all
     using (owner_id = auth.uid() and public.can_write_to(couple_id))
     with check (owner_id = auth.uid());
   ```
   Chỉ **chủ nhân** sửa được món của mình.

2. `wishlist_marks` — **chỉ người đặt dấu**:
   ```sql
   create policy wm_own on public.wishlist_marks for all
     using (marker_id = auth.uid())
     with check (marker_id = auth.uid());
   ```

   ⚠️ **Không** `is_member_of` ở đây. Đây là bảng duy nhất trong app dùng riêng
   `auth.uid()` làm điều kiện đọc — và đó là chủ ý.

3. Chặn tự đánh dấu wishlist của chính mình (vô nghĩa):
   ```sql
   check (marker_id <> (select owner_id from wishlist_items where id = item_id))
   ```
   Viết bằng trigger vì `check` không truy vấn bảng khác được.

4. Kiểm chứng bằng API trực tiếp, giống cách làm ở
   [Phase 5](../../phase-05/steps/a-daily-question.md#p5-06--kiểm-chứng-bằng-api-trực-tiếp):
   Minh đánh dấu → lấy token của Linh → `GET /wishlist_marks` → **mảng rỗng**.

**Xong khi:** phép thử ở bước 4 đúng.

---

## P6-43 · Thêm nhanh + nhận link

**Các bước**

1. **Một ô nhập, chỉ cần tên** — giống mọi chỗ khác trong app.

2. Hai tab: `Của Linh` (mặc định — vì mình vào đây để tìm quà) | `Của bạn`.

3. Chi tiết món (tuỳ chọn): giá ước chừng · link · ghi chú (*"màu trắng nha"*) · độ ưu tiên.

4. Nhận chia sẻ link từ Shopee/Tiki/TikTok Shop qua `share_target` — cùng cơ chế đã làm ở
   [Ăn gì](../../phase-02/steps/e-eat-tonight.md#p2-22--nhận-chia-sẻ-từ-app-khác).

5. ⚠️ **Cùng cảnh báo:** `share_target` trên iOS Safari hỗ trợ không đầy đủ. Nút
   **"Dán link"** (đọc clipboard) mới là đường chính trên iPhone. Làm nút đó trước.

**Xong khi:** thêm 4 món trong dưới 30 giây; dán link Shopee vào tự điền `url`.

---

## P6-44 · Đánh dấu — chủ wishlist không thấy

**Các bước**

1. Ở tab "Của Linh", mỗi món có nút đánh dấu:
   `🎯 Định mua` → `✅ Đã mua` → bỏ dấu

2. Món đã đánh dấu hiện khác đi **chỉ trên máy Minh**. Trên máy Linh nó vẫn y nguyên.

3. Món `bought` **vẫn hiện bình thường** trong wishlist của Linh. Nếu nó biến mất thì Linh
   đoán ra ngay, và bất ngờ mất.

4. Minh thấy một dải tổng kết riêng: *"Bạn đã đánh dấu 2 món · đã mua 1"*.

5. Dòng trấn an ở đầu tab, để Minh yên tâm dùng:
   > 🤫 *Linh không biết bạn đang xem mục nào.*

**Xong khi:** Minh đánh dấu → mở app Linh → **không có dấu hiệu nào** khác trước.

---

## P6-45 · Chủ wishlist bỏ món — chiều ngược lại

**Các bước**

1. Linh chuyển một món sang `archived` (mua được rồi / hết thích).

2. Minh **thấy** thay đổi này — chiều này phải công khai, để không ai tốn tiền vô ích.

3. Minh đã đánh dấu món đó → nhận thông báo nhẹ:
   > *"Linh vừa bỏ 'Tai nghe Sony' khỏi wishlist"*

4. Chưa đánh dấu → **không gửi gì**. Không phải mọi thay đổi đều đáng báo.

5. Món `archived` vào mục gập "Đã bỏ" ở cuối, xem lại được.

**Xong khi:** Linh bỏ một món Minh đã đánh dấu → Minh nhận đúng một thông báo.

---

## P6-46 · ⚠️ Rà toàn bộ push

> **Task quan trọng nhất nhóm E.** Một thông báo sơ ý là mất sạch ý nghĩa tính năng.

**Các bước**

1. Liệt kê **mọi** thông báo app có thể gửi liên quan tới wishlist, và kiểm từng cái:

   | Sự kiện | Gửi cho ai | Được không? |
   |---|---|---|
   | Linh thêm món mới | Minh | ✅ Được (nội dung là chung) |
   | Minh đánh dấu "định mua" | Linh | ❌ **TUYỆT ĐỐI KHÔNG** |
   | Minh đánh dấu "đã mua" | Linh | ❌ **TUYỆT ĐỐI KHÔNG** |
   | Minh mở wishlist của Linh | Linh | ❌ **TUYỆT ĐỐI KHÔNG** |
   | Linh bỏ món Minh đã đánh dấu | Minh | ✅ Được (P6-45) |
   | Sinh nhật Linh sắp tới | Minh | ✅ Được (P6-47) |

2. Rà cả những chỗ **gián tiếp** làm lộ:
   - [Wrapped](b-wrapped.md) — không có chỉ số nào về wishlist
   - [Xuất dữ liệu](d-export.md#p6-37--wishlist-không-lộ-dấu-vết) — đã xử lý
   - Realtime — **không** đăng ký kênh `wishlist_marks` chung cho cả space
   - Dấu chấm "có nội dung mới" — không bật vì một `mark`

3. Comment trong code:
   ```
   // KHÔNG BAO GIỜ thông báo cho chủ wishlist về hành vi của người kia.
   // Xem docs/features/p6-gift-wishlist.md mục 2.
   ```

**Xong khi:** đi hết bảng ở bước 1 và bước 2, không có đường nào rò rỉ.

---

## P6-47 · Nối với sự kiện sinh nhật

**Mục tiêu:** tính năng chỉ thật sự hữu ích vào đúng lúc này.

**Các bước**

1. Sinh nhật người kia còn ≤ 14 ngày → thêm một dải trên Home:
   > 🎁 *Sinh nhật Linh còn 12 ngày — xem wishlist chưa?*

2. Dải này **chỉ hiện cho người kia**, không hiện cho chủ nhân sinh nhật. Một chỗ nữa dễ lộ.

3. Nối vào **gợi ý hành động** của [sự kiện](../../phase-04/steps/e-loop.md#p4-35--nối-gợi-ý-hành-động-của-sự-kiện):
   nhắc sinh nhật → nút [Xem wishlist] bên cạnh [Tạo việc cần làm].

4. Wishlist của chủ nhân sinh nhật đang **rỗng** → nhắc **chính họ**, một lần:
   > *"Sinh nhật bạn sắp tới — thêm vài món cho Minh đỡ vất vả 🙂"*

**Xong khi:** đặt sinh nhật cách 10 ngày → máy người kia hiện dải, máy chủ nhân **không hiện**.

---

## P6-48 · Test "ai thấy gì"

**Các bước**

1. Hai tài khoản thật, đi qua đủ bảng này:

   | Hành động | Máy Minh thấy | Máy Linh thấy |
   |---|---|---|
   | Linh thêm "Tai nghe Sony" | ✅ món mới | ✅ món mới |
   | Minh đánh dấu "định mua" | ✅ dấu 🎯 | ❌ **không gì cả** |
   | Minh đánh dấu "đã mua" | ✅ dấu ✅ | ❌ **không gì cả** |
   | Linh mở app, kéo tải lại | — | ❌ **vẫn không gì cả** |
   | Linh bỏ món đó | ✅ + thông báo | ✅ món vào mục Đã bỏ |

2. Kiểm cả bằng **API trực tiếp** với token của Linh, không chỉ nhìn màn hình.

3. Kiểm **bản xuất dữ liệu** của Linh — không có dấu vết nào của Minh.

**Xong khi:** cả ba bước đúng. **Ghi kết quả vào nhật ký phiên** của [../context.md](../context.md).

---

## P6-49 · Rà lại toàn bộ app

**Các bước**

Sáu phase đã xong. Đi một lượt từ đầu tới cuối, kiểm bốn thứ xuyên suốt:

1. **Trạng thái rỗng** — mở mọi màn hình bằng một tài khoản mới tinh. Không màn hình nào
   được hiện "Chưa có dữ liệu" khô khan.

2. **Chế độ tối** — mọi màn hình, mọi biểu đồ, mọi màu danh mục. Đây là app hay mở buổi tối.

3. **Vùng an toàn iPhone** — tai thỏ và thanh gạt dưới đáy không che gì, ở mọi màn hình.

4. **Tốc độ** — Home tải dưới ~1 giây trên 4G; Timeline cuộn không giật với 200 bài.

Thêm: đọc lại [AGENTS.md](../../../AGENTS.md) mục 6, kiểm xem 5 nguyên tắc sản phẩm còn
đúng trong app thật không.

**Xong khi:** đi hết một lượt, ghi lại những chỗ chưa ổn vào nhật ký phiên.

---

## P6-50 · Kết

**Các bước**

1. Cập nhật [../context.md](../context.md): trạng thái ✅ + nhật ký phiên cuối.

2. Cập nhật [../../README.md](../../README.md):
   - Bảng Toàn cảnh: cả 6 phase ✅
   - Mục "Phase đang chạy" → đổi thành *"Đã xong cả 6 phase. Giờ là giai đoạn dùng thật và
     sửa theo cái mình thiếu."*

3. Cập nhật [overview.md](../../../overview.md): dòng trạng thái cuối file.

4. Cân nhắc mở lại những thứ để dành ở [Tầng 3](../../../overview.md):

   | Việc | Điều kiện |
   |---|---|
   | **Widget** | Chỉ khi chịu chi $99/năm — khi đó bọc bằng Capacitor, xem [tech-stack.md](../../../docs/decisions/tech-stack.md) |
   | Video trong Timeline | Kiểm dung lượng Storage thực tế trước |
   | Chia sẻ vị trí realtime | Vẫn nên tránh |
   | Theo dõi chu kì | Cần đọc kỹ ràng buộc pháp lý trước |

5. Điều đáng làm nhất lúc này **không phải viết thêm tính năng**: dùng app vài tháng, ghi
   lại thứ thật sự thiếu, rồi mới quyết định làm gì tiếp. Danh sách đó đáng tin hơn mọi
   phỏng đoán ở giai đoạn này.

**Xong khi:** tài liệu khớp với thực tế, và bạn đang dùng app thật cùng người yêu 🤍
