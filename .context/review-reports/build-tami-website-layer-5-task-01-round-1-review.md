Agent: reviewer

# Review — build/tami-website · layer-5-task-01 (collection `projects`) · round 1

- **Review level:** STRICT
- **Reason:** new schema + versioned migration (PostGIS extension plus custom SQL indexes), RBAC on a content collection, a public query allowlist that several screens use (`PublicCollectionSlug`), and a dev/staging seed. Each of these is a red-risk item under AGENTS.md § Reviewer rules.
- **Scope:** uncommitted diff vs HEAD `6289863` (`.claude/launch.json` ignored): `src/collections/Projects.ts`, `migrations/20261017_125429_projects.ts` (+ `.json`), `migrations/index.ts`, `src/payload.config.ts`, `src/payload-types.ts` (generated), `src/lib/content/public-queries.ts`, `seed/sample/projects.ts`, `seed/index.ts`, `tests/fixtures/projects/payload-config.ts`, `tests/integration/projects.test.ts`.
- **Blast radius:** new tables `projects*` / `_projects_v*` plus column `payload_locked_documents_rels.projects_id` (additive). `findPublicList` / `findPublicBySlug` now accept `projects`, and this unlocks Layer 6 pages (`/du-an`, `/en/projects`). The category delete guard (`scope-collections.ts`) now sees the real `projects` collection. The sample seed step `--sample` changed. Shared kit `withContentDefaults` is consumed but not modified.

## Verify commands + result

| Command (`.context/project-config.md`) | Result |
|---|---|
| `pnpm install --frozen-lockfile` | skip: lockfile unchanged in this diff, deps already installed |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 103 files, 1076 tests, 0 skipped. Integration DB present, so `tests/integration/projects.test.ts` actually ran |
| `pnpm build` | PASS (exit 0) |
| `pnpm payload migrate` | not run: not auto-allowed for the reviewer (deploy only). See MINOR-4 |

## Responsive Checklist Gate

N/A: the diff has no route, component or CSS (schema, seed, migration and query allowlist only).

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop (`npx aislop scan --changes --json`) | OK, score 99 (≥ 80) | 6 style warnings, all in the generated migration file (unused `payload`/`req` params, duplicate block): Payload's codegen pattern, ignore |
| oxlint (anti-slop) | skip, oxlint not configured | no `.oxlintrc.json`/`oxlint.json`; eslint PASS |
| ocr (open-code-review) | skip, ocr not installed | — |
| AI-readable | OK (0–1 indicators) | `Projects.ts` 133 lines, `createProjects` ~45 lines, named helpers (`validateGallery`, `scaleGroup`, `floorPlansField`), comments state WHY (ERD/PERMISSION refs). Test file 371 lines (> 300 cap, but in line with the other integration suites; not counted) |
| ai-friendly-web | N/A | not a public-facing page change |
| blitzstrike | skip | not installed; no new public endpoint (Payload REST reuses shared access) |

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| G12 allowlist `PublicCollectionSlug` (+ translation allowlist) | OK | `public-queries.ts:11` adds `"projects"`. `src/lib/translation/allowlist.ts:9` already contained `projects`. Test `projects.test.ts:298-322` goes through `findPublicList`/`findPublicBySlug` |
| Full ERD §4.5 field set (location PostGIS, scale, amenities, floorPlans, documents, legalInfo, salesPolicy) | OK | `Projects.ts:91-126`. Migration `location geometry(Point)`. Test `:154-202` round-trips every group |
| `gallery` required when `published`; first image = cover | OK | `validateGallery` `Projects.ts:29-34` (uses `previousValue` for partial updates). Tests `:214-230` cover create without gallery, `[]`, partial update, unpublish-by-empty, and order preserved |
| Factory kit (slug, seo, status, publishedAt, author, isFeatured, hasEnglish/translation, versions, soft delete, revalidate) | OK | `withContentDefaults(..., { englishRequiredFields: ["title","slug","summary","overview"] })` matches ERD §1.1. Tests: trash `:164`, slug `:289-294`, Duplicate `:335-350`, revalidate `/vi/du-an/...` + `/en/du-an` + `/vi` `/en` when featured `:324-331` |
| Index `(status, has_english, sales_status, province_id)` + GIST `location` + UNIQUE `(_locale, slug)` | OK (SQL inspected) | migration `:297-298` `projects_list_idx`, `projects_location_gist_idx`; `:250` UNIQUE `projects_slug_idx (slug,_locale)`. Custom indexes are not exercised by tests (fixture uses `push: true`). See MINOR-4 |
| Tests: publish without gallery → error; other sale's update/delete → 403; soft delete + admin restore; category in use → 409; guest cannot read draft | OK | `:214`, `:234-253`, `:275-285` (hard and soft category delete → 409), `:298-311` (draft/hidden/soft-deleted invisible, `/en` requires `hasEnglish`) |

