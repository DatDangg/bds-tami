#!/usr/bin/env bash
# Vòng lặp lịch cho sidecar `backup`. Chọn vòng lặp trong container thay vì cron/systemd timer trên host vì: nằm trong compose của
# từng môi trường (không cần quyền root/sửa host dùng chung), log ra stdout (Loki), tự bắt kịp lịch khi container khởi động lại,
# và dùng chung cơ chế với test e2e. Giờ theo múi giờ TZ của container (compose đặt Asia/Ho_Chi_Minh).
#   wal         mỗi BACKUP_WAL_CHECK_SECONDS (600)       pgbackrest check -> bằng chứng archive WAL đang chạy (RPO)
#   pg_diff     hằng ngày sau BACKUP_PG_SLOT (0200)      pgbackrest diff (Chủ nhật: full => pg_full)
#   files       hằng ngày sau BACKUP_FILES_SLOT (0300)   restic backup
#   files_check Chủ nhật sau BACKUP_CHECK_SLOT (0400)    restic check
# Job fail được thử lại sau BACKUP_RETRY_SECONDS (1800) cho tới khi thành công trong ngày. Job chạy tuần tự (không chạy chồng).
# BACKUP_SCHEDULER_ONCE=1: chỉ chạy một vòng rồi thoát (dùng cho test).
set -uo pipefail

HERE="$(dirname "$(readlink -f "$0")")"
# shellcheck source=lib.sh
source "$HERE/lib.sh"

WAL_EVERY="${BACKUP_WAL_CHECK_SECONDS:-600}"
PG_SLOT="${BACKUP_PG_SLOT:-0200}"
FILES_SLOT="${BACKUP_FILES_SLOT:-0300}"
CHECK_SLOT="${BACKUP_CHECK_SLOT:-0400}"
RETRY="${BACKUP_RETRY_SECONDS:-1800}"

mkdir -p "$BACKUP_STATE_DIR/textfile"

seconds_since_attempt() { # <kind>
  local f="$BACKUP_STATE_DIR/$1.attempt"
  if [[ -s $f ]]; then echo $(($(date +%s) - $(< "$f"))); else echo 999999999; fi
}

mark_attempt() { write_atomic "$BACKUP_STATE_DIR/$1.attempt" "$(date +%s)"; }

succeeded_today() { # <kind>
  local f="$BACKUP_STATE_DIR/$1.success"
  [[ -s $f ]] && [[ "$(date -d "@$(< "$f")" +%F)" == "$(date +%F)" ]]
}

due_daily() { # <kind> <HHMM>
  succeeded_today "$1" && return 1
  [[ "$(date +%H%M)" < "$2" ]] && return 1
  (( $(seconds_since_attempt "$1") >= RETRY ))
}

attempt() { # <kind> <script> <mode>
  mark_attempt "$1"
  bash "$HERE/$2" "$3" || true # lỗi đã được ghi bởi run_job; vòng lặp phải sống tiếp
}

tick() {
  touch "$BACKUP_STATE_DIR/scheduler.alive"
  if (( $(seconds_since_attempt wal) >= WAL_EVERY )); then
    attempt wal pg-backup.sh check
  fi
  local pg_kind=pg_diff pg_mode=diff
  if [[ "$(date +%u)" == 7 ]]; then pg_kind=pg_full pg_mode=full; fi
  if due_daily "$pg_kind" "$PG_SLOT"; then attempt "$pg_kind" pg-backup.sh "$pg_mode"; fi
  if due_daily files "$FILES_SLOT"; then attempt files restic-backup.sh backup; fi
  if [[ "$(date +%u)" == 7 ]] && due_daily files_check "$CHECK_SLOT"; then attempt files_check restic-backup.sh check; fi
}

trap 'log "nhận tín hiệu dừng"; exit 0' TERM INT
log "scheduler bắt đầu env=$BACKUP_ENV_NAME tz=${TZ:-UTC} wal=${WAL_EVERY}s pg=$PG_SLOT files=$FILES_SLOT check=$CHECK_SLOT(CN)"
while :; do
  tick
  [[ ${BACKUP_SCHEDULER_ONCE:-0} == 1 ]] && exit 0
  sleep 30 &
  wait $! || true
done
