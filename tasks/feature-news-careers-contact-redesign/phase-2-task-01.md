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
10. Test: queries (q / tag / sort / top tags, EN), view (nổi bật không trùng, phân trang), metadata (noindex / canonical), component (rỗng ẩn, a11y); chụp trình duyệt 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t01-*`.

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

## Verification summary (Builder)

## Review

## Doc impact
