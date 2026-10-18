# Runbook: Backup và khôi phục TAMI (NFR-05)

Phạm vi: `docker/backup/*` (image, lịch, script, mẫu env), `docker/docker-compose.prod.yml` (service `postgres` tuỳ biến + `backup`). **Staging KHÔNG có backup** (quyết định user 2026-10-18; deploy runbook §9.5); runbook này chỉ áp dụng cho production; diễn tập khôi phục chạy trong container `drill-pg` trên host production (§3.1), không dựng lên staging.
`docker/backup/test/e2e.sh` (test thật). Kiến trúc: `docs/ARCHITECTURE.md` §8. Quyết định: `.context/decisions.md` Decision 5.
Mục tiêu: **RPO ≤ 15 phút** (đo được: ghi xong, WAL lên kho ≤ 300 giây), **RTO ≤ 4 giờ**, diễn tập khôi phục (vào container `drill-pg`, không đụng DB thật) **6 tháng/lần**.

Quy ước dòng lệnh dưới đây (chạy trên server, user `deploy`):
```bash
E=production                    # backup chỉ có ở production (staging không backup)
C="docker compose --env-file /opt/tami/prod.env -f /opt/tami/releases/$E/current/docker/docker-compose.prod.yml"
BK=/opt/tami/backup/$E          # = BACKUP_ENV_DIR trong env file; chứa pgbackrest.env, restic.env, ssh/
```

## 1. Thiết kế (vì sao làm vậy)

| Dữ liệu | Công cụ | Lịch (giờ Việt Nam) | Giữ |
|---|---|---|---|
| PostgreSQL | pgBackRest: archive WAL liên tục (`archive_command`, `archive_timeout=300`) + **full Chủ nhật 02:00** + **diff các ngày còn lại 02:00** | WAL: tối đa 5 phút/lần khi có ghi | 6 bản full (≥ 35 ngày) + WAL tương ứng ⇒ PITR về bất kỳ lúc nào trong 30 ngày |
| File (SeaweedFS) | restic (qua S3 API) | hằng ngày 03:00; `restic check` Chủ nhật 04:00 | `forget --keep-daily 30 --keep-monthly 12 --prune` |

- **Kho đích ngoài server, cấu hình hoàn toàn bằng env** (chưa chốt nhà cung cấp): S3-compatible (Backblaze B2, MinIO/SeaweedFS của công ty, AWS S3…)
  **hoặc** SFTP sang server khác. Endpoint, khoá, mật khẩu mã hoá nằm trong env file trên server (mẫu `docker/backup/pgbackrest-env.example`,
  `docker/backup/restic-env.example`), không commit. Không dịch vụ trả phí bắt buộc (NFR-09). Cả hai kho đều **mã hoá** (pgBackRest `aes-256-cbc`, restic mặc định).
- **Image postgres tuỳ biến** (`docker/backup/Dockerfile`, target `postgres`) = `postgis/postgis:17-3.5` + `pgbackrest 2.59.1`: `archive_command` chạy trong
  container postgres nên binary phải nằm trong đó. Giữ nguyên base `17-3.5` (Debian 11) và volume `postgres-data`: đổi sang base Debian khác đổi glibc/collation
  và có thể làm hỏng index trên dữ liệu cũ. Base được **ghim digest** (`@sha256:01a6a70e…` trong Dockerfile) và build **fail** nếu OS không phải Debian 11 hoặc glibc khác 2.31. Có test tự động: volume khởi tạo bằng image gốc, bật bằng image mới, dữ liệu + extension + collation còn nguyên, `amcheck`/`REINDEX` sạch (`e2e.sh`, case "chuyển image").
- **Lịch = vòng lặp trong sidecar `backup`** (không phải cron/systemd timer): nằm trong compose của từng môi trường (không cần quyền root, không sửa host dùng chung),
  log ra stdout (Loki), tự bắt kịp lịch khi container khởi động lại, job fail tự thử lại sau 30 phút cho tới khi thành công trong ngày. Sidecar chạy user `postgres`
  (uid 999), đọc pgdata **read-only** + dùng chung thư mục socket với postgres; `mem_limit` 384m; không publish cổng; không đụng container của dự án khác.
