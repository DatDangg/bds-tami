# Spec Update — 2026-11-26 rentals-sort-price-negotiable

**spec_version:** 1.64.3 -> 1.64.4 (PATCH — as-built bug-fix BL-126, QA 41)
**Trigger:** bug-fix (BL-126, `bug-rentals-sort-price-negotiable`)
**Requirements:** LÀM RÕ mục F3 Cho thuê trong SPECIFICATIONS.md (tìm "BL-126"): sắp `price_asc` / `price_desc` theo giá hiệu lực (cờ `price_negotiable` bật -> không giá; `price_monthly_vnd` <= 0/null -> không giá); tin không giá luôn xếp cuối ở cả hai chiều; tie-breaker `published_at DESC NULLS LAST, id DESC`.
**Ảnh hưởng:** `src/lib/search/rental-search-sql.ts` (+ `rental-search-sql.test.ts`). Dùng chung cho `/cho-thue`, `/cho-thue/danh-muc/[category]`, `GET /api/public/rentals`. Không API shape/schema/quyền/migration.
**Không đổi:** Tin BĐS (`/tin-bds`, không có cờ thương lượng, tin không giá đã cuối); bộ lọc khoảng giá `priceMin/priceMax` (vẫn theo cột thô — follow-up nếu user muốn); dữ liệu/admin.
**Evidence:** `.context/review-reports/bug-rentals-sort-price-negotiable-phase-1-task-01-round-1-review.md` (STRICT PASS r1). Residual risk: chưa chạy trên DB thật (không Docker), verify bằng SQL render + vitest.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 125, risk medium)
