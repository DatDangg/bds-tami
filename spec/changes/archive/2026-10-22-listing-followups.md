---
id: listing-followups
type: feature
status: done
completed: 2026-10-22
created: 2026-10-22
---

# Việc còn mở sau BL-052 (danh sách / chi tiết Dự án, Cho thuê, Tin BĐS) (BL-055)

## Nguồn
Phase review cuối BL-052 (`.context/review-reports/feature-listing-detail-redesign-phase-3-phase-review.md` mục (c)) + review P2-T04 / P3-T01 / P3-T06. Không chặn BL-052; gom để xử lý sau.

## Danh sách
- **C-1** Link cũ `?category=<slug>` ở `/tin-bds` và `/cho-thue`: chuyển hướng 308 sang `/…/danh-muc/<slug>` khi URL chỉ có `category` (hiện `/tin-bds` trả noindex + canonical sang trang danh mục — tín hiệu trái nhau; `/cho-thue` index).
- **C-4** `/du-an`: `priceMax=0` / `areaMax=0` gõ tay coi như không giới hạn (đồng bộ `/tin-bds`).
- **C-5** Index `rentals_amenities.value` nếu dữ liệu lớn (đo `EXPLAIN` trước) + ca `locale=en` cho số đếm tiện ích `/cho-thue`.
- **C-6** GIST index `property_posts.location` — chỉ khi có lọc theo bản đồ / bán kính.
- **C-7** Integration test hay timeout ở `beforeAll` khi chạy cả bộ (`media-upload`, `session-refresh`, `jobs-email`, `access`…) → tăng `hookTimeout` hoặc giảm tải setup.
- **C-8** Backfill: `isOfferPost` trùng logic `hasPostOffer` / `isVoucherPost` (`src/lib/posts/post-kind.ts`) → dùng chung.
- Đo LCP thật (bản build) cho 6 trang danh sách / chi tiết.

## Phân loại dự kiến
MODIFY + BUG nhỏ; C-1 đụng SEO (STRICT); C-5/C-6 cần migration (additive).

## Kết quả (change-request, 2026-10-22 — auto proceed)
- **C-1** ✅ T01 `33bdce6` (STRICT PASS r1): `/tin-bds?category=<slug>` · `/cho-thue?category=<slug>` (vi + en) → **308** sang `/…/danh-muc/<slug>` khi URL chỉ có `category` (khoá khác rỗng không tính) và slug có thật ở locale; kèm tham số khác / slug lạ → giữ lọc + tab + canonical như cũ. Helper `src/lib/content/legacy-category.ts`.
- **C-4** ✅ T01: `/du-an` `priceMax=0` = không giới hạn trên (`/du-an` không có `areaMax`).
- **C-5** ⛔ index **không thêm** — T02 `e0a61b3` đo EXPLAIN (ANALYZE, BUFFERS) 100k tin bench + 275k dòng `rentals_amenities`: không lọc 326 ms → 339 / 330 ms với index gộp `(value, parent_id)` / `(parent_id, value)` (planner không dùng; chi phí ở Sort external merge cho `count(DISTINCT)`); ca `province` 31 ms. Dưới ngưỡng "đáng" (giảm ≥ 30 %). ✅ test số đếm tiện ích `locale=en` đã thêm. Bench đã dọn (BENCH 0, amenities 122, 3 index gốc).
- **C-6** ⛔ bỏ qua — code chưa có lọc theo bản đồ / bán kính (grep `ST_DWithin|radius|bbox|ST_Within` trong `src/` = 0).
- **C-7** ✅ T02: `vitest.config.ts` project integration `hookTimeout: 60_000`; `pnpm test` ×2 419 file / 4391 test không timeout.
- **C-8** ✅ T02: backfill Tin BĐS dùng `hasPostOffer` (`src/lib/posts/post-kind.ts`); khác biệt có chủ ý: tin có `offer.endAt` không parse được (không voucher) không còn bị bỏ qua, có test.
- **LCP** ✅ T03 `0cb9434` (FAST PASS r1): bản `pnpm build` + `next start -p 3100`, Lighthouse 12.8.2 + Browser pane, 6 trang × 1440/390 ≤ 420 ms; element LCP là ảnh hero đã `priority`. Residual: local không throttle, chưa cold start, chưa `/en`.
- Spec **1.50.0** (MINOR) · test-scope **v66** · spec-validation phase 1 PASS `.context/review-reports/spec-validation-feature-listing-followups-phase-1.md`. Không migration.
- Follow-up (không chặn): kiểm 308 thật ở `/en` trên staging có danh mục EN; hợp nhất `legacyCategorySlug` với `firstText`; `amenityCounts` ~330 ms ở 100k tin (Sort cho `count(DISTINCT)`); ảnh hero `/tin-bds` chỉ 800 px (nội dung CMS).