- **File SeaweedFS đi qua S3 API + bản sao `/mirror` (volume `backup-mirror`)**, không đọc thẳng volume SeaweedFS: file `.dat/.idx` đang bị ghi dở khi server chạy
  nên chụp trực tiếp có thể không nhất quán. `rclone sync` chỉ chép phần thay đổi; restic lo lịch sử + chống trùng. Đổi lại cần thêm ổ bằng dung lượng bucket;
  `--max-delete 500` chặn việc bucket nguồn bị xoá sạch làm bản sao mất hàng loạt (snapshot cũ vẫn còn). Khi xoá hợp lệ > 500 object (dọn media hàng loạt) thì job `files` fail mỗi ngày: xem §4 "Vượt ngưỡng xoá".
- **Retention pgBackRest theo số bản (`count`), không theo ngày**: `repo1-retention-full=6` + `repo1-retention-archive=6` (xem `docker/backup/pgbackrest.conf`).
  Kiểu theo ngày làm cửa sổ PITR co dưới 30 ngày ngay sau khi bản full cũ nhất hết hạn.
- **`archive_timeout=300`** (< 900): WAL đang ghi dở bị ép chuyển sang segment mới mỗi 5 phút nên kể cả một lần đẩy lỗi/chậm vẫn trong RPO 15 phút.

## 2. Thiết lập lần đầu trên server

1. Thư mục + env file (một lần, chỉ production; kho/khoá/mật khẩu KHÔNG dùng chung với bất kỳ môi trường nào khác):
   ```bash
   sudo install -d -o deploy -g deploy -m 750 /opt/tami/backup /opt/tami/backup/$E /opt/tami/backup/$E/ssh
   cp docker/backup/pgbackrest-env.example $BK/pgbackrest.env      # điền, chọn 1 khối S3 hoặc SFTP
   cp docker/backup/restic-env.example     $BK/restic.env          # điền
   chmod 600 $BK/pgbackrest.env $BK/restic.env
   echo "BACKUP_ENV_DIR=$BK" >> /opt/tami/$E.env                   # biến compose bắt buộc (thiếu thì `compose config` báo lỗi)
   ```
   Mật khẩu mã hoá: `openssl rand -base64 48` cho `PGBACKREST_REPO1_CIPHER_PASS` và `RESTIC_PASSWORD`. **Cất bản sao ở nơi KHÁC server** (mất mật khẩu = mất toàn bộ backup).
   SFTP / CA tự ký: đặt khoá, `known_hosts`, `ca.pem` vào `$BK/ssh/`, `sudo chown -R 999:999 $BK/ssh && chmod 600 $BK/ssh/id_*` (mount read-only vào `/etc/backup/ssh`).
2. Dựng image (một lần; `deploy.sh` không pull image này, chưa có tag thì `compose up` tự build): `$C build postgres backup`.
3. Chuyển container postgres sang image mới (**có một lần khởi động lại postgres, vài giây; dữ liệu nằm trong volume nên không mất**; chọn giờ ít người dùng).
   **Trước đó** so glibc của image đang chạy với image mới (phải cùng bản, nếu khác thì DỪNG: collation đổi, index text có thể hỏng):
   ```bash
   docker exec tami-postgres ldd --version | head -1                       # image CŨ đang chạy
   docker run --rm --entrypoint ldd tami-postgres:17-3.5-pgbackrest2.59 --version | head -1   # image MỚI: phải cùng "2.31-13+deb11uNN"
   ```
   ```bash
   $C up -d postgres seaweedfs backup      # compose tạo lại postgres với image mới, archive_mode=on; volume postgres-data giữ nguyên
   $C ps postgres backup                    # postgres healthy
   $C exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "show archive_mode" -c "show archive_timeout" -c "select count(*) from pg_extension"'
   ```
   Từ lúc này postgres đẩy WAL bằng `archive_command`; **trước khi tạo stanza, archive sẽ báo lỗi và WAL tạm dồn ở `pg_wal`** — làm bước 4 ngay.
   Có trần bảo vệ ổ đĩa (`archive-push-queue-max`, prod 8GiB): nếu bước 4 bị trì hoãn đủ lâu để vượt trần thì WAL bị bỏ và **phải chạy `full` mới** (bước 5) — mục 9.
