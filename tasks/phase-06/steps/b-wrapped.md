# B. Wrapped — P6-11 → P6-21

Đặc tả: [p6-wrapped.md](../../../docs/features/p6-wrapped.md).
Xem trước: màn hình **P6-02** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

> **Nhiệm vụ của nhóm này là kể một câu chuyện, không phải xuất một báo cáo.**
>
> Con số thì query nào cũng lấy được. Cái khó là chọn con số nào, bỏ con số nào, và viết câu
> gì quanh chúng.

---

## P6-11 · View gom số liệu cả năm

**Các bước**

1. Một SQL view (hoặc function nhận `couple_id` + `year`) gom từ **mọi** nguồn:

   | Nhóm | Lấy từ | Chỉ số |
   |---|---|---|
   | Thời gian | `couples.start_date` | ngày thứ N → M trong năm |
   | Gặp gỡ | `posts` | số bài · số ảnh · tháng nhiều ảnh nhất |
   | Nơi chốn | `place_mappings` + `posts` | số tỉnh · nơi xa nhất |
   | Tiền | `expenses` | tổng chi · buổi hẹn đắt nhất |
   | Ăn uống | `eat_visits` | số lần đi ăn · quán quen |
   | Việc đã làm | `goals` | số mục tiêu hoàn thành |
   | Lời nói | `question_answers` | số câu đã trả lời |

2. Mỗi chỉ số trả kèm **cờ `has_data`** — để P6-13 biết nhóm nào đáng hiện.

3. Lọc theo năm bằng ngày **của người dùng**, không phải UTC: `spent_on`, `happened_on`,
   `visited_on` đều là kiểu `date` nên so trực tiếp được.

4. ⚠️ View phải **chịu được thiếu nguồn**. Nếu Phase 5 chưa làm thì `question_answers` chưa
   tồn tại — dùng `left join` và `coalesce`, đừng để cả view vỡ.

**Xong khi:** chạy view với dữ liệu thật một năm, các con số khớp khi kiểm tay vài cái.

---

## P6-12 · Lưu kết quả

**Các bước**

1. ```sql
   create table public.wrapped_reports (
     id         uuid primary key default gen_random_uuid(),
     couple_id  uuid not null references public.couples(id) on delete cascade,
     year       int not null,
     data       jsonb not null,          -- toàn bộ số liệu đã tính
     created_at timestamptz not null default now(),
     unique (couple_id, year)
   );
   ```

2. Tính **một lần** (Edge Function), lưu vào đây, xem lại vĩnh viễn. Không tính lại mỗi lần mở.

3. Lý do lưu chứ không tính động: dữ liệu nguồn sẽ đổi (xoá bài, dọn ảnh sau 6 tháng
   archived) — Wrapped 2026 phải giữ nguyên con số của năm 2026.

4. Trước 31/12 thì tính lại mỗi lần mở và ghi rõ *"tạm tính tới hôm nay"*. Từ 31/12 thì
   **chốt**, không tính lại nữa.

**Xong khi:** sinh Wrapped 2026, xoá vài bài, mở lại → số liệu **không đổi**.

---

## P6-13 · Chỉ hiện nhóm có dữ liệu

**Các bước**

1. Duyệt các nhóm, bỏ nhóm `has_data = false`.

2. ❌ **Không bao giờ hiện số 0.** *"0 chuyến đi"*, *"0 mục tiêu hoàn thành"* — mỗi con số 0
   là một lời nhắc về việc đã không làm.

3. Còn ít hơn 3 nhóm → chuyển sang bản rút gọn ở P6-15.

4. Thứ tự nhóm cố định (thời gian → gặp gỡ → nơi chốn → tiền → ăn uống → việc làm → lời nói),
   nhóm nào thiếu thì bỏ, không xáo lại.

**Xong khi:** tài khoản chưa dùng chi tiêu → Wrapped **không có** phần tiền, và không trống chỗ.

---

## P6-14 · Câu kết bằng văn

**Các bước**

