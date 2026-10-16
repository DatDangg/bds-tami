Agent: reviewer

# Review: build-tami-website, layer-2-task-07, round 1

- **Review level:** STRICT
- **Reason:** Endpoint công khai không cần đăng nhập (`POST /api/public/click-events`), schema/migration mới (2 bảng, enum `ALTER TYPE ADD VALUE`, cột mới ở `payload_jobs`/`payload_locked_documents_rels`), cron job xoá dữ liệu (xoá hàng loạt), và cấu hình dùng chung (`payload.config.ts`, `jobs/index.ts`).
- **Blast radius:** `src/collections/ClickEvents.ts`, `ClickStatsDaily.ts`, `src/endpoints/public/click-events.ts`, `src/jobs/aggregate-click-stats.ts`, `src/jobs/index.ts` (danh sách task của process `jobs`), `src/lib/click-stats/*`, `src/payload.config.ts` (collections + endpoints), `src/payload-types.ts`, `migrations/20261016_160726_click_events.{ts,json}`, `migrations/index.ts`. Ảnh hưởng dữ liệu: bảng mới `click_events`, `click_stats_daily`, `payload_jobs_stats`; cột mới `payload_jobs.meta`, `payload_locked_documents_rels.click_events_id/click_stats_daily_id`; enum `enum_payload_jobs(_log)_task_slug` thêm giá trị. Phía dùng sau này: layer-5-task-06 (nút nổi), layer-9-task-06 / layer-13-task-01 (dashboard, data-retention).

## Verify commands + result

| Lệnh (`.context/project-config.md`) | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | Unit PASS: 326 passed / 9 failed / 85 skipped, 10 file fail. Toàn bộ là project `integration`, **ENV-BLOCKED** (Docker tắt, ECONNREFUSED 127.0.0.1:5433 và Redis). `tests/integration/click-events.test.ts` 5/5 skipped hoặc lỗi ở `beforeAll` vì không có DB. Unit mới (`src/endpoints/public/click-events.test.ts`, `src/lib/click-stats/aggregate.test.ts`) PASS |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | Không chạy: diff không đổi `package.json`/lockfile |
| `pnpm payload migrate` | Không chạy: không được phép, chỉ dùng khi deploy |

Unit test kiểm hành vi thật: chạy `handleClickEvent` thật với `Request` thật (body `text/plain` như sendBeacon), schema zod thật, pipeline thật, chỉ thay `rateLimit`/`verifyTurnstile`/`save`. Có đủ các nhánh 204, 400 (8 trường hợp), JSON hỏng, quá 2000 ký tự, 429 + `Retry-After`, 503 khi Redis lỗi, không gọi Turnstile. `bucketClickEvents`/`clickStatsDay`/`clickRetentionCutoff` được kiểm bằng giá trị cụ thể, gồm cả ranh giới 16:59/17:00 UTC.

## Đối chiếu acceptance

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| Body `{type,pagePath,refCollection?,refId?}`, zod, trả 204, 30/phút/IP, không Turnstile | OK (unit) | `click-events.ts:10-15,52-64`; unit test dòng 34-100 |
| `type` ngoài tập cho phép → 400 | OK (unit + có integration, đang ENV-BLOCKED) | unit `it.each` dòng 53; integration dòng 88 |
| Job hằng giờ, upsert cộng dồn, idempotent | OK theo code. Integration (3 sự kiện → 3, chạy lại vẫn 3, thêm 1 → 4) đang ENV-BLOCKED | `aggregate-click-stats.ts:59-115`; integration dòng 96-116 |
| Xoá > 90 ngày sau khi đã gộp | OK theo code. Integration đang ENV-BLOCKED | `aggregate-click-stats.ts:106-113`; integration dòng 118-137 |
| Chỉ admin đọc, không ai sửa qua API | OK | `ClickEvents.ts:20`, `ClickStatsDaily.ts:21`; integration dòng 148-162 |

## Đánh giá 9 quyết định của builder

