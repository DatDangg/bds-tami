Agent: reviewer

# Review — bug-isfilled-empty-richtext · phase-1-task-01 · round 1

- Task: `tasks/bug-isfilled-empty-richtext/phase-1-task-01.md`
- Change doc: `spec/changes/2026-10-19-isfilled-empty-richtext.md` (BL-012)
- Diff in scope: `src/hooks/require-english-fields.ts` (modified), `src/hooks/require-english-fields.test.ts` (new). Other dirty files were out of scope and were not reviewed.

## Review level: STRICT

**Reason:** `isFilled` is a shared helper with 5 callers that cover validation (`requiredByLocale` on 6 richText fields), the `hasEnglish` gate, the legal-page EN approval endpoint (422), the translation job and manual-EN detection. Changing it changes validation behavior across many collections.

## Blast radius

| Caller | Effect after the fix | Assessment |
|---|---|---|
| `src/hooks/require-english-fields.ts` `missingEnglishFields` → hook `requireEnglishFields`, `src/endpoints/admin/approve-english.ts`, `src/jobs/translate-content-save.ts` | An EN version with only an empty paragraph now counts as missing a field: approval returns 422 and `hasEnglish` is not turned on | This is the intended fix (BR-07/BR-08) |
| `src/fields/required-by-locale.ts` (JobPostings.description/requirements, Rentals.description, PropertyPosts.content, Pages.content, News.content) | A `vi` richText field containing only an empty paragraph is now blocked with the "không được để trống" message. The same applies to `en` when `hasEnglish=true` | Correct for an R field. Side effect: any existing record already saved with empty content will be blocked the next time it is saved (see residual risk) |
| `src/globals/Homepage.ts` CTA | Applies only to `ctaBanner.title` (text) | No change |
| `src/jobs/translate-content.ts:51` `englishMissing` | Empty `vi` content is no longer translated. An empty-paragraph `en` field with filled `vi` is now treated as missing, so it gets translated | Better than before |
| `src/hooks/translation/detect-manual-en.ts:27,33` | An empty-paragraph field is now treated the same as an absent one: no hash, so a change from "empty paragraph" to "absent" no longer counts as a manual edit. Clearing real text down to an empty paragraph is still a manual edit (hash changes to undefined) | Removes a false positive. Existing tests pass (6/6) |

**Lexical node types actually in use:** `src/payload.config.ts:77` uses `lexicalEditor()` with its default features and no collection overrides the editor. The default set is paragraph, heading, quote, list/listitem (including checklist), link/autolink, linebreak, tab, upload, relationship and horizontalrule. Bold, italic, inline code and so on are `format` flags on `text`; align and indent are attributes. The default feature set has no table or code-block node, so none is missed. Any node type the code does not recognise (or a node with no `type`) counts as content. This is the safe direction: the field is never wrongly reported as empty.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run src/hooks/require-english-fields.test.ts src/hooks/translation` | PASS: 3 files, 36/36 tests |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/endpoints/public/job-applications.test.ts` (to check the pre-existing failure) | 1 fail / 24 pass: "vị trí hết hạn … -> 400" (`expected 200 to be 400`). Neither the handler nor the test imports `require-english-fields`/`isFilled` (Grep), and the test file is not dirty. It uses the fixed date `NOW = 2026-10-17`. **Confirmed pre-existing and out of scope.** |
| `pnpm test` (full), `pnpm build` | Not rerun by me; I rely on the Builder's report (1730/1731 unit+ui, build PASS). Integration tests were not run (Postgres 5433 ECONNREFUSED); see residual risk |

**Repro Verification:** The repro is a deterministic automated test. `handleApproveEnglish` with an EN version containing only an empty paragraph now returns 422 and does not call `update`. `requireEnglishFields` throws `ValidationError` when `hasEnglish` is turned on with empty content. Before the fix the Builder reported 10 failing tests; I did not rerun that pre-fix state. The tests are now PASS, and they call the real `handleApproveEnglish` and hook rather than mocks of the function under test. Status: **PASS**.

## Responsive Checklist Gate

N/A — the diff does not touch UI (only a server-side hook and its test).

## Skill gates

- aislop: skip — not in the allowed verify commands in `.context/project-config.md`. Manual review found no slop.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint PASS.
- ocr (open-code-review): skip, ocr not installed / not in the allowed commands.
- AI-readable: OK — clear names (`lexicalHasContent`, `TEXT_CONTAINER_TYPES`, `BLANK_NODE_TYPES`), a ~9-line function, no magic numbers, and the comment explains WHY (Lexical always leaves a paragraph behind). 0 indicators.
- ai-friendly-web: N/A (not public-facing).
- blitzstrike: N/A (no auth/API surface change; not installed).

## Findings

**CRITICAL:** none.
**MAJOR:** none.

**[MINOR] 1 — No recursion-depth guard and no guard for null child nodes** (`src/hooks/require-english-fields.ts:32-39`).
- `lexicalHasContent` recurses without a depth limit. By contrast, `src/lib/translation/lexical.ts:15,28` sets `MAX_DEPTH = 40`.
- A `null` element in `children` causes `node.type` to throw a TypeError.
- Real Lexical data from the editor never has this shape. However, `requiredByLocale` runs on user input, so very deeply nested JSON could cause a RangeError and a 500 instead of a 400. Payload's own richText validation probably also walks the tree recursively, so the extra risk is low.
- Suggested fix (optional): treat `raw` as content when it is not an object (or skip it), and/or add a depth parameter that returns `true` (conservative) once the depth exceeds a threshold.

**[MINOR] 2 — `LexicalNode` type duplicated** (`src/hooks/require-english-fields.ts:20`).
- `src/lib/translation/lexical.ts:4` already exports `LexicalNode`. The traversal semantics differ (that module walks text nodes and throws on bad input), so keeping a separate function is reasonable.
- Suggested fix (optional): import the type instead of declaring it again.

**[MINOR] 3 — Tests do not cover a few branches.**
- Not covered: `link`/`autolink` containing only whitespace (should be false), and a node with no `type` (should be true).
- Suggested fix (optional): add 2 cases to `it.each` to lock in the conservative behavior.

## Surgical diff

OK — only `isFilled` and its new helper changed, plus a new test file. No caller was changed and there is no drive-by refactor. Both files are well under 300 lines.

## Residual risk

- Integration tests (49 files) were not run because Postgres/Redis were unavailable. The Builder states that the fixtures use real text, which I did not check directly.
- Existing data: any record whose `vi` content in a required richText field is only an empty paragraph will now be blocked with "không được để trống" the next time an admin saves it. This is correct for an R field, but it is a behavior change that operators need to know about. Suggest noting it at close-out.
- Doc impact: the code now matches the intent (BR-07/BR-08). Suggest recording `no doc impact` at close-out, or adding one line to API_SPEC §4 explaining that richText with only an empty paragraph counts as missing.

## Verdict: PASS

No CRITICAL or MAJOR findings. The bug repro is PASS with automated evidence I could verify, and lint and typecheck pass.
