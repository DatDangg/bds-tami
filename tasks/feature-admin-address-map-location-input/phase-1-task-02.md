# feature-admin-address-map-location-input · phase-1-task-02 — Trường "Toạ độ bản đồ" dùng chung + validate trong Việt Nam (BL-131 T02)

- Change doc: `spec/changes/2026-11-26-admin-address-map-location-input.md` (BACKLOG BL-131).
- Phụ thuộc: T01 (cùng file `PropertyPosts.ts`). Task sau: T03 gắn custom Field component vào trường dùng chung này.
- Trạng thái: `done` — STRICT PASS round 1 (`.context/review-reports/feature-admin-address-map-location-input-phase-1-task-02-round-1-review.md`); 3 MINOR: (1) staging/prod chưa quét — bản ghi toạ độ sai sẽ làm job dịch / hook đồng bộ / backfill cập nhật bản ghi đó fail validate → chạy cùng truy vấn read-only trước deploy; (2) doc ERD làm ở close-out phase; (3) thiếu test nửa ô / biên đảo (code đúng).

## Classification / Risk
- Type: **MODIFY** (thêm validate server cho 6 ô `point` hiện có; không đổi kiểu dữ liệu).
- Risk: **MEDIUM** — validate mới chặn lưu bản ghi có toạ độ sai (kể cả bản ghi cũ khi sửa) ở 4 collection/global; Cho thuê có `access.read = readExactAddress` phải giữ.
- Expected review level: **STRICT** (shared field dùng ở 6 chỗ; dữ liệu cũ có thể bị chặn lưu).
- Blast radius: `src/collections/Rentals.ts:201`, `src/collections/Projects.ts:208`, `src/collections/projects/market-blocks.ts:128`, `src/collections/PropertyPosts.ts` (location sau T01), `src/globals/SiteSettings.ts:92` (`mapLocation`), `src/globals/site-settings/contact-offices.ts:21`; seed/import/backfill ghi toạ độ (`src/seed*`, `scripts/import-content.ts`, `src/lib/backfill/*`) phải vẫn hợp lệ.
- Doc impact dự kiến: `docs/ERD.md` (luật validate toạ độ), SPECIFICATIONS as-built (cuối phase).
- Decision impact: biên vùng Việt Nam (ghi trong code + task).

## Thiết kế
- `src/fields/map-location.ts`: `mapLocationField(overrides)` trả `PointField` (`type: "point"`, label "Toạ độ bản đồ", `validate: validateMapLocation`), cho phép giữ `name`, `access`, `admin.description` từng chỗ.
- `validateMapLocation` (thuần, export để test): Payload point = `[lng, lat]`.
  - Trống (`null`/`undefined`/`[]`/hai ô trống) → `true`. Lưu ý Payload `point` validate mặc định (`payload/shared` `point`) kiểm số/hợp lệ — gọi nó trước rồi mới kiểm vùng (như `validateWardInProvince` gọi `relationship`).
  - Vùng VN có lề: builder chốt hằng số (gợi ý vĩ độ 7–24, kinh độ 101.5–118 để gồm Hoàng Sa/Trường Sa; ghi rõ lý do) → `true`.
  - Đảo: `[lng, lat]` mà `lng` nằm trong dải vĩ độ VN và `lat` trong dải kinh độ VN → "Có vẻ bạn nhập ngược kinh độ và vĩ độ."
  - Khác → "Toạ độ không nằm ở Việt Nam, kiểm tra lại."
- Web `src/components/media/map-geometry.ts:5` không đổi.

## Quét DB trước khi bật (bắt buộc, read-only)
- Quét DB dev (local Postgres 127.0.0.1:5433) mọi cột point: `rentals.location`, `projects.location`, `projects_nearby_amenities.location`, `property_posts.location`, `site_settings.map_location`, `site_settings_offices.location` (tên bảng thật theo schema) → liệt kê bản ghi ngoài vùng / đảo. SELECT only, KHÔNG sửa/xoá.
- Kết quả: xem mục "DB scan" dưới (0 bản ghi sai).

