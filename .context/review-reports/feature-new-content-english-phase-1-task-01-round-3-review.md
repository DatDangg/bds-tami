Agent: reviewer

# Review — feature-new-content-english · phase-1-task-01 · round 3 (BL-072)

- **Review level:** STRICT
- **Reason:** this round loosens the "exactly 1 record" safety rule (D3) for the `categories` group, in a script that writes to staging/prod with `overrideAccess`.
- **Blast radius:** `seed/english/pack-plan.ts` (`allowsMultipleMatches`, `classifyKeyMatches`), `seed/english/pack.ts` (`planCollection`), the `pnpm english:pack` output for categories, plus docs (README § Gói EN, runbook) and tests. BL-064 (`seed:english`), media, globals and the import script are unchanged.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm test` | 435/436 files passed. 1 FAIL in `tests/integration/content-redirects.test.ts` with `Invalid package config ...date-fns/package.json while importing "date-fns/locale/en-US"`. This is a module-loading / filesystem error in the environment; the file is outside the diff and has no logical link to it. |
| Rerun once: `pnpm test tests/integration/content-redirects.test.ts tests/integration/english-pack.test.ts tests/unit/english-pack-plan.test.ts` | PASS: 3 files / 47 tests. The failure was transient, not a regression. |

Nothing was run that writes to the dev, staging or prod DB.

## Responsive Checklist Gate
N/A: the diff does not touch UI.

## Skill gates
- aislop: skipped. It is not among the verify commands allowed for the reviewer.
- oxlint: skipped, because the config could not be verified. eslint and tsc PASS.
- ocr: skipped. It is not among the allowed commands.
- AI-readable: OK, 0 indicators. The predicate has a clear name, a WHY comment explains the categories exception, and `planCollection` is about 18 lines.
- ai-friendly-web: N/A.
- blitzstrike: N/A.

## Focus checks
1. **Multi-match cannot spread to other groups: OK.**
   - `allowsMultipleMatches = (group) => group === "categories"` (`pack-plan.ts:53`) is an exact comparison.
   - `allowMultiple` defaults to `false`.
   - Media still calls `classifyKeyMatches(found.length)` without the second argument, so it still reports `duplicate`.
   - Globals do not go through the classify step.
   - Unit tests: categories ≥2 → `multiple`, projects ≥2 → `duplicate`.
   - Integration test: projects with the same name are still skipped (earlier test case still PASS).
2. **No-overwrite still applied per record: OK.** Each doc in the loop calls `applyToCollectionDoc(..., options)` separately. Inside it, `planWrite` → `existingEnglishConflicts` runs for that doc's EN. The integration test (`english-pack.test.ts:210-227`) confirms this:
   - The record whose EN differs ([rental]) is skipped and keeps "Editor Category".
   - The other record ([project]) is written.
   - `overwrite` writes both.
3. **Dry-run still writes nothing: OK.** The multiple path goes through the same `applyToCollectionDoc` with `dryRun`, which returns before any `update`. There is no separate write path.
4. **Limit 50: OK in practice, with a MINOR caveat.**
   - For groups that need exactly 1 match, any count of 2 or more is `duplicate`, so the limit does not matter.
   - For categories, 50 or more records with the same `vi` name is unrealistic: there are only a few scopes, and slugs are unique per (locale, scope, slug).
   - If there were more than 50, only the first 50 would be processed and nothing would be reported (see Findings).
5. **Log line identifies each record: mostly OK.** The line shows `<name> [<scope>]`. This is clear for the real case (the same name in different scopes) but not unique when 2 categories in the same scope share a name, for example child categories under different parents (see Findings).

## Findings
- **[MINOR]** `seed/english/pack.ts:67` — with `limit: 50`, if the categories group matches more than 50 records, records beyond 50 are never processed and no log line says so. Suggested fix: when `docs.length === 50` and the group allows multiple matches, add a `skip` line with a reason such as "more than 50 matching records, narrow the key", or raise the limit and report the total.
- **[MINOR]** `seed/english/pack.ts:75` — the label `${key} [${scope}]` is the same for 2 categories with the same name in the same scope (child categories under different parents), so the log cannot tell them apart. Suggested fix: add the id, e.g. `${key} [${scope} #${id}]`.

No CRITICAL or MAJOR issues.

## Residual risk
- When categories match several records, one key can produce a mixed result (one record written, one skipped because of a conflict). This is by design (per-record check) and each record gets its own log line.
- The dry-run of the multiple path is not tested separately in integration. It shares the dry-run path with the tests that already PASS.
- The `content-redirects` failure in the full run was caused by the environment (date-fns package config failed to load). It passed when rerun on its own.
- Carried over from round 2: the news create path has no end-to-end test; aislop, oxlint and ocr could not be run.

## Verdict
PASS (STRICT)
