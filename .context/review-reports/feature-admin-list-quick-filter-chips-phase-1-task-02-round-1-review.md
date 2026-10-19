Agent: reviewer

# Review — feature-admin-list-quick-filter-chips · phase-1-task-02 · round 1

- Review level: **STRICT**
- Reason: changes the lead Excel export (PII, admin-only endpoint, audit log) and server-side param parsing. The export where shape must match the list where exactly.
- Blast radius: `/admin/collections/leads` list (new `beforeListTable` slot ahead of the export slot); `src/lib/leads/export-filters.ts` (client `leadExportQueryFromWhere`, server `parseLeadExportFilters` / `buildLeadExportWhere`), used by `LeadExportButton` and `src/endpoints/admin/leads-export.ts`; `src/lib/admin/quick-filters.ts` / `QuickFilterChips` are shared with the Rentals chips (T01); `docs/API_SPEC.md` §4 (as-built). Leads access, schema and migrations are unchanged.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm test` | PASS: 279 files, 2951 tests |
| `pnpm lint` | PASS: 0 errors, 2 pre-existing warnings (`tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS (`tsc --noEmit` exit 0) |

Browser check: a dev server answers on :3000, but the reviewer has no browser tool and may only run the configured verify commands. I checked the where shape against the Payload 3.91 source instead (see below). The remaining risk is listed under Residual risk.

## Requirement / focus checks
- **Client mapping is exact (no over-export).** `conditionParam` (export-filters.ts:180-192) only accepts: `status in` (array or comma string, every item in `LEAD_STATUSES`, at most 6 items, deduped), `assignedTo exists false|"false"`, the old `equals` operators, and `createdAt >=/<=`. These stay locked (unit tests cover them): `exists true`/`"true"`, `not_in`, `source in`, other fields with `exists`, an empty `in` list, unknown values, non-string items, two `status in`, and conflicting `status equals` + `status in` or `assignedTo equals` + `exists false` (`CONFLICTING_PARAMS`, line 195).
- **Semantics match Payload.** `@payloadcms/drizzle` `sanitizeQueryValue.js:46-64,216-223`: a string `in` value goes through `createArrayFromCommaDelineated` (split on `,`, no trim). `exists` becomes `val === 'true' || val === true`, otherwise `isNull`. The server rebuilds `{status:{in:[...]}}` / `{assignedTo:{exists:false}}` and sends them through the same Local API, so the semantics match. WhereBuilder `Condition/index.js:34-43` writes `exists` as the string `'true'`/`'false'`, and the client accepts the string form.
- **Server parsing.** Whitelist, item cap, dedupe, `unassigned` accepts only `1`, conflicts → 400 before rate limiting, counting or audit. Endpoint test lines 114-145 cover this. The where uses `overrideAccess: false` (the test asserts it). Sale → 403 is unchanged.
- **Audit.** `meta.filters` holds only normalized values (`statusIn` array, `unassigned: true`). The test asserts exact equality, so no PII is logged.
- **Search + chip.** The client keeps the search term verbatim, and the server merges it with `mergeListSearchAndWhere` as before. Test: chip + date + search.
- **W1.** Leaving the "Mới" chip removes only `assignedTo exists false` (group signature). A manual "Sale = A" filter survives a click on "Đã chốt" (tested). Choosing "Mới" replaces `assignedTo`, as intended.
- **T01 minors fixed.** `hasGroupCondition` is added. "Tất cả" is lit only when the group has no condition, and clicking it while lit does not call `refineListData` (tested).
- **Test edits.** `in` → `not_in` in LeadExportButton.test.tsx is correct now that `in` is supported, and the locked-button path is still covered. `LeadExportSlot.test` uses `toContain`, but the exact order is asserted in QuickFilterChips.test.tsx. Coverage is not weaker.
- **Access.** `Leads.ts` changes only `components.beforeListTable`. Access is untouched.
- **API_SPEC.** The as-built text matches the code (`statusIn`, `unassigned=1`, conflicts → 400, `beforeListTable`), apart from the label noted in MINOR-1.
- **Agent decision on labels.** The builder used the Payload labels "có trong" / "tồn tại" instead of the task's "nằm trong" / "chưa có". Accepted: `vi.js:459,463` uses exactly those labels.

