Agent: reviewer

# Review: build-tami-website, layer-5-task-04, round 1 (`job-postings` + `job-applications`)

- **Review level:** STRICT
- **Reason:** new DB schema plus migration, candidate PII (`job-applications`: name/phone/email/CV/consent/ipHash), RBAC on content plus admin-only PII, a shared allowlist (`PublicCollectionSlug`), and a record contract that L6-T09 (public endpoint) and L9-T06 (data-retention) will depend on.
- **Blast radius:** `src/collections/JobPostings.ts`, `src/collections/JobApplications.ts`, `src/hooks/job-postings/guard-delete.ts`, `src/payload.config.ts` (collection registration), `src/payload-types.ts` (generated), `src/lib/content/public-queries.ts` (shared allowlist type), `migrations/20261017_130625_job_postings.{ts,json}` + `migrations/index.ts`, `seed/index.ts` + `seed/sample/job-postings.ts`, and `private-files` (FK target of `cv`). Downstream tasks: L6-T01/T08 (public list/detail), L6-T09 (apply endpoint), L6-T10 (CV download), L9-T06 (data-retention).
- **Scope:** uncommitted diff vs HEAD `9ababea` (`.claude/launch.json` ignored).

## Verify commands + result (from `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 104 files / 1099 tests (exit 0) |
| `pnpm test tests/integration/job-postings.test.ts` | PASS: 23/23, run against a real temp DB (`DATABASE_URL_TEST` set, so the suite was not skipped) |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | skipped: no lockfile change in the diff |

The integration fixture uses `push: true` on the temp DB, so the tests do **not** run the migration SQL. Instead I read the migration by hand (see the Migration section).

## Acceptance Criteria

| AC | Result | Evidence |
|---|---|---|
| G12: `job-postings` in `PublicCollectionSlug` (+ translation allowlist) | OK | `public-queries.ts:11`. `src/lib/translation/allowlist.ts:14` already lists `job-postings`, and `job-applications` is blocked (line 5). Test `job-postings.test.ts:308` |
| `job-postings` has every ERD §4.10 field; `deadline` is required and indexed | OK | `JobPostings.ts:59-79`, migration `deadline ... NOT NULL` + `job_postings_deadline_idx`. Tests `:175`, `:189`, `:223` |
| `job-applications`: only admin reads/updates; guest and sale cannot read; no REST create | OK | `JobApplications.ts:68` (`create: denyAll`). Tests `:356`, `:370`, `:389` |
| Submitted fields are read-only in admin | OK | `submittedFieldAccess` + `readOnly` (`JobApplications.ts:20-49,71,84`). Test `:410` |
| Statuses `new → reviewing → interview → hired \| rejected` | OK (set of values) | `JobApplications.ts:5,73-81`. Test `:398`. See ruling 2 |
| Required tests: sale PATCH/DELETE on another sale's posting → 403; soft delete + admin restore; category guard; sale GET apps → 403; guest POST → 403 | OK | Tests `:238`, `:247`, `:277`, `:356`, `:370` |

## Gates

