#!/usr/bin/env bash
# Khôi phục PostgreSQL từ kho pgBackRest vào một volume Docker (chạy trên máy có docker; KHÔNG đụng container đang chạy).
#   pg-restore.sh --volume <tên volume> --image <image postgres> --env-file <pgbackrest.env> [--conf <pgbackrest.conf>]
#                 [--target-time "YYYY-MM-DD HH:MM:SS+07"] [--set <nhãn backup>] [--delta] [--network <mạng docker>]
#                 [--ssh-dir <thư mục ssh/ chứa khoá SFTP, CA>]  (= $BACKUP_ENV_DIR/ssh, mount vào /etc/backup/ssh)
# Không có --target-time: khôi phục tới điểm WAL mới nhất trong kho. Volume phải RỖNG, trừ khi dùng --delta (ghi đè volume cũ:
# chỉ dùng cho khôi phục tại chỗ, sau khi đã dừng postgres). Xong restore script dừng; bước bật postgres xem docs/runbooks/restore.md.
set -euo pipefail

volume="" image="" env_file="" target_time="" backup_set="" delta=0 network="" ssh_dir=""
here="$(cd "$(dirname "$0")" && pwd)"
conf="$here/pgbackrest.conf"

while (( $# )); do
  case "$1" in
    --volume) volume="$2"; shift 2 ;;
    --image) image="$2"; shift 2 ;;
    --env-file) env_file="$2"; shift 2 ;;
    --conf) conf="$2"; shift 2 ;;
    --target-time) target_time="$2"; shift 2 ;;
    --set) backup_set="$2"; shift 2 ;;
    --network) network="$2"; shift 2 ;;
    --ssh-dir) ssh_dir="$2"; shift 2 ;;
    --delta) delta=1; shift ;;
    *) echo "tham số lạ: $1" >&2; exit 2 ;;
  esac
done
[[ -n $volume && -n $image && -n $env_file ]] || { echo "thiếu --volume/--image/--env-file" >&2; exit 2; }
[[ -f $env_file && -f $conf ]] || { echo "không thấy env file hoặc pgbackrest.conf" >&2; exit 2; }

args=("--stanza=${PGBACKREST_STANZA:-tami}" --log-level-console=info)
if [[ -n $target_time ]]; then
  # promote: kết thúc recovery ngay tại target (mặc định pgBackRest dừng ở pause khiến postgres không nhận ghi).
  args+=(--type=time "--target=$target_time" --target-action=promote)
fi
[[ -n $backup_set ]] && args+=("--set=$backup_set")
(( delta )) && args+=(--delta)

docker_args=(run --rm -u postgres --entrypoint pgbackrest
  --env-file "$env_file"
  -v "$volume:/var/lib/postgresql/data"
  -v "$conf:/etc/pgbackrest/pgbackrest.conf:ro"
  --memory 512m)
[[ -n $network ]] && docker_args+=(--network "$network")
[[ -n $ssh_dir ]] && docker_args+=(-v "$ssh_dir:/etc/backup/ssh:ro")

echo "restore vào volume '$volume' (target: ${target_time:-mới nhất}, delta: $delta)"
start=$(date +%s)
docker "${docker_args[@]}" "$image" "${args[@]}" restore
echo "restore xong sau $(($(date +%s) - start)) giây"
