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
- [x] pgBackRest: archive WAL liên tục (`archive_timeout` ≤ 15 phút), full hằng tuần, diff hằng ngày, giữ 30 ngày
- [x] restic: bucket SeaweedFS hằng ngày, giữ 30 bản ngày + 12 bản tháng
- [x] Kho backup nằm ngoài server (đích cấu hình bằng env; không commit credential)
- [x] Có metric/heartbeat "backup thành công lần cuối" cho cảnh báo
- [x] Runbook khôi phục từng bước lên staging, đo thời gian (mục tiêu RTO ≤ 4 giờ)

## Tests cần viết
- Chạy thử backup + restore trên môi trường Docker dev (Postgres dev → restore sang container mới, so số bản ghi)
- `shellcheck` script

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-07-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2 (builder; reviewer round 1 FAIL: MAJOR-1 trần WAL + MINOR-1..7, đã sửa)
- Last failure type: review FAIL (MAJOR-1 pg_wal không giới hạn khi kho chết)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria (reviewer STRICT PASS round 2):
  - [x] pgBackRest: archive WAL liên tục (`archive_timeout=300` ≤ 900; đo thật: dòng ghi lên kho sau 297 s không can thiệp), full hằng tuần (Chủ nhật), diff hằng ngày, giữ ≥ 35 ngày (6 bản full + WAL) => PITR 30 ngày. Test: PITR về mốc T và restore mới nhất khớp số bản ghi (1800 / 2500), PostGIS đọc được.
  - [x] restic: SeaweedFS hằng ngày qua S3 API, `forget --keep-daily 30 --keep-monthly 12 --prune`, check định kỳ. Test: backup -> xoá bucket + bản sao -> restore -> sha256 khớp -> đưa lại lên bucket khớp nội dung.
  - [x] Kho ngoài server, đích cấu hình bằng env (S3-compatible hoặc SFTP, cả hai chạy thật trong e2e); mẫu `*.example`, không commit credential.
  - [x] Heartbeat "backup thành công lần cuối": `<kind>.success` chỉ khi exit 0 + textfile metric + URL push tuỳ chọn; test job fail không đổi `.success`, `last_run_ok=0`.
  - [x] Runbook khôi phục từng bước (`docs/runbooks/restore.md`) + số liệu thời gian đo local; RTO thật chỉ đo được khi diễn tập trên server (ghi ở runbook §5/§8/§9).
- Verify commands + result: xem "Builder verify" bên dưới (e2e, shellcheck, compose config, deploy.test.sh, pnpm install/lint/typecheck/test/build).
- Reviewer verdict: round 1 FAIL (MAJOR-1 thiếu archive-push-queue-max → WAL đầy ổ) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-4-task-07-round-2-review.md`). Residual: MINOR-A e2e dùng tag → AC `layer-6-task-01`; MINOR-B cảnh báo dropped WAL → AC `layer-4-task-06` (deferred); chưa chạy trên server thật; Debian 11 EOL (nâng base là task riêng)
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-4.md`)

