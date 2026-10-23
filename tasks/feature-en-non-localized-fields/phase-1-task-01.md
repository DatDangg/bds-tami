# feature-en-non-localized-fields · phase-1-task-01 — Chuẩn hoá `rentals.floor` + `projects.nearbyAmenities.distance` (mã + số, nhãn theo ngôn ngữ) + migration additive chuyển dữ liệu cũ

- Nguồn: BL-065 · change doc `spec/changes/2026-10-23-en-non-localized-fields.md` (mục "Quyết định (user 2026-10-23): cách (c)") · spec delta đã ghi trong `SPECIFICATIONS.md` (3 dòng "BL-065": F2 khoảng cách, F3 tầng, F12 quy ước) — ĐỌC 3 dòng đó, đó là hợp đồng.
- Làm ở **checkout chính** (không worktree): cần dev DB + dev server đang chạy http://localhost:3000 (PID 31392) — KHÔNG start server mới, KHÔNG kill server đó.
- **AUTO PROCEED**: user đã chốt cách làm. Chỗ mơ hồ nhỏ → chọn phương án đơn giản nhất, ghi vào Verification summary. **DỪNG + báo lại** (không tự làm) nếu thấy buộc phải DROP cột / đổi type cột có data / sửa-xoá giá trị cũ.

## Classification / Risk
- Type: **MODIFY** (F2 + F3 + F12). Có schema + migration + data backfill.
- Risk: **MEDIUM-HIGH** + **HIGH_RISK_MIGRATION** (chỉ do backfill 4 bảng; additive, idempotent, rollback = `down`; bắt buộc chạy + verify trên staging, đo thời gian backfill, trước khi promote prod) — DB/schema/migration (2 collection có versions/drafts), shape REST/GraphQL `rentals` + `projects` đổi (thêm trường).
- Expected review level: **STRICT** (DB/schema/migration).
- Migration policy: **additive only** — `ADD COLUMN` nullable + `CREATE TYPE` enum mới + backfill **chỉ ghi vào cột mới**. Cột cũ `rentals.floor`, `_rentals_v.version_floor`, `projects_nearby_amenities.distance`, `_projects_v_version_nearby_amenities.distance` **giữ nguyên, không UPDATE, không DROP**. `down` = DROP cột mới + DROP enum mới (chỉ mất dữ liệu dẫn xuất / dữ liệu nhập sau migration — ghi rõ trong comment).

## Hiện trạng (file:line — không spawn Explore)
- `src/collections/Rentals.ts:188` `{ name: "floor", type: "text", label: "Tầng" }` trong `formRow` cạnh `areaM2`.
- `src/collections/projects/market-blocks.ts:89` `{ name: "distance", type: "text", label: "Khoảng cách", admin.description "Ví dụ: 1,2 km hoặc 5 phút. Không dịch." }` trong `nearbyAmenitiesField`.
- View: `src/lib/rentals/rental-view.ts:45,161` (`floor: string | null`), render `src/components/rentals/RentalDetail.tsx:82` (`t("details.floor")`); `src/lib/projects/project-detail-view.ts:84,256` (`distance: string | null`), render `src/components/projects/ProjectLocation.tsx:63` → `src/components/detail/DetailDistanceList.tsx:13,45`.
- Seed: `scripts/seed-scraped.ts:410` `floor: r.info["Tầng"]` (từ `seed/scraped-cache/*.html`, vd "Tầng cao"). `.local-seed/seed-sample-project-blocks.ts:64-104` (gitignored qua `.git/info/exclude`, chỉ cập nhật local, KHÔNG commit) ghi `distance` "15 phút"/"1,2 km"/"800 m". `seed/english/data/*.json` không chứa floor/distance (trường không localized) — xác nhận lại bằng Grep, nếu đúng thì ghi "no seed/english impact".
- Migration style: `migrations/20261023_020647_leads_source_popup.ts` (+ `.json` snapshot, `migrations/index.ts`). `src/payload.config.ts` `push: false`.
- Dữ liệu dev hiện có (đã query): `rentals.floor`: NULL 13 · "Tầng cao" 11 · "Tầng 3" 2 · "Tầng 2"/"Tầng 4"/"Tầng 7"/"Tầng thấp"/"Tầng trung" 1 · **"3.4.5.6" 1**; `_rentals_v.version_floor` cùng tập giá trị (×versions; "3.4.5.6" 5 dòng). `projects_nearby_amenities.distance` (61 dự án × 8): "1,2 km" "1,8 km" "2,5 km" "800 m" "500 m" "400 m" "300 m" "15 phút"; `_projects_v_version_nearby_amenities` 209 × 8 cùng tập giá trị.

