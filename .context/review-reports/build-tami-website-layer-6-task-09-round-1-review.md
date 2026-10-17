Agent: reviewer

# Review — build-tami-website · layer-6-task-09 · round 1

`POST /api/public/job-applications` (multipart, CV, admin email)

- **Review level:** STRICT
- **Reason:** public unauthenticated endpoint, file upload, PII (name/phone/email/CV), Local API `overrideAccess: true` writes, and a change to the shared `private-files` collection config.
- **Blast radius:** new `src/endpoints/public/job-applications.ts`, `job-application-body.ts`, `job-application-messages.ts` (+ unit and integration tests); `src/shared/types/api.ts` (new `applicantLocaleSchema` / `jobApplicationFieldsSchema`, additive only); `src/payload.config.ts` (endpoint registration); `src/collections/PrivateFiles.ts` (the `mimeTypes` allow-list now also contains the stored MIME `application/msword`). This affects admin uploads to `private-files`, but it does not widen what is accepted (see G5). Data written: `private-files` rows and S3 objects in the private bucket, `job-applications` rows, `payload-jobs` (email). Consumer: L7-T04 (the form).
- **Scope reviewed:** the uncommitted diff against HEAD `fa17162`. I ignored `.claude/launch.json`, `.context/progress.json` and `.context/runs/*`.

