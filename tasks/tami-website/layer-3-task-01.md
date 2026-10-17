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
- [x] Lỗi server/client gửi về GlitchTip khi có DSN; không có DSN thì tắt êm
- [x] Logger redact: `phone`, `email`, `fullName`, `message`, `password`, cookie, header `authorization`
- [x] Metrics (thời gian phản hồi, số 5xx, kết nối DB) chỉ truy cập được với token hoặc từ mạng nội bộ; Nginx không public đường này
- [x] Service name `tami-web`, env theo `APP_ENV`

## Tests cần viết
- Unit logger: object có PII → bị redact
- Integration: `/api/metrics` không token → 401/404

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-01-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 3 (builder fix round-2 review FAIL: MAJOR-A scrubText lọt SĐT sau ngày, MINOR-A logger msg trong object + %o/%O/%j + child, MINOR-B tách SERVICE_NAME khỏi pino cho client, MINOR-C Cache-Control private; reviewer round 3 STRICT PASS). Attempt 2: fix round-1 (MAJOR-1 PII qua `msg`, MAJOR-2 env/DSN client runtime, MINOR-1..5)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 4/4 đạt (reviewer STRICT PASS round 3): GlitchTip bật khi có DSN / tắt êm khi không (test `initSentryIfConfigured`); logger redact cả lồng (unit); /api/metrics 401/404/200 (integration) + smoke `next start`; service `tami-web`, env theo APP_ENV lúc chạy (server qua `sentry.server.config`, trình duyệt qua `GET /api/monitoring-config`; DSN trình duyệt = `GLITCHTIP_PUBLIC_DSN`, không còn NEXT_PUBLIC_*)
- Verify commands + result (attempt 2): `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 60 files / 558 tests PASS (gồm integration thật trên Docker dev) · `pnpm build` OK (có route `/api/monitoring-config`). Residual: chưa upload source map (không dùng withSentryConfig) → stack trình duyệt trên GlitchTip bị minify, follow-up task deploy; chưa đo bundle client (SDK nay tải động chỉ khi có DSN)
- Dependency mới: @sentry/nextjs 10.76.0 (02/10/2026, peer next ^16), pino 9.14.0 (trùng bản của payload, không nhân đôi)
- Attempt 3 fix: MAJOR-A ngày là nhánh riêng cùng regex với SĐT (ngày chỉ nuốt phần ngày, SĐT liền sau vẫn bị che); MINOR-A `scrubRecordMessage` + stringify/lọc tham số `%o/%O/%j`; MINOR-B `src/lib/monitoring/service-name.ts` không import gì; MINOR-C `private, max-age=300`
- Verify commands + result (attempt 3): `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 60 files / 563 tests PASS (integration thật trên Docker dev; lần chạy đầu ngay sau khi bật lại container có 1 lỗi health 503 do SeaweedFS warm-up, chạy lại PASS) · `pnpm build` OK; chunk client không còn pino/__tamiLogger
- Reviewer verdict: STRICT PASS round 3 (`.context/review-reports/build-tami-website-layer-3-task-01-round-3-review.md`). Residual MINOR (không chặn PASS): MINOR-1 lookbehind `(?<!d)` trong `scrub-text.ts` nằm ở chunk client → SyntaxError trên Safari/iOS < 16.4 (ngoài ma trận NFR-08, nên sửa trước deploy prod); MINOR-2 `%s` với Error / `%d` chưa lọc (chưa có call site); MINOR-3 mẫu SĐT che nhầm số dài (timestamp ms, UUID, số TK) và lọt `(028) 3823 4567` — có từ round 1; MINOR-4 builder tự ghi file journal phụ → đã gộp vào journal chính và xoá
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-3.md`)

## Doc / Decision Impact
- Doc impact result: đã cập nhật as-built `docs/ARCHITECTURE.md` §5.1 (ngoại lệ cache), §6.3 (env mới), §8 (giám sát/log/GlitchTip/metrics/process). Không đụng intent docs
- Decision log: DSN trình duyệt lấy runtime qua `/api/monitoring-config` (không NEXT_PUBLIC_*) để image promote staging→prod đúng env

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-01 monapp` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- sentry.server.config.ts, sentry.client.config.ts, instrumentation.ts
- src/lib/logger.ts (pino JSON, redact PII)
- src/app/(payload)/api/metrics/route.ts hoặc server metrics riêng (chặn truy cập công khai)
- .env.example (`GLITCHTIP_DSN`, `METRICS_TOKEN`)

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G4 — app/jobs không được chết khi DB sập: getPayload lúc DB down sinh unhandled rejection; kiểm/ cài handler hoặc healthcheck restart hợp lý. G5 — integration test chập chờn ~1/3: tests/integration/session-refresh.test.ts:41-44 afterAll xoá không kiểm staffId.
- Stack giám sát (Prometheus/Grafana/Loki/GlitchTip/Uptime Kuma) dựng ở task monitoring-stack.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
