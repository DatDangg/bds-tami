# Task 01: Giám sát phía app: GlitchTip (Sentry SDK), log JSON cho Loki, metrics Prometheus nội bộ

## Layer
3 — Bộ field nội dung dùng chung + giám sát app + Docker

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — instrumentation toàn app; nguy cơ lộ PII trong log/error
- Blast radius: sentry.server.config.ts, sentry.client.config.ts, instrumentation.ts; src/lib/logger.ts (pino JSON, redact PII); src/app/(payload)/api/metrics/route.ts hoặc server metrics riêng (chặn truy cập công khai); …
- Doc impact (dự kiến): ARCHITECTURE §8 nếu thành phần khác
- Decision impact: NO

## Requirements
- ARCHITECTURE §8 (giám sát)
- project-config `monitor_enabled: true`, `otel_service_name: tami-web`
- skills/monitoring

## Description
App gửi lỗi server + trình duyệt tới GlitchTip, log có cấu trúc ra stdout, expose metrics cho Prometheus chỉ trong mạng nội bộ.

## Dependencies
- `layer-2-task-06` `GET /api/health` (DB, Redis, S3) (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-06`, `layer-14-task-01`

## Acceptance Criteria
- [ ] Lỗi server/client gửi về GlitchTip khi có DSN; không có DSN thì tắt êm
- [ ] Logger redact: `phone`, `email`, `fullName`, `message`, `password`, cookie, header `authorization`
- [ ] Metrics (thời gian phản hồi, số 5xx, kết nối DB) chỉ truy cập được với token hoặc từ mạng nội bộ; Nginx không public đường này
- [ ] Service name `tami-web`, env theo `APP_ENV`

## Tests cần viết
- Unit logger: object có PII → bị redact
- Integration: `/api/metrics` không token → 401/404

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-01-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: ARCHITECTURE §8 nếu thành phần khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-01 monapp` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- sentry.server.config.ts, sentry.client.config.ts, instrumentation.ts
- src/lib/logger.ts (pino JSON, redact PII)
- src/app/(payload)/api/metrics/route.ts hoặc server metrics riêng (chặn truy cập công khai)
- .env.example (`GLITCHTIP_DSN`, `METRICS_TOKEN`)

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G4 — app/jobs không được chết khi DB sập: getPayload lúc DB down sinh unhandled rejection; kiểm/ cài handler hoặc healthcheck restart hợp lý. G5 — integration test chập chờn ~1/3: tests/integration/session-refresh.test.ts:41-44 afterAll xoá không kiểm staffId.
- Stack giám sát (Prometheus/Grafana/Loki/GlitchTip/Uptime Kuma) dựng ở task monitoring-stack.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
