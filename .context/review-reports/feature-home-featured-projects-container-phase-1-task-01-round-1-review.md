Agent: reviewer

# Review — feature-home-featured-projects-container · phase-1-task-01 · round 1 (BL-075)

- **Review level:** STRICT
- **Reason:** the task touches the shared component `CardSlider` (new prop). It is consumed by ProjectsSlider, SimilarCarousel (which ProjectDetail, SimilarRentals and RelatedPosts go through) and ProjectAmenities. AGENTS.md § Reviewer rules puts shared components in STRICT.
- **Blast radius:** the "Dự án nổi bật" block on `/` and `/en` (FeaturedProjects → ProjectsSlider → CardSlider). CardSlider consumers that don't pass the prop: SimilarCarousel (`/du-an/<slug>`, `/cho-thue/<slug>`, `/tin-bds/<slug>`) and ProjectAmenities. Not affected: API, schema, i18n, CMS.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `pnpm test` | PASS — 4606/4606 tests |
| `pnpm exec eslint src/components/layout src/components/home` | PASS (no output) |
| `pnpm lint` (whole repo) | FAIL exit 1 — pre-existing noise from the generated `playwright-report/` (untracked artifact). The diff only touches the 6 files in the eslint scope above, and those are clean. Out of scope. |

## Requirements coverage
- Wrapper `div.mx-auto.w-full.max-w-container` with no `px-gutter` (`FeaturedProjects.tsx:34`) follows the `SimilarCarousel` pattern. The `ul` already has `px-gutter` + `scroll-padding-inline: var(--spacing-gutter)`, so by CSS math: ul edges = frame edges (the same `max-w-container` as the header div, `FeaturedProjects.tsx:26`), and the first card = frame + gutter. Matches acceptance (a)/(b) and the builder's measurements (1440: head [73,1353] = ul, first card 105; 1920: [313,1593], first card 345).
- `centerWhenFits` is opt-in, default `false` (`CardSlider.tsx:44`), and adds `justify-center-safe` (`CardSlider.tsx:62`). Tailwind 4.3.3 is installed (`node_modules/tailwindcss/package.json`), and in v4 this utility compiles to `justify-content: safe center`. The builder confirmed the computed value is `safe center` in the browser. No plain `justify-center` anywhere, and the test checks the class token directly (`CardSlider.test.tsx:91`).
- Overflow case: `safe` falls back to start alignment. `scrollLeft=0` still lands on the first card at the gutter, and snap and scroll-padding are untouched. Matches acceptance (b) and the builder's measurements (sw 1776 > cw 1280, first card at frame+gutter).
- Other consumers: grep finds `centerWhenFits` only in `ProjectsSlider.tsx:28`. SimilarCarousel (`SimilarCarousel.tsx:42`) and ProjectAmenities (`ProjectAmenities.tsx:56`) don't pass it. The default class string only moved into `cn(...)`; with no conflicting tokens, twMerge returns the same string, and existing tests PASS plus a new test checks the default has no `justify-center*`.
- Comment `CardSlider.tsx:31` updated to "khung 1280 vừa 4 thẻ". JSDoc in `FeaturedProjects.tsx:19` drops "tràn viền". `SLIDE_WIDTH`, gap and `IMAGE_SIZES` are unchanged.
- Forbidden scope: the diff for this task only touches the 6 listed files. It doesn't touch spec/docs/progress.

### Checking the inference `pageCount = 1` in the fit case (builder could not observe ResizeObserver)
`use-snap-slider.tsx:46-59, 69`: `measure()` is called **directly in the mount effect** (line 69) and doesn't depend on ResizeObserver. ResizeObserver is only for re-measuring after a resize. When a row fits: `maxScroll = sw − cw = 0`, and `offsets[0] = 0 ≥ −1` → `firstReachingEnd = 0` → `pages = 1` → arrows and dots hidden (`CardSlider.tsx:80, 87`). Even if sw/cw were off by 1px from rounding (`maxScroll = 1`), `0 ≥ 0` still gives 1 page, so the formula tolerates it. Offsets are measured relative to the first card, so centering doesn't shift the offsets. In the fit case the content fits the content-box, so there is no overflow and sw == cw; the builder measured exactly that at 1920/1440/1024. **Conclusion: the inference is sound and acceptable.** The only gap is that live re-measurement after a viewport resize (ResizeObserver) wasn't observed in the pane. That mechanism predates this task and the task doesn't change it (residual).

## Responsive Checklist Gate (diff touches UI — no browser available to me; verified with CSS math plus the builder's measurements)
| Item | Result | Evidence |
|---|---|---|
| No horizontal page scroll | OK | Builder: docSW = viewport at 390/768/1024/1440/1920. The wrapper is `w-full max-w-container`, and the ul scrolls internally (`overflow-x-auto`). |
| Mobile-first / no new media queries | OK | No breakpoints added. The wrapper is fluid (`max-w` + `w-full`, no fixed px). |
| Grid auto-fit / container not fixed px | N/A / OK | Flex slider, no grid. Container is `max-w-container` (80rem token). |
| Typography rem / clamp | N/A | No typography changes. |
| Spacing scale | OK | Uses the existing `px-gutter` token; no padding doubled up in the wrapper (test `FeaturedProjects.test.tsx:32`). |
| Media srcset / aspect-ratio | N/A | Images and `IMAGE_SIZES` unchanged. |
| Touch target ≥ 44px | OK (unchanged) | Dots `size-11`, arrows `size-11` unchanged. |
| Mobile nav / table | N/A | — |
| 100vh | N/A | — |
| prefers-reduced-motion | OK (unchanged) | `motion-reduce:scroll-auto` kept. |
| overflow:hidden hiding errors | OK | `overflow-hidden` on the section predates this task and isn't used to hide new overflow (docSW = viewport). |

## Skill gates
- **aislop:** skip — the CLI isn't on the reviewer's verify-command allowlist. Manual check: the diff is small and every line traces to the task.
- **oxlint (anti-slop):** skip, oxlint not configured (no `.oxlintrc*`).
- **ocr (open-code-review):** skip, ocr not installed / not on the allowlist.
- **AI-readable:** OK — clear name (`centerWhenFits`), no new function > 50 lines, no new indirection, no magic numbers. The comments explain WHY (`safe center` falls back to start alignment).
- **ai-friendly-web:** N/A — a layout change inside a block; doesn't touch robots/sitemap/llms.
- **blitzstrike:** N/A — no auth, input or API surface.

## Findings
- **[MINOR] Residual, not verified on a real mount with few cards:** dev data only has 6 featured projects. The fit case was simulated by hiding DOM nodes, and `pageCount=1` was inferred (sound per the analysis above). Suggestion: after seeding 3 projects on staging, check `/` at 1440 for no arrows/dots once hydrated. This doesn't block.
- **[MINOR] Browser support for `safe`:** Safari < 17.6 drops the declaration, so a small number of cards align left instead of centered. The Decision log explicitly accepts this as safe degradation, so no action needed.
- **[MINOR] Pre-hydrate flash** (`use-snap-slider.tsx:25`, `pageCount = count` before measuring): already listed in the task as known residual from BL-038. Out of scope; suggest a separate task.

No CRITICAL or MAJOR findings.

## Verdict
**PASS**
