# Agent: reviewer — feature-homepage-redesign · phase-1-task-00 · round-1

- Task: `tasks/feature-homepage-redesign/phase-1-task-00.md` (BL-044 T00 — `rentals.amenities` + bộ lọc Tiện ích `/cho-thue` + API + chi tiết tin + seed dev)
- Date: 2026-10-20
- **Review level: STRICT**
- **Reason:** đụng schema/migration (`rentals_amenities` + enum ×2 + bảng version), contract API công khai `GET /api/public/rentals` (`rentalSearchParamsSchema`), SQL search dùng chung (`rental-search-sql.ts`), shared filter UI (FilterFields/Popover/Sheet/ActiveFilters), seed script ghi DB.
- **Blast radius:** admin form Tin cho thuê (field mới + "Thêm bộ lọc"); `/cho-thue`, `/cho-thue/danh-muc/*`, `/cho-thue/khu-vuc/*`, `/en/for-rent*`; `GET /api/public/rentals` (count path Sheet + mọi client); chi tiết tin (`RentalDetails`); `payload-types.ts`; migration `20261020_095907_rentals_amenities`; `docs/API_SPEC.md` §3.3, `docs/ERD.md` §rentals.

## Verify commands + result (từ `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/search src/lib/rentals src/components/rentals src/shared src/lib/admin` | 20 files / 223 tests PASS |
| `pnpm vitest run tests/integration/rental-search.test.ts` | 38 PASS (DB dev có sẵn; case AND / lạ bị bỏ / GET 200 chạy thật) |
| `pnpm vitest run no-raw-colors` | 21 PASS (không hex/màu mới) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` (toàn bộ) | không chạy lại (builder báo 301 files / 3164 PASS); subset liên quan + integration đã tự chạy |
| curl SSR `GET /cho-thue?amenities=pool,gym` (server :3000 đang chạy) | 200; "Có 4 kết quả"; hidden input `name="amenities" value="pool,gym"`; 2 link "Bỏ lọc Tiện ích: Hồ bơi / Phòng gym"; "Bộ lọc (2)" |
| curl SSR `GET /en/cho-thue?amenities=pool,gym` → 301 → `/en/for-rent?amenities=pool%2Cgym` | 200; "Remove filter Amenity: Swimming pool / Gym"; "Filters (2)" |
| curl API `?amenities=pool,gym` / `?amenities=pool` / `?amenities=khong-co` / không lọc | total 5 / 10 / 30 / 30 → AND đúng, giá trị lạ = không lọc, 200 |
| curl API `?amenities=pool&amenities=gym` | **total 10 = chỉ `pool`** (khoá lặp lấy giá trị đầu — xem Finding M1) |
| curl API `?amenities=pool,gym&furnishing=x` | 400 (giữ nguyên hành vi `furnishing`) |

## Checklist theo yêu cầu

1. **Migration** — OK. `migrations/20261020_095907_rentals_amenities.ts`: `up` chỉ `CREATE TYPE` ×2, `CREATE TABLE` ×2, `ADD CONSTRAINT FK` mới (cascade), `CREATE INDEX` ×6; `down` chỉ DROP đúng 2 bảng + 2 type mới. Đã vào `migrations/index.ts:32,190-194`. Không DROP/ALTER cột cũ → **không `HIGH_RISK_MIGRATION`**. Tên bảng/cột `rentals_amenities(parent_id, value)` trong SQL (`rental-search-sql.ts:69-71`) khớp migration. Index: `rentals_amenities_parent_idx` + `rentals_amenities_value_idx` (riêng lẻ, không composite) — đủ cho `EXISTS … parent_id = r.id AND value = $n` ở quy mô hiện tại.
2. **SQL injection / AND / không ảnh hưởng khi không truyền** — OK. Giá trị đi qua `sql\`…${amenity}\`` tagged (`rental-search-sql.ts:70`), và đã whitelist bằng `z.enum(RENTAL_AMENITIES)` trước đó (`api.ts:136`). Mỗi tiện ích 1 `EXISTS` nối AND; test `rental-search-sql.test.ts:48-53` chứng minh 2 EXISTS + params + không có `rentals_amenities` khi không truyền. Integration `tests/integration/rental-search.test.ts:330-338` xác nhận AND thật trên DB.
3. **API contract** — OK phần zod/parse (`api.ts:126-139`: tách phẩy/mảng, lọc enum, bỏ trùng, sort theo `RENTAL_AMENITIES`, toàn lạ → `undefined`; `amenities: 42` → 400). `parseRentalFilters`, `toRentalSearchParams`, `rentalCountApiPath` dùng chung schema (`url-params.ts:45-49,153-161`, test `url-params.test.ts:175-178`). Decision 10 đã ghi. **Lệch:** `docs/API_SPEC.md:113` ghi "phân cách dấu phẩy (hoặc khoá lặp)" nhưng endpoint HTTP `src/endpoints/public/rentals.ts:17-18` chỉ lấy giá trị đầu của khoá lặp → curl xác nhận `amenities=pool&amenities=gym` = `pool` (10 ≠ 5). → **M1**.
4. **UI `/cho-thue`** — OK. `FilterFields.tsx:190-199` dùng `Chip` sẵn (`FilterFields.tsx:33-41`: `aria-pressed`, `min-h-11 min-w-11` = 44px); Popover/Sheet dùng cùng `FilterDraft.amenities` (`use-rental-draft.ts:18,37`), Sheet `CLEARED`/`secondaryPatch` có `amenities` (`RentalFilterSheet.tsx:29-34`); ActiveFilters mỗi tiện ích 1 chip bỏ riêng (`active-filters.ts:40-51`, `ActiveFilters.tsx:29-30`); badge đếm mỗi tiện ích 1 (`url-params.ts:106-121`); form GET không JS giữ `amenities=pool,gym` qua `preservedParams` (SSR HTML xác nhận); `/en` nhãn EN đúng; `no-raw-colors` PASS.
5. **Chi tiết tin** — OK. `rental-view.ts:50-51,167` (`amenities: doc.amenities ?? []`), `RentalSpecs.tsx:48-55` ẩn khi rỗng; nhãn một nguồn `page.rentals.amenityOption.*` (admin VI riêng ở `AMENITY_LABELS`, chấp nhận vì admin không qua next-intl).
6. **Seed dev** — OK. `scripts/seed-rental-amenities.ts`: bỏ qua tin đã có tiện ích (idempotent), `checkSeedEnvironment` chặn `NODE_ENV=production` / thiếu `DATABASE_URL` / trùng `DATABASE_URL_STAGING|PROD` (đúng tên env trong project-config), exit 1; chỉ chạy qua `pnpm seed:rental-amenities` (không nằm trong build/CI). Logic chọn tiện ích thuần + test `sample-amenities.test.ts`.
7. **Admin** — OK. `Rentals.ts:49-60,201-202`: label "Tiện ích", nhãn VI từng option, cạnh `furnishing`, không đụng `includedServices`; `list-filter.test.ts:31` cập nhật expectation (field nghiệp vụ, hợp lý).
8. **Test** — OK. Test mới phủ parse/serialize/đếm (`url-params.test.ts`), schema (`api.test.ts`), SQL, active-filters, view, Popover chip (`RentalFilters.test.tsx:296-313`), SSR list (`RentalListPage.test.tsx:261-267`), integration AND/lạ/GET 200, seed env/pure. Tự chạy lại: PASS.
9. **aislop/anti-slop/karpathy** — không có `as any`, không dead code (trừ `default: return ""` — m3), không fallback ẩn; comment ngắn giải thích WHY. Drive-by: 2 dòng whitespace ở `docs/API_SPEC.md` (m2).
10. **Doc impact** — `docs/ERD.md:267` as-built đúng; `docs/API_SPEC.md:113` có 1 câu sai (M1). Không sửa intent doc.

