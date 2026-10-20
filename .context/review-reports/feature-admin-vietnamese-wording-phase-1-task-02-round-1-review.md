Agent: reviewer

# Review — feature-admin-vietnamese-wording · phase-1-task-02 · round 1 (BL-040 T02)

- Review level: **STRICT**
- Reason: the change touches config shared by every admin screen (`collection-labels.ts` feeds the sidebar, dashboard and translation banner; `admin-groups.ts`). It also sits next to the schema (it redeclares the upload base field `mimeType` in Media and PrivateFiles) and changes the Excel export column header and the audit-log summaries that get written.
- Blast radius: admin sidebar, Overview (dashboard), forms, list columns and filters for 21 collections and 4 globals; the translation-filter chips and the translation-error banner (`lib/translation/admin-ui.ts`); the column header "Sale phụ trách" in the lead Excel export; the `summary` text of new audit logs ("Chuyển vào thùng rác" / "Xoá vĩnh viễn"); validation and delete-block messages (Provinces, Wards); the 409 message from `retranslate`; `MISSING_SITE_NAME_MESSAGE`. Public site: not affected. `i18n/messages/vi.json` still has "Đăng tin BĐS", and `PRICE_AVAILABILITY_LABELS` / `SOURCE_LABELS` / `CATEGORY_SCOPE_LABELS` are only used in admin and Excel (checked with grep).

