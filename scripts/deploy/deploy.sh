#!/usr/bin/env bash
# deploy.sh — CHẠY TRÊN SERVER, từ release của đúng commit: /opt/tami/releases/<env>/<sha>/scripts/deploy/deploy.sh
# (workflow .github/workflows/deploy.yml upload release rồi gọi). Triển khai 1 image TAMI (theo DIGEST) cho staging hoặc
# production bằng Docker Compose. Runbook: docs/runbooks/deploy.md.
#
# Dùng:
#   deploy.sh <staging|production> --release-sha <40 hex> --image ghcr.io/<owner>/<repo>@sha256:<64 hex>
#             [--registry-user <user> --registry-token-stdin]   # token đọc từ stdin, không qua argv/log
#             [--dry-run]                                        # chỉ in các bước, không chạy gì
#             [--allow-older]                                    # CHỈ chạy tay: cho production nhận digest cũ hơn đang chạy (rollback)
#
# Thứ tự (migration chạy TRƯỚC khi đổi app/jobs):
#   khoá -> kiểm release -> (production: digest+SHA đã qua staging, không cũ hơn) -> đổi symlink current -> compose config -> pull
#   -> kiểm HIGH_RISK_MIGRATION -> up postgres/redis/seaweedfs -> `payload migrate` -> up app + jobs -> health + jobs ổn định
#   -> fail (kể cả `up` lỗi): quay về image + release trước | ok: ghi trạng thái, dọn image/release cũ
#
# Migration đã chạy KHÔNG rollback được: quay về image trước chỉ an toàn khi migration backward-compatible
# (expand/contract). Xem runbook mục "Migration". Mã thoát: 1 = deploy fail (đã rollback hoặc chưa đổi gì),
# 3 = deploy fail VÀ rollback cũng fail (cần can thiệp tay).
# shellcheck disable=SC1091,SC2034 # lib/*.sh được source (shellcheck chạy không -x): ALLOW_OLDER chỉ đọc trong lib, COMPOSE_FILE chỉ đặt trong lib
set -euo pipefail
set +x # không bao giờ in lệnh (tránh lộ secret nếu ai đó bật xtrace qua env)

readonly IMAGE_PATTERN='^ghcr\.io/[a-z0-9][a-z0-9._/-]*@sha256:[a-f0-9]{64}$'
readonly ROLLBACK_FAILED_EXIT=3

TAMI_ROOT="${TAMI_ROOT:-/opt/tami}"
STATE_DIR="${STATE_DIR:-$TAMI_ROOT/state}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-5}"
JOBS_STABLE_CHECKS="${JOBS_STABLE_CHECKS:-3}"
JOBS_STABLE_INTERVAL="${JOBS_STABLE_INTERVAL:-5}"
LOCK_WAIT_SECONDS="${LOCK_WAIT_SECONDS:-300}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

DRY_RUN=false
ALLOW_OLDER=false
TARGET_ENV=""
TARGET_IMAGE=""
RELEASE_SHA=""
REGISTRY_USER=""
TOKEN_FROM_STDIN=false
TMP_DIR=""
ACTIVE_IMAGE=""
PREVIOUS_IMAGE=""
DEPLOY_OK=false

# shellcheck source=lib/high-risk-gate.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/high-risk-gate.sh"
# shellcheck source=lib/state.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/state.sh"
# shellcheck source=lib/release.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/release.sh"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
warn() { log "WARN: $*" >&2; }
die() {
  log "ERROR: $*" >&2
  exit 1
}

