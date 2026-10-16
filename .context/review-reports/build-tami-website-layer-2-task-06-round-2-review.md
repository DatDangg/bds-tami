Agent: reviewer

# Review: build/tami-website · layer-2-task-06 · round 2: `GET /api/health` (DB, Redis, S3)

- **Review level:** NORMAL
- **Reason:** Đây là round re-review sau khi sửa M1 và m1–m3 của round 1. Endpoint public nhưng chỉ đọc. Không có auth, schema hay dữ liệu người dùng. Diff có đụng `payload.config.ts` (config dùng chung), nhưng chỉ là tách config S3 ra hàm riêng, giá trị giữ nguyên, nên không cần lên STRICT.
- **Blast radius:**
  - `src/app/(payload)/api/health/route.ts`, `src/lib/health/{probes,run-health-checks}.ts` cùng test đi kèm.
  - `src/lib/s3-config.ts` (mới). Cả plugin storage của Payload (`payload.config.ts`) và health probe đều dùng file này.
  - Một `pg.Pool` mới (max 1 kết nối) mở tới Postgres, chỉ khi có request health.
  - Endpoint này sẽ được dùng ở: monitoring (layer-3-task-01), Docker HEALTHCHECK (layer-3-task-03), CD health gate (layer-4-task-05/layer-6-task-01).

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run src/lib/health tests/integration/health.test.ts` | 6/7 PASS. **Không còn Unhandled Rejection** (round 1 có 2). Test DB-down mới (`probes.test.ts`) PASS. "Redis tắt → 503" PASS. "all up → 200" FAIL vì ENV-BLOCKED: Docker tắt nên DB/Redis/S3 down, trả 503 là đúng |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (full) | 306 passed / 9 failed / 80 skipped. Cả 9 test fail là integration bị ENV-BLOCKED (ECONNREFUSED). Còn **4** unhandled errors, round 1 là 6. Phần giảm đúng bằng 2 lỗi do health gây ra. 4 lỗi còn lại đến từ integration test khác gọi `getPayload` lúc DB down: có sẵn, ngoài scope (xem Residual risk) |
| `pnpm build` | PASS. Route table có `ƒ /api/[...slug]` và `ƒ /api/health` |

## Kiểm các điểm round 1

| Item | Result | Evidence |
|---|---|---|
| M1: unhandled rejection khi DB chết | **FIXED** | `probes.ts:18-29`: dùng `pg.Pool` riêng, lazy singleton, `max: 1`, `connectionTimeoutMillis` và `query_timeout` = `HEALTH_CHECK_TIMEOUT_MS`, có `on("error")` để lỗi của client nhàn rỗi không làm crash process. Không còn gọi `getPayload`. Test `probes.test.ts:19-32` trỏ DB vào cổng chết, kiểm `db: down`, không lộ `secret`/host và listener `unhandledRejection` rỗng. Chạy riêng nhóm test health: 0 unhandled |
| Pool có leak hay tạo lại mỗi request không | OK | `probes.ts:19`: tạo pool 1 lần cho mỗi module instance. `max: 1` giới hạn tối đa 1 kết nối. Khi nhiều request health tới cùng lúc, request phải chờ slot sẽ bị `connectionTimeoutMillis` chặn, không treo |
| m2: DB không có timeout | FIXED | `connectionTimeoutMillis` và `query_timeout` ở `probes.ts:23-24`. Pool của app không còn bị chiếm slot |
| m1: config S3 lặp, hardcode 2000 | FIXED | `s3-config.ts:4-12` là nguồn duy nhất. `payload.config.ts` dùng `getS3ClientConfig()`. Abort signal dùng `HEALTH_CHECK_TIMEOUT_MS` (`probes.ts:33`) |
| Refactor `payload.config.ts` không đổi hành vi S3 storage | OK | So `git diff`: endpoint `env.S3_ENDPOINT`, region `"us-east-1"`, `forcePathStyle: true`, credentials `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` khớp từng giá trị. Comment WHY về path-style đã chuyển sang `s3-config.ts:3` |
| `HEALTH_CHECK_TIMEOUT_MS` dùng nhất quán | OK | Race timeout (`run-health-checks.ts:35`), pool (`probes.ts:23-24`), S3 abort (`probes.ts:33`). Redis dùng `commandTimeout` 2s có sẵn ở `src/lib/redis.ts`, cùng giá trị nhưng là hằng số riêng. Chấp nhận được |
| m3: storage kiểm cả 2 bucket | FIXED | `probes.ts:47`: `Promise.all` HeadBucket cho cả public và private |
| Không lộ thông tin | OK | `probeStatus` nuốt message (`run-health-checks.ts:25-26`). Response chỉ có `up`/`down`. Có test assert ở cả unit và integration |
| Acceptance round 1 (200/503, no-store, route không bị catch-all nuốt, dùng lại Redis client) | Không regression | `route.ts` không đổi logic. Build có đủ route. Test "Redis tắt → 503 + no-store" PASS |
| m4: doc API_SPEC | Pending close-out | Primary thêm mục `GET /api/health` (shape, 200/503, no-store, timeout 2s) vào `docs/API_SPEC.md` ở bước close-out. Không tính FAIL round này |

## Findings

Không có CRITICAL hoặc MAJOR.

### [MINOR] n1: Tên test nói "503" nhưng không kiểm HTTP status
- `src/lib/health/probes.test.ts:20`: tên test ghi "503", nhưng test chỉ kiểm `report.status === "down"` của `runHealthChecks`, không đi qua route. Fix: đổi tên thành "status: down", hoặc import `GET` từ route rồi assert `res.status === 503`. Không chặn PASS.

### [MINOR] n2: Pool health không có hàm đóng
- `src/lib/health/probes.ts:9-29`: không export hàm `close`. Trong test, pool tự hết vì vitest kết thúc worker. Ở Next dev, HMR có thể tạo thêm instance pool (mỗi pool 1 kết nối, idle tự đóng theo mặc định của `pg`). Production không bị ảnh hưởng. Không cần sửa ngay. Nếu sau này cần graceful shutdown thì thêm `closeHealthDbPool()`.

## Responsive Checklist Gate

N/A. Diff không đụng UI, chỉ có API route, lib và config.

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip, `aislop` chưa cài (như round 1) |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK. Tên rõ. Hàm ≤ 50 dòng, file ≤ 51 dòng. Indirection ≤ 2 bước. Không còn magic number. Comment ghi WHY (`probes.ts:17,26`, `s3-config.ts:3`). 0 indicator |
| ai-friendly-web | N/A, endpoint vận hành, không phải trang public |
| blitzstrike | N/A, NORMAL, không phải task STRICT |

## Residual risk

- Đường 200 thật (DB, Redis, SeaweedFS đều chạy) bị ENV-BLOCKED. Chưa xác minh `select 1` qua pool riêng và HeadBucket trên 2 bucket SeaweedFS thật. Cần chạy lại `tests/integration/health.test.ts` khi bật Docker, trước khi dùng endpoint làm CD gate.
- 4 unhandled rejection còn lại trong `pnpm test` full đến từ các integration test khác (`getPayload` lúc DB down, cùng root cause với M1 của round 1). Có sẵn, **ngoài scope, đề xuất task riêng**. Nếu runtime production không có handler `unhandledRejection`, mọi route gọi `getPayload` lúc DB chết đều có thể làm process crash.

## Verdict

**PASS**. M1 đã sửa và có test chứng minh. m1–m3 cũng đã sửa. Chỉ còn 2 MINOR không chặn. m4 (doc API_SPEC) primary làm ở close-out.