Scope reviewed: every modified or new file under `src/` except `src/lib/admin/payload-vi-overrides*.ts`, `src/payload.config.ts`, `src/lib/leads/export-filters*.ts`, `src/components/projects/*`, `src/payload-types.ts`, `next.config.ts` (T01 or not part of this task). 44 modified files plus 3 new ones (`src/fields/mime-type-label.ts`, `src/lib/admin/admin-label-scan.test.ts`, `src/lib/admin/collection-labels.test.ts`).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/components/admin src/collections src/fields src/globals src/lib/translation src/endpoints/admin src/hooks` | PASS: 56 files, 452 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS: 0 errors |
| `pnpm lint` (`eslint .`) | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |

## Specific checks requested
1. **Only display text changed**: OK. I read the whole diff. No field `name`, option `value`, slug, `access`, `index`, `required` or hook logic changed. The `audit-content-delete.ts` hook only changes the summary string argument; the action value (`content.delete` / `content.purge`) is unchanged. `nav-link.ts` only rebuilds the `admin.description` string from `PAGE_LINK_KEY_LIST` plus `Record<PageLinkKey,string>`; `validateNavLink` is unchanged.
2. **`mimeType` override**: OK, no migration needed.
   - `payload/dist/uploads/getBaseFields.js:6-14` defines `mimeType`: `{name:'mimeType', type:'text', admin:{hidden:true, readOnly:true}, label:'MIME Type'}`, plus `validate = mimeTypeValidator(...)` when `upload.mimeTypes` is set (`:147-149`).
   - `collections/config/sanitize.js:221-225` calls `mergeBaseFields(sanitized.fields, uploadFields)`. In `fields/mergeBaseFields.js:10-27`, a field with the same `name` is removed from its position, then `deepMergeWithReactComponents(baseField, matchCopy)` runs. The project's field only overrides `label`, so it keeps `hidden`, `readOnly`, `validate` and `type: text`. The merged field is pushed in base-field order, so the final field order matches the original (user fields first, then base fields in their own order).
   - Same `name` and `type` means the DB column and type are unchanged. `label` does not affect Postgres or Drizzle. The sanitized test `admin-label-scan.test.ts:42-49` asserts `type: text`, `label: Loại tệp`, `hidden`/`readOnly` true and `validate` is a function for both collections.
   - The shared `mimeTypeLabelField` object is not mutated, because merge copies it with `{...match}` and `deepMerge` returns a new object.
   - `src/payload-types.ts` was not written by this task.
3. **Tables §1–§7 against Q1–Q10**: OK for every table row. I checked each row against the diff:
   - Q1 A: only the `plural` for leads becomes "Lead", and lead-activities drops "lead". The other [Q1] rows (Leads.ts:48/59/216, LeadActivities:38/87, dashboard-queries, RecentLists, AuditLogs:10-11) stay as they were. That is correct.
   - Q2: "Tin bất động sản" (Leads:20/67, scope-collections, Provinces).
   - Q3: "Sale phụ trách" (LeadActivities, leads-export) and "Mới, chưa giao sale".
   - Q4: "Tệp CV ứng viên" / "Tệp CV".
   - Q5: the 8 table rows.
   - Q8: "Dữ liệu nền" / "Mục quản lý".
   - The text matches the "Đề xuất" column. The only difference is `nav-link`, which also gives meanings for privacy-policy and terms-of-use. That is a reasonable addition.
   - **However**, the "Ngày …" acceptance item is not fully met. See MAJOR-1.
4. **Banner `COLLECTION_LABELS`**: OK. `lib/translation/admin-ui.ts:72` still maps from `ADMIN_COLLECTION_LABELS[slug].plural`, and `dashboard-data.ts:80-81` uses `ADMIN_COLLECTION_LABELS` too, so they follow the new labels automatically.
5. **Tests**: OK. `admin-label-scan.test.ts` walks the sanitized config (`payload.config`). It recurses through `fields`/`tabs`/`blocks`/`options`, and that covers row, group, array and collapsible (they all hold `fields`), tabs (tab `label` is collected) and options (option `label`). It requires more than 100 strings (`found.length > 100`) so the test cannot pass vacuously. `collection-labels.test.ts` locks the 6 main labels, and `admin-groups.test.ts` asserts "Dữ liệu nền" is present and "Danh mục" is gone. The old text-assertion tests were updated to the new text.
   - Limit: the scan only blocks "(slug)" in parentheses and does not block "lúc" or "ẩn danh", which is why MAJOR-1 was not caught.
6. **Public site untouched**: OK. `vi.json:28,229` ("Đăng tin BĐS"), `llms-route.ts:71` and the `components/posts/*` comments are unchanged. `SiteSettings.imageUpload` only uses `label` in admin (`SiteSettings.ts:52-56`).

## Judging the builder's additions beyond the table
- `hooks/wards/guard-delete.ts` "tin đăng BĐS" → "tin bất động sản": in the spirit of Q2, the same pattern as Provinces, and only changes message text. **OK.**
- `SiteSettings.ts` upload label "Đăng tin BĐS" → "Tin bất động sản": in the spirit of Q2 (admin only), and a field label only. **OK.**
- `retranslate.ts` and `sync-privacy-version.ts` "Cài đặt chung" → "Cấu hình chung": matches the real global name and the table row `admin-ui.ts:92`. `pages-hooks.test.ts:64` asserts against the `MISSING_SITE_NAME_MESSAGE` constant (not a literal), so the test still holds. **OK.**

## Responsive Checklist Gate
N/A. The diff only changes display text in Payload admin config and admin components. No layout, CSS, route or new component changed, and `ApproveEnglishButton` keeps `minHeight: 44`. The public UI is not touched.

## Skill gates
- aislop: skip, not in the allowed verify commands (`.context/project-config.md`); the diff is only strings plus one 7-line file.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint passes with 0 errors.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK, 0 indicators. Names are clear (`mimeTypeLabelField`, `PAGE_LINK_KEY_MEANINGS`, `NAV_LINK_DESCRIPTION`). There are no new long functions or magic numbers, and the comment in `mime-type-label.ts` explains WHY, not WHAT.
- ai-friendly-web: N/A (internal admin).
- blitzstrike: N/A (no auth, input or API change).

## Findings
- **[MAJOR-1] Q5 "Ngày X" is not applied everywhere, so the acceptance item "Một khái niệm một tên: … Ngày …" fails.** The user approved Q5 as "đổi **đồng loạt** 'X lúc' → 'Ngày X'". Two date labels that admin users see in the sidebar still use "… lúc":
  - `src/collections/Rentals.ts:80`: `label: "Đã cho thuê lúc"` (field `rentedAt`, sidebar, readOnly; sale users see it every day). Suggested fix: "Ngày cho thuê".
  - `src/collections/ClickEvents.ts:42`: `label: "Đã gộp thống kê lúc"` (field `aggregatedAt`, sidebar). Suggested fix: "Ngày gộp thống kê".
  - Fix: change only those two `label` strings. Optionally, add a check to `admin-label-scan.test.ts` that no date `label` ends in " lúc" so this cannot regress.
- **[MINOR-1]** `src/hooks/leads/sync-phone-normalized.ts:40`: the validation message "Lead đã ẩn danh, không thể sửa thông tin khách" still uses "ẩn danh", which this task calls hard to understand (table §2/§3 replaced it with "xoá thông tin cá nhân"). It is not in the table, so it does not block. Suggested: "Lead đã xoá thông tin cá nhân (quá thời hạn lưu), không thể sửa thông tin khách". The stored value `ANONYMIZED_PLACEHOLDER = "Đã ẩn danh"` (`lib/leads/lead-values.ts:27`) is data and is out of scope.
- **[MINOR-2]** Job labels still contain banned terms: `src/jobs/translate-content.ts:210` "VI → EN" and `src/jobs/expire-offers.ts:62` "Đăng tin BĐS". They only show if the payload-jobs collection is visible in admin. The scan test skips `payload-*`. This is out of scope; suggest a separate task if needed.
- **[MINOR-3]** In `src/collections/Projects.ts:88` and `src/collections/projects/market-blocks.ts:62`, the label "Biểu tượng (tuỳ chọn)" repeats "(tuỳ chọn)" from the description "Tên icon … (tuỳ chọn)." The description still says "icon". This does not block.
- Note (not a defect): the `mimeType` sub-field inside `sizes.*` (Media) keeps the base label "MIME Type", but it is `hidden` and never shown. Old audit-log rows keep the summaries "Xoá mềm" / "Xoá hẳn"; only new rows use the new text. That is acceptable because no backfill is needed.

## Residual risk
- I did not open the admin UI to check the "Loại tệp" column and filter by eye. The conclusion relies on the Payload source (`mergeBaseFields`, `getBaseFields`) and the sanitized-config test.
- I did not run `payload migrate:create` (not an allowed command). The conclusion that there is no migration relies on name and type being unchanged.

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1). The fix is small: change 2 `label` strings (`Rentals.ts:80`, `ClickEvents.ts:42`) to "Ngày …", then rerun the vitest/typecheck/lint commands above. Everything else (schema safety of `mimeType`, the full §1–§7 table, `COLLECTION_LABELS`, tests, public site untouched, the builder's additions) is OK.
