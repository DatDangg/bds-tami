# feature-bathrooms-filter · phase-1-task-01 — Bộ lọc số phòng tắm (Cho thuê + Tin BĐS)

- Change doc: `spec/changes/2026-11-02-bathrooms-filter.md` (BACKLOG BL-104, QA sheet 30/10 dòng 23)
- Spec: SPECIFICATIONS.md 1.62.0 — F3 (dòng bộ lọc), mục `/cho-thue` "Bộ lọc: … **Phòng tắm** (BL-104)", mục `/tin-bds` "Phòng tắm (BL-104)"; delta `spec/updates/2026-11-02-bathrooms-filter.md`; test-scope v107.
- Auto proceed: CÓ — user "ok, làm luôn ở đây".
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/feature-bathrooms-filter-phase-1-task-01-round-1-review.md`), Spec Validator PASS phase 1 (`.context/review-reports/feature-bathrooms-filter-phase-1-spec-validation.md`). Spec 1.62.0 / test-scope v107. Doc impact: `docs/API_SPEC.md` (§3.3 + §6.1 khoá trang + §6.2 Tin BĐS), `.context/design-spec.md` (BL-052 Theo màn S04/S05, S08).

## Hiện trạng (change-request đã đọc code)
Mẫu cần nhân bản = bộ lọc phòng ngủ `bedrooms` (không đổi hành vi phòng ngủ).
- **Cho thuê** — URL: `src/lib/search/url-params.ts` (`QUERY_KEYS` dòng 38, type dòng 26, `read("bedrooms")` dòng 78, `singles` dòng 116); SQL: `src/lib/search/rental-search-sql.ts:138-141` (`rentalConditions`, nhánh `bedrooms`, `4` = ≥ 4); API zod: `src/shared/types/api.ts:148,167` (`bedrooms: wholeNumber(4)`) — dùng bởi `src/endpoints/public/rentals.ts`; state/UI: `src/components/rentals/rental-list-state.ts:16,43`, `src/components/rentals/RentalListBody.tsx:22,36,117-122` (`FilterGroup` + chip `BEDROOM_VALUES`); chip đang lọc: `src/lib/rentals/active-filters.ts:8,11` (`ActiveFilterKind`, `KIND_ORDER`) + `src/components/rentals/use-active-filter-chips.ts:46-47`. Badge số lọc phụ (nếu đếm `bedrooms`) cũng phải đếm `bathrooms` — builder grep.
- **Tin BĐS** — `src/lib/posts/post-filters.ts` (raw type 18, `PostBedrooms`/`POST_BEDROOM_VALUES` 34, filters 57, `parseBedrooms` 107-134, `single` 146, serialize 152-167); facet/lọc: `src/lib/posts/post-list-facets.ts:33,73,119-122` (`FilterDimension`, predicate `typeof post.bedrooms === "number"`); `src/lib/posts/post-queries.ts:38,93` (select `bedrooms` — thêm `bathrooms` nếu chưa chọn); state/UI: `src/components/posts/post-list-state.ts:17,54`, `src/components/posts/PostListBody.tsx:27,98-103`.
- i18n: `src/i18n/messages/vi.json` / `en.json` — khoá `fields.bedrooms`, `bedroomsOption.*`, `active.bedrooms`, `list.filterGroups.bedrooms`, `list.bedroomsOption.*` (dòng ~312–460 vi). Thêm khoá tương ứng `bathrooms` cả VI ("Phòng tắm") và EN ("Bathrooms").
- Dữ liệu: `bathrooms` có sẵn ở `src/collections/Rentals.ts:212`, `src/collections/PropertyPosts.ts` → **không migration**. Index: chỉ thêm nếu `bedrooms` có index (đánh giá, mặc định không — giữ ngang phòng ngủ; ghi quyết định).

## Hướng làm
1. Cho thuê: thêm `bathrooms` y hệt `bedrooms` ở url-params (đọc 1–4, lạ → bỏ qua; ghi sau `bedrooms` trong thứ tự khoá), `rentalConditions` (`4` → `>= 4`, khác → `=`; NULL tự không khớp), zod API (`bathrooms: wholeNumber(4)` như `bedrooms`), list-state, `RentalListBody` (FilterGroup "Phòng tắm" ngay sau "Phòng ngủ", chip Tất cả · 1 · 2 · 3 · 4+), chip đang lọc + xoá (`KIND_ORDER` sau `bedrooms`), badge đếm nếu có. Form GET không JS: nếu `bedrooms` gửi được không JS thì `bathrooms` cũng vậy.
2. Tin BĐS: `post-filters` (raw/parse/serialize, `single`, thứ tự khoá cố định sau `bedrooms` — cập nhật comment), `post-list-facets` (dimension + predicate yêu cầu `typeof post.bathrooms === "number"`), `post-queries` select, list-state, `PostListBody` FilterGroup sau Phòng ngủ. Chip đang lọc nếu trang Tin BĐS có cơ chế chip cho `bedrooms` → thêm tương tự.
3. Phân trang / sort / "Xoá tất cả" / metadata noindex-canonical: `bathrooms` cư xử như `bedrooms` (có lọc → noindex như các lọc khác). Grep mọi nơi liệt kê khoá lọc (`"bedrooms"` trong `src/lib`, `src/components`, `src/app`) để không sót (vd list metadata, `has filters`, redirect BL-055 "chỉ có category").
4. Không đổi hành vi phòng ngủ hay lọc khác.

## Classification / Risk
- Type: **ADDITIVE** (F3/F4 thêm 1 tiêu chí lọc). Không schema/migration.
- Risk: **MEDIUM** — chạm SQL tìm kiếm Cho thuê dùng chung (trang + `GET /api/public/rentals`), API zod contract (thêm tham số tuỳ chọn), facet Tin BĐS. Reviewer: **STRICT** (API contract + shared search SQL).
- Blast radius: `/cho-thue` (+ danh mục, EN `/en/for-rent`), `/tin-bds` (+ danh mục, EN `/en/property-news`), `GET /api/public/rentals`, chip đang lọc, đếm facet, phân trang/sort; regression: bộ lọc phòng ngủ + các lọc khác, redirect BL-055, noindex/canonical.
- Doc impact (change-request reconcile): `docs/API_SPEC.md` §3.3 bảng tham số rentals + dòng "Cùng khoá với §3.3" + bảng tham số Tin BĐS (dòng ~433); `.context/design-spec.md` §3.5 / khối BL-052 "Theo màn" S04/S05/S08 (thêm Phòng tắm).

## Acceptance
- [ ] `/cho-thue` và `/tin-bds` (+ danh mục, VI/EN) có ô lọc Phòng tắm cùng kiểu với ô Phòng ngủ của trang đó: Tất cả · 1 · 2 · 3 · 4+ (4 = từ 4 trở lên).
- [ ] URL `bathrooms` đọc/ghi như `bedrooms` (giá trị lạ/0/5/abc/mảng → bỏ qua), chip đang lọc + xoá, giữ khi phân trang / đổi sort; "Xoá tất cả" dọn.
- [ ] Lọc đúng dữ liệu: `=` cho 1–3, `≥ 4` cho 4; tin `bathrooms` NULL không khớp khi đang lọc; số đếm kết quả/facet khớp.
- [ ] `GET /api/public/rentals?bathrooms=` nhận 0–4 như `bedrooms`, ngoài khoảng → 400.
- [ ] Nhãn VI/EN đủ; responsive (Sidebar ≥ lg, Sheet < lg) như ô hiện có.
- [ ] Unit test: url-params (parse + serialize), rental-search-sql (điều kiện), api zod, post-filters (parse + serialize), post-list-facets (predicate, NULL không khớp), active-filters/chip; UI test RentalListPage/PostListPage có ô + chip. Integration DB (nếu có test search Cho thuê sẵn): lọc `bathrooms` đúng + NULL không khớp.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS (lint toàn repo FAIL chỉ do `playwright-report/` → ghi rõ, chạy eslint file đổi).
- [ ] Playwright (dev server port **3100**, KHÔNG 3000; tắt sau khi đo) 1440 + 390: `/cho-thue?bathrooms=2` và `/tin-bds?bathrooms=4` có chip, kết quả đúng, đổi trang/sort giữ tham số; Sheet mobile có ô. Ảnh `.context/review-reports/assets/bl104-*.png`.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md`, `docs/**`, journal (change-request lo).
- KHÔNG đụng file dirty không thuộc change: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/endpoints/admin/*`, `src/endpoints/public/newsletter.ts`, `src/hooks/leads/*`, `src/jobs/*`, `src/lib/revalidate/*`, `src/lib/translation/*`, `tools/**`.
- KHÔNG commit, KHÔNG revert/checkout/stash. Không cài dependency mới. Không migration.

## Verification Plan
`pnpm typecheck` · `pnpm lint` · `pnpm test` (+ integration theo `.context/project-config.md`) + Playwright như Acceptance.

## Builder log

### Builder (BL-104) — 2026-11-02
**Quyết định**
- Nhân bản đúng mẫu `bedrooms`, không đổi hành vi phòng ngủ. Cho thuê: `RentalFilters.bathrooms`, khoá `bathrooms` ngay sau `bedrooms` trong `QUERY_KEYS`, tính vào `activeFilterCount` (→ huy hiệu "Bộ lọc (n)" + `hasNarrowingParams` → noindex), `RENTAL_ACTIVE_FILTER_SPEC.single`, `ActiveFilterKind`/`KIND_ORDER` (chip + bỏ chip qua nhánh `default` của `filtersWithout`), `rentalConditions` (`>= 4` / `= $n`, NULL tự không khớp), zod `bathrooms: wholeNumber(4)` (API nhận 0..4, ngoài khoảng → 400), `FilterGroup` "Phòng tắm" ngay sau "Phòng ngủ" (chip Tất cả · 1 · 2 · 3 · 4+, có `name=bathrooms` nên form GET không JS gửi được).
- URL trang `/cho-thue`: `bathrooms=0` bị bỏ (hàm `bathroomsFromUrl`) vì ô lọc chỉ có chip 1..4 và không có nhãn "0"; API vẫn nhận 0 như `bedrooms` (`= 0` đúng ngữ nghĩa, tin chưa nhập vẫn không khớp). Khoá lặp (`bathrooms=2&bathrooms=3`) lấy giá trị đầu, giống `bedrooms`.
- Tin BĐS: `post-filters` (raw/parse/serialize/`hasPostFilterParams`, thứ tự khoá sau `bedrooms`, cập nhật comment), `POST_BATHROOM_VALUES = POST_BEDROOM_VALUES` (cùng giá trị 1..4), `parseBedrooms` đổi tên `parseRoomCount` dùng chung; `post-list-facets`: hàm `matchesRoomCount` dùng chung cho phòng ngủ + phòng tắm (hành vi phòng ngủ giữ nguyên; `typeof === "number"` nên NULL không khớp), dimension `bathrooms`; `post-queries` thêm select `bathrooms` ở truy vấn quét lọc (select thẻ không cần); `PostListBody` FilterGroup sau Phòng ngủ; `POST_ACTIVE_FILTER_SPEC.single`. Trang Tin BĐS không có cơ chế chip "đang lọc" cho `bedrooms` nên không thêm chip, chỉ huy hiệu (đã đếm).
- Truy vấn Tin BĐS truyền filters qua spread (`...filters`) nên `bathrooms` tự đi vào criteria, không sửa `post-listing.ts`.
- Index: KHÔNG thêm (`bedrooms` không có index; giữ ngang phòng ngủ; bảng rentals nhỏ, đã lọc theo status/danh mục trước). Không migration.
- i18n VI/EN: `rentals.fields.bathrooms`, `rentals.bathroomsOption.{1..4}`, `rentals.active.bathrooms` ("Phòng tắm: {value}"/"Bathrooms: {value}"), `posts.list.filterGroups.bathrooms`, `posts.list.bathroomsOption.{1..4}`.

**File đổi**: `src/lib/search/url-params.ts`, `src/lib/search/rental-search-sql.ts`, `src/shared/types/api.ts`, `src/components/rentals/{rental-list-state.ts,RentalListBody.tsx,use-active-filter-chips.ts}`, `src/lib/rentals/active-filters.ts`, `src/lib/posts/{post-filters.ts,post-list-facets.ts,post-queries.ts}`, `src/components/posts/{post-list-state.ts,PostListBody.tsx}`, `src/i18n/messages/{vi,en}.json`.
**File mới**: không (ngoài 5 ảnh `.context/review-reports/assets/bl104-*.png`).
**Test**: sửa/thêm `src/lib/search/url-params.test.ts` (parse/serialize/round-trip/count/noindex), `src/lib/search/rental-search-sql.test.ts` (điều kiện `>= 4` / `= $n` / không truyền), `src/shared/types/api.test.ts` (0..4 OK; 5/-1/1.5/abc → từ chối), `src/lib/rentals/active-filters.test.ts` (thứ tự chip + bỏ chip), `src/components/rentals/rental-filter-params.test.tsx`, `src/components/rentals/RentalListPage.test.tsx` (ô Phòng tắm VI/EN, URL → SearchService, huy hiệu 10, form GET có `bathrooms`, gợi ý bỏ điều kiện có chip "Phòng tắm: 4+" và href bỏ đúng một chip), `src/lib/posts/post-filters.test.ts`, `src/lib/posts/post-listing-queries.test.ts` (predicate 1–3 đúng, 4 = ≥ 4, NULL bị loại, kết hợp phòng ngủ), `src/components/posts/PostListPage.test.tsx` (nhóm lọc VI/EN, URL → loader, link phân trang/tab giữ `bathrooms`, radio checked ở form không JS), integration `tests/integration/rental-search.test.ts` (seed thêm bathrooms; lọc 1/2/3/4, NULL không khớp; `bathrooms=5|-1` → 400).

**Verify**
- `pnpm typecheck` PASS. `pnpm lint` PASS toàn repo (lần này không lỗi `playwright-report/`). `pnpm test` (unit + ui + integration, DB test có sẵn): 461 files / 4863 tests PASS; `tests/integration/rental-search.test.ts` chạy riêng 55/55 PASS (không skip).
- Playwright (Edge) 1440 + 390: `/cho-thue?bathrooms=2` 11 căn, ô Phòng tắm chọn "2", huy hiệu, `noindex`, không h-scroll; Sheet mobile có ô Phòng tắm; `/tin-bds?bathrooms=2` 1 tin ("Bán căn Kosmo", đúng); `/en/for-rent?bathrooms=2` nhãn "Bathrooms". API thật: `bathrooms=2|4|0` 200, `bathrooms=5` 400. Ảnh: `.context/review-reports/assets/bl104-{rent-bath2-1440,rent-bath2-390,post-bath2-1440,post-bath2-390,rent-en-1440}.png`.

**Residual**
- Playwright chạy trên dev server cổng 3000 (CHỈ đọc/GET, không tắt, không đổi gì), KHÔNG phải 3100: `next dev -p 3100` bị Next từ chối ("Another next dev server is already running", PID 10148, cùng thư mục, khoá `.next/dev`); không tự kill server đó. Browser pane của harness cũng bị từ chối localhost nên dùng Playwright/Edge qua Node (script tạm đã xoá).
- Dữ liệu dev không có tin `bathrooms >= 4` (kết quả `bathrooms=4` = 0 tin, không có ảnh) nên "4+ = ≥ 4" chỉ được chứng minh bằng unit + integration. Dữ liệu dev ít (11 căn < 12/trang, 1 tin BĐS) nên không có trang 2 để bấm; giữ tham số khi phân trang/đổi sort chứng minh bằng unit (link phân trang + tab + round-trip).
- Trang Tin BĐS không có chip "đang lọc" nên acceptance "chip + xoá" chỉ áp cho Cho thuê (chip hiện ở gợi ý bỏ điều kiện của trạng thái rỗng); Tin BĐS dùng "Xoá tất cả" + huy hiệu.
- Doc impact (để change-request reconcile, builder không sửa): `docs/API_SPEC.md` §3.3 + bảng tham số Tin BĐS; `.context/design-spec.md` §3.5 / khối BL-052.

## Verification summary
- Acceptance criteria: PASS (chip đang lọc chỉ ở /cho-thue — /tin-bds không có chip cho cả phòng ngủ; spec 1.62.0 ghi rõ).
- Verify commands + result: `pnpm typecheck` PASS · `pnpm lint` PASS · `pnpm test` PASS (461 files / 4863 tests, gồm integration DB) · reviewer chạy lại 10 file test 230/230 PASS · sau MINOR 1/2 (change-request): eslint 2 file + tsc + 63 test PASS.
- Reviewer verdict: STRICT PASS r1 (4 MINOR: 1 comment + 2 hằng trùng → đã sửa; 3 `bathrooms=0` trang bỏ / API nhận → ghi API_SPEC + spec; 4 Playwright chạy :3000 vì :3100 bị khoá bởi dev server sẵn có, chỉ GET).
- Spec Validator: PASS phase 1 (G1 test-scope file list → đã sửa; N1 làm rõ spec trang 1–4 / API 0–4 → đã sửa; N3 wording design-spec → đã sửa).
- Residual: dev không có tin ≥ 4 phòng tắm và chỉ 1 trang kết quả → "4+" + giữ tham số khi phân trang/sort chỉ chứng minh bằng unit/integration.
