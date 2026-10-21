Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-1-task-03 · round 1 (BL-051 A7)

## Review level
STRICT

## Reason
The new slot is attached to every collection through `ADMIN_COLLECTIONS` (a shared config wrapper and a shared admin component). "Xem trên website" decides whether a document is public, so a wrong check could link to drafts, trashed documents or EN pages that return 404. Both risks call for STRICT.

## Blast radius
- Edit and create views of all 21 admin collections (`withDocumentNavSlot` in `src/collections/admin-collections.ts:65`). Globals are not wrapped.
- `.doc-controls` background in every edit view, including the drawer (`_doc-controls.scss`).
- `_list-toolbar.scss` header breakpoint changed from 767 to 768px (list views on mobile).
- `importMap.js`: one new entry.
- Collection schema, API and public site are unchanged. `doc-link.ts` and `publishedOnly.ts` are only reused.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS (0 errors; 2 warnings that were already there, in `tools/task-dashboard/server.mjs`, outside this diff) |
| `pnpm test` | PASS: 3585/3585 |

## Key checks (evidence)
- **Visibility check matches the public site's `buildPublicWhere`** (`src/access/publishedOnly.ts:13-16`).
  - `status ∈ PUBLIC_STATUSES` (rentals also allow `rented`) and `deletedAt` is falsy: `public-doc-url.ts:26-39`.
  - EN requires `hasEnglish === true` (`doc-link.ts:29`).
  - The slug is the localized value from `savedDocumentData`. Localization has `fallback: false` (`payload.config.ts:92`), so an empty EN slug returns null instead of falling back to the VI slug.
  - Legal pages use the fixed route for their `kind`.
  - Collections not in `CONTENT_ROUTES` or `LEGAL_PAGE_ROUTES` (leads, media and others) get null.
- **Only saved data is used:** the check reads `savedDocumentData` (not form state) and requires `id`. Create mode shows no site link.
- **URL helpers:** the path comes from the existing `resolveInternalDocHref`, which uses `CONTENT_ROUTES`, `LEGAL_PAGE_ROUTES` and `publicDetailPath`. The base URL is `getEnv().NEXT_PUBLIC_SITE_URL` on the server side (`DocumentNavSlot.tsx`), with the trailing `/` trimmed.
- **New tab:** `target="_blank" rel="noopener noreferrer"`, with an aria-label that says it opens a new tab.
- **Existing slots kept:** `[...existing, SLOT]`, covered by `document-nav-slot.test.ts`. No collection currently uses `beforeDocumentControls`.
- **Globals:** not wrapped (`ADMIN_GLOBALS` is unchanged), and the component returns null when there is no `collectionSlug`.
- **Drawer:** the component hides at `useEditDepth() > 1`. CSS keeps Payload's z-index 5 and adds only a background, so the drawer (z 101) and dropdowns stay on top. The builder's browser check reports that the BL-050 header (language selector and "Xem website") does not overlap.
- **Data leak:** none. Only the public URL of a document that is already public is rendered.

## Responsive Checklist Gate (diff touches admin UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder measured scrollWidth 375 at 375px. CSS: on mobile the labels are visually hidden, so only icons, Save and ⋮ remain. |
| Mobile-first / media query | OK (follows convention) | Uses `max-width: 768px`, the same as Payload's mid-break and the other admin style blocks. The `_list-toolbar` breakpoint is now unified at 768 (+ test). |
| Grid auto-fit / container not fixed px | N/A | No new grid or container. |
| Typography rem | OK (note) | `font-size: 14px` follows the admin's px convention (`_controls.scss` 14px, matching Payload's base). Not a regression. |
| Media | N/A | Only inline SVG icons (16px, aria-hidden). |
| Touch target ≥44px | OK | `@media (max-width:768px)`: `min-width:44px; min-height:44px`. The builder measured 44x44 links and a 44px-tall Save. |
| Nav on mobile | N/A | Not a nav. |
| Table | N/A | |
| 100vh | N/A | Not used. |
| prefers-reduced-motion | N/A | No animation. |
| overflow:hidden hiding problems | OK | `overflow:hidden` only appears in the sr-only pattern for the label (1px box). |
| Accessible names | OK | Back link keeps its text (sr-only on mobile). Site link has an aria-label. |

Not verified by me (no browser): the actual layout at 768 and 1280, and the language dropdown over the sticky bar in dark mode. These are covered only by the builder's evidence and are listed under Residual risk.

## Skill gates
- aislop: skipped, `aislop` is not installed.
- oxlint (anti-slop): skipped, oxlint is not configured (no `.oxlintrc.json`). ESLint is PASS.
- ocr (open-code-review): skipped, ocr is not installed.
- AI-readable: OK. Names are clear. Functions are short (`publicDocUrl` 6 lines, the component about 25 lines). Indirection has 2 steps (`publicDocUrl` → `resolveInternalDocHref`). No magic numbers apart from 44px/768px, which are explained in comments. Comments explain WHY. 0 chaos indicators.
- ai-friendly-web: N/A (internal admin, not public).
- blitzstrike: N/A (no auth, input or API surface; read-only link).

## Findings
- [MINOR] `src/lib/admin/public-doc-url.ts:39`: `job-postings` shows the link even when the posting is past its deadline. This matches the current public detail page, which is still reachable, and the builder recorded it as a residual. No fix needed now. If the detail page later starts returning 404 for expired postings, add the deadline condition here.
- [MINOR] `src/lib/admin/public-doc-url.ts`: this copies the logic of `buildPublicWhere` (status + deletedAt) instead of sharing a predicate. If the scheduled publishing check (`publishedAt`, FR-ADM-16) is added to `buildPublicWhere`, this helper will drift. Suggestion: add a "sync with public-doc-url" comment in `publishedOnly.ts`, or export an `isPubliclyVisible(doc)` predicate next to `buildPublicWhere`.
- [MINOR] `src/components/admin/DocumentNavLinks.tsx:28`: the "unsaved changes" guard for the back link relies on Payload's leave-without-saving behaviour (anchor interception through Payload `Link`). There is no automated test, and the builder did not demonstrate the dirty-form case. A manual check in browser QA is recommended. It does not block, because Payload's mechanism is global.
- [MINOR] The link updating right after Save (from `savedDocumentData`) has not been checked with a real save. The builder recorded this as a residual.

There are no CRITICAL or MAJOR findings.

## Residual risk
- The responsive layout at 768 and 1280, the dark-mode dropdown and the drawer stacking were not checked in a browser by the reviewer. They rest on the builder's evidence and the CSS reasoning above.
- Scheduled publishing (`publishedAt`) is not taken into account, matching the current `buildPublicWhere`.

## Verdict
PASS
