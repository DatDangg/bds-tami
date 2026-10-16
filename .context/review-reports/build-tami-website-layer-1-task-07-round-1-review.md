Agent: reviewer

# Review — build-tami-website layer-1 task-07 (Payload Jobs + email Brevo) — round 1

- Review level: **STRICT**
- Reason: cron/job worker dùng chung cho ~10 task sau; gửi email ra ngoài (SMTP); input job chứa PII khách; migration DB mới; env mới dùng ở mọi process.
- Blast radius: `src/payload.config.ts` (email adapter + jobs cho cả web app và runner), `src/jobs/*`, `scripts/jobs-runner.ts` (`pnpm jobs`), `src/lib/email/*`, `src/lib/env.ts` + `.env.example` (APP_ENV/EMAIL_ALLOWLIST/SMTP_PORT/EMAIL_FROM_ADDRESS), bảng `payload_jobs` / `payload_jobs_log`, deps `@payloadcms/email-nodemailer@3.91.0` (nodemailer). Downstream: layer-2-task-07, layer-3-task-03, layer-6-task-08/09, layer-7-task-01, layer-9-*, layer-16-task-01.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 29 files / 293 tests; chạy riêng `tests/integration/jobs-email.test.ts` + `src/lib/email`: 3 files / 17 tests PASS, không skip (DB thật) |
| `pnpm build` | PASS (exit 0) |
| `pnpm audit --audit-level high` | exit 0 — 2 low, 1 moderate, 1 high (đã ignore sẵn trong config, không do task này) |

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, không có trong verify commands được allow.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — tên rõ, hàm < 50 dòng, file < 300 dòng, comment nêu WHY; 1 indicator nhỏ (code chỉ dùng trong test, xem MINOR-5) < 3.
- ai-friendly-web: N/A (không public-facing).
- blitzstrike: skip, không có môi trường được phép.

## Kiểm theo trọng tâm
- Migration `20261016_102520_jobs_queue.ts`: chỉ `CREATE TYPE/TABLE/INDEX` + FK trên bảng mới (`payload_jobs_log` -> `payload_jobs` ON DELETE cascade). Additive, không đụng dữ liệu cũ. `down` drop bảng mới. OK.
- Access `jobs`: `run/queue/cancel = isAdmin`; collection `payload-jobs` mặc định của Payload 3.91 đã `read/create/update/delete: () => false` (node_modules/payload/dist/queues/config/collection.js:104-109) nên REST không đọc được input PII. OK.
- Không autoRun trong web app. OK. Loop không chồng vòng, `stop()` chờ vòng đang chạy (unit test có). **Nhưng process runner không sống được — xem CRITICAL-1.**
- Allowlist fail-safe: mọi APP_ENV ≠ production chỉ gửi tới allowlist; so sánh lowercase/trim. OK (rủi ro vận hành: MINOR-2).
- PII log: chỉ log jobId/template/số người nhận/errorName; `silent.error` tắt log lỗi mặc định; `deleteJobOnComplete: true` (log task cascade theo). OK.
- Template: mọi giá trị qua `escapeHtml` (kể cả href, URL đã giới hạn `http(s)` bằng zod -> chặn `javascript:`); subject qua `toSingleLine`; text tiếng Việt. OK.
- Retry: 5 lần, exponential 30s; gửi 1 thư cho mọi người nhận nên không trùng từng phần. Integration test xác nhận `waitUntil` tương lai và không gọi lại trước hạn. OK.
- Env: 4 biến mới có default/optional nên CI không vỡ; `.env.example` ghi rõ phải đặt `APP_ENV=production` ở prod. OK.

## Findings

