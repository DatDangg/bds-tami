Agent: reviewer

# Review — build/tami-website · layer-6-task-01 · phần B (server + close-out) · round 5

- Review level: **NORMAL**
- Reason: diff phần B chỉ đổi tài liệu (runbook §9 bước 12, task files L6/L12/L15, run journal), không đổi code/schema/API. Code deploy (`scripts/deploy/*`) đã qua STRICT round 4. Việc chính là đối chiếu AC ↔ evidence và độ chính xác của runbook so với code, không có rủi ro đỏ mới trong diff.
- Blast radius: `docs/runbooks/deploy.md` (người vận hành staging/prod làm theo); `tasks/tami-website/layer-6-task-01.md` (đóng task, các AC chưa làm); `tasks/tami-website/layer-12-task-01.md`, `layer-15-task-01.md` (nơi nhận các mục hoãn). Nếu chuyển thiếu thì mất AC trước M3/M5.

## Verify commands + result
- `bash scripts/deploy/deploy.test.sh` → **Tất cả test PASS** (gồm các case rollback: compose up lỗi → exit 1; rollback lỗi → exit 3).
- `pnpm lint/typecheck/test/build`: skip, không đổi code (phần A đã PASS: 141 file / 1.538 test).
- Không ssh server (theo chỉ dẫn). Evidence server lấy từ run journal + task file, reviewer không kiểm chứng trực tiếp được.

## Runbook bước 12, kiểm với code: ĐÚNG
- `compose()` (`scripts/deploy/deploy.sh:125-127`) luôn dùng `--env-file "$ENV_FILE"`; `rollback_to_previous` (`deploy.sh:227-236`) chỉ đổi `ACTIVE_IMAGE` + `restore_release_link` rồi gọi lại `compose up`/`wait_for_health`/`jobs_running`, nên dùng cùng `ENV_FILE`, cùng `HEALTH_RETRIES`/`HEALTH_INTERVAL` của tiến trình. Env hỏng thì rollback cũng hỏng, rơi vào `exit "$ROLLBACK_FAILED_EXIT"` (`deploy.sh:286`, test khẳng định là 3). Lập luận đúng. Cách cũ `HEALTH_RETRIES=2` cũng có rủi ro làm rollback fail vì app trước khởi động chậm, nên bỏ đi là đúng.
- "Kỳ vọng exit 1": `die "deploy thất bại, ĐÃ quay về image trước"` (`deploy.sh:284`, `die` → exit 1 ở `deploy.sh:60`). Đúng.
- "`current` quay về release trước, app về image trước": `restore_release_link` (`lib/release.sh:37-51`) trả symlink về `PREVIOUS_RELEASE`, compose vẫn đọc qua `current`; image lấy từ `$STATE_DIR/staging.current` (`deploy.sh:179-187`). Đúng.
- "cần ít nhất một release staging đã deploy thành công": khớp `read_previous_image` (không có image trước thì không rollback được, `deploy.sh:228-231`). Hiện đã có b936204, nên điều kiện đã thỏa.

## Đối chiếu Acceptance Criteria (task dòng 46-62 + follow-up 124-139)

