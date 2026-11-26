Agent: reviewer

# Review — bug-rentals-sort-price-negotiable · phase-1-task-01 · round 1 (BL-126)

- **Review level:** STRICT
- **Reason:** `rentalOrderBy` is a shared SQL fragment used by the public rentals search service, which serves `/cho-thue`, `/cho-thue/danh-muc/[category]` and `GET /api/public/rentals`. This is a shared query and API sort contract, so the red-risk rule forces STRICT. There is no schema, auth or migration change.
- **Blast radius:** `src/lib/search/rental-search-sql.ts` (`rentalOrderBy`) has 3 callers, all in `src/lib/search/search-service.ts`:
  - `:97` `featuredIdsQuery` uses `"newest"` and is unaffected.
  - `:197` is the inner `page` CTE (alias `r`, with LIMIT/OFFSET).
  - `:219` is the outer re-order (alias `page`).
  - Consumers: the rentals list page, the category page, and the public rentals API. The response shape is unchanged; only the row order for `price_asc` and `price_desc` changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/search src/lib/rentals` | PASS: 11 files, 129/129 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS: no errors |
| `pnpm exec eslint src/lib/search/rental-search-sql.ts src/lib/search/rental-search-sql.test.ts` | PASS: exit 0, no output |
| DB integration | skip: no DB/Docker (as instructed); verified only through the rendered SQL |

## Checks
- **Root cause.** Confirmed.
  - The display rule (`rental-view.ts:160`, `:214`, `:237`) is `priceNegotiable === true ? null : positive(priceMonthlyVnd)`.
  - The old ORDER BY used the raw `price_monthly_vnd`, so it disagreed with the display rule in two cases:
    - a listing flagged negotiable that still holds an old numeric price;
    - a price of `0` (or below), which is shown as having no price.
- **Fix expression.**
  - `CASE WHEN a."price_negotiable" = true THEN NULL WHEN a."price_monthly_vnd" > 0 THEN a."price_monthly_vnd" END` matches the display rule exactly.
  - NULL `price_negotiable` falls through to the price check; NULL or ≤0 prices give NULL because there is no ELSE.
  - `NULLS LAST` is applied in both directions.
- **Aliases.** The `page` CTE selects both `r."price_negotiable"` and `r."price_monthly_vnd"` (`search-service.ts:194`), so the outer ORDER BY on `page.` resolves. The inner and outer queries use the same expression, so the outer ordering of the LIMIT/OFFSET slice matches the inner one.
- **Pagination stability.** Sorting by effective price, then `published_at DESC NULLS LAST`, then `id DESC` (unique) gives a total, deterministic order. No listing can be duplicated or skipped across pages, and this holds on both the `r` and `page` paths.
- **Callers.**
  - featured: still `newest`, so the featured listings excluded from the grid keep the same order.
  - api, list and category: all go through `fetchRows`, so they are consistent.
  - The `phrase_match` path only applies to `newest`. The price sorts ignore `query` (the test at `:333` still holds).
- **Performance.** The only related index is the composite `rentals_list_idx (status, has_english, category_id, province_id, price_monthly_vnd)` (`migrations/20261017_143212_rentals.ts:256`). With price as its last column, it could serve ORDER BY only when there is equality on all four leading columns, so the old ORDER BY effectively sorted rows anyway. Sorting on the expression costs one extra CASE per filtered row, which is negligible at current data size. WHERE filters still use the index.
- **Tin BĐS.** `post-list-facets.ts:190-199` sorts in memory by `positive(priceVnd)`, puts listings without a price last, and Posts have no negotiable flag. It does not have the same bug. Conclusion is correct.
- **Price-range filter unchanged.** SPECIFICATIONS F3 (`:179`) defines "Khoảng giá" (`priceMin`/`priceMax`) without saying how negotiable or no-price listings should behave. The task followed its instruction (spec silent → no change) and recorded it under Residual risk. Note that the Dự án rule ("Quyết định 6", `SPECIFICATIONS.md:42`) excludes projects without a price from price filtering, so Cho thuê is inconsistent with it. That needs a separate user decision and does not block this task.
- **Tests.**
  - Exact-string assertions are updated for `page`/asc and `r`/desc.
  - A new `it.each` over r/page × asc/desc asserts the negotiable→NULL branch, the >0 branch and `NULLS LAST`.
  - The new test would fail on the old code, so the claimed "FAIL before" is credible.
  - The tests only check the rendered SQL; DB execution is covered under residual risk.
- **Surgical diff.** Both files trace to the task; there is no drive-by change. The function stays ≤50 lines and the comment explains WHY (BL-126).

## Responsive Checklist Gate
N/A: the diff does not touch UI (only SQL and a unit test).

## Skill gates
- aislop: skip. `--changes` would scan about 260 unrelated dirty files, so it was not run. The 2-file diff was reviewed manually and has no slop pattern.
- oxlint (anti-slop): skip, oxlint not configured. ESLint and `tsc` pass on the changed files.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK, 0 indicators. Names are clear (`effectivePrice`), there is no magic number, the comment states why, and there is no new flow requiring README/ARCHITECTURE changes.
- ai-friendly-web: N/A, no change to public routes or crawler surface.
- blitzstrike: N/A. There is no new input and `alias` is an internal `"r" | "page"` constant via `sql.raw`, with no change to the injection surface.

## Findings
- [MINOR] `docs/API_SPEC.md:151`: the rentals `sort` row does not describe the price-sort semantics. Fix: add "(Thương lượng / không giá cuối)" to the `price_asc` / `price_desc` row during the doc reconcile at close-out.
- [MINOR] `src/lib/search/rental-search-sql.ts:134-135`: the `priceMin`/`priceMax` filter still uses the raw column, so a negotiable listing that keeps an old price still matches a price-range filter. This differs from the Dự án rule (`SPECIFICATIONS.md:42`). Already recorded as residual risk; the follow-up needs a user decision.
- [MINOR] Residual: the SQL has not been run against a real Postgres. The CASE expression is standard SQL and the column types (boolean, numeric) are compatible, so the risk is low.

No CRITICAL or MAJOR findings.

## Repro Verification check
Status `PASS`. The evidence is the regression test on the rendered SQL (r/page × asc/desc), which fails before the fix and passes after. I reproduced the PASS with vitest (129/129). This bug is in SQL ordering logic, so the rendered-SQL test is a valid automated check of the root cause. Real DB ordering is a residual risk.

## Verdict
✅ PASS
