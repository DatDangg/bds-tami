---
id: single-font-montserrat
type: feature
status: done
completed: 2026-10-20
created: 2026-10-20
---

# Toàn website công khai dùng 1 font: Montserrat

## Yêu cầu
Bỏ EB Garamond (serif, `font-display`), mọi chữ trên site công khai dùng chung **Montserrat**. Hiện tiêu đề + nhiều chỗ không phải tiêu đề (giá, thông số, địa chỉ, hotline, menu mobile, "+N" gallery, tiêu đề accordion điều khoản…) dùng Garamond, phần còn lại Montserrat → nhìn mỗi chỗ một font.

## Acceptance (bắt buộc)
- [x] Không còn EB Garamond: bỏ khỏi `src/lib/fonts.ts` (không tải font nữa) và layout; `--font-display` trong `src/app/(frontend)/globals.css` trỏ về Montserrat (hoặc bỏ token, thay `font-display` → `font-sans` ở ~50 file — builder chọn cách gọn, nhất quán).
- [x] Phân cấp tiêu đề giữ được bằng cỡ + độ đậm Montserrat (heading 500/600 — chỉ dùng weight đã nạp, không bold giả); cập nhật scale `text-display/h1/h2/h3/h4/price` nếu cần (letter-spacing/line-height hợp sans).
- [x] Viết thường (sentence case) giữ nguyên (BL-020), không thêm `uppercase` cho heading.
- [x] Tiếng Việt đủ dấu ở mọi heading (subset vietnamese).
- [x] Không đổi admin (đã Montserrat), email, trang lỗi toàn cục.
- [x] Cập nhật design-spec (§ typography, câu "EB Garamond + Montserrat", bảng kiểm Serif) + `docs/DESIGN.md` + design tokens; test font hiện có (`src/lib/fonts.test.ts`, test class `font-display`) sửa theo.
- [x] Kiểm trực quan trang chủ, danh sách, chi tiết dự án/cho thuê/tin tức ở 390/1280 không vỡ dòng/tràn do sans rộng hơn serif.

## Ghi chú
- Nguồn: user 2026-10-20 ("sao font chữ mỗi chỗ 1 cái thế" → "chung 1 loại thôi chứ nhỉ", chọn Montserrat).
- Đổi intent design-spec (bỏ serif thương hiệu EB Garamond) — user đã duyệt trong chat.
- Lợi phụ: bớt 1 font tải → nhẹ LCP.
