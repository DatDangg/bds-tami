Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-1-task-02 · round 1 (BL-111, phương án A)

- **Review level:** STRICT
- **Reason:** cổng production (`require_staging_passed`), dùng secret SSH của Environment `production` trên trigger push `staging`, script chạy trên server production (user có quyền docker), shared composite action `ssh-deploy` dùng bởi cả `deploy.yml` lẫn `deploy-production.yml`.
- **Blast radius:** `.github/workflows/deploy.yml` (job mới `record-staging-pass`), `.github/actions/ssh-deploy/action.yml` (dùng chung staging + production deploy), `scripts/deploy/deploy.sh` (dispatch `main`), `scripts/deploy/lib/state.sh` (`record_staging_pass`), `/opt/tami/state/staging.history` + `deploy.lock` trên server production, `docs/runbooks/deploy.md` §1. Không đụng app/API/DB/UI.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `bash scripts/deploy/deploy.test.sh` | PASS — "Tất cả test PASS", 20 ca `record-staging` PASS; ca "lock bị giữ => die" **SKIP** (Git Bash không có `flock`) |
| `bash -n` deploy.sh, lib/state.sh, lib/release.sh, deploy.test.sh | OK cả 4 |
| Mô phỏng remote step (cùng `remote_script` + `printf %q` + `tar \| bash -c`, stub flock, thư mục scratchpad) | Lần 1 ghi 1 dòng `<digest> <UTC> <sha>`; lần 2 cùng cặp → bỏ qua (vẫn 1 dòng); image có newline + dòng giả, image có khoảng trắng, `$(touch /tmp/pwn)` → rc=1, không thêm dòng, không thực thi; `state/` chỉ còn `deploy.lock staging.history` (thư mục `.record.*` đã bị trap xoá ở mọi ca) |
| YAML parse | **Không chạy được** (`yaml` không phải dep top-level của node, không có python) → đọc lại bằng mắt: thụt lề/khối `if: >-`, `with:` nhất quán; dựa thêm vào evidence builder (yaml@1.10.3 OK). Ghi Residual risk |
| shellcheck / actionlint | skip, chưa cài |

## Kiểm theo checklist yêu cầu
- **Trigger guard / lộ secret production:** `record-staging-pass.if` = `success()` + `event == 'push'` + `head_branch == 'staging'` + `head_repository.full_name == github.repository` — đúng như job `build` (conclusion=='success' được bao bởi `build` là `needs` + `success()`). Workflow `workflow_run` chỉ đọc từ nhánh mặc định; PR/fork không vào. OK.
- **Chỉ sau deploy-staging thành công:** `needs: [build, deploy-staging]` + `success()`. OK.
- **Chống chèn dòng:** `record_staging_main` kiểm `IMAGE_PATTERN` (`^ghcr\.io/…@sha256:[a-f0-9]{64}$`) + `SHA_PATTERN` (40 hex) trước khi ghi; regex bash `$` neo cuối chuỗi → newline/space bị từ chối (đã kiểm thực tế). Chỉ digest được ghi nên repo trong image không ảnh hưởng cổng (production tự kiểm image của nó). Action cũng kiểm SHA 40 hex + build job kiểm digest. OK.
- **Không docker/pull/container/symlink:** nhánh `record-staging` chạy trước `parse_args`/`configure_env`/preflight; test xác nhận không gọi docker, không tạo file ngoài `deploy.lock` + `staging.history`; action bỏ qua 2 step upload release/chạy deploy khi `mode != deploy`. OK.
- **flock chung:** `exec 9> "$STATE_DIR/deploy.lock"; flock -w "$LOCK_WAIT_SECONDS" 9` — cùng file, cùng thời gian chờ như deploy. Dedupe check + append nằm trong khoá. OK (ca lock-held chưa chạy thật — xem MINOR-2).
- **Temp dir / path safety remote:** `mktemp -d "$1/state/.record.XXXXXX"`, trap EXIT `rm -rf "$t"` đặt ngay sau mktemp, `set -euo pipefail`; tham số truyền vị trí qua `bash -c %q _ %q %q %q` (cùng pattern đã chạy ở step upload hiện hữu). OK.
- **Host key pin:** `StrictHostKeyChecking=yes` + `UserKnownHostsFile` + `IdentitiesOnly`/`BatchMode` giữ nguyên. OK.
- **Secret trong argv/log:** argv remote chỉ có deploy-root, SHA, image; không token (record mode không dùng registry). Key ở file 600, xoá ở step `always()`. OK.
- **`mode: deploy` không đổi hành vi:** 2 step cũ chỉ thêm `if: inputs.mode == 'deploy'`; default `deploy`. `registry-user/token` thành optional nhưng cả `deploy-staging` và `deploy-production.yml` (dòng 88-89) vẫn truyền; nếu thiếu, server fail-closed tại `deploy.sh:102` (`--registry-token-stdin cần --registry-user`). OK (xem MINOR-3).
- **deploy-production.yml:** không truyền `mode` → `deploy`; không ảnh hưởng. OK.
- **Dedupe vs thứ tự history:** bỏ qua khi đã có cặp → không đổi vị trí dòng; `history_line_of` lấy dòng CUỐI của digest nên không bị kéo "mới hơn". Race 2 run gần nhau có thể đảo thứ tự (không có concurrency) — đã ghi trong runbook §1, phương án thoát `--allow-older`. Chấp nhận được (MINOR-1).
- **Cùng server:** staging deploy ghi dòng qua `record_success`, record job sau đó thấy cặp → bỏ qua. Vô hại. OK.

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ CI/CD shell/YAML/runbook).

