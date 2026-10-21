Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-02 · round 2

- Worktree: `D:\prj\bds\.claude\worktrees\agent-ac1778247aea60dd2` (branch `worktree-agent-ac1778247aea60dd2`, base `c26d69e`, uncommitted)
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-02.md` (section "attempt 2")
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-02-round-1-review.md` (FAIL: M1 + m1–m7)

## Review level: STRICT
**Reason:** these are shared components and a shared navigation hook (`useListingFilterNav`, `listing-params`, the `ui/slider` primitive) for every listing page in BL-052 and BL-054. They handle URL/navigation state. The `FilterSheet` API changed (it now takes `action` and `preservedParams`).

## Blast radius
- The same files as round 1 (new files under `src/components/listing/*`, `src/components/ui/slider.tsx`, and vi/en i18n). No page consumes them yet; assembly happens in P1-T05, P2-T02 and P3-T03.
- The `FilterSheet` props change affects only the pages that will assemble it, and none exist yet.
- `importMap.js` and `payload-types.ts` differ only in EOL. Do not commit them.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (no errors) |
| `pnpm lint` | PASS: 0 errors, 2 existing warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src/components/listing src/components/ui no-raw-colors src/i18n` | PASS: 13 files, 107 tests |
| i18n key parity for `page.listing` (node script) | vi 31 = en 31 keys, no differences |
| Full `pnpm test` / integration | not re-run (the diff is client-side UI only) |

## Did each round 1 finding actually close?
| Finding | Status | Evidence |
|---|---|---|
| M1: stale `current` | **Closed for synchronous calls, but there is a new hole with the debounce (see MAJOR N1)** | `use-listing-filter-nav.ts:20-33`: a ref collects patches and is reset when the normalised `base` URL changes. Tests `listing-filters.test.tsx:316-349` cover 2 consecutive navigations, a reset when the URL changes, and a new object for the same URL. |
| m1: no-JS filtering below lg | Closed | `FilterPanel.tsx:94-113`: `<details>` + `FilterForm` GET + "Áp dụng". Test at `:240-255`. |
| m2: debounce 300 ms | Closed, but it introduces N1 | `FilterFacets.tsx:237,257-263`. Test at `:177-191`. |
| m3: sidebar hint | Closed | `FilterPanel.tsx:55,66-70`: sr-only hint plus `aria-describedby`, only once hydrated. Test at `:237`. |
| m4: touch targets up to < lg | Mostly closed: no `md:min-h`/`md:h-9` left in `src/components/listing/*.tsx` | The Sheet trigger is still 40px at md (see m-b). |
| m5: `useId` | Closed | `ListingHero.tsx:52,84`, `LearnMoreFaq.tsx:51,63,87,102`. |
| m6: magic offset | Closed | `SpotlightSlider.tsx:29,56,66`: shared `IMAGE_BOX` constant, controls use `bottom-4 left-4` inside the overlay frame. |
| m7: min > max | Closed | `FilterFacets.tsx:251` clamps and sorts. Test at `:193-203`. |

## Responsive Checklist Gate (375 / 768 / 1280)
No browser available. Checked by reading the CSS.
- No horizontal scroll: **OK**. Nothing new is fixed-width. `<details>` is `lg:hidden` and its panel is `p-5` at full width. The Spotlight overlay uses `top-0 left-0` with no fixed width.
- Mobile-first (`min-width`): **OK**. Uses `lg:`/`md:`. `max-lg:hidden` is only on the sidebar.
- Typography in rem/tokens: **OK**.
- Media: **OK**. `IMAGE_BOX` is `h-60 md:h-72 lg:min-h-[340px]` and the image is absolute (no CLS).
- Touch targets ≥ 44px at 375: **OK**. Facets are `min-h-11` up to < lg, and the summary is `h-11`. At 768 the Sheet trigger is 40px, which meets WCAG 2.5.8 AA. See m-b.
- Mobile nav/filter: **OK**. Without JS it is `<details>`. With JS it is a bottom Sheet (`90svh`).
- Table: N/A.
- No bare `100vh`: **OK** (`90svh`).
- `prefers-reduced-motion`: **OK**. No new animation.
- No `overflow:hidden` hiding bugs: **OK**.
- Hydrate swap from `<details>` to Sheet: OK at 375 and 1280, but there is a 4px jump at 768–1023 (m-b).

## Skill gates
- aislop: **skip, aislop not installed**
- oxlint (anti-slop): **skip, oxlint not configured**. ESLint passes.
- ocr: **skip, ocr not installed**
- AI-readable: **OK**. There is 1 indicator: `FilterFacets.tsx` has 307 lines, over the 300-line limit (m-a). This is below the threshold of 3.
- ai-friendly-web: **N/A**. Internal components.
- blitzstrike: **skip**. No auth or API, no environment.
- no-raw-colors: **OK** (test passes).

## Findings

### [MAJOR] N1 — The slider debounce runs a stale `onCommit`/`navigate` closure, which reopens the M1 bug (silent filter loss)
Locations:
- `FilterFacets.tsx:260-263`: `scheduleCommit` captures the `onCommit` from the render that scheduled it.
- `use-listing-filter-nav.ts:26-33`: `navigate` closes over the `current` from that same render, and the ref is reset in the effect on `[base]`.

Scenario:
1. The user ticks "Hà Nội" (push A, ref = `{province}`).
2. Within about 300 ms they press ← or → on the slider. This render is N, where `current_N` has no `province`, and the timer captures `navigate_N`.
3. A comes back from the server. `base` changes, so the effect resets the ref to `{}`.
4. The timer fires `navigate_N({priceMin…})`, which computes `listingHref(path, current_N, {price})`. `province` is lost from the URL.
5. Then `useUrlBackedState` resyncs, and the user's tick disappears.

The same thing happens when the user drags with the mouse and releases. The 300 ms debounce widens this window by design.

None of the current tests cover a URL change between scheduling the commit and the timer firing.

**Fix (pick one or both):**
- (a) In `RangeSliderFacet`, keep `onCommitRef` up to date on every render (`useLayoutEffect`/`useEffect`) and call `onCommitRef.current` inside the timer.
- (b) In `useListingFilterNav`, keep `currentRef` up to date with the latest `current` and make `navigate` read `currentRef.current`. This also makes `navigate` stable, so the hook is safe for any delayed caller, not just the slider.

**Required test:** schedule a slider commit, rerender with a new `current` (for example `{province:"ha-noi"}`), advance the timer, and check that `push` contains both `province` and `priceMin`.

### [MINOR] m-a — `FilterFacets.tsx` has 307 lines (limit 300)
Move `RangeSliderFacet` (with `clamp`, `sameNumbers` and `RANGE_COMMIT_DELAY_MS`) into its own file, for example `RangeSliderFacet.tsx`.

### [MINOR] m-b — The trigger before and after hydration differs in height at 768–1023
- The summary is `h-11` at every width (`FilterPanel.tsx:97`).
- `ListFiltersButton` is `h-11 md:h-10` (`ListSearchBar.tsx:120`).

So the task file's "cùng kích thước, không xô bố cục" claim is wrong at md: there is a 4px jump, and the Sheet trigger is 40px, which goes against the m4 policy of 44px up to < lg.

**Fix:** pass `className="md:h-11"` to `ListFiltersButton` in `FilterSheet`, or set `lg:` on the shared component.

### [MINOR] m-c — "Xoá tất cả" to a URL equal to the current `base` does not reset the pending patch
`use-listing-filter-nav.ts:23-25`.

Scenario:
1. The page is at the clean URL, and the user picks a status (pending).
2. They click "Xoá tất cả" (`href` = clean URL = `base`). `base` does not change, so the ref keeps `{status}`.
3. The next facet change brings `status` back.

**Fix:** also reset the ref when the transition settles (`pending` goes from true to false). Alternatively, expose `reset()` and call it from the clear link.

### [MINOR] m-d — The badge in `<summary>` has no accessible text
`FilterPanel.tsx:100-104`: the accessible name is read as "Bộ lọc2". `ListFiltersButton` uses `aria-label` "Bộ lọc (n)" plus `aria-hidden` on the badge.

**Fix:** set `aria-hidden` on the badge and add `<span className="sr-only">({activeCount})</span>`, or give the summary the same accessible name as the button.

## Residual risk
- Not verified in a browser: whether hydration causes a jump, keeping focus and scroll after `router.push`, or the race in N1. The race comes from reading the closures, and is very likely given how the effect and timer are ordered.
- The full `pnpm test` was not re-run.
- Next's router may abort the older push. This does not affect N1, because N1 comes from the stale closure, not from push order.

## Verdict: FAIL
1 MAJOR (N1), a regression of the M1 class introduced by the m2 fix. Return to the builder:
1. Fix N1 using (a) and/or (b), and add a test where the URL changes while the debounce is pending.
2. m-a through m-d are recommended. m-b is quick to fix and makes the hydrate claim in the task file true.

Do not commit `importMap.js` / `payload-types.ts` (EOL-only).
