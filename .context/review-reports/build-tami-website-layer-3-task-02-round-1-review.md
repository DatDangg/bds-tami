Agent: reviewer

# Review: build/tami-website, layer-3-task-02, round 1

- Task: `tasks/tami-website/layer-3-task-02.md`
- Diff: working tree compared with HEAD `383d39f` (tracked diff + untracked files). `src/payload-types.ts` differs only by CRLF and is out of scope.

## Review level
**STRICT**

## Reason
This task adds shared fields and hooks that every content collection will use. It covers field-level RBAC (`author`, `isFeatured`, `publishedAt`, `hasEnglish`), record-level RBAC (A1), soft delete, restore and purge with audit, slug uniqueness per locale, and cache revalidation. Any one of these is a red-risk item.

## Blast radius
- `src/collections/_shared/content-defaults.ts` (`withContentDefaults`) will be used by projects, rentals, property-posts, news, job-postings, services, pages and categories (layers 4–8, 12 tasks unblocked).
- `src/fields/*` (7 fields), `src/hooks/{revalidate-content,audit-content-delete,require-english-fields,guard-trashed-edit}.ts`
- `src/lib/content/content-paths.ts` (revalidation path map), `src/lib/payload/preserve-request-locale.ts`, `src/lib/slug.ts` (`appendUniqueSuffix`)
- Data: the `audit-logs` collection gets `content.delete/restore/purge`. No production schema change (the test collection lives only in `tests/fixtures`).
- Docs: `docs/ERD.md` §4.14 (as-built)

## Verify commands + result (re-run by the reviewer, commands from `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK (exit 0) |
| `pnpm lint` | OK (exit 0, eslint) |
| `pnpm typecheck` | OK (exit 0, tsc --noEmit) |
| `pnpm test` | OK: 62 files / 601 tests PASS (exit 0, including `tests/integration/content-defaults.test.ts` against real Postgres) |
| `pnpm build` | OK (exit 0). The route table shows `●/vi` and `●/en` being SSG under the `[locale]` segment. This is evidence for finding M1. |

## Responsive Checklist Gate
N/A: the diff has no UI changes (no route, component or CSS). The project has UI, but this task only touches backend fields and hooks.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: `aislop` is not in the reviewer's allowed command list (Bash is limited to verify commands + git) |
| oxlint (anti-slop) | skip: oxlint is not configured (no `.oxlintrc*`). ESLint is the configured linter and it passes. |
| ocr (open-code-review) | skip: ocr is not installed / not in the allowed commands |
| AI-readable | OK: 1 indicator (small duplication of `denyAll` / `ContentDoc`). No function is over 50 lines, names are clear, indirection is at most 2 levels, comments explain WHY. Below the threshold of 3. |
| ai-friendly-web | N/A: not public-facing |
| blitzstrike | skip: not installed, and there is no environment where pentesting is allowed |

## Assessment of the builder's design deviations
| Deviation | Assessment |
|---|---|
| Did not use `@payloadcms/plugin-seo`; defined its own `seo` group (`src/fields/seo.ts`) | **Acceptable.** ERD §4.14 lists `metaTitle/metaDescription/ogImage/noindex/canonical`. The plugin only provides the `meta` group (title/description/image) and has neither `noindex` nor `canonical`. The ERD is an as-built doc, and §4.14 was reconciled with a reason. No intent doc was changed. |
| Only `revalidatePath`, no `revalidateTag` | **Acceptable** as a mechanism choice: ARCHITECTURE §5.1 line 153 allows "revalidateTag / revalidatePath", and line 154 says explicitly "revalidatePath cho cả hai đường dẫn VI và EN". **But the paths passed in are wrong. See M1.** |
| Revalidating by public URL (`/du-an/x`, `/en/projects/x`), not checked against next-intl's internal route | **Defect (MAJOR M1).** |
| `publishedAt` access denies admins too | **Acceptable.** The AC says "không cho sửa tay (mở ở task hẹn giờ)" and does not exempt admins. The system writes the value through the `beforeChange` hook. A test covers this (`content-defaults.test.ts:244`). |
| Added `guard-trashed-edit` (not in the file list) | **Acceptable and necessary.** Without it, a sale could restore their own record through `update` (`isAuthorOrAdmin`), which violates PERMISSION §3.1 line 48 ("chỉ admin khôi phục"). Test at `:320`. |

## RBAC / audit / slug / fixture: checked results
- Sales can update/delete only their own records: `update: isAuthorOrAdmin`, soft delete = `isAuthorOrAdmin`, purge = `isAdmin` (`content-defaults.ts:39-42,63-64`). Tests `:292`, `:302` cover other people's records, purge by a sale, and trash + purge by a sale. OK.
- Sales cannot restore or edit trashed records: `guard-trashed-edit.ts:11-15` + test `:320`. OK.
- `author`: create/update access `isAdmin`; when the value is stripped, `beforeChange` assigns `req.user.id`. A value sent by a sale is ignored. Test `:264`, `:274`. OK.
- `isFeatured`: admin only, tested in both directions (`:279`). OK.
- `hasEnglish` + `translation.*`: deny-all; the guard hook blocks enabling it when EN is missing (`:380`, `:396`, `:409`). OK.
- Audit runs in the same transaction: `audit-content-delete.ts` calls `writeAuditLog` with the main operation's `req` (`src/lib/audit/write-audit-log.ts:38-50`, Local API with `req`). It does not swallow errors, so a failed audit throws and the whole operation rolls back. OK. There is no test that injects an audit failure to prove the rollback (see m6).
- Slug unique per locale: `unique: true` on a localized field, and test `:191` shows the same slug is allowed in a different locale, so the index is per `_locale`. OK.
- The fixture does not leak into production: Grep for `test-content|fixtures` in `src/` returns nothing. `push: true` exists only in `tests/fixtures/test-content/payload-config.ts:23`. Test `:163` asserts this. OK.
- No duplicated logic: the public condition reuses `makePublishedOnly`/`buildPublicWhere` (`src/access/publishedOnly.ts`), and slugify reuses `src/lib/slug.ts`. OK (except the small duplication in m4).

