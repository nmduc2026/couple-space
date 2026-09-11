# C. Giao diện Kế hoạch — P3-09 → P3-14

Đặc tả: [p3-events-reminders.md](../../../docs/features/p3-events-reminders.md) mục 4.
Xem trước: màn hình **P3-02** và **P3-03** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

---

## P3-09 · Mở tab Kế hoạch

**Mục tiêu:** tab thứ ba xuất hiện trong tab bar.

**Các bước**

1. Gỡ `opacity: .3` và trạng thái vô hiệu của tab **📅 Kế hoạch** (đã dựng sẵn nhưng ẩn từ
   [Phase 2](../../phase-02/steps/f-home.md)).

2. Tab có **hai tab con**: `Sự kiện` | `Mục tiêu`. Phase 3 chỉ làm Sự kiện — tab Mục tiêu
   để **ẩn**, mở ở Phase 4.

3. Nút (+) giờ có hai mục: `Kỉ niệm mới` · `Sự kiện mới`. Đây là lúc bảng chọn của nút (+)
   bắt đầu có nghĩa (Phase 2 chỉ có một mục nên mở thẳng).

**Xong khi:** bấm tab Kế hoạch ra danh sách sự kiện; nút (+) hiện bảng chọn hai mục.

**Bẫy**
- Đừng hiện tab con "Mục tiêu" ở trạng thái rỗng. Tab bấm vào ra màn hình trống tệ hơn là
  chưa có tab — cùng bài học với tab bar ở Phase 2.

---

## P3-10 · Vòng tròn đếm ngược

**Mục tiêu:** nhìn là biết gấp hay chưa, không phải đọc số.

**Các bước**

1. Vòng tròn bằng **`conic-gradient`**, không cần thư viện, không cần SVG:
   ```css
   .ring {
     background: conic-gradient(var(--color-accent) var(--p), var(--color-soft) 0);
   }
   .ring span {          /* lõi trắng ở giữa */
     position: absolute; inset: 3.5px; border-radius: 50%;
     background: var(--color-surface);
   }
   ```
   Truyền `--p` từ JS.

2. **`--p` biểu diễn cái gì** — quyết định này ảnh hưởng ý nghĩa của hình:
   - Chọn: **phần trăm thời gian đã trôi qua kể từ mốc nhắc xa nhất**.
   - Ví dụ nhắc trước 30 ngày, còn 12 ngày → `--p = (30-12)/30 = 60%`.
   - Sự kiện không có mốc nhắc → quy ước cửa sổ 90 ngày.

3. Trong vòng tròn: số ngày còn lại + chữ "ngày" nhỏ bên dưới.

4. Còn 0 ngày (hôm nay) → vòng đầy, đổi sang màu nhấn, chữ "hôm nay".

**Xong khi:** bốn sự kiện với số ngày khác nhau cho ra bốn vòng tròn đầy khác nhau, nhìn
là phân biệt được.

**Bẫy**
- `conic-gradient` cần đơn vị `%` hoặc `deg` — truyền số trần thì không chạy và **không
  báo lỗi**.

---

## P3-11 · Phân biệt mốc hệ thống

**Mục tiêu:** rõ ràng cái nào tự sinh, cái nào mình tạo.

**Các bước**

1. Nhãn nhỏ `hệ thống` ở cuối dòng, chữ nhạt, viền mảnh.
2. Nhấn giữ mốc hệ thống → bảng chọn **chỉ có** "Tắt nhắc", không có "Sửa"/"Xoá".
3. Nhấn giữ sự kiện người dùng → đủ "Sửa" · "Tắt nhắc" · "Xoá".

**Xong khi:** không có đường nào dẫn tới việc xoá một mốc hệ thống.

---

## P3-12 · Mục "Đã qua"

**Mục tiêu:** nhìn lại được, nhưng không chiếm chỗ.

**Các bước**

1. Tiêu đề gập: `Đã qua (7) ▾`, **mặc định đóng**.
2. Mở ra: sự kiện đã qua, mới nhất trước, chữ nhạt hơn.
3. Sự kiện `yearly`/`monthly` **không bao giờ** vào đây — chúng luôn có lần tiếp theo.
   Chỉ `once` mới qua được.

**Xong khi:** một sự kiện `once` hôm qua tự chuyển xuống mục Đã qua.

---

## P3-13 · Màn hình tạo / sửa sự kiện

**Mục tiêu:** hai trường bắt buộc, phần còn lại có sẵn giá trị hợp lý.

**Các bước**

1. Một màn hình, các trường theo thứ tự: tên · ngày · lặp lại · nhắc trước · ghi chú.

2. Giá trị mặc định — chọn sao cho phần lớn người dùng **không phải chạm vào**:

   | Trường | Mặc định |
   |---|---|
   | Lặp lại | **Hằng năm** (phần lớn sự kiện trong app này là sinh nhật, kỉ niệm) |
   | Nhắc trước | **3 và 7 ngày** |
   | Ngày | Hôm nay |

3. Nhắc trước là **chọn nhiều** — các nút bật/tắt độc lập, không phải chọn một.

4. Dòng nhắc ở cuối form: *"🔔 Cả Minh và Linh đều nhận được nhắc."* — nói rõ điều phân
   biệt tính năng này với app lịch thường.

5. Ràng buộc: `once` thì **không cho chọn ngày quá khứ**; `yearly` thì cho (sinh nhật năm
   nay đã qua → nhắc năm sau).

**Xong khi:** tạo một sự kiện chỉ cần gõ tên và chọn ngày, mọi thứ khác để nguyên.

**Bẫy**
- Bàn phím trên iPhone che nửa màn hình. Đảm bảo nút Lưu ở header (không phải cuối trang),
  hoặc form cuộn được khi bàn phím mở.

---

## P3-14 · Trạng thái rỗng

**Mục tiêu:** danh sách rỗng vẫn mời gọi.

**Các bước**

1. Thực tế **gần như không bao giờ rỗng hoàn toàn** — mốc hệ thống luôn có sẵn. Trạng thái
   rỗng thật chỉ xảy ra nếu người dùng tắt hết mốc.

2. Khi chưa có sự kiện **người dùng tạo**, hiện dưới danh sách mốc:
   > *Thêm sinh nhật của hai đứa để khỏi quên 🎂*
   > **[Thêm sự kiện]**

3. Gợi ý sẵn ba mẫu một chạm: `🎂 Sinh nhật` · `💕 Ngày gặp đầu tiên` · `✈️ Chuyến đi sắp tới`.
   Chạm vào là mở form với tên đã điền.

**Xong khi:** tài khoản mới vào tab Kế hoạch thấy mốc hệ thống + lời mời thêm sự kiện, không
thấy màn hình trống.
