# feature-backup-base-image-debian12 · phase-1-task-01 — Nâng base image Postgres/backup từ Debian 11 (EOL) lên Debian 12 bookworm + quy trình chuyển image có REINDEX

- Change doc: `spec/changes/archive/2026-10-19-backup-base-image-debian12.md` (BACKLOG BL-002, mục 10/10)
- Nguồn: L4 G14, G18 spec-validation layer 5; `docs/runbooks/restore.md` §9 ("Image build trên OS hết hạn hỗ trợ")
- Spec: `SPECIFICATIONS.md` §Hạ tầng (bullet "Image PostgreSQL ... Debian 12 bookworm", BL-002); NFR-05

## Hiện trạng (change-request đã kiểm thật)
- `docker/backup/Dockerfile`: `ARG POSTGIS_IMAGE=postgis/postgis:17-3.5@sha256:01a6a70e…` (Debian 11 bullseye, glibc 2.31, PG 17.5, PostGIS 3.5.2), assert `VERSION_CODENAME=bullseye` + glibc 2.31; kho `archive.debian.org` + `apt-archive.postgresql.org bullseye-pgdg`; `pgbackrest=2.59.1-1.pgdg11+1`. Target `postgres` / `backup` (restic 0.17.3, rclone 1.68.2, openssh-client, curl).
- Compose: prod `tami-postgres:17-3.5-pgbackrest2.59` + `tami-backup:pgbackrest2.59-restic0.17.3` (build `./backup`); staging + dev `image: postgis/postgis:17-3.5` (bullseye). `scripts/deploy/deploy.sh:262-275` chạy `compose up -d postgres redis seaweedfs [backup]` mỗi deploy ⇒ đổi image trong compose sẽ **tự tạo lại postgres bằng image mới trên volume cũ mà không REINDEX**.
- Tag Docker Hub (kiểm `docker manifest inspect` 2026-10-19): `postgis/postgis` **không có** biến thể bookworm cho 17-3.5 (`17-3.5-bookworm`, `17-3.5-bullseye`, `17-3.5-trixie` đều không tồn tại). `17-3.5` vẫn bullseye (build 2026-08-31, PG 17.5); `17-3.6` đã lên **trixie** (glibc 2.41, PG 17.11, PostGIS 3.6.4).
- Official `postgres:17.11-bookworm` tồn tại: index digest `sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826` (Debian 12, glibc 2.36, `postgresql-17 17.11-1.pgdg12+2`, key `/usr/local/share/keyrings/postgres.gpg.asc`, đã có `pgdg.list` → `apt.postgresql.org bookworm-pgdg main 17`).
- `apt-archive.postgresql.org/pub/repos/apt dists/bookworm-pgdg-archive` có `postgresql-17-postgis-3` + `-scripts` `3.5.2+dfsg-1.pgdg120+1` (đúng bản đang chạy) và `3.5.3+dfsg-2.pgdg12+1`; `pgbackrest` `2.59.0..2.59.3` (`2.59.1-1.pgdg12+1` có). Depends postgis: `libc6 >= 2.35`, libgdal32, libgeos-c1v5, libproj25… (Debian 12 main).
- Image `postgis/postgis` còn có `/docker-entrypoint-initdb.d/10_postgis.sh` (tạo `template_postgis` + extension `postgis`, `postgis_topology`, `fuzzystrmatch`, `postgis_tiger_geocoder` trong template_postgis và `$POSTGRES_DB`) + `/usr/local/bin/update-postgis.sh`, ENV `POSTGIS_MAJOR/POSTGIS_VERSION`.
- Dev DB (đọc-only): locale provider libc, `en_US.utf8`, `datcollversion = 2.31` ở mọi DB (trừ template0); extension `postgis 3.5.2`, `postgis_topology`, `postgis_tiger_geocoder`, `fuzzystrmatch`, `pg_trgm`, `unaccent`. Prod/staging cùng dạng (cùng image gốc).

## Classification / Risk
- Type: **MODIFY** (hạ tầng; NFR-05 không đổi). Risk: **HIGH (dữ liệu)** — đổi glibc 2.31 → 2.36 đổi collation `en_US.utf8`; index btree trên text tạo bằng glibc cũ có thể sai thứ tự ⇒ bắt buộc `REINDEX` + `ALTER DATABASE … REFRESH COLLATION VERSION`. Không migration Payload, không đổi volume/DB thật. Reviewer: **STRICT**.

