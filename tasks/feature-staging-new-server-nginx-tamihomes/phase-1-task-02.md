# feature-staging-new-server-nginx-tamihomes · phase-1-task-02 — Giữ cổng "production chỉ nhận digest đã qua staging" khi staging và production ở 2 server khác nhau (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: không (song song được với task-01 — khác file). **Phải xong + merge TRƯỚC phase-2-task-03 (đổi `DEPLOY_HOST` staging).**
- Trạng thái: `in_progress` — user chọn **phương án A** (2026-11-06).

## Vấn đề (phát hiện khi lập plan, 2026-11-06)
`deploy.sh production` (server cũ) chỉ nhận cặp digest + SHA có trong `/opt/tami/state/staging.history` **trên chính server production**
(`scripts/deploy/lib/release.sh:75-90`, ghi bởi `scripts/deploy/lib/state.sh:20` khi staging deploy thành công).
Khi `DEPLOY_HOST` của Environment `staging` chuyển sang 179.197.242.57, `staging.history` chỉ được ghi trên server MỚI
→ server cũ không bao giờ thấy commit mới → **mọi lần bấm "Deploy production" sau khi chuyển đều bị từ chối**.

## Phương án (user chọn)
- **A (đề xuất):** `deploy.yml` thêm job `record-staging-pass` (sau `deploy-staging` thành công, `environment: production`, cùng secret SSH production) chạy
  `deploy.sh record-staging --image <repo>@<digest> --release-sha <sha>` trên server production: chỉ append dòng `<digest> <time> <sha>` vào `staging.history`
  (validate định dạng digest/SHA, flock chung, không pull/không đổi container). Giữ nguyên lớp kiểm ở server production.
  Rủi ro: job chạy với secret production ngay trên push `staging` (đã điều kiện `workflow_run` + `head_repository` như job build). Nếu Environment `production` có giới hạn branch thì phải cho `staging`.
- **B:** tạm thời không deploy production cho tới khi production cũng chuyển server (ngoài scope) — không đổi code; ghi rõ trong runbook. Rủi ro: hotfix production bị chặn.
- **C:** `deploy-production.yml` kiểm qua GitHub API rằng run `Deploy` cho SHA đó có job `deploy-staging` success, rồi truyền cờ bỏ qua kiểm `staging.history` — **không đề xuất** (bỏ lớp bảo vệ phía server).

## Classification / Risk (phương án A)
- Type: MODIFY pipeline deploy.
- Risk: **HIGH** — cổng production, secret SSH production, script chạy root-tương-đương docker.
- Expected review level: **STRICT**.
- Files: `.github/workflows/deploy.yml`, `scripts/deploy/deploy.sh` (subcommand/`--record-only`), `scripts/deploy/lib/state.sh`, `scripts/deploy/deploy.test.sh` (test: ghi đúng dòng, từ chối digest/SHA sai định dạng, không gọi docker, giữ lock), `docs/runbooks/deploy.md` §1 + §11.

## Verify
- `bash scripts/deploy/deploy.test.sh` PASS (thêm ca mới).
- `actionlint` (nếu có) / đọc lại YAML; `deploy.sh record-staging ... --dry-run` in đúng.
- Sau phase-2-task-03: run Deploy thấy job `record-staging-pass` xanh; `tail -1 /opt/tami/state/staging.history` trên server cũ = digest + SHA mới.

## Acceptance
- [ ] Sau khi chuyển staging, "Deploy production" commit đã qua staging mới vẫn được server cũ nhận; commit chưa qua staging vẫn bị từ chối.
- Doc impact: `docs/runbooks/deploy.md` §1/§11; ARCHITECTURE §6.4 nếu mô tả luồng.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decision log (builder, 2026-11-06) — phương án A
- `deploy.sh record-staging --release-sha <sha> --image <repo>@<digest> [--dry-run]`: nhánh riêng trong `main`, trước `parse_args`; không preflight, không docker, không `check_release_layout`.
  Hàm `record_staging_pass` ở `lib/state.sh`: flock `deploy.lock` chung (cùng LOCK_WAIT_SECONDS), append `<digest> <UTC> <sha>`.
- Idempotency: **bỏ qua nếu đã có đúng cặp digest+SHA** (không dòng trùng) — giữ vị trí dòng đầu nên `history_line_of`/so sánh "cũ hơn" không đổi; staging = production cùng server vẫn vô hại.
- Không upload release vào `releases/production/<sha>` (tránh rác release + không đụng `current`): action `ssh-deploy` thêm input `mode` (deploy|record-staging); record-staging đẩy `scripts/deploy` vào thư mục tạm `$ROOT/state/.record.*` (xoá bằng trap) rồi chạy `deploy.sh record-staging`.
  Chỉ cho environment `production`; host key pin cứng, secret không vào argv/log; `registry-user/token` chuyển thành `required: false`.
- `deploy.yml`: job `record-staging-pass` (`needs: [build, deploy-staging]`, `success()` + guard push/staging/không fork, `environment: production`, checkout head_sha).
- Không dùng `concurrency` cho job record (pending bị huỷ sẽ mất bản ghi); ghi flock đảm bảo atomic. Rủi ro: 2 run liên tiếp ghi lệch thứ tự → production báo "cũ hơn" → `--allow-older` tay (đã ghi runbook §1).
- Docs: chỉ `docs/runbooks/deploy.md` §1 (sơ đồ + bullet "Hai server"); §11 do task-01.

## Evidence / verification
- `bash scripts/deploy/deploy.test.sh` → "Tất cả test PASS" (Git Bash; thêm 20 ca `record-staging`: dòng đúng, không trùng, không docker, flock được gọi, không file lạ, từ chối image/SHA sai, dry-run không ghi, production chấp nhận dòng đã ghi). Ca "lock bị giữ => die" SKIP trên Windows (không có flock), KHÔNG workflow nào chạy deploy.test.sh; follow-up: chạy `bash scripts/deploy/deploy.test.sh` từ bản copy tạm trên server Linux thật ở phase-2-task-01.
- `bash -n` OK; shellcheck/actionlint không có trên máy — YAML 2 file parse OK (yaml@1.10.3), đã đọc lại bằng mắt.
- Chưa chạy trên server/GitHub thật (không đụng server). Cần: Environment `production` cho phép nhánh `staging`; sau phase-2-task-03 kiểm `tail -1 /opt/tami/state/staging.history` trên server cũ.
