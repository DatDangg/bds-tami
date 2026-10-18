# Task 04: Job `remind-unassigned-leads` theo giờ hành chính (BR-14)

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — cron + logic thời gian
- Blast radius: src/lib/leads/business-hours.ts (`businessMinutesBetween`); src/jobs/remind-unassigned-leads.ts; src/lib/email/templates/unassigned-reminder.ts
- Doc impact (dự kiến): ERD §4.11 nếu thêm `remindedAt`
- Decision impact: NO

## Requirements
- BR-14
- SPECIFICATIONS § Quy tắc biên (giờ hành chính 08:00–17:30, T2–T7, giờ VN)
- ARCHITECTURE §5.4

## Description
Mỗi 10 phút trong giờ hành chính nhắc admin các lead `new` chưa giao quá 30 phút làm việc.

## Dependencies
- `layer-8-task-02` Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao) (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [x] Đếm 30 phút theo giờ hành chính; lead tới ngoài giờ đếm từ đầu giờ làm kế tiếp
- [x] Mỗi lead chỉ nhắc 1 lần cho mỗi mốc (không spam mỗi 10 phút)
- [x] Một email gộp danh sách lead; không chứa SĐT/email khách (chỉ mã lead + link admin)

## Tests cần viết
- Unit `businessMinutesBetween`: tối thứ 7 → sáng thứ 2; trước 08:00; sau 17:30; Chủ nhật
- Integration: chạy job 2 lần → 1 email

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-04-round-<R>-review.md`

## Migration
- Có thể cần cột `remindedAt` trên `leads` → migration additive (cột nullable). Cập nhật ERD.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 3/3 đạt (builder)
- Verify commands + result (builder, worktree wt9-t04): lint PASS · typecheck PASS · test 1938/1938 PASS (chỉ `src/lib/contrast.test.ts` fail do CRLF, đã biết, ngoài scope) · build PASS · integration `remind-unassigned-leads` 6/6 + migration up→down→up PASS
- Reviewer verdict: STRICT round 1 PASS (`.context/review-reports/build-tami-website-layer-9-task-04-round-1-review.md`); MINOR-1 job chạy chồng → `layer-9-task-06.md`; MINOR-2 index quét, MINOR-3 lastActivityAt lệch ~30' chấp nhận
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: ARCHITECTURE §5.4 (lịch cron + cách nhắc) và ERD §4.11 (`remindedAt` + as-built) đã cập nhật
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-04 leadremind` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/leads/business-hours.ts (`businessMinutesBetween`)
- src/jobs/remind-unassigned-leads.ts
- src/lib/email/templates/unassigned-reminder.ts
- src/lib/email/templates/index.ts (đăng ký template), src/jobs/index.ts (đăng ký job), src/collections/Leads.ts (`remindedAt`), migrations/20261018_113101_leads_reminded_at.* (+ index.ts), src/payload-types.ts, docs/ARCHITECTURE.md §5.4, docs/ERD.md §4.11

## Notes
- Chưa trừ ngày lễ (giả định spec).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Builder notes (as-built)
- Mốc đếm = `createdAt` của lead; nhắc đúng một lần (`remindedAt`), không có mốc thứ hai. Lead đã giao rồi bỏ giao vẫn tính từ `createdAt`.
- Cron `0 */10 1-10 * * 1-6` (UTC) + `isBusinessHour` trong handler bỏ lần 17:30–17:50 VN.
- Migration `20261018_113101_leads_reminded_at`: additive (`ADD VALUE IF NOT EXISTS` x2 cho enum task jobs, `ADD COLUMN IF NOT EXISTS reminded_at` nullable); `down` xoá row `payload_jobs_log`/`payload_jobs` của task rồi dựng lại enum, `IF EXISTS`.
