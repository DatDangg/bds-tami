Agent: reviewer

# Review — feature-news-card-hover-brand-color · phase-1-task-01 · round 1 (BL-034, MODIFY)

- **Review level:** NORMAL
- **Reason:** The change only swaps Tailwind classes on card titles (no logic, API, schema or auth). The cards are shared components used on many list pages and the home page, so this gets NORMAL rather than FAST. Nothing hits a STRICT trigger.
- **Blast radius:** `NewsCard` (all variants, including the dark News block on the home page), `PostCard`, `OfferBox` (post detail), `ProjectCard`, `RentalCard`, `JobCard`, `ProjectsSlider`, plus the pages that render these cards. Only the title's hover/focus visual state changes. There is no impact on data, API or URLs.
- **Diff scope checked:** the 7 title class lines, 3 test files, the design-spec §3.2 delta, and the spec-publisher output (SPECIFICATIONS.md, CHANGELOG 1.29.0 / scope v36, `spec/updates/2026-10-20-news-card-hover-brand-color.md`). For `ProjectCard.tsx`, `git diff -U0` shows only the line-44 hunk belongs to this task. The other projects/* files, next.config.ts and payload-types.ts are the user's own uncommitted work and were not reviewed.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/news src/components/posts src/components/rentals src/components/careers src/components/home` | PASS: 23 files, 257 tests |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this diff) |

## Acceptance check (spec/changes/2026-10-20-news-card-hover-brand-color.md)
| Criterion | Result | Evidence |
|---|---|---|
| Every card title on hover/focus-visible: no underline, brand gold text | OK | All 7 lines drop `group-hover:underline*` and add `group-hover:text-accent-text group-focus-visible:text-accent-text`. Each card's link root has a `group` class: NewsCard.tsx:49, PostCard.tsx:33, OfferBox.tsx:13, ProjectCard.tsx:30, RentalCard.tsx:30, JobCard.tsx:31→29, ProjectsSlider.tsx:76. No nested `group` sits between the root and the title. ProjectsSlider.tsx:65 has `role="group"`, which is an ARIA attribute, not a class. The `group` at ProjectsSlider.tsx:117 belongs to the dots button, which is a separate element. |
| Uses `--color-accent-text`, not `--color-primary` | OK | `@theme static` defines `--color-accent-text: #8c6733` (globals.css:17), so `text-accent-text` is a valid utility. It is already used elsewhere, e.g. NewsCard.tsx:60. #8c6733 on white is about 5.1:1. |
| `transition-colors` that respects reduced motion | OK | globals.css:351-359 sets `transition-duration: 0.01ms !important` under `prefers-reduced-motion: reduce`. |
| No other hover links changed | OK | The task diff touches only the title lines listed. No breadcrumb, footer, TOC or button file is in the diff. |
| Tests that check `underline` are updated | OK | No old test asserted underline. New assertions were added for NewsCard, RentalCard and PostCard. |
| Dark context | OK | `.theme-dark-block` overrides `--color-accent-text: var(--color-on-dark-accent)` (globals.css:219), so the title is #E0BF89 on #111, which is high contrast. |

## Responsive Checklist Gate
The diff touches UI, but only text colour and a colour transition. Layout, sizes and media are unchanged.
- Layout (horizontal scroll, mobile-first, grid, container): N/A. No layout or CSS sizing changed.
- Typography/Spacing: N/A. Font size and spacing are unchanged.
- Media: N/A.
- Touch/Interaction: OK. The link roots keep `min-h-11` (44px), and focus-visible gets the same colour state as hover.
- Viewport/A11y: OK. Reduced motion is respected (globals.css:351). No new `overflow:hidden` or `100vh`. Contrast: see MINOR-1.

## Skill gates
- aislop: skip, `aislop` not installed. The diff is 7 class lines plus tests, with no slop indicators.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). eslint shows 0 errors.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. 0 indicators (no new functions, magic numbers or WHAT-comments).
- ai-friendly-web: N/A. Visual change only, no crawl/SEO impact.
- blitzstrike: N/A. Not a STRICT security task.

## Findings
- **[MINOR-1] ProjectsSlider hover contrast on glass-panel.** `src/components/home/ProjectsSlider.tsx:91`. The panel is `rgb(250 248 246 / 0.8)` with a backdrop blur. If the photo behind it is near black, the composite background is about rgb(200,198,197), and #8c6733 on that is about 3.0:1. The title is `text-h3` (22–25px, weight 400), so at under 24px it falls below the 4.5:1 normal-text threshold. This is not a blocker: it only happens in the hover/focus state, it needs a very dark image area under the panel, and with no backdrop-filter support the fallback is a solid `--color-surface` (about 5.1:1). Suggested fix (optional, separate task): keep `text-text` on hover for the slider and add another affordance, or raise the panel opacity.
- **[MINOR-2] Not every card has a test.** ProjectCard, JobCard, OfferBox and ProjectsSlider have no new assertion. The existing assertions only check that the class string is present, which is acceptable for a pure style change. Optional: add an assertion to `project-components.test.tsx` once the user's in-progress work on that file is committed.
- **[MINOR-3] The docs give two different dark-mode contrast figures.** `.context/design-spec.md` says "≥ 9.7:1" but `spec/CHANGELOG.md` 1.29.0 says "10.8:1 on #111". Both are well above the threshold. Optional: pick one figure.

No CRITICAL or MAJOR findings.

## Residual risk
- There is no browser in this environment, so hover/focus and contrast over real slider images were not checked visually. The figures above come from colour/CSS calculation.
- `ProjectCard.tsx` also contains the user's uncommitted changes. When committing, stage only the line-44 hunk (`git add -p`).

## Verdict
PASS
