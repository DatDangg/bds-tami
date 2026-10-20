# feature-homepage-redesign · phase-1-task-00 — Tin cho thuê: trường `amenities` + bộ lọc "Tiện ích" trên `/cho-thue` + API + seed dev (BL-044 Q1)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BL-044). Spec: `SPECIFICATIONS.md` F3 đoạn "**Tiện ích (BL-044…)**" + F1 "Tùy chọn khác".
- **Lý do tách task riêng (không gộp T01):** khác domain (collection `rentals` + `GET /api/public/rentals` + trang `/cho-thue` = F3/API_SPEC) với blast radius riêng (search SQL, `QUERY_KEYS`, FilterFields/Popover/Sheet, ActiveFilters, zod schema API); T01 chỉ cần tham số `amenities` tồn tại. Chạy **trước T01** (T01 → T02 → T03 sau).
- User chốt 2026-10-20: "bộ lọc này ăn theo tiện ích… hiện chưa có nhiều nên cần mock data" → lọc thật, seed dev.
- Trạng thái: `pending` (plan đã duyệt).

## Classification / Risk
- Type: **ADDITIVE** (field + tham số lọc mới; không đổi hành vi cũ khi không truyền `amenities`).
- Risk: **MEDIUM–HIGH** — schema collection `rentals` (migration additive: bảng `rentals_amenities` hasMany select + enum), SQL search dùng chung (`rental-search-sql.ts`), contract API công khai (`rentalSearchParamsSchema`), `searchText` không đổi.
- Expected review level: **STRICT** (schema/migration + API contract + shared filter).
- Blast radius: admin form Tin cho thuê; `/cho-thue` + `/cho-thue/danh-muc/*` + `/cho-thue/khu-vuc/*` (+ `/en`); `GET /api/public/rentals`; chi tiết tin (`RentalSpecs`); tests `url-params.test.ts`, `rental-search-sql`/`search-service` tests, `active-filters.test.ts`, `RentalFilters.test.tsx`, `rental-filter-params.test.tsx`, `RentalListPage.test.tsx`, `rental-view.test.ts`, `tests/integration/*rentals*`.
- Doc impact: `docs/API_SPEC.md` (tham số `amenities`), `docs/ERD.md` §rentals (field mới) — reconcile ở close-out T00; design-spec §3.5 (lọc phụ thêm Tiện ích) — T03 reconcile chung.

## Scope / files
1. **Collection** `src/collections/Rentals.ts`: `export const RENTAL_AMENITIES = ["pool","gym","elevator","parking","security","balcony","washing_machine","air_conditioner","pet_friendly","kitchen"] as const` (+ `AMENITY_LABELS` VI cho admin, kiểu `selectOptions` như `FURNISHINGS`:186); field `{ name: "amenities", type: "select", hasMany: true, index: true, label: "Tiện ích" }` đặt cạnh `furnishing` (nhóm thông số); KHÔNG đụng `rentalTerms.includedServices`. Đưa `RENTAL_AMENITIES` vào `src/shared/types/api.ts` (cạnh `RENTAL_FURNISHINGS`:117) để client/zod dùng chung; `rentalSearchParamsSchema` thêm `amenities: optional(z.array(z.enum(RENTAL_AMENITIES)))` (nhận chuỗi `a,b` → tách, bỏ giá trị lạ); `RentalCard` type thêm `amenities` nếu `RentalSpecs` cần (chi tiết tin đọc từ doc — chỉ thêm vào view chi tiết, không bắt buộc đưa vào card).
2. **Migration**: `pnpm payload migrate:create rentals_amenities` → `migrations/<ts>_rentals_amenities.{ts,json}`; inspect chỉ CREATE TABLE/TYPE/INDEX (không DROP/đổi type) → nếu destructive dừng + `HIGH_RISK_MIGRATION`. `pnpm payload migrate` dev; regen `payload-types.ts` (file đang dirty bởi việc khác — chỉ regen, không sửa tay).
3. **URL/search**: `src/lib/search/url-params.ts` — `QUERY_KEYS` + `RentalFilters.amenities?: string[]`, parse (`amenities=a,b`, lọc theo enum, bỏ trùng, sort ổn định), `rentalListQueryString` ghi `amenities=a,b`, `activeFilterCount`/`secondaryFilterCount` đếm (1 cho cả nhóm hay mỗi tiện ích — chọn **mỗi tiện ích 1** để badge khớp số chip ActiveFilters), `toRentalSearchParams`, `rentalCountApiPath`. `src/lib/search/rental-search-sql.ts:67` thêm điều kiện AND: mỗi tiện ích → `EXISTS (SELECT 1 FROM rentals_amenities ra WHERE ra.parent_id = r.id AND ra.value = ${a})` (kiểm tên bảng/cột thật trong migration json Payload sinh; dùng `sql` tagged như hiện có, không nối chuỗi). `search-service.ts` không đổi select trừ khi cần.
4. **UI `/cho-thue`**: `src/components/rentals/use-rental-draft.ts` (draft `amenities: string[]`), `FilterFields.tsx` thêm fieldset "Tiện ích" chip chọn nhiều (`Chip` sẵn có `aria-pressed`) sau Nội thất; `RentalFilterPopover`/`RentalFilterSheet` không đổi ngoài draft; `src/lib/rentals/active-filters.ts` thêm kind `amenities` (một chip/tiện ích, bỏ từng cái); `ActiveFilters.tsx`; i18n `page.rentals.fields.amenities`, `page.rentals.amenityOption.<key>` (vi + en, 10 khoá), `page.rentals.detail.amenities` cho `RentalSpecs`. Form GET không JS: `amenities` là checkbox group → nhiều giá trị `amenities=a&amenities=b` → parser nhận cả mảng lẫn chuỗi phẩy.
5. **Chi tiết tin** `src/components/rentals/RentalSpecs.tsx` + `src/lib/rentals/rental-view.ts`: hàng "Tiện ích" liệt kê nhãn i18n (trống → ẩn).
6. **Seed dev** `scripts/seed-rental-amenities.ts` + `package.json` script `seed:rental-amenities` (`payload run`): gán 2–5 tiện ích ngẫu nhiên-ổn định (theo id hash) cho mọi tin `rentals` **chưa có** tiện ích; idempotent; in số tin đã gán; **từ chối chạy** khi `NODE_ENV=production` hoặc `DATABASE_URL` khớp `DATABASE_URL_STAGING`/`DATABASE_URL_PROD` (đọc tên env từ `.context/project-config.md`). Chạy 1 lần trên DB dev localhost cho T01/T03 so khớp. Không commit dữ liệu.
7. **Tests**: `url-params.test.ts` (parse/serialize/đếm), SQL test hiện có (thêm case amenities AND), `active-filters.test.ts`, `RentalFilters.test.tsx` (chip chọn nhiều → URL), `rental-filter-params.test.tsx`, `RentalListPage.test.tsx` (ActiveFilters hiện tiện ích), `rental-view.test.ts`, test integration API (`amenities` lạ bị bỏ, không 400 — thống nhất với cách xử lý `furnishing` sai hiện tại: kiểm `api.ts:140` → nếu zod enum fail → 400 thì tiện ích lạ cũng 400, ghi rõ chọn gì và vì sao), seed script test logic chọn tiện ích thuần (hàm pure).

