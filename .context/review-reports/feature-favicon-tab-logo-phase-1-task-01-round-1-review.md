Agent: reviewer

# Review — feature-favicon-tab-logo · phase-1-task-01 · round 1 (BL-048)

- **Review level:** NORMAL
- **Reason:** ADDITIVE, LOW risk. Adds static icon files and one admin meta entry. No schema, API, auth or tenant changes. The `<head>` metadata it touches is shared by every page, so FAST is not appropriate. Nothing qualifies as a red risk, so STRICT is not needed.
- **Blast radius:** the `<head>` of every public page (vi/en, including 404 / global-not-found) gets `<link rel="icon">` and `apple-touch-icon` through App Router file convention (`src/app/icon.png`, `src/app/apple-icon.png`); `/admin` gets one extra `apple-touch-icon` link through `src/payload.config.ts` `admin.meta.icons`. No runtime logic changes.
- **Scope reviewed:** `src/app/icon.png`, `src/app/apple-icon.png`, `scripts/gen-favicon.mjs` (all new/untracked), `src/payload.config.ts` (diff: +1 icon entry), `SPECIFICATIONS.md` F11 BL-048 line. Other dirty files (BL-046/047, importMap.js) were out of scope and ignored.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc exit 0) |
| `pnpm lint` | PASS — 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm test` | skip — the diff has no logic and no test file covers it |
| curl `/` | 200; 1x `<link rel="icon" href="/icon.png?icon.…png" sizes="64x64" type="image/png">` + 1x `apple-touch-icon` `/apple-icon.png?…` 180x180 |
| curl `/en` | 200; same two links, no duplicates |
| curl `/khong-ton-tai` | 404 page; same two links |
| curl `/en/khong-ton-tai` | 404 page; same two links |
| curl `/admin` | 200; 1x icon `/brand/tami-icon-gold.png` + 1x `apple-touch-icon` `/apple-icon.png` 180x180. File-convention links are not injected, so there are no duplicates |
| curl `/icon.png`, `/icon.png?icon.0y77m9vznwwka.png`, `/apple-icon.png`, `/brand/tami-icon-gold.png` | all 200 `image/png` (2808 / 6174 / 11973 bytes) |
| sharp metadata | `icon.png` 64x64, 4 channels, has alpha, not opaque, glyph bbox x0–63 y16–47; `apple-icon.png` 180x180, 3 channels, opaque (solid background #f7f5f4) |

Rendered previews (scratchpad, 8x nearest-neighbour): at 16px and 32px the roof glyph is clear on a dark tab (#202124). On a white tab it is recognisable as a roof but faint. Measured contrast of the median opaque pixel: **1.48:1 vs white**, **10.9:1 vs #202124**. The apple icon is well centred with about 14% margin and has no black background.

## Responsive Checklist Gate
N/A — there are no layout, CSS or component changes. The diff only adds head metadata and static PNGs.

## Skill gates
- aislop: skip, `aislop` is not on PATH. I did a manual slop read of the 22-line script: no slop.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc.json`). ESLint via `pnpm lint` passes.
- ocr (open-code-review): skip, ocr is not installed.
- AI-readable: OK. One indicator (magic-number crop box in the script, though its comment says where it comes from). Below the threshold of 3.
- ai-friendly-web: N/A. Only favicon metadata changed; robots/sitemap/llms are untouched.
- blitzstrike: N/A (task is not STRICT and not security-sensitive).

## Findings
- **[MINOR] Low contrast on light tabs** — `src/app/icon.png`. The pale gold logo against a white or light-grey tab measures about 1.48:1, well below the 3:1 non-text guideline. The spec line asks for it to read clearly at 16/32px on both light and dark tabs; on light tabs the shape can be made out but is faint. The spec also requires the source gold logo, so the conflict comes from the spec itself rather than the implementation. The builder already noted this trade-off in the task. Suggested follow-up, if the user wants it: a darker-gold or outlined tab-only variant, or a light/dark pair via `media="(prefers-color-scheme: dark)"`. Needs the user's decision on the brand colour; does not block.
- **[MINOR] Generator depends on cwd** — `scripts/gen-favicon.mjs:5,12,21` uses relative paths (`public/...`, `src/app/...`), so it only works when run from the repo root (which the usage comment implies). Could resolve them from `import.meta.url`. Optional.
- **[MINOR] Hard-coded crop bbox** — `scripts/gen-favicon.mjs:8`, `extract({left:5, top:66, width:244, height:121})`. This is tied to the current source PNG and will silently mis-crop if the logo changes. The comment documents why (`trim()` does not handle a transparent background). Acceptable for a one-off script.
- **[MINOR] Redundant call** — `scripts/gen-favicon.mjs:19`, `.removeAlpha()` on a 3-channel canvas is a no-op (compositing keeps 3 channels, as the output confirms). Harmless.
- Admin keeps the 256px `/brand/tami-icon-gold.png` as its tab icon rather than the new 64px `/icon.png`. That is fine (the browser downsamples) and matches task D4 ("keep the existing one").

No CRITICAL or MAJOR findings. Every diff line traces back to BL-048 with no unrelated refactoring. Doc impact is `no doc impact` (no contract/schema change). The spec F11 line matches the implementation.

## Residual risk
- I did not check rendering in a real browser tab, only with sharp composites. Light-tab readability is the subjective point above.
- iOS home-screen behaviour was not tested on a device; it is inferred from the 180x180 opaque PNG plus the `apple-touch-icon` link.

## Verdict
PASS