## Quyết định thiết kế (change-request, auto proceed)
1. **Base:** tự dựng target `postgis` = `FROM postgres:17.11-bookworm@sha256:3645570c…` + `postgresql-17-postgis-3=3.5.2+dfsg-1.pgdg120+1` + `postgresql-17-postgis-3-scripts=3.5.2+dfsg-1.pgdg120+1` từ `apt-archive … bookworm-pgdg-archive` (giữ đúng PostGIS 3.5.2 đang chạy ⇒ không cần `ALTER EXTENSION … UPDATE`). Lý do: postgis/postgis không có bookworm cho 3.5; `17-3.6` (trixie) kéo theo PostGIS 3.6 + glibc 2.41 = 2 thay đổi lớn cùng lúc. Bookworm còn hỗ trợ (LTS tới 06/2028). PG 17.5 → 17.11 (minor, cùng định dạng dữ liệu, có bản vá bảo mật).
2. Giữ hành vi image gốc cho volume mới: vendor `10_postgis.sh` (initdb) + `update-postgis.sh` + ENV `POSTGIS_MAJOR=3`, `POSTGIS_VERSION=3.5.2+dfsg-1.pgdg120+1` (nguồn: postgis/docker-postgis, MIT — ghi nguồn ở đầu file).
3. Target `postgres` = `FROM postgis` + `pgbackrest=2.59.1-1.pgdg12+1` (cùng patch đang chạy; từ `bookworm-pgdg-archive` để bản ghim không biến mất). Target `backup` = `FROM postgres` + openssh-client + curl từ kho Debian 12 thường (bỏ archive.debian.org). Assert đầu RUN: `VERSION_CODENAME=bookworm` + glibc `2.36`.
4. **Đổi tag image** (bắt buộc — deploy.sh không pull image tự build, cùng tag thì image bullseye cũ trên server vẫn được dùng): vd `tami-postgis:17-3.5-bookworm`, `tami-postgres:17-3.5-bookworm-pgbackrest2.59`, `tami-backup:bookworm-pgbackrest2.59-restic0.17.3`. Dev + staging compose dùng target `postgis` (build `./backup`); prod giữ `postgres` + `backup`.
5. **Guard deploy:** `deploy.sh` trước `compose up -d <base>` — nếu container postgres của môi trường đang chạy image KHÁC image khai trong compose ⇒ `die` trỏ runbook (không tự đổi image postgres trên volume cũ). Cho phép lần đầu (chưa có container). Test trong `scripts/deploy/deploy.test.sh`.
6. `e2e.sh image_switch_test`: volume khởi tạo bằng image gốc bullseye ghim digest (`postgis/postgis:17-3.5@sha256:01a6a70e…`) với dữ liệu text đa dạng (tiếng Việt có dấu, hoa/thường, dấu câu, khoảng trắng, gạch nối, số) + index btree text + gist → bật bằng image bookworm → kỳ vọng: số bản ghi + checksum dữ liệu (order by id) giữ nguyên, `datcollversion` cũ 2.31, Postgres **cảnh báo collation version mismatch** (đúng kỳ vọng); ghi kết quả amcheck index cũ trước REINDEX (thông tin, không fail); chạy đúng quy trình runbook (`REINDEX DATABASE` từng DB có datcollversion + `ALTER DATABASE … REFRESH COLLATION VERSION`, collation pg_collation có version lệch → `ALTER COLLATION … REFRESH VERSION`) → `datcollversion = 2.36`, không còn cảnh báo, amcheck `bt_index_check(…, true)` mọi index btree sạch, `postgis_full_version()` 3.5.2 không báo cần upgrade, truy vấn gist đúng. Ghi checksum thứ tự theo collation trước/sau (thông tin: glibc có đổi thứ tự mẫu không).
7. Runbook: section mới trong `docs/runbooks/restore.md` (hoặc file `docs/runbooks/postgres-base-image.md` + link từ restore.md §9 và deploy.md) — thứ tự bắt buộc: dev → **staging (diễn tập backup/restore trước)** → prod; từng bước + lệnh + điểm rollback.

## Acceptance
- [ ] Mọi Dockerfile/compose trong `docker/` không còn dùng base Debian 11; tag/digest/phiên bản gói ghim cụ thể; build assert bookworm/glibc 2.36
- [ ] PG server 17 + PostGIS 3.5.2; `pg_dump`/`pg_restore`/`pgbackrest` trong image cùng major 17
- [ ] `docker build` target postgis/postgres/backup PASS
- [ ] `bash docker/backup/test/e2e.sh` (s3 + sftp) PASS trên image mới, gồm image_switch_test bullseye→bookworm có REINDEX/refresh collation/amcheck
- [ ] Guard deploy chặn đổi image postgres tự động; `bash scripts/deploy/deploy.test.sh` PASS
- [ ] Runbook: quy trình chuyển image cho môi trường có dữ liệu + bắt buộc diễn tập backup/restore trên staging trước prod; không deploy
- [ ] Không đụng volume dev `tami-postgres-data`/container dev; dọn container/volume/image tạm của e2e