**RBAC:** sale creates (author auto-assigned, `:236`), updates own, cannot update/soft-delete/delete another sale's project (403), cannot hard delete or restore own (403). Admin edits any project, restores and hard deletes. Guest create → 403. All of this comes from shared access (`content-defaults.ts:141-144`) and is verified against the real collection. OK.

**Migration safety:** versioned and additive. Only CREATE TYPE/TABLE/INDEX, FKs from new tables, and `ADD COLUMN projects_id` (nullable) on `payload_locked_documents_rels`. No DROP, type change, `SET NOT NULL` on existing data, or backfill, so `HIGH_RISK_MIGRATION` is not needed. `down()` drops only the projects objects and correctly leaves the PostGIS extension in place.
- `CREATE EXTENSION IF NOT EXISTS postgis`: staging and prod both use the `postgis/postgis:17-3.5` image and mount `docker/postgres/init.sql` (installs postgis/unaccent/pg_trgm at initdb; `docker-compose.staging.yml:164`, `prod.yml:164`). The DB role is `POSTGRES_USER` (superuser in the official image). On an existing volume the statement is a no-op. If a non-superuser app role is introduced later, the statement is still a no-op as long as the extension already exists. **Acceptable.**
- Custom SQL indexes outside the `.json` snapshot: `migrate:create` diffs against the snapshot, so later migrations will not try to drop them, and the production config sets `push: false` (`payload.config.ts:86`). There is no drift risk in staging/prod. The only gap is test coverage (MINOR-4). **Acceptable** (same pattern as `news_list_idx`).

## Findings

No CRITICAL. No MAJOR.