4. Tạo kho (một lần; KHÔNG tự chạy để sai env không tạo ra kho rỗng ở sai chỗ mà không ai biết):
   ```bash
   $C exec backup bash /opt/backup/pg-backup.sh stanza-create
   $C exec backup bash /opt/backup/pg-backup.sh check          # phải OK: tạo restore point, ép chuyển WAL, chờ WAL lên kho
   $C exec backup bash /opt/backup/restic-backup.sh init
   ```
5. Chạy tay backup đầu tiên và xem kết quả (không chờ tới 02:00):
   ```bash
   $C exec backup bash /opt/backup/pg-backup.sh full
   $C exec backup bash /opt/backup/restic-backup.sh backup
   $C exec backup bash /opt/backup/pg-backup.sh info
   $C exec backup bash /opt/backup/restic-backup.sh snapshots
   $C exec backup cat /var/lib/tami-backup/textfile/tami_backup.prom
   ```
6. Dán heartbeat vào giám sát (mục 7) và **làm ngay một lần diễn tập khôi phục** (mục 4) trước khi coi backup là đã xong.

Production: lặp lại với `E=production`, `BK=/opt/tami/backup/production`, file compose `docker-compose.prod.yml`. `deploy.sh` đã bật `backup` cùng `postgres/redis/seaweedfs`.

## 3. Khôi phục PostgreSQL

Công cụ: `docker/backup/pg-restore.sh` (chạy `pgbackrest restore` trong container dùng đúng image postgres vào một volume Docker). Thời điểm đích theo UTC cho khỏi nhầm múi giờ:
`--target-time "2026-10-17 07:52:05+00"`. Bỏ `--target-time` = tới điểm WAL mới nhất trong kho.

### 3.1. Diễn tập / kiểm thử: restore vào volume MỚI rồi bật container tạm (không đụng stack đang chạy)
```bash
cd /opt/tami/releases/$E/current/docker/backup
IMG=tami-postgres:17-3.5-pgbackrest2.59
NET=tami-net                               # mạng của stack production
VOL=drill_pg_$(date +%Y%m%d%H%M)
docker volume create $VOL
time ./pg-restore.sh --volume $VOL --image $IMG --env-file $BK/pgbackrest.env --ssh-dir $BK/ssh --network $NET \
  --target-time "YYYY-MM-DD HH:MM:SS+00"                    # hoặc bỏ dòng này để lấy mới nhất
# Bật container tạm. BẮT BUỘC archive_mode=off: bản khôi phục KHÔNG được đẩy WAL (timeline mới) vào kho đang dùng.
docker run -d --name drill-pg --network $NET --env-file $BK/pgbackrest.env -e POSTGRES_PASSWORD=unused \
  -v $VOL:/var/lib/postgresql/data -v $PWD/pgbackrest.conf:/etc/pgbackrest/pgbackrest.conf:ro -v $BK/ssh:/etc/backup/ssh:ro \
  $IMG postgres -c archive_mode=off
until docker exec drill-pg psql -U tami -d tami -Atc "select not pg_is_in_recovery()" 2>/dev/null | grep -qx t; do sleep 2; done   # đo thời gian recovery
docker exec drill-pg psql -U tami -d tami -c "select count(*) from <bảng>"                                                      # mục 6
docker rm -f drill-pg && docker volume rm $VOL                                                                                  # dọn
```
Restore **bản production lên staging** (diễn tập 6 tháng/lần): dùng `pgbackrest.env` của production nhưng với **khoá chỉ đọc** (B2: application key read-only theo bucket;
SFTP: tài khoản chỉ đọc) và luôn `archive_mode=off`. **Không bao giờ** khởi động stack staging trỏ vào kho của production (WAL của staging sẽ đè timeline/stanza của production).

