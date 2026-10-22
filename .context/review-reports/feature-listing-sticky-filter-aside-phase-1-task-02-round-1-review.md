Agent: reviewer

# Review — feature-listing-sticky-filter-aside · phase-1-task-02 · round 1 (BL-061, MODIFY)

- Review level: **NORMAL**
- Reason: shared detail layout (`DetailPageShell` / `DetailLayout` / `DetailAsideFit`) used by 3 detail pages, plus class-only container-query conversions. No auth/schema/API/data/i18n/URL change, no red-risk item, tests updated and passing. Builder evidence covers the main browser flows.
- Blast radius: `src/components/detail/{DetailPageShell,DetailLayout,DetailAsideFit,DetailGalleryGrid,DetailFeatureList}.tsx`; `src/components/projects/{ProjectDetail,ProjectLocation,ProjectHighlights,ProjectListings,ProjectAmenities,LegalPolicy}.tsx`; `src/components/rentals/{RentalDetail,RentalTerms,RentalAmenities}.tsx`; `src/components/posts/PostDetail.tsx` (JSDoc only). Pages: `/du-an/[slug]`, `/cho-thue/[slug]`, `/tin-bds/[slug]` (vi + en). Grep shows every converted block is used only inside `DetailPageShell` bands, so there is no consumer outside `@container/detail` that would get stuck on the narrow layout. Docs: `.context/design-spec.md`, `docs/DESIGN.md`. `SPECIFICATIONS.md` and `spec/**` are not modified. The only `spec/` entries in git status are two unrelated untracked change docs.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `npx eslint <changed src files>` (20 files) | PASS (exit 0, clean) |
| `pnpm test src/components/detail src/components/projects src/components/rentals src/components/posts` | PASS, 25 files / 289 tests |
| `pnpm test` (full suite) | not re-run by reviewer. Builder reports 420 files / 4406 PASS. Scoped run covers every touched test file. |
| `pnpm build` | not re-run by reviewer. A dev server is active on :3000 and shares `.next`, and there is no `.next/static/css` artefact to inspect. Builder reports exit 0. See residual risk. |

## Focus checks
- **Bands inside the left column.** `DetailPageShell.tsx` renders `bands` after `children` inside the `cards` column. The `key` comes from `band.key`, and `data-detail-band` is kept. `BAND_TONES` and the `max-w-container px-gutter` wrapper are removed. `after` is passed alone to `DetailLayout after`, outside the grid, so the sticky aside cell ends at the end of the grid. Tests assert DOM order (overview → bands → aside → after) and that `after` is not inside the aside's grid. OK.
- **`DETAIL_ASIDE_STICKY_CLASS`.** The value is `lg:top-[min(var(--detail-aside-top,calc(var(--sticky-top)_+_4.5rem)),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))]`. The arbitrary value has no raw spaces, `_` becomes a space, and the nested `var(..., calc())` fallback is valid. Browser evidence (`top: 88px` = sticky-top + 72px) shows the fallback path is active at runtime. OK.
- **`DetailAsideFit as`.** It defaults to `aside`, and `aria-labelledby` is emitted only for `aside`. The test covers both cases. OK. One typing nit is listed under Findings.
- **Container queries.** `@container/detail` is set on the `cards` column. `globals.css` uses `@theme static` and does not reset `--container-*`, so the Tailwind v4 defaults apply (`@md` 28rem, `@2xl` 42rem, `@3xl` 48rem, `@5xl` 64rem). The BL-060 Location spans are preserved:
  - 7/5 with no media, or 12 when only one part remains.
  - 7·5 then 5·4·3 at `@5xl` when map + list + media are all present.
  - 8/4 when one part is missing.
  - `@5xl` (1024px column) is not reached at 1440 (column ≈ 792px), so 1440 shows the former lg layout, map + list 7/5 with media on the next row. This is acceptable and documented.
- **LegalPolicy card.** The `legal` band is wrapped in a div with `DETAIL_SECTION_FRAME_CLASS`, which becomes a white card through `group-data-[section-style=cards]/detail`. Inner `section#legal/#sales-policy` keep `id`, `scroll-mt`, the `#documents` anchor logic and the `<lg` accordion (`isLg` viewport, `max-lg:hidden`). They use 2 columns at `@3xl`. OK.
- **ProjectAmenities.** `-mx-5 [--spacing-gutter:1.25rem] md:-mx-8 md:[--spacing-gutter:2rem]` matches the frame padding `p-5 md:p-8`, which also uses the viewport `md`. `@theme static` means `px-gutter` and `scroll-padding-inline` resolve `var(--spacing-gutter)`, so the local override takes effect. The negative margin equals the card padding, so nothing leaves the card. OK.
- **Overflow.** The column has `min-w-0`. Grid tracks are `minmax(0,1fr)`. `container-type: inline-size` does not affect the fixed overlays: Lightbox, Dialog and Sheet are Radix portals, and `ProjectStickyCta` is not rendered inside the column. Builder measured scrollWidth − clientWidth = 0 at 1440 / 1024 / 768 / 390. OK.
- **Scroll-spy / sub-nav / CTA.** Ids are unchanged and `scroll-mt` is asserted for all project section ids. `#lead-form` is unique. The 390 CTA scrolls to the form (builder evidence). OK.
- **Docs.** design-spec :235 / S03 / S07 / S09 and DESIGN.md :240/242/244/276 are updated as-built and match the code. No intent docs are touched. OK.

