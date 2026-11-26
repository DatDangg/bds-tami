# bug-admin-ward-field-narrow-in-row · phase-1-task-01 — Ô Phường/xã co bé cạnh Tỉnh/thành (BL-130)

- Change doc: `spec/changes/2026-11-26-admin-ward-field-narrow-in-row.md` (BACKLOG BL-130).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — NORMAL PASS round 1 (`.context/review-reports/bug-admin-ward-field-narrow-in-row-phase-1-task-01-round-1-review.md`); 2 MINOR (cast thừa trong test; chưa kiểm trình duyệt 1440/390 vì Docker/DB local down — residual). Spec 1.64.8 / scope v129.

## Classification / Risk
- Type: **BUG** (user `/change` chỉ định BL-130, coi như duyệt plan).
- Severity: low (UI admin, không mất dữ liệu).
- Risk: **LOW** — 1 component client admin dùng chung 3 form (Cho thuê, Dự án, Tin BĐS); chỉ đổi prop `style` truyền cho `RelationshipInput`. Không đổi schema, access, validate, lọc theo tỉnh.
- Expected review level: NORMAL (component admin dùng chung 3 collection, diff 1 dòng + test).
- Doc impact dự kiến: không (no contract/schema/behavior tài liệu hoá) — SPECIFICATIONS as-built PATCH nếu spec-publisher thấy cần.

## Root cause (đã chứng minh lúc intake)
- `src/components/admin/WardField.tsx:92` truyền `style={undefined}` cho `RelationshipInput`.
- Ô quan hệ mặc định Payload (Tỉnh/thành) gắn `style = mergeFieldStyles(field)` (`node_modules/@payloadcms/ui/dist/fields/mergeFieldStyles.js`): không có `admin.width` → `flex: '1 1 auto'`; có → `--field-width`.
- Row CSS Payload (`node_modules/@payloadcms/ui/dist/fields/Row/index.scss`): `.row__fields > * { flex: 0 1 calc(var(--field-width) - …) }` → thiếu cả hai, ô Phường/xã co về bề rộng nội dung (flex-grow 0); menu react-select rộng theo control → tên phường xuống dòng từng chữ + cuộn ngang.

## Thiết kế fix
- `WardField` truyền `style={mergeFieldStyles(field)}` (memo theo `field`), import `mergeFieldStyles` từ `@payloadcms/ui/shared` (chỉ export ở đó). Giữ hành vi như ô quan hệ mặc định (tôn trọng `admin.width` / `admin.style` nếu sau này khai).
- Không đổi lọc theo tỉnh / bỏ chọn khi đổi tỉnh / validate.

## Files
- Sửa: `src/components/admin/WardField.tsx`.
- Test: `src/components/admin/WardField.test.tsx` (barrel `@payloadcms/ui` đang mock vì kéo .css; `@payloadcms/ui/shared` có thể cần mock/hoặc test qua render với props).
- Dùng ở (không cần sửa): `src/collections/Rentals.ts:186-198`, `src/collections/Projects.ts:205`, `src/collections/PropertyPosts.ts:124`.
- KHÔNG đụng: file bẩn có sẵn ngoài scope (`src/endpoints/*`, `src/jobs/*`, `docs/*`, `package.json`, `pnpm-lock.yaml`, `src/payload-types.ts`, `tools/*`, `.claude/*`…), `.context/runs/*`.

## Acceptance
- [ ] Hàng Tỉnh/thành · Phường/xã chia đều bề rộng như các hàng 2 ô khác (≥ mid-break); < mid-break mỗi ô 100%.
- [ ] Dropdown Phường/xã đủ rộng, tên phường 1 dòng, không cuộn ngang.
- [ ] Lọc theo tỉnh + tự bỏ chọn khi đổi tỉnh không regression.
- [ ] Áp dụng cả Cho thuê, Dự án, Tin BĐS (cùng component).
- [ ] Test FAIL trước / PASS sau (style truyền xuống = mergeFieldStyles(field): `flex: 1 1 auto` khi không width; `--field-width` khi có width); `pnpm vitest run src/components/admin`, `pnpm typecheck`, eslint file đổi PASS.

## Verification Plan
- Unit: render `WardField` với `RelationshipInput` mock bắt props → assert `style`.
- Trực quan (nếu dev server/DB chạy được): admin form Cho thuê/Dự án/Tin BĐS 1440 + 390 → screenshot `.context/review-reports/assets/bl130-*`; đo bề rộng 2 ô bằng nhau ≥ mid-break.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: Admin › Cho thuê › tạo/sửa tin → hàng Tỉnh/thành · Phường/xã: Phường/xã rộng bằng placeholder; mở dropdown tên phường xuống dòng từng chữ + cuộn ngang.
- Expected: 2 ô chia đều; dropdown đủ rộng.
- Actual before fix: `WardField` truyền `style={undefined}` → test mới FAIL (style `undefined`, kỳ vọng `{ flex: "1 1 auto" }` / `{ "--field-width": "50%" }`); ô Phường/xã không có flex-grow trong hàng Row nên co về bề rộng nội dung.
- Actual after fix: `style={mergeFieldStyles(field)}` → cùng style với ô Tỉnh/thành (`flex: 1 1 auto`, hoặc `--field-width` khi có admin.width); 2 ô chia đều theo CSS Row Payload (suy ra từ code, chưa đo trên trình duyệt).
- Evidence: `src/components/admin/WardField.test.tsx` (2 test mới render WardField + RelationshipInput mock bắt props, dùng mergeFieldStyles thật): FAIL trước fix (2 failed), PASS sau fix (5 passed); `pnpm vitest run src/components/admin` 469 passed; `pnpm typecheck` sạch; eslint 2 file sạch. Chưa có screenshot trực quan.
- Status: PASS (unit); trực quan chưa verify

## Residual risk
- Chưa chạy dev server + DB để chụp admin Cho thuê/Dự án/Tin BĐS 390/1440 (không có screenshot bl130-*); bề rộng/dropdown thực tế dựa trên đọc CSS Payload. Reviewer/user nên xem nhanh 1 form.

## Doc / Decision Impact
- no doc impact dự kiến (layout admin, không đổi contract/schema/behavior tài liệu hoá).
