# Runbook: Chuyển image PostgreSQL sang base mới (Debian 11 bullseye → Debian 12 bookworm) trên volume đã có dữ liệu

Phạm vi: `docker/backup/Dockerfile` (3 target `postgis` / `postgres` / `backup`), `docker/docker-compose.{dev,staging,prod}.yml`, guard trong
`scripts/deploy/deploy.sh`, test `docker/backup/test/e2e.sh` (case "chuyển image"). Liên quan: `restore.md` (backup/khôi phục), `deploy.md` (deploy), `docs/ARCHITECTURE.md` §8.
Change: BL-002 (`spec/changes/archive/2026-10-19-backup-base-image-debian12.md`).

## 1. Vì sao đây là thao tác dữ liệu, không phải "đổi tag rồi `up`"

| | Cũ (volume hiện có ở dev/staging/prod) | Mới |
|---|---|---|
| Image dev/staging | `postgis/postgis:17-3.5` (Debian 11 bullseye, EOL) | `tami-postgis:17-3.5-bookworm` (Dockerfile target `postgis`) |
| Image prod | `tami-postgres:17-3.5-pgbackrest2.59` + `tami-backup:pgbackrest2.59-restic0.17.3` | `tami-postgres:17-3.5-bookworm-pgbackrest2.59` + `tami-backup:bookworm-pgbackrest2.59-restic0.17.3` |
| Base | postgis/postgis (bullseye) | `postgres:17.11-bookworm` ghim digest `sha256:3645570c…` + PostGIS từ `apt-archive.postgresql.org bookworm-pgdg-archive` |
| PostgreSQL | 17.5 | 17.11 (minor, cùng định dạng dữ liệu, không cần `pg_upgrade`) |
| PostGIS | 3.5.2 | **3.5.2** (giữ nguyên ⇒ không cần `ALTER EXTENSION … UPDATE`, không chạy `update-postgis.sh`) |
| glibc / `datcollversion` | **2.31** | **2.36** |
| pgBackRest | 2.59.1 | 2.59.1 (gói `pgdg12`) |

Collation mặc định của mọi DB là `en_US.utf8` do **glibc** cung cấp. glibc 2.31 → 2.36 đổi thứ tự so sánh chuỗi ⇒ mọi **index btree trên cột text** (khoá chính slug, email, tên,
index unique, index nhiều cột có text…) đã build theo thứ tự cũ: tra cứu/unique có thể **sai** cho tới khi `REINDEX`. Postgres biết điều này và cảnh báo ở mỗi kết nối mới:
`WARNING: database "tami" has a collation version mismatch … REINDEX … ALTER DATABASE tami REFRESH COLLATION VERSION`. Vì vậy:

- `deploy.sh` **từ chối deploy** khi container postgres đang chạy image khác image compose khai báo, hoặc khi không có container nhưng volume `postgres-data` đã có (xem §6) — không để `compose up -d postgres` tạo (lại) container trên volume cũ rồi app ghi dữ liệu với index sai.
- Thứ tự bắt buộc: **dev → staging (diễn tập backup/restore) → prod**. Mỗi môi trường làm trọn §3 trong một cửa sổ bảo trì (app dừng).
- Volume **mới** (máy dev mới, `down -v`, server mới) khởi tạo thẳng bằng image bookworm: không cần gì trong runbook này.
- Đã chứng minh bằng test tự động (`bash docker/backup/test/e2e.sh`, case "chuyển image": volume tạo bằng `postgis/postgis:17-3.5@sha256:01a6a70e…` với dữ liệu text tiếng Việt/hoa thường/dấu câu
  + index btree đơn/unique/nhiều cột + gist → bật bằng image bookworm → cảnh báo mismatch → quy trình §3.5–3.6 → `datcollversion` 2.36, hết cảnh báo, `amcheck` sạch, PostGIS 3.5.2, gist đúng).

## 2. Chuẩn bị (mọi môi trường)

Mọi lệnh bên dưới dùng biến `C` (compose), `PG` (container postgres), `U`/`DB` (user/DB), `OUT` (thư mục ngoài volume giữ bản dump). Đặt **một lần** trong shell làm việc
(mỗi khối chạy được nguyên văn sau khi đặt; dùng `tmux` để biến sống suốt cửa sổ bảo trì):