## Verify commands + result (from `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 — 112 files / 1255 tests passed, **0 skipped**. The integration suite `tests/integration/job-applications.test.ts` therefore ran against a real temp DB, Redis and SeaweedFS. |
| `pnpm build` | exit 0 |
| `pnpm install --frozen-lockfile` | not run (no lockfile change in the diff) |

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| Order: rate limit 3/h/IP → Turnstile → zod (consent `"true"`) → posting `published` and not past `deadline` (400) | OK | `public-pipeline.ts:60-92`; `rate-limit.ts:12` (`limit: 3, windowSeconds: 3600`); `job-applications.ts:216-217`. Unit test "thứ tự…" (429 never reaches Turnstile, find or create); integration 429 test with Retry-After. |
| CV PDF/DOC/DOCX ≤ 5MB, real MIME check (415/413), stored in `private-files` with a random name | OK | `inspectUpload` uses magic bytes (`validate-file.ts:59-68`); name is `randomUUID().<detected ext>` (`job-applications.ts:122`), and the guard re-inspects and renames again. Integration: exe renamed to .pdf → 415; 6MB body → 413; PDF of 5MB+1 → 413; S3 object exists; filename matches a UUID. |
| Stores `consentAt`, `consentVersion` (= `privacyPolicyVersion`), `locale`, `ipHash` | OK | `job-applications.ts:155-169`. Integration reads `ipHash` straight from the DB (64-hex value). |
| Queues an email to `notificationEmails` (Vietnamese, includes the applicant's language) | OK | `job-applications.ts:191-203`; template `job-application.ts` (VI copy, `LANGUAGE_LABEL`, admin link, no attachment). Integration finds 1 `send-notification-email` job. |
| 200 `{ success: true, data: { received: true } }`; errors follow `locale` | OK | `ok({ received: true })`. Errors use `MESSAGES` vi/en; before the form is parsed, the language comes from Accept-Language. |
| Follow-up from L5-T04: reject expired, unpublished and soft-deleted postings; `locale` defaults to `vi`; create through Local API with `overrideAccess` | OK | Integration `it.each` covers expired, draft, trashed and missing; all return 400 with the same message and store nothing. `applicantLocaleSchema.default("vi")`. `overrideAccess: true` at `:126` and `:172`. |
| Follow-up G3: captcha errors keep the word "captcha" in vi and en | OK | `job-application-messages.ts:6,21`; `localizePipelineFailure:85`. |

## Security gates (blitzstrike-style manual review; MCP not used)

- **G1 Pipeline order and cost before Turnstile — OK.** Before Turnstile the only work is the Redis rate limit plus reading and parsing a body capped at 5.25MB. The token lives inside the multipart body, so reading it first is unavoidable. Nothing touches the DB, S3 or `findGlobal` before Turnstile and zod pass. The posting lookup comes after Turnstile.
- **G2 Multipart DoS — OK with residual.** `readBounded` rejects early on a declared `Content-Length`, and it also counts real bytes for chunked or lying bodies, then cancels the stream and returns 413. There is no explicit limit on the number of parts or fields, or on filename/header length. Total size is still bounded at 5.25MB, so the impact is CPU only. Peak memory is about 4 copies of 5MB per request (chunks → concat → FormData File → `arrayBuffer` → `Buffer.from`), and the rate limit is 3/h/IP (MINOR-4). Slowloris is out of scope.
- **G3 Upload validation — OK.** MIME comes from magic bytes; the client's Content-Type and extension are ignored. The stored extension is derived from the content, so double extensions cannot survive. `.doc` is detected as `application/x-cfb`, which also matches xls/ppt. That is a documented, accepted risk from L2-T01 (private bucket, downloaded only as an attachment), not new in this task. DOCX: `file-type` only peeks at zip entries and the app never extracts the archive, so I see no zip-bomb path. Payload's structural PDF check returns 400 `cvInvalid`.
- **G4 IP trust — OK (reuses the existing helper).** `getClientIp` (L1-T06) trusts only `CF-Connecting-IP` when `TRUST_CF_CONNECTING_IP=true`. It never trusts X-Forwarded-For. `ipHash` is `HMAC-SHA256(secret, "ip-hash:v1:"+ip)` (`ip-hash.ts:43`). Residual (pre-existing, outside this diff): no endpoint passes `remoteAddress`, so if the deploy forgets the flag, all clients share one bucket. For this endpoint that means 3 applications per hour site-wide. The deploy checklist must enable the flag.
- **G5 PrivateFiles MIME change — OK.** The allow-list is now pdf, docx, `application/x-cfb` and `application/msword`. `createUploadGuard` (beforeOperation) re-detects by magic bytes and overwrites `file.mimetype` before Payload checks `mimeTypes`. A client that declares `application/msword` cannot get past content detection, so the accepted formats are no wider than the policy.
- **G6 PII — OK.** Logs contain only `errorName`, `applicationId` and `cvId`. Responses return field names plus generic messages and never echo input. 500 responses use a generic body. Unit tests assert that email, phone, name and IP are absent from logs and responses.
- **G7 Enumeration — OK.** Missing, draft, trashed and expired postings all return the same message (`postingClosed`).
- **G8 Email — OK.** No CV is attached; the email carries a link to the admin page only. The HTML body is escaped (`layout.ts` `escapeHtml`). The subject contains only `jobTitle`, which an admin controls; the applicant's name appears only in the body, so there is no header-injection path from the applicant.
- **G9 Compensation — OK.** If creating the application fails, the code calls `payload.delete(private-files)`, and the S3 plugin deletes the object. A failure of that delete is logged with `cvId` and no PII.

## Rulings on the builder's decisions

1. **Deadline accepted through the whole deadline day in VN time — ACCEPT.** This matches L6-T08 AC "Danh sách lọc `deadline ≥ hôm nay (giờ VN)`" and design-spec §S12 "`deadline ≥ hôm nay`". ERD/SPEC only say "quá hạn" (past the deadline), so the deadline day itself is still open, which is consistent. Condition: L6-T08 must reuse the same helper (MINOR-2).
2. **No DB transaction; explicit compensation delete — ACCEPT.** S3 is not part of any DB transaction anyway, so compensation is the right pattern. However, no task sweeps orphaned CVs: I searched `tasks/tami-website` for "mồ côi" and "orphan" and found nothing. A process crash between upload and insert would leave PII with no owner record (MINOR-3, needs a follow-up).
3. **`privacyPolicyVersion` missing → `"unknown"` + warn; empty `notificationEmails` → saved without email + warn; queue failure → 200 + error log — ACCEPT.** ERD §4.x only forbids writing an empty `consentVersion`; `"unknown"` is explicit and is logged. Returning 200 after the row is saved avoids duplicate applications. The `log.error` must be wired to Loki alerting (residual).
4. **`ValidationError` → 400 `cvInvalid` — ACCEPT, with a note.** It is caught only around the `private-files` create, and that create passes `data: {}`, so the realistic source is the file check. Narrowing it to errors on the `file` path would be safer (MINOR-5).
5. **No `src/lib/email/templates/new-application.ts`; reuses the existing `job-application` template — ACCEPT.** The L1-T07 template already meets the AC (VI copy, applicant language, admin link, no attachment), and a duplicate would break DRY. The task file's "Files to Create" and its close-out must record this deviation (MINOR-6).

## Findings

### CRITICAL
None.

### MAJOR
None.

### MINOR
1. **`src/shared/types/api.ts` (`fullName`, `message`):** the strings accept NUL and control characters. PostgreSQL `text` rejects `\u0000`, so the insert throws and the user gets a 500 (the compensation still runs) instead of a 400. **Fix:** add a `.regex(/^[^\u0000-\u0008\u000B\u000C\u000E-\u001F]*$/)` refine (or strip those characters).
2. **`src/endpoints/public/job-applications.ts:42` `isPastDeadline`:** the helper lives in the endpoint file, and it relies on Payload `dayOnly` storing noon local time (the UTC date part equals the VN date). A deadline written through the API or a seed at VN midnight (`…T17:00Z` on the previous day) would close one day early. **Fix:** move the helper to `src/lib/` (for example `lib/dates/vn-day.ts`) so L6-T08 reuses it, and record the assumption.
3. **Orphan CV sweep is missing.** A crash between `storeCv` and `createApplication` leaves a CV (PII) that no application references, and no job cleans it up. **Fix:** add a follow-up to the gap register or the retention task (for example a cron that deletes `private-files` not referenced by any `job-applications` and older than 24h).
4. **`job-application-body.ts:23-54`:** there is no limit on parts or fields, and the body is copied about 4 times. Acceptable at 5.25MB with 3/h/IP. Optional: drop the extra `Buffer.from(bytes)` copy (`job-applications.ts:120`), and keep Nginx `client_max_body_size` at about 6m.
5. **`job-applications.ts:110`:** `ValidationError` is mapped to `cvInvalid` without checking `error.data.errors[].path === "file"`. **Fix:** narrow the match, and rethrow anything else so it becomes a 500.
6. **Task file and doc impact:** at close-out, record that `new-application.ts` was intentionally not created. Update API_SPEC §3.2 with the 413/415 codes, the field limits (fullName 2–120, message ≤ 2000, phone stored as E.164) and the localized error behaviour, or write `no doc impact` with a reason.
7. **`tests/integration/job-applications.test.ts:302`:** the test title says the S3 object is deleted, but it only asserts DB counts. **Fix:** capture the filename (for example through a hook or by listing before and after) and assert `objectExists === false`.

## Skill gates

| Gate | Result |
|---|---|
| aislop (`npx --no-install aislop scan --changes --json`) | **OK** — score 100 ("Healthy"), 0 issues in every engine |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc*`); eslint passes |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | **OK** — 0 indicators. Names are clear; every function is ≤ 50 lines; files are 266/117/49 lines (≤ 300); indirection ≤ 3; constants are named (`MB`, `VIETNAM_UTC_OFFSET_MS`, `MAX_MULTIPART_BYTES`); comments explain WHY. No change to the main flow requires ARCHITECTURE edits. |
| ai-friendly-web | N/A (API endpoint, no public page) |
| blitzstrike | manual STRICT pass (G1–G9 above); MCP not run. No STRIKE-validated finding. |
| Migration | N/A (no schema change) |

## Responsive Checklist Gate
N/A — the diff contains no UI (no route, component or CSS).

## Residual risk
- `TRUST_CF_CONNECTING_IP` must be `true` in staging/prod; otherwise the 3/h limit is shared site-wide (pre-existing behaviour of `client-ip.ts`).
- The `dayOnly` noon-storage assumption is not verified against the real Payload admin UI (no browser in this review).
- The queue-failure `log.error` depends on Loki alerting being configured.

## Verdict
**PASS** — no CRITICAL or MAJOR findings; all ACs and the L5-T04 follow-ups are covered by unit tests and real integration tests; lint, typecheck, test and build all pass. MINOR-3 and MINOR-6 should be tracked at close-out.
