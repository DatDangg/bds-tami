# Spec Update — 2026-10-20 news-detail-card-toc (chi tiết tin tức: nền màu + thẻ trắng + mục lục dính cột trái)

**spec_version:** 1.27.0 → 1.28.0 (MINOR — đổi yêu cầu trình bày trang chi tiết tin tức + thêm mục lục tự sinh; không đổi schema, API, quyền, dữ liệu CMS, URL, metadata, canonical, JSON-LD)

**BRD:** không đổi (FR-PUB-08 vẫn đúng).

**Trigger:** feature-update (Change Request **BL-033**, MODIFY UI — backlog ghi ADDITIVE, chỉnh MODIFY vì đổi bố cục trang S11 đã có). Change doc `spec/changes/2026-10-20-news-detail-card-toc.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-news-detail-card-toc/phase-1-task-01.md`. Spec validation: `.context/review-reports/feature-news-detail-card-toc-spec-validation.md`. Review: `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-<R>-review.md` `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-2-review.md` (r1 `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-1-review.md`).

**Quyết định (change-request tự chốt, user "tự quyết đừng hỏi"):** D1 trang tin tức dùng `DetailLayout` (nền `bg-primary-subtle`, `data-detail-page` → header ẩn khi cuộn; không `subNav`, không `aside` phải; `before` = breadcrumb; `after` = Tin liên quan `bg-bg-alt`). D2 `DetailLayout` thêm prop tuỳ chọn `leading` (cột trái ≥ lg `[15rem][1fr]`, xl `[16rem][1fr]`, bọc `hidden lg:block print:hidden`); không `leading` → class lưới y hệt cũ. D3 thẻ trắng: danh mục · h1 `font-display text-h2` · ngày + phút đọc · ảnh bìa 16:9 bo 20px · mục lục gập < lg · RichText `max-w-[68ch]` · tags · `ShareButtons`. D4 `collectTocHeadings(data, reservedIds)` + `isTocHeading` trong `section-headings.ts` (h1/h2 Lexical → cấp 2, h3–h6 → cấp 3; id = slug bỏ dấu ≤ 60 ký tự, trùng → `-2`, `-3`…, rỗng → `muc-N`; trang giữ chỗ `related-news`); `RichText` prop `headingIds` (gắn id + `tabIndex=-1` + `scroll-mt-[calc(var(--sticky-top)+1rem)]`), `anchorSections` (pháp lý `muc-N`) không đổi. D5/D6 `src/components/news/NewsToc.tsx` (mới): `NewsTocSidebar` ≥ lg (dính `top: var(--sticky-top)`, cao tối đa viewport, cuộn riêng; scroll-spy rAF: heading cuối đã qua vạch 48px là active, trên heading đầu → không active; khoá 1s sau click; mục active tự cuộn trong khung) + `NewsTocDisclosure` < lg (`<details>` đóng mặc định, bấm mục → gập + cuộn, không highlight). KHÔNG tách hook từ `DetailSubNav` (quy tắc active khác) — `DetailSubNav` không sửa. D7 không heading → không mục lục, không `leading`, thẻ chiếm toàn khung. D8 metadata / loader / JSON-LD / URL giữ nguyên. Khoá i18n mới `page.news.tocTitle` ("Mục lục" / "Contents").

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, chi tiết tin tức + `RichText` / `DetailLayout` / `section-headings` dùng chung) | close-out BL-033 (commit chứa file này) | `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `src/components/detail/DetailLayout.tsx`, `src/components/content/RichText.tsx`, `src/lib/content/section-headings.ts`, `src/components/news/NewsToc.tsx` (mới), `src/i18n/messages/{vi,en}.json`. Test `DetailLayout.test.tsx`, `RichText.test.tsx`, `section-headings.test.ts`, `NewsToc.test.tsx` (mới). Doc: `SPECIFICATIONS.md` F5, `.context/design-spec.md` header table §2.1 + S11 | NORMAL PASS r1 (3 MINOR) → FAST PASS r2 — `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-2-review.md` |

## Requirements (SPECIFICATIONS.md)

- **F5 Tin tức — chi tiết `/tin-tuc/[slug]` (SỬA):** khung chi tiết chung (nền `--color-primary-subtle`, header ẩn khi cuộn như chi tiết dự án / cho thuê / tin đăng; không thanh mục con viên thuốc): breadcrumb → một thẻ trắng bo 28px (danh mục, h1, ngày + thời gian đọc, ảnh bìa bo 20px, nội dung, tags, chia sẻ) → Bài liên quan ngoài thẻ.
- **F5 — mục lục (THÊM):** tự sinh từ `h2`/`h3` cấp gốc; id ổn định = slug tiếng Việt bỏ dấu (trùng `-2`, `-3`…, rỗng `muc-N`), không đổi dữ liệu CMS. ≥ lg cột trái dính, mục đang đọc `aria-current`, bấm cuộn có bù `scroll-margin`, danh sách dài cuộn riêng trong khung giới hạn viewport; < lg khối gập "Mục lục / Contents" đóng mặc định đầu thẻ trước nội dung; không heading → không mục lục, không chừa cột trống.
- **Overview — Giao diện / design-spec §2.1 header table (SỬA):** nhóm trang chi tiết dùng `DetailLayout` (header ẩn khi cuộn) nay gồm cả chi tiết tin tức.
- Design as-built: `.context/design-spec.md` S11 blockquote "As-built BL-033" + dòng Responsive S11.

## Schema / Migration / API

Không. Migration: none. URL, `generateMetadata`, canonical, JSON-LD `Article` + breadcrumb không đổi. Dữ liệu Lexical trong CMS không đổi (id heading sinh lúc render).

## Hành vi bị thay thế

| Trước | Sau (BL-033) |
|---|---|
| Chi tiết tin tức: nền trắng, header `max-w-text`, ảnh bìa `max-w-5xl`, RichText trực tiếp trên nền | Khung chi tiết chung: nền primary-subtle, mọi phần bài viết trong một thẻ trắng bo 28px |
| Header trang chi tiết tin tức: thanh nổi khi cuộn | Ẩn khi cuộn xuống (ngoại lệ chi tiết, như BL-027 / BL-032) |
| h1 `text-h1` | h1 `font-display text-h2 text-balance` (đồng bộ tin đăng) |
| Không có mục lục; heading không có `id` | Mục lục tự sinh (≥ lg cột trái dính + highlight; < lg khối gập); heading có id slug ổn định |

## Số đo / verify

- Builder: `pnpm test` full 296 file / 3114 test PASS (gồm `NewsToc.test` mới, section-headings, RichText, DetailLayout; `DetailSubNav` cũ PASS không đổi); typecheck PASS; lint 0 error (2 warning cũ ngoài scope).
- Chưa đo trên trình duyệt thật 375 / 768 / 1280 (cần DB/CMS có bài).

## Ảnh hưởng test

- Direct: `/tin-tuc/[slug]` + `/en/news/[slug]` (nền, thẻ trắng, header ẩn khi cuộn, mục lục ≥ lg dính + highlight + click cuộn, mục lục gập < lg, bài không heading, Tin liên quan).
- Dependents: mọi trang dùng `RichText` (dự án, dịch vụ, tin đăng, tuyển dụng, pháp lý) — output không đổi khi không truyền `headingIds`; trang pháp lý S16 giữ id `muc-N` + mục lục pháp lý; `DetailLayout` (chi tiết dự án / cho thuê / tin đăng) không `leading` → DOM/class không đổi.
- Regression: header ẩn khi cuộn trên các trang chi tiết; mục lục pháp lý; SEO/JSON-LD `Article` tin tức; một h1.
- Residual: chưa đo trực quan 375 / 768 / 1280; mục lục bản gập không highlight mục đang đọc (chủ ý).
