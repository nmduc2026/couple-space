# D. Mục tiêu — P4-24 → P4-31

Đặc tả: [p4-goals.md](../../../docs/features/p4-goals.md).
Xem trước: màn hình **P4-04** và **P4-05** trong
[prototype.html](../../../docs/design/frontend/ui/prototype.html).

---

## P4-24 · Tab con Mục tiêu

**Các bước**

1. Mở tab con **Mục tiêu** trong tab Kế hoạch (đã ẩn từ Phase 3).
2. Nút (+) thêm mục thứ tư: `Mục tiêu mới`.
3. Nhớ lại tab con người dùng xem lần trước (`localStorage`).

**Xong khi:** chuyển qua lại Sự kiện ⇄ Mục tiêu mượt, mở lại app vào đúng tab đã xem.

---

## P4-25 · Thêm nhanh

**Mục tiêu:** **một ô nhập, chỉ cần cái tên.**

**Các bước**

1. Ô nhập + nút `+` ngay trên đầu danh sách, **không mở màn hình mới** — giống hệt cách
   thêm quán ở [Ăn gì](../../phase-02/steps/e-eat-tonight.md).

2. Mặc định: `kind = 'checklist'`, không bước con, **không hạn**.

3. Một mục tiêu chỉ có mỗi cái tên là **hợp lệ**. Thêm bước, đặt hạn, đổi kiểu — làm sau
   nếu muốn, ở màn hình chi tiết.

4. Gợi ý sẵn cho danh sách rỗng, chạm một cái là thêm:
   `🏔 Đi một chuyến xa` · `🍳 Học nấu món mới` · `💰 Quỹ chung`

**Xong khi:** thêm 4 mục tiêu trong dưới 30 giây, không rời khỏi màn hình danh sách.

**Bẫy**
- Đừng bắt chọn `kind` lúc thêm. Một câu hỏi thêm ở bước nhập là một lý do để không nhập.

---

## P4-26 · Thẻ mục tiêu

**Các bước**

1. Mỗi thẻ:
   ```
   🏔 Đi Đà Lạt                    8/10 bước
   ████████░░  80%
   ```

2. Nhãn bên phải đổi theo `kind`:

   | Kiểu | Nhãn |
   |---|---|
   | `checklist` | `8/10 bước` |
   | `count` | `9/22 phim` |
   | `amount` | `6,2/10 triệu` |

3. Có hạn thì thêm dòng nhỏ `còn 134 ngày`. **Không có hạn thì không hiện gì** — đừng viết
   "chưa đặt hạn", nó gợi ý rằng thiếu.

4. Sắp xếp: đang làm trước (theo ngày tạo mới nhất), **quá hạn xuống cuối**, đã xong gập riêng.

**Xong khi:** ba kiểu mục tiêu hiện đúng ba loại nhãn.

---

## P4-27 · Chi tiết + bước con

**Các bước**

1. Màn hình chi tiết: tiến độ lớn · thanh · hạn (nếu có) · danh sách bước con.

2. Tích một bước → **phản hồi lạc quan**: ô tích đổi ngay, tiến độ chạy ngay, đồng bộ nền.

3. Thêm bước: một ô nhập ở cuối danh sách, gõ xong Enter là thêm và **giữ con trỏ ở đó** —
   để gõ liền 5 bước không phải chạm lại.

4. Kéo sắp xếp bằng `sort_order`.

5. Nhấn giữ một bước → Sửa / Xoá.

**Xong khi:** thêm 5 bước liên tiếp chỉ bằng gõ và Enter; tích bước thấy tiến độ đổi tức thì.

---

## P4-28 · Kiểu `count` và `amount`

**Các bước**

1. **`count`**: thay danh sách bước bằng một bộ đếm lớn với nút `−` `+`, và ô đặt mục tiêu.
   Tiến độ = hiện tại ÷ mục tiêu.

2. **`amount`** (quỹ chung): thay bằng danh sách **lần nạp** + nút "Ghi một lần nạp".
   Mỗi dòng: ngày · ai nạp · số tiền.

3. Đổi `kind` sau khi tạo: cho phép, nhưng cảnh báo nếu đang có dữ liệu
   (*"Đổi sang dạng đếm sẽ bỏ 6 bước đã tạo"*).

**Xong khi:** cả ba kiểu đều tính tiến độ đúng.

---

## P4-29 · Ghi nạp quỹ chung

**Mục tiêu:** biết ai đã góp bao nhiêu vào cái chung.

**Các bước**

1. Form nạp: số tiền · ai nạp (mặc định người đang ghi) · ngày · ghi chú.

2. Tổng hiện: `6.200.000 / 10.000.000đ` + chia theo người:
   *"Minh 3,5tr · Linh 2,7tr"*.

3. ⚠️ **Không tự lấy số từ bảng `expenses`.** Nạp quỹ là hành động riêng, ghi tay. Trộn
   với chi tiêu hằng ngày sẽ làm **cả hai** con số sai.

4. Phần "ai góp bao nhiêu" ở đây là **góp vào cái chung**, không phải nợ nhau. Giữ đúng
   giọng: không có mũi tên, không có "còn thiếu so với Minh".

5. Xoá được một lần nạp ghi nhầm.

**Xong khi:** ghi hai lần nạp → tổng và tiến độ đúng.

---

## P4-30 · Mục "Đã hoàn thành"

**Các bước**

1. Tiêu đề gập `Đã hoàn thành (4) ▾`, **mặc định đóng**, ở cuối danh sách.
2. Mở ra: tên có dấu ✓, ngày hoàn thành, và **ảnh** nếu đã sinh bài Timeline.
3. Chạm vào ảnh → mở bài đó.

**Xong khi:** hoàn thành một mục tiêu → nó chuyển xuống mục này.

---

## P4-31 · Quá hạn thì im lặng

> **Task quan trọng nhất nhóm D về mặt sản phẩm**, và là chỗ dễ trượt nhất. Mọi app quản lý
> công việc đều làm ngược lại — đó chính là lý do không bắt chước chúng ở đây.

**Mục tiêu:** mục tiêu quá hạn không tạo cảm giác thất bại.

**Các bước**

1. Quá hạn thì:
   - ✅ Chuyển xuống cuối danh sách
   - ✅ Chữ nhạt đi
   - ❌ **Không** đổi màu đỏ
   - ❌ **Không** gửi thông báo
   - ❌ **Không** có nhãn "quá hạn"
   - ❌ **Không** đếm "3 mục tiêu trễ"

2. Dòng hạn đổi giọng: thay `còn 134 ngày` bằng `hạn 24/01` — trung tính, không phải
   `trễ 12 ngày`.

3. Cho **bỏ hạn** dễ dàng ở màn hình chi tiết, một chạm.

4. Rà lại toàn bộ app: không có chỗ nào đếm hay nhắc mục tiêu quá hạn.

**Xong khi:** đặt một mục tiêu với hạn hôm qua → nó chỉ trôi xuống cuối và nhạt đi, **không
có gì khác xảy ra**.

**Bẫy**
- Đây là chỗ một phiên làm việc sau (hoặc một AI khác) rất dễ "sửa" theo hướng thêm cảnh
  báo, vì tưởng là còn thiếu. Ghi comment ngay trong code:
  ```
  // Cố ý KHÔNG cảnh báo quá hạn. Xem docs/features/p4-goals.md mục 3.
  ```
