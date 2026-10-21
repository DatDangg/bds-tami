Agent: reviewer

# Review: feature-listing-detail-redesign, phase-1-task-01, round 1 (BL-052)

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a34a728f6fcbd7505` (branch `worktree-agent-a34a728f6fcbd7505`, base staging `c26d69e`, not yet committed)
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-01.md`. Covers the Projects schema, `site-settings.listingPages`, the loader and the migration.

## Review level
**STRICT**

## Reason
The task touches the DB schema and adds a migration. It also changes the `projects` collection, which many public pages and the admin use, and the shared `site-settings` global. The loader is new shared code that public pages will use. Translation config (`TRANSLATABLE_FIELDS`) changes, and the new `ctaHref` field is admin input that ends up in an href on a public page.

## Blast radius
- `src/collections/Projects.ts`, `src/collections/projects/listing-fields.ts` (new), `market-blocks.ts` (`notBelow` is now exported)
- `src/globals/SiteSettings.ts`, `src/globals/site-settings/listing-pages.ts` (new)
- `src/lib/content/load-listing-page.ts` (new), `src/lib/content/internal-path.ts` (adds `isInternalPathOrHttps`)
- `src/shared/listing-options.ts` (new, shared by the admin and public code)
- `src/lib/translation/leaves.ts` (`products`, `listingPages`)
- `src/i18n/messages/{vi,en}.json` (new namespace `listingOptions`, appended at the end)
- `migrations/20261021_135620_listing_detail_redesign.{ts,json}` and `migrations/index.ts`
- `src/payload-types.ts` (+269 lines, additions only), `docs/ERD.md`
- DB: 20 new tables (8 for `projects`/`_projects_v`, 12 for `site_settings_*`), 4 new enums, and new nullable columns on `projects`, `_projects_v`, `site_settings`, `site_settings_locales`, `projects_amenities_locales` and `_projects_v_version_amenities_locales`.

## Verify commands + result
All commands ran inside the worktree. `.env.local` points to `DATABASE_URL`/`DATABASE_URL_TEST` = `tami_wt52_p1t01` and `REDIS_URL` = db 11, so the main DB `tami` was not touched.

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 warnings already present in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm test` | PASS: 365 files / 3665 tests (236s) |
| `pnpm test tests/integration/globals.test.ts tests/integration/projects.test.ts src/lib/content/load-listing-page.test.ts src/globals/site-settings/listing-pages.test.ts src/collections/projects/listing-fields.test.ts src/shared/listing-options.test.ts` | PASS: 6 files / 85 tests, none skipped. The integration tests really ran against the worktree DB ("Pulling schema from database"). |

`migrate` / `migrate:down` / `migrate` is not on the reviewer's verify list, so I did not rerun it. I relied on the builder's evidence plus a static review of the migration file (see Residual risk).

## Migration (STRICT focus)
- **`up` is additive only:** 4 `CREATE TYPE` and 20 `CREATE TABLE`. Every `ADD COLUMN` is nullable, and the two `show_strengths` columns have `DEFAULT true`. The remaining statements are FKs and indexes on the new tables/columns. There is no `DROP`, no type change, no `SET NOT NULL` on an existing column and no backfill or `UPDATE`. The `NOT NULL` constraints only apply to columns of new, empty tables. **Not HIGH_RISK_MIGRATION.**
- **`down` is correct:** it drops the 20 new tables (CASCADE removes their own FKs), drops the 5 media FKs, the 5 new indexes, every added column and the 4 enums. Order: tables first, enums last. It does not touch any existing object.
- FKs to `media` use `ON DELETE set null`, and the FKs on child tables use `ON DELETE cascade`. This matches the existing pattern (`pageBanners`, `ctaBanner.image`).
- **Shortened table names:** `quickSearch` uses `dbName` `site_settings_lp_<group>_quick_search` (`listing-pages.ts:27-31`). The longest is `site_settings_lp_property_posts_quick_search_locales` at 52 characters. The derived index names are cut by Drizzle to 63 characters and do not collide.
- **FKs over 63 characters (3 names):** `site_settings_listing_pages_{projects,rentals,property_posts}_learn_more_image_id_media_id_fk` are 68/67/74 characters. Postgres truncates them to 63 the same way in both up and down, so `DROP CONSTRAINT` in down still finds them. The truncated names stay unique. Postgres also only requires FK names to be unique per table. This is the first time the repo has a name over 63 characters (Grep found no earlier migration with one). See MINOR-1.
- `migrations/index.ts` registers the new migration last, in the correct order.

## Spec / field coverage (SPECIFICATIONS 1.46.0, sections "Admin nội dung danh sách" and "Dự án — trường mới")

| Requirement | Result |
|---|---|
| `productTypes` select hasMany + index, `PROPERTY_TYPES` with 8 values | OK `listing-fields.ts:17-25` |
| `featuredAmenities` select hasMany + index, `PROJECT_FEATURES` with 7 values | OK `listing-fields.ts:27-35` |
| `products` ≤ 8: `type` localized + required, `count` ≥ 0, `areaFrom`/`areaTo` ≥ 0 and "to" ≥ "from" (reuses `notBelow`), RowLabel | OK `listing-fields.ts:37-57`. Integration test: reversed range → 400, missing type → 400, 9 rows → 400 |
| `videoUrl` with the same validation as rentals (`validateVideoUrl`) | OK `Projects.ts:211-217`. Integration test: unknown video host → 400 |
| `amenities[].description` textarea localized, `amenitiesImage` upload (images only) | OK `Projects.ts:97`, `Projects.ts:190-193` (`imageMimeType`) |
| All new fields optional, none in `englishRequiredFields`; existing projects can still be saved | OK `Projects.ts:225`. Integration test: an empty project saves; builder's evidence: PATCH on an old published project → 200 |
| `site-settings` tab "Trang danh sách" with 3 groups | OK `SiteSettings.ts:117`, `listing-pages.ts:94-110` |
| `quickSearch` ≤ 8 with `label` localized + required; `faqs` ≤ 10 with `question`/`answer` localized + required | OK, unit test + integration test (9 rows → 400, missing answer → 400) |
| `learnMore`: eyebrow/title/titleAccent/description/ctaLabel localized; image/videoUrl/ctaHref not localized | OK, unit test `listing-pages.test.ts:31-32` |
| `ctaHref` blocks `javascript:`, `http:`, protocol-relative `//`, and relative paths without a leading `/` | OK. `isInternalPathOrHttps` (`internal-path.ts:13-22`) reuses `SAFE_INTERNAL_PATH`, which already blocks `//`, `/\`, `%2f`, `%5c` and control characters; otherwise the protocol must be `https:`. Server-side validation (`listing-pages.ts:21-24`) and the loader (`load-listing-page.ts:47`) both check it. Tested at three levels: unit, loader and integration. |
| `showStrengths` only for rentals/propertyPosts, default `true`; projects uses `showProjectStrengths` | OK |
| Automatic translation | OK. `products` added to `TRANSLATABLE_FIELDS.projects`; `amenities` was already there, so `description` is picked up. `listingPages` added to `site-settings`. `collectLeaves` already walks `row`/`collapsible` (`leaves.ts:95`), so `products.type` inside `formRow` gets collected. |
| Loader on `/en` drops rows without text and does not fall back to VI; `learnMore` is `null` when the title is missing; uses the existing global cache | OK. Unit tests in `load-listing-page.test.ts:48-58`. The integration test shows EN reads before translation return `label` = null, not the Vietnamese text. |
| Access control for `site-settings`/`projects` | OK, unchanged. The diff does not touch `access`. |
| Vietnamese admin labels | OK |
| `payload-types.ts` matches | OK. Typecheck passes, the diff contains additions only, and the field/type names line up. |
| ERD doc impact | OK `docs/ERD.md` (projects + site-settings as-built) |

