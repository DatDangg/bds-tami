# Task 06: Job `data-retention`: ẩn danh lead 24 tháng, xoá CV 12 tháng, dọn log

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — xoá/ẩn danh dữ liệu hàng loạt (data loss)
- Blast radius: src/jobs/data-retention.ts; src/lib/retention/*.ts
- Doc impact (dự kiến): ERD §7 nếu lệch
- Decision impact: NO

## Requirements
- BR-31
- LGL-03
- ERD §7

## Description
Job hằng tuần thực thi thời hạn lưu dữ liệu.

## Dependencies
- `layer-8-task-02` Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao) (dùng kết quả của task này)
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-2-task-07` Ghi lượt bấm Hotline/Zalo/Fanpage: `click-events`, `click-stats-daily`, endpoint + job gộp (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [x] Lead `lastActivityAt` > 24 tháng: xoá `fullName`, `phone`, `phoneNormalized`, `email`, `message`; đặt `anonymizedAt`; giữ số liệu
- [x] Hồ sơ > 12 tháng: xoá file CV khỏi bucket private + bản ghi `private-files`, ẩn danh trường cá nhân
- [x] `audit-logs` > 24 tháng xoá; `click-events` > 90 ngày (nếu task click chưa xoá)
- [x] Xử lý theo lô (batch), idempotent, có `dryRun` để kiểm tra; log số lượng, không log dữ liệu
- [x] Không đụng nội dung (dự án, tin…)

## Tests cần viết
- Integration với dữ liệu ngày giả: đúng bản ghi bị ẩn danh, bản ghi mới giữ nguyên
- Integration: dryRun không thay đổi gì
- Integration: file CV bị xoá khỏi storage

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-06-round-<R>-review.md`

## Migration
- Cần migration `20261018_130000_data_retention` (đúng thực tế; ghi chú ban đầu "không đụng schema" đã lỗi thời): chỉ thêm giá trị enum `data-retention` cho `payload_jobs(_log).task_slug` và `system.data_retention` cho `audit_logs.action` (additive). `down` xoá job/log của task, KHÔNG xoá audit và giữ enum audit (quyết định user 2026-10-18).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): C1 dọn CV mồ côi xoá cả file nội bộ; M1 plugin nuốt lỗi xoá S3; M2 trùng id advisory lock
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (203 file, 2.143) · `pnpm build` PASS; migration up→down→down→up; đã áp DB dev
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-9-task-06-round-2-review.md`); user quyết Q1–Q5 (progress.json decisions 2026-10-18T21:25)
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ERD §7 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-06 retention` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/jobs/data-retention.ts
- src/lib/retention/*.ts

## Notes
- Thời hạn là giả định A4; đặt hằng số cấu hình để chỉnh qua `/change`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-07 (16/10/2026)
- Job hết retry (`payload_jobs` có `hasError`/`totalTried` max) giữ PII khách trong `input` và bảng `payload_jobs_log` → `data-retention` phải xoá/ẩn danh các job lỗi cũ (vd > 7 ngày) cùng log của chúng.

## Follow-up từ review layer-5-task-04
- [ ] Xoá CV hết hạn: đặt `job-applications.cv = null` + `anonymizedAt` TRƯỚC rồi mới xoá `private-files` (cv chỉ bắt buộc khi chưa ẩn danh; FK `ON DELETE SET NULL`).
- [ ] Không dùng xoá hàng loạt theo `where` trên `job-applications` qua Local API (overrideAccess bỏ qua `disableBulkDelete`, mất rollback CV/audit) — lặp xoá theo id hoặc chỉ ẩn danh.

## Follow-up từ spec-validation layer 5 addendum
- [ ] G23: cột PII của `job-applications` (fullName, phone, email…) đang NOT NULL → ẩn danh bằng giá trị thay thế cố định (vd "Đã ẩn danh"), không đặt NULL; thống nhất với L8-T02 (lead).

## Follow-up từ review layer-6-task-09
- [ ] Dọn CV mồ côi: `private-files` loại CV không có `job-applications` nào trỏ tới và cũ hơn N giờ (tiến trình chết giữa lưu CV và tạo hồ sơ) → xoá row + object S3.

## Follow-up từ review layer-9-task-04 round 1 (MINOR)
- [ ] `src/jobs/remind-unassigned-leads.ts:33-51,76`: không chặn hai lần chạy chồng (đọc ứng viên ngoài transaction, update không kiểm lại `remindedAt IS NULL`) → `pg_advisory_xact_lock` + đọc lại ứng viên trong transaction (mẫu `last-admin-guard.ts:38`) hoặc update có điều kiện. Áp cùng cơ chế cho `data-retention`.
- [ ] (tuỳ chọn) index cho truy vấn quét lead nhắc (`status, assigned_to_id, reminded_at, created_at`) khi dữ liệu lớn.

## Follow-up từ review layer-9-task-06 round 2 (MINOR)
- [ ] Test "object S3 đã xoá rồi commit lỗi" (hồ sơ còn trỏ CV không file → lần sau xử lý).
- [ ] `src/lib/retention/delete-private-file.ts:27-28` giả định bucket không có prefix → dựng key từ prefix lưu trữ hoặc kiểm `HeadObject`.
- [ ] `run-data-retention.ts:59-66` audit meta ghi thêm số bước/bản ghi lỗi.
- (primary sửa) regex `.pdf` ở `tests/integration/media-upload.test.ts`.
