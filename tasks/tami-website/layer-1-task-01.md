# Task 01: CI GitHub Actions: lint, typecheck, test, build, audit

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: SHARED_FOUNDATION
- Review level expected: **NORMAL** — chỉ file workflow, không đụng code app
- Blast radius: .github/workflows/ci.yml; .github/dependabot.yml; package.json (script `test:ci` nếu cần)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- NFR-10
- ARCHITECTURE §6.4 bước 1
- .agent/devops.md Phase 1.5

## Description
Workflow CI chạy trên mọi push vào `staging` và pull request: cài đặt frozen, lint, typecheck, test (có service Postgres+PostGIS và Redis), build, `pnpm audit`. Chưa deploy (task CD riêng).

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-05`

## Acceptance Criteria
- [ ] Trigger: `push` vào `staging`, `pull_request`; `concurrency` huỷ run cũ cùng ref
- [ ] Các bước: setup pnpm + Node LTS có cache → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` → `pnpm audit --audit-level high`
- [ ] Service container `postgis/postgis` (có `unaccent`, `pg_trgm`) và `redis` cho test integration; env test không dùng secret thật
- [ ] Không có bước push/deploy; không đụng nhánh `main`
- [ ] Dependabot cho npm + github-actions, nhắm nhánh `staging`

## Tests cần viết
- Kiểm cú pháp workflow bằng `actionlint` (nếu có sẵn) hoặc ghi `skip` kèm lý do
- Chạy local tương đương: các lệnh verify đều PASS

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-01-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-01 ci` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- .github/workflows/ci.yml
- .github/dependabot.yml
- package.json (script `test:ci` nếu cần)

## Notes
- CI chỉ chạy thật khi user push lên GitHub (push không tự động, `auto_push_after_pass: false`).
- Semgrep/ocr là tuỳ chọn, không chặn ở giai đoạn này.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
