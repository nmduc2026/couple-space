# Mục tiêu chung

`Phase 4` · `Tầng 1 — MVP` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: danh sách những điều hai người muốn làm cùng nhau — và cách đi từ *muốn* tới *đã làm*.

## 1. Vì sao cần

Đây là tính năng **khép kín vòng lặp** của app:

```
Mục tiêu "đi Đà Lạt"
   → tích các bước con
   → tích bước cuối
   → tự sinh bài Timeline
   → ảnh + chi tiêu của chuyến đi
   → Wrapped cuối năm: "11 mục tiêu hoàn thành"
```

Không tính năng nào khác tạo được chuỗi đó. Và nó là thứ duy nhất trong app **nói về tương
lai hai người muốn gì**, thay vì ghi lại việc đã xảy ra.

## 2. Ba kiểu mục tiêu

Một bảng, phân biệt bằng cột `kind` — cùng cách làm với [Ăn gì](p2-eat-tonight.md).

| Kiểu | Tiến độ tính từ | Ví dụ |
|---|---|---|
| `checklist` | Số bước con đã tích | "Đi Đà Lạt" — 8/10 bước |
| `count` | Số đếm thủ công | "Xem hết phim Ghibli" — 9/22 |
| `amount` | Số tiền đã nạp | "Quỹ chung 10 triệu" — 6,2/10 |

Kiểu `amount` chính là **quỹ chung** nói ở [chi tiêu](p4-expenses.md) mục 5. Gộp vào đây
thay vì làm tính năng riêng, vì cùng có tên, hạn, tiến độ %, và cùng sinh bài khi xong.

## 3. Luật nghiệp vụ

### Thêm nhanh

Giống mọi chỗ khác trong app: **một ô nhập, chỉ cần cái tên.** Kiểu mặc định là
`checklist`, không có bước con nào. Thêm bước, đặt hạn, đổi kiểu — làm sau, nếu muốn.

Một mục tiêu chỉ có mỗi cái tên vẫn là một mục tiêu hợp lệ.

### Hạn là tuỳ chọn

Phần lớn mục tiêu trong app này không có hạn thật (*"học nấu ăn"*). Ép nhập hạn là ép tạo
áp lực giả.

### Quá hạn thì im lặng

> **Không nhắc, không đổi màu đỏ, không đếm số mục tiêu trễ.**

Đây là chỗ dễ trượt nhất của tính năng này. Mọi app quản lý công việc đều làm ngược lại —
và đó chính là lý do không nên bắt chước chúng ở đây. Nguyên tắc: *không biến tình yêu
thành KPI*.

Mục tiêu quá hạn chỉ **chuyển xuống cuối danh sách**, chữ nhạt đi. Thế thôi.

### Hoàn thành → sinh bài Timeline

Tích bước cuối cùng (hoặc đạt số/số tiền mục tiêu):

```
🎉 Chúc mừng — hai đứa làm được rồi!
   [Đăng lên kỉ niệm]   [Để sau]
```

**[Đăng lên kỉ niệm]** nhảy thẳng vào flow soạn bài với caption điền sẵn:
*"Đi Đà Lạt ✓"* và ngày là hôm nay. Người dùng chỉ cần chọn ảnh.

**[Để sau]** cũng hoàn toàn ổn. Không nài, không nhắc lại.

### Ai cũng sửa được

Space-first: cả hai sửa, tích, xoá bước của nhau được. Có thể ghi chú "người phụ trách"
nhưng đó chỉ là nhãn, không phải quyền.

## 4. Màn hình

### Danh sách (tab con của Kế hoạch)

Mỗi thẻ: tên · thanh tiến độ · `8/10 bước` · hạn nếu có.
Mục **Đã hoàn thành** gập lại ở cuối — nhìn lại được, nhưng không chiếm chỗ.

### Chi tiết

- Tiến độ % lớn + thanh
- Hạn và số ngày còn lại (nếu có hạn)
- Danh sách bước con, tích từng bước
- Ảnh khi hoàn thành (link tới bài Timeline đã sinh)

## 5. Ca biên

| Tình huống | Xử lý |
|---|---|
| Mục tiêu không có bước con nào | Tiến độ là 0% hoặc 100% — có nút **[Đánh dấu hoàn thành]** thay cho checklist. |
| Bỏ tích bước cuối sau khi đã sinh bài | Mục tiêu quay về "đang làm". **Bài Timeline giữ nguyên** — nó đã là một kỉ niệm thật, không phải hệ quả của trạng thái. |
| Xoá bước con đã tích | Tiến độ tính lại theo số bước còn lại. |
| Mục tiêu `amount` bị nạp vượt mục tiêu | Hiện 100%, ghi thêm *"vượt 1,2 triệu"*. Không chặn. |
| Mục tiêu `amount` có tự lấy số từ [chi tiêu](p4-expenses.md) không? | **Không.** Nạp quỹ là hành động riêng, ghi tay. Trộn với chi tiêu hằng ngày sẽ làm cả hai con số sai. |
| Xoá mục tiêu đã hoàn thành | Cho phép. Bài Timeline đã sinh giữ nguyên. |
| Cả hai cùng tích một bước | Không sao, trạng thái là boolean. Người sau không ghi đè gì. |
| Quá 30 mục tiêu | Không giới hạn, nhưng danh sách mặc định gập phần đã xong. |

## 6. Ngoài phạm vi

- Nhắc hạn mục tiêu — cố ý, xem mục 3.
- Mục tiêu lặp lại ("tập gym mỗi tuần") — đó là thói quen, khác bài toán, để sau nếu cần.
- Bước con có hạn riêng.
- Giao bước cho một người và theo dõi ai chậm. Không.

## 7. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Timeline](p2-timeline.md) | Nơi bài tự sinh khi hoàn thành |
| [Chi tiêu](p4-expenses.md) | Cùng phase; quỹ chung là một kiểu mục tiêu |

Nối vào sau: [sự kiện](p3-events-reminders.md) (gợi ý "đặt bàn chưa?" tạo nhanh một mục
tiêu) · [Wrapped](p6-wrapped.md) (đếm mục tiêu hoàn thành trong năm).
