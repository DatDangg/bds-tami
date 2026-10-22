# Spec Update — 2026-10-22 news-list-detail-v2

**spec_version:** 1.52.0 → 1.53.0 (MINOR — đổi bố cục danh sách + chi tiết Tin tức theo ảnh v2, thêm 1 trường admin localized; user duyệt 2026-10-22, "tự quyết, đừng hỏi" 2026-10-23)
**Trigger:** feature-update (BL-062, change-request class MODIFY)
**Work item:** `feature/news-list-detail-v2` phase 1 · T01 NORMAL PASS (commit `83bb1ec`) · T02 STRICT PASS r2 (working tree, commit close-out sắp tới) · spec-validator phase 1 PASS
**Change doc:** `spec/changes/2026-10-22-news-list-detail-v2.md` · tasks `tasks/feature-news-list-detail-v2/phase-1-task-01.md`, `phase-1-task-02.md` · reviews `.context/review-reports/feature-news-list-detail-v2-phase-1-task-01-round-1-review.md`, `...task-02-round-1-review.md`, `...task-02-round-2-review.md` · `.context/review-reports/spec-validation-feature-news-list-detail-v2-phase-1.md` (+ `-pre-build.md`)

## Lý do và quyết định thay thế
Ảnh chuẩn `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc-v2.webp` **thay** `chi-tiet-tin-tuc.webp` (BL-054) cho màn chi tiết tin; user đổi tên khối "Đọc nhiều" ("trông thô quá") và đưa đăng ký bản tin lên trên. Các câu BL-054 tương ứng trong `SPECIFICATIONS.md` (danh sách mục (3)(5), "Đọc nhiều", "Chi tiết tin tức", nhãn tác giả) được chú thích "thay bởi BL-062"; khối "Tin tức v2" là nguồn hiện hành.

## Requirements
- **SỬA — Danh sách `/tin-tuc` (+ danh mục, vi + en):** "Đọc nhiều" → "Được quan tâm nhiều" / "Most popular" (nguồn top 5 lượt xem không đổi); cột phải ≥ lg: "Bản tin thị trường" → "Được quan tâm nhiều" → "Chủ đề" (< lg cùng thứ tự dưới lưới); nhãn thương hiệu thẻ nổi bật lớn "TAMI HOMES" → "TAMI REAL ESTATE".
- **SỬA — Nhãn tác giả bài tin:** "Bài viết bởi TAMI REAL ESTATE" / "By TAMI REAL ESTATE" (i18n cố định, avatar logo), vẫn không đọc / hiện `staff`.
- **SỬA — Chi tiết `/tin-tuc/[slug]` (D1–D10):** hero ảnh bìa full width (≈ 420–460px tối thiểu, scrim ấm, chữ trắng AA ≥ 5:1, không ảnh bìa → nền tối thương hiệu); ảnh bìa chỉ ở hero; đoạn mở đầu bỏ khung (cỡ lead); cột trái dính ≥ lg = Mục lục (số tròn 01/02 chỉ `h2`, mục đang đọc vạch vàng, dài thì cuộn trong) + thẻ "Tư vấn miễn phí" dính tới trước "Bài viết liên quan" (`DetailAsideFit as="div"` + `DETAIL_ASIDE_STICKY_CLASS`, `--detail-aside-top`); < lg mục lục gập, thẻ tư vấn sau khung liên hệ; `h2` ≈ 22–24px, nội dung thụt thẳng chữ `h2` (≥ md, `news-prose` bỏ giới hạn 46rem); mọi `ul` cấp gốc ✓ vàng, `ol` giữ số; thẻ tag pill không `#`, ẩn ở `/en`; "Bài viết liên quan" thẻ ngang `NewsCard variant="related"`; nút chia sẻ hero Facebook · Zalo · sao chép · thêm.
- **THÊM — Khung liên hệ cuối bài** (mọi bài, `role="note"`): chữ lấy từ `site-settings.newsDetail.contactNote` (localized, ≤ 500 ký tự, đọc không fallback sang VI — BR-07; rỗng / lỗi đọc → câu mặc định i18n; render văn bản thuần); "TAMI REAL ESTATE" trong chữ là link `/lien-he#lead-form`.
- **THÊM — Schema:** trường `newsDetail.contactNote` (tab "Tin tức" trong `site-settings`) + thuộc `TRANSLATABLE_FIELDS` (EN do AI dịch; "TAMI REAL ESTATE" thêm vào danh sách giữ nguyên của prompt dịch).
- **SỬA — Breadcrumb `variant="overlay"`** > 3 mục < md: chỉ hiện "← mục cha" (sửa bug `inline-flex` đè `hidden`).
- **XOÁ:** `NewsArticleCover`, `NewsArticleHeader`; khung nền đoạn mở đầu; ảnh bìa trong thân bài.

