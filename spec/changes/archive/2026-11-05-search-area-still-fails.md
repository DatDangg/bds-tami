---
id: search-area-still-fails
type: bug
status: done
created: 2026-11-05
---

# Tìm kiếm khu vực Cho thuê vẫn lọc sai sau BL-103 (QA bug 22 "Vẫn lỗi")

## Yêu cầu
QA 30/10 báo tìm "ba đình" ở /cho-thue vẫn ra tin không thuộc khu vực. BL-103 đã sửa khớp cụm từ trên text nhưng QA đánh giá vẫn lỗi: có thể kỳ vọng là lọc theo trường khu vực/phường (district/ward) chứ không chỉ khớp chữ trong tiêu đề/mô tả. Cần xem 3 ảnh bug22-1..3, tái hiện trên staging với q=ba+đình, đối chiếu kết quả để xác định đúng root cause.

Nguồn: QA sheet "TAMI – Báo bug" dòng 22 (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4).

## Acceptance (bắt buộc)
- [ ] Tái hiện đúng bước QA ghi, thấy lỗi trước khi sửa (root cause trước, không sửa triệu chứng)
- [ ] Sau sửa, bước tái hiện cho kết quả đúng "mong đợi"; có test hồi quy

## Quyết định (user 2026-11-05)
Root cause: `buildRentalSearchText` (`src/hooks/rentals/build-search-text.ts:60`) gộp `legacyNames` của phường vào chuỗi tìm kiếm; tên cũ có đuôi ", Quận Ba Đình" (vd Hồng Hà ← "Phường Phúc Xá, Quận Ba Đình") nên mọi tin Hồng Hà khớp "ba đình".
**Chỉ theo tên mới:** BỎ HẲN tên cũ (`legacyNames`) khỏi chuỗi tìm kiếm — chỉ giữ tên phường/tỉnh hiện hành. Dựng lại `searchText` của mọi tin (reindex) sau khi đổi. Cập nhật ERD §6 / Wards.ts mô tả "tên cũ dùng cho tìm kiếm" cho khớp.
Ngoài scope: dữ liệu mẫu CT-000019/020/048 (tiêu đề Tây Hồ nhưng phường Ba Đình) — sửa dữ liệu riêng.

## Ghi chú (2026-11-09)
Đã kiểm: CHƯA sửa — `build-search-text.ts:60` vẫn gộp `legacyNames`; không có commit BL-110. Làm theo quyết định 2026-11-05 ở trên.
