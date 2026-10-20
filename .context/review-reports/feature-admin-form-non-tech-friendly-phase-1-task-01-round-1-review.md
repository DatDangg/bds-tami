Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-01 · round 1 (BL-042)

- Review level: **STRICT**
- Reason: the task changes shared fields used by every admin collection and global (`content-defaults`, `fields/{author,slug,translation,title,required-by-locale,scoped-category,published-at}`), the global editor (`payload.config.ts` → `createRichTextEditor`), Payload i18n overrides, and global admin CSS. The data paths of `translation.*`, `slug` and `author` also feed the translation job, the filters and the dashboard banner.
- Blast radius: every admin edit form (7 content collections + categories/developers + 4 globals via `translationGroup`); every richText field (the editor is global); the sidebar of every content collection (the slug collapsible); the author default; the vi strings `general.creatingNewLabel` / `general.untitled` everywhere they are used; admin-wide CSS selectors `.field-label .localized`, `.rich-text-lexical__wrap`, `.relationship-add-new__add-button`. No public site, REST/endpoint or DB schema change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/lib/translation src/globals` | PASS — 59 files / 477 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 error) |
| `pnpm lint` | PASS — 0 error, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm payload generate:types` | not rerun. I read the `src/payload-types.ts` diff directly: it only adds or changes JSDoc (descriptions for slug/hasEnglish/publishedAt/translation). No field or type changed, and the ui field `translationSummary` and the collapsible do not appear in the types. |

## Focus checks (STRICT)
- **Schema/DB/migration**: OK. payload-types changes only comments. `slug`/`scopeSlug` sit in an **unnamed** collapsible, so the data path is unchanged (types still have `slug` at the root). `author.defaultValue` is a function and is not emitted as a DB DEFAULT (Payload/drizzle skip function defaults). This is residual risk only: I did not run `migrate:create` to confirm (that command is not allowed for the reviewer).
- **Access**: OK. `resolveSharedFields` wraps the collapsible AFTER `withFieldAccess` (content-defaults.ts:133-136), so slug's field access and omit keep working. Tests `content-defaults.test.ts` ("Nâng cao" block, omit slug, scopeSlug) and `form-layout.test.ts` cover this.
- **Code that walks fields**: OK. `lib/translation/leaves.ts:95` and `lib/admin/list-filter.ts:66` both recurse into `collapsible`, so EN slug translation and the BL-039 column/filter hiding keep working.
- **`admin.hidden` on translation.\***: OK. Payload 3.91 `RenderField.js:65` renders `HiddenField`, so values stay in form state and `TranslationSummary` (`useFormFields('translation.x')`) can read them. `TranslationStatusFilter` and `TranslationFailedBanner` filter by URL/REST `where` and are unaffected. No collection has `translation.status` in its default columns.
- **Lexical**: OK. Features are `defaultFeatures + FixedToolbarFeature + tamiHistory` and no node is added, so the stored format and the converters/seed are unchanged. There is no other `lexicalEditor` call in `src`. The client feature is registered in importMap (`HistoryFeatureClient`, `FixedToolbarFeatureClient`). The fixed toolbar renders `item.Component` directly (no nested `<button>`). Payload's LexicalEditor already mounts `HistoryPlugin`, so UNDO/REDO/CAN_* work.
- **CSS**: every token used exists in both light and dark in `_tokens.scss`. The placeholder `--admin-text-subtle` has AA contrast in both themes. No `!important`. Loaded only through `(payload)/custom.scss`, so it applies to admin only.
- **vi overrides**: `creatingNewLabel` and `untitled` are locked by tests.

## Responsive Checklist Gate (the diff changes admin UI/CSS)
| Item | Result | Evidence |
|---|---|---|
| Layout: no horizontal scroll | OK (CSS math) / residual | `.relationship-add-new__add-button` adds the text "Thêm mới" with `white-space: nowrap`. In a narrow sidebar (~768) it takes width from the relationship select. Not verified in a browser. |
| Layout: mobile-first / grid / container | N/A | The diff adds no grid or layout container. |
| Typography rem | FAIL (part of M1) | `_forms.scss:65` `font-size: 13px`. This matches the existing px convention of the admin styles, but it is new code; use `0.8125rem`. |
| Spacing | OK | Padding/gap are small and consistent with `_controls.scss`. |
| Media | N/A | — |
| **Touch target ≥ 44×44 on mobile** | **FAIL (M1)** | `_forms.scss:61-63`: `min-height: 36px; min-width: 36px` with no mobile bump. The repo already uses a ≤767px → `min-height: 44px` pattern (`_dashboard.scss:261-270`, `_dashboard-lists.scss:98-103`). |
| Nav / table | N/A | — |
| Viewport 100vh / reduced-motion / overflow:hidden | OK | Not used. |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured. ESLint passed with 0 errors.
- ocr (open-code-review): skip, `ocr` not installed.
- AI-readable: OK, 1 indicator (stale comment m1). Files are small, functions are under 50 lines, the constant `MAX_ERROR_LENGTH` is named, and comments explain why rather than what.
- ai-friendly-web: N/A (internal admin, not public).
- blitzstrike: N/A (no auth/endpoint/input surface).

## Findings
### [MAJOR]
- **M1** `src/components/admin/styles/_forms.scss:61-66`: the new "Thêm mới" button has a 36×36px touch target on mobile, which is below the 44×44 gate, and uses `font-size: 13px` (px). Fix: add `@media (max-width: 767px) { .relationship-add-new__add-button { min-height: 44px; min-width: 44px; } }`, following `_dashboard.scss:261-270`, and change the font-size to `0.8125rem`. Optional: apply the same mobile bump to the fixed toolbar's `.toolbar-popup__button` (Hoàn tác/Làm lại), which uses Payload's default size.

### [MINOR]
- **m1** `src/fields/required-by-locale.ts:499`: the comment says "`_surfaces.scss` vẽ dấu *" but the CSS is in `_forms.scss:11-14`. Fix the comment.
- **m2** `src/components/admin/TranslationSummary.tsx:26`: `role="alert"` on a static warning means screen readers announce it every time a form with this state opens. Use `role="status"` or no role.
- **m3** `src/lib/translation/admin-ui.ts:731`: `lastError` holds a code from `lib/translation/errors.ts` (e.g. `provider_unavailable`), so the summary shows "dịch lỗi — provider_unavailable", which is technical for a non-tech user. Map the code to a Vietnamese message (errors.ts already has a message per code).
- **m4** `src/fields/translation.ts:60`: `translation.status` is `hidden` (it cannot be a list column), so the `Cell: StatusBadgeCell` config is dead. Remove it, or note why it stays.
- **m5** `src/components/admin/TranslationSummary.tsx:23-26`: inline px styles (`marginBottom: 16`). Move them to the `.tami-translation-summary` class in `_forms.scss`.

## Residual risk
- Not checked visually in a browser (reviewer cannot run the app): fixed toolbar wrapping at 375px, the "Nâng cao" collapsible in the sidebar, the `*` position after the hidden `.localized` span, and "Thêm mới" in the narrow sidebar.
- No migration was generated to confirm empirically that `author.defaultValue` is not a DB default. Payload's documented behaviour supports this; LOW.
- G2 (H1 "[Chưa đặt tên]"), G9 (`*` in the en version), G11, D1 "Đang sửa:" are accepted in the task file.
- Doc reconcile (G12) has not been done; it is planned for close-out.

## Verdict
**FAIL**: one MAJOR (M1, the mandatory Responsive Gate's touch target and rem items). The schema, access, data-path, lexical and translation logic are correct and the tests pass. Fix M1 (and preferably m1–m3), then review round 2.