## Responsive Checklist Gate (only the UI in this diff: the Lead chip bar reuses the T01 component and CSS)
| Item | Result | Evidence |
|---|---|---|
| Layout, no page-level horizontal scroll | OK (CSS reuse) | Same `QuickFilterChips` markup and CSS reviewed in T01: `.quick-filter-chips__scroller` scrolls inside the bar. Lead adds 1 group with 5 chips and no new CSS. Existing list overflow belongs to BL-024 (out of scope). |
| Mobile-first, no fixed px container | OK | No new CSS in this diff |
| Typography rem / clamp | N/A | No new CSS |
| Media | N/A | No images |
| Touch target ≥ 44px | OK | T01 chip CSS gives 44px min height (reused) |
| Mobile nav | N/A | — |
| Table on mobile | N/A | Out of scope (BL-024) |
| 100vh / reduced motion / overflow:hidden | N/A | No new CSS |
| A11y | OK | `role="group"` + `aria-label`, `aria-pressed` (tests) |

## Skill gates
- aislop: skip (not among the allowed verify commands for the reviewer)
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). ESLint 0 errors.
- ocr: skip, ocr not installed / not allowed
- AI-readable: OK. Small functions, clear names, constants named (`MAX_STATUS_IN_VALUES`, `TRASH_SEGMENT_INDEX`), comments explain why. No indicators.
- ai-friendly-web: N/A (admin, internal)
- blitzstrike: skip (no permitted environment)

## Findings
- **[MINOR-1]** `src/lib/leads/export-filters.ts:143` and `docs/API_SPEC.md` (§4 as-built: "`tồn tại` = Không") give the wrong value label. For `exists`, Payload's WhereBuilder offers `general:true/false`, which in Vietnamese is **"Đúng"/"Sai"**, not "Không" (`@payloadcms/ui .../WhereBuilder/Condition/index.js:34-43`, `translations vi.js:310,421`; the project only overrides `general.noLabel`). Users told to pick "Không" will not find that option. Fix: write `"tồn tại" = "Sai"` in the message and in API_SPEC, and change the test expectation `"Không"` → `"Sai"` (export-filters.test.ts, last test).
- **[MINOR-2]** `src/lib/leads/export-filters.ts:57,176`: `parseStatusList` trims each item on the client path (`statusListParam`), but Payload does not trim `in` values. A hand-crafted URL such as `status[in]= won` gives an empty list but exports the `won` leads. This is admin-only and gives no extra access; the same pattern already exists for `equals` through `read()`. Suggested fix: in `statusListParam`, reject any item where `item !== item.trim()`.
- **[MINOR-3]** (note only) `withChip` removes `assignedTo exists false` whenever another chip is chosen, even if the user added that condition by hand without "Mới". This matches the W1 wording ("bỏ đúng `assignedTo exists false`"). No change needed.

## Residual risk
- The reviewer did not check the browser behaviour: F5 keeping the chip lit, the export button enabled for each chip, and the chip bar at 375px. The where shape was checked against the Payload source (`in` is written as an array, read back via qs as an array or comma string; `exists` is the string `'false'`), and unit tests cover both forms. Manual smoke on `/admin/collections/leads` is recommended before release.
- There is no integration test against a real DB for the "Mới" / "Đang tư vấn" chips. Correctness rests on the where being identical to the list where, plus Payload's sanitize semantics checked above.

## Verdict
✅ **PASS**: no CRITICAL or MAJOR findings. MINOR-1 should be fixed soon (cheap, user-facing message).
