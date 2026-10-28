# Spec Update — 2026-10-28 projects-category-page

**spec_version:** 1.59.0 → 1.60.0 (MINOR — thêm requirement: trang danh mục Dự án)
**Trigger:** feature-update (BL-090, change-request class MODIFY)
**Work item:** `feature/projects-category-page`
**Change doc:** `spec/changes/2026-10-27-projects-category-breadcrumb-title.md`

## Lý do
QA sheet 27/10 dòng 12: chọn danh mục ở `/du-an` nhưng breadcrumb / tiêu đề không đổi theo danh mục. Đúng hiện trạng (danh mục chỉ là bộ lọc). User chốt cách B (2026-10-27): mỗi danh mục dự án có trang riêng như S05 (Cho thuê / Tin BĐS / Tin tức).

## Delta (SPECIFICATIONS.md: dòng `/du-an` + khối "Trang danh mục Dự án (BL-090 …)"; `.context/design-spec.md` S05)
- THÊM route `/du-an/danh-muc/[category]` · `/en/projects/category/[category]` (danh mục `scope = project`, gồm dự án của danh mục con): `<title>` "<Danh mục> – Dự án | TAMI" (EN "<Name> – Projects | …"), breadcrumb Trang chủ › Dự án › <cha> › <Danh mục>, H1 = tên danh mục, mô tả `categories.description`.
- SỬA tab danh mục `/du-an`: thành link tới trang danh mục, `aria-current="page"` tab đang xem, "Tất cả" → `/du-an`. Bộ lọc / sắp xếp / phân trang / `q` giữ danh mục.
- SỬA `/du-an?category=<slug>` → 308 sang trang danh mục, giữ tham số khác; slug lạ bỏ (không 404).
- THÊM 404 cho slug không có / EN chưa dịch; sitemap VI/EN; canonical + hreflang; noindex khi có bộ lọc.
- THÊM ràng buộc: slug dự án `danh-muc` / `category` bị chặn (không đè `/du-an/[slug]`).

## Ảnh hưởng
Routing / SEO dùng chung (risk high): `/du-an`, `/du-an/[slug]`, sitemap, chuyển ngôn ngữ, revalidate danh mục, validate slug.
