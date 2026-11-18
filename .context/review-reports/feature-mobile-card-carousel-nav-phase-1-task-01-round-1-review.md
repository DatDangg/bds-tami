Agent: reviewer

# Review: feature-mobile-card-carousel-nav, phase-1-task-01, round 1 (BL-122)

- **Review level:** STRICT
- **Reason:** Shared UI component (`CardSlider`, `SliderArrow`/`ARROW_BUTTON` in `use-snap-slider.tsx`) with many consumers (ProjectsSlider, SimilarCarousel x3 pages, ProjectAmenities, RentalsTabs, plus OffersSlider/SpotlightSlider/ListingTabsScroller through `SliderArrow`).
- **Blast radius:** Home "Dự án nổi bật" and "Thuê nhà ở & kinh doanh"; detail-page "Dự án tương tự", "Căn tương tự" and "Tin liên quan" (`SimilarCarousel`); `ProjectAmenities` slider; every `SliderArrow` default consumer (OffersSlider, SpotlightSlider, ListingTabsScroller) through the `ARROW_BUTTON` refactor. i18n `page.home.rentals.dots/goTo` (vi/en). No API, schema or data changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm exec eslint <5 changed files>` | PASS (exit 0, no output) |
| `pnpm vitest run src/components/layout src/components/home src/components/detail src/components/posts src/components/projects src/components/rentals src/i18n` | PASS: 67 files, 625 tests |

## Requirements coverage
- Arrows at every breakpoint for `CardSlider` (`showOnMobile` opt-in, used only by `CardSlider`). The `SliderArrow` default keeps `hidden md:inline-flex`. `cn(ARROW_BUTTON, "hidden md:inline-flex", className)` produces the same token set and merge order as before, so OffersSlider, SpotlightSlider and ListingTabsScroller (which passes its own `ARROW_CLASS`) behave exactly as before. OK
- `sides` at md+: the arrows now sit inside the dots row with `md:absolute md:left-0/right-0 md:top-[calc(50%-2.125rem)]`. The row and its ancestors up to `region` (`relative`) have no positioning or transform, so the containing block is still `region` and the geometry matches the old version. Absolute children do not take part in flex gap, so the row keeps the same width and spacing. `md:bg-surface md:border-border md:shadow-md` reproduce the old style, and hover still wins (`:hover` has higher specificity). The 768 screenshot (`bl122-project-similar-768.png`) shows round arrows overlapping both edges and dots below. OK
- `below` at md+: `md:gap-4 md:px-gutter` and `md:w-11` dots reproduce the old values. OK
- Mobile: arrows `size-11` (44×44), dots `h-11 w-6` (24×44, meets WCAG 2.5.8). Screenshots at 375 for projects and rentals show `‹ dots ›`. OK
- Rentals: `CardSlider` with `slideClassName` set to the old `SLIDE_WIDTH` and `listClassName` equal to the old list classes (`-mx-2 gap-4 px-2 py-2 [scroll-padding-inline:0.5rem] lg:gap-6`). The base list classes (snap, overflow, smooth, scrollbar, motion-reduce) are unchanged, so the geometry is preserved. The intentional behaviour change (dots, 1-step wrap) is recorded in the task. At 1440 with 8 cards there are 5 dots (`pageCount` is measured), which matches the screenshot. OK
- `scrollByPage` is **not dead**: it is still used by `OffersSlider.tsx:18`. OK
- Tests are real regressions: the old `ARROW_BUTTON` contained `hidden` and the old dots were `size-11` (no `w-6`), so the new CardSlider BL-122 test would fail on HEAD. Old RentalsTabs had no "Chọn tin cho thuê" group and used `scrollBy` instead of `scrollIntoView`, so the RentalsTabs tests would fail on HEAD. The `sides` test was updated to match the new DOM. OK
- i18n: only `page.home.rentals.dots/goTo` were added in vi/en (the git diff for both files has exactly one hunk). OK

## Responsive Checklist Gate
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll 375/768/1280 | OK | CSS math: at 375 the Rentals content box is 343px and the row needs 296px (8 dots). Projects is capped at 6 (`FEATURED_PROJECTS_MAX`), so its row is 248px. The 320 edge case is in MINOR-1 (overflows into the gutter only, no document scroll). |
| Mobile-first media queries | OK | Base is mobile, `md:` overrides (`md:w-11`, `md:gap-4`, `md:absolute`). |
| Grid auto-fit / no fixed container px | N/A | Flex scroll-snap slider, unchanged. |
| Typography rem / clamp | N/A | No text styling changes. |
| Media srcset/aspect-ratio | N/A | Card internals untouched. |
| Touch target ≥44 / ≥24 | OK | Arrows 44×44; dots 24×44 below md, 44×44 at md+. |
| Nav / table | N/A | |
| 100vh / reduced-motion | OK | `motion-reduce:scroll-auto` kept on the list; the hook uses `behavior:"auto"` under reduced motion. |
| No overflow:hidden masking | OK | None added. |

Residual (no browser run by reviewer): verification relies on the builder's Playwright screenshots plus CSS math. I did not verify the `sides` variant at 1440 with more than 4 cards (the builder's data only had 4 or fewer, so pageCount was 1). That layout is visually equivalent at 768.

## Skill gates
- aislop: skip, `aislop` is not in the allowed verify commands. A manual slop scan found no generated filler, and the comments explain intent (WHY).
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint passes.
- ocr (open-code-review): skip, ocr not installed / not allowed.
- AI-readable: OK, 1 indicator (stale comments, MINOR-2), below the 3-indicator threshold. Functions are short; `CardSlider.tsx` and `use-snap-slider.tsx` are each under 300 lines.
- ai-friendly-web: N/A (UI component change, no crawl/meta change).
- blitzstrike: N/A (no auth, input or API surface).

## Findings
- **[MINOR-1]** `src/components/layout/CardSlider.tsx:91` (row comment "296px vừa 320") and the Rentals frame `RentalsTabs.tsx:57` (`px-gutter`). At 320px viewport, `--spacing-gutter` resolves to 16px, so the Rentals region is 288px wide. The 8-position row (44+8×24+44+2×8 = 296px) overflows its container by 8px: `justify-center`, 4px each side into the gutter. No document horizontal scroll and no clipping, but the comment's claim "fits 320" is about the viewport, not the container. Suggested fix: `gap-1` below md (row 288px), or correct the comment. Not blocking.
- **[MINOR-2]** Stale comments after the behaviour change. `src/components/detail/SimilarCarousel.tsx:22` ("mũi tên tròn hai mép (`arrows="sides"`, từ md; mobile vuốt)") and `src/components/projects/ProjectAmenities.tsx:39` ("mũi tên hai mép từ md, vuốt ở mobile") now contradict BL-122 (`‹ dots ›` row on mobile). Suggested fix: update the wording, comment-only.
- **[MINOR-3]** `CardSlider.tsx:46` `SIDE_ARROW_CLASS` contains `md:hover:bg-text`, which is redundant because base `hover:bg-text` already beats `md:bg-surface` on specificity. `CardSlider.tsx:102` has an unsorted class order (`w-6 cursor-pointer md:w-11 items-center`). Cosmetic only.
- **[MINOR-4]** `src/components/home/RentalsTabs.test.tsx:29` assigns `Element.prototype.scrollIntoView = vi.fn()` globally and never restores it. Vitest isolates per file, so impact is limited. Suggested fix: use `vi.spyOn` / restore in `afterEach`, or define it in setup.
- **[INFO]** Focus order for `sides` at md+ changed from list → prev → next → dots to list → prev → dots → next. This follows visual left-to-right order and is acceptable.
- **[INFO / out of scope, separate task suggested]** `ProjectAmenities` amenities have no `maxRows` (`src/collections/Projects.ts:90`). More than about 9 positions would overflow the mobile row (343px). This existed before the change and was worse then: about 6 positions at 44px with `px-gutter`. BL-122 increases the capacity.

## Verdict
**PASS**: no CRITICAL or MAJOR findings. Repro Verification status is PASS, with screenshot evidence plus regression tests that fail on HEAD. The 4 MINOR items are optional follow-ups.
