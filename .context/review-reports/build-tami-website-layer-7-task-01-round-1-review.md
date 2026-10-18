Agent: reviewer

# Review — build/tami-website · layer-7-task-01 (property-posts + expire-offers) · round 1

- **Review level:** STRICT
- **Reason:** có schema/migration (bảng mới + `ALTER TYPE` enum jobs), RBAC sale/admin, cron/background job, endpoint nội bộ mới có xác thực, sửa nginx/compose dùng chung, đổi hành vi validator `services.coverImage`/`news.cover` dùng chung.
- **Blast radius:** `src/collections/PropertyPosts.ts` (mới), `src/fields/cover-image.ts` (dùng chung cho News/Services/PropertyPosts), `src/fields/ward-in-province.ts`, `src/hooks/wards/guard-delete.ts`, `src/collections/Provinces.ts`, `src/jobs/{expire-offers,close-job-postings,index}.ts`, `src/lib/revalidate/internal-revalidate.ts` + route `src/app/(payload)/api/internal/revalidate/route.ts`, `src/lib/env.ts`, `public-queries.ts` allowlist, migration `20261018_075627_property_posts`, `docker/nginx/*.conf` (3 conf), `docker/docker-compose.{staging,prod}.yml`, docs API_SPEC/ARCHITECTURE/ERD.

## Verify commands + result (từ `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 146 file, 1.579 test, không skip (integration DB tạm chạy thật) |
| `pnpm build` | PASS; route `ƒ /api/internal/revalidate` có trong output |
| `pnpm payload migrate` | không chạy (reviewer không chạy migration; chỉ đọc SQL) |

## Responsive Checklist Gate

N/A: diff không đụng UI (không route/component/CSS công khai; trang `/tin-bds` để L7-T03/L8).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` chưa cài (`command -v aislop` không có) |
| oxlint (anti-slop) | skip, oxlint chưa cấu hình (không có `.oxlintrc.json`/`oxlint.json`); ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr chưa cài |
| AI-readable | OK: file ≤ 300 dòng, hàm ≤ 50 dòng, tên rõ, hằng số có tên (`MAX_PATHS_PER_REQUEST`, `MAX_EXPIRED_PER_RUN`, `REQUEST_TIMEOUT_MS`), comment ghi WHY, docs ARCHITECTURE/API_SPEC cập nhật luồng mới. 0 indicator |
| ai-friendly-web | N/A (không có thay đổi web public) |
| blitzstrike | skip, không cài/không có môi trường được phép; đã review route nội bộ thủ công (bên dưới) |

## Kiểm tra trọng điểm

- **Route nội bộ:** so token bằng `timingSafeEqual` trên 2 digest HMAC có độ dài bằng nhau (`internal-revalidate.ts:32-37`) → OK. Token = HMAC(PAYLOAD_SECRET, nhãn) nên lộ token không lộ secret. Body ≤ 64k ký tự, ≤ 200 path, regex chỉ nhận `/{vi|en}(/seg)*` và chặn segment bắt đầu bằng `.` → không revalidate tuỳ ý ngoài trang công khai. 401/400 có `no-store`. Không có rò rỉ.
- **Nginx:** `location ^~ /api/internal/ { return 404; }` có ở cả `tami.conf:60`, `tami-staging.conf:68`, `tami-staging-sslip.conf:69`; `tami-staging-sslip-http.conf` không `proxy_pass` tới app. Nginx so location trên URI đã chuẩn hoá (decode `%xx`, gộp `//`) nên biến thể encode không lách được. OK.
- **Compose/deploy:** `INTERNAL_APP_URL: http://app:3000` trong anchor `x-app-environment`, service `jobs` dùng `<<: *app-environment`, cùng network `internal`; Dockerfile `HOSTNAME=0.0.0.0 PORT=3000` → `app:3000` với tới được. Env schema `INTERNAL_APP_URL` optional nên không phá deploy staging hiện có (không cần thêm vào `.env` server).
- **Cron/timezone:** `0 5 17 * * *` UTC = 00:05 VN. `offerJustEndedWhere` = `[startVN(now) - 1 ngày, startVN(now))`, `offerNotEndedWhere` = `endAt IS NULL OR endAt >= startVN(now)` = phủ định chính xác của `isOfferEnded` (dựa `careers/deadline`). Có test biên giờ VN. Idempotent (chỉ revalidate, không ghi DB).
- **RBAC / xoá mềm / guard xoá:** dùng `withContentDefaults` như news/rentals; integration test phủ sale sửa/xoá bài sale khác → 403, sale xoá mềm không khôi phục/xoá hẳn, admin khôi phục/xoá hẳn, khách không tạo; guard tỉnh/phường/danh mục 409 kể cả bài xoá mềm. OK.
- **services.coverImage đổi hành vi:** validator giờ chạy `upload` mặc định (chỉ nhận `image/`). Staging có 3 dịch vụ mẫu là **bản nháp không có `coverImage`** (`seed/sample/services.ts:6`) → không phá dữ liệu staging. Nếu admin đã gắn ảnh bìa không phải ảnh trên staging thì lần sửa kế tiếp sẽ 400: rủi ro thấp, ghi residual.
- **Migration up:** chỉ CREATE TYPE/TABLE/INDEX/FK trên bảng mới, `ADD COLUMN` nullable ở `payload_locked_documents_rels`, `ALTER TYPE ... ADD VALUE 'expire-offers'` (an toàn, không dùng giá trị trong cùng transaction). Hai index tổng hợp khớp AC + ERD §5 đã reconcile. Additive, không `HIGH_RISK_MIGRATION`.
- **Docs as-built:** API_SPEC §3.8, ARCHITECTURE §5.4 (bỏ "gắn cờ Đã kết thúc", đúng với as-built), ERD §4.7/§5 cập nhật khớp code.

