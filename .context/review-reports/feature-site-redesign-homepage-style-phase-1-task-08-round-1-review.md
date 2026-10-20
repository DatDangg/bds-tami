Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-08 (close-out) · round 1

- **Review level:** STRICT
- **Reason:** The task file expected NORMAL, but the diff has red-risk items: new seed scripts that write to the DB (they overwrite the `site-settings` global, publish pages/services, and change `rentals.videoUrl`); a change to the shared query `project-queries.ts`; i18n keys removed from both message catalogs; the `ProjectCardData` DTO is narrower (`priceFrom` removed); and a script downloads files from an external site.
- **Blast radius:**
  - `/du-an` developer filter (`listDevelopersWithPublicProjects`) and scan log (`scanPublicProjects`).
  - `ProjectCardData` consumers: project cards on home, `/du-an` and the "similar projects" block.
  - `ProjectSpecs` (project detail page).
  - `ConsultBanner`: shown at the bottom of every sub-page.
  - `Pagination`: shared across all lists.
  - `AmenityMultiSelect` / `RentalFilters`.
  - `use-environment` moved to `components/layout`. Importers: HeroSlider, MobileMenu, FooterLinkColumn, use-snap-slider, RentalFilters.
  - `vi.json` / `en.json`.
  - `.crumb-glass` breadcrumb utility.
  - **Data:** any DB where `pnpm seed:page-heroes` or `pnpm seed:galleries` is run. `docker/Dockerfile:71` copies `./scripts` into the runtime image, so both scripts can run inside a staging or prod container.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 errors; 2 warnings in `tools/task-dashboard/server.mjs`, pre-existing and outside this diff) |
| `pnpm vitest run src` | PASS: 253 files / 2494 tests |
| `pnpm vitest run tests/integration/projects.test.ts` | PASS: 31/31 (real DB) |
| `pnpm build` | skip. A dev server is running on the main checkout and building would overwrite its `.next`. The builder reported PASS; not independently re-verified (residual risk). |
| `git status --short --ignored seed` | `seed/scraped/`, `seed/scraped-cache/`, `seed/scraped-extra/` are all `!!` (ignored). No image is tracked or untracked-unignored. |

## Responsive Checklist Gate (diff touches UI: Pagination, ConsultBanner, ProjectSpecs, AmenityMultiSelect, globals.css)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375/390, 768, 1280/1440 | OK (768 not checked) | 390 screenshots (detail-rent-390 and others) show no overflow; the builder reports `scrollWidth` OK at 1440/390. Nothing in this diff adds a fixed width. |
| Mobile-first / grid | OK | No new grid. `ProjectSpecs` keeps 2 columns below md and 4 at md and up; it now has fewer items. |
| Font-size rem / fluid heading | N/A | No typography change in this diff. |
| Media | N/A | No new image component. |
| Touch target ≥ 44px | OK | Pagination cell (`CELL`) is unchanged; only an `aria-label` became an sr-only text. AmenityMultiSelect stays `h-11` on mobile. |
| Mobile nav | N/A | MobileMenu only changes an import path. |
| Table on mobile | N/A | |
| 100vh / reduced-motion / overflow hidden | N/A | No change. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop | skip | Not in the allowed verify command list. |
| oxlint (anti-slop) | skip | oxlint not configured; eslint passes. |
| ocr | skip | ocr not installed. |
| AI-readable | OK (2 indicators, below the threshold of 3) | (1) The comment on `publishLegalPages` says something the code does not do (see MAJOR-1). (2) Bare magic numbers in the fetch script, minor. |
| ai-friendly-web | N/A | No change to robots/sitemap/llms. |
| blitzstrike | skip | Not installed. |

## Mockup comparison (images `.context/review-reports/assets/site-redesign-t08-*.png`)

Views checked: list-project-1440, detail-project-1440, detail-rent-1440, detail-rent-390, contact-1440. In every one, the section order and the positions of hero, breadcrumb, filter card, results row, grid, pagination, strengths strip, consult banner and footer match the mockup. Recorded differences that have a written reason:
- "Similar projects" shows a 3-card grid instead of a slider.
- Project map, floor plan and amenities are empty in dev data.
- Contact has no address, hotline or email in dev data.

