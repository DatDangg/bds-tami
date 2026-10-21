Agent: reviewer

# Review — feature-home-about-match-mockup · phase-1-task-01 · round 1 (BL-047)

- Review level: **STRICT**
- Reason: DB migration (enum change on 3 tables, used by 3 admin fields through the shared `strengthIconField`) + shared icon map (`STRENGTH_ICON_COMPONENTS`, used by Strengths, About stats and Careers perks).
- Blast radius: home page vi/en (About block ≥ lg, xl decor image); admin Homepage (strengths.items[].icon, about.stats[].icon); admin Site settings (careersPerks[].icon); DB enums `enum_homepage_about_stats_icon`, `enum_homepage_strengths_items_icon`, `enum_site_settings_careers_perks_icon`; dev seed `seed:page-heroes`.
- Scope reviewed: only the BL-047 diff (AboutBlock.tsx, strength-icons.ts, icons.ts, homepage/blocks.ts, payload-types.ts, migrations/index.ts, migration 20261021_020651_about_stats_icons.{ts,json}, seed-page-heroes.ts, SPECIFICATIONS.md line ~71, design-spec.md line ~240). BL-046 and other changes were skipped.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` (rerun) | PASS (tsc --noEmit, 0 errors) |
| `pnpm test src/components/home/AboutBlock.test.tsx src/components/home/StrengthsBlock.test.tsx src/lib/content/careers-perks.test.ts` | PASS, 3 files / 15 tests |
| `pnpm lint`, full `pnpm test` | not rerun. Builder reported 0 errors and 344 files / 3531 tests passing. |
| migrate / seed | not run (out of scope for the reviewer, per instruction). Checked by reading the code. |

## Migration inspection
- up: 6 statements of `ALTER TYPE … ADD VALUE`. They only add values and do not use the new values in the same transaction. Postgres 12+ allows this inside a transaction, and the repo already does it (`20261020_103248_homepage_redesign`, `20261019_144259_homepage_market_blocks`, …). **OK.**
- Coverage: the snapshot `.json` uses these 3 enums only in `site_settings_careers_perks.icon`, `homepage_strengths_items.icon` and `homepage_about_stats.icon`. There are no `_v`, locale or version tables that use them. The columns have no `default`, so `DROP TYPE` will not be blocked by a dependency. down covers all 3 tables. **OK.**
- down order: column → text, UPDATE medal→star / users-three→users, DROP TYPE, CREATE TYPE with the old 8 values, cast back. Correct order, no cast error. **OK.** down loses data (it cannot tell medal from star after rollback). It only runs on rollback.
- HIGH_RISK_MIGRATION: up only adds values and changes no data, so the tag is not required for promotion. The DROP TYPE / type change in down only runs on rollback (see MINOR-3).
- `migrations/index.ts`: correct order, placed after `20261020_183923_site_redesign_page_heroes`. **OK.**
- `payload-types.ts`: the 3 unions add `medal | users-three`, matching `STRENGTH_ICONS`. `STRENGTH_ICON_COMPONENTS: Record<StrengthIcon, …>` has all 10 keys, and typecheck PASS proves it is complete. **OK.**

## Responsive Checklist Gate (diff touches UI: AboutBlock ≥ lg/xl)
Checked with CSS math only, no browser. Tokens: `--container-container: 80rem`, `--spacing-gutter: clamp(1rem, 0.6rem+1.7vw, 2rem)`, `gap-x-10` = 40px.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | The section is `overflow-hidden` (already there). The new absolute elements stay inside the cluster in % units. |
| Mobile-first / < lg unchanged | OK | All changed classes use the `lg:`/`xl:` prefix. Mobile keeps `aspect-[4/3] w-full`, the in-flow caption and `text-h2`. |
| Grid / container | OK | 12-column grid, unchanged. Columns are 7 (images) / 5 (text, `max-w-[27rem]`). No fixed px widths. |
| Typography rem / fluid | OK | `lg:text-h1` = `clamp(1.625rem, …, 3rem)`. At 1024 the text column is about 383px, and "Về TAMI HOMES" wraps by word without overflowing. |
| Media | OK | Images use `ResponsiveImage` + `sizes` (440px / 38vw / 100vw; 240px / 20vw; decor 10vw). This matches 62% of 7 columns (about 343px at 1024 and about 440px at 1280+). Decorative images are `decorative` + wrapper `aria-hidden`. |
| Overlap / readability ≥ xl | **FAIL** | See MAJOR-1: the decor image sits under the text column at 1280–~1390px. |
| Touch target | N/A | No new interactive element (video button and CTA unchanged). |
| Viewport / reduced-motion | N/A | No `100vh` and no new animation. |
| Error hidden by overflow:hidden | OK (with residual risk) | The caption is now anchored at `top-[66%]`, so it grows downward. In EN (4 lines that wrap more in a box about 100px wide at 1024) it can extend past the bottom of the cluster. The cluster `self-center`s inside 2 rows that are usually taller, so it is probably not clipped. Not verified in a browser. |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). The project's `pnpm lint` was used instead (Builder: 0 errors).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. 1 indicator (the `uploadLocalImage` / `uploadMockupImage` duplicate, MINOR-1), below the threshold of 3. Comments explain WHY. The file stays ≤ 300 lines.
- ai-friendly-web: N/A (no change to the public crawl surface: robots, sitemap or llms).
- blitzstrike: N/A (no auth, public API or input).

## Findings

### [MAJOR-1] The decor image covers the text column at 1280–~1390px. This breaks the acceptance criterion "Toà nhà trang trí mép phải không đè chữ" (decor building at the right edge does not cover text) and design-spec "không đè chữ"
`src/components/home/AboutBlock.tsx:86-91` (`hidden w-[10%] … xl:block`) together with `:91/:99` (text `lg:col-start-8 lg:max-w-[27rem]`).
- At viewport 1280: gutter ≈ 31.4px, column ≈ 64.75px. Column 8 starts at 31.4 + 7×104.75 ≈ 764.6px, and the text column is min(5 columns ≈ 483px, 27rem = 432px), so its right edge is ≈ 1196.6px. The decor box starts at 90% × 1280 = 1152px, so it **overlaps the text by about 45px** (the paragraph, h1, stats and CTA all fill to 432px).
- General formula for V ≥ 1280: text right edge = (V−1280)/2 + 1196.7. It overlaps while 0.9V is smaller, which holds up to V ≈ **1392px**. At 1440 there is no overlap.
- Before BL-047 (text column 7, 30rem → right edge ≈ 1140; decor 9% → 1152) there was no overlap. **This is a regression introduced by this diff.**
- Impact: at the overlap point, image opacity is 0.6 × mask ≈ 0.58, so up to ~35% of the green building shows behind `text-text-secondary`. The design-spec says text-secondary on `primary-subtle` is only ≥ 4.6:1, so a darker background can push contrast below 4.5:1 (WCAG 1.4.3).
- Suggested fix (pick one): show the decor only when there is room (`min-[1400px]:block` / `2xl:block` instead of `xl:block`), or cap the decor width with the outer margin (e.g. `w-[max(0px,calc((100vw-80rem)/2+…))]`), or cap the text column at xl so its right edge stays below 90vw. Then update design-spec line ~240 to match.

### [MINOR-1] Duplicate upload helper in the seed
`scripts/seed-page-heroes.ts:116-137` `uploadLocalImage` is almost the same as `uploadMockupImage` (`:64-78`). Only the root folder and `extract` differ. Suggestion: generalise one function with `(root, file, alt, extract?)`.

### [MINOR-2] Seed: header comment out of date, unclear error when the source image is missing, and icons on extra stats rows get wiped
- `scripts/seed-page-heroes.ts:1-4`: the header still describes BL-045 only. Add BL-047 (it overwrites `about.content`, `imageCaption`, `secondaryImage`, `decorImage` and the stats icons in vi/en). This dev seed overwrites any content an admin entered in the About block of the dev DB. That is acceptable for dev, but it should be stated.
- `:121` `readFile(path.join(SCRAPED, file))`: `seed/scraped*` is gitignored. A fresh machine without the folder gets a raw ENOENT error after the earlier steps have already written. Suggestion: check `existsSync` and log a warning before skipping the image, or throw an error that tells the user how to get the files.
- `:160` `icons[i] ?? null` sets the icon to null on stats row 3 and later (it does not keep the old icon). Suggestion: `icons[i] ?? row.icon`.
- The env guard (`checkSeedEnvironment` blocks production and staging/prod DATABASE_URL) is in place. Looking up images by `alt` keeps image creation idempotent. **OK.**

### [MINOR-3] down loses data, and the task file does not say so
`migrations/20261021_020651_about_stats_icons.ts:14-30`: on rollback, medal→star and users-three→users cannot be undone. down also has DROP TYPE and a column type change. Suggestion: add one Residual-risk line to the task file ("down lossy: medal/users-three được đổi thành star/users; up thuần additive, không HIGH_RISK"), so the deploy/rollback step knows.

### [MINOR-4] No test renders the 2 new icons
No test renders `medal` / `users-three` (in AboutBlock stats or StrengthsBlock). The `Record` type already makes the map complete, so the risk is low. Suggestion: add one AboutBlock test case where stat icon = `users-three` and check that the icon circle renders.

### Notes (not counted)
- design-spec line ~240 keeps the old description ("ảnh lớn vuông ~66%", "chữ cột 7–12") and then adds a note *As-built BL-047*. That is readable, but it is better to rewrite the main paragraph so readers do not get mixed numbers.
- The backdrop `about-backdrop` (left 6–40%) slightly overlaps the edge of the large image (38%+) and paints over it because it comes later in DOM order. This was already there before (overlap was 34–39%) and is now smaller. Out of scope.

## Verdict
**FAIL.** 1 MAJOR (MAJOR-1: the decor image covers the text column at xl 1280–~1390px, which is a regression and breaks the task's acceptance criterion). MINOR-1..4 should be fixed in the same round (optional).

Residual risk: the responsive gate was checked with CSS math only (no browser). Contrast on the overlap region and the EN caption height at 1024 are not measured.
