Agent: reviewer

# Review: build-tami-website, layer-6-task-05 (project detail), round 2 (delta)

- **Review level:** STRICT
- **Reason:** The delta touches shared UI behaviour: the global CSS variable `--sticky-cta-height` on `<html>`, which the shared `FloatingContact` reads, and a window-level `hashchange` contract between `ProjectSubNav` and `LegalPolicy`. It also moves the server-side Payload field validator `validateWardInProvince` that `Rentals` and `Projects` share, which affects data validation.
- **Blast radius:** `LegalPolicy` (project detail S03 block 8), `ProjectSubNav` (every sub-nav click now dispatches a window `hashchange`), `ProjectStickyCta`, and `FloatingContact` (bottom offset on every page while the bar is showing). Admin/API validation for `rentals.ward` and `projects.ward` via `src/fields/ward-in-province.ts`. No schema, migration, auth or API contract change.
- **Scope:** The whole uncommitted diff against HEAD 4f14678 was taken as the task. This round focused on the round-1 MINOR 1–4 delta.

## Round-1 MINOR closure
| # | Round-1 finding | Status | Evidence |
|---|---|---|---|
| 1 | `hidden` attribute beat `lg:` (Tailwind v4 `!important` preflight) | FIXED | `LegalPolicy.tsx:56` uses `cn("pt-6", !open && "max-lg:hidden")`, with no `hidden` attribute and a corrected comment at :54-55 |
| 2 | Sticky CTA showed in desktop SSR; no safe-area padding | FIXED | `ProjectStickyCta.tsx:53` has `lg:hidden box-content h-16 pb-[env(safe-area-inset-bottom,0px)]`; the CSS var is `calc(64px + env(...))` (:45) |
| 3 | Projects imported ward validators from the rentals module | FIXED | Pure move to `src/fields/ward-in-province.ts`. `Rentals.ts:16` and `Projects.ts:13` import the new path. Grep across the repo finds no other importer, and no stale imports remain in `field-validators.ts` (its `relationship`/`Where`/`relationId` imports were removed and `SiblingValues` was narrowed) |
| 4 | Sub-nav or hash landed on a collapsed accordion | FIXED | `LegalPolicy.tsx:72-82` opens the block from `location.hash` on mount and on `hashchange`; `ProjectSubNav.tsx:71-72` dispatches `HashChangeEvent` after `replaceState` |

## Focus checks
- **Accordion a11y:** OK. Below lg: the `button` has `aria-expanded={open}` and `aria-controls={panelId}`, and the panel element is always in the DOM, so the reference stays valid. A closed panel is `display:none`, so it leaves the a11y tree and its content cannot be focused. At lg and above, the `h2` is plain text, the panel is always visible, and there is no stale `aria-expanded`. `useSyncExternalStore` uses server snapshot `false`, so there is no hydration mismatch. Before hydration on desktop the server button sits next to visible content for a moment, but it is inert until hydration (accepted).
- **Synthetic hashchange (double-scroll / IntersectionObserver lock):** OK. A synthetic `HashChangeEvent` does not make the browser scroll, and Next App Router listens to `popstate`, not `hashchange`. So the only scroll is the one `scrollIntoView`. The `setOpenIds` call from the native listener is batched inside the React click handler and commits after `scrollIntoView` starts. The target `section`'s top edge does not move, because the panel expands below the heading and no block above it changes state. So the smooth-scroll target stays correct. `scrollLocked` and `setActiveId(id)` are not touched by the listener, so the lock is not affected. Real `hashchange` events for other anchors (for example `#lead-form`) are ignored because they fail the `ids.includes` check.
- **`calc(env())` inside the CSS var consumed by FloatingContact:** OK. The custom property is substituted at use time inside `bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--floating-bottom-offset,0px)+var(--sticky-cta-height,0px))]`. Nested `calc()` and `env()` inside a custom property are valid CSS. The bar is 64px + safe-area tall (`box-content`), and the floating button sits above it with a gap of `max(1rem, safe-area)`. On notched devices the safe area is counted twice, but that only makes the gap larger (no overlap). Acceptable.
- **Stale imports from the old validator location:** none. `pnpm typecheck` is clean, and `rentals-hooks.test.ts` imports only `validateVideoUrl` from the old file, which is still valid.