- **[MINOR-1] `gallery` custom `validate` replaces Payload's default upload validation.** `src/collections/Projects.ts:29-34,120`. Without the default validator, `filterOptions: { mimeType: image/* }` is enforced only in the admin UI. Through REST or the Local API a staff member can put a PDF into `gallery`, which breaks the cover `<img>`/OG image on public pages. An invalid or non-existent id also reaches the DB and fails as an FK/uuid error (500) instead of a 400. Fix (cheap): compose the default validator first, e.g. `import { upload } from "payload/shared"`, then `const base = await upload(value, args); if (base !== true) return base;` before the publish check. Apply the same fix to news `cover` (follow-up). Only authenticated staff can write, so this does not block.
- **[MINOR-2] `ward` is not constrained to the selected `province`.** `Projects.ts:103`. A project can be tagged province = Hà Nội with a ward from TP.HCM, which would mislead the Layer 6 filters. Neither SPEC nor ERD states this rule, so it is not blocking. Suggested fix: `filterOptions: ({ data }) => data?.province ? { province: { equals: data.province } } : true`. The ward field has no custom validate, so Payload's default relationship validation would then enforce it on the API as well. Otherwise log it as a gap/follow-up.
- **[MINOR-3] Seed deviates from the task note ("ảnh picsum").** `seed/sample/projects.ts:9-12,112`. Samples are `draft` with no gallery, so Layer 6 dev/staging has no published sample project to render. The comment documents the reason. Not an AC. Record it as a deviation in the task file and as a follow-up before `layer-6-task-01`. Options: bundle 2–3 small local images under `seed/` and upload them through `payload.create({ collection: "media", filePath })` (needs S3/SeaweedFS but no network), then publish. Committing image assets to the repo is a user decision.
- **[MINOR-4] The migration SQL itself is not exercised by any automated check.** The test fixture builds the schema with `push: true` (`tests/fixtures/projects/payload-config.ts:24`), so `projects_list_idx`/`projects_location_gist_idx` and the hand-written lines (`migrations/20261017_125429_projects.ts:5-6,296-298`) are unverified. The run journal has no `pnpm payload migrate` evidence on the dev DB. The SQL reads correctly on inspection. Before close-out, record in the task file's Verification that `pnpm payload migrate` applied cleanly on dev, ideally with `\di projects*` output showing both indexes.
- **[MINOR-5] Pre-existing Payload FK pattern: `NOT NULL` + `ON DELETE SET NULL`.** `province_id` (`migration:48,204`), `author_id` (`:62,206`), `projects_floor_plans.image_id` (`:33,199`). Deleting a province, staff member or media still referenced by a project will fail with a NOT NULL violation (500) instead of a clean 409. This is Payload codegen behaviour and already exists in other collections. Also, `projects_rels_media_fk ON DELETE cascade` (`:210`) means deleting a media item silently removes it from `gallery`, so a published project can end up with no images. Layer 6 must render a placeholder when `gallery` is empty. Out of scope for this task: propose a separate task for a media/staff in-use delete guard.
- **[MINOR-6] `projects_list_idx` is not partial (`WHERE deleted_at IS NULL`), while ERD §5 line 544 says partial.** `migration:298`. This matches `news_list_idx`. Reconcile ERD §5 as-built (note non-partial for both) rather than change the migration.

## Rulings on builder-flagged items

1. **Draft samples without gallery.** Acceptable for this task (not an AC). Must be recorded as a deviation plus a follow-up before L6-T01. Committing image assets is a user decision (MINOR-3).
2. **`gallery` validate bypasses `filterOptions` on API/Local API.** Acceptable (non-blocking), recommend fixing now by composing the default `upload` validator (3 lines). Otherwise open a follow-up that covers both `projects.gallery` and `news.cover` (MINOR-1).
3. **No cross-field checks.** Acceptable. SPEC/ERD/BRD/design only require `≥ 0` (ERD §4.5:218-219); there is no rule on priceTo ≥ priceFrom or areaTo ≥ areaFrom. Do not invent business rules. Ward-belongs-to-province is a cheap, sensible guard: recommended via `filterOptions`, or log it as a gap (MINOR-2).
4. **Doc impact (required at close-out):**
   - ERD §4.5: add an As-built note (file `src/collections/Projects.ts`, `withContentDefaults` + `englishRequiredFields` title/slug/summary/overview, `location` = `geometry(Point)` [lng, lat], `documents` PDF-only filter, `floorPlans.image` required, gallery publish validator, migration `20261017_125429_projects`, seed draft samples).
   - ERD §5: change the `projects` row from `(status, sales_status, province_id)` to `(status, has_english, sales_status, province_id)` (`projects_list_idx`) + GIST `projects_location_gist_idx`, and note non-partial (same as news).
   - ERD §4.3/§187: no change (scope table already lists `projects`).
   - API_SPEC: no impact. No project-specific endpoint; Payload REST reuses shared access.

## Residual risk

- The migration was not applied by the reviewer (no DB permission). This depends on builder evidence (MINOR-4).
- Default `upload` validator import path (`payload/shared`): confirm against the installed Payload version when applying MINOR-1.

## Verdict

PASS. No CRITICAL/MAJOR. All ACs are met and verified by integration tests running against a real DB, and lint, typecheck, test and build pass. MINOR-3/4/6 and doc impact must be handled at close-out (record deviation and migrate evidence, reconcile ERD). MINOR-1/2 are recommended fixes or follow-ups.