### [CRITICAL-1] `pnpm jobs` thoát ngay sau khi khởi động — worker không chạy, có thể giết job giữa chừng
- `scripts/jobs-runner.ts:8-18` + `package.json` script `"jobs": "payload run scripts/jobs-runner.ts"`.
- `payload run` (node_modules/payload/dist/bin/index.js:76-100, 61-68) `await import(script)` rồi `return {}` -> `payload.destroy()` (nếu có) -> **`process.exit(0)`** ngay khi top-level của script xong. Script chỉ `await getPayload`, gọi `startJobsRunLoop` (không chờ), đăng ký signal handler rồi kết thúc top-level -> process exit trong lúc vòng `tick()` đầu tiên đang chạy (`handleSchedules`/`jobs.run`). Hệ quả: AC "Process `pnpm jobs` chạy được tách khỏi web app" FAIL; email không bao giờ được gửi đều đặn; nếu exit đúng lúc job đã được claim (`processing=true`) hoặc đang trong giao dịch SMTP -> job kẹt/gửi lặp khi container restart liên tục.
- Test không phát hiện vì unit test chỉ thử `startJobsRunLoop` với payload giả, integration gọi `payload.jobs.run` trực tiếp.
- Fix đề xuất: để top-level của script **await đến khi nhận tín hiệu dừng**, ví dụ:
  `await new Promise<void>((resolve) => { const stop = async () => { await loop.stop(); resolve(); }; process.once("SIGTERM", stop); process.once("SIGINT", stop); });` — rồi để bin của Payload tự `destroy()` + `exit(0)` (không tự `process.exit` trong handler). Hoặc chạy runner bằng loader khác (`tsx scripts/jobs-runner.ts`) thay vì `payload run`. Thêm test (vd tách hàm `runUntilSignal` và test nó không resolve trước khi có signal) để chặn regression.

### [MINOR-2] Prod quên `APP_ENV=production` -> mất email lead âm thầm (chỉ log warn)
- `src/lib/env.ts:39` default `development`; `src/lib/email/allowlist.ts:27`.
- Fail-safe đúng hướng, nhưng nên thêm cảnh báo khởi động ở runner: nếu `NODE_ENV=production` và `APP_ENV≠production` -> `logger.error` rõ ràng (hoặc nếu `EMAIL_ALLOWLIST` rỗng và APP_ENV≠production -> error "mọi email sẽ bị bỏ"). Follow-up DevOps: đặt `APP_ENV` bắt buộc trong manifest deploy prod/staging + health check.

### [MINOR-3] Input không hợp lệ (ZodError) vẫn retry 5 lần
- `src/jobs/send-notification-email.ts:38,50,82-88`. Lỗi dữ liệu/template là lỗi vĩnh viễn, retry chỉ tốn 5 vòng và giữ PII lâu hơn. Đề xuất: bắt `ZodError` -> kết thúc job không retry (vd throw `JobCancelledError`/trả output lỗi) và log `errorName`.

### [MINOR-4] Job hết retry giữ PII trong `payload_jobs.input` / `payload_jobs_log.input`
- `src/jobs/index.ts:16` chỉ xoá job thành công. Follow-up cho task data-retention (dọn job lỗi > N ngày). Ghi vào task note/gap register.

### [MINOR-5] Code chỉ phục vụ test / lặp nhỏ
- `src/lib/email/templates/index.ts:17` `isEmailTemplateName` không có caller production (chỉ test). `LANGUAGE_LABEL` lặp ở 3 template (`new-lead.ts:14`, `lead-assigned.ts:13`, `job-application.ts:12`) -> đưa vào `layout.ts`.

### [MINOR-6] Shutdown handler
- `scripts/jobs-runner.ts:12-18`: SIGINT/SIGTERM lặp sẽ gọi `shutdown` nhiều lần; dùng `process.once` (sẽ tự giải quyết khi fix CRITICAL-1).

## Doc impact
ARCHITECTURE §5.4: cần ghi cách chạy worker thực tế (sau khi fix CRITICAL-1) và biến `APP_ENV`/`EMAIL_ALLOWLIST`.

## Residual risk
- Không chạy runner thật (ngoài quyền) — CRITICAL-1 xác lập bằng đọc mã nguồn bin Payload 3.91.0.
- Gửi SMTP Brevo thật (STARTTLS 587) chưa kiểm; chỉ kiểm bằng transport giả.

## Verdict
**FAIL** — 1 CRITICAL (runner `pnpm jobs` exit ngay). Builder fix CRITICAL-1 (+ test), nên xử lý MINOR-3/6 cùng lượt; MINOR-2/4 ghi follow-up.