**Dev (máy dev, trong thư mục repo đã checkout commit BL-002):**
```bash
C="docker compose -f docker/docker-compose.dev.yml"; PG=tami-postgres; U=tami; DB=tami; OUT=~/tami-old-pg; mkdir -p "$OUT"
```

**Staging / production (server, user `deploy`):** compose phải là của release **MỚI** (commit có Dockerfile/compose bookworm), **KHÔNG** phải `releases/<env>/current`:
deploy của release mới bị guard chặn (§6) và `deploy.sh` khi thoát lỗi **trả `current` về release cũ** (`cleanup` → `restore_release_link`), nên `current` lúc này vẫn trỏ compose bullseye —
`build`/`up` qua `current` sẽ build tag cũ và không đổi gì. Thư mục release mới vẫn nằm trên đĩa (`deploy.sh` chỉ dọn release ở lần deploy **thành công**):
`/opt/tami/releases/<env>/<sha>` với `<sha>` = commit bị chặn (xem log job GitHub `Deploy <env>`, hoặc `ls -t /opt/tami/releases/<env>/ | head`).
Production: release do job production upload khi được duyệt; nếu chưa có thì copy từ staging (`deploy.md` §5): `cp -a /opt/tami/releases/staging/<sha> /opt/tami/releases/production/<sha>`.
Compose staging/prod bắt buộc `TAMI_IMAGE` (`${TAMI_IMAGE:?}` ở app/jobs/migrate) kể cả khi chỉ đụng `postgres` — lấy đúng image app đang chạy từ file trạng thái (một dòng `ghcr.io/…@sha256:…`).
```bash
ENV=staging                                   # hoặc: ENV=production
SHA=<sha 40 hex của release mới>
R=/opt/tami/releases/$ENV/$SHA; test -f "$R/docker/backup/Dockerfile" && grep -q 'postgres:17.11-bookworm' "$R/docker/backup/Dockerfile" || echo "SAI RELEASE: $R chưa phải bản bookworm"
export TAMI_IMAGE="$(cat /opt/tami/state/$ENV.current)"; echo "$TAMI_IMAGE"      # phải là ghcr.io/<owner>/<repo>@sha256:<64 hex> (image app đang chạy)
if [[ $ENV == staging ]]; then ENVF=/opt/tami/staging.env; CF=docker-compose.staging.yml; PG=tami-staging-postgres
else                           ENVF=/opt/tami/prod.env;    CF=docker-compose.prod.yml;    PG=tami-postgres; fi   # tên file thật: prod.env / docker-compose.prod.yml (KHÔNG phải production.*)
C="docker compose --env-file $ENVF -f $R/docker/$CF"
test -r "$ENVF" || echo "THIẾU env file $ENVF"; U="$(grep -E "^POSTGRES_USER=" "$ENVF" | cut -d= -f2-)"; U="${U:-tami}"; DB="$(grep -E "^POSTGRES_DB=" "$ENVF" | cut -d= -f2-)"; DB="${DB:-tami}"
OUT=/opt/tami/old-pg; sudo install -d -o deploy -g deploy -m 700 "$OUT"
$C config -q && echo "compose OK: $R"           # lỗi interpolation (thiếu TAMI_IMAGE/BACKUP_ENV_DIR) thì dừng ở đây, chưa đụng gì
```
Compose của release mới mount `./postgres/init.sql` theo đường dẫn `$R/docker/...` (khác `current/...`): §3.4 tạo lại container postgres là việc đang muốn làm; lần `deploy.sh` kế tiếp (§3.8)
đọc qua `current` (đã trỏ release mới) nên tạo lại postgres **một lần nữa** cùng image (vài giây, dữ liệu trong volume; guard qua vì image khớp). Chọn cửa sổ bảo trì bao cả hai.

> ⚠️ Sau §3.4, **không bao giờ** chạy `up` bằng compose của release cũ (`releases/<env>/current` khi còn trỏ release cũ, hay `releases/<env>/<sha-cũ>`): compose đó khai image bullseye
> ⇒ tạo lại postgres bằng glibc 2.31 trên dữ liệu vừa REINDEX theo 2.36 (lại mismatch ngược). Chỉ dùng compose cũ có chủ đích ở §5 (rollback) rồi REINDEX lại.

