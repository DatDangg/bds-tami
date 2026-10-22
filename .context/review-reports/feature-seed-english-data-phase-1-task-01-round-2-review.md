Agent: reviewer

# Review: feature-seed-english-data, phase-1-task-01 (BL-064), round 2

- **Review level:** STRICT (same level as round 1)
- **Reason:** This round re-checks the environment guard for a bulk DB writer that uses Local API `overrideAccess` with hook-bypass context flags. It also re-checks the hook into the shared seed pipeline (`seed --sample` and `seed-scraped`), which the deploy runbook runs on staging. Both are red-risk items: env/security guard and bulk update.
- **Blast radius:** EN locale of categories, developers, services, job-postings, pages, the homepage global and media alt on the dev DB. Every caller of `pnpm seed --sample` and `scripts/seed-scraped.ts`, including the staging container through runbook step 10. `checkSeedEnvironment` is reused but was not modified (`git status` shows no change to `src/lib/rentals/sample-amenities.ts`), so `seed:rental-amenities` and its other callers keep their behaviour. No app code, schema, API or UI changed.

## Verify commands and results

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx vitest run tests/unit/seed-english-format.test.ts tests/unit/seed-english-guard.test.ts tests/integration/seed-english.test.ts tests/integration/seed-english-pages.test.ts` | PASS: 4 files, 19 tests. The logged `APIError` with revalidate paths is the expected `revalidatePath` failure outside Next, raised from a create in the fixture. It is not a test failure. |
| `pnpm seed:english` (dev DB) | exit 0. Every group reports `ghi 0`: categories 16, developers 29, services 3, job-postings 4, pages 2 and globals 1 are unchanged; media has 20 unchanged and 461 with no EN yet. Projects, rentals, property-posts and news have no data file yet and are skipped. Idempotent. |
| `payload_jobs` count before and after the seed run | `960 / 2026-10-22 19:41:02` before and after. The seed queued no AI job. |
| `APP_ENV=staging pnpm seed:english` | Refused with "Seed dữ liệu EN chỉ chạy trên DB dev, không chạy được vì APP_ENV=staging.", exit 1. |
| SQL `developers` | 29/29 have `has_english`. The EN names keep Vietnamese diacritics; MIK, Prime and Sunshine show as "… Group". |

## Round 1 findings: closure

| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1: env guard | Resolved | `seed/english/index.ts:24-33`: `englishSeedBlockReason` blocks `APP_ENV=staging`, then calls `checkSeedEnvironment` with `ALLOW_STAGING_SEED: undefined`. That covers production, `NODE_ENV=production`, a missing `DATABASE_URL`, and a URL equal to staging or prod. `runSeedEnglish` asserts again at line 53, so there is defence in depth. `seed/index.ts` (the SAMPLE_STEPS step) and `scripts/seed-scraped.ts` return or log "bỏ qua: không phải DB dev (…)" without throwing, so `seed --sample` on staging still completes. The `deploy.md` step 10 wording now says staging skips the EN step. The staging refusal was confirmed by a real run. |
| MINOR-1: invariant tests | Resolved | `tests/unit/seed-english-guard.test.ts` covers dev allowed, production/staging/NODE_ENV/missing URL blocked, a URL equal to staging/prod blocked, and `ALLOW_STAGING_SEED=1` not opening the guard. `tests/integration/seed-english-pages.test.ts` covers a legal page: `hasEnglish` true, done/manual, vi unchanged, no `jobs.queue`, idempotent re-run. The projects integration test now spies on `jobs.queue`. |
| MINOR-2: partial write | Resolved | `apply.ts:66-80`: `missingBeforeWrite` merges the current EN with the planned top-level leaves and drops `slug` before any write. Every `englishRequiredFields` entry in `src/collections/*` is a top-level field name, and `missingEnglishFields` reads `english[field]`, so the top-level-only merge is correct. The post-write check stays in place as a safety net. The integration test asserts that the EN title is not written. |
| MINOR-3: proper nouns | Resolved | The data keeps diacritics and the "Corporation" suffixes were removed. README line 62 states the rule. |
| MINOR-4: media alt | Resolved | `media.json:21` now reads "Green-facade tower (dev sample)". |
| MINOR-5: README SQL | Resolved | README lines 71-79 now filter on `deleted_at is null`. |
| MINOR-6: salary | Resolved | `job-postings.json:12` now reads "VND 15–30 million + commission". |

## Regression check

- **`checkSeedEnvironment` unchanged:** OK. The file is not in the diff, and the override happens in a copied env object, so the caller's env is not mutated.
- **Skip-not-throw on non-dev:** OK. Both call sites check `englishSeedBlockReason(process.env)` before calling `runSeedEnglish`.
- **`missingBeforeWrite`:** OK. It is skipped when EN `hasEnglish` is already true, so existing records are not newly blocked. Globals call `planWrite` without `required` (default `[]`), so they are unaffected.
- **Idempotency and vi safety:** OK. The dev run shows 0 writes and an unchanged job count.

## Responsive Checklist Gate

N/A. The diff has no route, component or CSS changes.

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip: aislop is not installed |
| oxlint (anti-slop) | skip: oxlint is not configured. The builder reports eslint clean on `seed` and `tests`; the reviewer did not rerun it. |
| ocr | skip: ocr is not installed |
| AI-readable | OK: small files and functions, the README is updated, and comments explain why. 0 indicators. |
| ai-friendly-web | N/A: not public-facing |
| blitzstrike | N/A: no auth/API/input surface |

## Findings

### [MINOR-1] `seed:english:export … missing` now flags proper nouns that keep diacritics

- File: `seed/english/README.md:65`
- Because of the MINOR-3 decision, the "still Vietnamese" check in `missing` mode lists developer names such as "Phát Đạt Group". The README documents that these can be ignored. The output is still noisy for the T02 to T04 translators, who may have to filter many project and place names.
- Optional follow-up: have the export skip fields whose EN differs from vi and only flag fields where EN equals vi or is empty.
- This does not block.

### [MINOR-2] Stale salary text in the sample seed (carried over)

- File: `seed/sample/job-postings.ts`
- The sample seed still writes "15 - 30 million + commission", and the EN step then overwrites it on dev. On staging the EN step is skipped, so the old string stays.
- This is outside scope and harmless.

## Residual risk

- The `/en` pages were not rendered by the reviewer, who is not allowed to run the app.
- The behaviour of collections with drafts (projects, news) under EN writes should be checked in T02 to T04.
- The full `pnpm test` and `pnpm lint` were not rerun. The builder reports 426 files and 4449 tests PASS. The targeted suites were run instead.

## Verdict

PASS. MAJOR-1 and all six round-1 MINOR items are resolved, and no regression was found. The two remaining MINOR items do not block.
