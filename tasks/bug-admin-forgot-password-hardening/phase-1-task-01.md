# bug-admin-forgot-password-hardening · phase-1-task-01 — Quên mật khẩu admin: phản hồi đồng nhất, log lỗi gửi mail, cảnh báo SMTP placeholder, reset mail theo EMAIL_ALLOWLIST (BL-100)

- Change doc: `spec/changes/2026-10-28-admin-forgot-password-hardening.md` (BACKLOG BL-100, follow-up BL-095). User duyệt 2026-10-28 ("Có, thêm task") sau khi được báo đánh đổi: form luôn báo thành công kể cả khi gửi mail lỗi, lỗi chỉ ở log server.
- Phụ thuộc: không. BL-095 vẫn blocked chờ user (cấu hình SMTP server) — task này KHÔNG đổi env server, KHÔNG deploy.
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-admin-forgot-password-hardening-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v104.

## Classification / Risk
- Type: **BUG / security** (auth: account enumeration + recipient filtering).
- Risk: **HIGH** — auth flow (`/api/staff/forgot-password`), email adapter dùng chung (mọi mail của Payload + job `send-notification-email`), startup (`onInit`).
- Expected review level: **STRICT** (bắt buộc: auth/security, shared service).

## Root cause (change-request, từ code — evidence)
1. **Dò tài khoản (500 vs 200):** `node_modules/payload/dist/auth/operations/forgotPassword.js` (Payload 3.91): email không tồn tại → `return null` sớm → handler `auth/endpoints/forgotPassword.js` trả 200 `{message: t('general:success')}`. Email tồn tại → ghi token rồi `await email.sendEmail(...)` trực tiếp; SMTP lỗi → ném → `killTransaction` → 500. Log staging BL-095: `getaddrinfo ENOTFOUND smtp.invalid`.
2. **Chênh thời gian:** nhánh tồn tại chờ giao dịch SMTP (DNS/TCP/TLS/AUTH, có thể hàng giây), nhánh không tồn tại trả ngay → oracle thời gian kể cả khi SMTP chạy đúng.
3. **Bỏ qua EMAIL_ALLOWLIST:** lọc người nhận (`filterRecipients` trong `src/lib/email/allowlist.ts`) chỉ được gọi ở job `src/jobs/send-notification-email.ts:38`; adapter `src/lib/email/transport.ts` (Payload dùng trực tiếp, `src/payload.config.ts:72` `email: createEmailAdapter(env)`) không lọc → reset mail staging gửi tới mọi email staff.
4. **Không cảnh báo placeholder:** `findEmailConfigProblems` (allowlist.ts) chỉ kiểm APP_ENV/allowlist và chỉ được gọi ở `scripts/jobs-runner.ts`; không gì kiểm `SMTP_HOST` (`smtp.invalid`, rỗng…), web app không log gì lúc khởi động.

## Thiết kế fix (quyết định của change-request)
1. **Allowlist ở adapter (một chốt cho mọi mail):** `createEmailAdapter` bọc `sendEmail` của nodemailer adapter: lọc `to` (string | string[] | Address | Address[]; cc/bcc nếu có cũng lọc) bằng `filterRecipients` + `parseEmailAllowlist` với `APP_ENV`/`EMAIL_ALLOWLIST` (thêm 2 field vào Pick<Env>). Không còn người nhận → không gọi transport, `logger.warn` chỉ số lượng bị bỏ + appEnv (không địa chỉ, không nội dung), trả về bình thường (không ném). Job `send-notification-email` giữ lọc của nó (lọc 2 lần vô hại).
2. **Endpoint tuỳ biến `POST /forgot-password` trên Staff** theo đúng pattern `resetPasswordWithLengthCheck` (đứng trước endpoint mặc định, gọi handler mặc định của Payload):
   - Gọi handler mặc định trong try/catch. Lỗi client do input (APIError status 400 "Missing email" — không phụ thuộc tồn tại) → giữ nguyên hành vi. Mọi lỗi khác → `logger.error` chỉ field whitelist (`errorName`, `code`, `responseCode`, `command`, collection) — KHÔNG `err` object/stack thô, KHÔNG email, KHÔNG token, KHÔNG SMTP_PASS — rồi trả **đúng** response thành công như handler gốc (`{message: req.t('general:success')}`, 200, header CORS).
   - **Chống chênh thời gian:** việc gửi reset mail chạy nền, không chặn response: endpoint chạy handler mặc định trong ngữ cảnh "deferred send" (`AsyncLocalStorage` trong module email); adapter thấy ngữ cảnh đó thì lên lịch gửi, resolve ngay; lỗi gửi nền được log (whitelist như trên), không unhandledRejection. Hệ quả chấp nhận: SMTP lỗi thì token vẫn được ghi (hết hạn theo Payload 1h), interval 15s không được nhả.
   - Không thêm sleep/độ trễ nhân tạo (chênh còn lại chỉ là 1 lệnh DB update, mức ms).
