#!/usr/bin/env bash
# Test nhỏ cho deploy.sh + lib/*.sh, không cần Docker/server: `bash scripts/deploy/deploy.test.sh` (phần symlink chỉ chạy trên Linux).
# Phủ: cổng HIGH_RISK_MIGRATION, kiểm tra tham số (cấm tag/latest, --release-sha), thứ tự --dry-run, chọn đúng release theo env+SHA
# (từ chối SHA/env lệch), production chỉ nhận digest+SHA đã qua staging và không cũ hơn, rollback khi `compose up` lỗi (exit 1/3),
# jobs ổn định, container tạm luôn bị xoá.
# shellcheck disable=SC2016,SC2034,SC2329 # bash -c nhận tham số vị trí; biến/hàm stub được dùng gián tiếp bởi deploy.sh đã source
set -euo pipefail

SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deploy.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
FAILURES=0
DIGEST="sha256:$(printf 'a%.0s' {1..64})"
IMAGE="ghcr.io/example/tami@$DIGEST"
SHA1="$(printf '1%.0s' {1..40})"
SHA2="$(printf '2%.0s' {1..40})"
SHA3="$(printf '3%.0s' {1..40})"
SHA4="$(printf '4%.0s' {1..40})"
DIGEST_B="sha256:$(printf 'b%.0s' {1..64})"

pass() { printf 'PASS  %s\n' "$1"; }
fail() {
  printf 'FAIL  %s\n' "$1"
  FAILURES=$((FAILURES + 1))
}
expect() { # expect <mô tả> <lệnh test...>
  local label="$1"
  shift
  if "$@"; then pass "$label"; else fail "$label"; fi
}

# shellcheck source=scripts/deploy/deploy.sh
source "$SCRIPT"

make_migrations() {
  local dir="$WORK/migrations"
  mkdir -p "$dir"
  printf 'export async function up() {}\n' > "$dir/20260101_000000_applied_risky.ts"
  printf '// HIGH_RISK_MIGRATION: đã apply từ trước\n' >> "$dir/20260101_000000_applied_risky.ts"
  printf '// HIGH_RISK_MIGRATION: DROP COLUMN old_field\nexport async function up() {}\n' > "$dir/20260102_000000_pending_risky.ts"
  printf '  -- HIGH_RISK_MIGRATION: SET NOT NULL\n' > "$dir/20260103_000000_pending_sql_marker.ts"
  printf 'export async function up() {}\n' > "$dir/20260104_000000_pending_clean.ts"
  printf 'const note = "HIGH_RISK_MIGRATION trong chuỗi, không phải đánh dấu";\n' > "$dir/20260105_000000_pending_mention.ts"
  printf 'export const migrations = [];\n// HIGH_RISK_MIGRATION trong index bị bỏ qua\n' > "$dir/index.ts"
  printf '20260101_000000_applied_risky\n' > "$WORK/applied.txt"
  : > "$WORK/applied_none.txt"
}

test_find_high_risk() {
  local out
  out="$(find_high_risk_pending "$WORK/migrations" "$WORK/applied.txt")"
  expect "chỉ báo migration chưa apply có đánh dấu" test "$out" == "$(printf '20260102_000000_pending_risky\n20260103_000000_pending_sql_marker')"
}

test_gate() {
  if check_high_risk_gate production "$WORK/migrations" "$WORK/applied.txt" 2> /dev/null; then
    fail "production bị chặn khi có HIGH_RISK chưa apply"
  else
    pass "production bị chặn khi có HIGH_RISK chưa apply"
  fi
  expect "staging chỉ cảnh báo (không chặn)" check_high_risk_gate staging "$WORK/migrations" "$WORK/applied.txt" 2> /dev/null
  rm "$WORK/migrations/20260102_000000_pending_risky.ts" "$WORK/migrations/20260103_000000_pending_sql_marker.ts"
  expect "production qua khi không còn HIGH_RISK chưa apply" check_high_risk_gate production "$WORK/migrations" "$WORK/applied.txt"
}

test_args() {
  local bad
  for bad in "ghcr.io/example/tami:latest" "ghcr.io/example/tami:abc123" "docker.io/x/y@$DIGEST" "ghcr.io/example/tami@sha256:abc"; do
    expect "từ chối image không theo digest: $bad" bash -c '! "$0" staging --release-sha "$2" --image "$1" --dry-run > /dev/null 2>&1' "$SCRIPT" "$bad" "$SHA1"
  done
  expect "từ chối môi trường lạ" bash -c '! "$0" dev --release-sha "$2" --image "$1" --dry-run > /dev/null 2>&1' "$SCRIPT" "$IMAGE" "$SHA1"
}