## Verification Plan
- `docker build --target {postgis,postgres,backup} docker/backup`; chạy lệnh kiểm phiên bản trong image (`grep CODENAME /etc/os-release`, `ldd --version`, `postgres --version`, `pg_dump --version`, `pgbackrest version`, `restic version`, `rclone version`, `dpkg -l postgresql-17-postgis-3`).
- `bash docker/backup/test/e2e.sh` (cả hai đích; được dùng `E2E_WAIT_ARCHIVE_TIMEOUT=0` nếu ghi rõ) — log lưu scratchpad, tóm tắt RESULT vào task.
- `bash scripts/deploy/deploy.test.sh`; `docker compose -f docker/docker-compose.{dev,staging,prod}.yml config -q` (env giả).
- Không áp dụng pnpm lint/typecheck/test/build (không đổi code app) — ghi `skip, no app code changed` nếu không chạy.
- Report: `.context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`. Nếu REINDEX/refresh collation không đưa DB về trạng thái sạch (amcheck lỗi sau REINDEX) hoặc không build được bookworm với PostGIS 3.5 → `blocked` + phương án.

## Decision log
- (change-request) Xem "Quyết định thiết kế" 1–7.

### Decision log (builder)
1. **`ca-certificates` cài thêm ở target `postgis`** (lệch nhỏ so với Quyết định 3 "assert ca-certificates có sẵn"): image `postgres:17.11-bookworm` official KHÔNG có `ca-certificates` (postgis/postgis có vì docker-postgis tự cài) — build attempt 1 fail ở `test -s /etc/ssl/certs/ca-certificates.crt`. Cài từ kho Debian 12 của base (http) trước khi thêm kho `apt-archive.postgresql.org` (https). Giữ assert bookworm + glibc 2.36.
2. Script vendor để ở **`docker/backup/postgis/10_postgis.sh` + `update-postgis.sh`** (build context là `docker/backup`); nội dung lấy từ `docker run --rm --entrypoint cat postgis/postgis:17-3.5 …`, giữ nguyên logic, header ghi nguồn postgis/docker-postgis (MIT). Thư mục này cũng được mount vào sidecar (`./backup:/opt/backup:ro`) — vô hại.
3. Kho pgdg hiện hành (`pgdg.list` của base) **giữ nguyên** bên cạnh `pgdg-archive.list`; mọi gói pgdg ghim `=<version>` nên apt lấy đúng bản ở archive.
4. **SFTP e2e: giảm còn đúng 1 dòng `PubkeyAcceptedAlgorithms +ssh-rsa`** (tuỳ chọn trong task, đã chứng minh bằng probe trước khi đổi): libssh2 1.10.0-3+deb12u1 của bookworm link `libssl3` (không còn libgcrypt). Probe `pgbackrest repo-ls` tới `atmoz/sftp:alpine`: sshd mặc định → fail (userauth); chỉ `PubkeyAcceptedAlgorithms +ssh-rsa` → OK; chỉ `HostKeyAlgorithms +ssh-rsa` → fail; sshd **chỉ cho `curve25519`** + `PubkeyAcceptedAlgorithms +ssh-rsa` → OK (kex curve25519 + host key ed25519 đàm phán được). Kết luận: chỉ chữ ký khoá người dùng RSA còn là `ssh-rsa` (rsa-sha2-* từ libssh2 1.11). Cập nhật comment `docker-compose.e2e.yml`, `pgbackrest-env.example`, restore.md §9, ARCHITECTURE §8.
5. Runbook tách file riêng **`docs/runbooks/postgres-base-image.md`** (restore.md §1/§2/§3/§9/§10, deploy.md §1/§9.5, ARCHITECTURE §6.2/§6/§8 link tới) — restore.md đã dài; quy trình chuyển image là việc một lần theo môi trường.
6. amcheck trong runbook: `CREATE EXTENSION IF NOT EXISTS amcheck` → kiểm → `DROP EXTENSION amcheck` (không để lại extension lạ trong schema app; e2e thì tạo sẵn từ đầu để đo trước/sau).
7. **Không thêm case "restore pgBackRest từ bản backup glibc 2.31 vào image bookworm"**: cần pgbackrest trong image bullseye (image cũ `tami-postgres:17-3.5-pgbackrest2.59` không còn build được từ Dockerfile mới) → quá phức tạp so với giá trị; các kịch bản s3/sftp sẵn có đã restore (PITR + latest) bằng `$PG_IMAGE` bookworm. Hệ quả (restore bản cũ → phải REINDEX) ghi ở runbook §3.7/§5 + restore.md §3.1/§9.
8. Guard deploy đặt ở hàm riêng `guard_postgres_image` gọi ngay trước `compose up -d <base>` (sau cổng HIGH_RISK): so `docker inspect {{.Config.Image}}` với `compose config --images postgres` (đã kiểm `docker compose config --images postgres` in đúng 1 dòng với 3 compose). Dry-run chỉ in dòng `[dry-run]`.
9. Quy trình REINDEX trong e2e lặp qua **mọi DB `datcollversion is not null and datallowconn`** (tami, postgres, template1, template_postgis); collation `pg_collation` lệch version (gồm cả ICU `153.14 → 153.120` vì ICU lib đổi theo Debian) refresh trong từng DB.
10. Vùng ngoài scope giữ nguyên: `.github/workflows/ci.yml` service test `postgis/postgis:17-3.5` (DB CI dùng rồi bỏ, không phải image trong `docker/`; task chỉ yêu cầu `docker/`) — ghi residual risk.

