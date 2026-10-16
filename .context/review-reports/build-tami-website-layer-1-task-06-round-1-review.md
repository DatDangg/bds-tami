Agent: reviewer

# Review — build-tami-website layer-1-task-06 (round 1)

- Task: `tasks/tami-website/layer-1-task-06.md` (Redis client, rate limit, Turnstile server-side, public pipeline, follow-up n1 ip-hash)
- Diff: chưa commit, so với HEAD `46bf310`
- Review level: **STRICT**
- Reason: hạ tầng bảo mật dùng chung cho mọi endpoint `/api/public/*` (rate limit, captcha, nguồn IP, fail-closed), thêm dependency mới (`ioredis`), đổi `ipHash` đang dùng làm khoá chống spam.
- Blast radius: `src/lib/redis.ts`, `src/lib/security/{rate-limit,turnstile,client-ip,ip-hash}.ts`, `src/endpoints/_middleware/public-pipeline.ts`; mọi endpoint mở khoá sau này (layer-2-task-06/07, layer-6-task-09, layer-7-task-02, layer-9-task-02/05); `.env.example`; lockfile (+ioredis 6.0.0, cluster-key-slot, denque, redis-errors, standard-as-callback); ipHash đã lưu (n1 chỉ đổi kết quả với IPv4-mapped dạng hex, chưa có dữ liệu production).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (lockfile up to date) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 25 files / 266 tests, không skip (integration rate-limit chạy với Redis dev thật; CI có service `redis:7-alpine` + `REDIS_URL`) |
| `pnpm build` | PASS (exit 0) |
| `pnpm audit --audit-level high` | exit 0 — 2 low / 1 moderate / 1 high (đã ignore, có từ trước, không thuộc ioredis) |

## Checklist trọng tâm
- Lua atomic: OK — một EVAL gồm INCR → PEXPIRE khi count==1 → PTTL, tự đặt lại TTL nếu mất (`rate-limit.ts:34-43`); test song song 20 req/limit 5 → đúng 5 qua; test PERSIST.
- Khoá: `rl:<endpoint>:<ipHash>` — HMAC-SHA256, không có IP thô. OK.
- Giới hạn: leads 5/10', job-applications 3/h, rentals 60/', click-events 30/', admin-export-excel 10/h (API_SPEC:126). OK. Fixed window ghi rõ đánh đổi — chấp nhận.
- 429 + `Retry-After` (≥1s, ceil TTL). OK.
- Redis down → `RateLimitUnavailableError` → 503 fail-closed; lỗi khác ném tiếp. OK. ioredis: singleton theo process, tạo lười, connect/command timeout 2s, `maxRetriesPerRequest: 1`, có listener `error` (tránh crash). Test đóng client trong `afterAll`/`finally`. OK.
- Turnstile: fail-closed mọi nhánh (thiếu secret, HTTP lỗi, JSON lạ, `success !== true`, timeout 5s qua `AbortSignal.timeout`, lỗi mạng); token >2048 hoặc không phải string bị loại trước khi gọi CF; log không chứa token/secret (có test); gửi `remoteip` chỉ khi IP xác định. Test dùng test secret chính thức `1x…AA`/`2x…AA`. OK.
- Nguồn IP: chỉ tin `CF-Connecting-IP` khi `TRUST_CF_CONNECTING_IP === "true"` và giá trị là IP hợp lệ; không đọc XFF/X-Real-IP; fallback remoteAddress → `unknown`. OK về mặt code.
- Pipeline: rateLimit → readToken/verifyTurnstile → validate, dừng ở bước fail đầu tiên; khớp PERMISSION §5 (docs/PERMISSION.md:97-101) và API_SPEC:82. OK, có test thứ tự.
- n1 ip-hash: rút gọn IPv6 qua URL trước rồi mới nhận IPv4-mapped (hex lẫn dotted); `::ffff:0:0:1` không bị gộp nhầm. OK.
- Supply chain: `ioredis@6.0.0` (repo chính thức redis/ioredis), dependency con đều thuộc hệ ioredis, có integrity hash. Range `^6.0.0` có lockfile chốt. OK.
- `.env.example`: thêm `TRUST_CF_CONNECTING_IP=false` kèm chú thích. OK. `src/lib/env.ts` đã validate `REDIS_URL`, `TURNSTILE_SECRET_KEY`; chưa có cờ mới (xem m1).

## Findings