## Responsive Checklist Gate (diff đụng UI: fieldset chip trong Popover/Sheet, hàng `<dl>` chi tiết)

Không có browser; xác minh bằng class/CSS + SSR HTML. Chỉ phần trong diff.

- Layout: **OK** — fieldset `flex min-w-0 flex-col`, chip `flex flex-wrap gap-2` (`FilterFields.tsx:190-192`) → wrap ở 375/768/1280, không cột cố định, không `px` fixed-width.
- Typography/Spacing: **OK** — dùng token `text-small`, `gap-2/gap-5`, không font-size px mới.
- Media: **N/A** — không thêm ảnh/video.
- Touch/Interaction: **OK** — `Chip` `min-h-11 min-w-11` (44px), `aria-pressed`; test `RentalFilters.test.tsx:303` kiểm `min-h-11`. Nằm trong Sheet (<lg) / Popover (≥lg) sẵn có.
- Viewport/A11y: **OK** — không `100vh`, không `overflow:hidden` mới; `prefers-reduced-motion` không liên quan (không animation mới).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — `aislop` không cài trên máy (`command not found`); tự soát tay mục 9: không narrative comment, không dead code ngoài m3 |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); `pnpm lint` 0 error |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — tên rõ (`parseAmenityList`, `amenityOfKind`, `sampleAmenitiesFor`, `checkSeedEnvironment`), hàm < 50 dòng, không magic number (có `MIN/MAX_AMENITIES`), doc as-built cập nhật; 0/6 indicator |
| ai-friendly-web | N/A — không đổi `llms.txt`/`robots`/`sitemap`; tham số lọc mới đã được `hasNarrowingParams` đưa về noindex (`url-params.test.ts:146`) |
| blitzstrike | skip — không cài; input đã whitelist enum + tham số hoá SQL (mục 2) |

