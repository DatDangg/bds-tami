Agent: reviewer

# Review: feature-admin-list-quick-filter-chips, phase-1-task-02, round 2

- **Review level:** STRICT
- **Reason:** The task changes a shared helper (`src/lib/admin/quick-filters.ts`, also used by the Rentals list from T01) and an export endpoint's query contract (`statusIn`, `unassigned`). It is export/report work, so over-export is a data-exposure risk. Attempt 2 also fixes a defect that round 1 missed.
- **Blast radius:**
  - Leads admin list: the new `LeadQuickFilterSlot` (`beforeListTable`) and the `LeadExportButton` query mapping.
  - `GET /api/admin/leads/export`: new `statusIn` and `unassigned` params.
  - Rentals admin list: the Studio chip value changed from `0` to `"0"`.
  - `QuickFilterChips`: the "Tất cả" (All) chip now uses `hasGroupCondition`.
  - `docs/API_SPEC.md`.
  - `next.config.ts` and `src/payload-types.ts` were not reviewed, as instructed.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (`tsc --noEmit`, no errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this diff) |
| `pnpm test` | PASS: 279 files, 2954 tests |

## Server-side behaviour of the string-valued conditions (checked in source)
I read `@payloadcms/drizzle@3.91.0`: `dist/queries/sanitizeQueryValue.js` and `parseParams.js`.

- **`assignedTo: { exists: "false" }`:** `assignedTo` is a single relationship to `staff`, so it is not polymorphic.
  - Lines 106-187 leave the value as a string. The uuid/number id cast only changes `formattedValue`.
  - Line 216 then sets `formattedValue = val === 'true' || val === true`, which is `false`, so `operator = 'isNull'`.
  - The result is `assigned_to_id IS NULL`, the same as the boolean form that the export endpoint uses (`buildLeadExportWhere` → `{ exists: false }`). The list and the export match.
  - Side note: any value other than `"true"`/`true` (for example `"0"` or `"abc"`) also becomes `isNull` on the server. The client mapping accepts only `false`/`"false"` and locks the button for anything else. That is fail-closed, not over-export.
- **`bedrooms: { equals: "0" }`:** `bedrooms` is a number field (`nonNegativeNumber`, Rentals.ts:182).
  - Line 65 converts it with `Number("0")`, giving `0`, so the query is `bedrooms = 0`.
  - SQL `= 0` does not match NULL, so rentals with no bedroom count are not shown as Studio.
- **Falsy-value root cause:** the attempt-2 diagnosis is consistent with the code. `"false"` and `"0"` are truthy, so they survive `condition[field][op] || undefined`. All other chip values (1, 2, 3, 10M/20M/50M, status strings and arrays) are already truthy. The new regression test asserts that no chip leaf value is falsy.

## Round-1 checks re-verified
- **`currentChip`/`withChip` accept both forms:** `leafSignature` → `normalizeOperand` compares `String(value)`, so `false` matches `"false"` and `0` matches `"0"`. `in` lists are compared order-independently, and a URL-string value works as well. Tests cover both forms for `new` and `studio`. Leaving the "Mới" chip removes only the `assignedTo exists` condition (it is in `groupConditionSignatures`), so a hand-set "Sale = A" filter survives other chips (W1 test).
- **Export mapping (no over-export):**
  - `conditionParam` maps only exact forms:
    - `equals` (string) → `status`, `source`, `assignedTo`;
    - `status in` (array or comma string; every item must be in `LEAD_STATUSES`, untrimmed, deduplicated) → `statusIn`;
    - `assignedTo exists false/"false"` → `unassigned=1`;
    - `createdAt >=` / `<=` (string) → `createdFrom` / `createdTo`.
  - Anything else, duplicates, or the conflicting pairs (`CONFLICTING_PARAMS`) return `ok: false`, which locks the button.
  - The server rejects the same conflicts with 400 before the rate limit, the count and the audit (tested). The audit records only the normalized filters.
  - `count` and `find` use `overrideAccess: false`, and a sale user still gets 403.
- **MINOR-1 fixed:** `UNSUPPORTED_FILTER_MESSAGE` and API_SPEC use "tồn tại" = Sai and "có trong".
- **MINOR-2 fixed:** `statusListParam` rejects items with surrounding whitespace (`item === item.trim()`). The server-side `parseStatusList` still trims, which is harmless: it is the admin-only direct-API path, gives no extra access, and the client never sends whitespace.
- **Trash and drawer:** the slot hides in trash (`segments[2]`), and the chips hide inside the list drawer (inherited from T01).

## Responsive Checklist Gate
No CSS changed in this round. The chip CSS comes from T01, and only the slot and its markup are new.
- **Layout, no horizontal scroll:** OK. Primary's browser evidence shows leads and rentals at 375px with `scrollWidth = 375`, and the chip scroller scrolls inside its own container (T01 CSS).
- **Typography/spacing:** N/A (unchanged).
- **Media:** N/A.
- **Touch target ≥44px:** OK (inherited `.quick-filter-chips__chip`, verified in T01).
- **Nav/table:** N/A.
- **Viewport/a11y:** OK. `aria-pressed` reflects `allActive`, groups use `role="group"` with `aria-label`, and no `100vh` or `overflow:hidden` was added.
- **Residual risk:** I could not check 768/1280 in a browser myself. The chip row wraps and scrolls internally per the T01 CSS math.

## Skill gates
- **aislop:** skip, `aislop` not installed.
- **oxlint (anti-slop):** skip, oxlint not configured. ESLint and tsc are clean.
- **ocr:** skip, `ocr` not installed.
- **AI-readable:** OK. Names are clear, functions are under 50 lines, files are under 300 lines, comments explain why (the WhereBuilder falsy rule, Payload not trimming), and API_SPEC is updated. 0 indicators.
- **ai-friendly-web:** N/A (internal admin).
- **blitzstrike:** skip. No permitted environment, and the change adds no new auth surface (same admin-only endpoint with whitelist parsing).

## Findings
- **[MINOR-A] (note):** `src/lib/admin/quick-filters.ts:111,138` hold the string values `"false"` and `"0"`. Their correctness depends on a Payload UI quirk (`WhereBuilder` `|| undefined`) and on drizzle's string coercion, both checked here for version 3.91.0. The why-comment is in the test (`quick-filters.test.ts`, "giá trị điều kiện chip phải sống sót qua WhereBuilder"). Suggested follow-up: add a one-line comment next to the chip definitions too, so a future edit does not "clean up" the values back to `false`/`0`. Not blocking.
- **[MINOR-B] (note):** Payload treats any `exists` value except `"true"`/`true` as IS NULL. Payload's own filter UI writes only true/false, and the client mapping fails closed. No action needed.
- No CRITICAL or MAJOR findings.

## Verdict
✅ **PASS**
