Agent: reviewer

# Review: bug-homepage-field-errors-toast-still-shown · phase-1-task-01 · round 2 (BL-119)

- Review level: **STRICT**
- Reason: global `afterError` (`restorePublicErrorMessage`) changes the 400 validation response of every collection/global on production; shared field helper `withMaxSelection` + admin-wide stylesheet `:has()` rules.
- Blast radius: `src/hooks/restore-public-error-message.ts` (every REST error reaching afterError), `src/fields/max-selection.ts` (4 Homepage relationship fields: `heroSearch.chipProjects`, `featuredProjects.projects`, `rentals.categories`, `news.posts`), `src/components/admin/MaxSelectionHint.tsx`, `src/components/admin/styles/_field-errors.scss` (global admin CSS), `src/app/(payload)/admin/importMap.js`. Schema/DB/payload-types: unchanged.
- Rerun note: the first pass of round 2 was BLOCKED (Postgres :5433 down). After the dispatcher started the DB, only the live UI part was run again. This file overwrites the Blocked section and the verdict.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` (timeout 280s) | PASS (exit 0) |
| `pnpm lint` (timeout 280s) | PASS (exit 0) |
| `npx vitest run src/hooks/restore-public-error-message.test.ts src/fields/max-selection.test.ts src/components/admin/MaxSelectionHint.test.tsx src/components/admin/field-errors-style.test.ts src/globals` | PASS: 9 files, 55 tests |
| Build freshness | `.next/BUILD_ID` 2026-11-09 18:02:37 is newer than every source file in the diff; `find src -newer .next/BUILD_ID` returned nothing, so no rebuild. |
| `pnpm exec next start -p 3100` (background) | Ready; `/admin/login` 200 on the first poll. |
| `E2E_BASE_URL=http://localhost:3100 npx playwright test --project=setup --timeout=60000` | PASS 2/2 (admin login from `.env.local` `DEV_ADMIN_*` via `auth.setup.ts`; credentials not recorded) |
| Reviewer scratch Playwright spec (msedge, 1440×900, baseURL 3100, `--timeout=90000`, Bash timeout 300000) | `PHASE=select` PASS · `PHASE=legacy` 1st run FAIL (see Residual), then 1 + 3 repeats PASS · `PHASE=collection` PASS |

## UI evidence: live on the prod build (`next start -p 3100`)
| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Pick all 4 Cho thuê categories → nothing more to pick + "Tối đa 4 danh mục." | **OK**. Menu shows "Không có lựa chọn", enabled options = 0, hint text matches, Cho thuê's "+ Thêm mới" is hidden. Not saved (navigated away). | `bl119-r2-select-4-locked.png`, `bl119-r2-select-4-tab.png` |
| 2 | Legacy data with 5 categories → Lưu (from another tab, "Đầu trang & Banner") | **OK**. Before save: red text + red border (`rgb(159,18,57)` = `--admin-badge-danger-fg`). Response **400** `{"errors":[{"name":"ValidationError","data":{"errors":[{"label":"…","message":"Tối đa 4 danh mục.","path":"rentals.categories"}],"global":"homepage"},"message":"…"}]}`, i.e. **`data.errors` is present**. The tab switches back to "Sản phẩm & Tin nổi bật" (`--has-error`, badge 1), the Cho thuê block opens with "1 Lỗi", the inline error and red border show, and focus lands in the field's react-select. The grouped toast exists in the DOM but **`visible:false`**. | `bl119-r2-legacy-pre-save.png`, `bl119-r2-legacy-after-save-raw.png`, `bl119-r2-legacy-after-save.png` |
| 3 | MAJOR-1: other fields in the same tab are not affected | **OK**. With Cho thuê at 5, before and after save: `featuredProjects.projects` (6 = max) border `rgb(143,137,132)` (normal), `featuredOffers.posts` border normal and its "+" visible. CSS is scoped to the relationship field's own wrapper. | the same images as #2 |
| 4 | Another collection form (Danh mục, create, Lưu with required fields empty) | **OK**. 400 with `data.collection="categories"` + `data.errors` (name/scope/slug). Inline errors under "Tên" and "Loại nội dung", "Nâng cao" panel shows "1 Lỗi", grouped toast `visible:false`. Nothing was created (categories count 17 → 17). | `bl119-r2-collection-categories-required.png` |

