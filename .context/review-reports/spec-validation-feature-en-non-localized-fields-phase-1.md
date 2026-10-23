Agent: spec-validator

# Spec validation (phase review) — feature-en-non-localized-fields · phase 1 · round 1 (BL-065, MODIFY)

- Mode: **Phase review** (sau khi task phase-1-task-01 có reviewer PASS r2)
- Scope: change doc `spec/changes/2026-10-23-en-non-localized-fields.md` (mục "Quyết định (user 2026-10-23): cách (c)" + 4 mục Acceptance), spec delta (3 dòng "BL-065" trong `SPECIFICATIONS.md`: :166 F2, :170 F3, :225 F12), task `tasks/feature-en-non-localized-fields/phase-1-task-01.md`, review `.context/review-reports/feature-en-non-localized-fields-phase-1-task-01-round-2-review.md` (STRICT, PASS).
- Code đã kiểm (working tree chưa commit, checkout chính): `src/lib/units/legacy-parse.ts`, `src/lib/units/floor-distance-view.ts`, `src/collections/Rentals.ts:67-82,205-210`, `src/collections/projects/market-blocks.ts:80-128`, `src/hooks/rentals/field-validators.ts` (validateFloorNumber), `src/lib/rentals/rental-view.ts:47,163`, `src/lib/projects/project-detail-view.ts:10`, `src/components/rentals/RentalDetail.tsx:83`, `src/components/projects/ProjectLocation.tsx:66`, `src/i18n/messages/{vi,en}.json` (`projectDetail.distanceUnit`, `rentalDetail.floorValue`), `migrations/20261023_030506_floor_distance_normalized.ts`, `scripts/report-legacy-floor-distance.ts`, `scripts/seed-scraped.ts:125-130,419`, `package.json:23`, `docs/ERD.md:231,250,275-277`.
- `spec_version` vẫn 1.55.1: bump thuộc bước spec-publisher sau, **không tính là gap** (theo chỉ dẫn).

## Verdict: ✅ COMPLETE (PASS)

Không có MISSING. Không có PARTIAL chặn. Không có conflict giữa change doc, spec delta và code. Chỉ còn một số residual/follow-up nhỏ, không chặn (xem cuối report).

## Evidence runtime (chỉ đọc)

DB dev (`docker exec tami-postgres psql`, chỉ SELECT):
- `payload_migrations`: có `20261023_030506_floor_distance_normalized` batch 43.
- `rentals`: "Tầng cao"→high 11, "Tầng trung"→mid 1, "Tầng thấp"→low 1, "Tầng 2/3/4/7"→số 2/3/4/7 (5 dòng), **"3.4.5.6" giữ nguyên, cột mới NULL (1)**, NULL 13. Cột `floor` cũ không bị sửa.
- `_rentals_v`: 94 dòng có giá trị cũ, 5 dòng chưa chuyển (đều là "3.4.5.6", khớp task).
- `projects_nearby_amenities`: 8 giá trị × 61 đều đã chuyển ("1,2 km"→1.2 km, "800 m"→800 m, "15 phút"→15 min, ...). `_projects_v_version_nearby_amenities`: 0/1672 chưa chuyển.

Dev server http://localhost:3000 (curl HTML):
| URL | Kết quả |
|---|---|
| `/en/for-rent/2-bedroom-2-bathroom-apartment-for-rent-with-lake-view-at-tu-hoa` (Tầng 7) | "Floor 7"; 0 "Tầng", 0 "phút" |
| `/en/for-rent/1-bedroom-apartment-for-rent-at-vo-chi-cong-from-just-7-million-vnd` ("3.4.5.6") | không có dòng tầng, 0 "3.4.5.6", 0 "Tầng" |
| `/cho-thue/cho-thue-can-ho-1-ngu-tai-vo-chi-cong-gia-chi-tu-7-trieu` | hiện "3.4.5.6" (giá trị cũ, chỉ ở vi) |
| `/cho-thue/cho-thue-can-ho-2-ngu-2-ve-sinh-view-ho-tai-tu-hoa` | "Tầng 7" |
| `/en/projects/the-sunrise-bay-vinhomes-global-gate-ha-long` | chip "1.2 km", "1.8 km", "2.5 km", "300/400/500/800 m", "15 min"; 0 "phút", 0 "Tầng" |
| `/du-an/the-sunrise-bay-vinhomes-global-gate-ha-long` | "1,2 km", "15 phút", ... |
| `/en/for-rent`, `/en`, `/en/projects` | 0 "Tầng …", 0 "<số> phút" |