## Acceptance
- [ ] Admin Tin cho thuê có ô "Tiện ích" chọn nhiều; lưu/sửa OK; migration additive PASS.
- [ ] `/cho-thue?amenities=pool,gym` chỉ ra tin có **cả** hai; `ActiveFilters` hiện 2 chip bỏ được từng cái; badge "Bộ lọc" đếm đúng; Popover/Sheet chọn → URL đúng; không JS gửi được.
- [ ] `GET /api/public/rentals?amenities=…` đếm/tìm đúng; giá trị lạ xử lý nhất quán với `furnishing`.
- [ ] Chi tiết tin hiện hàng Tiện ích; không tiện ích → ẩn.
- [ ] Seed dev gán tiện ích cho tin dev, chạy lại không đổi; chặn staging/prod.
- [ ] Không đổi hành vi khi không truyền `amenities` (test hiện có PASS nguyên); `pnpm test`/`typecheck`/`lint` PASS; AA, chip vùng chạm ≥ 44px.

## Verify
`pnpm vitest run src/lib/search src/lib/rentals src/components/rentals tests/integration` → `pnpm typecheck` → `pnpm lint` → `pnpm payload migrate` → `pnpm seed:rental-amenities` (dev) → xem http://localhost:3000/cho-thue (không chạy thêm dev server) ở 1280 + 390.

## Retry / Escalation
3 attempt → `architecture_review_needed`; mỗi fail append `.context/error-memory.md`; đổi API contract → append `.context/decisions.md`.

## Verification summary (builder điền 2026-10-20)

**Acceptance (builder):**
- [x] Admin Tin cho thuê có ô "Tiện ích" chọn nhiều (`Rentals.ts` field `amenities` hasMany select, index, cạnh `furnishing`); lưu qua `payload.update` trong seed + integration test OK; migration additive PASS (`pnpm payload migrate` dev). Trường xuất hiện trong "Thêm bộ lọc" admin (cập nhật `list-filter.test.ts`).
- [x] `/cho-thue?amenities=pool,gym`: dev server trả "Có 4 kết quả" (⊂ `pool`=8 ⊂ `gym`=10 → AND); `ActiveFilters` 2 chip "Bỏ lọc Tiện ích: Hồ bơi/Phòng gym" trỏ URL bỏ từng cái; badge "Bộ lọc (2)"; Popover chip chọn nhiều → URL `amenities=pool%2Cgym` (RentalFilters.test); Sheet qua `secondaryPatch`/`CLEARED`; không JS: form GET giữ `amenities` qua hidden input `preservedParams` (`name="amenities" value="pool,gym"` trong HTML SSR).
- [x] `GET /api/public/rentals?amenities=…`: `pool,gym`→4, `pool,khong-co`→8 (lạ bị bỏ, 200), `khong-co`→27 (= không lọc), `furnishing=x` vẫn 400. Integration test AND/lạ PASS trên DB tạm.
- [x] Chi tiết tin hiện hàng "Tiện ích: Hồ bơi, Phòng gym" (RentalDetails `<dl>`); `amenities` rỗng → không có hàng (rental-view.test).
- [x] Seed dev: lần 1 gán 32/32, lần 2 gán 0/32 (idempotent); `NODE_ENV=production` → từ chối exit 1; trùng `DATABASE_URL_STAGING`/`PROD` → từ chối (unit test `checkSeedEnvironment`).
- [x] Không truyền `amenities` → SQL không có `rentals_amenities` (test); toàn bộ test cũ PASS nguyên. Chip dùng `Chip` sẵn (`min-h-11` ≥ 44px, `aria-pressed`), không màu mới.