### 3.2. Sự cố thật: khôi phục TẠI CHỖ (mất/hỏng volume `postgres-data`)
1. Dừng ghi: `$C stop app jobs backup`; rồi `$C stop postgres`. (Container `backup` đã dừng nên bước 5 dùng `run --rm`, không `exec`.)
2. (Nên) giữ bản cũ để đối chiếu nếu còn đọc được: `docker run --rm -v <project>_postgres-data:/from -v /opt/tami/old-pg:/to alpine tar czf /to/pg-$(date +%F).tgz -C /from .`
   (`<project>` = `tami`). Cần ổ trống ≈ kích thước DB.
3. Khôi phục đè lên volume (delta: chỉ ghi lại file khác biệt, nhanh hơn):
   ```bash
   ./pg-restore.sh --volume <project>_postgres-data --image $IMG --env-file $BK/pgbackrest.env --ssh-dir $BK/ssh --network <mạng compose> \
     --delta --target-time "YYYY-MM-DD HH:MM:SS+00"       # bỏ --target-time để lấy điểm mới nhất
   ```
4. `$C up -d postgres` — postgres chạy recovery (đọc WAL từ kho), tới target thì tự promote (timeline mới); `archive_mode=on` của compose có hiệu lực sau promote nên WAL timeline mới tiếp tục lên kho.
5. **Ngay sau khi postgres sẵn sàng** (`$C ps postgres` healthy), khi `backup` vẫn đang dừng: chạy `full` bằng container tạm (đặt mốc cho timeline mới) rồi `check`:
   ```bash
   $C run --rm --no-deps --entrypoint bash backup /opt/backup/pg-backup.sh full
   $C run --rm --no-deps --entrypoint bash backup /opt/backup/pg-backup.sh check
   ```
6. Kiểm tra (mục 6), rồi `$C up -d backup` và chạy app/jobs bằng `deploy.sh` (hoặc `$C up -d app jobs`; nếu schema DB cũ hơn image thì chạy `$C --profile tools run --rm migrate` trước).
Mất cả server: dựng server mới theo `docs/runbooks/deploy.md` §3, đặt lại env file + `$BK` (từ bản cất riêng), `$C build postgres backup`, **không** `up postgres` bằng volume rỗng
rồi để app chạy; làm bước 3 vào volume rỗng (không `--delta`), rồi tiếp từ bước 4.

## 4. Khôi phục file (restic)

```bash
$C exec backup bash /opt/backup/restic-backup.sh snapshots                                # chọn snapshot
$C exec backup bash /opt/backup/restic-backup.sh restore latest /tmp/restored             # hoặc <id snapshot>; ghi vào /tmp/restored/mirror/<bucket>/...
$C exec backup find /tmp/restored/mirror -type f | head                                   # kiểm tra
$C exec backup bash /opt/backup/restic-backup.sh reupload /tmp/restored                   # đưa lại lên bucket SeaweedFS (chỉ thêm/ghi đè, không xoá)
$C exec backup rm -rf /tmp/restored
```
Nếu SeaweedFS mất hẳn: dựng lại bằng `$C up -d seaweedfs seaweedfs-init` (tạo bucket rỗng) rồi `reupload`. Lưu ý scheduler sẽ `rclone sync` bucket → `/mirror` lúc 03:00:
**khôi phục xong trước 03:00**, hoặc `$C stop backup` trong lúc khôi phục, để bản sao `/mirror` (đang trống) không bị chụp thành snapshot mới (snapshot cũ vẫn còn).

**Vượt ngưỡng xoá (`--max-delete 500`)**: nếu admin xoá hợp lệ hơn 500 media trong một ngày, `rclone sync` từ chối (job `files` fail, heartbeat stale mỗi ngày) vì không phân biệt được với bucket bị xoá nhầm.
Xử lý có kiểm soát, một lần, KHÔNG sửa compose/env cố định:
1. Xác nhận bucket nguồn đúng (đúng endpoint/tên bucket trong compose) và việc xoá là chủ ý (hỏi người dọn media); snapshot restic cũ vẫn còn nên chưa mất gì.
2. Chạy một lần với ngưỡng lớn hơn số object đã xoá (biến chỉ có hiệu lực trong lệnh này):
   `$C exec -e BACKUP_MAX_DELETE=5000 backup bash /opt/backup/restic-backup.sh backup`
