# feature-listing-followups · phase-1-task-02 — Đo index đếm tiện ích + ca EN (C-5), GIST location (C-6), timeout integration test (C-7), gom `isOfferPost` (C-8)

- Nguồn: BL-055 · change doc `spec/changes/2026-10-22-listing-followups.md` (phase review BL-052 mục (c) C-5..C-8; review P2-T04 MINOR `tests/integration/rental-search.test.ts:686`).
- **Task DUY NHẤT của BL-055 được tạo migration** (chỉ khi C-5 "đáng"; SAFE_ADDITIVE; không `db push` / `migrate reset`; chỉ migrate DB dev).
- **AUTO PROCEED**: quy tắc quyết định ghi ở § Quyết định — builder đo rồi tự quyết theo ngưỡng, ghi số đo vào § Verification summary; mục quyết KHÔNG làm thì ghi rõ lý do (coi là xong).

## Classification / Risk
- Type: **MODIFY** (hạ tầng test + DRY + có thể index).
- Risk: **LOW–MEDIUM** — C-7 chỉ config vitest; C-8 helper thuần có test; C-5 nếu thêm index thì là migration additive (STRICT theo luật migration); C-6 dự kiến bỏ qua.
- Expected review level: **NORMAL**; **STRICT** nếu có migration.
- Blast radius: `vitest.config.ts`, `src/lib/backfill/property-posts.ts` (+ test), `src/lib/posts/post-kind.ts` (không đổi hành vi), `tests/integration/rental-search.test.ts`, có thể `migrations/<ts>_rentals_amenities_value_parent.ts` + `migrations/index.ts`, `docs/ERD.md` (nếu index).

## Hiện trạng (file:line — không spawn Explore)
- C-5: truy vấn đếm tiện ích `src/lib/search/search-service.ts:168-181` — `JOIN "rentals_amenities" ra ON ra."parent_id" = r."id"` … `GROUP BY ra."value"`. Bảng đã có index `rentals_amenities_parent_idx (parent_id)` và `rentals_amenities_value_idx (value)` (`migrations/20261020_095907_rentals_amenities.ts:23-25`). Đề xuất của review là index gộp `(value, parent_id)` (hoặc `(parent_id, value)` cho index-only scan). Bench 100.000 tin: `pnpm bench:rentals-search` (`scripts/bench/rentals-search.ts`: chèn tin `BENCH-*` trên DB dev localhost, tự xoá ở `finally`; chặn staging/prod) — **bench hiện không chèn `rentals_amenities`** → cần chèn thêm tiện ích cho tin bench (tạm, trong cùng phiên đo, xoá sau — cascade theo `rentals` nên xoá tin bench là đủ) hoặc dùng SQL tạm trong transaction `ROLLBACK`.
- C-5 ca EN: `tests/integration/rental-search.test.ts:686-700` (describe số đếm Tiện ích) chưa có ca `locale: "en"` — tin thiếu `hasEnglish` không được tính (vì `rentalFrom(locale)` join `rentals_locales` theo locale + `has_english`). Fixture EN sẵn: `:180-181` (tin "Serviced apartment Ben Nghe", `hasEnglish: true`).
- C-6: `property_posts.location geometry(Point)` (`migrations/20261021_173246_property_post_specs.ts:20`); grep `ST_DWithin|radius|bbox|ST_Within` trong `src/` → **không có** lọc bản đồ / bán kính (chỉ `post-detail-specs.ts:45` đọc toạ độ để hiện bản đồ chi tiết).
- C-7: `vitest.config.ts` project `integration` có `testTimeout: 30_000` nhưng **không** đặt `hookTimeout` (mặc định 10s) → `beforeAll` (getPayload + seed) timeout khi chạy cả bộ 59 file. Hiện `pnpm test` = `vitest run` (các project chạy chung).
- C-8: `src/lib/backfill/property-posts.ts:41` `isOfferPost = hasValue(offer.endAt) || hasValue(offer.voucherCode)`; `src/lib/posts/post-kind.ts:18-20` `hasPostOffer` = `validOfferEndAt(post) !== null || hasText(voucherCode)`. Khác biệt: `hasPostOffer` đòi `endAt` **parse được** thành ngày; `isOfferPost` chỉ cần có chuỗi. Dùng ở `property-posts.ts:46` + test `:163-165`.

