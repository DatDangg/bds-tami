Agent: reviewer

# Review — feature-new-content-english · phase-1-task-01 · round 2 (BL-072)

- **Review level:** STRICT
- **Reason:** same as round 1. The scripts write to staging/prod DBs through the Payload Local API with `overrideAccess`, do bulk data writes, and change the shared engine `seed/english/*`. Round 2 also refactors the import engine (`seed/content/import.ts` → `import-data.ts`) and changes the order of news checks.
- **Blast radius:** `seed/content/{import,import-data,import-plan}.ts` (`pnpm content:import`: creating projects/news, `vi` only), `docs/runbooks/english-pack.md`, `.dockerignore` (Docker build context), `tests/unit/import-content-plan.test.ts`, `tests/integration/english-pack.test.ts`. No change to the gói EN engine or to BL-064.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm test` | PASS: 436 files / 4588 tests (+1 compared with round 1), exit 0. The integration tests ran on a temp DB. |

Nothing was run that writes to the dev, staging or prod DB.

## Responsive Checklist Gate
N/A: the diff does not touch UI.

## Skill gates
- aislop: skipped. It is not among the verify commands allowed for the reviewer.
- oxlint (anti-slop): skipped, because the config could not be verified (round 1). eslint and tsc PASS with no new errors.
- ocr: skipped. It is not among the allowed commands.
- AI-readable: OK, 0 indicators. `import.ts` is 251 lines and `import-data.ts` is 68 lines. Both are under 300 lines, every function is 50 lines or fewer, and the names are clear.
- ai-friendly-web: N/A (internal tooling).
- blitzstrike: N/A.

## Checking the round-1 fixes
1. **Runbook rollback / trash: OK.** `docs/runbooks/english-pack.md:47` now says that soft-deleted records still count as "đã có, bỏ qua" (already exists, skip). It lists 3 ways to re-import: restore from trash, permanently delete, or restore the dump. This matches the code (`trash: true` is kept).
2. **Backup variables: OK.** Line 18 explains `$U`/`$DB` (POSTGRES_USER/POSTGRES_DB) and `$OUT` (a folder outside the DB volume).
3. **Extracting `import-data.ts`: OK, parity confirmed.**
   - `projectData` matches the round-1 version field by field: title, slug, category, summary, overview/legalInfo/salesPolicy lexical, developer, salesStatus, province, optional ward, address, locationMedia, price, area, productTypes, featuredAmenities, scale, products, amenities, amenitiesImage, highlights, nearbyAmenities, priceTable, priceUpdatedAt, faqs, gallery, floorPlans, documents, author, status, publishedAt.
   - `newsData` matches the original object (title, slug, excerpt, content, tags, category, author, optional cover, status, publishedAt).
   - These are pure functions. The `create` calls stay in `import.ts` behind `!pass.dry` (lines 183, 218).
4. **News check order: OK, nothing can slip through.**
   - `alreadyExists = Boolean(meta.slug) && Boolean(await first(news, slug))` (`import.ts:201`).
   - `checkNewsEntry` skips its checks only when `alreadyExists` is true (`import-plan.ts:74`).
   - A NEW news item (slug not yet in the DB) is still fully checked for missing slug, missing title, `[CẦN KIỂM TRA]` (needs review) and missing cover when published.
   - A news item without a slug always has `alreadyExists = false`, so it is still reported as missing a slug.
   - Unit test `import-content-plan.test.ts:66-68` covers this, and the existing tests for new items are unchanged.
   - Small behaviour change from the original `.import-tmp` script, which threw on `[CẦN KIỂM TRA]` even for news already in the DB. This is intentional (it was round-1 finding #4) and harmless, because an existing item is never written.
5. **`.dockerignore`: OK.** `.import-tmp` and `.local-seed` were added at lines 39-40.
6. **Media dry-run integration: OK.** `english-pack.test.ts:234-239` spies on `payload.update` and asserts it is never called during the dry-run. The line status is `write`, and the EN alt stays empty after the dry-run.

## Findings
- **[MINOR]** `seed/english/packs/tmp-bl072-t02/projects.json` (untracked). This temporary pack is not part of T01; it looks like a T02 builder artifact or a scratch file. Fix: do not stage it in the T01 commit, and remove it or move it into T02's scope before close-out.

No CRITICAL or MAJOR issues. No regressions.

## Residual risk
Unchanged from round 1. The news create path is not tested end-to-end. The import `apply` is not atomic, but a rerun is idempotent. Hooks running inside the staging/prod container have not been tested for real. aislop, oxlint and ocr could not be run.

## Verdict
PASS (STRICT)