### Decision log (builder, round 2 — sửa findings reviewer round 1)
11. **MAJOR-1 (tái hiện trước khi sửa):** `docker run` image `tami-postgis` cũ với volume mới → container thoát trong initdb (`10_postgis.sh` mode 755 → entrypoint exec thay vì source). Sửa `Dockerfile`: `COPY --chmod=0644` cho `10_postgis.sh`, `--chmod=0755` cho `update-postgis.sh` (BuildKit; Docker 29 + compose v2 mặc định) + `RUN test ! -x … && test -x …` để build fail nếu mode sai. e2e thêm `fresh_volume_init_test`: postgres chính của stack (volume mới, image bookworm, init.sql) phải có đúng danh sách DB (`template_postgis` datistemplate) + extension trong `tami` và `template_postgis` **bằng đúng danh sách do image gốc bullseye tạo** (bắt từ container gốc trong `image_switch_test` trước khi seed), `RestartCount = 0`, mode script đúng, `datcollversion = 2.36`.
12. **MAJOR-2:** runbook §2 viết lại: staging/prod dùng compose của release **mới** `R=/opt/tami/releases/$ENV/$SHA` (không qua `current` — `cleanup()` của deploy.sh đã trả `current` về release cũ khi guard die; thư mục release mới vẫn còn vì chỉ prune khi deploy thành công), `export TAMI_IMAGE="$(cat /opt/tami/state/$ENV.current)"` (compose bắt buộc `${TAMI_IMAGE:?}` — đã kiểm `compose config` lỗi interpolation khi thiếu), `U`/`DB` đọc từ env file, `OUT` thư mục dump, `$C config -q` kiểm trước. §3.1/3.7 `docker exec tami-backup` (không qua compose exec). §3.4/3.7 `up -d --no-deps`. §3.8: bật app bằng **chạy lại deploy.sh** (re-run job GitHub hoặc tay với digest build từ `$SHA` — không dùng `$TAMI_IMAGE` cũ vì production đối chiếu cặp digest+SHA trong `staging.history`). Cảnh báo không bao giờ `up` bằng compose release cũ sau §3.4. §5 rollback dùng `OLD_SHA` từ `readlink current`. Ghi chú: deploy.sh lần kế sẽ tạo lại postgres một lần nữa (bind mount `./postgres/init.sql` đổi từ `$R/` sang `current/`), cùng image, guard qua.
13. **MINOR-2:** `guard_postgres_image` — không có container → `guard_postgres_volume_without_container`: tên volume `<project>_postgres-data` với project đọc từ dòng `name:` của `compose config` (đã kiểm in `tami-staging` / `tami`; khoá volume `postgres-data` cố định ở cả 2 compose), `docker volume inspect` có → `die` trỏ runbook §6, trừ `PG_IMAGE_SWITCH_CONFIRMED=1` (chỉ chạy tay; ghi ở runbook §6 + deploy.md §1/§5). Không container, không volume → qua. Dry-run không gọi docker. 5 test mới trong `deploy.test.sh`.
14. **MINOR-3:** runbook §3.5 trích PG17 docs REINDEX ("except system catalogs"); lý do an toàn: **không index nào của `pg_catalog` có cột khoá collation khác C** (kiểm thật: query qua `pg_index`/`unnest(indkey)`/`pg_attribute.attcollation` = 0; lần đầu dùng câu đếm mọi cột catalog ra 112 vì view `pg_stat_*` có cột text collation default nhưng không có index → sửa câu). `reindex system` để dạng tuỳ chọn (comment) trong vòng lặp. amcheck §3.6 lặp **mọi DB `datallowconn`**, câu lọc `indisvalid and indisready and relpersistence <> 't'`, chỉ btree, tạo/drop amcheck tạm; e2e dùng cùng câu (`SW_AMCHECK_COUNT`) qua `switch_amcheck_all_databases` (postgres=0, tami=73, template1=0, template_postgis=69 → 142 index) + assert `SW_CATALOG_INDEX_NON_C = 0`.
15. **MINOR-4:** §3.1 thêm `pg_dumpall --globals-only` cho mọi môi trường; §5 ghi nạp globals trước `pg_restore`.
16. **MINOR-5:** `ca-certificates` (và `openssh-client`/`curl`) **không ghim có chủ đích**, lý do ghi trong Dockerfile: kho Debian stable/security chỉ giữ đúng bản hiện hành (`apt-cache policy` trong container: ca-certificates `20250419~deb12u1` ở bookworm-security, `20230311+deb12u1` ở bookworm; openssh-client 3 bản khác nhau theo kho) → ghim gãy build ở point release kế; gói bảo mật, không ảnh hưởng dữ liệu. Sửa typo "phiên sản".
17. MINOR-1 (spec/test-scope) và MINOR-6 (CI) không làm theo chỉ đạo (change-request xử lý). Không ghi `.context/runs/**` theo ràng buộc của lần giao.