1. **Idempotent qua `aggregatedAt` + transaction mỗi lô 1000: ĐÚNG.**
   - `createLocalReq` + `initTransaction(req)`. `req` được truyền vào **mọi** Local API call trong lô: find event (`:70`), find/update/create stats (`:32,41,49`), update đánh dấu (`:80`). Cộng dồn và đánh dấu nằm chung một transaction. Lỗi thì `killTransaction` rồi throw, nên job retry không cộng trùng.
   - Bulk update đánh dấu không bị cắt bớt: `node_modules/payload/dist/collections/operations/update.js:80` mặc định `limit = 0`, và `:168,182` dùng `pagination: false`. Cả 1000 id đều được đánh dấu, có kiểm `marked.errors`.
   - Lô > 1000 được lặp cho đến khi một lô trả `< 1000` (`:101-105`). Vòng lặp hữu hạn vì `upTo` cố định.
   - Dùng `createdAt <= now` cố định cho cả lượt chạy, không dùng watermark. Một event commit trễ (createdAt nhỏ hơn `now` của lượt trước) vẫn được lượt sau gộp, vì điều kiện chính là `aggregatedAt IS NULL`. Đúng.
   - Race: upsert là read-modify-write (`existing.count + bucket.count`), không phải `count = count + n` nguyên tử, và `find` không có `FOR UPDATE`. Nếu 2 runner chạy song song thì có thể đếm sai (2 transaction cùng chọn một lô event). Hiện an toàn: chỉ có 1 process `jobs` (`src/jobs/run-loop.ts:21-23`), web không `autoRun`, và theo mặc định Payload không xếp lịch thêm khi task cùng slug đang chờ/chạy. Xem MINOR-4.
2. **Unique 4 cột với `""` (NO_REF) thay NULL: ĐÚNG.** ERD ghi "unique theo 5 cột" nhưng liệt kê cả `count`, đây là lỗi tài liệu rõ ràng. Unique có `count` thì vô nghĩa và phá upsert. Dùng `""` thay NULL thì tránh được việc Postgres coi các NULL là khác nhau. Lưu ý: cột vẫn nullable (`DEFAULT ''`, migration `:24-25`). Hiện an toàn vì job luôn ghi `""`. Cần reconcile ERD (as-built), không cần gap.
3. **Ngày theo giờ VN, lưu 00:00 UTC của ngày VN: ĐÚNG, cần ghi vào doc.** Dashboard hiển thị theo giờ VN thì 00:00Z là 07:00 VN, vẫn đúng ngày. Nhưng dashboard lọc theo khoảng ngày phải dùng mốc 00:00Z, không được dùng 00:00+07. Ghi vào ERD §4.13 để layer-9/13 không làm sai.
4. **Chỉ xoá > 90 ngày khi đã có `aggregatedAt`: ĐÚNG.** Lô gộp chạy trước bước xoá, nên event quá hạn mà chưa gộp (job ngừng lâu) được gộp rồi mới xoá. Integration dòng 118-137 có kiểm trường hợp này (ENV-BLOCKED).
5. **Endpoint: ĐÚNG về bảo mật lõi.**
   - Thứ tự: `runPublicPipeline` với `turnstile:false`, `validate` được gọi bên trong pipeline nên body chỉ đọc sau rate limit. Redis lỗi trả 503 fail-closed (unit test dòng 82-92).
   - Zod chặt: `refCollection` `^[a-z0-9-]+$` ≤64, `refId` `^[A-Za-z0-9_-]+$` ≤64, `pagePath` bắt đầu bằng `/` và ≤500. Ghi bằng Local API qua Drizzle có tham số hoá, không có SQLi.
   - Không lộ thông tin: response luôn 204 và không tra cứu bản ghi, nên không enumerate được tồn tại của `refId`.
   - Không lưu IP thô. ERD §4.13 không có `ipHash` cho `click-events`, nên không lưu là đúng. IP chỉ dùng cho khoá rate limit `rl:click-events:<ipHash>`.
   - Còn lại: có thể ghi rác qua `refCollection` tuỳ ý (MINOR-1), `pagePath` dạng `//host` (MINOR-2), body được đọc hết rồi mới kiểm độ dài (MINOR-3).
