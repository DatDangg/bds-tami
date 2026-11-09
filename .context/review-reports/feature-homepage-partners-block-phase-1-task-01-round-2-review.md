Agent: reviewer

# Review: feature-homepage-partners-block, phase-1-task-01, round 2 (BL-107, FR-PUB-17, attempt 3)

- Review level: **STRICT**
- Reason: revalidate hook on `developers` (homepage cache/ISR), shared homepage view model + `HomeDocs` contract, public query, a11y of auto-moving content (WCAG 2.2.2 / 2.4.7 / 2.4.11). Unchanged from round 1.
- Blast radius: homepage `/vi`, `/en` (`home-view`, `loadHomeDocs`, `load-home`, `HomeBlocks`), every write to `developers` (hook), `globals.css` `@theme static` (keyframes + `--animate-partners-marquee`), i18n `page.home.partners.*`.
- Scope: only the files listed in the task. Other dirty files in the working tree are out of scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx eslint` on the changed files (PartnersMarquee*, home-view-partners, home-view, home-queries, load-home, HomeBlocks, hooks/developers, Developers.ts) | PASS (exit 0, no output) |
| `pnpm vitest run src/lib/home src/components/home src/i18n src/hooks src/collections` | PASS, 53 files / 459 tests |
| Browser 390/768/1440, real mouse/keyboard interaction | not run (no dev server in reviewer permissions). CSS math and event-model reasoning only, see Residual risk. |

## Round 1 findings: closure status
| Round 1 | Status | Evidence |
|---|---|---|
| MAJOR-1 duration ignored | **Closed** | `globals.css:142` is now the plain `partners-marquee 40s linear infinite` (no nested var). `PartnersMarqueeShell.tsx:32` sets inline `animationDuration: ${loopSeconds}s`. An inline longhand beats the class shorthand `animation:` (inline > class), so the duration really follows the item count. With `animate-none` (focus/reduced-motion) `animation-name: none`, so the inline duration has no effect, which is correct. The test (`PartnersMarquee.test.tsx:73-79`) now asserts `style.animationDuration` (40s / 24s), the property that actually applies. |
| MAJOR-2 overflow at 390, long names | **Closed** | Static: `li` `max-w-full min-w-0` with no `shrink-0` (default shrink 1), `a` `flex min-w-0`, name `min-w-0 [overflow-wrap:anywhere]` with no nowrap. At 390 the name gets about 350−48−96−12 ≈ 194px and wraps. Reduced-motion: `ul` `motion-reduce:w-full min-w-0 shrink flex-wrap`, `li` `shrink-0 motion-reduce:shrink` (the media variant sorts after the base utility at equal specificity, so `shrink` wins), name `motion-reduce:whitespace-normal`, duplicate `motion-reduce:hidden`, `motion-reduce:[mask-image:none]`. The content fits, so `overflow-hidden` is no longer hiding anything. Running mode: nowrap + `shrink-0` are unchanged, so both copies keep the same width and the loop stays seamless. Test at `:116-129`. |
| MAJOR-3 Tab focus lands off-screen | **Closed for keyboard**, but the fix causes a new regression for mouse users (see the new MAJOR-1 below) | `group-focus-within/partners:animate-none` (variant: `.x:is(:where(.group\/partners):focus-within *)`, specificity 0,2,0) beats the base `animate-partners-marquee` (0,1,0) and sorts after it. `animation:none` drops the keyframe transform, so the strip goes to x=0 and the original link is in the first copy. Links past the viewport get scrolled into view by focus inside the `overflow-hidden` scroll container. The duplicate copy is still `inert`. |
| MINOR-4 media swap does not revalidate | Accepted residual (ISR 60s) | unchanged |
| MINOR-5 `select.sortOrder` | **Closed** | `home-queries.ts:127` is `select: { name, logo, website }`. Sorting by `sortOrder` happens in the database. |

## No regressions on round 1 pass items
- BR-07: `loadPartners` still goes through `findPublicList` (`home-queries.ts:121-130`).
- Safe links: `safeWebsite` → `isHttpUrl` (http/https only, `home-view-partners.ts:28-31`). `target="_blank" rel="noopener noreferrer"` (`PartnersMarquee.tsx:61`).
- Each partner is read once: the duplicate has `aria-hidden` + `inert`, logos are `decorative`. Test `:20-33`.
- Pause/Play button: `size-11` (44px), the label changes with state, `motion-reduce:hidden`, placed outside `group/partners`. Test `:59-71`.
- ≤ 4 partners: static centered row, no duplicate, no button. Exactly 5 runs. Tests `:104-134`.
- Seamless loop: `min-w-[100vw] shrink-0 justify-around`, no gap between copies, `w-max` track, `translateX(-50%)`. Unchanged.
- Hook: same conditions, and it runs safely outside Next (`revalidateWithNext` catches errors) (`revalidate-developer.ts:15-23`).

## Findings

### [MAJOR] 1. Mouse clicks on partner links in the running strip can fail (regression from the MAJOR-3 fix)
- `src/components/home/PartnersMarqueeShell.tsx:33`: `group-focus-within/partners:animate-none` also matches **mouse** focus. Chrome/Edge (and Firefox on Windows) focus an `<a href>` on **mousedown**. On mousedown, `:focus-within` matches, `animation: none` applies, and the strip snaps from `translateX(-x)` to 0, shifting all content right by x px. The user releases (mouseup) a few frames later, and by then a different item, or the `inert` duplicate copy, is under the cursor. `click` then fires on the common ancestor, not the link, so the partner page does not open. It only works when x happens to be very small.
- Even when the click does land, the strip visibly jumps under the cursor (the hover pause is bypassed). After the new tab opens, focus stays on the link, so the strip sits at 0 and does not run until the page loses focus.
- The task requirement is that a partner with `website` is a link. On desktop with a mouse, that is the main action, and this change breaks it.
- Suggested fix: reset the offset only for keyboard focus and keep a plain pause for mouse focus, for example:
  - `group-has-[:focus-visible]/partners:animate-none` (Tailwind v4: `group-has-[...]`) for keyboard, plus
  - `group-focus-within/partners:[animation-play-state:paused]` for mouse focus (it only pauses, with no transform jump).
  - Update the test at `PartnersMarquee.test.tsx:49-50` to assert the `focus-visible` variant and to confirm that `group-focus-within` no longer resets the strip.
- Not verified in a browser (no permission). The conclusion follows from the focus-on-mousedown behavior plus the click-target rule (common ancestor) in UI Events. Builder should confirm with a manual check: click a link mid-loop in Chrome.

### [MINOR] 2. A focused link scrolled to the edge can sit in the mask fade zone
- `PartnersMarqueeShell.tsx:28`: `mask-image` fades 6% at each edge. Focus scrolls with `inline: nearest`, so a link past the viewport lands right at the right edge, where the focus ring and name are partly faded (WCAG 2.4.11 Focus Not Obscured, partially). Suggestion: `group-has-[:focus-visible]/partners:[mask-image:none]`, or `scroll-padding-inline`/`scroll-margin` on the link of about 6vw.

### [MINOR] 3. `scrollLeft` keeps its value after keyboard focus leaves (round 1 residual still applies)
- After Tabbing to a far-right link, the overflow container has `scrollLeft > 0`. On blur the animation restarts from 0 and adds to that scroll offset, which can jump or briefly pin the strip near the end. Suggestion: reset `scrollLeft = 0` in the shell `onBlur` (focus leaving `group/partners`), or accept and record it as residual.

## Responsive Checklist Gate (diff touches UI; 375/390, 768, 1280/1440)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Static: wrapping `li`/name (math above, 390 → name about 194px and wraps). Reduced-motion: `w-full` + flex-wrap + `whitespace-normal`. Running: clipped by the `overflow-hidden` wrapper, which is the intended clip for the marquee. |
| Mobile-first, no fixed px container | OK | `max-w-container px-gutter`, `sm:px-8` (min-width). |
| Grid auto-fit/minmax | N/A | flex-wrap. |
| Font-size rem / fluid heading | OK | `text-base`; shared `SectionHeading`. |
| Media max-width / aspect-ratio | OK | fixed 96×48 frame, `fit="contain"`, `sizes="96px"`, lazy. |
| Touch target ≥ 44px | OK | button `size-11`. Links: 48px logo frame, name-only links are wide inline links (same as round 1). |
| Nav / table | N/A | |
| 100vh | OK | not used. |
| prefers-reduced-motion | OK | `motion-reduce:animate-none`, duplicate hidden, button hidden, mask off, names wrap. |
| Hiding bugs with overflow:hidden | OK | In reduced-motion the content fits (wraps), so nothing is cut off. |
| Seamless loop 5–6 items at 1440 | OK (CSS math) | structure unchanged from round 1. |

## Skill gates
- aislop: skip. Not in the reviewer's allowed verify commands, and `--changes` cannot isolate this task in a dirty working tree.
- oxlint (anti-slop): skip, oxlint not configured. eslint on the changed files PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK. Clear names, named constants, comments explain WHY (including the inline-duration reason at `PartnersMarqueeShell.tsx:31`), files ≤ 300 lines, functions ≤ 50 lines. Fewer than 3 indicators.
- ai-friendly-web: N/A (homepage block, does not touch robots/sitemap/llms).
- blitzstrike: skip (no pentest environment). href is validated statically as http(s).

## Residual risk
- No browser check at 390/768/1440 and no real mouse/keyboard interaction. All conclusions come from CSS math and the event model.
- MINOR-4 from round 1 (swapping a logo in `media` does not revalidate) is accepted under ISR 60s and should be recorded in Doc impact.

## Verdict: FAIL
All 3 round 1 MAJOR findings are closed. However, the MAJOR-3 fix (`group-focus-within/partners:animate-none`) introduces a new MAJOR: clicking a partner link with the mouse in the running strip snaps the strip on mousedown, so the click can miss the link. Return to builder. Keep the keyboard reset only for `:focus-visible` and use a plain pause for mouse focus, then update the test.