## Verification summary
Máy dev Windows 11 + Git Bash + Docker Desktop, 2026-10-19. Log đầy đủ e2e: `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\8b5db524-c757-4ca6-8a44-834ad19190b9\scratchpad\e2e-bl002.log`.

| Lệnh | Kết quả |
|---|---|
| `docker build --target postgis -t tami-postgis:17-3.5-bookworm docker/backup` | PASS (attempt 1 fail: base không có ca-certificates → Decision 1; attempt 2 PASS) |
| `docker build --target postgres -t tami-postgres:17-3.5-bookworm-pgbackrest2.59 docker/backup` | PASS |
| `docker build --target backup -t tami-backup:bookworm-pgbackrest2.59-restic0.17.3 docker/backup` | PASS |
| Phiên bản trong image `backup` | `Debian GNU/Linux 12 (bookworm)`, `VERSION_CODENAME=bookworm`; `ldd (Debian GLIBC 2.36-9+deb12u14) 2.36`; `postgres/pg_dump/pg_restore (PostgreSQL) 17.11 (Debian 17.11-1.pgdg12+2)`; `pgBackRest 2.59.1` (`pgbackrest 2.59.1-1.pgdg12+1`); `restic 0.17.3`; `rclone v1.68.2`; `postgresql-17-postgis-3` + `-scripts` `3.5.2+dfsg-1.pgdg120+1`; `libssh2-1 1.10.0-3+deb12u1` (Depends `libssl3`); `openssh-client 1:9.2p1-2+deb12u10`; `curl 7.88.1-10+deb12u15`; ENV `POSTGIS_MAJOR=3 POSTGIS_VERSION=3.5.2+dfsg-1.pgdg120+1`; `/docker-entrypoint-initdb.d/10_postgis.sh` + `/usr/local/bin/update-postgis.sh` có; target `postgis` không có pgbackrest; `USER postgres` ở target backup |
| `docker compose --env-file <env giả> -f docker/docker-compose.{dev,staging,prod}.yml config -q` | PASS cả 3; `config --images postgres` → `tami-postgis:17-3.5-bookworm` (dev, staging), `tami-postgres:17-3.5-bookworm-pgbackrest2.59` + `tami-backup:bookworm-pgbackrest2.59-restic0.17.3` (prod) |
| `bash scripts/deploy/deploy.test.sh` | **Tất cả test PASS** (thêm 8 test guard: đúng image → qua; bullseye→bookworm → die; `postgis/postgis:17-3.5`→`tami-postgis` → die; chưa có container → qua + không hỏi compose; dry-run không gọi docker; guard chạy trước `compose up -d postgres…`) |
| Probe SFTP libssh2 1.10 (`pgbackrest repo-ls` tới `atmoz/sftp:alpine`, 5 cấu hình sshd) | sshd mặc định: FAIL (userauth); chỉ `PubkeyAcceptedAlgorithms +ssh-rsa`: OK; chỉ `HostKeyAlgorithms +ssh-rsa`: FAIL; cấu hình cũ đầy đủ: OK; sshd chỉ cho `curve25519` + `PubkeyAcceptedAlgorithms +ssh-rsa`: OK → e2e sftp giảm còn 1 dòng (Decision 4) |
| `bash docker/backup/test/e2e.sh` (mặc định: s3 + sftp, **chờ archive_timeout thật**) | **E2E PASS**, EXIT=0 (lần 3; lần 1 fail do test tự in command tag `SET` → thêm `-q`; lần 2 dừng tay vì refresh collation 1 `docker exec`/collation × 786 × 4 DB quá chậm → gom khối `DO`). Không có lỗi của code sản phẩm |
| `pnpm lint/typecheck/test/build` | skip, no app code changed (không đụng TS/JS) |
| `shellcheck` | skip, không cài trên máy (không có `shellcheck` trong PATH); `bash -n` e2e.sh OK; deploy.sh được `deploy.test.sh` source + chạy |
| Dọn dẹp | sau e2e: 0 container / 0 volume / 0 network `tami-bk-e2e*`; `docker/backup/test/.work` đã xoá (còn `.gitignore`); container dev `tami-postgres` (`postgis/postgis:17-3.5`, Up, healthy), `tami-redis`, `tami-seaweedfs` không bị đụng. Image: giữ 3 image `tami-*` bookworm vừa build (dùng cho dev khi chuyển); **giữ** `postgis/postgis:17-3.5` (dev đang dùng) và `postgres:17.11-bookworm`; image bullseye cũ `tami-postgres:17-3.5-pgbackrest2.59` + `tami-backup:pgbackrest2.59-restic0.17.3` có sẵn từ trước task, không xoá (dùng được để rollback thử nghiệm) |

