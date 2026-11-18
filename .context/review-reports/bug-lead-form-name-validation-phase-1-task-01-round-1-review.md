Agent: reviewer

# Review — bug-lead-form-name-validation · phase-1-task-01 · round 1 (BL-123)

- **Review level:** STRICT
- **Reason:** the task changes validation for 2 public APIs (`POST /api/public/leads`, `POST /api/public/job-applications`) and 2 shared form components (LeadForm is used on rentals, property posts, projects, contact, news and the popup; ApplyForm is the second one). That counts as an API contract/DTO change used by several clients plus a shared component, so STRICT is required.
- **Blast radius:** `src/lib/person-name.ts` (new, used by client and server), `src/shared/types/api.ts` (`leadInputSchema.fullName`, `jobApplicationFieldsSchema.fullName`), `src/endpoints/public/job-application-messages.ts` `fieldMessage` (shared by leads, job-applications and newsletter; it only branches when `field === "fullName"`, and newsletter has no fullName), `LeadForm` / `ApplyForm` (only the fullName check changed), and i18n `errors.fullName` (2 keys). No DB/collection/migration change. Grep found no other consumers of `leadInputSchema` / `jobApplicationFieldsSchema` besides `leads.ts:110` and `job-application-body.ts:104`.
- **Scope reviewed:** only the BL-123 files listed in the brief. For vi.json, en.json and API_SPEC.md I only looked at the `fullName` lines. Earlier BL-119/121/122 changes were not reviewed.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` (tsc --noEmit) | PASS (no errors) |
| `pnpm exec eslint` on the 10 changed TS/TSX files | PASS (exit 0, no output) |
| `pnpm vitest run src/lib/person-name src/components/leads src/components/careers src/endpoints/public src/shared src/i18n` | PASS — 20 files / 300 tests |

## Requirement check (the rule the user agreed)
| Item | Result | Evidence |
|---|---|---|
| Letters in any language + combining marks (NFD) | OK | `ALLOWED_CHARACTERS = /^[\p{L}\p{M} '’.-]+$/u` (person-name.ts:10). The test includes an NFD Vietnamese name (Grep `\p{M}` matches test line 11) and "李小龍" |
| Space, `'`, `-`, `.` | OK | character class; tests cover "O'Brien", "Anne-Marie", "J. R. Smith" |
| Digits blocked (every `\p{N}`, including Arabic-Indic digits) | OK | "090777123", "Nguyễn 2", "Nguyễn ٣" are blocked |
| Other characters blocked (@ # _ , / < > emoji) | OK | tests: "Nguyễn @An#", "An_", "An 😀", "An<script>", "Ân,", "An/Bình" |
| trim + collapse spaces; server stores the normalized value | OK | `normalizePersonName` uses `trim().replace(/\s+/g," ")`; the schema runs `.transform(normalize).pipe(...)`; leads.test checks that createOrMerge receives "Nguyễn Văn A" |
| At least 2 letters (punctuation not counted) | OK | `LETTER=/\p{L}/gu` count ≥ 2; "A.", "-'", "A" are blocked; "An" passes |
| max 100 / 120 measured on the normalized value | OK | unit test for `personNameSchema(10)` |
| Client and server use the same function | OK | LeadForm/ApplyForm call `isValidPersonName`; api.ts calls `personNameSchema` (which calls `isValidPersonName`); neither form has its own regex |
| Calling the API directly with "Nguyễn @An#" / "090777123" → 400 on `fullName`, no lead/application created | OK | leads.test (vi+en, `createOrMerge` not called) and job-applications.test (vi+en, `calls.create` not called) |
| Valid names pass the API | OK | leads.test `it.each` with 5 valid names → 200 |
| vi/en error shown under the name field | OK | LeadForm.test (5 cases vi/en: aria-invalid + message, fetch not called) and ApplyForm.test (3 cases, XHR not sent) |
| U+2019 `’` accepted | OK, reasonable | the iOS keyboard turns `'` into `’` automatically; without this, valid names would be blocked on iPhone. It does not widen the attack surface (it is just another quote character) and it is in API_SPEC §3.1. A LeadForm test checks "  O’Brien An  " → body "O’Brien An" |

## Security / ReDoS / bypass
- **ReDoS:** none. The pattern is one anchored character class with `+`, and `\p{L}` uses global `match`. Both run in linear time with no nested quantifiers. `ALLOWED_CHARACTERS` has no `g` flag, so `.test` keeps no `lastIndex` state.
- **Zero-width characters** (U+200B/200C/200D, Cf): they are not in `\p{L}`/`\p{M}`/`\s`, so they are blocked. **Control characters** (C0/C1): blocked. Tab/CR/LF/NBSP/U+3000/U+FEFF are `\s` in JS, so they become a single space before the check.
- **`\p{M}` at the start / stacked marks (Zalgo):** they pass, for example "́An" or a name carrying dozens of combining marks. Length is capped at 100/120 code units and the value is rendered as text (no HTML injection), so this is a cosmetic issue only → MINOR (see below).
- Non-string input → `z.string()` rejects it → 400.

## Responsive Checklist Gate
N/A — the diff changes no layout, CSS or component structure. It only changes a validation condition and an error string, using the existing `FormField error` mechanism. The error text is longer than before; it wraps inside the existing error container (the DOM evidence from the builder shows the text under the field).

## Skill gates
- aislop: skip — not in the allowed verify commands for the reviewer.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). eslint on the changed files is clean.
- ocr (open-code-review): skip, ocr not installed / not in the allowed list.
- AI-readable: OK — clear names (`normalizePersonName`, `isValidPersonName`, `personNameSchema`), functions ≤ 10 lines, named constant `MIN_LETTERS`, the comment explains WHY (iOS `’`, client bundle). 0–1 indicators (see MINOR-2).
- ai-friendly-web: N/A (validation only; no change to public routes or SEO).
- blitzstrike: skip — no permitted pentest environment. Input validation was checked by reading the code and the tests above.

## Findings
- [CRITICAL] none.
- [MAJOR] none.
- [MINOR-1] `src/lib/person-name.ts:10` — a combining mark at the start of the name, or unlimited stacked marks (Zalgo), still passes. Suggestion (optional): require every `\p{M}` to follow a letter, e.g. `/^(?:\p{L}\p{M}*|[ '’.-])+$/u`. This form has no nested ambiguity, so it is still linear. Not blocking: the user's rule only says "letters + combining marks", and length is capped.
- [MINOR-2] `src/lib/person-name.ts:14-17` and `src/i18n/messages/{vi,en}.json` (~145, ~873) — the same error text exists in 3 places, so they can drift apart. Suggestion: add a test asserting that `PERSON_NAME_RULE_MESSAGE.vi/en` equals both i18n keys. The builder already listed this under Residual risk.
- [MINOR-3] `src/lib/person-name.ts:34` — `.min(MIN_LETTERS)` uses the letter-count constant as a string-length minimum. It is redundant because the refine already enforces ≥ 2 letters, and it mixes two meanings. Suggestion: drop `.min` or use a separate constant. Behaviour is correct either way.
- [MINOR-4] Other hyphen variants (U+2010, the en dash `–`) and ZWNJ (used in Persian names) are blocked. This matches the agreed rule; noted only for reference.

## Bug repro closure
- The task file's `Repro Verification` is `PASS`. Evidence: the regression tests now cover the original repro at both client level (LeadForm/ApplyForm: fetch/XHR not called, aria-invalid, rule message) and API level (400 `details[].field = "fullName"`, no lead/application created), in vi and en. The builder reports 17 tests failing before the fix; I did not rerun that pre-fix state. The tests are real behavioural checks (status, details, mock not called, normalized value), and I reran them myself: they pass.
- PNG evidence: **not captured**. The reviewer's Bash permission is limited to the verify commands and git, so I could not start or check the dev server. This is not a reason to FAIL (per the brief and acceptance criterion: Residual risk). The builder has DOM evidence for `/lien-he`.

## Residual risk
- No `bl123-p1t01-*.png` images; visual check on `/lien-he` at 375/1280 not done.
- MINOR-1 (stacked combining marks) and MINOR-2 (error text duplicated in 3 places).

## Verdict
✅ PASS — no CRITICAL/MAJOR findings; repro status PASS backed by automated tests I reran myself; typecheck, eslint and vitest (300/300) all pass.
