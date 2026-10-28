# Builder — feature-projects-category-page phase-1-task-01 (BL-090)

Trạng thái: code + test xong, chưa commit (theo yêu cầu). Review độc lập (STRICT) còn lại.
Đã làm: route `/du-an/danh-muc/[category]` + `/en/projects/category/[category]`, ProjectListPage/loader nhận `categorySlug`, tab link route mới, 308 từ `?category=` (giữ tham số khác), metadata danh mục (`project-list-metadata.ts`), sitemap `categories-projects`, routing/LIST_FALLBACK/MISSING_PAGE_RULES/CATEGORY_PAGE_ROUTES/revalidate-category, i18n `noProjectsInCategory`, slug dành riêng projects (`slug.ts`).
Verify: typecheck PASS; eslint file đổi sạch; vitest toàn bộ PASS (2 flake timeout dưới tải pass khi chạy riêng); Playwright VI/EN 1440/390 xem log trong task file (Builder log).
Chi tiết: tasks/feature-projects-category-page/phase-1-task-01.md § Builder log.
Dở: không. Lưu ý: docker tami-* đã được start lại cho integration test.
