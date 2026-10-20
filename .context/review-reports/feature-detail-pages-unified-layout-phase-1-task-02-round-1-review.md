Agent: reviewer

# Review — feature-detail-pages-unified-layout · phase-1-task-02 · round 1 (BL-027, MODIFY: rental detail page uses the shared detail layout)

- Review level: **NORMAL**
- Reason: the change only touches the rental page. Nothing under `src/components/detail/*` or `src/components/forms/*` changed (git diff confirms). The lead form contract (`LeadForm source="rental" sourceId={doc.id}`), the breadcrumb `jsonLd={!view.rented}` flag and the page/route are unchanged, and there is no schema/API/auth change. So there is no reason to raise the level to STRICT.
- Blast radius: `/cho-thue/[slug]` and `/en/for-rent/[slug]` (listings in `published` and `rented` state). Files: `RentalDetail.tsx`, `RentalTerms.tsx`, `SaleContactBox.tsx` (new export `RENTAL_CONTACT_HEADING_ID`), `src/lib/rentals/rental-detail-sections.ts` (new), the `page.rentalDetail.subNav*` keys in vi/en.json. Shared components are only consumed: `DetailLayout`, `DetailSection`, `DETAIL_ASIDE_CARD_CLASS`, and `LeadFormSlot` (existing `headingId` prop).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/rentals src/components/detail src/components/projects src/lib/rentals` | PASS: 15 files / 187 tests |
| `pnpm lint` | PASS: 0 errors (2 warnings already present in `tools/task-dashboard/server.mjs`, out of scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit` clean) |

## Responsive Checklist Gate (diff touches UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375/768/1280 | OK (375/1280 per builder evidence; 768 checked by CSS math) | The main column is `min-w-0`. The grid has 2 columns only from `lg` (`minmax(0,1fr)_22rem`). `RentalSpecs` uses `grid-cols-2 md:grid-cols-4` with `min-w-0` cells. The builder measured scrollWidth = clientWidth at 375 and 1280. |
| Mobile-first / no fixed px containers | OK | Only `md:`/`lg:`/`xl:` min-width variants. Card padding is `p-5 md:p-8 xl:p-10`. |
| Typography rem/scale | OK | Uses tokens `text-h2`, `text-body`, `text-xsmall`. |
| Media | OK | Gallery and video are unchanged (`VideoFacade`/`Gallery` as before). |
| Touch target ≥44px | OK | The accordion summary keeps `min-h-11`. Sub-nav and sticky CTA are shared T01 components. |
| Mobile nav / tables | N/A | Sub-nav is the shared component (T01). No tables. |
| 100vh / reduced-motion / overflow:hidden | OK | Aside uses `100dvh` (shared class). `CaretDown` has `motion-reduce:transition-none`. No overflow-hidden masking. |
| Anchors not hidden under sticky elements | **FAIL**: see M-1 | `#lead-form` lands under the sticky sub-nav. |

