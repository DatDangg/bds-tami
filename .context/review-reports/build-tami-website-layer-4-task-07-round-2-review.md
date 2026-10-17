Agent: reviewer

# Review: build/tami-website layer-4-task-07 (Backup pgBackRest + restic + runbook khôi phục), round 2

- **Review level:** STRICT
- **Reason:** data loss / khôi phục dữ liệu; đổi image + `command` (archive) của Postgres staging/prod trên volume có sẵn; secret; ổ đĩa server dùng chung; `deploy.sh` (CD tự động gọi).
- **Diff:** working tree so với HEAD `1f80813` (`git diff` + untracked `docker/backup/`, `docs/runbooks/restore.md`). `.context/progress.json` / `.context/decisions.md` / journal do primary ghi.
- **Blast radius:** như round 1 (service `postgres` + sidecar `backup` staging/prod, `deploy.sh` `compose up` thêm `backup`, ổ đĩa server dùng chung qua `pg_wal` + `/mirror`, tài liệu ARCHITECTURE §6.2/§8, runbook deploy/restore, `.env.example`, Decision 5). Thay đổi mới round 2: env `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX` chỉ trên service `postgres`, base image ghim digest + assert OS/glibc, apt qua HTTPS, runbook §2.3/§3.2/§4/§9/§10, e2e thêm case chuyển image + kho không với tới.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `docker run koalaman/shellcheck:stable -x -P SCRIPTDIR docker/backup/*.sh docker/backup/test/*.sh scripts/deploy/*.sh scripts/deploy/lib/*.sh` | **rc=0** |
| `docker run -v "$PWD:/w" -w /w node:22-bookworm bash scripts/deploy/deploy.test.sh` | **rc=0, "Tất cả test PASS"** |
| `docker compose --env-file <giả> -f docker/docker-compose.{staging,prod}.yml config -q` | staging rc=0, prod rc=0. `config` cho thấy `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX: 4GiB` (staging) / `8GiB` (prod), **chỉ có trong service `postgres`**. Đặt `BACKUP_ARCHIVE_PUSH_QUEUE_MAX=2GiB` thì giá trị đổi thành `2GiB`, tức override hoạt động. |
| `docker image inspect postgis/postgis:17-3.5` | RepoDigests = `postgis/postgis@sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6`, **khớp đúng digest ghim** ở `docker/backup/Dockerfile:9` |
| `docker run --entrypoint pgbackrest tami-postgres:17-3.5-pgbackrest2.59 help archive-push archive-push-queue-max` | pgBackRest 2.59.1: vượt trần thì "notify PostgreSQL that the WAL was successfully archived, then DROP IT" + warning vào log PG. Câu "In asynchronous mode the entire queue will be dropped" chỉ là hành vi *riêng* của async, nên trần **áp dụng cả ở chế độ sync**. Khớp với comment `pgbackrest.conf:22-25` và runbook §9. |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | rc=0 / rc=0 / **77 file, 827 test PASS** |
| `pnpm build` | skip: diff không đụng TS/JS/app |
| `E2E_WAIT_ARCHIVE_TIMEOUT=0 bash docker/backup/test/e2e.sh s3` (trước khi chạy: 0 container `tami-staging-*`/`tami-bk-e2e*`) | **rc=0, E2E PASS.** [switch]: 30000 bản ghi, checksum theo collation khớp, `datcollversion` 2.31 không đổi, 3 extension còn, amcheck `bt_index_check(heapallindexed)` sạch, REINDEX btree + gist OK, truy vấn gist = quét tuần tự (1836). [s3]: full 4s, diff 2s, PITR về T = 1800, mới nhất = 2500, restic OK. **Kho không với tới:** mặc định staging = 4GiB; container postgres nhận trần 48MiB; ghi 14 segment thì hàng đợi `.ready` còn 3 (= trần), segment cũ còn 4, **11 cảnh báo `dropped WAL file`**, DB vẫn nhận ghi (2515), `check` fail và `last_run_ok{wal}=0`; kho hồi phục thì full mới 31s, check OK, WAL lên kho tiếp, `last_run_ok{wal}=1`. Log chỉ có dòng `cipher: aes-256-cbc` từ `info`, không lộ secret. **Dọn sạch:** 0 container / 0 volume / 0 network của project `tami-bk-e2e`. Container dev `tami-postgres` / `tami-redis` / `tami-seaweedfs` vẫn chạy, không bị đụng. SFTP và bước chờ `archive_timeout` thật không chạy lại (dựa vào báo cáo builder). |

