Agent: reviewer

# Review: feature-site-redesign-homepage-style, phase-1-task-00, round 1 (BL-045)

- Code under review: worktree `D:/prj/bds/.claude/worktrees/agent-aa988ecaa5ede265a` (branch `worktree-agent-aa988ecaa5ede265a`, base `9e96cbf`, not committed yet)
- Files: `src/lib/projects/project-filters.ts`, `src/lib/projects/project-queries.ts`, `src/lib/projects/project-queries.test.ts` (new), `src/components/projects/ProjectListPage.tsx`, `src/components/projects/ProjectListPage.test.tsx`, `src/components/projects/project-filter-params.test.tsx`. `src/payload-types.ts` was skipped because only its line endings changed.

## Review level: STRICT
**Reason:** This task changes the URL contract of the public `/du-an` page, the public project query (where draft projects could leak), and SEO noindex/canonical. The task file sets STRICT as the expected level.

## Blast radius
- `/du-an`, `/en/projects` (list, pagination, category chips, metadata).
- `listPublicProjects` is shared by every caller. When there is no `q` and the sort is `newest`, it runs the same single SQL query as before (a test checks this). Callers that do not pass the new parameters see no change.
- New function `listDevelopersWithPublicProjects`. T03 will use it later.
- No migration. No change to the REST API or the database schema.

