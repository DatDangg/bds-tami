# feature-projects-category-page · phase-1-task-01 — Trang danh mục Dự án `/du-an/danh-muc/[category]` (S05)

- Change doc: `spec/changes/2026-10-27-projects-category-breadcrumb-title.md` (BACKLOG BL-090, QA sheet 27/10 dòng 12)
- Spec: SPECIFICATIONS.md (spec 1.60.0) khối "Trang danh mục Dự án (BL-090 …)" + dòng `/du-an`; design-spec S05 (route Dự án + gạch "Dự án (BL-090)"); test-scope v91.
- Auto proceed: CÓ — user duyệt chạy batch BL-088..091 ("Chạy change cho BL-088, BL-089, BL-090, BL-091"), user chốt cách B 2026-10-27.

## Hiện trạng (change-request đã đọc code)
- `src/app/(frontend)/[locale]/du-an/page.tsx` → `ProjectListPage` (`src/components/projects/ProjectListPage.tsx`) + `buildProjectListMetadata`. Dữ liệu ở `src/components/projects/project-list-data.ts` (`loadProjectListData`, `loadCategoryContext` — danh mục cấp 1 gồm con, cấp 2 đánh dấu tab cha).
- `?category=` hiện là bộ lọc trên `/du-an`: title "Dự án | TAMI", breadcrumb "Trang chủ › Dự án", H1 = `pageHeroes.projects`. Tab: `buildTabs` link `?category=`; `HIDDEN_PARAMS` gồm `category`.
- Mẫu đã có, dùng lại cách làm: Cho thuê S05 — `src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx` (+ `page.test.tsx`), `RentalListPage` (`categorySlug` prop, `RentalListHero` breadcrumb cha/danh mục, eyebrow = tên loại), `rental-list-metadata.ts` (`categoryPageMetadata`: canonical chính nó, `seo` danh mục, hreflang khi có bản EN qua `findLocalizedSlugs`, noindex khi lọc). Redirect cũ: `src/lib/content/legacy-category.ts` (Cho thuê/Tin BĐS chỉ 308 khi URL chỉ có `category` — **Dự án khác**: 308 luôn khi slug có thật, giữ tham số khác, vì trang danh mục dự án nhận đủ mọi bộ lọc của `/du-an`).
- Điểm chạm route danh mục khác (mọi chỗ đang liệt kê `/cho-thue/danh-muc/[category]` phải có bản Dự án): `src/i18n/routing.ts` pathnames; `src/lib/seo/sitemap-data.ts` (`COLLECTION_SECTIONS` thêm `categories-projects` scope `project`) + route sitemap `src/app/sitemaps/[file]/route.ts` / `src/app/sitemap.xml/route.ts` nếu cần khai nhóm; `src/lib/i18n/counterpart-url.ts` `LIST_FALLBACK`; `src/lib/content/resolve-missing-page.ts` `MISSING_PAGE_RULES`; `src/lib/admin/seo.ts` `CATEGORY_PAGE_ROUTES` (+ comment "Dự án và Tuyển dụng KHÔNG có trang danh mục" → chỉ Tuyển dụng); `src/hooks/categories/revalidate-category.ts`. Grep `cho-thue/danh-muc` để không sót (tests đi kèm).
- Dữ liệu dev: 4 danh mục `scope=project` cấp 1, đều có EN (can-ho-chung-cu/apartments, khu-do-thi/urban-areas, nha-pho-biet-thu/townhouses-and-villas, nghi-duong/resorts). Staging có thêm `tami-phan-phoi` — là bản ghi `categories` (tab chỉ dựng từ `listRootProjectCategories`) → trang danh mục như các tab khác.
- Routing Next: `/du-an/danh-muc` (2 đoạn) vẫn khớp `/du-an/[slug]`; `/du-an/danh-muc/x` khớp route mới → không đè nhau ở tầng router. Acceptance vẫn yêu cầu chặn slug dự án `danh-muc` (vi) / `category` (en) để URL chi tiết không trông như trang danh mục rỗng.

