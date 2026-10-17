Agent: reviewer

# Review: build/tami-website layer-4-task-07 (Backup pgBackRest + restic + runbook khôi phục), round 1

- **Review level:** STRICT
- **Reason:** data loss / khôi phục dữ liệu; đổi image + `command` (archive_mode) của Postgres staging/prod đang chạy trên volume có sẵn; secret (cipher pass, khoá S3/SFTP); server dùng chung (ổ đĩa / RAM); sửa `deploy.sh` (CD tự động gọi).
- **Diff:** working tree so với HEAD `1f80813` (`git diff` + untracked `docker/backup/`, `docs/runbooks/restore.md`). `.context/progress.json` / journal do primary ghi, không review.
- **Blast radius:**
  - Service `postgres` staging + prod: image mới `tami-postgres:17-3.5-pgbackrest2.59`, `wal_level=replica`, `archive_mode=on`, `archive_command=pgbackrest ...`, `archive_timeout=300`, `env_file` pgbackrest.env, volume socket dùng chung, bind `./backup/pgbackrest.conf` + `$BACKUP_ENV_DIR/ssh`. Lần đầu chuyển image thì postgres restart một lần.
  - Service mới `backup` (sidecar): uid 999, pgdata `:ro`, socket postgres (có quyền superuser qua `local trust`), khoá S3 nguồn SeaweedFS, volume `backup-state`, `backup-mirror` (tốn ổ bằng dung lượng bucket).
  - `scripts/deploy/deploy.sh` (CD staging/prod): `compose up` thêm `backup`; `compose config` giờ bắt buộc `BACKUP_ENV_DIR` (thiếu thì deploy dừng trước khi đổi gì).
  - Ổ đĩa của server dùng chung: `pg_wal` (khi archive fail), `/mirror`.
  - Tài liệu: ARCHITECTURE §6.2/§8, runbook deploy/restore, `.env.example`, Decision 5.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `docker run koalaman/shellcheck:stable -x docker/backup/*.sh docker/backup/test/*.sh scripts/deploy/*.sh scripts/deploy/lib/*.sh` | rc=1, chỉ có SC1091 **info** (`source "$HERE/lib.sh"` không theo được khi thiếu `-P SCRIPTDIR`) |
| giống lệnh trên + `-P SCRIPTDIR` | **rc=0, sạch** |
| `docker run node:22-bookworm bash scripts/deploy/deploy.test.sh` | **Tất cả test PASS** (rc=0) |
| `docker compose -f docker/docker-compose.{staging,prod}.yml config -q` (env giả, `BACKUP_ENV_DIR` = thư mục tạm) | staging rc=0, prod rc=0 |
| giống lệnh trên nhưng thiếu `BACKUP_ENV_DIR` | rc=1, thông báo rõ (fail-safe đúng) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | rc=0 / rc=0 / **77 file, 827 test PASS** |
| `pnpm build` | skip: diff không đụng TS/JS/app (builder báo OK) |
| `E2E_WAIT_ARCHIVE_TIMEOUT=0 bash docker/backup/test/e2e.sh s3` | **E2E PASS**: archive_mode on, archive_timeout 5min, 3 extension còn; full 4 s, diff 2 s; PITR về T = 1800, mới nhất = 2500, PostGIS đọc được; restic restore khớp sha256 + reupload khớp; heartbeat không đổi khi fail, `last_run_ok` 0→1; scheduler không chạy lặp. Dọn sạch: 0 container `tami-staging-*`/`tami-bk-e2e*`, 0 volume `tami-bk-e2e*`. Log không chứa cipher-pass/s3-key. Phần SFTP và chờ `archive_timeout` thật (297 s) **không chạy lại**, dựa vào báo cáo builder. |
| Kiểm image (`docker run ... ldd --version / os-release`) | `postgis/postgis:17-3.5` local (`sha256:01a6a70e…`) = **Debian 11 bullseye, glibc 2.31-13+deb11u13, PG 17.5**; `tami-postgres` build từ đó = **glibc 2.31-13+deb11u13, PG 17.5, pgBackRest 2.59.1**: cùng major, cùng glibc, nên collation không đổi. `tami-backup`: uid 999, `/var/lib/tami-backup` và `/mirror` 0700 postgres, TZ Asia/Ho_Chi_Minh chạy được (+07). |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed (diff gồm shell/YAML/MD, không có TS/JS) |
| oxlint (anti-slop) | N/A: diff không đụng TS/JS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK, có 2 indicator (<3): `test/e2e.sh` dài 381 dòng (>300), `run_scenario` khoảng 117 dòng (>50). Đây là script test tuần tự nên chấp nhận. Script chính đều ngắn (≤91 dòng, hàm ≤25 dòng). Comment chủ yếu giải thích WHY. ARCHITECTURE/runbook/Decision đã cập nhật. |
| ai-friendly-web | N/A (hạ tầng nội bộ) |
| blitzstrike | skip: không có môi trường được phép, task không phải API/auth public |
| Responsive Checklist Gate | N/A: diff không đụng UI |

