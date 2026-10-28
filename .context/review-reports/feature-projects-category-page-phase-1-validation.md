Agent: spec-validator

# Phase review — feature-projects-category-page (BL-090, MODIFY) — phase 1 — round 1

- Mode: **Phase review** (sau review STRICT r1 PASS + Fix MINOR-1..3 trên đĩa)
- Task: `tasks/feature-projects-category-page/phase-1-task-01.md` (task duy nhất của phase)
- Nguồn đối chiếu: change doc `spec/changes/2026-10-27-projects-category-breadcrumb-title.md` · SPECIFICATIONS.md 1.60.0 (`:51` dòng `/du-an`, `:60` khối BL-090, `:214` BL-058 admin SEO) · `.context/design-spec.md` S05 (`:457`, `:467`) · `spec/updates/2026-10-28-projects-category-page.md` · `spec/test-scope/current.json` v91 · pre-plan `.context/review-reports/feature-projects-category-page-spec-validation.md` · review `.context/review-reports/feature-projects-category-page-phase-1-task-01-round-1-review.md`
- Code: working tree chưa commit (`git status --short` / `git diff`), chỉ các file thuộc task; bỏ qua dirty BL-076..078.

## Verdict: ✅ PASS (COMPLETE về build) — còn việc close-out bắt buộc ở mục 4

Đủ 8/8 acceptance change doc và mọi mệnh đề của khối spec 1.60.0 có code + test. Không MISSING. Một mục [PARTIAL] là doc as-built (A8) — đúng luật, change-request làm ở close-out, không phải gap build. C-1 (pre-plan) đã sửa trong delta.

## 1. Ma trận coverage

| # | Requirement | Spec | Code | Test | Status | Note |
|---|---|---|---|---|---|---|
| A1 | Route `/du-an/danh-muc/[category]` · `/en/projects/category/[category]`; danh mục khoá gồm con | SPEC:60; DS:457,467 | `du-an/danh-muc/[category]/page.tsx` (force-dynamic, truyền `categorySlug`); `routing.ts` pathnames; `project-list-data.ts` `loadCategoryContext` (cấp 1 gồm con, cấp 2 → tab cha) | `page.test.tsx`; `routing.test.ts`; `ProjectListPage.test.tsx:231` | ✅ | |
| A2 | `<title>` "<Danh mục> – Dự án \| TAMI" (EN "– Projects"); breadcrumb Trang chủ › Dự án › (cha) › danh mục; H1; mô tả; VI/EN | SPEC:60; DS:467 | `project-list-metadata.ts:70` title; `ProjectListPage.tsx` `ProjectListHero` (breadcrumb, h1 = `category.name`, eyebrow nav "Dự án", không `titleAccent`) | `ProjectListPage.test.tsx:246,261,299,408,431` (hậu tố site đúng 1 lần) | ✅ | MINOR-3 (cha không slug) đã sửa + test |
| A3 | Tab là link, `aria-current`, "Tất cả" → `/du-an`; lọc/sort/page/`q` giữ danh mục | SPEC:51,60; DS:467 | `tabHref` (bỏ `page`, giữ lọc + `sort`); `listPath` = trang danh mục cho form/hero search/Xoá lọc/sort/phân trang; `HIDDEN_PARAMS` bỏ `category` | `ProjectListPage.test.tsx:218,321` | ✅ | |
| A4 | `/du-an?category=<slug>` → 308 giữ tham số khác; slug lạ bỏ | SPEC:60 (ví dụ) | `project-list-data.ts` `queryWithoutCategory` + `permanentRedirect` trước `Promise.all` (MINOR-2) | `ProjectListPage.test.tsx:281` (utm_*, page, khoá lặp — MINOR-1), `:291` (không chạy query), `:312` (lạ/rỗng/EN thiếu bản dịch) | ✅ | Playwright: Location đúng VI/EN |
| A5 | 404: slug không có / scope khác / EN chưa dịch / vượt trang | SPEC:60 | `if (categorySlug && !context) notFound()`; `page > totalPages` | `ProjectListPage.test.tsx:240`; `resolve-missing-page.test.ts` | ✅ | |
| A6 | Sitemap VI/EN; canonical chính nó (+`?page=n`); hreflang khi có EN; lọc → noindex + canonical sạch; FAQ JSON-LD chỉ `/du-an` sạch | SPEC:60 | `sitemap-data.ts` `categories-projects`; `categoryMetadata` (`seo` ghi đè, `hasEnglish && slugs.en && !noindex`); `cleanPage = !categorySlug && …` | `sitemap-data.test.ts`; `ProjectListPage.test.tsx:177,408-450` | ✅ | FAQ JSON-LD chưa kiểm HTML thật (residual R-2) |
| A7 | Chặn slug dự án `danh-muc` (vi) / `category` (en) | SPEC:60 | `src/fields/slug.ts` `RESERVED_SLUGS` (theo collection + locale) | `slug.test.ts:87,94,99,106-107` | ✅ | Không đụng `Projects.ts` (BL-077) |
| A7b | Chuyển ngôn ngữ → bản kia / fallback `/du-an`; revalidate; admin SEO preview Dự án | SPEC:60, :214 (C-1 đã sửa) | `counterpart-url.ts` `LIST_FALLBACK`; `resolve-missing-page.ts` rule scope project; `revalidate-category.ts` `SCOPE_PAGES.project.category`; `admin/seo.ts` `CATEGORY_PAGE_ROUTES.project` | `counterpart-url.test.ts`, `revalidate-category.test.ts`, `seo.test.ts`, `SeoPreview.test.tsx` | ✅ | |
| — | Trống không lọc ở trang danh mục | DS:467 ("trống như S02 + link về `/du-an`") | `noProjectsInCategory` vi/en + `backHref` `/du-an` | `ProjectListPage.test.tsx:271` | ✅ | |
| C-4 | Không hàng chip con (theo mẫu Cho thuê) | DS:463 generic vs :467 | Không render chip con | (gián tiếp :231) | ✅ | Ghi as-built design-spec (mục 4) |
| C-5 | Meta description fallback mô tả `/du-an`; hero KHÔNG fallback mô tả chung | SPEC:60 chỉ nói hero | `project-list-metadata.ts:71`; `ProjectListHero` `description = category ? category.description : hero.description` | `ProjectListPage.test.tsx:246,408` | ✅ | Ghi API_SPEC as-built |
| A8 | Spec delta + spec-publish + DESIGN.md / API_SPEC | — | SPEC 1.60.0, DS S05, CHANGELOG:85, update, test-scope v91 ✅; `docs/**` chưa reconcile | — | ⚠️ [PARTIAL] | Close-out (mục 4); doc as-built |