3. Kiểm `$C exec backup bash /opt/backup/restic-backup.sh snapshots` có snapshot mới; từ hôm sau lịch tự chạy lại với ngưỡng 500.
Nếu bucket nguồn bị xoá/đọc nhầm (không phải chủ ý): KHÔNG nâng ngưỡng, khôi phục theo các lệnh trên.

## 5. Chi phí thời gian đã đo (Docker local, DB mẫu ~59MB, file mẫu ~2,5MB)

Đo bằng `docker/backup/test/e2e.sh` trên máy dev (đích S3 = SeaweedFS qua HTTPS, đích SFTP = OpenSSH, cùng máy). **Không đại diện cho dữ liệu thật/đường truyền thật**:
chỉ chứng minh quy trình đúng. Số liệu thật phải ghi lại ở mỗi lần diễn tập (mục 8).

| Bước | Đích S3 | Đích SFTP |
|---|---|---|
| pgBackRest full (1000 bản ghi + PostGIS) | 3–4 s | 15 s |
| pgBackRest diff | 2 s | 9 s |
| restore PITR (pgbackrest restore + recovery/khởi động) | 9 s + 4 s | 11 s + 7 s |
| restore mới nhất | 9 s + 3 s | 11 s + 10 s |
| restic backup lần đầu / tăng dần (sync + snapshot + forget) | 2 s / 2 s | 4 s / 4 s |
| restic restore 3 file | 1 s | 2 s |
| WAL lên kho khi KHÔNG ép chuyển segment (`archive_timeout=300`) | 297 s (kỳ vọng ≤ 300) | — |

Ước lượng RTO cho dữ liệu thật (cần xác nhận bằng diễn tập đầu tiên): quyết định + chuẩn bị server 30–60 phút; `pgbackrest restore` ≈ kích thước DB ÷ băng thông kho
(10GB ở 20MB/s ≈ 9 phút); recovery WAL tới target (thường vài phút); restic restore ≈ dung lượng file ÷ băng thông; bật stack + migrate + health 15 phút; kiểm tra sau khôi phục 30 phút.
Với dữ liệu giai đoạn 1 (vài GB) tổng ≈ 1,5–2 giờ, trong ngưỡng RTO 4 giờ; phần lớn là thao tác người, không phải truyền dữ liệu.

## 6. Kiểm tra sau khôi phục (bắt buộc ghi kết quả)

1. Số bản ghi các bảng chính khớp kỳ vọng (so với số ghi trước đó hoặc trước thời điểm sự cố): `select relname, n_live_tup from pg_stat_user_tables order by 1;` rồi `select count(*)` chính xác với các bảng cốt lõi (`listings`, `categories`, `users`, `media`, `payload_migrations`…).
2. Extension còn: `select extname from pg_extension` có `postgis`, `pg_trgm`, `unaccent`. Cột PostGIS đọc được.
3. Postgres không còn ở recovery: `select pg_is_in_recovery()` = `f`; `select * from pg_stat_archiver` không tăng `failed_count` (trừ drill dùng `archive_mode=off`).
4. Sau khi bật app: `curl -fsS http://127.0.0.1:3011/api/health` (staging; production `:3010`) trả 200; mở vài trang công khai + một ảnh từ bucket public + một file private qua admin.
5. File: `sha256sum` vài file mẫu so với snapshot (`restic-backup.sh restore` rồi so), danh sách object bucket khớp số file của snapshot.
6. Backup tiếp tục chạy: `pg-backup.sh check` OK, đã chạy `full` mới (mục 3.2 bước 5), textfile `tami_backup.prom` cập nhật.

## 7. Giám sát "backup thành công lần cuối" (dùng được khi chưa có Prometheus)

Sidecar ghi vào volume `backup-state` (`/var/lib/tami-backup` trong container). **Chỉ ghi khi job thành công (exit 0)**; job fail thì `.success` giữ nguyên, ghi `.failure`.

