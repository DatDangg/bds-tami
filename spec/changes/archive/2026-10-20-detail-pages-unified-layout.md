---
id: detail-pages-unified-layout
type: feature
status: done
completed: 2026-10-20
created: 2026-10-20
---

# Chi tiết dự án + chi tiết cho thuê: cùng một bố cục, nền vàng nhạt, nội dung trong thẻ trắng, header không bám theo

## Yêu cầu
User 2026-10-20 (kèm 3 ảnh: header + thanh mục con hiện tại của chi tiết dự án; ảnh tham chiếu market.vinhomes.vn chi tiết cho thuê):

1. **Chi tiết dự án (`/du-an/[slug]`) và chi tiết cho thuê (`/cho-thue/[slug]`) phải thiết kế giống nhau** — cùng khung bố cục: thanh mục con (Tổng quan · Vị trí · Tiện ích · Thư viện…), cột nội dung + thẻ tư vấn dính bên phải (≥ lg), cùng kiểu tiêu đề section.
2. **Trên trang chi tiết, khi cuộn thì không còn header** — header ẩn hẳn, chỉ còn thanh mục con (Tổng quan, Vị trí…). **Thanh mục con dính sát đỉnh trang** (vị trí như header nổi đang nằm, sát mép trên) — user 2026-10-20 sửa lại ý 2.
3. **Nền trang chi tiết màu vàng nhạt** theo token màu dự án (dự kiến `--color-primary-subtle` #f8f3eb).
4. **Nội dung các mục (Tổng quan, Vị trí, Tiện ích, …) nằm trong một thẻ trắng bo góc** giống ảnh Vinhomes (thẻ `--color-surface`, bo góc lớn, các section xếp trong thẻ).
5. **Thanh mục con: nút đang chọn đổi nền đen → vàng (`--color-primary`), chữ đen** (`--color-primary-foreground` #141414).

## Bối cảnh
- Hiện tại: chi tiết dự án có thanh mục con viên thuốc (nút active nền đen chữ trắng) + thẻ Tư vấn dính (BL-020 P4); header nổi kính mờ dính mọi trang (BL-025/026).
- Chi tiết cho thuê chưa cùng bố cục với chi tiết dự án.
- File liên quan: `src/app/(frontend)/[locale]/du-an/[slug]/page.tsx`, `src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx`, `src/components/projects/ProjectDetail.tsx`, `src/components/projects/ProjectOverview.tsx`, header `HeaderFrame`.

## Acceptance (bắt buộc)
- [x] Hai trang chi tiết dùng chung bố cục (thanh mục con + cột nội dung + thẻ tư vấn dính ≥ lg); ưu tiên tái sử dụng component chung thay vì copy.
- [x] Trên 2 trang chi tiết: cuộn xuống thì header ẩn hẳn (không còn thanh nổi), chỉ thanh mục con dính sát đỉnh trang (lề trên như header nổi đang có, không chừa chỗ cho header); chuyển động lên đỉnh mượt, không giật/CLS; các trang khác giữ header nổi như BL-025/026.
- [x] Nền trang chi tiết = vàng nhạt từ token (không hardcode hex mới).
- [x] Nội dung các section nằm trong thẻ trắng bo góc; thẻ tư vấn bên phải giữ nguyên tách riêng.
- [x] Nút mục con active: nền `--color-primary`, chữ `--color-primary-foreground`, tương phản ≥ 4.5:1; nút thường + focus-visible vẫn rõ trên nền vàng nhạt.
- [x] Neo cuộn tới section không bị thanh mục con che (scroll-margin đúng sau khi bỏ header bám).
- [x] 375 / 768 / 1280px không tràn ngang; reduced-motion giữ nguyên.

## Ghi chú
- Classify dự kiến: MODIFY (UI, không đổi schema). Liên quan BL-020 P4 (thanh mục con, thẻ tư vấn), BL-025/026 (header).
- Cần xác nhận khi build: mục con của chi tiết cho thuê lấy theo section nào có dữ liệu (trống tự ẩn như chi tiết dự án).
