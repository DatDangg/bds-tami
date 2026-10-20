Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-01 · round 2 (BL-042)

- Review level: **STRICT**
- Reason: same as round 1. The task changes shared fields used by every collection and global, the global Lexical editor, Payload's vi i18n overrides and admin-wide CSS. Round 2 also changes `lib/translation/admin-ui.ts`, which now imports `errors.ts` into a client component.
- Blast radius: every admin edit form and richText field, the sidebar slug collapsible, the `translation.*` group (7 hidden fields + summary + retranslate button), and the admin CSS selectors `.relationship-add-new__add-button`, `.tami-translation-summary*`, `.tami-required`, `.field-label .localized` and `.rich-text-lexical__wrap`. No change to the public site, REST, or DB schema.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/lib/translation src/globals` | PASS: 478/478 tests (r1 had 477; this round adds the unknown-code test) |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors. The 2 warnings in `tools/task-dashboard/server.mjs` were already there and are outside the diff. |

## Round-1 findings: closure
| ID | Status | Evidence |
|---|---|---|
| M1 touch target + rem | **RESOLVED** | `_forms.scss:65` is `font-size: 0.8125rem`. `_forms.scss:87-93` adds `@media (max-width: 767px) { min-height: 44px; min-width: 44px }`, the same pattern as `_dashboard.scss`. Desktop stays at 36px. |
| m1 stale comment | RESOLVED | `required-by-locale.ts:23` now points to `_forms.scss`. |
| m2 role="alert" | RESOLVED | `TranslationSummary.tsx:26` uses `role="status"`, and the test queries `getByRole("status")`. |
| m3 raw error code | RESOLVED | `admin-ui.ts` `describeTranslationError` maps the code through `TRANSLATION_ERROR_MESSAGES`. An unknown code gets a generic sentence and the raw code is never shown. Both cases are tested (`TranslationSummary.test.tsx:35-43`). `errors.ts` imports nothing, so it is safe in the client bundle. |
| m4 dead `Cell` on hidden status | ACCEPTED (not fixed) | The builder's reason ("still used in lists") is doubtful, because a hidden field cannot be a list column. But the config is harmless dead code and stays MINOR. It can be cleaned up later. |
| m5 inline px styles | RESOLVED | Moved to `.tami-translation-summary`, `__text` and `__warning` (`_forms.scss:74-85`). The component has no inline style left. |

## Re-scan of the diff
- No new regressions. The schema, access, data paths, Lexical feature list and importMap are unchanged since r1. `payload-types.ts` still only changes JSDoc.
- `hasOwnProperty.call` guards against prototype keys such as `toString` when looking up the code, which is correct.

## Responsive Checklist Gate (diff touches admin CSS)
| Item | Result | Evidence |
|---|---|---|
| Layout: no horizontal scroll | OK (CSS math) / residual | The "Thêm mới" button uses `nowrap` in the narrow sidebar. Not checked in a browser. |
| Mobile-first / grid / container | N/A | No grid or container was added. |
| Typography rem | OK | The new font-size is `0.8125rem`. |
| Spacing | OK | Small values, consistent with `_controls.scss`. |
| Media | N/A | — |
| Touch target ≥ 44×44 mobile | OK | `_forms.scss:88-93`. |
| Nav / table | N/A | — |
| 100vh / reduced-motion / overflow:hidden | OK | Not used. |

Note: the block uses `max-width: 767px`, not mobile-first `min-width`. This matches the repo's existing pattern, so it does not fail the gate.

## Skill gates
- aislop: skip, not installed.
- oxlint: skip, oxlint not configured. ESLint passed with 0 errors.
- ocr: skip, not installed.
- AI-readable: OK, 0 new indicators. Functions are under 50 lines, `GENERIC_ERROR_MESSAGE` is a named constant, and comments explain why.
- ai-friendly-web: N/A (internal admin).
- blitzstrike: N/A (no new auth/endpoint/input surface).

## Findings
### [CRITICAL]
None.
### [MAJOR]
None.
### [MINOR]
- **m4 (carried over)** `src/fields/translation.ts:60`: the `Cell: StatusBadgeCell` on the hidden `translation.status` is dead config. Remove it in a later cleanup, or add a one-line comment saying why it stays.
- **n1** `src/lib/translation/admin-ui.ts`: the summary mixes casing, e.g. "dịch lỗi — Dịch vụ dịch tạm thời…", because the messages in `errors.ts` start with a capital letter. Cosmetic. Optionally lowercase the first character.

## Residual risk
- Not checked visually in a browser: fixed toolbar wrapping at 375px, the "Nâng cao" collapsible, the `*` position, and "Thêm mới" at 44px in the narrow sidebar.
- `author.defaultValue` not producing a DB default was not confirmed with `migrate:create`. Risk is LOW.
- Doc reconcile (G12) is pending at close-out.

## Verdict
**PASS**: M1 and m1/m2/m3/m5 are resolved with evidence, and there are no CRITICAL or MAJOR findings. m4 and n1 are minor and do not block.
