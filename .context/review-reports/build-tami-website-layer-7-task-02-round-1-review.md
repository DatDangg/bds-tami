Agent: reviewer

# Review — build/tami-website · layer-7-task-02 · round 1

`SearchService` + `GET /api/public/rentals` + index trigram (diff chưa commit trên HEAD f29176c, checkout `D:\prj\bds`; bỏ qua `.claude/launch.json`, `.context/`, không xem worktree t03/t04).

## Review level
**STRICT**

## Reason
API công khai mới (contract `RentalCard`/`RentalSearchParams` dùng cho trang `/cho-thue` L8 + L13), SQL thô, migration (extension + index), hook trên shared collection `projects`/`wards` ghi thẳng DB trong transaction, NFR hiệu năng p95.

## Blast radius
- `src/lib/search/search-service.ts`, `rental-search-sql.ts`, `reindex-rental-search-text.ts` (mới)
- `src/endpoints/public/rentals.ts` (mới) + đăng ký ở `src/payload.config.ts`
- `src/shared/types/api.ts` (schema/kiểu mới, additive) — client: L8-T03, L13-T03
- `src/hooks/rentals/build-search-text.ts` (tách `writeStoredSearchText`, export `buildForLocale`) — ảnh hưởng hook lưu tin cho thuê hiện có
- `src/collections/Projects.ts`, `Wards.ts` (thêm `afterChange` reindex) — mọi lần admin lưu dự án/phường
- `src/lib/http/cache-policy.ts` (hằng mới)
- `migrations/20261018_082231_rentals_search_trgm.*` + `migrations/index.ts`
- `package.json` (2 script), `scripts/reindex-rental-search-text.ts`, `scripts/bench/rentals-search.ts`
- Docs: `API_SPEC.md` §3.3, `ERD.md`, `ARCHITECTURE.md` (as-built)

## Verify commands + result (`.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | 150/151 file PASS, 1619 passed / 18 skipped; **1 FAIL**: `tests/integration/media-upload.test.ts` beforeAll `Hook timed out in 10000ms` — file ngoài diff, nghi do tải (chạy cả suite + worktree song song) |
| `pnpm test tests/integration/media-upload.test.ts tests/integration/rental-search.test.ts tests/integration/rentals-search-migration.test.ts` | **3/3 file, 43/43 PASS** (gồm cả nhóm endpoint cần Redis: 200/400/429, Cache-Control; migration up→down→down→up→up thật) — media-upload chạy riêng PASS → flake do timeout, không do task này |
| `pnpm build` | PASS (exit 0) |