Differences without a written reason are listed under MINOR-3. Views not opened (each opened image costs part of the tool budget): article, careers, career-detail, category-rent, legal, news, posts, post-detail, services, list-rent. These are a residual risk.

## Findings

### [MAJOR-1] Seed scripts only block `APP_ENV=production`, but the task scope is "dev DB only, never staging/prod", and the scripts overwrite admin content

`scripts/seed-page-heroes.ts:11` and `scripts/seed-galleries.ts:14` use the check `if (process.env.APP_ENV === "production")`, so the scripts run against staging, and against prod too if the environment does not set `APP_ENV`. Both scripts are copied into the runtime image (`docker/Dockerfile:71`).

What the scripts overwrite:
- **`site-settings` global:**
  - `pageHeroes` (vi and en): admin text is replaced with sample text.
  - `careersPerks`: the whole array is replaced.
  - `pageBanners.contact` and `pageBanners.legal`.
  - `showProjectStrengths`.
- **`publishLegalPages` (`seed-page-heroes.ts:113-120`):** publishes **every** page that is not yet published (no placeholder check). The JSDoc says "chỉ đổi khi vẫn là chữ giữ chỗ" (only changes pages still holding placeholder text); the code does not do that.
- **`publishSampleServices` (`:123-131`):** publishes every draft service.
- **`seed-galleries`:**
  - Appends images to the galleries of real projects and property posts.
  - Sets `isFeatured` on a property post.
  - Writes a Big Buck Bunny `videoUrl` into 3 published rentals.

The repo already has a dev-only guard for this case: `checkSeedEnvironment` in `src/lib/rentals/sample-amenities.ts:40`, used by `scripts/seed-rental-amenities.ts:9`. It refuses when `NODE_ENV=production`, when `DATABASE_URL` is missing, or when `DATABASE_URL` equals `DATABASE_URL_STAGING` or `DATABASE_URL_PROD`.

**Fix:**
1. Replace both guards with `checkSeedEnvironment(process.env)`. Optionally move the helper to a shared spot such as `src/lib/seed/`; it is acceptable to keep the current location to keep the diff small.
2. Limit `publishLegalPages` to the 2 seeded legal pages (by slug, or while the content is still the seed placeholder), or fix the comment to match the behaviour. Do the same for services: only the samples from `seed:sample-services`.

### [MINOR-1] `scripts/fetch-scraped-extra.mjs`

1. `MAX_BYTES` caps only the **output** after the webp conversion. The input body is read in full (`res.arrayBuffer()`, line 53) with no `content-length` cap and no timeout. Add an `AbortSignal.timeout(...)` and check `content-length` (or the buffer size) before handing the data to sharp.
2. `decodeURI` on line 49 throws an uncaught error on a malformed `%` sequence. Wrap it in try/continue.
3. `fetch` follows redirects to any host by default. Use `redirect: "error"`, or check that `res.url` keeps the same origin.

Already OK: magic bytes are checked, nothing downloaded is executed, the origin is hard-coded, and sharp's default `limitInputPixels` applies.

### [MINOR-2] Seed depends on untracked files

`seed-page-heroes.ts:18` reads `docs/specs/site-redesign-mockup/assets/img1..5.webp`. That folder is currently untracked ("plan, not committed"). If it is not committed with T08, `pnpm seed:page-heroes` fails on a fresh checkout. Either commit the assets, or fall back to existing media.

### [MINOR-3] Detail views: visible differences without a written reason

- **"Thông tin chi tiết" (rental detail, 1440 and 390):** the mockup lays out rows with the label on the left and the value on the right. The real page stacks the label above the value.
- **Amenities at 390:** the mockup shows 2 columns; the real page shows a single column of large chips.
- **Facts strip:** the real page drops the "Hướng" item. This may be dev data.

