Agent: reviewer

# Review — feature-favicon-tab-logo · phase-1-task-01 · round 2 (BL-048)

- **Review level:** NORMAL
- **Reason:** ADDITIVE, LOW risk. Static icon PNGs, `<head>` link tags and one admin meta entry. No schema, API, auth or tenant changes. The `<head>` it touches is shared by every page plus `/admin`, so FAST is not appropriate. Nothing qualifies as a red risk, so STRICT is not needed.
- **Blast radius:** `<head>` of every public page (vi/en, 404 via file convention `src/app/icon.png` + `src/app/apple-icon.png`), the root error boundary `src/app/global-error.tsx` (manual links, because global-error replaces the root layout and gets no file-convention metadata), and `/admin` (`src/payload.config.ts` `admin.meta.icons`). No runtime logic changes.
- **Scope reviewed:** `src/app/icon.png`, `src/app/apple-icon.png`, `scripts/gen-favicon.mjs` (untracked), `src/payload.config.ts` (icons diff), `src/app/global-error.tsx` (+2 head links), `SPECIFICATIONS.md` F11 BL-048 line. Other hunks in `SPECIFICATIONS.md` (BL-046 header heights, BL-047 icons), other dirty files and `importMap.js` were outside this scope and ignored.

## Round-1 / spec-validation items
| Item | Status |
|---|---|
| W1: global-error had no icon | Fixed. `global-error.tsx:51-52` adds `<link rel="icon" href="/icon.png">` and `apple-touch-icon` `/apple-icon.png` 180x180. Both URLs return 200 image/png. |
| W2 / MINOR: low contrast on light tabs (1.48:1) | Fixed. Glyph now sits on a rounded `#111111` tile (= `--color-dark`, `globals.css:37`). Tile vs #fff 18.88:1, vs #f1f3f4 16.96:1. Median gold pixel vs tile 11.85:1. On dark tabs (#202124 / #35363a) the tile blends in (1.17 / 1.56:1), but the gold glyph still reads at about 10:1 against the tab, so the icon stays readable. |
| MINOR: generator depends on cwd | Fixed. Paths now resolve from `import.meta.url` (`scripts/gen-favicon.mjs:6`). |
| MINOR: redundant `.removeAlpha()` | Withdrawn. The builder says compositing adds an alpha channel and removing the call gives `hasAlpha=true`. The output is 3-channel and opaque, which is consistent with that, and a comment now explains it. |
| MINOR: hard-coded crop bbox | Still present (`scripts/gen-favicon.mjs:13`) and documented. Acceptable for a one-off generator. |
| Admin used the 256px source icon | Admin now uses `/icon.png`, so the tab icon is the same on public pages and `/admin`. |

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc, no errors) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm test` | skip: no test file covers these files (static assets and head links) |
| curl `/` | 200. 1 `icon` (`/icon.png?icon.0ij_5ad7pbry1.png`, sizes 64x64, image/png) + 1 `apple-touch-icon` (180x180). No `shortcut icon`. |
| curl `/en` | 200. Same two links, 1 of each. |
| curl `/khong-ton-tai` | 404. Same two links, 1 of each. |
| curl `/en/khong-ton-tai` | 404. Same two links, 1 of each. |
| curl `/admin` | 200. 1 `icon` `/icon.png` + 1 `apple-touch-icon` `/apple-icon.png` 180x180. No duplicates. |
| curl `/icon.png`, `/icon.png?icon.0ij_5ad7pbry1.png`, `/apple-icon.png` | all 200 `image/png` (icon 2291 B, apple 6174 B) |
| sharp metadata/stats | `icon.png` 64x64, 4 channels, hasAlpha, not opaque; corner pixel (0,0) = alpha 0, edge/centre = #111111 opaque. `apple-icon.png` 180x180, 3 channels, opaque. |
| Visual (builder preview `scratchpad/preview-16-32.png`) | 16px and 32px on #fff / #f1f3f4 / #202124 / #35363a: dark tile clearly visible on light tabs; gold roof recognisable at all four. At 16px the glyph is small but legible. |

`global-error.tsx` was not exercised at runtime (it would need a forced root-layout crash). Verified by diff only: static `<link>` tags whose targets return 200.

## Responsive Checklist Gate
N/A. No layout, CSS or component-styling changes. The diff only touches head metadata and static PNGs.

## Skill gates
- aislop: skip, not installed. I read the 30-line script by hand and found no slop.
- oxlint (anti-slop): skip, oxlint is not configured. ESLint via `pnpm lint` reports 0 errors.
- ocr (open-code-review): skip, ocr is not installed.
- AI-readable: OK. 1 indicator: the magic-number crop box, which is documented. Below the threshold of 3.
- ai-friendly-web: N/A. Favicon only; robots/sitemap/llms are untouched.
- blitzstrike: N/A (not a STRICT or security-sensitive task).

## Findings
- **[MINOR] Hard-coded crop bbox**: `scripts/gen-favicon.mjs:13` `extract({left:5, top:66, width:244, height:121})`. This will silently mis-crop if the source logo changes. It is documented and the script is only rerun by hand. Optional follow-up: compute the bbox from the alpha channel.
- **[MINOR] Tile edge on dark tabs**: on dark browser tabs (#202124) the `#111111` tile is almost invisible (1.17:1), so the icon looks like a bare gold roof there. Readability is unaffected because the glyph is about 10:1 against the tab. Cosmetic; no action needed.

No CRITICAL or MAJOR findings. Every diff line traces to BL-048 and there is no unrelated refactoring. The F11 BL-048 spec line (gold roof on a rounded `--color-dark` tile; apple 180x180 solid background; public + 404/error + `/admin`; URLs 200) matches the implementation. Doc impact: `no doc impact` (no contract or schema change).

## Residual risk
- Not checked in a real browser tab or on an iOS device. The checks used curl, sharp metadata and contrast maths, plus the builder's composite preview.
- The global-error icon links were not rendered at runtime (see above).

## Verdict
PASS
