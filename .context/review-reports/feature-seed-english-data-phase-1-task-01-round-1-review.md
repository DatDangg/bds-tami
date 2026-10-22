Agent: reviewer

# Review: feature-seed-english-data, phase-1-task-01 (BL-064), round 1

- **Review level:** STRICT
- **Reason:** Bulk writes to the DB through Local API `overrideAccess` with hook-bypass context flags (`translationJob`, `approveEnglish`). It touches the legal-page approval path (BR-08) and the AI translation semantics (`enSource`, `sourceHash`). It also hooks into the shared seed pipeline (`seed/index.ts` SAMPLE_STEPS, `scripts/seed-scraped.ts`), and the deploy runbook runs that pipeline on staging. Two red-risk items apply: bulk update, and the environment guard.
- **Blast radius:** DB records in categories, developers, services, job-postings, pages, the homepage global, and media alt (locale `en`, plus the shared `hasEnglish` / `translation` group). Every caller of `pnpm seed --sample` is affected, including the staging container per `docs/runbooks/deploy.md` step 10. `scripts/seed-scraped.ts` is affected too. T02 to T04 depend on the data format and the export tool. No app code, schema, API or UI changed.

## Verify commands and results

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (no output after `tsc --noEmit`) |
| `npx vitest run tests/unit/seed-english-format.test.ts tests/integration/seed-english.test.ts` | PASS, 2 files and 12 tests. The `revalidatePath` WARN is expected outside Next. |
| `npx eslint seed/english tests/unit/seed-english-format.test.ts tests/integration/seed-english.test.ts` | clean |
| `pnpm seed:english` (dev DB 127.0.0.1:5433/tami, confirmed from `.env.local`) | exit 0. Every group reports `ghi 0`: categories 16, developers 29, services 3, job-postings 4, pages 2 and globals 1 are all unchanged; media has 20 unchanged and 461 with no EN yet. Idempotent. |
| `payload_jobs` before and after the seed run | `953 / max 2026-10-22 19:27:16` before and after. The seed queued no AI translation job. |
| SQL coverage (`deleted_at is null`) | categories 16/16, developers 29/29, services 3/3, job_postings 4/4, pages 2/2 |
| SQL `pages` | privacy and terms: `status=published`, `translation_status=done`, `en_source=manual`, `has_english=t`. Services and developers are all `done/manual`. |
| Full `pnpm test` / `pnpm lint` | Not rerun (the builder reported PASS: 424 files, 4442 tests). The targeted suites were run instead. |

## Engine correctness (focus points)

- **Never writes `vi`:** OK. Every write uses `locale: "en"` (`apply.ts:195`, `apply.ts:265`, `media.ts:398`). The integration test compares the whole `vi` doc, including array row ids, before and after (`seed-english.test.ts:143-166`).
- **No AI job:** OK. `WRITE_CONTEXT` carries `TRANSLATION_JOB_CONTEXT_KEY`. Confirmed by the unchanged `payload_jobs` count. There is no automated test for this (see MINOR-1).
- **`hasEnglish` only when required fields are filled:** OK. The flag is set in a second write after reading the stored EN back. It uses the same predicate `missingEnglishFields` and the `englishRequiredFields` from the collection config (`apply.ts:200-205`).
- **`enSource: manual` semantics:** OK. `translate-content.ts:91-94` returns `manual_kept` and only flips `viChangedAfterManual` when vi changes later. `sourceHash` uses the same `computeSourceHash`.
- **Array rows keep their ids:** OK. `buildEnglishWrite` (shared with the job) builds the write from the EN doc's rows, and a row mismatch fails the whole record.
- **Lexical:** OK. The engine clones the vi tree and replaces text nodes through the job's `applyTextNodes`. A node-count mismatch makes the whole record fail (`format.ts:67-77`, test `:178`).
- **Mismatch skips the whole record:** OK. `planWrite` returns `write: null` before any write.
- **Idempotency:** OK. Leaves are compared one by one (richText by stable hash) and only diffs are written. Confirmed by `ghi 0` across all groups.
- **Legal pages:** OK for a dev seed. `guardEnglishApproval` lets the flag through because of the `approveEnglish` flag. `approveEnglish` afterChange is skipped because of the job flag, so no audit-log row is written. That is acceptable for seeded data, and the README documents it.
- **D12 (site-settings `newsDetail.contactNote`):** Accepted. The vi value is empty, so there is no source to translate, and EN renders the i18n default. That is the same behaviour as a fresh admin-created site. `seed:english:export globals … missing` will surface the field once vi gets text.

## Responsive Checklist Gate

N/A. The diff has no route, component or CSS changes.

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip: aislop is not installed |
| oxlint (anti-slop) | skip: oxlint is not configured. eslint on the scope files is clean. |
| ocr (open-code-review) | skip: ocr is not installed |
| AI-readable | OK: every file is 153 lines or fewer and every function 50 lines or fewer. Names are clear, the README documents the flow, and comments explain why. 0 indicators. |
| ai-friendly-web | N/A: not public-facing |
| blitzstrike | N/A: no auth/API/input surface |

## Findings

### [MAJOR-1] The environment guard only blocks `APP_ENV=production`, but the spec says dev DB only, and the runbook now documents the step running on staging

