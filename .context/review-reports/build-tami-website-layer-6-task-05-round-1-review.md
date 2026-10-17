Agent: reviewer

# Review: build/tami-website layer-6-task-05 (Trang chi tiết dự án S03), round 1

- **Review level:** STRICT
- **Reason:** The task file says NORMAL, but the diff touches several red-risk areas: shared components (`FloatingContact` in the layout, `ProjectCard`, `LeadFormSlot`), the shared query/helper `findLocalizedSlugs`, the proxy rule table `resolve-missing-page` (404 routing), the collection validators `Projects.gallery`, `Projects.ward` and `News.cover` (data validation at the API), and the click-stats beacon contract.
- **Blast radius:** the new route `/[locale]/du-an/[slug]`. `FloatingContact` is on every public page (bottom offset, beacon body and Content-Type). `ProjectCard` is used by S02 and S03. `LeadFormSlot` is used by every form page. The proxy 404 resolution covers all dynamic routes. Payload validation changes affect the create/update API for `projects` and `news`, plus the seed. `news-queries.findLocalizedSlugs` gained the `projects` collection.
- **Scope reviewed:** uncommitted diff against HEAD 4f14678. Excluded: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`.

## Verify commands + result (`.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 135 files, 1,474 tests, integration run against a temporary DB |
| `pnpm build` | PASS (exit 0). `● /[locale]/du-an/[slug]` is SSG/ISR |
| `pnpm install --frozen-lockfile` | skip, lockfile not changed |
| App runtime / curl / browser | Not run by the reviewer. Outside the allowed commands, and port 3000 was left alone. I relied on the builder's runtime evidence: ISR MISS→HIT, 404 with content, 301, 375/768/1280. |

## AC + follow-up coverage

| Item | Result | Evidence |
|---|---|---|
| No EN version → 404 EN; old slug → 301 | OK | `resolve-missing-page.ts:34` adds the `/du-an/[slug]` rule (proxy 404 with content, closes the L6-T03 follow-up); unit test `resolve-missing-page.test.ts:75-81`; the page keeps `notFound()` as a safety net (`page.tsx:97`). The 301 goes through the existing proxy resolve-redirect; runtime evidence is from the builder. |
| LCP `priority`, lazy map, PDFs open in a new tab | OK | `ProjectHero.tsx:28` is the only `priority` (sizes `100vw`); Gallery, floor plans and related cards are lazy; `LazyMap`; `Documents.tsx:24` has `target=_blank rel="noopener noreferrer"` plus a `safeFileHref` whitelist. |
| `LeadFormSlot` area present | OK | `ProjectDetail.tsx:91-107`, with `id="lead-form"` and a hotline fallback. |
| JSON-LD + meta + OG | OK (see ruling 2) | `buildRealEstateListingJsonLd` (`page.tsx:114-124`); BreadcrumbList comes from `Breadcrumb`; `generateMetadata` handles hreflang only when `hasEnglish && slugs.en`; the OG image is the first gallery image, falling back to the logo. |
| Exactly one `h1` | OK | `h1` appears only in `ProjectHero.tsx:32`. Sections use `h2`; "Other projects" cards use `headingLevel="h3"`. |
| L5-T06 refCollection/refId | OK | `ClickRefMarker` (module ref, clears only its own ref on cleanup) plus `sendClickBeacon(..., ref = getClickRef())`; test `FloatingContact.test.tsx:126-146`. |
| L5-T06 bottom-bar offset | OK (ruling 1) | `--sticky-cta-height` is added to the `bottom` calc of `FloatingContact.tsx:53`. |
| G18 text/plain | OK | `FloatingContact.tsx:182`; test decodes the Blob and checks `type`. |
| L5-T01 default upload validator | OK | `Projects.ts:51-54` and `News.ts:18-20` call `upload()` from `payload/shared` before the publish check. Integration tests cover PDF, bad id and missing id → 400. |
| L5-T01 ward filterOptions + server validate | OK (ruling 4) | `Projects.ts:64`; integration tests cover a ward from another province, changing only the province, and filterOptions. |
| L5-T01 placeholder when all images are deleted | OK | `ProjectCard.tsx:241-244` (MapPin placeholder); hero `image=null` → dark background; integration test `projects.test.ts:672-686`. |
| No draft/EN data leak | OK | "Other projects" goes through `findPublicList` (status + `hasEnglish`); populated category needs `hasEnglish` (`project-detail-view.ts:149`); `fallback: false` (payload.config:86) means no Vietnamese text leaks onto /en; `findLocalizedSlugs` uses overrideAccess but selects only `slug` and runs after the public check. |
| Server/Client boundary | OK | Grep found no server module importing a non-component export from a `"use client"` module. `project-detail-view.ts:71` copies the rule from `listCandidates` instead of importing it from the client module (the earlier 500 cause). `map-geometry` is not a client module. Server-rendered `RichText` passed as a ReactNode into the client `LegalPolicy` is valid. |