| File | Ý nghĩa |
|---|---|
| `<kind>.success` | epoch giây lần thành công gần nhất. `kind`: `wal` (check archive, mỗi 10 phút), `pg_full`, `pg_diff`, `files`, `files_check` |
| `<kind>.failure` | `<epoch> <exit code>` lần fail gần nhất |
| `textfile/tami_backup.prom` | `tami_backup_last_success_timestamp_seconds{kind,env}` và `tami_backup_last_run_ok{kind,env}` |

Kiểm tra bằng tay / script đơn giản (exit code rõ):
```bash
$C exec backup bash -c 'now=$(date +%s); for k in wal pg_diff files; do t=$(cat /var/lib/tami-backup/$k.success 2>/dev/null || echo 0); echo "$k: $(( (now-t)/60 )) phút trước"; done'
```
Ngưỡng cảnh báo gợi ý: `wal` > 30 phút (RPO), `pg_diff`/`pg_full`/`files` > 26 giờ (full: > 8 ngày), `files_check` > 8 ngày, `last_run_ok == 0` kéo dài > 1 giờ.

**Khi có Prometheus/node_exporter** (layer-4-task-06): chạy node_exporter với `--collector.textfile.directory=<thư mục chứa tami_backup.prom>`
(`docker volume inspect <project>_backup-state` cho đường dẫn host, thêm `/textfile`; hoặc bind mount thư mục đó). Quy tắc mẫu:
```yaml
- alert: TamiBackupStale
  expr: time() - tami_backup_last_success_timestamp_seconds{kind=~"pg_diff|files"} > 26*3600
  for: 10m
- alert: TamiWalArchiveStale
  expr: time() - tami_backup_last_success_timestamp_seconds{kind="wal"} > 30*60
- alert: TamiBackupNeverRan
  expr: absent(tami_backup_last_success_timestamp_seconds{kind="pg_diff",env="production"})
  for: 30h
```
**Khi chưa có gì:** dùng Uptime Kuma "Push" monitor: tạo monitor, dán URL push vào `HEARTBEAT_URL_<KIND>` (xem 2 file env mẫu; tên kind viết hoa, ví dụ `HEARTBEAT_URL_PG_DIFF`).
Script `GET` URL khi thành công (không bao giờ ghi URL ra log; lỗi gửi chỉ cảnh báo, không làm hỏng job). Đặt heartbeat interval của monitor lớn hơn chu kỳ job
(wal 20 phút; pg/files 26 giờ) nên **job im lặng/không chạy** cũng gây cảnh báo.

Cảnh báo bổ sung nên có: ổ cứng > 80%. **`HEARTBEAT_URL_WAL` nên đặt ngay từ đầu**: nó là cảnh báo sớm duy nhất trước khi trần WAL (mục 9) làm gãy PITR khi kho đích chết.

## 8. Diễn tập 6 tháng/lần (NFR-05)

Người thực hiện: người phụ trách hạ tầng; ghi kết quả vào bảng dưới (commit vào file này hoặc ticket) mỗi lần.
Quy trình: chọn một thời điểm trong 30 ngày qua → mục 3.1 (PITR về thời điểm đó, đo thời gian từng bước) → mục 4 (restic restore, so sha256) → mục 6 → ghi số liệu → dọn.
Diễn tập đầu tiên: ngay sau khi bật backup trên production (mục 2.6), khôi phục vào container `drill-pg` (mục 3.1; staging không có backup). Nhắc lịch: cuối tháng 4 và tháng 10 hằng năm.

| Ngày | Môi trường | Người làm | Thời điểm đích | pgBackRest restore | Recovery | restic restore | Tổng | Kết quả kiểm tra (mục 6) |
|---|---|---|---|---|---|---|---|---|
| _chưa diễn tập trên server_ | | | | | | | | |

## 9. Giới hạn đã biết / việc chỉ kiểm được khi lên server