Kiểm hiện trạng + ước lượng downtime (REINDEX đọc lại toàn bộ bảng có index; thực tế ≈ vài phút/GB trên SSD; e2e: 4 DB ~37MB, 73 index btree + 786 collation/DB → 6 giây; DB TAMI nhỏ ⇒ vài phút;
downtime tổng ≈ build image (vài phút, có mạng) + REINDEX + kiểm tra):
```bash
docker exec $PG ldd --version | head -1                                                                  # "2.31" = bullseye (cần chuyển); "2.36" = đã bookworm
docker exec $PG psql -U $U -d postgres -Atc "select datname, datcollversion from pg_database where datallowconn order by 1"   # kỳ vọng mọi DB = 2.31
docker exec $PG psql -U $U -d $DB -Atc "select extname, extversion from pg_extension order by 1"        # postgis 3.5.2 (+ topology, tiger, fuzzystrmatch, pg_trgm, unaccent)
docker exec $PG psql -U $U -d $DB -Atc "select pg_size_pretty(pg_database_size('$DB')), pg_size_pretty(sum(pg_relation_size(indexrelid))) from pg_index"
```

## 3. Quy trình chuyển (làm từng môi trường, đúng thứ tự dev → staging → prod)

### 3.1 Backup TRƯỚC khi chuyển (điểm rollback)
- **Production** (có pgBackRest): kho phải OK và có full **mới** ngay trước khi chuyển (`backup` của release cũ đang chạy; `exec` vào container theo tên, không qua compose):
  ```bash
  docker exec tami-backup bash /opt/backup/pg-backup.sh check
  docker exec tami-backup bash /opt/backup/pg-backup.sh full
  docker exec tami-backup bash /opt/backup/pg-backup.sh info | head -20
  ```
- **Mọi môi trường**: một bản `pg_dump -Fc` (DB) **+ `pg_dumpall --globals-only`** (role/password hash/quyền — `pg_dump` không gồm, thiếu thì khôi phục vào volume mới không có role) **ra ngoài volume**:
  ```bash
  docker exec $PG pg_dump -U $U -Fc $DB > "$OUT/$DB-pre-bookworm-$(date +%F).dump"
  docker exec $PG pg_dumpall -U $U --globals-only > "$OUT/globals-pre-bookworm-$(date +%F).sql"
  ls -la "$OUT"/ && head -c 5 "$OUT/$DB-pre-bookworm-$(date +%F).dump" | grep -q PGDMP && echo "dump OK"
  ```
  Bản `pg_dump` khôi phục được vào **bất kỳ** image nào (`pg_restore` build lại index theo glibc của image đích) — là đường rollback đơn giản nhất.

### 3.2 Dừng mọi tiến trình ghi DB
Container app/jobs/backup là của release cũ nhưng **cùng tên** nên `$C stop` (compose mới) dừng đúng chúng:
```bash
$C stop app jobs            # prod thêm: backup   (dev: dừng `pnpm dev` / `pnpm jobs` / Payload CLI đang chạy)
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'tami.*(app|jobs|backup)' || echo "không còn tiến trình ghi DB"
```

### 3.3 Build image mới (trên chính máy/server đó; cần mạng tới Docker Hub, deb.debian.org, apt-archive.postgresql.org)
```bash
$C build postgres           # prod thêm: backup
NEW_IMG="$($C config --images postgres)"; echo "$NEW_IMG"       # tami-postgis:17-3.5-bookworm (dev/staging) | tami-postgres:17-3.5-bookworm-pgbackrest2.59 (prod)
docker run --rm --entrypoint sh "$NEW_IMG" -c 'grep CODENAME /etc/os-release; ldd --version | head -1; postgres --version; dpkg -l postgresql-17-postgis-3 | tail -1; ls -l /docker-entrypoint-initdb.d/10_postgis.sh'
# kỳ vọng: bookworm, glibc 2.36, PostgreSQL 17.11, postgis 3.5.2+dfsg-1.pgdg120+1, 10_postgis.sh mode -rw-r--r-- (prod: thêm `docker run --rm --entrypoint pgbackrest "$NEW_IMG" version` = 2.59.1)
```

