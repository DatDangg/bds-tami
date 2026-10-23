# builder — feature-homepage-redesign phase-1-task-00 (BL-044 T00: rentals.amenities + lọc Tiện ích)

- 2026-10-20: ĐÃ XONG, chờ reviewer. Không commit (primary commit).
- Làm: field `amenities` (Rentals.ts) + `RENTAL_AMENITIES`/schema (`shared/types/api.ts`, lạ → bỏ, không 400) → migration `20261020_095907_rentals_amenities` (additive, đã `payload migrate` dev, regen `payload-types.ts`) → url-params/SQL EXISTS AND/active-filters (`amenity:<key>`) → UI FilterFields chip nhiều + Sheet CLEARED + ActiveFilters + RentalDetails hàng Tiện ích + i18n vi/en → seed `scripts/seed-rental-amenities.ts` (pure logic `src/lib/rentals/sample-amenities.ts`, guard prod/staging) → docs API_SPEC/ERD + decisions.md Decision 10.
- Verify: pnpm test 3164 PASS, typecheck PASS, lint 0 error, integration rental-search 38 PASS, seed dev 32/32 rồi 0/32, curl /cho-thue?amenities=pool,gym = 4 kết quả.
- Còn dở: không. Nếu reviewer FAIL → đọc report rồi sửa; T01 dùng `amenities=` chọn 1 giá trị đã có sẵn.

## Round 2 (2026-10-20) — sửa finding reviewer r1
- M1: endpoint `src/endpoints/public/rentals.ts` gộp `getAll("amenities")` (chỉ khoá này) → khoá lặp ≡ dạng phẩy; test unit (`rentals.test.ts`) + integration (GET khoá lặp == phẩy); `docs/API_SPEC.md:113` + Decision 10 Consequences cập nhật.
- m2 whitespace API_SPEC khôi phục từ HEAD; m3 `ActiveFilters.tsx` switch kín qua `groupName`; m4 `parseAmenityList(): unknown`; m5 seed lọc `deletedAt exists:false`.
- Verify: vitest subset 16 files/233 PASS; typecheck PASS; lint 0 error; curl :3000 `pool&gym`=5=`pool,gym`.
- Chưa commit (chờ reviewer round 2). Không còn việc dở.