## Responsive Checklist Gate
N/A. The diff only covers schema, admin config, loader and i18n; it adds no public route, component or CSS.

## Skill gates
- aislop: skip, `aislop` is not in the reviewer's verify command list (no permission to run it). Manual review found no AI-slop: the code is short, the names are clear and nothing is over-engineered.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc*` in the repo). `pnpm lint` (eslint) PASS with 0 errors.
- ocr (open-code-review): skip, ocr is not installed.
- AI-readable: OK, 0 indicators. All new files are ≤ 110 lines and every function is ≤ 50 lines. Names are clear (`isInternalPathOrHttps`, `resolveListingPageContent`), there are no unexplained magic numbers (`MAX_*` constants), indirection is ≤ 2 levels, and the ERD is updated.
- ai-friendly-web: N/A, the task does not touch any public web output.
- blitzstrike: skip, not installed and no permitted environment. Static review of `ctaHref`/`videoUrl` found no bypass (see the table above).

## Findings

### CRITICAL
None.

### MAJOR
None.

### MINOR
1. **[MINOR-1] Three FK names exceed 63 characters and depend on Postgres's silent truncation.** `migrations/20261021_135620_listing_detail_redesign.ts:249-251` (up) and `:305-309` (down). Up/down/up works because the truncation is consistent, and the names do not collide. However, the name in the Drizzle schema/snapshot (`.json`) differs from the real name in the DB. If the project ever uses `push`/introspection (dev push, `drizzle-kit` diff against the DB), it will see drift and try to drop and recreate these 3 constraints. Suggested fix (optional, no need to block): set a short `dbName` for the `learnMore` group or the `image` field, the same way `quickSearch` already does, so the FK name stays under 63 characters. The builder already noted this in ERD/Verification, so it is not hidden.
2. **[MINOR-2] Wording differs from the spec for `pool_gym_spa`.** The spec says "Hồ bơi – gym – spa"; the code uses "Hồ bơi, gym, spa" (`src/shared/listing-options.ts:31`, `vi.json`). This is a recorded decision (Builder decision #2: messages-check bans the long dash). The meaning is the same, but the spec intent text and the as-built label now differ. Suggestion: record the deviation in the close-out / gap register; do not edit the intent spec yourself.
3. **[MINOR-3] Project `videoUrl` has no `trimText`, while `learnMore.videoUrl`/`ctaHref` do.** `Projects.ts:211-217` vs `listing-pages.ts:63,72`. The validator already trims when checking, so a value with surrounding spaces is stored as-is. This matches the existing `rentals.videoUrl`, so it is not a regression; it is only a small inconsistency. You could add `hooks: { beforeValidate: [trimText] }`.

## Residual risk
- Migration `up → down → up` was verified by the builder on `tami_wt52_p1t01`. I could not rerun it because migrate is not on the verify list. A static review of the file confirms it is additive and that down is symmetric.
- The builder's browser check of the admin (tab layout, labels) was not repeated; it is only partly covered by the schema unit tests.
- Media used in `amenitiesImage`/`learnMore.image` can still be deleted, and the FK then sets the column to null. This is consistent with `pageBanners`; the loader handles a missing image (`image: undefined`).

## Verdict
**PASS.** There are no CRITICAL or MAJOR findings. The 3 MINOR findings do not block, and the builder can handle them in a later task or at close-out.