## Kiểm theo yêu cầu

- **Đổi image postgres:** an toàn về glibc/collation (cùng bullseye, glibc 2.31, như bảng trên). PG17 còn tự cảnh báo khi `datcollversion` không khớp. Rủi ro còn lại là tag base không ghim digest (MINOR-4).
- **Thứ tự bật archive:** runbook §2.3 → §2.4 có nêu rõ là WAL tạm dồn tới khi chạy `stanza-create`. Nếu `BACKUP_ENV_DIR` chưa đặt thì CD dừng an toàn. **Chưa có giới hạn** cho `pg_wal` khi kho chết lâu (MAJOR-1).
- **Bảo mật:** secret chỉ qua env file 600 ngoài repo. File mẫu không chứa giá trị thật. pgBackRest/restic/rclone không in secret (đã kiểm log e2e), URL heartbeat không bị log. Hai kho đều mã hoá. Sidecar có `cap_drop: ALL`, `no-new-privileges`, user 999, pgdata `:ro`, không có docker.sock, không publish cổng. `/mirror` 0700. Còn một điểm cần biết: socket dùng chung cho sidecar quyền superuser DB (`local trust`). pgBackRest cần quyền này nên chấp nhận được.
- **Retention:** pgBackRest giữ `count` 6 full tuần + WAL, tức PITR khoảng 35–42 ngày, đạt mức ≥ 30 ngày. restic `--keep-daily 30 --keep-monthly 12`, đạt. RPO: `archive_timeout=300` + check mỗi 10 phút, đạt ≤ 15 phút.
- **restic khi SeaweedFS đang ghi:** chép qua S3 API, mỗi object trọn vẹn, đạt. `--max-delete` chặn trường hợp xoá hàng loạt.
- **deploy.sh:** chỉ thêm `backup` vào `compose up`. Rollback chỉ đụng app/jobs, đúng vì backup/postgres không theo version app. `deploy.test.sh` PASS.
- **apt / supply chain:** apt qua HTTP nhưng vẫn kiểm chữ ký `InRelease` (keyring Debian + `signed-by` PGDG). Tắt `Check-Valid-Until` vì kho đã lưu trữ. pgBackRest ghim phiên bản; restic 0.17.3 / rclone 1.68.2 ghim theo tag; base `postgis/postgis:17-3.5` theo tag, không ghim digest.

## Findings

