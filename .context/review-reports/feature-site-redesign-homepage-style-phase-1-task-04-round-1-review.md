Agent: reviewer

# Review: feature-site-redesign-homepage-style, phase-1-task-04, round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-a9ea061e06407b577`, branch `worktree-agent-a9ea061e06407b577`, HEAD `ffc31b8` (= staging base, confirmed). Nothing committed; the diff below is the working tree plus untracked files.
- Task: `tasks/feature-site-redesign-homepage-style/phase-1-task-04.md`
- Ignored as instructed: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` (EOL/regen only)

## Review level: STRICT
**Reason:** The task changes shared detail components (`DetailLayout`, `DetailSection`, `ConsultBanner`). Those also render Tin BĐS, tin tức, cho thuê, việc làm and dịch vụ, and T05 will reuse them. It also changes the public project detail page (SEO, JSON-LD, LCP) and adds client carousel, lightbox and share code.

## Blast radius
- `/du-an/[slug]` and `/en/projects/[slug]`: layout fully replaced (ProjectHero deleted, Gallery section removed, hero CTA buttons removed).
- `DetailLayout` gets a new `sectionStyle` prop that defaults to `"single"`. The single branch renders the same DOM/class as before (`rounded-[28px] bg-surface p-5 md:p-8 xl:p-10`). Pages that don't pass the prop (PostDetail/tin-bds, tin-tuc, cho-thue, việc làm/dịch vụ from T07) are unchanged.
- `DetailSection`: the `default` tone adds `group-data-[section-style=cards]/detail:*` variants. These only take effect inside an ancestor with `group/detail` and `data-section-style="cards"`, which exists only in the cards branch. Single pages are unaffected; this is checked by the new test `DetailLayout sectionStyle="cards"` → "mặc định (single)". `eyebrow` is optional, and the `h2` keeps `mb-8 text-h2` when no eyebrow is passed.
- `ConsultBanner`: new optional prop `secondary`. It is additive, and when it is not passed the CMS secondary button is kept (test added).
- `LegalPolicy`: new optional prop `eyebrow`. It is additive.
- `project-detail-view.ts`: `SECTION_IDS`/`SECTION_DOM_ID` drop `gallery` (Q7). Typecheck is clean, so no other consumer depends on it.
- i18n: adds `page.detail.*` and `page.projectDetail.facts|similar`. T07 also writes `vi/en.json`, so a merge conflict is possible in the same region (residual risk).

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 warnings in `tools/task-dashboard/server.mjs`, both pre-existing and outside this diff |
| `pnpm vitest run src` | PASS: 250 files / 2457 tests |
| Related integration tests | skip: shared DB while T07/T03/T06 run in parallel. The diff touches no query, schema or collection, only view/UI (residual risk, low) |

## Requirement checks (from the brief)
| Item | Result | Evidence |
|---|---|---|
| Map, nearby, floor plan, price table, FAQ, legal/documents still present | OK | `ProjectDetail.tsx` still renders `ProjectLocation`/`ProjectAmenities`/`FloorPlans`/`LegalPolicy`/`PriceTable`/`ProjectFaq`. `project-market-blocks.test` checks section order and that every anchor exists. `#documents` is still inside `#legal`. |
| Lead form (only one), aside sticky card | OK | Tests: `#lead-form` ×1, `form` ×1, `aside[aria-labelledby]`, scroll-mt. |
| Subnav scroll-spy | OK | `visibleSections` and `SECTION_DOM_ID` match; the nav test checks that every href points to a real element. |
| Exactly one `h1` | OK | The `h1` is only in `DetailTitleCard`; tests `getAllByRole(heading level 1)` → 1. |
| JSON-LD | OK | `page.tsx` keeps `JsonLd` RealEstateListing unchanged; FAQPage JSON-LD stays in `ProjectFaq`. |
| LCP | OK | Image 0 is `priority` and `sizes=100vw`; tests confirm a single `fetchpriority="high"`. Later images and thumbnails are not priority. |
| Lightbox a11y | OK | Reuses `Lightbox` with `returnFocusRef` (focus returns to "Xem tất cả ảnh"); test covers "Esc đóng". Image alt comes from media (no longer `decorative` like the old hero). Thumbnails are decorative inside a button that has an `aria-label`. |
| Share fallback | OK | `DetailShareButton`: Web Share; otherwise, or on a non-Abort error, opens the `ShareButtons` menu. Esc closes and returns focus, click outside closes. Test covers both branches. |
| i18n vi/en | OK | The en and vi key sets match. The `/en` test confirms no Vietnamese leaks (`Chia sẻ`, `Giá từ`, ...). |
| No invented hex | OK | No `#rrggbb` added. Everything uses tokens (`bg-dark-deep`, `text-accent-text`, `bg-primary-subtle`, `text-on-dark`...). |
| No heart icon | OK | Not present in `DetailTitleCard` or `SimilarProjects` (uses `ProjectCard` from T02). |
| Similar-projects slider uses `CardSlider` | OK | `SimilarProjects` → `CardSlider` (dots are owned by T02's CardSlider, based on pageCount). White background, heading aligned left (`SectionHeading`). Empty → not rendered (tested). |
| Consult banner at the bottom: `#lead-form` + `tel:` | OK | `page.tsx` passes `actionHref="#lead-form"` plus `secondary` tel when a hotline exists; tested in `page.test.tsx`. |
| Default `sectionStyle` doesn't break other pages | OK | See Blast radius. |

## Responsive Checklist Gate (diff touches UI)
Breakpoints from profile: 375/640/768/1024/1280/1536. No browser available to me; checked via CSS math plus the builder's screenshots (`assets/site-redesign-t04-390-hero.jpg`, `-1440-titlecard-cards.jpg`, `-1440-hero.jpg`, `-1440-gallery-12imgs.jpg`, `-1440-similar-aligned.jpg`).
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Gallery uses `overflow-hidden` on a decorative box only (not hiding layout errors). Title card is `w-full max-w-container px-gutter` with `min-w-0`. Facts are `grid-cols-2` at 375 (≈140px per cell, icon 44 + text uses `min-w-0` + `break-words` + `line-clamp-2`). Share menu has `max-w-[calc(100vw-2rem)]`. The 390 screenshot shows no overflow. |
| Mobile-first `min-width` | OK | Base classes are mobile; `md:`/`lg:` scale up (arrows `hidden md:inline-flex`, thumbnails `hidden lg:flex`). |
| Grid not fixed-column | OK | Facts `grid-cols-2` → `md:grid-cols-4`; title card `md:grid-cols-[1fr_auto]`. Slider is CardSlider (T02). |
| Typography in rem/token | OK | Text uses tokens (`text-h2-sm`, `text-price`, `text-h4`, `text-small`, `text-eyebrow`). No px font-size. |
| Media | OK | `ResponsiveImage` with `sizes`; gallery has a fixed height (480px / `min(78vh,640px)`) so no CLS; Similar `sizes` matches slide width. |
| Touch target ≥ 44px | OK | Arrows `size-12`, share `size-11`, view-all `min-h-11`, thumbnails 72×52. Arrows are hidden on mobile; swipe replaces them. |
| Nav/table on mobile | OK | Subnav chips are unchanged (BL-027). PriceTable keeps its scroll region. |
| Viewport units | OK | Mobile uses fixed `h-[480px]`. `78vh` applies only at `md+` and is capped at 640px, per the task spec. |
| prefers-reduced-motion | OK | Progress bar uses `motion-reduce:transition-none`. No autoplay. |

## Skill gates
- aislop: skip, aislop is not installed.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc.json`/`oxlint.json`). ESLint is PASS.
- ocr (open-code-review): skip, ocr is not installed.
- AI-readable: OK, 2 of the 3 indicators needed to fail.
  - (1) Function longer than 50 lines: `DetailGalleryHero` (~125 lines of JSX).
  - (2) Some magic px values: `h-[52px] w-[72px]`, `md:bottom-[76px]`, `md:w-[120px]`.
  - No WHAT comments: comments explain why (mockup, Q7, AbortError realm...). Naming is clear. The README/DESIGN doc update is scheduled for T08 per the task's Doc impact.
- ai-friendly-web: N/A. The task doesn't touch robots/sitemap/llms; detail pages are already covered by existing SEO.
- blitzstrike: N/A. No auth/API/input changes. The external link only appears for an http(s) `developer.website` and keeps `rel="noopener noreferrer"`. Share uses the canonical URL from the server.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
1. **Pháp lý / Chính sách headings are a different size from the other cards.** `src/components/projects/LegalPolicy.tsx:281` keeps `font-display text-h2`. `DetailSection` with an eyebrow uses `text-h3` (`DetailSection.tsx:211`), and the mockup's `.block h2{font-size:var(--text-h3)}` sets every card heading to h3. On the same page the Pháp lý/Chính sách titles are therefore larger than Tổng quan, Vị trí, etc. Fix: when `block.eyebrow` is present, use `text-h3` (same rule as `DetailSection`).
2. **i18n keys left with no consumer** after removing ProjectHero, the Gallery section and the old CtaBanner: `page.projectDetail.heroConsult`, `heroDocuments`, `visitCta.title|description|button`, `relatedTitle`, `sections.gallery` (plus the subnav "gallery" label if it exists) in `src/i18n/messages/{vi,en}.json`. Only `visitCta.hotline` is still used (`du-an/[slug]/page.tsx:111`). Fix: remove the dead keys, or note them for T08 cleanup.
3. **Duplicate information** between the title card and Tổng quan. `ProjectSpecs` still shows "Loại hình" (already the title card eyebrow) and "Giá từ" (already the title card price); see screenshot `1440-titlecard-cards`. The task says "phần thông số còn lại vào Tổng quan", so this is a UX choice; consider dropping `categoryName` and `priceFromVnd` from `ProjectSpecs`.
4. **`DetailGalleryHero` is long (~125 lines).** Fix: extract the thumbnail strip (`ul` of thumbnails) and the counter into small sub-components for readability before T05 reuses it.
5. `aria-roledescription="carousel"` is still set when there is only 1 image (`DetailGalleryHero.tsx:78`). Minor; it could be applied only when `multiple`.

## Residual risk
- No live browser checks at 375/768/1280 by me; I relied on CSS math plus the builder's screenshots. The 12-image gallery state was only seen on the builder's temporary preview page (dev DB has 1 image per project; seeding is in T08).
- Integration tests were not run separately because the DB is shared with tasks running in parallel. The diff touches no query/schema.
- `vi/en.json` may conflict with T07 (new namespace `page.detail.*`) at merge time. The dispatcher needs to check that both keep `page.detail.gallery|share|eyebrow`.
- The old hero buttons "Nhận tư vấn" and "Tải tài liệu" are gone on desktop. The lead form is still in the sticky aside, and the mobile sticky bar still exists. This change follows the mockup and Q7/Q8.

## Verdict: PASS
No CRITICAL or MAJOR findings. Typecheck, lint and vitest all pass. The default `single` style leaves the other detail pages unchanged. The 5 MINOR findings can be fixed in this task or deferred to T08.
