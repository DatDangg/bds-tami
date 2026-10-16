Agent: reviewer

# Review — build-tami-website layer-1-task-06 (round 2)

- Task: `tasks/tami-website/layer-1-task-06.md`; diff chưa commit so với HEAD `46bf310`. Round 1: FAIL (M1).
- Review level: **STRICT**
- Reason: hạ tầng bảo mật dùng chung cho mọi `/api/public/*` (rate limit, Turnstile, nguồn IP, fail-closed), dependency mới `ioredis`, thêm biến vào env schema (ảnh hưởng boot/build/CI).
- Blast radius: `src/lib/{redis,env}.ts`, `src/lib/security/{rate-limit,turnstile,client-ip,ip-hash}.ts`, `src/endpoints/_middleware/public-pipeline.ts`; các endpoint công khai sau này; `getEnv()` gọi lúc import `payload.config.ts` (build + boot); `.env.example`; lockfile; task deploy `layer-3-task-03`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 25 files / 273 tests (round 1: 266; +7 test mới) |
| `pnpm build` | PASS (exit 0) |

## Kiểm các điểm sửa
- **M1 — follow-up deploy:** OK. `tasks/tami-website/layer-3-task-03.md:100-105` có mục BẮT BUỘC đủ 5 ý: bật cờ staging/prod, Nginx allow dải CF + deny all, cổng app chỉ bind 127.0.0.1, chuyển nguyên `CF-Connecting-IP`, đề xuất Authenticated Origin Pulls, smoke test 2 IP ra 2 bucket.
- **M1 — cảnh báo bucket unknown:** OK. `client-ip.ts:41-45` warn 1 lần/process khi `NODE_ENV=production` và rơi vào `unknown`; không log IP/header.
- **m1 env:** OK. `env.ts:10` `z.enum(["true","false"]).default("false")`; CI (`.github/workflows/ci.yml:45-65`) không đặt biến → mặc định false, build/test CI không vỡ. Giá trị sai làm `getEnv()` ném lúc boot (fail loud, đúng ý).
- **m2 log Redis:** OK. `public-pipeline.ts:263-264` chỉ ghi `cause.name`; có test không lộ URL/credential.
- **m3 readToken/validate ném → 400:** OK, có test.
- **m5 redis globalThis:** OK (`redis.ts:4,12,26,32-34`); `closeRedis` xoá cache trước khi quit.
- m4, m6: bỏ qua theo phạm vi (không bắt buộc) — chấp nhận.
- Regression: không thấy; thứ tự pipeline, 429/503, fail-closed Turnstile giữ nguyên, test cũ vẫn PASS.

## Findings

### [CRITICAL] — none
### [MAJOR] — none

### [MINOR]
- n1 `src/endpoints/_middleware/public-pipeline.ts:284-289` — try/catch quanh `validate()` bắt **mọi** lỗi thành 400 và chỉ log `error.name` ở mức `warn`. Bug server thật (vd `TypeError` trong schema/transform, lỗi DB nếu ai đó đặt query trong `validate`) sẽ hiện thành "Dữ liệu không hợp lệ", khó phát hiện. Không chặn vì contract hiện tại `validate` chỉ là parse + zod. Đề xuất: chỉ map 400 cho `SyntaxError` (JSON hỏng) / lỗi parse body (vd `TypeError` của `request.formData()`), còn lại ném tiếp; hoặc ít nhất ghi rõ JSDoc của `validate` "không làm I/O/side-effect" và log `console.error` cho lỗi không phải `SyntaxError`.
- n2 `src/lib/env.ts:15` vs `:38` — `parseTrustCloudflareFlag("")` coi chuỗi rỗng = false, nhưng `envSchema` (dùng bởi `getEnv()` lúc boot) từ chối `TRUST_CF_CONNECTING_IP=` rỗng → app không khởi động. Không nguy hiểm (fail loud) nhưng không nhất quán; đề xuất cho envSchema nhận `""` như thiếu (preprocess) hoặc ghi chú trong `.env.example`.
- n3 `src/lib/security/client-ip.ts:26` — `parseTrustCloudflareFlag(process.env…)` chạy lại mỗi request (rẻ, nhưng giá trị lạ sẽ ném → 500 mỗi request nếu boot không chạy `getEnv()`). Hiện `payload.config.ts` gọi `getEnv()` khi import nên đã chặn ở boot; có thể đọc từ `getEnv()` cho một nguồn sự thật. Không bắt buộc.

## Skill gates
- Responsive Checklist Gate: N/A — diff không đụng UI.
- aislop: skip, không có trong verify commands của profile.
- oxlint (anti-slop): skip, oxlint not configured; `pnpm lint` PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK — tên rõ, hàm ≤50 dòng (`runPublicPipeline` ~40 dòng), file ≤300 dòng, comment giải thích WHY. 0 indicator.
- ai-friendly-web: N/A (hạ tầng server).
- blitzstrike: skip, không có môi trường chạy app cho reviewer.
- Surgical diff: OK — mọi thay đổi trace về task / findings round 1.

## Residual risk
- Chống giả `CF-Connecting-IP` phụ thuộc cấu hình Nginx/firewall ở `layer-3-task-03` — đã ghi follow-up bắt buộc, chưa kiểm chứng tới khi task đó xong.
- Fixed window ~2x limit quanh ranh giới cửa sổ (đã chấp nhận round 1).

## Verdict
✅ **PASS** — M1 đã đóng (follow-up deploy đủ + cảnh báo production); không còn CRITICAL/MAJOR. 3 MINOR khuyến nghị, không chặn.