### [MAJOR-1] WAL dồn `pg_wal` không giới hạn khi kho đích chết, có thể làm đầy ổ server dùng chung
- `docker/backup/pgbackrest.conf:4-11` (`[global]` không có `archive-push-queue-max`); `docs/runbooks/restore.md:202-203`; `.context/decisions.md` Decision 5 (Consequences).
- `archive-push` chạy đồng bộ. Kho không với tới được (B2 lỗi, khoá hết hạn, sai env, chưa `stanza-create`) thì PostgreSQL giữ mọi segment, theo runbook là khoảng 4,6 GB/ngày, tới khi hết ổ. Hết ổ thì sập postgres TAMI và **cả dự án khác trên server dùng chung** (ARCHITECTURE đã ghi sự cố ổ đầy 140 GB). Hiện chưa có lớp chặn tự động nào: stack giám sát (L4-T06) đang DEFERRED, heartbeat Uptime Kuma là *tuỳ chọn*, cảnh báo ổ > 80% mới là "nên có" trong runbook.
- **Fix đề xuất** (chọn 1, khuyến nghị (a)):
  (a) Thêm `archive-push-queue-max` vào `[global]` (ví dụ `4GiB` staging / `8GiB` prod, đặt qua `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX` trong env, hoặc conf + override). Vượt ngưỡng thì pgBackRest bỏ WAL và log cảnh báo. Đánh đổi là mất PITR ở khoảng đó, nhưng DB và server sống. Ghi vào runbook §9: sau khi kho hồi phục phải chạy `full` mới. Thêm 1 case e2e: kho không với tới + ghi dữ liệu, kiểm `pg_wal` không vượt ngưỡng, `wal` heartbeat fail, postgres vẫn nhận ghi.
  (b) Nếu chủ đích không chấp nhận bỏ WAL: biến heartbeat `HEARTBEAT_URL_WAL` + cảnh báo ổ thành **bắt buộc** trong runbook §2 (bước chặn trước khi coi setup xong) và ghi rõ việc chấp nhận rủi ro trong Decision 5. Không có cơ chế chặn tự động thì hướng này yếu hơn (a).

### [MINOR-1] Runbook khôi phục tại chỗ: bước 5 `exec` vào container `backup` đã bị dừng
- `docs/runbooks/restore.md:102` (bước 1 `$C stop app jobs backup`) và `:111` (bước 5 `$C exec backup ... pg-backup.sh full`). Container đang dừng nên `exec` lỗi. Phải tới bước 6 (`:112`) mới `up -d backup`.
- Fix: chuyển `$C up -d backup` lên trước bước 5, hoặc bước 5 dùng `$C run --rm --entrypoint bash backup /opt/backup/pg-backup.sh full`.

### [MINOR-2] Lệnh dọn tay trong runbook có thể xoá container staging thật
- `docs/runbooks/restore.md:229-231`: nhiều `--filter name=` của `docker ps` được **OR** với nhau, nên `--filter name=tami-staging-` khớp mọi container staging thật. Thêm `docker network rm tami-staging-net`. Chạy nhầm trên server thì staging bị gỡ (volume còn, nhưng gây downtime). `e2e.sh:52` có guard, còn lệnh dọn tay thì không.
- Fix: ghi rõ "CHỈ chạy trên máy dev, không có stack staging". Lệnh xoá chỉ lọc theo label project: `docker ps -aq --filter label=com.docker.compose.project=tami-bk-e2e` + `--filter name=tami-bk-e2e-restore`. Bỏ `docker network rm tami-staging-net`, hoặc chỉ chạy khi không có container staging nào.

### [MINOR-3] Mẫu SFTP pgBackRest không chạy được với image hiện tại
- `docker/backup/pgbackrest-env.example:33-35`: gợi ý `id_ed25519` và khoá "PEM/OpenSSH", và thiếu `PGBACKREST_REPO1_SFTP_PUBLIC_KEY_FILE`. Theo runbook §9 (`restore.md:204-207`) và e2e (`e2e.sh:130-131`), libssh2 1.9 cần **RSA PEM + public key file**.
- Fix: đổi mẫu sang `id_rsa` (`ssh-keygen -m PEM -t rsa -b 3072`) + thêm dòng `PGBACKREST_REPO1_SFTP_PUBLIC_KEY_FILE=/etc/backup/ssh/id_rsa.pub`, trỏ tới runbook §9.