- **Kho đích không với tới được (khoá hết hạn, B2 lỗi, sai env, chưa `stanza-create`) — WAL dồn ở `pg_wal`, có TRẦN tự động bảo vệ ổ đĩa.** Mỗi 5 phút có ghi sinh ~16MB (tối đa ~4,6GB/ngày).
  `archive-push-queue-max` (env `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX`, mặc định compose prod: **8GiB**; đổi bằng `BACKUP_ARCHIVE_PUSH_QUEUE_MAX` trong env file của môi trường):
  quá trần thì pgBackRest báo PostgreSQL "đã lưu" rồi **bỏ WAL** và ghi cảnh báo `dropped WAL file ...` vào log postgres. Mục đích: ổ đĩa server dùng chung không đầy làm sập postgres TAMI **và cả các dự án khác**
  ("thà mất backup còn hơn mất DB"). Đã kiểm bằng test (`e2e.sh`, case "kho không với tới": ghi 14 segment ~224MB khi kho chết, trần 48MiB → pg_wal không phình, DB vẫn ghi, kho hồi phục → full mới OK).
  **Hệ quả bắt buộc xử lý:** từ lúc WAL đầu tiên bị bỏ, chuỗi WAL gãy ⇒ **PITR không đi qua khoảng đó**. Ngay khi kho hồi phục:
  ```bash
  $C exec backup bash /opt/backup/pg-backup.sh check        # xác nhận kho với tới được
  $C exec backup bash /opt/backup/pg-backup.sh full         # BẮT BUỘC: full MỚI (không phải diff) để lấy lại khả năng PITR
  $C logs postgres 2>&1 | grep 'dropped WAL file'           # biết đã bỏ từ lúc nào (khoảng đó KHÔNG khôi phục theo thời điểm được)
  ```
  Phát hiện sớm (đừng chờ tới trần): heartbeat `wal` (check mỗi 10 phút, `last_run_ok{kind="wal"}==0` hoặc `.success` cũ hơn 30 phút) + ổ cứng > 80%. **Khuyến nghị đặt `HEARTBEAT_URL_WAL` ngay khi bật backup**
  (mục 7) vì giám sát tập trung (layer-4-task-06) đang hoãn. Trần chỉ chặn *sự cố ổ đầy*, không thay cho cảnh báo: kho chết quá cỡ 1–2 ngày thì PITR đã gãy mà không ai biết nếu không có cảnh báo.
- **SFTP cho pgBackRest bị giới hạn bởi libssh2 1.9.0 của Debian 11** (trong image): chỉ đàm phán kex `diffie-hellman-*`, host key `ssh-rsa`, khoá người dùng RSA PEM (kèm
  `repo1-sftp-public-key-file`). sshd mặc định OpenSSH (Ubuntu 24.04) có kex DH nhưng **tắt `ssh-rsa` (SHA-1)**; server SFTP phải bật lại `HostKeyAlgorithms +ssh-rsa` và
  `PubkeyAcceptedAlgorithms +ssh-rsa` (và nếu hardened: `KexAlgorithms +diffie-hellman-group-exchange-sha256`). Đã chứng minh chạy với cấu hình đó (`e2e.sh sftp`). Nếu không chấp nhận hạ thuật toán trên server đích,
  dùng **kho S3-compatible** cho pgBackRest (khuyến nghị). restic qua SFTP dùng OpenSSH client hiện đại nên không bị giới hạn này.
- pgBackRest nói **HTTPS** tới S3: endpoint phải có TLS hợp lệ (hoặc `PGBACKREST_REPO1_STORAGE_CA_FILE` trỏ CA nội bộ). Không tắt verify-tls trên môi trường thật.
- **Image build trên OS hết hạn hỗ trợ**: base `postgis/postgis:17-3.5` là Debian 11 (kho đã chuyển sang `archive.debian.org`/`apt-archive.postgresql.org`, Dockerfile đã trỏ lại). Việc cần làm sau: lên
  postgis base Debian 12 + `REINDEX` các index text sau khi kiểm tra collation (đổi base = thay đổi dữ liệu, làm riêng, có diễn tập). Tới lúc đó cài gói từ kho lưu trữ là chấp nhận được vì chỉ cài `pgbackrest` (ghim phiên bản), `openssh-client`, `curl`.
