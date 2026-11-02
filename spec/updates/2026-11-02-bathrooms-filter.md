# Spec Update — 2026-11-02 bathrooms-filter

**spec_version:** 1.61.0 → 1.62.0 (MINOR — thêm tính năng: bộ lọc số phòng tắm)
**Trigger:** feature-update (BL-104, change-request class ADDITIVE)
**Work item:** `feature/bathrooms-filter`
**Change doc:** `spec/changes/2026-11-02-bathrooms-filter.md`

## Lý do
QA sheet 30/10 dòng 23: bộ lọc `/cho-thue` chỉ có số phòng ngủ, thiếu số phòng tắm. Làm cả `/tin-bds` (cùng dữ liệu `bathrooms`) để QA không báo lại.

## Delta (SPECIFICATIONS.md: mục bộ lọc `/cho-thue` + `/tin-bds` ở Giao diện, mục F3/F4)
- THÊM: tham số URL `bathrooms` trên `/cho-thue` (+ `/cho-thue/danh-muc/[category]`, F3) và `/tin-bds` (+ danh mục, F4); chip 1·2·3·4+ cùng kiểu và cùng giá trị với phòng ngủ (4 = từ 4 trở lên); giá trị lạ bị bỏ qua.
- THÊM: chip bộ lọc đang bật + nút xoá; giữ khi phân trang / đổi sắp xếp.
- THÊM: `GET /api/public/rentals` nhận `bathrooms` như `bedrooms` (0–4, sai → 400); trang chỉ nhận 1–4 (`0` bị bỏ). Chip đang lọc chỉ ở `/cho-thue` (`/tin-bds` không có chip cho cả phòng ngủ); cả hai trang tính vào huy hiệu "Bộ lọc" + noindex.
- THÊM: tin không nhập số phòng tắm không khớp khi đang lọc.
- Không đổi schema (cột `bathrooms` có sẵn ở `rentals` và `property_posts`) → không migration.

## Ảnh hưởng
Bộ lọc công khai Cho thuê / Tin BĐS (parse URL, điều kiện SQL, chip, facet, i18n VI/EN, Sheet bộ lọc mobile); API khách rentals. Risk medium. Doc as-built: `docs/API_SPEC.md` (tham số mới).
