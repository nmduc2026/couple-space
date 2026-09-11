# C. Check-in tâm trạng — P5-22 → P5-28

Đặc tả: [p5-mood-checkin.md](../../../docs/features/p5-mood-checkin.md).
Xem trước: màn hình **P5-04** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> Kỹ thuật nhóm này nhẹ. Phần khó là **giữ đúng giọng** — đặc biệt ở P5-28 (streak), chỗ
> dễ trượt thành một trò chơi tính điểm.

---

## P5-22 · Migration `mood_checkins`

**Các bước**

1. ```sql
   create table public.mood_checkins (
     id          uuid primary key default gen_random_uuid(),
     couple_id   uuid not null references public.couples(id) on delete cascade,
     user_id     uuid not null references public.profiles(id) on delete cascade,
     checked_on  date not null,
     level       int not null check (level between 1 and 5),
     note        text,
     created_at  timestamptz not null default now(),
     updated_at  timestamptz not null default now(),
     unique (couple_id, user_id, checked_on)
   );
   create index on public.mood_checkins (couple_id, checked_on desc);
   ```

2. `level` là **số 1–5**, không phải emoji. Emoji là chuyện hiển thị và có thể đổi; số thì
   vẽ biểu đồ được và không bao giờ đổi nghĩa.

   | level | |
   |---|---|
   | 1 | 😞 tệ |
   | 2 | 😕 không ổn lắm |
   | 3 | 😐 bình thường |
   | 4 | 🙂 ổn |
   | 5 | 😍 rất vui |

3. `unique` đảm bảo một người một ngày một bản ghi.

4. `checked_on` theo **múi giờ máy** của người check-in (khác với câu hỏi mỗi ngày — ở đây
   không cần hai người đồng bộ).

5. Bật RLS: đọc `is_member_of`, ghi chỉ dòng của mình.

**Xong khi:** check-in hai lần trong ngày → bản ghi thứ hai **ghi đè** (upsert), không tạo dòng mới.

---

## P5-23 · Màn hình check-in

**Các bước**

1. Năm khuôn mặt thành một hàng, ô vuông, chạm một cái là xong:
   ```
   Hôm nay bạn thế nào?
   [😞] [😕] [😐] [🙂] [😍]
   ```

2. Ghi chú **tuỳ chọn**, một dòng, dưới hàng mặt. Phần lớn ngày sẽ không có ghi chú — và
   như vậy là đúng.

3. **Lưu ngay khi chạm mặt**, không có nút "Lưu". Ghi chú tự lưu khi rời ô.

4. Đã check-in hôm nay → mặt đã chọn có viền nhấn, đổi được bất cứ lúc nào **trong ngày**.

5. **Không cho check-in cho ngày quá khứ.** Nhớ lại tâm trạng hôm kia là bịa.

6. Lối vào: thẻ trên Home (chỉ hiện nếu **hôm nay chưa check-in**) + mục trong tab Kế hoạch.

**Xong khi:** check-in xong trong một chạm; đổi lại trong ngày được.

**Bẫy**
- Đừng hiện thẻ nhắc check-in trên Home sau khi đã check-in. Việc đã xong mà vẫn thấy lời
  nhắc là cảm giác khó chịu.

---

## P5-24 · Realtime

**Các bước**

1. Đăng ký kênh realtime cho `mood_checkins` lọc theo `couple_id` — dùng lại cách đã làm với
   [bình luận ở Phase 2](../../phase-02/steps/d-reactions.md).
2. Người kia check-in khi mình đang mở → biểu đồ và trạng thái hôm nay cập nhật ngay.
3. **Huỷ đăng ký khi rời màn hình.** Quên là app chậm dần một cách khó hiểu.
4. Nhớ bật Realtime cho bảng này trong bảng điều khiển Supabase — mặc định **tắt**.

**Xong khi:** hai máy cùng mở màn hình tâm trạng, máy A check-in → máy B thấy trong vài giây.

---

## P5-25 · Push chỉ khi không ổn

**Các bước**

1. Gửi push **chỉ khi** `level ≤ 2`. Push mỗi lần check-in là spam; push khi người ta không
   ổn là đúng việc.

2. Nội dung cố ý nhẹ, **không kịch tính**:
   > *"Linh vừa check-in — hôm nay không được ổn lắm"*

   Không dùng "buồn", "tệ", "có chuyện gì", không emoji khóc.

3. Có ghi chú thì kèm đoạn đầu (60 ký tự).

4. Chạm vào → mở màn hình tâm trạng, không phải Home.

5. Đổi từ 😞 sang 🙂 trong cùng ngày → **không gửi** push thứ hai. Một lần mỗi ngày là đủ.

