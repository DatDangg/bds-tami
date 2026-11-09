---
id: homepage-partners-block-missing
type: bug
status: done
created: 2026-11-05
---

# Trang chủ không hiển thị khối Đối tác dù đã cấu hình (QA bug 26)

## Yêu cầu
Admin có khối Đối tác trong Cấu hình Trang chủ (/admin/globals/homepage) nhưng trang chủ không render; sau khối Tin tức chuyển thẳng sang "Cần tư vấn bất động sản". Mong đợi: hiện khối Đối tác (logo + tên) đúng thứ tự cấu hình. Kiểm tra renderer block, điều kiện ẩn khi thiếu dữ liệu, cache/revalidate.

Nguồn: QA sheet "TAMI – Báo bug" dòng 26 (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4).

## Acceptance (bắt buộc)
- [ ] Tái hiện đúng bước QA ghi, thấy lỗi trước khi sửa (root cause trước, không sửa triệu chứng)
- [ ] Sau sửa, bước tái hiện cho kết quả đúng "mong đợi"; có test hồi quy

## Điều tra (2026-11-09)
Root cause: chưa làm — khối Đối tác (FR-PUB-17, Should) chỉ có cấu hình admin; `src/lib/home/home-view.ts` không có `partners` trong `RENDERED_BLOCKS` và `toBlock` trả `null` cho `partners`. Nguồn dữ liệu: `developers.showAsPartner` (+ `sortOrder`). Phân loại lại: **ADDITIVE**.

## Quyết định (user 2026-11-09)
Hiển thị dạng **dải logo chạy ngang (marquee/carousel tự chạy)** cho đẹp — logo + tên đối tác, đúng thứ tự `blockOrder`/bật-tắt. Yêu cầu: tôn trọng `prefers-reduced-motion` (dừng chạy), dừng khi hover/focus, ẩn khối khi không có đối tác nào, responsive 390/768/1440, bản EN tiêu đề.