### 3.4 Tạo lại container postgres bằng image mới trên volume cũ
```bash
$C up -d --no-deps postgres # compose thấy image đổi -> tạo lại container; volume postgres-data giữ nguyên; --no-deps: không kéo dịch vụ khác; prod: archive_mode=on vẫn như compose
$C ps postgres              # chờ healthy
docker inspect --format '{{.Config.Image}}' $PG                                # = $NEW_IMG
docker exec $PG ldd --version | head -1                                        # 2.36
docker exec $PG psql -U $U -d $DB -c 'select 1' 2>&1 | grep -i 'collation version'   # CÓ cảnh báo mismatch = đúng kỳ vọng ở bước này
```

### 3.5 REINDEX + REFRESH COLLATION VERSION trên MỌI database có `datcollversion`
Gồm `tami`, `postgres`, `template1`, `template_postgis` (template nhưng `datallowconn` nên kết nối + REINDEX được như DB thường); `template0` không có `datcollversion` và không cho kết nối ⇒ bỏ qua.
Collation trong `pg_collation` (ngoài `default`) ghi version riêng theo từng DB ⇒ refresh trong từng DB.
Phạm vi `REINDEX DATABASE` (PG 17, docs `REINDEX`): "Recreate all indexes within the current database, **except system catalogs**" — index của `pg_catalog` **không** được build lại. Điều đó an toàn vì
không index nào của system catalog có cột khoá collatable với collation khác `C` (cột `name` dùng `C`; cột text có collation default chỉ nằm ở view `pg_stat_*`, không có index) — kiểm được bằng câu (5) ở §3.6
(kỳ vọng 0; e2e cũng assert), tức index catalog không phụ thuộc glibc. Muốn chắc tuyệt đối thì chạy thêm `reindex system` trong từng DB (catalog nhỏ, vài giây) — có trong vòng lặp dưới dạng tuỳ chọn.
```bash
for db in $(docker exec $PG psql -U $U -d postgres -Atc "select datname from pg_database where datcollversion is not null and datallowconn order by 1"); do
  echo "== $db"
  docker exec $PG psql -U $U -d "$db" -v ON_ERROR_STOP=1 -c "reindex database \"$db\"" -c "alter database \"$db\" refresh collation version"
  # docker exec $PG psql -U $U -d "$db" -v ON_ERROR_STOP=1 -c "reindex system"   # tuỳ chọn: catalog (collation C, không cần) — bỏ comment nếu muốn chắc tuyệt đối
  # collation trong pg_collation (libc lẫn ICU — ICU lib cũng đổi theo Debian, 153.14 -> 153.120): hàng trăm cái nên refresh trong MỘT khối DO
  docker exec $PG psql -U $U -d "$db" -v ON_ERROR_STOP=1 -c "do \$\$ declare c record; begin
    for c in select oid::regcollation as name from pg_collation where collname <> 'default' and collversion is distinct from pg_collation_actual_version(oid) loop
      execute format('alter collation %s refresh version', c.name);
    end loop; end \$\$" 2>&1 | grep -vc 'changing version'   # in NOTICE từng collation; dòng cuối = số dòng khác (kỳ vọng 1: "DO")
  docker exec $PG psql -U $U -d "$db" -Atc "select count(*) from pg_collation where collname <> 'default' and collversion is distinct from pg_collation_actual_version(oid)"   # 0
done
docker exec $PG psql -U $U -d postgres -Atc "select datname, datcollversion from pg_database where datallowconn order by 1"   # mọi DB = 2.36
```
`REINDEX DATABASE` khoá bảng theo lượt (app đã dừng nên không sao). DB lớn: chạy trong `tmux`/`nohup` để SSH rớt không cắt ngang (REINDEX dở thì index cũ vẫn còn, chạy lại được).