line_of() { grep -n -m1 -- "$2" <<< "$1" | cut -d: -f1; }

test_dry_run_order() {
  local env="$1" out m u
  out="$(bash "$SCRIPT" "$env" --release-sha "$SHA1" --image "$IMAGE" --registry-user bot --registry-token-stdin --dry-run <<< "super-secret-token")"
  m="$(line_of "$out" 'run --rm -T migrate')"
  u="$(line_of "$out" 'up -d app jobs')"
  expect "[$env] dry-run: migrate chạy trước khi up app/jobs" test -n "$m" -a -n "$u" -a "${m:-0}" -lt "${u:-0}"
  expect "[$env] dry-run: có health check" grep -q '/api/health' <<< "$out"
  expect "[$env] dry-run: không in token" bash -c '! grep -q "super-secret-token" <<< "$1"' _ "$out"
  expect "[$env] dry-run: không dùng latest" bash -c '! grep -qi "latest" <<< "$1"' _ "$out"
}

test_production_checks_staging_history() {
  local out
  out="$(bash "$SCRIPT" production --release-sha "$SHA1" --image "$IMAGE" --dry-run)"
  expect "production dry-run: kiểm digest đã qua staging" grep -q 'staging.history' <<< "$out"
  expect "production dry-run: có cổng HIGH_RISK_MIGRATION" grep -q 'HIGH_RISK_MIGRATION' <<< "$out"
}

test_args_release_sha() {
  local bad
  for bad in "" "abc123" "$(printf 'G%.0s' {1..40})" "${SHA1}0"; do
    expect "từ chối --release-sha không hợp lệ: '${bad:0:12}'" bash -c '! "$0" staging --release-sha "$2" --image "$1" --dry-run > /dev/null 2>&1' "$SCRIPT" "$IMAGE" "$bad"
  done
  expect "từ chối thiếu --release-sha" bash -c '! "$0" staging --image "$1" --dry-run > /dev/null 2>&1' "$SCRIPT" "$IMAGE"
}

# --- Release theo môi trường + SHA (MAJOR-1) ---
make_release_tree() {
  local sha
  ROOT="$WORK/root"
  for sha in "$SHA1" "$SHA2" "$SHA3" "$SHA4"; do mkdir -p "$ROOT/releases/staging/$sha/docker"; done
  touch -d '2026-01-01' "$ROOT/releases/staging/$SHA1" "$ROOT/releases/staging/$SHA1/docker"
  touch -d '2026-01-02' "$ROOT/releases/staging/$SHA2"
  touch -d '2026-01-03' "$ROOT/releases/staging/$SHA3"
  touch -d '2026-01-04' "$ROOT/releases/staging/$SHA4"
}

layout_ok() { # layout_ok <env> <sha> <release-dir>
  (
    TAMI_ROOT="$ROOT" TARGET_ENV="$1" RELEASE_SHA="$2" REPO_DIR="$3"
    check_release_layout
  )
}

test_release_layout() {
  make_release_tree
  expect "release layout: đúng env + SHA được chấp nhận" layout_ok staging "$SHA1" "$ROOT/releases/staging/$SHA1"
  if layout_ok staging "$SHA2" "$ROOT/releases/staging/$SHA1"; then fail "release layout: SHA lệch release bị từ chối"; else pass "release layout: SHA lệch release bị từ chối"; fi
  if layout_ok production "$SHA1" "$ROOT/releases/staging/$SHA1"; then fail "release layout: release của staging không dùng được cho production"; else pass "release layout: release của staging không dùng được cho production"; fi
  if layout_ok staging "not-a-sha" "$ROOT/releases/staging/not-a-sha"; then fail "release layout: SHA sai định dạng bị từ chối"; else pass "release layout: SHA sai định dạng bị từ chối"; fi
}

