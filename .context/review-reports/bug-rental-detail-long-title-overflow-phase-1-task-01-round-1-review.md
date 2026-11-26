Agent: reviewer

# Review — bug-rental-detail-long-title-overflow · phase-1-task-01 · round 1 (BL-125)

- Task: `tasks/bug-rental-detail-long-title-overflow/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-26-rental-detail-long-title-overflow.md`
- Diff scope (uncommitted): `src/components/detail/DetailHeroMosaic.tsx`, `src/components/detail/DetailSection.tsx`, `src/components/detail/DetailHeroMosaic.test.tsx`, `src/components/detail/DetailBlocks.test.tsx`

## Review level: STRICT
**Reason:** `DetailHeroMosaic` and `DetailSection` are shared components used by every detail page (Project, Rental, Tin BĐS). AGENTS.md requires STRICT for shared components. The diff itself is small (3 class additions + 2 tests), so the review focuses on CSS correctness, coverage on the 3 pages, and other text that could still overflow.

## Blast radius
- `DetailHeroMosaic` → hero on `ProjectDetail`, `RentalDetail` and `PostDetail` (h1 and the address line).
- `DetailSection` description `<p>` → every block that has a `description` on the 3 detail pages: gallery "Hình ảnh của {name}." (Rental:143, Post:190, Project:133), location address (Rental:129 `view.addressLine`, Post:185 `specs.place`, `ProjectLocation.tsx:73` `addressText`), plus any other caller that passes `description`.
- No API, schema, data, auth or cache key changes. CSS classes only.

## Root cause check: correct
1. `DetailHeroMosaic.tsx:58` h1 had no overflow-wrap. The hero `section` (`:157`) has `overflow-hidden`, so a long unbroken title was clipped. This matches the "title is cut off" symptom.
2. `DetailSection.tsx:45` description `<p>` had no overflow-wrap. Below `lg`, the layout is block with no overflow-hidden, so the long title in "Hình ảnh của {title}." spilled out and widened `documentElement.scrollWidth` (587px at 390px).
The fix uses `break-words [overflow-wrap:anywhere]`, which is already the project convention (`RichText.tsx`). The address `<p>` in the hero is `display:flex`, so the text node becomes an anonymous flex item with `min-width:auto` (= min-content). Only `overflow-wrap:anywhere` lowers min-content, so `anywhere` is the right choice here. `break-word` alone would not be enough.

## Survey of other places printing the title/address on detail pages (390px)
| Location | Result |
|---|---|
| `SaleContactBox` (rental aside) | Does not print the title; `sale.name` already has `break-words` (`SaleContactBox.tsx:47`); form title comes from i18n → OK |
| `ProjectStickyCta` | Fixed i18n label → OK |
| Breadcrumb overlay (Post: last item = `view.title`) | `truncate` + `min-w-0`; it sits inside the hero `overflow-hidden`, so it cannot widen the document → OK (may be clipped/ellipsized on purpose) |
| `DetailInfoGrid` (Post: `project.title`, `rental.title`) | `dd` has `break-words`; items have `min-w-0` → the box width is definite, so `break-word` wraps → OK |
| Similar cards (`CARD_TITLE_CLASS`, `card-parts.tsx:14`) | `line-clamp-2` (overflow hidden) → clipped, does not widen the document → OK |
| `LazyMap label`, `DetailShareButton title`, `HeroVideoDialog` description | aria / sr-only / share payload, not visible inline text → OK |
| Location `DetailSection` description (address) on all 3 pages | Covered by the same `DetailSection` fix → OK |

## Desktop impact
`overflow-wrap:anywhere` only takes effect when a single word is longer than the line. Normal titles (with spaces) look identical, and `text-balance` / `max-w-[40rem]` are kept. At ≥ lg the hero grid is `minmax(0,1fr)`, so it does not change. No unintended desktop change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/detail src/components/rentals src/components/posts src/components/projects` | PASS — 26 files / 312 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS (no errors) |
| `pnpm exec eslint <4 changed files>` | PASS (exit 0, no output) |
| Dev server / browser measurement | skip — no dev server/Docker (per instructions) |

## Responsive Checklist Gate (UI diff: classes only)
Scope: only the 3 added classes. No browser available, so this is checked by CSS math.
- Layout — no horizontal scroll: **OK** (CSS math). 390px: the description `<p>` is block width = container width, and `anywhere` breaks the unbroken string, so nothing spills out. The hero h1/address sit in a column with `min-w-0`, and min-content shrinks thanks to `anywhere`. Not measured with `scrollWidth` → Residual risk.
- Layout — mobile-first / grid / container: **N/A** (the diff does not change layout).
- Typography/Spacing (rem, clamp): **N/A** (font-size/spacing unchanged; uses existing `text-h1`/`text-small` tokens).
- Media: **N/A**.
- Touch/Interaction (44px, nav, table): **N/A**.
- Viewport/A11y (100vh, reduced-motion, overflow:hidden hiding errors): **OK**. The fix wraps the text instead of hiding it with `overflow:hidden`. `min-h-[min(78vh,600px)]` already existed and is outside scope.

## Skill gates
- aislop: skip — not in the allowed verify commands for the reviewer; the diff is 3 class tokens + 2 tests, no slop signals.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`); eslint PASS stands in.
- ocr (open-code-review): skip, ocr not installed / not in allowed commands.
- AI-readable: **OK** — 0 indicators (no new functions, no magic numbers, test names state the purpose and the BL id).
- ai-friendly-web: N/A (internal bug fix, does not touch robots/sitemap/llms).
- blitzstrike: N/A (no auth/input/API).

## Findings
- **[MINOR]** Tests assert on the class string (`className` contains `[overflow-wrap:anywhere]`) rather than real behaviour. This is acceptable because jsdom has no layout engine. They do guard against regression (if the class is removed, the test fails), but they do not prove `scrollWidth <= 390`. Suggestion (optional, separate task): add a Playwright e2e that checks `scrollWidth` at 390px once the e2e infrastructure is committed (BL-119).
- **[MINOR]** `DetailHeroMosaic.tsx:58`/`:62` and `DetailSection.tsx:45` include both `break-words` and `[overflow-wrap:anywhere]` (same property, `anywhere` decides). This is redundant but follows the `RichText.tsx` convention. No change needed.
- **[MINOR / outside scope]** `RentalDetail.tsx:151` legal note `<p class="whitespace-pre-line">` has no overflow-wrap. Admin-entered content with a long unbroken string could still overflow. This is not the title/address and not part of this bug. Suggest a separate task if QA reports it.

No CRITICAL or MAJOR findings.

## Repro Verification check
- Status `PASS`. Automated evidence: 2 BL-125 regression tests (I confirmed they PASS in the run above). The "FAIL before" claim is consistent: the old code lacked the class token, so the assertion would fail. I did not stash to re-run it, per reviewer permissions.
- `scrollWidth` was not measured in a browser. Accepted because the CSS reasoning is solid and the coordinator stated there is no environment. Recorded as residual risk.

## Residual risk
- Not measured `document.documentElement.scrollWidth <= 390` at `/cho-thue/test-thu-sale2`, and no 390/1440 screenshots. QA/staging should measure once an environment is available.
- The Post breadcrumb overlay at md+ (`flex-nowrap w-fit` + `truncate`) with a very long title: its min-content can exceed the width, but it is clipped by the hero `overflow-hidden` and does not widen the document. This existed before and is outside scope.

## Verdict: PASS
