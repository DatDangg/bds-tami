Agent: reviewer

# Review: feature-detail-pages-unified-layout, phase-1-task-01, round 3 (BL-027, MODIFY) — final round

- **Review level:** STRICT
- **Reason:** The change touches the shared header (`.site-header`) on every `(frontend)` route, the shared `--sticky-top` variable (sticky positions + every scroll-margin on the detail page), `LeadFormSlot` (used on several pages) and the new shared `src/components/detail/*` components that T02 will reuse. Round 2 failed on a navigation/anchor regression (M-2).
- **Blast radius:**
  - Header on all public pages. The new behaviour only applies when `html:has([data-detail-page])` matches, which today means only `/du-an/[slug]` and `/en/projects/[slug]` (`DetailLayout.tsx`).
  - Every anchor on the project detail page: `#overview…#faq`, `#documents` (hero "Tải tài liệu"), `#lead-form` (hero "Nhận tư vấn", bottom CTA, `ProjectStickyCta`), and the sticky consult card.
  - `LeadFormSlot` on other pages: `--sticky-top` = `--header-offset` there (`:root`), so `scroll-mt-[calc(var(--sticky-top)+1rem)]` is identical to before.
- **User decision applied (2026-10-20):** "Cho sửa vòng 3: đặt lại khoảng dính của thanh mục con 8/16px cố định trên mọi trang chi tiết, chấp nhận rủi ro lúc trang chưa tải xong JS." → m-1 (no JS / before hydration the full-height header covers the stuck sub-nav) is a user-accepted risk, not a blocker.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/projects src/components/detail src/components/layout src/components/forms` | PASS: 26 files, 236 tests |
| `pnpm lint` | PASS: 0 errors. 2 old warnings in `tools/task-dashboard/server.mjs` (outside scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no output) |

## Check of earlier findings
| Finding | Status | Evidence |
|---|---|---|
| M-2 (anchors jumped to from the top land ~88/72px too low) | **FIXED** | `globals.css`: `html:has([data-detail-page]) { --sticky-top: 0.5rem }` + `@media (min-width:64rem) { … 1rem }`, no `data-scrolled` dependency. `scroll-margin` is now the same value before and after the header hides, so a jump at scrollY 0 targets 16+72 = 88px (lg) / 8+72 = 80px (< lg). `#lead-form`: `LeadFormSlot`'s own `scroll-mt-[calc(var(--sticky-top)+1rem)]` is overridden by `DETAIL_ASIDE_CARD_CLASS`'s `scroll-mt-[calc(var(--sticky-top)+4.5rem)]` via `cn` (tailwind-merge, same utility group, last wins) → 88px at 1280, consistent with the builder's 88px measurement. Test `detail-header-css.test.ts:12-23` pins exactly two detail rules `["0.5rem","1rem"]`, selector `html:has([data-detail-page])`, no `data-scrolled`. |
| m-5 (sub-nav jumps 104→16px while header is still sliding) | **FIXED** (removed by fix a) | `--sticky-top` no longer changes at runtime, so `top` of the sub-nav never jumps. |
| m-6 (stale `:focus-within` text; m-2 not in Residual risk) | **FIXED** | Task file D1 (`phase-1-task-01.md:19`) and Residual risk (`:65`, `:68`, `:69`) now say `:has(:focus-visible)`; m-2 `OBSERVER_MARGIN` listed at `:68`. D2 (`:21`) describes the fixed value + round-3 user decision. |
| M-1 (`:focus-within` keeps header over sub-nav) | **Still FIXED** | `globals.css`: `html:has([data-detail-page]) .site-header[data-scrolled]:not(:has(:focus-visible)) { transform: translateY(-100%) }` unchanged; test `detail-header-css.test.ts:7-10` + `:25-29` (transform, no visibility). |
| m-1 (no JS / pre-hydration) | **User-accepted risk** | Recorded in task Residual risk (a) `:66` and in the globals.css comment. |
| m-2 (`OBSERVER_MARGIN` approx / wrong without `:has()`) | Accepted residual | `DetailSubNav.tsx:14` `-88px`; recorded `:68`. |
| m-3 | Fixed (round 2) | unchanged |
| m-4 (EOL noise) | Close-out item | see staging list below |

## New-regression check (whole T01 diff)
- `:root { --sticky-top: var(--header-offset) }` keeps every non-detail page identical (LeadFormSlot is the only consumer outside the detail page). OK.
- Without `:has()` support the whole detail block is dropped: header floats as BL-025, `--sticky-top` = `--header-offset`. Consistent. OK.
- At page top (no `data-scrolled`) the header is visible full height, but the sub-nav sits below hero/breadcrumb in flow and is not stuck yet, so the 8/16px `top` does not overlap. Once scrolled > 4px the header hides. OK.
- Anchor jump from the top: target is computed with 88/80px and stays correct after the header hides (M-2 closed). The header, being `sticky top-0` with z-header, still overlaps the already-stuck sub-nav for `--duration-slow` while it slides out (transient, cosmetic; reduced-motion = instant). See m-7.
- `DetailSubNav`: label via prop (`t("subNavLabel")` passed from `ProjectDetail`), active `bg-primary text-primary-foreground`, focus-visible outline token, `min-h-11` kept. OK.
- `DetailLayout`: `data-detail-page`, `bg-primary-subtle`, white card `rounded-[28px]`, aside grid `minmax(0,1fr)_22rem` / xl `24rem`, `aria-labelledby` only when provided. OK.
- `ProjectDetail`: same blocks/conditions/order, single `#lead-form`, related + CtaBanner in `after`, `ClickRefMarker` + `ProjectStickyCta` kept. OK.
- No leftover `ProjectSubNav` / `ProjectSection` file or import under `src/` (Grep: no matches).