test_activate_restore_prune() {
  local link="$ROOT/releases/staging/current"
  # Git Bash trên Windows: ln -s tạo bản sao thay vì symlink thật => bỏ qua (chạy đủ trên Linux/CI).
  ln -s "$WORK" "$WORK/probe_link" 2> /dev/null || true
  if [[ ! -L $WORK/probe_link ]]; then
    printf 'SKIP  activate/restore/prune release: môi trường không hỗ trợ symlink thật\n'
    rm -rf "$WORK/probe_link"
    return 0
  fi
  rm -f "$WORK/probe_link"
  (
    TAMI_ROOT="$ROOT" TARGET_ENV=staging COMPOSE_NAME=docker-compose.staging.yml DRY_RUN=false
    REPO_DIR="$ROOT/releases/staging/$SHA1" activate_release
    printf '%s' "$COMPOSE_FILE" > "$WORK/compose1"
    REPO_DIR="$ROOT/releases/staging/$SHA2" activate_release
    printf '%s' "$PREVIOUS_RELEASE" > "$WORK/prev"
    readlink "$link" > "$WORK/cur2"
    restore_release_link
    readlink "$link" > "$WORK/cur3"
  )
  expect "activate: compose đọc qua symlink current (bind mount ổn định)" test "$(< "$WORK/compose1")" == "$link/docker/docker-compose.staging.yml"
  expect "activate: current trỏ release mới, ghi nhớ release trước" test "$(< "$WORK/cur2")" == "$ROOT/releases/staging/$SHA2" -a "$(< "$WORK/prev")" == "$ROOT/releases/staging/$SHA1"
  expect "restore: current quay về release trước" test "$(< "$WORK/cur3")" == "$ROOT/releases/staging/$SHA1"
  (
    TAMI_ROOT="$ROOT" TARGET_ENV=staging DRY_RUN=false RELEASES_KEEP=2
    prune_old_releases > /dev/null
  )
  expect "prune: giữ N release mới nhất + release current, xoá phần còn lại" test -d "$ROOT/releases/staging/$SHA4" -a -d "$ROOT/releases/staging/$SHA3" -a -d "$ROOT/releases/staging/$SHA1" -a ! -e "$ROOT/releases/staging/$SHA2"
}

# --- Production chỉ nhận digest + SHA đã qua staging, không cũ hơn đang chạy (MAJOR-1, MINOR-2) ---
prod_check() { # prod_check <digest> <sha> <allow-older>
  (
    STATE_DIR="$WORK/state" TARGET_ENV=production DRY_RUN=false RELEASE_SHA="$2" TARGET_IMAGE="ghcr.io/example/tami@$1" ALLOW_OLDER="$3"
    require_staging_passed
  ) > /dev/null 2>&1
}

test_require_staging_passed() {
  mkdir -p "$WORK/state"
  printf '%s 2026-01-01T00:00:00Z %s\n%s 2026-01-02T00:00:00Z %s\n' "$DIGEST" "$SHA1" "$DIGEST_B" "$SHA2" > "$WORK/state/staging.history"
  printf 'ghcr.io/example/tami@%s\n' "$DIGEST_B" > "$WORK/state/production.current"
  expect "production: digest + SHA khớp staging, bằng bản đang chạy => qua" prod_check "$DIGEST_B" "$SHA2" false
  if prod_check "$DIGEST_B" "$SHA1" false; then fail "production: SHA lệch với digest trong staging.history bị từ chối"; else pass "production: SHA lệch với digest trong staging.history bị từ chối"; fi
  if prod_check "sha256:$(printf 'c%.0s' {1..64})" "$SHA2" false; then fail "production: digest chưa qua staging bị từ chối"; else pass "production: digest chưa qua staging bị từ chối"; fi
  if prod_check "$DIGEST" "$SHA1" false; then fail "production: digest cũ hơn production.current bị từ chối"; else pass "production: digest cũ hơn production.current bị từ chối"; fi
  expect "production: --allow-older cho phép rollback có chủ đích" prod_check "$DIGEST" "$SHA1" true
  rm "$WORK/state/production.current"
  expect "production: chưa có production.current => digest hợp lệ qua" prod_check "$DIGEST" "$SHA1" false
}

# --- Rollback khi `compose up -d app jobs` lỗi (MAJOR-2) ---
PREV_IMAGE="ghcr.io/example/tami@$DIGEST_B"

# run_deploy_scenario <new-up-rc> <rollback-up-rc> <jobs-rc> [<rollback-jobs-rc>]; ghi các lệnh gọi vào $WORK/calls; in mã thoát.
run_deploy_scenario() {
  : > "$WORK/calls"
  local rc=0
  set +e
  (
    set -e
    local new_rc="$1" rb_rc="$2" jobs_rc="$3" rb_jobs_rc="${4:-0}"
    DRY_RUN=false TARGET_ENV=staging TARGET_IMAGE="$IMAGE" RELEASE_SHA="$SHA1"
    read_previous_image() { PREVIOUS_IMAGE="$PREV_IMAGE"; }
    require_staging_passed() { :; }
    activate_release() { :; }
    pull_image() { :; }
    gate_high_risk_migrations() { :; }
    run_migrations() { :; }
    prune_old_tami_images() { :; }
    prune_old_releases() { :; }
    wait_for_health() { return 0; }
    record_success() { echo record >> "$WORK/calls"; }
    restore_release_link() { echo restore >> "$WORK/calls"; }
    jobs_running() { if [[ $ACTIVE_IMAGE == "$IMAGE" ]]; then return "$jobs_rc"; else return "$rb_jobs_rc"; fi; }
    compose() {
      echo "compose $*" >> "$WORK/calls"
      if [[ "$*" == "up -d app jobs" ]]; then
        if [[ $ACTIVE_IMAGE == "$IMAGE" ]]; then return "$new_rc"; else return "$rb_rc"; fi
      fi
    }
    deploy
  ) > /dev/null 2>&1
  rc=$?
  set -e
  printf '%s' "$rc"
}

