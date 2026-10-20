Agent: reviewer

# Review — feature-post-detail-unified-layout · phase-1-task-01 · round 1 (BL-032, MODIFY)

- **Review level:** NORMAL
- **Reason:** UI-only MODIFY. It touches the shared `PostCard` (home `OffersSlider`, `ProjectListings`, related posts, list) and adds i18n keys. No schema/API/auth/tenant/URL/SEO change. The route `page.tsx` (Article JSON-LD) is not in the diff. Builder verify was reported PASS.
- **Blast radius:** `/tin-bds`, `/tin-bds/danh-muc/[category]`, `/tin-bds/[slug]` (+ `/en/...`), the home Offers slider, and the "Tin liên quan" posts block in `/du-an/[slug]` (`ProjectListings`, read-only, not in diff). Message catalogs `page.posts.*` vi/en.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/posts src/components/detail src/components/home src/lib/posts "src/app/(frontend)/[locale]/tin-bds"` | PASS — 19 files / 154 tests |
| `pnpm lint` | PASS — 0 errors (2 old warnings in `tools/task-dashboard/server.mjs`, out of scope) |
| `pnpm typecheck` | PASS |

## Requirement checks
- **One h1:** `PostOverview` has `h1#post-title`. The old `<header>` h1 was removed. Test asserts `getAllByRole("heading",{level:1})` has length 1. OK
- **JSON-LD:** route `page.tsx` is unchanged (Article). `Breadcrumb` keeps the same items with default jsonLd. OK
- **Lead form:** there is exactly one `LeadForm source="property_post"`, in `PostContactBox`. The old full-width form was removed. `LeadFormSlot` default `id="lead-form"` is the same as `ProjectStickyCta` default `targetId = LEAD_FORM_DOM_ID`. OK
- **Sub-nav:** `visiblePostSections` drives the nav. The DOM ids (`overview`/`offer`/`content`/`gallery`) come from the same `POST_SECTION_DOM_ID` map. Each section renders under the same condition as its nav item (`offer !== null`, `hasRichText`, `gallery.length>0`), so empty sections are hidden. OK
- **Aside:** `PostContactBox` uses `DETAIL_ASIDE_CARD_CLASS`. `asideLabelledBy=POST_CONTACT_HEADING_ID` matches `LeadFormSlot headingId` → the `h2` id actually exists. OK
- **Removed exports/keys:** in `src`, there are no remaining references to `PostShareRail`, `data-share-variant="rail"` (only a negative test assertion), the PostCard `variant="feature"`, `page.posts.featuredLabel`/`moreLabel`, or `page.posts.leadForm.hotline`. The `featuredLabel` and `variant="feature"` hits that remain belong to `page.news`/`NewsCard`. The other `leadForm.hotline` belongs to another namespace (ProjectDetail), and typecheck PASS. vi/en key parity holds for the new keys (`gridLabel`, `empty.*`, `subNavLabel`, `subNav.*`, `sections.content`, `leadForm.callHotline`). OK
- **PostCard consumers:** `OffersSlider` (imageSizes override) and `ProjectListings` (imageSizes override) are only affected by the aspect change 16:10→4:3 and the title clamp. That matches RentalCard/ProjectCard as intended. Home tests PASS. OK
- **A11y:** the list is one `section aria-label=gridLabel` with `p role=status aria-live=polite` for the result count. Detail sections are labelled (overview `aria-labelledby`, DetailSection h2). The offer anchor is a plain `div` and OfferBox keeps its own h2. OK
- **URL/pagination:** `buildHref`/`withPage`/`ownPath`/`notFound` are unchanged. OK

## Responsive Checklist Gate (diff touches UI; verified by CSS reasoning, no browser)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll 375/768/1280 | OK | Cover `w-full max-w-container px-gutter`. List grid `grid-cols-1 sm:2 lg:3 xl:4`. Related `sm:2 lg:3`. PostCard `flex-col min-w-0`. No fixed px widths added |
| Mobile-first media queries | OK | Only `sm:`/`lg:`/`xl:` min-width utilities |
| Grid not fixed px | OK | Breakpoint column counts; no px column tracks |
| Container not fixed px | OK | `max-w-container` token |
| Typography rem/tokens | OK | `text-h2`, `text-h4`, `text-small`, `text-h2-sm` tokens |
| Fluid headings | OK | Token scale shared with rental (`text-h2`) |
| Media max-width/aspect | OK | `ResponsiveImage aspectRatio="16/9"`/`"4/3"`, container `aspect-[4/3]` |
| srcset/sizes | OK | Cover `sizes="(min-width:1280px) 1200px, 100vw"`. Card default sizes kept; slider/ProjectListings override kept |
| Touch target ≥44px | OK | Category link `min-h-11`, card link `min-h-11`, Button `size="lg"`, share buttons `min-h-11 min-w-11` |
| Nav on mobile | OK | Shared `DetailLayout` sub-nav (already reviewed in BL-027/028) |
| Tables | N/A | RichText `tableLabel` is unchanged |
| 100vh | N/A | Not used |
| prefers-reduced-motion | OK | PostCard image zoom keeps `motion-reduce:` overrides |
| overflow-hidden hiding bugs | OK | `overflow-hidden rounded-[20px]` only clips the cover corners |

## Skill gates
- aislop: skip, aislop not installed
- oxlint (anti-slop): skip, oxlint not configured. ESLint + tsc PASS
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — 1 indicator (`PostDetail` is about 70 lines, mostly JSX); fewer than 3
- ai-friendly-web: N/A — no change to robots/sitemap/llms/SEO
- blitzstrike: N/A — not STRICT

## Findings
- **[MINOR]** `src/components/posts/PostListPage.tsx:70` — on the root `/tin-bds` the empty state passes `backHref={listPath}`. The "Back to list" link then points to the current page. The rental template only passes it in a category (`{...(inCategory ? { backHref } : {})}`), and the task (L4) says `backHref` is for the category case. Fix: `{...(context ? { backHref: listPath } : {})}`. The previous default had the same behavior, so this is not a regression.
- **[MINOR]** `src/components/posts/PostDetail.tsx:~69-141` — `PostDetail` is about 70 lines, over the 50-line guideline. Fix: extract the `after` block into a `RelatedPosts` component (like `SimilarRentals`).
- **[MINOR]** `src/components/posts/PostDetail.tsx:10` — imports `hasRichText` from `@/lib/careers/job-view`, a cross-domain dependency. Consider moving it to a shared rich-text util later. Not blocking.
- **[MINOR]** Tests do not assert that there is exactly one `form`/`source=property_post` or that the sticky CTA `href="#lead-form"` exists on the post detail. The code is correct by inspection. Optional hardening.

## Residual risk
- Not checked visually at 375/768/1280 in a browser (no browser environment). The verdict relies on reading the CSS classes.
- `src/components/projects/*` tests (`ProjectListings` uses `PostCard`) were not in the allowed verify scope, and that directory has unrelated uncommitted user changes. The PostCard props API there is unchanged (`data`, `headingLevel`, `imageSizes`) and typecheck PASS.

## Verdict
✅ PASS — no CRITICAL or MAJOR findings. The 4 MINOR findings are optional.