Quét chữ có dấu tiếng Việt trong text node HTML của trang `/en` chi tiết dự án và chi tiết cho thuê: chỉ còn tên riêng (tên dự án, tên đường) và địa chỉ ("Phường Hồng Hà, Hà Nội", "Phường Hạ Long, Quảng Ninh"). Điều này đúng với quy ước F12.

Kiểm chỗ khác có đọc `floor`/`distance` (Grep `src/`, bỏ `payload-types.ts`): chỉ có `rental-view` → `RentalDetail`, `project-detail-view` → `ProjectLocation`/`DetailDistanceList`, schema, test, cùng `list-filter.test`. Không có thẻ danh sách cho thuê, JSON-LD, so sánh, export, search text hay API public (`src/app/api`) nào dùng `floor`/`distance`, nên không còn chỗ nào lọt chữ Việt.

## Ma trận coverage

| # | Requirement | Nguồn | Trạng thái | Note / bằng chứng |
|---|---|---|---|---|
| A1 | `/en` chi tiết cho thuê + dự án không còn "Tầng …" / "… phút" | change doc Acceptance 1 | ✅ | curl ở trên; `floor-distance-view.ts:25` (giá trị cũ chỉ hiện khi `locale === "vi"`) |
| A2 | Admin nhập tầng/khoảng cách bằng ô chọn + ô số; vi/en hiện đúng nhãn | Acceptance 2; Quyết định "Admin nhập bằng ô chọn/ô số" | ✅ | `Rentals.ts:72-73,205-209` (select `floorLevel` + number `floorNumber` trong formRow); `market-blocks.ts:100-101,125` (number + select trong formRow); nhãn `en.json`/`vi.json` `floorValue.*`, `distanceUnit.*` |
| A3 | Dữ liệu cũ chuyển đổi; giá trị lạ được liệt kê, không mất dữ liệu | Acceptance 3; Quyết định "migration versioned … báo danh sách, không đoán" | ✅ | Migration `:20-62` (UPDATE chỉ cột mới khi NULL, warn từng id không parse được); cột cũ giữ nguyên (DB); `scripts/report-legacy-floor-distance.ts` + `pnpm report:legacy-units`; ô "(giá trị cũ)" hiện có điều kiện `Rentals.ts:80`, `market-blocks.ts:108` |
| A4 | Quy ước địa chỉ giữ tiếng Việt ở `/en` ghi vào spec | Acceptance 4 | ✅ | `SPECIFICATIONS.md:225` |
| D1 | `floor` → mức tầng (cao/trung/thấp) + số tầng tuỳ chọn; "Tầng 7"/"Floor 7", "Tầng cao"/"High floor" | change doc Quyết định; F3 `SPECIFICATIONS.md:170` | ✅ | `toFloorView` ưu tiên số (`floor-distance-view.ts:29-30`); `validateFloorNumber` chặn số lẻ; `min: 0` |
| D2 | F3: chỉ nhận "Tầng cao/trung/thấp", "Tầng <số>"; khác thì không đoán | F3 :170 | ✅ | `legacy-parse.ts:20-21,25-33`; "3.4.5.6" giữ nguyên trong DB |
| D3 | F3: không có giá trị → không hiện dòng; `/vi` hiện giá trị cũ, `/en` không | F3 :170 | ✅ | `RentalDetail.tsx:83` + `formatFloor` trả null; curl vi/en của tin "3.4.5.6" |
| D4 | `distance` → số + đơn vị; "5 phút"/"5 min" | change doc Quyết định; F2 :166 | ✅ | Đơn vị thêm `m`, đã ghi lý do trong F2, không phải gap; `Intl.NumberFormat(locale)` ("1,2"/"1.2") `floor-distance-view.ts:55` |
| D5 | F2: thiếu số hoặc đơn vị → không hiện chip; nhập 1 trong 2 là lỗi validate | F2 :166 | ✅ | `floor-distance-view.ts:38`; `requireBoth` `market-blocks.ts:81-98` |
| D6 | F2: parse "<số>[,.<số>] km\|m\|phút"; cột `distance` cũ giữ; `/vi` hiện cũ, `/en` không | F2 :166 | ✅ | `legacy-parse.ts:22,36-42`; `toDistanceView` → `legacyText` |
| D7 | F12: trường dùng chung lưu chuẩn hoá, nhãn từ messages + Intl, admin không nhập 2 ngôn ngữ, không localized | F12 :225 | ✅ | Field không có `localized`, có test `market-blocks.test.ts:31`; không đụng `TRANSLATABLE_FIELDS` |
| D8 | F12: địa chỉ giữ tiếng Việt, không dịch, không chuyển tự | F12 :225 | ✅ | Không đổi code địa chỉ; curl /en hiện "Phường …, Hà Nội" |
| N1 | Migration versioned, additive (đúng policy Non-negotiables); gắn HIGH_RISK_MIGRATION vì có backfill | AGENTS.md § Non-negotiables; task Risk | ✅ | Chỉ CREATE TYPE + ADD COLUMN nullable; `down` chỉ drop cột/enum mới; header `:5-8` có nhãn HIGH_RISK_MIGRATION + bắt buộc verify staging |
| N2 | Seed dùng parser chung, không đoán | task Thiết kế §6 | ✅ | `seed-scraped.ts:125-130,419`; `seed/english` không có floor/distance, no impact |
| N3 | Doc as-built | AGENTS.md Doc Impact | ✅ | `docs/ERD.md:231,250,275-277`; API_SPEC/DESIGN không mô tả floor/distance, no doc impact là đúng |

