Agent: reviewer

# Review: bug-job-posting-duplicate-slug-date, phase-1-task-01, round 1 (BL-128)

- Review level: STRICT
- Reason: these are shared fields (`slugField`, `publishedAtField`, `statusField`) used by every content collection through `withContentDefaults`. The change affects public URLs (slug) and publish state, so it hits both "shared component" and "public URL" red risks.
- Blast radius: news (including BL-091 scheduled publish), projects (reserved slug `danh-muc`/`category`), rentals (public statuses `published` + `rented`), property-posts, job-postings, services, developers; `create-slug-redirect` and revalidate hooks (afterChange); admin "Tạo bản sao" (Payload duplicate → create with `duplicateFromID`); every REST/Local API update that does not send `slug`.
- Diff scope: `src/fields/status.ts`, `src/fields/published-at.ts`, `src/fields/slug.ts`, `src/fields/slug.test.ts`, `src/fields/published-at.test.ts`, `src/fields/status.test.ts` (new). I ignored the other dirty files.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/fields src/hooks src/collections` | PASS: 43 files / 372 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS |
| `pnpm exec eslint <6 changed files>` | PASS (no output) |
| Integration Payload/DB | skip (no DB/Docker, per brief) |

## How the fix was checked against the Payload source
- `node_modules/payload/dist/duplicateDocument/index.js:63` runs `beforeDuplicate` on the whole doc before `create`. Then `fields/hooks/beforeDuplicate/promise.js:61-88`: for a non-localized field, a non-`undefined` return value overwrites the old value. So `status → "draft"` and `publishedAt → null` take effect. Slug is localized (`:29-60`), so returning `undefined` leaves it out of every locale. This matches the builder's evidence.
- `collections/operations/duplicate.js:6`: `data = {}`. In `beforeValidate/promise.js:182-244`, the fallback value comes from `siblingDoc` (the doc after beforeDuplicate), so status = draft. `publishedAt` is dropped by `access.create: denyAll`. In `beforeChange`, `previousValue` = null, so `stampFirstPublish` does not reuse the old date, and the first publish stamps a new date. Status `"draft"` is in both `CONTENT_STATUSES` and `RENTAL_STATUSES`. Acceptance 1 is OK.
- On the duplicate's create, `originalDoc.slug` is undefined, so `shouldRegenerateFromNewTitle` returns false. The slug is generated from the copied title plus a suffix via `findFreeSlug`, same as before. On a normal create there is no `originalDoc.slug`, so behavior is unchanged.
- On a partial update without `slug`, `value` = stored slug (fallback, `beforeValidate/promise.js:211`). So the new rule also applies to a PATCH that changes only the title of a never-published draft. This is intended and limited to non-public docs (see the `rented` finding).
- News scheduled: a copy has `publishedAt = null` and status draft, so it inherits no schedule. `stampScheduledPublish` is unchanged.
- `create-slug-redirect.ts:64-66` only acts when the doc is public before or after the save, so a draft that changes slug creates no junk redirect. Confirmed, no edit needed. Revalidate also only runs for public docs.
- Uniqueness, scopeField, reserved slugs: the regenerated slug still goes through `findFreeSlug` (excluding its own id, trash included, reserved slugs applied). OK.

## Findings

### [MAJOR] 1. The "auto-generated slug" heuristic also matches user-shortened slugs, so a slug the user typed gets overwritten (breaks the acceptance item "Bản nháp người dùng tự sửa slug → giữ slug người dùng")
- `src/fields/slug.ts:62-63`: `stem = typed.replace(/-\d+$/, "")` then `autoBase.startsWith(stem)`. This accepts **any prefix** of `slugify(oldTitle)`, even with no numeric suffix and not on a word boundary.
- Concrete repro (unit-level): a draft with title "Căn hộ cao cấp view sông Quận 2". The editor shortens the slug to `can-ho-cao-cap` and saves; it is kept, since typed ≠ stored. Later the editor fixes the title to "… giá tốt" and saves. Now typed = stored = `can-ho-cao-cap`, the doc was never published, the title changed, and `"can-ho-cao-cap-view-song-quan-2".startsWith("can-ho-cao-cap")` is true. The slug is **regenerated** into the long one and the user's slug is lost silently. Same for `can-ho`, `c`, or `can-ho-cao-cap-5`. Shortening a long slug is the most common manual edit, not the "rare coincidence" the residual-risk note describes.
- The test `slug.test.ts` "bản nháp người dùng tự sửa slug" only covers `slug-tu-chon`, which is not a prefix, so it gives false confidence.
- Suggested fix: match the exact form `suffixedSlug` produces. Accept `typed === autoBase`, or `typed` ends in `-(\d+)` with n ≥ 2 and `typed === suffixedSlug(autoBase, n)` (this already covers truncation at 80 characters). Remove `startsWith`. Add tests: (a) a prefix-shortened slug is kept when the title changes; (b) a long title (> 80 characters) with an auto `-3` suffix is still regenerated.

### [MAJOR] 2. The "never public" check only looks at `status === "published"` and misses the public `rented` status of Cho thuê, so a live public URL can change
- `src/fields/slug.ts:58`: `if (originalDoc.publishedAt || originalDoc.status === "published") return false;`. But `PUBLIC_STATUSES.rentals = ["published", "rented"]` (`src/access/publishedOnly.ts:6`), and `stampFirstPublish` only stamps `publishedAt` when status = `published` (`published-at.ts:14`).
- So a rental saved straight to "Đã thuê" (never passed through `published`) has `publishedAt = null` and is public on `/cho-thue/<slug>`. When an admin changes its title, the slug is regenerated and the public URL changes. `create-slug-redirect` does create a redirect, so this is not a 404, but it breaks the invariant "doc with a public URL keeps its slug" that the task and brief require.
- Suggested fix: only allow regeneration when status is non-public, i.e. `draft` / `hidden` (for example `if (originalDoc.status !== "draft" && originalDoc.status !== "hidden") return false;`, or take `publicStatuses` as a parameter). Add a test for `status: "rented", publishedAt: null` keeping its slug.

### [MINOR] 3. The JSDoc of `makeSlugHook` is now partly out of date
- `src/fields/slug.ts:75-76` still says "Slug đã lưu mà request không gửi lại thì giữ nguyên (không đổi theo tiêu đề)", but a never-published draft now does follow the title (including a partial PATCH). Update the comment to point to `shouldRegenerateFromNewTitle`.

### [MINOR] 4. Behavior change for the API is not recorded
- A PATCH with only `title` on a never-published draft whose slug was auto-generated now changes the slug. This is reasonable, but it should go into the ERD §1.1 / SPECIFICATIONS as-built note at close-out (task Doc Impact already mentions ERD:157; add the API side too).

### Code quality / surgical diff
- The diff is narrow; every line traces back to the task. Functions are under 50 lines and files under 300 lines. `resetOnDuplicate` and `dropSlugOnDuplicate` are clearly named. No drive-by refactor.

## Responsive Checklist Gate
N/A. The diff does not touch UI (route/component/CSS); it only changes Payload field configs and hooks.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, not run (not in the brief's verify set; reviewer only runs allowed verify commands) |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc*`); eslint PASS replaces it |
| ocr (open-code-review) | skip, ocr not installed / not invoked |
| AI-readable | OK: 1 indicator (stale comment, finding 3), < 3 |
| ai-friendly-web | N/A (internal field logic, no public web asset change) |
| blitzstrike | N/A (not auth/input-security surface) |

## Bug repro closure
- The task's Repro Verification shows `Status: PASS (unit; integration DB skip)`. The unit tests and Payload source reading support the status/publishedAt parts. The slug part is right for the job-postings case, but the heuristic over-matches (finding 1) and has a public-status gap (finding 2), so the repro closure is not acceptable yet.

## Residual risk
- The real duplicate flow through admin + DB has not run (no Docker). The flow was inferred from Payload source; the inference matches.
- Batch slug edits (bulk edit) over many never-published drafts can regenerate slugs at the same time if the title changes. Low risk, non-public.

## Verdict
FAIL: 2 MAJOR (1: prefix heuristic overwrites user-typed slugs; 2: `rented` public rentals without `publishedAt` change their public URL). Return to builder to fix findings 1 and 2 (plus tests), and update the comment (3).
