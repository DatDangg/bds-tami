# Task 06: Redis client, rate limit, xác thực Turnstile phía server

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — security: chống spam, rate limit dùng chung cho mọi endpoint công khai
- Blast radius: src/lib/redis.ts; src/lib/security/rate-limit.ts (cấu hình theo endpoint); src/lib/security/turnstile.ts; …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- BR-16
- NFR-04
- PERMISSION §5 (thứ tự kiểm tra)
- API_SPEC §3 (giới hạn từng endpoint)

## Description
Hạ tầng bảo vệ endpoint công khai: rate limit theo IP trên Redis (an toàn khi chạy nhiều bản app) và verify token Turnstile.

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-06`, `layer-2-task-07`, `layer-6-task-09`, `layer-7-task-02`, `layer-9-task-02`, `layer-9-task-05`

## Acceptance Criteria
- [x] Rate limit atomic (Lua/MULTI) theo khoá `endpoint:ipHash`, trả 429 kèm `Retry-After`
- [x] Cấu hình sẵn: leads 5/10 phút, job-applications 3/giờ, rentals 60/phút, click-events 30/phút (API_SPEC §3)
- [x] Turnstile verify gọi `siteverify` với secret từ env; token sai/thiếu → 400; lỗi mạng tới Cloudflare → 400 (fail closed), có log
- [x] Môi trường test dùng test key chính thức của Turnstile (luôn pass / luôn fail)
- [x] IP lấy từ `CF-Connecting-IP` chỉ khi có cấu hình proxy tin cậy, ngược lại dùng remote address; không lưu IP thô
- [x] Redis mất kết nối: endpoint công khai trả 503 thay vì bỏ qua rate limit (fail closed), ghi log

## Tests cần viết
- Integration với Redis dev: vượt ngưỡng → 429; hết cửa sổ → cho qua
- Unit Turnstile với fetch mock: pass/fail/timeout
- Unit pipeline: thứ tự rateLimit → turnstile → validate đúng PERMISSION §5

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-06-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS (reviewer xác minh)
- Verify commands + result: install --frozen-lockfile/lint/typecheck/test (273, rate-limit integration Redis thật)/build = PASS; audit high exit 0 (round 1)
- Reviewer verdict: STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-1-task-06-round-2-review.md`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: no doc impact (.env.example thêm TRUST_CF_CONNECTING_IP; follow-up deploy ở layer-3-task-03)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-06 security` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/redis.ts
- src/lib/security/rate-limit.ts (cấu hình theo endpoint)
- src/lib/security/turnstile.ts
- src/lib/security/client-ip.ts (đọc `CF-Connecting-IP` chỉ khi đi qua proxy tin cậy)
- src/endpoints/_middleware/public-pipeline.ts (rateLimit → verifyTurnstile → validate)

## Notes
- Header `CF-Connecting-IP` có thể bị giả nếu truy cập thẳng origin; chỉ tin khi Nginx đã giới hạn IP Cloudflare (task docker/nginx).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-05 (16/10/2026)
- n1: `src/lib/security/ip-hash.ts:9-14` chưa gộp IPv4-mapped dạng hex (`::ffff:cb00:7107`) về IPv4 vì kiểm IPv4-mapped chạy trước bước rút gọn IPv6 → đảo thứ tự + test, vì rate limit của task này dựa trên ipHash.
