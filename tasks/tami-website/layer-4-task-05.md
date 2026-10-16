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
- [ ] Chỉ chạy sau CI PASS trên nhánh `staging`; không có trigger từ `main`
- [ ] Staging: `payload migrate` chạy **trước** khi đổi container app; health check `/api/health` thất bại → quay về image trước
- [ ] Production: GitHub Environment `production` có required reviewers; deploy đúng digest image đã qua staging
- [ ] Migration có đánh dấu `HIGH_RISK_MIGRATION` → chặn promote production (kiểm trong script)
- [ ] Không in secret ra log; secret lấy từ GitHub Secrets/`.env` trên server
- [ ] Dọn build cache sau deploy nếu build trên server

## Tests cần viết
- `actionlint` (nếu có); `shellcheck scripts/deploy/deploy.sh`
- Chạy thử `deploy.sh` ở chế độ `--dry-run` local

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-05-round-<R>-review.md`

## Migration
- Không tạo migration; định nghĩa cách chạy migration khi deploy.

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
- Doc impact result: pending (dự kiến: docs/runbooks/deploy.md (mới); ARCHITECTURE §6.4 chốt cách runner (self-hosted `/opt/actions-runner-tami` hay SSH) — ghi `.context/decisions.md`)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-05 cd` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- .github/workflows/deploy.yml
- scripts/deploy/deploy.sh (chạy trên server: pull image, migrate, up, health, rollback, `docker builder prune`)
- docs/runbooks/deploy.md

## Notes
- HỎI USER TRƯỚC KHI LÀM: runner self-hosted `/opt/actions-runner-tami` hay build trên GitHub rồi SSH kéo image; registry (GHCR?). Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Không chạy deploy thật ở task này (chạy thật ở task staging sớm).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
