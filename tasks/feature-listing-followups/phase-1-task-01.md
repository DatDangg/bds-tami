# feature-listing-followups · phase-1-task-01 — 308 cho link cũ `?category=<slug>` (C-1) + `/du-an` `priceMax=0` = không giới hạn (C-4)

- Nguồn: BL-055 · change doc `spec/changes/2026-10-22-listing-followups.md` (phase review BL-052 `.context/review-reports/feature-listing-detail-redesign-phase-3-phase-review.md` mục (c) C-1, C-4).
- Không đổi schema, không migration. Đổi behavior SEO (C-1) → spec delta (as-built BL-052 ở `SPECIFICATIONS.md:45,48,59`), MINOR.
- **AUTO PROCEED** (user 2026-10-22: "tự quyết nhé, đừng hỏi t"): phương án đã chốt ở § Quyết định, builder không hỏi.

## Classification / Risk
- Type: **MODIFY** (C-1 đổi hành vi URL công khai; C-4 là bug nhỏ đồng bộ parse).
- Risk: **MEDIUM** — C-1 đụng SEO + URL chia sẻ cũ ở 2 màn công khai (`/tin-bds`, `/cho-thue`, cả `/en`); C-4 chỉ parse tham số `/du-an`.
- Expected review level: **STRICT** (SEO / route công khai).
- Blast radius: `src/app/(frontend)/[locale]/tin-bds/page.tsx`, `src/app/(frontend)/[locale]/cho-thue/page.tsx` (hoặc `PostListPage.tsx` / `RentalListPage.tsx` nếu đặt redirect ở đó), `src/components/posts/post-list-metadata.ts`, `src/components/rentals/rental-list-metadata.ts` (chú thích), helper mới dùng chung, `src/lib/projects/project-filters.ts`, test tương ứng, `docs/API_SPEC.md:216,236`, `SPECIFICATIONS.md` (spec-publisher ghi, builder KHÔNG sửa spec).

## Hiện trạng (file:line — không spawn Explore)
- `/tin-bds?category=<slug>`: `src/components/posts/post-list-metadata.ts:29-36,55-62` — `legacyCategorySlug` + `isFilteredList` → `noindex, follow` + canonical `/tin-bds/danh-muc/<slug>` (tín hiệu trái nhau). Trang `PostListPage.tsx:43-46` vẫn lọc + đánh dấu tab.
- `/cho-thue?category=<slug>`: `src/components/rentals/rental-list-metadata.ts:84-110` — `categoryCanonicalMetadata` canonical sang trang danh mục, không noindex (chú thích :89 "quyết định: canonical chứ không 301" → nay đổi thành 308). `RentalListPage.tsx:85-98,105` lọc theo `parsed.category`.
- `/du-an`: `src/lib/projects/project-filters.ts:92-106` `parsePriceRange` — `max = 0` vẫn thành `priceMax: 0` → lọc "giá ≤ 0" ra trang rỗng. `/tin-bds` đã xử lý ở `src/lib/posts/post-filters.ts:97-105` (`parseBounded(...) || undefined`). `/du-an` không có `areaMax` (chỉ giá) → C-4 chỉ áp `priceMax`.
- Đường dẫn theo ngôn ngữ: `publicPath("/tin-bds/danh-muc/[category]" | "/cho-thue/danh-muc/[category]", locale, { category })` (`src/lib/content/content-paths.ts:76`; `/en` → `/en/property-news/category/...`, `/en/for-rent/...` theo `src/i18n/routing.ts:16-27`).

