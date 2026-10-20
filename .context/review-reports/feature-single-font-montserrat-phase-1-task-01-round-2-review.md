Agent: reviewer

# Review — feature-single-font-montserrat · phase-1-task-01 · round 2 (BL-036)

- **Review level:** STRICT (same as r1; this round focuses on the delta after r1 and re-runs the full verify set)
- **Reason:** `--font-display` and the `--text-*` scale are shared design tokens used on every public page. The r1 MAJOR was a doc reconcile issue on the canonical screen spec.
- **Blast radius:**
  - Every `(frontend)` route, through the typography tokens in `src/app/(frontend)/globals.css`.
  - `<html>` className in `PublicDocument.tsx`, which is shared by `[locale]/layout.tsx` and `app/not-found.tsx`.
  - Design docs: `.context/design-spec.md`, `docs/DESIGN.md`, `skills/react-nodejs/design-tokens.md`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0, clean) |
| `pnpm lint` | PASS. 0 errors, 2 warnings that were already there in `tools/task-dashboard/server.mjs` and do not come from this task |
| `pnpm vitest run src/lib src/components` | PASS. 1919/1919 tests (same count as r1, no regression) |
| Grep `Garamond\|ebGaramond` in `src/` | No matches |
| Grep `Garamond\|cỡ h2 cũ\|60px\|56px\|44px` in `.context/design-spec.md` | No Garamond and no "cỡ h2 cũ". The only 44px hits are touch targets, which are unrelated |

## Delta verification

### MAJOR-1 (r1): `.context/design-spec.md:70` — FIXED
I checked each value in the spec against `globals.css:63-105` (1rem = 16px):

| Token | Code (clamp min → max) | Spec line 70 | Weight code/spec | Line-height code/spec | Letter-spacing |
|---|---|---|---|---|---|
| display | 1.75rem → 3.25rem = 28 → 52px | 52 → ~28 | 500/500 | 1.15/1.15 | -0.01em/-0.01em |
| h1 | 1.625rem → 3rem = 26 → 48px | 48 → ~26 | 500/500 | 1.15/1.15 | -0.01em/-0.01em |
| h2 | 1.5rem → 2.375rem = 24 → 38px | 38 → ~24 | 500/500 | 1.2/1.2 | -0.01em/-0.01em |
| h2-sm | 1.375rem → 1.625rem = 22 → 26px | 26 → ~22 | 500/500 | 1.25/1.25 | 0 (spec does not list it, which is correct) |
| h3 | 1.25rem → 1.375rem = 20 → 22px | 22 → ~20 | 500/500 | 1.3/1.3 | — |
| h4 | 1.125rem = 18px | 18 | 600/600 | 1.4 (spec does not list it) | — |
| price | — | weight 600 | 600/600 | — | — |

- "h3 và nhỏ hơn không đổi" has been removed.
- "(30px, cỡ h2 cũ)" has been removed. `DetailSection` now uses `--text-h2` with the rationale "h1 ≥ h2 ≥ h3", which matches the code.
- Line 68 (Montserrat 500, h4/price 600, `--font-display` → Montserrat) matches `globals.css:56-58`.

### MINOR-1 (r1): `PublicDocument.tsx:15` — FIXED
The line is now `className={montserrat.variable}`. The import is `montserrat` only, and nothing else in the file changed.

### MINOR-2/3 (r1)
Accepted as out of scope / not fixed. These issues already existed before this task (`LanguageSwitcher` `font-bold`, `<strong>` in RichText). They do not block PASS. I still suggest a separate task for faux bold 700.

## Full task diff
No regression compared with r1:
- `fonts.ts` / `fonts.test.ts`, `globals.css`, `ProjectHero.tsx`, `project-detail.test.tsx`, `docs/DESIGN.md` and `design-tokens.md` are unchanged since they were reviewed in r1.
- The r1 conclusions still hold:
  - Tailwind v4 `--text-*--font-weight` can be overridden by an explicit `font-*` utility.
  - The scale order is correct at 375/390/1280.
  - Admin, email and global-error are untouched.

## Responsive Checklist Gate
The delta is a doc change plus a className with identical runtime output (`montserrat.variable`). There is no new CSS or layout change.
- Layout: OK. No change. The r1 conclusion holds: the heading scale only shrinks, so overflow risk goes down.
- Typography/Spacing: OK. `rem` + `clamp()` (`globals.css:63-105`).
- Media: N/A
- Touch/Interaction: N/A
- Viewport/A11y: N/A

## Skill gates
- aislop: skip, `aislop` is not installed (same as r1)
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc*`). ESLint has 0 errors.
- ocr: skip, `ocr` is not installed
- AI-readable: OK. 0 indicators. The delta reduces indirection (removes the redundant template literal).
- ai-friendly-web: N/A. Typography only; no crawl or meta change.
- blitzstrike: N/A. No auth, input or API surface.

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR] none new. r1 MINOR-2 (faux bold 700 that existed before this task) remains: suggest a separate backlog task.

## Residual risk
- No browser was run. Two things are still not verified visually:
  - real rendering at 375/768/1280;
  - stacked diacritics (Ầ/Ỗ/Ẫ) under `line-clamp-2` on `text-h3`/`text-h4` cards.
- The diff carries CRLF/LF noise. When committing, stage only the task files. Do not include `next.config.ts`, `src/payload-types.ts`, or the projects files that differ only in CRLF.

## Verdict
**PASS.** The r1 MAJOR is fixed, and every number in the spec matches the code. MINOR-1 is fixed. typecheck, lint and vitest (1919 tests) all pass.
