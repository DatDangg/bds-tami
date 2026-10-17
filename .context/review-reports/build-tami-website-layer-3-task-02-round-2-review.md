Agent: reviewer

# Review: build/tami-website, layer-3-task-02, round 2

- Task: `tasks/tami-website/layer-3-task-02.md` (attempt 2)
- Diff: working tree compared with HEAD `383d39f` (tracked diff + untracked files). `src/payload-types.ts` differs only by line endings (`git diff --ignore-cr-at-eol` is empty), so it is out of scope.
- Previous round: `.context/review-reports/build-tami-website-layer-3-task-02-round-1-review.md` (FAIL: M1, plus minor items m1 to m7)

## Review level
**STRICT**

## Reason
The level is the same as round 1. This task adds shared fields and hooks that every content collection will use. It covers field-level and record-level RBAC, soft delete, restore and purge with audit, slug uniqueness per locale, and cache revalidation. Round 2 also adds a new way to override access (`fieldAccess`), which is itself an RBAC risk.

## Blast radius
- `src/collections/_shared/content-defaults.ts` (`withContentDefaults`, new `fieldAccess` option). It will be used by projects, rentals, property-posts, news, job-postings, services, pages and categories (layers 4 to 8).
- `src/lib/content/content-paths.ts` (`internalPath`, `contentPaths`) and `src/hooks/revalidate-content.ts`: invalidation of the Next cache for VI and EN public pages.
- `src/fields/slug.ts` (duplicate lookup and `locale: "all"` guard) and `src/lib/slug.ts` (`appendUniqueSuffix`).
- `src/access/denyAll.ts` and `src/access/index.ts` (new shared export) and `src/hooks/content-doc.ts`.
- Data: `audit-logs` (`content.delete/restore/purge`). There is no production schema change.
- Docs: `docs/ERD.md` §4.14 (as-built).

## Verify commands + result (re-run by the reviewer, commands from `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK (exit 0) |
| `pnpm lint` | OK (exit 0, no errors or warnings in the log) |
| `pnpm typecheck` | OK (exit 0) |
| `pnpm test` | OK: 63 files / 609 tests PASS (exit 0). This includes the integration test `tests/integration/content-defaults.test.ts` against real Postgres and the unit tests `content-paths.test.ts`, `slug.test.ts` and `_shared/content-defaults.test.ts`. |
| `pnpm build` | OK (exit 0). The route table shows `/[locale]` → `● /vi`, `● /en`. This matches the cache keys that `internalPath("/", locale)` generates. |

## Independent check of M1 (Next 16 + next-intl)
- `src/i18n/routing.ts:11-43,45-58`: `localePrefix: "as-needed"` and `pathnames`. Each key is the internal path (a folder under `app/(frontend)/[locale]/`, Vietnamese), and each value is the public URL for that locale.
- `src/proxy.ts:5-12`: the next-intl middleware rewrites public URLs (`/du-an/x`, `/en/projects/x`) to `/{locale}{key}` (`/vi/du-an/x`, `/en/du-an/x`). Its only change to the response is turning 307 into 301. It does not change the rewrite.
- `app/(frontend)` is a route group, so it is not part of the URL. The build table shows `● /vi` and `● /en`, which confirms the cache entries are keyed by the internal path `/{locale}...`.
- `src/lib/content/content-paths.ts:31-34` generates `/${locale}${key}`, with the home page as `/vi` and `/en` (no trailing slash). This matches the route table. For EN it uses the Vietnamese key (`/en/du-an/x`), which is correct for the rewrite destination. `encodeURIComponent` has no effect on slugs that are limited to `[a-z0-9-]`, and it stops a slug from escaping its segment (test `content-paths.test.ts:22-24`).
- `revalidate-content.ts:14-21,47-88` passes these internal paths to `revalidatePath`. It covers the detail page (including the old slug after a rename), the list pages for both VI and EN, and the home page when the record is featured.
- Tests now assert the correct contract: unit tests `content-paths.test.ts:9-35` (they also check that `[locale]/page.tsx` exists and that the paths contain no public URLs), and integration tests `content-defaults.test.ts:464-492`.
- Conclusion: **M1 is closed.** AC6 is met at the code level. Detail and list routes do not exist yet (layer 4). Revalidating a path that does not exist is harmless (it is a no-op).

## Round 1 minor items: closure check
| Item | Status | Evidence |
|---|---|---|
| m1: duplicate missed when the slug is truncated | **Closed (correctness)** | `src/fields/slug.ts:11,41` searches with `base.slice(0, 76)`. Every candidate from `appendUniqueSuffix` for a suffix up to `-999` contains that prefix, because the trimmed trailing hyphen is put back by the suffix and `slugify` collapses repeated hyphens. Integration test `:201-206` covers three 80-character slugs. See the new note n1 about performance. |
| m2: `locale: "all"` | **Closed** | `slug.ts:28` throws `APIError` 400. Test `:208-220`. |
| m3: no way to override field access | **Closed** | `content-defaults.ts:35,49-55,92-103` plus unit test `_shared/content-defaults.test.ts`. Collection-level access is still overridden through `collection.access` (`:73-79`). See note n2. |
| m4: duplicated `denyAll` / `ContentDoc` | **Closed within the task scope** | `src/access/denyAll.ts` and `src/hooks/content-doc.ts`. The old local `denyAll` copies in `AuditLogs.ts`, `ClickEvents.ts` and `ClickStatsDaily.ts` predate this task and are out of scope. Leaving them is surgical. |
| m5: integration test file is too long | Residual (written in the task file) | Acceptable for a test file. |
| m6: no test that an audit failure rolls back | **Closed** | Integration test `:371-391` spies on `payload.create` so the `audit-logs` write fails. It then checks that the soft delete is rolled back (`deletedAt` stays null), that the hard delete is rolled back (the record still exists), and that no audit entry is left behind. See note n3. |
| m7: known follow-up items | Residual (written in the task file) | Acceptable. |

