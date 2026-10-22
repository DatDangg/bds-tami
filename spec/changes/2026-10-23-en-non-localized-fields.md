---
id: en-non-localized-fields
type: feature
status: pending
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

## Acceptance (dự kiến)
- [ ] `/en` chi tiết cho thuê + dự án không còn "Tầng …" / "… phút".
- [ ] Quy ước địa chỉ ở `/en` được chốt và ghi vào spec.
