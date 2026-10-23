# Spec Update — 2026-10-24 ui-polish-sticky-underline-flags

**spec_version:** 1.57.0 → 1.58.0 (MINOR — đổi hành vi/giao diện đã ghi trong spec, không đổi business intent)
**Trigger:** feature-update (BL-074, change-request class MODIFY, UI only)
**Work item:** `feature/ui-polish-sticky-underline-flags` — phase 1: T01, T02, T03 (đang build)
**Change doc:** `spec/changes/2026-10-23-ui-polish-sticky-underline-flags.md`

## Lý do
User test local (2026-10-23) báo 3 điểm: thanh mục con dính sát/đè thẻ "Nhận thông tin dự án" ở màn nhỏ; còn gạch chân ở link/nút; cờ đổi ngôn ngữ to và vuông.

## Delta (SPECIFICATIONS.md: Overview bullet "Chỉnh UI BL-074" + F12 FR-PUB-19)

1. **Thanh mục con < lg không đè thẻ form (T01).**
   - Root cause: `DetailSubNav` là con trực tiếp của gốc `[data-detail-page]` nên containing block của `position: sticky` là cả trang chi tiết; < lg `aside` (thẻ form) xếp sau cột trái, thanh vẫn dính khi thẻ trượt tới, che/đè thẻ.
   - Sửa: đưa thanh vào trong lưới (`DetailLayout`, wrapper `lg:contents`); < lg thanh dính chỉ trong phạm vi cột trái, thôi dính khi hết cột; ≥ lg thanh dính trên cả hai cột và thôi dính cuối lưới cùng thẻ phụ (không còn dính trên dải "… tương tự"/Điểm mạnh/banner tư vấn). Mép thanh vẫn thẳng mép thẻ (BL-028), khe trên/dưới thanh không đổi. `#lead-form` < lg cuộn tới `--sticky-top` + 1rem; ≥ lg giữ + 4.5rem.
   - Dùng chung Dự án / Cho thuê / Tin BĐS (`DetailPageShell`); Dịch vụ / Tuyển dụng không có subNav, không đổi.
2. **Bỏ gạch chân (T02).** Link / nút / mục menu / thẻ / footer / breadcrumb / mục lục / 404 / cookie banner / form… site công khai: không gạch chân lúc thường lẫn hover (kể cả vạch `border-b-2` dưới mục menu header `DesktopNav`); hover đổi màu/nền theo token, `focus-visible` giữ; mục menu đang xem = nền viên thuốc + `aria-current`; link giữa câu ngoài bài (vd "Chính sách bảo mật") đậm + màu nhấn (WCAG 1.4.1). **Giữ:** link trong `RichText` (tin tức, pháp lý, mô tả) và chữ gạch chân do biên tập đặt.
3. **Cờ đổi ngôn ngữ (T03).** Cờ VN/UK hình chữ nhật 3:2 (SVG `viewBox 30×20`), hiển thị ~21×14 px, ring đang xem mảnh hơn (vẫn offset + cờ kia mờ 60%); vùng bấm giữ ≥ 44×44; thuộc tính truy cập, đích link, cookie `NEXT_LOCALE` không đổi.

## Câu spec bị thay thế
- F12 FR-PUB-19 (as-built BL-063): "khung 24×24 bo ≤ 2px", ring 2px có offset → hình chữ nhật 3:2 ~21×14, ring mảnh hơn.
- BL-037 (hover link): "link trong RichText giữ gạch chân; footer / mục lục / LanguageSwitcher / 404 chưa đổi" → chỉ còn RichText giữ gạch chân.
- Header kính (BL-016/BL-020 P1): "mục đang xem gạch chân màu chữ" → nền viên thuốc + `aria-current`.
- BL-028/BL-056: thanh mục con dính trên cả trang chi tiết → dính trong lưới (< lg chỉ cột trái).

## Ngoài phạm vi
- Admin Payload (`src/app/(payload)/**`, component admin).
- Tab bar danh mục trang danh sách (`ListingCategoryTabs`, chỉ báo `border-b-2` bao cả ô tab).
- Không đổi schema / API / quyền / i18n, không migration.

## Ảnh hưởng
- Module: `DetailLayout`, `DetailSubNav`, `DetailContactAside`, `DetailPageShell`; ~26 component có `underline` (xem task-02); `DesktopNav`; `LanguageSwitcher`, `flag-icons`.
- Test lại: 3 trang chi tiết vi/en ở 390/768/1024/1440; header/footer/menu toàn site; form consent, filter, 404; link trong bài tin tức vẫn gạch chân.