test_deploy_rollback() {
  local rc ups
  rc="$(run_deploy_scenario 0 0 0)"
  expect "deploy ok: exit 0, không rollback" test "$rc" == 0 -a "$(grep -c 'compose up -d app jobs' "$WORK/calls")" == 1
  expect "deploy ok: có ghi state" grep -q '^record$' "$WORK/calls"
  rc="$(run_deploy_scenario 1 0 0)"
  ups="$(grep -c 'compose up -d app jobs' "$WORK/calls")"
  expect "compose up lỗi => rollback (up lần 2, exit 1, không ghi state)" test "$rc" == 1 -a "$ups" == 2
  expect "compose up lỗi => trả current về release trước rồi mới up image cũ" test "$(grep -n 'restore' "$WORK/calls" | head -1 | cut -d: -f1)" -lt "$(grep -n 'compose up -d app jobs' "$WORK/calls" | tail -1 | cut -d: -f1)"
  expect "compose up lỗi => không ghi state thành công" bash -c '! grep -q "^record$" "$1"' _ "$WORK/calls"
  rc="$(run_deploy_scenario 0 0 1)"
  expect "jobs không ổn định => rollback (exit 1)" test "$rc" == 1 -a "$(grep -c 'compose up -d app jobs' "$WORK/calls")" == 2
  rc="$(run_deploy_scenario 1 1 0)"
  expect "rollback cũng lỗi => exit 3 (không im lặng)" test "$rc" == 3
  rc="$(run_deploy_scenario 1 0 0 1)"
  expect "rollback mà jobs không chạy => exit 3" test "$rc" == 3
}

# --- jobs ổn định, không crash-loop (MINOR-4) ---
jobs_scenario() { # jobs_scenario <chế độ: stable|looping|stopped>
  : > "$WORK/docker_calls"
  (
    JOBS_CONTAINER=x DRY_RUN=false JOBS_STABLE_CHECKS=3 JOBS_STABLE_INTERVAL=0
    MODE="$1"
    # jobs_running gọi docker trong process substitution (subshell) => đếm lần gọi bằng file.
    docker() {
      echo x >> "$WORK/docker_calls"
      case "$MODE" in
        stable) echo "running 0" ;;
        looping) echo "running $(wc -l < "$WORK/docker_calls")" ;;
        stopped) echo "restarting 1" ;;
      esac
    }
    jobs_running
  ) > /dev/null 2>&1
}

test_jobs_running() {
  expect "jobs_running: running + không restart => ổn định" jobs_scenario stable
  if jobs_scenario looping; then fail "jobs_running: restart count tăng => không ổn định"; else pass "jobs_running: restart count tăng => không ổn định"; fi
  if jobs_scenario stopped; then fail "jobs_running: không running => fail"; else pass "jobs_running: không running => fail"; fi
}

# --- Container tạm luôn bị xoá khi docker cp lỗi (MINOR-3) ---
test_gate_removes_temp_container() {
  local rc=0
  : > "$WORK/calls"
  mkdir -p "$WORK/gate"
  set +e
  (
    DRY_RUN=false TARGET_ENV=staging TARGET_IMAGE="$IMAGE" TMP_DIR="$WORK/gate"
    list_applied_migrations() { : > "$1"; }
    docker() {
      echo "docker $*" >> "$WORK/calls"
      case "$1" in
        create) echo cid123 ;;
        cp) return 1 ;;
      esac
    }
    gate_high_risk_migrations
  ) > /dev/null 2>&1
  rc=$?
  set -e
  expect "docker cp lỗi => dừng deploy" test "$rc" != 0
  expect "docker cp lỗi => container tạm vẫn bị xoá" grep -q 'docker rm -f cid123' "$WORK/calls"
}

make_migrations
test_find_high_risk
test_gate
test_args
test_args_release_sha
test_dry_run_order staging
test_dry_run_order production
test_production_checks_staging_history
test_release_layout
test_activate_restore_prune
test_require_staging_passed
test_deploy_rollback
test_jobs_running
test_gate_removes_temp_container

if [[ $FAILURES -gt 0 ]]; then
  printf '%s test FAIL\n' "$FAILURES"
  exit 1
fi
printf 'Tất cả test PASS\n'
