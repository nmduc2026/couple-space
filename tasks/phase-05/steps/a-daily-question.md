# A. Câu hỏi mỗi ngày — P5-01 → P5-12

Đặc tả: [p5-daily-question.md](../../../docs/features/p5-daily-question.md).
Xem trước: màn hình **P5-01** và **P5-02** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Đây là tính năng giữ chân mạnh nhất của app**, và toàn bộ sức mạnh của nó nằm ở một
> cơ chế: *chỉ thấy câu trả lời của người kia sau khi mình đã trả lời*.
>
> Làm cơ chế đó ở tầng giao diện = không làm gì cả.

---

## P5-01 · Soạn ngân hàng câu hỏi

**Mục tiêu:** ~300 câu tiếng Việt, dùng được trong 10 tháng không lặp.

**Các bước**

1. File tĩnh trong app (`src/data/questions.ts`), **không gọi API bên ngoài** — vừa tốn
   tiền, vừa phải chờ mạng, vừa mất kiểm soát nội dung.

2. Mỗi câu có `tone` để giữ nhịp:

   | Tone | Tỉ lệ | Ví dụ |
   |---|---|---|
   | `nhẹ` | 30% | *"Sáng nay em ăn gì?"* |
   | `vui` | 25% | *"Nếu anh là một món ăn, anh nghĩ mình là món gì?"* |
   | `sâu` | 20% | *"Điều gì ở anh/em khiến bạn thấy an toàn nhất?"* |
   | `nhìn lại` | 15% | *"Lần đầu gặp nhau, em nghĩ gì về anh?"* |
   | `nhìn tới` | 10% | *"Năm sau tụi mình nên thử làm gì cùng nhau?"* |

3. **Không xếp liền hai câu `sâu`.** Trộn có luật ở P5-03, không trộn thuần ngẫu nhiên.

4. Giọng văn: xưng hô trung tính (*"anh/em"*, *"người ấy"*), không giả định giới tính, không
   giả định đã sống chung hay chưa.

5. Tránh câu có thể gây tổn thương: không hỏi về người yêu cũ, về ngoại hình, về tiền bạc
   cá nhân, về gia đình theo hướng so sánh.

**Xong khi:** có ~300 câu, đọc lướt 30 câu bất kỳ không thấy câu nào lạc giọng hoặc gây khó xử.

**Bẫy**
- Đây là task **viết**, không phải task code. Đừng nhờ AI sinh 300 câu rồi dùng thẳng — đọc
  lại từng câu. Một câu vô duyên sẽ xuất hiện đúng vào ngày hai người đang giận nhau.

---

## P5-02 · Migration `question_answers`

**Các bước**

1. ```sql
   create table public.question_answers (
     id          uuid primary key default gen_random_uuid(),
     couple_id   uuid not null references public.couples(id) on delete cascade,
     user_id     uuid not null references public.profiles(id) on delete cascade,
     question_index int not null,      -- vị trí trong ngân hàng, sau khi xáo
     asked_on    date not null,        -- ngày câu hỏi được đưa ra
     body        text not null check (length(trim(body)) > 0),
     edited_at   timestamptz,
     created_at  timestamptz not null default now(),
     unique (couple_id, asked_on, user_id)
   );
   create index on public.question_answers (couple_id, asked_on desc);
   ```

2. `unique (couple_id, asked_on, user_id)` — mỗi người một câu trả lời cho mỗi ngày.

3. Lưu cả `question_index` **và** `asked_on`: index để biết câu nào, ngày để tra nhanh và
   để "sách hỏi đáp" sắp theo thời gian.

**Xong khi:** chèn hai câu trả lời cùng ngày cùng người → lần hai bị chặn.

---

## P5-03 · Hàm chọn câu của ngày

**Mục tiêu:** mỗi cặp một thứ tự riêng, nhưng **luôn tính lại được**.

**Các bước**

1. Không lưu bảng "đã dùng câu nào". Thay vào đó, tính:
   ```
   seed        = hash(couple_id)
   thứ tự      = xáo ngân hàng bằng seed đó   (xáo tất định, cùng seed ra cùng kết quả)
   ngày thứ n  = asked_on − ngày ghép đôi
   câu hôm nay = thứ tự[ n mod 300 ]
   ```

2. **Tất định** nghĩa là chạy lại bao giờ cũng ra cùng kết quả — quan trọng vì cả hai máy
   phải thấy **cùng một câu**, và vì mở lại sách hỏi đáp năm sau vẫn phải khớp.

3. Áp luật "không hai câu `sâu` liền nhau" **lên thứ tự đã xáo**, một lần, lúc tính.

4. Hết 300 câu (~10 tháng) thì quay vòng. Đây **không phải lỗi**: câu cũ đã đủ xa để trả lời
   lại thấy thú vị, và so với câu trả lời năm ngoái là một tính năng hay.

