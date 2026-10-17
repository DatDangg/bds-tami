Agent: reviewer

# Review: build/tami-website layer-6-task-02 (collection `rentals`), round 2

- **Review level:** STRICT
- **Reason:** new schema/migration/sequence, field-level RBAC on privacy-sensitive fields (`address`, `location`, `searchText`), raw SQL in the save transaction (now also on the version table), a shared delete guard on `provinces`/`wards`, and a public-query allowlist entry. Round 1 had a MAJOR privacy finding.
- **Blast radius:** tables `rentals*`, `_rentals_v*`, sequence `rentals_code_seq`, `payload_locked_documents_rels`; `provinces` + `wards` delete behaviour (409); public REST `/api/[...slug]` for `rentals`; `PublicCollectionSlug` (L7 public pages); seed sample step; `payload-types.ts`; docs ERD §4.2/§4.6/§5 and PERMISSION §4.
- **Scope:** uncommitted diff vs HEAD 71f1be6. Ignored: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`, and the appended follow-up in `tasks/tami-website/layer-7-task-02.md`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | skip (node_modules present, lockfile untouched) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 110 files / 1218 tests, 0 skipped. Includes the DB integration suite `tests/integration/rentals.test.ts` |
| `pnpm build` | PASS. `/api/[...slug]` is still mounted publicly, which is expected; field access now covers it |
| `pnpm payload migrate` | not run (deploy-only per profile) |

## Responsive Checklist Gate
N/A: no UI in the diff (collection, hooks, migration, seed, docs only).

## Skill gates
- aislop: skip, not installed.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK. `Rentals.ts` is 178 lines and the hooks are each ≤148 lines. Every function is ≤50 lines. Comments explain why, indirection is ≤2 steps, and the docs were updated. 0 indicators.
- ai-friendly-web: N/A (no public page in this task).
- blitzstrike: skip, not installed / no permitted environment.
- Surgical diff: OK. The `Provinces` change is the round-1 MINOR-3 fix and is minimal (a list of collections plus a loop). Every other line traces to the task or a round-1 finding.

## Round-1 findings: closure
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1 address/location/searchText exposure | **CLOSED** | `Rentals.ts:85` `readExactAddress = isStaff({req}) \|\| doc?.showExactAddress === true` is applied to `address` (`:141`) and `location` (`:143`). `searchText` read access is `isStaff` (`:93`). Tests at `rentals.test.ts:480-530` cover guest find/findByID with `overrideAccess:false`, the `true` case, guest `where` on searchText/address/location `near` → 400, `sort=address` → 400, and staff can still filter. |
| MINOR-1 ≥3 images for `rented` | CLOSED | `field-validators.ts:97` uses `PUBLIC_STATUSES.rentals`; test `rentals.test.ts:333` |
| MINOR-2 stale version-row searchText | CLOSED | `build-search-text.ts:141-144`; test `rentals.test.ts:457-461` asserts the latest `_rentals_v_locales` row |
| MINOR-3 province delete 500 | CLOSED | `Provinces.ts:6-28`; tests `rentals.test.ts:533+` |
| MINOR-4 stale searchText on project/ward rename | Deferred to L7-T02 (documented in ERD §4.6 as-built and in the hook comment) | accepted in round 1 |

## Independent checks requested by primary
- **Per-document evaluation in list responses:** OK. Payload runs field `read` in `afterRead` once per document with that document's `doc`. The list test (`guestFind`) and the findByID test both pass.
- **Versions:** OK. `withContentDefaults` sets no `access.readVersions`. When that access is undefined, Payload's `executeAccess` allows only `req.user`, so guests get 403 on `findVersions`, `findVersionByID` and `countVersions` (`findVersions.js:41`, `findVersionByID.js:42`, `countVersions.js:32`). This also rules out the edge case where an older version had `showExactAddress=true` and was later hidden: guests cannot reach versions at all. Staff can, which is intended.
- **GraphQL:** N/A. `payload.config.ts:75` sets `graphQL: { disable: true }`.
- **Depth-populated relations:** OK. No collection in `src/` has `relationTo: "rentals"`, apart from the admin-only `payload_locked_documents`. If one is added later, Payload still applies field `read` in `afterRead` to populated docs.
- **`?select=` / `?depth=` / distinct:** OK. `select` does not bypass `afterRead` field access. `findDistinct.js:95-101` calls field `read({ req })` without `doc`, so guests are denied (Forbidden), and the `hidden` check blocks `searchText` as well.
- **Guest `where[address]` rejection vs public filters:** OK. SPEC/ERD do not list address/location/searchText as public filters. `findPublicList`/`findPublicBySlug` run as guest (`public-queries.ts:29-35`) and only filter on status/hasEnglish/deletedAt. Public text search (L7-T02) is documented to run server-side with `overrideAccess`. Approximate location (L7-T03) is documented as computed server-side.
- **Raw SQL (version row):** OK. It uses the drizzle `sql` template, so `searchText`, `doc.id` and `locale` are all bound parameters, and the table names are constants. It runs on the request transaction session. Payload's update saves the version before `afterChange`, so `ORDER BY created_at DESC, id DESC LIMIT 1` targets the version just written. "Versions disabled/absent" cannot happen for this collection, because `withContentDefaults` always enables versions (`content-defaults.ts:141`, `drafts:false`). If a future change turned versions off, the second UPDATE would error on the missing table. That is acceptable for now, but see MINOR-B.

## Findings

### [MINOR-A] Generated types say `address` is always present, but guests may not receive it
- `src/payload-types.ts` (Rental.address is `string`, required). Field `read` access is not reflected in the generated types, so L7 page code could render `rental.address` without a guard and output "undefined".
- Fix (in L7-T03): treat `address`/`location` as optional in the public mapper, e.g. `rental.address ?? null`. Alternatively, add an AC there.

### [MINOR-B] The version-row UPDATE assumes versions are always enabled
- `src/hooks/rentals/build-search-text.ts:141-144`. Versions are always enabled today through `withContentDefaults`. A one-line comment, or a guard on `req.payload.collections.rentals.config.versions`, would stop a future config change from breaking every save. Not blocking.

### [MINOR-C] The province guard's `rentals` branch is never isolated by a test
- `tests/integration/rentals.test.ts:536-550`. Every rental belongs to a ward in the same province (G22), so the `wards` check always fires first. The `rentals` branch (including soft-deleted rentals) acts only as defence in depth and never runs on its own. `projects` is isolated (`:552+`). Not blocking.

## Residual risk
- REST HTTP was not exercised end to end (no running app). The coverage comes from Local API `overrideAccess:false`, which uses the same operations and field-access path as REST.
- aislop/ocr/blitzstrike were not run (not installed).
- The migration was verified through its text and the integration push only. The real `payload migrate` runs at deploy time.

## Verdict
**PASS**: 0 CRITICAL, 0 MAJOR. MAJOR-1 and MINOR-1/2/3 from round 1 are closed and tested. Lint, typecheck, test (1218/1218) and build all pass. Three non-blocking MINORs are recommended as follow-ups (MINOR-A belongs in L7-T03).
