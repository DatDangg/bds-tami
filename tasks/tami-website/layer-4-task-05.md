# Task 05: CD GitHub Actions: image theo SHA → staging (migrate, health) → duyệt tay → production

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — pipeline deploy + migration + secret
- Blast radius: .github/workflows/deploy.yml; scripts/deploy/deploy.sh (chạy trên server: pull image, migrate, up, health, rollback, `docker builder prune`); docs/runbooks/deploy.md
- Doc impact (dự kiến): docs/runbooks/deploy.md (mới); ARCHITECTURE §6.4 chốt cách runner (self-hosted `/opt/actions-runner-tami` hay SSH) — ghi `.context/decisions.md`
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- NFR-10
- ARCHITECTURE §6.4
- AGENTS.md Non-negotiables (migration, không push main, prod cần duyệt)
- .agent/devops.md Phase 3

## Description
Workflow deploy: build image tag SHA, đẩy registry, deploy staging (`payload migrate` rồi khởi động, health check, rollback nếu fail), job production cần duyệt tay qua GitHub Environment và dùng đúng image đã chạy ở staging.

## Dependencies
- `layer-1-task-01` CI GitHub Actions: lint, typecheck, test, build, audit (dùng kết quả của task này)
- `layer-3-task-03` Dockerfile + Compose staging/prod + cấu hình Nginx host (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-12-task-01`

## Acceptance Criteria
- [x] Chỉ chạy sau CI PASS trên nhánh `staging`; không có trigger từ `main`
- [x] Staging: `payload migrate` chạy **trước** khi đổi container app; health check `/api/health` thất bại → quay về image trước
- [x] Production: GitHub Environment `production` có required reviewers; deploy đúng digest image đã qua staging
- [x] Migration có đánh dấu `HIGH_RISK_MIGRATION` → chặn promote production (kiểm trong script)
- [x] Không in secret ra log; secret lấy từ GitHub Secrets/`.env` trên server
- [x] Dọn build cache sau deploy nếu build trên server

## Tests cần viết
- `actionlint` (nếu có); `shellcheck scripts/deploy/deploy.sh`
- Chạy thử `deploy.sh` ở chế độ `--dry-run` local

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-05-round-<R>-review.md`

## Migration
- Không tạo migration; định nghĩa cách chạy migration khi deploy.

## Retry / Error Memory
- Attempt: 2 (builder, sau reviewer round 1 FAIL: MAJOR-1/2 + MINOR-1..6)
- Last failure type: review FAIL round 1 — MAJOR-1 thư mục deploy dùng chung upload ngoài flock (production có thể chạy compose chưa duyệt); MAJOR-2 `compose up -d app jobs` lỗi thì `set -e` thoát không rollback
- Error memory entry: none (lỗi thiết kế/thiếu test, không phải lỗi môi trường)
- Fix attempt 2: release bất biến `/opt/tami/releases/<env>/<sha>` + `deploy.sh` chạy từ release đó + symlink `current` nguyên tử trong flock + staging.history `<digest> <ts> <sha>`; `up` nằm trong `if ... && wait_for_health && jobs_running` → rollback (exit 1; rollback lỗi → exit 3); pin SHA action; `--allow-older`; trap/rm container tạm; jobs ổn định 3×5s; kiểm staging.history trước pull; tách `lib/{high-risk-gate,state,release}.sh` (deploy.sh 284 dòng)
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria (builder tự kiểm, reviewer xác nhận độc lập):
  - Chỉ chạy sau CI PASS trên staging, không trigger từ main: `deploy.yml` chỉ có `workflow_run` của CI (branches [staging]) + điều kiện job `conclusion==success && event==push && head_branch==staging && head_repository==repo`; không có `push`/`pull_request`/`workflow_dispatch`. Cần nhánh mặc định = staging (runbook 2.1).
  - Staging migrate trước khi đổi app, health fail → rollback: `deploy.sh` thứ tự config → pull → gate → up infra → `migrate` → up app jobs → health; fail → `rollback_to_previous` (kiểm bằng dry-run + đọc code; chưa chạy thật).
  - Production Environment + đúng digest: job `deploy-production` `environment: production`, image = `needs.deploy-staging.outputs.digest`; server kiểm `staging.history`. Required reviewers phải cấu hình trên GitHub (runbook 2.2) — không tạo được ở task này.
  - HIGH_RISK_MIGRATION chặn production: `check_high_risk_gate` (test PASS: chặn production, cảnh báo staging, bỏ qua migration đã apply, bỏ qua chuỗi không phải comment).
  - Không in secret: không xtrace, token qua stdin, DOCKER_CONFIG tạm, secret chỉ qua env của step, `StrictHostKeyChecking=yes` + known_hosts từ secret.
  - [Attempt 2] MAJOR-1: workflow upload vào `releases/<env>/<sha>` (tmp + `mv -T`, SHA đã có thì giữ nguyên), chạy `deploy.sh` trong release đó; `check_release_layout` từ chối SHA/env lệch; production chỉ nhận cặp digest+SHA trong staging.history, từ chối digest cũ hơn trừ `--allow-older`; dọn release giữ 5 + current. Test: layout, activate/restore/prune (Linux), require_staging_passed.
  - [Attempt 2] MAJOR-2: `switch_app_and_jobs` trong `if`; rollback gồm `compose up` + health + jobs, exit 3 khi rollback lỗi. Test stub compose up lỗi → up lần 2 với image cũ, restore link trước, không ghi state; rollback lỗi → exit 3.
  - Dọn build cache: n/a (build trên GitHub, không build trên server); thay bằng xoá image tami cũ giới hạn theo repo, giữ current/previous cả hai môi trường.
- Verify commands + result:
  - [Attempt 2] actionlint 1.7.7 (docker): PASS (exit 0). shellcheck stable (docker) `scripts/deploy/*.sh scripts/deploy/lib/*.sh`: PASS (exit 0; có `disable=SC1091,SC2034` cho biến/lib source gián tiếp, vì lệnh chạy không `-x`).
  - [Attempt 2] `bash scripts/deploy/deploy.test.sh`: Git Bash/Windows PASS (bỏ qua nhóm symlink do MSYS `ln -s` copy) + Linux (`node:22-bookworm`, docker) PASS toàn bộ gồm nhóm symlink. Mô phỏng lệnh upload release (bash -c + tar + mv -T) trong container Linux: không ghi đè release có sẵn, không để lại `.incoming.*`.
  - [Attempt 2] `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build` PASS; `pnpm test` FULL: lần 1 fail 1 suite `tests/integration/jobs-email.test.ts` (hook timeout 10s, DB thật, không liên quan diff), lần 2 PASS 77 file / 827 test.
  - actionlint 1.7.7 (attempt 1): PASS.
  - `bash scripts/deploy/deploy.sh staging|production --image <repo>@sha256:… --dry-run`: PASS (in đủ bước, migrate trước up app/jobs, không in token).
  - `bash scripts/deploy/deploy.test.sh` (attempt 1): 19/19 PASS; attempt 2 thêm ~30 test (release layout, SHA↔digest, digest cũ, rollback, jobs ổn định, container tạm).
  - `pnpm install --frozen-lockfile` PASS · `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (77 file, 827 test) · `pnpm build` PASS.
  - Image Docker tạm giữ lại trên máy dev: rhysd/actionlint:1.7.7, koalaman/shellcheck:stable (không có container tồn đọng).
- Reviewer verdict: round 1 FAIL (MAJOR-1 compose upload chung ngoài flock, MAJOR-2 up lỗi không rollback) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-4-task-05-round-2-review.md`). SHA 4 action primary đã đối chiếu `git ls-remote` khớp tag. Residual: MINOR-1/2 symlink compose + init.sql, MINOR-4 ci.yml pin SHA → AC `layer-6-task-01`; MINOR-3 release chờ khoá có thể bị prune (fail an toàn); toàn bộ luồng thật (SSH, GHCR login, psql, rollback) kiểm ở L6-T01
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/runbooks/deploy.md (mới); docs/ARCHITECTURE.md §6.4 (as-built + chốt cách runner). Không đổi API/schema → `docs/API_SPEC.md`/`docs/ERD.md` no doc impact.
- Decision log: `.context/decisions.md` Decision 4 (GitHub runner + GHCR + SSH, deploy theo digest, HIGH_RISK_MIGRATION chặn production)

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-05 cd` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- .github/workflows/deploy.yml
- .github/actions/ssh-deploy/action.yml (composite: SSH + upload release theo SHA + chạy deploy.sh trong release; dùng chung staging/production)
- scripts/deploy/lib/high-risk-gate.sh, scripts/deploy/lib/state.sh, scripts/deploy/lib/release.sh (tách từ deploy.sh)
- scripts/deploy/deploy.test.sh (test bash không cần Docker)
- scripts/deploy/deploy.sh (chạy trên server: pull image, migrate, up, health, rollback, `docker builder prune`)
- docs/runbooks/deploy.md

## Notes
- HỎI USER TRƯỚC KHI LÀM: runner self-hosted `/opt/actions-runner-tami` hay build trên GitHub rồi SSH kéo image; registry (GHCR?). Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Không chạy deploy thật ở task này (chạy thật ở task staging sớm).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
