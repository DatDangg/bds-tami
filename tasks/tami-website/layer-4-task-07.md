# Task 07: Backup: pgBackRest (WAL liên tục) + restic (file) + runbook khôi phục

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — data loss / khôi phục dữ liệu
- Blast radius: docker/backup/pgbackrest.conf; docker/backup/restic-backup.sh, restic-env.example; docker/backup/docker-compose.backup.yml (hoặc systemd timer mẫu); …
- Doc impact (dự kiến): docs/runbooks/restore.md (mới)
- Decision impact: NO

## Requirements
- NFR-05 (RPO ≤ 15 phút, RTO ≤ 4 giờ, diễn tập 6 tháng/lần)
- ARCHITECTURE §8 (sao lưu)

## Description
Cấu hình sao lưu ra kho ngoài server và quy trình khôi phục lên staging.

## Dependencies
- `layer-3-task-03` Dockerfile + Compose staging/prod + cấu hình Nginx host (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [ ] pgBackRest: archive WAL liên tục (`archive_timeout` ≤ 15 phút), full hằng tuần, diff hằng ngày, giữ 30 ngày
- [ ] restic: bucket SeaweedFS hằng ngày, giữ 30 bản ngày + 12 bản tháng
- [ ] Kho backup nằm ngoài server (đích cấu hình bằng env; không commit credential)
- [ ] Có metric/heartbeat "backup thành công lần cuối" cho cảnh báo
- [ ] Runbook khôi phục từng bước lên staging, đo thời gian (mục tiêu RTO ≤ 4 giờ)

## Tests cần viết
- Chạy thử backup + restore trên môi trường Docker dev (Postgres dev → restore sang container mới, so số bản ghi)
- `shellcheck` script

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-07-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: docs/runbooks/restore.md (mới))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-07 backup` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- docker/backup/pgbackrest.conf
- docker/backup/restic-backup.sh, restic-env.example
- docker/backup/docker-compose.backup.yml (hoặc systemd timer mẫu)
- docs/runbooks/restore.md

## Notes
- HỎI USER TRƯỚC KHI LÀM: kho backup ngoài server: server khác của công ty hay Backblaze B2. Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