## Skill gates
- aislop: skip, not in the allowed verify commands (`project-config`).
- oxlint (anti-slop): skip, oxlint not configured (eslint `pnpm lint` PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK. Names are clear (`visibleRentalSections`, `RENTAL_SECTION_DOM_ID`, `RentalOverview`). Functions are ≤50 lines and `RentalDetail.tsx` is ~170 lines. The one magic value, `4.5rem`, is copied as a literal into `RentalTerms` (see m-1). Only 1 indicator, below the threshold of 3.
- ai-friendly-web: N/A (no change to robots/sitemap/llms; noindex of rented listings stays in page.tsx and was not touched).
- blitzstrike: N/A (NORMAL, no new auth/input surface).

## Checking the focus points
- Rented state: OK, and the test in `rental-detail.test.tsx:138-155` covers it. Banner `role=status`, badge, and "Căn tương tự đang trống" inside `before` (before the sub-nav) are present. The muted price and "Giá tham khảo" label are kept. Điều khoản is a closed `<details>`, the form title is "Nhận tư vấn căn tương tự", and there is still exactly 1 form. Breadcrumb `jsonLd={!view.rented}` is unchanged, and `page.tsx` (noindex / RealEstateListing JSON-LD) is not in the diff.
- One h1 (`#rental-title`), and `#overview` has `aria-labelledby` pointing to it. OK.
- Exactly one `#lead-form`, `source="rental"` with `sourceId={rentalId}`, unchanged. OK.
- `aside[aria-labelledby="rental-consult-heading"]` points to the form's h2 (via `LeadFormSlot headingId`). OK.
- vi/en i18n: both files have the same 7 keys (`subNavLabel` plus 6 `subNav.*`). OK.
- `aria-current`: comes from the shared `DetailSubNav` (T01). All 6 targets carry `tabIndex={-1}` and the right ids, and the test at line 82 confirms every href points to an existing element. OK.
- Section anchors `#overview`, `#terms`, `#description`…: `scroll-mt-[calc(var(--sticky-top)+4.5rem)]`, same as `DetailSection`. OK.

## Findings

### [MAJOR] M-1: the `#lead-form` heading is hidden under the sticky sub-nav when jumping from the bottom sticky bar (< lg)
- `src/components/rentals/SaleContactBox.tsx:74-77`: the diff removes the `scroll-mt-*` from `className`, so `LeadFormSlot` falls back to its default `scroll-mt-[calc(var(--sticky-top)+1rem)]` (`src/components/forms/LeadFormSlot.tsx:28`). On a detail page the sub-nav pill (~54px) is sticky at `--sticky-top` at every width (the builder's 375px evidence says "thanh mục con ở 8px"). Tapping `ProjectStickyCta` (`#lead-form`, lg:hidden) lands the "Nhận tư vấn" heading at about 8+16 = 24px from the top, while the sub-nav covers roughly 8–62px. The form heading ends up underneath it.
- T01 already fixed this for projects (M-1 there): `ProjectDetail.tsx:101` passes `className={DETAIL_ASIDE_CARD_CLASS}`, which carries `scroll-mt-[calc(var(--sticky-top)+4.5rem)]`, and `project-detail.test.tsx:149-150` asserts it. The rental page does not follow that pattern. This breaks the acceptance item "neo không bị che" (anchors not covered) and the focus point "anchors not covered (--sticky-top)".
- Test gives false confidence: `rental-detail.test.tsx:133` only checks `toContain("--sticky-top")`, which the default `+1rem` also satisfies.
- Suggested fix: in `SaleContactBox`, add `scroll-mt-[calc(var(--sticky-top)+4.5rem)]` to the `LeadFormSlot` className. Alternatively, make `#lead-form` the card itself like the project page: put `DETAIL_ASIDE_CARD_CLASS` on `LeadFormSlot` and move price/contact into it, but that is a bigger change. Tighten the test to `toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]")`.

### [MINOR] m-1: `RentalTerms` (rented state) duplicates the frame class of `DetailSection`
- `src/components/rentals/RentalTerms.tsx:54`: the class string `scroll-mt-[calc(var(--sticky-top)+4.5rem)] border-t border-border py-section-tight first:border-t-0 focus:outline-none` is copied from `DetailSection.tsx:9,29`. If `DetailSection` changes its spacing or offset, the rented terms block will drift out of sync. The reason is valid (avoiding a second h2 when the summary is the heading), and the code comment explains it, so this does not block. Proposed follow-up (separate task, since it touches a shared component): export the frame class constant from `DetailSection`, or add a `variant="collapsible"`.
- The `<div id="terms">` wrapper has no `aria-labelledby`/role. It is fine (not a landmark), just noted.

### [MINOR] m-2: on a rented listing, clicking "Điều khoản" scrolls to a closed accordion and does not open it
- `RentalTerms.tsx:55`. The user lands on a single summary line, which is a mildly confusing UX. Matching the project page's `#documents` behaviour (open on anchor jump) would be consistent, but that requires a client component. Since the user settled that terms stay collapsed on rented listings, this is accepted as residual and does not block.

### [MINOR] m-3: the "Chi tiết" heading inside Tổng quan keeps `h2 text-h2-sm`, while the other sections use `text-h2`
- `RentalSpecs.tsx` (`RentalDetails`). The task records this as residual. It is a visual mismatch only.

## Verdict: FAIL

1 MAJOR (M-1). After fixing M-1 and tightening the test at line 133, rerun `pnpm vitest run src/components/rentals`. A FAST round 2 is enough.

## Files with real content changes (to stage when PASS)
- `src/components/rentals/RentalDetail.tsx`
- `src/components/rentals/RentalTerms.tsx`
- `src/components/rentals/SaleContactBox.tsx`
- `src/components/rentals/rental-detail.test.tsx` (new)
- `src/lib/rentals/rental-detail-sections.ts` (new)
- `src/lib/rentals/rental-detail-sections.test.ts` (new)
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`
- `tasks/feature-detail-pages-unified-layout/phase-1-task-02.md`
- Do NOT stage: `next.config.ts`, `src/payload-types.ts`, `.claude/launch.json`, `template-feedback.md`, `.context/runs/*`, or `src/components/projects/*` (only line endings differ, out of scope).

## Residual risk
- 768px and the rented state were not checked visually (no browser); only CSS reasoning and DOM tests.
- ≥ lg: `#lead-form` sits inside the sticky, internally scrolling aside card. Jumping to the anchor scrolls inside the card; the effect was not verified visually (`ProjectStickyCta` is lg:hidden, so the risk is low).
