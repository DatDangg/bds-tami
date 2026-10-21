Agent: reviewer

# Review: feature-listing-detail-redesign, phase-1-task-03, round 1 (BL-052)

- Worktree: `D:\prj\bds\.claude\worktrees\agent-aaa983d02f24e311e` (branch `worktree-agent-aaa983d02f24e311e`, base `c26d69e`, not committed yet)
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-03.md`
- Design: `docs/specs/listing-detail-redesign/detail-du-an.webp`

## Review level: STRICT
**Reason:** This adds shared components used on three detail pages (Project, Rental, Property listing). It also changes two shared components: `DetailSection`, which has more than 10 callers across projects, rentals and posts, and `CardSlider`, which is used on the home page, SimilarProjects, SimilarRentals and RelatedPosts. Other risks: LCP, a11y (Dialog/Lightbox focus), and i18n.

## Blast radius
- New files in `src/components/detail/*`: DetailHeroMosaic, DetailSpecBar, DetailInfoGrid, DetailStatCards, DetailGalleryGrid, DetailContactAside, DetailFeatureList, DetailDistanceList, DetailExpandButton, SimilarCarousel, DetailPageShell, plus 5 test files. None of these is mounted on a real page yet; P1-T06, P2-T03 and P3-T04 will assemble them.
- Changes to existing files:
  - `DetailSection.tsx`: new optional `description` prop. When it is not passed, the class string is the same as before: `font-display mb-5 text-h3` or `font-display mb-8 text-h2`.
  - `CardSlider.tsx`: new optional `arrows` prop. The default `below` produces the same DOM as before. Callers that pass no prop: home ProjectsSlider, SimilarProjects, SimilarRentals, RelatedPosts.
- i18n: new namespace `detailKit` added at the end of `vi.json` and `en.json`. The task file said namespace `detail`; the builder recorded the change in the task file, and there is no conflict.
- `CardSlider` lives in `src/components/layout`, which is outside the blast radius declared in the task. The builder recorded this, and the file does not belong to P1-T01 or P1-T02. Accepted.
- No DB, API, auth or migration changes.

## Verify commands + result (run in the worktree, DB `tami_wt52_p1t03`)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` |
| `pnpm exec vitest run src/components/detail src/components/layout src/components/home` | PASS: 43 files, 318 tests |
| `pnpm exec vitest run src/components/projects src/components/rentals src/components/posts` (callers of `DetailSection` and `CardSlider`) | PASS: 14 files, 208 tests |
| `pnpm exec vitest run no-raw-colors` | PASS: 21/21 |
| `pnpm test` (full suite) | Not re-run by the reviewer. The builder reports 3644 tests PASS; 2 integration files failed because of the environment and passed when run alone. Residual risk is low because the diff is presentational only. |

## Old behaviour unchanged (STRICT focus)
- `DetailLayout`, `DetailSubNav`, `DetailGalleryHero`, `DetailTitleCard`: not modified (git status). Their old tests PASS.
- `DetailSection`: without `description` the DOM is identical. The `cn(...)` call gives the same class order as before. Tests for ProjectOverview, Location, Amenities, Faq, RentalTerms and similar files PASS.
- `CardSlider`: the default `arrows="below"` renders previous arrow, dots, next arrow as before. The new test checks that in default mode the previous arrow sits next to the dots group. `sides` mode adds `relative` to the region and two `absolute` arrows. These take `hidden md:inline-flex` from `ARROW_BUTTON` (`use-snap-slider.tsx:107`), so they are hidden below md. The `top-[calc(50%-2.125rem)]` offset matches the dots row (44px) plus `mt-6` (24px) = 68px, half of which is 34px = 2.125rem. The arrows only render when `pageCount > 1`, which is also when the dots row exists, so the math holds.

## Requirement checks
| Requirement | Result | Evidence |
|---|---|---|
| LCP: image 1 has `priority`, `sizes` is correct, no CLS | OK | `DetailHeroMosaic.tsx`: cover uses `sizes="100vw" priority`. `ResponsiveImage` sets `fill` plus `preload` and `fetchPriority=high`. The frame has `min-h-[520px]` / `md:min-h-[min(78vh,600px)]` and the image is absolute, so it causes no layout shift. Thumbnails are lazy, with `sizes` 272/304px matching the 17rem/19rem column. Test checks that exactly one `img[fetchpriority=high]` exists. |
| "Xem tất cả N ảnh" on the first thumbnail | OK | `thumbs[0]` has the accessible name "Xem tất cả 6 ảnh" and opens index 0. Below lg a separate pill button is shown. Test covers this. |
| Lightbox/Dialog return focus | OK | `returnFocusRef={openerRef}` (`Lightbox.tsx:63`). Test: Esc closes and focus returns to the "Xem ảnh 3" thumbnail. Video uses Radix Dialog, which restores focus by default. |
| Empty cells dropped | OK | SpecBar and InfoGrid use `filter(value?.trim())`; if nothing is left they render null. Tests cover `""`, `null` and `" "`. |
| Semantic `dl` | OK | Structure is `dl > div > dt + dd`. The icon is inside `dt` with `aria-hidden`, and the group label sits on a `role=group` wrapper. Test checks tag names. |
| aria-expanded / aria-controls | OK | `DetailExpandButton`. Extra items use the `hidden` attribute, and the `controls` id points at the list's `useId`. |
| No heart icon | OK | No grep hit for Heart in the new files. |
| Design tokens | OK | `no-raw-colors` PASS. Only token classes are used (`dark-deep`, `on-dark`, `primary-subtle`, `accent-text`, etc.). |
| 0, 1 or many images; no video; no hotline | OK | DetailHeroMosaic.test has 6 cases, DetailGalleryGrid.test 4, DetailBlocks.test covers no hotline. |
| GalleryGrid with fewer than 5 images, no empty cells | OK (CSS math) | n=5: 2×2 large tile plus 4 tiles. n=4: tile 2 has `md:col-span-2`. n=3: tiles 2 and 3 have `md:col-span-2`. On mobile, an odd last tile has `col-span-2`. n≤2: one row. |

## DetailPageShell vs the design (requested assessment)
- **Gap:** The design `detail-du-an.webp` places the right column (form + Hotline) **only beside the Overview section**. Location, Amenities and Gallery are **full-width bands** that use the aside's column (the distance list extends to the right edge of the container), and their backgrounds alternate white and light. The builder's shell instead puts the aside beside all content and renders each section as a white card on a `bg-primary-subtle` background. The look clearly differs from the design from Location downward. The hero, spec bar and tab bar match.
- **Builder's reasoning:** Spec BL-052 says "Cột phải dính ≥ lg" (right column sticky at ≥ lg), and the task's scope item 12 states the frame `[tab dính + cột nội dung | cột phải dính]`. So the spec and the design conflict, and the builder followed the spec. That is a reasonable choice for a pure-component task, so I am **not counting it as a FAIL for P1-T03**.
- **Does the shell let P1-T06 match the design?** Yes, through the existing `after` slot:
  - Put only `Tổng quan` in `children` (beside the aside), and put Location, Amenities and Gallery in `after` as full-width bands, each wrapped in `mx-auto max-w-container px-gutter` with alternating `bg-surface` / `bg-primary-subtle`.
  - Because the `DetailSection`s in `after` sit outside `group/detail[data-section-style=cards]`, they automatically render in the default (non-card) style, which is what a band needs.
  - The sticky aside then ends with the grid, as in the design.
  - P1-T06 must check two things: (a) `DetailSubNav` scroll-spy observes sections by `id` in the document, not only inside the grid; (b) the `#lead-form` anchor and the bottom sticky CTA still work.
- **Suggestion:** Primary should ask the user, or record a decision in DECISIONS: "aside sticky through the whole page (spec)" versus "aside only beside Overview, the rest as bands (design)". If the design wins, update the JSDoc of `DetailPageShell.after` (`DetailPageShell.tsx:18`) so it is no longer described as only for Similar/banner content, or add a clearly named `bands` prop. Do this before starting P1-T06.

## Responsive Checklist Gate (diff touches UI; breakpoints 375/640/768/1024/1280)
No browser was used. Verification is by CSS math. The builder reports checking 375/768/1280 in a browser with `scrollWidth = clientWidth`.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Every new container uses `w-full max-w-container px-gutter` and `min-w-0`. Long values use `break-words`. Grids use `minmax(min(100%,13rem),1fr)` / `minmax(8.5rem,1fr)`. Only the CardSlider list scrolls, inside itself. |
| Mobile-first `min-width` | OK | Only `sm:`, `md:`, `lg:`, `xl:` prefixes are used. |
| Grid with auto-fit/minmax | OK | InfoGrid and StatCards use `repeat(auto-fill,minmax(...))`. SpecBar and GalleryGrid use fixed breakpoint columns (2/3/4) with fluid widths, which is acceptable. |
| Container not fixed in px | OK | Uses `max-w-container` (80rem) and `max-w-[40rem]`. `min-h-[520px]` is only a minimum height. |
| Font sizes in rem / fluid headings | OK | Uses text tokens `text-h1`, `text-h2`, `text-h3`, `text-small`, `text-xsmall`. |
| Media: max-width, aspect-ratio, sizes | OK | `ResponsiveImage` uses fill inside a frame with aspect ratio or absolute positioning; all images have `sizes`. |
| Touch targets ≥ 44px | OK | Buttons and links use `min-h-11`; the video circle is `size-12`; dot buttons are `size-11`; the thumbnail buttons fill their cells (`min-h-24`). |
| Nav / table | N/A | No nav or table in this diff. Tabs reuse `DetailSubNav`, which scrolls horizontally inside itself. |
| 100vh | OK | `md:min-h-[min(78vh,600px)]` is a capped minimum height, not plain `100vh`. The aside uses `100dvh`. |
| prefers-reduced-motion | OK | Only a hover zoom transform and color transitions. CardSlider keeps `motion-reduce:scroll-auto`. |
| `overflow:hidden` hiding errors | OK | `overflow-hidden` is used only on the hero (for the absolutely positioned background image) and on image frames. |

Residual risk: 1024px was not checked in a browser (see MINOR-2).

## Skill gates
- aislop: skipped, `aislop` is not installed.
- oxlint (anti-slop): skipped, oxlint is not configured (no `.oxlintrc*`). ESLint `pnpm lint` has 0 errors.
- ocr (open-code-review): skipped, `ocr` is not installed.
- AI-readable: OK. One indicator found (MINOR-3: one function longer than 50 lines). Names are clear, there are no magic numbers (`MAX_THUMBS`, `VISIBLE`, `INITIAL`, `MAX_ITEMS` are named constants), indirection is at most 2 levels, and comments explain why rather than what. Fewer than 3 indicators, so not a FAIL.
- ai-friendly-web: N/A. These are internal components; no public route was changed.
- blitzstrike: N/A. No auth, input or API surface.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
1. **The DetailPageShell layout differs from the design** (`DetailPageShell.tsx:27-44`). The aside sits beside all content, and sections are cards on a tinted background instead of full-width bands. This comes from the spec/design conflict described above. **Fix:** decide before P1-T06. If the design wins, use the `after` slot for full-width bands and update its JSDoc (or add a `bands` prop). Does not block this task.
2. **DetailSpecBar between 1024 and about 1150px** (`DetailSpecBar.tsx:26-30`). At lg, `flex` with 6 equal cells plus `lg:pl-[4.75rem] lg:pr-4` leaves about 67px of text per cell at 1024px (1024 − 2×27 gutter − 16 = 954, ÷6 = 159, − 92 = 67). A long single word in Montserrat semibold (e.g. "shophouse", "Vinhomes") will break mid-word because of `break-words`. There is no horizontal scroll. **Fix:** use `lg:grid-cols-3` and switch to one row (`flex`) only at `xl:`, or reduce the icon padding at lg.
3. **DetailHeroMosaic function is about 110 lines** (`DetailHeroMosaic.tsx:44-157`), above the 50-line guideline. **Fix:** split out `HeroThumbs` (the thumbnail `ul`) and `HeroActions` (video, actions, pill).
4. **Sticky formula duplicated** (`DetailContactAside.tsx:10-11` vs `DetailLayout.tsx:11`). `STICKY_CLASS` copies the `top-[min(...)]` formula from `DETAIL_ASIDE_CARD_CLASS`, and the `LeadFormSlot` className copies the card classes, including a redundant `p-6 lg:p-6`. **Fix:** extract a shared `DETAIL_ASIDE_STICKY_CLASS` constant in `DetailLayout.tsx` and have both use it. That would change `DetailLayout`, so it can be deferred to P3-T06.
5. **`key={item.label}`** (`DetailSpecBar.tsx:30`, `DetailInfoGrid.tsx:22`). Two cells with the same label would produce a React key collision. **Fix:** use `` `${item.label}-${index}` `` like the other lists.

## Verdict: PASS
There are no CRITICAL or MAJOR findings. typecheck, lint and the related tests PASS, including the old callers of `DetailSection` and `CardSlider`. The Responsive gate has no FAIL items. The MINOR findings can be fixed in this task or carried into P1-T06; MINOR-1 needs a layout decision from the user or primary before P1-T06 starts.
