# shellcheck shell=bash
# Release theo môi trường + SHA, và các chốt chặn trạng thái — source từ deploy.sh.
# shellcheck disable=SC2034 # COMPOSE_FILE được dùng bởi compose() trong deploy.sh
# Cần: log, die, DRY_RUN, TAMI_ROOT, STATE_DIR, TARGET_ENV, TARGET_IMAGE, RELEASE_SHA, REPO_DIR, ALLOW_OLDER, COMPOSE_NAME.
#
# Bố cục trên server (workflow upload mã vào thư mục BẤT BIẾN theo SHA, không bao giờ ghi đè release khác):
#   $TAMI_ROOT/releases/<env>/<sha>/{docker,scripts/deploy}   <- release của đúng commit
#   $TAMI_ROOT/releases/<env>/current -> <sha>                 <- đổi nguyên tử trong flock; compose đọc qua đường dẫn này
#                                                                  nên bind mount (./postgres/init.sql) không đổi giữa các lần deploy
# deploy.sh luôn chạy từ chính release của SHA đó => compose/config production = đúng commit đã được duyệt.

readonly SHA_PATTERN='^[a-f0-9]{40}$'
RELEASES_KEEP="${RELEASES_KEEP:-5}"
PREVIOUS_RELEASE=""
RELEASE_ACTIVATED=false

releases_dir() { printf '%s/releases/%s' "$TAMI_ROOT" "$TARGET_ENV"; }

# Script đang chạy PHẢI nằm đúng ở <root>/releases/<env>/<sha>: chặn chạy compose của release khác (SHA/môi trường lệch).
check_release_layout() {
  [[ $RELEASE_SHA =~ $SHA_PATTERN ]] || return 1
  [[ "$(realpath -- "$REPO_DIR")" == "$(realpath -m -- "$(releases_dir)/$RELEASE_SHA")" ]]
}

# Trỏ `current` sang release này (nguyên tử: symlink tạm + mv -T). Gọi TRONG flock.
activate_release() {
  local link
  link="$(releases_dir)/current"
  PREVIOUS_RELEASE="$(readlink "$link" 2> /dev/null || true)"
  ln -sfn "$REPO_DIR" "$link.tmp"
  mv -T "$link.tmp" "$link"
  RELEASE_ACTIVATED=true
  COMPOSE_FILE="$link/docker/$COMPOSE_NAME"
}

# Trả `current` về release trước khi deploy không thành công (compose phải khớp image đang chạy). Idempotent.
restore_release_link() {
  [[ $RELEASE_ACTIVATED == true ]] || return 0
  local link
  link="$(releases_dir)/current"
  if [[ -n $PREVIOUS_RELEASE ]]; then
    ln -sfn "$PREVIOUS_RELEASE" "$link.tmp"
    mv -T "$link.tmp" "$link"
  else
    rm -f "$link"
  fi
  RELEASE_ACTIVATED=false
  # Có release trước thì compose vẫn đọc QUA symlink `current` (vừa trả về release trước), giống lúc deploy: đường dẫn bind mount
  # (./postgres/init.sql ...) không đổi nên postgres không bị tạo lại khi rollback. Không có release trước (`current` đã xoá) thì dùng release này.
  if [[ -n $PREVIOUS_RELEASE ]]; then COMPOSE_FILE="$link/docker/$COMPOSE_NAME"; else COMPOSE_FILE="$REPO_DIR/docker/$COMPOSE_NAME"; fi
}

# Giữ RELEASES_KEEP release mới nhất + release `current`; xoá phần còn lại (không đụng thư mục lạ).
prune_old_releases() {
  local dir name cur count=0
  dir="$(releases_dir)"
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] đổi symlink current nguyên tử; giữ %s release mới nhất trong %s\n' "$RELEASES_KEEP" "$dir"
    return 0
  fi
  cur="$(readlink -f "$dir/current" 2> /dev/null || true)"
  while read -r name; do
    [[ $name =~ $SHA_PATTERN ]] || continue
    count=$((count + 1))
    if ((count <= RELEASES_KEEP)) || [[ "$(readlink -f "$dir/$name")" == "$cur" ]]; then continue; fi
    rm -rf -- "${dir:?}/$name" && log "đã xoá release cũ $name"
  done < <(ls -1t "$dir")
}

# Số dòng (1-based) của dòng CUỐI trong staging.history có digest này; rỗng nếu không có.
history_line_of() {
  grep -n "^$1 " "$STATE_DIR/staging.history" 2> /dev/null | tail -n1 | cut -d: -f1 || true
}

# Production chỉ nhận digest đã deploy THÀNH CÔNG ở staging (staging.history do chính script này ghi, dạng "<digest> <thời điểm> <sha>"),
# đúng release SHA, và không CŨ hơn digest production đang chạy (trừ --allow-older, chỉ dùng tay để rollback).
require_staging_passed() {
  [[ $TARGET_ENV == production ]] || return 0
  local digest="${TARGET_IMAGE#*@}" file="$STATE_DIR/production.current" current_digest target_line current_line
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] kiểm digest %s + SHA %s có trong %s/staging.history và không cũ hơn production.current\n' "$digest" "$RELEASE_SHA" "$STATE_DIR"
    return 0
  fi
  awk -v d="$digest" -v s="$RELEASE_SHA" '$1 == d && $3 == s { found = 1 } END { exit !found }' "$STATE_DIR/staging.history" 2> /dev/null ||
    die "digest $digest + SHA $RELEASE_SHA chưa từng deploy thành công ở staging: không promote production"
  if [[ $ALLOW_OLDER == true || ! -s $file ]]; then return 0; fi
  current_digest="$(< "$file")"
  current_digest="${current_digest#*@}"
  target_line="$(history_line_of "$digest")"
  current_line="$(history_line_of "$current_digest")"
  if [[ -n $current_line && $target_line -lt $current_line ]]; then
    die "digest $digest CŨ hơn production đang chạy ($current_digest). Rollback có chủ đích: thêm --allow-older (chỉ chạy tay)"
  fi
}
