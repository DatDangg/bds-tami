Agent: reviewer

# Review — bug-home-section-heading-consistency · phase-1-task-01 · round 1 (BL-101)

- **Review level:** NORMAL
- **Reason:** Change is UI-only on the homepage. It adds two presentational components under `src/components/home/` (used only by the homepage) and edits 5 homepage blocks. There are no API/DTO, schema, auth, tenant, data or cache-key changes, so STRICT is not required. FAST is not enough because the change touches several blocks and adds shared components.
- **Blast radius:** `/` and `/en` homepage blocks Featured Projects, Services, Featured Offers, Rentals and News. New files `SectionHeading.tsx` and `SectionMoreLink.tsx`; a search shows they are imported only from `src/components/home/*`. Link targets (href), i18n keys and `aria-labelledby`/`labelledBy` ids are unchanged.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, no warnings in output) |
| `pnpm test src/components/home` | PASS — 13 files / 119 tests |

The full `pnpm test` run (461 files / 4847 tests) is reported by Builder. I did not rerun it; the targeted run is within the scope agreed for this review.

## Requirements coverage
- **Projects:** markup/classes in `SectionHeading` match the old header (`flex flex-col items-center gap-3 text-center`, eyebrow, h2 `font-display text-h2`, span `h-0.5 w-12 bg-primary` aria-hidden, description `max-w-[80ch]`). `mb-10` moved from the outer container to the inner div. The outer div is a block with only horizontal padding, so the bottom margin collapses through it and the effective spacing to the slider is still 40px. The content width is unchanged (max-w-container + px-gutter on the outer div). Before/after 1440 images show the block unchanged.
- **Services:** heading is now centered with the bar; no button added (correct per design A). The after-1440/390 images show "Dịch vụ" centered.
- **Offers:** heading + bar; button switched to `SectionMoreLink`; href is unchanged.
- **Rentals:** `className="mb-8"` goes through `cn` (an extended tailwind-merge), so `mb-8` replaces `mb-10`. `SectionHeading.test.tsx` covers this with `not.toHaveClass("mb-10")`. Each tab's button keeps its own `tab.href`. The heading block is 14px taller (gap-3 + 2px bar), which is expected from the decorative bar.
- **News:** only the button changes; the 2-column layout and left-aligned heading are kept, and `mt-2` is passed via className. On `.theme-dark-block`, `--color-text` maps to on-dark and `--color-accent-text` to on-dark-accent, and the focus ring uses `--color-focus-ring` → on-dark-accent (globals.css:222-231). Ghost `text-text` therefore has enough contrast (AA) on dark. Not checked in a browser: News is not enabled on dev (see Residual risk).
- **Ghost on bg-alt (Offers/Projects):** `text-text` #141414; hover is `accent-text` #8c6733. Same variant Projects already used, so no regression.
- **A11y:** the h2 `id` is still the `useId()` value referenced by `aria-labelledby`/`labelledBy`. The arrow is `aria-hidden="true"`. Focus-visible uses the global outline (globals.css:374), same as the shared Button. The accessible name of the link is unchanged ("Xem thêm" / "Xem tất cả" / "Xem tất cả dự án"), and existing tests that look up links by name still pass.
- **Over-engineering:** none. There is no `align` variant and no extra props. `SectionMoreLink` is about 10 lines.

## Responsive Checklist Gate (only the UI change in this diff)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder measured scrollWidth = viewport at 390/768/1440. The after-390 image shows no overflow; the heading is a flex column with no fixed width. |
| Mobile-first / grid / container | OK / N/A | No new media queries or grids; reuses `max-w-container px-gutter`. |
| Typography rem/fluid | OK | Reuses the existing tokens `text-h2`, `text-lead`, `text-eyebrow`. |
| Media | N/A | No new image or video. |
| Touch target ≥44px | OK | Button default size `md` = `h-11` (44px). |
| Nav/table | N/A | Not touched. |
| 100vh / reduced-motion / overflow hiding | N/A | Not used or added. |

## Skill gates
- aislop: skip — not run (not in the allowed verify commands). Manual review found no slop: small diff with no dead code.
- oxlint (anti-slop): skip, oxlint not configured. ESLint PASS.
- ocr: skip, ocr not installed / not in the allowed verify commands.
- AI-readable: OK — clear names, short functions, no magic numbers, 1 level of indirection. 0 indicators.
- ai-friendly-web: N/A — no change to crawl/robots/sitemap.
- blitzstrike: N/A — not a STRICT/sensitive task.

## Findings
- **[MINOR]** `src/components/home/SectionHeading.tsx:7-9`: one JSDoc comment ("Dòng nhỏ trên tiêu đề / mô tả dưới tiêu đề; thiếu thì ẩn") covers both `eyebrow` and `description`, but TS tooling attaches it only to `eyebrow`. Suggested fix: write a separate JSDoc for each prop. Does not block.
- **[MINOR]** `src/components/home/HomeNews.test.tsx` (BL-101 case): the "heading stays left-aligned" check only asserts that `parentElement` lacks `text-center`. It is a weak check, but enough to catch someone replacing it with `SectionHeading`. Optional: also assert that there is no `span.w-12` right after the h2. Does not block.
- Close-out reminder (not a defect): the doc impact `.context/design-spec.md` S01.4/5/8/9 (as-built BL-101) has not been updated yet. change-request should do this at close-out.

No CRITICAL/MAJOR findings.

## Repro Verification
Status is `PASS`. Evidence: new tests (SectionHeading.test.tsx, plus the BL-101 cases in HomeBlocks, HomeRentals and HomeNews) pass on rerun, and the before/after images (vi/en × 1920/1440/768/390) are in place. I checked after-vi-1440, after-vi-390 and before-vi-1440: the Services heading is centered after the fix, the Offers and Rentals buttons are ghost with an arrow, and Projects is unchanged.

## Residual risk
- News on `.theme-dark-block` has no screenshot (the block is not enabled on dev). Contrast was verified from CSS tokens and unit tests only.
- At the downscaled image resolution, the 48×2 bar is hard to see. Bar presence is confirmed by unit tests and Builder's Playwright measurements.

## Verdict
✅ **PASS**