Dòng RESULT của e2e (lần 3):
```
RESULT [switch] bullseye glibc 2.31 -> bookworm glibc 2.36 (PG 17.11 (Debian 17.11-1.pgdg12+2), PostGIS 3.5.2): 30000 bản ghi + checksum giữ nguyên; datcollversion trước: postgres=2.31 tami=2.31 template1=2.31 template_postgis=2.31; sau: postgres=2.36 tami=2.36 template1=2.36 template_postgis=2.36; cảnh báo mismatch trước/sau: 1/0; amcheck sw trước REINDEX 4/4, sau REINDEX 73 index btree sạch; thứ tự collation mẫu không đổi (index cũ khớp); REINDEX mọi DB 6s
RESULT [s3] full backup (1000 bản ghi): 3 giây
RESULT [s3] diff backup (1500 bản ghi): 2 giây
RESULT [s3] restore PITR: pgbackrest restore 6s + recovery/khởi động 2s
RESULT [s3] restore mới nhất: pgbackrest restore 6s + recovery/khởi động 2s
RESULT [s3] restic backup lần 1 (sync + snapshot + forget): 3 giây
RESULT [s3] restic backup lần 2 (tăng dần): 2 giây
RESULT [sftp] full backup (1000 bản ghi): 12 giây
RESULT [sftp] diff backup (1500 bản ghi): 8 giây
RESULT [sftp] restore PITR: pgbackrest restore 7s + recovery/khởi động 8s
RESULT [sftp] restore mới nhất: pgbackrest restore 7s + recovery/khởi động 10s
RESULT [sftp] restic backup lần 1 (sync + snapshot + forget): 4 giây
RESULT [sftp] restic backup lần 2 (tăng dần): 4 giây
RESULT archive_timeout: dòng ghi lúc T0 lên kho sau 298 giây không can thiệp (kỳ vọng <= 300)
RESULT [sftp] kho chết, ghi 14 segment (~224MB): chờ archive còn 3 (trần 48MiB = 3), segment cũ còn giữ 5 (đã sinh 14; pg_wal 113MB -> 257MB gồm segment tái chế), 11 lần bỏ WAL có cảnh báo, 5s tới khi hạ xuống trần
RESULT [sftp] kho hồi phục: full mới 21 giây thành công, check OK, WAL tiếp tục lên kho, last_run_ok{wal}=1
E2E PASS
```
Chi tiết case chuyển image (30.000 dòng text: 32 mẫu tiếng Việt có dấu/hoa thường/dấu câu/khoảng trắng/gạch nối/số × hậu tố; index btree `sw_txt`, unique `sw_txt_id_uq(txt,id)`, `sw_tag_txt(tag,txt)`, `sw_pkey`; gist `sw_geom`):
- Trước đổi image (bullseye): `datcollversion = 2.31`; checksum thứ tự theo index = theo sort = `a414ca80…`.
- Sau đổi image, trước REINDEX: count 30000 + checksum dữ liệu `b12bbab1…` giữ nguyên; `datcollversion` vẫn 2.31; kết nối mới in **1 dòng** `WARNING: database "tami" has a collation version mismatch … 2.31 … 2.36` (đúng kỳ vọng); amcheck `bt_index_check(…, true)` 4/4 index btree của `sw` **không báo lỗi** và thứ tự sort glibc 2.36 **không đổi** so với 2.31 trên mẫu này (index cũ vẫn khớp) — thông tin, không chứng minh an toàn cho dữ liệu thật; vẫn phải REINDEX.
- Quy trình runbook: 4 DB (`postgres`, `tami`, `template1`, `template_postgis`) `REINDEX DATABASE` + `ALTER DATABASE … REFRESH COLLATION VERSION`; mỗi DB refresh **786 collation** trong `pg_collation` lệch version (libc 2.31→2.36 và ICU 153.14→153.120); tổng 6 giây (DB ~37MB).
- Sau: `datcollversion = 2.36` cả 4 DB; 0 cảnh báo ở kết nối mới tới `tami`/`postgres`/`template_postgis`; 0 collation lệch; amcheck sạch trên **73 index btree** user (sw + PostGIS/topology/tiger); count + checksum dữ liệu không đổi; thứ tự theo index = sort; 6 extension đủ; `extversion postgis = 3.5.2`, `postgis_lib_version() = 3.5.2`, `postgis_full_version()` không có "need upgrade"; truy vấn gist = truy vấn tuần tự (1836).
- Kịch bản s3/sftp (PITR + restore mới nhất) và kho chết/hồi phục đều chạy trên image bookworm mới.

