Agent: reviewer

# Review — bug-admin-forgot-password-hardening · phase-1-task-01 · round 1 (BL-100)

- **Review level:** STRICT
- **Reason:** auth flow (`POST /api/staff/forgot-password`, account enumeration), shared email adapter (every Payload mail + job `send-notification-email`), startup `onInit` (web + jobs). Security bug.
- **Blast radius:** `src/collections/Staff.ts` (endpoint order), new `src/endpoints/admin/staff-forgot-password.ts`, `src/lib/email/transport.ts` (`createEmailAdapter` now async + `guardSendEmail` wrapper -> all `payload.sendEmail` callers incl. job retry path), `src/payload.config.ts` (`email`, `onInit`), new `src/lib/email/send-error-fields.ts`, `src/lib/email/smtp-config.ts`. No schema/API-shape change (forgot-password response body/status identical to Payload's success response).

## Verify commands + result
| Command (from `.context/project-config.md`) | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no output) — confirms Payload config accepts `Promise<EmailAdapter>` |
| `pnpm lint` | PASS (eslint, no errors) |
| `pnpm test` | PASS — 460 files / 4842 tests |

Live server not checked by reviewer (out of allowed commands); builder's live evidence (dev, smtp.invalid) recorded in task file is consistent with code reading below.

## Code verification (against Payload 3.91 source in node_modules)
- **Uniform response:** with a string email the endpoint returns 200 `{message: req.t('general:success')}` before the default handler runs — identical to `auth/endpoints/forgotPassword.js` success response; `handleEndpoints.js:200` re-wraps every handler response with `headersWithCors(mergeHeaders(req.responseHeaders, …))`, so CORS parity holds.
- **400 paths:** invalid JSON (`addDataAndFileToRequest` on clone -> APIError 400), missing/non-string/empty email (delegated to default handler -> `Missing email.` 400), and multipart errors all happen before any DB lookup -> independent of account existence. No leak.
- **Rate limit:** `minRequestInterval` (15s) reservation in `forgotPasswordOperation` still runs inside the background handler (atomic `updateOne` on isolated req without transaction); on send failure `releaseRequestInterval` + `killTransaction` run inside the operation's own catch -> no orphan token (better than original design, as Decision log says).
- **Background lifetime:** default handler uses the original `req` (body stream untouched because parsing is done on `req.clone()`); its transaction is initialised/committed/killed entirely within the operation, after our response is built; nothing in `handleEndpoints` touches the req transaction after `handler(req)` returns. Rejection is caught (`.catch` -> whitelisted log) -> no unhandledRejection (test asserts it).
- **Log hygiene:** `pickSendErrorFields` keeps only `name`/`code`/`responseCode`/`command` (64-char cap); no message/stack/err object/email/token/SMTP creds. Logger additionally redacts `email`/`password`/`message` keys. Adapter warn logs only `{dropped, appEnv}`.
- **Allowlist at adapter:** `filterRecipients` returns input strings unchanged (normalises only for comparison), so `result.allowed.includes(entry.address)` matches case-insensitively and production keeps everything. Zero allowed -> transport not called, returns `undefined` (no throw). Transport errors propagate (test) -> job retry intact; job still filters itself (double filter harmless).
- **SMTP placeholder warning:** pure function, `onInit` only warns via `payload.logger.warn`, never throws; prints host only (not user/pass). `localhost`, `mailpit`, real hosts are not flagged; `.test`/`.invalid`/`.example`/`example.*` are RFC 2606/6761 reserved -> no realistic false positive.
- **Tests meaningful:** endpoint tests use a real `Request` (would have caught builder's first `req.data` bug); "không chờ handler" test would hang/time out pre-fix; no wall-clock timing assertions -> not flaky.

## Responsive Checklist Gate
N/A — diff does not touch UI (no route/component/CSS; Payload `ForgotPasswordForm` unchanged).

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`); eslint PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 1 indicator (endpoint-lookup logic duplicated, see MINOR-1); functions <50 lines, files <300 lines, comments explain WHY, no magic numbers (constants named).
- ai-friendly-web: N/A (admin API, not public web content).
- blitzstrike: skip, not installed / no permitted target environment.

## Findings
No CRITICAL. No MAJOR.

- **[MINOR-1] Duplicated "find default endpoint after mine" logic** — `src/endpoints/admin/staff-forgot-password.ts:21-29` vs `src/collections/Staff.ts:72-80`. Fix (optional, follow-up): extract `findDefaultEndpoint(req, self, path)` helper shared by both endpoints.
- **[MINOR-2] Unbounded background work / no global throttle** — `src/endpoints/admin/staff-forgot-password.ts:41`. Response now returns in ~10 ms while each request still opens a DB transaction in the background, so a flood of requests (esp. random non-existent emails, which bypass the per-account 15s reservation) queues on the pg pool instead of being back-pressured by the client. No app-level rate limit on `/api/staff/forgot-password` found. Fix (follow-up): per-IP rate limit at proxy/middleware or a small in-process concurrency cap for background forgot-password jobs.
- **[MINOR-3] Production path reshapes the message** — `src/lib/email/transport.ts:36-40,64`. Even in production, string `to`/`cc`/`bcc` are split on `,` and turned into arrays; a quoted display name containing a comma (`"Doe, John" <j@x>`) becomes a bogus recipient `"Doe`. Current callers (`to: user.email`, job `to: string[]` validated by zod) are unaffected. Fix (optional): when `appEnv === "production"` return `send(message)` unchanged, or parse with nodemailer's address parser.
- **[MINOR-4] Small behaviour change** — whitespace-only email (`"  "`) now gets 200 (background throws `Missing email.` and logs an error) instead of 400. Not existence-dependent; consistent with uniform-response goal, just noisy log. No action required; optionally `.trim()` before the length check at `staff-forgot-password.ts:38`.
- **[MINOR-5] Test does not explicitly assert SMTP_PASS absence** — acceptance says "test khẳng định log không chứa SMTP_PASS"; `staff-forgot-password.test.ts:44` checks email/host/token/stack but not a password string. Structurally impossible given the whitelist, but add a password literal to the fake error + leak list to lock it.

## Residual risk
- Background continuation after the response relies on long-lived Node process (self-hosted Next). Verified live in dev by builder (EDNS log reached), not in a production standalone build by reviewer.
- Multipart (`_payload`) body path of the endpoint is exercised only via Payload's own `addDataAndFileToRequest` (same pattern as existing `resetPasswordWithLengthCheck`); no dedicated multipart unit test.

## Bug repro closure
Repro Verification status `PASS`; evidence: live dev measurement (same 200 + body for existing/non-existing with SMTP failing, timing 10–13 ms both branches, whitelisted log line, startup warnings) + unit tests that fail pre-fix + full verify suite PASS (re-run by reviewer). Accepted.

## Verdict
PASS