## Quyết định (AUTO PROCEED)
1. **C-7:** thêm `hookTimeout: 60_000` cho project `integration` trong `vitest.config.ts` (cách đơn giản nhất, ổn định). Không đổi setup từng file. Chạy `pnpm test` đủ bộ **2 lần** để xác nhận không còn timeout `beforeAll` (ghi số file/test PASS mỗi lần).
2. **C-8:** `src/lib/backfill/property-posts.ts` bỏ `isOfferPost` riêng → dùng `hasPostOffer` từ `@/lib/posts/post-kind` (giữ export tên `isOfferPost` = alias nếu test/đọc code cần, hoặc đổi test sang `hasPostOffer` — chọn diff nhỏ nhất). Khác biệt "endAt không parse được" → chấp nhận theo `hasPostOffer` (tin có `endAt` rác không còn bị bỏ qua khi backfill; ghi vào Verification summary như thay đổi có chủ ý; thêm 1 test cho ca đó). `PropertyPostSource.offer` phải tương thích kiểu `Pick<PropertyPost,"offer">` (chỉnh type nếu cần, không `as any`).
3. **C-5 đo:** trên DB dev (localhost, `.env.local`), với **≥ 100.000 tin** bench (`BENCH_ROWS` mặc định) + mỗi tin bench 2–4 tiện ích ngẫu nhiên, chạy `EXPLAIN (ANALYZE, BUFFERS)` cho đúng SQL của `amenityCounts` (locale `vi`, không lọc; và 1 ca có `province`) **trước** và **sau** khi tạo thử index gộp (`CREATE INDEX CONCURRENTLY`/thường trong phiên đo, rồi `DROP` nếu không giữ). Ghi: plan (seq/index scan), thời gian thực thi, buffers, số dòng. **Ngưỡng "đáng":** index gộp giảm thời gian ≥ 30% **và** truy vấn trước index ≥ 50ms ở 100k tin. Đáng → migration versioned SAFE_ADDITIVE (`pnpm payload migrate:create rentals_amenities_value_parent` hoặc tay theo mẫu migration hiện có; chỉ `CREATE INDEX`, `down` DROP INDEX), chạy `pnpm payload migrate` trên DB dev, `migrate:status` sạch, ghi `docs/ERD.md`. Không đáng → **không** migration, ghi số đo + kết luận vào task + Verification summary. Dọn hết dữ liệu bench sau đo (`DELETE FROM rentals WHERE code LIKE 'BENCH-%'`; kiểm `count = 0`).
   - Chú ý: không chạy bench trên DB nào khác ngoài dev localhost; không `db push`/`migrate reset`.
4. **C-5 ca EN:** thêm `it` trong describe số đếm Tiện ích: `listing({ locale: "en", limit: 1 })` → chỉ đếm tin `hasEnglish` (chèn tạm `pool` cho 1 tin không có EN → không tính; tin EN có tiện ích → tính), dọn ở `finally` như test hiện có.
5. **C-6:** **bỏ qua** — không có lọc bản đồ / bán kính trong code (grep ở § Hiện trạng); ghi lý do vào Verification summary. Không tạo migration GIST.

## Scope
1. Thực hiện § Quyết định 1–5 (thứ tự gợi ý: C-7 → C-8 → C-5 EN test → C-5 đo → migration nếu đáng).
2. Test: `property-posts.test.ts` (C-8) cập nhật + ca `endAt` không parse được; `rental-search.test.ts` thêm ca EN; `pnpm test` 2 lần (C-7).
3. Doc impact: `docs/ERD.md` chỉ khi có index mới; `docs/ARCHITECTURE.md`/`DESIGN.md` không đụng. Không sửa `SPECIFICATIONS.md` / `spec/**`.
4. Verify: `pnpm typecheck` · `pnpm lint` (scope 0 lỗi) · `pnpm test` ×2 · `pnpm build` (nếu có migration: `pnpm payload migrate:status` + inspect SQL migration: chỉ `CREATE INDEX`).

## Acceptance
- [x] C-7: `hookTimeout` áp cho integration; `pnpm test` đủ bộ 2 lần không timeout `beforeAll`.
- [x] C-8: backfill dùng `hasPostOffer` của `post-kind.ts`; không còn logic trùng; test PASS (+ ca `endAt` rác).
- [x] C-5: có số đo `EXPLAIN ANALYZE` ở ≥ 100k tin trước/sau index ghi trong task; quyết định index có/không theo ngưỡng (**KHÔNG** — dưới ngưỡng, xem bảng); không migration; dữ liệu bench + index thử đã dọn (count = 0).
- [x] C-5 EN: test `locale=en` cho số đếm tiện ích PASS.
- [x] C-6: ghi lý do bỏ qua (không có lọc bản đồ).
- [x] typecheck + lint (scope) + test ×2 + build PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

