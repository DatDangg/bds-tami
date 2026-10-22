# Spec Update — 2026-10-22 listing-followups

**spec_version:** 1.49.1 → 1.50.0 (MINOR — C-1 đổi hành vi URL công khai: link cũ `?category=` chuyển hướng 308; C-4 đồng bộ `priceMax=0`)
**Trigger:** feature-update (BL-055, change-request class MODIFY + BUG nhỏ — việc còn mở sau BL-052)
**Work item:** `feature/listing-followups` phase 1 · T01 STRICT PASS r1 (commit `33bdce6`) · T02 NORMAL PASS r1 (commit `e0a61b3`) · T03 đo LCP, không đổi code, FAST PASS r1 (commit `0cb9434`)
**Change doc:** `spec/changes/2026-10-22-listing-followups.md` · task `tasks/feature-listing-followups/phase-1-task-0{1,2,3}.md` · review `.context/review-reports/feature-listing-followups-phase-1-task-0{1,2,3}-round-1-review.md`

## Lý do
Phase review cuối BL-052 (`feature-listing-detail-redesign-phase-3-phase-review.md` mục (c)) để lại 7 việc không chặn (C-1, C-4..C-8) + đo LCP. BL-055 gom xử lý: 2 việc đổi hành vi URL (C-1, C-4), 2 việc hạ tầng test / DRY (C-7, C-8), 2 việc đo rồi quyết (C-5 index, C-6 GIST) và đo LCP bản build.

## Requirements
- **SỬA — F3 / F4 tab danh mục (`SPECIFICATIONS.md:45` `/cho-thue`, `:48` `/tin-bds`) — C-1:** link cũ `/tin-bds?category=<slug>` và `/cho-thue?category=<slug>` (vi + `/en/property-news?category=` / `/en/for-rent?category=`) khi URL **chỉ có `category`** (không tham số khác mang giá trị; khoá rỗng như `&q=` không tính) **và** slug là danh mục có thật ở locale → **308** sang `/tin-bds/danh-muc/<slug>` · `/cho-thue/danh-muc/<slug>` (en: `/en/property-news/category/<slug>` · `/en/for-rent/category/<slug>`). Kèm tham số khác (`page` / `q` / lọc / `sort`) hoặc slug lạ → như cũ: 200, lọc + đánh dấu tab, canonical (và `noindex` ở `/tin-bds`) về trang danh mục. Route danh mục có thêm `?category=` → không redirect. Hết tín hiệu trái nhau `noindex` + canonical ở `/tin-bds`.
- **SỬA — F2 `/du-an` (`SPECIFICATIONS.md:59`) — C-4:** `priceMax=0` gõ tay = **không giới hạn trên** (đồng bộ `/tin-bds`); `priceMin` giữ; `priceMax=1` vẫn lọc. (`areaMax` ở `/du-an` không có tham số riêng — không đổi.)
- **THÊM — as-built BL-055 (`SPECIFICATIONS.md:59-60`):**
  - **C-5 index `rentals_amenities`: KHÔNG thêm.** Đo `EXPLAIN (ANALYZE, BUFFERS)` trên 100.000 tin bench + 274.764 dòng tiện ích: planner không dùng index gộp `(value, parent_id)` lẫn `(parent_id, value)` (ca không lọc 326,5 → 339,3 / 329,8 ms — trong nhiễu; chi phí ở Sort external merge cho `count(DISTINCT)`; ca `province` 31 ms đã dùng `rentals_amenities_parent_idx`). Dưới ngưỡng "giảm ≥ 30%" → không migration; dữ liệu bench + index thử đã dọn (count = 0). Thêm test số đếm tiện ích `/en` chỉ tính tin `hasEnglish`.
  - **C-6 GIST `property_posts.location`: bỏ qua** — không có lọc bản đồ / bán kính trong code (grep `ST_DWithin|radius|bbox|ST_Within` = 0); YAGNI.
  - **C-7:** integration test `hookTimeout: 60_000` (`vitest.config.ts`) — `pnpm test` đủ bộ 2 lần không còn `Hook timed out` ở `beforeAll`.
  - **C-8:** backfill Tin BĐS (`src/lib/backfill/property-posts.ts`) bỏ `isOfferPost` riêng, dùng chung `hasPostOffer` (`post-kind.ts`). **Thay đổi hành vi có chủ ý:** tin có `offer.endAt` không parse được thành ngày (và không voucher) không còn bị bỏ qua khi backfill — trích như tin thường, khớp phân loại thẻ / chi tiết; có test.
  - **LCP:** đo bản `pnpm build` + `next start` local (Lighthouse 12.8.2 headless `--throttling-method=provided` + Browser pane `PerformanceObserver`), 6 trang vi (`/du-an`, `/du-an/<slug>`, `/cho-thue`, `/cho-thue/<slug>`, `/tin-bds`, `/tin-bds/<slug>`) ở 1440 và 390: **≤ 420 ms** (max `/du-an` 390); element LCP = ảnh hero `PageHero` / `DetailHeroMosaic` đã `priority` + `fetchpriority=high` (`ResponsiveImage.tsx:87-89`). Không follow-up code. Số đo local không throttle — production phụ thuộc mạng / CDN / kích thước ảnh upload (hero `/tin-bds` chỉ có bản 800 px — vấn đề nội dung CMS).
