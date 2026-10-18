Agent: reviewer

# Review — feature-backup-base-image-debian12 · phase-1-task-01 · round 1

- **Review level:** STRICT
- **Reason:** đổi base OS của Postgres server (bullseye glibc 2.31 → bookworm glibc 2.36) trên volume đã có dữ liệu: collation, rủi ro index hỏng hoặc mất dữ liệu; script deploy dùng chung cho staging và prod (guard mới); runbook vận hành DB prod; image backup/restore (pgBackRest/restic).
- **Blast radius:** `docker/backup/Dockerfile` (3 target postgis/postgres/backup → postgres dev/staging/prod + sidecar backup), `docker/backup/postgis/*` (initdb chạy khi khởi tạo volume mới), compose dev/staging/prod (tag image mới), `scripts/deploy/deploy.sh` (mọi lần deploy staging/prod), runbook `postgres-base-image.md`/`restore.md`/`deploy.md`, e2e backup, spec/test-scope (bàn giao cho template test).

## Verify commands + kết quả

| Lệnh | Kết quả |
|---|---|
| `bash scripts/deploy/deploy.test.sh` | PASS ("Tất cả test PASS", có 8 test nhóm "guard postgres") |
| `docker run --rm --entrypoint sh tami-postgis:17-3.5-bookworm -c '…'` | bookworm; `ldd (Debian GLIBC 2.36-9+deb12u14) 2.36`; PG 17.11; `postgresql-17-postgis-3(+scripts) 3.5.2+dfsg-1.pgdg120+1`; `ca-certificates 20250419~deb12u1`. **`/docker-entrypoint-initdb.d/10_postgis.sh` mode `-rwxr-xr-x`** (image gốc `postgis/postgis:17-3.5` là `-rw-r--r--`) |
| Khởi tạo volume mới: `docker run tami-postgis:17-3.5-bookworm` + mount `docker/postgres/init.sql` → `01-extensions.sql` (container `tami-bk-review-init`, đã dọn) | **FAIL**: `running /docker-entrypoint-initdb.d/10_postgis.sh` → `10_postgis.sh: line 20: --dbname=template_postgis: command not found`, container dừng |
| Như trên với `tami-postgres:17-3.5-bookworm-pgbackrest2.59` + `--restart unless-stopped` (giống compose; container `tami-bk-review-init2`, đã dọn `-v`) | `restarts=1 running=true`, healthy nhưng **khởi tạo dở**: DB `postgres,tami,template1,template0` (**không có `template_postgis`**); extension `pg_trgm,plpgsql,postgis,unaccent` (**thiếu `postgis_topology`, `fuzzystrmatch`, `postgis_tiger_geocoder`**) |
| Log e2e của builder (`…/scratchpad/e2e-bl002.log`) | E2E PASS, EXIT=0; switch: datcollversion 2.31→2.36 cả 4 DB, mismatch 1→0, amcheck 73 index sạch. Theo ghi nhận trên, postgres chính của e2e (volume mới, image mới, `restart: unless-stopped`) cũng chỉ khởi tạo dở mà vẫn Healthy; e2e không assert extension ở volume mới nên không phát hiện |
| `git ls-files -s docker/backup/*.sh`; `git config core.filemode` | script cũ đều `100644`; `core.filemode=false` |
| pnpm lint/typecheck/test/build | skip, không đổi code app (không có TS/JS trong diff) |
| e2e đầy đủ | Không chạy lại (~15 phút). Dùng log của builder + các lần chạy container đích danh ở trên |

Sau review, `docker ps -a --filter name=tami-bk-review` ra 0. Không đụng `tami-postgres` và `tami-dev_*`.

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ hạ tầng Docker/script/doc).

## Skill gates
- aislop: N/A, không có code app (shell/Dockerfile/doc). Không chạy.
- oxlint (anti-slop): N/A, diff không đụng TS/JS.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK. Tên hàm rõ (`guard_postgres_image`, `switch_reindex_all_databases`…), comment nói "vì sao", runbook và ARCHITECTURE đã cập nhật. `image_switch_test` dài (> 50 dòng) nhưng là kịch bản test tuần tự. Có 1 indicator nhỏ, dưới ngưỡng 3.
- ai-friendly-web: N/A, không phải task public web.
- blitzstrike: N/A, không có auth/API/input public. Không chạy.