## Responsive Checklist Gate (diff touches UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder JS measurement shows a diff of 0 at 1440/1024/768/390. Column has `min-w-0`. `-mx` equals card padding. |
| Mobile-first / min-width queries | OK | Only `@<size>/detail` (min-width container queries) and existing viewport `md:` are used. |
| Grid adapts (no fixed column count at narrow width) | OK | Every multi-column grid is now conditional on column width. At 1024 the 571px column gives a 1-column Location (screenshot `du-an-1024-location`). |
| Container not fixed px | OK | No new px widths. |
| Typography rem / fluid | N/A | No typography change. |
| Media max-width / aspect-ratio | OK | Gallery aspect classes are kept (`aspect-4/3`, `aspect-16/10`, `@md` aspect-auto inside the `aspect-[2.2/1]` grid). See MINOR #2 about `sizes`. |
| Touch targets ≥ 44px | OK (unchanged) | Accordion button keeps `min-h-11`. No new controls. |
| Nav on mobile | N/A | Unchanged. |
| Tables scroll wrapper | OK (unchanged) | `PriceTable` keeps its inner horizontal scroll. Not browser-verified, see residual risk. |
| 100vh / reduced-motion / overflow-hidden masking | OK | Uses `100dvh`. No new animations. No `overflow:hidden` added. |

## Skill gates
- aislop: skip. `aislop` was not run (not in the allowed verify command set). Manual slop read found no generated filler.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc.json` / `oxlint.json`). ESLint on the changed files is clean.
- ocr (open-code-review): skip, ocr is not installed.
- AI-readable: OK, 0 new indicators. No new functions over 50 lines. JSDoc explains why rather than what. DESIGN.md is updated for the flow change.
- ai-friendly-web: N/A. Layout-only change, with no robots/sitemap/llms impact.
- blitzstrike: N/A, not a STRICT security task.

## Findings
- **[MINOR] #1** `src/components/detail/DetailAsideFit.tsx:20`: `useRef<HTMLDivElement>` is used while the default element is `<aside>`. This is type-imprecise but compiles. Suggest `useRef<HTMLElement>(null)` and casting at the JSX ref, or a typed union.
- **[MINOR] #2** Image `sizes` hints are not updated for the narrower column, so images download at the wrong resolution. Layout is unaffected.
  - `DetailGalleryGrid.tsx:61`: the bento first image declares `(min-width:1024px) 560px`, but the cell is ≈ 250–380px at 1024–1440. This over-fetches.
  - `ProjectLocationMedia.tsx:21`: the image declares `(min-width:1024px) 40vw`, but at 1024 the media spans the full column (≈ 507px > 410px). This slightly under-fetches at DPR 1.
  - Suggestion: a follow-up task to retune `sizes` to the column width.
- **[MINOR] #3** `ProjectDetail.tsx:144-148`: the legal card wraps two `section`s, and `scroll-mt` sits on the inner sections. When you jump to `#legal` or `#sales-policy`, the card's top padding (20/32px) scrolls under the tab bar, so the heading lands flush with the bar while the other cards keep their padding. This is a cosmetic inconsistency. Optionally move `scroll-mt` to the wrapper for the first block, or accept it.
- **[MINOR] #4** `DetailLayout.test.tsx:156`: `container.querySelector("div")` depends on the first `div` in render order. `querySelector('div:not(aside div)')` would be less fragile, or render the two variants separately.
- **[MINOR] #5 (evidence gap, not a defect)** These blocks are verified only with jsdom and class assertions, because local DB data lacks them: Highlights, FloorPlans, Pricing, Legal 2-col, Listings, FAQ, and Location media 5·4·3. The `stop-similar` screenshot is cropped and does not show "Dự án tương tự" itself. The stop point is backed by the builder's numeric `getBoundingClientRect` evidence only.

## Residual risk
- The reviewer did not re-run `pnpm build` or the full `pnpm test` (shared `.next` with a running dev server, and the full suite is long). This relies on the builder's report together with the reviewer's typecheck, eslint and scoped tests.
- There is no compiled CSS artefact to grep for `container-type:inline-size` and the `--detail-aside-top` rule. Runtime screenshots (7/5 at 1440, 1 column at 1024, sticky top 88px) indirectly confirm generation.
- Blocks without local data are listed in #5.

## Verdict
**PASS**: no CRITICAL or MAJOR findings. Five MINOR items are listed above. Follow-up for #2 (`sizes`) is recommended but does not block.