### [MAJOR] M1 — Chưa ghi follow-up bật `TRUST_CF_CONNECTING_IP` vào task deploy; production sẽ âm thầm dùng chung 1 bucket
- `src/lib/security/client-ip.ts:22-29` + `src/endpoints/_middleware/public-pipeline.ts:48`: route handler của Next không có socket address, nên nếu không bật cờ thì mọi khách rơi vào `unknown` → **cả site chung một bucket** (leads 5 lần/10 phút cho toàn bộ khách, job-applications 3 lần/giờ). Chỉ một người spam là khoá form lead/ứng tuyển của mọi người (DoS logic với luồng doanh thu). Fail-closed là đúng, nhưng thiếu cấu hình là lỗi vận hành nghiêm trọng và không có tín hiệu nào báo.
- Task note (dòng 92) nói "task docker/nginx", nhưng `tasks/tami-website/layer-3-task-03.md:40` chỉ có Nginx allow/deny dải IP CF, **không** có AC đặt `TRUST_CF_CONNECTING_IP=true` cho staging/prod, cũng không có bước kiểm rủi ro ngược.
- Cách sửa:
  1. Thêm AC vào `layer-3-task-03` (hoặc task deploy tương ứng): (a) đặt `TRUST_CF_CONNECTING_IP=true` trong env staging/prod; (b) Nginx chỉ `allow` dải IP Cloudflare + `deny all` ở mọi server block/port công khai, app container không publish cổng ra ngoài (chỉ Nginx truy cập được), nếu không header bị giả qua truy cập thẳng origin; (c) Nginx chuyển nguyên `CF-Connecting-IP` (không ghi đè bằng giá trị client tự đặt); (d) khuyến nghị Authenticated Origin Pulls (mTLS) vì dải IP Cloudflare dùng chung cho mọi tenant; (e) smoke test sau deploy: 2 IP khác nhau ra 2 bucket.
  2. Trong code: khi `NODE_ENV === "production"` mà rơi vào `UNKNOWN_CLIENT_IP`, ghi `console.warn` một lần mỗi process (không ghi header/IP) để lộ cấu hình thiếu.

### [MINOR]
- m1 `src/lib/env.ts:13-20` — chưa khai `TRUST_CF_CONNECTING_IP` (optional, `z.enum(["true","false"])`) nên giá trị gõ sai (`TRUE`, `1`, `yes`) bị coi là `false` mà không báo. Đề xuất thêm vào schema env.
- m2 `src/endpoints/_middleware/public-pipeline.ts:56` — log nguyên `error.cause` (object lỗi ioredis, có thể kèm address/port, args lệnh). Không lộ IP thô (khoá là hash) nhưng không nhất quán với `redis.ts:23` chỉ ghi `error.name`. Đề xuất ghi `name`/`code`.
- m3 `src/endpoints/_middleware/public-pipeline.ts:66,71` — `readToken()`/`validate()` ném lỗi (body JSON hỏng) thì pipeline ném ra → 500 thay vì 400. Hoặc bắt trong pipeline trả 400, hoặc ghi rõ trong JSDoc rằng handler phải parse body an toàn trước.
- m4 `src/lib/security/turnstile.ts:46-48` — không kiểm `hostname` (và `action` nếu widget đặt action) trong kết quả siteverify. Sitekey đã giới hạn domain nên đây là defense-in-depth; đề xuất thêm `expectedHostname` (từ `NEXT_PUBLIC_SITE_URL`) và `expectedAction` tuỳ chọn.
- m5 `src/lib/redis.ts:3-11` — singleton cấp module; khi dev HMR re-evaluate module có thể mở thêm kết nối. Đề xuất cache trên `globalThis` như pattern Payload/Prisma. Không ảnh hưởng production.
- m6 `src/lib/security/rate-limit.ts:60` — `eval` gửi nguyên script mỗi request; có thể dùng `redis.defineCommand` (EVALSHA). Tối ưu nhỏ, không bắt buộc.

## Skill gates
- aislop: skip, không cấu hình trong verify commands của profile (không chạy ngoài allowlist).
- oxlint (anti-slop): skip, oxlint not configured; `pnpm lint` PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ, hàm ≤50 dòng (dài nhất `runPublicPipeline` ~30 dòng), file ≤300 dòng, magic number có tên/chú thích, comment giải thích WHY. 0 indicator.
- ai-friendly-web: N/A (hạ tầng server, không phải trang public).
- blitzstrike: skip, không có môi trường chạy app được phép cho reviewer.
- Responsive Checklist Gate: N/A — diff không đụng UI.
- Surgical diff: OK — mọi thay đổi trace về task/follow-up n1; `admin-export-excel` khớp API_SPEC:126 (PERMISSION §5 admin bước 4).

## Residual risk
- Rủi ro spoof `CF-Connecting-IP` phụ thuộc hoàn toàn vào cấu hình Nginx/firewall ở layer-3 — chưa kiểm chứng được tới khi task đó xong.
- Fixed window cho phép ~2x limit quanh ranh giới cửa sổ (đã chấp nhận).

## Verdict
❌ **FAIL** — 1 MAJOR (M1). Sửa M1 (ghi AC follow-up vào task deploy + cảnh báo production khi rơi vào bucket `unknown`); các MINOR khuyến nghị, không chặn.
