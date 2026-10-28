Agent: reviewer

# Review — bug-admin-media-list-columns · phase-1-task-01 · round 1 (BL-099)

- **Review level:** NORMAL
- **Reason:** Diff is CSS-only (`_media-grid.scss`) plus a static style test. It is scoped to `.collection-list--media:not(:has(.list-drawer__header))`. No schema, API, access, auth or collection config change. The root cause is proven by DOM measurement and code. It is not FAST because the stylesheet is shared by one screen with several modes (card grid, multi-select, picker drawer).
- **Blast radius:** Admin list view `/admin/collections/media` only (card grid). The picker drawer is excluded by `:not(:has(.list-drawer__header))`. Other collections are excluded by the `.collection-list--media` scope. No frontend or public impact.

## Root cause check
- Before: `tbody tr td:not(.cell-_select, .cell-filename, .cell-alt, .cell-mimeType) { display: none; }` hid every enabled extra column, including the default `uploadedBy`. Header `th` were hidden too, so cells had no labels. The diff removes the `display:none` and turns those cells into muted 12px meta lines with `::before` labels. This fixes the root cause directly instead of patching a symptom.
- Grid placement: the extra cells get `grid-column: 1` and an auto row. Rows 1–4 are already filled (the `a` spans rows `1 / -1` of the explicit 4-row grid, alt is row 2, mimeType is row 4). So the extra cells auto-place into implicit rows 5+ below the type badge. The `a` overlay (`::after`, z-index 1) still covers the whole card. `td.cell-_select` stays absolute at z-index 2 with a 44×44 hit area. "Chọn tất cả trên trang" (`thead th#heading-_select`) is unchanged.
- Spec A9 (card grid with image, alt/filename and type) is kept. The default 4-column card now also shows "Người tải lên: —". `uploadedBy` is in `defaultColumns`, so this is the correct behaviour.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, exit 0) |
| `pnpm lint` | PASS (eslint, no output) |
| `pnpm test` | PASS — 4819 passed (4819) |
- I did not run the live Playwright check (`shot.mjs review`). It is outside the reviewer's allowed Bash commands, and it can overwrite the admin's column preference. I relied on the builder's screenshots `bl099-{before,after}-*` and inspected them: after-qa-1920, after-qa-390, after-default-1920, after-drawer-1920, before-qa-390.

## Repro closure
- Original repro: QA URL with 8 columns, Admin.
- Before (`bl099-before-qa-390.png`): cards show only image, alt, filename and type.
- After (`bl099-after-qa-1920.png`, `-qa-390.png`): every card shows Người tải lên, ID (UUID wraps, no labelled duplicate), Chú thích, Ngày cập nhật and Ngày tạo with plausible data. No horizontal overflow in the card.
- `bl099-after-default-1920.png`: 4 default columns, only the "Người tải lên" line is added.
- `bl099-after-drawer-1920.png`: the picker drawer is still Payload's original table.
- The test BL-099 (3 cases) asserts the CSS contract. The builder reports it failed before the fix.
- Status in task: PASS. The evidence is checkable → accepted.

## Responsive Checklist Gate (UI diff — admin card meta lines only)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | 390/1920 screenshots show no page overflow. `overflow-wrap:anywhere` + `code span{white-space:normal}` wraps the UUID inside the card. Builder measured hScroll=false. |
| Mobile-first / grid auto-fit/minmax | OK (unchanged) | `tbody` stays `repeat(auto-fill, minmax(150px,1fr))`. The new rules add no fixed widths. |
| Container not fixed px | OK | No widths added. |
| Typography rem / fluid heading | OK (project convention) | New 12px/18px matches the sibling `.file__filename` (12px/18px) in the same Payload admin file. The admin panel uses Payload's px scale and the project has no rem rule for admin. No headings added. |
| Spacing scale | OK | 2px/6px/12px paddings follow the existing card paddings. |
| Media | N/A | No new media. |
| Touch target ≥44px | OK (unchanged) | The select cell and checkbox stay 44×44. The meta lines are not interactive (under the card link overlay). |
| Nav / table on mobile | N/A / OK | The table is already a card layout. |
| 100vh / reduced-motion / overflow-hidden masking | N/A / N/A / OK | No vh or motion added. `tr{overflow:hidden}` existed before and the meta content wraps instead of being clipped. |
- Breakpoints checked: 390 and 1920 by screenshot. For 768/1280 I used CSS math: the card is at least 150px wide and the meta cells only add rows, never width, so these widths are not at risk. They were not visually verified (residual).

## Skill gates
- aislop: skip — not in the reviewer's allowed command set. The diff is small: one SCSS block and one test block, with no slop patterns seen on manual read.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). eslint PASS.
- ocr (open-code-review): skip, ocr not installed / not in the allowed commands.
- AI-readable: OK — 0 indicators. Names are clear and comments explain WHY (Payload inline nowrap on `<code>`, label source). The file header comment was updated to the as-built behaviour. File is 282 lines (≤300).
- ai-friendly-web: N/A (internal admin).
- blitzstrike: N/A (not STRICT, no auth/input surface).

## Findings
- **[MINOR]** `src/components/admin/styles/_media-grid.scss:202` and `:215` — the bottom padding uses `:last-child` / `td.cell-mimeType:not(:last-child)`, which assumes DOM order = visual order. If an admin drag-reorders "Hiển thị cột" so an extra column comes before Loại tệp, two things happen. That cell still renders visually below the badge (implicit row 5). But it gets no 12px bottom padding, while mimeType (the DOM last-child) keeps 12px. The result is meta text flush to the card's bottom edge. This is cosmetic only and not in the acceptance criteria. A suggested fix is to put the bottom padding on the row itself (e.g. `tbody tr { padding-bottom: … }` with mimeType padding adjusted, or a `::after` spacer row), so it does not depend on DOM order.
- **[MINOR]** `src/components/admin/media-grid-style.test.ts:42` — the first assertion `not.toMatch(/td:not\([^)]*\)\s*\{[^}]*display:\s*none/)` is broad. It would also reject any future legitimate `td:not(...){display:none}` rule elsewhere in the file. This is acceptable for now, and the second, exact assertion already covers the regression.
- Pre-existing, out of scope: at 390 the right card in the 2-column grid sits flush to the viewport's right edge. This is the same in `bl099-before-qa-390.png`, so it was not introduced here; a separate task is suggested if needed. The white band and the "N" badge in the full-page screenshots are the fixed Next dev indicator / sticky bar artifact, also present before the fix.

## Residual risk
- The live DOM check was not re-run by the reviewer (screenshots + builder measurements used).
- 768/1280 were checked by CSS math only.
- I could not check whether the builder restored the admin column preference to the default 4 columns. The `after-default` screenshot suggests the default state.

## Verdict
**PASS** — no CRITICAL/MAJOR. The root cause is fixed. A9 grid, select-all, 44px checkbox, whole-card link and the picker drawer table are preserved, and the change is scoped to Media. Repro PASS with checkable evidence. Verify commands PASS.
