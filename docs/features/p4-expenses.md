# Chi tiêu chung

`Phase 4` · `Tầng 1 — MVP` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: ghi lại hai đứa đã tiêu gì cùng nhau — để **nhìn lại**, không phải để **tính sổ**.

## 1. Quyết định quan trọng nhất: không ghi nợ nhau

> ### ❌ App **không** có số dư nợ, không có nút "đã thanh toán", không có chia đôi / bao trọn / chia theo tỉ lệ.

Bản nháp đầu có đủ những thứ đó. Đã **bỏ hẳn** (chốt 2026-09-11). Lý do:

**1. Nó trái với định vị sản phẩm.** Nguyên tắc xuyên suốt là *"nhẹ nhàng, không gây áp
lực — không biến tình yêu thành KPI"*. Một con số đỏ **"Linh đang nợ Minh 120.000đ"** nằm
trên màn hình Home mỗi ngày làm đúng cái điều đó. Muốn chia tiền sòng phẳng thì đã có
Splitwise, MoMo, chuyển khoản — và những app đó làm tốt hơn.

**2. Nó là nguồn phức tạp lớn nhất của tính năng này.** Bỏ đi thì mất luôn:

| Thứ không phải làm nữa | Vốn là |
|---|---|
| Bảng tất toán + lịch sử thanh toán | Một bảng, một flow, một màn hình |
| Tính lại số dư khi sửa/xoá khoản cũ | Câu hỏi khó nhất của phase này |
| Ba kiểu chia + tỉ lệ tuỳ ý | Hai trường thừa trên form nhập |
| "Xoá bài Timeline thì số dư ra sao?" | Một ca biên dây chuyền |

**3. Nó làm form nhập dài gấp đôi.** Và nguyên tắc đã biết từ
[Timeline](p2-timeline.md) và [Ăn gì](p2-eat-tonight.md): form dài thì sau hai tuần
không ai ghi nữa, và tính năng chết.

**Cái vẫn giữ:** cột **ai trả**. Nhưng nó chỉ để **thống kê và nhìn lại**, không bao giờ
dùng để tính ai phải trả lại ai.

## 2. Vì sao vẫn cần tính năng này

Nếu không tính nợ thì ghi chi tiêu để làm gì? Ba việc, đều thuộc loại "nhìn lại":

- **Biết mình tiêu vào đâu.** *"Tháng này đi ăn 12 lần, hết 1 triệu."*
- **Nuôi các tính năng khác.** Giá trung bình ở [Ăn gì](p2-eat-tonight.md), con số tiền ở
  [Wrapped](p6-wrapped.md), tiến độ [quỹ chung](p4-goals.md) — tất cả lấy từ đây.
- **Kỉ niệm có số.** *"Chuyến Đà Lạt đó tụi mình tiêu 4,2 triệu"* là một phần của ký ức.

## 3. Luật nghiệp vụ

### Không nhập hai lần

> Chi tiêu **kế thừa từ bài Timeline**, không nhập lại.

Đăng một kỉ niệm có mục "💰 Thêm chi phí" → sinh thẳng một khoản chi gắn với bài đó.
Khoản chi sinh từ kỉ niệm mang icon 📷, chạm vào mở bài đó.

Đây là lý do [Timeline](p2-timeline.md) phải làm trước Chi tiêu, không phải ngược lại.

### Một khoản chi gồm

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| Số tiền | ✅ | Lưu **số nguyên** đơn vị nhỏ nhất (`amount_minor`). Không bao giờ dùng số thực cho tiền. |
| Nội dung | ✅ | Tự điền từ caption bài nếu sinh từ Timeline |
| Danh mục | — | Một chạm chọn icon. Mặc định đoán theo hoạt động của bài |
| Ngày | — | Mặc định hôm nay, hoặc `happened_on` của bài |
| Ai trả | — | Mặc định là người đang ghi |
| Gắn với kỉ niệm | — | Tự động nếu sinh từ Timeline |

**Bốn trường là hết.** Không có phần chia tiền.

### Danh mục

Cố định, không cho tự tạo ở Phase 4: `🍜 ăn uống` · `☕ cà phê` · `🎬 giải trí` ·
`✈️ du lịch` · `🛒 mua sắm` · `🎁 quà` · `📦 khác`.

