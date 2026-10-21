Agent: reviewer

# Review — feature-admin-list-columns-filters-locale · phase-1-task-04 · round-1

- Review level: **NORMAL**
- Reason: the diff only adds `ui` fields that have a list Cell, changes `defaultColumns` and adds a pure formatter. It touches no schema, DB, access, endpoint or shared hook. `list-filter.ts` (T01) is unchanged. Nothing here calls for STRICT.
- Blast radius: `src/collections/Projects.ts`, `src/collections/Rentals.ts` (field list + defaultColumns), new `src/lib/admin/list-summary.ts`, new `src/components/admin/ListSummaryCells.tsx`, `importMap.js` (regenerated). Only the admin list views for Projects and Rentals are affected. The REST/Local API is unaffected because a `ui` field has no data.

## Verify commands + result
- `pnpm vitest run src/components/admin src/collections src/lib`: 138 files / 1354 tests PASS
- `pnpm typecheck`: PASS
- `pnpm lint`: 0 errors, 2 pre-existing warnings in tools/ (outside this diff)

## Checks
1. **D12 / FR-ADM-19 formatting:** "1.200 căn", "2,1 – 3,5 tỷ", "850 triệu – 1,2 tỷ", "Từ …", "Đến …", equal values, Studio and `—` all match and have tests. `formatNumber` (maximumFractionDigits 2, vi) is reused, along with `formatArea`. 0 units gives "0 căn". null/undefined/NaN gives `—` (`Number.isFinite`). Amounts under 1 million keep the full number plus `₫`. Negative values are blocked by `nonNegativeNumber` validation.
2. **`ui` field:** has no DB column and does not change payload-types (the builder reports a regen with no diff; `ui` produces no column). It has no `Field`, so the edit form shows nothing. Translation: `walkFields` in `src/lib/translation/leaves.ts:91-93` filters by `TRANSLATABLE_FIELDS` and only emits text, textarea and richText, so the `ui` fields are never picked up. Excel export covers Lead only, so it is unaffected. OK.
3. **T01 `hideTechnicalListFields`:** `list-filter.ts:41,74,78` keeps a `ui` field that has a Cell as a column and always hides it from filters. That matches the spec. The T03 chips and BL-041 are untouched (no diff in those files).
4. **`project` column:** uses Payload's default Relationship cell. `@payloadcms/ui/.../DefaultCell/fields/Relationship/index.js` renders `${t("general:loading")}...` before the name loads, so there is a brief "Đang tải..." flash. See finding m1.
5. **Cell:** simple `<span>` with plain text, readable by screen readers. It reads `rowData`. The list uses depth 0 and no select, so all the fields it needs are there.

## Responsive Checklist Gate
N/A for layout: the diff adds only text cells and no CSS/layout. The cells are short strings inside the existing Payload table, which already scrolls horizontally. Residual: not checked visually in a browser.

## Skill gates
- aislop: skip, not configured in profile/verify commands
- oxlint (anti-slop): skip, oxlint not configured (eslint 0 errors)
- ocr: skip, ocr not installed
- AI-readable: OK. Names are clear, every function is under 15 lines, there are no magic numbers (unit thresholds use `_` separators) and comments explain WHY. 0 indicators.
- ai-friendly-web: N/A (internal admin)
- blitzstrike: N/A (not a STRICT/sensitive task)

## Findings
- **[MINOR] m1:** Rentals "Thuộc dự án" column (`src/collections/Rentals.ts:148`, defaultColumns `project`) flashes "Đang tải..." on load. D12 says "if it shows 'Đang tải', use a Cell", but the precedent for avoiding the flash (BL-021 `AssigneeCell`) relies on a virtual field `assigneeName` computed server-side, not on `LinkedCell` alone. The FR-ADM-19 sentence for this column only requires "tên dự án", and the name does appear after one load. The builder recorded this as residual (2). Suggestion: a separate task (virtual field `projectTitle` + Cell, mind N+1), or accept the flash. This does not block.
- **[MINOR] m2:** Rounding at unit boundaries in `src/lib/admin/list-summary.ts:12-16`. `999_999_999` gives "1.000 triệu" instead of "1 tỷ". Two nearby values can collapse into "2,1 – 2,1 tỷ" (e.g. 2_100_000_000 / 2_104_000_000). Suggestion: pick the unit after rounding, and fall back to one price when the formatted strings are equal. Real data rarely hits these values.
- **[MINOR] m3:** `priceFromVnd = 0` shows "Từ 0 ₫". Consider treating 0 as missing if the business uses 0 to mean "liên hệ". Needs a product decision.

## Verdict
PASS. No CRITICAL or MAJOR findings. m1–m3 are carried as residual or follow-up.