## Findings

### [MAJOR-1] `10_postgis.sh` có bit thực thi nên volume mới khởi tạo dở mà không báo lỗi (khác hành vi image postgis/postgis gốc)
- `docker/backup/Dockerfile:46` `COPY postgis/10_postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh` (và `:47` update-postgis.sh).
- Script vendor dùng mảng `"${psql[@]}"` (`docker/backup/postgis/10_postgis.sh:13,19`). Mảng này chỉ có khi `docker-entrypoint.sh` **source** file, tức file không có bit `x`. Image gốc để file ở mode 644. Image build từ build context Windows (Docker Desktop: mọi file 755) thì entrypoint **chạy** script như tiến trình riêng: `psql` rỗng, `--dbname=…: command not found`, initdb dừng giữa chừng.
- Với `restart: unless-stopped` (compose dev/staging/prod), lần khởi động lại thấy PGDATA đã có nên bỏ qua init. Postgres **healthy** nhưng thiếu `template_postgis`, `postgis_topology`, `fuzzystrmatch`, `postgis_tiger_geocoder` (đã tái hiện, xem bảng verify). Dev trên Windows (máy mới hoặc `down -v`) gặp ngay. Trên server Linux, kết quả phụ thuộc mode git của file: hôm nay nhiều khả năng 644, nhưng chỉ cần một lần `chmod +x`/WSL commit là prod/staging volume mới hỏng theo kiểu này. Ngược lại, nếu 644 thì `update-postgis.sh` lại **không** thực thi được (image gốc là 755).
- e2e cho cảm giác an toàn sai: postgres chính của e2e khởi tạo volume mới bằng image mới, khởi tạo dở mà vẫn PASS vì không có assert extension trên volume mới.
- **Cách fix:** `COPY --chmod=0644 postgis/10_postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh` và `COPY --chmod=0755 postgis/update-postgis.sh /usr/local/bin/update-postgis.sh` (BuildKit, compose v2 có sẵn). Hoặc RUN chmod tương ứng, kèm assert trong RUN (`test ! -x /docker-entrypoint-initdb.d/10_postgis.sh`). Thêm vào e2e (hoặc test build riêng) case "volume mới bằng image bookworm + init.sql": assert có `template_postgis` và đủ 6 extension `postgis, postgis_topology, fuzzystrmatch, postgis_tiger_geocoder, pg_trgm, unaccent` trong `tami` (cùng bộ extension của volume cũ, theo task §Hiện trạng).

### [MAJOR-2] Lệnh trong runbook `postgres-base-image.md` không copy chạy được trên staging/prod: `$C` trỏ `current` (đã bị trả về release cũ) và thiếu `TAMI_IMAGE`
- `docs/runbooks/postgres-base-image.md:34-35,39` định nghĩa `$C … -f /opt/tami/releases/<env>/current/docker/…` và viết "Release `current` phải là commit đã có Dockerfile/compose bookworm … deploy đó sẽ bị guard chặn". Nhưng guard `die` thì `cleanup()` (`scripts/deploy/deploy.sh:131-135`) **trả `current` về release trước**, và chính runbook nói vậy ở §6 (`:175`). Hệ quả: §3.3 `$C build postgres` build Dockerfile/tag **cũ**, §3.4 `$C up -d postgres` không đổi gì, kiểm `ldd` ra 2.31. Operator bị kẹt giữa cửa sổ bảo trì (app đã dừng ở §3.2), hoặc tự xoay xở theo cách chưa có hướng dẫn.
- `docker/docker-compose.staging.yml:77,94` (và prod tương tự) có `image: ${TAMI_IMAGE:?…}` cho app/jobs. `deploy.md:96` ghi env file không cần đặt `TAMI_IMAGE`, nên mọi lệnh `$C build|up|stop|exec` trong runbook fail ở bước interpolation compose. §3.8 `$C up -d app jobs` thì cần `TAMI_IMAGE` = đúng image đang chạy. Nếu `$C` vẫn trỏ compose cũ, `up app jobs` còn có thể kéo dependency `postgres` (`depends_on: service_healthy`) về config/image cũ trên volume vừa REINDEX theo 2.36.
- **Cách fix:** trong §2 đặt `R=/opt/tami/releases/<env>/<sha-mới>` (release BL-002 do workflow upload, hoặc lấy từ log deploy bị chặn) và `C="TAMI_IMAGE=$(cat /opt/tami/state/<env>.current | cut -d' ' -f1) docker compose --env-file … -f $R/docker/docker-compose.<env>.yml"`, hoặc `export TAMI_IMAGE=…` (kiểm định dạng file state). Bỏ câu mâu thuẫn ở `:39`. §3.8 nên ưu tiên **chạy lại `deploy.sh`** cho release mới (đổi symlink + app đúng digest) thay vì `$C up -d app jobs`. Thêm cảnh báo: không bao giờ chạy `up` bằng compose của release cũ sau §3.4 (sẽ đưa postgres về image bullseye trên dữ liệu đã REINDEX theo 2.36). Ghi chú ngoài scope: `restore.md:10` có cùng thiếu sót `TAMI_IMAGE` từ trước, đề xuất task riêng.

