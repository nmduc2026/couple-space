# B. Thư gửi tương lai — P5-13 → P5-21

Đặc tả: [p5-future-letter.md](../../../docs/features/p5-future-letter.md).
Xem trước: màn hình **P5-03** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Tỉ lệ giá trị cảm xúc trên chi phí kỹ thuật cao nhất app.** Về dữ liệu chỉ là một bảng
> vài cột; về cảm giác là thứ người ta kể lại cho bạn bè nghe.
>
> Nhưng nó chỉ đáng giá nếu **khoá là khoá thật**. Khoá hỏng thì không còn gì.

---

## P5-13 · Migration `letters`

**Các bước**

1. ```sql
   create table public.letters (
     id          uuid primary key default gen_random_uuid(),
     couple_id   uuid not null references public.couples(id) on delete cascade,
     author_id   uuid not null references public.profiles(id),
     recipient   text not null default 'both'
                 check (recipient in ('both', 'partner')),
     title       text not null,          -- người kia THẤY trước khi mở
     body        text not null,
     open_on     date not null,          -- kiểu date, không phải timestamp
     opened_at   timestamptz,            -- lần đầu được mở
     created_at  timestamptz not null default now(),
     updated_at  timestamptz not null default now()
   );
   create index on public.letters (couple_id, open_on);
   ```

2. `title` là phần **cố ý để lộ** — nó gợi tò mò, và người viết biết điều đó khi đặt tên.

