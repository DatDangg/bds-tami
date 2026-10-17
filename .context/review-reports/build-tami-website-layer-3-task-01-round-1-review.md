Agent: reviewer

# Review: build-tami-website, layer-3-task-01, round 1 (giám sát app: GlitchTip, pino, /api/metrics)

- **Review level:** STRICT
- **Reason:** instrumentation chạy cho toàn app (server, trình duyệt, jobs); logger dùng chung thay `console.*` và thay luôn logger nội bộ của Payload, nên mọi đường log PII đều đi qua đây; thêm endpoint `/api/metrics` có xác thực bằng token; có handler cấp process (`unhandledRejection`); thêm dependency mới (Sentry SDK + OTel).
- **Blast radius:** mọi route Payload REST (`/api/[...slug]`, bọc `withRequestMetrics`), `/api/health`, `/api/metrics` (mới), bundle trình duyệt của mọi trang (`instrumentation-client.ts`), logger của Payload (`payload.config.ts`), process jobs (`scripts/jobs-runner.ts`, `connectWithRetry`), `src/lib/redis.ts`, `client-ip`, `turnstile`, `public-pipeline`, env schema (`env.ts`), `next.config.ts`, lockfile (+1098 dòng).

## Verify commands + result (chạy lại độc lập)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm lint` | exit 0 (eslint) |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0: 58 test file, 547/547 test pass, không có test bị skip (integration chạy thật trên Docker dev) |
| `pnpm build` | exit 0, "Compiled successfully", không có warning |
| `pnpm audit --prod` | skip: không nằm trong danh sách verify command được phép, nên không kiểm lại được claim của builder (residual risk) |

## Responsive Checklist Gate
N/A: diff không đổi layout, CSS hay component hiển thị. `instrumentation-client.ts` không có giao diện. Ảnh hưởng hiệu năng tới CWV ghi riêng ở MINOR-1.

