Agent: reviewer

# Review: build/tami-website · layer-2-task-06 · round 1: `GET /api/health` (DB, Redis, S3)

- **Review level:** NORMAL
- **Reason:** Endpoint public, chỉ đọc, không có auth/schema/dữ liệu người dùng, scope hẹp (5 file mới). Không có risk đỏ theo danh sách STRICT. Endpoint này nằm trên đường deploy (CD health gate, Docker HEALTHCHECK, Uptime Kuma), nên reviewer soi kỹ riêng hành vi khi một thành phần hỏng.
- **Blast radius:** `src/app/(payload)/api/health/route.ts` (route mới, đứng cạnh catch-all `/api/[...slug]`), `src/lib/health/run-health-checks.ts`, `src/lib/health/probes.ts` (tạo S3Client riêng, gọi `getPayload` và `getRedis` dùng chung), các test đi kèm. Ảnh hưởng gián tiếp: process Next/Payload khi DB chết (xem M1), và các task sau dùng endpoint này: layer-3-task-01 (monitoring), layer-3-task-03 (Docker HEALTHCHECK), layer-4-task-05/layer-6-task-01 (CD health gate).

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (full) | 305 passed / 9 failed / 80 skipped. Cả 9 test fail là integration, lỗi ECONNREFUSED 127.0.0.1:5433 (Docker tắt, ENV-BLOCKED). Có 6 unhandled errors |
| `pnpm test -- src/lib/health tests/integration/health.test.ts` | unit 4/4 PASS. Integration: "Redis tắt → 503" PASS, "all up → 200" FAIL (ENV-BLOCKED, 503 vì DB down). **Có 2 Unhandled Rejection `{message: undefined}`**, chỉ chạy test health mà vẫn ra (xem M1) |
| `pnpm build` | PASS. Route table có cả `ƒ /api/[...slug]` và `ƒ /api/health` |
| `pnpm install --frozen-lockfile` | không chạy (không đổi dependency) |

## Acceptance check

| Criterion | Result | Evidence |
|---|---|---|
| 200 `{status:"ok", checks:{db,redis,storage}}`; 503 nếu một thành phần lỗi | OK theo code và unit test. Đường 200 thật bị ENV-BLOCKED | `route.ts:9-12`, `run-health-checks.ts:42-43`, unit test 1-2 |
| Không lộ version/host/chuỗi kết nối/stack trong response | OK | `probeStatus` nuốt lỗi (`run-health-checks.ts:25-26`); unit test và integration test có assert regex. Lưu ý: Payload logger vẫn ghi host:port và stack vào log server. Chấp nhận được (log nội bộ, không trả ra client) |
| Timeout mỗi check ≤ 2s | OK cho thời gian phản hồi | Dùng `Promise.race` cộng timer, timer được `clearTimeout` trong `finally` (`:27-29`). 3 probe chạy song song nên tổng ≤ ~2s. Sau timeout, probe vẫn chạy nền (xem m2) |
| `Cache-Control: no-store` trên 200 và 503 | OK | `route.ts:11` set header chung cho cả hai status; integration test 503 có assert |
| Không bị catch-all `/api/[...slug]` hay proxy nuốt route | OK | Next ưu tiên segment tĩnh hơn catch-all; build liệt kê đủ cả 2 route; matcher của `src/proxy.ts:16` loại trừ `api/` |
| Dùng lại Redis client sẵn có | OK | `getRedis()` (`src/lib/redis.ts:15-20`: `connectTimeout`/`commandTimeout` 2s, `maxRetriesPerRequest: 1`) |
| Rate limit | N/A theo spec | Cột rate limit của dòng `/api/health` trong API_SPEC §3 là `—`; endpoint rẻ, không lộ dữ liệu. Không bắt buộc |

## Findings

### [MAJOR] M1: Gọi DB probe lúc Postgres chết gây Unhandled Rejection trong process

- `src/lib/health/probes.ts:25-27`: `getPayload({ config })` khi DB không kết nối được. `@payloadcms/db-postgres/dist/connect.js` log lỗi rồi gọi `rejectInitializing()`. Promise `initializing` nội bộ của adapter không có ai `await`/`catch`, nên mỗi lần health chạy lúc DB down sinh 1 unhandled rejection. Bằng chứng: khi chỉ chạy `vitest run src/lib/health tests/integration/health.test.ts`, vitest báo "2 unhandled errors … Unhandled Rejection { message: undefined }". Đúng 2 lần gọi `GET` và đúng 2 dòng log "cannot connect to Postgres".
- Vì sao là MAJOR: thời điểm endpoint được gọi đúng lúc này là khi DB hỏng, và nó bị gọi định kỳ (Uptime Kuma mỗi phút, Docker HEALTHCHECK). Mặc định Node ≥15 dùng `--unhandled-rejections=throw`, nên nếu runtime không cài handler riêng thì process bị kill. Khi đó một sự cố DB tạm thời biến thành app sập hoàn toàn và Docker restart loop. Reviewer không xác minh được Next/Payload có cài `unhandledRejection` handler trong production hay không. Ngoài ra vitest coi đây là error làm `pnpm test` exit non-zero, nên dễ thành false-positive hoặc che lỗi thật.
- Fix đề xuất, chọn 1 trong 2:
  - (a) DB probe không đi qua `getPayload`: dùng một `pg.Pool` nhỏ riêng, lazy giống S3Client (`max: 1`, `connectionTimeoutMillis: 2000`, `query_timeout`/`statement_timeout` 2000), connection string là `getEnv().DATABASE_URL`, chạy `select 1`. Cách này cũng xử lý luôn m2 cho DB.
  - (b) Nếu muốn giữ pool của Payload: chỉ query khi Payload đã init. Khi chưa init thì phải bảo đảm promise nội bộ có handler. Cách này phụ thuộc chi tiết nội bộ của adapter, nên (a) sạch hơn.