3. `open_on` kiểu **`date`**: so với ngày lịch ở múi giờ space, cùng quy tắc với
   [câu hỏi mỗi ngày](a-daily-question.md#p5-04--múi-giờ-của-space).

4. Không có `deleted_at`: xoá thư trước ngày mở là xoá thật; sau ngày mở thì **không xoá được**.

**Xong khi:** chèn tay một lá thư, đọc ra đúng.

---

## P5-14 · 🔒 RLS chặn theo ngày

> **Task quan trọng nhất nhóm B.**

**Mục tiêu:** trước ngày mở, API **không trả nội dung**.

**Các bước**

1. Vấn đề: PostgREST trả cả dòng hoặc không trả dòng — không có "trả một phần cột". Nhưng
   ta **cần** metadata (tiêu đề, ngày mở, ai viết) hiện trong danh sách "Sắp mở".

2. Giải pháp: **tách làm hai**.

   - Bảng `letters` giữ `body`, policy **chỉ cho đọc khi đủ điều kiện**:
     ```sql
     create policy letters_read on public.letters for select using (
       public.is_member_of(couple_id)
       and (
         author_id = auth.uid()              -- thư mình viết: luôn đọc lại được
         or open_on <= (current_date at time zone (
              select timezone from public.couples where id = letters.couple_id))
       )
     );
     ```

   - Một **view** `letters_meta` chỉ có các cột an toàn
     (`id, author_id, title, open_on, recipient, created_at`), policy chỉ cần `is_member_of`.
     Nhớ `security_invoker = true`.

3. App dùng `letters_meta` cho danh sách, dùng `letters` khi mở một lá thư.

4. ⚠️ **Đừng để `body` lọt vào view.** Rà lại danh sách cột của view sau mỗi lần sửa schema.

**Xong khi:** policy đã chạy; kiểm chứng ở P5-16.

---

## P5-15 · Người viết luôn đọc lại được

**Các bước**

1. Điều kiện `author_id = auth.uid()` trong policy ở P5-14 đã lo việc này.
2. Giao diện: thư mình viết trong mục "Sắp mở" có nhãn *"bạn viết"* và **mở xem lại được**,
   khác với thư người kia viết (khoá 🔒).
3. Khoá người viết khỏi chữ của chính họ là vô lý — đừng "thắt chặt" chỗ này.

**Xong khi:** viết một lá thư hẹn năm 2036, mở lại đọc được ngay.

---

## P5-16 · Kiểm chứng bằng API trực tiếp

**Các bước**

1. A viết một lá thư hẹn mở **năm sau**, gửi cho cả hai.

2. Lấy token của **B** (người không viết), gọi thẳng:
   ```powershell
   curl "https://<project>.supabase.co/rest/v1/letters?select=*" `
     -H "apikey: <anon>" -H "Authorization: Bearer <token cua B>"
   ```
   ✅ Đúng: **không có** lá thư đó.

3. Gọi view metadata:
   ```powershell
   curl "https://<project>.supabase.co/rest/v1/letters_meta?select=*" `
     -H "apikey: <anon>" -H "Authorization: Bearer <token cua B>"
   ```
   ✅ Đúng: **có** dòng, nhưng **không có cột `body`**.

4. Thử `select=body` trên `letters_meta` → phải lỗi hoặc rỗng, không được trả nội dung.

5. Sửa tay `open_on` về hôm qua trong database → gọi lại `letters` → giờ B **đọc được**.
   Chứng minh policy chặn theo ngày thật sự hoạt động.

**Xong khi:** bốn bước trên đúng. **Ghi vào nhật ký phiên** ở [../context.md](../context.md).

---

## P5-17 · Màn hình viết thư

**Các bước**

1. Các trường: tiêu đề · nội dung · gửi cho · ngày mở.

2. Nhắc rõ ngay dưới ô tiêu đề:
   > *Người ấy sẽ thấy tiêu đề này trước khi mở — đặt cho khéo 😉*

3. **Gợi ý ngày mở** lấy từ [sự kiện](../../phase-03/steps/c-plan-ui.md) đang có, hiện thành
   nút bấm nhanh:

   | Gợi ý | Lấy từ |
   |---|---|
   | Kỉ niệm 1 năm nữa | mốc hệ thống |
   | Sinh nhật Linh (24/09) | sự kiện `yearly` |
   | 5 năm nữa · 10 năm nữa | tính từ hôm nay |

4. Ràng buộc: ngày mở **từ mai trở đi**. Hẹn hôm nay thì viết thư làm gì.

5. Hẹn quá xa (> 30 năm): cho phép, cảnh báo nhẹ **một lần**.

6. Ô nội dung **không giới hạn độ dài** — đây là chỗ người ta cần viết dài. Cao tối thiểu
   ~10 dòng, tự giãn.

**Xong khi:** viết một lá thư xong trong một màn hình, các nút gợi ý ngày đều đúng.

---

## P5-18 · Danh sách thư

**Các bước**

1. Hai mục: **Sắp mở** (trên) và **Đã mở** (dưới).

2. Thư sắp mở:
   ```
   🔒  Gửi tụi mình của 1 năm sau
       Minh viết 23/10/2025 · mở sau 41 ngày
   ```
   Viền nét đứt, chữ nhạt — trông như một phong bì chưa bóc.

3. Đếm ngược cập nhật theo ngày, không theo giờ.

4. Thư mình viết: nhãn *"bạn viết"* + mở xem lại được.

5. Thư đã mở: 💌 đặc, chữ bình thường, hiện ngày đã mở.

6. Danh sách rỗng → *"Viết một lá thư cho tụi mình của tương lai ✍️"* + nút viết.

**Xong khi:** ba lá thư với ba ngày mở khác nhau sắp đúng thứ tự, đếm ngược đúng.

---

## P5-19 · Sửa / xoá

**Các bước**

1. **Trước ngày mở:** người viết sửa và xoá thoải mái. Người kia chỉ thấy metadata đổi theo.

2. **Sau ngày mở:** khoá vĩnh viễn — không sửa, không xoá. Thư đã được đọc là một ký ức,
   không phải một bản nháp.

3. Chặn ở policy:
   ```sql
   create policy letters_update on public.letters for update using (
     author_id = auth.uid()
     and open_on > (current_date at time zone (
          select timezone from public.couples where id = letters.couple_id))
   );
   ```

4. Ghi `opened_at` lần đầu có người **không phải tác giả** mở thư.

**Xong khi:** sửa được thư chưa mở; sửa tay `open_on` về quá khứ → API từ chối sửa.

---

## P5-20 · Push khi thư mở khoá

**Các bước**

1. Thêm một nhánh vào cron đã dựng ở [Phase 3](../../phase-03/steps/d-reminders.md):
   quét `letters` có `open_on = hôm nay` (theo múi giờ space).

2. Push **cho cả hai**, kể cả người viết — họ cũng muốn biết hôm nay là ngày đó:
   > *"Có một lá thư vừa mở khoá 💌"*

3. Gửi lúc **9:00** giờ space.

4. Dùng lại bảng `reminder_sends` để chống gửi trùng, `ref_key = 'letter:<id>'`.

5. Chạm vào → mở thẳng lá thư.

**Xong khi:** đặt `open_on` là ngày mai, để máy qua đêm → sáng hôm sau cả hai nhận push.

---

## P5-21 · Cảnh báo ở màn hình huỷ ghép đôi

**Mục tiêu:** không ai mất thư mà không biết trước.

**Các bước**

1. Ở [màn hình huỷ ghép đôi](../../phase-01/steps/g-settings.md), nếu còn thư chưa mở thì
   thêm một dòng vào phần giải thích:
   > *• Còn **2 lá thư** sẽ mở vào 2027 và 2036 — chúng vẫn mở đúng hẹn*

2. Đây là hệ quả của quyết định trong đặc tả: **thư vẫn mở đúng ngày kể cả sau khi huỷ ghép
   đôi**. Lá thư là lời của quá khứ; khoá nó lại vì hiện tại đã đổi là tước đi thứ thuộc về
   cả hai.

3. Nhưng ở bước **xoá vĩnh viễn** space thì phải nhắc mạnh hơn:
   > ⚠️ *2 lá thư chưa mở sẽ bị xoá và không bao giờ đọc được.*

4. Space `archived` vẫn chạy cron mở thư. Kiểm lại điều kiện lọc trong
   [P5-20](#p5-20--push-khi-thư-mở-khoá) không loại space `archived` ra.

**Xong khi:** màn hình huỷ ghép đôi hiện đúng số thư chưa mở và năm sẽ mở.

**Bẫy**
- Điểm 4 dễ sai: phần lớn query khác trong app đều lọc `status = 'active'`. Ở đây thì
  **không được lọc**.
