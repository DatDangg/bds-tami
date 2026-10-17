#!/usr/bin/env bash
# pgBackRest: chạy trong sidecar `backup` (user postgres; có pgdata read-only + socket postgres dùng chung).
#   pg-backup.sh stanza-create   một lần khi dựng kho (KHÔNG tự chạy: sai env sẽ tạo kho rỗng ở sai chỗ mà không ai biết)
#   pg-backup.sh full | diff     backup (kind pg_full / pg_diff)
#   pg-backup.sh check           kiểm tra archive WAL end-to-end (kind wal): tạo restore point + ép chuyển WAL rồi chờ file lên kho
#   pg-backup.sh info            in danh sách backup + WAL của kho
set -euo pipefail

HERE="$(dirname "$(readlink -f "$0")")"
# shellcheck source=lib.sh
source "$HERE/lib.sh"

STANZA="${PGBACKREST_STANZA:-tami}"
mode="${1:-}"

case "$mode" in
  stanza-create) exec pgbackrest --stanza="$STANZA" stanza-create ;;
  info) exec pgbackrest --stanza="$STANZA" info ;;
  full | diff)
    acquire_lock "pg-$mode"
    run_job "pg_$mode" pgbackrest --stanza="$STANZA" --type="$mode" backup
    ;;
  check)
    acquire_lock pg-check
    run_job wal pgbackrest --stanza="$STANZA" check
    ;;
  *) die "dùng: pg-backup.sh stanza-create|full|diff|check|info" ;;
esac
