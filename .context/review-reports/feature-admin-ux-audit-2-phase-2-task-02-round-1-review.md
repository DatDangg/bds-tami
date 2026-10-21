Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-02 · round 1

Task: `tasks/feature-admin-ux-audit-2/phase-2-task-02.md` (BL-051 GĐ2 A9 Media grid + P2-T01 carry-over)
Spec: `SPECIFICATIONS.md` F10 "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)" A9, A12 (Xoá clause)

## Review level
**STRICT** (on the carry-over part); NORMAL depth for the A9 CSS part.

## Reason
- A9 is admin-only CSS plus one display Cell: no schema, access or API change, and the scope is limited to the Media list. NORMAL depth is enough for that part.
- The carry-over changes `rowActionVisibility`, which decides which permission-gated actions appear on 7 public-content collections (the P2-T01 STRICT area). I checked it at STRICT depth. It only controls what the UI shows. The server still enforces access through `ownedByUserOrAdmin`/`isAuthorOrAdmin`, and no access function changed.

## Blast radius
- `src/components/admin/styles/_media-grid.scss` (new) is loaded globally through `custom.scss`, but every rule sits under `.collection-list--media:not(:has(.list-drawer__header))`. The only exception is the `.tami-media-type` chip class. Test `media-grid-style.test.ts:14` asserts that only these 2 top-level selectors exist.
- `src/collections/Media.ts`: a Cell is added to `mimeType`. `mimeTypeLabelField` has no `admin` key (`src/fields/mime-type-label.ts:7`), so adding `admin.components.Cell` cannot overwrite base `admin` props. Payload `mergeBaseFields` still deep-merges `hidden`/`readOnly`. `src/payload-types.ts` is unchanged (not in `git status`) and there is no migration.
- `importMap.js`: one entry added (regenerated).
- `row-actions.ts` / `RowActions.tsx`: the "Thao tác" column on projects, rentals, property-posts, news, job-postings, services and pages. Media is **not** in `ROW_ACTION_COLLECTIONS` (`row-actions.ts:4`), so there is no interaction with the grid.
- Media list drawer (cover image and `gallery` pickers): excluded by `:has(.list-drawer__header)`. I confirmed Payload 3.91 renders `list-drawer__header` in `views/List/ListHeader/index.js:56` when in a drawer, and the list class is `${baseClass}--${collectionSlug}` (`views/List/index.js:148`).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 errors; 2 pre-existing warnings in `tools/task-dashboard/server.mjs`, outside the diff) |
| `pnpm test` (full) | PASS: 359 files / 3620 tests, exit 0 |
| `git status` / `git diff -- src/` | Diff matches the task's file list; no `payload-types.ts`, no migration |

## Requirements coverage
- A9 grid: thumbnail at 4:3 with `contain` (aspect ratio kept). Size is ≥150px wide and ≥112px tall, which meets the ≥120px requirement on the long side (the cell is ≥150px). Alt is clamped to 2 lines, filename is truncated with an ellipsis, and the file type shows as a chip. The whole card links to the edit screen and the checkbox still works. Matches the spec.
- Search, chips, filters (BL-039), pagination, trash: the toolbar and pagination are outside `.table`, and the CSS only touches `.table`, `thead`, `tbody` and cells. The builder's browser evidence covers search ("Mê Linh" → 18) and pagination. Media has no trash (stated as a residual).
- Selection: the per-row checkbox is a 44×44 input, `z-index:2` above the link overlay (`z-index:1`). The select-all `th#heading-_select` is kept. The bulk bar is outside the table (P2-T01 style untouched). The builder's evidence shows 2 cards selected, the bulk bar, and select-all in the indeterminate state.
- Carry-over: `trash = Boolean(permissions?.update) && owns` (`row-actions.ts:51`). This matches the spec clause "admin-or-author AND update, no list-level delete". For a sale user, `ownedByUserOrAdmin` returns a Where, so collection-level `update` is truthy and own rows still show Xoá. `failureMessage` now treats 404 as forbidden (`RowActions.tsx:53`). `encodeURIComponent(locale)` is applied to both the duplicate API call and `router.push` (`RowActions.tsx:96`). Tests were updated: the visibility matrix includes ADMIN without update → no trash, and there is a 404-duplicate toast test.
- Phase-1 / P2-T01 / BL-050 styles: no edits to the existing style partials. The `@use` was inserted after `list-actions` and before `doc-controls`. The new rules use a more specific, Media-only selector, so they cannot leak.

