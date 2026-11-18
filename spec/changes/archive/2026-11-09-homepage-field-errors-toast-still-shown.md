---
id: homepage-field-errors-toast-still-shown
type: bug
status: done
created: 2026-11-09
---

# Admin Homepage: QA bug 33 chưa xong — vẫn chọn được quá 4 danh mục cho thuê, không đỏ lúc chọn, toast gom không nói lý do (mở lại BL-116)

## Yêu cầu
QA ghi lại kết quả thực tế của bug 33 (sheet dòng 33), BL-116 chưa xử lý hết — user 2026-11-09:
1. Hiện toast "Trường sau chưa hợp lệ: Sản phẩm & Tin nổi bật → Cho thuê → Danh mục cho thuê hiển thị" — không nói lý do. Lỗi phải báo **ngay dưới ô** (quy ước BL-058 T02).
2. Vẫn cho chọn tiếp quá 4 danh mục.
3. Ô không viền đỏ / không làm nổi bật ô lỗi.

## Xác minh (2026-11-09, local dev, code staging hiện tại gồm d3443df4 BL-116)
- `/admin/globals/homepage` → Sản phẩm & Tin nổi bật → Cho thuê → chọn 5 danh mục: **chọn được cả 5**, ô **không đỏ**, không có chữ lỗi → điểm 2 + 3 vẫn lỗi.
  BL-116 cho `validate` trả lỗi ở `onChange` (`src/globals/homepage/blocks.ts:52`) nhưng form sửa của Payload không validate phía client (xem `src/components/admin/FormErrorFocus.tsx:12`) → không có tác dụng trên UI. Reviewer BL-116 không chạy app (Residual risk ghi trong report round 1).
- Bấm Lưu: local hiện "1 Lỗi" ở khối + viền đỏ + "Tối đa 4 danh mục." dưới ô, **không** toast. Ảnh của user lại có toast →
  cần kiểm môi trường user/QA test (staging/prod đã deploy BL-116 chưa) và vì sao `FormErrorFocus` gắn cờ unmatched ở đó.

## Acceptance (bắt buộc)
- [ ] Đã chọn đủ 4 danh mục → không chọn thêm được (mục còn lại bị khoá/ẩn trong dropdown, hoặc tương đương) + nhắc "Tối đa 4 danh mục." dưới ô
- [ ] Nếu bằng cách nào đó vẫn vượt 4 (API/dữ liệu cũ) → Lưu bị chặn, lỗi dưới ô + viền đỏ, khối/tab tự mở + cuộn tới ô, **không** toast gom
- [ ] Kiểm trên đúng môi trường QA test (staging) sau deploy, không chỉ unit test — có ảnh chụp
- [ ] Áp cùng cách cho các ô giới hạn số lượng khác ở Homepage (Dự án hiển thị 6, slide hero 8, dự án gợi ý 6, bài tin tức 3 — BL-115) nếu cùng lỗi
- [ ] Test hồi quy

## Ghi chú
Liên quan BL-116 (d3443df4), BL-058 T02 (364e9c7), BL-115. Nguồn: QA sheet "TAMI – Báo bug" dòng 33.
