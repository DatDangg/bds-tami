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
