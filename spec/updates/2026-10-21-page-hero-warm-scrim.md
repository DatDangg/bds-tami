# Spec Update — 2026-10-21 page-hero-warm-scrim (scrim ảnh đen ánh nâu vàng)

**spec_version:** 1.40.0 → 1.41.0 (MINOR — đổi tông lớp phủ ảnh; không đổi schema, API, URL, quyền, bố cục)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-049**, MODIFY). Change doc `spec/changes/archive/2026-10-21-page-hero-warm-scrim.md`. Task `tasks/feature-page-hero-warm-scrim/phase-1-task-01.md`. Review: `.context/review-reports/feature-page-hero-warm-scrim-phase-1-task-01-round-1-review.md` (NORMAL, PASS r1). Spec-validator: `.context/review-reports/feature-page-hero-warm-scrim-spec-validation.md` (PASS).

## Requirements (SPECIFICATIONS.md)

- **Overview — "Hero trang con" (SỬA, thêm câu "Lớp phủ ảnh (BL-049)"):** token `--color-banner-scrim` ngả đen ánh nâu vàng, dùng chung cho mọi lớp phủ ảnh dùng token (hero trang con lớp phẳng + gradient trái, banner ảnh trang danh sách, banner CTA / tư vấn, chú thích ảnh khối Về TAMI, bóng chữ breadcrumb kính); giữ độ mờ, gradient, bố cục; chữ trắng ≥ 4.5:1 trên ảnh trắng tinh; dòng vàng ≥ 4.5:1 ở mép trái hero.

## Hành vi mới

| Trước | Sau (BL-049) |
|---|---|
| `--color-banner-scrim: rgb(10 12 16 / 0.6)` (đen lạnh) | `rgb(20 13 2 / 0.6)` (đen ánh nâu vàng) |

Số đo (ảnh trắng tinh, alpha 0.6): chữ trắng / nền phẳng 5.17 → **5.07**; chữ trắng breadcrumb `.crumb-glass` 4.65 → **4.60**; vàng `#e0bf89` mép trái (2 lớp) 7.23 → **7.03**; vàng trên 1 lớp (chỉ liên quan vòng focus CTA, đã dùng outline trắng) 2.95 → 2.89. Gợi ý ban đầu `rgb(28 20 10 / 0.6)` bị loại: breadcrumb chỉ 4.35.

## Code (as-built)

- `src/app/(frontend)/globals.css` — giá trị + comment token `--color-banner-scrim`.
- `src/lib/contrast.test.ts` — thêm test BL-049 (R > G > B, alpha 0.6); test tương phản cũ đọc token động.

## Ảnh hưởng

- **Trực tiếp:** màu lớp phủ ảnh ở hero trang con (Dự án, Cho thuê + danh mục, Đăng tin BĐS, Tin tức, Tuyển dụng, Liên hệ, Dịch vụ, Pháp lý), PageBanner ảnh, banner CTA trang chủ + ConsultBanner, chú thích ảnh Về TAMI, bóng chữ breadcrumb.
- **Hồi quy:** độ đọc chữ trên ảnh (AA), không đổi bố cục/chiều cao.
- Không migration, không đổi quyền, không endpoint mới. Doc: `docs/DESIGN.md`, `.context/design-spec.md`, `skills/react-nodejs/design-tokens.md`.
