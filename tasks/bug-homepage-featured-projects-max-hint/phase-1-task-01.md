# bug-homepage-featured-projects-max-hint · phase-1-task-01 — "Dự án hiển thị" không ghi tối đa 6 (BL-115, QA 32 Thấp)

- Change doc: `spec/changes/2026-11-09-homepage-featured-projects-max-hint.md` (BACKLOG BL-115).
- Phụ thuộc: không.
- Trạng thái: `done` — FAST PASS round 2 (`.context/review-reports/bug-homepage-featured-projects-max-hint-phase-1-task-01-round-2-review.md`; r1 FAIL: hero.slides thiếu giới hạn)

## Classification / Risk
- Type: **BUG** (chỉ chữ mô tả admin).
- Severity: low.
- Risk: **LOW** — chỉ `admin.description` trong global `homepage`; không đổi schema DB (description không sinh migration), không đổi API/quyền.
- Expected review level: FAST.
- Doc impact dự kiến: `no doc impact`.

## Root cause (đã chứng minh)
`src/globals/Homepage.ts:199` — field `featuredProjects.projects` có `maxRows: FEATURED_PROJECTS_MAX` (6) nhưng `admin.description` chỉ ghi "Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất." → admin không biết giới hạn.

## Thiết kế fix
- Description = `Tối đa ${FEATURED_PROJECTS_MAX} dự án. Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất.` (dùng hằng, không hardcode 6).
- Rà mọi relationship/array `hasMany` có `maxRows` (hoặc giới hạn hiển thị cứng phía render) trong cùng global (`src/globals/Homepage.ts`, `src/globals/homepage/blocks.ts`): vd `heroSearch.chipProjects` (HERO_CHIP_PROJECTS_MAX), danh mục cho thuê (RENTAL_CATEGORIES_MAX), tin tức (HOME_NEWS_POSTS_MAX), điểm mạnh (STRENGTH_ITEMS_MIN/MAX), "Tin ưu đãi hiển thị" (khối hiển thị tối đa FEATURED_OFFERS_MAX — grep hằng ở `src/lib/home/*`). Field nào có giới hạn mà description chưa nêu → thêm "Tối đa N …" từ hằng. Field không có `maxRows` nhưng phía hiển thị cắt (vd Tin ưu đãi) → ghi "Hiển thị tối đa N tin" chỉ khi hằng có sẵn và import không tạo vòng phụ thuộc; KHÔNG thêm `maxRows` mới (đổi hành vi lưu — ngoài scope).
- KHÔNG đụng `validateRentalCategories` (BL-116 làm task riêng song song trên `blocks.ts` — nếu cần sửa description trong `blocks.ts` chỉ đổi chuỗi description, tránh hàm validate).

## Files
- Sửa: `src/globals/Homepage.ts` (+ có thể `src/globals/homepage/blocks.ts` chỉ chuỗi description), test schema (vd `src/globals/Homepage.test.ts` hoặc test hiện có của homepage global — builder tìm).
- KHÔNG đụng: file bẩn ngoài scope, `src/payload-types.ts` (description không đổi types; nếu `pnpm generate:types` đổi gì → báo).

## Acceptance
- [ ] Description "Dự án hiển thị" nêu "Tối đa 6 dự án" lấy từ hằng.
- [ ] Các field giới hạn khác trong global đã đồng bộ (liệt kê trong Repro Verification).
- [ ] Test schema đọc config khẳng định description chứa số tối đa = hằng.
- [ ] `pnpm typecheck`, `pnpm lint`, vitest liên quan PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: /admin/globals/homepage → "Dự án hiển thị" description không nêu giới hạn 6.
- Expected: mô tả ghi giới hạn tối đa.
- Actual before: "Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất." (không nêu 6).
- Actual after: "Tối đa 6 dự án. Để trống thì tự lấy ..." (từ `FEATURED_PROJECTS_MAX`). Rà cùng global: `heroSearch.chipProjects` (thiếu) → thêm "Tối đa ${HERO_CHIP_PROJECTS_MAX} dự án." (blocks.ts, chỉ chuỗi); `hero.slides` (thiếu ở attempt 1) -> thêm "Tối đa ${HERO_SLIDES_MAX} slide." (Homepage.ts); rentals/news đổi số cứng sang `RENTAL_CATEGORIES_MAX`/`HOME_NEWS_POSTS_MAX` (chỉ chuỗi); strengths đã nêu; "Tin ưu đãi hiển thị" bỏ qua (xem Residual risk).
- Evidence: `src/globals/Homepage.test.ts` thêm 3 case (projects, chipProjects, hero.slides: maxRows = hằng + description chứa "Tối đa N ..."); kết quả verify attempt 2 ghi trong report builder.
- Status: PASS

## Residual risk
- `FEATURED_OFFERS_MAX` (6) nằm ở `src/lib/home/home-view.ts` vốn import `globals/Homepage` -> import ngược tạo vòng phụ thuộc; không thêm mô tả cho "Tin ưu đãi hiển thị" (hiển thị cắt 6, chưa ghi). Đề xuất task riêng nếu cần (chuyển hằng sang module trung lập).
- `pnpm typecheck` còn lỗi ngoài scope: `src/globals/site-settings/social-links.test.ts` (builder SiteSettings song song); không sửa.

- `FEATURED_PROJECTS_MAX` khai báo trùng ở `src/globals/Homepage.ts:24` và `src/lib/home/home-queries.ts:18` (ngoài scope; đề xuất task gộp về một nguồn).

## Doc impact
no doc impact (chỉ admin.description, không đổi schema/API/types).
