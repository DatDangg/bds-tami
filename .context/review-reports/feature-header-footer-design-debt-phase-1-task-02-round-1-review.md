Agent: reviewer

# Review — feature-header-footer-design-debt · phase-1-task-02 · round 1

- Task: `tasks/feature-header-footer-design-debt/phase-1-task-02.md`
- Spec: `.context/design-spec.md` §2.2 (L91-95), §2.4 (L106-108); change doc `spec/changes/2026-10-19-header-footer-design-debt.md`
- Diff reviewed (uncommitted, branch staging): `src/components/layout/Footer.tsx` (M), `src/components/layout/MobileMenu.tsx` (M), `src/components/layout/FooterLinkColumn.tsx` (new), `src/components/layout/Footer.test.tsx` (new), `src/components/layout/MobileMenu.test.tsx` (new). Ignored as out of scope: `.claude/**`, `.context/project-config.md`, `src/payload-types.ts`, `importMap.js`.

## Review level
**STRICT**

## Reason
Shared layout component rendered on every public page (footer + full-screen navigation menu), navigation and a11y (disclosure pattern, keyboard, focus management inside a Radix Dialog). No auth, schema or API changes.

## Blast radius
- Footer on every public page (VI/EN): column grid < md / ≥ md, contact column, no-JS/crawler access to footer links.
- Full-screen menu (`MobileMenu`, all breakpoints after task-01): nav items with children, Radix Dialog focus trap, Esc, scroll lock, close on link click.
- No change to view model (`shell-data`), i18n keys (reuses `layout.nav.openSubmenu`, already used by `DesktopNav.tsx:73`), data or API.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/components/layout` | PASS: 14 files, 92 tests |
| `pnpm test` | 2447 pass / 1 fail. The one failure is the known existing one (`src/endpoints/public/job-applications.test.ts` "vị trí hết hạn ... -> 400"), which is accepted. |
| `pnpm build` | Not re-run by reviewer (optional per brief; builder reports PASS). Recorded as residual risk. |

## Spec / requirement coverage
| Requirement | Evidence | Result |
|---|---|---|
| Footer < md: each link column is an accordion, closed by default, `h2 > button`, `aria-expanded`, `aria-controls` points to an existing id, ≥ 44px, caret `aria-hidden` | `FooterLinkColumn.tsx:25-41` (`useId` per column, so ids are unique across columns; `min-h-11 w-full`; `CaretDown aria-hidden`) + `Footer.test.tsx:35-60` | OK |
| Links are always in the server HTML; when closed < md they cannot be focused | The `ul` is always rendered. When closed it is hidden with `max-md:hidden`, which gives `display:none` and takes it out of the tab order and the AT tree. The `hidden` attribute is not used, so there is no clash with Tailwind v4 `[hidden]{display:none!important}` at ≥ md (`FooterLinkColumn.tsx:41`). | OK |
| Contact column always open | `Footer.tsx:77-78`: plain h2 with `min-h-11` < md for alignment and `md:min-h-0`. Covered by test `Footer.test.tsx:73-79`. | OK |
| ≥ md: grid, every link visible, title is not a button | After hydration `isMd=true`, so the title is text and the class has no `max-md:hidden` (`Footer.test.tsx:85-91`). The grid is `md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]` (spec 160px). Before hydration and without JS, the title is still a button (see MINOR-1). | OK (with MINOR) |
| Hydration mismatch | `useMediaQuery` uses `useSyncExternalStore` with `getServerSnapshot = false` (`use-environment.ts:20`). React hydrates with the server snapshot and then re-renders, so there is no mismatch warning. | OK |
| Menu: parent link still navigates, separate caret button ≥ 44px, `aria-expanded`/`aria-controls`/`aria-label` i18n | `MobileMenu.tsx:97-114` + `MobileMenu.test.tsx:39-49` | OK |
| Submenu closed by default, `inert` + `aria-hidden` when closed | `MobileMenu.tsx:117-121`. React 19 (`package.json:60`) supports boolean `inert`. State resets each time the dialog reopens because the content unmounts. | OK |
| Transition `grid-rows 0fr→1fr`, `duration-(--duration-base)`, `motion-reduce:transition-none` | `MobileMenu.tsx:122-125`. `ul overflow-hidden` with bottom padding on `li:last` avoids leaking padding at 0fr. A global reduced-motion reset also exists (`globals.css:265`). | OK |
| Enter / Space / Tab | Native `button`. Tests `MobileMenu.test.tsx:51-80` and `Footer.test.tsx:62-71` | OK |
| Child link closes the menu | `onNavigate={close}` on parent and child links (`MobileMenu.tsx:96,131`) + test `MobileMenu.test.tsx:82-89` | OK |
| No regression to Radix Dialog / task-01 CTA/logo | Only the `<li>` rendering changed (`MobileMenu.tsx:66-68`). Dialog root, Content, Close, CTA, logo and `MenuContact` are unchanged in the diff. | OK |
| Focus-visible on new buttons | Global `:focus-visible` outline in `globals.css:258-261` | OK |
| File ≤ 300 lines / function ≤ 50 lines | Footer 123, MobileMenu 161, FooterLinkColumn 50. `MenuItem` is about 48 lines, `FooterLinkColumn` about 33 lines. | OK |

## Responsive Checklist Gate (375 / 768 / 1280; no browser available to reviewer, checked by CSS math + builder's browser evidence)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Footer grid < md is `grid-cols-1`. Footer button is `w-full`. Menu row is `flex` with `min-w-0 flex-1` on the link and `shrink-0` on the caret. Builder measured scrollWidth 375 at 375px. |
| Mobile-first / min-width queries | OK | Base classes are mobile; `md:` uses min-width. `max-md:hidden` applies only to the closed state < md. |
| Grid auto-fit/minmax, no fixed columns | OK | `md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]` (spec 160px). The `sm:grid-cols-2` was removed so < md is a 1-column accordion, which matches §2.4. |
| Container not fixed px | OK | No px widths added |
| Font size in rem / fluid heading | OK | Tokens `text-eyebrow`, `text-h2`, `text-body`, `text-small` (existing scale) |
| Spacing on scale | OK | `gap-4`, `md:gap-8`, `md:gap-3`, `pl-4`, `pb-3` |
| Media | N/A | No images or embeds added |
| Touch targets ≥ 44×44 | OK | Footer button `min-h-11 w-full`. Caret `min-h-11 min-w-11`. Links `min-h-11`. Builder measured 44×343 and 44×44. |
| Nav on mobile does not overflow | OK | Full-screen dialog unchanged. Submenu indented `pl-4`. |
| Table scroll wrapper | N/A | No tables |
| 100vh | N/A | Not used in diff |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` on submenu and menu caret. Footer caret is covered by the global reset `globals.css:265-271`. |
| Not hiding errors with overflow:hidden | OK | `overflow-hidden` is only on the submenu `ul` as the grid-rows collapse mechanism, which is intended. |

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: `aislop` not installed |
| oxlint (anti-slop) | skip: oxlint not configured (no `.oxlintrc.json` / `oxlint.json`). ESLint + tsc PASS. |
| ocr (open-code-review) | skip: `ocr` not installed |
| AI-readable | OK: clear names (`FooterLinkColumn`, `MenuItem`, `submenuId`, `listId`). One magic value, `MD_QUERY` 768px, is named and matches the Tailwind `md` breakpoint. Comments explain WHY (the `hidden` conflict, inert/aria-hidden, behaviour before hydration). Indirection ≤ 2. 0 indicators. |
| impeccable / frontend-checklist | OK: disclosure pattern is correct, aria-hidden caret, states covered, tokens used, focus ring inherited |
| ai-friendly-web | N/A: no change to robots/sitemap/llms. Footer links stay in SSR HTML for crawlers. |
| blitzstrike | N/A: no auth, input or API surface |

