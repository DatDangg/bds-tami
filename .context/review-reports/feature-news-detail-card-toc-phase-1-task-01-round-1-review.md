Agent: reviewer

# Review — feature-news-detail-card-toc · phase-1-task-01 · round 1 (BL-033)

- Review level: **NORMAL**
- Reason: changes to shared components (`RichText`, `DetailLayout`, `section-headings`) are opt-in via new props (`headingIds`, `leading`, `collectTocHeadings`). No auth, schema, API, SEO or data change. `DetailSubNav` is not touched.
- Blast radius: `/tin-tuc/[slug]` + `/en/news/[slug]`. Indirectly every page that uses `RichText` (projects, services, posts, careers, legal `muc-N`) and `DetailLayout` (project, rental and post detail pages). Both stay unchanged when the new props are absent, and tests cover that.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm test src/components/news src/components/content/RichText src/components/detail src/lib/content/section-headings` | PASS: 8 files / 80 tests (includes DetailSubNav and DetailAsideFit, unchanged) |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside scope) |

## Focus checks
1. **Output unchanged when the feature is off.** `RichText` only builds the `toc` context when `headingIds` is passed. The `anchorSections`/`muc-N` branch is unchanged (test `muc-1, muc-2`), and the off-mode test confirms no `[id]`/`[tabindex]` is added. `DetailLayout` without `leading` uses `GRID_WITH_ASIDE`, which is identical to the old class string (exact-string test), and the card is still the first child. OK.
2. **Ids are unique, stable and in the same order in both places.** `collectTocHeadings` and `RichText` share the `isTocHeading` predicate and both look only at root-level headings (`asNodes(root.children)` vs `depth === 0`). Empty headings are skipped on both sides. h4–h6 map to level 3. Nested headings (inside a list) are ignored on both sides. Dedupe uses `appendUniqueSuffix` with a `taken` set and `reservedIds`. If the id list is shorter than the heading count, the extra headings get no id (tested). OK. There is one gap with ids elsewhere on the page; see MINOR-1.
3. **Scroll-spy.** rAF throttling uses a `frame` guard, and cleanup removes both scroll and resize listeners and cancels the pending frame. `ACTIVE_LINE_PX=48` is above `scroll-mt` (24/32px), so a heading reached by clicking counts as active. The scroll lock lasts 1s and has a test. Centering in the nav uses `link.offsetTop`; the nav is `sticky`, so it is the link's offsetParent. Reduced motion switches to `behavior:auto` (tested). Focus moves to the heading (`tabIndex=-1`, `preventScroll`). `<details>` sets `open=false` before `scrollIntoView`, so the layout is collapsed before the scroll position is measured. OK.
4. **A11y.** The two `nav` elements share a label but never show at the same time: the sidebar wrapper is `hidden lg:block`, and the disclosure is `lg:hidden` with its nav inside a closed `<details>`. Links use `aria-current="location"` and `min-h-11` (44px). `print:hidden` is on both. OK.
5. **SEO.** `generateMetadata`, `loadArticle` and the JsonLd data are unchanged. `<article>` still wraps `DetailLayout` + JsonLd. OK.
6. **i18n.** `page.news.tocTitle` is present in both `vi` ("Mục lục") and `en` ("Contents"). `/en` uses the same code. OK.
7. **Tests are meaningful.** They cover the active rule (before the first heading, between headings, after the last heading), the click lock, reduced motion, nav-only scrolling (no page `scrollTo`), cleanup, disclosure collapse, slug without diacritics, dedupe/reserved ids/`muc-N`, the 60-char limit and malformed data. OK.

## Responsive Checklist Gate (diff touches UI; checked with CSS math, no browser)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375/768 | OK | `lg:grid` does not apply below lg. The `leading` wrapper is `hidden`, the card is `min-w-0` with `p-5`/`md:p-8`, and RichText keeps `break-words [overflow-wrap:anywhere]` |
| Grid at 1280 | OK | `xl:grid-cols-[16rem_minmax(0,1fr)]`, gap 2.5rem. Content column ≈ 880px, which matches `sizes` |
| Mobile-first / min-width | OK | Only `lg:`/`xl:`/`md:` prefixes are used |
| Typography rem/token | OK | Uses tokens `text-h2`/`text-small` |
| Media | OK | `ResponsiveImage` 16:9, `overflow-hidden rounded-[20px]`, `sizes` follows the card column |
| Touch ≥44px | OK | Links and `summary` use `min-h-11` |
| Mobile nav/TOC does not overflow | OK | `<details>` is closed by default below lg |
| Viewport units | OK | `max-h-[calc(100dvh-...)]` (dvh) |
| prefers-reduced-motion | OK | Scroll uses `auto` under reduced motion. Only a short `transition-colors` remains |
| overflow:hidden hiding defects | OK | Only on the cover image wrapper (needed for the radius) |
| Sticky works | OK | The grid item stretches to the row height (default align stretch), so the nav can stay sticky inside it |

Residual: not checked in a real browser (needs CMS data). The UI should be looked at on `/tin-tuc/<slug>` at 375/768/1280.

## Skill gates
- aislop: skip (not in the allowed verify commands)
- oxlint (anti-slop): skip, oxlint not configured. ESLint and tsc are clean.
- ocr: skip, ocr not installed
- AI-readable: OK. Files: NewsToc 155 lines, page 187, RichText 265. Every function is ≤50 lines and constants are named. Comments explain why, not what. 0 indicators.
- ai-friendly-web: N/A. No change to robots, sitemap or llms.
- blitzstrike: N/A (not STRICT; no auth or input changes)

## Findings
- **[MINOR-1]** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:101`: `reservedIds` only lists `related-news`. Other ids exist on the page or in the shell, e.g. `main` (`src/components/layout/PublicShell.tsx:25`, the skip-link target), `floating-contact-actions` and `cta-scrim`. An English heading "Main" would get the slug `main`. That creates a duplicate id, and the TOC click would `getElementById` the `<main>` element instead of the heading. Probability is low. Fix: add `main` and the global shell ids to `reservedIds`, or give TOC ids a namespace.
- **[MINOR-2]** `src/components/news/NewsToc.tsx:117`: the `setTimeout` lock is not stored. Clicking twice within 1s lets the first timer unlock early, and the timer is not cleared on unmount. Impact is small (the active item may jump briefly). Fix: keep the timer in a ref and clear it before setting a new one and on cleanup.
- **[MINOR-3]** `src/components/news/NewsToc.tsx:14`: links have no `break-words`. A long unbroken heading (URL or code) would make the 15rem nav scroll horizontally inside the box (the page itself does not overflow). Fix: add `[overflow-wrap:anywhere]` to `LINK_BASE`.

No CRITICAL or MAJOR findings.

## Verdict
✅ **PASS**