## Responsive Checklist Gate
N/A: diff không đụng UI (shell/YAML/Dockerfile/Markdown).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed (diff không có TS/JS) |
| oxlint (anti-slop) | N/A: diff không đụng TS/JS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK: 2 loại indicator (<3), đều nằm trong script test tuần tự `test/e2e.sh`: file khoảng 509 dòng (>300); `run_scenario` và `unreachable_repo_test` (khoảng 57 dòng) dài hơn 50 dòng. Script chính vẫn ngắn. Comment giải thích WHY. Runbook/ARCHITECTURE/Decision đã cập nhật theo luồng mới. |
| ai-friendly-web | N/A (hạ tầng nội bộ) |
| blitzstrike | skip: không có môi trường được phép, không phải API/auth public |

## Xác minh các finding round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| **MAJOR-1** pg_wal không giới hạn | **Đã đóng** | Trần đặt ở **nơi `archive_command` chạy**: env service `postgres` (`docker-compose.staging.yml` khối `postgres.environment`, `docker-compose.prod.yml:140`), không đặt ở sidecar. `environment` của compose đè `env_file`, nên giá trị không bị `pgbackrest.env` vô tình ghi đè. Tài liệu chính thức 2.59.1 xác nhận trần áp dụng cả khi sync. E2E chứng minh thật: hàng đợi `.ready` giảm về đúng trần, segment cũ bị giữ không tăng theo số WAL sinh ra, DB vẫn ghi, có cảnh báo trong log. **Không im lặng báo OK** trong lúc kho chết: `check` fail và `last_run_ok{wal}=0` (heartbeat stale). Mặc định 4GiB/8GiB tương đương khoảng 1–2 ngày WAL ở tải cao theo ước tính runbook. Trên ổ đĩa đó cộng thêm `max_wal_size` (1GB mặc định) segment tái chế, nên chặn trên khoảng 5 GiB (staging) và 9 GiB (prod), hợp lý cho server dùng chung. Runbook §2.3 (bước 3→4), §7, §9 (check → full mới → grep `dropped WAL file`), `.env.example` đã cập nhật. |
| MINOR-1 bước 5 `exec` vào container đã dừng | Đóng | `restore.md:108,117-121`: `run --rm --no-deps --entrypoint bash backup /opt/backup/pg-backup.sh full\|check`; `up -d backup` ở bước 6 |
| MINOR-2 lệnh dọn tay có thể xoá staging thật | Đóng | `restore.md:254-263` và `e2e.sh:12-14` chỉ lọc theo `label=com.docker.compose.project=tami-bk-e2e` hoặc `name=tami-bk-e2e-`. Không còn `name=tami-staging-` và không còn `docker network rm tami-staging-net`. Có cảnh báo "CHỈ máy dev". |
| MINOR-3 mẫu SFTP | Đóng (theo báo cáo builder + e2e tạo `id_rsa` PEM, `e2e.sh:71`) | `pgbackrest-env.example`: RSA PEM + `PUBLIC_KEY_FILE` (không đọc lại toàn văn ở round này) |
| MINOR-4 ghim digest + assert | Đóng | `Dockerfile:9` ghim digest khớp image local. `Dockerfile:22-24` assert `VERSION_CODENAME=bullseye`, glibc ` 2.31`, CA bundle. Runbook §2.3 `restore.md:52-56` so `ldd --version` cũ/mới trước khi `up -d postgres` |
| MINOR-5 test chuyển image | Đóng | `e2e.sh:390-429`, đã tự chạy PASS (như bảng trên) |
| MINOR-6 `--max-delete` | Đóng | `restore.md:138-144`, chạy một lần `exec -e BACKUP_MAX_DELETE=5000`, có bước xác nhận trước |
| MINOR-7 apt HTTP | Đóng | `Dockerfile:25-28,37-38` đổi sang `https://`, vẫn `signed-by` / keyring Debian |