## Files with real content changes to stage (excluding EOL-only)
`git diff --ignore-cr-at-eol --stat` vs `git diff --stat` (same 19 files; the remaining `M` files are EOL/stat-only):

Modified (real content):
- `src/app/(frontend)/globals.css`
- `src/components/detail/DetailSection.tsx` (renamed from `src/components/projects/ProjectSection.tsx` — stage the deletion of the old path too)
- `src/components/detail/DetailSubNav.tsx` (renamed from `src/components/projects/ProjectSubNav.tsx` — stage the deletion of the old path too)
- `src/components/forms/LeadFormSlot.tsx`
- `src/components/layout/HeaderFrame.tsx` (comment only)
- `src/components/projects/Documents.tsx`
- `src/components/projects/LegalPolicy.tsx`
- `src/components/projects/PriceTable.tsx`
- `src/components/projects/ProjectAmenities.tsx`
- `src/components/projects/ProjectDetail.tsx`
- `src/components/projects/ProjectFaq.tsx`
- `src/components/projects/ProjectHighlights.tsx`
- `src/components/projects/ProjectListings.tsx`
- `src/components/projects/ProjectLocation.tsx`
- `src/components/projects/ProjectOverview.tsx`
- `src/components/projects/project-detail.test.tsx`

New (untracked):
- `src/components/detail/DetailLayout.tsx`
- `src/components/detail/DetailLayout.test.tsx`
- `src/components/detail/detail-header-css.test.ts`
- `tasks/feature-detail-pages-unified-layout/` (task files)
- `spec/changes/2026-10-20-detail-pages-unified-layout.md` (change doc)

Do NOT stage (EOL-only): `FloorPlans.tsx`, `NearbyTabs.tsx`, `ProjectCard.tsx`, `ProjectFilters.tsx`, `ProjectHero.tsx`, `ProjectListPage.tsx`, `ProjectListPage.test.tsx`, `project-components.test.tsx`, `project-filter-params.test.tsx`, `project-market-blocks.test.tsx`.
User's pre-existing dirty files (ignored per instruction; `.context/progress.json` / `spec/changes/BACKLOG.md` are updated by close-out separately): `next.config.ts`, `src/payload-types.ts`, `.claude/launch.json`, `template-feedback.md`, `.context/runs/*`.

## Responsive Checklist Gate (375 / 768 / 1280)
Attempt 3 only changed two `--sticky-top` selectors; no layout/grid/typography changes. Round 1/2 results still hold.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder measured scrollWidth = clientWidth at 375/1280 (attempt 1); 768 not measured (residual). No width-affecting change since. |
| Mobile-first min-width | OK | `@media (min-width: 64rem)` |
| Grid without fixed columns | OK | `minmax(0,1fr)_22rem` only ≥ lg; single column below |
| Container not fixed px | OK | `max-w-container px-gutter` |
| Typography rem/clamp | OK | Tokens only (`text-h2`, `text-small`) |
| Spacing scale | OK | `0.5rem/1rem`, token paddings |
| Media | N/A | No new media |
| Touch target ≥ 44 | OK | Sub-nav items `min-h-11` |
| Nav on mobile | OK | Sub-nav scrolls horizontally; hamburger unchanged |
| Table wrapper | OK | PriceTable `role=region` horizontal scroll (unchanged) |
| 100vh | OK | `100dvh` in aside max-h |
| prefers-reduced-motion | OK | `transition: none` for detail header |
| overflow:hidden masking | OK | Not used (aside uses `overflow-y-auto` for intended inner scroll) |

## Skill gates
- **aislop:** skip — not among allowed verify commands.
- **oxlint (anti-slop):** skip, oxlint not configured. eslint 0 errors.
- **ocr:** skip, ocr not installed / not in allowed commands.
- **AI-readable:** OK — CSS comment explains WHY (round 3 decision, accepted risk); test names clear; no new magic numbers beyond documented 54+18px; < 3 indicators.
- **ai-friendly-web:** N/A — robots/sitemap/llms untouched; layout-only change.
- **blitzstrike:** N/A — no auth/input/API changes.

## Findings

### [CRITICAL]
- None.

### [MAJOR]
- None.

### [MINOR]
- **m-7. Transient overlap right after an anchor jump from the top.** When the hero "Nhận tư vấn"/"Tải tài liệu" is clicked at scrollY 0, the target lands correctly (88/80px) and the sub-nav is already stuck at 16/8px, but the header (sticky, higher z) takes `--duration-slow` to slide out, covering the sub-nav during that time. Final state is correct; cosmetic and brief. Record in task Residual risk at close-out; no code change required.
- **m-8. Evidence not recorded in task file.** The attempt-3 Verification summary (`phase-1-task-01.md:59`) lists test/lint/typecheck but not the 88px `#lead-form` browser measurement reported by the builder, and line 58 still says "chưa kiểm lại bằng mắt sau attempt 2". Add the attempt-3 measurement (width, target, landing px) at close-out.
- **m-4 (carried).** Stage only the files listed above; leave EOL-only files unstaged.

## Residual risk
- Not verified in a browser by the reviewer: Tab focus-visible behaviour after Radix menu close (Safari/Firefox), 768px, reduced motion, no-`:has()` fallback, sub-nav landing at < lg. Analysis is by CSS math; builder measured `#lead-form` at 88px (1280).
- m-1 (no JS / pre-hydration header covers stuck sub-nav) — accepted by user 2026-10-20.
- m-2 `OBSERVER_MARGIN` approximate — accepted residual.

## Verdict
**PASS.** M-2, m-5 and m-6 are fixed; M-1 remains fixed; no new CRITICAL/MAJOR regression. Verify commands all PASS. Only MINOR close-out items (m-7, m-8, m-4) remain.
