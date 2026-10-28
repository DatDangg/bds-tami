# bug-admin-date-format-vi · phase-1-task-01 — Ô ngày/giờ admin hiện định dạng Việt (dd/MM/yyyy HH:mm), bỏ tên tháng EN / AM-PM

- Change doc: `spec/changes/archive/2026-10-26-admin-date-format-vi.md` (BACKLOG BL-076)
- Evidence: `tests/e2e/admin/collection-suite.ts` test "07 mở bản ghi có sẵn" (chưa commit — chỉ dùng chạy repro)
- Auto proceed: user 2026-10-28 "dở thì làm nốt đi, rồi làm tiếp mấy cái 73 76 78" → không checkpoint phase plan.

## Root cause (change-request, đọc code + Payload 3.91.0, đã repro)
- `src/payload.config.ts:47` đặt `admin.dateFormat: "dd/MM/yyyy HH:mm"` — config này CHỈ dùng cho ô danh sách (DateCell) và thông tin tài liệu
  (Ngày tạo/Cập nhật). Ô nhập của field `type: "date"` render qua `@payloadcms/ui/dist/elements/DatePicker/DatePicker.js:41-60`,
  định dạng lấy từ `field.admin.date.displayFormat`; thiếu thì Payload hard-code theo `pickerAppearance`:
  `dayAndTime` → `"MMM d, yyy h:mm a"` ("Oct 19, 2026 10:26 AM"), `dayOnly` → `"MMM dd"` ("Oct 17"), `default` → `"MM/dd/yyyy"`,
  `timeOnly` → `"h:mm a"`, `monthOnly` → `"MMMM"`; danh sách giờ trong picker `timeFormat` mặc định `"h:mm aa"` (AM/PM).
- Không field date nào trong `src/` đặt `displayFormat`/`timeFormat` → mọi ô ngày ở form + cột phải hiện kiểu Mỹ/EN.
- Repro TRƯỚC (dev :3100, `E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --project=admin-content -g "07 mở bản ghi"`):
  4 failed — Dự án `"Oct 19, 2026 10:26 AM"`, Tin BĐS `"Oct 19, 2026 10:27 AM"`, Trang pháp lý `"Oct 17"`, Tuyển dụng `"Oct 18, 2026 12:53 AM"`
  (Cho thuê / Tin tức / Dịch vụ / Lead pass do bản ghi đầu không có ô ngày có giá trị — lỗi vẫn có về cấu trúc).

## Hướng sửa (quyết định change-request — builder chọn chi tiết, giữ đơn giản)
- Một module dùng chung (vd `src/fields/admin-date.ts`) giữ định dạng Việt theo `pickerAppearance`:
  `dayAndTime` → `dd/MM/yyyy HH:mm` (+ `timeFormat: "HH:mm"`), `dayOnly`/`default` → `dd/MM/yyyy`, `timeOnly` → `HH:mm` (+ `timeFormat: "HH:mm"`),
  `monthOnly` → `MM/yyyy`. Xuất helper (vd `adminDate("dayAndTime")` trả `{ pickerAppearance, displayFormat, timeFormat? }`) và
  dùng nó ở MỌI field `type: "date"` hiện có (danh sách: `grep -rn 'type: "date"' src`), kể cả field không khai `admin.date`
  (ClickEvents, Staff, translation `translatedAt` hidden — đặt cho đồng bộ; field hidden không bắt buộc nếu ghi rõ lý do).
  Giữ nguyên `pickerAppearance` hiện tại của từng field (không đổi hành vi chọn ngày/giờ). `payload.config.ts` có thể dùng chung hằng `dd/MM/yyyy HH:mm`.
- KHÔNG đụng hành vi BL-091: `publishedAtField({ scheduled: true })` vẫn sửa được (ngày + giờ), `ScheduledPublishDisplay` (Cell + Notice) giữ nguyên;
  chỉ đổi định dạng hiển thị. Ô list dùng `displayFormat` của field nếu có (Payload DateCell) → định dạng Việt trùng global, không lệch.
- Unit test chặn hồi quy: duyệt toàn bộ field của `ADMIN_COLLECTIONS` + `ADMIN_GLOBALS` (đệ quy qua tabs/row/collapsible/group/array/blocks)
  → mọi field `type: "date"` có `admin.date.displayFormat` không chứa `MMM`/`a` (AM-PM), và `timeFormat` (khi có giờ) là 24h. Test helper map định dạng.