Trạng thái: **chưa chạy trên staging/prod** (không deploy/SSH theo phạm vi); dev DB (`tami-postgres`, volume `tami-postgres-data`) **chưa chuyển** — làm theo `docs/runbooks/postgres-base-image.md` khi user cho phép.

### Verification summary — round 2 (sau khi sửa findings reviewer round 1), 2026-10-19
Log e2e: `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\8b5db524-c757-4ca6-8a44-834ad19190b9\scratchpad\e2e-bl002-r2.log` (lần 1 của round 2: `…\e2e-bl002-r2-attempt1-failed-assert.log` — fail ở assert mới "cột collatable catalog" do câu đếm cả view `pg_stat_*`; sửa câu → lần 2 PASS; không phải lỗi sản phẩm).

| Lệnh | Kết quả |
|---|---|
| Tái hiện MAJOR-1 trước fix: `docker run` image `tami-postgis` cũ (build round 1), volume mới | container **thoát** trong initdb (`10_postgis.sh` mode 755 → exec thay vì source) — khớp report reviewer |
| `docker build --target postgis / postgres / backup` (Dockerfile đã sửa `COPY --chmod` + `RUN test ! -x … && test -x …`) | PASS cả 3; trong image: `10_postgis.sh -rw-r--r--`, `update-postgis.sh -rwxr-xr-x` |
| Volume mới bằng image mới + `init.sql` (`docker run`, volume `tami-bk-e2e-init`, đã dọn) | `running, restarts=0`; DB `postgres tami template0:t template1:t template_postgis:t`; extension tami `fuzzystrmatch 1.2, pg_trgm 1.6, plpgsql, postgis 3.5.2, postgis_tiger_geocoder 3.5.2, postgis_topology 3.5.2, unaccent 1.1`; template_postgis có `postgis, postgis_topology, fuzzystrmatch, postgis_tiger_geocoder` |
| Kiểm sự thật PG17 (docs `REINDEX` + truy vấn trong container) | docs: DATABASE "except system catalogs", SYSTEM "indexes on system catalogs"; số index `pg_catalog` có cột khoá collation ≠ C = **0** (câu đếm mọi cột catalog = 112 do view `pg_stat_*` → không dùng) |
| `apt-cache policy ca-certificates openssh-client curl` trong image | ca-certificates `20250419~deb12u1` (bookworm-security) / `20230311+deb12u1` (bookworm); openssh-client 3 bản theo kho → lý do không ghim ghi trong Dockerfile |
| `docker compose --env-file <env giả> -f docker/docker-compose.{dev,staging,prod}.yml config -q` | PASS cả 3; `compose config` in `name: tami-staging` / `name: tami` (guard dùng); thiếu `TAMI_IMAGE` → lỗi interpolation (xác nhận runbook phải export) |
| `bash scripts/deploy/deploy.test.sh` | **Tất cả test PASS** (nhóm guard postgres 10 test: thêm 5 test volume-không-container: không volume → qua; có volume → die; `PG_IMAGE_SWITCH_CONFIRMED=1` → qua; `=0` → die; kiểm đúng tên `tami-staging_postgres-data`) |
| `bash -n` `e2e.sh`, `deploy.sh` | OK; `shellcheck` skip (không cài) |
| `E2E_WAIT_ARCHIVE_TIMEOUT=0 bash docker/backup/test/e2e.sh` (s3 + sftp; **bỏ bước chờ archive_timeout thật** — đã PASS ở round 1, 298s) | **E2E PASS**, 51 `ok`, 0 `FAIL`. Mới: `[init]` 6 assert (restart=0, mode script, DB list = image gốc, extension tami/template_postgis = image gốc, datcollversion 2.36); `[switch]` amcheck mọi DB `postgres=0 tami=73 template1=0 template_postgis=69` = 142 index sạch (câu lọc indisvalid/indisready/relpersistence); assert index catalog collation ≠ C = 0. Ghi chú: tiến trình bash của e2e treo sau khi đã in `E2E PASS` + dọn xong (docker sạch) nên log không có dòng `EXIT=`; builder kill tiến trình |
| `pnpm lint/typecheck/test/build` | skip, no app code changed |
| Dọn dẹp | 0 container / 0 volume / 0 network `tami-bk*`; `docker/backup/test/.work` không còn; dev `tami-postgres` (`postgis/postgis:17-3.5`, Up, healthy), `tami-redis`, `tami-seaweedfs`, volume `tami-dev_*` không đụng |