5. Hàm chạy ở **client** cũng được (ngân hàng nằm trong app), nhưng `asked_on` phải lấy theo
   múi giờ space ở P5-04.

**Xong khi:** hai máy khác nhau, cùng một space → hiện **cùng một câu**. Đổi sang space khác
→ câu khác.

---

## P5-04 · Múi giờ của space

**Mục tiêu:** "hôm nay" là như nhau với cả hai người.

**Các bước**

1. Thêm cột `timezone text not null default 'Asia/Ho_Chi_Minh'` vào bảng `couples`, đặt
   lúc tạo space theo máy người tạo.

2. ⚠️ **Dùng múi giờ của space, KHÔNG phải của máy.** Nếu mỗi máy tự tính, hai người yêu xa
   có thể nhận hai câu khác nhau — và cơ chế che hoàn toàn vô nghĩa.

3. So sánh với [đếm ngày](../../phase-01/steps/f-home.md), nơi quy tắc **ngược lại** (mỗi máy
   theo múi giờ của mình). Khác biệt là có chủ đích:

   | | Múi giờ dùng | Vì sao |
   |---|---|---|
   | Đếm ngày | **Máy** | Con số cá nhân, lệch 1 ngày là đúng với cảm nhận mỗi người |
   | Câu hỏi mỗi ngày | **Space** | Phải là **cùng một câu** thì mới che/mở khoá được |

4. Nói rõ trong Cài đặt: *"Câu hỏi đổi lúc 00:00 giờ Việt Nam"*, cho đổi được.

**Xong khi:** đổi múi giờ một máy sang UTC-8 → vẫn thấy đúng câu hỏi mà máy kia đang thấy.

---

## P5-05 · 🔒 RLS có điều kiện

> **Task quan trọng nhất cả Phase 5.**

**Mục tiêu:** không đọc được câu trả lời của người kia khi mình chưa trả lời.

**Các bước**

1. Policy đọc:
   ```sql
   create policy qa_read on public.question_answers for select using (
     public.is_member_of(couple_id)
     and (
       user_id = auth.uid()                      -- câu của mình: luôn đọc được
       or exists (                               -- câu người kia: chỉ khi mình đã trả lời
         select 1 from public.question_answers mine
         where mine.couple_id = question_answers.couple_id
           and mine.asked_on  = question_answers.asked_on
           and mine.user_id   = auth.uid()
       )
     )
   );
   ```

2. Policy ghi: chỉ ghi được dòng của chính mình, và `can_write_to(couple_id)`.

3. Policy sửa: chỉ dòng của mình, và trong 24 giờ — xem P5-09.

4. ⚠️ **Đừng làm bằng view hay RPC "an toàn".** Bảng vẫn phải tự bảo vệ được: app có thể gọi
   thẳng bảng, và một phiên làm việc sau có thể thêm query mới mà quên đi qua view.

**Xong khi:** policy đã chạy. Kiểm chứng thật ở P5-06 — **chưa kiểm thì coi như chưa xong**.

---

## P5-06 · Kiểm chứng bằng API trực tiếp

**Mục tiêu:** chứng minh cơ chế che là thật.

**Các bước**

1. Hai tài khoản A và B cùng space. **Chỉ B trả lời** câu hôm nay.

2. Lấy access token của A (in ra từ `supabase.auth.getSession()` lúc dev).

