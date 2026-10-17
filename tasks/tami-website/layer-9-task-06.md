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
- [ ] Lead `lastActivityAt` > 24 tháng: xoá `fullName`, `phone`, `phoneNormalized`, `email`, `message`; đặt `anonymizedAt`; giữ số liệu
- [ ] Hồ sơ > 12 tháng: xoá file CV khỏi bucket private + bản ghi `private-files`, ẩn danh trường cá nhân
- [ ] `audit-logs` > 24 tháng xoá; `click-events` > 90 ngày (nếu task click chưa xoá)
- [ ] Xử lý theo lô (batch), idempotent, có `dryRun` để kiểm tra; log số lượng, không log dữ liệu
- [ ] Không đụng nội dung (dự án, tin…)

## Tests cần viết
- Integration với dữ liệu ngày giả: đúng bản ghi bị ẩn danh, bản ghi mới giữ nguyên
- Integration: dryRun không thay đổi gì
- Integration: file CV bị xoá khỏi storage

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-06-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ERD §7 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-06 retention` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

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
