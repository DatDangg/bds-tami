# Spec Update — 2026-10-23 project-detail-layout-fixes

**spec_version:** 1.56.1 → 1.56.2 (PATCH — ghi as-built UI, không đổi requirement / business intent)
**Trigger:** bug-fix (BL-071, change-request class BUG)
**Work item:** `bug/project-detail-layout-fixes` — T01 (`d81b118`), T02 (`b3f1f10`), T03 (kèm close-out); cả 3 Reviewer NORMAL PASS r1
**Change doc:** `spec/changes/2026-10-23-project-detail-layout-fixes.md`

## Lý do
User báo 3 lỗi giao diện trang chi tiết dự án (staging, The Windsor Collection): thẻ Sản phẩm co chữ dọc, ảnh khối Tiện ích kéo cao theo số mục, dải "tương tự" cùng nền trang.

## Requirements
- **THÊM / SỬA / XOÁ requirement:** không.
- **Làm rõ as-built** (SPECIFICATIONS.md, F2, đoạn "As-built bug-fix BL-071"); **thay** quyết định design cũ, user duyệt 2026-10-23:
  - BL-056 mục (3): thẻ Sản phẩm 3 cột cố định + tổng quan hai cột 55/45 ≥ xl → xếp dọc, thẻ auto-fill (8,5rem < sm, 11rem ≥ sm).
  - BL-060 mục (2): nền dải tương tự `bg-primary-subtle` + viền trên → `bg-surface` (trắng).
  - Ảnh Tiện ích (BL-056 mục 5 / BL-060 mục 4) luôn 4:3, dính ≥ md.
  - `formatAreaRange`: NBSP trước "m²".

## Ảnh hưởng
- Module: `ProjectOverview`, `DetailStatCards`, `DetailFeatureList`, `project-detail-view.ts` (`formatAreaRange`), `SimilarCarousel` (chung Dự án / Cho thuê / Tin BĐS).
- Test lại: `/du-an/<slug>`, `/cho-thue/<slug>`, `/tin-bds/<slug>` (VI + `/en`) ở 375/768/1440/1920.
- Không đổi schema / API / quyền / i18n, không migration.
