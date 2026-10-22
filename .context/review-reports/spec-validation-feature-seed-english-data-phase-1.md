Agent: spec-validator

# Spec validation: feature-seed-english-data (BL-064), phase 1, round 1

- Mode: **Phase review** (end of phase 1, MODIFY, seed data for the dev DB only)
- Date: 2026-10-23 · Branch: staging · Commits: 4f9809f (T01), 4e86e5c (T02), 906bd1c (T04), ff00d0b (T03)
- Requirement sources: `spec/changes/2026-10-22-seed-english-data.md` (Acceptance list) and `SPECIFICATIONS.md:219` (F12 "Dữ liệu dev song ngữ (BL-064…)")
- Task evidence: `tasks/feature-seed-english-data/phase-1-task-0{1..4}.md` (Verification summary)
- Reviewer verdicts: T01 r1 FAIL → r2 PASS; T02 r1 PASS; T03 r1 FAIL → r2 PASS; T04 r1 PASS (`.context/review-reports/feature-seed-english-data-phase-1-task-*-review.md`)
- Path note: the report uses the file name the launcher asked for (`spec-validation-…-phase-1.md`). It is round 1.

## Verdict: ✅ COMPLETE (no blocking gaps). There is 1 follow-up outside this change's scope and 3 residuals.

## Independent checks run by the validator (dev DB 127.0.0.1:5433/tami, dev server :3000 only)

| Check | Result |
|---|---|
| SQL `has_english` / total, excluding soft-deleted rows | projects 61/61 · rentals 32/32 · property_posts 38/38 · news 24/24 · services 3/3 · job_postings 4/4 · categories 16/16 · developers 29/29 · pages 2/2 |
| `media_locales` alt EN | 481/481 |
| `*_locales` rows vi vs en, EN slug | Each collection has vi rows = en rows = total, so no duplicates. EN slugs are all present and all match `^[a-z0-9-]+$`. |
| Globals: count of fields where vi has text and en is empty, across 20 tables `homepage/site_settings/header/footer*_locales` | **0** |
| `site_settings_locales.news_detail_contact_note` | Empty in both vi and en, which confirms D12 |
| `pnpm seed:english` (all groups), run once more | Every group reports `ghi 0`: categories 16, developers 29, services 3, job-postings 4, pages 2, projects 58, rentals 32, property-posts 38, news 24, globals 1, media 481 unchanged. 0 missing vi, 0 mismatched, exit 0. |
| `payload_jobs` after the seed run | No new jobs. The last `translate-content` job is at 19:41 UTC, from earlier test runs, before the 20:07 run. |
| Guard code | `seed/english/index.ts:24-33` `englishSeedBlockReason` blocks `APP_ENV=staging` and calls `checkSeedEnvironment` with `ALLOW_STAGING_SEED` disabled. Call sites: `scripts/seed-english.ts:10` (throws), `seed/index.ts:113` and `scripts/seed-scraped.ts:555` (skip). |
| curl `/en` (dev server started by the validator, then stopped) | `/en`, `/en/projects`, `/en/for-rent`, `/en/property-news`, `/en/news`, `/en/contact`, `/en/privacy-policy` all 200. Details all 200: `/en/projects/the-sunrise-bay-vinhomes-global-gate-ha-long`, `/en/for-rent/spacious-50-m2-1-bedroom-apartment-for-rent-on-the-7th-floor-at-nguyen-khac-hieu`, `/en/property-news/adjoining-townhouse-for-sale-at-elegant-park-thach-ban-southwest-facing-original`, `/en/news/udic-riverside-2-vinh-tuy-developer-reputation-and-capability` |
| Listing counts compared with DB | `/en/projects` "61 projects" (category tabs 28+14+10+9 = 61) = 61 published. `/en/for-rent` "27 listings" (11/8/6/2) = 27 published. `/en/property-news` "36 listings" = 36 published. |
| Remaining Vietnamese text on `/en` | Globals (header, footer, hero, contact, privacy): 0 Vietnamese words. The only diacritics are proper names (provinces, projects, developers, streets) and the following non-localized fields: `projects.address` ("Phường Hạ Long, Quảng Ninh"), `projects.nearbyAmenities.distance` ("15 phút"), `rentals.address` / property-posts address ("Phường Ba Đình, Thành phố Hà Nội", "Xã Ngọc Hồi"), and **`rentals.floor` ("Tầng cao", "Tầng trung", "Tầng thấp", "Tầng 7"…) under the "Floor" label on the rental detail page** |

## Acceptance coverage matrix