- **PII access:** OK. Admin-only read/update/delete. `admin.hidden` hides the collection for non-admins. `ipHash` has `read: denyAll`, and the test at `:429` proves it is absent for admin but still stored in the DB. `cv` points at admin-only `private-files`.
- **No versions or trash copies of PII:** OK. No `versions`/`trash` and `disableDuplicate: true` (test `:344`). `job-applications` has no audit hook, so no PII is copied into `audit-logs`.
- **No PII in logs:** OK. The guard and seed log nothing. Test output only shows Payload's generic "You are not allowed".
- **PII lifecycle on delete:** **FAIL** (finding M1).
- **RBAC on postings:** OK. Uses the shared `withContentDefaults`. Sale is limited to own records, and only admin can restore or hard delete (tests `:238`, `:247`).
- **Migration safety:** OK. Additive only: CREATE TYPE/TABLE/INDEX plus two nullable `ADD COLUMN`s on `payload_locked_documents_rels`. No DROP, type change, or backfill on existing data. The FKs follow Payload's pattern (`NOT NULL` + `ON DELETE set null` on `job_posting_id` / `cv_id`). The posting side is guarded (ruling 1); the `cv` side is not (M1/m1). The custom `job_postings_list_idx` is plain additive SQL, is dropped together with the table in `down`, and is not in the snapshot `.json`, so there is no drift (same precedent as `projects_list_idx` / `news_list_idx`). Not `HIGH_RISK_MIGRATION`.
- **Public query safety:** OK. Guests do not see draft/hidden/soft-deleted postings, and `en` requires `hasEnglish` (test `:308`). Expiry filtering is deferred (ruling 4).
- **Category scope guard:** OK. Wrong-scope or missing category → 400. A category still used by a posting → 409 for both hard and soft delete (tests `:270`, `:277`).
- **Seed:** OK. Idempotent by `vi` title, including soft-deleted rows. Creates drafts with a future deadline. Missing province gives a clear error (test `:462`). Only runs on the `--sample` path, which is already blocked in production.
- **API_SPEC §3.2 compatibility (L6-T09):** OK. `jobPostingId→jobPosting`, `consent=true→consentAt/consentVersion` (server-set), `locale?` (the endpoint must default to `vi` because the field is required), `cv` (create the private-file first, then link it), `ipHash`. Everything can be written through Local API with `overrideAccess`.
- **Responsive Checklist Gate:** N/A. The diff touches no UI route, component, or CSS; only collection admin config.
- **aislop:** skip, `aislop` not installed.
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) PASS.
- **ocr:** skip, ocr not installed.
- **AI-readable / ponytail:** OK. 0 to 1 indicators. Source files are ≤ 125 lines, functions ≤ 50 lines, comments explain why, and names are clear. The 478-line test file follows the existing integration-test precedent.
- **ai-friendly-web:** N/A. Not a public-facing route in this task.
- **blitzstrike:** skip. There is no endpoint in this task (the public endpoint is L6-T09), and no environment is allowed.

## Findings

### [MAJOR]