## Thiết kế (chốt)
1. **Parser thuần dùng chung** (1 nguồn sự thật, unit test kỹ) — vd `src/lib/units/legacy-parse.ts` (đặt tên theo convention repo):
   - `parseLegacyFloor(text)`: trim, không phân biệt hoa thường; `^Tầng\s+(cao|trung|thấp)$` → `{ level: high|mid|low }`; `^Tầng\s+(\d+)$` → `{ number: N }`; rỗng/null → `empty`; khác → `unparsed` (không đoán: "3.4.5.6", "Tầng trệt", "12" trần đều unparsed — chỉ nhận đúng 2 dạng đã có trong data).
   - `parseLegacyDistance(text)`: `^(\d+(?:[.,]\d+)?)\s*(km|m|phút)$` (i) → `{ value, unit: km|m|min }` (dấu phẩy thập phân → chấm); khác → `unparsed`.
2. **Schema (Payload):**
   - Rentals: `floorLevel` select (`high`/`mid`/`low`, nhãn admin "Tầng cao"/"Tầng trung"/"Tầng thấp", label "Mức tầng", tuỳ chọn) + `floorNumber` number (label "Số tầng", `min: 0`, số nguyên — validate), bố cục gọn trong form. Field `floor` cũ giữ (cùng tên → cùng cột, không đổi DB), đổi label "Tầng (giá trị cũ)", admin `condition`: chỉ hiện khi có giá trị cũ VÀ chưa có `floorLevel` lẫn `floorNumber`; description "Giá trị cũ chưa chuyển được tự động — chọn Mức tầng / nhập Số tầng rồi xoá ô này." (vẫn sửa/xoá được).
   - Projects `nearbyAmenities`: `distanceValue` number (`min: 0`, thập phân, label "Khoảng cách") + `distanceUnit` select (`km`/`m`/`min`, nhãn "km"/"m"/"phút", label "Đơn vị") trong 1 `formRow`; `distance` cũ giữ, label "Khoảng cách (giá trị cũ)", condition tương tự (chỉ hiện khi có cũ và thiếu `distanceValue`). Validate: có số mà thiếu đơn vị (hoặc ngược lại) → lỗi tiếng Việt rõ ràng.
   - Constants + nhãn admin theo pattern `selectOptions(...)`/`*_LABELS` sẵn có.
   - Không localized (dùng chung vi/en). Không thêm vào `TRANSLATABLE_FIELDS`.
3. **Migration versioned** (`pnpm payload migrate:create <tên>` để có snapshot `.json` chuẩn, rồi viết tay phần backfill):
   - Kiểm tra SQL sinh ra: CHỈ `CREATE TYPE` + `ALTER TABLE ... ADD COLUMN` nullable trên `rentals`, `_rentals_v`, `projects_nearby_amenities`, `_projects_v_version_nearby_amenities`. Nếu generator sinh DROP/ALTER TYPE/SET NOT NULL/thứ khác ngoài phạm vi → sửa tay bỏ đi; không bỏ được → DỪNG báo.
   - Backfill trong `up`: đọc cột cũ cả bảng chính lẫn bảng version, parse bằng parser TS ở (1), `UPDATE` chỉ cột mới, chỉ khi cột mới đang NULL (idempotent). Log tổng: chuyển được / rỗng / **không parse được kèm bảng + id + giá trị**.
   - `down`: DROP cột mới + enum mới. Comment nêu hệ quả.
