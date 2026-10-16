Agent: reviewer

# Review — build-tami-website layer-1 task-07 (Payload Jobs + email Brevo) — round 2

- Review level: **STRICT**
- Reason: worker cron/job dùng chung cho ~10 task sau; gửi SMTP ra ngoài; input job chứa PII; migration DB mới; env mới dùng ở mọi process.
- Blast radius: `scripts/jobs-runner.ts` (`pnpm jobs`), `src/jobs/*` (run-loop, task gửi email, jobsConfig), `src/lib/email/*`, `src/payload.config.ts` (email adapter + jobs cho cả app và runner), `src/lib/env.ts` + `.env.example`, bảng `payload_jobs`/`payload_jobs_log` (migration `20261016_102520_jobs_queue`), dep `@payloadcms/email-nodemailer@3.91.0`. Downstream: layer-2-task-07, layer-3-task-03, layer-6-task-08/09, layer-7-task-01, layer-9-*, layer-16-task-01.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 29 files / 300 tests (round 1: 293; +7 test mới cho runJobsWorker / allowlist / cancel) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff không đụng UI.

## Skill gates
- aislop: skip, không nằm trong verify commands được allow.
- oxlint: skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — hàm < 50 dòng, file < 300 dòng, comment nêu WHY (vì sao await top-level, vì sao silent.error); 0 indicator đáng kể.
- ai-friendly-web: N/A (không public-facing).
- blitzstrike: skip, không có môi trường được phép.

## Kiểm lại CRITICAL-1 và MINOR round 1
- **CRITICAL-1 — đã đóng.** `node_modules/payload/dist/bin/index.js:91` `await import(script)`: dynamic import chỉ resolve khi module evaluation (kể cả top-level await) hoàn tất, nên `process.exit(0)` (dòng 68) chỉ chạy sau khi `runJobsWorker` resolve (`scripts/jobs-runner.ts:21`) và script đã `payload.destroy()` (dòng 23). Nhánh `run` trả `{}` nên bin không gọi `destroy()` lần hai -> không double-destroy. Lỗi trong script -> bin `exit(1)` (dòng 92-95), hợp lệ.
  - Process sống thật: Promise treo không tự giữ event loop, nhưng giữa các vòng luôn có `setTimeout` ref'd (`run-loop.ts:27`) và trong vòng có socket DB -> không rơi vào "unsettled top-level await". Khớp smoke của builder (> 27s, xử lý job queue từ process khác).
  - Không chạy chồng: vòng mới chỉ được lên lịch ở cuối `tick()` sau khi vòng cũ xong; `stop()` set `stopped`, clear timer, `await current`. Stop giữa lúc chờ timer -> `current` là vòng đã xong; stop giữa vòng -> chờ vòng xong và vòng đó không lên lịch tiếp. Không có đường claim job rồi bỏ dở do code (chỉ có thể do SIGKILL từ ngoài — xem MINOR-A).
  - Test: `run-loop.test.ts:52-89` chứng minh không resolve trước tín hiệu, resolve sau SIGINT/SIGTERM, không chạy thêm vòng, và chờ vòng đang chạy. Signal OS thật trên Windows chưa kiểm (residual).
- MINOR-2 (APP_ENV quên đặt): `findEmailConfigProblems` (`src/lib/email/allowlist.ts:37-51`) — cách thu hẹp hợp lý: staging chạy `NODE_ENV=production` + `APP_ENV=staging` là hợp lệ nên chỉ `development` (giá trị mặc định) mới là dấu hiệu quên; nhánh thứ hai bắt mọi môi trường không-prod thiếu allowlist (bao gồm cả trường hợp quên đặt APP_ENV ở prod mà không có allowlist). Chỉ log error không chặn khởi động — đúng hướng fail-safe. Follow-up bắt buộc env ở deploy đã ghi `layer-3-task-03.md:106`. OK.
- MINOR-3: ZodError -> `JobCancelledError` (`send-notification-email.ts:83-90`), không lộ input trong message; integration test xác nhận `error.cancelled=true`, `hasError=true` (`tests/integration/jobs-email.test.ts:127-129`). OK.
- MINOR-4: follow-up PII job lỗi đã ghi `layer-9-task-06.md:94`. OK.
- MINOR-5: `LANGUAGE_LABEL` gom về `templates/layout.ts:28`; `isEmailTemplateName` đã bỏ. OK.
- MINOR-6: dùng `signals.once`. OK.

## Findings

### [MINOR-A] Thời gian dừng có thể vượt grace period của container
- `src/jobs/run-loop.ts:23,59`: SIGTERM chờ hết vòng hiện tại; `jobs.run` mặc định tới 10 job, mỗi job một giao dịch SMTP. Docker mặc định SIGKILL sau 10s -> có thể giết giữa job đã claim (`processing=true`).
- Đề xuất (không chặn): ghi vào layer-3-task-03 đặt `stop_grace_period` (vd 60s) cho service `jobs`; cân nhắc đặt timeout kết nối/gửi cho transport nodemailer.

### [MINOR-B] Tín hiệu thứ hai trong lúc đang dừng
- `run-loop.ts:55-58`: sau SIGINT đầu, listener SIGINT bị gỡ -> Ctrl+C lần 2 kill ngay (hành vi chuẩn, chấp nhận được); listener SIGTERM còn lại thì nuốt SIGTERM tiếp theo (no-op). Không ảnh hưởng đúng đắn; chỉ ghi nhận.

## Doc impact
ARCHITECTURE §5.4 / runbook: cách chạy worker (`pnpm jobs`, dừng bằng SIGTERM, chờ vòng xong) + `APP_ENV`/`EMAIL_ALLOWLIST` — đã có follow-up ở layer-3-task-03; primary xác nhận trong close-out.

## Residual risk
- Signal OS thật (SIGTERM từ Docker trên Linux) chưa kiểm; chỉ kiểm bằng EventEmitter giả + smoke Windows của builder.
- Gửi SMTP Brevo thật (587 STARTTLS) chưa kiểm.
- Hành vi Payload 3.91 với job kẹt `processing=true` sau SIGKILL chưa xác minh.

## Verdict
**PASS** — CRITICAL-1 đã đóng có test; MINOR round 1 đã xử lý hoặc có follow-up; chỉ còn 2 MINOR không chặn.
