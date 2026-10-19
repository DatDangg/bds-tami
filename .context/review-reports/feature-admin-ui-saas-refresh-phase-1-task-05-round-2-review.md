Agent: reviewer

# Review: feature-admin-ui-saas-refresh, phase-1-task-05, round 2 (BL-015)

- Worktree: `D:/prj/bds-wt15-t02` (branch wt/bl15-t05, uncommitted, compared with HEAD f2ce643)
- **Review level: STRICT**
- **Reason:** shared field factories (`status.ts`, `title.ts`, `translation.ts`) feed custom Cells into every list view and every Payload ListDrawer (relationship/upload/Lexical picker). Round 1 found a MAJOR in the drawer.
- **Blast radius:**
  - List views and ListDrawers of projects, rentals, news, property-posts, pages, services, job-postings, leads, job-applications.
  - `importMap.js` and `custom.scss`.
  - No schema, access, hook or API changes. `payload-types.ts` differs only in EOL.

## Verify commands + result (run in the worktree)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 249 files / 2608 tests (exit 0), full parallel run |
| `pnpm build` | PASS (exit 0) |

**`tests/integration/jobs-email.test.ts`:** passed in the full parallel run. The diff does not touch jobs, email or DB, so the failure the builder saw is a pre-existing intermittent failure under parallel load and is unrelated to this task. Since it did not reproduce, its exact cause is unconfirmed (residual risk).

## Round 1 findings: status

### MAJOR 1 (drawer selection): CLOSED

Compared against `@payloadcms/ui` 3.91.0, `providers/TableColumns/RenderDefaultCell/index.js:33-56`.

- **Same drawer branch.** `LinkedCell.tsx:26-31` uses the same condition as Payload (`drawerSlug` plus a linked cell). It renders `<button type="button" class="default-cell__first-cell">`, the same element and class `DefaultCell` produces when it gets `onClick`. It calls `onSelect({ collectionSlug, doc: rowData, docID: rowData.id })` with the same arguments as Payload. There is no `href` in the drawer, so clicking no longer leaves the editor.
- **Only the link column becomes a button.**
  - `cell.link` comes from `renderCell.js:87` (`link: shouldLink`, where `shouldLink = isLinkedColumn` and Payload's `formatDocURL` can turn it off). `linkURL` is respected (`LinkedCell.tsx:34`).
  - The title is forced to be the link only when the first active column is `gallery`/`cover` (`TitleLinkCell.tsx:17-19`). In that case the thumbnail cell is not a link, so each row has exactly 1 link or button.
- **Thumbnail as first column in the drawer.** The thumbnail cell cannot be clicked to select, but the title cell in the same row is the select button. This is acceptable as the brief allowed.
- **Outside the drawer.** The `href` matches `DefaultCell` (`/collections/<slug>[/trash]/<encodeURIComponent(id)>`), using `prefetch={false}`.
- **a11y.** A native button/link with the title as its accessible name. The thumbnail has `alt=""` (decorative).
- **Tests.** `LinkedCell.test.tsx` covers: list → `<a>` to the edit page; drawer → button calling `onSelect` with the exact arguments and no `<a>`; no link → neither `<a>` nor button; title forced when gallery is first, in both contexts; no forced link when another column is first.

### MINOR 2 (reorder / duplicate links): CLOSED

- `StatusBadgeCell` and `AssigneeCell` now go through `LinkedCell`, so when the user moves one of them to first position it keeps the row link and the drawer button.
- `TitleLinkCell` follows Payload's `link` flag when the first column is not a thumbnail, so there is no duplicate link.

### MINOR 3 (px font size): CLOSED

- `_badges.scss:9-10` now uses `0.75rem` / `1.25rem`.

### MINOR 4 (tests): CLOSED

- `StatusBadge.test.tsx:38` scans the real fields and checks both `admin.components.Cell` and the Vietnamese labels.
- `AssigneeCell` is tested for `true`, `false` and `undefined`.

### MINOR 5 (sort buttons in the thumbnail column): CLOSED

- `_badges.scss:65-67,77-79` hides `.sort-column__buttons` in `th#heading-gallery` / `th#heading-cover`, scoped per collection.

## New findings (full diff re-scan)

### [MINOR] A: Possible double link in property-posts after a user reorders columns

- `TitleLinkCell.tsx:9` matches by accessor name only (`gallery`, `cover`).
- `property-posts` has a `gallery` field (`PropertyPosts.ts:74`) that has no ThumbnailCell.
- If a user drags `gallery` to the first column there:
  - the default gallery cell is the Payload link, and
  - the title is also forced to be a link,
  - so the row gets 2 links (or 2 select buttons in the drawer).
- This cannot happen with the default columns (`cover` is first).
- Suggested fix: decide by the collection's thumbnail accessor (for example a map `{ projects: "gallery", rentals: "gallery", news: "cover", "property-posts": "cover" }`), or check that the first column's field really uses ThumbnailCell.

### [MINOR] B: No row link when the title column is hidden

- If the thumbnail is the first column and the user hides the title column, the row has no link or select button, because ThumbnailCell does not go through LinkedCell.
- This is an edge case of personal column preferences and is acceptable. Optionally wrap ThumbnailCell in `LinkedCell` with `forceLink` when no title column is active.

## Responsive Checklist Gate (UI diff: `_badges.scss`, list cells)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK (CSS math) | Thumbnail column is a fixed 56 px. Badge uses `nowrap` but is short. No containers with fixed px/vw widths. |
| Mobile-first / grid | N/A | No grid or media query. |
| Container not fixed px | OK | Only the intentional 40×40 thumbnail and 56 px column. |
| Font-size in rem | OK | `0.75rem` / `1.25rem` (round 1 FAIL closed). |
| Fluid heading / spacing | N/A | No headings. Small px gaps, as in Payload. |
| Media max-width / aspect-ratio | OK | `img` is 100%/100% with `object-fit: cover` in a fixed box. `width`/`height` attributes are set. |
| srcset/sizes | N/A | 40 px decorative thumbnail (`thumb` size). |
| Touch target ≥ 44 | OK / unchanged | Link/button wraps the same title text as Payload's default first cell. Checkbox unchanged from T01. |
| Nav / table on mobile | N/A | Payload table wrapper unchanged. |
| 100vh | N/A | Not used. |
| prefers-reduced-motion | N/A | No animation. |
| overflow:hidden hiding errors | OK | Only `.admin-thumb` uses it, to crop the image. |

Residual risk: no real-browser check at 375/768/1280 or in light/dark mode.

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop | skip | Not among the allowed verify commands. |
| oxlint (anti-slop) | skip | oxlint not configured. eslint has 0 errors. |
| open-code-review (ocr) | skip | ocr not installed. |
| AI-readable | OK | New files are ≤ 44 lines and functions are short. Comments explain WHY (the Payload source reason). 0–1 indicators. |
| ai-friendly-web | N/A | Internal admin only. |
| blitzstrike | N/A | Not an auth or public API task. |

## Verdict: PASS

- No CRITICAL or MAJOR findings remain. MINOR A and B are optional and can go in a separate task or be fixed now.
