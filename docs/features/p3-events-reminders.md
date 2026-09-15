# Sự kiện & nhắc nhở

`Phase 3` · `Tầng 1 — MVP` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: app nhớ giùm hai người những ngày quan trọng, và nhắc **cả hai máy** trước khi
> quá muộn.

## 1. Vì sao cần

Phase 1 và 2 làm app **lưu lại quá khứ**. Phase 3 là lần đầu app **nhìn về phía trước** —
và đó là điều khiến người ta mở app vào một ngày bình thường không có gì để đăng.

Nó cũng là chỗ gánh vai trò mà **widget đã bỏ lại**: vì PWA trên iOS không có widget, toàn
bộ việc "nhắc nhớ mỗi ngày" chuyển sang push. Xem
[distribution.md](../decisions/distribution.md).

## 2. Hai loại sự kiện

Khác biệt này chi phối toàn bộ thiết kế:

| | Sự kiện **hệ thống** | Sự kiện **của người dùng** |
|---|---|---|
| Ai tạo | App tự sinh | Một trong hai người |
| Ví dụ | Mốc 500 ngày, kỉ niệm yêu hằng năm | Sinh nhật, ngày cưới, "đi Hà Giang" |
| Xoá được | ❌ Không | ✅ Có |
| Tắt nhắc được | ✅ Có | ✅ Có |
| Sửa nội dung | ❌ Không | ✅ Có |
| Nguồn dữ liệu | Ngày bắt đầu yêu ([đếm ngày](p1-day-counter.md)) | Người dùng nhập |

Lý do sự kiện hệ thống không xoá được: nó **không phải một bản ghi**, nó là *phép tính* từ
ngày bắt đầu yêu. Xoá nó rồi thì lần sau mở app nó lại xuất hiện — trạng thái đó gây rối
hơn là giúp. Thay vào đó, cho **tắt nhắc**.

**Tầm nhìn danh sách:** mốc hệ thống chỉ hiện từ **hôm nay đến 31/12 năm nay**. Sang năm
mới thì các mốc của năm đó mới xuất hiện. Sự kiện người dùng tạo không bị cắt theo quy tắc
này (vẫn theo lần tới của chu kỳ lặp).

## 3. Luật nghiệp vụ

### Lặp lại

| Kiểu | Ý nghĩa | Ví dụ |
|---|---|---|
| `once` | Một lần rồi thôi | "Đi Hà Giang 24/01/2027" |
| `yearly` | Mỗi năm một lần | Sinh nhật, kỉ niệm yêu |
| `monthly` | Mỗi tháng | Tròn tháng quen nhau |

### Nhắc trước

- Người dùng chọn được nhiều mốc cùng lúc: **1 / 3 / 7 / 30 ngày**.
- Mặc định cho sự kiện mới: **3 và 7 ngày**.
- Mặc định cho mốc hệ thống: **3 ngày**.
- **Tròn tháng mặc định không nhắc** — mỗi tháng một lần là ồn. Chỉ hiện trong danh sách.

### Nhắc cả hai máy

> Đây là điểm phân biệt với app lịch thông thường, và là lý do tính năng này thuộc về app
> cặp đôi chứ không phải Google Calendar.

Một người tạo sự kiện → **cả hai** đều nhận nhắc. Không có khái niệm "sự kiện riêng của
tôi" — trái với nguyên tắc space-first, và trái với quyết định D3 về riêng tư.

Mỗi người vẫn **tắt nhắc riêng cho mình** được, không ảnh hưởng người kia.

### Giờ gửi

- Nhắc gửi lúc **9:00 sáng** theo múi giờ **của máy nhận**.
- Rơi vào [giờ yên lặng](p1-notifications.md) thì hoãn tới hết giờ yên lặng.
- Sự kiện diễn ra **hôm nay** thì gửi lúc 8:00, sớm hơn — để còn kịp làm gì đó.

### Gợi ý hành động

Nhắc mà không kèm hành động thì chỉ tạo áp lực. Mỗi thông báo nhắc kèm một gợi ý mở
[mục tiêu](p4-goals.md) mới:

