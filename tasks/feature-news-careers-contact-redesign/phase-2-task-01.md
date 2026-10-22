# feature-news-careers-contact-redesign · phase-2-task-01 — Danh sách Tin tức `/tin-tuc` (+ danh mục) theo design

- Nguồn: BL-054; design `docs/specs/listing-detail-redesign/tin-tuc.webp`. Spec 1.47.0 khối BL-054 mục "Danh sách Tin tức".
- Plan: phase 2 wave A (song song P2-T03, P2-T05).
- Phụ thuộc: P1-T03 (`loadMostReadNews`), P1-T04 (`NewsletterSignup`).

## Classification / Risk
- Type: **MODIFY** (bố cục + tham số URL mới `q` / `tag` / `sort`). Risk: **HIGH** — trang công khai ISR, SEO (canonical / noindex), tham số mới, thẻ tin dùng chung (NewsCard dùng ở trang chủ / chi tiết). Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/tin-tuc/page.tsx`, `src/app/(frontend)/[locale]/tin-tuc/danh-muc/*`, `src/components/news/NewsListPage.tsx`, `src/components/news/NewsListBody.tsx`, `src/components/news/NewsCard.tsx` (thêm biến thể; biến thể trang chủ / nền tối giữ nguyên), `src/components/news/*` mới (`NewsFeaturedBlock`, `NewsMostRead`, `NewsTopics`, `NewsSortControl`), `src/lib/news/news-listing.ts`, `src/lib/news/news-queries.ts` (q / tag / sort / top tags), `src/lib/news/news-view.ts`, metadata / canonical, i18n namespace `page.news.v2`, `docs/API_SPEC.md` (tham số), `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Tin tức), `docs/DESIGN.md`, `docs/API_SPEC.md` (tham số route).

## Files to Create/Modify
- `src/app/(frontend)/[locale]/tin-tuc/page.tsx`
- `src/app/(frontend)/[locale]/tin-tuc/danh-muc/`
- `src/components/news/NewsListPage.tsx`
- `src/components/news/NewsListBody.tsx`
- `src/components/news/NewsCard.tsx`
- `src/components/news/NewsFeaturedBlock.tsx`
- `src/components/news/NewsMostRead.tsx`
- `src/components/news/NewsTopics.tsx`
- `src/lib/news/news-listing.ts`
- `src/lib/news/news-queries.ts`

## Scope (theo spec — xem ảnh design)
1. Hero danh sách (`ListingHero` BL-052, dữ liệu `pageHeroes.news` + ảnh banner sẵn có): eyebrow, `h1` (phần sau màu nhấn), mô tả, ô tìm `q` + nút "Tìm" (form GET, giữ `tag`/`sort` bằng hidden khi cần). Không hàng "Tìm nhanh" (không có dữ liệu cho tin tức) — ẩn.
2. Chip danh mục: "Tất cả" + danh mục tin cấp 1 (link, `aria-current`), trang danh mục đánh dấu đúng chip.
3. Khối nổi bật (trang 1, không q/tag, không sort khác mặc định): 1 bài lớn (ảnh nền + scrim token, badge danh mục, tiêu đề, tóm tắt, nhãn thương hiệu i18n "TAMI HOMES" (không đọc / hiện tên `staff` — spec-validation F3) · ngày · "N phút đọc", nút mũi tên tròn — cả thẻ là link, ảnh `priority` LCP) + cột phải 3 bài nhỏ (ảnh, danh mục, tiêu đề, ngày, nút mũi tên). Bài: `isFeatured` mới nhất trước rồi mới nhất; 4 bài này không lặp trong lưới trang 1; chuỗi phân trang không mất bài (giữ quy tắc offset hiện có).
4. "Bài viết mới nhất" + ô sắp xếp (`sort=newest` mặc định / `oldest`; dùng control sắp xếp BL-052) → lưới thẻ 3 cột ≥ lg (thẻ mới: ảnh, badge danh mục, ngày, tiêu đề 2 dòng, tóm tắt 3 dòng, "N phút đọc", nút mũi tên) → phân trang số.
5. Cột phải ≥ lg (dưới lưới khi < lg): `NewsMostRead` ("Đọc nhiều", top 5 từ `loadMostReadNews`, số 01–05 lớn màu nhấn + ảnh nhỏ + tiêu đề + ngày; rỗng → ẩn), `NewsletterSignup` (P1-T04), `NewsTopics` ("Chủ đề": ≤ 12 tag dùng nhiều nhất trong bài published cùng ngôn ngữ, chip `#tag` link `?tag=`; rỗng → ẩn; **`/en` ẩn khối và bỏ qua `?tag=`** — tags chưa localized, spec-validation F2).
6. Tham số mới: `q` (tiêu đề + tóm tắt, không dấu — tái dùng cơ chế tìm kiếm sẵn có `src/lib/search`; **không thêm cột / migration**), `tag` (khớp đúng 1 thẻ), `sort`. Có `q` / `tag` / `sort ≠ newest` → `noindex,follow` + canonical về URL sạch; ẩn khối nổi bật, hiện "N bài viết" (ResultsBar) + trạng thái trống có nút về `/tin-tuc`. Giá trị lạ bị bỏ qua. `page` / canonical trang thường không đổi.
7. Giữ form "Tư vấn nhu cầu" cuối mọi trang `/tin-tuc` (không ở trang danh mục — như hiện tại) → banner tư vấn.
8. Responsive: 375 / 768 / 1280 / 1440 không tràn; < lg cột phải xuống dưới lưới.
9. NewsCard: biến thể trang chủ / nền tối / thẻ liên quan hiện có giữ hoạt động (P2-T02 dùng lại thẻ lưới mới cho "Bài viết liên quan").
10. (P1-T03 review) `loadMostReadNews` ném lỗi khi DB lỗi → trang bọc lỗi (ẩn khối, không vỡ trang); sửa `src/lib/news/most-read.ts` MINOR-1: lấy dư id xếp hạng + lọc thẻ null **trước** khi bù để đủ 5 bài.
11. Test: queries (q / tag / sort / top tags, EN), view (nổi bật không trùng, phân trang), metadata (noindex / canonical), component (rỗng ẩn, a11y); chụp trình duyệt 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t01-*`.

## Acceptance
- [ ] Bố cục khớp `tin-tuc.webp` ở 1440; mobile hợp lý.
- [ ] Tìm / lọc tag / sắp xếp chạy không JS; noindex + canonical đúng; EN như VI.
- [ ] Đọc nhiều / Bản tin / Chủ đề hiển thị, rỗng ẩn gọn.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
- **Tìm `q` không dấu**: không có cột `search_text` cho tin và DB chưa có extension `unaccent` → SQL lọc sơ bộ id (`findFilteredNewsIds`, `src/lib/news/news-search.ts`) bằng `searchTerms` + `escapeLike` sẵn có (export thêm `escapeLike` từ `rental-search-sql.ts`) trên `lower(translate(title || ' ' || excerpt, <bảng chữ Việt>, <không dấu>))` (`src/lib/search/unaccent-sql.ts`, bảng sinh từ `normalizeSearchText`, có test đối chiếu). Không cột / migration. Id (≤ 1000) đưa vào `listPublicNews({ ids })` nên `publicWhere` / sắp xếp / phân trang vẫn qua `findPublicList`. Chọn SQL thay vì quét bộ nhớ kiểu `/du-an` vì số bài tin sẽ lớn hơn nhiều.
- **`tag`** lọc cùng câu SQL đó (`EXISTS news_texts path='tags' AND btrim(text) = tag`), không dùng toán tử hasMany của Payload (tránh hành vi không chắc). `/en` bỏ qua `tag` ngay ở `parseNewsFilters`.
- **Lọc** = `q` / `tag` / `sort=oldest` (giá trị lạ bị bỏ trước khi tính): ẩn khối nổi bật VÀ không loại 4 bài nổi bật khỏi lưới (không có khối thì không có gì để trùng). Không lọc: giữ quy tắc offset cũ (loại 4 bài ở mọi trang).
- **Chọn 4 bài nổi bật**: 2 truy vấn limit 4 song song (`isFeatured` + mới nhất), gộp không trùng → luôn đủ 4 khi có ≥ 4 bài. Số truy vấn danh sách cố định = 3 (như trước).
- **Chip danh mục**: giữ `buildNewsChips` + `CategoryChipList` (viên thuốc, đang chọn nền tối) thay vì `ListingCategoryTabs` (tab icon + số đếm không khớp design pill). Lệch design: chip đang chọn nền `dark` thay vì vàng (giữ kiểu chip sẵn có, không thêm kiểu mới). Danh mục có con giữ hàng "Tất cả + con" như BL-045.
- **Breadcrumb** kính vẫn trên hero (design không vẽ) cho đồng bộ các trang danh sách BL-052 + SEO.
- **Biến thể `NewsCard`**: bỏ `feature` (chỉ `NewsListBody` cũ dùng), thêm `grid` (thẻ lưới mới; P2-T02 dùng cho "Bài viết liên quan": `<NewsCard data variant="grid" headingLevel="h3" />`). Export thêm `NewsCategoryBadge`, `NewsReadTime`. `card` / `row` / `onDark` không đổi. `NewsCardData.readMinutes?` (từ `content`, `estimateReadMinutes`).
- **Badge danh mục**: `primary-soft` + chữ `badge-foreground` (9.7:1) — `accent-text` trên `primary-soft` chỉ 3.5:1. Trên ảnh: `primary` + `badge-foreground`.
- **Ô sắp xếp chạy không JS**: `OptionSelect progressive` trong `next/form` GET (input ẩn `q`/`tag`) + nút "Áp dụng" trong `<noscript>`; có JS điều hướng ngay qua `useListingFilterNav`.
- **Chủ đề**: link luôn về `/tin-tuc?tag=` (cả từ trang danh mục). Chip viền token (không dùng `buttonVariants chip` vì kiểu đó chỉ cho nền tối).
- **Lỗi DB khối phụ** (Đọc nhiều, Chủ đề): `orEmpty` bắt lỗi → ẩn khối + `payload.logger.error`. **MINOR-1** `most-read.ts`: xếp hạng / bù lấy dư ×2, lọc thẻ `null` trước khi bù.
- Lưới 3 cột từ `lg` theo spec (cột phụ `18rem` ở lg, `21rem` ở xl) — ở 1024px thẻ ~200px, hẹp nhưng không tràn.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm build` PASS.
- Unit/UI (tuần tự, không full suite vì Postgres dùng chung): `src/components/{news,ui,home,listing,templates,layout,posts}`, `src/lib/{news,search,home}`, `src/i18n`, `src/app/(frontend)` → 80 file / 780 test PASS. Mới: `news-filters.test.ts`, `unaccent-sql.test.ts`; viết lại `NewsListPage.test.tsx` (25 test: nổi bật 4 bài không trùng, phân trang đủ bài, q/tag/sort, EN bỏ tag + ẩn Chủ đề, lỗi DB ẩn khối, 404, metadata noindex/canonical), `news-components.test.tsx` (grid, khối nổi bật, Đọc nhiều, Chủ đề, NewsListBody).
- Integration (DB `tami_wt54_p2t01`): `tests/integration/news.test.ts` 32/32 PASS (thêm test q không dấu / AND / `%` / chuỗi SQL, tag khớp đúng + btrim, sort oldest, EN, top tags, nháp không tính; cập nhật test khối nổi bật 4 bài), `tests/integration/news-views.test.ts` PASS (thêm test MINOR-1).
- Trình duyệt (dev :3121, đã tắt; ảnh chụp CDP Edge headless, đo `scrollWidth == clientWidth` mọi ảnh — không tràn ngang; 375 kiểm thêm bằng pane: chỉ hàng chip cuộn ngang nội bộ): `.context/review-reports/assets/bl054-p2t01-{vi,en,q,category}-{1440,390}.png`, `bl054-p2t01-q-empty-1440.png`, `bl054-p2t01-vi-768.png`. `?q=crown hoang son` ra 10 bài (không dấu), `?tag=dự án` 15 bài. Để chụp EN, DB worktree được thêm bản EN giả ("EN: …") cho 7 bài.

## Review

## Doc impact
- `.context/design-spec.md` S10: khối as-built BL-054 P2-T01 (bố cục, token, trạng thái lọc).
- `docs/DESIGN.md` bảng màn: dòng Tin tức as-built BL-054.
- `docs/API_SPEC.md`: §3.14 mới (tham số `q`/`tag`/`sort`/`page` của `/tin-tuc`); §3.12 ghi chú loader "Đọc nhiều" (lấy dư, lọc null, trang bắt lỗi).
- Không đổi schema / migration (no ERD impact).