# Chạy lệnh thật, hoặc chỉ in ra khi --dry-run.
run() {
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

usage() {
  sed -n '2,19p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 2
}

parse_args() {
  [[ $# -ge 1 ]] || usage
  TARGET_ENV="$1"
  shift
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --image | --registry-user | --release-sha) [[ $# -ge 2 ]] || die "$1 cần giá trị" ;;&
      --image) TARGET_IMAGE="$2"; shift 2 ;;
      --release-sha) RELEASE_SHA="$2"; shift 2 ;;
      --registry-user) REGISTRY_USER="$2"; shift 2 ;;
      --registry-token-stdin) TOKEN_FROM_STDIN=true; shift ;;
      --dry-run) DRY_RUN=true; shift ;;
      --allow-older) ALLOW_OLDER=true; shift ;;
      -h | --help) usage ;;
      *) die "tham số lạ: $1" ;;
    esac
  done
  case "$TARGET_ENV" in
    staging | production) ;;
    *) die "môi trường phải là staging|production (nhận: $TARGET_ENV)" ;;
  esac
  [[ $TARGET_IMAGE =~ $IMAGE_PATTERN ]] || die "--image phải theo digest: ghcr.io/<repo>@sha256:<64 hex> (không dùng tag/latest)"
  [[ $RELEASE_SHA =~ $SHA_PATTERN ]] || die "--release-sha phải là commit SHA đầy đủ (40 hex)"
  if [[ $TOKEN_FROM_STDIN == true && -z $REGISTRY_USER ]]; then die "--registry-token-stdin cần --registry-user"; fi
}

# Đặt biến theo môi trường: file compose, env file, cổng health. COMPOSE_FILE ban đầu trỏ thẳng vào release;
# sau activate_release (trong khoá) trỏ qua symlink `current` để bind mount ổn định.
configure_env() {
  if [[ $TARGET_ENV == staging ]]; then
    COMPOSE_NAME=docker-compose.staging.yml
    ENV_FILE="${ENV_FILE:-$TAMI_ROOT/staging.env}"
    HEALTH_PORT=3011
    APP_CONTAINER=tami-staging-app
    JOBS_CONTAINER=tami-staging-jobs
    MIGRATE_CONTAINER=tami-staging-migrate
  else
    COMPOSE_NAME=docker-compose.prod.yml
    ENV_FILE="${ENV_FILE:-$TAMI_ROOT/prod.env}"
    HEALTH_PORT=3010
    APP_CONTAINER=tami-app
    JOBS_CONTAINER=tami-jobs
    MIGRATE_CONTAINER=tami-migrate
  fi
  COMPOSE_FILE="$REPO_DIR/docker/$COMPOSE_NAME"
}