### [MINOR-1] `spec/test-scope/current.json` → `changed.files` lệch file thật
- Có `docker/backup/initdb-postgis.sh` và `docker/backup/update-postgis.sh` (không tồn tại). File thật là `docker/backup/postgis/10_postgis.sh` và `docker/backup/postgis/update-postgis.sh`. Thiếu `docs/runbooks/postgres-base-image.md` và `docker/backup/pgbackrest-env.example`.
- **Fix:** sửa danh sách cho khớp `git status` (spec-publisher chạy lại; scopeVersion/specVersion giữ nguyên 10/1.10.0 vì cùng lần publish).

### [MINOR-2] Guard deploy chỉ dựa vào container, không xét volume
- `scripts/deploy/deploy.sh:262-263`: chưa có container thì cho qua. Volume `postgres-data` cũ vẫn còn mà container đã bị `compose down`/`rm` (sự cố, thao tác tay) thì deploy tự tạo postgres bằng image bookworm trên dữ liệu glibc 2.31, đúng lỗi guard định chặn.
- **Fix gợi ý:** khi không có container, kiểm volume `<project>_postgres-data` có tồn tại. Nếu có thì `die`, trừ khi có cờ override tay (`--allow-new-postgres-container`), hoặc chạy container tạm đọc `PG_VERSION` + `datcollversion`. Thêm test.

### [MINOR-3] Runbook chưa giải thích phạm vi `REINDEX DATABASE` (PG17 bỏ qua system catalog) và chỉ amcheck DB `tami`
- `docs/runbooks/postgres-base-image.md:87-103,110-113`: nên ghi rõ `REINDEX DATABASE` trong PG17 không reindex `pg_catalog`. Việc này an toàn vì cột name/text trong catalog dùng collation "C" (không phụ thuộc glibc). Amcheck §3.6 chỉ chạy trên `$DB`. Nên lặp qua cùng danh sách DB của §3.5 (ít nhất `template_postgis`, `template1`, vì DB tạo sau này copy index từ template). Query amcheck nên lọc `i.indisvalid and c.relpersistence <> 't'` để không lỗi ở index invalid/temp.

### [MINOR-4] Runbook §3.1: `pg_dump -Fc $DB` không gồm roles/globals
- Khi rollback "khôi phục vào volume mới" thì thiếu role. Thêm `docker exec $PG pg_dumpall -U $U --globals-only > …/globals-pre-bookworm.sql`.

### [MINOR-5] Dockerfile: `ca-certificates` không ghim phiên bản; lỗi chính tả
- `docker/backup/Dockerfile:36` cài `ca-certificates` (và `openssh-client curl` ở `:69`, lớp này có sẵn từ trước) không ghim. Chấp nhận được vì là kho bảo mật Debian, nhưng nên ghi rõ lý do trong comment cho khớp tiêu chí "gói ghim version". `:7` "đổi phiên sản" → "đổi phiên bản".

