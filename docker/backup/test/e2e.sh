#!/usr/bin/env bash
# Test thật backup/restore (NFR-05) trên Docker local, KHÔNG đụng container/volume dev (tami-postgres, tami-redis, tami-seaweedfs).
# Dựng project compose tạm `tami-bk-e2e` từ CHÍNH docker/docker-compose.staging.yml (postgres tuỳ biến + sidecar backup + seaweedfs nguồn)
# cộng đích backup tạm (docker-compose.e2e.yml): SeaweedFS S3 qua HTTPS và SFTP. Với từng đích (s3, sftp):
#   pgBackRest : stanza-create -> full -> thêm dữ liệu -> diff -> thêm dữ liệu (mốc T) -> thêm dữ liệu -> check (ép + chờ archive WAL)
#                -> restore PITR tới T (kỳ vọng số bản ghi tại T) -> restore mới nhất (kỳ vọng đủ) -> so số bản ghi, đo thời gian
#   restic     : upload object vào SeaweedFS nguồn -> backup -> xoá bucket + bản sao -> restore -> so sha256 -> đưa lại lên bucket
#   heartbeat  : success/failure/textfile metric/URL heartbeat, scheduler chạy 1 vòng
#   chuyển image: volume khởi tạo bằng postgis/postgis:17-3.5 gốc -> bật bằng image tuỳ biến -> dữ liệu, extension, collation, amcheck/REINDEX
#   kho không với tới (đích cuối): trần archive-push-queue-max giữ pg_wal không phình, DB vẫn ghi được, kho hồi phục -> full mới thành công
# Chạy: bash docker/backup/test/e2e.sh [s3] [sftp]   (mặc định cả hai). KEEP=1: không dọn khi kết thúc. E2E_WAIT_ARCHIVE_TIMEOUT=0: bỏ bước chờ archive_timeout thật.
# Dọn tay nếu script bị ngắt (CHỈ trên máy dev; lọc theo label/tên project tami-bk-e2e, không đụng stack staging thật):
#   docker compose -p tami-bk-e2e down -v --remove-orphans; docker ps -aq --filter name=tami-bk-e2e- | xargs -r docker rm -f
#   docker volume ls -q --filter name=tami-bk-e2e | xargs -r docker volume rm
set -euo pipefail
export MSYS_NO_PATHCONV=1

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
hostpath() { if command -v cygpath > /dev/null; then cygpath -m "$1"; else printf "%s" "$1"; fi; }
HERE="$(hostpath "$HERE")" REPO_ROOT="$(hostpath "$REPO_ROOT")"
PROJECT=tami-bk-e2e
WORK="$HERE/.work"
PG_IMAGE=tami-postgres:17-3.5-pgbackrest2.59
SCENARIOS=("$@")
(( ${#SCENARIOS[@]} )) || SCENARIOS=(s3 sftp)

now() { date +%s; }
step() { printf '\n=== %s\n' "$*"; }
result() { printf 'RESULT %s\n' "$*" | tee -a "$WORK/results.txt"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
expect_eq() { [[ "$1" == "$2" ]] || fail "$3: thực tế '$1', kỳ vọng '$2'"; printf 'ok  %s = %s\n' "$3" "$1"; }

dc() {
  docker compose -p "$PROJECT" --env-file "$(hostpath "$WORK/compose.env")" \
    -f "$(hostpath "$REPO_ROOT/docker/docker-compose.staging.yml")" -f "$(hostpath "$HERE/docker-compose.e2e.yml")" "$@"
}
psql_main() { dc exec -T postgres psql -U tami -d tami -At -c "$1"; }
bk() { dc exec -T backup "$@"; }
# $1 byte ngẫu nhiên -> 2*$1 ký tự hex (không dùng `head` cuối pipe: SIGPIPE + pipefail làm script thoát)
rand() { head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

cleanup() {
  local rc=$?
  if [[ ${KEEP:-0} == 1 ]]; then echo "KEEP=1: giữ nguyên môi trường test ($PROJECT)"; return "$rc"; fi
  echo "--- dọn môi trường test"
  dc down -v --remove-orphans > /dev/null 2>&1 || true
  docker ps -aq --filter "name=${PROJECT}-" | xargs -r docker rm -f > /dev/null 2>&1 || true
  docker volume ls -q --filter "name=${PROJECT}" | xargs -r docker volume rm > /dev/null 2>&1 || true
  rm -rf "$WORK"
  return "$rc"
}
trap cleanup EXIT

# ---------- chuẩn bị ----------
[[ -z "$(docker ps -aq --filter name='^tami-staging-')" ]] || fail "đã có container tami-staging-*: dừng test để không đụng môi trường thật"
rm -rf "$WORK"
mkdir -p "$WORK/certs" "$WORK/ssh"
chmod 777 "$WORK/certs" "$WORK/ssh"
: > "$WORK/results.txt"

step "chuẩn bị image, chứng chỉ TLS cho đích S3, khoá SSH cho đích SFTP"
docker build -q --target postgres -t "$PG_IMAGE" "$REPO_ROOT/docker/backup" > /dev/null
docker build -q --target backup -t tami-backup:pgbackrest2.59-restic0.17.3 "$REPO_ROOT/docker/backup" > /dev/null
docker run --rm -u 0 --entrypoint sh -v "$(hostpath "$WORK"):/w" "$PG_IMAGE" -c '
  openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj "/CN=target-s3" -addext "subjectAltName=DNS:target-s3" \
    -keyout /w/certs/key.pem -out /w/certs/cert.pem 2> /dev/null
  cp /w/certs/cert.pem /w/ssh/ca.pem
  chmod 644 /w/certs/* /w/ssh/ca.pem' > /dev/null
docker run --rm -u 0 --entrypoint sh -v "$(hostpath "$WORK"):/w" tami-backup:pgbackrest2.59-restic0.17.3 -c '
  ssh-keygen -q -m PEM -t rsa -b 3072 -N "" -f /w/ssh/id_rsa && chmod 644 /w/ssh/id_rsa /w/ssh/id_rsa.pub' > /dev/null

S3_KEY="$(rand 10)" S3_SECRET="$(rand 20)"
TARGET_KEY="$(rand 10)" TARGET_SECRET="$(rand 20)"
cat > "$WORK/compose.env" << EOF
TAMI_IMAGE=tami-web:e2e-not-started
POSTGRES_PASSWORD=$(rand 12)
DATABASE_URL_STAGING=postgres://tami:x@postgres:5432/tami
PAYLOAD_SECRET=$(rand 16)
REDIS_PASSWORD=$(rand 12)
S3_ACCESS_KEY_ID=$S3_KEY
S3_SECRET_ACCESS_KEY=$S3_SECRET
S3_BUCKET_PUBLIC=e2e-public
S3_BUCKET_PRIVATE=e2e-private
TURNSTILE_SITE_KEY=x
TURNSTILE_SECRET_KEY=x
SMTP_HOST=x
SMTP_USER=x
SMTP_PASS=x
EMAIL_ALLOWLIST=a@example.com
ANTHROPIC_API_KEY=x
TRANSLATION_MODEL=x
TRANSLATION_MONTHLY_BUDGET_USD=1
NEXT_PUBLIC_SITE_URL=https://staging.example.com
BACKUP_ENV_DIR=$(hostpath "$WORK")
E2E_DIR=$(hostpath "$WORK")
E2E_TARGET_KEY=$TARGET_KEY
E2E_TARGET_SECRET=$TARGET_SECRET
EOF

write_env() { # s3|sftp
  local PG_PASS RESTIC_PASS
  # mật khẩu kho cố định theo đích trong suốt lần chạy (ghi file tạm, không in ra log)
  [[ -s $WORK/pass-$1.pg ]] || rand 24 > "$WORK/pass-$1.pg"
  [[ -s $WORK/pass-$1.restic ]] || rand 24 > "$WORK/pass-$1.restic"
  PG_PASS="$(< "$WORK/pass-$1.pg")" RESTIC_PASS="$(< "$WORK/pass-$1.restic")"
  if [[ $1 == s3 ]]; then
    cat > "$WORK/pgbackrest.env" << EOF
PGBACKREST_REPO1_TYPE=s3
PGBACKREST_REPO1_PATH=/pg
PGBACKREST_REPO1_S3_BUCKET=pgbr
PGBACKREST_REPO1_S3_ENDPOINT=target-s3:8334
PGBACKREST_REPO1_S3_REGION=us-east-1
PGBACKREST_REPO1_S3_KEY=$TARGET_KEY
PGBACKREST_REPO1_S3_KEY_SECRET=$TARGET_SECRET
PGBACKREST_REPO1_S3_URI_STYLE=path
PGBACKREST_REPO1_STORAGE_CA_FILE=/etc/backup/ssh/ca.pem
PGBACKREST_REPO1_CIPHER_TYPE=aes-256-cbc
PGBACKREST_REPO1_CIPHER_PASS=$PG_PASS
EOF
    cat > "$WORK/restic.env" << EOF
RESTIC_REPOSITORY=s3:https://target-s3:8334/resticbr/files
RESTIC_PASSWORD=$RESTIC_PASS
AWS_ACCESS_KEY_ID=$TARGET_KEY
AWS_SECRET_ACCESS_KEY=$TARGET_SECRET
RESTIC_CACERT=/etc/backup/ssh/ca.pem
EOF
  else
    cat > "$WORK/pgbackrest.env" << EOF
PGBACKREST_REPO1_TYPE=sftp
PGBACKREST_REPO1_PATH=/upload/pg
PGBACKREST_REPO1_SFTP_HOST=target-sftp
PGBACKREST_REPO1_SFTP_HOST_USER=tami
PGBACKREST_REPO1_SFTP_PRIVATE_KEY_FILE=/etc/backup/ssh/id_rsa
PGBACKREST_REPO1_SFTP_PUBLIC_KEY_FILE=/etc/backup/ssh/id_rsa.pub
PGBACKREST_REPO1_SFTP_KNOWN_HOST=/etc/backup/ssh/known_hosts
PGBACKREST_REPO1_SFTP_HOST_KEY_CHECK_TYPE=strict
PGBACKREST_REPO1_SFTP_HOST_KEY_HASH_TYPE=sha256
PGBACKREST_REPO1_CIPHER_TYPE=aes-256-cbc
PGBACKREST_REPO1_CIPHER_PASS=$PG_PASS
EOF
    cat > "$WORK/restic.env" << EOF
RESTIC_REPOSITORY=sftp:tami@target-sftp:/upload/restic
RESTIC_PASSWORD=$RESTIC_PASS
RESTIC_SFTP_ARGS=-i /etc/backup/ssh/id_rsa -o UserKnownHostsFile=/etc/backup/ssh/known_hosts -o StrictHostKeyChecking=yes -o CheckHostIP=no -o BatchMode=yes
EOF
  fi
}

# ---------- hạ tầng ----------
step "dựng project tạm: postgres (image tuỳ biến), seaweedfs nguồn, đích S3 TLS, đích SFTP"
write_env s3
dc config -q || fail "compose config lỗi"
dc up -d --build --wait postgres seaweedfs target-s3 target-sftp > /dev/null
dc up seaweedfs-init 2>&1 | tail -2
for b in pgbr resticbr; do
  echo "s3.bucket.create -name $b" | dc exec -T target-s3 weed shell -master=localhost:9333 > /dev/null 2>&1 || fail "không tạo được bucket $b"
done

step "known_hosts cho SFTP (ssh-keyscan trong network compose)"
dc run --rm --no-deps -T --entrypoint ssh-keyscan backup target-sftp > "$WORK/ssh/known_hosts" 2> /dev/null || true
[[ -s $WORK/ssh/known_hosts ]] || fail "không lấy được host key của target-sftp"

wait_ready() { # <container> ; chờ postgres sẵn sàng + hết recovery
  local c="$1"
  for _ in $(seq 1 120); do
    if docker exec "$c" psql -U tami -d tami -At -c "select not pg_is_in_recovery()" 2> /dev/null | grep -qx t; then return 0; fi
    sleep 1
  done
  docker logs --tail 40 "$c" >&2 || true
  fail "$c không sẵn sàng sau 120 giây"
}

restore_and_count() { # <tên> <bảng> <target-time|""> -> in số bản ghi; ghi thời gian vào RESTORE_SECONDS/RECOVERY_SECONDS
  local name="$1" table="$2" target="$3" vol="${PROJECT}_restore_$1" cont="${PROJECT}-restore-$1" t0 t1 t2 args=()
  [[ -n $target ]] && args=(--target-time "$target")
  docker volume rm -f "$vol" > /dev/null 2>&1 || true
  docker volume create "$vol" > /dev/null
  t0=$(now)
  bash "$REPO_ROOT/docker/backup/pg-restore.sh" --volume "$vol" --image "$PG_IMAGE" --env-file "$WORK/pgbackrest.env" \
    --conf "$(hostpath "$REPO_ROOT/docker/backup/pgbackrest.conf")" --network tami-staging-net --ssh-dir "$WORK/ssh" "${args[@]}" > "$WORK/restore-$name.log" 2>&1 \
    || { cat "$WORK/restore-$name.log" >&2; fail "pg-restore.sh $name lỗi"; }
  t1=$(now)
  # archive_mode=off: bản khôi phục KHÔNG được đẩy WAL vào kho đang dùng (xem runbook §3.3).
  docker run -d --name "$cont" --network tami-staging-net --env-file "$WORK/pgbackrest.env" \
    -v "$vol:/var/lib/postgresql/data" -v "$(hostpath "$REPO_ROOT/docker/backup/pgbackrest.conf"):/etc/pgbackrest/pgbackrest.conf:ro" \
    -v "$(hostpath "$WORK/ssh"):/etc/backup/ssh:ro" -e POSTGRES_PASSWORD=unused \
    "$PG_IMAGE" postgres -c archive_mode=off > /dev/null
  wait_ready "$cont"
  t2=$(now)
  echo "$((t1 - t0)) $((t2 - t1))" > "$WORK/time-$name" # chạy trong $(...) nên truyền thời gian qua file
  docker exec "$cont" psql -U tami -d tami -At -c "select count(*) from $table"
}

wait_archived() { # chờ pg_stat_archiver không còn failing và last_archived_time mới hơn $1 (epoch)
  local since="$1" last
  for _ in $(seq 1 60); do
    last="$(psql_main "select coalesce(extract(epoch from last_archived_time)::bigint,0) from pg_stat_archiver")"
    (( last >= since )) && return 0
    sleep 2
  done
  fail "WAL không được archive sau 120 giây"
}

# ---------- kịch bản ----------
run_scenario() {
  local scn="$1" table="e2e_$1" rs rv t0 n_full n_diff n_t n_final target_ts got
  step "[$scn] áp env kho đích, tạo lại postgres + backup (archive_mode=on, archive_command pgbackrest)"
  write_env "$scn"
  dc up -d --force-recreate --wait postgres > /dev/null
  dc up -d --force-recreate backup > /dev/null
  sleep 2
  expect_eq "$(psql_main 'show archive_mode')" on "[$scn] archive_mode"
  expect_eq "$(psql_main 'show archive_timeout')" 5min "[$scn] archive_timeout"
  expect_eq "$(psql_main 'show wal_level')" replica "[$scn] wal_level"
  expect_eq "$(psql_main "select count(*) from pg_extension where extname in ('postgis','pg_trgm','unaccent')")" 3 "[$scn] extension giữ nguyên"

  bk bash /opt/backup/pg-backup.sh stanza-create > "$WORK/stanza-$scn.log" 2>&1 || { cat "$WORK/stanza-$scn.log" >&2; fail "[$scn] stanza-create lỗi"; }
  bk bash /opt/backup/pg-backup.sh check > "$WORK/check0-$scn.log" 2>&1 || { cat "$WORK/check0-$scn.log" >&2; fail "[$scn] check lỗi"; }

  step "[$scn] pgBackRest: dữ liệu mẫu -> full -> +dữ liệu -> diff -> +dữ liệu (mốc T) -> +dữ liệu"
  psql_main "create table $table(id serial primary key, payload text, geom geometry(Point,4326))" > /dev/null
  psql_main "insert into $table(payload, geom) select md5(g::text), st_setsrid(st_makepoint(g%180, g%90),4326) from generate_series(1,1000) g" > /dev/null
  n_full=$(psql_main "select count(*) from $table")
  t0=$(now)
  bk bash /opt/backup/pg-backup.sh full > "$WORK/full-$scn.log" 2>&1 || { cat "$WORK/full-$scn.log" >&2; fail "[$scn] full backup lỗi"; }
  result "[$scn] full backup ($n_full bản ghi): $(($(now) - t0)) giây"
  psql_main "insert into $table(payload) select md5(g::text) from generate_series(1,500) g" > /dev/null
  n_diff=$(psql_main "select count(*) from $table")
  t0=$(now)
  bk bash /opt/backup/pg-backup.sh diff > "$WORK/diff-$scn.log" 2>&1 || { cat "$WORK/diff-$scn.log" >&2; fail "[$scn] diff backup lỗi"; }
  result "[$scn] diff backup ($n_diff bản ghi): $(($(now) - t0)) giây"
  psql_main "insert into $table(payload) select md5(g::text) from generate_series(1,300) g" > /dev/null
  sleep 2
  target_ts="$(psql_main "select to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD HH24:MI:SS')||'+00'")"
  n_t=$(psql_main "select count(*) from $table")
  sleep 2
  psql_main "insert into $table(payload) select md5(g::text) from generate_series(1,700) g" > /dev/null
  n_final=$(psql_main "select count(*) from $table")
  bk bash /opt/backup/pg-backup.sh check > "$WORK/check1-$scn.log" 2>&1 || { cat "$WORK/check1-$scn.log" >&2; fail "[$scn] check (archive WAL) lỗi"; }
  expect_eq "$n_t" 1800 "[$scn] số bản ghi tại mốc T ($target_ts)"
  expect_eq "$n_final" 2500 "[$scn] số bản ghi hiện tại"
  bk bash /opt/backup/pg-backup.sh info | sed -n 1,25p

  step "[$scn] khôi phục PITR tới T vào volume mới"
  got="$(restore_and_count "pitr-$scn" "$table" "$target_ts")"
  expect_eq "$got" "$n_t" "[$scn] bản ghi sau PITR về T"
  expect_eq "$(docker exec "${PROJECT}-restore-pitr-$scn" psql -U tami -d tami -At -c "select count(*) from $table where geom is not null")" 1000 "[$scn] cột PostGIS sau PITR"
  read -r rs rv < "$WORK/time-pitr-$scn"; result "[$scn] restore PITR: pgbackrest restore ${rs}s + recovery/khởi động ${rv}s"

  step "[$scn] khôi phục điểm mới nhất vào volume mới"
  got="$(restore_and_count "latest-$scn" "$table" "")"
  expect_eq "$got" "$n_final" "[$scn] bản ghi sau restore mới nhất"
  read -r rs rv < "$WORK/time-latest-$scn"; result "[$scn] restore mới nhất: pgbackrest restore ${rs}s + recovery/khởi động ${rv}s"
  docker rm -f "${PROJECT}-restore-pitr-$scn" "${PROJECT}-restore-latest-$scn" > /dev/null
  docker volume rm "${PROJECT}_restore_pitr-$scn" "${PROJECT}_restore_latest-$scn" > /dev/null

  step "[$scn] heartbeat pgBackRest"
  bk bash -c 'ls /var/lib/tami-backup/*.success && cat /var/lib/tami-backup/textfile/tami_backup.prom'
  for k in wal pg_full pg_diff; do
    bk bash -c "[[ -s /var/lib/tami-backup/$k.success ]]" || fail "[$scn] thiếu heartbeat $k"
  done
  bk grep -q 'tami_backup_last_success_timestamp_seconds{kind="pg_full"' /var/lib/tami-backup/textfile/tami_backup.prom || fail "[$scn] textfile thiếu pg_full"

  step "[$scn] restic: dữ liệu mẫu trong SeaweedFS nguồn -> init -> backup"
  bk bash -s << 'INNER'
set -euo pipefail
export MSYS_NO_PATHCONV=1
export RCLONE_S3_PROVIDER=Other RCLONE_S3_ENV_AUTH=false RCLONE_S3_FORCE_PATH_STYLE=true RCLONE_S3_ENDPOINT="$SRC_S3_ENDPOINT" \
  RCLONE_S3_ACCESS_KEY_ID="$SRC_S3_ACCESS_KEY_ID" RCLONE_S3_SECRET_ACCESS_KEY="$SRC_S3_SECRET_ACCESS_KEY"
rm -rf /tmp/src && mkdir -p /tmp/src/img /tmp/src/docs
head -c 2097152 /dev/urandom > /tmp/src/img/a.bin
head -c 512000 /dev/urandom > /tmp/src/img/b.bin
printf 'tài liệu nội bộ\n' > /tmp/src/docs/c.txt
set -- $SRC_S3_BUCKETS
rclone copy /tmp/src/img ":s3:$1/img"
rclone copy /tmp/src/docs ":s3:$2/docs"
rclone lsf -R ":s3:$1"
rclone lsf -R ":s3:$2"
INNER
  bk bash /opt/backup/restic-backup.sh init > "$WORK/restic-init-$scn.log" 2>&1 || { cat "$WORK/restic-init-$scn.log" >&2; fail "[$scn] restic init lỗi"; }
  t0=$(now)
  bk bash /opt/backup/restic-backup.sh backup > "$WORK/restic-bk1-$scn.log" 2>&1 || { cat "$WORK/restic-bk1-$scn.log" >&2; fail "[$scn] restic backup lỗi"; }
  result "[$scn] restic backup lần 1 (sync + snapshot + forget): $(($(now) - t0)) giây"
  tail -3 "$WORK/restic-bk1-$scn.log"
  bk bash -c 'cd /mirror && find . -type f -exec sha256sum {} + | sort -k2 > /tmp/sha-before.txt; cat /tmp/sha-before.txt'

  step "[$scn] mô phỏng mất dữ liệu: xoá bucket nguồn + bản sao /mirror -> restore từ restic -> so sha256"
  bk bash -s << 'INNER'
set -euo pipefail
export MSYS_NO_PATHCONV=1
export RCLONE_S3_PROVIDER=Other RCLONE_S3_ENV_AUTH=false RCLONE_S3_FORCE_PATH_STYLE=true RCLONE_S3_ENDPOINT="$SRC_S3_ENDPOINT" \
  RCLONE_S3_ACCESS_KEY_ID="$SRC_S3_ACCESS_KEY_ID" RCLONE_S3_SECRET_ACCESS_KEY="$SRC_S3_SECRET_ACCESS_KEY"
for b in $SRC_S3_BUCKETS; do rclone delete ":s3:$b"; done
rm -rf /mirror/* /tmp/restored
t0=$(date +%s)
bash /opt/backup/restic-backup.sh restore latest /tmp/restored > /tmp/restic-restore.log 2>&1 \
  || { cat /tmp/restic-restore.log; exit 1; }
echo "restic restore: $(($(date +%s) - t0)) giây"
cd /tmp/restored/mirror && find . -type f -exec sha256sum {} + | sort -k2 > /tmp/sha-after.txt
diff /tmp/sha-before.txt /tmp/sha-after.txt && echo "sha256 KHỚP ($(wc -l < /tmp/sha-after.txt) file)"
# đưa lại lên bucket nguồn như khi khôi phục thật (mode reupload), rồi đối chiếu nội dung object với bản restore
bash /opt/backup/restic-backup.sh reupload /tmp/restored
set -- $SRC_S3_BUCKETS
rclone check "/tmp/restored/mirror/$1" ":s3:$1" --one-way --log-level ERROR --stats 0 && rclone check "/tmp/restored/mirror/$2" ":s3:$2" --one-way --log-level ERROR --stats 0 && echo "bucket nguồn đã được khôi phục đúng nội dung"
INNER
  step "[$scn] restic: thay đổi dữ liệu -> backup lần 2 (forget --prune) -> check -> số snapshot"
  # bucket nguồn là chuẩn (rclone sync ghi đè /mirror): thêm 1 file, xoá 1 file ở nguồn
  bk bash -s << 'INNER'
set -euo pipefail
export RCLONE_S3_PROVIDER=Other RCLONE_S3_ENV_AUTH=false RCLONE_S3_FORCE_PATH_STYLE=true RCLONE_S3_ENDPOINT="$SRC_S3_ENDPOINT" \
  RCLONE_S3_ACCESS_KEY_ID="$SRC_S3_ACCESS_KEY_ID" RCLONE_S3_SECRET_ACCESS_KEY="$SRC_S3_SECRET_ACCESS_KEY"
set -- $SRC_S3_BUCKETS
printf 'tệp mới\n' | rclone rcat ":s3:$2/docs/d.txt"
rclone deletefile ":s3:$1/img/b.bin"
INNER
  t0=$(now)
  bk bash /opt/backup/restic-backup.sh backup > "$WORK/restic-bk2-$scn.log" 2>&1 || { cat "$WORK/restic-bk2-$scn.log" >&2; fail "[$scn] restic backup lần 2 lỗi"; }
  result "[$scn] restic backup lần 2 (tăng dần): $(($(now) - t0)) giây"
  bk bash /opt/backup/restic-backup.sh check > "$WORK/restic-check-$scn.log" 2>&1 || { cat "$WORK/restic-check-$scn.log" >&2; fail "[$scn] restic check lỗi"; }
  bk bash /opt/backup/restic-backup.sh snapshots | tail -6
  for k in files files_check; do bk bash -c "[[ -s /var/lib/tami-backup/$k.success ]]" || fail "[$scn] thiếu heartbeat $k"; done
}

heartbeat_and_scheduler_tests() {
  step "heartbeat: URL push tuỳ chọn, hành vi khi job fail, textfile metric, scheduler 1 vòng"
  local before after out
  # URL heartbeat tốt (GET 200) và xấu (404): job vẫn thành công, URL không bị in ra log
  out="$(bk env HEARTBEAT_URL_WAL=http://target-s3:9333/cluster/status bash /opt/backup/pg-backup.sh check 2>&1)"
  [[ $out != *cluster/status* ]] || fail "URL heartbeat bị in ra log"
  out="$(bk env HEARTBEAT_URL_WAL=http://target-s3:9333/khong-co-trang bash /opt/backup/pg-backup.sh check 2>&1)"
  [[ $out == *"gửi heartbeat 'wal' thất bại"* ]] || fail "thiếu cảnh báo heartbeat hỏng: $out"
  [[ $out == *"OK wal"* ]] || fail "heartbeat hỏng không được làm hỏng job"
  echo "ok  heartbeat URL: 200 -> im lặng, 404 -> cảnh báo, job vẫn OK, URL không lộ ra log"

  before="$(bk cat /var/lib/tami-backup/pg_diff.success)"
  sleep 1
  if bk env PGBACKREST_REPO1_CIPHER_PASS=sai-mat-khau bash /opt/backup/pg-backup.sh diff > "$WORK/fail-diff.log" 2>&1; then fail "backup với mật khẩu sai lại thành công"; fi
  after="$(bk cat /var/lib/tami-backup/pg_diff.success)"
  expect_eq "$after" "$before" "heartbeat pg_diff KHÔNG đổi khi job fail"
  bk bash -c '[[ -s /var/lib/tami-backup/pg_diff.failure ]]' || fail "thiếu .failure"
  bk grep -q 'tami_backup_last_run_ok{kind="pg_diff",env="staging"} 0' /var/lib/tami-backup/textfile/tami_backup.prom || fail "textfile không báo last_run_ok=0"
  echo "ok  job fail: exit != 0, .success giữ nguyên, last_run_ok=0"
  bk bash /opt/backup/pg-backup.sh diff > /dev/null 2>&1 || fail "diff sau fail không chạy lại được"
  bk grep -q 'tami_backup_last_run_ok{kind="pg_diff",env="staging"} 1' /var/lib/tami-backup/textfile/tami_backup.prom || fail "last_run_ok không trở lại 1"
  echo "ok  chạy lại thành công: last_run_ok=1"

  # scheduler: state riêng, mọi slot = 0000 => mọi job tới hạn trong một vòng
  bk env BACKUP_STATE_DIR=/tmp/sched BACKUP_SCHEDULER_ONCE=1 BACKUP_PG_SLOT=0000 BACKUP_FILES_SLOT=0000 BACKUP_CHECK_SLOT=0000 \
    bash /opt/backup/scheduler.sh 2>&1 | tail -12
  bk bash -c 'ls /tmp/sched/*.success' || fail "scheduler không tạo heartbeat"
  bk bash -c 'cat /tmp/sched/textfile/tami_backup.prom' | grep -c 'success_timestamp_seconds{' | xargs -I{} echo "scheduler ghi {} dòng success_timestamp"
  # vòng thứ hai ngay sau đó: không job nào tới hạn lại (đã thành công trong ngày; wal chưa tới chu kỳ)
  out="$(bk env BACKUP_STATE_DIR=/tmp/sched BACKUP_SCHEDULER_ONCE=1 BACKUP_PG_SLOT=0000 BACKUP_FILES_SLOT=0000 BACKUP_CHECK_SLOT=0000 bash /opt/backup/scheduler.sh 2>&1)"
  [[ $out != *"OK "* ]] || fail "scheduler chạy lại job đã thành công trong ngày: $out"
  echo "ok  scheduler không chạy lặp job đã thành công trong ngày"
}

archive_timeout_real_wait() {
  [[ ${E2E_WAIT_ARCHIVE_TIMEOUT:-1} == 1 ]] || { echo "bỏ qua bước chờ archive_timeout thật"; return 0; }
  step "archive_timeout thật: ghi 1 dòng, KHÔNG ép chuyển WAL, đo thời gian tới khi WAL lên kho"
  local t0 last
  psql_main "create table if not exists e2e_idle(id serial, t timestamptz default now())" > /dev/null
  bk bash /opt/backup/pg-backup.sh check > /dev/null 2>&1 # dọn: mọi WAL trước đó đã lên kho
  sleep 2
  t0=$(now)
  psql_main "insert into e2e_idle default values" > /dev/null
  for _ in $(seq 1 80); do
    last="$(psql_main "select coalesce(extract(epoch from last_archived_time)::bigint,0) from pg_stat_archiver")"
    (( last >= t0 )) && break
    sleep 5
  done
  (( last >= t0 )) || fail "không có WAL nào được archive trong 400 giây (archive_timeout=300s)"
  result "archive_timeout: dòng ghi lúc T0 lên kho sau $((last - t0)) giây không can thiệp (kỳ vọng <= 300)"
  (( last - t0 <= 330 )) || fail "archive trễ hơn archive_timeout"
}


wait_tcp_ready() { # <container> ; chờ postgres cuối cùng (qua TCP: server tạm của entrypoint khởi tạo chỉ nghe unix socket)
  local c="$1"
  for _ in $(seq 1 120); do
    if docker exec "$c" pg_isready -h 127.0.0.1 -U tami -d tami > /dev/null 2>&1; then return 0; fi
    sleep 1
  done
  docker logs --tail 40 "$c" >&2 || true
  fail "$c không sẵn sàng sau 120 giây"
}

# Chuyển image: volume do image GỐC khởi tạo (như prod/staging hiện tại) rồi bật bằng image tuỳ biến (glibc/collation/extension/index còn nguyên).
image_switch_test() {
  step "chuyển image: khởi tạo volume bằng postgis/postgis:17-3.5 gốc -> bật bằng image tuỳ biến -> dữ liệu + extension + index"
  local vol="${PROJECT}_switch" c="${PROJECT}-switch" orig=postgis/postgis:17-3.5 n_before n_after sum_before sum_after cv_before cv_after
  local q="select md5(string_agg(txt, ',' order by txt)) from sw"
  local cvq="select coalesce(datcollversion,'-') from pg_database where datname='tami'"
  docker volume rm -f "$vol" > /dev/null 2>&1 || true
  docker volume create "$vol" > /dev/null
  docker run -d --name "$c" -e POSTGRES_USER=tami -e POSTGRES_PASSWORD=unused -e POSTGRES_DB=tami \
    -v "$vol:/var/lib/postgresql/data" -v "$(hostpath "$REPO_ROOT/docker/postgres/init.sql"):/docker-entrypoint-initdb.d/01-extensions.sql:ro" "$orig" > /dev/null
  wait_tcp_ready "$c"
  docker exec "$c" psql -U tami -d tami -v ON_ERROR_STOP=1 -q -c "create extension if not exists amcheck" \
    -c "create table sw(id serial primary key, txt text, geom geometry(Point,4326))" \
    -c "insert into sw(txt, geom) select md5(g::text) || case g%3 when 0 then ' Đà Nẵng' when 1 then ' hà nội' else ' Ánh' end, st_setsrid(st_makepoint(g%180, g%90),4326) from generate_series(1,30000) g" \
    -c "create index sw_txt on sw(txt)" -c "create index sw_geom on sw using gist(geom)" > /dev/null
  n_before="$(docker exec "$c" psql -U tami -d tami -At -c "select count(*) from sw")"
  sum_before="$(docker exec "$c" psql -U tami -d tami -At -c "$q")"
  cv_before="$(docker exec "$c" psql -U tami -d tami -At -c "$cvq")"
  docker rm -f "$c" > /dev/null # SIGKILL: giống container bị tạo lại, postgres tự recovery từ WAL
  # image tuỳ biến, cùng user/biến môi trường như compose; archive_mode=off vì test này không có kho
  docker run -d --name "$c" -e POSTGRES_USER=tami -e POSTGRES_PASSWORD=unused -e POSTGRES_DB=tami \
    -v "$vol:/var/lib/postgresql/data" "$PG_IMAGE" postgres -c archive_mode=off > /dev/null
  wait_tcp_ready "$c"
  n_after="$(docker exec "$c" psql -U tami -d tami -At -c "select count(*) from sw")"
  sum_after="$(docker exec "$c" psql -U tami -d tami -At -c "$q")"
  cv_after="$(docker exec "$c" psql -U tami -d tami -At -c "$cvq")"
  expect_eq "$n_after" "$n_before" "[switch] số bản ghi sau khi đổi image"
  expect_eq "$sum_after" "$sum_before" "[switch] checksum thứ tự theo collation"
  expect_eq "$cv_after" "$cv_before" "[switch] datcollversion (collation)"
  expect_eq "$(docker exec "$c" psql -U tami -d tami -At -c "select count(*) from pg_extension where extname in ('postgis','pg_trgm','unaccent')")" 3 "[switch] extension còn"
  docker exec "$c" psql -U tami -d tami -v ON_ERROR_STOP=1 -q -c "select bt_index_check('sw_txt'::regclass, true)" -c "select bt_index_check('sw_pkey'::regclass, true)" > /dev/null \
    || fail "[switch] amcheck báo index hỏng"
  echo "ok  [switch] amcheck bt_index_check (heapallindexed) sạch"
  docker exec "$c" psql -U tami -d tami -v ON_ERROR_STOP=1 -q -c "reindex index sw_txt" -c "reindex index sw_geom" > /dev/null || fail "[switch] REINDEX lỗi"
  expect_eq "$(docker exec "$c" psql -U tami -d tami -At -c "select count(*) from sw where geom && st_makeenvelope(0,0,10,10,4326)")" \
    "$(docker exec "$c" psql -U tami -d tami -At -c "select count(*) from sw where st_x(geom) between 0 and 10 and st_y(geom) between 0 and 10")" "[switch] truy vấn không gian qua index gist"
  if docker logs "$c" 2>&1 | grep -qi 'collation version'; then fail "[switch] postgres cảnh báo collation version"; fi
  result "[switch] volume gốc -> image tuỳ biến: $n_after bản ghi, extension + amcheck + REINDEX + gist OK, collation version '$cv_after' không đổi"
  docker rm -f "$c" > /dev/null
  docker volume rm "$vol" > /dev/null
}

wal_queue_len() { # số segment WAL đang chờ archive trong container postgres
  dc exec -T postgres sh -c 'ls /var/lib/postgresql/data/pg_wal/archive_status | grep -c "\.ready$" || true' | tr -d '[:space:]'
}
pg_wal_mb() { dc exec -T postgres du -sm /var/lib/postgresql/data/pg_wal | cut -f1; }
# Số segment WAL "cũ" còn nằm trong pg_wal (tên <= segment hiện tại). Segment đã được checkpoint tái chế mang tên TƯƠNG LAI nên không tính: du không phân biệt được
# segment tái chế (vô hại, bị chặn bởi max_wal_size) với segment bị giữ vì chưa archive (đó mới là thứ làm đầy ổ).
pg_wal_old_segments() {
  local cur
  cur="$(psql_main "select pg_walfile_name(pg_current_wal_lsn())")"
  dc exec -T postgres sh -c "ls /var/lib/postgresql/data/pg_wal | grep -E '^[0-9A-F]{24}\$' | awk -v c=$cur '\$1 <= c' | wc -l" | tr -d '[:space:]'
}

# Kho không với tới (khoá hết hạn/kho chết): pg_wal KHÔNG được dồn quá trần archive-push-queue-max, DB vẫn chạy, kho hồi phục thì full mới thành công.
unreachable_repo_test() {
  local scn="$1" target="target-$1" table="e2e_$1" old ready wal_mb0 wal_mb1 failed0 failed1 n0 n1 t0 waited=0 dropped
  step "[$scn] kho không với tới: trần hàng đợi WAL (archive-push-queue-max) bảo vệ ổ đĩa"
  expect_eq "$(dc config | grep -c 'PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX: 4GiB')" 1 "[$scn] mặc định staging = 4GiB"
  echo "BACKUP_ARCHIVE_PUSH_QUEUE_MAX=48MiB" >> "$WORK/compose.env" # trần nhỏ để thấy tác dụng trong vài giây (= 3 segment 16MB)
  dc up -d --force-recreate --wait postgres > /dev/null
  # shellcheck disable=SC2016 # $VAR phải được shell TRONG container mở rộng
  expect_eq "$(dc exec -T postgres sh -c 'echo $PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX')" 48MiB "[$scn] trần áp vào container postgres"
  bk bash /opt/backup/pg-backup.sh check > /dev/null 2>&1 || fail "[$scn] check trước khi ngắt kho lỗi"
  wal_mb0="$(pg_wal_mb)"
  failed0="$(psql_main "select failed_count from pg_stat_archiver")"
  n0="$(psql_main "select count(*) from $table")"

  dc stop "$target" > /dev/null
  # 14 lần chuyển segment = ~224MB WAL chờ archive; không có trần thì cả 14 file nằm lại trong pg_wal
  for i in $(seq 1 14); do
    psql_main "insert into $table(payload) values ('mat-kho-$i')" > /dev/null
    psql_main "select pg_switch_wal()" > /dev/null
  done
  # archiver thử lại sau tối đa ~60 giây: chờ tới khi hàng đợi hạ xuống dưới trần (archive-push báo "đã lưu" rồi bỏ WAL)
  while :; do
    ready="$(wal_queue_len)"
    (( ready <= 4 )) && break
    (( waited >= 240 )) && fail "[$scn] sau ${waited}s vẫn còn $ready segment chờ archive: trần archive-push-queue-max không hoạt động"
    sleep 5
    waited=$((waited + 5))
  done
  # Segment đã "lưu" (kể cả bị bỏ) được checkpoint tái chế/xoá; segment còn .ready thì KHÔNG bao giờ bị xoá (đó là chỗ phình khi không có trần).
  psql_main "checkpoint" > /dev/null
  psql_main "checkpoint" > /dev/null
  wal_mb1="$(pg_wal_mb)"
  failed1="$(psql_main "select failed_count from pg_stat_archiver")"
  dropped="$(dc logs --no-log-prefix postgres 2>&1 | grep -ci 'dropped WAL file' || true)"
  (( failed1 > failed0 )) || fail "[$scn] pg_stat_archiver không ghi nhận archive lỗi (failed $failed0 -> $failed1)"
  (( dropped > 0 )) || fail "[$scn] log postgres không có cảnh báo 'dropped WAL file'"
  old="$(pg_wal_old_segments)"
  (( old <= 8 )) || fail "[$scn] còn $old segment cũ trong pg_wal (kỳ vọng <= 8 dù đã sinh 14 segment): trần không giữ được ổ đĩa"
  result "[$scn] kho chết, ghi 14 segment (~224MB): chờ archive còn $ready (trần 48MiB = 3), segment cũ còn giữ $old (đã sinh 14; pg_wal ${wal_mb0}MB -> ${wal_mb1}MB gồm segment tái chế), $dropped lần bỏ WAL có cảnh báo, ${waited}s tới khi hạ xuống trần"
  # DB vẫn chạy và nhận ghi
  psql_main "insert into $table(payload) values ('van-song')" > /dev/null
  n1="$(psql_main "select count(*) from $table")"
  expect_eq "$n1" "$((n0 + 15))" "[$scn] DB vẫn nhận ghi khi kho chết"
  # heartbeat báo lỗi (cảnh báo / Kuma stale): check fail và last_run_ok{wal}=0
  if bk timeout 180 bash /opt/backup/pg-backup.sh check > "$WORK/check-down-$scn.log" 2>&1; then fail "[$scn] check thành công dù kho chết"; fi
  bk grep -q 'tami_backup_last_run_ok{kind="wal",env="staging"} 0' /var/lib/tami-backup/textfile/tami_backup.prom || fail "[$scn] textfile không báo wal last_run_ok=0 khi kho chết"
  echo "ok  [$scn] check fail khi kho chết, last_run_ok{wal}=0"

  # kho hồi phục -> PITR gãy ở khoảng bị bỏ => full MỚI phải thành công và check OK
  dc up -d --wait "$target" > /dev/null
  t0=$(now)
  bk bash /opt/backup/pg-backup.sh full > "$WORK/full-after-$scn.log" 2>&1 || { cat "$WORK/full-after-$scn.log" >&2; fail "[$scn] full mới sau khi kho hồi phục lỗi"; }
  bk bash /opt/backup/pg-backup.sh check > "$WORK/check-after-$scn.log" 2>&1 || { cat "$WORK/check-after-$scn.log" >&2; fail "[$scn] check sau full mới lỗi"; }
  psql_main "insert into $table(payload) values ('sau-hoi-phuc')" > /dev/null
  psql_main "select pg_switch_wal()" > /dev/null
  wait_archived "$t0"
  bk grep -q 'tami_backup_last_run_ok{kind="wal",env="staging"} 1' /var/lib/tami-backup/textfile/tami_backup.prom || fail "[$scn] last_run_ok{wal} không về 1 sau khi kho hồi phục"
  result "[$scn] kho hồi phục: full mới $(($(now) - t0)) giây thành công, check OK, WAL tiếp tục lên kho, last_run_ok{wal}=1"
}
image_switch_test
for scn in "${SCENARIOS[@]}"; do run_scenario "$scn"; done
heartbeat_and_scheduler_tests
archive_timeout_real_wait
unreachable_repo_test "${SCENARIOS[-1]}"

step "TỔNG KẾT"
cat "$WORK/results.txt"
echo "E2E PASS"
