Agent: reviewer

# Review — feature-detail-pages-unified-layout · phase-1-task-02 · round 2 (BL-027, MODIFY: rental detail page uses the shared detail layout)

- Review level: **FAST**
- Reason: round 2 only has to confirm the fix for M-1 from round 1: one className on `LeadFormSlot`, a tighter test assertion, and one heading class in `RentalSpecs`. No shared component, API, auth, schema or contract changed. Builder tests pass. I still re-read the whole T02 diff (`git diff -- src/components/rentals src/i18n src/lib` plus the untracked new files) to check for regressions.
- Blast radius: `/cho-thue/[slug]` and `/en/for-rent/[slug]` (published and rented listings). Files: `SaleContactBox.tsx` (the `#lead-form` scroll offset), `RentalSpecs.tsx` (the size of the "Chi tiết" heading), `rental-detail.test.tsx`. Everything else is unchanged since round 1.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/rentals src/components/detail src/components/projects src/lib/rentals` | PASS: 15 files / 187 tests |
| `pnpm lint` | PASS: 0 errors (2 warnings already present in `tools/task-dashboard/server.mjs`, out of scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit` clean) |

## M-1 closure
- `src/components/rentals/SaleContactBox.tsx:74-78`: `LeadFormSlot` now gets `className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] bg-transparent p-0 lg:p-0"`.
- `LeadFormSlot.tsx:28` builds its class with `cn("scroll-mt-[calc(var(--sticky-top)+1rem)] …", className)`. tailwind-merge treats both arbitrary `scroll-mt-[…]` values as the same group, so the `+4.5rem` value from the caller replaces the default `+1rem`.
- The offset now matches `DetailSection` and the project page (`DETAIL_ASIDE_CARD_CLASS`). Jumping from `ProjectStickyCta` (< lg) leaves room for the sticky sub-nav pill (about 54px), so the form heading is no longer hidden under it. **Fixed.**
- `rental-detail.test.tsx:133` now asserts the exact class `scroll-mt-[calc(var(--sticky-top)+4.5rem)]`. The default `+1rem` no longer satisfies it, so the false-confidence problem is gone. **Fixed.**

## Regression check (whole T02 diff)
- Rented state: banner, badge, similar listings in `before`, muted price and "Giá tham khảo", collapsed `<details>` for terms, form title for similar units, and breadcrumb `jsonLd={!view.rented}`. All unchanged from round 1. OK.
- There is still one `#lead-form`, with `source="rental"` and `sourceId={rentalId}`. `headingId=RENTAL_CONTACT_HEADING_ID` still labels the `<aside>`. OK.
- One `h1` (`#rental-title`), and every sub-nav target id/`tabIndex={-1}` is unchanged. vi/en `subNav*` keys still match. OK.
- `RentalSpecs.tsx:63`: "Chi tiết" changed from `text-h2-sm` to `text-h2`, matching the `DetailSection` headings. This closes MINOR m-3 from round 1. It is a class change only, with no impact on structure or a11y. OK.

## Responsive Checklist Gate (diff touches UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375/768/1280 | OK (by CSS math, as in round 1) | The round-2 changes are a `scroll-mt` change and a font-size token change only. Layout and width did not change. |
| Mobile-first / no fixed px containers | OK | No new media queries or px widths. |
| Typography rem/scale | OK | `text-h2` is a token on the fluid scale. |
| Media | N/A | Not touched. |
| Touch target ≥44px | OK | Not changed (`min-h-11` summary, shared sticky CTA). |
| Mobile nav / tables | N/A | Shared sub-nav from T01. No tables. |
| 100vh / reduced-motion / overflow:hidden | OK | Not changed since round 1. |
| Anchors not hidden under sticky elements | **OK** | `#lead-form` now uses `--sticky-top + 4.5rem`, the same as the section anchors (M-1 closed). |

## Skill gates
- aislop: skip, not in the allowed verify commands (`project-config`).
- oxlint (anti-slop): skip, oxlint not configured (eslint `pnpm lint` PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK, 1 indicator (the `4.5rem` literal is repeated, see m-1). Below the threshold of 3.
- ai-friendly-web: N/A (robots/sitemap/llms/noindex not touched).
- blitzstrike: N/A (FAST, no new auth/input surface).

## Findings

### [MINOR] m-1 (carried from round 1, does not block): the sticky offset literal is duplicated
- `scroll-mt-[calc(var(--sticky-top)+4.5rem)]` is now written literally in `SaleContactBox.tsx:77`, `RentalTerms.tsx:54` and `RentalDetail.tsx` (`RentalOverview`), as well as in the shared `DetailSection` and `DETAIL_ASIDE_CARD_CLASS`. If the sub-nav height changes, these copies can drift apart.
- Proposed follow-up (separate task, since it touches a shared component): export a constant such as `DETAIL_ANCHOR_SCROLL_MT` from `components/detail`.

### [MINOR] m-2 (carried, accepted residual): on a rented listing, the "Điều khoản" anchor lands on a closed accordion and does not open it
- Same as round 1. The user agreed that terms stay collapsed on rented listings.

### [MINOR] m-3 (new, optional): the test does not assert that the default offset was removed
- `rental-detail.test.tsx:133` could also check `expect(slot.className).not.toContain("+1rem)")`. That would catch a future `LeadFormSlot` change that stops using `cn`/twMerge and leaves both `scroll-mt` classes in the output. This does not block, because twMerge is in place today.

## Verdict: PASS

M-1 is fixed and the test now proves it. There are no CRITICAL or MAJOR findings and no regression in the T02 diff. Verify: 187/187 tests, lint 0 errors, typecheck clean.

## Files to stage (task T02)
- `src/components/rentals/RentalDetail.tsx`
- `src/components/rentals/RentalSpecs.tsx`
- `src/components/rentals/RentalTerms.tsx`
- `src/components/rentals/SaleContactBox.tsx`
- `src/components/rentals/rental-detail.test.tsx` (new)
- `src/lib/rentals/rental-detail-sections.ts` (new)
- `src/lib/rentals/rental-detail-sections.test.ts` (new)
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`
- `tasks/feature-detail-pages-unified-layout/phase-1-task-02.md`
- Review reports: `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-02-round-1-review.md` and `-round-2-review.md`
- Do NOT stage: `next.config.ts`, `src/payload-types.ts`, `.claude/launch.json`, `template-feedback.md`, `.context/runs/*`, or `src/components/projects/*` (only line endings differ).

## Residual risk
- No browser available: 768px and the real jump from the sticky CTA to `#lead-form` were checked only by CSS math and DOM tests.
- ≥ lg: `#lead-form` sits inside the sticky aside card that scrolls internally. The anchor behaviour there was not checked visually. The risk is low because `ProjectStickyCta` is `lg:hidden`.