## Gaps

- [MISSING]: không có.
- [PARTIAL]: không có.

## Residual risk / follow-up (không chặn)

1. **FU-a (close-out, primary):** commit phải có trailer `HIGH_RISK_MIGRATION` (reviewer r2 đã nhắc). Trước khi promote prod, bắt buộc chạy migration trên staging và đo thời gian backfill (backfill chạy UPDATE từng dòng trên 4 bảng). Còn 1 rental "3.4.5.6" (id 741438bf-7ec4-4430-83b9-bdc773eba3c8) cần admin sửa tay. Change doc đang `status: pending` với acceptance chưa tick; việc cập nhật thuộc close-out/archive.
2. **R-1:** `report-legacy-floor-distance.ts` chỉ quét bảng chính qua `payload.find` (bản đã xuất bản), không quét bản nháp/version. Giá trị chưa chuyển chỉ nằm trong bản nháp (`_rentals_v`, 5 dòng "3.4.5.6") chỉ có trong log migration. Rủi ro thấp, vì admin sửa bản chính thì version mới sẽ có giá trị mới.
3. **R-2:** Migration import parser đang dùng ở `src/lib/units/legacy-parse.ts`. Comment đã ghi cấm đổi hành vi. Nếu sau này parser đổi, chạy lại migration trên môi trường mới có thể ra kết quả khác.
4. **R-3:** Ô `floor`/`distance` cũ vẫn còn trong "Thêm bộ lọc" của admin list (task đã ghi là quyết định nhỏ), không ảnh hưởng `/en`.
5. **R-4:** Chưa chạy `migrate:down` (reviewer chỉ review bằng cách đọc SQL).
6. Quan sát ngoài scope (không phải gap BL-065): trang `/en` còn chữ có dấu, nhưng chỉ là tên riêng và địa chỉ, đúng quy ước F12. Không thấy trường không localized nào khác lọt tiếng Việt trên 2 trang mẫu đã quét. Chưa quét toàn site (vd `projects.scale.handoverTime` text không localized); nếu cần thì mở change riêng.