- Files: `seed/english/index.ts:285-287`, `seed/index.ts:108-115`, `docs/runbooks/deploy.md:274`
- `SPECIFICATIONS.md:219` (BL-064) says: "chặn `APP_ENV=production`; **chỉ chạy DB dev** (không seed staging/prod)".
- Staging runs with `APP_ENV: staging` (`docker/docker-compose.staging.yml:29`), and runbook step 10 runs `docker exec tami-staging-app pnpm seed --sample`. The new last step of SAMPLE_STEPS will therefore write EN to staging. It also sets `enSource=manual` and `hasEnglish`, auto-approves the legal pages, and on later re-runs it reverts EN that editors changed on any record whose vi title matches. The diff to `deploy.md` documents exactly that staging behaviour.
- `pnpm seed:english` run from a shell whose `DATABASE_URL` points at staging or prod (but without `APP_ENV=production`) is not blocked either.
- The repo already has the right guard: `checkSeedEnvironment` in `src/lib/rentals/sample-amenities.ts:40-54`. It checks `APP_ENV=production`, `NODE_ENV=production`, and `DATABASE_URL` equal to `DATABASE_URL_STAGING` / `DATABASE_URL_PROD`, and only allows staging with explicit opt-in.
- Fix:
  1. Make `assertEnglishSeedAllowed` use `checkSeedEnvironment` without the staging opt-in, or with its own explicit opt-in.
  2. In the SAMPLE_STEPS step and in `seed-scraped.ts`, skip with a log line ("bỏ qua: không phải DB dev") instead of throwing, so `seed --sample` on staging still completes.
  3. Revert or correct the `deploy.md` sentence so it does not say staging gets the EN step.
  4. Add a unit test for the guard.
- If the change-request decides staging should get EN, `SPECIFICATIONS.md` must be changed through a CR first. The code must not quietly contradict the spec.

### [MINOR-1] No automated test for the key invariants "no AI job queued", "legal-page approve path", and "production guard"

- File: `tests/integration/seed-english.test.ts`
- These invariants were checked manually and by the reviewer through the `payload_jobs` count, but no test protects them.
- Fix: in the integration test, assert that no `translate-content` job is created for the test doc after `applyCollection`. Add one `pages` case (`hasEnglish` true, `translation.status` done). Add a unit test for `assertEnglishSeedAllowed`.

### [MINOR-2] Missing required EN fields cause a partial write while the log says the record was skipped

- Files: `seed/english/apply.ts:197-204`, `seed/english/index.ts:302`
- The content is written first and the error is thrown afterwards. The record is counted under `mismatched` and logged as "bỏ qua —", but its EN content is already stored.
- This is harmless because `hasEnglish` stays false, and README line 38 documents it. It still contradicts the "không ghi nửa vời" wording at README line 36 and in the log.
- Fix: check `missingRequired` against the merged EN (current EN plus the write) before writing. A slug that the hook generates still needs the post-write check. Alternatively, give this case its own log wording.

### [MINOR-3] The developer data contradicts the README's proper-noun rule, and some names are redundant

- File: `seed/english/data/developers.json`, against README line 62
- The README says Vietnamese diacritics are kept in proper nouns. The data strips them ("Phat Dat", "Tan Hoang Minh", "Vinh Son", "Phu My Hung").
- Stripping diacritics is the usual English convention, so the README should say so explicitly. Otherwise the T02 to T04 translators will be inconsistent.
- "Tập đoàn MIK Group" became "MIK Group Corporation", and the same happened with Prime Group and Sunshine Group. "MIK Group" alone is more natural.

### [MINOR-4] One media alt reads awkwardly

- File: `seed/english/data/media.json`
- "Green tower decorating the About TAMI page (dev sample)": alt text should describe the image. Suggested: "Green-facade tower (dev sample)".

### [MINOR-5] The README coverage SQL counts soft-deleted rows

- File: `seed/english/README.md:71-79`
- The note at line 85 says soft-deleted rows should be excluded, but the queries do not filter them.
- Fix: add `where deleted_at is null` to the queries.

### [MINOR-6] Salary string has no currency

- File: `seed/english/data/job-postings.json`
- "15 - 30 million + commission" has no currency. The value was carried over from the sample. Suggested: "VND 15–30 million + commission".

## Data quality (English)

- **Overall:** Natural, with correct real-estate terms ("Commercial premises", "Serviced apartments", "Townhouses and villas", "Brokerage", "Property listings"). Scope-specific choices check out against the DB: "Kinh doanh" is in the job scope, so "Sales" is right.
- **Vietnamese left in values:** None found in categories, developers, services, pages, job-postings, globals or media.
- **Homepage `about.title` / `titleAccent`:** The "About" + "TAMI HOMES" split matches vi ("Về" + "TAMI HOMES").

## Residual risk

- The `/en` pages were not rendered by the reviewer (no browser or app run is allowed). The builder's check was a text-only HTML check.
- Drafts/versions behaviour for collections that have `versions.drafts` (projects, news in T02 to T04) is not exercised by this task's data. An EN write without `draft` could interact with draft status. The T02 reviewer should check this.
- I did not check whether the staging Docker image includes `seed/english/data/*.json`. It becomes moot once MAJOR-1 is fixed.

## Verdict

FAIL. MAJOR-1 must be fixed: the environment guard must follow the spec's dev-only rule and the runbook wording must match. The MINOR items are recommended.