### 3.6 Kiểm tra bắt buộc (ghi kết quả vào mục 7)
```bash
# 1) hết cảnh báo ở kết nối mới (tami, postgres, template_postgis): kỳ vọng 0
for db in $DB postgres template_postgis; do docker exec $PG psql -U $U -d $db -c 'select 1' 2>&1 | grep -c 'collation version mismatch'; done
# 2) amcheck trong MỌI DB cho phép kết nối (cùng danh sách §3.5: tami, postgres, template1, template_postgis — template cũng có index PostGIS và DB tạo sau copy index từ đó):
#    mọi index btree ngoài pg_catalog, chỉ index hợp lệ (indisvalid + indisready; index invalid/đang build thì bt_index_check lỗi oan), bỏ temp relation;
#    heapallindexed=true: từng hàng heap phải có trong index. Extension amcheck tạo tạm rồi DROP (không để lại trong schema app). (= câu SW_AMCHECK_COUNT trong e2e.sh)
AMCHECK_SQL="select count(bt_index_check(i.indexrelid, true)) as btree_index_ok from pg_index i join pg_class c on c.oid = i.indexrelid join pg_namespace n on n.oid = c.relnamespace join pg_am a on a.oid = c.relam where a.amname = 'btree' and i.indisvalid and i.indisready and c.relpersistence <> 't' and n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%'"
for db in $(docker exec $PG psql -U $U -d postgres -Atc "select datname from pg_database where datallowconn order by 1"); do
  echo "== amcheck $db"
  docker exec $PG psql -U $U -d "$db" -v ON_ERROR_STOP=1 -c "create extension if not exists amcheck" -c "$AMCHECK_SQL" -c "drop extension if exists amcheck" || { echo "amcheck LỖI ở $db — DỪNG"; break; }
done
# 3) PostGIS đúng bản, không báo cần upgrade
docker exec $PG psql -U $U -d $DB -Atc "select extversion from pg_extension where extname='postgis'" -c "select postgis_full_version()" | grep -v 'need upgrade'
# 4) truy vấn nhanh của app (slug/unique) trả đúng
docker exec $PG psql -U $U -d $DB -Atc "select count(*) from pg_stat_user_tables"
# 5) (thông tin) không index nào của pg_catalog có cột khoá collation khác C => REINDEX DATABASE bỏ qua catalog là an toàn; kỳ vọng 0 (= SW_CATALOG_INDEX_NON_C trong e2e.sh)
docker exec $PG psql -U $U -d $DB -Atc "select count(distinct i.indexrelid) from pg_index i join pg_class c on c.oid = i.indrelid join pg_namespace n on n.oid = c.relnamespace cross join lateral unnest(i.indkey) k(attnum) join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum join pg_collation co on co.oid = a.attcollation where n.nspname = 'pg_catalog' and co.collname <> 'C'"
```
Lỗi ở (2) sau REINDEX ⇒ **DỪNG**, không bật app: rollback (§5) và báo (không có fix "mò").

### 3.7 Production: backup trên glibc mới + bật sidecar
Bản backup pgBackRest cũ (tạo bởi glibc 2.31) **vẫn khôi phục được** vào image bookworm, nhưng sau restore phải lặp lại §3.5 (index trong bản backup theo collation cũ). Để lần khôi phục kế tiếp không cần bước đó:
```bash
$C up -d --no-deps backup                               # image backup mới (cùng glibc/pgbackrest với postgres)
docker exec tami-backup bash /opt/backup/pg-backup.sh check
docker exec tami-backup bash /opt/backup/pg-backup.sh full       # full MỚI trên glibc mới (diff kế tiếp dựa trên bản này)
docker exec tami-backup bash /opt/backup/pg-backup.sh info | head -20
```
Ghi vào `restore.md` mục 8 (lịch sử diễn tập): "backup trước `<ngày>` là glibc 2.31 — restore về image bookworm thì REINDEX theo postgres-base-image.md §3.5".

### 3.8 Bật lại app
**Staging / production: chạy lại `deploy.sh` cho release mới** (không `$C up -d app jobs` bằng tay: `deploy.sh` mới đổi symlink `current` sang release mới, chạy migrate, ghi state,
và app đúng digest; guard §6 giờ qua vì container postgres đã chạy đúng image compose). Hai cách:
- **Ưu tiên:** chạy lại (re-run) job GitHub `Deploy <env>` của commit `$SHA` — workflow gọi `deploy.sh` với đúng `--image` (digest build từ chính `$SHA`). **Hoặc**
- Tay trên server (`deploy.md` §5). `--image` phải là digest **build từ `$SHA`** (KHÔNG phải `$TAMI_IMAGE` đang chạy: production đối chiếu cặp digest + SHA trong `staging.history`,
  cặp image cũ + SHA mới bị từ chối). Lấy digest: production → dòng của `$SHA` trong `staging.history` (staging của commit này đã deploy thành công — đúng thứ tự dev → staging → prod);
  staging → tham số `--image` in trong log job GitHub của lần deploy bị chặn (image đã được pull về server trước guard nên không cần token):
  ```bash
  DIGEST="$(grep " $SHA$" /opt/tami/state/staging.history | tail -1 | cut -d' ' -f1)"   # production; staging: DIGEST=sha256:<64 hex> từ log job
  bash $R/scripts/deploy/deploy.sh $ENV --release-sha $SHA --image "${TAMI_IMAGE%@*}@$DIGEST"
  curl -fsS http://127.0.0.1:$([[ $ENV == staging ]] && echo 3011 || echo 3010)/api/health
  ```
