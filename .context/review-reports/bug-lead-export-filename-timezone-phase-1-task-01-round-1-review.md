Agent: reviewer

# Review: bug-lead-export-filename-timezone, phase-1-task-01, round 1 (BL-129)

- **Review level:** STRICT
- **Reason:** The change touches the admin import/export endpoints (lead and newsletter Excel), which is a red-risk category. The diff itself is small: only the filename string in `Content-Disposition` changes.
- **Blast radius:**
  - `GET` lead export (`src/endpoints/admin/leads-export.ts`) and newsletter export (`src/endpoints/admin/newsletter-export.ts`): only the `Content-Disposition` filename changes.
  - `src/lib/format.ts`: `TIME_ZONE` is now exported. Its value and existing behaviour are unchanged.
  - New helper `src/lib/export/file-stamp.ts`.
  - Clients `LeadExportButton.tsx:33` and `NewsletterExportButton.tsx:48` parse `filename="([A-Za-z0-9._-]+)"`. The format is unchanged (12 digits), so the match still works.
  - No change to auth (`isAdmin`), the `admin-export-excel` rate limit, the audit log, query/where, or file content.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/endpoints/admin src/lib` | PASS: 153 files, 1711 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS, no errors |
| `pnpm exec eslint <7 changed files>` | PASS, exit 0, no output |

## Checklist
- **Root cause:** Confirmed. The old code used `now.toISOString().slice(0, 16).replace(/[-:T]/g, "")`, which always produces a UTC stamp. The diff removes it in both endpoints, and no other `toISOString().slice(0,16)` remains in `src`.
- **Helper correctness:**
  - It uses `Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, 2-digit…, hourCycle: "h23" })` plus `formatToParts`, so it does not depend on the server TZ.
  - With `h23`, midnight comes out as `00`, never `24`. The test `17:00Z -> 202611200000` covers this.
  - Crossing midnight, month and year is covered by `2026-12-31T17:30Z -> 202701010030`.
  - Asia/Ho_Chi_Minh has no DST, so a fixed +7 offset holds.
  - The formatter is created once at module level, which keeps it cheap.
- **Filename format:** Unchanged: `tami-leads-<12 digits>.xlsx` and `tami-ban-tin-<12 digits>.xlsx`. It still passes through `buildAttachmentDisposition` and still matches the client regex.
- **Content time columns:**
  - Lead: `createdAt`, `assignedAt` and `lastActivityAt` go through `formatTime`, which uses `vietnamTime` with `timeZone: "Asia/Ho_Chi_Minh"` (`leads-export.ts:58-63`), so they are already VN time.
  - Newsletter: `createdAt` and `consentAt` use the same imported `formatTime` (`newsletter-export.ts:14,33-34`), so they are also VN time.
  - Neither has this bug.
- **Auth / rate limit / audit:** Not changed in the diff.
- **Tests:**
  - `file-stamp.test.ts` has 3 meaningful cases.
  - The handler tests use `vi.useFakeTimers({ toFake: ["Date"] })` with `useRealTimers` in `finally`, so the clock is restored even when an assertion fails. They assert the exact filename at the real handler boundary.
  - On the old code, the handler assertion would get `202611191723` and fail, so the test proves the fix.
- **Repro Verification:** Status `PASS`. The evidence is automated tests with a fixed UTC instant, independent of the server TZ, and I re-ran them here: all PASS.

## Responsive Checklist Gate
N/A: the diff is server endpoint and lib code only, with no UI.

## Skill gates
- aislop: skip, `aislop` was not run (not in the allowed verify commands). The diff is 1 small helper plus tests, with no slop indicators.
- oxlint (anti-slop): skip, oxlint is not configured. eslint ran and is clean.
- ocr: skip, ocr is not installed.
- AI-readable: OK.
  - Names are clear (`exportFileStamp`, `STAMP_FORMAT`).
  - The function is 3 lines.
  - Indirection is 1 level.
  - No magic numbers.
  - The JSDoc explains why (VN time, not the server TZ).
  - No main flow changed, so README/ARCHITECTURE need no update.
  - 0 indicators.
- ai-friendly-web: N/A (internal admin endpoint).
- blitzstrike: N/A, because this change does not touch the auth/input surface.

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR] `src/endpoints/admin/leads-export.ts:58`: `vietnamTime` hardcodes `"Asia/Ho_Chi_Minh"` instead of using the newly exported `TIME_ZONE`. This is pre-existing code outside this diff and does not affect behaviour. Suggest handling it later together with another task, not as a drive-by in this one.

## Residual risk
- The helper depends on Node ICU/tzdata having Asia/Ho_Chi_Minh. The existing `formatTime` and `src/lib/format.ts` already rely on the same thing.
- I did not re-run with `TZ=America/New_York` myself (that command is outside the allowlist). However, the helper uses an explicit `timeZone` and the tests use fixed UTC instants, so the result does not depend on the server TZ.

## Verdict
PASS
