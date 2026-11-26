Agent: reviewer

# Review — feature-admin-address-map-location-input · phase-1-task-02 · round 1 (BL-131 T02)

- Task: `tasks/feature-admin-address-map-location-input/phase-1-task-02.md`
- Change doc: `spec/changes/2026-11-26-admin-address-map-location-input.md`
- Scope reviewed: `src/fields/map-location.ts` (new), `src/fields/map-location.test.ts` (new), and the diffs in `src/collections/{Rentals,Projects,PropertyPosts}.ts`, `src/collections/projects/market-blocks.ts`, `src/globals/SiteSettings.ts`, `src/globals/site-settings/contact-offices.ts`. Other dirty files in the working tree are outside this task and were not reviewed.

## Review level
**STRICT**

## Reason
One shared field is now used in 6 places across 4 collections and 2 globals. The new server validation can stop saves of existing records, including saves made by internal jobs and hooks. Rentals reads this field through its own access rule (`readExactAddress`).

## Blast radius
- Admin create/update and Local API/REST writes for `rentals.location`, `projects.location`, `projects.nearbyAmenities[].location`, `property-posts.location`, `site-settings.mapLocation`, and `site-settings.offices[].location`.
- Internal writers that send the whole document through validation, so a bad legacy coordinate would fail them:
  - translation jobs (`src/jobs/translate-content-save.ts:19`, `translate-content-context.ts:45`)
  - `src/hooks/pages/sync-privacy-version.ts:27` (`updateGlobal` site-settings)
  - `src/lib/backfill/offices.ts:96,106`
  - `src/hooks/rentals/build-search-text.ts:140`
  - `src/lib/search/reindex-rental-search-text.ts:57`
- Schema: none. The field type stays `point`, nothing new in `migrations/`, and `payload-types.ts` is not touched by this task.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/fields src/collections src/globals src/lib/backfill` | PASS: 34 files / 366 tests |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no errors) |
| `pnpm exec eslint <8 changed/new files>` | PASS (no output, exit 0) |
| tests/integration (needs DB) | Not run, so I don't touch dev data. Residual risk. |

## Correctness check (validator)
- Payload's default `point` (`node_modules/payload/dist/fields/validations.js:671-698`) is called with the original `(value, options)`. So `required` → `validation:required` / `requiresTwoNumbers` behaves the same as before, as do `invalidInput` and the ±180/±90 bounds. Because a custom `validate` replaces the default, calling it explicitly is the right pattern.
- Empty values (`null`, `undefined`, `[]`, `["",""]`, `[null,null]`): `readCoordinates` → null, then the default validator → `true` when not required. Covered by tests.
- Half-filled values (for example `[106.7, ""]`) → `readCoordinates` null, so the default validator decides (`invalidInput`). Safe.
- The swap check runs before the default validator, which is needed because `[10.77, 106.70]` would otherwise hit `latitudeOutOfBounds`. The two ranges (lat 7–24, lng 101.5–118) do not overlap, so the swap check is unambiguous.
- Numeric strings from the form are parsed with `parseFloat`. Covered by tests.
- Client admin: in Payload v3, `validate` runs server-side in form-state and on save. `payload/shared` is safe to import on both sides. There is no browser-only dependency.
- Overrides are kept: Rentals has `access: { read: readExactAddress }`, SiteSettings has `name: "mapLocation"`, and market-blocks/PropertyPosts keep their descriptions word for word. Projects and contact-offices had no description before and have none now. The test walks the admin config and asserts all 6 point fields share the validator and that Rentals' `access.read` is present.
- Seed/test fixtures that write coordinates (`tests/integration/*`, `src/lib/backfill/offices.test.ts`) are all inside Vietnam. The out-of-range literals (`[200,95]`, `[500,500]`, `[200,100]`) are only in pure view/plan unit tests that don't go through Payload validation.

## Responsive Checklist Gate
N/A — no UI/CSS/component change in this task (config + server validator only; the custom Field component is T03).

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint PASS instead.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. 72-line file, functions under 15 lines, named constants for the ranges and messages, comments explain WHY (lat/lng margin, swap-before-default ordering). 0 indicators.
- ai-friendly-web: N/A (internal admin/validation).
- blitzstrike: N/A (no auth/public input surface change; this validation only makes input rules stricter).

## Findings
- **[MINOR] Legacy bad coordinates on staging/prod could break internal writers.** Payload validates the merged document on every update. If a staging/prod record holds an outside-Vietnam or swapped coordinate, these will start failing for that record: translation jobs, `syncPrivacyPolicyVersion` (if `site-settings.mapLocation` is bad, publishing the Privacy page fails with a coordinate error), rental search-text rebuild, and offices backfill. The dev DB scan shows 0 bad rows, but staging/prod were not scanned (task file §DB scan). Fix/mitigation: before deploying, run the same read-only SELECT scan on staging (and prod when live) and record the result in the task file or deploy notes. No code change required.
- **[MINOR] Doc impact pending.** The task lists `docs/ERD.md` (coordinate validation rule) for the end of the phase. Make sure close-out records the rule (range 7–24 / 101.5–118, `[lng, lat]`, the two messages).
- **[MINOR] Test gap (optional).** No explicit test for a half-filled value (`[106.7, ""]` → default `invalidInput`) or a swapped value at the range edges. The behaviour is correct by inspection.

No CRITICAL or MAJOR findings.

## Residual risk
- Integration tests (Local API save path with real Payload) were not run by the reviewer; the validator's wiring is checked through the config-walk unit test.
- Staging/prod data was not scanned (see the first MINOR finding).

## Verdict
✅ **PASS**