## Responsive Checklist Gate (diff touches admin UI; widths 375 / 768 / 1280; checked by CSS math, no browser in reviewer scope)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | `tbody` is `repeat(auto-fill, minmax(150px,1fr))`. At 375 the content width is about 343px → 2 columns (2×150+16=316 ≤ 343). At 768 → 4 columns. At 1280 minus the nav → ~7 columns. `tr` has `min-width:0; overflow:hidden`, filename has `nowrap` plus an ellipsis, and alt has `overflow-wrap:anywhere`. `table{display:block;width:100%}`. Builder evidence: `scrollWidth = innerWidth = 375`. |
| Mobile-first / grid auto-fit | OK | Intrinsic `auto-fill/minmax` grid with no breakpoint needed and no fixed column count. |
| Container not fixed px | OK | Only the 44px checkbox box is fixed, by design. |
| Typography rem / fluid | OK (admin convention) | Uses px font sizes (12/13/14) like the existing admin partials (`_lists`, `_forms`, `_dashboard`…). The Payload admin uses a px base, and this is not a public web page. |
| Media max-width / aspect-ratio | OK | `.thumbnail{width:100%; aspect-ratio:4/3}`, `img{position:absolute; inset:0; object-fit:contain}`. Uses the existing `thumb` 400px size (`adminThumbnail: "thumb"`). |
| Touch target ≥ 44px | OK | Checkbox input 44×44 (`inset:-1px` offsets the 1px border); the whole card is the link target; the select-all `th` has `min-height:44px`. |
| Nav / table on mobile | OK | The table becomes a card grid at every width (the card layout satisfies "table → cards"). |
| 100vh / reduced-motion | N/A | No viewport units and no animation added. |
| overflow:hidden masking errors | OK | `overflow:hidden` on the card is for the border radius and clipping, not to hide page overflow. `.table-wrap` is set to `overflow:visible`. |
| Dark/light | OK (partial) | Only `--admin-*` tokens are used. Builder checked dark at 1280 and light at 375. The other combinations are listed as residual. |

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, not in the verify-command allow list |
| oxlint (anti-slop) | skip, oxlint not configured (repo uses eslint via `pnpm lint`: PASS) |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK: clear names (`mediaTypeLabel`, `MediaTypeCell`), functions are short, comments explain WHY (Payload 100px thumbnail override, why the drawer is excluded), no magic indirection. 0 indicators. |
| ai-friendly-web | N/A (internal admin, not public) |
| blitzstrike | N/A (no auth/API/input surface change; the visibility change is UI-only and server access is unchanged) |

## Findings
No CRITICAL or MAJOR findings.

- **[MINOR] Keyboard focus on the card link is not evidenced.** `_media-grid.scss:95-113`: `td.cell-filename a` gets `display: contents`, and the focus ring is drawn on `a:focus-visible::after`. Older engines (Safari < 17.4, some Chromium versions) dropped `display:contents` elements from tab order and the accessibility tree. The builder's evidence covers mouse clicks only. Suggested fix: keep it, but check with Tab in the target browsers. If focus is lost, put `display: contents` only on `.file` and give `a` a real box (`display:flex; flex-direction:column`) holding the thumbnail and filename, with `alt`/type placed after it.
- **[MINOR] Columns that "Hiển thị cột" can show render unlabeled in the card.** `_media-grid.scss:85-91`: an admin can enable extra columns (e.g. createdAt, filesize). These become `display:block` cells with `order:0` and appear between the thumbnail and the alt text with no header. Nothing breaks. Suggested fix: hide every cell except `_select`, `filename`, `alt` and `mimeType` (e.g. `td:not(.cell-_select, .cell-filename, .cell-alt, .cell-mimeType){display:none}`), or document this.
- **[MINOR] Select-all label is CSS-generated text.** `_media-grid.scss:50-52`: "Chọn tất cả trên trang" comes from `::after` on the `th`, which is not reliably part of the checkbox's accessible name. Suggested fix: acceptable for now. If the Payload select-all input has no aria-label, consider a small Cell/hint later.
- **[MINOR] `mediaTypeLabel` gives long labels for some MIME types.** `media-type-label.ts:11`: `image/svg+xml` → "Ảnh · SVG+XML", and Office types → a very long uppercased subtype. The chip has no `max-width`/ellipsis, but the card's `overflow:hidden` contains it, so there is no page overflow. Suggested fix: strip `+xml`/`vnd.*` or add `max-width:100%; overflow:hidden; text-overflow:ellipsis` to `.tami-media-type` (only matters if `MEDIA_POLICY` allows such types).

## Residual risk
- Selectors depend on Payload 3.91 internals (`.table`, `td.cell-filename .file .thumbnail`, `.list-drawer__header`, `:has()`), so a Payload upgrade could break the grid. This is documented in the task under "Payload 3.91 gaps".
- Column sort is lost in the grid (`thead` is hidden). Documented by the builder; the default order stays newest first.
- PDF/video cards and the dark-375 / light-1280 combinations were not seen in a browser (the reviewer cannot run the app). Grid width at 768 was checked by CSS math only.
- The `.collection-list--media` class is also emitted by `CollectionFolder` view (`views/CollectionFolder/index.js:262`). Media has no folders configured today, so this has no effect.

## Verdict
PASS. No CRITICAL or MAJOR findings, all verify commands pass, the responsive gate has no FAIL items, the schema is unchanged, and the carry-over matches the A12 Xoá clause. The 4 MINOR items can be handled now or in a follow-up.
