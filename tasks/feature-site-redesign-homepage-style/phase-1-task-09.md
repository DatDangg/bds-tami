# feature-site-redesign-homepage-style · phase-1-task-09 — Fix gap phase review: bài nổi bật trang danh mục Tin tức/Tin BĐS + lưới 4 cột ≥ xl (BL-045)

- Nguồn: `.context/review-reports/spec-validation-feature-site-redesign-homepage-style-phase-1.md` GAP-1, GAP-2 (+ GAP-4 xem `/en`).
- Quyết định dispatcher (user dặn tự quyết 2026-10-21): sửa code theo spec/mockup đã duyệt, không đổi spec.
- Phụ thuộc: T00–T08 (đã commit). Trạng thái: `pending`.

## Classification / Risk
- Type: **BUG** (lệch spec). Risk: **MEDIUM** — query danh sách tin công khai. Expected review: **STRICT**.

## Scope
1. GAP-1: `src/lib/news/news-listing.ts` — trang 1 danh mục Tin tức có bài nổi bật (isFeatured mới nhất trong danh mục, fallback bài mới nhất danh mục), loại khỏi lưới mọi trang của danh mục (không trùng/mất bài). `/tin-bds` danh mục (`src/lib/posts/post-listing.ts`) theo cùng quy tắc như `/tin-bds` gốc (isFeatured còn hiệu lực trong danh mục).
2. GAP-2: `NewsListBody.tsx` / `PostListBody.tsx` lưới 4 cột ≥ xl (spec `:21`, mockup `.grid` auto-fill 260px).
3. GAP-4: xem thật các trang `/en` chính (danh sách dự án, cho thuê, tin tức, tuyển dụng, liên hệ, chi tiết dự án) — không vỡ, chữ EN.

## Acceptance
- [ ] Test: trang 1 danh mục có featured; trang 2 danh mục không trùng/mất bài; lưới `xl:grid-cols-4`.
- [ ] typecheck / lint / vitest src / integration news PASS; ảnh 1440 news + danh mục.

## Verification summary (builder điền)

- Code: `news-listing.ts` bỏ nhánh riêng danh mục, dùng chung 2 truy vấn limit 1 (isFeatured → bù bài mới nhất) có `categoryIds`; bài nổi bật loại khỏi lưới mọi trang. `post-queries.ts#findFeaturedPost` nhận `categoryIds?`, `post-listing.ts` gọi cho cả trang danh mục (chỉ isFeatured còn hạn, không bù). `NewsListBody`/`PostListBody`: `xl:grid-cols-4` + `data-grid-max-cols="4"`.
- Test: unit news/posts cập nhật (danh mục có `data-news-featured` n2, lưới 4 cột); integration `news.test.ts` (trang 1 danh mục có featured, trang 2 không trùng/mất 14 bài, isFeatured của danh mục con thắng), `property-posts.test.ts` (`findFeaturedPost` theo danh mục, danh mục khác → null).
- Verify: typecheck PASS; lint 0 error (2 warning cũ); `vitest run src` 253 file/2496 test PASS; integration news + property-posts 53/53 PASS.
- Ảnh 1440: `assets/site-redesign-t09-{news,news-category,posts,posts-category}-1440.png` + `site-redesign-t09-en-{projects,rentals,news,careers,contact,project-detail}-1440.png`.
- GAP-4 `/en`: xem 6 trang, hero/breadcrumb/chữ EN đúng, không vỡ; `/en/news` rỗng do DB dev không có bài có bản EN (empty state đúng). Chưa chạy `pnpm build` (không thuộc task này).