### [MINOR-4] Base postgres không ghim digest, không có assert OS/glibc lúc build
- `docker/backup/Dockerfile:7` (`ARG POSTGIS_IMAGE=postgis/postgis:17-3.5`). Image được build lần đầu **trên server**. Tag thay đổi được, nên nếu upstream rebase tag lên Debian khác thì glibc/collation đổi ngay trên volume prod. Hiện đã kiểm là cùng glibc 2.31.
- Fix: ghim `postgis/postgis:17-3.5@sha256:01a6a70e41e6…` (digest đã kiểm), thêm `RUN grep -q 'VERSION_CODENAME=bullseye' /etc/os-release` (fail build nếu lệch). Runbook §2.3 thêm bước so `ldd --version` của image cũ và mới trước khi `up -d postgres`.

### [MINOR-5] Thiếu test tự động cho "chuyển image giữ dữ liệu"
- Task file `tasks/tami-website/layer-4-task-07.md:102` và runbook `restore.md:27` nói "đã kiểm volume khởi tạo bằng image gốc rồi bật bằng image mới". Nhưng `docker/backup/test/e2e.sh` khởi tạo volume thẳng bằng `tami-postgres`, không có bước này, nên reviewer không kiểm chứng được qua test. Rủi ro kỹ thuật thấp: cùng glibc/PG đã kiểm ở trên.
- Fix: thêm bước e2e: `up postgres` bằng `postgis/postgis:17-3.5` + ghi dữ liệu → đổi sang image tuỳ biến → so số bản ghi + extension + `datcollversion`.

### [MINOR-6] `--max-delete 500` không có hướng dẫn vận hành khi xoá hợp lệ vượt ngưỡng
- `docker/backup/restic-backup.sh:49`. Admin dọn hơn 500 media thì `files` fail mỗi ngày (heartbeat stale) cho tới khi có người can thiệp. Runbook `restore.md:33` chỉ nêu mục đích của ngưỡng.
- Fix: thêm vào runbook §4/§9 cách chạy một lần với `BACKUP_MAX_DELETE` lớn hơn, sau khi đã xác nhận bucket nguồn đúng.

### [MINOR-7] apt qua HTTP
- `docker/backup/Dockerfile:19-20, 31`. Chữ ký vẫn được kiểm nên không phải lỗ hổng toàn vẹn. Có thể đổi `https://` (archive.debian.org và apt-archive.postgresql.org đều hỗ trợ, base có ca-certificates) để giảm lộ metadata và giảm rủi ro downgrade/freeze vì đã tắt `Check-Valid-Until`.

## Residual risk
- SFTP pgBackRest và phép đo `archive_timeout` thật (297 s) không được chạy lại ở round này, dựa vào báo cáo builder. Code e2e cho hai phần này đã được đọc.
- Chưa chạy trên server thật: build cần mạng ra archive.debian.org / apt-archive.postgresql.org / Docker Hub; chown 999 cho `$BK/ssh`; băng thông và RTO thật. Kiểm ở layer-6-task-01 + diễn tập đầu tiên (đã ghi trong runbook §9).
- Chưa biết digest image postgis đang chạy trên server (không SSH theo phạm vi task). Kết luận glibc dựa trên tag `17-3.5` luôn là bullseye + image local.
- Debian 11 EOL cho sidecar/postgres image: đã ghi nhận, nâng cấp là task riêng.

## Verdict
**FAIL**: còn 1 MAJOR (MAJOR-1: `pg_wal` không bị giới hạn trên server dùng chung khi monitoring đang deferred). Builder cần sửa MAJOR-1. Nên sửa luôn MINOR-1/2/3 (runbook/mẫu env sai sẽ gây lỗi khi thao tác thật), MINOR-4/5 khuyến nghị.