## Responsive Checklist Gate (diff touches UI, breakpoints 375/768/1280)

No browser on the reviewer side, so these were checked with CSS math. Builder runtime evidence: no horizontal scroll at 375/768/1280.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Long strips (sub-nav `ProjectSubNav.tsx:82`, floor-plan tabs `FloorPlans.tsx:65`) are `overflow-x-auto` inside their own containers; grid children use `min-w-0` plus `break-words` (`ProjectSpecs.tsx:58-60`, `ProjectAmenities.tsx:18`, `Documents.tsx:19-20`). |
| Mobile-first `min-width` | OK | Only `sm:`/`md:`/`lg:` utilities (min-width) are used. |
| Grid auto-fit/minmax | OK (exception) | Fixed column counts by breakpoint (2→4, 1→2→3, 12-col 7/5) are explicitly required by design-spec S03 (§313, §323-325). Columns use `min-w-0`, so nothing overflows. Design-spec takes precedence over the generic checklist. |
| Container not fixed px | OK | `max-w-container px-gutter`, `max-w-4xl`, `max-w-[68ch]`, `max-w-[20ch]`. |
| Font rem / fluid heading | OK | Tokens `text-display`/`text-h2`/`text-h3`/`text-small` (rem/clamp tokens); no `px` font-size added. |
| Spacing scale | OK | `py-section-tight`, `gap-*` from the scale. |
| Media max-width/aspect-ratio | OK | `ResponsiveImage` (existing) with `aspectRatio="4/3"` for floor plans and `fill` for the hero; cards are 4:5/4:3; srcset/sizes come from `ResponsiveImage`. |
| Touch target ≥ 44px | OK | Sub-nav `min-h-12`, tabs/accordion/select/developer link/hotline `min-h-11`, Documents `Button` md = `h-11`, hero/sticky `lg` = `h-13`. Breadcrumb at 42px wide is existing and out of scope (separate task suggested). |
| Mobile nav / tables | OK | Sub-nav scrolls horizontally and centres the active item; RichText tables are wrapped by the existing component (`tableLabel`). |
| No bare 100vh | OK | Hero uses `min-h-[min(100svh,900px)]`. |
| prefers-reduced-motion | OK | `scrollIntoView` switches to `auto` under reduced motion (`ProjectSubNav.tsx:70`); transitions use `--duration-fast` tokens. |
| No `overflow:hidden` hiding errors | OK | `overflow-hidden` is only used on the image frame and hero (to clip the image). |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop (`npx aislop scan --changes --json`) | OK, score 100 | 3 diagnostics, all warning/info and not new defects: `import/no-duplicates` in resolve-missing-page.ts:5 (existing), `prefer-tag-over-role` in FloatingContact.tsx:51 (existing), empty-function in LegalPolicy.tsx:18 (intentional no-op unsubscribe). |
| oxlint (anti-slop) | skip, oxlint not configured | No `.oxlintrc*`; eslint PASS. |
| ocr (open-code-review) | skip, ocr not installed | |
| AI-readable | OK (1 indicator) | One indicator: some JSX component bodies are longer than 50 lines (`ProjectDetail` ~90, `FloorPlans` ~100), and they are mostly markup. Constants are named (`SELECT_MIN_PLANS`, `SCROLL_LOCK_MS`, `BAR_HEIGHT_PX`, `JSON_LD_IMAGE_COUNT`). Comments explain WHY. Every file is under 300 lines. Under the threshold of 3. |
| ai-friendly-web | N/A | No change to robots/sitemap/llms in this task; the public page goes into the existing sitemap. |
| blitzstrike | skip | Not installed; read-only public page with no new input. |
| ponytail / surgical diff | OK | Every change traces back to the AC or a named follow-up; no drive-by refactor. |

