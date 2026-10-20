Agent: reviewer

# Review: feature-site-redesign-homepage-style, phase-1-task-02, round 2 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-aa013cc3614d8cae7` (branch `worktree-agent-aa013cc3614d8cae7`, nothing committed). `git log -1` shows HEAD = `e07a160`, which is current staging (merge T00), so the base is now correct.
- Diff: 17 modified files, 1 deleted (`home/use-snap-slider.tsx`), 4 new (`layout/CardSlider.tsx`, `layout/CardSlider.test.tsx`, `layout/card-parts.tsx`, `layout/use-snap-slider.tsx`). `src/payload-types.ts` has line-ending changes only (`git diff --stat --ignore-all-space` is empty), so I ignored it.
- Review level: **STRICT**
- Reason: the diff changes shared components (`ProjectCard`, `RentalCard`, `NewsCard`, `PostCard`, the slider hook, and the new `CardSlider`/`card-parts`) that many pages use.
- Blast radius:
  - Home page: Featured Projects, Rentals, News, Offers.
  - List pages: `/du-an`, `/cho-thue` (and its categories), `/tin-tuc`, `/tin-bds`.
  - Detail pages: the "Dự án khác", "Căn tương tự" and "Tin liên quan" blocks.
  - i18n: `vi.json`/`en.json` get one new key, `page.rentals.card.available`.
  - `FeaturedProjects.tsx` is not in the diff, so the BL-044 eyebrow, description and CTA are unchanged.

## Verify commands and results (run with cwd = worktree)

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that were already there (`tools/task-dashboard/server.mjs`) |
| `pnpm test` (full suite) | 303/307 files pass, 3173 tests pass, 55 skipped. **4 integration files fail**: `access`, `jobs-email`, `media-upload`, `session-refresh`. The cause is `Hook timed out in 10000ms` in beforeAll/afterAll (followed by `Cannot read properties of undefined (reading 'destroy')`), i.e. the shared DB/S3 is overloaded. All unit and component tests pass. |
| `pnpm vitest run tests/integration/access.test.ts` (run alone) | PASS, 25/25 |
| `pnpm vitest run tests/integration/{jobs-email,media-upload,session-refresh}.test.ts` (run alone) | PASS, 3 files / 30 tests |

The integration failures do not come from this diff. The diff touches no integration code, and every one of those files passes when run on its own.

## Round 1 findings: status

| Finding | Status | Evidence |
|---|---|---|
| C1: stale base; heart icon still on staging | **Fixed** | HEAD = `e07a160`. The diff removes `Heart`, `data-testid="project-heart"` and the heart `<span>` from staging's `ProjectsSlider.tsx`, and removes `Heart` from `icons.ts`. Grep for `\bHeart\b\|project-heart` in `src/` only finds the "no heart" assertion in `ProjectsSlider.test.tsx:146`. The 1440 home screenshot shows no heart. |
| C2: dots do not match real positions (BL-038 regression) | **Fixed** | `layout/use-snap-slider.tsx` is a byte-for-byte move of staging's hook (`pageCount`, offset measurement, `scrollByPage`). The only change is the `useMediaQuery` import path. `CardSlider.tsx:64,68` renders `pageCount` dots and shows them only when `pageCount > 1`. New test `CardSlider.test.tsx:49-72` checks that 6 cards with 4 visible gives 3 dots, that the current dot follows `scrollLeft` (it is the last dot when scrolled to the end), and that dots and arrows scroll to the correct offset. |
| m1: RentalCard field order | **Fixed** | `RentalCard.tsx`: title, then pin, then specs (Ruler/Bed), then footer (gold price + arrow). This matches mockup `data-cards="rent"`. |
| m2: NewsCard repeated the card shell classes | **Fixed** | The boxed variant now uses `CARD_LINK_CLASS` and `CARD_IMAGE_ZOOM`. |
| m3: `layout` component imports from `home` | **Partly fixed** | The hook moved to `layout/`, but `layout/use-snap-slider.tsx:6` still imports `useMediaQuery` from `@/components/home/use-environment`. See m-a. |
| m4: arrow color and news badge differ from mockup | Accepted | Recorded in the task file. |

## No regressions in BL-037, BL-038 and BL-044

- **BL-037**: `CARD_TITLE_CLASS` contains `line-clamp-2 min-h-[2lh]`. ProjectCard, RentalCard and PostCard use it, the boxed NewsCard adds `min-h-[2lh]` itself, and tests assert it.
- **BL-038**: the hook is unchanged and `CardSlider` uses `pageCount`. `OffersSlider` and `RentalsTabs` only had their import path changed, and their logic (`scrollByPage`) is unchanged. In the 1440 screenshot, 6 dots with about 5 cards visible is consistent with roughly 10 projects.
- **BL-044**:
  - `FeaturedProjects` is not touched.
  - The slide widths in `CardSlider` (`w-[82%] sm:w-[320px] lg:w-[272px]`) are the same as staging, and the slider still runs edge to edge with `px-gutter` and `scroll-padding`.
  - The ARIA carousel attributes, `tabIndex=0`, and keyboard behavior are kept.
  - Labels use `t.raw` and `fill()`, and slide labels still read "{index}/{total}".

