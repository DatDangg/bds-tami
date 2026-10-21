Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-05 · round 1 (BL-051 GĐ2 A11 + NavLinkField carry-over)

## Review level
STRICT

## Reason
The diff changes a shared field helper (`withContentDefaults` / `translationFields`) used by 9 translated collections. The coordinator also asked me to check whether hiding the `translation` group could change data paths, access, hooks, job writes or list filters. Under AGENTS.md, a shared helper with many consumers calls for STRICT. Every STRICT concern was checked below. None of them was found in practice: no schema, access, API or path change.

## Blast radius
- `src/fields/translation.ts`: `hasEnglishField` loses `position: "sidebar"`, because it now sits inside the sidebar collapsible. `translationGroup(withActions)` is new. `translationBlockFields` is new.
- `src/collections/_shared/content-defaults.ts`: new `gatherTranslationBlock` and new option `translationActions`. `placeSharedFields` no longer builds a "Bản dịch" tab.
- Content collections that use the helper: projects, rentals, property-posts, news, services, job-postings, pages, categories, developers.
- `src/collections/Pages.ts`: `approveEnglishAction` moves into `translationActions`.
- Globals (Header, Footer, SiteSettings, Homepage) still call `translationGroup()` with the default `true`. Their layout and behaviour are unchanged.
- `src/components/admin/NavLinkField.tsx`: affects Header, Footer and the Homepage button link.
- `src/payload-types.ts`: members only change order inside each interface.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no output) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this diff) |
| `pnpm test` | PASS: Test Files 360/360, Tests 3634/3634 (188s). The WARN "không xếp được job dịch" lines are expected log noise from tests |
| `payload-types.ts`, sorted-line diff vs HEAD | Sorted lines are IDENTICAL. Every hunk moves members within the same interface (Rental, Project, PropertyPost, News…), e.g. `status/publishedAt/author/isFeatured/slug/hasEnglish` move up. No field is added, removed or retyped. **Keeping the file is fine.** It reflects the new field order in the config, so the next regen will produce the same output. |

## STRICT checks (coordinator's concerns)
| Concern | Result | Evidence |
|---|---|---|
| Data paths `hasEnglish` / `translation.*` | OK | The collapsible has no name, so it adds no path segment. `form-layout.test.ts` flattened names match. `retranslate.test.ts` finds `hasEnglish` through `flattenedFields` (integration test, passes) |
| DB columns / migration | OK (residual) | No name or type change, and no new stored field (`ui` only). Only column order in the config changes. I could not run `migrate:create` (outside the allowed commands), so this is listed under Residual risk |
| Field-level access | OK | `gatherTranslationBlock` runs AFTER `withFieldAccess`, so the Pages `fieldAccess.hasEnglish.update=isAdmin` override is kept. `translationGroup` keeps `access: readOnlyForEveryone` |
| `hasEnglish` read-only | OK | `access: readOnlyForEveryone` + `admin.readOnly: true` are kept (translation.ts:29-32). `beforeDuplicate` hook is kept. A test asserts `hasEnglish.admin.readOnly === true` inside the block |
| Hooks / translation job writes | OK | `admin.hidden` only affects the UI. The job and hooks write through the Local API (`overrideAccess`) by data path, and the paths do not change. Sub-field hooks such as `beforeDuplicate resetOnDuplicate` are kept |
| List filter "Trạng thái dịch" | OK | `TRANSLATION_FILTERS` (src/lib/translation/admin-ui.ts:7-13) builds `where` on `translation.*` directly and does not depend on `admin.hidden`. `TranslationFailedBanner` queries `where[translation.status]` through REST, so it is not affected either |
| BL-039 `hideTechnicalListFields` | OK | `visit` walks into `collapsible` without adding a prefix (list-filter.ts:66), so `hasEnglish` and `translation` still match `SHARED_HIDDEN_PATHS`. The new top-level `ui` fields have no Cell, so they are hidden from columns and filters (line 74, 78) |
| Payload sidebar rule (top-level only) | OK | The collapsible sits at root level with `admin.position: "sidebar"`. `placeSharedFields` keeps shared fields at root after the tab set. Typecheck accepts `position` on the collapsible. Builder's browser evidence shows the block in the right-hand column |
| `TranslationSummary` / `RetranslateButton` / `ApproveEnglishButton` after moving out of the group | OK | They read `fields["translation.<x>"]`, `fields.author` and `fields.hasEnglish` by absolute path through `useFormFields`, not from their own `path` |
| Hidden group still in form state | OK (builder evidence) | Builder checked in a browser: temporarily set Rentals `status=failed`, saw "dịch lỗi — …", then reset it to `none`. I did not re-run this (no browser). Same residual risk as BL-042, which already hid the sub-fields |
| Globals unchanged | OK | `translationGroup()` defaults to `withActions=true`, so it is not hidden and still contains both `ui` fields. A test covers this ("global: nhóm translation … vẫn hiện") |
| Other code looking up `hasEnglish`/`translation` in `config.fields` top-level | OK | Grep on `fields.find/some/filter(...hasEnglish|"translation")` in src (non-test) found no matches. The "Bản dịch" tab label survives only in Homepage (a global, intentional) and in comments |

