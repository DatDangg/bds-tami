# Task 06: `GET /api/health` (DB, Redis, S3)

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — endpoint đơn giản, không lộ dữ liệu
- Blast radius: src/endpoints/health.ts (hoặc route `src/app/(payload)/api/health/route.ts`); tests/integration/health.test.ts
- Doc impact (dự kiến): API_SPEC §3 nếu shape response khác
- Decision impact: NO

## Requirements
- API_SPEC §3 (`/api/health`)
- ARCHITECTURE §6.4 bước 3, §8
- NFR-06

## Description
Endpoint health check cho deploy, Docker HEALTHCHECK và Uptime Kuma.

## Dependencies
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)

Mở khoá cho: `layer-3-task-01`, `layer-3-task-03`

## Acceptance Criteria
- [ ] 200 `{ status: "ok", checks: { db, redis, storage } }` khi tất cả ổn; 503 nếu một thành phần lỗi
- [ ] Không trả version chi tiết, host, chuỗi kết nối, stack trace
- [ ] Timeout mỗi check ≤ 2 giây; header `Cache-Control: no-store`

## Tests cần viết
- Integration: tất cả up → 200; Redis tắt (mock) → 503 với `redis: "down"`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-06-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: API_SPEC §3 nếu shape response khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-06 health` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/health.ts (hoặc route `src/app/(payload)/api/health/route.ts`)
- tests/integration/health.test.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
