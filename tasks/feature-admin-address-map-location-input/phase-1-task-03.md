# feature-admin-address-map-location-input · phase-1-task-03 — Ô "Dán từ Google Maps" + Vĩ độ trước (BL-131 T03)

- Change doc: `spec/changes/2026-11-26-admin-address-map-location-input.md` (BACKLOG BL-131).
- Phụ thuộc: T02 (`src/fields/map-location.ts`).
- Trạng thái: `done` — STRICT FAIL round 1 (CRITICAL ô số nuốt chữ số 0, MAJOR ô dán xử lý mỗi phím) → PASS round 2 (`.context/review-reports/feature-admin-address-map-location-input-phase-1-task-03-round-2-review.md`); attempt 2. Phase spec-validation PASS (`.context/review-reports/spec-validation-feature-admin-address-map-location-input-phase-1.md`) kèm 2 gate: G1 kiểm trình duyệt, G2 quét staging/prod trước deploy.

## Classification / Risk
- Type: **MODIFY** (custom admin Field component cho trường toạ độ dùng chung; dữ liệu vẫn GeoJSON `[lng, lat]`).
- Risk: **MEDIUM** — component client admin dùng chung 6 chỗ (form Cho thuê / Dự án / Tiện ích xung quanh / Tin BĐS / Cài đặt website / Văn phòng); sai thứ tự lat/lng = lưu sai vị trí.
- Expected review level: **STRICT** (shared component, ghi dữ liệu).
- Blast radius: 6 form admin; `src/app/(payload)/admin/importMap.js` (regen `pnpm generate:importmap`).
- Doc impact dự kiến: `docs/DESIGN.md` (admin form toạ độ).

## Thiết kế
- Parser thuần (vd `src/lib/admin/map-location-parse.ts`): nhận chuỗi → `{ lat, lng }` | `{ error: "short-link" }` | `null`.
  - Cặp số `10.7769, 106.7009` / `10.7769,106.7009` / số âm / khoảng trắng thừa.
  - Link đầy đủ: `/@lat,lng,17z`, `?q=lat,lng` (cả `query=`, `ll=`), `!3dlat!4dlng` (ưu tiên `!3d!4d` — đúng ghim — trước `@` là tâm khung nhìn).
  - `maps.app.goo.gl/…` / `goo.gl/maps/…` → short-link → thông báo "Dán cặp số thay vì link rút gọn".
  - Chuỗi rác → `null` (báo "Không đọc được toạ độ").
- Component client `src/components/admin/MapLocationField.tsx`: `useField<[number, number] | null>`; ô dán; 2 ô số **Vĩ độ trước, Kinh độ sau** (lưu `[lng, lat]`); link "Xem trên Google Maps" (`https://www.google.com/maps?q=lat,lng`, target _blank rel noopener) khi có giá trị; label/description/lỗi như field Payload (Label/Description/Error customComponents, `showError`), `mergeFieldStyles(field)` (BL-130), readOnly. Gắn qua `admin.components.Field` trong `mapLocationField`.
- Style: token admin sẵn có (sáng/tối), xếp dọc ≤ 390px.
- Regen import map: `pnpm generate:importmap` → commit `src/app/(payload)/admin/importMap.js` (chỉ dòng mới).

## Acceptance
- [x] Dán cặp số / link đầy đủ Google Maps điền đúng vĩ độ/kinh độ; link rút gọn → thông báo hướng dẫn; ô Vĩ độ đứng trước Kinh độ; link "Xem trên Google Maps" mở đúng điểm.
- [x] Dữ liệu lưu vẫn `[lng, lat]`; validate T02 vẫn chạy (lỗi hiển thị dưới ô).
- [x] Unit test parser (cặp số, các dạng link, khoảng trắng, số âm, chuỗi rác, link rút gọn) + test component (render thứ tự ô, dán → setValue `[lng, lat]`).
- [ ] (RESIDUAL G1 — chưa kiểm: không có tài khoản test ngoài .env.local) Kiểm admin thật (Tin BĐS + Cho thuê) 1440 & 390, sáng/tối nếu dev server chạy được; bản đồ trang công khai vẫn hiện với dữ liệu cũ.
- [x] `pnpm vitest run` liên quan + `pnpm typecheck` + eslint PASS.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Acceptance criteria: parser + component + gắn field + importMap xong, test PASS. Chưa kiểm trình duyệt (xem residual).
- Verify commands + result: `pnpm vitest run src/components/admin src/fields src/lib/admin src/collections src/globals` 112 file / 1027 test PASS; `pnpm typecheck` PASS; eslint các file đổi PASS.
- Residual: KHÔNG kiểm admin thật 1440/390 sáng/tối (đăng nhập admin chỉ có trong .env.local, không có tài khoản test trong seed/.env.example). SCSS `_map-location.scss` chưa biên dịch thử (không có sass CLI), bố cục chưa nhìn bằng mắt.
- Attempt 2 (sau reviewer round 1 FAIL): sửa CRITICAL (ô số truyền number, test harness state thật gõ từng ký tự, tái hiện 106.79 với code cũ), MAJOR (ô dán chỉ áp dụng khi paste/Enter/blur), MINOR (lỗi server sát ô số qua order, link >=44px, role=status luôn mount, gợi ý dán ngược, bỏ `as never` ở validate). vitest 112 file/1032 test PASS, typecheck PASS, eslint PASS, SCSS biên dịch PASS (sass 1.77.4).
- Reviewer verdict: STRICT FAIL r1 → STRICT PASS r2.

### Attempt 2 (sửa reviewer round 1 STRICT FAIL)
- CRITICAL fixed: ô số truyền number (`numberOrNull(part) ?? ""`) như ô point Payload, không còn chuỗi chuẩn hoá nuốt số 0. Test state thật (useState) gõ từng ký tự `106.7009`, `10.009`, `10.0234` → input + giá trị lưu `[lng, lat]` đúng.
- MAJOR fixed: ô dán chỉ áp dụng khi onPaste, Enter hoặc blur; gõ từng phím không setValue, không báo lỗi giữa chừng. Test paste / gõ dở / Enter / blur.
- MINOR fixed: lỗi FieldError đặt trong `div.field-type__wrap` ngay dưới hai ô số; link Maps min-height 2.75rem; `role="status"` luôn có trong DOM; dán ngược `106.7009, 10.7769` → gợi ý "dán ngược" (parser trả `reversed`, không tự đảo); ép kiểu validate gom về một chỗ `as unknown as Validate` có comment (Payload không có kiểu chung đúng, không còn `as never`).
- Verify: vitest 112 file / 1032 test PASS; typecheck PASS; eslint PASS; sass compile custom.scss PASS. Vẫn chưa kiểm admin thật bằng trình duyệt.