**Verify commands + result:** `pnpm vitest run src/lib/search src/lib/rentals src/components/rentals src/shared` → 14 files / 188 PASS · `pnpm vitest run tests/integration/rental-search.test.ts` → 38 PASS · `pnpm test` → 301 files / 3164 PASS (sau khi cập nhật expectation `list-filter.test.ts`) · `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ `tools/task-dashboard/server.mjs`, ngoài scope) · `pnpm payload migrate` dev PASS · `pnpm seed:rental-amenities` dev PASS ×2 · oxlint: repo không có config → skip.

**Migration inspect:** `migrations/20261020_095907_rentals_amenities.ts` — `up`: CREATE TYPE ×2 (`enum_rentals_amenities`, `enum__rentals_v_version_amenities`), CREATE TABLE `rentals_amenities` + `_rentals_v_version_amenities` (`order`, `parent_id`, `value`, `id`), ADD CONSTRAINT FK mới (cascade), CREATE INDEX ×6. Không DROP/đổi type/SET NOT NULL trên bảng/cột cũ → **không HIGH_RISK_MIGRATION**. `down` chỉ DROP bảng/type mới tạo.

**Lựa chọn thiết kế:** (1) Giá trị `amenities` lạ **bị bỏ** (không 400) theo spec F3, khác `furnishing` — ghi `.context/decisions.md` Decision 10 + `docs/API_SPEC.md`. (2) Mỗi tiện ích đếm 1 trong badge (khớp số chip). (3) `ActiveFilterKind` thêm dạng `amenity:<key>` (một chip/tiện ích, bỏ riêng). (4) Nhãn tiện ích công khai một nguồn `page.rentals.amenityOption.*` (chi tiết tin dùng chung; nhãn admin VI ở `AMENITY_LABELS`). (5) Parser trang nhận cả mảng (`amenities=a&amenities=b`) lẫn `a,b`; endpoint API giữ luật "khoá lặp lấy giá trị đầu" (dạng chuẩn là `a,b`).

**Residual risk:** Chưa chụp màn 390/1280 bằng browser (dev server của session khác; kiểm bằng curl HTML SSR) — chip Tiện ích dùng đúng component `Chip`/fieldset như Nội thất nên bố cục đồng nhất. Reviewer verdict round 1: FAIL (M1 + m2–m5, `.context/review-reports/feature-homepage-redesign-phase-1-task-00-round-1-review.md`).

**Round 2 (builder 2026-10-20, sửa đúng finding r1):**
- M1: `src/endpoints/public/rentals.ts` gộp `searchParams.getAll("amenities")` thành mảng (khoá khác giữ "lặp lấy giá trị đầu") → `?amenities=pool&amenities=gym` ≡ `?amenities=pool,gym`. Test: unit `src/endpoints/public/rentals.test.ts` (khoá lặp + trùng + lạ == dạng phẩy) + integration `tests/integration/rental-search.test.ts` (GET khoá lặp total == dạng phẩy). `docs/API_SPEC.md` §3.3 và Decision 10 (Consequences) ghi luật mới; mục (5) "Lựa chọn thiết kế" ở trên không còn đúng — endpoint nay gộp khoá lặp cho `amenities`.
- m2: khôi phục 2 dòng whitespace `docs/API_SPEC.md:199,207` từ HEAD (diff file còn đúng 1 dòng thêm).
- m3: `ActiveFilters.tsx` tách `groupName(kind: Exclude<ActiveFilterKind, AmenityFilterKind>)` switch kín, bỏ `default: return ""`.
- m4: `parseAmenityList(value: unknown): unknown`.
- m5: seed `where: { deletedAt: { exists: false } }`, sửa comment (rentals không bật draft).
- Verify: `pnpm vitest run src/lib/search src/lib/rentals src/components/rentals src/shared src/endpoints/public/rentals.test.ts tests/integration/rental-search.test.ts` → 16 files / 233 PASS · `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ) · curl dev `:3000/api/public/rentals`: `amenities=pool&amenities=gym` → total 5 = `amenities=pool,gym` → 5 (trước fix 10 = chỉ `pool`); `amenities=pool` → 10.