### Thay đổi (attempt 1, builder)
- **C-7** `vitest.config.ts`: project `integration` thêm `hookTimeout: 60_000` (+ comment WHY). Không đổi setup từng file.
- **C-8** `src/lib/backfill/property-posts.ts`: bỏ `isOfferPost` + helper riêng; `planPropertyPost` gọi `hasPostOffer` (`@/lib/posts/post-kind`). `PropertyPostSource.offer` đổi kiểu thành `PropertyPost["offer"]` (trước: object rút gọn `| null` → không gán được cho `Pick<PropertyPost,"offer">` vì `PropertyPost.offer` không nhận `null`); `toPropertyPostSource` truyền `doc.offer` thẳng (bỏ `?? null`). Không `as any`. `isOfferPost` không còn được import ở đâu khác (grep `src tests scripts docs` = 0).
  - **Thay đổi hành vi có chủ ý:** tin có `offer.endAt` là chuỗi **không parse được** thành ngày (và không có voucher) trước đây bị bỏ qua khi backfill, nay được trích như tin thường (khớp phân loại thẻ/chi tiết). Test `property-posts.test.ts`: ca cũ chuyển sang gọi `planPropertyPost` (endAt hợp lệ / voucher → skipped; `endAt: null, voucherCode: " "` → không skip) + **ca mới** `endAt: "không phải ngày"` → không skip, patch `{ propertyType: "apartment", areaM2: 70, bedrooms: 2 }`.
- **C-5 EN** `tests/integration/rental-search.test.ts`: ca mới "số đếm Tiện ích /en: chỉ tin hasEnglish" — chèn tạm `pool` cho tin b (không có bản EN) → `/vi` đếm `pool: 2, gym: 2`; `/en` chỉ tin a → `pool: 1, gym: 1, elevator: 1, kitchen: 0`; dọn ở `finally`.
- **C-5 đo:** không tạo migration (xem bảng). **C-6:** bỏ qua.

### C-5 — số đo EXPLAIN (ANALYZE, BUFFERS) trên DB dev localhost (`127.0.0.1:5433/tami`)
Dữ liệu: 100.000 tin `BENCH-*` (SQL chèn giống `scripts/bench/rentals-search.ts`, 92.027 tin `published` không xoá) + `rentals_locales` vi + **274.764 dòng `rentals_amenities`** (2–4 tiện ích ngẫu nhiên khác nhau mỗi tin, script tạm trong scratchpad, không commit). SQL đo = đúng `amenityCounts` (`search-service.ts:168-181`, scope `status IN ('published','rented') AND deleted_at IS NULL AND status = 'published'`, locale `vi`). Mỗi ca chạy 5 lần, lấy **median execution time**; index thử tạo bằng `CREATE INDEX` thường rồi `ANALYZE`.

| Ca | Index | Plan | Execution time (median / min–max) | Buffers | Rows join trước GROUP |
|---|---|---|---|---|---|
| vi, không lọc | hiện có (`parent_idx`, `value_idx`) | Seq Scan `rentals_amenities` (274.764) ⋈ Hash(Seq Scan `rentals` 92.027) ⋈ Hash(Seq Scan `rentals_locales` 100.032) → Sort **external merge Disk 7.440kB** (`ra.value, r.id` cho `count(DISTINCT)`) → GroupAggregate 10 dòng | **326,5 ms** (322,6–338,3) | shared hit=6.428, temp read=930 written=933 | 252.855 |
| vi, không lọc | + thử `(value, parent_id)` | **y hệt** — planner không dùng index gộp (vẫn Seq Scan + Hash Join) | **339,3 ms** (324,5–345,4) | shared hit=6.428, temp read/written ≈ 930 | 252.855 |
| vi, không lọc | + thử `(parent_id, value)` | y hệt | **329,8 ms** (324,9–348,2) | shared hit=6.428, temp ≈ 930 | 252.855 |
| vi, `province=ho-chi-minh` (5.054 tin bench HCM) | hiện có | Bitmap Index Scan `rentals_province_idx` → Nested Loop Index Scan `rentals_locales_parent_id_idx` → Nested Loop **Index Scan `rentals_amenities_parent_idx`** (loops=4.654) → Sort quicksort 884kB → GroupAggregate | **31,1 ms** (30,2–36,4) | shared hit=37.907 | 12.793 |
| vi, `province` | + thử `(value, parent_id)` | y hệt (vẫn `rentals_amenities_parent_idx`) | 30,4 ms (28,7–31,3) | shared hit≈37.9k | 12.793 |
| vi, `province` | + thử `(parent_id, value)` | y hệt | 32,6 ms (29,9–35,5) | shared hit≈37.9k | 12.793 |