1. Dưới phần số, một đoạn văn ngắn ghép từ 2–3 chỉ số có thật:
   > *"Năm nay tụi mình đi ăn 67 lần, xem 14 bộ phim, và đi được 5 tỉnh thành."*

2. Ghép theo mẫu, chọn các chỉ số **lớn và cụ thể**. Bỏ chỉ số quá nhỏ (dưới 3) khỏi câu —
   *"xem 1 bộ phim"* nghe buồn hơn là không nhắc tới.

3. Đây là phần biến bảng số thành câu chuyện. Viết vài mẫu và chọn theo dữ liệu sẵn có, đừng
   dùng một mẫu cứng.

**Xong khi:** câu kết đọc lên tự nhiên, không có mệnh đề nào gượng.

---

## P6-15 · Bản rút gọn cho cặp mới quen

**Các bước**

| Dữ liệu có | Hiện gì |
|---|---|
| Dưới 30 ngày | **Không hiện Wrapped.** Thay bằng: *"Tụi mình mới bắt đầu thôi — hẹn gặp lại cuối năm sau nhé 🤍"* |
| 30 ngày – 6 tháng | Bản rút gọn, nhấn vào **mật độ** |
| Trên 6 tháng | Bản đầy đủ |

1. Bản rút gọn đổi **cách kể**, không chỉ bớt số:
   > *"Tụi mình mới quen 4 tháng, mà đã đi được 23 buổi hẹn."*

   Chữ *"mà đã"* làm con số nhỏ thành thành tích. Cùng dữ liệu, khác cảm giác.

2. Bỏ mọi chỉ số theo năm (tháng nhiều ảnh nhất…) — không đủ dữ liệu để có nghĩa.

**Xong khi:** tạo space mới, thêm vài bài → thấy bản rút gọn, không thấy màn hình đầy số 0.

---

## P6-16 · Rà giọng văn

> **Task không viết code**, nhưng là task quyết định Wrapped có được chia sẻ hay không.

**Các bước**

1. Rà **mọi** câu app có thể sinh ra, xoá hết những câu so sánh theo hướng tiêu cực:

   | ❌ Không bao giờ | ✅ Thay bằng |
   |---|---|
   | *"ít hơn năm ngoái 30 buổi hẹn"* | (bỏ hẳn so sánh giảm) |
   | *"tháng 7 tụi mình không gặp nhau lần nào"* | (không nhắc tháng rỗng) |
   | *"chỉ hoàn thành 2/11 mục tiêu"* | *"hoàn thành 2 mục tiêu"* |
   | *"tiêu nhiều hơn năm ngoái 40%"* | *"tiêu 31,2 triệu cùng nhau"* |

2. Nguyên tắc: **chỉ kể cái đã có.** Không kể cái đã thiếu, không đối chiếu để làm nổi sự sụt giảm.

3. So sánh **tăng** thì được (*"nhiều hơn năm ngoái 12 chuyến"*) — nhưng chỉ khi tăng thật.

4. Đọc to toàn bộ Wrapped một lượt. Câu nào nghe như lời trách thì sửa.

**Xong khi:** không câu nào trong app có thể làm người đọc thấy tệ về năm của mình.

---

## P6-17 · Chọn thứ muốn khoe

**Các bước**

1. Trước khi xuất ảnh, một màn hình bật/tắt **từng dòng**:
   ```
   ☑ Số buổi hẹn            126
   ☑ Số tỉnh thành          5
   ☐ Tổng chi tiêu          31,2 triệu     ← mặc định TẮT
   ☑ Số ảnh                 892
   ☐ Quán ăn nhiều nhất     Bún chả Hàng Quạt  ← mặc định TẮT
   ☐ Tên hai người                              ← mặc định TẮT
   ```

2. **Mặc định TẮT** cho: số tiền · tên địa điểm cụ thể · tên thật · ảnh thật · caption.

   Đây là ảnh sẽ ra internet công khai. Mặc định phải là an toàn, người dùng chủ động bật
   thứ họ muốn khoe.