- Phải thêm test: "DB down (Postgres không chạy) → 503 `db: "down"` và không có unhandled rejection". Có thể chạy được ngay trong môi trường Docker tắt.

### [MINOR] m1: Cấu hình S3 bị nhân đôi và magic number timeout

- `probes.ts:14-19` chép lại y nguyên `s3Config` ở `payload.config.ts:24-29`. Nên export object config đó, hoặc tách ra `src/lib/s3-config.ts`, và cả 2 nơi cùng dùng. Như vậy đổi endpoint/region/credentials không bị lệch. Dùng S3Client riêng (lazy, chỉ HeadBucket) thì chấp nhận được, vì plugin storage của Payload không expose client. Chỉ là không nên nhân đôi config.
- `probes.ts:34`: `AbortSignal.timeout(2_000)` nên dùng `HEALTH_CHECK_TIMEOUT_MS`.

### [MINOR] m2: Probe chạy nền sau khi đã timeout

- `run-health-checks.ts:23`: race chỉ chặn thời gian phản hồi, không huỷ probe. Storage có abortSignal, Redis có `commandTimeout`, nên ổn. Riêng DB thì `pool.query` không có `connectionTimeoutMillis` (`payload.config.ts:64` chỉ có `connectionString`). Khi DB bị black-hole, query treo đến TCP timeout của OS và chiếm slot pool của app. Sửa theo M1(a) là hết.

### [MINOR] m3: Storage chỉ kiểm bucket private

- `probes.ts:33`: chỉ HeadBucket `S3_BUCKET_PRIVATE`. Public bucket (media) sai cấu hình hoặc thiếu thì vẫn báo `up`. Cân nhắc check cả hai bucket bằng `Promise.all`.

### [MINOR] m4: Doc impact, kết luận cho câu hỏi của Builder

- API_SPEC §3 chỉ có dòng bảng, chưa mô tả shape. Shape trong code `{status:"ok"|"down", checks:{db,redis,storage: "up"|"down"}}` khớp acceptance của task ("ok", `redis: "down"`). Đây là contract mà CD/Uptime Kuma/HEALTHCHECK ở các task sau dựa vào. **Kết luận: KHÔNG phải "no doc impact"**. Thêm một mục as-built ngắn `3.x GET /api/health` vào `docs/API_SPEC.md`: shape, 200/503, `Cache-Control: no-store`, timeout 2s mỗi check, không auth, không rate limit. Việc này nằm ở close-out, không chặn code.

## Responsive Checklist Gate

N/A, diff không đụng UI (chỉ API route và lib).

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip, `aislop: command not found` |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`). ESLint PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK. Tên rõ, hàm ≤ 50 dòng, file ≤ 45 dòng, indirection 2 bước, comment ghi WHY. Chỉ có 1 indicator (magic number `2_000` ở `probes.ts:34`), dưới ngưỡng 3 |
| ai-friendly-web | N/A, endpoint vận hành nội bộ, không phải trang public |
| blitzstrike | N/A, NORMAL, không phải task STRICT nhạy cảm |

## Testing assessment

- Unit test kiểm hành vi thật: all-up, fail-không-lộ-message, treo-quá-timeout (có đo thời gian), throw đồng bộ. Tốt.
- Integration "Redis tắt" mock tại module `@/lib/redis` nên đi qua route thật. Tuy vậy trong môi trường hiện tại nó PASS khi DB cũng đang down, nên chỉ assert `redis` là đúng. Không false-confidence vì giá trị redis bị ép bởi mock.
- Thiếu test cho trường hợp DB down: đây là case quan trọng nhất và chạy được mà không cần hạ tầng (xem M1).

## Residual risk

- Đường 200 (DB, Redis, SeaweedFS thật) ENV-BLOCKED: chưa xác minh `payload.db.pool.query` và HeadBucket thực tế trên SeaweedFS. Phải chạy lại integration khi có Docker.
- Chưa xác minh Next production có handler `unhandledRejection` hay không. Đó là lý do M1 tính là MAJOR chứ không phải MINOR.

## Verdict

**FAIL** (1 MAJOR: M1). Builder cần làm:
1. Sửa M1: DB probe dùng pool riêng có timeout, không gọi `getPayload`. Thêm test DB-down kiểm 503, `db: "down"` và không có unhandled rejection.
2. Nên sửa luôn m1–m3.
3. Close-out: thêm shape `/api/health` vào `docs/API_SPEC.md` (m4).
