Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-02 · round 3

- Worktree: `D:\prj\bds\.claude\worktrees\agent-ac1778247aea60dd2`. Attempt 3 is uncommitted. `importMap.js` and `payload-types.ts` differ only in EOL: ignore them and do not commit them.
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-02.md`, section "attempt 3".
- Round 2: FAIL because of N1 (MAJOR) and m-a through m-d.

## Review level: STRICT
**Reason:** these are shared components and a shared navigation hook (`useListingFilterNav`) for every listing page in BL-052 and BL-054. They handle URL and navigation state, which is where filters can be lost. The API of `useListingFilterNav` changed: it now returns `reset`. `FilterSidebar` and `FilterSheet` changed too: they now take `onClear`.

## Blast radius
- Files: `src/components/listing/*` (new, including the new `RangeSliderFacet.tsx`), `src/components/ui/slider.tsx`, and vi/en i18n.
- No page consumes these yet. Assembly happens in P1-T05, P2-T02 and P3-T03. The pages must follow this contract: call the hook **once**, pass `navigate` to both the sidebar and the Sheet, and pass `reset` to `onClear` on both.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 existing warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src/components/listing src/components/ui no-raw-colors src/i18n` | PASS: 13 files, 109 tests |
| Full `pnpm test` / integration | not re-run (client-side UI diff). The builder reports `--project ui` 1114/1114 PASS. |

## Did each round 2 finding actually close?
| Finding | Status | Evidence |
|---|---|---|
| **N1 (MAJOR)**: stale closure in the slider | **Closed** | Both sides are fixed. `RangeSliderFacet.tsx:53-56,62`: `onCommitRef` is updated in a layout effect on every render, and the timer calls `onCommitRef.current`. `use-listing-filter-nav.ts:23-26,37-45`: `latest = {path, current}` is kept in a ref, and `navigate` is stable (deps `[router]`) and reads the latest `current`. The ordering is correct: the layout effect updates `latest` before the `[base]` effect resets `pendingPatch`, so a timer that fires afterwards uses the new URL plus its own patch. **The required test exists:** `listing-filters.test.tsx:375-408` uses an inline `onCommit` (new on every render), rerenders with `current={province}`, advances the timer, and checks that `push` was called exactly once with `/du-an?province=ha-noi&priceMin=1`. |
| m-a: file over 300 lines | Closed | `FilterFacets.tsx` is 215 lines and `RangeSliderFacet.tsx` is 103. There is no circular import: `RangeSliderFacet` imports `useHydrated`/`useUrlBackedState` from `FilterFacets`, and not the other way round. |
| m-b: 4px jump at md | Closed | `FilterPanel.tsx:125`: `className="md:h-11"`. The summary is `h-11` (`:101`). Test at `:281`. |
| m-c: "Xoá tất cả" to the same URL | Closed for `pendingPatch` | The hook has `reset` (`use-listing-filter-nav.ts:33-35`), and `onClear` goes on the `PendingLink` in the sidebar (`FilterPanel.tsx:63`) and in the Sheet (`:136`). `PendingLink` forwards `...props`, so the `onClick` is kept. Tests at `:225-236` and `:351-373`. Three edge paths remain; see n1–n3. |
| m-d: badge in summary | Closed | `FilterPanel.tsx:105,110`: the badge is `aria-hidden` and there is an sr-only " (n)". Test at `:255`. |

**No regressions:**
- M1 (merging 2 consecutive changes), resetting when `base` changes, and keeping the change when the page passes a new object for the same URL (`:410-421`): all still PASS.
- m1 (no-JS `<details>` + GET form): unchanged.
- The 300 ms debounce: unchanged and covered by its test.

## Paths that can still lose or wrongly restore a filter
| Path | Result |
|---|---|
| Two consecutive changes before the URL comes back | OK (pending patch is merged) |
| A slider commit pending while another filter's URL comes back (N1) | OK |
| back/forward | `base` changes, so `pendingPatch` is reset and `useUrlBackedState` resyncs. OK, **except** when a slider commit is still pending at that moment (n1). |
| "Xoá tất cả" to a different URL or the same URL | `pendingPatch` is reset. OK, **except** for a pending slider commit (n1) and the optimistic state on the same URL (n3). |
| Sheet close/open | Each facet keeps its own state, and on reopen it resyncs from the URL. OK, **except** when the Sheet closes while the commit is pending (n2). |

## Responsive Checklist Gate (375 / 768 / 1280)
No browser available. Checked by reading the CSS. The round 3 diff only changes trigger height and a11y text.
- No horizontal scroll: **OK** (no fixed width added).
- Mobile-first (`min-width`): **OK** (`md:h-11` and `lg:` are min-width).
- Typography in rem/tokens: **OK**.
- Media `max-width`/`aspect-ratio`: **OK**. Unchanged since round 2 (`IMAGE_BOX`).
- Touch targets ≥ 44px: **OK**. The Sheet trigger is `h-11` at md as well (m-b closed). Facets are `min-h-11` up to < lg.
- Mobile nav/filter: **OK**. Without JS it is `<details>`; with JS it is a bottom Sheet (`90svh`).
- Table: **N/A**.
- No bare `100vh`: **OK** (`90svh`).
- `prefers-reduced-motion`: **OK**. No new animation; the global rule disables animation.
- No `overflow:hidden` hiding bugs: **OK**.
- Hydrate swap from summary to Sheet trigger: **OK**, both 44px at every width < lg.

## Skill gates
- aislop: **skip, aislop not installed**
- oxlint (anti-slop): **skip, oxlint not configured**. ESLint passes with 0 errors.
- ocr: **skip, ocr not installed**
- AI-readable: **OK**. 0 indicators: every file is ≤ 300 lines and the comments explain why, not what.
- ai-friendly-web: **N/A**. Internal components.
- blitzstrike: **skip**. No auth or API, no environment.
- no-raw-colors: **OK** (test passes).

## Findings

### [MINOR] n1 — "Xoá tất cả" and back/forward do not cancel a pending slider commit, so filters can come back
Locations:
- `RangeSliderFacet.tsx:60-63`: the timer lives only in the slider.
- `use-listing-filter-nav.ts:33-35`: `reset` only clears `pendingPatch`.

Scenario:
1. The user releases the slider.
2. Within 300 ms they click "Xoá tất cả".
3. The timer fires `navigate({price})`:
   - If the clear navigation has not come back yet, `latest.current` is still the **old URL with all its filters**. The new push makes Next drop the clear navigation, so every filter comes back, plus the price.
   - If the clear navigation has already come back, the URL becomes the clean URL plus the price.

The same thing happens when the user presses Back inside that window: the timer pushes forward again.

The window is narrow (300 ms), so this is MINOR.

**Suggested fix (either one):**
- `reset` increments a `generation` counter. The page uses it as the `key` of the filter content, so facets remount, the unmount runs `clearTimeout`, and the optimistic state is reset too (this also covers n3).
- Alternatively, the hook exposes a way to cancel pending commits.

### [MINOR] n2 — Closing the Sheet while a commit is pending silently drops the slider change
Locations:
- `RangeSliderFacet.tsx:58`: unmount calls `clearTimeout`.
- `FilterPanel.tsx:127-132`: the Sheet content is unmounted when it closes.

Natural mobile flow: drag the slider, then tap "Xem kết quả".
- The timer is cancelled when the content unmounts after the exit animation (`--duration-base`).
- With `prefers-reduced-motion` the content unmounts immediately, so the whole 300 ms window applies.
- The user saw the slider move, but the results are not filtered by price.

**Suggested fix (either one):**
- Commit immediately when the commit comes from a pointer (release), and debounce only keyboard commits.
- Alternatively, flush the pending commit on unmount, but only if the facet is not being unmounted because the whole page is navigating away.

### [MINOR] n3 — "Xoá tất cả" to the same URL while a push is in flight leaves the optimistic state wrong
Location: `FilterFacets.tsx:26-33`.

Scenario:
1. The page is at the clean URL, and the user picks a status chip (optimistic, push in flight).
2. They click "Xoá tất cả" (`href` = clean URL). Next drops the earlier push, so the URL stays clean.
3. The `value` prop does not change, so `useUrlBackedState` does not resync. The chip still looks selected while the results are not filtered.

This is only a visual mismatch: thanks to `reset`, the next navigation does not bring the status back.

**Fix:** the same `generation`/`key` remount as in n1.

## Residual risk
- Not verified in a browser: whether hydration causes a jump, keeping focus and scroll after `router.push`, or the timing of n1 and n2. n1 and n2 come from reading the code and how the effect and timer are ordered.
- Correctness depends on the Next app-router action queue dropping the older navigate when a newer one is dispatched. If it does not, an intermediate URL could commit after `pendingPatch` has been reset.
- Pages must call `useListingFilterNav` once and connect `reset` to `onClear`. P1-T05, P2-T02 and P3-T03 must check this when they assemble the pages.
- The full `pnpm test` was not re-run.

## Verdict: PASS
There are no CRITICAL or MAJOR findings. N1 has actually closed, with the required test. m-a through m-d are closed and nothing regressed. n1–n3 are MINOR edge cases in a ≤ 300 ms window. The suggested follow-up is the `generation`/`key` approach plus committing pointer releases immediately; this can go in a small follow-up task or be done when P1-T05 assembles the page.

Do not commit `importMap.js` / `payload-types.ts` (EOL-only).