## Ảnh hưởng
- Module (T01): `src/components/news/{NewsListPage,NewsListBody,NewsMostRead,NewsFeaturedBlock}.tsx` (+ test), `src/i18n/messages/{vi,en}.json`.
- Module (T02): `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `src/app/(frontend)/globals.css` (`news-prose`), `src/components/news/{NewsArticle,NewsArticleSidebar,NewsToc,NewsCard,ShareButtons}.tsx`, mới `NewsArticleHero.tsx` + `NewsArticleContactNote.tsx`, `src/components/layout/Breadcrumb.tsx`, `src/globals/SiteSettings.ts` + `src/globals/site-settings/news-detail.ts`, `src/lib/content/load-news-contact-note.ts`, `src/lib/translation/{leaves,prompt}.ts`, `src/payload-types.ts`, `src/i18n/messages/*`.
- **Migration:** `migrations/20261022_172224_news_detail_contact_note.ts` (+ `.json`, `migrations/index.ts`) — up `ALTER TABLE "site_settings_locales" ADD COLUMN "news_detail_contact_note" varchar;`, down DROP COLUMN. SAFE_ADDITIVE, không HIGH_RISK; đã chạy trên DB local; staging chạy khi deploy.
- Không đổi API / quyền / URL / metadata / canonical / JSON-LD `Article` / beacon lượt xem / ISR.
- Doc as-built: `.context/design-spec.md` (S10 / S11), `docs/DESIGN.md`, `docs/ERD.md`.
- Scope: `spec/test-scope/current.json` v69 (bản cũ v68 → `spec/test-scope/archive/test-scope-1.52.0-68.json`).

## Verify
- T01: typecheck PASS · eslint scope PASS · `pnpm test` 4.406 PASS · `pnpm build` PASS. T02: typecheck PASS · eslint scope PASS · vitest news + translation 187/187 · `pnpm test` đủ bộ 4.410 PASS, 5 file integration (leads-public, rentals-reindex-job-migration, jobs-email, news-views, rental-search) FAIL khi chạy cả bộ do tải / DB-Redis dùng chung nhưng PASS 83/83 khi chạy riêng · `pnpm build` PASS (builder). Reviewer r2 tự chạy typecheck + eslint + `pnpm test`, không chạy build (chung `.next` với dev server).
- Browser (DB local) ảnh `.context/review-reports/assets/bl062-p1t02-*`: hero 1440 / 1024 / 768 / 390, cột dính, thụt nội dung, `scrollWidth === clientWidth`.

## Residual (đẩy sang test / staging)
- `/en/news/[slug]` chưa xem bằng mắt (DB local không có bài EN) — chỉ test (khung mặc định EN, "Published:", ẩn Thẻ).
- Hero không ảnh bìa (nền tối) chỉ phủ bằng test.
- Luồng lưu `contactNote` ở admin (`/admin/globals/site-settings`, tab "Tin tức") chưa kiểm bằng trình duyệt; chưa kiểm lưu vi → trang + EN tự dịch (mô hình có thể đổi "TAMI REAL ESTATE" → mất link, không crash; admin sửa tay được).
- Contrast hero tính theo cận lý thuyết (5,07:1), chưa lấy mẫu pixel từng bài; focus bàn phím chỉ kiểm class.
- Hệ quả đã chấp nhận: thứ tự nút chia sẻ khác ảnh (sao chép nằm sau Zalo).
