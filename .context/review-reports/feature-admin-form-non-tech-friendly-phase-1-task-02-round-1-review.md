Agent: reviewer

# Review — feature-admin-form-non-tech-friendly · phase-1-task-02 · round 1 (BL-042: Dự án + ô số/giá dùng chung)

- **Review level:** STRICT
- **Reason:** the diff touches shared helpers. `src/lib/admin/list-summary.ts` backs the BL-039 list cells (Quy mô, Khoảng giá, Phòng · diện tích). `src/lib/careers/deadline.ts` is used by public careers, the apply endpoint and the deadline chips. Three new admin components are wired into 6 collections plus the `priceTable` array rows. There is no auth, schema or API change.
- **Blast radius:** `src/collections/{Projects,Rentals,PropertyPosts,JobPostings,News,Services}.ts`, `src/collections/projects/market-blocks.ts` (priceTable rows + priceUpdatedAt), new `src/fields/form-hints.ts`, `src/lib/admin/form-hints.ts`, `src/components/admin/{PriceInWords,SummaryCounter,TodayButton}.tsx`, `_forms.scss`, `importMap.js` (regenerated), `list-summary.ts` (additive export only), `deadline.ts` (`vietnamDate` is now exported, body unchanged).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/lib/translation src/globals src/lib/careers` | PASS: 64 files / 524 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this diff) |

## Requirement coverage
- **D1 (Danh mục):** the existing `filterOptions: { scope: { equals: "project" } }` is now covered by a test (`form-friendly.test.ts`). The builder's evidence is a reading of Payload source. I accept it, but nobody has checked it in a browser.
- **D2 + G4:** the counter is on Projects.summary, Services.summary, News.excerpt and PropertyPosts.excerpt. I grepped every `textarea` and found no other summary or excerpt field. The remaining `description` textareas (Categories, Homepage, market-blocks) are not card or Google summaries, so they are out of scope.
- **D3:** Tổng quan, Pháp lý and Chính sách use the T01 factory `createRichTextEditor(placeholder)` with the exact placeholder text from the task. It is placeholder only, with no inserted content.
- **D4:** the price-in-words line is on all 8 price fields. Each Cell `VndCell` is kept, and the test asserts this. The function reuses `compactParts` with no second formatter. `formatPriceRange` and `compactParts` are unchanged, so the list cell output is unchanged.
  - Correctness: `formatNumber` uses vi-VN with `maximumFractionDigits: 2`, so decimals use a comma ("3,5").
  - undefined, 0 and negative values return `null`. With `:empty { display:none }`, no line is shown.
  - The tỷ/triệu boundary rounds first, so 999.999.999 shows "≈ 1 tỷ đồng" (same rule as the list cell). 999.999 shows "≈ 999.999 đồng".
- **D5 (Today button):** the value is `<VN date>T12:00:00.000Z`. Payload 3.91 `DatePicker.js:65-67` stores `setHours(12 - tzOffset)`, which is 12:00 UTC of the chosen day. The button therefore stores the same shape as a click in the picker. 12:00Z shows as the same calendar day in every browser timezone from UTC-11 to UTC+11, so it does not show the wrong day. The button is `type="button"`, 36px tall, and 44px at ≤767px.
- **`deadline.ts`:** the only change is adding `export` to `vietnamDate`, which does not change behaviour.
- **afterInput inside array rows:** `renderField.js:47-53,234-241` passes `clientProps.path`, the full row path such as `priceTable.0.priceFrom`, to AfterInput. `useField({ path })` therefore binds to the correct row.
- **Schema/migration/access:** only `admin.*` and `editor` placeholder changes. No field, type, access or migration changes.

## Responsive Checklist Gate
| Item | Result | Evidence |
|---|---|---|
| Layout / no horizontal scroll | OK | Only a block `<p>` hint line and an inline button were added, with no fixed width. |
| Typography rem | OK | `font-size: 0.8125rem`, `min-height: 1.25rem`. Small spacing in px (4px, 14px) matches the existing `_forms.scss`. |
| Media | N/A | No images or video. |
| Touch target ≥44px on mobile | OK | `.tami-today-button` has `@media (max-width: 767px) { min-height: 44px }`. The rest of the admin SCSS already uses max-width. |
| Nav / table | N/A | Not touched. |
| Viewport / 100vh / reduced-motion / overflow:hidden | N/A | Not used, no animation. |

Residual: not checked in a real browser at 375, 768 or 1280. Checked from the CSS only.

## Skill gates
- aislop: skip. It is not one of the verify commands in the profile.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc*` file). ESLint gives 0 errors.
- ocr: skip, ocr is not installed.
- AI-readable: OK. Names are clear, every function is ≤50 lines and every file is far under 300 lines. The constants `150` and `200` are named (`SUMMARY_RECOMMENDED_MIN/MAX`). 1 indicator found (redundant indirection, see m4), which is under the threshold of 3.
- ai-friendly-web: N/A (admin is internal).
- blitzstrike: N/A (no auth, public API or upload input).

## Findings
No CRITICAL or MAJOR findings.

- **[MINOR] m1** `src/collections/Projects.ts:132-133`: there are two `import` lines from the same `"../fields/form-hints"`. Merge them into `import { withPriceInWords, withSummaryCounter } from "../fields/form-hints";`. Also `src/fields/form-hints.ts:3-4` has a double blank line.
- **[MINOR] m2** `src/components/admin/SummaryCounter.tsx:12`: `aria-live="polite"` on a counter that changes with every keystroke makes a screen reader read "N ký tự…" over and over while the user types. Suggestion: link the hint to the input with `aria-describedby`, or announce only when the warn state changes, or debounce.
- **[MINOR] m3** `src/components/admin/TodayButton.tsx:8-11`: the component ignores the `readOnly` prop that Payload passes in clientProps. On a read-only or locked document the button is still clickable and changes form state. Suggestion: take `readOnly` and set `disabled={readOnly}`.
- **[MINOR] m4** `src/lib/admin/form-hints.ts:28`: `vietnamDate(startOfVietnamDay(now))` is the same as `vietnamDate(now)`. The extra call adds indirection without effect, so it can be simplified.
- **[MINOR] m5** `src/lib/admin/form-hints.test.ts:19-26`: there is no boundary test for 999.999.999 ("≈ 1 tỷ đồng") or for a value with decimals (1.234.567 gives "≈ 1,23 triệu đồng"). Adding them would lock in the shared rounding behaviour. Also, `SummaryCounter.test.tsx` tests all 3 components, so its name is misleading. Consider renaming it to `form-hints.test.tsx` or splitting it.

## Residual risk
- No browser check: the AfterInput position in `priceTable` rows, the dark-theme colours (`--admin-badge-warning-fg` with a fallback), and the `filterOptions` behaviour of the category drawer (D1).
- `hasBeforeOrAfterInput` makes Payload re-render these fields on every form-state request. The cost is small, but this has not been measured.

## Verdict
PASS. The 5 MINOR findings do not block. The builder may fix them in this task or in a later one.
