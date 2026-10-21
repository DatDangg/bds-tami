Agent: reviewer

# Review — feature-home-about-match-mockup · phase-1-task-01 · round 2 (BL-047)

- Review level: **STRICT**
- Reason: same as round 1. There is a DB migration (additive enum change on 3 tables) and a shared icon map/field (`STRENGTH_ICON_COMPONENTS`, `strengthIconField`: Strengths, About stats, Careers perks).
- Blast radius: home page vi/en (About block ≥ lg, decor image ≥ 1400px); admin Homepage (strengths/about stats icon); admin Site settings (careersPerks icon); DB enums `enum_homepage_about_stats_icon`, `enum_homepage_strengths_items_icon`, `enum_site_settings_careers_perks_icon`; dev seed `seed:page-heroes`.
- Scope: only the BL-047 diff. Attempt 2 changed `AboutBlock.tsx`, `AboutBlock.test.tsx`, `scripts/seed-page-heroes.ts`, design-spec line ~240 and the task file. Migration, icons, blocks, payload-types and index were checked again against their diffs (unchanged since round 1). BL-046 was skipped.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/home` | PASS. 12 files / 108 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| migrate / seed | not run, per instruction. Checked by reading the code. |
| lint / full test | not rerun. The Builder reported PASS in round 1. Attempt 2 is a small diff. |

## Round 1 findings closure
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1 decor image covers the text at 1280–1392px | **Closed** (see MINOR-A for a scrollbar edge case) | `AboutBlock.tsx:87` now uses `hidden … min-[1400px]:block` instead of `xl:block`. Math below. |
| MINOR-1 duplicate upload helper | Closed | `seed-page-heroes.ts:69-87` adds one function `uploadImage(payload, root, file, alt, extract?)`. `uploadMockupImage` is now a 1-line wrapper (`:89`). Uses `path.basename(file)` for the subfolder file name. |
| MINOR-2 seed header / ENOENT / icon null | Closed | Header line 4 describes BL-047 and says it overwrites the About block in the dev DB. `:134-135` checks `existsSync` and throws an error that explains how to get the files, before seedHomeAbout writes anything. `:155` uses `icons[i] ?? row.icon`. |
| MINOR-3 lossy down not documented | Closed | The task file's Residual risk lists "Down migration … lossy … không HIGH_RISK". |
| MINOR-4 no test for the new icons | Closed | `AboutBlock.test.tsx:69-76` renders stats with `medal` and `users-three` and checks for an `svg` inside the circle. The decor test is locked to the class `min-[1400px]:block`. |

### MAJOR-1 math (no browser, CSS math only)
Tokens: `max-w-container` = 80rem = 1280px (border-box, includes `px-gutter`). Gutter = clamp(16px, 9.6px + 1.7vw, 32px), which is 32px for every V ≥ 1318. `gap-x-10` = 40px.
- Content = 1280 − 64 = 1216. Column = (1216 − 11×40)/12 = 64.67px. Column 8 starts at 32 + 7×104.67 = 764.7px from the container's left edge. Text = min(5 columns + 4 gaps = 483.3, 27rem = 432) = 432, so its right edge is 1196.7px.
- Absolute text right edge = (L − 1280)/2 + 1196.7. Decor left edge = 0.9·L (L = section layout width).
- L = 1400: text 1256.7 < decor 1260 → **no overlap** (gap 3.3px). L = 1440: 1276.7 vs 1296. L = 1920: 1516.7 vs 1728. L = 2560: 1836.7 vs 2304. The gap grows by 0.4px per extra px of width, so there is **no overlap at any L ≥ 1392**. The max-w container keeps the text centred, which confirms this.
- No overlap across all of 1400 → 1920+. But see MINOR-A for the case where the media query counts a classic scrollbar.

## Responsive Checklist Gate (diff touches UI: AboutBlock ≥ lg / ≥ 1400)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | The section is `overflow-hidden` (already there). Decor is absolute `right-0 w-[10%]` inside the section. |
| Mobile-first / < lg unchanged | OK | All changed classes use the `lg:` or `min-[1400px]:` prefix (min-width). |
| Grid / container | OK | 12-column grid, `max-w-container`, no fixed px widths for the container. |
| Typography rem / fluid | OK | `lg:text-h1` uses clamp. No changes since round 1. |
| Media | OK | `ResponsiveImage` + `sizes`. Decor uses `sizes="10vw"`, `decorative`, and the wrapper has `aria-hidden`. |
| Decor does not cover the text (acceptance) | OK (MINOR-A) | Math above. |
| Touch target | N/A | No new interactive element. |
| Viewport / reduced-motion | N/A | No `100vh` and no animation. |
| Error hidden by overflow:hidden | OK (residual) | The EN caption at 1024 is still not measured in a browser (same as round 1). |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured. The project uses `pnpm lint` (Builder PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK. 1 indicator (stale JSDoc, MINOR-B), below the threshold of 3. Seed is 206 lines, AboutBlock is 117 lines, `seedHomeAbout` is about 38 lines.
- ai-friendly-web: N/A (no change to robots, sitemap or llms).
- blitzstrike: N/A (no auth or public input).

## Findings

### [MINOR-A] The 1400px breakpoint leaves about 3px of margin. With a classic scrollbar (Windows, about 17px) the decor box can overlap the text by ≤ 3.5px
`src/components/home/AboutBlock.tsx:87` (`min-[1400px]:block`).
- The media query counts viewport width including the scrollbar, but the section/decor layout uses L = V − scrollbar. With V = 1400 and a 17px scrollbar, L = 1383: text 1248.2 vs decor 1244.7, so the box overlaps by about 3.5px. The overlap disappears at V ≈ 1409.
- Visual impact is close to zero. The overlap sits at the left edge of the mask (transparent → black over 60% of the width, about 83px), so mask alpha ≈ 4% × opacity 0.6 ≈ 2.5%. It does not affect contrast.
- Suggestion (optional): increase the safety margin to `min-[1440px]:block` (gap ≥ 19px even with a scrollbar), and update design-spec and the test to match.

### [MINOR-B] The component JSDoc still has the old numbers
`src/components/home/AboutBlock.tsx:75` still says "cụm ảnh cột 1-6, chữ cột 7-12" (image cluster columns 1–6, text columns 7–12). As built: the cluster spans 7/12 columns and the text is in columns 8–12 (max 27rem). Line 76 was updated ("từ 1400px", from 1400px) but line 75 was not. Suggestion: edit it to "cụm ảnh 7/12 cột, chữ cột 8-12".

### [MINOR-C] The seed check only protects `seedHomeAbout`
`scripts/seed-page-heroes.ts:133-135, 199-202`: the `existsSync` check runs only after `seedSettings`, `publishLegalPages` and `publishSampleServices` have already written. A machine without `seed/scraped*` will still get partial results. The error message is clear and the seed is idempotent (rerun is safe). This is dev-only, so it is acceptable. If you want it fully "before any write", move the check to the start of `try`.

### Notes (not counted)
- design-spec line ~240 still keeps the old paragraph ("~66%", "chữ cột 7–12", "từ xl") before the *As-built BL-047* note. Readable, but it is better to rewrite the main paragraph (note from round 1, not fixed).

## Verdict
**PASS.** No CRITICAL or MAJOR. MAJOR-1 is closed: the CSS math shows no overlap for layout width ≥ 1392px, at 1400 → 1920+, under max-w 80rem. MINOR-1..4 from round 1 are closed. 3 new MINORs (A: thin margin with a scrollbar, overlap effective opacity ≈ 2.5%; B: stale JSDoc; C: seed partial write). They are optional and do not block.

Residual risk: responsive was checked with CSS math only, no browser (EN caption at 1024, actual scrollbar width). Migration was not run (only the code was checked; unchanged since round 1).