> *"Còn 7 ngày là kỉ niệm 1 năm — đặt bàn chưa?"* → **[Tạo việc cần làm]**

Ở Phase 3 (chưa có Mục tiêu) thì gợi ý này tạm ẩn. Nối vào ở Phase 4.

## 4. Luồng chính

### Xem

```
Tab Kế hoạch → Sự kiện
  ├─ SẮP TỚI: sắp theo số ngày còn lại tăng dần
  │    mỗi dòng: vòng tròn đếm ngược · tên · ngày · kiểu lặp
  └─ ĐÃ QUA (gập lại ở cuối)
```

Vòng tròn đếm ngược **mã hoá thời gian bằng hình**, không chỉ bằng số — nhìn là biết gấp
hay chưa mà không phải đọc.

### Tạo

```
[+ Sự kiện mới]
  ├─ Tên            (bắt buộc)
  ├─ Ngày           (bắt buộc)
  ├─ Lặp lại        (mặc định: hằng năm)
  ├─ Nhắc trước     (mặc định: 3 và 7 ngày)
  └─ Ghi chú        (tuỳ chọn)
```

Chỉ hai trường bắt buộc. Giữ đúng nguyên tắc nhập liệu tối thiểu.

## 5. Ca biên

Đây là tính năng có nhiều ca biên về **ngày tháng** nhất trong app. Xử lý sai thì lỗi chỉ
lộ ra sau nhiều tháng.

| Tình huống | Xử lý |
|---|---|
| Sự kiện hằng năm vào **29/2** | Năm không nhuận thì nhắc **28/2**. Cùng quy tắc với mốc ngày yêu. |
| Hằng tháng vào **ngày 31** | Tháng không có 31 thì lấy **ngày cuối tháng**. |
| Hai người **khác múi giờ** | Mỗi người nhận nhắc lúc 9:00 **giờ máy mình**. Chấp nhận lệch nhau vài giờ — đúng với cảm nhận thực tế của mỗi người. |
| Nhắc trước 30 ngày nhưng sự kiện còn 5 ngày | Bỏ qua mốc 30, chỉ gửi những mốc còn hợp lệ. |
| Tạo sự kiện cho ngày **đã qua** | Cho phép nếu `yearly` (sinh nhật năm nay đã qua → nhắc năm sau). Chặn nếu `once`. |
| Sự kiện đã qua với `once` | Tự chuyển vào mục "Đã qua", không xoá. |
| Người kia **xoá sự kiện** mình tạo | Cho phép — space-first. Nhưng gửi thông báo cho người tạo. |
| Đổi ngày bắt đầu yêu | Mọi mốc hệ thống tính lại. **Không** gửi thông báo hồi tố cho mốc đã qua. |
| Máy tắt nguồn / không mở app đúng ngày | Push vẫn tới (gửi từ server qua pg_cron), không phụ thuộc app đang mở. |
| Cùng ngày có 3 sự kiện | **Gộp một thông báo**: *"Hôm nay có 3 dịp đặc biệt"*. |

## 6. Ngoài phạm vi

- **Widget** — không làm được trên PWA. Push hằng ngày là thứ thay thế.
- Đồng bộ với Google Calendar / lịch hệ thống.
- Mời người ngoài vào sự kiện.
- Sự kiện có giờ cụ thể (19:30) — Phase 3 chỉ làm theo **ngày**. Thêm giờ sau nếu thấy thiếu.
- Lặp phức tạp (thứ Bảy thứ hai của tháng…).

## 7. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Đếm ngày](p1-day-counter.md) | Nguồn của mọi mốc hệ thống |
| [Thông báo](p1-notifications.md) | Đường ống push đã chạy từ Phase 1 |
| pg_cron + Edge Function | Việc chạy theo lịch — xem [backend-architecture.md](../design/backend/backend-architecture.md) mục 6 |

Nối vào sau: [mục tiêu](p4-goals.md) (gợi ý hành động) · [wrapped](p6-wrapped.md).