| AC | Trạng thái | Chứng cứ / nơi nhận |
|---|---|---|
| L47 siteName trước privacy, lỗi rõ, seed sample chặn prod | Done | phần A r4; journal 21:05 user điền siteName |
| L48 G10 báo động staging | Done (quyết định) | user: không backup/alert tới M3 (journal 11:40, runbook:278) |
| L48 đối chiếu `budget.ts` trước khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` **production** | Không ghi | Không có trong Feature Verification, L15 chỉ có "Q6 hạn mức Claude API" chung chung (MINOR-2) |
| L49 backup lần đầu (stanza, restic init, digest/ldd, `HEARTBEAT_URL_WAL`, MINOR-A e2e `ARG POSTGIS_IMAGE`) | Hoãn, nhưng **sai nơi nhận** | Feature Verification ghi "backup/G10 → L12", trong khi user chốt staging không backup. Backup production nằm ở L15:47 nhưng các chi tiết cụ thể chưa chuyển (MAJOR-1) |
| L50 rollback qua `current` + assert test | Done | `lib/release.sh:48-50`, deploy.test.sh PASS |
| L50 xác minh postgres không bị recreate khi đổi release (MINOR-2 cũ) | **Thiếu evidence** | journal `next` cũ có bước "(5) kiểm postgres không bị tạo lại", không thấy kết quả. Đổi release 0dfc8f9→b936204 đã xảy ra nên kiểm được (MAJOR-1) |
| L50 required reviewers, default branch staging, secrets | Done | journal 18:30, 19:55 |
| L51 pin SHA · L52 seed/ trong image | Done | phần A r4 |
| L53 `nginx -v`, `docker version` | Done | journal 11:00 (nginx 1.24, Docker 29.7) |
| L53 Origin Pulls, smoke 2 IP qua Cloudflare | Hoãn → L15:176 | OK |
| L54/L55 cache rules Cloudflare | Hoãn → L15:176 | OK |
| L56 xác nhận từng bước | Done | journal |
| L57 compose `tami-staging-*`, chỉ app 127.0.0.1:3011 | Done | journal 19:55 |
| L58 `nginx -t` rồi reload, không sửa site khác | Done | journal 15:00/15:20 |
| L58 **"chỉ nhận IP Cloudflare"** | **Rơi mất** | sslip không qua CF nên không làm được, và L15:176 không liệt kê allowlist IP Cloudflare ở nginx (MAJOR-1) |
| L59 chặn công khai + noindex + robots | Done (basic auth thay CF Access) | 401 + X-Robots-Tag + robots Disallow |
| L59 DNS / SSL Full Strict | Hoãn → L15:176 | OK |
| L60 CD chạy thật → health 200 | Done | b936204 |
| L60 thử rollback có evidence | Hoãn → L12 follow-up | user duyệt (journal 21:40), follow-up rõ ràng và đúng cách. **Hợp lệ.** Duyệt chưa ghi vào `approvals` (MINOR-3) |
| L61 seed nền + `--sample` chỉ staging | Done | journal 19:55, 20:45; exit 1 lần đầu → L12 điều tra |
| L62 trang mở được: dự án, tin tức, tuyển dụng | Done (qua tunnel) | journal 20:50 |
| L62 **dịch vụ** | Giải thích được | mẫu ở trạng thái draft, chưa có trang danh sách |
| L62 **pháp lý** | **Rơi mất** | `/chinh-sach-bao-mat` 404 (chưa publish), không chuyển đi đâu, không nêu lý do chấp nhận (MAJOR-1) |
| Follow-up G17 kiểm trang lỗi gốc có hotline **trên image staging** (cả runbook bước 13) | **Rơi mất** | code có (Dockerfile:40-42, deploy.yml:75), chưa có evidence staging, chưa chuyển (MAJOR-1) |
| Follow-up G18 importMap CI | Done | phần A |
| Follow-up G18 kiểm upload source map GlitchTip thật | **Rơi mất** | không có trong Done/Hoãn, L12/L14/L15 không nhận (MAJOR-1) |
| Follow-up G20/G21 | Done | phần A + CI |
| Follow-up G24 ghi rõ lần đầu không có image trước để rollback | Done một phần | runbook bước 12 + mục Hoãn |
| Follow-up L6-T09 `TRUST_CF_CONNECTING_IP` | Hoãn → L15:176 | OK |
| Follow-up L6-T07 bản đồ `/lien-he` | Hoãn → L12 follow-up | OK |

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ tài liệu).

## Skill gates
- aislop: N/A, không có code trong diff.
- oxlint (anti-slop): N/A, không có diff TS/JS.
- ocr (open-code-review): skip, chỉ có diff tài liệu.
- AI-readable: OK. Runbook bước 12 nêu rõ lý do và trỏ đúng tên hàm.
- ai-friendly-web: N/A, staging noindex nội bộ.
- blitzstrike: N/A, không phải STRICT.

## Findings

### [MAJOR-1] Close-out còn AC/follow-up không Done mà cũng không có nơi nhận ("rơi mất")
`tasks/tami-website/layer-6-task-01.md:84-90` (Feature Verification) không nhắc tới các mục sau:
1. AC L62 "pháp lý mở được": `/chinh-sach-bao-mat` 404 vì chưa publish. siteName đã điền nên publish được ngay. Cách xử lý: publish rồi kiểm 200, hoặc ghi Hoãn kèm lý do và chỗ nhận.
2. Follow-up G17 (dòng 126) + runbook bước 13 "trang lỗi gốc có số hotline" chưa có evidence trên image staging. Cách xử lý: kiểm (biến `NEXT_PUBLIC_HOTLINE` đã đặt chưa, nếu rỗng thì ghi rõ), hoặc chuyển sang L12.
3. Follow-up G18 (dòng 128) kiểm upload source map GlitchTip thật: không có trong Done/Hoãn. Cách xử lý: chuyển sang L12 (bật giám sát) và ghi vào mục Hoãn.
4. AC L58 "nginx chỉ nhận IP Cloudflare" không có trong danh sách L15:176. Cách xử lý: thêm "nginx allowlist IP Cloudflare (`real_ip`/`allow`) cho host staging/prod bản CF".
5. AC L50 xác minh postgres không bị recreate khi đổi release: chưa có evidence, dù đổi release 0dfc8f9→b936204 đã xảy ra. Cách xử lý: ghi kết quả (`docker inspect tami-staging-postgres` `.Created`/`.State.StartedAt` so với giờ deploy b936204), hoặc chuyển sang L12 kèm rollback drill.
6. AC L49 backup: mục Hoãn ghi "→ layer-12-task-01", nhưng user đã chốt staging không backup. Backup production ở L15:47 lại chưa có các chi tiết của L49 (stanza-create, restic init, kiểm digest `postgis/postgis:17-3.5` + `ldd --version`, `HEARTBEAT_URL_WAL`, MINOR-A e2e đọc `ARG POSTGIS_IMAGE`). Cách xử lý: sửa nơi nhận thành L15 và chép đủ các chi tiết đó vào follow-up L15.

### [MINOR-1] Runbook bước 12: commit làm hỏng health phải qua được CI
`docs/runbooks/deploy.md:265-266`: CD chỉ chạy khi CI xanh (`workflow_run`). Nếu có test unit/integration cho `/api/health` thì commit cố ý làm hỏng sẽ bị CI chặn, drill không chạy được. Nên ghi thêm: làm hỏng chỉ ở runtime (vd endpoint trả 500 mà không có test nào bắt), commit không kèm migration, và production job không promote (production đòi digest có trong `staging.history`, deploy fail thì không ghi vào đó). Phần đó đúng sẵn, chỉ cần nêu ra.

### [MINOR-2] Đối chiếu ngân sách dịch production (AC L48 phần 2) chưa có chỗ nhận rõ
Thêm vào L15 follow-up: "đối chiếu `src/lib/translation/budget.ts` trước khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` production".

### [MINOR-3] Duyệt hoãn rollback drill chưa vào `approvals`
`.context/runs/build-tami-website-layer-6-task-01.md:20`: thêm `{gate: rollback_drill_defer, at: 2026-10-18T21:40Z, ok: true, note: "hoãn tới lần deploy staging thật kế tiếp, trước M5 → L12-T01"}`. Hiện chỉ có trong History.

## Residual risk
- Evidence server (rate limit, 401/HSTS, staff=1, 6 dự án) chỉ dựa trên journal do primary ghi, reviewer không kiểm chứng trực tiếp.
- Trang được kiểm qua tunnel 127.0.0.1:3011, bỏ qua nginx. Đường qua domain chỉ được kiểm ở mức 401/header.
- Nguyên nhân seed `--sample` exit 1 lần đầu chưa rõ (đã chuyển sang L12).

## Verdict: FAIL
Runbook bước 12 đúng với code và việc hoãn rollback drill hợp lệ. Nhưng close-out còn 6 mục AC/follow-up không Done cũng không có nơi nhận (MAJOR-1). Bổ sung evidence hoặc chuyển đúng nơi (L12/L15) rồi review lại round 6.
