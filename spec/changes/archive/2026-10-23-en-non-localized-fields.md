---
id: en-non-localized-fields
type: feature
status: done
completed: 2026-10-23
created: 2026-10-23
---

# `/en` còn chữ Việt ở các trường không localized (tầng, khoảng cách tiện ích, địa chỉ)

## Nguồn
Follow-up FU-1 từ spec-validation BL-064 (`.context/review-reports/spec-validation-feature-seed-english-data-phase-1.md`), ghi tự động 2026-10-23 — chờ user duyệt.

## Hiện trạng
Sau BL-064 mọi bản ghi seed đã có bản EN, nhưng các trường **không localized** (dùng chung vi/en) vẫn hiện tiếng Việt ở `/en`:
- `rentals.floor` dưới nhãn "Floor": "Tầng cao", "Tầng trung", "Tầng thấp", "Tầng 7".
- `projects.nearbyAmenities.distance`: "15 phút".
- Địa chỉ dự án / cho thuê / tin BĐS: "Phường …, Thành phố Hà Nội".

## Yêu cầu (cần user chốt)
Chọn cách: (a) đổi các trường này thành localized (schema + migration additive + job dịch + seed EN), hoặc (b) chuẩn hoá dữ liệu (vd `floor` thành select có nhãn i18n, `distance` thành số phút + đơn vị i18n), hoặc (c) chấp nhận địa chỉ giữ tiếng Việt (tên riêng) và chỉ xử lý `floor` / `distance`.

## Quyết định (user 2026-10-23): cách (c)
- **Địa chỉ giữ tiếng Việt ở `/en`** (coi là tên riêng, dùng tra bản đồ), ghi quy ước vào spec.
- **`rentals.floor`** (hiện `text` tự do, `src/collections/Rentals.ts:188`) → chuẩn hoá: ô chọn mức tầng (cao / trung / thấp) + số tầng tuỳ chọn; web hiện nhãn theo ngôn ngữ (vd "Tầng 7" / "Floor 7", "Tầng cao" / "High floor").
- **`projects.nearbyAmenities.distance`** (hiện `text` tự do, `src/collections/projects/market-blocks.ts:89`, vd "1,2 km" / "5 phút") → chuẩn hoá: số + đơn vị (phút / km); web hiện theo ngôn ngữ ("5 phút" / "5 min").
- Admin nhập bằng ô chọn/ô số thay vì gõ chữ, không phải nhập 2 ngôn ngữ.
- Dữ liệu cũ chuyển đổi tự động 1 lần (migration versioned); giá trị không parse được → báo danh sách để admin sửa tay, không tự đoán.

## Acceptance (dự kiến)
- [x] `/en` chi tiết cho thuê + dự án không còn "Tầng …" / "… phút".
- [x] Admin nhập tầng/khoảng cách bằng ô chọn + ô số; vi/en hiện đúng nhãn.
- [x] Dữ liệu cũ đã chuyển đổi; giá trị lạ được liệt kê, không mất dữ liệu.
- [x] Quy ước địa chỉ giữ tiếng Việt ở `/en` được ghi vào spec.

## Kết quả (2026-10-23)
- T01 `bf0b410` — STRICT FAIL r1 (thiếu tag HIGH_RISK_MIGRATION) → PASS r2; spec-validation phase 1 PASS. Spec **1.56.0** / test-scope **v73**.
- Migration `20261023_030506_floor_distance_normalized`: additive (4 CREATE TYPE + 8 ADD COLUMN nullable) + backfill cột mới, cột cũ giữ nguyên. **HIGH_RISK_MIGRATION (chỉ do backfill)** → chạy + verify staging, đo thời gian backfill trước promote prod.
- Dev: rentals 18 chuyển / 1 không parse; _rentals_v 89 / 5; nearby 488/488; _projects_v nearby 1672/1672. Không parse: "3.4.5.6" — tin `741438bf-7ec4-4430-83b9-bdc773eba3c8` ("Cho thuê căn hộ 1 ngủ tại Võ Chí Công giá chỉ từ 7 triệu") + 5 bản version → admin sửa tay (xem `pnpm report:legacy-units`).
- Thêm đơn vị `m` ngoài phút/km (dữ liệu có "800 m").
