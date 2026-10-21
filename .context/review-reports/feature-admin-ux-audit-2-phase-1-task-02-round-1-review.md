Agent: reviewer

# Review: feature-admin-ux-audit-2, phase-1, task-02, round 1

- Task: `tasks/feature-admin-ux-audit-2/phase-1-task-02.md` (BL-051 A4, A5, A13, plus T01 carry-over for UploadButtonLabel)
- Spec: `SPECIFICATIONS.md` F10, paragraph "(BL-051" items A4, A5, A13
- Review level: **STRICT**
- Reason: role-based display gating (RBAC display), shared CSS that applies to every admin list view (including drawer lists and the trash view), a new global admin provider, and a change to a shared upload-label component.

## Blast radius
- Every Payload list view in admin: `.list-header` (title, tabs, Create), `.list-controls .search-bar` (search box, Columns, Filters), and the `.list-controls__columns/__where` panels.
- The Lead list only: `.collection-list__wrap` grid that applies when `.list-search-action` is present (admin, outside trash).
- `<html data-admin-role>` attribute, written by the `AdminRoleAttribute` provider (`admin.components.providers`). This is display only. Access control and the endpoints are unchanged.
- The upload toggler label (`UploadButtonLabel`) in every upload field and drawer.
- Untouched (confirmed in the diff): the BL-050 header (`_surfaces.scss`, `NavDashboardLink`, SiteLink), the BL-022/039 chip styles in `_lists.scss`, and the export endpoint and params.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 errors; 2 warnings already present in `tools/task-dashboard/server.mjs`, outside this diff) |
| `pnpm test` | PASS: 349 files and 3564 tests passed (exit 0, 192.7s). `tests/integration/access.test.ts` **passed inside the full run** this time, so the builder's timeout did not reproduce. It was a load-related hook timeout, not a regression, and it is unrelated to this diff (no access or collection logic changed; `Leads.ts` changed only a comment). I did not rerun it separately because the full run already covered it. |

## Requirement coverage
- **A4:** `_list-toolbar.scss:8-77`. `.list-header__title-and-actions{display:contents}` plus a grid `title tabs create` puts Create in the right-hand corner. Create gets `--admin-accent`/`--admin-on-accent` and a 44px min-height. The tab buttons (`.btn--style-tab`) are muted and 44px tall. The drawer header is excluded with `:not(.list-drawer__header)`, which matches Payload 3.91 `CollectionListHeader` (the drawer passes `className: list-drawer__header`). Payload only renders Create when `hasCreatePermission && !isTrashRoute`, so there is still no button without permission. The Empty Trash button does not get primary styling because the selector targets only `.list-create-new-doc__create-new-button`.
- **A5:** `LeadExportButton.tsx` now renders `.list-search-action` with a download icon (`aria-hidden`, `focusable=false`) followed by a separate `.list-toolbar-item` for the note or error. Permission, endpoint, `search`/where params and error messages are unchanged (the diff touches only markup). `LeadExportSlot` returns `<LeadExportButton/>` directly, so `.collection-list__wrap:has(> .list-search-action)` matches. Auto-placement check: the header is row 1, search and export are both pinned to row 2, and the columns panel, where panel, chips, note and table auto-place to rows 3 and later in DOM order, so the panels stay under the search row and above the chips. Grid min-size check: items spanning `minmax(0,1fr) auto` cross a flexible track, so the automatic minimum size does not apply and the table cannot force overflow.
- **A13:**
  - The toggles and both panels have `display:none` by default and are shown only under `:root[data-admin-role="admin"]` (`_list-toolbar.scss:152-169`). Sale therefore never sees a flash.
  - Checked `AnimateHeight` 3.91: the collapsed state hides the inner child with inline `display:none`, so setting the container to `display:block` for admin does not expose collapsed panels.
  - The provider (`AdminRoleAttribute.tsx`) handles admin, sale, logged out (attribute removed) and user switch (effect deps `[role]`, with cleanup that removes the attribute). It is display only and no access code changed.
  - `Staff.role` is a single `select` field, so the `typeof role === "string"` check is correct.
  - The search box border moved to `.search-filter` and the pills sit outside the frame with a border and 44px height. Global `.pill:focus-visible` (`_controls.scss:6`) covers focus.
- **Translation filter (Lọc dịch) and chips:** not touched. The `:has` grid applies only to the Lead list, where the translation filter does not appear. On other lists the translation filter stays in the `beforeListTable` flow as before.
- **Carry-over (UploadButtonLabel):** writes to `.btn__label` and falls back to the whole button. `characterData` was removed, which is safe because replacing `textContent` detaches React's text node, so later React text updates no longer reach the DOM. New tests cover the fallback, idempotency (same text node preserved) and disconnect on unmount.