## Kiểm tra trọng điểm
- **SQL injection:** mọi giá trị người dùng qua `${}` của `sql` template (placeholder). `sql.raw` chỉ ở `rentalOrderBy` với `alias` kiểu hằng `"r" | "page"` và tên cột hằng; `sort` qua zod enum → nhánh cố định. `LIMIT/OFFSET` là số đã zod `int` và qua placeholder. Unit test render SQL chứng minh chuỗi thù địch chỉ nằm ở params; integration test chạy payload injection không lỗi, dữ liệu còn nguyên. OK.
- **Escape LIKE:** `\`, `%`, `_` được thoát; ESCAPE mặc định của Postgres là `\` và giá trị là tham số nên không phụ thuộc `standard_conforming_strings`. Test `%`/`_`/`can_ho` → 0. OK.
- **Giới hạn tham số (API_SPEC §3.3):** locale enum vi/en, limit 1..48, page 1..500, bedrooms int 0..4 (4 = ≥4), furnishing enum, sort enum, giá/diện tích ≥0 + trần, min ≤ max, q ≤100 ký tự, ≤8 từ; sai → 400 `no-store` (test endpoint). Khoá lặp lấy giá trị đầu, khoá lạ bỏ qua. OK.
- **Không lộ field:** SELECT liệt kê cột tường minh; `address` chỉ `CASE WHEN show_exact_address`; card không có khoá `address` khi tắt (test `"address" in` = false); test whitelist khoá. OK.
- **publicWhere:** tái tạo status `PUBLIC_STATUSES.rentals` (dùng chung hằng), `deleted_at IS NULL`, `en` → `has_english`. `buildPublicWhere` hiện **chưa** có hẹn giờ `publishedAt` (comment `public-queries.ts:20`) nên hiện tại khớp; integration test đối chiếu `findPublicList` vi/en. Rủi ro lệch khi thêm hẹn giờ → MINOR-3.
- **Cache:** 200 `public, s-maxage=60`; lỗi `no-store` (đặt trước khi `withDefaultNoStore` thấy header). Cache key = URL gồm `locale`. OK.
- **Rate limit:** `rentals: 60/60s` trong `rate-limit.ts:13`, qua `runPublicPipeline` (rate limit trước validate), test 61 lần → 429 + `Retry-After`. OK.
- **Hook reindex:** ghi bằng UPDATE thô (không `payload.update`) → không đệ quy hook, không tạo phiên bản/audit; chạy trong transaction của `req`; chỉ chạy khi tên/tên cũ đổi thật (test "không đổi thì không ghi"). Rủi ro hiệu năng/khoá khi phường nhiều tin → MINOR-2.
- **Migration:** additive (`CREATE EXTENSION IF NOT EXISTS pg_trgm` + `CREATE INDEX IF NOT EXISTS` GIN); down chỉ `DROP INDEX IF EXISTS`; không DROP/đổi type/backfill → không `HIGH_RISK_MIGRATION`. Image `postgis/postgis:17-3.5` (dev compose) / `${POSTGIS_IMAGE}` (backup Dockerfile) dựa trên postgres Debian có contrib; pg_trgm trusted từ PG13. Test up→down→up thật PASS. OK.
- **Bench:** `scripts/bench/` ngoài `include` của vitest (`src/**`, `tests/unit/**`, `tests/integration/**`); dọn `BENCH-%` ở `finally`. Không có chặn chạy nhầm DB không phải dev → MINOR-4.
- **N+1:** một truy vấn trang (CTE + JOIN + LATERAL ảnh) + một count song song. OK.

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS); chỉ endpoint API, lib, hook, migration, script.

## Skill gates
| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip — không nằm trong verify commands được allow cho reviewer (Bash chỉ verify cmd + git) | — |
| oxlint (anti-slop) | skip, oxlint not configured | Glob `.oxlintrc*`/`oxlint*.json` rỗng; eslint + tsc PASS |
| open-code-review (ocr) | skip, ocr not installed / không được allow | — |
| AI-readable | OK | File ≤ 155 dòng, hàm ≤ ~35 dòng, hằng có tên (`MAX_SEARCH_TERMS`, `MAX_RENTAL_SEARCH_LIMIT`, `BATCH_SIZE`...), comment giải thích WHY, ARCHITECTURE/API_SPEC/ERD đã cập nhật. 0 indicator |
| ai-friendly-web | N/A | API JSON, không phải trang public mới |
| blitzstrike | skip — chưa cài/không có môi trường được phép; đã soát injection thủ công + test | — |

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. **Lọc `ward` chỉ theo slug, không theo tỉnh** — `src/lib/search/rental-search-sql.ts:50`. Slug phường chỉ unique trong một tỉnh (`Wards.ts` index `province+slug`), nên `?ward=x` không kèm `province` trả tin của mọi phường trùng slug ở nhiều tỉnh. Có `province` thì AND vẫn đúng. Đề xuất: khi có `province`, giới hạn subquery ward theo tỉnh đó; ghi rõ trong API_SPEC §3.3 là `ward` nên đi kèm `province` (hoặc trang L8 luôn gửi cả hai).
2. **Reindex đồng bộ trong transaction admin** — `src/hooks/wards/reindex-rentals.ts:15`, `src/hooks/projects/reindex-rentals.ts:12`, `src/lib/search/reindex-rental-search-text.ts:51-73`. Mỗi tin × mỗi locale gọi `buildForLocale` (đọc tỉnh/phường/dự án) + 2 UPDATE, cùng transaction → phường đô thị có vài nghìn tin sẽ làm lần lưu phường chậm và giữ khoá dòng `rentals_locales` lâu. Hiện quy mô nhỏ nên chấp nhận được. Đề xuất (sau): quá ngưỡng N tin thì đẩy job nền thay vì làm đồng bộ; hoặc cache tên tỉnh/phường/dự án trong một lần reindex.
3. **Điều kiện công khai sao chép thay vì sinh từ `publicWhere`** — `src/lib/search/rental-search-sql.ts:36-41`. Test đối chiếu `findPublicList` chỉ bắt lệch nếu fixture có dữ liệu ảnh hưởng (vd tin hẹn giờ `publishedAt` tương lai chưa có trong fixture). Khi FR-ADM-16 thêm hẹn giờ vào `buildPublicWhere`, test hiện tại vẫn xanh trong khi API lộ tin chưa tới giờ. Đề xuất: thêm unit test snapshot `buildPublicWhere(PUBLIC_STATUSES.rentals)` (và `publicWhere("rentals", "en")`) để mọi thay đổi shape buộc sửa `publicConditions`; hoặc thêm fixture tin hẹn giờ tương lai ngay khi hẹn giờ được làm.
4. **Bench không chặn chạy trên DB không phải dev** — `scripts/bench/rentals-search.ts:11-47`. Chèn 100.000 tin (một phần `published`) vào bất kỳ `DATABASE_URL` nào; chạy nhầm ở staging/prod sẽ hiện tin giả trên web và có thể bị CDN cache 60s, kill tiến trình giữa chừng thì `finally` không chạy. Đề xuất: từ chối khi `NODE_ENV=production` hoặc host DB không phải localhost/compose dev, trừ khi có biến xác nhận rõ.
5. **Danh mục cha đã xoá mềm vẫn khớp slug** — `src/lib/search/rental-search-sql.ts:27`. `matched` không lọc `t.deleted_at IS NULL`, nên `?category=<slug cha đã xoá>` vẫn trả tin của danh mục con còn sống. Ít gặp. Đề xuất: thêm `AND t."deleted_at" IS NULL` vào `matched`.
6. **Đổi tên tỉnh không có hook** — chỉ dựa vào lệnh `pnpm reindex:rentals-search` (đã ghi trong script + ERD). Chấp nhận như đã ghi; nếu tỉnh sửa được trong admin thì nên thêm hook tương tự `wards` cho đồng bộ.

## Residual risk
- `pnpm test` toàn bộ có 1 file flake (`media-upload.test.ts` hook timeout 10s) ngoài scope; chạy riêng PASS. Đề xuất task riêng tăng `hookTimeout` nếu lặp lại.
- Không chạy lại bench (cần DB dev + chèn 100k dòng, ngoài quyền reviewer): số p95 80.4ms/100k lấy từ task file, chưa kiểm chứng độc lập. Từ khoá 1–2 ký tự không dùng được index trigram (quét tuần tự); với 100k tin vẫn trong ngưỡng theo số đo của builder.
- Cloudflare mặc định không cache response `/api/*` không đuôi file dù có `s-maxage`; nếu cần cache CDN thật phải có Cache Rule (thuộc layer deploy/CDN, ngoài task này).
- Quyền `CREATE EXTENSION` trên prod phụ thuộc user app có quyền CREATE trên database (trusted extension); chưa xác minh được trên staging/prod từ phía reviewer.

## Verdict
**✅ PASS** — không có CRITICAL/MAJOR. 6 MINOR đề xuất xử lý sau hoặc ở task liên quan (L8 trang `/cho-thue` cho #1; FR-ADM-16 cho #3).
