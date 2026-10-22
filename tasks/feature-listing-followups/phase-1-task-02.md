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
- [ ] C-7: `hookTimeout` áp cho integration; `pnpm test` đủ bộ 2 lần không timeout `beforeAll`.
- [ ] C-8: backfill dùng `hasPostOffer` của `post-kind.ts`; không còn logic trùng; test PASS (+ ca `endAt` rác).
- [ ] C-5: có số đo `EXPLAIN ANALYZE` ở ≥ 100k tin trước/sau index ghi trong task; quyết định index có/không theo ngưỡng; nếu có → migration SAFE_ADDITIVE đã migrate dev + `migrate:status` sạch + ERD; dữ liệu bench đã dọn.
- [ ] C-5 EN: test `locale=en` cho số đếm tiện ích PASS.
- [ ] C-6: ghi lý do bỏ qua (không có lọc bản đồ).
- [ ] typecheck + lint (scope) + test + build PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary
(builder điền: thay đổi, số đo C-5 (plan/thời gian trước–sau), quyết định index, test, verify commands + kết quả, doc impact, residual)