3. Gọi thẳng:
   ```powershell
   curl "https://<project>.supabase.co/rest/v1/question_answers?select=*&asked_on=eq.2026-09-12" `
     -H "apikey: <anon>" -H "Authorization: Bearer <token cua A>"
   ```

4. ✅ Đúng: trả về **mảng rỗng**.
   ❌ Sai: có dòng của B → policy chưa đúng, quay lại P5-05.

5. Cho A trả lời, gọi lại → giờ phải thấy **cả hai** dòng.

6. Thử thêm các đường vòng: `select=body`, lọc `user_id=eq.<id cua B>`, gọi qua RPC khác.
   Tất cả phải cùng kết quả.

**Xong khi:** cả bước 4, 5, 6 đều đúng. **Ghi kết quả vào nhật ký phiên** của
[../context.md](../context.md) — đây là loại kiểm chứng mà phiên sau cần biết đã làm rồi.

---

## P5-07 · Màn hình câu hỏi — 4 trạng thái

**Các bước**

| Trạng thái | Hiện gì |
|---|---|
| Cả hai chưa trả lời | Câu hỏi + ô nhập |
| Người kia đã trả lời, mình chưa | Câu hỏi + ô nhập + **khối che** + *"Linh đã trả lời rồi"* |
| Mình đã trả lời, người kia chưa | Câu trả lời của mình + *"Đang chờ Linh"* |
| Cả hai đã trả lời | Cả hai câu, kèm avatar |

1. Lối vào: một thẻ trên Home + mục trong tab Kế hoạch. Không thêm tab thứ năm.
2. Realtime: người kia trả lời khi mình đang mở → chuyển trạng thái ngay.
3. Trạng thái 2 là trạng thái **tạo động lực**. Đừng làm nó nhạt.

**Xong khi:** đi qua đủ bốn trạng thái trên hai máy thật.

---

## P5-08 · Khối che phải là khối giả

**Mục tiêu:** không gỡ được bằng devtools.

**Các bước**

1. ❌ **Sai:** lấy nội dung thật rồi `filter: blur(8px)` — mở devtools tắt CSS là đọc được.
   (Prototype dùng cách này vì nó chỉ để xem hình dạng, không phải bản thật.)

2. ✅ **Đúng:** API **không trả** nội dung (đã chặn ở P5-05), app dựng một khối giả:
   - vài dòng chữ nhật bo tròn, dài ngẫu nhiên nhưng **tất định theo ngày** (không nhấp nháy
     mỗi lần render)
   - ước lượng số dòng theo độ dài thật? **Không** — kể cả độ dài cũng là thông tin. Luôn 2 dòng.

3. Dưới khối: 🔒 *"Linh đã trả lời rồi. Trả lời của bạn để mở khoá."*

**Xong khi:** mở devtools, xem cây DOM và tab Network — **không tìm thấy** nội dung câu trả
lời của người kia ở bất kỳ đâu.

---

## P5-09 · Sửa trong 24 giờ

**Các bước**

1. Sửa được trong **24 giờ** kể từ lúc gửi, ghi `edited_at`, hiện nhãn *"đã chỉnh"*.

2. Sau 24 giờ: khoá. Lý do: nếu sửa được mãi thì người ta sẽ đọc câu của người kia rồi sửa
   lại câu mình — và ý nghĩa của cơ chế mất sạch.

3. Chặn ở **policy**, không chỉ ở giao diện:
   ```sql
   using (user_id = auth.uid() and created_at > now() - interval '24 hours')
   ```

4. Xoá câu trả lời của mình: cho phép, nhưng **không khoá lại** câu người kia (họ đã đọc rồi).

**Xong khi:** sửa được ngay sau khi gửi; giả lập `created_at` 25 giờ trước → API từ chối.

---

## P5-10 · Mục "Bỏ lỡ"

**Các bước**

1. Câu chưa trả lời của **7 ngày gần nhất** hiện trong mục "Bỏ lỡ", trả lời bù được.
2. Trả lời bù vẫn ghi đúng `asked_on` của ngày đó, không phải hôm nay.
3. Quá 7 ngày thì thôi — **không dồn**. Mỗi ngày một câu, bỏ lỡ thì bỏ lỡ.
4. Mục này **mặc định gập**, và ẩn hẳn khi không có câu nào bỏ lỡ.

**Xong khi:** bỏ 2 ngày → thấy 2 câu trong mục Bỏ lỡ, trả lời được, ngày ghi đúng.

**Bẫy**
- Đừng hiện "Bạn đã bỏ lỡ 12 câu" ở chỗ dễ thấy. Đó là đếm lỗi, và app này không đếm lỗi.

---

## P5-11 · Sách hỏi đáp

**Các bước**

1. Danh sách mọi câu **đã mở khoá**, mới nhất trước, nhóm theo tháng.
2. Mỗi mục: câu hỏi + hai câu trả lời + ngày.
3. Tìm theo từ khoá trong nội dung (`ilike`, đủ dùng ở quy mô này).
4. Câu chưa mở khoá **không hiện** trong sách.
5. Quay vòng qua năm thứ hai → cùng câu hỏi hiện hai lần với hai năm khác nhau. Ghép chúng
   cạnh nhau: *"Năm ngoái em trả lời…"* — đây là thứ hay nhất của tính năng này.

**Xong khi:** sau vài chục câu, mở sách ra đọc thấy thích. Đó là tiêu chí thật.

---

## P5-12 · Thông báo

**Các bước**

1. Hai loại push, dùng lại hàm gửi từ
   [Phase 1](../../phase-01/steps/e-notifications.md):

   | Khi nào | Nội dung |
   |---|---|
   | 9:00 sáng, nếu **chưa ai** trả lời | *"Câu hỏi hôm nay đã sẵn sàng 💭"* |
   | Người kia vừa trả lời, mình chưa | *"Linh đã trả lời câu hỏi hôm nay — tới lượt bạn"* |

2. Push buổi sáng gửi qua cron đã dựng ở [Phase 3](../../phase-03/steps/d-reminders.md) —
   thêm một nhánh, không tạo job mới.

3. **Tối đa một lần nhắc mỗi ngày.** Không nhắc buổi tối, không nhắc lại.

4. Bật/tắt riêng trong Cài đặt, mặc định **bật**.

5. Chạm vào → mở thẳng màn hình câu hỏi.

**Xong khi:** máy B trả lời → máy A nhận thông báo trong vài giây, chạm vào mở đúng màn hình.