- **Bản sao `/mirror`** tốn thêm ổ bằng dung lượng 2 bucket; theo dõi cùng ổ cứng (cảnh báo > 80%).
- **Mất mật khẩu mã hoá = mất backup** (`PGBACKREST_REPO1_CIPHER_PASS`, `RESTIC_PASSWORD`). Cất bản sao ngoài server, ngoài repo.
- **Env file và `$BK/ssh` không nằm trong backup này.** Cấu hình server lưu trong repo (trừ secret); secret cất riêng theo `ARCHITECTURE.md` §8.
- **Chưa chạy trên server thật** (không SSH/deploy theo phạm vi task): build image trên server (cần mạng tới `apt-archive.postgresql.org`, `archive.debian.org`, Docker Hub), quyền chown `999:999` của `$BK/ssh`,
  băng thông/độ trễ thật tới kho đích, số liệu RTO thật, tương tác với Promtail/Alloy. Các điểm đó kiểm ở lần bật backup đầu tiên trên production và diễn tập đầu tiên.
- `restic forget --prune` chạy hằng ngày: kho nhỏ nên rẻ; nếu kho lớn thì chuyển prune sang hằng tuần (sửa `restic-backup.sh`). `files_check` đọc thử 10% dữ liệu mỗi tuần.
- `restic backup` giữ `--host tami-<env>`: đổi `BACKUP_ENV_NAME` sẽ tách chuỗi snapshot (và `forget` không dọn chuỗi cũ). Đừng đổi.

## 10. Test và dọn dẹp

Test thật (không đụng container dev; dựng project tạm `tami-bk-e2e` từ compose prod (docker/docker-compose.prod.yml + overlay đổi tên container/network sang tami-bk-e2e-*, secret giả) + đích tạm, tự dọn khi xong):
```bash
bash docker/backup/test/e2e.sh            # cả hai đích (s3, sftp), ~10 phút (chờ archive_timeout thật 5 phút)
bash docker/backup/test/e2e.sh s3         # một đích;  E2E_WAIT_ARCHIVE_TIMEOUT=0 bỏ bước chờ 5 phút
```
Nếu bị ngắt giữa chừng, dọn tay. **CHỈ chạy trên máy dev** (container prod cố định tên `tami-*`; overlay e2e đổi sang `tami-bk-e2e-*` nên không va chạm, nhưng đừng chạy trên server prod), và không chạy các lệnh dưới
(chúng lọc theo project `tami-bk-e2e` nên không đụng container/mạng của stack thật, nhưng đừng thử trên server dùng chung):
```bash
docker compose -p tami-bk-e2e down -v --remove-orphans 2>/dev/null
docker ps -aq --filter label=com.docker.compose.project=tami-bk-e2e | xargs -r docker rm -f
docker ps -aq --filter name=tami-bk-e2e- | xargs -r docker rm -f                  # container `docker run` của test (restore, chuyển image)
docker volume ls -q --filter label=com.docker.compose.project=tami-bk-e2e | xargs -r docker volume rm
docker volume ls -q --filter name=tami-bk-e2e | xargs -r docker volume rm         # volume restore/chuyển image tạo bằng `docker volume create`
docker network ls -q --filter label=com.docker.compose.project=tami-bk-e2e | xargs -r docker network rm
rm -rf docker/backup/test/.work
```
Test chạy: **chuyển image** (volume do image gốc khởi tạo → bật bằng image tuỳ biến: bản ghi, collation, extension, amcheck, REINDEX) → stanza-create → full → thêm dữ liệu → diff → mốc T → thêm dữ liệu → check → restore PITR về T và restore mới nhất (so số bản ghi + cột PostGIS) → restic backup → xoá bucket nguồn + bản sao → restore → so sha256 → đưa lại lên bucket
→ heartbeat (thành công/thất bại/textfile/URL push) → scheduler → `archive_timeout` thật → **kho không với tới** (trần WAL 48MiB: pg_wal không phình, DB vẫn ghi, check fail + heartbeat, kho hồi phục → full mới + WAL lại lên kho).
