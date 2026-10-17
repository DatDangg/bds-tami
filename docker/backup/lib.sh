#!/usr/bin/env bash
# Hàm dùng chung cho các script backup (source, không chạy trực tiếp). KHÔNG bật xtrace và KHÔNG in biến môi trường:
# env chứa mật khẩu kho, khoá S3, URL heartbeat.
#
# Heartbeat "backup thành công lần cuối" (chưa có Prometheus/Kuma vẫn dùng được; xem docs/runbooks/restore.md §7):
#   $BACKUP_STATE_DIR/<kind>.success          epoch giây của lần thành công gần nhất (CHỈ ghi khi job exit 0)
#   $BACKUP_STATE_DIR/<kind>.failure          "<epoch> <exit code>" của lần fail gần nhất
#   $BACKUP_STATE_DIR/textfile/tami_backup.prom   dạng textfile cho node_exporter (--collector.textfile.directory)
#   HEARTBEAT_URL_<KIND> (tuỳ chọn)           GET khi thành công (Uptime Kuma push monitor)
# kind: wal | pg_full | pg_diff | files | files_check

BACKUP_STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/tami-backup}"
BACKUP_ENV_NAME="${BACKUP_ENV_NAME:-unknown}"
BACKUP_KINDS=(wal pg_full pg_diff files files_check)

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
die() { log "LỖI: $*"; exit 1; }

# Ghi nguyên tử (tmp + mv) để node_exporter/người đọc không bao giờ thấy file dở.
write_atomic() { # <file> <nội dung>
  local file="$1" tmp
  tmp="$(mktemp "$file.XXXXXX")" || return 1
  printf '%s\n' "$2" > "$tmp" && mv -f "$tmp" "$file"
}

# Khoá theo tên: chặn chạy chồng (scheduler + chạy tay). Giữ fd 9 tới khi process thoát.
acquire_lock() { # <tên>
  mkdir -p "$BACKUP_STATE_DIR"
  exec 9> "$BACKUP_STATE_DIR/$1.lock"
  flock -n 9 || die "job '$1' đang chạy (khoá $BACKUP_STATE_DIR/$1.lock)"
}

# last_run_ok = 1 khi đã có lần thành công và không có lần fail nào mới hơn nó.
write_metrics() {
  local out="$BACKUP_STATE_DIR/textfile" kind ok body ok_ts fail_ts
  mkdir -p "$out"
  body="# HELP tami_backup_last_success_timestamp_seconds Thời điểm (epoch) lần backup thành công gần nhất của từng loại.
# TYPE tami_backup_last_success_timestamp_seconds gauge"
  for kind in "${BACKUP_KINDS[@]}"; do
    [[ -s $BACKUP_STATE_DIR/$kind.success ]] || continue
    body+=$'\n'"tami_backup_last_success_timestamp_seconds{kind=\"$kind\",env=\"$BACKUP_ENV_NAME\"} $(< "$BACKUP_STATE_DIR/$kind.success")"
  done
  body+=$'\n'"# HELP tami_backup_last_run_ok 1 nếu lần chạy gần nhất của loại đó thành công, 0 nếu fail (không có dòng = chưa từng chạy)."
  body+=$'\n'"# TYPE tami_backup_last_run_ok gauge"
  for kind in "${BACKUP_KINDS[@]}"; do
    ok_ts=0 fail_ts=0
    [[ -s $BACKUP_STATE_DIR/$kind.success ]] && ok_ts="$(< "$BACKUP_STATE_DIR/$kind.success")"
    [[ -s $BACKUP_STATE_DIR/$kind.failure ]] && read -r fail_ts _ < "$BACKUP_STATE_DIR/$kind.failure"
    (( ok_ts > 0 || fail_ts > 0 )) || continue
    ok=0
    (( ok_ts > 0 && ok_ts >= fail_ts )) && ok=1
    body+=$'\n'"tami_backup_last_run_ok{kind=\"$kind\",env=\"$BACKUP_ENV_NAME\"} $ok"
  done
  write_atomic "$out/tami_backup.prom" "$body"
}

send_heartbeat() { # <kind>
  local var="HEARTBEAT_URL_${1^^}" url
  url="${!var:-}"
  [[ -n $url ]] || return 0
  # Không log URL (chứa token push). Heartbeat hỏng không được làm hỏng job backup.
  curl -fsS -m 10 --retry 2 -o /dev/null "$url" 2> /dev/null || log "cảnh báo: gửi heartbeat '$1' thất bại"
}

record_success() { # <kind>
  write_atomic "$BACKUP_STATE_DIR/$1.success" "$(date +%s)"
  write_metrics || log "cảnh báo: không ghi được textfile metric"
  send_heartbeat "$1"
  log "OK $1"
}

record_failure() { # <kind> <exit code>
  write_atomic "$BACKUP_STATE_DIR/$1.failure" "$(date +%s) $2" || true
  write_metrics || true
  log "FAIL $1 (exit $2)"
}

# Chạy lệnh; chỉ ghi heartbeat khi exit 0. Trả đúng exit code của lệnh.
run_job() { # <kind> <lệnh...>
  local kind="$1" rc=0
  shift
  "$@" || rc=$?
  if (( rc == 0 )); then record_success "$kind"; else record_failure "$kind" "$rc"; fi
  return "$rc"
}