## Hướng làm (quyết định change-request)
1. **Route** `src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx` (+ `page.test.tsx` theo mẫu cho-thue): `force-dynamic`, `generateMetadata` → `buildProjectListMetadata({ locale, searchParams, categorySlug })`, page → `<ProjectListPage … categorySlug={category} />`. `routing.ts` thêm `"/du-an/danh-muc/[category]": { vi: "/du-an/danh-muc/[category]", en: "/projects/category/[category]" }` (đặt TRƯỚC `/du-an/[slug]` cho rõ; next-intl khớp theo số đoạn).
2. **ProjectListPage / project-list-data**: prop `categorySlug?: string`. Có `categorySlug` → tra danh mục (`findProjectCategoryBySlug`, scope project, theo locale, publicWhere/hasEnglish như hiện tại) → không có → `notFound()`; `?category=` trên trang danh mục bị bỏ qua. `listPath` = trang danh mục (form tìm `q`, bộ lọc, Xoá lọc, sắp xếp, phân trang đều ở đây). Hero: `h1` = `category.name`, eyebrow = nhãn nav "Dự án"/"Projects", mô tả = `category.description` (không có → không mô tả, không dùng mô tả hero chung), ảnh = ảnh hero `/du-an`, không `titleAccent`. Breadcrumb: Dự án (→ `/du-an`) › cha (nếu có, → trang danh mục cha) › danh mục (→ chính nó). Trạng thái trống không lọc ở trang danh mục: thông điệp "chưa có dự án trong mục này" + link về `/du-an` (thêm key i18n vi/en nếu chưa có). FAQ JSON-LD chỉ ở `/du-an` sạch (trang danh mục vẫn hiện khối FAQ, không phát `FAQPage`).
3. **Tab**: `buildTabs` href → "Tất cả" = `/du-an` + bộ lọc khác; danh mục = `publicPath("/du-an/danh-muc/[category]", locale, { category: slug })` + bộ lọc khác (về trang 1, giữ `sort`). Tab đang xem = danh mục khoá (hoặc cha của nó) `aria-current="page"`. Bỏ `category` khỏi `HIDDEN_PARAMS`/`current` (không còn lên URL).
4. **Redirect cũ** trên `/du-an` (không có `categorySlug`): `?category=<slug>` tra được danh mục (đúng scope + locale) → `permanentRedirect` (308) sang trang danh mục của slug đó, **giữ nguyên mọi tham số khác thô** (kể cả `utm_*`, `page`), chỉ bỏ `category`. Slug lạ → bỏ như cũ (không redirect, không 404; metadata giữ noindex như hiện tại). Không redirect khi `category` rỗng.
5. **Metadata** (`buildProjectListMetadata` thêm `categorySlug`): theo mẫu `categoryPageMetadata` của cho thuê — title = `"<category.name> – <t('title')>"` (→ `<title>` "Căn hộ chung cư – Dự án | TAMI"; xác minh `buildPageMetadata` thêm hậu tố site đúng 1 lần), `description` = `category.description` ?? mô tả `/du-an`, `seo` = `category.seo` (ghi đè nếu có), canonical chính nó (+ `?page=n` trang ≥ 2), hreflang vi/en chỉ khi danh mục `hasEnglish` + có slug EN (`findLocalizedSlugs`), có tham số lọc/sắp xếp → `noindex, follow` + canonical trang danh mục sạch. Danh mục không có → `{}` (page sẽ 404).
6. **Sitemap**: nhóm `categories-projects` (scope `project`, route mới) — vi luôn, en khi có bản EN; kiểm sitemap index liệt kê nhóm mới.
7. **Chuyển ngôn ngữ / 404 / admin / revalidate**: `LIST_FALLBACK` thêm route mới → `/du-an`; `MISSING_PAGE_RULES` thêm rule scope `project`; `CATEGORY_PAGE_ROUTES.project` = route mới (SeoPreview danh mục Dự án hết câu "không có trang công khai"); `revalidate-category` revalidate trang danh mục dự án như các scope khác.
8. **Chặn slug dự án**: KHÔNG sửa `src/collections/Projects.ts` (file dirty của BL-077, cấm đụng). Đặt logic ở `src/fields/slug.ts` (dùng chung): danh sách slug dành riêng theo `collection.slug` + locale (`projects`: vi `danh-muc`, en `category`) được coi như "đã bị chiếm" trong `findFreeSlug` → ra `danh-muc-2` / `category-2`. Collection khác không đổi. Test ở `src/fields/slug.test.ts`.
9. Không đổi schema / migration / API JSON / trang chi tiết dự án / Cho thuê / Tin BĐS. Không sửa `src/app/(payload)/admin/importMap.js`.