## Findings

### [CRITICAL]
None.

### [MAJOR]
**M1. Revalidation calls `revalidatePath` with public URLs, not with Next's internal route, so on-demand revalidation is effectively a no-op for VI, EN and the home page.**
- `src/lib/content/content-paths.ts:28-33` (`localizedPath`) builds paths like the browser sees them: VI without a prefix (`/du-an/x`, `/`), EN with the translated pathname (`/en/projects/x`).
- The app is rendered under the `[locale]` segment. `pnpm build` shows the route as `●/vi` and `●/en`, so the Next cache entries are keyed by the internal path (`/vi/...`, `/en/du-an/...`). The `proxy.ts` rewrite (`localePrefix: "as-needed"` + `pathnames`) only maps the public URL onto that internal path. `revalidatePath("/du-an/x")`, `revalidatePath("/")` and `revalidatePath("/en/projects/x")` do not match any cache entry. Specific example: the VI home page `/` is never matched by the SSG entry `/vi`.
- `revalidateWithNext` (`src/hooks/revalidate-content.ts:13-20`) does not throw on a wrong path, so the mistake stays silent. The integration tests (`content-defaults.test.ts:420-445`) inject a recorder and assert public URLs. They assert the wrong contract, which gives false confidence. The builder also admits "chưa kiểm với route nội bộ next-intl".
- This breaks AC6 ("Hook revalidate gọi cho cả đường dẫn VI và EN (theo `pathnames`)") and ARCHITECTURE §5.1 line 153 (on-demand re-render). Only `s-maxage=60` at the CDN is left, while the Next ISR/full-route cache of the SSG pages stays stale.
- **Suggested fix:** generate the *internal* path in the form `/${locale}${pathnames key}` (the key is the internal path, e.g. `/vi/du-an/x`, `/en/du-an/x`, list `/vi/du-an`, home `/vi`, `/en`). Alternatively, use `revalidatePath("/[locale]/du-an/[slug]", "page")` for the detail route. Update the unit test `content-paths.test.ts` and the integration assertions to the internal path, and add a comment that cites the `[locale]` segment and the rewrite in `proxy.ts`. If you keep public URLs to purge the CDN, separate that into its own function. Do not reuse it for `revalidatePath`.

### [MINOR]
- **m1.** `src/fields/slug.ts:32`: the query uses `slug: { like: base }`. On Postgres, Payload's `like` is `ILIKE %word%`, so a short slug (e.g. `can-ho`) loads every slug that contains it, with `pagination: false`. Also, when `base` is at `SLUG_MAX_LENGTH`, `appendUniqueSuffix` truncates the head (`src/lib/slug.ts:46-48`), so the candidate may not be in the `like base` result set. A collision is then missed and the DB unique index throws. Suggested fix: query with `or: [{slug: {equals: base}}, {slug: {like: head + "-"}}]` using the truncated head, or retry on a unique-violation error.
- **m2.** `src/fields/slug.ts:28-46`: when `req.locale === "all"`, `find` returns `slug` as an object, so `takenSlugs` contains only `""` and the suffix logic never runs. The admin UI does not write with `all`, so the impact is low. Throw early, or skip the hook when the locale is `all`.
- **m3.** `src/collections/_shared/content-defaults.ts:77-86`: shared fields are appended after `collection.fields`, so a collection cannot override field-level access. PERMISSION §4 line 91 (`pages.hasEnglish`: admin enables it) will need an option such as `fieldOverrides`/`hasEnglishAccess`. Same for the default `create: isStaff` access: `services`/`pages` (PERMISSION §3.1 lines 44-45: sales get "—") must override it in their own task. Add a JSDoc reminder, or add an `adminOnly` option.
- **m4.** Small duplication: `denyAll` in `src/fields/published-at.ts:3` and `src/fields/translation.ts:3`, and the `ContentDoc` interface in both hooks. Could go into `src/access` (e.g. `denyAll`).
- **m5.** `tests/integration/content-defaults.test.ts` is about 460 lines, over the 300-line file guideline. Acceptable for a test file, but it could be split by `describe` block.
- **m6.** There is no test that proves an audit failure rolls back the soft delete/purge (fail-closed). The logic is correct on reading, but STRICT expects evidence.
- **m7.** The builder's known residual items are acceptable for this task and should be tracked: per-scope unique slugs for `categories`, an empty Lexical document counting as filled (`require-english-fields.ts:10-11`, a root with an empty paragraph node passes), and `CONTENT_ROUTES` missing `pages`/`categories` (the factory throws early when the route is missing, so this cannot fail silently).

## Residual risk
- Not verified in a browser: whether the Payload admin UI shows the "move to trash" button for sales. `access.delete` is evaluated without `data` when computing permissions for the UI, so `deleteAccess` returns `isAdmin`, which is false for sales. This is a UX risk to check when the first content collection goes live (layer 4).
- Document locking: the test only asserts the config does not turn it off (`:155`). Two-user behaviour was not tested in the UI.
- M1 was confirmed by reading the code plus the build route table. The actual Next cache was not observed at runtime (the reviewer does not run the app).

## Verdict
**FAIL**: 1 MAJOR (M1, revalidation path is wrong, AC6 not met, and the tests assert the wrong contract). Return it to the builder to fix M1. Fixing the MINOR items in the same round is optional (m1 and m6 are recommended).