## Data: seeding and restore
- Original value of `rentals.categories`: **empty** (`homepage_rels` path `rentals.categories` = 0 rows).
- Temporary seed: SQL inserted 5 rows (the 5 oldest `scope='rental'` categories, parent `homepage` d2ec95a9…) for check #2.
- **Restored**: `DELETE 5`, re-count = 0, identical to the original. No other data was changed: every save in the test was rejected with 400, and the `rentals.title` edit used only to enable the Lưu button was not persisted.

## Round-1 findings: closure
- **MAJOR-1 (CSS `:has()` bleed): closed.** Selector `.field-type.relationship:has(...)`; Payload puts `AfterInput` inside the relationship wrapper (`@payloadcms/ui/dist/fields/Relationship/Input.js:632,777`). Confirmed live in check #3.
- **MAJOR-2 (Repro Verification pending): closed.** The task file has `Status: PASS` + evidence, and the reviewer reproduced it independently on the prod build (#1, #2).
- MINOR-1 from the first round-2 pass (`_bl119-probe.spec.ts` saves data): **closed**. The file has been deleted (confirmed not present).

## Code review (STRICT)
- afterError duck-typing: requires `status 400 && isPublic === true`, non-empty `data.errors` with string `path`/`message`, and a null `result.errors[0].data`. Returns the same shape as `formatErrors` branch 1 (confirmed live in #2 and #4), so nothing extra is exposed. 403/409/413/500, QueryError and `isPublic:false` are left alone; the BL-093 branch is disjoint. OK.
- `withMaxSelection`: composes the base filterOptions, locks to the selected ids at `max`, validates the count first, keeps `maxRows`, merges `afterInput`. OK.
- `MaxSelectionHint`: hidden when `showError`; `role="status"`. OK.

## Responsive Checklist Gate
The UI change is admin-internal: one hint line + 2 CSS rules scoped to the relationship wrapper. No layout/grid/media/nav changes.
- Layout (no h-scroll, mobile-first, grid): N/A. No layout added.
- Typography/Spacing: OK. `0.9375rem`, `margin 0.3rem`, `line-height 1.4`.
- Media / Touch target / Table: N/A. No new control.
- Viewport/A11y: OK. No 100vh/animation; `role="status"`. Browser-checked at 1440 only; 375/768 not run (admin-internal, one line of text) → low residual.

## Skill gates
- aislop: skip, not among the profile's allowed verify commands.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr: skip, not installed.
- AI-readable: OK. One minor indicator (duplicate max count), < 3.
- ai-friendly-web: N/A (internal admin).
- blitzstrike: skip, no permitted pentest environment.

## Findings
- [CRITICAL]: none.
- [MAJOR]: none.
- [MINOR-1] `tests/e2e/admin/homepage-max-selection.spec.ts:52`: the "border of the other field is not red" assertion runs at exactly 4 (not over max), so the `[data-over-max]` rule never fires and the assertion has no regression value. Add a > max case or drop it.
- [MINOR-2] (carried over from r1) Description "Tối đa 4. …" duplicates the hint "Tối đa 4 danh mục."; the `> RENTAL_CATEGORIES_MAX` branch in `validateRentalCategories` (`src/globals/homepage/blocks.ts:~53`) is dead code.

## Residual risk
- **Flaky once:** the first `PHASE=legacy` run (right after the seed, first load) got the correct 400 with `data.errors`, but the page stayed on the "Đầu trang & Banner" tab: no tab error badge, Lưu disabled, the Cho thuê field never mounted within about 17.5s. There is no screenshot for that run, so toast visibility is unknown. The 4 runs after it (1 + `--repeat-each=3`) all switched tab, showed the inline error and kept the toast hidden. It could not be reproduced, so it is not counted as a defect. If QA hits it on staging, investigate the form-state/tab-jump timing (BL-058 FormErrorFocus), not afterError.
- Not tested on staging directly (needs a deploy); the local prod build is the environment where the original bug reproduced.
- Prod bundle duplicating `payload` remains (duck-typing workaround).
- Responsive 375/768 not browser-checked.

## Environment state
- Server :3100: the reviewer started it twice (PID 20084 in the Blocked pass, PID 19304 in this rerun); **both stopped** (`taskkill` SUCCESS, port closed). No other process was touched.
- DB: `rentals.categories` **restored to empty** (0 rows, same as the original). Nothing else changed.

## Verdict: PASS
No CRITICAL/MAJOR. Both round-1 MAJORs are closed. Live checks on the prod build (#1–#4) passed with screenshot evidence, and the repro status is PASS. Verify commands (typecheck, lint, vitest) passed.
