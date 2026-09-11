# Phase 2 — Hướng dẫn từng bước

Mỗi file tương ứng một nhóm trong [../tasks.md](../tasks.md). Khuôn giống Phase 1:
**Mục tiêu** → **Các bước** → **Xong khi** → **Bẫy**.

| File | Nhóm | Task |
|---|---|---|
| [a-database.md](a-database.md) | Database + Storage | P2-01 → P2-04 |
| [b-post.md](b-post.md) | Đăng kỉ niệm | P2-05 → P2-10 |
| [c-browse.md](c-browse.md) | Xem lại | P2-11 → P2-16 |
| [d-reactions.md](d-reactions.md) | Tương tác | P2-17 → P2-19 |
| [e-eat-tonight.md](e-eat-tonight.md) | "Tối nay ăn gì?" phần A | P2-20 → P2-25 |
| [f-home.md](f-home.md) | Home | P2-26 |

## Điều khác biệt lớn nhất so với Phase 1

Phase 1 làm việc với **chữ**. Phase 2 làm việc với **ảnh** — và ảnh đổi luật chơi:

| | Chữ (Phase 1) | Ảnh (Phase 2) |
|---|---|---|
| Kích thước | vài trăm byte | vài MB **mỗi tấm** |
| Thời gian gửi | tức thì | vài giây tới vài chục giây |
| Mất mạng giữa chừng | hiếm khi hỏng | **thường xuyên** |
| Chi phí | không đáng kể | **khoản đắt nhất của dự án** |

Ba hệ quả chi phối toàn bộ phase này:

1. **Nén trước khi upload, ngay từ task đầu tiên.** Không phải tối ưu để sau.
2. **Giao diện phải phản hồi ngay, upload chạy nền.** Chờ upload xong mới hiện bài là
   trải nghiệm hỏng.
3. **Mất mạng là chuyện bình thường, không phải ca biên.** Đi chơi chụp ảnh thường ở chỗ
   sóng yếu — đó chính là lúc người ta muốn đăng.

> **Thứ tự đề nghị:** làm nhóm A → B trước cho tới khi đăng được một tấm ảnh thật từ iPhone.
> Đó là cột mốc thật sự của Phase 2; các nhóm còn lại đều nhẹ hơn nhiều.