- Không đổi schema/DB (displayFormat chỉ là admin config) → kiểm `pnpm payload generate:types` không đổi `payload-types.ts`, không migration.
  Nếu importMap không đổi thì không đụng `importMap.js`.

## Classification / Risk
- Type: **BUG** (định dạng hiển thị admin). Không đổi requirement / schema / API contract / dữ liệu lưu (ISO giữ nguyên).
- Risk: **MEDIUM** — config dùng chung cho mọi ô ngày admin (~23 field, 14 file); rủi ro gõ tay ngày theo định dạng mới bị parse sai
  (react-datepicker parse theo `dateFormat`) → kiểm chọn/gõ ngày vẫn lưu đúng. Reviewer: **STRICT** (shared field config).
- Blast radius: form + cột phải + ô danh sách có date ở mọi collection admin; Tin tức hẹn giờ (BL-091).
- Doc impact: dự kiến `no doc impact` (as-built không ghi định dạng ô ngày) — change-request reconcile.

## Acceptance
- [x] Mọi ô ngày ở Dự án, Cho thuê, Tin BĐS, Tin tức, Trang pháp lý, Tuyển dụng (và collection khác dùng date) hiện `dd/MM/yyyy[ HH:mm]`, không tên tháng EN / AM-PM.
- [x] Test e2e "07 mở bản ghi có sẵn" PASS cho 6 collection (change-request chạy, dev :3100).
- [x] Unit test cấu hình định dạng ngày (helper + quét toàn bộ date field).
- [x] Tin tức: ô "Ngày xuất bản" vẫn chọn ngày + giờ, lưu đúng, nhãn hẹn giờ không đổi.
- [x] `pnpm lint` (toàn repo) · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/**`, file dirty không thuộc task (`.claude/**`, `tools/**`, `package.json`, `pnpm-lock.yaml`,
  `.gitignore`, `playwright.config.ts`, `tests/e2e/admin/**`, `docs/content-intake/`, `docs/testing/`, `test-results/**`).
- KHÔNG commit (change-request commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`)
- e2e: `E2E_BASE_URL=http://localhost:3100 pnpm exec playwright test --project=admin-content -g "07 mở bản ghi"` (dev server :3100 + Docker DB).
- Report: `.context/review-reports/bug-admin-date-format-vi-phase-1-task-01-round-<R>-review.md`

## Verification summary (change-request, 2026-10-28)
- Builder (attempt 1): `src/fields/admin-date.ts` `adminDate(pickerAppearance)` + `VN_DATE_TIME_FORMAT`; áp mọi field `type: "date"` (14 file + payload.config); test `src/fields/admin-date.test.ts` quét 38 field date của ADMIN_COLLECTIONS/GLOBALS.
- Repro TRƯỚC: e2e "07 mở bản ghi có sẵn" (dev :3100) 4 failed. SAU: 10 passed, 2 skipped (Hồ sơ ứng tuyển / Đăng ký bản tin chưa có bản ghi), 0 failed. Dev server đã tắt.
- Probe Edge (không lưu): Trang pháp lý form `17/10/2026`; Lead danh sách `19/10/2026 11:33`; Tin tức ô "Ngày xuất bản" danh sách giờ `09:00, 09:30…` (24h), gõ `30/11/2026 09:15` + Tab giữ nguyên (parse đúng).
- `pnpm lint` toàn repo exit 0 · `pnpm typecheck` exit 0 · `pnpm test` 455 files / 4807 tests PASS · `generate:types` không đổi `payload-types.ts`, importMap không đổi.
- Reviewer STRICT r1 PASS — `.context/review-reports/bug-admin-date-format-vi-phase-1-task-01-round-1-review.md`; 3 MINOR sửa trước commit: Staff.lastLoginAt + JobApplications.anonymizedAt → `dayAndTime` (cột danh sách giữ giờ), thứ tự import JobPostings/market-blocks, test chặn thêm `h` (12 giờ). Sau sửa: vitest admin-date 46/46, lint + typecheck exit 0.
- Doc impact: no doc impact (as-built không ghi định dạng ô ngày); no spec change (1.61.0); test-scope v97 (v96 archive).
- Residual: gõ tay ngày chỉ probe ô ngày-giờ; ô chỉ-ngày dùng cùng cơ chế parse (rủi ro thấp). Staging chưa kiểm (sau deploy).