| # | Requirement (change doc) | Source | Status | Evidence / note |
|---|---|---|---|---|
| A1 | Every seed record of Projects, Rentals, Property posts, News, Services, Job postings, Categories has EN + `hasEnglish = true` | change doc L19; spec F12 | ✅ | SQL 100% on all 9 collections (developers and pages too, which exceed the requirement). Data files are in `seed/english/data/*.json`. 3 sample projects keep their EN from `seed/sample` (D8). |
| A2 | Public globals (homepage, sub-page hero, footer/general settings, contact, legal) have EN text, and `/en` has no blanks or fallback to Vietnamese | change doc L20; spec F12 | ✅ (with follow-up FU-1) | 0 global fields have vi text with an empty en value. `/en`, `/en/contact` and `/en/privacy-policy` have 0 Vietnamese words apart from proper names. `newsDetail.contactNote` (D12) is empty in vi on the dev DB, so the i18n en default renders and nothing is blank. The Vietnamese text that remains on collection pages comes from **non-localized** fields (address, distance, rentals.floor). Those fields are not "global" and the seed cannot write them without a schema change, which the change doc forbids ("Không đổi schema"). This is recorded as FU-1 and does not block. |
| A3 | Natural English, correct real-estate terms; proper names kept; EN slug follows existing rules | change doc L21; spec F12 | ✅ | Spot checks of the pages read as natural English ("Payment: 3 months' rent plus 1 month deposit", "pink book", "shell-only build", "Q4 2027"). Proper names keep their diacritics (fixed in T01 MINOR-3 and T03 M1). Slugs are generated by the hook from the EN title, all ASCII. Reviewers T02/T04 PASS, T03 r2 PASS. |
| A4 | Running the seed twice does not duplicate records or wrongly overwrite vi | change doc L22; spec F12 | ✅ | The extra validator run wrote 0 in every group. vi locale rows = total (no duplicates). The engine writes only locale `en`. T01 compared hashes of all `*_locales` vi rows before and after the run and found them identical. Integration tests `tests/integration/seed-english*.test.ts` also cover this. |
| A5 | Check `/en`, `/en/projects`, rentals, property-posts, `/en/news`, plus 1 detail of each type: data present, amenity/category counts correct | change doc L23 | ✅ | All 200. Listing counts match the published DB counts, and category tabs add up to the totals. Each detail page has an EN title and content and EN amenity names. The actual routes are `/en/for-rent` and `/en/property-news`. |
| A6 | Seed only on dev, never on staging/prod | change doc L24; spec F12 | ✅ | Guard is `englishSeedBlockReason` (staging/prod/NODE_ENV=production/URL matching staging-prod; `ALLOW_STAGING_SEED` cannot opt in). The CLI throws; the `seed --sample` and `seed-scraped` steps skip. Unit test `tests/unit/seed-english-guard.test.ts`. The validator ran only against the local dev DB. |
| S1 | No AI calls during seeding; `translation.enSource = manual` so the AI job does not overwrite | spec F12 | ✅ | D4 (status done, enSource manual, sourceHash = current vi). No new `translate-content` job after the run. Integration test spies on `payload.jobs.queue`. |
| S2 | Block `APP_ENV=production`; no schema change, no migration | spec F12 | ✅ | `checkSeedEnvironment` + guard. The 4 commits contain no migration. |
| S3 | `pnpm seed:english` also runs at the end of `pnpm seed --sample` and `seed-scraped` | spec F12; D9 | ✅ | `seed/index.ts:113`, `scripts/seed-scraped.ts:555` (with the guard skip) |
| S4 | Legal pages count as approved EN | spec F12; D4 | ✅ | pages 2/2 `hasEnglish`. `/en/privacy-policy` is in English. Integration test `seed-english-pages.test.ts`. |

## Assessment of the decisions

- **D1–D11** match the change doc and the spec delta. D3 differs in practice: the repo has no localized arrays, so rows are written by `rowId` the same way the translation job does it. Behavior is unchanged and this is not a gap. D9's residual (the `seed --sample` step on staging) was resolved in T01 fix round 1 (skip + log).
- **D12** (`newsDetail.contactNote` empty in vi, so no EN is written): this is correct and needs no gap entry. The spec only requires EN where vi has text. The `/en` page renders the i18n default.
- **Dev DB only**: correct per acceptance A6 and the spec delta. Staging/prod `/en` does not get this data. That is intentional, so it is not a gap.
- **Non-localized fields (address, `nearbyAmenities.distance`, `rentals.floor`)**: these do not violate A1 (all records have EN for the localized/translatable fields) and do not violate A2 (A2 is about globals, which are fully EN). They are still Vietnamese text visible on `/en`. Fixing them requires `localized: true` plus a migration, or a display-layer mapping (for example, an enum or label for `floor`). Both are outside BL-064, which is "no schema change". **Record them as follow-up FU-1 in `spec/changes/BACKLOG.md` (new change request)**. Do not lower A2 and do not mark BL-064 as failed.

## Gaps

- No [MISSING] gaps.
- No [PARTIAL] gaps inside BL-064's scope.

## Follow-up (outside scope, recommend recording in the backlog)

- **FU-1** Vietnamese text in non-localized fields on `/en`: `rentals.floor` (free text "Tầng cao/Tầng trung/Tầng thấp/Tầng N", shown under the "Floor" label, which is the most visible), `projects.nearbyAmenities.distance` ("15 phút"), `projects.address`, and the rental/property-post addresses ("Phường …, Thành phố Hà Nội"). Options: (a) localize the fields and add a migration, (b) normalize `floor` into an enum/number with an i18n label, (c) render addresses in a localized way (Phường → Ward, Xã → Commune). This needs a separate change request approved by the user.

## Residual risk

- R1: vi integrity across all 4 tasks depends on T01's before/after hash comparison plus the fact that the engine writes only `en`. The validator did not re-hash the vi rows; it confirmed that vi rows = total and that the rerun wrote 0.
- R2: The `revalidatePath … static generation store missing` warnings in the seed log are noise from running outside Next and do not affect data. Cache revalidation on staging is not verified, which does not matter because the seed does not run on staging.
- R3: Running `pnpm test` writes some `translate-content` jobs into the dev DB's `payload_jobs` (DATABASE_URL_TEST is the same as the dev DB). This existed before the change and is not related to the seed.
- Sample salary in `seed/sample/job-postings.ts` still has the old EN string; the EN step overwrites it with the new value (noted in the T01 residual, MINOR).

## Report rules

Phase 1 PASS. BL-064 can be closed (close-out, BACKLOG done, archive the change doc). FU-1 goes into the backlog as a separate item.