## Quyết định (AUTO PROCEED)
1. **C-1 — 308 chỉ khi URL "chỉ có `category`":** `searchParams` có `category` (giá trị đầu tiên, trim, không rỗng) **và không có khoá nào khác mang giá trị không rỗng** (`page`, `q`, `sort`, bộ lọc… có giá trị → KHÔNG redirect, giữ hành vi hiện tại: lọc + tab + metadata như cũ). Khoá khác nhưng rỗng (`?category=x&q=`) coi như không có → vẫn redirect. Slug đối chiếu được danh mục thật (đúng scope `rental` / tin BĐS, theo `locale` đang xem — dùng lookup sẵn có: `findRentalCategory` / `loadPostCategoryContext`) → `permanentRedirect(publicPath(<route danh mục>, locale, { category: slug }))` (`next/navigation`, = 308). Slug không tồn tại → **giữ nguyên hành vi hiện tại** (không redirect, không 404). Cả `vi` và `en` (đích theo `publicPath` của locale đang xem; slug trên URL cũ là slug của ngôn ngữ đang xem, như canonical hiện nay).
   - Đặt redirect trong **page component** (`PostListPage` / `RentalListPage` hoặc route `page.tsx`), trước khi render; `generateMetadata` không cần đổi logic (request đã 308 trước khi metadata có ý nghĩa) — nhưng cập nhật chú thích `post-list-metadata.ts:48-52` và `rental-list-metadata.ts:85-92` cho đúng (canonical chỉ còn là phòng hờ khi URL có thêm tham số khác).
   - Tách điều kiện "chỉ có `category`" thành hàm thuần dùng chung cho 2 màn (vd `src/lib/content/legacy-category.ts` › `legacyCategoryOnly(searchParams): string | null`) + unit test. Giới hạn slug ≤ 100 ký tự như `legacyCategorySlug`.
   - Route danh mục (`/tin-bds/danh-muc/[category]`, `/cho-thue/danh-muc/[category]`) có `?category=` → **không** redirect (đã bị bỏ qua như hiện tại).
2. **C-4 — `/du-an` `priceMax=0` = không giới hạn trên:** sửa `parsePriceRange` (`project-filters.ts:96-106`) theo đúng quy tắc `/tin-bds` (`post-filters.ts:97-105`): `max = 0` → bỏ, `min = 0` → bỏ (đã vậy), đổi chỗ khi `min > max` chỉ khi cả hai có giá trị. Cập nhật chú thích. Không đổi API `GET /api/public/rentals` (zod riêng, ngoài scope).

## Scope
1. Sửa theo § Quyết định 1 và 2.
2. Test (vitest, TDD — fail trước, pass sau):
   - Unit helper `legacyCategoryOnly`: `{category:"x"}` → `"x"`; `{category:"x", page:"2"}` / `{category:"x", q:"a"}` / `{category:"x", sort:"price_asc"}` → `null`; `{category:"x", q:""}` → `"x"`; `{category:["x","y"]}` → `"x"`; `{category:" "}` / `{}` → `null`.
   - `PostListPage.test.tsx` + `RentalListPage.test.tsx` (mock `next/navigation` `permanentRedirect` ném như Next, hoặc spy): `?category=<slug có thật>` → gọi `permanentRedirect` đúng đích vi (`/tin-bds/danh-muc/<slug>`, `/cho-thue/danh-muc/<slug>`) và en (`/en/property-news/category/<slug>`, `/en/for-rent/category/<slug>` — lấy đúng từ `routing.ts`); `?category=<slug>&page=2` → không redirect, vẫn render lọc + tab như cũ (test hiện có giữ PASS); `?category=<slug lạ>` → không redirect.
   - `project-filters.test.ts`: `{ priceMax: "0" }` → `{}`; `{ priceMin: "5", priceMax: "0" }` → `{ priceMin: 5 }`; các test hiện có (:40-45) giữ PASS.
3. Doc impact (as-built, builder sửa): `docs/API_SPEC.md:216` (câu "Link cũ `/cho-thue?category=<slug có thật>` vẫn lọc + đánh dấu tab, canonical về trang danh mục" → 308 khi chỉ có `category`; có thêm tham số → lọc + canonical như cũ) và `:236` (`/tin-bds?category=`), `:208` (`priceMax=0` = không giới hạn trên). `docs/DESIGN.md` / `.context/design-spec.md`: Grep `?category=` — có câu mô tả thì ghi as-built, không thì `no doc impact`. KHÔNG sửa `SPECIFICATIONS.md` / `spec/**` (spec-publisher làm).
4. Verify (`.context/project-config.md`): `pnpm typecheck` · `pnpm lint` (scope 0 lỗi; `.local-seed/*` git-ignored đỏ sẵn, ngoài scope) · `pnpm test` · `pnpm build`.
5. Kiểm nhanh thật (nếu dev server chạy được): `curl -sI "http://localhost:3000/tin-bds?category=<slug thật>"` → `308` + `location`; `/en/property-news?category=<slug en>`; `/cho-thue?category=<slug>`; `?category=<slug>&page=2` → 200. Ghi kết quả vào § Verification summary (không chạy được → ghi residual).