## Acceptance
- [x] Cả 6 ô dùng chung `mapLocationField`; `access`/`admin.description` riêng giữ nguyên (Cho thuê `readExactAddress`).
- [x] Trống lưu được; toạ độ VN lưu được; đảo → "nhập ngược"; ngoài VN → lỗi; validate chạy server (Local API/REST/seed).
- [x] Unit test validator: trống / VN (HCM, Hà Nội, Phú Quốc, Hoàng Sa/Trường Sa theo biên chốt) / đảo / ngoài VN / biên.
- [x] Seed/import mẫu vẫn qua validate (test hiện có PASS).
- [x] `pnpm vitest run` liên quan + `pnpm typecheck` + eslint PASS. Không migration (schema point không đổi — kiểm `payload migrate:create` không cần / không đổi snapshot).

## DB scan
- 2026-11-26, DB dev local (`tami-postgres` 127.0.0.1:5433), session `default_transaction_read_only=on`, SELECT only qua `docker exec … psql` (không sửa/xoá).
- Cột quét (bảng gốc, không tính bảng phiên bản `_v`): `projects.location`, `projects_nearby_amenities.location`, `property_posts.location`, `rentals.location`, `site_settings.map_location`, `site_settings_offices.location`.
- Biên thử: vĩ độ 7–24, kinh độ 101.5–118 (đảo = kinh độ nằm trong dải vĩ độ và ngược lại).

| Bảng | Có toạ độ | Trong VN | Đảo | Ngoài VN |
|---|---|---|---|---|
| projects | 61 | 61 | 0 | 0 |
| projects_nearby_amenities | 488 | 488 | 0 | 0 |
| rentals | 2 | 2 | 0 | 0 |
| property_posts | 0 (38 tin) | – | – | – |
| site_settings / site_settings_offices | 0 | – | – | – |

- Phạm vi thực tế: vĩ độ 10.382–21.835, kinh độ 105.186–109.360. **Không có bản ghi sai** → bật validate không chặn bản ghi dev nào.
- Chưa quét staging/prod (ngoài phạm vi "DB dev"; residual — dữ liệu thật nhập tay có thể khác).

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Acceptance criteria: 6 ô point dùng chung `mapLocationField` (`src/fields/map-location.ts`; Rentals giữ `access.read = readExactAddress`, market-blocks/PropertyPosts giữ `admin.description`, SiteSettings `name: "mapLocation"`). Biên chốt: vĩ độ 7–24, kinh độ 101.5–118 (đất liền 8.4–23.4N / 102.1–109.5E + lề cho Hoàng Sa ~16.5N,112E, Trường Sa ~8.6N,111.9E, đảo xa). Thứ tự validate: đảo kinh/vĩ → validator `point` mặc định (số hợp lệ, required, ±180/±90) → ngoài VN. Đảo phải kiểm TRƯỚC mặc định vì [10.77, 106.70] có "vĩ độ" 106 > 90 sẽ bị mặc định báo "vĩ độ ngoài biên". Trống (null/undefined/[]/["",""]) → true. Không đổi kiểu dữ liệu, không migration (repo không có `src/migrations`), `payload-types.ts` không đụng. Toạ độ cứng trong test/seed/backfill (tests/integration, scripts/seed-scraped, offices.test) đều nằm trong VN; `offices.test.ts:39` dùng [200, 95] là test backfill không qua validate này.
- Verify commands + result: `pnpm vitest run src/fields src/collections src/globals src/lib/backfill` 34 files / 366 tests PASS (gồm `map-location.test.ts` 32 test: trống, HCM/Hà Nội/Phú Quốc/Hoàng Sa/Trường Sa, biên, đảo, Bangkok/Paris/(0,0), lỗi mặc định, cấu hình 6 ô); `pnpm typecheck` PASS; eslint các file đổi PASS. Chưa chạy tests/integration (cần DB, tránh đụng data dev) — residual.
- Reviewer verdict: STRICT PASS round 1.
