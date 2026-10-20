Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-04 · round 1 (BL-042 #13–#16)

- **Review level:** STRICT
- **Reason:** the change touches the upload path (`createUploadGuard`, shared by `media` and `private-files`, including the public CV upload via Local API), adds a Media `beforeValidate` hook that changes save behaviour (an image with empty alt is no longer blocked), and touches shared admin CSS and `importMap`.
- **Blast radius:** `src/lib/upload/validate-file.ts` (Media + PrivateFiles guard), `src/collections/{Media,Rentals,JobPostings}.ts`, `src/globals/SiteSettings.ts`, new components `RentalCodeDisplay` / `JobDeadlineDisplay` / `SiteSettingsDisplay`, `src/lib/admin/{clipboard,job-deadline}.ts`, `src/lib/upload/alt-from-filename.ts`, `src/hooks/media/default-alt.ts`, `_forms.scss`, `importMap.js`, `payload-types.ts` (comments only). No schema, access, endpoint or migration change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/globals src/hooks src/lib/upload src/lib/careers` | PASS: 80 files, 597 tests |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors (2 old warnings in `tools/task-dashboard/server.mjs`, outside the diff) |

## Requirement check
- **D1 / #13 Rental code:** OK. A root-level `ui` field `codeBanner` sits before the tabs and shows "Mã tin:" + the code in large text + a "Sao chép" button. A new record shows "Mã tin tự tạo khi lưu". `code` keeps `unique` / `access` / `readOnly`; only `admin.components.Field` is swapped for a component that returns null. The list column (`defaultColumns` still has `code`, and Cell is unaffected), `listSearchableFields: ["code", …]` and the quick filters are unchanged. Payload builds form state from the config, so the banner's `useField({path:"code"})` still gets the value. Clipboard: Clipboard API → `execCommand` → select the text + message. Feedback uses `role="status" aria-live="polite"`.
- **D2 / #14 Expired:** OK. `isJobPostingExpired` wraps `isPastDeadline`, which compares `deadlineDate < vietnamDate(now)`. That is the same boundary as the "Hết hạn" chip (`deadline < startOfVietnamDay(now)`, `collection-quick-filters.ts:46,54`). Test boundary: now = 2026-10-21 00:00 VN with a deadline of 19/10 → expired. The list Cell shows `dd/MM/yyyy` in VN time plus a `StatusBadge tone="warning"` (text + dot, not colour alone). Query, sorting and filters are unchanged (sorting is in the column header, not the Cell).
- **D3 / #15 Site settings:** OK. The `PrivacyPolicyVersionField` text is small and read-only. `access: { update: denyAll }` + `readOnly` are kept and the data is unchanged. GA description and placeholder match the change doc, and the glossary has the example and the vi/en placeholders. `payload-types.ts` changes JSDoc only.
- **D4 / #16 Alt + G1:** OK.
  - Hook order checked in `node_modules/payload/dist/collections/operations/create.js`: beforeOperation (l.73) → `generateFileData` (l.135, fills `mimeType`) → field beforeValidate (l.150) → collection beforeValidate (l.181). The `validate` of `alt` runs later (beforeChange fields).
  - The guard sets `req.context.originalUploadName` only after `inspectUpload` passes and before renaming to a UUID. MIME validation, the random name and the content-based extension are unchanged. The original name lives only in the request context and never reaches `filename` / URL / DB.
  - On `private-files` the key is set but nothing reads it. It does no harm.
  - The hook only runs for `image/*` with empty alt and an original name in context (create or file replace). Editing the metadata of an old image with empty alt is still blocked by the validator, which is kept. PDF and video are untouched, and a non-empty alt is kept.
  - The localized field is filled in the locale being saved.
  - XSS: the alt is plain text rendered as a React/Next metadata attribute, which escapes it. Length is capped at 120.
- **D5 tests:** they assert real behaviour (guard plus a real JPEG buffer, real sharp; the hook covering image/PDF/video/no-context; the clipboard fallback asserts the actual selection; VN-day boundary). `form-friendly-ops.test.ts` checks the component wiring in the config.
- **G5:** runs after T02 (T02 is committed in a0aaa2c). OK.

## Responsive Checklist Gate (only the CSS in the diff: `_forms.scss` +56 lines)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | `.tami-rental-code`, `.tami-deadline-notice` and `.tami-deadline-cell` all use `flex-wrap: wrap`, with no fixed width |
| Mobile-first / grid | N/A | no grid. One `max-width: 767px` query for the touch target, following the existing admin SCSS convention (T01–T03) |
| Font-size in rem | OK | 0.9375 / 1.5 / 0.8125rem. `gap` is in px (8/12px), which is minor, consistent with the existing file |
| Media | N/A | no images |
| Touch target ≥44px | OK | `.tami-contact-action { min-height: 44px }` at ≤767px |
| Nav / table | N/A | |
| 100vh / reduced-motion / overflow:hidden | OK / N/A | none used, no animation |

Residual risk: not checked by hand in a browser at 375/768/1280. The conclusion above comes from reading the CSS.

## Skill gates
- aislop: skip. The command is not in the reviewer's allowed verify-command list.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint + tsc PASS.
- ocr: skip, ocr not installed / not in the allowed list.
- AI-readable: OK, 0–1 indicators. Clear names, every function ≤ 50 lines and every file ≤ 300, constants are named (`MAX_ALT_LENGTH`, `FALLBACK_IMAGE_ALT`), comments explain WHY.
- ai-friendly-web: N/A (internal admin).
- blitzstrike: skip, no allowed environment. The upload path was reviewed statically.

## Findings
- [MINOR] `src/components/admin/RentalJobSettingsDisplay.test.tsx:37`: `document.execCommand = vi.fn(...)` is assigned globally and never restored, which can leak into other tests in the same file or worker. Fix: use `vi.spyOn(document, "execCommand")`, or save and restore it in `afterEach`.
- [MINOR] `src/components/admin/RentalCodeDisplay.tsx:50-53`: the status text never resets. Clicking "Sao chép" a second time does not change the live region's content, so screen readers do not announce it again. Fix: reset to `idle` after a few seconds, or set `idle` before each copy.
- [MINOR] `src/lib/upload/alt-from-filename.ts:19`: camera file names (`IMG_1234.jpg`, `DSC0001.jpg`) become "IMG 1234", which D4 counts as meaningless. Suggestion: also map the `^(IMG|DSC|DCIM|PXL|Screenshot)\s?\d+` pattern to "Hình ảnh". This is a quality call and does not block.
- [MINOR / info] `src/lib/upload/validate-file.ts:89`: on `private-files` (applicant CVs), the original name, which may contain personal data, is placed in `req.context` with no reader. It is not stored or logged, so this does not block. Optionally only set it when the policy is `MEDIA_POLICY`.
- [info] `src/collections/JobPostings.ts:100`: the custom `Cell` drops the record link if a user drags `deadline` to the first column. The default columns are not affected.

## Verdict
PASS. No CRITICAL or MAJOR findings, and all verify commands PASS.
