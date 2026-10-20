Agent: reviewer

# Review — feature-header-scroll-transition-smooth · phase-1-task-01 · round 1 (BL-026)

- **Review level:** NORMAL
- **Reason:** The change is a MODIFY to a shared layout component (`HeaderFrame`, used by every `(frontend)` route). It only changes Tailwind class strings for transition duration, easing and radius. It does not change JS, DOM, API, auth or schema.
- **Blast radius:** `src/components/layout/HeaderFrame.tsx` affects the header on every public route. It changes the bar's shape during the flat ↔ floating transition and the corner radius while floating. Header height (`--header-offset` 80/104px), layout, scroll threshold and the background are unchanged.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/layout` | PASS. 16 files / 113 tests |
| `pnpm lint` | PASS. 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit` exits clean) |
| Dev server CSS (`localhost:3000`, existing chunk, no new server started) | `.duration-\(--duration-slow\)` → `transition-duration: var(--duration-slow)`. `.ease-standard` → `var(--ease-standard)`. `.group-data-\[scrolled\]\:rounded-\[2rem\]` at line 3041. `.lg\:group-data-\[scrolled\]\:rounded-\[2\.25rem\]` at line 4273, inside `@media (min-width: 64rem)` |

## Acceptance check
- **Corners change gradually from 0 to 32/36px; 9999px is gone.** OK. Production markup has no `rounded-pill`, and the tests assert `not.toHaveClass("group-data-[scrolled]:rounded-pill")`.
- **Radius is exactly half the floating bar's height.** OK. Below lg: header 5rem = 80px minus 8+8px padding gives a 64px bar, so 2rem = 32px. At lg and up: 6.5rem = 104px minus 16+16px gives a 72px bar, so 2.25rem = 36px. The `--header-offset` breakpoint is `min-width: 64rem`, which matches Tailwind `lg` (64rem).
- **Cascade order.** OK. Both rules have the same specificity (`:is(:where(.group)[data-scrolled] *)`). The `lg:` rule comes after the base rule (4273 > 3041) inside a media query, so it wins at ≥ lg.
- **All properties use the same timing.** OK. Header (padding) and bar (max-width, border-radius, box-shadow) both use `duration-(--duration-slow) ease-standard`. `--ease-standard: cubic-bezier(0.2,0,0,1)` is in `@theme static` (globals.css:115). `--duration-slow: 450ms` is at globals.css:169.
- **`motion-reduce:transition-none` kept on both elements.** OK. The new test asserts it.
- **No change to header height, layout or JS.** OK. The diff only touches class strings and the JSDoc. `h-(--header-offset)`, the padding pairs, `max-w-full` ↔ `max-w-[84rem]` and the 84rem content frame are unchanged.
- **Tests updated.** OK. They cover the new radius at both breakpoints, the absence of the pill class, and that both elements share duration/easing plus motion-reduce. `Header.test.tsx` uses the new class.
- **design-spec §2.1.** Updated at close-out (per the brief). Not counted as a defect.

## Responsive Checklist Gate (diff touches UI: class strings in HeaderFrame)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | No width change. `w-full max-w-full` ↔ `max-w-[84rem]` is the same as before |
| Mobile-first `min-width` | OK | `lg:` override is emitted inside `@media (min-width: 64rem)` |
| Grid auto-fit / container not fixed px | N/A | No grid. Container unchanged (rem) |
| Font rem / heading clamp / spacing scale | N/A | No typography or spacing changes |
| Media (img/video) | N/A | Not in the diff |
| Touch target ≥44px / mobile nav / table | N/A | Not in the diff (bar height 64px unchanged) |
| 100vh | N/A | Not used |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` on header and bar |
| No overflow:hidden masking errors | OK | No overflow added |

Residual risk: no browser was available, so the motion at 375/768/1280/1920px was not watched. This was checked with CSS math only (32px = half of 64px, 36px = half of 72px, breakpoint 64rem).

## Skill gates
- **aislop:** skip. The command is not in the allowed verify list for the reviewer. The diff is about 10 lines of class strings plus one test and has no slop indicators.
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) shows 0 errors.
- **ocr:** skip, ocr not installed / not in the verify list.
- **AI-readable:** OK. 0 indicators. The `2rem`/`2.25rem` values are explained in the JSDoc (half the bar height) and the comment gives the WHY (interpolating from 9999px).
- **ai-friendly-web:** N/A (no change to public routes or crawl files).
- **blitzstrike:** N/A (not STRICT, not security-related).

## Findings
- **[MINOR]** `src/components/layout/HeaderFrame.test.tsx:51`: the string `"group-data-[scrolled]:rounded-pill"` in the negative assertion is picked up by Tailwind v4's source scan. As a result, the dev CSS still emits the dead rule `.group-data-\[scrolled\]\:rounded-pill` (all.css:3045). This is harmless (1 rule, no element uses it) and does not block. Optional fix: assert by regex/`className` (for example `expect(bar?.className).not.toMatch(/scrolled\]:rounded-pill/)`), or add `@source not` for `*.test.tsx`. Better as a separate task, since it applies to the whole repo.
- No CRITICAL or MAJOR findings.

## Verdict
✅ **PASS**
