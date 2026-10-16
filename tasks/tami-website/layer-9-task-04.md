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
- [ ] Đếm 30 phút theo giờ hành chính; lead tới ngoài giờ đếm từ đầu giờ làm kế tiếp
- [ ] Mỗi lead chỉ nhắc 1 lần cho mỗi mốc (không spam mỗi 10 phút)
- [ ] Một email gộp danh sách lead; không chứa SĐT/email khách (chỉ mã lead + link admin)

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
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ERD §4.11 nếu thêm `remindedAt`)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-04 leadremind` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/lib/leads/business-hours.ts (`businessMinutesBetween`)
- src/jobs/remind-unassigned-leads.ts
- src/lib/email/templates/unassigned-reminder.ts

## Notes
- Chưa trừ ngày lễ (giả định spec).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