## Contrast (computed)
- Light theme: `#ffffff` on `#8c6733` gives about 5.1:1 (AA). The hover color `#7a5a2c` is darker, so contrast is higher.
- Dark theme: `#141414` on `#e0bf89` gives about 10.5:1 (AA).
- Expanded pill: `--admin-accent-soft-text` on `--admin-accent-soft`. This is the same pair as the selected chips and react-select options, which were already approved as AA.

## Responsive Checklist Gate (only the UI changes in this diff)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375 | OK | Builder measured `scrollWidth == innerWidth == 375` on Lead and Cho thuê. CSS math: header `minmax(0,1fr) auto`; search `40px minmax(0,1fr)` with the pills `flex:1` on row 2 ((343-8)/2 ≈ 167px each, larger than their min-content of about 140px); export on row 3 with `justify-self:start` |
| 768 / 1280 layout | OK (768 checked by CSS math only) | At 768 the search bar uses the stacked layout (matches Payload `small-break` = max-width 768). The header uses 3 columns (ListSelection is not rendered at smallBreak), which fits about 700px of content |
| Mobile-first `min-width` queries | N/A (host convention) | The admin overrides Payload's desktop-first `@layer payload-default` rules, which use max-width 768. The existing repo admin CSS uses `max-width:767px` throughout |
| Grid `auto-fit`/`minmax`, no fixed px container | OK | `minmax(0,1fr)` tracks; no fixed-width container |
| Font-size `rem`, fluid heading | N/A (convention) | 14px on the pill follows the existing admin and Payload px convention. No new headings |
| Media `max-width`/`aspect-ratio` | N/A | Only an inline 16px SVG icon |
| Touch target ≥ 44×44 | OK | Create, tabs, Columns/Filters pills, export button and the `.search-filter` frame all have `min-height:44px` (builder measured 343x44, 168x44, 128x44) |
| Nav / hamburger | N/A | Nav not touched |
| Table scroll wrapper | N/A | Table not touched; the grid cannot impose a min-width (spans a flexible track) |
| `100vh` | OK | Not used |
| `prefers-reduced-motion` | N/A | No new animation |
| No `overflow:hidden` to mask problems | OK | Not used |

## Skill gates
- aislop: skip, `aislop` not installed
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). `pnpm lint` (eslint) reports 0 errors
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK. `_list-toolbar.scss` is 241 lines; components are small; comments explain why rather than what; no magic numbers beyond the 44px design rule. Payload DOM coupling is documented at the top of the file and in Residual risk. 0 or 1 indicators.
- ai-friendly-web: N/A (admin is internal, not public)
- blitzstrike: N/A. This is a display-only change with no new endpoint or input; the server-side access path is unchanged

## Findings
- **[MINOR]** `src/components/admin/styles/_list-toolbar.scss:69` vs `:132` and `:226`: the header uses `max-width:767px` while the search and export rules use `max-width:768px`. At exactly 768px the header is in desktop layout and the search bar is stacked. This is harmless, but consider aligning both on Payload's `small-break` (768) or adding a comment.
- **[MINOR]** `src/components/admin/list-toolbar-styles.test.ts`: the assertions are regexes over SCSS source, which gives limited confidence (the builder acknowledges this). Acceptable for this repo's pattern, but it is not evidence of rendering.
- **[MINOR]** `src/components/admin/UploadButtonLabel.tsx:13-14` (pre-existing approach, now narrowed): it still writes `textContent` into a React-owned node. If Payload ever swaps the label's children, React may hit a detached text node. The risk is low. Track it if a Payload upgrade changes the `Button` internals.
- **[MINOR / residual]** Not checked in a browser:
  - the Media header at 375 (title, Create and the bulk-upload button in one row; the title column can shrink to about 85px and long titles will wrap)
  - 768 width
  - 375 in dark mode
  - drawer lists for the sale role

## Residual risk
- The A4 and A5 layouts depend on the Payload 3.91 DOM (`display:contents` on `.list-header__title-and-actions` and `.list-controls`, `:has(> .list-search-action)`). Re-verify after any Payload upgrade.
- Admin sees Columns/Filters one tick after hydration (accepted by the spec).
- Sale can still use `?where=`/columns through the URL. This is intended because the spec makes it display only and data stays scoped by server access.
- I did not run the app or do a manual repro (outside reviewer permissions). UI evidence comes from the builder's browser notes plus CSS math.

## Verdict
**PASS** (no CRITICAL or MAJOR findings; 4 MINOR findings recorded for follow-up)
