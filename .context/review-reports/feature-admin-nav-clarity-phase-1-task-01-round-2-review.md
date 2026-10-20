Agent: reviewer

# Review — feature-admin-nav-clarity · phase-1-task-01 · round 2 (BL-041)

- Scope: uncommitted working-tree diff vs HEAD c19b459, plus the untracked `NavAdvancedCollapse*.tsx`, `SiteLink*.tsx` and `src/collections/admin-hidden.test.ts`. I ignored the T02 sentence and the bookkeeping files.
- **Review level: STRICT**
- **Reason:** the change touches navigation shared by every admin screen. It also changes `admin.hidden` on two collections, which affects route visibility. Round 1 failed on the responsive gate.
- **Blast radius:** same as round 1:
  - the sidebar and header on every admin view
  - the Lead join field "Lịch sử chăm sóc" and its drawers
  - the CV upload field and the "Tải CV" button
  - the dashboard nav-group cards
  - the `nav` preference
  - No schema, migration, access or API changes. `git diff --stat src` shows 8 files, all inside T01 scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin src/lib/admin src/collections` | PASS: 257 tests (round 1 had 256, plus the new `admin-hidden.test.ts`) |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this task) |

## Round 1 findings — closure

### M1 active bar clipped at ≤1024px: FIXED
`_surfaces.scss:131` now reads `inset-inline-start: calc(-1 * var(--nav-padding-inline-start, 20px) - #{$group-indent})`, where `$group-indent` = 10 + 6 + 1 = 17px. The same SCSS variables also set `.nav-group__content` margin, padding and border (l.89-93), so the two values cannot drift apart.

Payload CSS (`@payloadcms/next/dist/prod/styles.css`):
- `.nav` sets `--nav-padding-inline-start: var(--base)`.
- `.nav__scroll` uses that variable as its padding-left.
- `@media(max-width:1024px)` changes it on `.nav__scroll` to `calc(var(--base)*.5)`.
- `@media(max-width:768px)` changes it on `.nav__scroll` to `var(--gutter-h)`, which is 16px.

The indicator is a descendant of `.nav__scroll`, so it always reads the value in effect at that breakpoint. Its containing block is `.nav__link` (`position:relative`), whose left edge sits at scroll padding + 17px. So the bar's x position is P + 17 − P − 17 = **0** at >1024, at ≤1024 and at ≤768. That is the inner edge of the scroll container's padding box, so it is visible at 375, 768, 1024 and 1280.

`AnimateHeight` wraps `.nav-group__content` and sets `overflow:hidden` only while animating (200ms) or when closed. When the group is open and static, overflow is `''`, so the bar is not clipped. A brief clip during the toggle animation is acceptable. The comment on l.128-129 is updated.

### M2 toggle touch target 36px: FIXED
Inside `@media (max-width: 767px)` the rule `.nav-group__toggle { min-height: 44px; align-items: center; }` was added at l.270-273. Payload's toggle is `display:flex`, so `align-items` takes effect. Height is now max(36, 44) = 44px.

### m1 divider contrast: FIXED
The divider (l.65) and the indent rail (l.92) now use `--admin-border-strong`. Contrast against the nav background, computed with relative luminance:

| Mode | Colours | Contrast |
|---|---|---|
| Light | #8f8984 on #fbfbfa | about **3.3:1** |
| Dark | #6e6862 on #161514 | about **3.3:1** |

Both are ≥ 3:1, which meets D4.

### m2 NavAdvancedCollapse pin/race: FIXED
- **Pin:** a comment at l.18-19 records the dependency on Payload 3.91's DOM and its fail-safe consequence.
- **Race:** `collapseIfStillDefault` calls `getPreference` again before clicking. Payload's `preferencesRef` is updated on `setPreference` (`Preferences/index.js:109-113`, after an await on the cached `getPreference`). The function also checks `isConnected` and that `nav-group__toggle--open` is still present. So a group the user has just opened or closed is not touched.

### m3 comment name: FIXED
`admin-groups.ts` now says `NavAdvancedCollapse` (l.10 and l.20).

### Test gap from round 1: FIXED
`admin-hidden.test.ts` pins `hidden === true` for both collections.

## Regression check
- `.nav-group__toggle` gained `width:100%`, `border-radius` and a hover background. It keeps Payload's flex layout, and the `:focus-visible` ring was added in `_controls.scss`.
- `.nav__link:focus-visible` uses an inset outline (offset −2px), so it is not clipped by `.nav{overflow:hidden}`.
- Indent: 17px plus the link's 10px padding at a 375px nav width leaves room. `admin-mobile-overflow.test` PASS.
- SiteLink, importMap and `payload.config` are unchanged since round 1 apart from the review fixes. No new deps, no schema changes.

## Responsive Checklist Gate (breakpoints 375 / 768 / 1024 / 1280; no browser, checked with CSS math)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Indent of 17px is inside the nav. `.tami-admin-site-link` shows only an icon at <768px. `admin-mobile-overflow.test` PASS. |
| Mobile-first / min-width | N/A (project convention) | The admin SCSS uses `max-width: 767px` throughout and follows Payload's breakpoints. This predates the task. |
| Grid / fixed containers | N/A | No grid in this diff. |
| Typography rem / clamp | N/A (project convention) | The admin uses px like Payload. Not introduced by this task. |
| Media | N/A | Only one inline 16px icon (aria-hidden). |
| Touch target ≥ 44px | OK | Toggle, `.nav__link` and SiteLink are 44px at ≤767px (M2 fixed). |
| Nav on mobile | OK | Payload's hamburger nav is unchanged. |
| Active state visible at every width | OK | Bar x = 0 at every breakpoint (M1 math above). |
| 100vh / reduced-motion / overflow hiding | N/A | The diff adds no animation or viewport height. |

## Skill gates
- **aislop:** skip. The command is not in the reviewer allowlist or in `project-config`.
- **oxlint (anti-slop):** skip, oxlint not configured. eslint has 0 errors and typecheck PASS.
- **ocr:** skip, ocr not installed or allowed.
- **AI-readable:** OK, 0 indicators. The SCSS indent values are named variables, not magic numbers. The comment name is fixed. Functions are under 50 lines and files are under 300. ARCHITECTURE.md was updated in round 1.
- **ai-friendly-web:** N/A. This is the internal admin.
- **blitzstrike:** skip. No pentest environment, and the change adds no new input surface.

## Findings
- **CRITICAL:** none.
- **MAJOR:** none.
- **[MINOR] n1:** at exactly 768px wide, Payload is already in its ≤768 nav layout, but the project's touch-target override starts at ≤767px, so the toggle is 36px at that width. This follows the existing project convention (`.nav__link` uses the same 767 breakpoint), and 768 is a tablet width. Optional fix: move the toggle rule into a `max-width: 768px` block. Not a blocker.
- **[MINOR] n2:** no unit test covers the re-check path in `collapseIfStillDefault`, i.e. the case where the preference is set or the toggle is already collapsed by the time the callback runs. Optional: add a test where the second `getPreference` call returns a defined group, and assert that no click happens.

## Residual risk
- The join drawers in the Lead form after `hidden: true` are verified at code level only (round 1, D1). They should be clicked through once in a running admin.
- Actual visual rendering of the bar, divider and toggle at 375 and 1440, in light and dark mode, still needs a human look.
- The "Nâng cao" group may show open for a moment before collapsing on the first visit (already known).

## Verdict: PASS
Round 1's M1 and M2 are fixed and the math checks out at every breakpoint. m1, m2, m3 and the test gap are also closed. Tests, typecheck and lint all pass. Only two optional MINOR items remain.