3. **Cảnh báo SMTP placeholder:** hàm thuần `findSmtpConfigProblems(...)` trong `src/lib/email/` — `SMTP_HOST` rỗng/khoảng trắng, đuôi `.invalid` / `.example` / `.test`, `example.com`, chứa `placeholder`; `SMTP_USER=placeholder`. Gọi ở `onInit` của `src/payload.config.ts` (chạy cả web app lẫn jobs) → `payload.logger.warn` (không throw, không chặn khởi động dev/test). Thông điệp nêu tên biến + hậu quả, KHÔNG in SMTP_PASS / SMTP_USER (in host placeholder được). Tránh log trùng với jobs-runner (builder quyết, ghi Decision log).
4. Không đổi UI Payload (`ForgotPasswordForm` vốn luôn toast thành công), không đổi env server, không đổi Payload config ngoài `email`/`onInit`.

## Files (dự kiến)
- `src/lib/email/transport.ts` (+ test), file mới `src/lib/email/smtp-config.ts` (+ test) hoặc mở rộng `allowlist.ts`, endpoint forgot-password trong `src/collections/Staff.ts` hoặc tách file (+ test), `src/payload.config.ts` (`onInit`).
- KHÔNG đụng file dirty ngoài batch: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/agent-live.mjs`, `tools/vibe-studio/src/live-state.ts`, `.claude/hooks/live-studio.mjs`, `.context/review-reports/assets/bl054-*`, `spec/changes/*`.

## Acceptance
- [x] `POST /api/staff/forgot-password` email tồn tại / không tồn tại → cùng HTTP status + cùng body, kể cả khi SMTP lỗi.
- [x] Thời gian phản hồi hai nhánh không phụ thuộc thời gian SMTP (gửi chạy nền); đo trên dev localhost:3000, ghi số liệu.
- [x] Lỗi gửi reset mail có log server (whitelist field); test khẳng định log không chứa SMTP_PASS, token, email.
- [x] `SMTP_HOST` placeholder (`smtp.invalid`, rỗng) → log warn lúc khởi động; dev/test vẫn khởi động bình thường.
- [x] APP_ENV≠production + EMAIL_ALLOWLIST → reset mail tới địa chỉ ngoài allowlist không gửi (transport không được gọi), trong allowlist vẫn gửi; production gửi tự do.
- [x] Missing email → 400 như cũ; reset-password endpoint + job email không đổi hành vi.
- [x] Unit test khoá các hành vi trên; `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-29 (change-request): root cause từ code Payload 3.91 + evidence BL-095 (không spawn Explore). Chọn: allowlist ở adapter (chốt chung), endpoint bọc handler mặc định (pattern reset-password sẵn có), gửi nền qua AsyncLocalStorage thay vì sleep/sàn thời gian (sàn không che được SMTP chậm), cảnh báo ở `onInit`.

- 2026-10-29 (builder, attempt 1 redo): đo live phát hiện 2 điều làm lệch thiết kế gốc.
  1. Endpoint tuỳ biến KHÔNG được Payload parse body (chỉ endpoint nội bộ qua `wrapInternalEndpoints` có `addDataAndFileToRequest`) -> phải parse trên bản sao request như `resetPasswordWithLengthCheck`. Bản đầu đọc `req.data` trực tiếp (luôn undefined) nên rơi về handler mặc định và vẫn 500; mock unit test không bắt được -> test giờ dùng `Request` thật.
  2. Nhánh "email tồn tại" của handler mặc định tốn ~160ms ở phía DB (ghi token qua `payload.update`), không phải "mức ms"; chỉ gửi mail nền (AsyncLocalStorage) vẫn để lộ ~160ms (177ms vs 17ms đo được). Đổi sang chạy NỀN TOÀN BỘ handler mặc định khi có email (không await), trả ngay 200 đồng nhất. Hệ quả: bỏ `deferred-send.ts` + nhánh ALS trong adapter (thừa). SMTP lỗi -> handler mặc định ném -> Payload rollback transaction (token không được ghi, interval 15s được nhả) -> ta chỉ log whitelist. Tốt hơn thiết kế gốc (không để token mồ côi).
  3. Cảnh báo SMTP ở `onInit` payload.config (web app + jobs đều thấy); jobs-runner vẫn giữ `findEmailConfigProblems` riêng (kiểm APP_ENV/allowlist, không trùng nội dung SMTP_HOST).

## Repro Verification
- **Original repro**: SMTP lỗi → `POST /api/staff/forgot-password` email tồn tại vs không.
- **Expected**: cùng 200 + body; lỗi ở log.
- **Actual before fix**: 500 vs 200 (evidence BL-095 staging).
- **Actual after fix**: dev localhost:3000, SMTP_HOST=smtp.invalid + SMTP_USER=placeholder + EMAIL_ALLOWLIST=<email staff dev> (chỉ env của tiến trình dev, không sửa .env.local/server). `POST /api/staff/forgot-password`: email tồn tại -> 200 `{"message":"Thành công"}`; email không tồn tại -> 200 cùng body; thiếu email -> 400 `Missing email.` như cũ.
- **Evidence**:
  - Trước fix (đo cùng dev server, bản adapter-only chưa chạy nền toàn phần): email tồn tại không bị throttle 177/177/182 ms vs không tồn tại 17/18/17 ms; bản đọc req.data sai vẫn 500 (~280-400 ms) vs 200 (~17 ms).
  - Sau fix (đã làm nóng kết nối rồi mới đo, 4 cặp cách nhau 16s để không dính throttle 15s của Payload): tồn tại 12.6/11.1/10.1/10.2 ms vs không tồn tại 13.2/12.2/9.4/11.0 ms; mọi cặp 200 + cùng body. (Request đầu tiên sau idle ~100-170ms bất kể nhánh nào — khởi động lại kết nối, không liên quan email; đã hoán đổi thứ tự xác nhận.)
  - Log server: 4/4 lần gửi lỗi có đúng 1 dòng `{"level":"error",errorName:"Error",code:"EDNS",command:"CONN",collection:"staff",component:"forgot-password","msg":"Quên mật khẩu: xử lý nền thất bại"}`; không có email, token, SMTP_PASS, stack, unhandledRejection (grep = 0).
  - Khởi động: 2 dòng warn `Email: cấu hình SMTP: SMTP_HOST="smtp.invalid" ...` và `SMTP_USER là giá trị giữ chỗ ...` (không in user/pass); dev vẫn lên bình thường. Cảnh báo "Ecmascript file had an error" metrics.ts (process.uptime edge) có sẵn trước task, không liên quan.
  - Allowlist live: APP_ENV=development, EMAIL_ALLOWLIST rỗng -> log "bỏ người nhận ngoài danh sách cho phép" dropped:1, không gọi SMTP; có allowlist chứa email -> gửi (lỗi DNS smtp.invalid như mong đợi).
  - Unit: `staff-forgot-password.test.ts` (Request thật; cùng status/body khi lỗi; không chờ handler; 400 pass-through cho {} / "" / 5 / null; log whitelist; không unhandledRejection), `transport.test.ts` (allowlist drop/allowed/dev-test/production, lỗi transport vẫn ném), `send-error-fields.test.ts`, `smtp-config.test.ts`.
  - `pnpm typecheck` PASS · `pnpm lint` PASS · `pnpm test` PASS (460 files, 4842 tests).
- **Status**: PASS — Reviewer STRICT PASS r1

## Close-out (change-request)
- r1 STRICT PASS, 5 MINOR chấp nhận (không chặn): (1) lặp code tìm endpoint mặc định với `resetPasswordWithLengthCheck`; (2) việc nền với email không tồn tại không bị giới hạn số lượng (giới hạn 15s chỉ theo tài khoản) — nên thêm rate limit theo IP; (3) adapter đổi `to` chuỗi thành mảng cả ở production (tên hiển thị có dấu phẩy sẽ bị tách); (4) email toàn khoảng trắng → 200 thay vì 400; (5) test chưa assert chuỗi SMTP_PASS.
- Spec: no spec change (1.61.0); test-scope v104 (v103 archive). Doc impact: `docs/API_SPEC.md` §4 as-built BL-100, `docs/ARCHITECTURE.md` bảng env.
