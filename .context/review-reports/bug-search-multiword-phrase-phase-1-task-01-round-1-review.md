Agent: reviewer

# Review — bug-search-multiword-phrase · phase-1-task-01 · round 1 (BL-103)

- Task: `tasks/bug-search-multiword-phrase/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-02-search-multiword-phrase.md`
- Diff scope (uncommitted vs HEAD): `src/lib/search/rental-search-sql.ts`, `src/lib/news/news-search.ts`, `src/lib/careers/job-filters.ts` + tests `src/lib/search/rental-search-sql.test.ts`, `src/lib/search/search-service.test.ts`, `src/lib/careers/job-filters.test.ts`, `tests/integration/{rental-search,news,job-postings}.test.ts`. Other dirty files are out of scope.

## Review level
**STRICT**

## Reason
Public SQL query shared by the `/cho-thue` list, total count and facets (`rentalConditions().other`). User input goes into a Postgres `~` regex, a `LIKE` pattern and a JS `RegExp`. Search behaviour changes on 3 public pages.

## Blast radius
- `rentalConditions` → `PostgresRentalSearch.search/listing` (list + count + facets + CTE pagination), `/api/public/rentals`, `/cho-thue`.
- `findFilteredNewsIds` → `/tin-tuc` + news category pages (filter applied before the `NEWS_FILTER_MAX_IDS` cap).
- `matchesJobKeyword` → `listOpenJobs` (`src/lib/careers/job-queries.ts:98`), `/tuyen-dung`; also used in `src/components/careers/JobListPage.test.tsx`.
- No schema, migration or API response-shape change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `pnpm vitest run src/lib/search src/lib/careers src/lib/news src/components/careers/JobListPage.test.tsx tests/integration/rental-search.test.ts tests/integration/news.test.ts tests/integration/job-postings.test.ts` | PASS: 18 files / 319 tests. Integration ran against DB tami 127.0.0.1:5433 and was not skipped (news.test hook logs visible). The WARN about `revalidateTag` outside Next is pre-existing and expected. |
| `pnpm exec eslint <9 changed files>` | PASS (no output, exit 0) |
| `pnpm build` | not re-run (builder reports PASS; typecheck PASS; diff adds no imports or modules outside lib) |

## Responsive Checklist Gate
N/A: the diff does not touch UI (route, component or CSS). It changes search logic only.

## Skill gates
- aislop: skip. Not on the reviewer's allowed verify-command list, and the diff is small. Manual read found no slop.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). ESLint on the changed files is clean.
- ocr (open-code-review): skip, ocr not installed / not allowed.
- AI-readable: OK. Names are clear (`keywordConditions`, `phraseConditions`, `phrasePattern`). Functions are under 50 lines. No indirection over 3 steps and no new magic numbers. 1 indicator: the comment / API doc at `news-search.ts:33` ("mọi từ phải có") is incomplete (see MINOR-2). Fewer than 3 indicators.
- ai-friendly-web: N/A (no change to public web surface or crawler files).
- blitzstrike: skip. Not installed / no permitted environment. Manual injection analysis is below.