## Acceptance
- [x] `/tin-bds?category=<slug thật>` và `/cho-thue?category=<slug thật>` (vi + en) trả **308** sang trang danh mục tương ứng khi URL không có tham số khác có giá trị; có test.
- [x] URL có thêm tham số khác (`page`, `q`, lọc, `sort`) hoặc slug không tồn tại → hành vi như hiện tại (không redirect); test hiện có PASS.
- [x] `/du-an?priceMax=0` không còn lọc "giá ≤ 0" (= không giới hạn trên); có test.
- [x] API_SPEC cập nhật; không đụng intent docs / spec.
- [x] typecheck + lint (scope) + test + build PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Builder (attempt 1, 2026-10-22):**

Thay đổi:
- NEW `src/lib/content/legacy-category.ts` — `legacyCategoryOnly(searchParams: object): string | null`: `category` (giá trị đầu, trim, ≤ 100 ký tự) và không khoá nào khác mang giá trị không rỗng; khoá rỗng (`&q=`) không tính. Nhận `object` + kiểm kiểu lúc chạy (`Object.entries`) vì `RawPostListParams` là interface không index signature.
- `src/components/posts/PostListPage.tsx` — `loadPostListData`: sau khi tra `context` của link cũ, `!categorySlug && context && legacyCategoryOnly(searchParams)` → `permanentRedirect(postCategoryHref(context.category, locale))` (= `publicPath("/tin-bds/danh-muc/[category]", locale, …)`). Chú thích JSDoc trang cập nhật.
- `src/components/rentals/RentalListPage.tsx` — hàm mới `redirectLegacyCategoryOnly` gọi đầu `loadRentalListData`: S04 + slug chỉ-có-category + `findRentalCategory(payload, locale, slug)` có thật → `permanentRedirect(categoryPath(locale, category.slug ?? slug))`. Chú thích JSDoc trang cập nhật.
- `src/lib/projects/project-filters.ts` — `parsePriceRange`: `parseBillion(rawMax) || undefined` (như `post-filters.ts` `parseRange`), chú thích nêu `max = 0` = không giới hạn trên.
- Chú thích `post-list-metadata.ts` (`buildPostListMetadata`) + `rental-list-metadata.ts` (`buildRentalListMetadata`): nhánh canonical về trang danh mục chỉ còn phòng hờ cho URL kèm tham số khác (URL chỉ có `category` đã 308 trước render).

Test (TDD — 3 test mới FAIL trước fix: `promise resolved instead of rejecting` ×2, `expected { priceMax: +0 } to deeply equal {}`; helper test FAIL `Cannot find module`; PASS sau fix):
- NEW `src/lib/content/legacy-category.test.ts` — 4 case (slug / khoá lặp; `page`/`q`/`sort`/`province`/`utm_source` → null; khoá rỗng vẫn slug; rỗng / quá dài / `{}` → null).
- `PostListPage.test.tsx` — mock `permanentRedirect` ném `NEXT_REDIRECT`; `{category:"voucher"}` vi → `/tin-bds/danh-muc/voucher`, en → `/en/property-news/category/voucher`, không gọi `loadPostListing`; `&q=` vẫn 308; slug lạ + route danh mục có `?category=` không redirect; test link cũ hiện có đổi thành `{category:"voucher", page:"2"}` (không redirect, vẫn lọc + tab + hidden input).
- `RentalListPage.test.tsx` — tương tự: `can-ho` vi → `/cho-thue/danh-muc/can-ho`, en → `/en/for-rent/category/can-ho`, `search` không được gọi; danh mục con `can-ho-dich-vu&q=` → `/cho-thue/danh-muc/can-ho-dich-vu`; slug lạ / `nha-pho` ở `/en` (chưa có EN) / route danh mục → không redirect; 2 test link cũ hiện có thêm `province=ha-noi`.
- `project-filters.test.ts` — `{priceMax:"0"}` → `{}`; `{priceMin:"5", priceMax:"0"}` → `{priceMin:5}`; `{priceMin:"0", priceMax:"0"}` → `{}`; bỏ assertion cũ `{ priceMax: 0 }`.

