# shellcheck shell=bash
# Ghi/đọc trạng thái deploy và dọn image cũ — source từ deploy.sh.
# Cần: log, DRY_RUN, STATE_DIR, TARGET_ENV, TARGET_IMAGE, RELEASE_SHA, PREVIOUS_IMAGE.

write_state_atomically() {
  local name="$1" value="$2"
  printf '%s\n' "$value" > "$STATE_DIR/$name.tmp"
  mv "$STATE_DIR/$name.tmp" "$STATE_DIR/$name"
}

# staging.history: "<digest> <thời điểm> <sha>" — gắn digest với commit đã build; production đối chiếu cả hai.
record_success() {
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] ghi state %s.current/.previous (staging: thêm staging.history digest+SHA)\n' "$TARGET_ENV"
    return 0
  fi
  if [[ -n $PREVIOUS_IMAGE ]]; then write_state_atomically "$TARGET_ENV.previous" "$PREVIOUS_IMAGE"; fi
  write_state_atomically "$TARGET_ENV.current" "$TARGET_IMAGE"
  if [[ $TARGET_ENV == staging ]]; then
    printf '%s %s %s\n' "${TARGET_IMAGE#*@}" "$(date -u +%FT%TZ)" "$RELEASE_SHA" >> "$STATE_DIR/staging.history"
  fi
}

# Chế độ record-staging (BL-111): dành cho khi staging và production ở 2 server khác nhau (staging.history của server production không còn do deploy staging ghi).
# Từ BL-112 staging và production cùng máy nên không còn job CI nào gọi; đây là lệnh chạy tay (deploy.sh record-staging) trên server production: CHỈ thêm dòng
# "<digest> <thời điểm> <sha>" vào staging.history dưới khoá chung. Không docker, không pull, không đụng release/symlink/container.
# Đã có đúng cặp digest+SHA thì bỏ qua (không thêm dòng trùng): giữ nguyên vị trí dòng đầu => thứ tự "cũ hơn" trong history_line_of không đổi.
# Cần: log, die, DRY_RUN, STATE_DIR, LOCK_WAIT_SECONDS, TARGET_IMAGE, RELEASE_SHA.
record_staging_pass() {
  local digest="${TARGET_IMAGE#*@}" file="$STATE_DIR/staging.history"
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] (khoá %s/deploy.lock) thêm "%s <thời điểm> %s" vào %s nếu chưa có; không chạm docker/release\n' "$STATE_DIR" "$digest" "$RELEASE_SHA" "$file"
    return 0
  fi
  command -v flock > /dev/null || die "thiếu lệnh: flock"
  mkdir -p "$STATE_DIR"
  exec 9> "$STATE_DIR/deploy.lock"
  flock -w "$LOCK_WAIT_SECONDS" 9 || die "deploy khác đang chạy (khoá $STATE_DIR/deploy.lock)"
  if awk -v d="$digest" -v s="$RELEASE_SHA" '$1 == d && $3 == s { found = 1 } END { exit !found }' "$file" 2> /dev/null; then
    log "staging.history đã có digest $digest + SHA $RELEASE_SHA: bỏ qua"
    return 0
  fi
  printf '%s %s %s\n' "$digest" "$(date -u +%FT%TZ)" "$RELEASE_SHA" >> "$file"
  log "đã ghi staging.history: $digest + SHA $RELEASE_SHA"
}

# Chỉ xoá image của repo tami (theo tên repo trong --image), giữ current + previous của CẢ HAI môi trường.
# Không `docker image prune` / `docker builder prune` toàn cục: server dùng chung với dự án khác.
prune_old_tami_images() {
  local repo="${TARGET_IMAGE%@*}" ref keep=" " f
  for f in staging.current staging.previous production.current production.previous; do
    if [[ -s $STATE_DIR/$f ]]; then keep+="$(< "$STATE_DIR/$f") "; fi
  done
  if [[ $DRY_RUN == true ]]; then
    printf '[dry-run] xoá image %s@sha256:* ngoài current/previous của staging+production\n' "$repo"
    return 0
  fi
  while read -r ref; do
    if [[ $ref != *@sha256:* || $keep == *" $ref "* ]]; then continue; fi
    if docker image rm "$ref" > /dev/null 2>&1; then log "đã xoá image cũ $ref"; fi
  done < <(docker image ls --digests --no-trunc --format '{{.Repository}}@{{.Digest}}' "$repo")
}