## Findings

### [MAJOR]
- **M1 — `docs/API_SPEC.md:113` hứa "hoặc khoá lặp" nhưng endpoint HTTP không hỗ trợ.** `src/endpoints/public/rentals.ts:17-18` chỉ giữ giá trị đầu cho khoá lặp (`if (!(key in raw))`), nên `GET /api/public/rentals?amenities=pool&amenities=gym` lọc theo `pool` thôi (curl: 10 ≠ 5), trả 200 → client theo doc nhận kết quả sai âm thầm. Trang `/cho-thue` (parser `readParam`) thì nhận cả mảng → 2 đường hiểu URL khác nhau, trái yêu cầu "nhất quán route API / parser trang / count path". Builder đã biết (Verification summary mục 5) nhưng doc vẫn ghi ngược.
  **Fix (chọn 1):** (a) sửa `docs/API_SPEC.md:113` thành "phân cách dấu phẩy; khoá lặp chỉ lấy giá trị đầu (dạng chuẩn `a,b`; trang `/cho-thue` còn nhận khoá lặp cho form không JS)"; hoặc (b) ở `rentals.ts:17-18` gộp `searchParams.getAll("amenities")` thành mảng rồi để `parseAmenityList` xử lý (+ 1 case GET trong integration test). Khuyến nghị (a) — ít đụng code, khớp Decision 10.

### [MINOR]
- **m2 — Drive-by whitespace** `docs/API_SPEC.md:199,207` (2 dòng `POST /api/admin/translations…` và as-built lead-assign chỉ đổi trailing whitespace; `git diff --ignore-all-space` còn 1 dòng). Fix: bỏ 2 hunk này khỏi commit (`git add -p`).
- **m3 — `default: return ""` không thể tới** `src/components/rentals/ActiveFilters.tsx:48-49`: `amenityOfKind` đã xử lý nhánh amenity trước `switch`, nên `default` chỉ để thoả kiểu. Fix: thu hẹp kiểu đầu vào của `switch` (vd `kind as Exclude<ActiveFilterKind, AmenityFilterKind>` sau guard, hoặc tách `groupKindName(kind: GroupKind)`) để giữ exhaustive check thay vì fallback rỗng.
- **m4 — Kiểu trả về `parseAmenityList`** `src/shared/types/api.ts:129`: `RentalAmenity[] | undefined | unknown` rút gọn thành `unknown`, chú thích kiểu gây hiểu nhầm. Fix: ghi `: unknown` (preprocess trả unknown là đủ).
- **m5 — Seed cập nhật qua `payload.update` không `draft`** `scripts/seed-rental-amenities.ts:21`: chạy hook afterChange (revalidate, reindex search text) cho mọi tin dev, kể cả tin xoá mềm/nháp; chấp nhận với DB dev (comment đã nêu), nhưng nên ghi rõ trong log số tin nháp/xoá mềm bị đụng hoặc lọc `deletedAt` để seed dự đoán được. Không chặn.

## Residual risk
- Chưa chụp màn 375/768/1280 bằng browser (không có môi trường); xác minh bằng class Tailwind + SSR HTML.
- `pnpm test` toàn bộ không chạy lại (dựa subset + integration + lời builder).
- Không chạy `pnpm payload migrate` lại (DB dev đã ở trạng thái sau migration; integration test PASS chứng tỏ bảng tồn tại).

## Verdict: ❌ FAIL (1 MAJOR — M1, sửa doc 1 câu hoặc endpoint 1 dòng; còn lại MINOR)