## Classification / Risk
- Type: **MODIFY** (đổi thiết kế: `?category=` bộ lọc → trang danh mục riêng). Không schema/migration.
- Risk: **HIGH** — routing/i18n pathnames dùng chung, SEO (canonical/hreflang/noindex/sitemap), redirect 308, hook slug dùng chung mọi collection nội dung. Reviewer: **STRICT**.
- Blast radius: `/du-an` + `/en/projects` (tab, lọc, FAQ JSON-LD, metadata), route mới, `/du-an/[slug]`, sitemap index + nhóm, chuyển ngôn ngữ (`/api/locale-counterpart`), trang 404 gợi ý, SeoPreview admin danh mục, revalidate danh mục, slug mọi collection (chỉ projects có slug dành riêng).
- Doc impact: SPECIFICATIONS + design-spec S05 (đã ghi, spec 1.60.0); `docs/DESIGN.md` hàng "Danh sách dự án" + bảng route nếu có, `docs/API_SPEC.md` §`/du-an` dòng `category` → change-request reconcile ở close-out.
- Decision impact: Dự án 308 cả khi kèm tham số khác (khác Cho thuê/Tin BĐS BL-055 chỉ-có-`category`) — lý do: trang danh mục dự án nhận đủ mọi bộ lọc nên không mất ngữ cảnh; ghi `.context/decisions.md` ở close-out.