## Regression check of the new changes
- **`fieldAccess` merge (RBAC):** the merge is shallow and opt-in. It only applies to top-level fields whose name the caller passes. With no option, the access stays exactly as in round 1 (`applyFieldAccess` returns the original array). The unit test confirms the default deny-all and a partial override (`update` changes, `create` stays deny-all). Nested fields (such as `translation.*`) keep their own access because only the group's access is merged. It does not widen access unless the caller asks for it. There is one small edge case (n2).
- **Duplicate lookup:** Payload's `like` on Postgres means `ILIKE %term%` (contains), not "starts with". The result set can therefore include unrelated slugs. This is still correct, because extra slugs only affect which suffix is free. There is no SQL wildcard injection, because `slugify` only produces `[a-z0-9-]`.
- `appendUniqueSuffix` (`src/lib/slug.ts:35-51`): the loop always ends because `taken` is finite. Unit tests cover the smallest free suffix and truncation.

## Responsive Checklist Gate
N/A. The diff has no UI changes (no route, component or CSS). The test only checks that `[locale]/page.tsx` exists and does not change it.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: `aislop` is not in the reviewer's allowed commands (only verify commands and git are allowed) |
| oxlint (anti-slop) | skip: oxlint is not configured. ESLint is the configured linter and it passes. |
| ocr (open-code-review) | skip: ocr is not installed and not in the allowed commands |
| AI-readable | OK. There are 0 or 1 indicators: names are clear, every function is under 50 lines, indirection is at most 2 levels, the magic number `4` has a name (`SUFFIX_SEARCH_RESERVE`) and a comment explaining why, and comments explain why rather than what. This is below the FAIL threshold of 3. |
| ai-friendly-web | N/A: not public-facing |
| blitzstrike | skip: not installed, and there is no environment where pentesting is allowed |

## Findings

### [CRITICAL]
None.

### [MAJOR]
None. (Round 1 M1 is closed.)

### [MINOR] (does not block PASS; for follow-up)
- **n1. The duplicate lookup is a "contains" search, not a "starts with" search.** `src/fields/slug.ts:41` uses `like` (which Payload turns into `ILIKE %prefix%`) together with `pagination: false`. The comment at `:8-10` and the task file call this a "prefix" search, but for a short slug (for example `can-ho`) it still loads every slug that contains that text. That is the performance half of round 1 m1, and it is still open. Correctness is fine. Separately, the invariant only holds for suffixes up to `-999`. This is negligible in practice.
  Suggested fix (optional): use `or: [{ slug: { equals: base } }, { slug: { like: `${head}-` } }]` plus a filter in JS, or a raw `LIKE 'prefix%'` query through the adapter. At minimum, change the comment to say "contains".
- **n2. `fieldAccess` accepts an explicit `undefined` and unknown field names without any error.** In `src/collections/_shared/content-defaults.ts:49-55`, `{ hasEnglish: { update: undefined } }` (the `Partial` type allows this) spreads over the deny-all function. Payload treats access that is not set as "allowed", so this would open the field to everyone. A field name with a typo is skipped silently. In that case access stays deny-all, so it fails closed.
  Suggested fix: drop keys whose value is `undefined` before merging, and throw if a name in `fieldAccess` does not match any shared field.
- **n3. The purge part of the m6 test deletes a record that is not in the trash.** In `tests/integration/content-defaults.test.ts:382-386`, the admin's soft delete is also rolled back, so `payload.delete` runs on a record that is still active. It does not run on a record that is in the trash. The test still proves that the audit in `afterDelete` is fail-closed. Also, `.rejects.toThrow()` has no message, so it would also pass if the call failed for some other reason. The checks on the record's state afterwards make up for this.
  Suggested fix (optional): restore `create` before the soft delete, then make the audit fail only during the purge, and assert the message `/audit hỏng/`.

## Residual risk
- The real Next cache was not observed at runtime. Detail and list pages do not exist yet (layer 4), and the reviewer does not run the app. M1 is confirmed by the routing config, `proxy.ts`, the folder structure and the build route table. A real check (revalidate, then see the new HTML) should be added when layer 4 builds the first detail page.
- Carried over from round 1: the "move to trash" button for sales in the admin UI, and document locking between two users, were not tested in the UI.

## Verdict
**PASS**: there are no CRITICAL or MAJOR findings. M1 is closed, and m1, m2, m3, m4 and m6 are closed. All verify commands pass when re-run by the reviewer. n1, n2 and n3 are minor follow-ups. n2 is recommended before the first collection uses `fieldAccess` (pages, layer 4+).
