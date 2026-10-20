Agent: reviewer

# Review — feature-single-font-montserrat · phase-1-task-01 · round 1 (BL-036)

- **Review level:** STRICT
- **Reason:** shared design token (`--font-display`, `--text-*` scale) used across every public page (~67 `font-display` usages / 50 files); this is a shared component/token risk.
- **Blast radius:** every `(frontend)` route (heading, price, specs, hotline links, mobile menu, accordion summaries, dialog/sheet titles, card titles); `PublicDocument` `<html>` className; design docs. Admin (`custom.scss`), email templates and `global-error.tsx` are confirmed unchanged.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib src/components` | PASS: 186 files, 1919 tests |
| `pnpm typecheck` | PASS (clean) |
| `pnpm lint` | 0 errors, 2 pre-existing warnings (`tools/task-dashboard/server.mjs`), not from this task |
| Grep `Garamond\|garamond` in `src/` | Only negative assertions in `fonts.test.ts` (written `Gar[a]mond`). Clean |

## Acceptance check
1. **EB Garamond removed:** OK. `fonts.ts` exports only `montserrat` (latin+vietnamese, 400/500/600, swap, `--font-montserrat`). `PublicDocument.tsx` drops `ebGaramond.variable`.
2. **No faux bold on headings:** OK. All heading tokens use 500/600, which are loaded weights. Across `src/`, the only `font-bold`/700 is `LanguageSwitcher.tsx:32`, which is not a heading and predates this task (see MINOR-2).
3. **Tailwind v4 `--text-<name>--font-weight`:** OK. I checked the source of `tailwindcss@4.3.3` (`dist/lib.mjs`). The `text` utility resolves `["--line-height","--letter-spacing","--font-weight"]` and emits `font-weight: var(--tw-font-weight, <token>)`. Explicit `font-*` utilities set `--tw-font-weight`, so they override the token regardless of source order (for example `text-h3 font-semibold` in JobListPage/EmptyState/ContactDetails gives 600, and `font-medium` on the NewsCard feature gives 500).
4. **Scale order (CSS math):**
   - 375px: display 28.95 ≥ h1 26.8 ≥ h2 24.0 ≥ h2-sm 22.3 ≥ h3 20.1 ≥ h4 18
   - 390px: 29.3 ≥ 27.4 ≥ 24.25 ≥ 22.4 ≥ 20.2 ≥ 18
   - 1280px: 52 ≥ 47.8 ≥ 37.6 ≥ 25.9 ≥ 22 ≥ 18
   - The linear parts never cross above the clamp minimums (h2 = h2-sm only at about 218px, where both are already clamped to 24/22). OK.
   - Line-height 1.15–1.4 is enough for stacked Vietnamese diacritics in non-clamped text. The visual check is still a residual risk.
5. **Sentence case:** OK. No `uppercase` was added; the mobile menu keeps its existing uppercase.
6. **Admin/email/global-error unchanged:** OK.
7. **Remaining `font-normal`:** OK.
   - `RentalSpecs.tsx:18` and `SaleContactBox.tsx:46` are the "/tháng" suffix next to a heavier price, so they are correct.
   - `LanguageSwitcher.tsx:45` is the inactive locale, so it is correct.
   - The ProjectHero h1 `font-normal` was removed correctly.
   - Non-heading uses of `text-h3`/`text-h4`/`text-price` (hotline link, spec values `dd`, address `p`, offer code, gallery "+N", accordion summary, mobile menu) become 500/600. These are short display-style labels, not paragraphs, so the extra weight is reasonable. None needs `font-normal`.

## Responsive Checklist Gate
The diff changes design tokens only (font family, size, weight, line-height). Layout is not touched.
- **Layout (no horizontal scroll, grid, container):** OK. No layout change. Display and heading sizes all shrink compared with before (e.g. display max 60 → 52, min 32 → 28), so overflow risk goes down. A wider Montserrat in `max-w-[24ch]`/`text-balance` blocks wraps more but does not overflow.
- **Typography/Spacing:** OK. Everything is `rem` + `clamp()`.
- **Media:** N/A (no media changes).
- **Touch/Interaction:** N/A (no target size changes; `min-h-11`/`min-h-14` are unchanged).
- **Viewport/A11y:** N/A (no vh or motion changes).
- Not verifiable without a browser: real rendering at 375/768/1280. Recorded under Residual risk.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*` at repo root). ESLint is clean.
- ocr: skip, `ocr` not installed.
- AI-readable: OK. Names are clear, there are no new functions or magic numbers, and the comments explain WHY (BL-036). 0 indicators.
- ai-friendly-web: N/A (only typography tokens changed; no crawl or meta change).
- blitzstrike: N/A (no auth/input/API surface).

## Findings

### [MAJOR-1] `.context/design-spec.md:70` still documents the old scale and contradicts the code
The line still reads: "Cỡ (desktop → mobile, token `--text-*`): display 60px → ~32px, h1 56px → ~30px, h2 44px → ~26px; h3 và nhỏ hơn không đổi … `DetailSection` … dùng `--text-h2` (30px, cỡ h2 cũ)".
- Code is now display 52→28, h1 48→26, h2 38→24, h2-sm 26→22, h3 22→20 (h3 *did* change).
- `docs/DESIGN.md` and `design-tokens.md` were updated correctly. design-spec is the canonical screen spec, and the task explicitly put §typography in scope, so this fails doc reconcile (focus item 5).
- **Fix:** rewrite line 70 with the new sizes (display 52→28px, h1 48→26px, h2 38→24px, h2-sm 26→22px, h3 22→20px, h4 18px; weights 500/600; line-height 1.15/1.15/1.2/1.25/1.3). Change "h3 và nhỏ hơn không đổi" accordingly, and replace "`--text-h2` (30px, cỡ h2 cũ)" with the current value (24→38px).

### [MINOR-1] `src/components/layout/PublicDocument.tsx:15`
`` className={`${montserrat.variable}`} `` is a redundant template literal. Use `className={montserrat.variable}`.

### [MINOR-2] Pre-existing faux bold (out of scope, not introduced by this task)
- `LanguageSwitcher.tsx:32` uses `font-bold` (700).
- `RichText.tsx:76` uses `<strong>`; preflight `bolder` gives 700.
- Montserrat 700 is not loaded, so the browser synthesizes bold. This was already true before BL-036 (Montserrat was 400/500/600 before too).
- Proposal: a separate task (switch to `font-semibold`, or set `strong { font-weight: 600 }` in the public CSS).

### [MINOR-3] `src/lib/fonts.test.ts`
- Tests are source-regex based (token presence). They cannot prove the built CSS emits `font-weight`. I verified this in the Tailwind source instead (see Acceptance 3), so this is acceptable.
- The `Gar[a]mond` trick to dodge grep works, but it is slightly obscure. Consider a short comment.

## Residual risk
- No dev server or browser was run. Not verified:
  - real rendering at 375/768/1280;
  - stacked diacritics (Ầ/Ỗ/Ẫ) under `line-clamp-2` (`overflow:hidden`) on `text-h3` (1.3) in ProjectsSlider and on `text-h4` (1.4) in Project/Post/Rental cards, where top accents could clip on the first line;
  - the visual weight of the uppercase mobile menu at 500.
- Diff files carry CRLF/LF noise (git warnings). Stage only the task files listed.

## Verdict
**FAIL.** 1 MAJOR (design-spec.md:70 typography doc out of sync with code). Code, tests, typecheck and lint are all correct. Fix the doc line, then re-review (round 2 can be FAST, docs only).
