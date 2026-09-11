# Thư gửi tương lai

`Phase 5` · `Tầng 2 — Làm app dính` · Đặc tả: ✅ đầy đủ · [← Danh sách tính năng](README.md)

> Một câu: viết một lá thư, hẹn ngày mở — và tới ngày đó mới đọc được.

## 1. Vì sao đáng làm

Tỉ lệ **giá trị cảm xúc trên chi phí kỹ thuật** cao nhất trong toàn bộ app. Về mặt dữ liệu
nó chỉ là một bảng với vài cột; về mặt cảm giác nó là thứ người ta kể lại cho bạn bè nghe.

Nó cũng là tính năng duy nhất **lợi thế tăng theo thời gian mà không cần ai làm gì**: một
lá thư viết hôm nay chỉ có giá trị vào năm 2036, và giá trị đó lớn dần mỗi ngày mà không
tốn thêm công.

## 2. Luật nghiệp vụ

### Khoá phải là khoá thật

> Đây là toàn bộ tính năng. Khoá hỏng thì không còn gì.

| Cách làm | Đánh giá |
|---|---|
| Ẩn ở giao diện | ❌ Dữ liệu đọc được qua API. Vô nghĩa. |
| **RLS chặn theo ngày** | ✅ Chọn cách này. Policy chỉ trả về nội dung khi `open_on <= current_date`. |
| Mã hoá phía client | Phức tạp hơn nhiều, và mất khoá là mất thư. Không cần ở quy mô này. |

Trước ngày mở, truy vấn trả về **metadata** (ai viết, viết ngày nào, mở ngày nào, tiêu đề)
nhưng **không trả nội dung**. Tiêu đề do người viết đặt và họ biết người kia sẽ thấy nó —
đó là phần gợi tò mò có chủ đích.

### Ai đọc được

| Loại thư | Người viết | Người kia |
|---|---|---|
| Gửi cả hai | Đọc lại được **bất cứ lúc nào** (mình viết mà) | Chỉ sau ngày mở |
| Gửi riêng người kia | Đọc lại được | Chỉ sau ngày mở |

Người viết luôn đọc lại được thư của mình. Khoá người viết khỏi chữ của chính họ là vô lý.

### Sửa và xoá

- **Trước ngày mở:** người viết sửa/xoá thoải mái. Người kia chỉ thấy metadata đổi.
- **Sau ngày mở:** khoá vĩnh viễn. Không sửa, không xoá. Thư đã được đọc là một ký ức, không
  phải một bản nháp.

### Ngày mở

- Chọn ngày bất kỳ **từ mai trở đi**. Không cho hẹn hôm nay (thế thì viết thư làm gì).
- Gợi ý sẵn: *kỉ niệm 1 năm nữa* · *sinh nhật người ấy* · *5 năm nữa* · *10 năm nữa* —
  lấy từ [sự kiện](p3-events-reminders.md) đang có.
- Tới ngày mở → **push cho cả hai**: *"Có một lá thư vừa mở khoá 💌"*

## 3. Luồng chính

```
[✍️ Viết một lá thư]
  ├─ Tiêu đề     (người kia sẽ thấy trước khi mở — đặt cho khéo)
  ├─ Nội dung
  ├─ Gửi cho     [Cả hai] | [Chỉ Linh]
  └─ Mở vào ngày (gợi ý sẵn, hoặc chọn tay)
  ▼
Thư vào mục "Sắp mở", hiện 🔒 + đếm ngược
  ▼
Tới ngày → push cả hai → mở được → chuyển sang mục "Đã mở"
```

## 4. Ca biên

Đây là tính năng có **thời gian sống rất dài** — nhiều ca biên chỉ xảy ra sau nhiều năm,
nên phải nghĩ trước.

| Tình huống | Xử lý |
|---|---|
| **Huỷ ghép đôi khi còn thư chưa mở** | Thư **vẫn mở đúng ngày đã hẹn**, cả hai vẫn đọc được. Đây là quyết định có chủ đích: lá thư là lời của quá khứ, và khoá nó lại vì hiện tại đã đổi là tước đi thứ thuộc về cả hai. Có báo trước ở màn hình huỷ ghép: *"Còn 2 lá thư sẽ mở vào 2027 và 2036"*. |
| Space bị xoá vĩnh viễn | Thư mất theo. Nhắc rõ ở bước xác nhận xoá. |
| Ngày mở rơi vào sau khi ảnh đã bị dọn (6 tháng archived) | Thư là **chữ**, không bị dọn cùng ảnh — xem [huỷ ghép đôi](p1-breakup.md) mục 6. |
| Một người xoá tài khoản | Thư họ viết vẫn mở đúng hẹn, ghi tên người viết. |
| Hẹn ngày quá xa (năm 2099) | Cho phép. Nhưng cảnh báo nhẹ một lần. |
| Đổi múi giờ | Ngày mở là kiểu `date`, so với ngày lịch ở múi giờ space. Cùng quy tắc với [đếm ngày](p1-day-counter.md). |
| Viết xong quên mất | Danh sách "Sắp mở" luôn hiện đếm ngược, nên không quên được. |
| Thư rất dài | Không giới hạn. Đây là chỗ người ta cần viết dài. |

## 5. Ngoài phạm vi

- Đính kèm ảnh / video vào thư. Cân nhắc ở Phase 6 — ảnh phải giữ nguyên nhiều năm, và đó
  là cam kết lưu trữ khác hẳn.
- Thư gửi cho người ngoài.
- Hẹn mở theo sự kiện thay vì theo ngày ("mở khi tụi mình cưới").
- Nhắc viết thư định kỳ.

## 6. Phụ thuộc

| Cần có trước | Vì sao |
|---|---|
| [Thông báo](p1-notifications.md) | Push khi thư mở khoá |
| [Sự kiện](p3-events-reminders.md) | Gợi ý ngày mở lấy từ sự kiện đang có |

Liên quan: một trong **ba ngoại lệ** của quyết định D3 — xem
[overview.md](../../overview.md) mục 3. Ngoại lệ này là **giấu có hạn**, và nó tự mở theo
thời gian chứ không phụ thuộc hành vi ai.
