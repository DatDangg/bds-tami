# bug-admin-province-ward-cascade · phase-1-task-01 — Ô Phường/xã đi theo Tỉnh/thành (lọc ngay, đổi tỉnh bỏ chọn, lỗi không lộ UUID)

- Change doc: `spec/changes/archive/2026-10-26-admin-province-ward-cascade.md` (BACKLOG BL-077)
- Evidence: `tests/e2e/admin/location-ward.spec.ts` (chưa commit) · `test-results/summary.txt` (3 lỗi × 3 collection, local) · `test-results/summary-staging.txt` (lỗi 2 × 3 collection)
- Auto proceed: user "sửa đi" sau khi xem danh sách lỗi → không checkpoint phase plan.

## Root cause (change-request, đọc code + Payload 3.91.0)
Field dùng chung: `src/fields/ward-in-province.ts` → `Projects.ts:205`, `Rentals.ts:186-196`, `PropertyPosts.ts:123`.

1. **Danh sách chưa lọc ngay** — `wardFilterOptions` (`ward-in-province.ts:11-14`) chạy ở SERVER khi build form state; client
   (`@payloadcms/ui/dist/fields/Relationship/index.js` → `useField().filterOptions`) chỉ có filterOptions mới sau một vòng
   form-state round-trip (debounce + request). Trước đó filterOptions là của lúc chưa có tỉnh (`true` = không lọc) → mở ô Phường/xã
   ngay sau khi chọn tỉnh tải trang đầu của TẤT CẢ phường (10 "Đặc khu ..." đầu bảng chữ cái). Payload chỉ refetch khi filterOptions đổi
   (`Relationship/Input.js:549-581`), nên người dùng thấy (và bấm được) phường tỉnh khác trong khoảng trễ đó.
2. **Đổi tỉnh vẫn giữ phường cũ** — không có logic nào xoá `ward` khi `province` đổi (Payload không cascade). Ô vẫn hiện phường tỉnh A.
3. **Lỗi lộ UUID** — `validateWardInProvince` (`ward-in-province.ts:21-23`) gọi validator `relationship()` mặc định TRƯỚC; validator đó
   áp `filterOptions` (giờ đã lọc theo tỉnh B) → trả câu i18n mặc định "Trường này có lựa chọn không hợp lệ: \"<uuid>\"" trước khi tới
   câu tiếng Việt "Phường/xã không thuộc tỉnh/thành đã chọn." của mình.

## Hướng sửa (quyết định change-request — builder được chọn chi tiết, giữ đơn giản)
- (1)+(2): custom client Field component cho ô `ward` (vd `src/components/admin/WardField.tsx`), gắn qua `admin.components.Field` ở cả 3
  collection (qua helper chung trong `ward-in-province.ts` nếu gọn). Component đọc giá trị `province` từ form (cùng cấp — `useFormFields`
  theo path anh em), tính filterOptions ở CLIENT ngay khi tỉnh đổi (`{ wards: { province: { equals: id } } }`, chưa có tỉnh = không lọc)
  để danh sách đúng tỉnh ngay khi mở; và khi người dùng ĐỔI tỉnh (không phải lần render đầu / nạp bản ghi có sẵn) sang tỉnh khác → `setValue(null)`
  cho ward. Giữ nguyên label/required/description/error/readOnly như field relationship mặc định (tái dùng `RelationshipInput`/`RelationshipField`
  của `@payloadcms/ui`, không viết lại select). Nhớ `pnpm payload generate:importmap` nếu dự án dùng importMap (kiểm `src/app/(payload)/admin/importMap.js`).
- (3): `validateWardInProvince`: khi có ward + province → kiểm thuộc tỉnh TRƯỚC (trả câu tiếng Việt), rồi mới gọi validator mặc định cho phần còn lại
  (required, …). Không trả chuỗi nào chứa id.
- Server validate giữ nguyên ý nghĩa (API/seed vẫn bị chặn).

## Classification / Risk
- Type: **BUG** (admin form UX + validation message). Không đổi schema/DB/migration/API contract. Không đổi requirement (G22 đã yêu cầu lọc theo tỉnh).
- Risk: **MEDIUM-HIGH** — field + component dùng chung 3 collection, validate server. Reviewer: **STRICT** (shared field/validate).
- Blast radius: admin create/edit Dự án, Cho thuê, Tin BĐS (bản ghi có sẵn mở ra KHÔNG được tự xoá ward); API create/update qua validate.
- Doc impact: dự kiến `no doc impact` ngoài ghi chú as-built (change-request reconcile).