`deploy.sh` tạo lại postgres **một lần nữa** (đường dẫn bind mount đổi sang `current/`, cùng image — vài giây, xem §2) rồi `up` app/jobs; health 200 là xong.
**Dev:** `pnpm dev`, vào `/admin`, mở một collection có slug/tìm kiếm.

## 4. Staging TRƯỚC prod: diễn tập backup/restore (bắt buộc)

Trên **máy dev** (không phải server; `restore.md` §10: e2e chỉ chạy ở dev):
```bash
bash docker/backup/test/e2e.sh                 # ~10 phút: case "chuyển image" (bullseye -> bookworm + REINDEX + amcheck) + PITR/restore pgBackRest trên image bookworm (s3 + sftp) + restic
```
Trên **staging** (sau khi làm §3 cho staging): round-trip `pg_dump`/`pg_restore` vào DB tạm trong chính container (staging không có kho pgBackRest):
```bash
docker exec $PG pg_dump -U $U -Fc $DB > "$OUT/$DB-post-bookworm-$(date +%F).dump"
docker exec $PG createdb -U $U -T template0 tami_drill
docker exec -i $PG pg_restore -U $U -d tami_drill --no-owner < "$OUT/$DB-post-bookworm-$(date +%F).dump"
docker exec $PG psql -U $U -d tami_drill -Atc "select count(*) from pg_stat_user_tables" -c "select extversion from pg_extension where extname='postgis'"
docker exec $PG psql -U $U -d tami_drill -v ON_ERROR_STOP=1 -c "create extension if not exists amcheck" -c "$AMCHECK_SQL" -c "drop extension amcheck"   # AMCHECK_SQL đặt ở §3.6
docker exec $PG dropdb -U $U tami_drill
```
So số bảng/bản ghi vài collection chính giữa `tami` và `tami_drill`. Chạy smoke test staging như `deploy.md` §9.2 mục 13. **Chỉ khi staging PASS** mới làm prod.

**Trạng thái 2026-10-19: chưa chạy trên staging/prod** (phạm vi task không deploy/SSH). Đã chạy: build 3 target + `e2e.sh` đầy đủ trên máy dev (kết quả trong task `tasks/feature-backup-base-image-debian12/phase-1-task-01.md`).

## 5. Rollback

- **Trước khi app ghi gì** (phát hiện lỗi ở §3.6): quay image cũ trên volume cũ. Index vừa REINDEX theo glibc 2.36 ⇒ sau khi về glibc 2.31 phải **REINDEX lại** (chạy §3.5 với image cũ; `datcollversion` sẽ về 2.31).
  Image cũ còn trên server (`deploy.sh` không xoá image `tami-postgres:*`/`postgis/postgis:*`); compose của release trước còn ở `/opt/tami/releases/<env>/<sha-cũ>/` (= đích hiện tại của
  `releases/<env>/current` nếu chưa chạy §3.8). Đây là chỗ **duy nhất** dùng compose cũ có chủ đích (`TAMI_IMAGE` vẫn đang export từ §2):
  ```bash
  OLD_SHA=$(basename "$(readlink /opt/tami/releases/$ENV/current)"); echo "$OLD_SHA"      # release cũ; dev: bỏ qua, checkout commit cũ rồi dùng $C
  $C stop postgres
  docker compose --env-file "$ENVF" -f /opt/tami/releases/$ENV/$OLD_SHA/docker/$CF up -d --no-deps postgres    # image cũ, cùng volume
  docker exec $PG ldd --version | head -1                                                   # 2.31
  # rồi §3.5 (REINDEX + REFRESH về 2.31) và §3.6 (dùng cùng $PG/$U/$DB/$AMCHECK_SQL)
  ```
- **Đã có ghi mới / nghi dữ liệu hỏng**: khôi phục từ bản `pg_dump` + `globals` ở §3.1 (vào volume mới + image cũ, hoặc vào image bookworm — `pg_restore` build index theo glibc đích nên không cần REINDEX;
  nạp `globals-pre-bookworm-*.sql` bằng `psql -d postgres -f` TRƯỚC `pg_restore` để có đủ role) hoặc pgBackRest (prod, `restore.md` §3; restore bản glibc 2.31 vào image bookworm ⇒ chạy §3.5).
