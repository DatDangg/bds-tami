# Spec Update — 2026-10-24 home-featured-projects-container

**spec_version:** 1.58.0 → 1.59.0 (MINOR — đổi hành vi/giao diện đã ghi trong spec, không đổi business intent)
**Trigger:** feature-update (BL-075, change-request class MODIFY, UI only)
**Work item:** `feature/home-featured-projects-container`
**Change doc:** `spec/changes/2026-10-24-home-featured-projects-container.md`

## Lý do
User (2026-10-24, ảnh chụp prod ≈ 1880px): slider "Dự án nổi bật" trang chủ tràn viền nên thẻ đầu không thẳng mép các khối khác; prod chỉ có 3 dự án nên hàng thẻ dồn trái, nửa phải trống.

## Delta (SPECIFICATIONS.md: bullet trang chủ "Dự án nổi bật (ĐỔI thẻ + đầu khối)" + design-spec S01 khối 3 / bảng breakpoint 1536)

**SỬA** requirement Dự án nổi bật trang chủ:
1. **Bỏ tràn viền:** vùng thẻ nằm trong khung `max-w-container` + `px-gutter` như tiêu đề khối / Về TAMI / footer; ≥ lg mép trái/phải vùng thẻ trùng mép khung.
2. **Ít thẻ → căn giữa:** số thẻ vừa hết một hàng ở breakpoint đang xem (không cuộn được) → hàng thẻ căn giữa, ẩn mũi tên + chấm.
3. **Nhiều thẻ → slider như cũ:** thẻ đầu thẳng mép khung, mũi tên ≥ md + chấm + vuốt (cơ chế BL-038), a11y carousel giữ, < md vuốt ngang.
4. **Chỉ khối trang chủ đổi:** `CardSlider` dùng chung (slider "… tương tự", tiện ích, bài liên quan) giữ nguyên hành vi.

## Câu spec bị thay thế
- design-spec S01.3 (BL-020/BL-044): "Slider tràn viền" → trong khung nội dung.
- design-spec bảng breakpoint 1536: "hero/slider vẫn tràn viền" → chỉ hero tràn viền; slider dự án nổi bật trong khung.

## Ngoài phạm vi
- Thẻ dự án (kích thước/nội dung), đầu khối, nút "Xem tất cả dự án", khối khác của trang chủ.
- Không đổi schema / API / quyền / i18n, không migration.