## Acceptance
- [x] Chọn tỉnh → mở ngay ô Phường/xã → chỉ phường của tỉnh đó (3 collection).
- [x] Chọn tỉnh A + phường của A → đổi tỉnh B → ô Phường/xã trống. Mở bản ghi có sẵn → phường giữ nguyên (không tự xoá khi nạp).
- [x] Lưu với phường sai tỉnh (vd qua API) → lỗi "Phường/xã không thuộc tỉnh/thành đã chọn." không có UUID.
- [x] Unit test: validator (thứ tự check, message không chứa uuid, required vẫn chạy), logic lọc/reset (hàm thuần hoặc component test).
- [x] `tests/e2e/admin/location-ward.spec.ts` PASS ở local nếu dev server + DB chạy được (change-request chạy; không có thì residual).
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/**` (trừ không), file dirty không thuộc task (`.claude/**`, `tools/**`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `test-results/**`).
- Không sửa test e2e trừ khi chứng minh test sai (ghi Decision log).
- KHÔNG commit (primary commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`)
- e2e: `pnpm exec playwright test tests/e2e/admin/location-ward.spec.ts --project=admin-content` (cần `pnpm dev` :3000 + Docker DB).
- Report: `.context/review-reports/bug-admin-province-ward-cascade-phase-1-task-01-round-<R>-review.md`

## Verification summary (change-request, 2026-10-28 — resume)
- Builder dừng giữa chừng 2026-10-26 (interrupted, attempt giữ 1). Kiểm lại trên đĩa: code + test đủ theo hướng sửa, không cần sửa thêm.
- Repro TRƯỚC: `test-results/summary.txt` — 9 FAILED (3 test × 3 collection). SAU: `E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test tests/e2e/admin/location-ward.spec.ts --project=admin-content` → 11 passed (dev server :3100, đã tắt).
- Probe tạm (đã xoá) 3 collection: chờ tải xong → 10/10 lựa chọn là phường Hà Nội; mở bản ghi có sẵn → ward giữ nguyên (Phú Thượng / Ba Đình / Bồ Đề); PATCH API đổi tỉnh giữ ward → 400, lỗi ward "Phường/xã không thuộc tỉnh/thành đã chọn." không UUID.
- `pnpm lint` toàn repo exit 0 · `pnpm typecheck` exit 0 · `pnpm test` 454 files / 4760 tests PASS (DB Docker chạy).
- Reviewer STRICT r1 PASS — `.context/review-reports/bug-admin-province-ward-cascade-phase-1-task-01-round-1-review.md`; 4 MINOR. MINOR-2 sửa trước commit: `validateWardWithOptionalProvince` kiểm "thiếu tỉnh" TRƯỚC (validator mặc định có thể trả câu có id) + 1 unit test; vitest file liên quan 11/11, eslint + typecheck PASS.
- Residual: MINOR-1 (WardField không bọc `withCondition`, bỏ qua `admin.width/style`, `sortOptions`, `appearance` — ward field hiện không dùng), MINOR-3 (e2e test 1/3 pass yếu: list rỗng lúc bấm ngay / lỗi rỗng vì phường đã bị bỏ chọn; chưa có e2e "mở bản ghi giữ phường"), MINOR-4 (điều hướng 2 bản ghi không remount → có thể xoá phường; Payload remount theo doc id).
- Doc impact: no doc impact (không đổi API/schema/behavior đã tài liệu hoá); no spec change (1.61.0) / test-scope v96.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Lọc + reset ở client vì server filterOptions luôn trễ 1 round-trip; validate server vẫn là chốt chặn.
- (builder) `src/components/admin/WardField.tsx` (client): bọc `RelationshipInput` của `@payloadcms/ui` (RelationshipField mặc định lấy `filterOptions` từ `useField`, không nhận qua prop nên không tái dùng được); `filterOptions` tính từ `useFormFields` của `province` cùng cấp (`provincePathOf`) → đúng ngay khi đổi tỉnh. Reset: `useRef` giữ tỉnh trước; chỉ `setValue(null)` khi tỉnh trước KHÁC null và đổi (nạp bản ghi / lần render đầu không xoá). Chọn tỉnh lần đầu (null→A) không xoá phường. Gắn qua hằng `WARD_FIELD_COMPONENT` trong `ward-in-province.ts` ở 3 collection; `importMap.js` sinh lại bằng `pnpm generate:importmap` (+1 import, +1 entry).
- (builder) `validateWardInProvince`: kiểm thuộc tỉnh (findByID) trước, rồi mới `relationship()` mặc định → không còn câu có UUID; `validateWardWithOptionalProvince` gọi lại hàm này nên hưởng chung. `wardFilterOptions` (server) giữ nguyên.
- (builder) Giới hạn đã biết: nếu điều hướng giữa 2 bản ghi mà component không remount, thay đổi tỉnh do nạp bản ghi mới có thể bị coi là người dùng đổi → xoá phường; cần e2e xác nhận (Payload remount theo doc id nên dự kiến không xảy ra).

## Verification summary (builder)
- `pnpm typecheck` (tsc --noEmit): PASS, không lỗi.
- eslint trên 7 file đổi/thêm: PASS (exit 0). `pnpm lint` toàn repo FAIL do lỗi sẵn có ở file minified ngoài scope (không thuộc task).
- `pnpm exec vitest run --project unit`: 233 file / 2442 test PASS (gồm `src/fields/ward-in-province.test.ts` 7 test, `src/components/admin/WardField.test.tsx` 3 test).
- `pnpm test` đầy đủ: project integration FAIL/skip vì không có DB local (Docker chưa chạy) — môi trường, không liên quan thay đổi.
- e2e `location-ward.spec.ts`: chưa chạy (không dev server/DB) — residual, change-request chạy.