- Sau rollback phải sửa compose/Dockerfile (commit mới) trước khi deploy lại, nếu không guard §6 lại chặn vì compose vẫn khai image bookworm.

## 6. Guard trong `deploy.sh`

Trước `compose up -d postgres redis seaweedfs [backup]`, `deploy.sh` so `docker inspect --format '{{.Config.Image}}' <container postgres>` với `compose config --images postgres`. Khác ⇒
```
ERROR: container tami-staging-postgres đang chạy image 'postgis/postgis:17-3.5' nhưng compose khai 'tami-postgis:17-3.5-bookworm': KHÔNG tự đổi image postgres trên volume cũ. Chuyển image theo docs/runbooks/postgres-base-image.md rồi deploy lại
```
và dừng **trước** mọi `compose up` (chưa đổi gì; `current` trả về release trước — vì vậy §2 dùng compose của release mới theo `$R`, không qua `current`). Cách đi qua: làm §3 (container chạy đúng image compose) rồi chạy lại deploy (§3.8).

**Không có container postgres nhưng volume `postgres-data` đã có** (`<project>_postgres-data`: `tami-staging_postgres-data` / `tami_postgres-data`; project = `name:` của compose, đọc bằng `compose config`) ⇒ cũng dừng:
không biết image nào đã tạo dữ liệu trong volume (container bị `compose down`/`docker rm` do sự cố hay thao tác tay), tạo postgres bằng image compose khai sẽ chính là lỗi guard định chặn.
Operator kiểm (`docker run --rm -v <volume>:/v tami-postgis:17-3.5-bookworm cat /v/PG_VERSION`; hoặc bật tạm bằng image **cũ** `--no-deps` rồi đọc `datcollversion` như §2) và chỉ khi chắc dữ liệu đã REINDEX theo glibc của image compose
(hoặc volume do chính image đó tạo) mới chạy lại deploy tay với biến **`PG_IMAGE_SWITCH_CONFIRMED=1`** (xem `deploy.md` §5; workflow GitHub không bao giờ đặt biến này):
```bash
PG_IMAGE_SWITCH_CONFIRMED=1 bash $R/scripts/deploy/deploy.sh $ENV --release-sha $SHA --image "${TAMI_IMAGE%@*}@$DIGEST"   # $DIGEST của release $SHA, xem §3.8
```
Chưa có container lẫn volume (server mới) ⇒ cho qua; `--dry-run` không gọi docker. Test: `bash scripts/deploy/deploy.test.sh` (nhóm "guard postgres").

## 7. Nhật ký chuyển image

| Ngày | Môi trường | glibc trước → sau | DB (kích thước) | REINDEX | amcheck | Ghi chú |
|---|---|---|---|---|---|---|
| 2026-10-19 | dev (máy local) | 2.31 → 2.36 | tami 186 MB (+ 36 DB tạm của integration test) | 37 DB, PASS | 2797 index btree sạch, 0 lỗi | dump + globals ở `~/tami-old-pg`; mismatch 0; PostGIS 3.5.2; integration 704/704 PASS |
| 2026-10-19 | staging | 2.31 → 2.36 | tami 32 MB (121 bảng) | 4 DB (postgres, tami, template1, template_postgis), PASS | tami 576 + template_postgis 69 index btree sạch, 0 lỗi | release `9cafe88`; dump + globals ở `/opt/tami/old-pg`; mismatch 0; PostGIS 3.5.2; catalog non-C 0; diễn tập `tami_drill` khớp 121 bảng, amcheck 576 sạch. Build image trước khi dừng app ⇒ downtime ~2 phút (02:53–02:55Z). §3.8 `deploy.sh` tay lỗi pull ghcr (server không có token) ⇒ bật tạm app/jobs release cũ `b936204` (`--no-deps --pull never`, postgres giữ bookworm); re-run job GitHub `Deploy staging` 02:56Z PASS: app/jobs `9cafe88` (digest `bb96e8eb…`), migration `rentals_reindex_job` + `leads_remind_scan_index` đã apply, health ok |
| _chưa thực hiện_ | production | | | | | |