## Security / correctness analysis
- **SQL injection:** every user value goes through a drizzle `${}` parameter (`LIKE ${...}`, `~ ${phrase}`). Nothing is concatenated as raw SQL. OK.
- **PG regex injection:** `escapeRegex` escapes `\ ^ $ . | ? * + ( ) [ ] { }`, which is the full set of ARE metacharacters outside a bracket. `-`, `#` and `:` have no special meaning outside a bracket or outside expanded mode. Directors `***=` / `(?x)` only work at the start of a pattern, and the pattern always starts with `WORD_START`, so they cannot be injected. OK.
- **JS regex (flag `u`):** `escapeRegExp` escapes the same syntax set. Under `u`, escaping syntax characters is a valid identity escape, and an unescaped `-` or `/` outside a class is valid. So a SyntaxError is not possible. Tests cover `c++ dev`, `a.b dev`, and `axb` not matching. OK.
- **ReDoS:** the patterns have no nested quantifiers. Only `[^…]+` sits between fixed literals. There are at most 8 terms, `q` is at most 100 characters, and job titles are short. PG uses its hybrid NFA/DFA engine. Risk is negligible.
- **ARE vs JS equivalence:** `[^[:alnum:]]` vs `[^\p{L}\p{N}]`. Both haystacks are already accent-stripped and lowercased, so they are almost entirely ASCII plus spaces. `_` is non-alnum in both. They could differ only on non-Vietnamese letters, depending on DB locale. This is negligible.
- **Count/facet consistency:** `keywordConditions` goes into `other`. The count and facets use the same WHERE as the list. Verified by unit test (`other` length 3; count has exactly 1 `~`) and integration test (`total` = 0 for `ba rong`/`pho dinh`/`dinh ba`, `listing.total` = 2 matches the list).
- **Single word unchanged:** rental still uses LIKE + `wordStartRegex`; news still uses substring LIKE; jobs still use `includes`. Covered by tests (`q: "can"`, `"dinh"`, `"ong"`, `"uyên"`).
- **Trigram:** each term keeps `LIKE '%t%'`, so the GIN trigram index can still be used. OK.
- **Pagination:** with the phrase filter, `phrase_match` is constant for every row. Order falls back to `published_at DESC NULLS LAST, id DESC`, which is stable. Integration test: limit 1 over pages 1/2 covers exactly the 2 phrase rows, and page 3 is empty. OK.
- **Rewritten old tests:** justified by the new rule and not weakened. Each changed positive case now has an explicit negative case: `bat dong <m>` / `san bat dong <m>` / `tu van <m>` → 0, `dong zq54` / `ong anh` / `quan len` → [], and count 5→2 with an assertion that `looseKeys` are excluded. The old "phrase first globally" ranking assertion was dropped, but that ranking no longer applies once the filter requires the phrase.
- **Repro closure:** `Repro Verification` status is `PASS`. The evidence is automated: the new regression tests fail on HEAD and pass after the fix. I checked this against the diff. For example, the unit test expects 1 `~` where the old code produced 2, and the old code's AND-per-word matched `pho dinh`. Tests rerun by the reviewer: PASS.

## Findings
### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
1. **Stale docs, must be reconciled at close-out before commit:** `docs/API_SPEC.md:157` (`q` Cho thuê: "mỗi từ khớp đầu một từ"), `docs/API_SPEC.md:451` (Tuyển dụng: "AND ≤ 8 từ"), `docs/API_SPEC.md:461` (Tin tức: "AND, `LIKE`"). They still describe scattered AND matching. The change doc acceptance requires updating them. Fix: in the close-out step, describe the rule "1 word = current behaviour; ≥ 2 words = contiguous phrase in typed order, first word at a word start" (the builder was not allowed to touch `docs/*` because of other work in progress).
2. `src/lib/news/news-search.ts:33`: the JSDoc of `findFilteredNewsIds` still says "mọi từ phải có — cùng `searchTerms` / `LIKE`" and does not mention the ≥ 2-word phrase rule (it is only in the `phraseConditions` JSDoc). Fix: add "≥ 2 từ: nguyên cụm (BL-103)" to that line.
3. Regression coverage for news on category pages has only a positive case (`dong anh` + `[scope.id]`). The negative phrase case is tested only on the general listing. Both go through the same `findFilteredNewsIds` WHERE, so the risk is low. Optional: add a negative case with `categoryIds`.
4. `phrase_match` in `search-service.ts` is now constant, so it costs one extra regex per row in ORDER BY. This is recorded in the Decision log as later cleanup. No action needed for this task.
5. `src/lib/careers/job-filters.ts:52`: `phrasePattern(terms)` builds a new `RegExp` for every title (up to 500 per request). Cost is negligible. Optional: build it once per `q` in `listOpenJobs`.

## Residual risk
- Not checked in a browser (a reviewer is not allowed to run the app). This is covered by integration tests against real Postgres.
- `[:alnum:]` depends on the DB locale. This is identical between local and staging if they use the same collation. Not verified on staging.
- For news, the phrase can span the title/excerpt boundary (haystack joined with a space). The builder accepted this.

## Verdict
**PASS**. No CRITICAL or MAJOR findings. Repro Verification is `PASS` with automated evidence that the reviewer reran (319/319). Close-out must reconcile `docs/API_SPEC.md` (MINOR-1) before commit.