3. Ghi nhớ lựa chọn cho lần sau.

**Xong khi:** mặc định không có thông tin nhạy cảm nào trên ảnh xuất ra.

---

## P6-18 · Vẽ ảnh chia sẻ bằng Canvas

**Các bước**

1. Vẽ bằng **Canvas API**, xuất PNG. Không dùng thư viện chuyển HTML→ảnh (nặng, và hay sai
   font trên iOS).

2. Kích thước **1080×1920** (khổ story) — khổ được chia sẻ nhiều nhất.

3. Vẽ: nền gradient · năm · con số lớn nhất · lưới các chỉ số đã bật · tên app nhỏ ở dưới.

4. ⚠️ **Font phải tải xong trước khi vẽ.** `document.fonts.ready` rồi mới `drawImage`/`fillText`,
   nếu không chữ ra font mặc định.

5. Kiểm tràn chữ: tên quán dài, số lớn — đo bằng `measureText` và thu nhỏ cỡ chữ nếu cần.

**Xong khi:** ảnh xuất ra sắc nét, chữ đúng font, không tràn ở mọi bộ dữ liệu thử.

---

## P6-19 · Xem trước đúng như ảnh thật

**Các bước**

1. Bản xem trước phải là **chính tấm ảnh Canvas đã vẽ**, thu nhỏ lại — không phải một bản
   HTML dựng gần giống.

2. Lý do: hai bản dựng bằng hai cách khác nhau **sẽ** lệch nhau, và người dùng chỉ phát hiện
   sau khi đã đăng lên mạng xã hội.

3. Vẽ lại xem trước mỗi khi người dùng bật/tắt một dòng ở P6-17.

**Xong khi:** thứ nhìn thấy ở xem trước giống hệt file tải về, từng pixel.

---

## P6-20 · Chia sẻ ảnh

**Các bước**

1. Ưu tiên `navigator.share()` với file — iOS hỗ trợ và mở đúng bảng chia sẻ hệ thống:
   ```js
   const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
   const file = new File([blob], 'wrapped-2026.png', { type: 'image/png' })
   if (navigator.canShare?.({ files: [file] })) {
     await navigator.share({ files: [file] })
   }
   ```

2. ⚠️ **Đường lùi bắt buộc:** trình duyệt chặn nhiều kiểu tải file do script khởi tạo. Nếu
   `canShare` trả `false` → **hiện tấm ảnh ra màn hình** kèm hướng dẫn:
   > *Nhấn giữ ảnh rồi chọn "Lưu vào Ảnh"*

   Cách này luôn chạy, ở mọi trình duyệt.

3. `navigator.share()` **chỉ chạy trên HTTPS** và **phải gọi ngay trong một thao tác chạm** —
   không gọi được sau `await` dài. Chuẩn bị blob **trước**, chia sẻ ngay khi chạm.

**Xong khi:** trên iPhone thật, chia sẻ được ảnh sang Messenger/Instagram; và đường lùi cũng
hoạt động khi ép nó chạy.

---

## P6-21 · Lịch xuất hiện

**Các bước**

1. Từ **15/12**: thẻ Wrapped hiện trên Home, đầu trang.
2. Push **một lần** vào 15/12: *"Tổng kết năm của tụi mình đã sẵn sàng 🎉"*
3. Trước 31/12: ghi nhãn *"tạm tính tới hôm nay"*.
4. Từ 31/12: chốt số liệu, bỏ nhãn.
5. Sau 31/01: thẻ rời khỏi Home, vào mục "Tổng kết các năm" trong Cài đặt.
6. Wrapped các năm cũ **luôn xem lại được** ở mục đó.

**Xong khi:** đổi ngày máy sang 20/12 → thẻ hiện trên Home với nhãn tạm tính.

**Bẫy**
- Đừng gửi push Wrapped nhiều lần. Một lần duy nhất — đây là loại thông báo mà người ta
  hoặc mở ngay, hoặc không bao giờ.
