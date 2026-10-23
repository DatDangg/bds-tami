# Spec Update — 2026-10-23 en-non-localized-fields

**spec_version:** 1.55.1 → 1.56.0 (MINOR — đổi cách nhập admin + schema + hiển thị theo ngôn ngữ)
**Trigger:** feature-update (BL-065, change-request class MODIFY)
**Work item:** `feature/en-non-localized-fields` phase 1 · T01 STRICT FAIL r1 (M1 thiếu tag HIGH_RISK_MIGRATION) → PASS r2 · commit `bf0b410`
**Change doc:** `spec/changes/archive/2026-10-23-en-non-localized-fields.md` · task `tasks/feature-en-non-localized-fields/phase-1-task-01.md`
**Review:** `.context/review-reports/feature-en-non-localized-fields-phase-1-task-01-round-2-review.md` · spec-validation PASS `.context/review-reports/spec-validation-feature-en-non-localized-fields-phase-1.md`

## Requirements
- **SỬA — F3 Tầng (tin cho thuê):** `floor` text tự do → `floorLevel` ("Mức tầng": high/mid/low) + `floorNumber` ("Số tầng", nguyên ≥ 0). Nhãn: có số → "Tầng N" / "Floor N" (ưu tiên số); chỉ mức → "Tầng cao|trung|thấp" / "High|Mid|Low floor"; không có → ẩn dòng.
- **SỬA — F2 Khoảng cách tiện ích (dự án):** `nearbyAmenities[].distance` text → `distanceValue` (≥ 0, thập phân) + `distanceUnit` (km/m/min). Chip vi "1,2 km"/"800 m"/"15 phút", en "1.2 km"/"800 m"/"15 min". Thiếu 1 trong 2 → lỗi validate admin.
- **THÊM — F12 quy ước:** trường không localized có chữ lưu dạng chuẩn hoá, web dựng nhãn theo ngôn ngữ từ i18n + `Intl`; **địa chỉ giữ tiếng Việt ở `/en`** (tên riêng, dùng tra bản đồ).
- Cột cũ `floor` / `distance` giữ làm "giá trị cũ" (label), ô chỉ hiện khi chưa có giá trị mới; `/vi` fallback giá trị cũ, `/en` không hiện. Parser chung `src/lib/units/legacy-parse.ts` (chỉ "Tầng cao|trung|thấp", "Tầng <n>", "<số> km|m|phút").

## Ảnh hưởng
- Module: `src/collections/Rentals.ts`, `src/collections/projects/market-blocks.ts`, `src/hooks/rentals/field-validators.ts`, `src/lib/units/*`, `src/lib/rentals/rental-view.ts`, `src/lib/projects/project-detail-view.ts`, `RentalDetail`, `ProjectLocation`, i18n vi/en, `scripts/seed-scraped.ts`, `scripts/report-legacy-floor-distance.ts`, `docs/ERD.md`.
- **Migration** `20261023_030506_floor_distance_normalized`: 4 CREATE TYPE + 8 ADD COLUMN nullable + backfill chỉ cột mới khi NULL (idempotent), không đụng cột cũ; down drop cột/enum mới. **HIGH_RISK_MIGRATION** chỉ do backfill 4 bảng (rentals, _rentals_v, projects_nearby_amenities, _projects_v_version_nearby_amenities) — chạy + verify staging (đo thời gian backfill) trước promote prod. Dev: rentals 18 chuyển / 1 không parse ("3.4.5.6"); _rentals_v 89 / 5; nearby 488/488; _projects_v nearby 1672/1672.
- Verify: typecheck + eslint + vitest 68 file / 731 liên quan (full 4528) PASS.
- Scope: `spec/test-scope/current.json` v73 (bản cũ v72 → `spec/test-scope/archive/test-scope-1.55.1-72.json`).