## Doc / Decision Impact
- Doc impact result: `docs/runbooks/restore.md` (mới), `docs/ARCHITECTURE.md` §6.2 + §8 (as-built), `docs/runbooks/deploy.md` §3.1 (BACKUP_ENV_DIR bắt buộc), `.env.example` (BACKUP_ENV_DIR). Không đổi API/ERD/schema.
- Decision log: Decision 5 (`.context/decisions.md`) — backup pgBackRest + restic, sidecar, đích qua env

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-07 backup` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- docker/backup/pgbackrest.conf, Dockerfile, lib.sh, pg-backup.sh, restic-backup.sh, scheduler.sh, pg-restore.sh
- docker/backup/pgbackrest-env.example, restic-env.example
- docker/backup/test/e2e.sh, docker-compose.e2e.yml, .gitignore (test thật)
- docker/docker-compose.staging.yml, docker-compose.prod.yml (postgres tuỳ biến + sidecar `backup`); scripts/deploy/deploy.sh (thêm `backup` vào `compose up`)
- docs/runbooks/restore.md (mới), docs/runbooks/deploy.md, docs/ARCHITECTURE.md, .context/decisions.md, .env.example
- (thay cho `docker-compose.backup.yml` / systemd timer: sidecar nằm thẳng trong compose từng môi trường vì deploy.sh dùng đúng 1 file compose — Decision 5)

## Notes
- HỎI USER TRƯỚC KHI LÀM: kho backup ngoài server: server khác của công ty hay Backblaze B2. Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Builder verify (attempt 1)
- `bash docker/backup/test/e2e.sh` (cả `s3` và `sftp`, project tạm `tami-bk-e2e`, không đụng tami-postgres/redis/seaweedfs dev): **E2E PASS**.
  - PITR về mốc T = 1800 bản ghi, restore mới nhất = 2500, cột PostGIS đọc được; restic restore sha256 KHỚP, đưa lại bucket khớp nội dung.
  - Thời gian đo (S3 / SFTP): full 4 s / 14 s, diff 2 s / 8 s, restore PITR 8 s + recovery 4 s / 11 s + 10 s, restic backup 2 s / 4 s; `archive_timeout` thật: 297 s.
  - Heartbeat: job fail không đổi `.success`, `last_run_ok=0`, URL heartbeat không lộ ra log; scheduler 1 vòng đúng, vòng 2 không chạy lặp.
- Chuyển image postgres: volume khởi tạo bằng `postgis/postgis:17-3.5`, bật bằng image mới → dữ liệu + 3 extension còn nguyên.
- `shellcheck -x -P SCRIPTDIR` (koalaman/shellcheck:stable) cho `docker/backup/*.sh`, `test/e2e.sh`, `scripts/deploy/*.sh`: sạch. `bash scripts/deploy/deploy.test.sh`: tất cả PASS.
- `docker compose config -q` staging + prod: OK; thiếu `BACKUP_ENV_DIR` → exit 1.
- `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`: OK. `pnpm test` FULL: 77 file / 827 test PASS. `pnpm build`: OK.
- Dọn: e2e tự `down -v` + xoá thư mục `.work`; còn lại image local `tami-postgres:17-3.5-pgbackrest2.59`, `tami-backup:pgbackrest2.59-restic0.17.3` (xoá bằng `docker rmi`).

## Builder verify (attempt 2, sau reviewer round 1 FAIL)
- **MAJOR-1** `archive-push-queue-max` đặt qua env `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX` (compose: `${BACKUP_ARCHIVE_PUSH_QUEUE_MAX:-4GiB}` staging / `-8GiB` prod; lý do trong `pgbackrest.conf`, runbook §9, Decision 5). Chế độ đồng bộ vẫn áp dụng trần (đã kiểm e2e; `archive-async` không cần). Runbook §9: quá trần ⇒ PITR gãy ⇒ `check` + `full` mới ngay khi kho hồi phục + grep `dropped WAL file`; khuyến nghị `HEARTBEAT_URL_WAL` từ đầu. E2E case mới "kho không với tới" (trần 48MiB, 14 segment ~224MB): chờ archive còn 4, segment cũ còn giữ 5/14, 10-11 lần bỏ WAL có cảnh báo, DB vẫn ghi, `check` fail + `last_run_ok{wal}=0`, kho hồi phục → `full` mới 23-29 s OK + `check` OK + WAL lại lên kho + `last_run_ok{wal}=1` (cả S3 và SFTP).
- MINOR-1 runbook §3.2 bước 5 dùng `run --rm --no-deps --entrypoint bash backup ...` (container `backup` đang dừng). MINOR-2 lệnh dọn tay lọc theo label project `tami-bk-e2e`, bỏ filter `tami-staging-` và `network rm tami-staging-net`, ghi "CHỈ máy dev". MINOR-3 mẫu SFTP: RSA PEM + `PGBACKREST_REPO1_SFTP_PUBLIC_KEY_FILE` + yêu cầu server. MINOR-6 runbook §4 "Vượt ngưỡng xoá": `exec -e BACKUP_MAX_DELETE=5000 ... backup` một lần, sau khi xác nhận bucket nguồn.
- MINOR-4 Dockerfile ghim `postgis/postgis:17-3.5@sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6` (lấy từ `docker image inspect` image local) + assert `VERSION_CODENAME=bullseye` và glibc 2.31 (kiểm âm: base `postgres:16` → build FAIL ở assert). Runbook §2.3 thêm bước so `ldd --version` image cũ/mới.
- MINOR-5 e2e case "chuyển image": volume khởi tạo bằng `postgis/postgis:17-3.5` gốc (30000 bản ghi text có dấu + gist + amcheck) → SIGKILL → bật bằng image tuỳ biến: số bản ghi, checksum thứ tự collation, `datcollversion` (2.31), 3 extension giống hệt; `bt_index_check(heapallindexed)` sạch, REINDEX btree + gist OK, không có cảnh báo collation.
- MINOR-7 apt dùng HTTPS cho `archive.debian.org` + `apt-archive.postgresql.org` (ca-certificates có sẵn trong base; Dockerfile assert file CA tồn tại); build backup + postgres OK; vẫn tắt `Check-Valid-Until` (kho lưu trữ), chữ ký InRelease vẫn được kiểm.
- Verify: `bash docker/backup/test/e2e.sh s3` và `... sftp` (E2E_WAIT_ARCHIVE_TIMEOUT=0, đã đo 297 s ở attempt 1): **E2E PASS** cả hai, dọn sạch (0 container/volume/network `tami-bk-e2e`/`tami-staging-*`, container dev nguyên vẹn). `shellcheck -x -P SCRIPTDIR` docker/backup + test + scripts/deploy: rc=0. `deploy.test.sh`: tất cả PASS. `compose config -q` staging/prod: rc=0 (QUEUE_MAX 4GiB / 8GiB). `pnpm install --frozen-lockfile`, `lint`, `typecheck`: OK; `pnpm test` FULL 77 file / 827 test PASS; `pnpm build` OK.
