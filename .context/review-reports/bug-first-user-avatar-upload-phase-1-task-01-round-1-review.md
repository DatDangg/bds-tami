Agent: reviewer

# Review — bug-first-user-avatar-upload · phase-1-task-01 · round 1

- Task: `tasks/bug-first-user-avatar-upload/phase-1-task-01.md` (BL-069)
- Change doc: `spec/changes/2026-10-23-first-user-avatar-upload.md`
- Diff: `src/collections/Staff.ts` (+2 lines, field `avatar` → `admin.condition`) + new `src/collections/staff-avatar-condition.test.ts` (untracked)

## Review level
**STRICT**

## Reason
The change touches the auth collection (`staff`), and the bug is about access (`Media.access.create = isStaff`). I had to confirm two things: that no access rule was loosened, and that `admin.condition` has no side effects on server-side create/update.

## Blast radius
- Admin UI: the `staff` form on `/admin/create-first-user` (no user) and the create/edit staff form for any logged-in user.
- Server: `beforeChange` field hooks of `staff` (Payload evaluates `admin.condition` again there to decide whether to skip validation).
- Generated types / JSON schema: the field becomes "conditional", so it is optional in the schema. `avatar` was not `required` before either, so nothing changes in practice (`typecheck` PASS).
- Not touched: `Media.access`, `isStaff`, Staff access, DB schema/migration, public API (`rental-queries` reads `avatar` through the Local API with `select`, which does not depend on the condition).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `pnpm exec vitest run src/collections/staff-avatar-condition.test.ts` | PASS 4/4 |
| `pnpm exec eslint src/collections/Staff.ts src/collections/staff-avatar-condition.test.ts` | PASS (exit 0) |
| `pnpm lint` | FAIL, existing errors outside scope: **8 errors** (not 7 as the builder reported), all in `.import-tmp/*` (untracked `??`) and `.local-seed/*` (gitignored `!!`): 5× `no-explicit-any`, 1× `prefer-const`, 1× `no-require-imports`... (8 lines total). None in files this diff touches. |
| `pnpm test` (full) / `pnpm build` | Not re-run (the builder reports 4532/4532 PASS and build PASS). The diff only adds a field config + 1 test; typecheck + targeted test are enough to cover it. |

## Payload 3.91 analysis (checked in node_modules, not taken from the builder)
1. **Is the condition evaluated with `user = null` on create-first-user?** Yes. `@payloadcms/next/dist/views/CreateFirstUser/index.js` calls `buildFormState({ req, ... renderAllFields: true })`. `@payloadcms/ui/dist/forms/fieldSchemasToFormState/iterateFields.js:69` calls `field.admin.condition(fullData, data, { ..., user: req.user })`. Since no one is logged in, `req.user` is null → `false` → the field is hidden. The fix hits the right mechanism.
2. **Logged in (any role, including an admin viewing another staff member):** the condition only reads `user` (the viewer) and ignores the document's data, so any logged-in user gets `true` and the field shows as before. It does not depend on the document being viewed.
3. **Side effects on create/update via API:** `payload/dist/fields/hooks/beforeChange/promise.js:37-44` evaluates `passesCondition` with `req.user`. When it is false, it only sets `skipValidationFromHere = true`. It **does not strip or clear data** for the field. With a user logged in → true → validation runs as before. Only for requests with **no user** (unauthenticated `first-register`, or Local API without `user`) is the `avatar` validation (relationship existence + `filterOptions` image-only) skipped. See MINOR-1.
4. **Access:** `Media.ts`, `isStaff.ts` and Staff access are not in the diff. The test asserts `Media.access.create({ req: { user: null } }) === false`.

## Test meaningfulness
- At HEAD, `avatar` has no `admin` (the diff only adds it) → `findAvatarField().admin?.condition` is `undefined` → calling it throws a TypeError → the 2 condition tests FAIL before the fix. This matches the builder's claim of "2/4 fail before the fix".
- The 2 remaining tests are regression guards (relationTo/filterOptions, Media.create denies anonymous users).
- Limit: these are unit-level tests on the condition function. They do not test form-state integration. That is acceptable because the iterateFields evaluation mechanism was verified in source (point 1 above).

## Bug repro closure
The `Repro Verification` status is PASS at unit level, and the evidence is verifiable: I ran the test myself and confirmed the pre-fix state from the diff. Browser repro is not possible because staging/prod already have an admin; this is listed as residual. Payload's source confirms the server form-state path uses `req.user`, so the evidence is enough to show the root cause is fixed.

## Acceptance
- [x] Hidden on `/admin/create-first-user` (condition false when `user` is null/undefined, and the form-state path is confirmed).
- [x] Still shown as before for logged-in users (admin/sale → true).
- [x] Media/staff access not loosened (not in the diff, and there is a test).
- [x] There is a test for the display condition.

## Responsive Checklist Gate
N/A. The diff only adds visibility logic (`admin.condition`) to one field in the Payload admin. No route/component/CSS/layout changes. Layout, Typography, Media, Touch and Viewport are all N/A.

## Skill gates
- aislop: skip, `aislop` not installed (`which aislop` → not found).
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). Replaced by scoped ESLint: clean.
- ocr (open-code-review): skip, `ocr` not installed.
- AI-readable: OK. Clear names, a short comment explaining why (not what), no magic numbers, no extra indirection, test 37 lines. 0 indicators.
- ai-friendly-web: N/A (internal admin, not public).
- blitzstrike: N/A / skip. The change hides UI and does not loosen access. No allowed pentest environment.

## Findings
**CRITICAL:** none.

**MAJOR:** none.

**MINOR**
1. `src/collections/Staff.ts:170` — side effect of `admin.condition` in `beforeChange`: when `req.user` is null (unauthenticated `POST /api/staff/first-register`, or Local API/scripts without `user`), validation of `avatar` is skipped (existence check + `filterOptions` image-only). Real risk is very low: first-register only runs when there are 0 users, the Postgres FK still requires the media to exist, and I found no script/seed that sets `avatar` (Grep of `scripts/`, `src/seed` is empty). No fix is required. If you want it airtight, also add a server-side `validate` or `hooks.beforeChange` that rejects `avatar` when there is no `req.user`. Ignore if not needed.
2. `tasks/bug-first-user-avatar-upload/phase-1-task-01.md:55` — the Verification summary says `pnpm lint` has "7 `no-explicit-any` errors". The actual count is 8 errors (including `prefer-const` and `no-require-imports`) in `.import-tmp/*` and `.local-seed/*`. All are outside scope; only the description is wrong. Fix the numbers when closing out.
3. (Residual, outside scope) `pnpm lint` also scans `.local-seed/` even though it is gitignored. Suggest adding it to the ESLint ignores in a separate task so the lint gate goes back to green.

## Residual risk
- Not verified in a real browser on `/admin/create-first-user` (needs an empty DB). Covered by reading Payload's source (iterateFields uses `req.user`).
- The form being cleared after a short-password error is default Payload behavior and outside acceptance (already recorded in the task).
- Full `pnpm test` / `pnpm build` not re-run by the reviewer.

## Verdict
**PASS**: no CRITICAL/MAJOR findings, acceptance met, and the repro evidence is verifiable at unit level plus the Payload source.
