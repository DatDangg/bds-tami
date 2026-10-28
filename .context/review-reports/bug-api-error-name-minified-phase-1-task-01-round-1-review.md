Agent: reviewer

# Review — bug-api-error-name-minified · phase-1-task-01 · round 1 (BL-093)

- Review level: **STRICT**
- Reason: the change touches the shared REST error path (`config.hooks.afterError` runs on every `/api/**` error: every collection, global and custom endpoint). That puts error handling, permission responses and possible exposure of non-public messages in scope.
- Blast radius: every REST error response (`payload/dist/utilities/routeError.js`). The response changes only for errors that are `instanceof APIError`, have `isPublic === true`, have `data == null`, have an empty `name` (minified) and have a non-empty string message. `src/lib/upload/validate-file.ts` `reject()` is used by Media/PrivateFiles upload guards (REST) and by `src/endpoints/public/job-applications.ts` (which branches on instanceof plus status). GraphQL is disabled. Server functions (`buildFormState`/`buildTableState`) do not go through `afterError`; this is listed as a residual.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` (whole repo) | exit 0 |
| `pnpm exec vitest run src/hooks/restore-public-error-message.test.ts src/lib/upload` | 5 files / 28 tests PASS |
| Prod build evidence (not rebuilt; I read the scratchpad files) | `repro-before2.txt`: 409/409/400 "An unknown error occurred." → `repro-after2.txt`: 409 province, 409 category and 400 "Thiếu mật khẩu mới." in Vietnamese, same status codes. `repro-after3.txt`: upload 11MB → 413 "File vượt quá 10MB.". `repro-after.txt`: 401/403/404 identical to before. |

## Bug repro closure
The Repro Verification table has all 3 rows PASS, and each row cites prod-build evidence that I could check (before/after files match the claims). Status codes are unchanged. The unit test reproduces the defect (test 1 asserts that `formatErrors` falls back to "An unknown error occurred." when `name = ""`) and locks in the fix.

## Correctness analysis (STRICT checks)
- **Hook condition vs `formatErrors` fallback:** for an `APIError`, `formatErrors` reaches the fallback only when all of these hold:
  - `data` is falsy (branch 1 skipped);
  - `name !== 'ValidationError'` (the Mongoose branch is skipped because `name` is `""`);
  - the message is not an array;
  - `name` is falsy.

  The hook requires `!error.name`, `data == null` and a non-empty string message, so it fires only inside the fallback case. One tiny difference: `data` that is falsy but not null (`0`, `""`, `false`) still falls back, but the hook skips it. That is the conservative direction and has no exposure risk. The replacement shape `{ errors: [{ message }] }` is exactly what `formatErrors` returns when `name` is present (that is, the dev output).
- **Exposure:** `isErrorPublic` returns true whenever `isPublic === true`, so for every error the hook matches, `routeError` has not swapped the response for "Something went wrong.". The hook therefore never reveals a message that Payload meant to hide:
  - `isPublic: false` errors stay hidden;
  - when `config.debug` is on and `isPublic` is false, the hook skips (conservative);
  - the default `new APIError(msg)` has status 500 and `isPublic` false, so it stays hidden.

  The hook only restores what an unminified build would already show.
- **Ordering and return semantics:**
  - The collection `afterError` hook `auditFailedLogin` returns `undefined`, so it does not conflict.
  - The global hook spreads `result`, so `stack` survives when debug is on.
  - The hook never returns `status`, so `status = result.status || status` keeps the `routeError` status.
  - When it does not match, it returns `undefined`, so the response is unchanged.
- **`instanceof APIError` in the prod bundle:** confirmed empirically by `repro-after2.txt`. The hook matched errors thrown by repo code, by Payload's routeError, and by the upload guard.
- **Removing `error.name = "APIError"` from validate-file:**
  - `job-applications.ts:90-92` uses only `instanceof APIError` and `error.status`. The `error.name` reads at lines 132/201/253 are for logging other errors, so nothing is lost.
  - The REST upload path is covered by the hook (413 confirmed in prod).
  - Non-REST callers of `createUploadGuard` (Local API) never relied on `formatErrors`.
- **Test quality:**
  - The minify simulation (`name = ""` after construction, and a `MinifiedAPIError` mock in the upload test) matches the prod log (`"type":""`).
  - The tests cover the negative cases: non-public, has data, ValidationError, name present, empty message, plain Error.
  - Without the hook the tests fail (they import the hook module, and test 1 proves the fallback).

## Responsive Checklist Gate
N/A: the diff does not touch UI (route/component/CSS).

## Skill gates
- aislop: skip, `aislop` not installed (`command -v` empty)
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint passes on the whole repo, exit 0.
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK
  - New hook file is 17 lines and its function is 6 lines.
  - Names are clear.
  - No magic numbers.
  - The comment explains WHY, not WHAT.
  - Indirection is 1 step.
  - 0 indicators.
- ai-friendly-web: N/A (internal REST error path, not a public web surface)
- blitzstrike: skip, not installed / no authorized pentest environment. The exposure analysis above was done manually.

## Findings
- [MINOR] `src/payload.config.ts:29`: `import { restorePublicErrorMessage } from "./hooks/restore-public-error-message"` sits between `./lib/admin/rich-text-editor` and `./lib/env`, which breaks the alphabetical import order of the block. Fix: move it up after `./endpoints/...`, before `./jobs`. ESLint does not enforce this, so it does not block.
- [MINOR] `src/hooks/restore-public-error-message.ts:14`: `error.data != null` is slightly stricter than `formatErrors`, which checks truthy `incoming.data`. A falsy non-null `data` (0/""/false) still produces "An unknown error occurred.". This is conservative and has no security impact. Optional fix: `!error.data`. No current caller is affected.
- [MINOR / residual] The tests run `formatErrors` and then the hook, but not the real `routeError`/`isErrorPublic` sequence. The prod evidence covers this. An optional follow-up is a test that calls `routeError` with a stub config.
- [Residual, already in task file] The non-REST path (server functions calling `formatErrors`) is not covered. ValidationError raised by repo code keeps the English top-level message "The following field is invalid: …"; it already existed and is out of scope.
- [Close-out note] Doc impact is still pending (task says "dự kiến no doc impact"). Primary should record the final doc impact during close-out.

No CRITICAL or MAJOR findings.

## Verdict
**PASS**
