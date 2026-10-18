Agent: reviewer

# Review: feature-backup-base-image-debian12 · phase-1-task-01 · round 3

- **Review level:** STRICT, phạm vi hẹp (chỉ kiểm phần sửa sau round 2)
- **Reason:** runbook thao tác DB production (đổi image postgres trên volume có dữ liệu, có rollback khi postgres đã dừng). Spec test-scope bàn giao cho template test. Round 2 còn MAJOR-A.
- **Blast radius:** `docs/runbooks/postgres-base-image.md` §2/§5/§6 (operator staging/prod), `docs/runbooks/restore.md` khối quy ước đầu file (mọi lệnh `$C` của runbook backup prod), `spec/test-scope/current.json` (template test). Không đổi code chạy. `deploy.sh`/compose giữ nguyên từ round 2.

## Verify commands + kết quả

| Lệnh | Kết quả |
|---|---|
| `bash scripts/deploy/deploy.test.sh` | PASS ("Tất cả test PASS"), nhóm guard postgres vẫn xanh |
| `node -e JSON.parse(spec/test-scope/current.json)` | PASS, JSON hợp lệ |
| `git diff --stat` / `git diff docs/runbooks/restore.md` / `git show HEAD:docs/runbooks/restore.md` | Diff chỉ gồm các file đã biết của task. Dòng `restore.md:10` (`export TAMI_IMAGE`) là dòng mới. `restore.md:48` có từ trước (HEAD:45) |
| Grep `docs/` theo `$ENV.env`, `$E.env`, `docker-compose.$ENV`, `production.env`, `docker-compose.production` | Trong `postgres-base-image.md`: 0 kết quả. Chỉ còn `restore.md:48` (có từ trước, xem MINOR-D) |
| e2e, docker build | Không chạy lại. Round 3 chỉ sửa doc/JSON |
| pnpm lint/typecheck/test/build | skip, diff không có code app TS/JS |

## Responsive Checklist Gate
N/A. Diff không đụng UI.

## Skill gates
- aislop: N/A, không có code app.
- oxlint (anti-slop): N/A, không đụng TS/JS.
- ocr: skip, ocr chưa cài.
- AI-readable: OK. Biến `ENVF`/`CF` có comment giải thích (tên file thật `prod.env`/`docker-compose.prod.yml`). 0 indicator mới.
- ai-friendly-web: N/A.
- blitzstrike: N/A.

## Trạng thái finding round 2

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-A runbook prod sai env/compose | **Đã đóng** | `postgres-base-image.md:50-53` đặt `ENVF`/`CF`/`PG` theo `$ENV`. Giá trị khớp `deploy.sh:107-121`: staging = `staging.env` + `docker-compose.staging.yml` + `tami-staging-postgres`, production = `prod.env` + `docker-compose.prod.yml` + `tami-postgres`. `C` dựng từ `$ENVF` + `$R/docker/$CF`. `U`/`DB` đọc `"$ENVF"`, có báo `THIẾU env file`. Khi thiếu biến thì rơi về `tami`, giống mặc định `${POSTGRES_USER:-tami}` / `${POSTGRES_DB:-tami}` của compose staging/prod. Rollback `:208` dùng `--env-file "$ENVF" -f /opt/tami/releases/$ENV/$OLD_SHA/docker/$CF`, đúng cả hai môi trường. `TAMI_IMAGE` lấy từ `/opt/tami/state/$ENV.current`, khớp `deploy.sh:28` (`STATE_DIR=$TAMI_ROOT/state`) và `lib/state.sh:18`. Không còn đường dẫn sai nào trong file |
| MINOR-B test-scope mô tả guard cũ | **Đã đóng** | `current.json:53` mô tả đủ 4 nhánh: image khác thì die; không container nhưng có volume `<project>_postgres-data` thì die, trừ khi `PG_IMAGE_SWITCH_CONFIRMED=1`; không có cả hai thì cho chạy; dry-run không gọi docker. `spec/updates/…:10` mô tả ở mức yêu cầu, không có câu sai |
| MINOR-C `volume inspect` lỗi coi như không có volume | Chấp nhận (residual) | Không đổi. Rủi ro thấp như round 2 |
| MINOR-6 CI bullseye | Chưa ghi BACKLOG | Change-request cam kết thêm dòng BACKLOG ở close-out. **Điều kiện close-out:** phải có dòng này trước khi commit |

## Biến dùng ở các khối sau (đã kiểm)
- §3.x và §4 dùng `$C $PG $U $DB $OUT`, đều đặt ở §2. `$AMCHECK_SQL` đặt ở §3.6, §4 và §5 tham chiếu đúng.
- §3.8 tự đặt `$DIGEST`. `$SHA`, `$R`, `$ENV`, `$TAMI_IMAGE` đặt ở §2.
- §6 dùng `$R $SHA $DIGEST $TAMI_IMAGE`. Có ghi chú "xem §3.8".
- §5 dùng `$ENVF $CF $ENV $C $PG`. Khối dev không có `ENVF`/`CF`, nhưng §5 có ghi rõ "dev: bỏ qua, checkout commit cũ rồi dùng $C".
- `restore.md:10`: `E=production` → `/opt/tami/state/production.current`, đúng tên file của `lib/state.sh` (`$TARGET_ENV.current`, TARGET_ENV=production). `C=` dòng 11 dùng `prod.env`/`docker-compose.prod.yml`, đúng.

## Findings mới (round 3)

### [MINOR-D] (có từ trước, ngoài scope) `docs/runbooks/restore.md:48` ghi vào `/opt/tami/$E.env`, tức `/opt/tami/production.env`
`echo "BACKUP_ENV_DIR=$BK" >> /opt/tami/$E.env` với `E=production` sẽ tạo file lạ `production.env`. Biến không vào `prod.env`, nên `compose config` báo thiếu `BACKUP_ENV_DIR`. Lỗi này lộ ra ngay, không âm thầm. Dòng đã có ở HEAD (dòng 45), diff task này không đụng. Cùng loại lỗi với MAJOR-A nên ghi lại.
**Fix đề xuất:** đổi thành `/opt/tami/prod.env`. Có thể sửa luôn ở close-out (1 dòng doc), hoặc ghi BACKLOG riêng. Không chặn PASS.

## Residual risk
- Chưa chạy trên staging/prod thật: thời gian REINDEX và lượng WAL khi `archive_mode=on` chưa đo.
- Lấy `U`/`DB` bằng `grep | cut` không bỏ dấu nháy. Nếu env file viết `POSTGRES_USER="x"` thì kết quả khác với cách compose đọc. Hiện env thường không có nháy, rủi ro thấp.
- MINOR-C và MINOR-6 vẫn là residual. MINOR-6 phải ghi vào BACKLOG trước commit.

## Verdict
**PASS.** MAJOR-A đã đóng: §2 và rollback §5 dùng đúng `prod.env`/`docker-compose.prod.yml`/container theo `deploy.sh`, và không còn đường dẫn sai trong `postgres-base-image.md`. MINOR-B đã đóng. `deploy.test.sh` PASS, JSON hợp lệ. Không còn CRITICAL/MAJOR. Điều kiện close-out: ghi dòng BACKLOG cho MINOR-6. Nên sửa luôn MINOR-D.
