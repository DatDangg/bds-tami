Agent: reviewer

# Review — feature-admin-list-quick-filter-chips · phase-1-task-01 · round 1

- **Review level:** STRICT
- **Reason:** shared helper `src/lib/translation/admin-ui.ts` refactored (`toBranches` exported, `rebuildWhere` extracted, and used by `withTranslationFilter`, which also guards BL-021 bug #01); shared list toolbar slot `beforeListTable` / `.list-toolbar-item`; helper `quick-filters.ts` will be reused by Lead (T02).
- **Blast radius:** `/admin/collections/rentals` list toolbar (chips + the existing "Trạng thái dịch" filter in the same slot); every collection that uses `withTranslationFilter` (content collections with translation), through the `rebuildWhere` refactor; `importMap.js` (one entry added); `_lists.scss` (new `.quick-filter-chips` block only). No schema, API, auth or migration changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm test` | PASS: 2905/2905 tests, including the existing translation-filter / bug #01 tests, so the `rebuildWhere` refactor caused no regression |

## Requirements coverage
- 3 groups match the spec table and D4/D5: status published/rented/draft (`hidden` only under `Tất cả`); bedrooms 0/1/2/≥3; price `<10tr`, `>=10tr & <20tr`, `>=20tr & <=50tr` (50tr included), `>50tr`. The boundaries are exact, with no gaps or overlaps. Field paths are top-level (unnamed tabs + rows), so `bedrooms` / `priceMonthlyVnd` / `status` are correct; `rented` is a valid status for rentals (content-defaults).
- Per-OR-branch merge (D2): `withChip` filters each branch's entries, keeps non-group entries, and appends the chip conditions. It keeps the `or` form and does not wrap the whole clause, so BL-021 #01 does not come back. Tests cover the or form, combination with the translation filter in both directions, and manual filters on the same field (D3).
- `currentChip` survives qs strings: `normalizeOperand` stringifies scalars, and `in/not_in/all` become sorted string arrays (a single value or a qs object form is also handled). Tests cover `"0"`, `"10000000"`, `"3"`, `"false"`, and array order.
- Toggle: clicking the active chip calls `withChip(..., "")`. `Tất cả` does the same. Every click resets to page 1.
- `replaces` semantics for T02: the default is `group.fields`, and leaving a chip also removes that group's chip-condition signatures on secondary fields. The test simulates the Lead `new` chip (`assignedTo exists:false` removed, manual "Sale phụ trách" kept).
- Trash: hidden by the server slot (`segments[2]==="trash"`, same as `LeadExportSlot`). Drawer: hidden through `isInDrawer`. Both are tested.
- importMap: the key `/components/admin/RentalQuickFilterSlot#RentalQuickFilterSlot` matches the config path, and the import path is correct. The test confirms the order: chips come before `TranslationStatusFilter`.

## Responsive Checklist Gate (UI diff: `QuickFilterChips.tsx`, `_lists.scss`)
No browser check was done by me. Verified with CSS math; the builder's browser evidence was 375px with `scrollWidth`=375.
| Item | Result | Evidence |
|---|---|---|
| No horizontal page scroll | OK | `.list-toolbar-item` is inline-flex, wrapping, `max-width:100%`. Each `__group` has `min-width:0; max-width:100%`, so it shrinks to the line width. `__scroller` has `max-width:100%; overflow-x:auto; flex-wrap:nowrap`, so the chip row scrolls inside its own box rather than the page. |
| Mobile-first / grid / fixed px container | OK / N/A | No fixed-width containers and no grid. No media query is needed, because the layout wraps on its own. |
| Typography rem / fluid heading | OK (convention) | 12px / 14px follow the existing convention in `_lists.scss` (Payload admin chrome is px throughout). `project-config` defines no rem rule. There are no headings. |
| Media | N/A | No images or embeds. |
| Touch target ≥44px | OK | `min-height:44px`, horizontal padding 16px. |
| Nav / table mobile | N/A | |
| 100vh / reduced-motion | N/A | No viewport units and no animation/transition. |
| No overflow:hidden masking | OK | Only an internal `overflow-x:auto` on the chip row. |
| A11y | OK | Native `<button type="button" aria-pressed>` handles Tab and Enter/Space. Groups have `role="group"` + `aria-label`, and the visible label is `aria-hidden`. `:focus-visible` uses a 2px outline with `--admin-focus`. The pressed state is not shown by color alone (border + weight 600). Light and dark tokens all exist: `#6a4e26` on `#f8f3eb`, `#ebd2a8` on `#2a2013`, border-strong ≥3:1. |

## Skill gates
- aislop: skip (not among the allowed verify commands)
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). eslint shows 0 errors.
- ocr: skip, ocr not installed / not allowed
- AI-readable: OK. Names are clear. Functions are ≤30 lines. Files are ≤135 lines. Indirection ≤2. Magic numbers are named (`MILLION`, `TRASH_SEGMENT_INDEX`). Comments explain WHY. Fewer than 3 indicators.
- ai-friendly-web: N/A (internal admin)
- blitzstrike: N/A (no auth/public input surface)

## Findings
- **[MINOR]** `src/components/admin/QuickFilterChips.tsx:31`: `Tất cả` gets `aria-pressed=true` whenever `currentChip` returns `""`. That includes the case where a manual filter on the same field is active (e.g. a manual `status equals hidden` or `bedrooms >= 5`). The UI then says "no filter in this group" while the list is actually filtered. Fix: mark `Tất cả` as pressed only when no branch contains a leaf on `group.fields`. A small exported helper `hasGroupCondition(where, group)` in `quick-filters.ts` would do it, and it should get a test.
- **[MINOR]** `src/lib/admin/quick-filters.ts:52,85-88`: `touchesAnyField` treats a multi-field flat leaf (e.g. a hand-written URL `where[status][equals]=x&where[title][like]=y`, which `andEntries` turns into one entry) as belonging to the group. `withChip` then drops the whole entry, so the `title` condition is silently lost. WhereBuilder never writes this shape and no internal link uses it (grep found none), so the risk is low. Fix: split multi-key leaves into single-field entries before filtering, and add a test.
- **[MINOR]** `src/components/admin/QuickFilterChips.tsx:31`: clicking `Tất cả` when it is already pressed still calls `refineListData`, which resets to page 1 and triggers a refetch. Optional: no-op when `active === ""`.

## Residual risk
- Dark mode, keyboard, and the 375px layout were not checked in a browser by the reviewer. Verification relied on CSS math, tokens, and the builder's evidence.
- importMap identifier hashes were not regenerated by the reviewer (`payload generate:importmap` is not an allowed command). Lookup is by key string, and the key string is correct.

## Verdict
✅ PASS: no CRITICAL or MAJOR findings. The 3 MINOR findings can be fixed in T02 or in a follow-up.