# TAMI_IMAGE đặt qua biến môi trường của tiến trình (thắng --env-file); secret chỉ nằm trong env file trên server.
compose() {
  TAMI_IMAGE="$ACTIVE_IMAGE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

# Thoát không thành công (kể cả die giữa chừng) => trả `current` về release trước, kèm dọn thư mục tạm.
cleanup() {
  if [[ $DEPLOY_OK != true ]]; then restore_release_link || true; fi
  if [[ -n $TMP_DIR ]]; then rm -rf "$TMP_DIR"; fi
}

preflight() {
  local cmd mode
  for cmd in docker curl flock realpath; do
    command -v "$cmd" > /dev/null || die "thiếu lệnh: $cmd"
  done
  check_release_layout || die "script phải chạy từ $(releases_dir)/$RELEASE_SHA (đang ở $REPO_DIR): SHA/môi trường lệch release, từ chối"
  [[ -f $ENV_FILE ]] || die "không thấy env file: $ENV_FILE"
  [[ -f $COMPOSE_FILE ]] || die "không thấy compose file: $COMPOSE_FILE"
  mode="$(stat -c '%a' "$ENV_FILE")"
  [[ ${mode: -1} == 0 ]] || die "env file phải không cho 'others' đọc (chmod 600): $ENV_FILE ($mode)"
  mkdir -p "$STATE_DIR"
  TMP_DIR="$(mktemp -d)"
  chmod 700 "$TMP_DIR"
}

# Một khoá chung cho staging + production: server dùng chung 1 Docker daemon, không chạy 2 deploy song song.
acquire_lock() {
  exec 9> "$STATE_DIR/deploy.lock"
  flock -w "$LOCK_WAIT_SECONDS" 9 || die "deploy khác đang chạy (khoá $STATE_DIR/deploy.lock)"
}

# Login GHCR bằng DOCKER_CONFIG tạm: không ghi đè ~/.docker/config.json của các dự án khác trên server dùng chung.
pull_image() {
  local registry="${TARGET_IMAGE%%/*}"
  if [[ $DRY_RUN == true ]]; then
    if [[ $TOKEN_FROM_STDIN == true ]]; then
      printf '[dry-run] docker login %s -u %s --password-stdin (token từ stdin)\n' "$registry" "$REGISTRY_USER"
    fi
    printf '[dry-run] docker pull %s\n' "$TARGET_IMAGE"
    return 0
  fi
  export DOCKER_CONFIG="$TMP_DIR/docker"
  mkdir -p "$DOCKER_CONFIG"
  if [[ $TOKEN_FROM_STDIN == true ]]; then
    local token
    IFS= read -r token || die "không đọc được token từ stdin"
    printf '%s' "$token" | docker login "$registry" -u "$REGISTRY_USER" --password-stdin > /dev/null
    unset token
  fi
  docker pull --quiet "$TARGET_IMAGE" > /dev/null
  unset DOCKER_CONFIG
}

# Image đang chạy hiện tại: ưu tiên file trạng thái, không có thì hỏi container đang chạy (lần deploy đầu sau khi dựng tay).
read_previous_image() {
  local file="$STATE_DIR/$TARGET_ENV.current"
  if [[ -s $file ]]; then
    PREVIOUS_IMAGE="$(< "$file")"
  else
    PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$APP_CONTAINER" 2> /dev/null || true)"
  fi
  [[ -n $PREVIOUS_IMAGE ]] || warn "chưa có image trước: nếu deploy fail sẽ KHÔNG thể rollback tự động"
}

run_migrations() {
  # Container cố định tên có thể còn sót nếu lần trước bị kill giữa chừng.
  run docker rm -f "$MIGRATE_CONTAINER" || true
  run compose --profile tools run --rm -T migrate
}

# Trả 0 khi /api/health trả 2xx trong số lần thử cho phép.
wait_for_health() {
  local url="http://127.0.0.1:$HEALTH_PORT/api/health" attempt
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] curl %s tối đa %s lần, cách %ss, timeout %ss/lần\n' "$url" "$HEALTH_RETRIES" "$HEALTH_INTERVAL" "$HEALTH_TIMEOUT"
    return 0
  fi
  for ((attempt = 1; attempt <= HEALTH_RETRIES; attempt++)); do
    if curl -fsS --max-time "$HEALTH_TIMEOUT" -o /dev/null "$url" 2> /dev/null; then
      log "health OK (lần $attempt)"
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
  done
  return 1
}

# jobs phải `running` và KHÔNG restart trong suốt JOBS_STABLE_CHECKS lần kiểm (bắt crash-loop với restart: unless-stopped).
jobs_running() {
  if [[ $DRY_RUN == true ]]; then return 0; fi
  local check state restarts first_restarts=""
  for ((check = 1; check <= JOBS_STABLE_CHECKS; check++)); do
    state="" restarts=""
    read -r state restarts < <(docker inspect --format '{{.State.Status}} {{.RestartCount}}' "$JOBS_CONTAINER" 2> /dev/null) || true
    [[ $state == running ]] || return 1
    first_restarts="${first_restarts:-$restarts}"
    [[ $restarts == "$first_restarts" ]] || return 1
    if ((check < JOBS_STABLE_CHECKS)); then sleep "$JOBS_STABLE_INTERVAL"; fi
  done
}

