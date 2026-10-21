Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-05 · round 1

- **Review level:** NORMAL
- **Reason:** The fix is scoped to `label` on 3 `ui` fields (no DB column, no API shape change) plus one integration test file. It does not touch auth, schema or the API contract. The shared list-column helper (BL-039) was checked for side effects.
- **Blast radius:** `src/fields/translation.ts` (`translationSummary`, which is in the shared translation group used by many collections), `src/collections/Leads.ts` (`activitySummary`), `src/collections/Rentals.ts` (`codeBanner`), `tests/integration/media-upload.test.ts`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no output/errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside scope) |
| `pnpm test` (full suite, DB + S3 local) | PASS: 333 files / 3422 tests, 0 fail (196.85s) |

## Checks
- **No duplicate label on the form:** OK. `TranslationSummary()` (TranslationSummary.tsx:14), `RentalCodeBanner()` (RentalCodeDisplay.tsx:25) and `LeadActivitySummary()` (LeadFormDisplay.tsx:53) take no props, so they cannot render `field.label`. RentalCodeBanner already renders the hardcoded text "Mã tin:", so a single label remains.
- **Does not affect list columns (BL-039):** OK. `list-filter.ts:41,74` decides on column visibility from `ui` + whether a `Cell` exists, not from the label. These 3 fields have only `Field` and no `Cell`, so they stay hidden from both columns and filters (`list-filter.ts:78`), same as before.
- **media-upload rewrite (R2):** OK and not weaker. The old 400 assertion was replaced with something stronger. A new image with no alt now returns 201 with `alt === "a"` (filename stem), which matches BL-042. PATCH with alt "" on that image returns 400, so the validator is still a safety net. The PDF case still returns 201. Both records created (image + PDF) are pushed into `mediaIds` so afterAll cleans them up. This also fixes the old bug where a 201 record was never cleaned up.
- **R3 root cause:** plausible. `homepage.test.ts:55` (`insertMedia`) inserts media with no S3 object, so with parallel runs `sort: -createdAt limit 1` can pick a record that has no file, giving a 404. The fix pins `uploadedJpegFilename` from test 1, which is correct and deterministic.
- **Surgical diff:** OK. Every changed line traces back to R1–R3.

## Skill gates
- Responsive Checklist Gate: N/A. Only `label` metadata changed on admin fields; no layout or CSS changed.
- aislop: skip, not run (scope is 3 label lines + 1 test). No slop seen when reading the diff manually.
- oxlint (anti-slop): skip, oxlint not configured (repo uses eslint: 0 errors).
- ocr: skip, ocr not installed.
- AI-readable: OK, 0 indicators. The new comment explains WHY (why the filename is pinned).
- ai-friendly-web: N/A (internal admin).
- blitzstrike: N/A (not a STRICT task).

## Findings
- [MINOR] `tests/integration/media-upload.test.ts:145-146`: test 2 depends on state set by test 1 (`uploadedJpegFilename`). If test 1 fails, test 2 fails with a confusing message (`/media/file/` returns 404). Suggested fix (optional): add `expect(uploadedJpegFilename).not.toBe("")` at the start of test 2. Not blocking, since the old test also depended on test 1's data.

No CRITICAL or MAJOR findings.

## Verdict
PASS