## Verify commands + result (run by the reviewer in the worktree)
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/projects src/components/projects` | PASS: 10 files, 122/122 tests |
| `pnpm typecheck` | PASS (`tsc --noEmit`, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed (`tools/task-dashboard/server.mjs`, outside the diff) |
| `pnpm test` (full suite) | Integration failures are environmental, see below |
| `pnpm vitest run access jobs-email media-upload` (the 3 files the builder reported) | `access` and `media-upload` **PASS** when run alone. `jobs-email` fails in `beforeAll` with "Hook timed out in 10000ms" (Payload init against the real DB plus SMTP), followed by `Cannot read properties of undefined (reading 'destroy')` in teardown. **Not related to the task:** none of these 3 files touches `project-queries`/`project-filters`/`ProjectListPage`, and the failure is a timeout while initialising the environment. The many `Invariant: static generation store missing in revalidatePath` lines are log noise from existing tests and do not make any test fail. |

## Responsive Checklist Gate: N/A
The diff does not change UI, layout or CSS. `ProjectListPage.tsx` only receives query parameters and carries them into links. The keyword, developer and sort inputs belong to T03.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: `aislop` not installed (checked with `command -v`) |
| oxlint (anti-slop) | skip: oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). ESLint via `pnpm lint`: 0 errors |
| ocr (open-code-review) | skip: `ocr` not installed |
| AI-readable | OK: files are small (project-queries.ts 248 lines, project-filters.ts 102, ProjectListPage.tsx 187); each new function is under 50 lines; names are clear (`scanPublicProjects`, `pageOfScannedProjects`, `compareByPrice`); constants are named (`SCAN_MAX_PAGES`, `DEVELOPER_LIMIT`); comments explain why (Postgres NULLS FIRST on DESC, no migration allowed). 0 indicators. |
| ai-friendly-web | N/A: task does not touch llms.txt/robots/sitemap. It only adds noindex for filtered pages, which is correct. |
| blitzstrike | skip: not installed / no allowed environment. Security was checked manually (below). |

## STRICT checks (requested by the primary)
- **Public projects only, no draft leak: OK.** All 3 query paths (normal SQL query, scan query, refetch by `id in`) go through `findPublicList`. It always ANDs `publicWhere` (public status, not soft-deleted, `hasEnglish` on `/en`) and runs `overrideAccess: false`, `trash: false`. The `id in pageIds` refetch therefore cannot pull in a draft. Developers are also read through `findPublicList("developers")`, which has `hasEnglish` and soft-delete (checked in `payload-types.ts` `Developer.hasEnglish`).
- **XSS / injection via q: OK.** `q` never reaches SQL. It is only compared in memory with `String.includes` after `normalizeSearchText`. It shows up in links only through `URLSearchParams`, which encodes it, and React escapes the rest. The `developer` id is only used after it matches the list of public developers, and then goes into a parameterised `equals` clause.
- **Pagination after in-memory filtering: OK.** `totalDocs`/`totalPages` come from the filtered list, and `slice` is correct. A page beyond the last one returns empty results while keeping the totals, and `ProjectListPage` then calls `notFound()` (the existing `page > totalPages` check). With 0 results on page 1, `totalPages = 0` and the page does not 404. The refetch puts results back in id order, and `flatMap` safely drops docs that disappeared between the two queries. A test covers page 1, page 2 and a page that is out of range.
- **Sorting with empty prices last: OK.** `compareByPrice` puts `null` last in both directions. `Array.sort` is stable, so ties keep newest-first. A price of 0 is not treated as null (`??`).
- **noindex/canonical: OK.** `hasFilterParams` counts `q`/`developer` with a value, and `sort` other than the default. `sort=newest` and unknown sort values do not count. Tests cover `robots {index:false, follow:true}` + canonical `/du-an` for each parameter, and index for `sort=newest`.
- **p95 ≤ 500ms: acceptable at the current data size.** The no-keyword path with `newest` is unchanged. The q/price-sort path costs 1 scan query (50 docs, depth 1, select of 5 fields), 1 `id in` query, and a 2-query lookup of public developers when `?developer=` is present. With only a few dozen public projects this is well under 500ms. The cost grows linearly: by about 1000 projects it is 20 sequential queries, and above 1000 results are silently cut (see Residual risk).
- **Unknown values do not cause a 500: OK.** Unknown sort falls back to `newest`. An unknown developer id is dropped (tested). A `q` longer than 100 characters is ignored, using the same rule as the other parameters.

## Findings
- [CRITICAL]: none.
- [MAJOR]: none.
- [MINOR] `src/lib/projects/project-queries.ts` (`DEVELOPER_LIMIT = 50` in `listDevelopersWithPublicProjects`): if more than 50 developers have public projects, a valid `?developer=<id>` that ranks below 50 by `sortOrder` gets **silently dropped**. The page shows the unfiltered list but stays noindex. Suggested fix: on the filter path, check the id directly (`findPublicList("developers", { where: { id: { equals } } })` plus a check that it has a public project), or raise or remove the limit. The current data is small, so this does not block.
- [MINOR] `src/lib/projects/project-queries.ts` (`SCAN_MAX_PAGES` × `SCAN_PAGE_SIZE` = 1000): above 1000 public projects, results from the q/price-sort path are cut without any warning or log. Suggested fix: when the scan stops at the cap, log a warning (monitoring) so the team knows it is time for a `searchText` column plus a migration. The builder already recorded this as residual risk.
- [MINOR] `src/lib/projects/project-filters.ts` (`firstValue` used for `q`): a `q` longer than 100 characters is dropped entirely instead of being cut to 100. This is consistent with the other parameters and allowed by the spec, but **T03 must set `maxLength={100}`** on the input so a user cannot type a long keyword and see "no filter". This is a note to pass on to T03.
- [MINOR] Test gap: `ProjectListPage.test.tsx` only tests an unknown developer. There is no case where a valid developer id appears in `listDevelopersWithPublicProjects` and is passed on as `developerId` and carried into chip/pagination links. Suggested fix: add one test case.
- [MINOR] Doc impact: `docs/API_SPEC.md` (if it has a URL-params section) and design-spec S02 are not updated yet. The task file assigns these to the publisher/close-out. They must be reconciled before closing BL-045.

## Residual risk
- Cut-off at 1000 projects on the scan path, and query time growing linearly with the number of public projects.
- `jobs-email.test.ts` times out in `beforeAll` in this environment (not related to the task). The other 2 files pass when run alone.
- The reviewer did not open `/du-an?q=...` in a browser (no permission to run the app). The behaviour is confirmed by unit tests on the real contract of `listPublicProjects`, `parseProjectFilters` and `buildProjectListMetadata`, using a mocked Payload.

## Verdict: PASS
No CRITICAL or MAJOR findings. The acceptance criteria are met: q/developer/sort filter and sort correctly, the old filters still combine with them, `page` is kept, unknown values are dropped without a 500, noindex+canonical are correct, there is no migration, and typecheck/lint/scoped tests pass. The MINOR items can be handled in T03 or in a separate task.
