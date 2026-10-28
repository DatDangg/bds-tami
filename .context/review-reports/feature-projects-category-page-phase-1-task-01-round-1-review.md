Agent: reviewer

# Review — feature-projects-category-page · phase-1-task-01 · round 1 (BL-090)

- **Review level:** STRICT
- **Reason:** shared i18n `pathnames` (routing + counterpart + 404 rules), SEO surface (canonical / hreflang / noindex / sitemap index), 308 redirect on a public list route, and the shared `slugField` hook that every content collection uses.
- **Blast radius:** `/du-an` and `/en/projects` (tabs, filters, FAQ JSON-LD, metadata, 308); new route `/du-an/danh-muc/[category]` and `/en/projects/category/[category]`; `/du-an/[slug]` (shares the prefix); `/sitemap.xml` + new group `categories-projects`; `/api/locale-counterpart` (`LIST_FALLBACK`, `MISSING_PAGE_RULES` lookup through `resolve-counterpart.ts`); 404 suggestions; admin SeoPreview for project-scope categories; `revalidate-category` hook; slug generation for every collection (only `projects` has reserved values).

## Scope check (diff vs task)
- The task's files match the brief: the new route plus its test, `project-list-metadata.ts` (new), `ProjectListPage.tsx`, `project-list-data.ts`, `project-filters.ts`, `routing.ts`, messages vi/en, `sitemap-data.ts`, `counterpart-url.ts`, `resolve-missing-page.ts`, `admin/seo.ts`, `revalidate-category.ts`, `slug.ts`, and the tests for each.
- The task did not touch any of the forbidden dirty files (`Projects.ts`, `PropertyPosts.ts`, `Rentals.ts`, `ward-in-province.ts`, `importMap.js`, `.claude/**`, `tools/**`, `spec/**`, `docs/**`). Those files are dirty from BL-076..078, as the brief says. The reserved-slug logic lives only in `src/fields/slug.ts`.
- I grepped `cho-thue/danh-muc` across `src/`. Every infrastructure touch-point that rentals has now has a project equivalent: routing, sitemap, counterpart fallback, missing-page rule, admin `CATEGORY_PAGE_ROUTES`, revalidate. The only places that build rental category links (`rental-view.ts:90`, `home-view-listings.ts:54`) have no project counterpart that links to `/du-an?category=`. A grep for `du-an…?category` / `category=` in non-test `src` finds only comments.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm test <related files>` (route du-an, components/projects, fields/slug, hooks/categories, i18n, sitemap-data, counterpart-url, resolve-missing-page, admin/seo, SeoPreview, list-no-loading) | PASS: 22 files / 275 tests |
| `pnpm exec vitest run du-an/danh-muc src/fields/slug.test.ts --reporter=verbose` | PASS: 2 files / 21 tests. The new `page.test.tsx` and the 4 reserved-slug tests both run |
| `npx eslint` on all changed source and test files | PASS (0 errors, 0 warnings) |
| `pnpm lint` (whole repo) | not re-run. The builder reports a baseline FAIL caused only by `playwright-report/`, so I linted the changed files instead (above) |
| Full `pnpm test` | not re-run. The builder reports 4709 passed / 1 flake (`Header.test` timeout, passes when run alone) |

## Requirement trace (focus points)
- **308 keeps every raw parameter:** `queryWithoutCategory` (`project-list-data.ts:44-52`) walks every key, expands arrays (repeated keys), skips only `category`, and keeps `utm_*` and `page`. It only redirects when `loadCategoryContext` finds the slug through `findProjectCategoryBySlug` (scope project + locale + public). Unknown, empty or whitespace slugs, and VI slugs on EN, do not redirect (tested).
- **No loop:** the category page strips `?category=` (`withoutCategoryParam`) before `parseProjectFilters`, and the redirect only fires when `!categorySlug` (`project-list-data.ts:81`).
- **Tabs:** "Tất cả" goes to `/du-an` and keeps the other filters. A category tab goes to the category page, keeps the filters and sort, and drops `page`. `currentRootId` is the parent tab for a level-2 category (tested). `category` was removed from `HIDDEN_PARAMS` and from `current`.
- **Metadata:** title is `"<name> – <t('title')>"`, and the test confirms the "| TAMI" suffix appears exactly once. Canonical is the page itself, plus `?page=n` from page 2 on. hreflang is emitted only when `hasEnglish`, an EN slug exists, and the page is not noindexed. Any filter or sort gives noindex,follow plus the clean canonical. `seo.metaTitle` overrides the title. A missing category returns `{}`.
- **404:** unknown slug, VI slug on EN, and a page number past the last page all return 404 (tested).
- **FAQ JSON-LD:** `cleanPage = !categorySlug && …`, so it is only emitted on a clean `/du-an`.
- **Sitemap:** `categories-projects` is defined. `SITEMAP_SECTIONS` is derived from `COLLECTION_SECTIONS`, so the sitemap index lists the new group automatically (test updated).
- **Reserved slug:** reserved values only apply to the `projects` collection in the matching locale. They are added to `taken` only when they are among the candidates, so `findFreeSlug` still finishes after the first batch (`danh-muc` becomes `danh-muc-2`; if `-2` is taken it becomes `-3`). Other collections and the other locale are unaffected (tested).
- **Rentals / property posts / news:** their logic is unchanged. Only shared registries gained new entries.

## Responsive Checklist Gate (diff touches UI: hero, breadcrumb, empty state)
The UI change only composes existing components (`ListingHero`, `Breadcrumb`, `EmptyState` via the existing `backHref` prop, `ListingCategoryTabs`). It adds no CSS, classes or layout code, so I checked it by reading the code and comparing it with the builder's screenshots (`bl090-*-1440/390.png`).
| Item | Result | Evidence |
|---|---|---|
| Layout: no horizontal scroll, mobile-first, grid auto-fit, no fixed px container | OK | No new layout code. The builder's Playwright run at 1440 and 390 reports no horizontal scroll. The list grid and tabs are unchanged (already verified in BL-084/BL-086) |
| Typography/Spacing rem/clamp | OK | No new typography. The H1 uses `ListingHero` as before |
| Media max-width/aspect-ratio/srcset | OK | The hero image is the same as on `/du-an` |
| Touch target ≥ 44px; mobile nav; table wrapper | OK / N/A | The breadcrumb, tabs and empty-state button are existing components. No table |
| Viewport/A11y: dvh, reduced motion, no overflow:hidden cover-up | OK | No new CSS. There is still exactly 1 H1 (tested) and the breadcrumb sets `aria-current` |
Residual: there is no 768 screenshot for this task. Because no layout code changed, I accept this risk.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured. `eslint` on the changed files is clean.
- ocr (open-code-review): skip, `ocr` not installed.
- AI-readable: OK, with 1 indicator. `ProjectListPage` is about 66 lines; it was already over 50 before this change. Names are clear, comments explain why, there are no magic numbers, and there is at most 2 levels of indirection. Under the limit of 3 indicators.
- ai-friendly-web: OK. The site already has `/sitemap.xml`, and the new group is added to the index. This change does not affect robots.txt or llms.txt.
- blitzstrike: N/A. No auth or user input beyond the existing query string, and no permitted environment.

## Findings
No CRITICAL. No MAJOR.

- **[MINOR-1] The 308 test does not cover repeated keys.** `ProjectListPage.test.tsx`, test "link cũ /du-an?category=…→ 308". The `redirectTarget` helper accepts `string[]`, but no test case passes an array. The brief's focus explicitly asks for repeated keys to be preserved. The code handles them (`project-list-data.ts:47-48`), but nothing locks that in. Fix: add a case such as `{ category: "khu-do-thi", type: ["a", "b"] }` and expect `…?type=a&type=b`.
- **[MINOR-2] A legacy 308 runs 6 unneeded queries before redirecting.** `project-list-data.ts:64-81`. `loadCategoryContext` runs in the same `Promise.all` as provinces, developers, roots, hero, strengths and listing content, and the redirect only happens after all of them finish. Every old `/du-an?category=` link (CMS menus, bookmarks) therefore pays for the whole list-page load. Fix: when `!categorySlug && filters.categorySlug`, resolve the context first and call `permanentRedirect` before the other queries.
- **[MINOR-3] Parent breadcrumb link can be empty.** `ProjectListPage.tsx:133` uses `projectCategoryPath(locale, context.parent.slug ?? "")`. If a visible parent has no slug in this locale, the link becomes `/du-an/danh-muc/`, which is broken. This is hard to hit in practice because `visibleCategory` filters by locale. Fix: only add the parent crumb when `parent.slug` exists.
- **[MINOR-4] Residual risk (no fix required in this task): reserved slugs only apply when a slug is written.** An existing project that already has slug `danh-muc` (vi) or `category` (en) keeps it. If an edit re-sends that slug, the hook will quietly rename it to `-2`. Dev data has no such project. Change-request should check staging and production data before deploy.

## Doc impact (for change-request at close-out)
`docs/API_SPEC.md` §3.9 (`category` → 308 / new route), `docs/DESIGN.md` row "Danh sách dự án", and `.context/decisions.md` (Projects issues a 308 even when other parameters are present, unlike BL-055). This matches the plan in the spec-validation report.

## Verdict
**PASS.** STRICT review, round 1. No CRITICAL or MAJOR findings. The MINOR items can be fixed now or tracked as follow-ups.