## Skill gates
- aislop: skip, `aislop` chưa cài (không có trong PATH).
- oxlint (anti-slop): N/A — diff không đụng TS/JS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`record_staging_main`, `record_staging_pass`), hàm < 50 dòng, không magic number mới, comment nêu WHY. 1 indicator: ARCHITECTURE §6.4 chưa cập nhật luồng (MINOR-4) → < 3, không FAIL.
- ai-friendly-web: N/A — không phải thay đổi public web.
- blitzstrike: skip, không cài / không có môi trường được phép.

## Findings
- **[MINOR-1]** `.github/workflows/deploy.yml:144` — job record không có hàng đợi; 2 push staging sát nhau có thể ghi history sai thứ tự → production báo "cũ hơn". Đã ghi runbook. Đề xuất (tuỳ chọn): `concurrency: { group: tami-record-staging, cancel-in-progress: false }` chấp nhận rủi ro mất bản ghi pending (re-run được), hoặc giữ như hiện tại.
- **[MINOR-2]** `scripts/deploy/deploy.test.sh` (ca "lock bị giữ => die") + task file Evidence dòng 50: evidence ghi "chạy trên Linux/CI" nhưng không workflow nào chạy `deploy.test.sh` (grep `.github/workflows` không thấy). Ca khoá chưa từng chạy thật. Sửa câu evidence cho đúng, hoặc chạy test trên Linux trước phase-2-task-03.
- **[MINOR-3]** `.github/actions/ssh-deploy/action.yml:61-64` — `mode: deploy` giờ không ép `registry-user/token` ở phía action; thiếu thì chỉ fail ở server sau khi đã upload release. Đề xuất thêm `[[ $MODE != deploy || ( -n $REGISTRY_USER && -n $REGISTRY_TOKEN ) ]]` ở step "Chuẩn bị SSH" để fail sớm.
- **[MINOR-4]** `docs/ARCHITECTURE.md:497` (as-built) — mô tả cổng production nhưng không nói `staging.history` trên server production nay do job `record-staging-pass` ghi (task tự liệt kê "ARCHITECTURE §6.4 nếu mô tả luồng"). Thêm 1 bullet khi close-out.
- **[MINOR-5]** `.github/workflows/deploy.yml:154` — `environment: production` khiến mỗi push staging tạo 1 deployment "production" trong lịch sử Environment (dễ nhầm là đã lên production); nếu Environment `production` có wait timer/branch policy thì job sẽ treo/bị chặn. Nêu rõ trong runbook §1 (branch policy đã ghi; thêm ghi chú lịch sử deployment).

## Residual risk
- YAML không parse được bằng tool trong môi trường reviewer; actionlint/shellcheck chưa chạy.
- Chưa chạy trên GitHub/server thật: login shell của `DEPLOY_USER` production phải hiểu quoting `$'…'` của `%q` (đã dùng sẵn ở step upload hiện hữu nên coi là đã chứng minh).
- Trust boundary: job chạy `scripts/deploy` + action của `head_sha` nhánh staging trên server production bằng key production, tự động. Không mới so với hiện trạng (trước đây staging và production cùng server, và người push staging đã kiểm soát được workflow vì nhánh mặc định là `staging`), nhưng đáng ghi nhận.
- Nếu deploy production giữ khoá > `LOCK_WAIT_SECONDS` (300s), record fail → production từ chối commit đó (fail-safe), cần Re-run — runbook đã ghi.

## Verdict
PASS — không có CRITICAL/MAJOR. 5 MINOR (không chặn); nên xử lý MINOR-2 (sửa câu evidence) và MINOR-4 (ARCHITECTURE) lúc close-out.
