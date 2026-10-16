# Task 07: Payload Jobs Queue + email Brevo SMTP + job `send-notification-email`

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — cron/job dùng chung + gửi email ra ngoài
- Blast radius: src/jobs/index.ts (đăng ký tasks/workflows, lịch cron); src/jobs/send-notification-email.ts; src/lib/email/transport.ts, templates/*.ts (tiếng Việt); …
- Doc impact (dự kiến): ARCHITECTURE §5.4 nếu tên job/lịch khác
- Decision impact: NO

## Requirements
- BR-13 (hạ tầng)
- BR-21 (hạ tầng)
- ARCHITECTURE §5.4, D3
- ARCHITECTURE §6.3 (staging chỉ gửi email nội bộ)

## Description
Bật Payload Jobs (chạy trong process `jobs` riêng, cùng image), adapter email nodemailer (Brevo SMTP), job gửi email chung có template tiếng Việt, và chặn gửi ra ngoài ở staging.

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-07`, `layer-3-task-03`, `layer-6-task-08`, `layer-6-task-09`, `layer-7-task-01`, `layer-9-task-02`, `layer-9-task-03`, `layer-9-task-04`, `layer-9-task-07`, `layer-16-task-01`

## Acceptance Criteria
- [ ] Job lưu trong Postgres (`payload-jobs`), không mất khi restart; retry có backoff
- [ ] Process `pnpm jobs` chạy được tách khỏi web app; web app không tự chạy job nặng
- [ ] `send-notification-email` nhận `{ template, to[], data }`, render template tiếng Việt, gửi qua SMTP
- [ ] Khi `APP_ENV=staging` chỉ gửi tới địa chỉ trong `EMAIL_ALLOWLIST`, địa chỉ khác bị bỏ và ghi log
- [ ] Không log nội dung email chứa dữ liệu cá nhân (chỉ log id job, template, số người nhận)

## Tests cần viết
- Integration: enqueue job → runner chạy → transport mock nhận đúng 1 email
- Unit allowlist: staging lọc đúng; production không lọc
- Unit template: render đủ biến, escape HTML

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-07-round-<R>-review.md`

## Migration
- Bảng hàng đợi `payload_jobs` do Payload sinh. Additive.
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
- Doc impact result: pending (dự kiến: ARCHITECTURE §5.4 nếu tên job/lịch khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-07 jobs` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/jobs/index.ts (đăng ký tasks/workflows, lịch cron)
- src/jobs/send-notification-email.ts
- src/lib/email/transport.ts, templates/*.ts (tiếng Việt)
- src/lib/email/allowlist.ts (env `EMAIL_ALLOWLIST` cho staging)
- scripts/jobs-runner.ts (lệnh `pnpm jobs`)
- migrations/* (bảng `payload_jobs`)

## Notes
- Các job nghiệp vụ (nhắc lead, hết hạn ưu đãi, dọn dữ liệu, dịch) làm ở task riêng của từng nghiệp vụ.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
