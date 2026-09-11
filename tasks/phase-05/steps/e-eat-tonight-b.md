# E. "Tối nay ăn gì?" — phần B — P5-35 → P5-42

Đặc tả: [p2-eat-tonight.md](../../../docs/features/p2-eat-tonight.md), đặc biệt mục 4, 6, 8.
Xem trước: màn hình **P5-06** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Đây là lúc phần thưởng của ba phase trước được lĩnh.**
>
> Số lần ăn, giá trung bình, lần cuối ăn — cả ba **tự suy ra** từ Timeline (Phase 2) và Chi
> tiêu (Phase 4). Nếu làm phần B sớm hơn thì phải nhập tay ba con số đó, và đó đúng là cái
> bẫy mà đặc tả đã cảnh báo ngay từ đầu.

---

## P5-35 · Migration `eat_visits` + `eat_ratings`

**Các bước**

1. Chép SQL ở [p2-eat-tonight.md](../../../docs/features/p2-eat-tonight.md) **mục 6**, phần
   `eat_visits` và `eat_ratings`.

2. Điểm chính của `eat_visits` là **ba khoá ngoại**:
   ```sql
   item_id    → eat_items    (quán nào)
   post_id    → posts        (bài kỉ niệm hôm đó, nullable)
   expense_id → expenses     (khoản chi hôm đó, nullable)
   ```
   Chính ba cái nối này làm cho thống kê tự tính được.

3. `eat_ratings` có `unique (visit_id, user_id)` — **mỗi người đánh giá riêng cho mỗi lượt ghé**.

4. `verdict` là ba giá trị: `love` / `ok` / `nope`. **Không phải 1–5 sao** — thang 5 tạo do
   dự mà không thêm thông tin dùng được.

5. Bật RLS cho cả hai bảng theo khuôn mẫu.

**Xong khi:** tạo tay một lượt ghé nối với một bài và một khoản chi, đọc ra đủ.

---

## P5-36 · View `eat_item_stats`

**Các bước**

1. Chép view ở [p2-eat-tonight.md](../../../docs/features/p2-eat-tonight.md) mục 6.

2. ⚠️ **Bắt buộc có `with (security_invoker = true)`.**

   Thiếu dòng này thì view chạy bằng quyền **người tạo** (tức là bạn, chủ database) và
   **lộ dữ liệu của mọi cặp đôi khác**. Đây là lỗi bảo mật nghiêm trọng nhất có thể mắc ở
   phase này, và nó hoàn toàn im lặng — không có thông báo lỗi nào.

3. View tính bốn thứ, **không lưu, tính lúc cần**:

   | Cột | Từ đâu |
   |---|---|
   | `visit_count` | đếm `eat_visits` |
   | `last_visited_on` | `max(visited_on)` |
   | `avg_price_minor` | trung bình `expenses.amount_minor` qua `expense_id` |
   | `anyone_disliked` | có bất kỳ `eat_ratings.verdict = 'nope'` |

4. Kiểm chứng `security_invoker`: đăng nhập bằng tài khoản thứ ba, query view → **mảng rỗng**.

**Xong khi:** view trả đúng số liệu, và tài khoản ngoài space không đọc được gì.

---

## P5-37 · Nối lượt ghé với bài và khoản chi

**Mục tiêu:** ba con số tự cập nhật mà không ai nhập.

**Các bước**

1. Ba đường tạo liên kết:

   | Người dùng làm gì | App làm gì |
   |---|---|
   | Quay ra một quán → bấm **[Chốt]** | Tạo `eat_visits` với `item_id`, `visited_on = hôm nay` |
   | Sau đó đăng bài kỉ niệm | Gán `post_id` vào lượt ghé vừa tạo (nếu cùng ngày, cùng quán) |
   | Bài có gắn chi phí | Gán `expense_id` vào lượt ghé đó |

2. **Tự nối, không hỏi.** Nếu trong ngày có đúng một lượt ghé chưa có `post_id`, và người
   dùng đăng bài có hoạt động 🍜 — nối luôn.

3. Nhập nhằng (nhiều lượt ghé cùng ngày) → **không nối**, để trống. Nối sai còn tệ hơn không nối.

4. Cho nối tay ở màn hình chi tiết quán: *"Gắn với một kỉ niệm"*.

**Xong khi:** đi ăn thật một lần (chốt → đăng bài kèm chi phí) → mở lại quán đó thấy số lần
ăn +1 và giá trung bình đã tính lại. **Không nhập tay con số nào.**

---

## P5-38 · Nút [Chốt]

**Các bước**

1. Ở [màn hình quay](../../phase-02/steps/e-eat-tonight.md), nút **[Chốt! 🎉]** giờ làm thật:
   - Tạo `eat_visits`
   - Đặt `eat_items.status = 'tried'`
   - Hỏi: *"Mở form đăng kỉ niệm luôn không?"* → **[Có]** / **[Để sau]**

2. **[Có]** → mở form soạn bài với: hoạt động 🍜 điền sẵn, địa điểm = tên quán, mục chi phí
   mở sẵn.

3. **[Để sau]** cũng hoàn toàn ổn. Lượt ghé đã ghi, đó là phần quan trọng.

4. Chốt nhầm → hoàn tác được trong màn hình chi tiết quán (xoá lượt ghé).

**Xong khi:** chốt một quán → số lần ăn tăng ngay, và form đăng bài mở với dữ liệu điền sẵn.

