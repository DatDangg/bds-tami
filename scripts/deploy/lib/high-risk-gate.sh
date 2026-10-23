# shellcheck shell=bash
# Cổng HIGH_RISK_MIGRATION — source từ deploy.sh (cần: compose, die, warn, log, DRY_RUN, TMP_DIR, TARGET_ENV, TARGET_IMAGE).
# Đánh dấu: dòng comment trong migrations/*.ts, vd `// HIGH_RISK_MIGRATION: DROP COLUMN x` (cũng nhận `/* */`, ` *`, `-- ` trong SQL).
# Chỉ migration CHƯA apply trong DB đích mới bị xét. DB đích TRỐNG (deploy đầu: chưa có container lẫn volume postgres-data, hoặc postgres chạy
# nhưng chưa có bảng payload_migrations) thì không chặn: không có dữ liệu để DROP/backfill làm mất (2026-10-23, lần deploy production đầu).

readonly HIGH_RISK_PATTERN='^[[:space:]]*(//|/\*+|\*|--)[[:space:]]*HIGH_RISK_MIGRATION([^A-Za-z0-9_]|$)'

# Tên migration đã apply trong DB đích (mỗi dòng 1 tên). Postgres chưa chạy / chưa có bảng => rỗng.
# Đặt TARGET_DB_EMPTY=true khi chắc chắn DB đích chưa có dữ liệu: không container VÀ không volume <project>_postgres-data,
# hoặc postgres chạy nhưng chưa có bảng payload_migrations. Không container nhưng volume còn => KHÔNG trống (dữ liệu nằm trong volume).
# Lỗi truy vấn / không đọc được tên volume => thoát lỗi (fail-closed): không biết gì đã apply thì không được coi là "an toàn".
TARGET_DB_EMPTY=false
list_applied_migrations() {
  local out_file="$1" cid exists volume
  : > "$out_file"
  TARGET_DB_EMPTY=false
  cid="$(compose ps -q postgres 2> /dev/null || true)"
  if [[ -z $cid ]]; then
    volume="$(postgres_volume_name)" || die "không đọc được tên project từ compose config (để biết volume postgres-data có dữ liệu không)"
    if docker volume inspect "$volume" > /dev/null 2>&1; then
      warn "postgres chưa chạy nhưng volume $volume đã có: coi như chưa apply migration nào (DB KHÔNG trống)"
    else
      TARGET_DB_EMPTY=true
      warn "chưa có container postgres lẫn volume $volume: DB đích trống"
    fi
    return 0
  fi
  # shellcheck disable=SC2016 # biến phải được shell TRONG container mở rộng
  exists="$(docker exec "$cid" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAq -c "SELECT to_regclass('"'"'public.payload_migrations'"'"')"')" ||
    die "không truy vấn được postgres để biết migration đã apply"
  if [[ -z $exists ]]; then
    TARGET_DB_EMPTY=true
    warn "postgres chưa có bảng payload_migrations: DB đích trống"
    return 0
  fi
  # shellcheck disable=SC2016
  docker exec "$cid" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAq -c "SELECT name FROM payload_migrations WHERE name <> '"'"'dev'"'"'"' > "$out_file" ||
    die "không đọc được danh sách payload_migrations"
}

# In tên các migration CHƯA apply mà có dòng đánh dấu HIGH_RISK_MIGRATION. Tham số: <thư mục migrations> <file danh sách đã apply>.
find_high_risk_pending() {
  local dir="$1" applied="$2" file name
  for file in "$dir"/*.ts; do
    [[ -e $file ]] || continue
    name="$(basename "$file" .ts)"
    if [[ $name == index ]] || grep -qxF "$name" "$applied"; then continue; fi
    if grep -Eq "$HIGH_RISK_PATTERN" "$file"; then printf '%s\n' "$name"; fi
  done
}

print_list() {
  local line
  while IFS= read -r line; do printf '  - %s\n' "$line"; done <<< "$1"
}

# Production: có migration rủi ro cao chưa apply => return 1 (chặn, không có cờ bỏ qua), TRỪ khi DB đích trống (tham số 4 = true).
# Staging: chỉ cảnh báo (đây chính là nơi kiểm thử migration trước khi promote).
check_high_risk_gate() {
  local env="$1" dir="$2" applied="$3" db_empty="${4:-false}" found
  found="$(find_high_risk_pending "$dir" "$applied")"
  if [[ -z $found ]]; then return 0; fi
  if [[ $env == production && $db_empty == true ]]; then
    warn "migration HIGH_RISK_MIGRATION chạy trên DB production TRỐNG (không có dữ liệu để mất) => không chặn:"
    print_list "$found" >&2
    return 0
  fi
  if [[ $env == production ]]; then
    log "CHẶN: migration HIGH_RISK_MIGRATION chưa apply, không promote production tự động:" >&2
    print_list "$found" >&2
    return 1
  fi
  warn "migration HIGH_RISK_MIGRATION sẽ chạy trên staging (kiểm thử; production sẽ bị chặn):"
  print_list "$found" >&2
}

# Trích thư mục migrations từ image (không cần chạy ứng dụng) rồi xét theo DB đích.
# Container tạm luôn bị xoá, kể cả khi `docker cp` lỗi.
gate_high_risk_migrations() {
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] trích /app/migrations từ image, so với bảng payload_migrations, chặn production nếu có HIGH_RISK_MIGRATION chưa apply\n'
    return 0
  fi
  local cid copied=true applied="$TMP_DIR/applied.txt"
  list_applied_migrations "$applied"
  cid="$(docker create "$TARGET_IMAGE")"
  docker cp "$cid:/app/migrations" "$TMP_DIR/migrations" > /dev/null 2>&1 || copied=false
  docker rm -f "$cid" > /dev/null 2>&1 || warn "không xoá được container tạm $cid"
  [[ $copied == true ]] || die "không trích được /app/migrations từ image (không biết migration nào sẽ chạy => dừng)"
  check_high_risk_gate "$TARGET_ENV" "$TMP_DIR/migrations" "$applied" "$TARGET_DB_EMPTY" || die "dừng deploy (HIGH_RISK_MIGRATION). Xem runbook mục HIGH_RISK_MIGRATION."
}