6. Bật/tắt riêng trong Cài đặt, mặc định **bật**.

**Xong khi:** máy A chọn 😞 → máy B nhận push; chọn 🙂 → không có push nào.

---

## P5-26 · Biểu đồ

**Các bước**

1. Mặc định **7 ngày gần nhất**, chuyển được sang 30 ngày.

2. Mỗi ngày **hai cột sát nhau**, hai màu — phải đọc được **sự lệch nhau**, đó là toàn bộ
   giá trị của biểu đồ này:
   ```
   Minh  ██  ███ ███ ██  ████ ████ ███
   Linh  ███ █   █   █   ██   ████ ███
         T2  T3  T4  T5  T6   T7   CN
   ```

3. Không cần thư viện — flexbox với chiều cao theo `level × 20%`.

4. Màu: một màu là màu chủ đạo, một màu khác hẳn (xanh). Kiểm cả **chế độ tối**.

5. Ngày không check-in → cột trống (không phải cột thấp nhất). Trống ≠ tệ.

6. Chạm vào một cột → xem ghi chú của ngày đó.

7. Chú thích tên hai người dưới biểu đồ.

**Xong khi:** nhìn biểu đồ 7 ngày là thấy ngay ai đang đuối hơn.

---

## P5-27 · Câu nhận xét

**Mục tiêu:** một câu biến biểu đồ thành thông tin.

**Các bước**

1. ⚠️ **Chỉ hiện khi có ít nhất 5 ngày dữ liệu của cả hai.** Nhận xét trên 2 điểm là đoán
   mò — và đoán sai về tâm trạng người khác thì phản tác dụng.

2. Vài mẫu, chọn câu đầu tiên đủ điều kiện:

   | Điều kiện | Câu |
   |---|---|
   | Một người trung bình thấp hơn hẳn ở giữa tuần | *"Giữa tuần Linh có vẻ đuối. Cuối tuần thì cả hai đều ổn."* |
   | Cả hai cùng cao ở cuối tuần | *"Cuối tuần đúng là của tụi mình 🤍"* |
   | Cả hai đều ổn định | *"Tuần này cả hai đều đều đều, không có gì bất thường."* |
   | Không khớp mẫu nào | (ẩn dải này) |

3. **Giọng: mô tả, không phán xét, không khuyên.** Không có *"bạn nên hỏi thăm Linh"* —
   app không làm thay việc của con người.

4. Tuyệt đối không có lời khuyên mang màu sắc y tế hay tâm lý.

**Xong khi:** với dữ liệu thật, câu nhận xét đọc lên thấy đúng chứ không thấy gượng.

---

## P5-28 · Streak — làm cẩn thận

> **Đây là chỗ dễ trượt nhất của cả Phase 5 về mặt sản phẩm.**

**Mục tiêu:** một con số vui, không phải một nghĩa vụ.

**Các bước**

1. Streak đếm **chuỗi ngày cả hai cùng check-in**, không phải chuỗi của riêng ai.

   Lý do: streak cá nhân biến nó thành nhiệm vụ của mỗi người; streak chung biến nó thành
   thứ hai người cùng giữ. Khác nhau hoàn toàn về cảm giác.

2. Hiện gọn: `🔥 23 ngày cả hai cùng check-in`.

3. **Khi streak đứt:**

   | | |
   |---|---|
   | ✅ Con số về 0 | |
   | ❌ **Không** thông báo | |
   | ❌ **Không** hiện "đã đứt streak 5 ngày trước" | |
   | ❌ **Không** thống kê số lần đứt | |
   | ❌ **Không** có "streak dài nhất từ trước tới nay" | |

4. Không huy hiệu, không bảng xếp hạng, không *"cố lên, còn 2 ngày nữa là 30!"*.

5. Streak = 0 hoặc 1 → **ẩn hẳn dòng này**. Hiện "🔥 0 ngày" là nhắc về thất bại.

6. Ghi comment trong code:
   ```
   // Streak CHUNG (cả hai cùng check-in), không phải streak cá nhân.
   // Đứt thì im lặng: không thông báo, không thống kê.
   // Xem docs/features/p5-mood-checkin.md mục 2.
   ```

**Xong khi:** bỏ một ngày check-in → streak về 0 và **không có gì khác xảy ra**.

**Bẫy**
- Đặc tả đã ghi sẵn một điều đáng nhớ: *nếu sau vài tháng thấy streak vẫn tạo cảm giác nghĩa
  vụ — **bỏ nó đi***. Nguyên tắc "không biến tình yêu thành KPI" đứng trên tính năng này.
  Đừng ngại xoá.