The section order is unchanged, so this is not counted as FAIL. Add a line to the task's "Lệch so với mockup" list, or align the row layout with the mockup in a follow-up.

### [MINOR-4] `docs/DESIGN.md`: current-state rows contradict as-built

The new "Hero trang con" and "Breadcrumb" rows were added, but older rows still describe the pre-BL-045 layout:
- **"Danh sách dự án" (`:96`):** "Banner gọn 240px… không từ khoá, không Bộ lọc… Có N kết quả".
- **"List Search Bar" (`:101`):** "Dự án (… không ô từ khoá…)".
- **"Chi tiết dự án" (`:97`):** "Hero ảnh full màn hình… Thư viện… CTA tối Đăng ký tham quan".
- **"Cho thuê" (`:98`):** same issue.

Mark each of these as "(trước BL-045)" or update it. Unlike `design-spec.md` §4, `DESIGN.md` has no "as-built takes precedence" note.

### [MINOR-5] Whitespace-only edits

In `docs/API_SPEC.md`, the `BR-08` row (`:208`) and the lead-assign paragraph (`:219`) are whitespace or trailing-character edits that do not belong to this task. Revert them to keep the diff surgical.

### [MINOR-6] ConsultBanner behaviour change

`ConsultBanner.tsx:31` now reads `description: view.title ? view.description : t("description")`. When the admin has a title but no description, the banner now has no description at all; before, it fell back to the default text. This matches the "pair" intent in the comment, but no test locks it. Add one unit test for the pair case.

### [MINOR-7] ESLint ignore

`eslint.config.mjs` adds `seed/scraped/`. That folder is gitignored and outside T08's scope (T08 adds `seed/scraped-extra/`, which holds no JS). The change is harmless; note that it was added only so lint passes locally.

## Checks that passed

- **Removed i18n keys are no longer used.** Checked with grep against each namespace:
  - `page.detail.relatedTitle` and `page.detail.priceFrom` are still present and still used.
  - `page.listing.resultCount`, `page.careers.apply` and `page.careers.resultCount` were not removed.
  - The messages-check test passes.
- **`project-queries`:** the developer limit is `ids.size`. It is guarded by `if (ids.size === 0) return []` and bounded by `SCAN_MAX_PAGES*SCAN_PAGE_SIZE`. The cap warning fires only when the cap is really reached (it comes after the `hasNextPage` check). The integration test passes.
- **`visibleRentalSections`:** `amenities` is now a required type; typecheck passes.
- **Pagination:** the disabled button uses sr-only text instead of `aria-label` on a `span` (better for a11y). AmenityMultiSelect lost an `aria-label` that overrode the visible text, so its accessible name now includes the selected count.
- **The 8 earlier MINORs (T00–T06)** reported as handled in the task file look correct in the diff; nothing broke.
- **`.crumb-glass`** uses the token `--color-banner-scrim`. The AA measurement is recorded in the doc.
- **Intent docs are not downgraded.** `SPECIFICATIONS.md` and the BRD/PRD are not part of the T08 diff; `design-spec.md` adds "As-built" notes and keeps the old rules as history.
- **Ignored seed folders:** `.gitignore` covers `seed/scraped-extra/`; no image is tracked.

## Residual risk

- `pnpm build` was not re-run. The builder reported PASS.
- 10 of 15 comparison views were not opened (tool budget).
- 768 px was not checked.
- There is no `.dockerignore` excluding `seed/`, and `docker/Dockerfile:74` copies `seed/`. If the image is built locally on a machine that has `seed/scraped-extra/`, the scraped images end up baked into the image. CI builds from a clean checkout, so the risk is low.

## Verdict: FAIL

1 MAJOR (MAJOR-1: seed guard does not match the dev-only scope and the scripts overwrite admin content). The builder must fix MAJOR-1. MINOR-1 and MINOR-2 should be fixed in the same round because they touch the same seed and fetch scripts. MINOR-3 to MINOR-7 can be fixed now or recorded as follow-ups.
