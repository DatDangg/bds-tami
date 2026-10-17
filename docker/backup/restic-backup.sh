#!/usr/bin/env bash
# File (SeaweedFS) -> restic. Chạy trong sidecar `backup`.
#   restic-backup.sh init       một lần khi dựng kho restic (KHÔNG tự chạy, lý do như stanza-create)
#   restic-backup.sh backup     rclone sync bucket (S3 API) -> /mirror, restic backup /mirror, forget --prune   (kind files)
#   restic-backup.sh check      restic check + đọc thử 10% dữ liệu                                              (kind files_check)
#   restic-backup.sh snapshots  liệt kê snapshot
#   restic-backup.sh restore [<snapshot>|latest] <thư mục>   khôi phục vào thư mục (KHÔNG ghi đè /mirror hay bucket)
#   restic-backup.sh reupload <thư mục đã restore>            đưa dữ liệu đã restore lên lại bucket SeaweedFS nguồn
#
# Vì sao qua S3 API + bản sao /mirror thay vì đọc thẳng volume SeaweedFS: file .dat/.idx của volume đang bị ghi dở khi server chạy
# (không nhất quán, restore có thể hỏng). S3 API trả từng object trọn vẹn. rclone sync chỉ chép phần thay đổi nên /mirror cập nhật
# tăng dần; restic lo lịch sử + chống trùng lặp. Đổi lại tốn thêm ổ bằng đúng dung lượng bucket (xem runbook).
#
# Biến môi trường (env file; mẫu restic-env.example): RESTIC_REPOSITORY, RESTIC_PASSWORD, khoá kho (AWS_* hoặc RESTIC_SFTP_ARGS),
# SRC_S3_ENDPOINT/SRC_S3_ACCESS_KEY_ID/SRC_S3_SECRET_ACCESS_KEY/SRC_S3_BUCKETS (compose lấy từ S3_* của môi trường).
set -euo pipefail

HERE="$(dirname "$(readlink -f "$0")")"
# shellcheck source=lib.sh
source "$HERE/lib.sh"

MIRROR="${BACKUP_MIRROR_DIR:-/mirror}"
export RESTIC_CACHE_DIR="${RESTIC_CACHE_DIR:-$BACKUP_STATE_DIR/restic-cache}"
RESTIC_HOST="tami-${BACKUP_ENV_NAME}"
RESTIC_TAG="tami-files"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY bắt buộc}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD bắt buộc}"

restic_cmd() {
  restic ${RESTIC_SFTP_ARGS:+-o "sftp.args=$RESTIC_SFTP_ARGS"} "$@"
}

# rclone cấu hình bằng env (không file rclone.conf chứa secret), trỏ tới SeaweedFS nguồn.
rclone_src() {
  : "${SRC_S3_ENDPOINT:?}" "${SRC_S3_ACCESS_KEY_ID:?}" "${SRC_S3_SECRET_ACCESS_KEY:?}"
  RCLONE_S3_PROVIDER=Other RCLONE_S3_ENV_AUTH=false RCLONE_S3_FORCE_PATH_STYLE=true \
    RCLONE_S3_ENDPOINT="$SRC_S3_ENDPOINT" \
    RCLONE_S3_ACCESS_KEY_ID="$SRC_S3_ACCESS_KEY_ID" RCLONE_S3_SECRET_ACCESS_KEY="$SRC_S3_SECRET_ACCESS_KEY" \
    rclone "$@" --log-level ERROR --stats 0
}

# Bản sao S3 -> thư mục. --max-delete chặn trường hợp bucket nguồn bị xoá sạch/đọc nhầm làm bản sao mất hàng loạt rồi bị chụp vào
# snapshot mới (snapshot cũ vẫn còn).
sync_buckets() {
  : "${SRC_S3_BUCKETS:?}"
  local bucket
  for bucket in $SRC_S3_BUCKETS; do
    mkdir -p "$MIRROR/$bucket"
    rclone_src sync ":s3:$bucket" "$MIRROR/$bucket" --checksum --transfers 4 --max-delete "${BACKUP_MAX_DELETE:-500}"
    log "đã đồng bộ bucket $bucket"
  done
}

# Đưa dữ liệu đã restore (<dir>/mirror/<bucket>) lên lại SeaweedFS nguồn. Chỉ thêm/ghi đè, không xoá gì trên bucket.
reupload_buckets() { # <thư mục restore>
  local dir="$1" bucket
  : "${SRC_S3_BUCKETS:?}"
  for bucket in $SRC_S3_BUCKETS; do
    [[ -d $dir/mirror/$bucket ]] || die "không thấy $dir/mirror/$bucket (restore chưa đúng snapshot?)"
    rclone_src copy "$dir/mirror/$bucket" ":s3:$bucket" --transfers 4
    log "đã đưa lại bucket $bucket"
  done
}

backup_files() {
  sync_buckets
  restic_cmd backup "$MIRROR" --host "$RESTIC_HOST" --tag "$RESTIC_TAG" --exclude-caches --one-file-system
  restic_cmd forget --host "$RESTIC_HOST" --tag "$RESTIC_TAG" --keep-daily 30 --keep-monthly 12 --prune
}

check_repo() {
  restic_cmd check --read-data-subset=10%
}

mode="${1:-}"
case "$mode" in
  init) restic_cmd init ;;
  backup)
    acquire_lock restic-backup
    run_job files backup_files
    ;;
  check)
    acquire_lock restic-check
    run_job files_check check_repo
    ;;
  snapshots) restic_cmd snapshots --host "$RESTIC_HOST" ;;
  restore) restic_cmd restore "${2:-latest}" --host "$RESTIC_HOST" --tag "$RESTIC_TAG" --target "${3:?thư mục đích (ngoài /mirror)}" ;;
  reupload) reupload_buckets "${2:?thư mục đã restore}" ;;
  *) die "dùng: restic-backup.sh init|backup|check|snapshots|restore [snapshot|latest] <thư mục>|reupload <thư mục>" ;;
esac
