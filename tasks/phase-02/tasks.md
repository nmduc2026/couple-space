# Phase 2 — Danh sách task

Bối cảnh và nhật ký: [context.md](context.md).
**Hướng dẫn từng bước:** [steps/](steps/) — mỗi nhóm một file.
Đặc tả: [timeline.md](../../docs/features/p2-timeline.md) · [eat-tonight.md](../../docs/features/p2-eat-tonight.md)

Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong · `[!]` bị chặn

## A. Database + Storage → [steps/a-database.md](steps/a-database.md)

- [x] **P2-01** Migration `posts` + `post_media` — [database-schema.md](../../docs/design/backend/database-schema.md) mục 7
- [x] **P2-02** Migration `reactions` + `comments` — mục 7
- [x] **P2-03** Cấu hình Storage bucket + policy — mục 13
- [~] **P2-04** Kiểm tra RLS: tài khoản ngoài space không đọc được ảnh — policy đã viết, còn tự thử bằng tài khoản thứ ba

## B. Đăng kỉ niệm → [steps/b-post.md](steps/b-post.md)

- [x] **P2-05** Chọn ảnh + **nén ở client** (chốt D7 trước)
- [x] **P2-06** Đọc EXIF lấy ngày, mặc định hôm nay nếu không có
- [x] **P2-07** Màn hình soạn bài **một trang** — caption · ngày · địa điểm · hoạt động
- [x] **P2-08** Upload nền + bài hiện ngay ở trạng thái "đang tải"
- [x] **P2-09** Hàng đợi đồng bộ khi mất mạng, tự gửi lại — `lib/idb.ts` + `lib/syncQueue.ts`, ảnh nén xong mới xếp hàng
- [x] **P2-10** Push "vừa thêm một kỉ niệm" + gộp nhiều ảnh liên tiếp thành một thông báo

## C. Xem lại → [steps/c-browse.md](steps/c-browse.md)

- [x] **P2-11** Timeline dạng thẻ, nhóm theo tháng, tiêu đề dính
- [x] **P2-12** Chế độ lưới ảnh 3 cột
- [x] **P2-13** Chi tiết bài: ảnh toàn màn hình, vuốt ngang
- [~] **P2-14** Sửa / xoá bài của mình — xoá xong, **sửa chưa làm**
- [x] **P2-15** Lọc theo năm và theo hoạt động
- [x] **P2-16** Trạng thái rỗng có sức mời gọi (*"Kỉ niệm đầu tiên của hai đứa nằm ở đây nè 📷"*)

## D. Tương tác → [steps/d-reactions.md](steps/d-reactions.md)

- [x] **P2-17** Thả tim (một loại duy nhất) — phản hồi lạc quan
- [x] **P2-18** Bình luận + realtime
- [x] **P2-19** Push khi có tim / bình luận

## E. "Tối nay ăn gì?" — phần A → [steps/e-eat-tonight.md](steps/e-eat-tonight.md)

- [x] **P2-20** Migration `eat_items` — [eat-tonight.md](../../docs/features/p2-eat-tonight.md) mục 6
- [x] **P2-21** Danh sách 2 tab (Muốn thử / Đã đi) + **thêm nhanh bằng một ô nhập**
- [x] **P2-22** Nhận chia sẻ link từ app khác (TikTok, Maps) → điền sẵn `source_url`
- [x] **P2-23** Màn hình quay + hoạt ảnh ~1.5 giây
- [x] **P2-24** Hàm quay có luật (loại chỗ vừa ăn, ưu tiên chưa thử)
- [x] **P2-25** Thẻ "Tối nay ăn gì?" trên Home

## F. Home → [steps/f-home.md](steps/f-home.md)

- [x] **P2-26** Khối "Kỉ niệm gần đây" (4 ảnh + Xem tất cả)
