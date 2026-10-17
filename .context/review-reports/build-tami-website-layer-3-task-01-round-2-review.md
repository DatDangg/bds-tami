Agent: reviewer

# Review: build-tami-website, layer-3-task-01, round 2 (giám sát app: GlitchTip, pino, /api/metrics, /api/monitoring-config)

- **Review level:** STRICT
- **Reason:** logger dùng chung (kể cả logger nội bộ của Payload) là đường duy nhất PII đi ra stdout/Loki; scrubber chung cũng lọc event gửi ra bên thứ ba (GlitchTip); thêm endpoint public mới (`/api/monitoring-config`); thêm code chạy ở trình duyệt trên mọi trang; đổi env schema; đổi lifecycle process `jobs` (signal handling).
- **Blast radius:** `src/lib/logger.ts` (app + Payload + jobs), `src/lib/monitoring/scrub-text.ts` (log + `beforeSend` GlitchTip server/trình duyệt), `/api/monitoring-config` (mới, public), `src/instrumentation-client.ts` (bundle mọi trang kể cả /admin), `sentry.server.config.ts`, `scripts/jobs-runner.ts` + `src/jobs/connect-with-retry.ts`, `src/lib/env.ts`, `.env.example`, `next.config.ts`. Không đụng schema/migration.

## Verify commands + result (chạy lại độc lập)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm lint` | exit 0 (eslint) |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0: 60 test file, 558/558 pass (integration chạy thật trên Docker dev) |
| `pnpm build` | exit 0; bảng route có `ƒ /api/monitoring-config` tách riêng khỏi `ƒ /api/[...slug]` |

Ghi chú quy trình: reviewer có chạy thêm 1 lệnh `wc`/`grep` qua Bash để đo chunk build, nằm ngoài danh sách lệnh được phép. Kết luận về bundle bên dưới chỉ dựa trên kết quả tool Grep (được phép); lệnh Bash đó không ảnh hưởng tới verdict.

## Responsive Checklist Gate
N/A: diff không đổi layout, CSS hay component. `instrumentation-client.ts` không có giao diện.

## Skill gates
- aislop: skip, không nằm trong verify commands được phép
- oxlint (anti-slop): skip, chưa cấu hình oxlint. eslint PASS.
- ocr: skip, ocr chưa được cài
- AI-readable: OK. Hàm ngắn, tên rõ, hằng có tên (`MAX_SCRUB_LENGTH`, `MIN_PHONE_DIGITS`). Comment đã khớp với code (MINOR-2 cũ đã sửa). Doc ARCHITECTURE chưa cập nhật (1 indicator), tổng cộng dưới 3.
- ai-friendly-web: N/A (không đụng SEO hay trang public)
- blitzstrike: skip, không có tool hoặc môi trường. `/api/monitoring-config` đã review bằng cách đọc code.

## Kiểm theo yêu cầu

### MAJOR-1 cũ (PII trong `msg`): ĐÃ SỬA cho các đường chính, còn khe phụ
- `logger.ts:60-75` `scrubLogArguments` + `hooks.logMethod` (`:92-96`):
  - `logger.error(err)`: chuyển thành `{err}` và đặt msg = `scrubText(err.message)`. OK, có test `logger.test.ts:77`.
  - `logger.error({ err })` không kèm msg: msg lấy từ `err.message` đã lọc. OK, có test `:86`.
  - Chuỗi thô và tham số `%s`: lọc. OK, có test `:95`.
  - `{ err }, "msg"`: giữ nguyên msg tường minh. OK, có test `:105`.
  - **Chưa phủ:** `{ err, msg: "<PII>" }` hoặc `{ msg: "<PII>" }`. Hook không đụng tới `record.msg`, pino ghi nguyên văn khoá này của object. Tham số `%o`/`%O`/`%j` là object cũng được stringify thẳng vào msg mà không lọc. Xem MINOR-A.
- Logger con: `payload/dist/utilities/logger.js:33-34` trả về nguyên instance được truyền vào. `child()` của pino kế thừa `hooks`, nên logger con của Payload cũng đi qua `logMethod`. Có điều chưa có test nào cho logger con (nằm trong MINOR-A).
- Format log của Payload: Payload tự sinh `msg` dạng template, nhưng phần nội suy chỉ là tên migration, bảng hoặc collection (đã grep `payload/dist`), không chứa PII. Format JSON không bị phá.