## Verify commands + result
Commands come from `.context/project-config.md`:
- `pnpm lint`: PASS (eslint, no output)
- `pnpm typecheck`: PASS (`tsc --noEmit`, no errors)
- `pnpm test`: PASS, 135 files and 1,477 tests
- `pnpm build`: PASS (route table printed)

## Responsive Checklist Gate
The diff touches UI. Checked at 375/640/768/1024/1280/1536 by CSS math (no browser).
- **Layout (no horizontal scroll, mobile-first, grid):** OK. `LegalPolicy` is `grid` with 1 column below lg and `lg:grid-cols-2` at lg and above, with `min-w-0` on each section. The sticky bar is `inset-x-0` with `px-gutter`, so nothing is fixed-width.
- **Typography/Spacing:** OK. Token classes `text-h2` and `text-small`; spacing follows the scale.
- **Media:** N/A (the delta adds no media).
- **Touch/Interaction:** OK. The accordion button is `min-h-11` (44px); sub-nav links are `min-h-12`; the sticky CTA `Button size="lg"` sits in a 64px bar.
- **Viewport/A11y:** OK. No `100vh`. Scrolling respects `prefers-reduced-motion` (`ProjectSubNav.tsx:73`). Panels are hidden with `max-lg:hidden` (display:none), not `overflow:hidden`. The safe-area inset is handled.

## Skill gates
- aislop: skip, `aislop: command not found`
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`); eslint PASS
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK. Names are clear, functions are under 50 lines, files are under 300 lines, and indirection is at most 2 hops. Comments explain WHY (the Tailwind `[hidden]` reason, why `replaceState` is followed by a dispatch). 0 indicators.
- ai-friendly-web: N/A for this delta (no change to `robots`/`sitemap`/`llms`)
- blitzstrike: skip, no permitted environment. The delta has no auth or input surface beyond reading the URL hash (see MINOR-2).

## Findings
### CRITICAL
None.
### MAJOR
None.
### MINOR
1. **`src/components/projects/project-detail.test.tsx:288` gives false confidence.** `expect(html).not.toMatch(/shidden[=s>"]/)` looks like it lost its backslashes; it was meant to be `/\shidden[=\s>"]/`. As written, it looks for the literal `shidden` and can never match React's ` hidden=""`, so it does not guard against MINOR-1 coming back. Lines 289-290 only check the `class` attribute, which would still pass if `hidden` were added back. Fix: `expect(html).not.toMatch(/\shidden(=|\s|>)/)`.
2. **`src/components/projects/LegalPolicy.tsx:75`: `decodeURIComponent` throws `URIError` on a malformed hash** (for example `/du-an/x#%` or `#%E0`). The throw happens inside `useEffect` on mount and on `hashchange`, so it escapes to the error boundary and replaces the project detail page for that visitor. Fix: wrap the decode in try/catch and return on failure (or compare the raw `location.hash.slice(1)` when ids are ASCII slugs).

## Residual risk
- No browser was used, so runtime scroll and timing behaviour (smooth scroll while the accordion expands, iOS safe-area values) was reasoned from code. I relied on the builder's evidence (curl server HTML, JS-disabled iframe at 1280/375, hydrated checks).
- The `.oxlintrc*` Glob returned empty, so the oxlint gate was skipped.

## Verdict
**PASS.** There are no CRITICAL or MAJOR findings. All 4 round-1 MINORs are closed, and lint, typecheck, tests (1,477) and build pass. Every responsive item is OK or N/A. MINOR-1 and MINOR-2 above are recommended to fix now or carry as follow-ups; neither blocks.
