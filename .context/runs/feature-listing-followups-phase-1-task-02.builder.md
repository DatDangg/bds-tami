# builder · feature-listing-followups · phase-1-task-02 (BL-055) — attempt 1

## Đã làm
- C-7: `vitest.config.ts` integration `hookTimeout: 60_000`. `pnpm test` ×2: 419 file / 4391 test PASS, không hook timeout.
- C-8: `src/lib/backfill/property-posts.ts` dùng `hasPostOffer` (post-kind), bỏ `isOfferPost`; `PropertyPostSource.offer: PropertyPost["offer"]`; test đổi sang `planPropertyPost` + ca `endAt` rác.
- C-5 EN: `tests/integration/rental-search.test.ts` ca "số đếm Tiện ích /en".
- C-5 đo: script tạm scratchpad `bench-amenity-index.mjs` (pg trực tiếp, DB dev 127.0.0.1:5433) — 100k tin + 274.764 amenities; index gộp `(value,parent_id)` / `(parent_id,value)` planner KHÔNG dùng → 0% giảm → **không migration**. Bench + index thử đã dọn (BENCH=0, amenities=122 như cũ).
- C-6: bỏ qua (không có lọc bản đồ).
- Số đo + quyết định ghi đầy đủ ở task file § Verification summary.

## Còn dở / lưu ý
- Không commit (chạy đơn luồng, không worktree) — dispatcher lo sau Reviewer PASS.
- Working tree có nhiều file dirty ngoài scope (từ trước) — không đụng.
- File scope: `vitest.config.ts`, `src/lib/backfill/property-posts.ts`, `src/lib/backfill/property-posts.test.ts`, `tests/integration/rental-search.test.ts`, `tasks/feature-listing-followups/phase-1-task-02.md`.
