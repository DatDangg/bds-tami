Agent: reviewer

# Review: feature-admin-ui-saas-refresh, phase-1-task-05, round 1 (BL-015, list view: StatusBadge / ThumbnailCell / defaultColumns)

- Worktree: `D:/prj/bds-wt15-t02` (branch wt/bl15-t05, uncommitted, compared with HEAD f2ce643)
- **Review level: STRICT**
- **Reason:** the diff changes field factories shared by many collections (`src/fields/status.ts`, `title.ts`, `translation.ts`). These feed a shared admin Cell component that appears on every list view and in every Payload ListDrawer. The thumbnail also reads a relation (media) through the client API.
- **Blast radius:**
  - List view of every collection that uses `statusField` / `titleField` / `translationGroup`: projects, rentals, property-posts, news, plus pages/services/job-postings wherever they use those factories.
  - leads and job-applications (status and assignee Cell).
  - **Payload ListDrawer**, i.e. the Lexical RelationshipFeature that is on by default through `lexicalEditor()` in `src/payload.config.ts:78`, for every collection with a title or thumbnail Cell.
  - `importMap.js` and `custom.scss`.
  - No schema, access, hook or API changes. `payload-types.ts` differs only in EOL (`git diff --stat` reports no content change).

## Verify commands + result (run in the worktree)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 248 files / 2600 tests (exit 0) |
| `pnpm build` | PASS (exit 0) |

## Source checks against Payload 3.91

- **useListRelationships batching:** `@payloadcms/ui/dist/elements/Table/RelationshipProvider/index.js`
  - Requests are debounced by 100 ms, then gathered per `relationTo` slug into ONE request: `GET /api/media?depth=0&draft=true&limit=250&where[id][in]=…`.
  - The request uses `credentials: "include"`, so media access control runs on the server and no data leaks beyond the user's permissions.
  - A non-OK response maps to `ADD_LOADED docs: []`, so the cell falls back to the neutral frame.
  - Verdict: OK. A 10-row page adds 1 HTTP request.
  - The provider is mounted in `views/List/index.js:194`.
- **cellData shapes:** `firstMediaRef` handles an id, an array, null and an object, and the tests cover all of them. OK.
- **Header id:** `Table/index.js:27` renders `id=heading-${accessor}`, so the selectors `#heading-gallery` and `#heading-cover` match. `font-size:0` hides the text visually only, so screen readers still read it. OK.
- **AssigneeCell:** `assigneeInactive` is a virtual field computed by an afterRead hook (`hooks/leads/status-activity.ts:49`, admin only, cached per request). Leads does not enable `enableListViewSelectAPI`, so `rowData` has the real value. For sales users it is `undefined`, so no badge shows, which matches the permission model. OK.
- **Status tones:** `status-tones.test.ts` scans every real source (CONTENT/RENTAL/LEAD/APPLICATION/SALES/TRANSLATION). It fails if any value is missing a tone and also fails if the map has an extra key. This is real coverage, not just sample values. OK.

## Findings

### [MAJOR] 1: ListDrawer can no longer select records, and clicking a title navigates away from the open document

Files:
- `src/components/admin/TitleLinkCell.tsx:10-11`
- `src/fields/title.ts:13`
- `src/components/admin/ThumbnailCell.tsx:25`

Evidence from Payload 3.91:
- `buildColumnState/renderCell.js:129-136`: when a field has `admin.components.Cell`, Payload renders the custom component and **skips `RenderDefaultCell`**.
- `RenderDefaultCell/index.js:33-56` is the only place that, inside a drawer (`drawerSlug`), turns the linked column into a button that calls `onSelect` (and sets `link=false`).

Consequences:
- In the Lexical "Relationship" drawer, the first column of projects/rentals/news/property-posts is now `ThumbnailCell`, which has no `onSelect`.
- The title column (`TitleLinkCell`) forces `link`, so `DefaultCell` renders a `<Link href=/admin/collections/...>`. Clicking it **leaves the edit page that has the editor open**, which risks losing unsaved content, and the record is never selected.
- Collections that use `titleField` with title as the first column (pages/services/job-postings, if they use `titleField`) are hit the same way, because title is now a custom Cell.
- Before this diff, the title cell went through `RenderDefaultCell` and selection worked.