## Skill gates
- aislop: skip, `aislop` không nằm trong verify commands được phép
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc*`). eslint PASS.
- ocr (open-code-review): skip, ocr chưa được cài
- AI-readable: OK. Hàm ngắn (<50 dòng), tên rõ, mỗi file đều dưới 300 dòng, magic number đặt thành hằng có tên. Có 1 comment sai sự thật (MINOR-2). Doc ARCHITECTURE §8 chưa cập nhật (xem Doc impact). Tổng cộng dưới 3 indicator.
- ai-friendly-web: N/A (không đụng route public/SEO)
- blitzstrike: skip, không có tool hoặc môi trường. Auth của `/api/metrics` đã review bằng cách đọc code (OK).

## Kiểm theo 8 điểm được yêu cầu

1. **PII:** redact path phủ được tới 3 cấp lồng (`*.*.*.email`), đủ cho `req.headers.cookie` và `body.lead.email`. `serializeError` lọc `message`/`stack` qua `scrubText`. Event Sentry: bỏ user/extra/headers/cookies/data/query_string; breadcrumb bỏ `data`; `sendDefaultPii: false`. **Có lỗ hổng ở trường `msg` của pino**, xem MAJOR-1.
2. **Sentry khi không có DSN:** `initSentryIfConfigured` không gọi `init`, nên không có network (có test). `instrumentation-client.ts` đúng cơ chế của Next 16. `onRequestError` export đúng kiểu `Instrumentation.onRequestError` và gọi `Sentry.captureRequestError` (no-op khi chưa init). Không dùng `withSentryConfig` nên mất upload source map, stack trace trình duyệt trên GlitchTip sẽ bị minify (MINOR-4). Chưa đo được bundle (MINOR-1).
3. **/api/metrics:** OK. Tính SHA-256 cả hai phía rồi `timingSafeEqual` (độ dài bằng nhau, không lộ qua timing); chưa đặt token thì trả 404; sai token thì 401 kèm `WWW-Authenticate`; có `no-store` ở cả 3 nhánh. Chỉ lộ uptime/memory/pool, không nhạy cảm. Nhãn `route` là hằng do code đặt, `method` chỉ gồm các method đã export, nên số series không bùng nổ. Metrics lưu in-memory theo từng process, chấp nhận được vì app chạy 1 container (đã ghi trong comment).
4. **withRequestMetrics:** OK. Trả nguyên `Response` (không đọc body, nên stream và multipart không bị ảnh hưởng, header giữ nguyên). Handler ném lỗi thì ghi 500 rồi ném lại nguyên vẹn. Overhead chỉ gồm `performance.now()` và vài thao tác trên Map.
5. **G4/G5:** guard bằng `Symbol.for` trên globalThis nên HMR không cài handler lần hai. `getPayload` của Payload 3.91 có reset `cached.promise = null` khi lỗi (`payload/dist/index.js:634`), nên retry thật sự thử lại được. Cho jobs chỉ log `unhandledRejection` mà không thoát: chấp nhận được. Riêng việc SIGTERM rơi đúng lúc đang kết nối vẫn còn khe hở (MINOR-3). G5 (`session-refresh.test.ts` afterAll có guard) đã sửa đúng.
6. **env:** `METRICS_TOKEN` tối thiểu 32 ký tự; chuỗi rỗng coi như undefined; lỗi chỉ nêu tên biến (có test). `NEXT_PUBLIC_APP_ENV` được chốt cứng lúc build, xem MAJOR-2.
7. **Dependency:** `@sentry/nextjs` 10.76.0 (MIT, peer next ^16), `pino` 9.14.0 (MIT, cùng bản với Payload). Install frozen OK. Chưa chạy lại audit được.
8. **Test:** phần lớn kiểm hành vi thật (logger ghi vào stream thật, metrics route chạy integration thật). Còn thiếu case `logger.error(err)`, đúng chỗ của MAJOR-1.

## Findings

### [MAJOR-1] PII lọt vào trường `msg` khi log một Error, bỏ qua cả redact lẫn `scrubText`
- `src/lib/logger.ts:43-67` và `src/payload.config.ts:50-51` (logger này được giao cho Payload).
- pino 9 (`node_modules/pino/lib/proto.js:221-229`): khi tham số đầu là `Error`, hoặc là `{ err }` mà không truyền msg, pino tự gán `msg = err.message` **nguyên văn**. `serializeError` chỉ lọc `err.text`/`err.stack`, còn `msg` thì không, và redact cũng không phủ `msg`.
- Payload 3.91 gọi đúng kiểu này ở nhiều chỗ: `payload/dist/utilities/addDataAndFileToRequest.js:28` (lỗi parse body; thông điệp `JSON.parse` của V8 có trích đoạn body, tức có thể chứa SĐT/email của khách), `uploads/generateFileData.js:361`, `uploads/getFileFromClientUpload.js:103`, `uploads/uploadFiles.js:14`, `versions/enforceMaxVersions.js:56` (lỗi query của Drizzle có kèm params). Log này đi ra stdout rồi vào Loki, trái với acceptance #2 và mục tiêu PII-safe của task. Test hiện tại (`logger.test.ts:69`) luôn truyền msg nên không bắt được trường hợp này.
- **Cách sửa:** thêm `hooks.logMethod` vào `createLoggerOptions`: lọc mọi tham số dạng string qua `scrubText`; nếu tham số đầu là `Error` (hoặc object có `err`/`error` là Error) mà không có msg thì tự chèn `scrubText(err.message)` làm msg. Thêm unit test cho `logger.error(new Error("... khach@example.com 0901234567"))` và `logger.error({ err })` không có msg, khẳng định output không chứa PII.

### [MAJOR-2] `NEXT_PUBLIC_APP_ENV` chốt cứng lúc build, trong khi cùng một image được promote từ staging lên prod
- `next.config.ts:9-10` (`env: { NEXT_PUBLIC_APP_ENV: process.env.APP_ENV ?? "development" }`) và `src/instrumentation-client.ts:11`.
- ARCHITECTURE §6.4 (dòng 262-265): build image 1 lần theo commit SHA, rồi deploy **đúng image đó** lên production. Kết quả là lỗi trình duyệt trên prod sẽ mang nhãn `staging`, hoặc `development` nếu Docker build không truyền APP_ENV, trộn lẫn môi trường trên GlitchTip và làm sai cảnh báo. Trái với acceptance #4 ("env theo `APP_ENV`") ở phía client.
- **Cách sửa:** lấy environment lúc chạy. Ví dụ: root layout (server) render `<meta name="app-env" content={APP_ENV}>` hoặc `data-app-env` trên `<html>`, rồi `instrumentation-client.ts` đọc từ DOM. Hoặc suy ra từ `location.hostname`. Nếu vẫn giữ build-time thì phải có quyết định được ghi lại, kèm build-arg cho từng môi trường, mà như vậy lại mâu thuẫn với §6.4. DSN trình duyệt dùng chung 1 project thì không sao, nhưng nên ghi chú điều này.

### [MINOR-1] Sentry SDK luôn bị nhúng vào bundle mọi trang, kể cả khi không có DSN
- `src/instrumentation-client.ts:3` import tĩnh `@sentry/nextjs`, nên dù không có DSN mã SDK vẫn được tải và parse trước khi hydrate. Ảnh hưởng tới NFR-01 (CWV) **chưa đo được**: Next 16 không còn in kích thước bundle, và reviewer không được dùng Bash ngoài verify command.
- **Cách sửa:** chỉ `import("@sentry/nextjs")` động khi `NEXT_PUBLIC_GLITCHTIP_DSN` có giá trị (đánh đổi: mất lỗi xảy ra trước khi SDK tải xong), hoặc đo First Load JS trước/sau ở task DevOps.

### [MINOR-2] Comment sai sự thật
- `src/lib/monitoring/metrics.ts:6` ghi "REST của Payload, health, metrics", nhưng `src/app/(payload)/api/metrics/route.ts:16` không bọc `withRequestMetrics`. Sửa comment, hoặc bọc route (cách nào cũng được).

### [MINOR-3] SIGTERM đến đúng lúc `connect()` đang chạy thì bị bỏ qua
- `src/jobs/connect-with-retry.ts:35`: `return await connect()` trả payload mà không kiểm `stopRequested`. Runner vẫn khởi động worker nên phải chờ thêm một SIGTERM nữa. Thêm vào đó, listener `once` thay mất hành vi thoát mặc định của Node, nên trong lúc connect bị treo, `docker stop` phải chờ tới SIGKILL.
- **Cách sửa:** sau khi connect thành công, nếu `stopRequested` thì báo cho caller (caller gọi `payload.destroy()` rồi thoát). Thêm test cho trường hợp này.

### [MINOR-4] Các khe hở PII/vận hành phụ của Sentry
- Khi có DSN, `onUnhandledRejectionIntegration` (mặc định mode `warn`) in lỗi thô ra console, đi ngoài pino, nên vừa bỏ qua redact vừa trùng với log của `process-errors.ts`. Đề xuất: `integrations` phía server dùng `Sentry.onUnhandledRejectionIntegration({ mode: "none" })`.
- Không dùng `withSentryConfig` nên không upload source map; stack trace trình duyệt trên GlitchTip sẽ bị minify. Ghi follow-up cho task deploy.

### [MINOR-5] `scrubText` không giới hạn độ dài đầu vào
- `src/lib/monitoring/scrub-text.ts:1-8`: regex email/SĐT có độ phức tạp bậc hai trong trường hợp xấu với chuỗi dài (thông điệp lỗi có trích body lớn). Ngoài ra pattern SĐT lọc nhầm cả ngày tháng/ID (`2026-10-17`). **Cách sửa:** cắt `text.slice(0, 4096)` trước khi chạy regex. Lọc nhầm thì chấp nhận được (an toàn hơn), chỉ cần ghi chú.

## Doc impact đề xuất
- `docs/ARCHITECTURE.md` §8: ghi `/api/metrics` (Bearer `METRICS_TOKEN`, 404 khi chưa đặt, Nginx không public, danh sách metric `tami_*`), `LOG_LEVEL`, pino JSON + danh sách key redact, `GLITCHTIP_DSN`/`NEXT_PUBLIC_GLITCHTIP_DSN`, chính sách `unhandledRejection` (log rồi chạy tiếp) và `uncaughtException` (thoát). Ghi chú thêm: latency SSR lấy từ log Nginx.
- §6.4/§6: cách xử lý environment phía trình duyệt khi promote cùng một image (gắn với MAJOR-2).
- Task file: mục Doc impact vẫn đang `pending`.

## Residual risk
- Chưa đo được kích thước bundle client và chưa chạy lại `pnpm audit` (giới hạn quyền Bash).
- Không xác minh được hành vi `process.exit` của adapter Postgres khi DB sập (grep `@payloadcms/drizzle` không ra kết quả). Builder ghi đã smoke test `pnpm jobs`.
- Đã dùng hết hạn mức đọc file của mức STRICT (25).

## Verdict
**FAIL**: còn 2 MAJOR (MAJOR-1 lộ PII qua `msg`, MAJOR-2 environment phía client sai khi promote image). Builder sửa MAJOR-1 và MAJOR-2 (kèm test), nên xử lý luôn MINOR-2 và MINOR-3, rồi chuyển sang review round 2.