**M1. Hard-deleting a `job-application` leaves the candidate's CV behind indefinitely.**
- Where: `src/collections/JobApplications.ts:68` (`delete: isAdmin`, with no `afterDelete` hook).
- Problem: deleting an application removes the row but leaves the `private-files` row (metadata and filename, which often contain the candidate's name) and the S3 object. Nothing references them afterwards, and the future `data-retention` job (L9-T06, ERD §7 "Xoá file CV") walks `job-applications`, so it will never find them. This breaks BR-31 (CV kept 12 months) and LGL-03, and it defeats the main reason an admin deletes an application: a candidate asking to have their data removed.
- Fix: add an `afterDelete` hook on `job-applications` that deletes the linked `cv` `private-files` doc, using Local API with `overrideAccess: true` and the same `req` so it runs in the same transaction. Add an integration test: admin deletes an application → the `private_files` row is gone. An alternative is `delete: denyAll` with all removal done by retention, but PERMISSION §3.3 gives admin ✔ and a deletion request must be possible, so the hook is preferred.

### [MINOR]

**m1. `cv` is required (`required: true` + `cv_id NOT NULL`) while its FK is `ON DELETE SET NULL`.**
- Where: `JobApplications.ts:28-35`, migration line 111 and line 137.
- Problem 1: deleting a `private-files` doc that is still referenced → Postgres NOT NULL violation → 500. This is the same class of error the posting guard already handles for postings.
- Problem 2: L9-T06 cannot "xoá CV" by nulling `cv`, because Payload's required validation and the DB constraint both block it.
- Fix: either now or in L9-T06, make `cv` required only until anonymised (a validate function that allows null when `anonymizedAt` is set) and drop NOT NULL on `cv_id`. Dropping NOT NULL relaxes a constraint, so it is low risk. If deferred, write it into the L9-T06 AC and ERD §4.10/§7 (ruling 3).

**m2. Tests do not prove admin cannot change `jobPosting`, `cv`, `consentAt`, or `anonymizedAt` through the API.**
- Where: `tests/integration/job-postings.test.ts:410-427`.
- The config does deny these fields, but the test only covers the text fields. Fix: add these fields to the payload of the existing test.

**m3. "Guest POST REST `/api/job-applications` → 403" is tested through Local API, not REST.**
- Where: `tests/integration/job-postings.test.ts:382-386` (Local API with `overrideAccess: false`, `user: null`).
- This is equivalent in Payload (REST uses the same access check), so the test is acceptable. Note it in the task evidence. A REST-level check can be added in L6-T09.

**m4. Admin deletion of an application (PII) is not audited.**
- Where: `JobApplications.ts`, which has no audit hook. Content collections use `audit-content-delete` instead.
- Not required by the AC. Suggestion only: if added, the audit summary must not include PII.

## Builder-flagged decisions: rulings

1. **Extra `guardJobPostingHardDelete` → 409:** acceptable. It prevents a 500 from `job_posting_id NOT NULL` + `SET NULL`, has a test (`:449`), and soft delete still works. Small, justified scope addition; record it in ERD §4.10.
2. **Status order not enforced:** acceptable. ERD §4.10 defines a set of values, and SPEC/BRD have no transition rule. Admin needs to be able to correct mistakes. If a strict workflow is ever wanted, it needs a Change Request. No user decision needed now.
3. **Retention vs `cv_id NOT NULL` + `SET NULL`:** owned by **L9-T06** (data-retention: anonymise leads after 24 months, delete CVs after 12 months). No user decision needed, because ERD §7 already states the intent (delete the CV, anonymise PII). The schema conflict is technical, and the fix is m1: conditional-required `cv` plus dropping NOT NULL, which is low risk. Fix it now or write it into the L9-T06 AC and ERD as a known gap. Note separately that orphan CVs from hard delete (M1) must be fixed in **this** task, because L9-T06's scan cannot reach them.
4. **Expired-posting hiding deferred to the layer-6 list query; detail page still reachable:** acceptable and consistent with the spec. DESIGN.md:305 says expired postings keep their page with a banner, `noindex, follow`, are dropped from the sitemap, have the form hidden, and have no JSON-LD. layer-plan says `close-job-postings` only revalidates (SPEC F6). FR-PUB-09 only requires hiding them from the list. Follow-up for L6-T01/T08: the public list must filter `deadline >= now`. Follow-up for L6-T09: the endpoint must reject applications to postings that are expired, unpublished, or soft-deleted.
5. **Custom `job_postings_list_idx (status, has_english, deadline)`:** acceptable. It matches ERD §5 line 554 (put `has_english` right after `status` in list indexes) and the non-partial precedent of `news_list_idx` / `projects_list_idx`. Doc impact: add a `job_postings` row to the ERD §5 table.
6. **Doc impact:** confirmed.
   - ERD §4.10: hard-delete guard 409; `cv` conditional-required / retention note if m1 is deferred; read-only submitted fields; `ipHash` never read.
   - ERD §5: `job_postings_list_idx` row.
   - PERMISSION §3.3: admin ✔ = read, update `status`/`note`, delete. Nobody (not even admin) creates through the API, and submitted fields are read-only.

## Verdict

**FAIL.** One MAJOR finding (M1: CV left behind after admin hard delete, a PII retention breach). Everything else passes: the ACs are met, verify is green, the migration is additive, and access and `ipHash` handling are correct. After M1 is fixed (hook plus test), round 2 can be FAST/NORMAL scoped to `JobApplications.ts` and the test. m1–m4 do not block.

## Residual risk

- The migration SQL is not run by the tests (fixture uses `push`). It was verified by reading it only. First real run will be `payload migrate` on dev/staging.
- aislop, ocr, and oxlint are not installed or configured, so those gates were not run.