Tổng: 11 ✅ · 1 ⚠️ (close-out, không chặn) · 0 ❌.

## 2. Spec ↔ hành vi đã build
- SPECIFICATIONS:60 và design-spec:467 khớp code ở mọi điểm kiểm (route, title, breadcrumb, eyebrow, ảnh hero `/du-an`, tab link + về trang 1, 308 giữ tham số, 404, SEO, sitemap, slug dành riêng, chuyển ngôn ngữ, revalidate).
- C-1: SPECIFICATIONS:214 đã thêm Dự án `/du-an/danh-muc/[slug]`, chỉ Tuyển dụng không có trang → khớp `admin/seo.ts`.
- Lệch nhỏ chưa ghi ở intent/as-built (không phải lỗi build): (a) không hàng chip con (C-4) — design-spec bullet Dự án chưa nói; (b) meta description fallback (C-5); (c) `/du-an?category=<slug lạ>` vẫn `noindex` (hành vi cũ, task bước 4) — spec chỉ nói "không redirect, không 404".

## 3. Verify
| Command | Result |
|---|---|
| `pnpm typecheck` (validator chạy lại sau Fix MINOR) | PASS (tsc --noEmit, 0 lỗi) |
| `pnpm test` / vitest file liên quan | Không chạy lại (cần Docker Postgres/Redis). Dẫn chứng: builder sau Fix MINOR — vitest components/projects + route danh-muc PASS (120 + 2); reviewer r1 — 22 file / 275 test PASS; full suite 4709 pass / 1 flake `Header.test` |
| eslint file đổi | Theo builder/reviewer: 0 lỗi; `pnpm lint` toàn repo FAIL baseline do `playwright-report/` |

## 4. Close-out list (change-request)

### 4a. test-scope v91 `changed.files` — THIẾU (convention v90 có liệt kê test)
Source:
- `src/components/projects/project-list-metadata.ts` (mới)
- `src/lib/projects/project-filters.ts`
- `src/i18n/messages/vi.json`
- `src/i18n/messages/en.json`

