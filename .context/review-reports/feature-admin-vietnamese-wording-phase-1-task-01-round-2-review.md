Agent: reviewer

# Review — feature-admin-vietnamese-wording · phase-1-task-01 · round 2 (T01 delta after PASS)

- Review level: **NORMAL**
- Reason: the delta is small (one comment, one new test, one test regex, and a doc paragraph). The export message text is unchanged since T01 PASS. No runtime logic, API shape or schema changed.
- Blast radius: `src/lib/leads/export-filters.ts` (comment only), `src/lib/leads/export-filters.test.ts`, `tests/integration/access.test.ts:236`, `docs/API_SPEC.md` (lead export as-built paragraph).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run … src/lib/leads … tests/integration/access.test.ts tests/integration/admin-dashboard.test.ts` (same run as the T02 round-2 review) | PASS: 64 files, 583 tests |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS: 0 errors |

## Checks
- **`export-filters.ts:141` comment: OK.**
  - It now points to `payload-vi-overrides.ts` for `equals`/`isIn`/`exists`/`general.false`, and to the original `@payloadcms/translations` vi labels for `>=`/`<=`. That is accurate.
  - `UNSUPPORTED_FILTER_MESSAGE` has the same text as at T01 PASS ("là", "là một trong", "có giá trị" = Không).
- **New drift test (`export-filters.test.ts:250-258`): OK.**
  - It reads `PAYLOAD_VI_OVERRIDES.operators.{equals,isIn,exists}` and `general.false`, asserts they are truthy, and asserts the message contains `"<label>"` and `= <false>`.
  - The values are "là" (`payload-vi-overrides.ts:101`), "là một trong" (`:103`), "có giá trị" (`:105`) and "Không" (`:65`).
  - It ties the message to the real source of the override, so it is not false confidence.
  - Minor note, not blocking: `"là"` is a substring of `"là một trong"`. The quoted form `"là"` with quote marks only appears once in the message, so the assertion still discriminates.
- **`access.test.ts:236` regex `/kho[áa]|khóa/i`: OK.**
  - It accepts both spellings: "khoá", which matches the override `userLocked` "…tạm bị khoá…" (`payload-vi-overrides.ts:38`), and "khóa".
  - `kho[áa]` would also match "khoa", but the context is the login-lock error, so this is acceptable. The integration test passed against the DB.
- **`docs/API_SPEC.md` (lead export paragraph): OK.**
  - It now says the operator labels follow `src/lib/admin/payload-vi-overrides.ts` (BL-040): "là", "là một trong" for Trạng thái, "có giá trị" = Không for Sale phụ trách, plus "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng". This matches `UNSUPPORTED_FILTER_MESSAGE`.
  - The Excel column is now named "sale phụ trách", which matches T02.

## Findings
None.

## Verdict
**PASS** (T01 delta)