Verify (`.context/project-config.md`):
- `pnpm typecheck` → PASS.
- `pnpm lint` → 4 error + 2 warning, TẤT CẢ ở `.local-seed/seed-sample-project-blocks.ts` (git-ignored, đỏ sẵn) và `tools/task-dashboard/server.mjs` (warning, ngoài scope); `npx eslint <10 file scope>` → 0 lỗi.
- `pnpm test` → 419 file / 4389 test PASS (294s).
- `pnpm build` → PASS.
- Kiểm thật trên dev server `http://127.0.0.1:3000` (DB local, slug thật `tin-bds` / `can-ho-dich-vu`):
  - `/tin-bds?category=tin-bds` → **308** `location: /tin-bds/danh-muc/tin-bds`
  - `/cho-thue?category=can-ho-dich-vu` → **308** `location: /cho-thue/danh-muc/can-ho-dich-vu`
  - `/tin-bds?category=tin-bds&q=` → **308** (khoá rỗng không tính)
  - `/tin-bds?category=tin-bds&page=2` → 200 · `/cho-thue?category=can-ho-dich-vu&province=ha-noi` → 200
  - `/tin-bds?category=khong-co-slug-nay` / `/cho-thue?category=khong-co-slug-nay` → 200 (không redirect, không 404)
  - `/tin-bds/danh-muc/tin-bds?category=tin-bds` → 200 (route danh mục bỏ qua)
  - `/en/property-news?category=tin-bds` / `/en/for-rent?category=can-ho-dich-vu` → 200: DB local chưa có danh mục bản EN (`/en/for-rent/category/can-ho-dich-vu` → 404) nên không có slug EN thật để 308 — đúng quy tắc "slug không tồn tại ở locale → giữ hành vi"; nhánh EN được unit test (`/en/property-news/category/voucher`, `/en/for-rent/category/can-ho`).
  - `/du-an?priceMax=0` → 200, "61 dự án" = bằng `/du-an` không lọc (trước fix sẽ là lọc "giá ≤ 0"; `?priceMax=1` → "0 dự án" chứng tỏ lọc trên vẫn chạy).

Doc impact: `docs/API_SPEC.md` §3.9 dòng `priceMin`/`priceMax` (`priceMax=0` = không giới hạn trên), §3.10 câu link cũ `/cho-thue?category=` (308 khi chỉ có `category`; kèm tham số → lọc + canonical; slug lạ → bỏ), §3.11 dòng `category` (308 / lọc + tab / slug lạ). `docs/DESIGN.md:241,243` và `.context/design-spec.md:236` có câu "link cũ `?category=` lọc + đánh dấu tab, canonical về trang danh mục" — vẫn đúng cho URL kèm tham số; **không sửa** (mô tả màn hình, không phải contract URL — ghi để reviewer/spec-publisher quyết; coi là `no doc impact` ngoài API_SPEC). KHÔNG đụng `SPECIFICATIONS.md` / `spec/**` (spec-publisher).

Residual:
- Chưa kiểm 308 thật ở `/en` vì DB local không có danh mục bản EN (chỉ unit test).
- Redirect S04 cho thuê tra `findRentalCategory` thêm một lượt trước `loadFilterContext` (có `cache()` của React nên không truy vấn lặp trong cùng request); chỉ xảy ra khi URL có `category` không kèm tham số khác.
- Không commit (builder không commit; working tree có nhiều file dirty ngoài scope — không add).
