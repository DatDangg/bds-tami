Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-05 · round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-a474010324ebc60d0`, branch `worktree-agent-a474010324ebc60d0`. Nothing is committed yet. Base `463a9eb` (confirmed with `git log -1`).
- Scope reviewed: `git diff`, `git diff --cached` (PostShare deletion), and the untracked files (`DetailGalleryParts`, `RelatedPosts`, `RentalAmenities`, `RentalVideoButton`, `use-rental-facts`, `SaleContactBox.test`, `PostDetail.test`). `payload-types.ts` and `importMap.js` were skipped as instructed.

## Review level: STRICT
**Reason:** two public detail pages (`/cho-thue/[slug]` and `/tin-bds/[slug]`, both vi and en) with a lead form (`source=rental` / `property_post`), noindex and JSON-LD logic, plus changes to shared detail components (`DetailGalleryHero`, `DetailSection`, `LegalPolicy`, `icons.ts`, i18n).

**Blast radius:**
- Rentals: `RentalDetail` and `RentalSpecs`, `RentalTerms`, `SaleContactBox`, `SimilarRentals`, and `rental-detail-sections` (section ids `description` → `overview`/`details`/`amenities`).
- Posts: `PostDetail`, `OfferBox`, `RelatedPosts` (new); `PostShare` deleted.
- Shared components:
  - `DetailGalleryHero` (also used by project detail). The parts were extracted and `aria-roledescription` is now set only when there is more than 1 image.
  - `DetailSection`: exports `DETAIL_SECTION_FRAME_CLASS`; the class string is identical, so nothing changes for other pages.
  - `LegalPolicy`: the h2 uses `text-h3` only when an eyebrow is present.
- Pages: `cho-thue/[slug]/page.tsx` and `tin-bds/[slug]/page.tsx` now add a `ConsultBanner`, which makes one more homepage CMS read, the same pattern as project detail.
- Shared resources: `icons.ts` and `vi/en.json`.
- Not changed: schema, lead API, query.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src` | PASS: 251 files, 2463 tests |
| Integration / build | skip. The diff has no query/schema changes, and the DB is shared with tasks running in parallel. |

## Requirements / preserved behaviour
| Item | Result | Evidence |
|---|---|---|
| Lead form `source=rental` | OK | `SaleContactBox.test.tsx` asserts `source: "rental", sourceId` for both an available listing and a rented one (rented still uses its own id as the source). There is exactly 1 `#lead-form`. |
| Lead form `source=property_post` | OK | `PostDetail.test.tsx:70-75`: `source: "property_post", sourceId: "p1"`, 1 form inside the aside. |
| No new date field (Q6) | OK | The LeadForm props are unchanged. |
| Map, amenities, video | OK | `LazyMap` and `VideoFacade` are kept. The "Video" button on the large image opens a Radix Dialog; the test clicks it and finds `Phát video`. The Video card is kept (Q7). Amenities have their own block with `AMENITY_ICONS: Record<RentalAmenity,…>`, so TypeScript forces an icon for every amenity. |
| Subnav scroll-spy (new ids) | OK | Order is overview·details·amenities·terms·video·location·legal. The test checks that every anchor points to a real element; `visibleRentalSections` uses the same conditions that render each block. |
| Rented-listing banner / badge / noindex / similar listings | OK | `role=status` banner + "Đã thuê" badge in the title card. Breadcrumb `jsonLd={!view.rented}` is kept. The page test asserts 0 JSON-LD for a rented listing. "Căn tương tự đang trống" comes right after the h1 and before `#details`, wrapped in `pb-8` (BL-031). Terms collapse into a closed accordion that uses the shared card frame. |
| One h1 | OK | Tests on both pages: `getAllByRole("heading",{level:1})` has length 1, and the h1 is inside `DetailTitleCard`. |
| JSON-LD | OK | RealEstateListing `inLanguage en` (page test). The post's breadcrumb JSON-LD defaults to true, unchanged. |
| i18n vi/en | OK | The en keys match vi (`postDetail`, `similar.*`, `facts.*` with en plurals). The `/en` test passes with no Vietnamese leaking. |
| No hex, no heart icon | OK | The diff adds no `#rrggbb`, only tokens. `RentalCard`/`PostCard` have no heart. |
| Similar-listings slider uses `CardSlider` | OK | `SimilarRentals` and `RelatedPosts` → `CardSlider` + `SectionHeading` aligned left, white background, not rendered when empty, `sizes` matches the slide width. |
| T04 MINOR #1/#4/#5 | OK | #1: `LegalPolicy.tsx:47` uses `text-h3` when there is an eyebrow. #4: `GalleryCounter`/`GalleryThumbs` moved to `DetailGalleryParts.tsx`; `DetailGalleryHero` is down to ~120 lines total. #5: `aria-roledescription` is set only when `multiple`, with a test. |
| Empty cover / gallery | OK | `PropertyPosts.cover` has `validateCoverWhenPublished` and `Rentals.gallery` has `validateGallery`. If media is deleted later, the hero falls back to a dark block of the same height (behaviour documented in T04). |

## Merge risk against staging `561e03f` (`git diff 463a9eb staging`)
- **i18n keys removed by T05:** `page.posts.share` and `page.posts.relatedTitle` (plus `rentalDetail.specs.label`, `details.title|amenities`, `sections.description`, and the old `similar.title`).
  - On staging these keys are used only by `PostShare.tsx`, `PostDetail.tsx`, `RentalSpecs.tsx`, `RentalDetail.tsx` and `SimilarRentals.tsx`. T05 changes or deletes all of these files, so nothing breaks.
  - T06 (news) uses `page.news.detail.relatedTitle`, a different namespace.
  - `PostListPage`/`PostCard` on staging use `page.posts` but not `share`/`relatedTitle`.