## Responsive Checklist Gate
The diff touches UI only through admin layout config (Payload's own collapsible in the sidebar). It adds no new CSS. NavLinkField only gets refactored into a child component with the same className and markup.
- Layout, no horizontal scroll: OK (builder evidence). Tin tức 375 dark: scrollWidth 375. Danh mục 1024: no overflow. Dự án 1280: fine. I did not re-check in a browser (Residual risk).
- Mobile-first / grid / fixed px: N/A, no new CSS.
- Typography/Spacing: N/A, no new CSS.
- Media: N/A.
- Touch target ≥44px: OK (builder evidence: the "Dịch lại bằng AI" button is 44px tall at 375). The component is unchanged from before.
- Nav / table: N/A.
- Viewport / reduced-motion / overflow hidden: N/A, no new CSS.

## Skill gates
- aislop: skip. Not in the list of allowed verify commands (reviewer Bash is restricted).
- oxlint (anti-slop): skip. Not in the allowed commands. `pnpm lint` (eslint) shows 0 errors.
- ocr (open-code-review): skip, not run (not in the allowed commands).
- AI-readable: OK. Fewer than 3 indicators: 2 MINOR below (alias indirection, stale comment). The changed file is 237 lines. `gatherTranslationBlock` is about 13 lines. No magic numbers.
- ai-friendly-web: N/A (internal admin).
- blitzstrike: N/A (no auth, API or input change).

## Findings
- [MINOR] `src/fields/translation.ts:90-92`: `translationBlockFields()` only re-exports `translationActionFields()` (an extra level of indirection). Fix: export `translationActionFields` directly, or drop the private function.
- [MINOR] `src/fields/translation.ts:55`: the boolean flag `translationGroup(withActions = true)` controls two things at once (include the `ui` fields AND `admin.hidden`). Call sites like `translationGroup(false)` are hard to read. Fix: use an options object (`{ dataOnly: true }`) or a separate `translationDataGroup()` function. Not blocking.
- [MINOR] `src/components/admin/TranslationSummary.tsx:11`: the doc comment still says it lives "trong nhóm 'Bản dịch'". For collections it now sits in the sidebar block "Bản dịch tiếng Anh". Fix: update the comment.
- [MINOR] Residual: DB column order follows the config field order. A migration diff should not change because the diff compares by name, but `migrate:create` was not run to prove it. Suggestion: at close-out, run Payload's migration create command (dry run) on dev and confirm "no changes".

There are no CRITICAL or MAJOR findings. NavLinkField carry-over: `choice = otherChosen && !currentValue ? OTHER : navLinkChoice(currentValue)` is correct. A test covers an external value change: empty value → keeps "Địa chỉ khác"; external value "careers" → shows the right page and closes the URL box. The child component `NavLinkUrlInput` renders the same markup.

## Residual risk
- Responsive behaviour and form state of the hidden group were checked only through builder evidence, not by me in a browser. Builder did not open forms for Developers/Services (same helper). "Dịch lại" was not run against the real AI (fetch was swapped out).
- The migration no-op was not proven by command (see the last MINOR).

## Verdict
PASS