Danh mục tự tạo nghe có vẻ linh hoạt, nhưng nó làm thống kê vỡ vụn và không ai duy trì nổi
sự nhất quán khi có hai người cùng nhập.

## 4. Màn hình Chi tiêu

```
◀  Tháng 9, 2026  ▶
├─ Tổng chi 2.450.000đ · Minh trả 1.850.000 · Linh trả 600.000
├─ Trung bình mỗi buổi hẹn: 306.000đ
├─ [dải nhận xét]  "Tháng này tụi mình đi ăn 12 lần — nhiều hơn tháng trước 4 lần"
├─ [biểu đồ tròn theo danh mục + chú thích]
└─ Danh sách khoản chi trong tháng
```

**Dải nhận xét** là thứ biến bảng số thành thông tin. Một câu, sinh từ dữ liệu, đổi theo
tháng. Vài mẫu:

- *"Tháng này tụi mình đi ăn N lần — nhiều hơn/ít hơn tháng trước M lần"*
- *"Buổi hẹn đắt nhất: [tên] — X đ"*
- *"Tháng đầu tiên tụi mình ghi chi tiêu 🎉"* (khi chưa có tháng trước để so)

## 5. Quỹ chung

Mục tiêu tiết kiệm chung: *"đi Đà Lạt 10 triệu"*.

**Không phải một tính năng riêng** — nó là **một loại [mục tiêu](p4-goals.md)** có kiểu
`amount`. Lý do gộp: cùng có tên, hạn, tiến độ %, và cùng sinh bài Timeline khi hoàn thành.
Tách ra thành tính năng riêng là nhân đôi công việc cho cùng một khái niệm.

- Mỗi người ghi số mình đã nạp → tiến độ cộng dồn.
- Đây là **chỗ duy nhất** trong app có khái niệm "ai góp bao nhiêu" — và nó là *góp vào một
  cái chung*, không phải *nợ nhau*. Khác hẳn về mặt cảm giác.

## 6. Ca biên

| Tình huống | Xử lý |
|---|---|
| Sửa số tiền một khoản cũ | Sửa thoải mái. **Không có số dư nào phải tính lại** — đây chính là phần thưởng của quyết định ở mục 1. |
| Xoá bài Timeline có gắn chi phí | Hỏi rõ: *"Xoá luôn khoản chi 180.000đ không?"* Mặc định **giữ lại** khoản chi, gỡ liên kết. |
| Xoá khoản chi sinh từ bài | Chỉ xoá khoản chi, bài giữ nguyên. |
| Ghi chi tiêu khi mất mạng | Vào hàng đợi đồng bộ giống Timeline. Đi chơi là lúc hay ghi nhất. |
| Cả hai cùng ghi một khoản (trùng) | Không tự phát hiện. Nhưng cảnh báo nhẹ nếu cùng ngày, cùng số tiền, cùng danh mục. |
| Tháng chưa có khoản nào | Trạng thái rỗng mời gọi, không phải bảng số 0. |
| Số tiền rất lớn (đặt cọc nhà) | Không chặn. Nhưng loại khỏi "trung bình mỗi buổi hẹn" nếu vượt 10 lần trung vị — một khoản bất thường làm hỏng mọi con số trung bình. |

## 7. Ngoài phạm vi

- **Số dư nợ, tất toán, chia tiền** — đã bỏ có chủ đích, xem mục 1.
- Nhiều loại tiền tệ. Chỉ VND.
- Nhập tự động từ SMS ngân hàng / ảnh hoá đơn.
- Ngân sách theo tháng và cảnh báo vượt ngân sách — đây lại là "biến tình yêu thành KPI".
- Danh mục tự tạo.

## 8. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Timeline](p2-timeline.md) | Chi tiêu kế thừa từ bài đăng, không nhập lại |
| [Mục tiêu](p4-goals.md) | Quỹ chung là một loại mục tiêu |

Nuôi các tính năng sau: [Ăn gì phần B](p2-eat-tonight.md) (giá trung bình) ·
[Wrapped](p6-wrapped.md) (tổng chi cả năm).