## Findings

### [MAJOR-1] Migration `down` sẽ lỗi: DROP CONSTRAINT của FK đã bị CASCADE xoá
- `migrations/20261018_075627_property_posts.ts:217` `DROP TABLE "property_posts" CASCADE` đã xoá luôn FK `payload_locked_documents_rels_property_posts_fk` (FK trỏ vào bảng này). Sau đó `:223` `ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_property_posts_fk";` (không `IF EXISTS`) → Postgres báo `constraint ... does not exist`, cả `down` rollback lại → đường rollback schema không chạy được.
- Repo đã có quy ước sửa đúng lỗi này của generator: `migrations/20261017_143212_rentals.ts:282` dùng `DROP CONSTRAINT IF EXISTS`.
- **Fix:** đổi dòng 223 thành `DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_property_posts_fk";` (migration chưa commit/chưa apply lên staging nên sửa được). Nên thêm một test đọc SQL (như test `migration property_posts (SQL tuỳ biến)` đã có ở `tests/integration/property-posts.test.ts:40`) kiểm tra `down` không có `DROP CONSTRAINT` mà thiếu `IF EXISTS`.

### [MINOR-1] `down` tạo lại enum jobs sẽ lỗi nếu còn dòng `expire-offers`
- `migrations/20261018_075627_property_posts.ts:225-232`: cast `task_slug::enum` thất bại khi `payload_jobs`/`payload_jobs_log` còn dòng `'expire-offers'` (job đã lên lịch luôn có dòng pending). Đề xuất `DELETE FROM "payload_jobs" WHERE "task_slug" = 'expire-offers'` (và `payload_jobs_log`) trước khi đổi kiểu, hoặc ghi rõ trong runbook rollback. Nếu migration `close_job_postings_task` có cùng mẫu thì giữ nhất quán và ghi residual.

### [MINOR-2] Job cắt im lặng ở 500 bài
- `src/jobs/expire-offers.ts:11,37`: `limit: 500, pagination: false`. Vượt ngưỡng thì phần dư không được revalidate và không có log. Đề xuất `logger.warn` khi `docs.length === MAX_EXPIRED_PER_RUN`.

### [MINOR-3] Lỡ một lần chạy thì bài hết hạn hôm đó không được job làm mới
- `offerJustEndedWhere` chỉ lấy đúng "hôm qua". Nếu container `jobs` chết qua 00:05 + hết retry, trang chi tiết dựa vào ISR `revalidate` để đổi nhãn (`close-job-postings` cũng vậy). Chấp nhận được vì đã có fallback ISR; chỉ ghi lại để biết.

## Residual risk
- Không chạy `down` thật trên DB (reviewer không chạy migration); MAJOR-1 kết luận từ ngữ nghĩa `DROP TABLE ... CASCADE` của Postgres + quy ước sẵn có ở migration rentals.
- Không gọi end-to-end `jobs → app:3000` trong Docker; xác minh bằng compose/Dockerfile + unit/integration test của client/route.
- `services.coverImage` trên staging: chỉ biết từ seed (bản nháp, không ảnh); dữ liệu admin tự nhập thêm thì chưa kiểm được.
- aislop/ocr/oxlint/blitzstrike không có sẵn.

## Verdict
**FAIL**: còn 1 MAJOR (MAJOR-1, migration `down` lỗi). Builder sửa `migrations/20261018_075627_property_posts.ts:223` thành `DROP CONSTRAINT IF EXISTS` (nên xử lý thêm MINOR-1/2), chạy lại verify, rồi review round 2.