RESULT e2e round 2:
```
RESULT [switch] bullseye glibc 2.31 -> bookworm glibc 2.36 (PG 17.11 (Debian 17.11-1.pgdg12+2), PostGIS 3.5.2): 30000 bản ghi + checksum giữ nguyên; datcollversion trước: postgres=2.31 tami=2.31 template1=2.31 template_postgis=2.31; sau: postgres=2.36 tami=2.36 template1=2.36 template_postgis=2.36; cảnh báo mismatch trước/sau: 1/0; amcheck sw trước REINDEX 4/4, sau REINDEX 142 index btree sạch; thứ tự collation mẫu không đổi (index cũ khớp); REINDEX mọi DB 6s
RESULT [init] volume mới (image bookworm + init.sql): DB [postgres:false tami:false template0:true template1:true template_postgis:true], extension tami [fuzzystrmatch 1.2, pg_trgm 1.6, plpgsql 1.0, postgis 3.5.2, postgis_tiger_geocoder 3.5.2, postgis_topology 3.5.2, unaccent 1.1] = image gốc; datcollversion 2.36
RESULT [s3] full backup (1000 bản ghi): 4 giây
RESULT [s3] diff backup (1500 bản ghi): 1 giây
RESULT [s3] restore PITR: pgbackrest restore 8s + recovery/khởi động 4s
RESULT [s3] restore mới nhất: pgbackrest restore 8s + recovery/khởi động 4s
RESULT [s3] restic backup lần 1 (sync + snapshot + forget): 3 giây
RESULT [s3] restic backup lần 2 (tăng dần): 2 giây
RESULT [sftp] full backup (1000 bản ghi): 14 giây
RESULT [sftp] diff backup (1500 bản ghi): 8 giây
RESULT [sftp] restore PITR: pgbackrest restore 10s + recovery/khởi động 8s
RESULT [sftp] restore mới nhất: pgbackrest restore 9s + recovery/khởi động 11s
RESULT [sftp] restic backup lần 1 (sync + snapshot + forget): 4 giây
RESULT [sftp] restic backup lần 2 (tăng dần): 4 giây
RESULT [sftp] kho chết, ghi 14 segment (~224MB): chờ archive còn 3 (trần 48MiB = 3), segment cũ còn giữ 5 (đã sinh 14; pg_wal 97MB -> 257MB gồm segment tái chế), 11 lần bỏ WAL có cảnh báo, 5s tới khi hạ xuống trần
RESULT [sftp] kho hồi phục: full mới 28 giây thành công, check OK, WAL tiếp tục lên kho, last_run_ok{wal}=1
E2E PASS
```

## Doc impact (reconcile, close-out)
- As-built: `docs/ARCHITECTURE.md` §6.2/§6/§8 (image bookworm, guard), `docs/runbooks/restore.md` (§1, §2.3, §3.1, §9, §10; khối quy ước export `TAMI_IMAGE`; `prod.env` ở bước BACKUP_ENV_DIR), `docs/runbooks/deploy.md` (§1 thứ tự + guard, §3.3, §5, §9.5), runbook mới `docs/runbooks/postgres-base-image.md`. Intent: `SPECIFICATIONS.md` §Hạ tầng qua change request (spec 1.10.0). API/ERD: no doc impact.

## Decision log (change-request, review round 2–3)
- Reviewer round 2 FAIL chỉ còn MAJOR-A (runbook production dùng `/opt/tami/$ENV.env`/`docker-compose.$ENV.yml` → sai tên `prod.env`/`docker-compose.prod.yml`). Vượt giới hạn 2 vòng có chủ đích: lỗi tài liệu 3 dòng, đang hội tụ (không phải loop/kiến trúc) → change-request sửa trực tiếp (`ENVF`/`CF`) + export `TAMI_IMAGE` ở restore.md + MINOR-B test-scope + MINOR-D `prod.env` (restore.md:48); reviewer round 3 hẹp STRICT PASS.
- MINOR-6 (CI dùng `postgis/postgis:17-3.5`) → BL-014 (`spec/changes/2026-10-19-ci-postgis-image-bookworm.md`). MINOR-C chấp nhận (lỗi docker khác ngoài "không có volume" thì `compose up` kế tiếp cũng fail).