# Đưa app + jobs về image trước, với release (compose) trước. Trả 0 chỉ khi app khoẻ VÀ jobs chạy ổn định.
rollback_to_previous() {
  if [[ -z $PREVIOUS_IMAGE ]]; then
    warn "không có image trước để quay về; app vẫn ở image lỗi"
    return 1
  fi
  warn "quay về image trước: $PREVIOUS_IMAGE (migration đã chạy KHÔNG bị hoàn tác)"
  restore_release_link
  ACTIVE_IMAGE="$PREVIOUS_IMAGE"
  compose up -d app jobs && wait_for_health && jobs_running
}

# Dịch vụ nền cần chạy trước migrate. `backup` chỉ thêm khi compose của môi trường có định nghĩa nó: prod có;
# staging KHÔNG có kho backup (quyết định user 2026-10-18) nên compose staging không khai báo dịch vụ này.
base_services() {
  local services=(postgres redis seaweedfs) declared
  if [[ $DRY_RUN == true ]]; then
    # dry-run không chạy docker: chỉ prod có backup
    if [[ $TARGET_ENV == production ]]; then services+=(backup); fi
    echo "${services[*]}"
    return
  fi
  # Không đặt trong điều kiện `if`: lỗi đọc compose phải dừng deploy, không được lặng lẽ bỏ backup ở prod.
  declared="$(compose config --services)" || die "không đọc được danh sách dịch vụ compose"
  if grep -qx backup <<<"$declared"; then services+=(backup); fi
  echo "${services[*]}"
}

# Mọi lỗi sau khi bắt đầu đổi container (kể cả `compose up` non-zero) đều đi vào rollback.
switch_app_and_jobs() {
  run compose up -d app jobs && wait_for_health && jobs_running
}

deploy() {
  ACTIVE_IMAGE="$TARGET_IMAGE"
  if [[ $DRY_RUN == false ]]; then read_previous_image; fi
  require_staging_passed # trước khi pull: không kéo image chưa qua staging
  if [[ $DRY_RUN == false ]]; then activate_release; fi
  run compose config -q
  pull_image
  gate_high_risk_migrations
  # Gán riêng: `die` trong $(...) làm đối số lệnh chỉ thoát subshell, `compose up -d` sẽ chạy KHÔNG danh sách (up toàn bộ).
  local base_list base_array
  base_list="$(base_services)" || die "không xác định được danh sách dịch vụ nền"
  read -r -a base_array <<< "$base_list"
  if ((${#base_array[@]} == 0)); then die "danh sách dịch vụ nền rỗng"; fi
  run compose up -d "${base_array[@]}"
  run compose up -d seaweedfs-init
  run_migrations
  if switch_app_and_jobs; then
    DEPLOY_OK=true
    record_success
    prune_old_tami_images
    prune_old_releases
    if [[ $DRY_RUN == true ]]; then log "DRY-RUN kết thúc, chưa thay đổi gì"; else log "deploy $TARGET_ENV xong: $TARGET_IMAGE (release $RELEASE_SHA)"; fi
    return 0
  fi
  warn "đổi app/jobs thất bại (compose up, health hoặc jobs)"
  if rollback_to_previous; then die "deploy thất bại, ĐÃ quay về image trước"; fi
  log "ERROR: deploy thất bại VÀ rollback cũng thất bại: $TARGET_ENV có thể đang hỏng, can thiệp tay (runbook mục Rollback)" >&2
  exit "$ROLLBACK_FAILED_EXIT"
}

main() {
  parse_args "$@"
  configure_env
  if [[ $DRY_RUN == false ]]; then
    preflight
    trap cleanup EXIT
    acquire_lock
  else
    log "DRY-RUN $TARGET_ENV image=$TARGET_IMAGE release=$RELEASE_SHA compose=$COMPOSE_FILE env-file=$ENV_FILE"
    check_release_layout || warn "(dry-run) script không nằm ở $(releases_dir)/$RELEASE_SHA; deploy thật sẽ từ chối"
  fi
  deploy
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