6. **Access: ĐÚNG.** `read: isAdmin`, còn `create/update/delete: denyAll` ở cả 2 collection. Chỉ Local API `overrideAccess: true` phía server ghi được. Admin cũng không sửa được trên UI (đúng PERMISSION §3, "Chỉ đọc"). `admin.hidden` ẩn với người không phải admin.
7. **Cron `0 0 * * * *`: ĐÚNG.** Payload dùng cron 6 trường (có giây), nên đây là đầu mỗi giờ. Lịch được xếp vào hàng đợi `default` qua `handleSchedules()` của process `jobs`, và `jobs.run()` chạy hàng đợi `default`. Retry 3 lần, backoff exponential, an toàn vì mỗi lô idempotent.
8. **Migration: additive, KHÔNG phải `HIGH_RISK_MIGRATION`.**
   - `up` chỉ có `CREATE TYPE/TABLE/INDEX`, `ADD COLUMN` nullable, `ADD VALUE` enum, và FK trên cột mới (toàn NULL). Không có DROP, đổi type, `SET NOT NULL`, UNIQUE/FK trên dữ liệu cũ, hay backfill.
   - `ALTER TYPE ... ADD VALUE` trong transaction: Postgres ≥ 12 cho phép. Giá trị mới chỉ không dùng được trong chính transaction đó, và migration này không dùng nó. Dự án dùng Postgres 16 (`.devops/templates/docker-vps.md:58`), nên chạy được.
   - `payload_jobs_stats` và `payload_jobs.meta` là phần Payload tự sinh khi có task dùng `schedule`. Cần thiết và additive.
   - `down` có thao tác phá huỷ (bản chất của down), nhưng không chạy trên staging/prod.
   - Việc apply migration thật đang ENV-BLOCKED.
9. **Git stash + pop: KHÔNG mất gì.** `git stash list` rỗng. `git status` có đủ mọi file liệt kê trong task và prompt (5 file đã sửa + 9 path mới, kể cả `src/endpoints/public/` gồm `click-events.ts` và `.test.ts`, và `src/lib/click-stats/` gồm `aggregate.ts`, `aggregate.test.ts`, `click-types.ts`). Typecheck/build PASS, nên import không bị đứt.

## Findings

Không có CRITICAL. Không có MAJOR.

- **[MINOR-1] `refCollection` không có allow-list**: `src/endpoints/public/click-events.ts:13`. Khách có thể gửi `refCollection`/`refId` tuỳ ý, mỗi cặp mới tạo thêm một dòng `click-stats-daily`. Dòng thống kê đúng không bị ảnh hưởng, nhưng bảng phình và dashboard có dòng rác. Quy mô bị chặn bởi 30/phút/IP. **Fix đề xuất:** `z.enum(["rentals","property-posts","projects","news","services","job-postings","pages"])` (ERD §2), hoặc ghi gap để chốt tập hợp này ở task nút nổi / dashboard.
- **[MINOR-2] `pagePath` nhận `//evil.example`**: `click-events.ts:12`. Đây là URL protocol-relative. Hiện chỉ lưu dạng chữ, nhưng nếu dashboard sau này render thành link thì thành open redirect. **Fix:** thêm `.refine((p) => !p.startsWith("//"))`, hoặc ghi chú cho dashboard không render thành link.
- **[MINOR-3] Đọc toàn bộ body rồi mới kiểm 2000 ký tự**: `click-events.ts:30-31`. Có rate limit chặn trước và Nginx mặc định `client_max_body_size 1m`, nên rủi ro thấp. **Fix (tuỳ chọn):** kiểm header `Content-Length` > 2000 thì trả 400 trước khi `text()`.
- **[MINOR-4] Upsert không nguyên tử, phụ thuộc giả định chỉ có 1 runner**: `aggregate-click-stats.ts:20-51`. **Fix:** ghi rõ trong JSDoc/ARCHITECTURE §5.4 rằng chỉ có một process `jobs`. Nếu sau này scale ra nhiều worker thì đổi sang `INSERT ... ON CONFLICT DO UPDATE SET count = count + EXCLUDED.count`.
- **[MINOR-5] Thiếu integration test cho tính chọn lọc của `equals: ""`**: `tests/integration/click-events.test.ts:96-116` chỉ có các dòng NO_REF. Không có test nào cho thấy `refCollection: { equals: "" }` loại được dòng có ref cùng ngày/loại. Nếu adapter bỏ qua điều kiện chuỗi rỗng thì lượt bấm sẽ bị cộng nhầm vào dòng của bản ghi khác. **Fix:** thêm case "1 event rentals/r1 + 1 event không ref, cùng ngày/loại → 2 dòng, mỗi dòng count 1, chạy lại vẫn 1".
- **[MINOR-6] Xoá quá hạn không chia lô, không nằm trong transaction**: `aggregate-click-stats.ts:106-112`. Bulk delete của Payload tải hết bản ghi rồi xoá từng bản. Thường mỗi lượt chỉ khoảng 1 giờ dữ liệu, nhưng sau khi job ngừng lâu thì lượt đầu có thể rất nặng. Lỗi giữa chừng thì xoá một phần, vẫn an toàn vì chỉ xoá bản đã gộp. **Fix (tuỳ chọn):** xoá theo lô có `limit`.
- **[MINOR-7] Task ghi `Decision impact: NO`** (`tasks/tami-website/layer-2-task-07.md:18`) trong khi builder có 3 quyết định thiết kế: unique 4 cột, `""` thay NULL, ngày theo giờ VN lưu 00:00Z. **Fix:** ghi decision log ngắn khi close-out, hoặc đưa vào ERD as-built (xem dưới).

