Agent: reviewer

# Review: build/tami-website layer-6-task-02 (collection `rentals`), round 1

- **Review level:** STRICT
- **Reason:** new schema + migration + Postgres sequence, RBAC/field-level access (`code`, `rentedAt`, `searchText`), raw SQL inside the save transaction, a guard added to the shared `wards` collection, and a new entry in the public-query allowlist.
- **Blast radius:** new tables `rentals*` / `_rentals_v*` + sequence `rentals_code_seq`; `payload_locked_documents_rels` (new column); `wards` delete behaviour (new 409); `PublicCollectionSlug` (public pages in L7); Payload REST/GraphQL `/api/rentals` (public); seed sample step; `payload-types.ts`.
- **Scope:** uncommitted diff vs HEAD 71f1be6 (ignoring `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | skip (node_modules already present, lockfile not touched by the diff) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 110 files / 1212 tests, 0 skipped (DB integration incl. `tests/integration/rentals.test.ts` executed) |
| `pnpm build` | PASS (exit 0). Output lists `ƒ /api/[...slug]`, so the default Payload REST API is mounted publicly |
| `pnpm payload migrate` | not run (deploy-only per profile) |

## Responsive Checklist Gate
N/A: no UI in the diff (collection, hooks, migration and seed only).

## Skill gates
- aislop: skip, aislop not installed.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK. Files are ≤172 lines and functions are ≤50 lines. Names are explicit, the comments explain why, and indirection is ≤2. 0 indicators.
- ai-friendly-web: N/A (no public page in this task).
- blitzstrike: skip, not installed / no permitted environment.
- ponytail/karpathy (surgical diff): OK. Every changed line traces to the task. The ward guard sits outside the listed files but is justified (ruling 3). `relation-id.ts` is a small shared helper that is actually reused 3 times.

## Acceptance criteria
| AC | Result | Evidence |
|---|---|---|
| G12 allowlist | OK | `public-queries.ts:11` adds `rentals`. `src/lib/translation/allowlist.ts:10` already had it. Public list/slug test passes. |
| ERD §4.6 fields + `rentalTerms` | OK | `Rentals.ts:119-160`. Config test lists all fields and checks the group order. |
| `code` from sequence, read-only, no duplicates under concurrency | OK | `generate-code.ts:16-39`: `nextval` runs on the transaction session (`adapter.sessions[txId].db`), ignores client/overrideAccess input on create, keeps the stored code on update, and duplicate gets a new number. Tests: 20 parallel creates, overrideAccess create/update, duplicate. |
| Publish needs ≥3 images; price required unless negotiable | OK (MINOR-1 for `rented`) | `field-validators.ts:53-59, 90-99`. The default `upload` validator runs first (G22 lesson). The PDF case is tested. |
| `rented` → `rentedAt` | OK | `stamp-rented-at.ts`. Kept on re-save, cleared when leaving `rented`, manual value ignored. Tested. |
| `searchText` per locale incl. `legacyNames[].name` + project | OK | `build-search-text.ts:49-98`. The vi/en test checks that the other locale is refreshed when shared fields change. |
| Indexes ERD §5 (minus trigram) | OK | `migration:256-261` + `rentals_slug_idx` UNIQUE(slug,_locale). Asserted by the migration text test. |
| G22 ward ∈ province (filterOptions + server) | OK | `field-validators.ts:20-47` runs the default `relationship` validator first. Partial updates are covered. |
| L2-T02 follow-up `legacyNames[].name` | OK | `build-search-text.ts:60` |
| Tests listed in the task | OK | All 4 present and passing |

## Gate rulings
- **Race-safety of code generation:** OK. `nextval` is non-transactional, so a number is never reissued. Gaps happen on rollback, and also on every create that fails validation. ERD/SPEC only ask for uniqueness, not gapless numbering, so the gaps are acceptable. UNIQUE `rentals_code_idx` is the backstop.
- **Immutability:** OK. Covers field access `denyAll`, the hook override on create/update (including `overrideAccess`) and duplicate.
- **Direct SQL UPDATE of the other locale:** safe. It uses the drizzle `sql` tagged template, so every value is a bound parameter. The table name is a constant (default Payload naming, no custom `dbName`). It runs on the same transaction session inside `afterChange`, before commit. Caveat: MINOR-2.
- **Migration safety:** additive. No HIGH_RISK ops: all objects are new, plus `ADD COLUMN` (nullable) on `payload_locked_documents_rels`. `down` drops the sequence and uses IF EXISTS on the constraint and index. The prod/staging path is migrations only (profile forbids `db push`). The sequence is created in the test fixture after schema push only. That is acceptable because the push path is test-only.
- **Ward delete guard:** OK. Returns 409 and counts trashed rentals (tested).
- **videoUrl:** OK (ruling 2).
- **Public query safety:** OK for `findPublicList` / `findPublicBySlug` (statuses + hasEnglish + soft delete tested; `searchText` absent from the response). The default REST API is a separate problem, see MAJOR-1.
- **Seed:** OK. Creates `draft` only, idempotent by vi title including trash, clear errors when prerequisites are missing, and ward chosen from the same province.

## Findings

### [MAJOR-1] `showExactAddress` privacy can be bypassed through the default Payload REST/GraphQL API; `searchText` can be queried by guests
- `src/collections/Rentals.ts:134` (`address`), `:136` (`location`) and `:81-88` (`searchText`).
- Guest read access is `rentalsPublishedOnly` (published + rented), and `/api/[...slug]` is mounted publicly (build output). Neither `address` nor `location` has a field-level `read`. So `GET /api/rentals` returns the full house number and exact coordinates even when `showExactAddress = false`.
- This defeats the intent in ERD §4.6 ("có thể ẩn số nhà trên web"), API_SPEC line 109 ("Không trả `address` khi `showExactAddress = false`") and L7-T03 AC line 46 (exact coordinates must never reach the client).
- `hidden: true` on `searchText` only strips it from responses. Payload 3 `validateSearchParams` checks only field `read` permission and ignores `hidden` (verified in `node_modules/payload/dist/database/queryValidation/validateSearchParams.js:193-215`). A guest can therefore probe `where[searchText][like]=<số nhà>` as an oracle, and the field is also searchable through the REST API by anyone.
- **Fix:**
  - Add `access.read: ({ req, doc }) => Boolean(req.user) || doc?.showExactAddress === true` to `address` and `location`. Public pages and the search service then read through the server-side Local API with `overrideAccess` and their own mapping (`approximateLocation`).
  - Add `access.read: ({ req }) => Boolean(req.user)` (or `denyAll`) to `searchText`. The search service uses `overrideAccess`/SQL.
  - Add integration tests: (a) a guest REST/Local `find` with `overrideAccess:false` gets no `address`/`location` when `showExactAddress=false` and gets them when it is `true`; (b) a guest `where: { searchText: { contains } }` with `overrideAccess:false` is rejected (QueryError).
  - If the team prefers to close this in L7-T02/T03 instead, that needs an explicit user decision plus a follow-up AC. As shipped, it is an exposure introduced by this collection.

### [MINOR-1] The ≥3 images rule covers only `published`, but `rented` is public too
- `src/hooks/rentals/field-validators.ts:96`. Going `draft → rented` directly (or creating with `rented`) produces a publicly visible listing with fewer than 3 images.
- Fix: check `PUBLIC_STATUSES.rentals.includes(status)` and add a test.

### [MINOR-2] The latest version row keeps a stale other-locale `searchText`
- `src/hooks/rentals/build-search-text.ts:135-138` updates only `rentals_locales`. `_rentals_v_locales.version_search_text` for the other locale stays stale.
- Restoring that version would bring the stale value back until the next save in that locale. Search is unaffected.
- Fix: also update the latest `_rentals_v_locales` row, or document it in the hook comment.

### [MINOR-3] Same NOT NULL + `ON DELETE SET NULL` problem for `province`
- `migrations/20261017_143212_rentals.ts:178` (`rentals.province_id` is NOT NULL with `ON DELETE set null`). There is no province delete guard, so deleting a province with rentals gives a 500 instead of a clear 409.
- In practice the province's wards are likely already blocked. Proposed as a separate follow-up, not blocking.

### [MINOR-4] `searchText` goes stale when a project is renamed or a ward's `legacyNames`/name changes
- Documented limitation at `build-search-text.ts:111`. Ownership: see ruling 5.

## Rulings on builder decisions
1. **Trigram GIN deferred:** ACCEPT. `tasks/tami-website/layer-7-task-02.md:94` lists `migrations/* (GIN search_text gin_trgm_ops trên rentals_locales)`. The migration comment also records it.
2. **videoUrl host whitelist (https; youtube.com / youtu.be / tiktok.com + subdomains):** ACCEPT. It matches ERD §4.6 "YouTube / TikTok" and blocks `javascript:`/http, which matters because the URL is rendered as an embed/link. Optional: add `youtube-nocookie.com` if L7-T03 embeds that host.
3. **Ward 409 guard outside the listed files:** ACCEPT. It is a direct consequence of the new NOT NULL FK with SET NULL (otherwise a 500), it is minimal, and it is tested.
4. **Other-locale refresh via direct UPDATE:** ACCEPT. Parameterized, same transaction, and avoids nested `payload.update` side effects (audit, revalidate, versions). Caveat: MINOR-2.
5. **Stale searchText on project rename / ward edit:** the owner should be **L7-T02 (search-service)**. Add a follow-up AC there for an idempotent reindex/backfill command for `rentals.searchText`, plus either `afterChange` hooks on `projects`/`wards` that re-index affected rentals or a periodic job. That task already owns the search index.
6. **Projects.validateGallery default upload validator:** CONFIRMED as an existing follow-up at `tasks/tami-website/layer-6-task-05.md:103` (Projects.gallery + News.cover).

## Residual risk
- GraphQL exposure was not checked separately; it is assumed to follow the same access rules as REST.
- aislop/ocr/blitzstrike not run (tools not installed).
- Sequence behaviour under real migrations is verified only through the migration text test. The integration DB creates the sequence by hand after push.

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1: address/location privacy bypass and guest-queryable `searchText`). Everything else passes all verify commands. MINOR-1 is recommended in the same fix round.