4. **Báo cáo giá trị không parse được** cho admin: script `scripts/report-legacy-floor-distance.ts` (chạy `payload run`, thêm npm script vd `report:legacy-units`), liệt kê bản ghi (collection, id, tiêu đề vi, giá trị cũ) có giá trị cũ nhưng thiếu trường mới. Read-only. Không cần UI dashboard.
5. **View + render theo locale:**
   - `rental-view`: nhãn tầng theo locale — ưu tiên số: vi "Tầng {n}" / en "Floor {n}"; chỉ mức: vi "Tầng cao/trung/thấp" / en "High floor/Mid floor/Low floor"; không có trường mới mà có cũ → **chỉ locale vi** hiện chuỗi cũ, en → null (không hiện dòng). Chuỗi trong `src/i18n/messages/{vi,en}.json` (ICU `{n}`), không hardcode.
   - `project-detail-view`: `distance` → chuỗi theo locale: số `Intl.NumberFormat(locale)` (vi "1,2", en "1.2"), đơn vị vi "km"/"m"/"phút", en "km"/"m"/"min" (qua messages). Thiếu mới, có cũ → chỉ vi hiện cũ. `DetailDistanceList` giữ nhận chuỗi.
   - Kiểm mọi chỗ khác đọc `floor` / `distance` (Grep trong `src/`, `scripts/` — REST/GraphQL, admin list columns, export, search text, JSON-LD nếu có) và cập nhật cho đúng.
6. **Seed:** `scripts/seed-scraped.ts:410` → dùng parser ghi `floorLevel`/`floorNumber`; không parse được → giữ ghi vào `floor` cũ (để admin thấy), không đoán. `.local-seed/seed-sample-project-blocks.ts` (local) → `distanceValue`/`distanceUnit`. `seed/english`: xác nhận không cần đổi.
7. **Regen types:** `pnpm payload generate:types`. `src/app/(payload)/admin/importMap.js` đang có thay đổi line-ending KHÔNG thuộc task: không đụng trừ khi generator buộc đổi nội dung thật (ghi rõ nếu có).