**Quyết định index: KHÔNG tạo.** Ngưỡng "đáng" = giảm ≥ 30% **và** trước index ≥ 50 ms. Ca không lọc trước index 326 ms (≥ 50 ms) nhưng index gộp giảm **0%** (−4% … −1%, trong nhiễu đo) vì planner không dùng được: truy vấn đọc *toàn bộ* `rentals_amenities` (không có điều kiện trên `value`), hash join trên `parent_id` rẻ hơn mọi index scan; chi phí thật nằm ở **Sort external merge trên 252k dòng** cho `count(DISTINCT r."id")` (work_mem mặc định) — index gộp không chạm vào bước đó. Ca `province` 31 ms < 50 ms (đã dùng `rentals_amenities_parent_idx` hiệu quả). Không migration, không sửa `docs/ERD.md`.

**Dọn:** `DROP INDEX` 2 index thử, `DELETE FROM rentals WHERE code LIKE 'BENCH-%'` (cascade `rentals_locales` / `rentals_amenities`), `ANALYZE`. Kiểm sau dọn: `rentals` BENCH = **0**, `rentals_amenities` tổng = **122** (bằng trước khi chèn), index tạm còn **0**.

### C-6 — bỏ qua
Grep `ST_DWithin|radius|bbox|ST_Within` trong `src/` không có kết quả: không có lọc bản đồ / bán kính nào trên `property_posts.location` (chỉ `post-detail-specs.ts` đọc toạ độ để hiện bản đồ chi tiết). Index GIST chưa có truy vấn nào dùng → không tạo migration (YAGNI).

### Test
- `pnpm vitest run --project unit src/lib/backfill` → 5 file / 59 test PASS (gồm 2 ca C-8).
- `pnpm vitest run --project integration tests/integration/rental-search.test.ts -t "Tiện ích"` → 2 PASS (ca cũ + ca EN mới).

### Verify commands (`.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (0 lỗi) |
| `pnpm lint` | 4 error + 2 warning **đều ngoài scope** (`.local-seed/seed-sample-project-blocks.ts` git-ignored, `tools/task-dashboard/server.mjs` sẵn có); `npx eslint vitest.config.ts src/lib/backfill/property-posts.ts src/lib/backfill/property-posts.test.ts tests/integration/rental-search.test.ts` → **0 lỗi** → PASS theo quy ước scope |
| `pnpm test` lần 1 | **419 file / 4.391 test PASS**, 253 s, không `Hook timed out` |
| `pnpm test` lần 2 | **419 file / 4.391 test PASS**, 238 s, không `Hook timed out` |
| `pnpm build` | PASS (exit 0, "Compiled successfully", static pages 4/4) |
| `pnpm payload migrate:status` | N/A — không có migration mới |

### Doc impact
`no doc impact`: không đổi API contract / schema / behavior đã tài liệu hoá (`docs/ERD.md` chỉ cần sửa khi có index mới — không có). Hành vi backfill `endAt` rác là script nội bộ (`scripts/backfill`), không nằm trong spec.

### Residual risk
- Bottleneck thật của `amenityCounts` ở 100k tin là Sort external merge cho `count(DISTINCT)` (~330 ms, vẫn trong NFR-01 p95 ≤ 500 ms nhưng chiếm phần lớn). Hướng sau này nếu cần (ngoài scope BL-055): `count(*)` nếu `rentals_amenities` không bao giờ lặp giá trị trong 1 tin (Payload select hasMany không cho lặp), hoặc đếm qua `EXISTS` theo từng tiện ích, hoặc tăng `work_mem` cho phiên truy vấn.
- Số đo trên máy dev (buffers toàn shared hit, cache nóng); production có thể khác về tuyệt đối nhưng kết luận "planner không dùng index gộp" không phụ thuộc máy.
