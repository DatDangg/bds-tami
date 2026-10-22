Agent: reviewer

# Review — BL-054 feature-news-careers-contact-redesign phase-1-task-01 (Schema + migration), round 1

- Worktree: `.worktrees/feature-news-careers-contact-redesign__phase-1__task-01` (changes not committed yet), base staging 1272255
- Review level: **STRICT**
- Reason: DB schema + migration, PII collection (`newsletter-subscribers`), access/RBAC on 2 new collections, a global (`site-settings`) that the public reads (`read: () => true`), and shared admin registries (`admin-collections`, `admin-groups`, `TRANSLATABLE_FIELDS`).
- Blast radius: DB (6 new tables, 3 new enums, 6 nullable columns on `job_postings`, `_job_postings_v`, `site_settings_locales` and `payload_locked_documents_rels`); public REST/Local API of `site-settings` (new fields `offices`, `workingHours`, `careersProcess`); admin menu and list for all collections (`ADMIN_COLLECTIONS` 21 -> 23); the AI translation pipeline for site-settings; `src/payload-types.ts`; `docs/ERD.md` and `docs/PERMISSION.md`. Every integration suite that runs on a DB without this migration (for example the dev DB `tami`) will fail on `payload_locked_documents_rels.newsletter_subscribers_id`.

## Verify commands + result (all run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` |
| `pnpm payload migrate:status` (DB `tami_wt54_p1t01`) | `20261022_022857_news_careers_contact_redesign` batch 38 Ran=Yes |
| `DATABASE_URL_TEST=<worktree DB> pnpm vitest run tests/integration/news-views-newsletter.test.ts tests/integration/globals.test.ts tests/integration/job-postings.test.ts tests/unit/admin-labels.test.ts tests/unit/translatable-fields.test.ts src/lib/admin src/components/admin src/collections` | **79 files / 642 tests PASS**, 0 skipped. The integration tests ran on a temporary DB with the real migration. The WARN "Dịch: không xếp được job dịch" lines are seed noise that already existed. |
| `pnpm build`, full `pnpm test` | Not re-run by the reviewer. Builder reported 388 files / 3918 tests PASS and build PASS. |
| DB `tami` | Not touched (no migrate). |

## Migration inspection: SAFE_ADDITIVE (not HIGH_RISK_MIGRATION)
`migrations/20261022_022857_news_careers_contact_redesign.ts` UP:
- CREATE TYPE ×3 (new enums only). CREATE TABLE ×6 (new tables only).
- ADD COLUMN on existing tables, all nullable: `job_postings.is_urgent` / `_job_postings_v.version_is_urgent` (boolean DEFAULT false), `site_settings_locales.working_hours_hours|_days`, `payload_locked_documents_rels.newsletter_subscribers_id|news_views_daily_id`.
- FKs and indexes (including UNIQUE `news_day_idx (news_id, day)` and UNIQUE `newsletter_subscribers_email_idx (email)`) only on new tables or new columns. There is no UNIQUE/FK on old data, no DROP, no type change, no SET NOT NULL and no backfill.
- Custom FK `news_views_daily.news_id ON DELETE cascade` (line 69), with a comment explaining why. It is correct: `news_id` is NOT NULL, so the generated `set null` would raise 23502 when a news item is hard-deleted. The test locks it (`confdeltype = 'c'` + cascade on delete).
- DOWN uses IF EXISTS throughout and removes only what this migration added. Data in the 6 new tables and 6 new columns is lost on down, which is expected.

## Requirements / access check
- `news-views-daily`: read `isAdmin`; create, update and delete `denyAll`; `disableDuplicate`; `admin.hidden` for non-admins; unique `(news, day)`; `views` min 0 default 0. Tests cover REST 403 for sale and guests, and POST/PATCH/DELETE 403 even for admin. OK.
- `newsletter-subscribers`: read, update and delete `isAdmin`; create `denyAll` (REST 403 for guest, sale and admin, all tested); hidden from sale; `normalizeEmail` runs in beforeValidate (trim + lowercase), so a duplicate that differs only in case returns 400 (tested). VI admin labels are present. OK.
- `site-settings` (public read): the new fields `offices` (name, address, image, location, phone, email), `workingHours` and `careersProcess` are public on purpose (they are contact data shown on the website). The newsletter and view counts are separate collections, so they are not exposed through site-settings. The existing internal fields (`adminOnlyRead` / `stripInternalFields`) are unchanged. OK.
- Localized fields are listed in `TRANSLATABLE_FIELDS["site-settings"]` (+offices, workingHours, careersProcess). `translatable-fields.test` PASS. OK.
- `payload-types.ts` matches: `NewsletterSubscriber`, `NewsViewsDaily`, `isUrgent`, `careersProcess`, `offices` and `workingHours` are all present, and typecheck PASS. OK.
- Docs: `docs/ERD.md` and `docs/PERMISSION.md` §3.3/§3.4 are updated and consistent with the code.

## Responsive Checklist Gate
N/A: the diff only touches schema, admin config and tests. It changes no public route, component or CSS (`importMap.js` content is unchanged).

## Skill gates
- aislop: skip, aislop not installed
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). ESLint (`pnpm lint`) shows 0 errors.
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK. Names are clear, files are small (≤ 70 lines), each collection has a WHY docblock, there are no magic numbers (maxRows 10/6 come from the spec), and ERD/PERMISSION are updated. 0 indicators.
- ai-friendly-web: N/A (no public-facing change)
- blitzstrike: skip. The task adds no new public endpoint (endpoints are in P1-T03/T04), and there is no environment where pentesting is allowed.

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR] `src/collections/NewsletterSubscribers.ts:45,54,65-67`: the consent evidence fields (`email`, `locale`, `consentAt`, `privacyPolicyVersion`, `sourcePath`) are only `admin.readOnly` in the UI. An admin can still PATCH them over REST and change the consent evidence. Builder recorded this as a trade-off (Quyết định 4) and PERMISSION.md says "form admin chỉ cho đổi status", so the docs are accurate. Proposed fix (optional, could go in P1-T04): add field-level `access: { update: denyAll }` to the consent fields, the same way `privacyPolicyVersion` in `SiteSettings.ts:197` is locked and the same way `job-applications` is locked.
- [MINOR] `migrations/20261022_022857_news_careers_contact_redesign.ts:69`: the DB FK is `cascade` while the `.json` snapshot keeps `set null`. If a later migration recreates this FK, Payload will generate `set null`. The test in `news-views-newsletter.test.ts:137-144` catches that. Consider adding a note to ERD §4.13 (already done) or to the migration conventions so future builders know.
- [MINOR] Residual merge risk: the dev DB `tami` (`DATABASE_URL_TEST` in the worktree `.env.local`) has not been migrated. After merging, primary must migrate the dev DB or point the test DB elsewhere, otherwise 4 integration suites that already exist will fail (Quyết định 9).

## Residual risk
- The reviewer did not re-run `pnpm build` or the full `pnpm test` (it relies on the builder report plus 642 tests in the related scope).
- Before promoting staging -> prod, verify on staging that `migrate` runs cleanly (the migration is additive, so risk is low).

## Verdict: PASS
