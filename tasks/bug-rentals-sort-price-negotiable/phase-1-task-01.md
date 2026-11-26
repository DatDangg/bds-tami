# bug-rentals-sort-price-negotiable · phase-1-task-01 — /cho-thue sắp xếp theo giá: tin "Thương lượng" nằm rải rác (BL-126)

- Change doc: `spec/changes/2026-11-26-rentals-sort-price-negotiable.md` (BACKLOG BL-126, QA 41, Trung bình).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/bug-rentals-sort-price-negotiable-phase-1-task-01-round-1-review.md`); 3 MINOR (API_SPEC §3.3 ghi thứ tự sort — đã cập nhật lúc close-out; bộ lọc khoảng giá vẫn theo cột thô — follow-up; chưa chạy DB thật). Spec 1.64.4 / scope v125.

## Classification / Risk
- Type: **BUG** (batch BL-125→129 user duyệt thứ tự + auto proceed 2026-11-26; quyết định: Thương lượng gom CUỐI danh sách cho cả asc/desc, tie-breaker ổn định).
- Severity: medium.
- Risk: **MEDIUM** — SQL ORDER BY dùng chung cho `/cho-thue`, `/cho-thue/danh-muc/[category]`, `GET /api/public/rentals` (search-service). Không schema/migration.
- Expected review level: STRICT (shared query/API sort).
- Doc impact dự kiến: không đổi API shape. SPECIFICATIONS as-built PATCH (spec-publisher).

## Root cause (đã xác định từ code)
- `src/lib/search/rental-search-sql.ts:181-182` — `rentalOrderBy` sắp theo cột thô `price_monthly_vnd ASC|DESC NULLS LAST`.
- Nhưng hiển thị "Thương lượng" dựa vào cờ `price_negotiable`, KHÔNG dựa vào giá null: `src/lib/rentals/rental-view.ts:160` và `:214` — `priceMonthlyVnd: doc.priceNegotiable === true ? null : positive(doc.priceMonthlyVnd)`; thẻ `RentalCard.tsx:81/109` `MonthlyPrice value=… negotiable=…`.
- Admin: `src/collections/Rentals.ts:203-204` giá và checkbox "Giá thương lượng" là 2 field độc lập; validator `src/hooks/rentals/field-validators.ts:24` cho phép tick thương lượng mà vẫn giữ giá số cũ. → Tin tick "Thương lượng" còn giá số cũ được ORDER BY xếp theo giá cũ → nằm rải rác giữa các trang. Tương tự giá `0`/≤0: hiển thị như không có giá (`positive()`), nhưng SQL xếp 0 lên đầu `price_asc`.
- Tie-breaker đã có (`published_at DESC NULLS LAST, id DESC`) → giữ.
- Tin BĐS (`/tin-bds`): `src/lib/posts/post-list-facets.ts:190-199` sắp trong bộ nhớ theo `positive(priceVnd)`, không giá → cuối, posts không có cờ thương lượng → **không cùng lỗi** (builder xác nhận lại, không sửa nếu đúng).

## Thiết kế fix
- `rentalOrderBy` price sort dùng **giá hiệu lực** giống `rental-view`: `CASE WHEN <alias>."price_negotiable" = true THEN NULL WHEN <alias>."price_monthly_vnd" > 0 THEN <alias>."price_monthly_vnd" END` + `ASC|DESC NULLS LAST`, rồi `published_at DESC NULLS LAST, id DESC`.
- Alias `page` (CTE trong `src/lib/search/search-service.ts:189-219`) đã SELECT `r."price_negotiable"` → kiểm lại cột tồn tại ở CTE; nếu thiếu thì thêm.
- Bộ lọc khoảng giá (`rental-search-sql.ts:134-135`, `priceMin/priceMax` theo cột thô) — CÙNG gốc (tin thương lượng còn giá cũ vẫn khớp bộ lọc giá). Builder đọc SPECIFICATIONS F3 (bộ lọc giá Cho thuê) xem tin thương lượng có được nói rõ không; nếu spec nói tin thương lượng/không giá không khớp khi lọc giá → sửa cùng (dùng giá hiệu lực); nếu spec không nói → KHÔNG đổi, ghi Residual risk/follow-up.
- Không đổi dữ liệu, không migration, không đổi admin.

## Files
- Sửa: `src/lib/search/rental-search-sql.ts` (+ `src/lib/search/search-service.ts` nếu CTE thiếu cột).
- Test: `src/lib/search/rental-search-sql.test.ts` (đang assert chuỗi SQL cũ ở `:180-183` → cập nhật), thêm test hồi quy. Nếu có integration test DB (`*.int.test.ts`) cho search thì chỉ chạy được khi có DB — không có Docker → ghi skip.
- KHÔNG đụng: file bẩn có sẵn ngoài scope, `.context/runs/*`.

## Acceptance
- [ ] `price_asc`: tin có giá tăng dần liên tục, mọi tin Thương lượng (cờ bật, kể cả còn giá số cũ) và tin không giá/≤0 ở cuối.
- [ ] `price_desc`: tin có giá giảm dần, Thương lượng ở cuối.
- [ ] Tie-breaker `published_at DESC NULLS LAST, id DESC` giữ → không lặp/mất tin giữa trang.
- [ ] Tin BĐS kiểm và ghi kết luận.
- [ ] Test hồi quy FAIL trước / PASS sau.
- [ ] `pnpm vitest run src/lib/search src/lib/rentals`, `pnpm typecheck`, eslint file đổi PASS.

## Verification Plan
- Test-first trên SQL render (`render(rentalOrderBy(...)).sql`) cho cả alias `r` và `page`, asc/desc.
- Nếu môi trường có DB (không có Docker hiện tại) → skip integration, ghi residual.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/cho-thue?sort=price_asc` trang 1→4: tin "Thương lượng" nằm rải rác.
- Expected: Thương lượng gom cuối.
- Actual before fix: `ORDER BY r."price_monthly_vnd" ASC NULLS LAST` — tin Thương lượng còn giá số cũ / giá 0 xếp theo giá thô; test hồi quy (alias r/page × asc/desc) FAIL 3/3 trước fix.
- Actual after fix: ORDER BY `CASE WHEN <a>."price_negotiable" = true THEN NULL WHEN <a>."price_monthly_vnd" > 0 THEN <a>."price_monthly_vnd" END ASC|DESC NULLS LAST, published_at DESC NULLS LAST, id DESC`; CTE `page` đã SELECT `r."price_negotiable"` (search-service.ts:194) nên không cần sửa.
- Evidence: vitest `src/lib/search src/lib/rentals` 129/129 PASS; typecheck PASS; eslint PASS. Tin BĐS (`post-list-facets.ts:190-199`): sắp theo `positive(priceVnd)`, không giá cuối, không có cờ thương lượng → KHÔNG cùng lỗi, không sửa. Integration DB: skip (không có Docker/DB), chỉ kiểm SQL render.
- Status: PASS (SQL render; DB integration skip)

## Residual risk
- Bộ lọc khoảng giá `priceMin/priceMax` (rental-search-sql.ts:134-135) vẫn theo cột thô: SPECIFICATIONS không nêu tin Thương lượng/giá ≤ 0 trong lọc giá F3 → KHÔNG đổi theo chỉ dẫn; tin tick Thương lượng còn giá số cũ vẫn khớp lọc giá. Follow-up nếu user muốn.
- Chưa chạy trên DB thật (không Docker).

## Doc / Decision Impact
- Không đổi API shape/ERD/schema. SPECIFICATIONS as-built PATCH qua spec-publisher (thứ tự sort giá: thương lượng/không giá cuối cả 2 chiều).