Test:
- `src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.test.tsx` (mới)
- `src/components/projects/ProjectListPage.test.tsx`
- `src/app/(frontend)/[locale]/list-no-loading.test.ts`
- `src/components/admin/SeoPreview.test.tsx`
- `src/fields/slug.test.ts`
- `src/i18n/routing.test.ts`
- `src/lib/seo/sitemap-data.test.ts`
- `src/lib/admin/seo.test.ts`
- `src/lib/content/resolve-missing-page.test.ts`
- `src/lib/i18n/counterpart-url.test.ts`
- `src/hooks/categories/revalidate-category.test.ts`

THỪA: không có (10 file đang liệt kê đều có diff). `src/app/sitemaps/[file]/route.ts` KHÔNG đổi (`SITEMAP_SECTIONS` suy từ `COLLECTION_SECTIONS`) → không thêm. Nên thêm `modules`: "project-list-metadata", "project-filters (withoutCategoryParam)", "i18n messages (noProjectsInCategory)".

### 4b. As-built doc reconcile
1. `docs/API_SPEC.md` §3.9 (`:195-212`): tiêu đề thêm trang danh mục `/du-an/danh-muc/[category]`; dòng `category` (`:201`) → "link cũ, chỉ ở `/du-an`: slug có thật (scope project, locale) → **308** sang trang danh mục, giữ mọi tham số khác (kể cả lặp khoá, `utm_*`, `page`); slug lạ/rỗng → bỏ (vẫn noindex); trang danh mục bỏ qua `?category=`"; câu canonical `:212` "→ canonical `/du-an`" thêm "hoặc trang danh mục sạch"; FAQ JSON-LD chỉ `/du-an` sạch (trang danh mục hiện FAQ, không phát `FAQPage`); meta description danh mục fallback mô tả `/du-an` (C-5); `seo` danh mục ghi đè; code thêm `project-list-metadata.ts`. Ghi khác biệt với §3.10 BL-055 (Cho thuê chỉ 308 khi chỉ có `category`).
2. `docs/DESIGN.md` hàng "Danh sách dự án" (`:239`): thêm route VI/EN, tab là link + `aria-current`, hero/breadcrumb/title theo danh mục, trống "Chưa có dự án trong mục này" + về `/du-an`.
3. `docs/ARCHITECTURE.md` (`:182-187`, cạnh mục Cho thuê): route mới; `MISSING_PAGE_RULES`, `LIST_FALLBACK`, `CATEGORY_PAGE_ROUTES.project`, `revalidate-category` scope project; nhóm sitemap `categories-projects`; `RESERVED_SLUGS` trong `src/fields/slug.ts`.
4. `.context/decisions.md` (chưa có mục BL-090): Dự án 308 luôn kể cả kèm tham số khác (khác BL-055) + lý do (trang danh mục nhận đủ bộ lọc, tập kết quả không đổi); slug dành riêng đặt ở `slug.ts` thay vì `Projects.ts`.
5. `.context/design-spec.md` S05 bullet Dự án (`:467`): ghi as-built "không có hàng chip danh mục con (như Cho thuê); danh mục cấp 2 → đánh dấu tab cha"; hero không dùng mô tả chung khi danh mục không có mô tả. Tuỳ chọn ghi chú C-2 ở `:374`.
6. BACKLOG BL-090 done + archive change doc; `progress.json`.

## 5. Gap list
- [PARTIAL] A8 doc as-built (`docs/API_SPEC.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `.context/decisions.md`) — close-out, task phase-1-task-01.
- [PARTIAL] test-scope v91 `changed.files` thiếu 15 file (mục 4a) — close-out.
- Không có [MISSING].

## 6. Residual risk
- R-1 (MINOR-4 review): dự án cũ đã có slug `danh-muc`/`category` trên staging/prod không tự đổi; lần lưu sau hook sẽ đổi sang `-2`. Kiểm read-only dữ liệu trước deploy.
- R-2: FAQ JSON-LD trên trang danh mục chỉ khoá bằng unit test cờ `cleanPage`, chưa kiểm HTML thật (FAQ dev rỗng).
- R-3: "TAMI phân phối" chỉ có trên staging → Playwright dev chưa kiểm; câu hỏi mở danh mục/nhãn vẫn treo.
- R-4: Không có ảnh 768 (không đổi layout — reviewer chấp nhận).
