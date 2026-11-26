Agent: reviewer

# Review: bug-job-posting-duplicate-slug-date, phase-1-task-01, round 2 (BL-128)

- Review level: STRICT
- Reason: the shared fields `slugField`, `publishedAtField` and `statusField` are used by every content collection through `withContentDefaults`. The change affects public URLs (slug) and publish state, which puts it in the shared-component and public-URL risk categories.
- Blast radius: news (including BL-091 scheduled publish), projects (reserved `danh-muc`/`category`), rentals (public `published` + `rented`), property-posts, job-postings, services, developers, and categories (through `scopeField`). Also the `create-slug-redirect` and revalidate afterChange hooks, admin "Tạo bản sao", and REST/Local API partial updates that do not send `slug`.
- Diff scope: `src/fields/slug.ts`, `src/fields/slug.test.ts` (attempt 2), plus the attempt 1 files `src/fields/status.ts`, `src/fields/published-at.ts`, `src/fields/published-at.test.ts`, and the new `src/fields/status.test.ts`. I ignored the other dirty files.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/fields src/hooks src/collections` | PASS: 43 files / 376 tests (372 in round 1) |
| `pnpm typecheck` (`tsc --noEmit`) | PASS (no errors) |
| `pnpm exec eslint` on the 6 changed files | PASS (no output) |
| Payload/DB integration | skip (no DB/Docker, per brief) |

## Round-1 findings: closure
1. **[MAJOR] prefix heuristic: RESOLVED.** `isAutoDerivedSlug` (`src/fields/slug.ts:54-60`) now accepts only two shapes: `slug === slugify(oldTitle)`, or a trailing `-N` with N ≥ 2 where `slug === suffixedSlug(autoBase, N)`. `startsWith` is gone. I checked it against `src/lib/slug.ts:36-40`:
   - `suffixedSlug` cuts the base to `80 - len("-N")` and then strips trailing hyphens, which is the same function `findFreeSlug`/`appendUniqueSuffix` use. So truncated auto slugs match exactly.
   - A suffix with a leading zero (`-02`) does not match, because `suffixedSlug` writes `-2`. That is correct.
   - When the title itself ends in a number (`tuyen-dung-2026`), the exact `autoBase` equality catches it first.
   - New tests cover a user-shortened prefix being kept (`truong-nhom`) and a slug longer than 80 characters with `-3` being regenerated. The second test also asserts `!startsWith(autoBase)`, which proves the truncation path is exercised.
2. **[MAJOR] `rented` public URL: RESOLVED.** `slug.ts:51,71` only regenerates when `status ∈ {draft, hidden}` and `publishedAt` is empty, so `published`, `rented`, and any unknown status keep their slug. New tests cover `rented` (slug kept) and `hidden` (slug regenerated).
3. **[MINOR] stale JSDoc: RESOLVED.** `slug.ts:84-90` names the exception and points to `shouldRegenerateFromNewTitle`, and the helper has its own doc comment.
4. **[MINOR] API behavior not documented: DEFERRED to close-out.** The task file `Doc / Decision Impact` (:62-63) records the ERD:157 and SPECIFICATIONS as-built PATCH update through spec-publisher. This is acceptable because close-out has to do it before the commit.

## Regression re-check (whole change)
- **Duplicate semantics (Payload source, same as round 1):**
  - `beforeDuplicate` runs on the whole doc. `status` and `publishedAt` are not localized, so their return values (`"draft"` / `null`) overwrite the copied values.
  - `slug` is localized, and its `undefined` return drops it in every locale.
  - On create, `originalDoc` has no slug, so `shouldRegenerateFromNewTitle` returns false (`!originalDoc || typed !== originalDoc.slug`). The copy's slug is generated from the title plus a suffix, as before.
- **Normal create / normal update:** create is unchanged. An update on a published doc, a doc with `publishedAt`, or a `rented` doc is unchanged. A typed slug that differs from the stored one is unchanged, because `typed !== originalDoc.slug` makes the helper return false.
- **Per-locale:** the beforeValidate `originalDoc`/`siblingData` values belong to `req.locale`, and `locale: all` is still rejected before the helper runs. EN slugs follow the same rule per locale.
- **Scope categories / reserved slugs / uniqueness:** a regenerated `base` still goes through the `scopeField` guard, then `findFreeSlug` (excluding its own id, `trash: true`), then `RESERVED_SLUGS`. A test confirms `-2` is added when the new slug is taken. OK.
- **Slug redirect / revalidate:** both only act when the doc is public before or after the save. A slug change on a draft/hidden doc creates no junk redirect and no revalidate. OK.
- **News scheduled publish:** a copy gets `publishedAt = null` from both field variants (tested), so it inherits no schedule. `stampScheduledPublish` is unchanged. A scheduled draft whose `publishedAt` is set (future) keeps its slug because `publishedAt` is truthy. That is acceptable: the URL is reserved for the scheduled publish.
- **Job-postings cron close:** closing sets a non-public status on docs that already have `publishedAt`, so their slug is kept.
- **Code quality:** `slug.ts` is 168 lines. `shouldRegenerateFromNewTitle` and `isAutoDerivedSlug` are each under 10 lines with clear names, and there is no magic number (the 80 limit lives in `SLUG_MAX_LENGTH` via `suffixedSlug`). The diff is surgical: every line traces to BL-128.

## Findings
### [MINOR] 1. A rental that went `rented → hidden` without ever being `published` counts as "never public"
- `src/fields/slug.ts:71`: `stampFirstPublish` only stamps `publishedAt` on `published`, so a rental saved straight to `rented` and later set to `hidden` has `publishedAt = null` and `status = hidden`.
- If its title changes while it is hidden, the slug is regenerated. No redirect is created (hidden → hidden is not public on either side), so the old URL from the `rented` period is lost when it goes back to `rented`.
- This path is rare (it needs a direct-to-rented save, then hide, then a title edit) and does not block the task. Optional hardening: also treat `rentedAt` as "was public", or stamp `publishedAt` for every public status in a separate task.
### [MINOR] 2. Round-1 finding 4 (as-built doc for the PATCH-title behavior) is still open
- The close-out has to update ERD §1.1 and SPECIFICATIONS as-built through spec-publisher before the commit (already planned in the task file).

No CRITICAL or MAJOR findings.

## Responsive Checklist Gate
N/A. The diff does not touch UI (no route/component/CSS); it only changes Payload field configs and hooks.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, not in the brief's verify set |
| oxlint (anti-slop) | skip, oxlint not configured; eslint PASS on the changed files |
| ocr (open-code-review) | skip, ocr not installed / not invoked |
| AI-readable | OK: 0 indicators (names are clear, functions are small, comments explain WHY) |
| ai-friendly-web | N/A (internal field logic) |
| blitzstrike | N/A (not an auth/input-security surface) |

## Bug repro closure
The task's Repro Verification is `Status: PASS (unit; integration DB skip)`. The unit tests cover the exact repro: slug `truong-nhom-kinh-doanh-da-dong-3` with a new title becomes `chuyen-vien-tu-van`, and `publishedAt` and `status` are reset on duplicate. Combined with the Payload duplicate-flow trace, the evidence is verifiable and closes the bug at unit level.

## Residual risk
- The real admin duplicate flow against a DB has not run (no Docker). It was inferred from Payload source.
- A user slug that happens to match exactly the auto-generated form (for example `<old-title-slug>-2`) on a never-public draft is regenerated when the title changes. This is accepted and recorded in the task.
- MINOR 1 above (rentals that were `rented`, then hidden, without `publishedAt`).

## Verdict
PASS. Both round-1 MAJOR findings and MINOR 3 are resolved, verify is green, and there are no regressions in the shared field behavior. MINOR 2 has to be handled at close-out (doc reconcile).