- **XOÁ:** không. Khối "Còn mở (backlog, không chặn)" của BL-052 đổi thành "đã xử lý ở BL-055".

## Ảnh hưởng
- Module: `src/lib/content/legacy-category.ts` (helper mới `legacyCategoryOnly`), `src/components/posts/PostListPage.tsx` + `src/components/rentals/RentalListPage.tsx` (`permanentRedirect` trước khi tải dữ liệu), `src/lib/projects/project-filters.ts` (`parsePriceRange`), chú thích `post-list-metadata.ts` / `rental-list-metadata.ts` (nhánh canonical chỉ còn cho URL kèm tham số), `src/lib/backfill/property-posts.ts` (`PropertyPostSource.offer` kiểu `PropertyPost["offer"]`), `vitest.config.ts`, `tests/integration/rental-search.test.ts`.
- Không đổi schema / API shape / quyền / i18n, **không migration**. Doc as-built: `docs/API_SPEC.md` §3.9 (`priceMax=0`), §3.10 / §3.11 (308 link cũ `?category=`). `docs/DESIGN.md:241,243` + `.context/design-spec.md:236` câu "link cũ lọc + canonical" vẫn đúng cho URL kèm tham số — không sửa.
- Đầu vào gửi `?category=`: ô tìm kiếm trang chủ `HeroSearch` (`src/components/home/HeroSearch.tsx:41`) gửi `/cho-thue?q=&category=&priceMin=…` — khi người dùng chỉ chọn "Loại căn hộ" (các ô khác rỗng) sẽ nhận 308 sang trang danh mục; chọn thêm điều kiện → 200 lọc như cũ.
- Test: `legacy-category.test.ts` (mới, 4 case), `PostListPage.test.tsx` / `RentalListPage.test.tsx` (308 vi/en, `&q=`, slug lạ, route danh mục, test link cũ thêm `page` / `province`), `project-filters.test.ts` (`priceMax=0`), `property-posts.test.ts` (+ ca `endAt` rác), `rental-search.test.ts` (ca EN). Curl dev server: 308 vi thật; `/en` chỉ unit test (DB local không có danh mục bản EN).
- Scope: `spec/test-scope/current.json` v66 (bản cũ v65 → `spec/test-scope/archive/test-scope-1.49.1-65.json`).

## Verify
- T01: `pnpm typecheck` PASS · eslint 10 file scope 0 lỗi (`pnpm lint` exit 1 chỉ do `.local-seed/…` git-ignored + warning `tools/task-dashboard/server.mjs` sẵn có) · `pnpm test` 419 file / 4.389 PASS · `pnpm build` PASS · curl dev server 308 / 200 như acceptance.
- T02: typecheck PASS · eslint 4 file scope 0 lỗi · `pnpm test` ×2: 419 file / 4.391 PASS (253 s, 238 s, không timeout) · build PASS · không migration.
- T03: `skip, no code change`; `pnpm build` PASS (tại `e0a61b3`) để đo.

## Residual
- Chưa kiểm 308 thật ở `/en` trên dev server (chỉ unit test).
- Redirect `/cho-thue` tra `findRentalCategory` thêm một lượt trước `loadFilterContext` (React `cache()` — không truy vấn lặp trong cùng request).
- `amenityCounts` ở 100k tin ~330 ms (trong NFR ≤ 500 ms) — bottleneck Sort external merge cho `count(DISTINCT)`; hướng sau: `count(*)` / `EXISTS` / `work_mem` (ngoài scope).
- LCP local không throttle; chưa đo cold start server, chưa đo `/en`.
