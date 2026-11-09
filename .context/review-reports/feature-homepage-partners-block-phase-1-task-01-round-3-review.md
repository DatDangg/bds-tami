Agent: reviewer

# Review: feature-homepage-partners-block, phase-1-task-01, round 3 (BL-107, FR-PUB-17, attempt 4)

- Review level: **STRICT**
- Reason: Same as rounds 1 and 2. The task touches the revalidate hook on `developers` (homepage cache/ISR), the shared homepage view model and `HomeDocs` contract, a public query, and the a11y of auto-moving content (WCAG 2.2.2 / 2.4.7 / 2.4.11). This round only changes the interaction layer (`PartnersMarqueeShell.tsx`) and its test.
- Blast radius: the homepage at `/vi` and `/en`, specifically the Partners block. Attempt 4 changes only the client shell: the classes on the running strip, the mask on the wrapper, and an `onBlur` on the wrapper. Data, query, hook, and i18n are unchanged since round 2.
- Scope: attempt 4 diff (`PartnersMarqueeShell.tsx`, `PartnersMarquee.test.tsx`), plus a regression pass over the full task diff. Other dirty files in the working tree are out of scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx eslint` on PartnersMarquee.tsx, PartnersMarqueeShell.tsx, PartnersMarquee.test.tsx, home-view-partners.ts, home-view.ts, home-queries.ts, load-home.ts, HomeBlocks.tsx, hooks/developers, Developers.ts | PASS (exit 0, no output) |
| `pnpm vitest run src/lib/home src/components/home src/i18n src/hooks src/collections` | PASS: 53 files, 459 tests |
| Browser 390/768/1440 with real mouse and keyboard | Not run. Reviewer permissions do not include a dev server. Conclusions below come from CSS selectors/specificity and the browser focus model (see Residual risk). |

## Round 2 findings: closure status
| Round 2 | Status | Evidence |
|---|---|---|
| MAJOR-1: mouse focus resets the strip, so clicks miss the link | **Closed** | `PartnersMarqueeShell.tsx:43`: `group-focus-within/partners:animate-none` is gone. In its place: (a) `group-focus-within/partners:[animation-play-state:paused]`, which only pauses with no transform jump, and (b) `group-has-[:focus-visible]/partners:animate-none`. Tailwind 4.3 (`package.json:76`) generates `.x:is(:where(.group\/partners):has(:focus-visible) *)` for (b), specificity 0,2,0, so it beats the base `animate-partners-marquee` (0,1,0). On a mouse click, `:focus-visible` does not match a link in Chrome/Edge or Firefox (the heuristic only matches after keyboard input or on text inputs). Safari on macOS does not focus links on click at all. So mousedown only matches `:focus-within`, the strip pauses at its current offset, and the click lands on the link the user aimed at. Hover had already paused it, so nothing visibly changes. |
| Conflict between `animate-none` and `paused` | No conflict | `animate-none` sets `animation: none`, which makes `animation-name: none`. Whichever wins `animation-play-state` (same specificity; `has` sorts after `focus-within` in v4 variant order), the animation is gone, so x=0 for keyboard focus. The inline `animationDuration` has no effect when the name is `none`. |
| Switching from keyboard focus to a mouse click on another link | OK | `:focus-visible` stops matching, the animation restarts at t=0 (translateX(0), the same position as `none`) and stays paused by focus-within and hover. No jump. `onBlur` sees `relatedTarget` inside the wrapper, so it does not reset the scroll. |
| MINOR-2: focus sits in the mask fade zone | **Closed** | `:37`: `has-[:focus-visible]:[mask-image:none]` on the `group/partners` wrapper turns the mask off only while keyboard focus is inside. It sorts after the arbitrary base `[mask-image:…]` and has higher specificity (0,2,0 vs 0,1,0). Mouse focus keeps the mask, which is fine because the mouse user can already see the target. |
| MINOR-3: `scrollLeft` stays offset after Tab | **Closed (one small edge case, see MINOR-1 below)** | `:15-18` and `:36`: React `onBlur` maps to `focusout` (it bubbles). If `relatedTarget` is outside the wrapper, or null, it sets `scrollLeft = 0` on the overflow container. Reading `contains(null)` returns false, which is safe. Assigning `scrollLeft` on an `overflow:hidden` element is valid. |
| Test | OK | `PartnersMarquee.test.tsx:49-53` asserts the focus-visible variant, the plain pause on focus-within, `not.toContain("group-focus-within/partners:animate-none")`, and the mask-off class. jsdom cannot assert real CSS behavior, so this is a class-contract test. That is acceptable at the component level. |

## Regression check against round 1 and round 2 pass items
- BR-07 `findPublicList`, the `select` with `{name, logo, website}`, and `safeWebsite` (http/https only): files unchanged since round 2. The test suite passes.
- Link `target="_blank" rel="noopener noreferrer"` and `LINK_FOCUS` focus-visible outline: `PartnersMarquee.tsx:20,61`, unchanged.
- Duplicate copy `aria-hidden` + `inert` (`PartnersMarquee.tsx:49`), each partner read once, no extra Tab stop (`[tabindex]` null): test `:20-33,54`.
- Pause/Play button: `size-11`, outside `group/partners`, `motion-reduce:hidden`, label changes with state: unchanged.
- Inline duration (24s minimum, scales with count), ≤ 4 static items, exactly 5 runs, long names wrap in static and reduced-motion: tests `:75-81,106-136` pass.
- Reduced-motion: `motion-reduce:animate-none` (media variant, sorted last) and `motion-reduce:[mask-image:none]` are unchanged.

## Findings

### [MINOR] 1. `onBlur` also resets scroll when the window loses focus (relatedTarget null)
- `src/components/home/PartnersMarqueeShell.tsx:16-17`: When a user Tabs to a link far right (scrollLeft > 0) and presses Enter, the link opens a new tab. The window blurs, and `focusout` fires with `relatedTarget = null`, so `scrollLeft = 0` runs. `document.activeElement` is still that link, though. When the user returns, the focused link may sit outside the visible frame (partly against WCAG 2.4.11) until the next Tab press. The impact is small: it is a short-lived state, the next keypress fixes it, and clicks are unaffected.
- Suggested fix: `if (event.currentTarget.contains(event.relatedTarget) || !document.hasFocus()) return;`. Alternatively, record it as accepted residual.

### [MINOR] 2. After a mouse click opens a partner page, the strip stays paused until focus moves
- `:43` `group-focus-within/partners:[animation-play-state:paused]`: Focus stays on the clicked link, so the strip stays paused even after the mouse leaves. This is safe for a11y and causes no jump. The UX cost is small and it is the behavior round 2 suggested. Note only, no change required.

No CRITICAL or MAJOR findings.

## Responsive Checklist Gate (diff touches UI; 375/390, 768, 1280/1440)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Attempt 4 does not change layout classes. Static and reduced-motion wrap (round 2 math: name about 194px at 390). Running mode is clipped by the `overflow-hidden` wrapper, which is the intended marquee clip. |
| Mobile-first, no fixed px container | OK | `max-w-container px-gutter`, unchanged. |
| Grid auto-fit/minmax | N/A | Uses flex-wrap. |
| Font-size rem / fluid heading | OK | Unchanged. Shared `SectionHeading`. |
| Media max-width / aspect-ratio | OK | Fixed 96×48 frame, `fit="contain"`, `sizes="96px"`, lazy. Unchanged. |
| Touch target ≥ 44px | OK | Button `size-11`. Links unchanged. |
| Nav / table | N/A | |
| 100vh | OK | Not used. |
| prefers-reduced-motion | OK | `motion-reduce:animate-none`, duplicate hidden, button hidden, mask off. |
| Hiding bugs with overflow:hidden | OK | Reduced-motion and static content wraps. Keyboard focus resets x to 0 and the link scrolls into view. Mask is off while keyboard focus is inside. |

## Skill gates
- aislop: skip. Not in the reviewer's allowed verify commands, and `--changes` cannot isolate this task in a dirty working tree.
- oxlint (anti-slop): skip, oxlint not configured. eslint on the changed files PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK. The helper `resetScrollWhenFocusLeaves` has a clear name and is ≤ 50 lines. Comments explain WHY (keyboard vs mouse, why inline duration). The file is 50 lines. Indicator count is 0. Small style point: two JSDoc blocks sit back to back (`:7-13` describes the component but sits above the helper). This does not count as an indicator.
- ai-friendly-web: N/A (homepage block, does not touch robots/sitemap/llms).
- blitzstrike: skip (no pentest environment). href is validated statically as http/https only.

## Residual risk
- No real browser check at 390/768/1440 and no real mouse/keyboard interaction. The `:focus-visible` behavior on mouse clicks (Chrome/Firefox/Safari) and the generated `group-has-[…]` selector come from the spec and Tailwind v4 behavior, not from inspecting the built CSS. Builder or QA should confirm by hand: in Chrome, click a link mid-loop and check that the new tab opens and the strip does not jump. Then Tab through the strip and check that it sits at 0, the mask is off, and the focus ring is visible.
- MINOR-4 from round 1 (swapping a logo in `media` does not revalidate) is still accepted under ISR 60s. Record it in Doc impact.
- MINOR-1 above (scroll reset when the window blurs).

## Verdict: PASS
The round 2 MAJOR is closed: keyboard focus resets the strip only on `:focus-visible`, and mouse focus only pauses it, so clicks no longer miss. Round 2 MINOR-2 and MINOR-3 are closed. Verify commands pass (typecheck, eslint, 459 tests), and there are no regressions on earlier pass items. Two non-blocking MINOR findings remain.