- **`PostCard` (changed by T06):** it only adds an optional `variant` prop. `RelatedPosts` calls `PostCard` with `data/headingLevel/imageSizes`, which stay compatible.
- **`icons.ts`: textual conflict is certain.** Staging adds `EnvelopeSimple` right after `Clock,`, and T05 inserts `Compass, CookingPot, Door, Elevator` at the same spot (it also re-sorts `ArrowUp`/`LinkSimple`). The fix is trivial: keep both and stay alphabetical. The dispatcher must resolve it by hand.
- **`vi/en.json`:** staging's hunk @225-232 sits close to T05's @236 (removing `relatedTitle`). They will probably merge cleanly but may conflict if the context lines overlap. Other hunks don't overlap (T05's are at the end of the file: `postDetail`).
- **`Breadcrumb.tsx` (changed by T03 on staging):** it adds `truncate` for the overlay variant. That is compatible, and actually helps the long overlay breadcrumb on T05's hero.
- After merging, run typecheck and vitest again on the integration branch.

## Responsive Checklist Gate (diff touches UI)
No browser was available to me. I checked via CSS math plus the builder's screenshots (`assets/site-redesign-t05-390-rental.jpg`, `-1440-rental-rented.jpg`, plus 5 more files).

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Title card, amenities and details use `min-w-0` + `break-words`. Sliders use `CardSlider` (T02). The 390 screenshot shows no overflow; long breadcrumbs truncate (staging T03). |
| Mobile-first `min-width` | OK | Amenities `grid-cols-1 → sm:2 → md:3`; details `sm:grid-cols-2`; aside `< lg` sits below the cards (DetailLayout). |
| Grid not fixed-column | OK | Breakpoint-based columns, as the project's convention (accepted in T04). At ≥ lg the main column is ~780px, so 3 amenity columns are ~240px each. |
| Typography in rem/token | OK | `text-h3`, `text-small`, `text-eyebrow`, `text-body`. No px font sizes. |
| Media | OK | `ResponsiveImage` with `sizes`. The hero has a fixed height, so no CLS. The first image is `priority` (test `fetchpriority="high"` = 1). |
| Touch ≥ 44px | OK | Video/view-all `min-h-11`, amenity icons `size-11`, links in the details `<dl>` `min-h-11`, Dialog close uses the ui component. |
| Nav/table on mobile | OK | Subnav chips unchanged; the bottom sticky CTA `< lg` is kept. |
| Viewport units | OK | Mobile is `h-[480px]`; `78vh` only at md+ and capped at 640px (from T04). |
| prefers-reduced-motion | OK | Progress bar `motion-reduce:transition-none`; no autoplay. |

## Skill gates
- aislop: skip, aislop is not installed (same as T04).
- oxlint (anti-slop): skip, oxlint is not configured. ESLint passes.
- ocr: skip, ocr is not installed.
- AI-readable: OK, 1 indicator (magic px values in the frame classes: `rounded-[20px]`, `rounded-[28px]`).
  - The new files are short.
  - Comments explain why (mockup, Q6/Q7, BL-031).
  - Names are clear.
  - The DESIGN/design-spec update is scheduled for T08.
- ai-friendly-web: N/A. Robots/sitemap/llms are not touched.
- blitzstrike: N/A.
  - The lead API is unchanged.
  - The share URL is the server-side canonical.
  - `VideoFacade` reuses the existing URL validation (`validateVideoUrl` in the collection).

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
1. **Eyebrow repeats the title on the Posts page.** `PostDetail.tsx` uses `eyebrow.overview` "Tổng quan" with title "Tổng quan", "Nội dung" with "Nội dung", and "Hình ảnh" with "Hình ảnh" (`vi.json:243-247,272` vs `postDetail.eyebrow`). The same pattern appears on Rentals for Video, Vị trí and Pháp lý. Each card shows the same word twice, which is copy noise. Fix: use a more descriptive h2 title (e.g. "Thông tin tin đăng", "Chi tiết ưu đãi") or a different eyebrow; this can wait for T08.
2. **`visibleRentalSections` takes `amenities?: readonly unknown[]` as an optional field** (`rental-detail-sections.ts:488`), even though `RentalDetailView.amenities` always exists. Fix: add `"amenities"` to the `Pick` so the type is precise and the parameter is no longer optional.
3. **Old `#description` anchor removed.** Any link someone shared to `/cho-thue/x#description` now just lands at the top of the page, which is harmless. Note it in the design-spec S07 update (T08).
4. **Merge conflict on `icons.ts`** with staging (`EnvelopeSimple`); see Merge risk. The dispatcher must resolve it by hand and re-verify.

## Residual risk
- I did no live browser checks at 375/768/1280.
- The video was only covered by unit tests, because the dev DB has no listing with `videoUrl`.
- In the rented-listing 1440 screenshot (taken while the page was scrolled) there is an outlined box at the bottom right of the hero, probably a thumbnail that hadn't loaded. I could not confirm this further.
- The rented screenshot doesn't show the "Căn tương tự đang trống" block, probably because the DB has no matching listing. This case is covered by tests.
- Merge with staging is not simulated (only `diff --stat` and hunk ranges compared).

## Verdict: PASS
There are no CRITICAL or MAJOR findings. Typecheck, lint and vitest (2463 tests) all pass, and all the behaviour that had to be kept is still there and tested. The 4 MINOR findings can be fixed now or in T08; the `icons.ts` conflict must be handled at merge time.