## Rulings on the builder's decisions

1. **Separate `--sticky-cta-height`:** ACCEPTED. It avoids the cookie banner and the bottom bar overwriting each other's variable. The bar sits above the banner via `--floating-bottom-offset`, and the floating button adds both, so the stacking is consistent.
2. **RealEstateListing without price:** ACCEPTED. `priceFromVnd` is only a "from" price, so leaving out `offers` avoids misleading data. The AC's "Organization" is met by the site-wide Organization JSON-LD (L5-T08); I did not re-check it at runtime (residual risk). BreadcrumbList is present.
3. **One check icon for amenities:** ACCEPTED. design-spec §313 says "no icon → names only, 2-column list". A decorative `aria-hidden` check icon is consistent with that, and guessing icons from free text would be worse.
4. **Projects.ts importing ward validators from `hooks/rentals/field-validators`:** ACCEPTED for this round, but it is coupling (MINOR-3). The validators are not rental-specific, so move them to a shared place in a later task.

## Findings

### CRITICAL
None.

### MAJOR
None.

### MINOR
1. **`src/components/projects/LegalPolicy.tsx:56`.** The comment says `hidden` + `lg:block!` keeps desktop content visible without JS. It does not. Tailwind v4 (`^4.3.3`) preflight has `[hidden]:where(:not([hidden=until-found])) { display:none !important }` in `@layer base`, and for `!important` declarations the earlier layer wins over `@layer utilities`. So on desktop, before hydration or without JS, the second block (Sales policy) stays hidden. After hydration `isLg=true` removes `hidden`, so it shows late (a flash and a below-the-fold layout shift). Fix: drop the `hidden` attribute for the panel and use a class such as `cn("pt-6", !open && "max-lg:hidden")` (no `isLg` needed), then fix the comment.
2. **`src/components/projects/ProjectStickyCta.tsx:52`.** On the server `isLg=false`, so the "Get advice" bar is in the SSR HTML on desktop and only disappears after hydration. That is a flash, and design-spec §325 says ≥1024 has no bottom bar. Fix: add `lg:hidden` to the bar's wrapper. Also, the bar does not account for `env(safe-area-inset-bottom)` (iOS home indicator); consider `pb-[env(safe-area-inset-bottom)]` and adding the same amount to the height and offset.
3. **`src/collections/Projects.ts:38`.** A content collection imports from `hooks/rentals/field-validators`, which couples `projects` to the rentals module. Suggested follow-up: move `wardFilterOptions`/`validateWardInProvince` to a shared place (e.g. `src/fields/ward-in-province.ts`).
4. **`ProjectSubNav.tsx:66-78` together with `LegalPolicy`.** On mobile, tapping "Policy" in the sub-nav (or opening a `#sales-policy` link) scrolls to and focuses the block, but the accordion stays collapsed, so the user lands on a closed heading. Suggested fix: open the panel when the hash or sub-nav targets the block's `id` (listen for `hashchange` or a custom event).

## Residual risk
- The reviewer did not check runtime behaviour (ISR HIT, 404 HTML with content, 301, the three widths, lightbox focus trap) with a browser or curl. I relied on the builder's evidence plus the code and tests.
- Site-wide Organization JSON-LD was not re-checked in the HTML of this page.
- MINOR-1 is reasoned from Tailwind v4 preflight and the cascade-layer rule for `!important`; it was not observed in a browser.

## Verdict
**PASS.** No CRITICAL/MAJOR. Lint, typecheck, test (1,474) and build pass. Every responsive item is OK, and the skill gates are OK or skipped with a reason. The 4 MINORs are recommended for the builder to fix in the same round or carry as follow-ups.