## Responsive Checklist Gate (the diff touches UI)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK (CSS math + screenshot) | Horizontal scrolling stays inside the `ul` (`overflow-x-auto`). The 1440 screenshot shows the edge-to-edge slider without page-level overflow, and this is the same structure as staging's BL-044. |
| Mobile-first / grid / container | OK | The card grids are not changed. The fixed slide widths of 320/272px were already in staging (BL-044) and sit inside the scroll area, so they are not a regression. |
| Typography rem / tokens | OK | Uses tokens `text-h4`, `text-body`, `text-small`, `text-xsmall` and colors `accent-text`, `primary-soft`, `text-muted`. No new hex values or px font sizes. |
| Media | OK | Images use `aspect-[11/10]` with `ResponsiveImage`. `sizes` is passed through (`ProjectsSlider` uses `IMAGE_SIZES` to match the slide widths, and ProjectCard has a `DEFAULT_SIZES` for the grid). |
| Touch target ≥ 44px | OK | Each whole card is one link (`min-h-11`). Dots are `size-11` buttons. `SliderArrow` is 44px and only shows from md up. `CardArrow` is decorative and `aria-hidden`. |
| Nav / table | N/A | Not in this diff. |
| 100vh / reduced-motion / overflow-hidden | OK | Image zoom and scroll both have `motion-reduce:*`, and dot transitions use `motion-reduce:transition-none`. No `100vh`. `overflow-hidden` is only used to clip images, not to hide layout bugs. |
| Slider pagination (BL-038) | OK | See C2 above. |

Residual risk: I had no browser, so 375/768 were checked by CSS math only. The builder provided screenshots for home 390 and for 1440. `projects-list-1440.jpg` is the old image from before the rebase, so `/du-an` 1440 has no screenshot on the new base.

## Skill gates

- **aislop**: skip. It is not in the allowed verify commands.
- **oxlint (anti-slop)**: skip, oxlint not configured (Glob finds no `.oxlintrc*`). eslint reports 0 errors.
- **ocr**: skip, ocr not installed.
- **AI-readable**: OK, 2 indicators, below the threshold of 3.
  - m-a: the dependency from `layout` to `home` remains.
  - m-d: the task file has a stale section.
  - New functions are under 50 lines and files are under 300 lines (`CardSlider` 89, `card-parts` 44).
- **ai-friendly-web**: N/A. Changing a card component does not touch robots, sitemap or llms.
- **blitzstrike**: N/A. No auth, input or API in this diff.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR] (do not block)
- **m-a**: `src/components/layout/use-snap-slider.tsx:6` imports `useMediaQuery` from `@/components/home/use-environment`. Shared `layout` code still depends on `home`. Suggested fix: move `use-environment` into `layout/` or `lib/` in a later cleanup task.
- **m-b**: dead data and keys.
  - `ProjectCardData.priceFrom` is still computed in `src/lib/projects/project-view.ts:19,40`, and `PROJECT_CARD_FIELDS` still loads `priceFromVnd`, but no card shows it anymore.
  - The i18n key `page.projects.priceFrom` (`vi.json:299`/`en.json:299`) and `page.home.projects.stats.*` are no longer used.
  - Removing the price follows the spec (the card has no price). Suggested fix: clean these up in T08. Keep `priceFromVnd` in the query because the `price_asc/desc` sort still needs it.
- **m-c**: link accessible names got longer.
  - Before, the home slider's link used `aria-labelledby` pointing only at the title.
  - Now the shared `ProjectCard`/`RentalCard` link's name is the full text, for example "Đã bàn giao Dự án 1 Hà Nội" or "Còn trống …". The test was loosened from `"Dự án 1"` to `/Dự án 1/`.
  - This matches how the `/du-an` grid already behaved, so it is acceptable. If you want a short name, add `aria-labelledby` pointing at the heading id in `ProjectCard`/`RentalCard`.
- **m-d**: in `tasks/feature-site-redesign-homepage-style/phase-1-task-02.md:46-53`, the section "Quyết định builder tự chọn" is out of date. It says the hook was changed to "first visible card" and that FeaturedProjects sits in a container, which contradicts the Round 2 section. Fix it at close-out so the task file stays the source of truth.
- **m-e**: `src/components/layout/CardSlider.test.tsx:52` assigns `Element.prototype.scrollTo` directly, so `vi.restoreAllMocks` does not reset it. Vitest isolates each file, so the impact is small. Using `vi.spyOn` or saving and restoring the original would be cleaner.
- **m-f**: `src/payload-types.ts` has line-ending changes only. Leave it out when committing.

## Verdict: PASS

C1 and C2 from round 1 are fixed and verified (base `e07a160`, heart removed from staging's code, `CardSlider` dots use `pageCount`, with a test for 4 visible / 6 cards / 3 dots). BL-037, BL-038 and BL-044 have not regressed. typecheck and lint pass. All unit and component tests pass. The 4 integration files that failed in the full suite are timeouts under DB load, and each passes when run alone. The remaining items are MINOR only.