## Doc impact đề xuất (as-built, reconcile khi close-out)

- **ERD §4.13:** thêm `click-events.aggregatedAt` (date, index; dấu đã gộp). Sửa "unique theo 5 cột" thành unique `(date, type, refCollection, refId)`. Ghi `refCollection/refId` của thống kê = `""` khi không gắn bản ghi. Ghi `date` = 00:00 UTC của ngày theo giờ VN (UTC+7), dashboard lọc khoảng ngày theo mốc này.
- **ERD §7:** xoá `click-events` có `createdAt` < now − 90 ngày **và** đã có `aggregatedAt`.
- **API_SPEC §3.4:** body nhận JSON kể cả khi Content-Type là `text/plain` (sendBeacon). Ràng buộc: `pagePath` bắt đầu bằng `/` ≤500; `refCollection` `[a-z0-9-]` ≤64; `refId` `[A-Za-z0-9_-]` ≤64; nullable. Body ≤ 2000 ký tự. Mã: 204 / 400 / 429 (+`Retry-After`) / 503.
- **ARCHITECTURE §5.4:** ghi chi tiết "đầu mỗi giờ (`0 0 * * * *`), hàng đợi `default`" (tuỳ chọn).
- Không cần gap register: không có chỗ code lệch intent (`SPECIFICATIONS.md` FR-PUB-12 chỉ yêu cầu "ghi nhận lượt bấm").

## Responsive Checklist Gate

N/A. Diff không đụng UI (không có route/component/CSS). Nút nổi làm ở task layout-utilities.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, không nằm trong verify commands được phép của reviewer (Bash bị giới hạn ở verify commands + git) |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`). ESLint dự án PASS |
| ocr (open-code-review) | skip, ocr không có trong verify commands được phép |
| AI-readable | OK. Mọi file < 300 dòng, hàm dài nhất `aggregateOneBatch` khoảng 33 dòng. Tên rõ, hằng số có tên (`BATCH_SIZE`, `CLICK_RETENTION_DAYS`, `VIETNAM_UTC_OFFSET_MS`, `MAX_BODY_CHARS`), comment giải thích WHY. 0 indicator |
| ai-friendly-web | N/A, endpoint API, không phải trang public |
| blitzstrike | skip, chưa cài và không có môi trường chạy được |

## Residual risk (ENV-BLOCKED, chỉ DB/Redis thật mới chứng minh được)

- Migration chưa apply thật (enum `ADD VALUE` trong transaction của `payload migrate`, unique index, FK). Phân tích tĩnh cho thấy hợp lệ trên PG16.
- Ngữ nghĩa where của Drizzle adapter: `aggregatedAt exists:false/true` (IS NULL / IS NOT NULL), `createdAt less_than_equal/less_than`, `refCollection equals ""`. Chưa xác minh được `find` với `limit:1000, pagination:false` có áp `limit` không (`@payloadcms/drizzle` không hoist trong pnpm). Nếu không áp thì lô lớn hơn 1000 nhưng vẫn đúng số, chỉ tốn bộ nhớ.
- Transaction thật (rollback khi lỗi giữa lô), 429 qua Redis thật, REST 403, `req.text()` của PayloadRequest trong `handleEndpoints`.
- **Bắt buộc** chạy lại `tests/integration/click-events.test.ts` khi bật Docker, trước khi promote staging, và tốt nhất là kèm case ở MINOR-5.

## Verdict

**PASS.** Không có CRITICAL hay MAJOR. 7 MINOR là khuyến nghị, không chặn PASS. Integration ENV-BLOCKED được ghi residual risk, giống tiền lệ layer-2-task-05/06.