## Scope / Steps
1. TDD: test parser trước (bảng giá trị thật ở § Hiện trạng + ca biên), test view vi/en cho floor/distance (gồm fallback cũ chỉ vi), test validate cặp số+đơn vị. Cập nhật test hiện có nếu assert chuỗi cũ: `src/components/rentals/rental-detail.test.tsx`, `src/app/(frontend)/[locale]/cho-thue/[slug]/page.test.tsx`, `src/lib/projects/project-detail-view.test.ts`, `src/components/projects/project-market-blocks.test.tsx`, `src/collections/projects/market-blocks.test.ts`, `src/components/detail/DetailLists.test.tsx`.
2. Code schema + parser + view + i18n + seed + report script.
3. Migration: tạo, inspect SQL, chạy trên **DB dev** (`pnpm payload migrate`; DB dev = `127.0.0.1:5433/tami`). Ghi số liệu backfill + danh sách không parse được vào Verification summary.
4. Chạy report script → dán kết quả.
5. Kiểm trên dev server đang chạy (http://localhost:3000): tin cho thuê "Tầng cao", "Tầng 7", "3.4.5.6" ở bản vi và bản `/en` (đường dẫn EN thật của repo); 1 dự án vi + `/en` khối tiện ích xung quanh. `/en` không còn "Tầng"/"phút". curl HTML là đủ (nếu cache ISR cũ, ghi cách làm mới).
6. Doc impact (as-built): `docs/ERD.md` (Rentals `floor` ~:273 → trường mới + ghi chú legacy; Projects `nearbyAmenities` ~:231 + ghi chú as-built BL-065 kèm tên migration); `docs/API_SPEC.md` nếu có mô tả shape có `floor`/`distance` (Grep); `docs/DESIGN.md` chỉ nếu có mô tả hiển thị tầng/khoảng cách. KHÔNG sửa `SPECIFICATIONS.md` / `spec/**` / `.context/progress.json` / `spec/changes/**`.
7. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file đụng>` · `npx vitest run <file/thư mục liên quan>`. Integration test chạm DB: chỉ chạy nếu đã có và dùng DB test riêng; không thì bỏ, ghi residual.
8. **KHÔNG commit / stage.** Liệt kê đầy đủ file đã đụng/mới.

## Retry / Escalation
- Max 3 attempt; fail lần 3 → `architecture_review_needed`, dừng.

## Status
- status: done (STRICT FAIL r1 → PASS r2, report `.context/review-reports/feature-en-non-localized-fields-phase-1-task-01-round-2-review.md`; spec-validation phase 1 PASS; HIGH_RISK_MIGRATION backfill-only — staging verify trước prod) · attempt: 1

## Verification summary
- Schema: `Rentals` thêm `floorLevel` (select cao/trung/thấp) + `floorNumber` (số nguyên ≥ 0, validator `validateFloorNumber`), `floor` cũ đổi label "Tầng (giá trị cũ)" + condition. `market-blocks` thêm `distanceValue` + `distanceUnit` (validate cặp số + đơn vị), `distance` cũ đổi label + condition. Không localized, không đụng `TRANSLATABLE_FIELDS`.
- Parser dùng chung `src/lib/units/legacy-parse.ts` (+ test 42 ca); view/format `src/lib/units/floor-distance-view.ts` (+ test); i18n `page.rentalDetail.floorValue`, `page.projectDetail.distanceUnit` (vi/en).
- Migration `20261023_030506_floor_distance_normalized` (đã chạy trên DB dev bằng `pnpm payload migrate`): SQL sinh ra chỉ CREATE TYPE ×4 + ADD COLUMN nullable ×8, không cần sửa; backfill viết tay chỉ UPDATE cột mới, chỉ khi cột mới NULL.
- Backfill dev: rentals mức tầng 13 / số tầng 5 / không parse 1 (id 741438bf-7ec4-4430-83b9-bdc773eba3c8 "3.4.5.6"); _rentals_v mức 64 / số 25 / không parse 5 ("3.4.5.6": 2cc537e5-…, 451fad58-…, 843f93ff-…, b30ea2f9-…, e577b37c-…); projects_nearby_amenities chuyển 488/488; _projects_v_version_nearby_amenities 1672/1672. Dòng floor NULL không nằm trong truy vấn nên không tính "rỗng".
- `pnpm report:legacy-units`: "Còn 1 giá trị cũ chưa chuyển: rentals id=741438bf-… 'Cho thuê căn hộ 1 ngủ tại Võ Chí Công giá chỉ từ 7 triệu' floor=\"3.4.5.6\"".
- Dev server (curl): /cho-thue/<tầng 7> "Tầng 7"; /for-rent/<…> "Floor 7"; Tầng cao → "Tầng cao" / "High floor"; "3.4.5.6" hiện ở /cho-thue, /en/for-rent không có dòng tầng, 0 chữ "Tầng". Dự án /du-an/du-an-mau-biet-thu-ven-bien-da-nang: "1,2 km", "800 m", "15 phút"; /en/projects/sample-da-nang-beachfront-villas: "1.2 km", "800 m", "15 min", 0 "phút"/"Tầng".
- Seed: `scripts/seed-scraped.ts` ghi floorLevel/floorNumber (không parse được giữ `floor`); `.local-seed/seed-sample-project-blocks.ts` (gitignored) ghi distanceValue/Unit; `seed/english`: chỉ có `nearbyAmenities.N.name`, no impact. Doc: `docs/ERD.md` (Rentals + Projects + note as-built BL-065); API_SPEC/DESIGN no doc impact. generate:types: importMap không đổi.
- Verify: `pnpm typecheck` sạch · `npx eslint` các file đụng sạch (migrations/scripts bị ignore sẵn) · `npx vitest run` toàn bộ 4528 test PASS sau khi sửa 2 test ngoài dự kiến (`list-filter.test.ts` thêm floorLevel/floorNumber; nhãn option đơn vị đổi "Ki-lô-mét (km)"/"Mét (m)"/"Phút" vì `admin-labels.test` cấm nhãn trùng mã).
- Quyết định nhỏ: view trả cấu trúc (FloorView/DistanceView), chữ dựng ở component qua i18n; số thập phân `Intl.NumberFormat(locale, max 2)`; `floor` cũ vẫn lọt "Thêm bộ lọc" admin (không ẩn); migration import parser từ `src/`.
- Residual: chưa chạy `migrate:down`; migration phụ thuộc `src/lib/units/legacy-parse` (nếu sau này đổi chữ ký sẽ vỡ migration cũ); Payload 3.91 giữ giá trị field có condition=false khi lưu nên giá trị cũ không mất; không có integration test DB riêng.

- Fix r1: M1 gắn HIGH_RISK_MIGRATION (comment đầu migration, ERD as-built, task Risk) — chỉ thêm comment, không đổi logic/SQL; m1 comment ở legacy-parse (đầu file + 2 hàm); m2 sửa residual ở trên; m3 đổi help text ô cũ thành "…ô này tự ẩn sau khi có giá trị mới" (Rentals + market-blocks, không test assert chuỗi này). Verify lại: typecheck, eslint, vitest liên quan (xem lệnh bên dưới).