### [MINOR-6] CI dùng `postgis/postgis:17-3.5` (bullseye, PG 17.5, glibc 2.31)
- `.github/workflows/ci.yml:22`: DB test dùng rồi bỏ nên không có rủi ro dữ liệu, không vi phạm acceptance (acceptance chỉ nói `docker/`). Nhưng test chạy trên PG/glibc khác prod và OS EOL. Đề xuất task riêng: dùng image `tami-postgis` build trong CI, hoặc `postgres:17.11-bookworm` + PostGIS. Builder đã ghi residual risk.

## Các điểm đã kiểm, đạt
- Base ghim đúng `postgres:17.11-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826`. Assert `VERSION_CODENAME=bookworm` + glibc ` 2.36` ở đầu RUN. Kho archive dùng `signed-by=/usr/local/share/keyrings/postgres.gpg.asc`. PostGIS và pgbackrest ghim `=version`. Dọn `/var/lib/apt/lists`. ENV `POSTGIS_MAJOR/POSTGIS_VERSION` như image gốc. Thứ tự `01-extensions.sql` → `10_postgis.sh` đúng (log entrypoint xác nhận), `IF NOT EXISTS` nên không xung đột (khi file được source đúng).
- Tag đổi tên nhất quán giữa compose dev/staging/prod, `e2e.sh` (`PG_IMAGE`/`BACKUP_IMAGE`), runbook, deploy.md, restore.md, ARCHITECTURE.
- deploy.sh guard: so `.Config.Image` với `compose config --images postgres`. Lần đầu cho qua. Dry-run không gọi docker. `die` nằm trước `compose up -d <base>` nên chưa đổi container, và `cleanup` trả symlink về. Không đổi luồng rollback app. Có 8 test, PASS.
- e2e `image_switch_test`: volume tạo bằng bullseye ghim digest. Assert datcollversion 2.31, mismatch > 0 trước, REINDEX + REFRESH mọi DB `datallowconn` (gồm template1, template_postgis), refresh pg_collation, assert mọi datcollversion = 2.36 (kể cả template0, assert đếm toàn `pg_database`), 0 cảnh báo, amcheck heapallindexed ≥ 4 index, thứ tự index = sort, PostGIS 3.5.2, gist. Có dọn container/volume. Không thấy assert nào bị nới lỏng sai. Amcheck trước REINDEX chỉ ghi nhận, phù hợp vì glibc 2.31→2.36 thường không đổi thứ tự trên mẫu.
- SFTP: đổi `docker-compose.e2e.yml` có bằng chứng probe 5 cấu hình (task Decision 4) và e2e sftp PASS. restore.md §9 và `pgbackrest-env.example` mô tả khớp.
- Runbook đúng thứ tự an toàn: backup (prod: check + full + pg_dump) → dừng app/jobs/backup → build → up postgres → REINDEX + REFRESH → amcheck → full mới glibc mới → bật app. Staging diễn tập trước prod. Có rollback (REINDEX lại khi về image cũ). template0 bỏ qua đúng.
- Không còn base Debian 11 trong `docker/` (FROM chỉ còn `postgres:17.11-bookworm`, `restic`, `rclone`, Node).
- Spec delta: `SPECIFICATIONS.md` 1.10.0 + bullet hạ tầng, CHANGELOG, spec/updates, change doc khớp nội dung thay đổi (trừ MINOR-1).

## Residual risk
- Chưa chạy trên staging/prod thật. Thời gian REINDEX và WAL sinh ra khi REINDEX với `archive_mode=on` ở prod chưa đo.
- Chưa kiểm build image trên host Linux (mode file theo git). MAJOR-1 fix bằng `--chmod` sẽ loại bỏ phụ thuộc này.
- Không chạy lại e2e đầy đủ. Dựa vào log của builder + 2 lần khởi tạo container đích danh.

## Verdict
**❌ FAIL**: 2 MAJOR (MAJOR-1: image `postgis` không tương đương image gốc trên volume mới, khởi tạo dở mà không báo lỗi, e2e không bắt được; MAJOR-2: lệnh trong runbook chuyển image không chạy được trên staging/prod). Builder sửa MAJOR-1/2 (kèm test volume mới) và nên sửa MINOR-1, rồi review round 2.