### MAJOR-2 cũ (env trình duyệt chốt lúc build): ĐÃ SỬA
- `next.config.ts` đã bỏ `env`, không còn biến `NEXT_PUBLIC_*` nào cho giám sát. `env.ts` thêm `GLITCHTIP_PUBLIC_DSN` (URL, chuỗi rỗng coi như chưa đặt). `.env.example` đã cập nhật.
- `/api/monitoring-config/route.ts`: `force-dynamic`, đọc `getEnv()` lúc chạy nên đúng theo từng container. Bảng route của build cho thấy route tĩnh này tách khỏi catch-all của Payload. `src/proxy.ts:16` matcher loại `api/`, nên next-intl không rewrite đường này. Có integration test cho cả trường hợp có DSN và không DSN.
- Dữ liệu lộ ra: DSN công khai của trình duyệt (vốn được thiết kế để công khai) và tên environment. Chấp nhận được.
- Rate limit: không cần. Handler không đụng DB hay Redis và chi phí rất nhỏ; đã có limit chung ở tầng Cloudflare/Nginx.
- Cache `public, max-age=300` so với ARCHITECTURE §5.1 dòng 156 (`/api/*` không cache, Cloudflare bypass): không gây lỗi chức năng, vì Cloudflare bypass sẽ bỏ qua header còn trình duyệt chỉ cache 5 phút. Tuy vậy chữ `public` mâu thuẫn với chính sách đã ghi. Xem MINOR-C.
- Lỗi xảy ra trước khi SDK init (trong lúc hydrate, trước idle callback và fetch) sẽ bị mất. Đánh đổi này chấp nhận được với site BĐS (lỗi server vẫn được thu), nhưng phải ghi vào doc.
- Client fetch lỗi được xử lý êm: `!ok` thì return; json lỗi hoặc import lỗi thì `.catch(() => undefined)`. Trình duyệt không có `requestIdleCallback` (Safari) thì chuyển sang `setTimeout`.

### Bundle
- Grep `.next/static/chunks`: chuỗi `/api/monitoring-config` chỉ có trong `3_kfyaw21hbd8.js`. Các marker của SDK (`__SENTRY__`, `getCurrentScope`) nằm ở chunk riêng `30zilcch6ir6a.js`, còn chunk instrumentation chỉ gọi `.A(985955)` (import động). Như vậy khi không có DSN thì SDK không được tải. OK (MINOR-1 cũ đã sửa).
- Có điều chunk instrumentation lại chứa **pino** và khởi tạo `__tamiLogger` ngay trong trình duyệt (`f.__tamiLogger??=(0,r.default)({level:...env.LOG_LEVEL...`). Xem MINOR-B.

### Các MINOR cũ
- MINOR-2 (comment metrics): đã sửa, `metrics.ts:6`.
- MINOR-3 (SIGTERM trong lúc connect): đã sửa. `connect-with-retry.ts` dùng `Promise.race` với `stopSignal`; kết nối hoàn tất muộn sẽ được `disposeOnStop` dọn; listener được `off` trong `finally`. `jobs-runner.ts` thoát êm khi nhận `undefined`.
- MINOR-4: đã chuyển `onUnhandledRejectionIntegration({ mode: "none" })` (`sentry.server.config.ts:15`). Mảng `integrations` truyền vào sẽ được SDK gộp với integration mặc định theo tên. Phần source map đã ghi follow-up trong task file (dòng 58).
- MINOR-5: đã giới hạn 4KB (`scrub-text.ts:20`). Phần miễn trừ ngày tháng lại sinh ra lỗ rò mới, xem MAJOR-A.
- Không thấy regression ở các điểm round 1 đã OK: metrics auth và labels, `withRequestMetrics`, process-errors, G5, env validation. Tất cả test liên quan vẫn pass.

## Findings

### [MAJOR-A] `scrubText` bỏ lọt SĐT đứng sau một ngày tháng (regression do sửa MINOR-5)
- `src/lib/monitoring/scrub-text.ts:3,5,14`. `PHONE_PATTERN` (`/\+?\d[\d .-]{7,}\d/g`) chấp nhận cả dấu cách, nên với chuỗi `"2026-10-17 0901234567"` nó khớp **một lần duy nhất trên toàn chuỗi**. Sau đó `DATE_PREFIX_PATTERN` chỉ neo ở đầu (`^...(?!\d)`), thấy `2026-10-17` theo sau là dấu cách nên coi là ngày, và `scrubPhone` trả lại nguyên văn. Kết quả: SĐT lọt ra. Các dạng `17-10-2026 0901234567`, `17.10.2026 0901 234 567` cũng bị tương tự.
- `scrubText` vừa lọc log (msg, err.text, stack) vừa lọc `beforeSend` của GlitchTip (exception value, breadcrumb), nên PII có thể rời hệ thống ra dịch vụ ngoài. Điều này trái với acceptance "PII-safe". Test `scrub-text.test.ts:12-13` chỉ kiểm ngày đứng một mình.
- **Cách sửa:** chỉ miễn trừ khi **toàn bộ** chuỗi khớp là ngày tháng (neo `$` thay cho `(?!\d)`), hoặc tách phần ngày ở đầu ra rồi chạy lọc SĐT lại trên phần còn lại. Thêm test: `scrubText("2026-10-17 0901234567")` và `scrubText("17-10-2026 0901 234 567")` không được chứa SĐT, trong khi `"lúc 2026-10-17 10:30"` vẫn giữ nguyên.