---

## P5-39 · Dải hỏi đánh giá

**Các bước**

1. Sau khi tạo lượt ghé, hiện một dải gọn — **ba nút, một chạm, bỏ qua được**:
   ```
   Bún chả Hàng Quạt ngon không?
      😍          🙂          😕
   Ăn lại      Cũng được     Thôi
   ```

2. Không phải màn hình riêng, không chặn gì. Bỏ qua thì thôi.

3. Ghi vào `eat_ratings` với `visit_id` và `user_id` của người đang chạm.

4. **Mỗi người đánh giá riêng.** Người kia chưa đánh giá thì lượt ghé đó vẫn chỉ có một dòng.

5. Ở chi tiết quán hiện cả hai: `Minh 😍 · Linh 🙂`. Đây là thông tin thật và hữu ích —
   *"em thích, anh không"*.

**Xong khi:** đánh giá một lượt ghé từ hai máy → chi tiết quán hiện đúng hai emoji.

---

## P5-40 · Nhắc đánh giá đúng một lần

**Các bước**

1. Hôm sau, nếu **một người đã đánh giá mà người kia chưa** → push cho người chưa:
   > *"Bún chả hôm qua ngon không? 😋"*

2. Chạm vào → mở thẳng dải đánh giá.

3. ⚠️ **Đúng một lần. Rồi thôi.** Đặc tả ghi rõ: *"Đừng nài."*

4. Ghi vào `reminder_sends` (bảng từ [Phase 3](../../phase-03/steps/a-database.md)) với
   `ref_key = 'rating:<visit_id>'` để không nhắc lại.

5. Cả hai chưa ai đánh giá → **không nhắc ai cả**. Có lẽ buổi đó không đáng nhớ, và đó cũng
   là một câu trả lời.

**Xong khi:** A đánh giá, B không → hôm sau B nhận đúng một nhắc; ngày kia không nhận nữa.

---

## P5-41 · Bổ sung luật cho vòng quay

**Mục tiêu:** vòng quay giờ đã đủ bốn luật.

**Các bước**

1. Phase 2 mới có luật 3 và 4. Giờ thêm hai luật còn lại vào hàm `random_eat_pick`:

   | Luật | Điều kiện thêm vào `where` |
   |---|---|
   | 1. Loại chỗ vừa ăn | `s.last_visited_on is null or s.last_visited_on < current_date - p_exclude_days` |
   | 2. Loại chỗ bị chê | `coalesce(s.anyone_disliked, false) = false` |

2. Hàm ở Phase 2 đã được viết sao cho **thêm luật chỉ là thêm điều kiện** — nếu phải viết
   lại thì lúc đó làm chưa đúng, xem lại
   [P2-24](../../phase-02/steps/e-eat-tonight.md#p2-24--hàm-quay-có-luật).

3. `p_exclude_days` mặc định **14**, cho chỉnh trong màn hình quay.

4. ⚠️ **Ca biên quan trọng:** lọc chặt quá → không còn quán nào. Khi kết quả rỗng, **nới dần**:
   ```
   đủ 4 luật → rỗng?
     → bỏ luật 1 (loại chỗ vừa ăn) → rỗng?
       → bỏ luật 2 (loại chỗ bị chê) → rỗng?
         → "Hết quán rồi — thêm chỗ mới nhé 🍜"
   ```
   Nói rõ khi đã nới: *"Không còn chỗ mới, quay lại chỗ cũ nha 😄"*.

**Xong khi:** đánh dấu 😕 một quán → quán đó không ra nữa; đánh dấu 😕 hết mọi quán → app nới
luật và vẫn ra kết quả kèm lời giải thích.

---

## P5-42 · Màn hình chi tiết quán

**Các bước**

1. Hiện đủ thống kê tự tính:
   ```
   Số lần ăn          4 lần
   Giá trung bình     180.000đ
   Lần cuối           12/09 · 2 tháng trước
   Minh · Linh        😍 · 🙂
   ```

2. Ghi chú nhỏ bên dưới — nó làm người dùng hiểu vì sao app "biết" những thứ này:
   > *Ba dòng đầu tự tính từ Timeline và Chi tiêu — không ai phải nhập.*

3. Danh sách **lượt ghé** bên dưới: ngày · đánh giá của hai người · link tới bài kỉ niệm 📷
   và khoản chi 💰 nếu có.

4. Chưa đi lần nào → ẩn hết phần thống kê, chỉ hiện thông tin cơ bản và nút [Quay để thử].

**Xong khi:** mở một quán đã ăn vài lần, mọi con số đúng, chạm 📷 mở đúng bài.

---

## Trước khi kết thúc Phase 5

Chạy lại DoD ở [../context.md](../context.md) mục 1 — **hai dòng đầu bắt buộc kiểm bằng gọi
API trực tiếp**, không phải nhìn màn hình.

Rồi:

1. Cập nhật [../context.md](../context.md): trạng thái ✅ + nhật ký phiên, **ghi rõ kết quả
   kiểm chứng RLS** của P5-06 và P5-16
2. Cập nhật [../../README.md](../../README.md): **Phase đang chạy** → Phase 6
3. Phase 6 chủ yếu đọc lại dữ liệu đã tích. Nếu app mới dùng vài tuần, cân nhắc **hoãn
   Phase 6** và dùng app thêm vài tháng trước — Wrapped và Bản đồ cần dữ liệu thật để có ý nghĩa.
