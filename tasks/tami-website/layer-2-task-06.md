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
- Attempt: 2
- Last failure type: reviewer round 1 FAIL (M1: DB probe qua getPayload sinh unhandled rejection khi DB chết)
- Error memory entry: none (fix: pg.Pool riêng max:1 + connect/query timeout + on("error"); m1 s3-config dùng chung + HEALTH_CHECK_TIMEOUT_MS; m3 check cả 2 bucket)
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: code đủ 3 tiêu chí (200/503, không lộ chi tiết, timeout 2s + no-store); chờ reviewer
- Verify commands + result (attempt 2): lint PASS; typecheck PASS; build PASS; `vitest run src/lib/health tests/integration/health.test.ts`: unit 4/4 + test mới probes.test.ts (DB down -> 503/db down, không lộ thông tin, không unhandledRejection, không cần Docker) PASS, KHÔNG còn Unhandled Rejection; integration "Redis tắt -> 503" PASS, "all up -> 200" ENV-BLOCKED (Docker tắt). `pnpm test` full: 306 passed / 9 failed (toàn integration ECONNREFUSED, ENV-BLOCKED); 4 unhandled rejection còn lại đến từ các integration khác dùng getPayload khi DB chết, không phải từ health
- Reviewer verdict: NORMAL PASS round 2 (.context/review-reports/build-tami-website-layer-2-task-06-round-2-review.md); round 1 FAIL (unhandled rejection getPayload khi DB chết). Residual: đường 200 trên hạ tầng thật chưa chạy (Docker off) — chạy tests/integration/health.test.ts khi Docker bật trước khi dùng làm CD gate; 4 unhandled rejection còn lại từ integration test khác (getPayload lúc DB chết, có trước task này). MINOR n1 tên test probes nói 503, n2 không có hàm đóng pool — không chặn.
- Verify sau commit (2026-10-16T16:19:21.000Z, Docker dev tami-* bật): pnpm test 44 files / 420 tests PASS, 0 unhandled rejection — residual env-blocked đã đóng.
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/API_SPEC.md §3.5 thêm shape GET /api/health (as-built)
- Decision log: none

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-06 health` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/health.ts (hoặc route `src/app/(payload)/api/health/route.ts`)
- tests/integration/health.test.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