Regression: `deploy.sh` chỉ đổi 1 dòng (`compose up -d postgres redis seaweedfs backup`), `deploy.test.sh` PASS. Compose staging và prod đều hợp lệ. Thiếu `BACKUP_ENV_DIR` thì `config` vẫn fail-safe (round 1 đã kiểm, cấu trúc không đổi).

## Findings

Không có CRITICAL / MAJOR.

### [MINOR-A] Test chuyển image dùng tag thay vì digest ghim
- `docker/backup/test/e2e.sh:392` (`orig=postgis/postgis:17-3.5`). Hiện tại tag local trùng digest ghim nên kết quả đúng. Nếu sau này `docker pull` kéo tag mới (base Debian khác) thì test sẽ khởi tạo volume bằng base khác với base của image tuỳ biến. Lúc đó test fail (ồn) hoặc kiểm sai cặp image.
- Fix (tuỳ chọn): lấy `orig` từ `ARG POSTGIS_IMAGE` của Dockerfile (ví dụ `grep -m1 '^ARG POSTGIS_IMAGE=' ... | cut -d= -f2`) để test luôn dùng đúng digest đã ghim.

### [MINOR-B] Sau khi kho hồi phục, việc mất PITR (WAL đã bị bỏ) không có tín hiệu tự động
- `docker/backup/pg-backup.sh:23-25`, `scheduler.sh:50-51`: khi kho hồi phục, `check` OK và `last_run_ok{wal}` tự về 1. Từ khi WAL bị bỏ tới bản backup kế tiếp sẽ có một khoảng gãy PITR, và chỉ biết được nếu người vận hành grep log postgres (`restore.md:228`). Trong lúc kho chết thì heartbeat có báo đỏ, nên không phải lỗi im lặng hoàn toàn. Runbook đã nêu rõ. Diff/full đêm kế tiếp sẽ lập lại mốc khôi phục.
- Fix (tuỳ chọn, có thể đưa vào layer-4-task-06 monitoring): cảnh báo Loki theo chuỗi `dropped WAL file` trong log container postgres, hoặc scheduler tự chạy `full` khi `wal` chuyển từ fail sang OK sau thời gian dài.

## Residual risk
- SFTP pgBackRest và phép đo `archive_timeout` thật không được chạy lại ở round này, dựa vào báo cáo builder (cả hai đã có trong code e2e).
- Chưa kiểm trên server thật: dung lượng ổ trống thực tế so với trần 5/9 GiB, build cần mạng HTTPS ra archive.debian.org / apt-archive.postgresql.org / Docker Hub, digest image postgis đang chạy trên server (runbook §2.3 có bước so `ldd` để chặn). Kiểm ở layer-6-task-01.
- Digest ghim lấy từ image store local (containerd). Nếu đó là digest manifest list thì server amd64 tự chọn đúng platform. Nếu là manifest riêng một platform thì phải cùng kiến trúc với server (máy dev amd64 + server amd64: không có vấn đề).
- Debian 11 EOL: đã ghi nhận, nâng cấp là task riêng.

## Verdict
**PASS**: MAJOR-1 đã đóng và được chứng minh bằng tài liệu pgBackRest 2.59.1 trong image, compose config và e2e reviewer tự chạy. Toàn bộ MINOR-1..7 đã xử lý, không có regression. Còn 2 MINOR tuỳ chọn, không chặn.