## Acceptance
- [x] `/du-an/danh-muc/<slug>` · `/en/projects/category/<slug-en>` render danh sách dự án của danh mục (gồm con); `<title>` "<Tên danh mục> – Dự án | TAMI" (EN "<Name> – Projects | …"); breadcrumb Trang chủ › Dự án › (cha) › <Danh mục>; H1 = tên danh mục; mô tả `categories.description` nếu có; VI/EN đúng tên theo ngôn ngữ.
- [x] Tab trên `/du-an` và trang danh mục link sang URL mới, tab đang xem `aria-current="page"`; "Tất cả" → `/du-an`. Bộ lọc / sắp xếp / phân trang / ô tìm `q` ở trang danh mục giữ danh mục (URL vẫn là trang danh mục).
- [x] `/du-an?category=<slug>` → 308 trang danh mục, giữ tham số khác (`?category=khu-do-thi&status=selling&page=2` → `/du-an/danh-muc/khu-do-thi?status=selling&page=2`); EN tương tự; slug lạ → `/du-an` 200 không lọc.
- [x] `/du-an/danh-muc/khong-co` và `/en/projects/category/<slug-vi>` → 404; trang vượt số trang → 404.
- [x] Sitemap có trang danh mục dự án (vi + en); trang danh mục: canonical chính nó, hreflang vi/en, có lọc → noindex + canonical sạch.
- [x] Tạo/sửa dự án slug `danh-muc` (vi) / `category` (en) → lưu thành `danh-muc-2` / `category-2`; collection khác không bị ảnh hưởng. `/du-an/<slug-du-an>` vẫn chạy.
- [x] Unit/component test: route page (mẫu cho-thue `page.test.tsx`), ProjectListPage (tab href/aria-current, hero/breadcrumb, redirect 308 giữ tham số, slug lạ, 404), metadata (title/canonical/hreflang/noindex), sitemap-data, counterpart-url, resolve-missing-page, admin seo, revalidate-category, slug reserved, routing.test.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS (lint toàn repo nếu FAIL chỉ do `playwright-report/` → ghi rõ, chạy eslint trên file đổi).
- [x] Playwright (dev server port KHÁC 3000 — 3000 bị project khác chiếm; vd 3100; tắt server sau khi đo): VI + EN, 1440 + 390 — title/breadcrumb/H1 theo danh mục cho 2+ danh mục, đổi tab cập nhật đúng, `aria-current`, 308 (status + Location) từ `?category=`, 404 slug lạ, `/sitemap.xml` + nhóm danh mục dự án, canonical/hreflang trong `<head>`. Ảnh chụp lưu `.context/review-reports/assets/bl090-*.png`.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md`, `docs/**` (change-request reconcile).
- KHÔNG đụng file dirty không thuộc change: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/Projects.ts`, `src/collections/PropertyPosts.ts`, `src/collections/Rentals.ts`, `src/fields/ward-in-province.ts`, `tools/**`, `spec/changes/**`.
- KHÔNG commit, KHÔNG revert/checkout file nào.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`) + Playwright như Acceptance.

## Builder log
Agent: builder — attempt 1 (REDO trên đĩa sau khi lần trước bị user dừng; interrupted ≠ failed).

### Decision log
- Đọc `git diff -- src` đầu phiên: slug dành riêng (`RESERVED_SLUGS` ở `src/fields/slug.ts`, gộp vào `findTaken` theo `collection.slug` + `req.locale`) và 6 file test viết trước đều đúng/đủ → giữ nguyên, làm tiếp phần code.
- Metadata tách file mới `project-list-metadata.ts` (`ProjectListPage.tsx` re-export `buildProjectListMetadata` để import cũ không đổi; giữ file < 300 dòng). `projectCategoryPath` đặt ở đó.
- `withoutCategoryParam` đặt ở `src/lib/projects/project-filters.ts` (thuần, dùng chung loader + metadata). Trang danh mục bỏ `?category=` trước khi parse/hasFilterParams.
- 308: ở `loadProjectListData` — `/du-an` có `?category=<slug có thật>` (scope project + locale) → `permanentRedirect(<trang danh mục>?<mọi tham số khác thô qua URLSearchParams>)`. Slug lạ / rỗng / EN thiếu bản dịch → không redirect, không lọc (như cũ). Khác Cho thuê/Tin BĐS: redirect cả khi kèm tham số khác (đúng Hướng làm 4).
- C-4 (spec-validator): KHÔNG có hàng chip danh mục con trên trang danh mục, theo mẫu Cho thuê (chỉ tab cấp 1, danh mục con gộp vào danh mục cha, cấp 2 đánh dấu tab cha).
- C-5: `description` metadata = `category.description ?? t("description")` (mô tả `/du-an`); hero thì KHÔNG dùng mô tả hero chung khi danh mục không có mô tả.
- Title: `"<Tên> – <t('title')>"` → `buildPageMetadata` thêm `| TAMI` đúng 1 lần ("Căn hộ chung cư – Dự án | TAMI"; EN "Apartments – Projects | TAMI"); `seo.metaTitle` vẫn ghi đè.
- i18n: thêm `page.projects.noProjectsInCategory` (vi/en); trống không lọc ở trang danh mục = "Chưa có dự án trong mục này." + nút "Về danh sách" → `/du-an`.
- Không đụng `Projects.ts` (BL-077): chặn slug `danh-muc`/`category` hoàn toàn ở `slug.ts`.
- Sitemap: thêm nhóm `categories-projects`; `SITEMAP_SECTIONS` suy ra từ `COLLECTION_SECTIONS` nên sitemap index tự liệt kê (đã kiểm HTTP).

### Files changed (thuộc task)
- Mới: `src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx` + `page.test.tsx`; `src/components/projects/project-list-metadata.ts`.
- Sửa code: `src/components/projects/ProjectListPage.tsx`, `project-list-data.ts`; `src/lib/projects/project-filters.ts`; `src/i18n/routing.ts`; `src/i18n/messages/{vi,en}.json`; `src/lib/seo/sitemap-data.ts`; `src/lib/i18n/counterpart-url.ts`; `src/lib/content/resolve-missing-page.ts`; `src/lib/admin/seo.ts`; `src/hooks/categories/revalidate-category.ts`; `src/fields/slug.ts` (có sẵn từ lần trước).
- Sửa test: `ProjectListPage.test.tsx` (tab href mới, S05 render/404/hero/breadcrumb/trống, 308 giữ tham số, slug lạ, metadata danh mục), `list-no-loading.test.ts` (+route mới), `SeoPreview.test.tsx` (Dự án nay có trang danh mục), + test có sẵn: `slug.test.ts`, `routing.test.ts`, `sitemap-data.test.ts`, `seo.test.ts`, `resolve-missing-page.test.ts`, `counterpart-url.test.ts`, `revalidate-category.test.ts`.
- Ảnh: `.context/review-reports/assets/bl090-*.png` (11 ảnh).
- Dirty KHÔNG thuộc task (BL-076..078) — không đụng: `Projects.ts`/`PropertyPosts.ts`/`Rentals.ts`/`ward-in-province.ts`/`WardField*`/`importMap.js`/`.claude`/tools/spec/docs.

### Verify
- `pnpm typecheck`: PASS.
- `pnpm lint`: FAIL toàn repo chỉ do `playwright-report/` (như baseline); `npx eslint` trên file đổi (src/components/projects, src/lib, src/fields/slug*, src/hooks/categories, src/i18n, route du-an): 0 lỗi / 0 cảnh báo (sau khi bỏ `tNav` thừa + `_ignored`).
- `pnpm test`: lần 1 Postgres/Redis đang tắt (container tami-* Exited sau restart Docker) → integration FAIL do môi trường + `SeoPreview.test` FAIL thật (đã sửa). Sau `docker start tami-postgres tami-redis tami-seaweedfs`: lần 2 = 4709 pass / 1 fail; fail duy nhất `Header.test` (timeout 5s dưới tải) + `news.test` hook timeout 60s đều PASS khi chạy riêng (49/49) → flake do tải, không liên quan thay đổi.
- Test đổi chạy riêng: 167 file / 1838 test PASS (projects, hooks/categories, fields/slug, lib, route (frontend), i18n).

### Playwright (Edge, dev server port 3100, đã tắt sau khi đo) — `bl090-*.png`
- VI + EN × 1440 + 390: `/du-an/danh-muc/can-ho-chung-cu` · `/khu-do-thi` · `/en/projects/category/apartments` · `/urban-areas`: 200, `<title>` "Căn hộ chung cư – Dự án | TAMI" / "Khu đô thị – Dự án | TAMI" / "Apartments – Projects | TAMI" / "Urban areas – Projects | TAMI"; 1 H1 = tên danh mục; breadcrumb Trang chủ › Dự án › <danh mục> (ảnh); tab đang xem `aria-current="page"`, tab link `/du-an/danh-muc/<slug>` (EN `/en/projects/category/<slug-en>`), "Tất cả" → `/du-an`; click tab đổi đúng trang + H1 + aria-current; không h-scroll.
- canonical = chính nó; hreflang vi/en/x-default đúng slug EN (dev: host `localhost:3000` do `NEXT_PUBLIC_SITE_URL`; robots `noindex, nofollow` vì APP_ENV dev); `?status=selling` → canonical trang sạch.
- 308: `/du-an?category=khu-do-thi&status=selling&page=2` → `Location: /du-an/danh-muc/khu-do-thi?status=selling&page=2`; `/en/projects?category=urban-areas&q=a` → `/en/projects/category/urban-areas?q=a`; slug lạ / rỗng / slug-vi trên EN → 200 không lọc.
- 404: `/du-an/danh-muc/khong-co`, `/en/projects/category/khu-do-thi` (slug vi trên EN), `/du-an/danh-muc/khu-do-thi?page=99`.
- Sitemap: `/sitemap.xml` liệt kê `categories-projects-1.xml`; nhóm có đủ 4 danh mục × (vi + en) kèm hreflang.

### Residual risk
- FAQ JSON-LD: trang danh mục không phát `FAQPage` (emitJsonLd=false) — đã có unit test cho cờ qua `cleanPage`, chưa kiểm HTML thật (FAQ dev rỗng).
- `slug.ts` chặn slug `danh-muc`/`category` chỉ khi ghi qua hook (UI/API/seed đều đi qua hook); bản ghi dự án CŨ đã có slug đó (nếu có) không bị đổi lại — dev không có.
- Docker `tami-*` được khởi động lại để chạy integration (hạ tầng local, không đổi dữ liệu).
- Không commit theo yêu cầu.

### Fix MINOR r1
- MINOR-1: `ProjectListPage.test.tsx` thêm case 308 với tham số lặp key (`type=apartment&type=villa`), thứ tự giữ nguyên, chỉ bỏ `category`.
- MINOR-2: `project-list-data.ts` — link cũ `/du-an?category=<slug>` tra danh mục trước và `permanentRedirect` ngay, trước `Promise.all` các query danh sách/hero/nội dung; slug lạ/rỗng vẫn không redirect. Test khoá: `listPublicProjects` / `loadPageHero` / `loadListingPageContent` không được gọi khi redirect.
- MINOR-3: `ProjectListPage.tsx` — breadcrumb cha chỉ thêm khi `parent.slug` có; test cha không slug không sinh `/du-an/danh-muc/`.
- Verify: `pnpm typecheck` PASS; vitest components/projects + route danh-muc PASS (120 + 2 tests); eslint file đổi sạch. Không commit.

## Review
- Reviewer r1: **STRICT PASS** — `.context/review-reports/feature-projects-category-page-phase-1-task-01-round-1-review.md` (0 CRITICAL / 0 MAJOR; MINOR-1..3 đã sửa trước commit — "Fix MINOR r1"; MINOR-4 residual).
- Spec-validator pre-plan: `.context/review-reports/feature-projects-category-page-spec-validation.md`; post-build phase 1: **PASS** — `.context/review-reports/feature-projects-category-page-phase-1-validation.md` (11 ✅ · 1 ⚠️ close-out doc, 0 ❌).

## Verification summary
- `pnpm typecheck` PASS (validator chạy lại sau Fix MINOR).
- `pnpm test`: 4709 pass / 1 flake `Header.test` (timeout dưới tải, PASS khi chạy riêng); reviewer r1 file liên quan 22 file / 275 test PASS; sau Fix MINOR vitest components/projects + route danh-muc 120 + 2 PASS.
- eslint file đổi: 0 lỗi / 0 cảnh báo; `pnpm lint` toàn repo FAIL baseline chỉ do `playwright-report/` (ngoài phạm vi).
- Playwright Edge (port 3100) VI/EN × 1440/390: title/breadcrumb/H1/aria-current, 308 giữ tham số, 404, sitemap `categories-projects`, canonical/hreflang — ảnh `.context/review-reports/assets/bl090-*.png`.

## Doc Impact / Reconcile (close-out 2026-10-28)
- Intent (qua change request, user chốt cách B): `SPECIFICATIONS.md` 1.60.0 (khối BL-090 + dòng `/du-an` + C-1 :214), `.context/design-spec.md` S05 (route + bullet Dự án, bổ sung as-built: không hàng chip con, hero không mô tả chung, chữ trạng thái trống).
- As-built: `docs/API_SPEC.md` §3.9 (tiêu đề + trang danh mục, `category` → 308 giữ mọi tham số khác ≠ §3.10/§3.11 BL-055, canonical/FAQ/title/description/hreflang/sitemap); `docs/DESIGN.md` hàng "Danh sách dự án" (route + S05 as-built); `docs/ARCHITECTURE.md` (ghi chú layer-6-task-04 bị thay + mục BL-090: route, 308, MISSING_PAGE_RULES/LIST_FALLBACK/CATEGORY_PAGE_ROUTES/revalidate/sitemap, RESERVED_SLUGS).
- Decision: `.context/decisions.md` Decision 11 (308 luôn khác BL-055; slug dành riêng ở `slug.ts`).
- Spec publish: spec 1.60.0 (MINOR) / test-scope v91 (v90 archive `spec/test-scope/archive/test-scope-1.59.0-90.json`), update `spec/updates/2026-10-28-projects-category-page.md`, `spec/CHANGELOG.md`; close-out bổ sung `changed.files` as-built (+4 source +11 test), không bump scopeVersion.
- Schema/migration: none.

## Residual risk
- MINOR-4 / R-1: dự án CŨ đã có slug `danh-muc` (vi) / `category` (en) trên staging/prod không tự đổi; lần lưu sau hook đổi sang `-2` (đổi URL). **Trước deploy: kiểm read-only** `projects` (bảng slug theo locale) trên staging/prod có slug `danh-muc`/`category` không.
- R-2: FAQ JSON-LD trên trang danh mục chỉ khoá bằng unit test (cờ `cleanPage`), chưa kiểm HTML thật (FAQ dev rỗng).
- R-3: "TAMI phân phối" chỉ có trên staging → Playwright dev chưa kiểm; câu hỏi mở (danh mục hay nhãn) vẫn treo — mặc định coi là danh mục.
- R-4: không có ảnh 768 (không đổi layout — reviewer chấp nhận).

## Status
- **done** (2026-10-28) — attempt 1, STRICT PASS r1, spec-validation post-build PASS.