## Findings

### CRITICAL
None.

### MAJOR
None.

### MINOR
1. **[MINOR] ≥ md before hydration / without JS the column title renders as a disabled-looking accordion button.**
   - Where: `src/components/layout/FooterLinkColumn.tsx:19,26-39`.
   - What happens: because `getServerSnapshot=false`, desktop SSR HTML shows `button` + caret with `min-h-11` (44px) and `aria-expanded="false"` while the list is visible.
   - After hydration: it switches to plain text, so each link-column header shrinks by about 24px. This causes a small layout shift of the footer bottom row. It only counts toward CLS when the footer is in the viewport at load, for example on short pages, and the estimated impact is below 0.01.
   - Without JS on desktop: the button is focusable, does nothing, and reports collapsed while its content is shown.
   - Spec §2.4 accepts JS dependence < md and only requires links reachable ≥ md without JS (met), so this is not blocking.
   - Suggested fix (CSS-only, removes `useMediaQuery` and the post-hydration swap): render both inside the `h2`, `<button className="md:hidden …">` and `<span className="max-md:hidden">{title}</span>`. Keep `max-md:hidden` on the `ul` keyed only on `!open`.
2. **[MINOR] No test for the server / pre-hydration render.**
   - Where: `src/components/layout/Footer.test.tsx`.
   - Gap: nothing asserts that SSR HTML (`renderToString`) contains every footer link (the crawler guarantee). The current tests only cover client snapshots.
   - Suggested fix: add one `renderToString` assertion that every `href` is present.
3. **[MINOR] Task file still has `Doc impact / Reconcile` = "(close-out điền)".**
   - Expected at close-out: `no doc impact`, or a note in `docs/DESIGN.md`/ARCHITECTURE for the footer accordion pattern if the as-built layout doc describes the footer.

## Residual risk
- `pnpm build` was not re-run by the reviewer (builder reports PASS; lint and typecheck PASS).
- Responsive and visual behaviour (grid-rows transition, 768/1280 layout, CLS magnitude) was not observed in a real browser by the reviewer. It was checked by CSS math, and builder browser evidence is in the task file (Verification summary).
- The parent submenu does not auto-expand when the current route is a child route. Not required by spec; noted only.

## Verdict
**PASS**: 0 CRITICAL, 0 MAJOR, 3 MINOR (non-blocking).