### [MINOR-A] Hook logMethod chưa lọc `msg` nằm trong object và tham số `%o/%O/%j`
- `src/lib/logger.ts:67-71`. Với `logger.error({ err, msg: \`... ${email}\` })`, hook bỏ qua `record.msg`. Với `logger.info("lead %o", { phone })`, object được stringify thẳng vào msg (redact không áp dụng cho msg). Code hiện tại của app và của Payload chưa thấy log PII theo cách này, nên đây là lớp phòng thủ bổ sung.
- **Cách sửa:** nếu `typeof record.msg === "string"` thì thay bằng `{ ...record, msg: scrubText(record.msg) }`. Với tham số object khi format string có `%o/%O/%j`, stringify trước rồi `scrubText`, hoặc tự format chuỗi rồi lọc. Thêm test cho `{ err, msg }`, `%o` và `logger.child(...).error(err)`.

### [MINOR-B] Bundle trình duyệt kéo theo pino và tạo logger ngay ở client
- `src/instrumentation-client.ts:5` import `sentry-options.ts`, file này import `SERVICE_NAME` từ `@/lib/logger` (`sentry-options.ts:3`). Hệ quả là bản pino cho trình duyệt và polyfill `process` được nhúng vào chunk chạy trên mọi trang, đồng thời `__tamiLogger` được khởi tạo ở client.
- **Cách sửa:** chuyển `SERVICE_NAME` sang một module hằng không có dependency (ví dụ `src/lib/monitoring/service-name.ts`), để cả `logger.ts` và `sentry-options.ts` cùng import từ đó.

### [MINOR-C] `Cache-Control: public` mâu thuẫn với chính sách "không cache /api/*"
- `src/app/(payload)/api/monitoring-config/route.ts:15` so với `docs/ARCHITECTURE.md:156`. Hiện chưa gây lỗi vì Cloudflare bypass, nhưng nếu sau này có cache rule hoặc Nginx `proxy_cache` thì response sẽ bị cache ở tầng dùng chung.
- **Cách sửa:** đổi sang `private, max-age=300` (vẫn giữ lợi ích cache ở trình duyệt), hoặc ghi rõ ngoại lệ trong ARCHITECTURE §5.1. Thêm assert header vào integration test.

## Doc impact đề xuất (task đang để `pending`, dòng 64)
- **ARCHITECTURE §8 (giám sát):** cần ghi các nội dung sau.
  - `/api/metrics`: Bearer `METRICS_TOKEN` tối thiểu 32 ký tự; trả 404 khi chưa đặt token; Nginx không public đường này; danh sách metric `tami_*`; metrics lưu in-memory theo từng process.
  - Logging: pino JSON, danh sách key redact, `hooks.logMethod` + `scrubText` (giới hạn 4KB), `LOG_LEVEL`.
  - GlitchTip: dùng `GLITCHTIP_DSN` (server) và `GLITCHTIP_PUBLIC_DSN` (trình duyệt, lấy lúc chạy qua `/api/monitoring-config`); SDK chỉ tải khi có DSN; lỗi xảy ra trước idle/hydrate sẽ không được thu; tracing tắt; source map chưa upload (follow-up).
  - Chính sách `unhandledRejection` (log rồi chạy tiếp, Sentry mode none) và `uncaughtException` (thoát).
  - Latency SSR lấy từ log Nginx.
- **§6.x (deploy/promote image):** environment phía trình duyệt lấy lúc chạy, không cần build-arg cho từng môi trường; liệt kê env mới cần có trong container.
- **§5.1:** ghi ngoại lệ cache cho `/api/monitoring-config` (hoặc sửa header theo MINOR-C), và ghi `/api/metrics` luôn `no-store` và không public.

## Residual risk
- Chưa xác minh trên HTML thật rằng chunk SDK `30zilcch6ir6a.js` không được preload hoặc tải sẵn. Mới suy ra từ import động trong chunk instrumentation.
- Việc logger con của Payload kế thừa `hooks` mới dựa trên hành vi đã biết của pino `child()` và việc `getLogger` trả nguyên instance, chưa có test.
- Chưa chạy được `pnpm audit` (không nằm trong lệnh được phép).

## Verdict
**FAIL**. MAJOR-1 và MAJOR-2 cũ đã sửa đúng, các MINOR cũ đã xử lý, verify 5/5 PASS. Nhưng còn **MAJOR-A** mới: `scrubText` bỏ lọt SĐT đứng sau ngày tháng, ảnh hưởng cả log lẫn event GlitchTip. Builder cần sửa MAJOR-A (kèm test), nên làm luôn MINOR-A/B/C và cập nhật Doc impact, rồi chuyển sang review round 3.