Suggested fix:
- In `TitleLinkCell`, do not force a bare `link`. Either:
  - render `RenderDefaultCell` (exported from `@payloadcms/ui`) with `clientProps={{ ...props, link: true }}` and `isLinkedColumn`, so the drawer path uses `onSelect`; or
  - read `useTableColumns()` (`drawerSlug`/`onSelect`) and pass `onClick` instead of `link` when inside a drawer.
- Add a test for both contexts: list → link, drawer → onSelect button with no href.

### [MINOR] 2: Duplicate links and lost first-column link when columns are reordered

- If a user puts another column (title is not first) or a StatusBadge/Assignee column into first position, two links point to the same record.
- `StatusBadgeCell`, `AssigneeCell` and `ThumbnailCell` ignore `link`/`linkURL`, so if one of them becomes the first column the row link is lost.
- Suggested fix: respect `props.link` in these Cells, or document the limitation.

### [MINOR] 3: Badge typography uses px

- `src/components/admin/styles/_badges.scss:9-10` uses `font-size: 12px; line-height: 20px`, which breaks the responsive rule "font-size in rem".
- Suggested fix: `0.75rem` / `1.25rem` (or a T01 token if one exists).

### [MINOR] 4: Tests stop at the component level

- No test confirms that the real fields (e.g. `statusField()`, Leads `status`, Projects `salesStatus`, `translation.status`) actually attach `StatusBadgeCell`, or that their options have Vietnamese string labels.
- `TitleLinkCell` and `AssigneeCell` have no tests (badge appears when `assigneeInactive === true`, not otherwise).
- Suggested fix: add a small config-scan test and a test for `AssigneeCell`.

### [MINOR] 5: Sort controls in the cover column

- The `cover` column (single upload) can be sorted, so Payload's sort buttons still sit inside a 56 px `th` with `font-size:0`. This may overflow or look cramped.
- Not verified in a browser.

## Responsive Checklist Gate (UI diff: `_badges.scss`, list cells)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK (CSS math) | Thumbnail column is fixed at 56 px. Badge uses `nowrap` but is short. No `width` in vw/px on any container. |
| Mobile-first / grid | N/A | No grid or media query added. |
| Container not fixed px | OK | Only the 40×40 thumbnail and 56 px column are fixed sizes, which is intentional. |
| Font-size in rem | **FAIL** | `_badges.scss:9` uses `12px` (finding 3). |
| Fluid heading / spacing scale | N/A | No headings. Gap and padding are small px values, the same as Payload. |
| Media max-width / aspect-ratio | OK | `img` is 100%/100% with `object-fit: cover` inside a fixed 40×40 box. `width`/`height` attributes are set, so there is no CLS. |
| srcset/sizes | N/A | 40 px decorative image, smallest size `thumb`. |
| Touch target ≥44 | OK / not changed | Title link and checkbox are unchanged from T01. Thumbnail is not interactive. |
| Nav / table on mobile | N/A | Payload table wrapper unchanged. |
| 100vh | N/A | Not used. |
| prefers-reduced-motion | N/A | No animation. |
| overflow:hidden hiding errors | OK | Used only on `.admin-thumb` to crop the image, which is intentional. |

Residual risk:
- Not checked in a real browser at 375/768/1280 or in light and dark mode. The builder also has not checked this.

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop | skip | `aislop` is not among the allowed verify commands. |
| oxlint (anti-slop) | skip | oxlint is not configured (no `.oxlintrc*`). eslint passes with 0 errors. |
| open-code-review (ocr) | skip | ocr not installed. |
| AI-readable | OK | Every new file is ≤ 44 lines, each function is short, and comments explain WHY. 0–1 indicators. |
| ai-friendly-web | N/A | Internal admin only. |
| blitzstrike | N/A | Not installed, and not an auth/public API task. |

## Verdict: FAIL

Must fix:
- **MAJOR 1:** restore drawer selection and remove the forced navigation link in `TitleLinkCell` / the thumbnail first column.
- **Responsive item:** font-size in px (MINOR 3).

Should fix:
- MINOR 2, 4 and 5.
