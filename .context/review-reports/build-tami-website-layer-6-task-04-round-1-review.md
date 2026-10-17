Agent: reviewer

# Review: build/tami-website, layer-6-task-04, round 1

**Task:** `tasks/tami-website/layer-6-task-04.md` (S02 Projects list + project category page + published sample data with images)
**Scope:** uncommitted diff vs HEAD `dfd1945`, excluding `.claude/launch.json`, `.context/progress.json` and `.context/runs/*`

## Review level: STRICT

**Reason:** the diff changes shared modules. These are `CategoryListTemplate` (also used by news S05/S10), `i18n/routing.ts` pathnames (public URL contract), `resolve-missing-page.ts` (runs in the proxy on every request), `revalidate-category.ts` (a shared hook) and the seed (writes data and uploads media to S3).

## Blast radius
- Public routes: `/du-an`, `/en/projects`, plus the new `/du-an/danh-muc/[category]` and `/en/projects/category/[category]`.
- `src/proxy.ts`, through the new rule at the top of `MISSING_PAGE_RULES`.
- The news category and list pages, through `CategoryListTemplate`.
- Category save/delete hooks, through `revalidate-category` (project scope now also revalidates category paths).
- `pnpm seed --sample` on dev/staging. It creates 3 project categories (with EN), 6 media uploads and 6 published projects, and upgrades legacy drafts.
- `formatVndCompact`, a new shared helper.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 132 files, 1,433 tests (DB integration ran: projects listing + seed) |
| `pnpm build` | PASS. `/[locale]/du-an` is listed as ● and `/[locale]/du-an/danh-muc/[category]` as ƒ, the same as `/[locale]/tin-tuc` and its category page (existing pattern; builder's curl evidence shows filters are read at runtime) |
| `pnpm install --frozen-lockfile` | not run (lockfile unchanged) |
| Browser / curl | not run by reviewer (outside allowed commands); builder evidence accepted where the code supports it |

## Responsive Checklist Gate (diff touches UI): checked by CSS math, no browser
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Grid `grid sm:grid-cols-2 lg:grid-cols-3`, so `minmax(0,1fr)` columns. Form `grid-cols-2` with `min-w-0` + `w-full` selects. Chips `flex-wrap`. At lg the toolbar is about 540–640px wide inside a container of about 960px, so chips wrap and nothing overflows. Builder measured 375/768/1280 with no h-scroll. |
| Mobile-first `min-width` queries | OK | Only `sm:`, `md:` and `lg:` prefixes are used. |
| Grid uses auto-fit/minmax | OK (justified) | design-spec S02 fixes the column counts at 1/2/3 (375/640/1024). Tailwind `grid-cols-N` = `repeat(N,minmax(0,1fr))`, so it cannot overflow. |
| Container not fixed px | OK | `max-w-container px-gutter` (token). Selects only get `lg:w-56`/`lg:w-48` at ≥1024. |
| Font-size rem / fluid headings | OK | Type tokens `text-small`, `text-h3`, `text-body`. The banner heading uses the existing PageBanner. |
| Media max-width / aspect-ratio / srcset | OK | `aspect-[4/5] md:aspect-[4/3]`. `ResponsiveImage` with `sizes="(min-width:1024px) 400px, (min-width:640px) 50vw, 100vw"`. First card has `priority`. |
| Touch target ≥ 44px | OK | Chips `min-h-11`, selects `h-12`, clear link `min-h-11`, card link `min-h-11`. Builder measured ≥ 44. |
| Nav on mobile | N/A | No new nav. Header is unchanged. |
| Table scroll wrapper | N/A | No tables. |
| No bare 100vh | OK | None used. |
| prefers-reduced-motion | OK | `motion-reduce:[&_img]:transition-none` and `scale-100`. |
| `overflow:hidden` not hiding a bug | OK | Only on the image frame, to crop the zoom. |

Design deviation (not a responsive FAIL): S02 at 375 asks for "chip cuộn ngang scroll-snap + fade". The template wraps the chips instead. See MINOR-3.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, `aislop` not installed |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint and tsc are clean. |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK, 2 indicators (< 3). `ProjectListPage` is about 80 lines (> 50). ARCHITECTURE as-built is not yet reconciled (MINOR-1, MINOR-6). Names are clear, constants are named, comments explain WHY. |
| ai-friendly-web | N/A for this task. Public pages, but robots/sitemap/llms are owned by layer-8 and the diff does not touch them. |
| blitzstrike | skip. The task is read-only public listing with no auth or input write. Filter inputs are whitelisted (status lookup, slug ≤ 100 chars, province/category resolved by DB lookup). |

## Rulings on the questions raised
1. **Should a 404 from `?page` out of range carry `public, s-maxage=60`?** It should not be cacheable. ARCH L6-T03/T06 says the full SSR 404 is `private, no-cache, no-store`. However, `notFound()` thrown from a force-dynamic list page inherits the `next.config` header. This is the same existing behaviour as `/tin-tuc?page=99` (L6-T06, accepted), and the TTL is within the ≤ 1 min SLA. **Ruling:** not a regression of this task. MINOR / out of scope; propose a separate task for the shared cache rule (see MINOR-5).
2. **Chips are links, not `button[aria-pressed]`.** For a chip that navigates to another URL, a link with `aria-current="page"` is the correct ARIA; `aria-pressed` on a link is invalid. S04 already uses link chips to S05. **Ruling:** the markup is acceptable. However, the route it links to is not in the spec (MAJOR-1).
3. **`/en` province names stay in Vietnamese.** Consistent with the S06 precedent and documented in `listProvinces`. **Ruling:** OK.
4. **Seed idempotency by media `alt`.** `findOrUploadImage` only runs when a sample project is created, or when a draft without images is healed. An admin editing the alt only causes a duplicate upload if the project is also hard-deleted. This is sample data on dev/staging only. **Ruling:** acceptable.
5. **Seed safety in production.** `seed/index.ts:94` throws on `--sample` when `APP_ENV=production`. **Ruling:** OK.
6. **Image licence README.** Images are self-generated (SVG→sharp), marked CC0, total < 100 KB (user limit < 2 MB), with a regeneration script. **Ruling:** OK. Satisfies the L5-T01 follow-up and the 2026-10-18 user decision.
7. **CategoryListTemplate regression for news.** With no `toolbar` and no `chipsLabel`, `chipRow === chipList` (same `<ul>`), and without `emptyState` the default `EmptyState` is unchanged. Covered by the new test "giữ nguyên markup cũ". **Ruling:** no regression.
8. **SEO.** Filtered pages use `forceNoindex` with canonical to the clean path. Pages ≥ 2 get canonical `?page=n`. On S05, hreflang EN is only added when `hasEnglish` and an EN slug exist. Valid `?category=` on `/du-an` points canonical to the category page. **Ruling:** OK.
9. **a11y.** The GET form has wrapping `<label>`s, an explicit submit with no auto-submit (WCAG 3.2.2), `aria-current` on the chip, one card link containing `h2`, and the result count in `aria-live`. **Ruling:** OK.
10. **CWV.** First card has `priority`; the other cards lazy-load. **Ruling:** OK.

## Findings

### [CRITICAL]
None.

### [MAJOR]
**MAJOR-1: New public route `/du-an/danh-muc/[category]` and `/en/projects/category/[category]` is outside the intent docs and has no decision record.**
- Files: `src/i18n/routing.ts:14-17`, `src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx`, `src/lib/content/resolve-missing-page.ts:31`, `src/hooks/categories/revalidate-category.ts:19`, `src/components/projects/ProjectListPage.tsx:60-72`.
- BRD §2.1 lists routes at `docs/BRD.md:89-91` and `docs/BRD.md:108-110`. That list is intent and has **no** project category route.
- design-spec S05 (`.context/design-spec.md:359-362`) lists exactly 3 routes (rental, property news, news), not projects.
- design-spec S02 (`.context/design-spec.md:290,302`) specifies the chips as a `?category=` filter on `/du-an`. Clicking a chip now leaves S02 for a new indexable page.
- The task file only says "(nếu S05 áp dụng)" and records `Decision impact: NO`. The spec says S05 does not apply to projects.
- `src/i18n/routing.test.ts:18` asserts the new pair inside the test "theo BRD §2.1". That is a false-confidence test, because BRD has no such row.
- Why this matters: a public URL that gets indexed is costly to remove (needs 301s). AGENTS.md forbids changing intent by code without a Change Request and user approval.
- Fix, either:
  - (a) Primary asks the user and records the decision (Decision impact YES). Then update design-spec S05/S02 and BRD §2.1 through the approved path, and fix the test name/comment. No code change needed.
  - (b) Remove the S05 project route, the routing pair, the missing-page rule and the revalidate category entry. Chips become `?category=` links on `/du-an` with `aria-current`, as S02 specifies.

### [MINOR]
1. **Doc impact is not "no doc impact".** `docs/ARCHITECTURE.md:173` (as-built L6-T06) still says the category pages are "chỉ news/rental/property_post có" and lists `MISSING_PAGE_RULES` without the project rule. Close-out must reconcile ARCH as-built: the new pathname, the missing-page rule, revalidate scope `project`, force-dynamic for the project list, and the published sample seed with images.
2. **EN alt of sample images = VI alt.** `seed/sample/projects.ts:206` and `seed/sample/projects.ts:239` pass `image.alt` (Vietnamese) as `englishAlt`, so the EN locale of media holds Vietnamese text. Cards are `decorative`, so the list itself is not affected, but the detail page and lightbox will be. Fix: add `image.altEn` to `SampleProject` and pass that.
3. **S02 / S05 visual deviations.**
   - At 375, chips wrap instead of scrolling horizontally with snap and fade (`.context/design-spec.md:296`).
   - On S05 for a child category, the chip row shows root categories with **no** chip current, because `currentId` is the child id (`ProjectListPage.tsx:126`). The S05 spec wants child chips with "Tất cả" = parent.
   - S02 "loading skeleton 6 thẻ" has no `loading.tsx`.
   - Resolve together with MAJOR-1, or log as accepted deviations.
4. **Function length.** `ProjectListPage` in `src/components/projects/ProjectListPage.tsx:79-158` is about 80 lines (rule ≤ 50). Suggest extracting `buildEmptyState` / `buildBreadcrumb`.
5. **Out of scope (shared): cacheable 404 on list pages.** `?page` out of range returns 404 with `public, s-maxage=60, stale-while-revalidate=300`. Existing behaviour shared with `/tin-tuc`. Propose a separate task, e.g. a `no-store` header for `notFound()` on force-dynamic lists, or a proxy-level page-range check.
6. **Duplicate queries per request.** `generateMetadata` and the page both call `getPayload` + `loadCategoryContext` with no `React.cache`. `listPublicProjects` `depth: 1` also populates the **whole** gallery, developer and other relations for 12 cards, when the card only needs the first image. Suggest `cache()` around `findProjectCategoryBySlug` and `select`/`populate` limits.
7. **Seed overwrites the EN of an existing category.** `seed/sample/projects.ts:151` writes EN name + `hasEnglish: true` to any project category with the same VI name that lacks EN, including one created by an admin. Staging only; acceptable, but note it in the docstring.

## Residual risk
- Reviewer did not run a browser or curl (outside allowed commands). Responsive was checked by CSS math. The 404/200 headers and h-scroll measurements come from builder evidence.
- When the `translate-content` hook ships (not in `src/` yet), seeding published VI projects may enqueue AI translation jobs. EN set by the seed has no `enSource=manual`, so translation could overwrite it.
- Concurrent `Promise.all` writes in the seed show a pg `client.query` deprecation warning in test logs. Not failing.

## Verdict: FAIL

One MAJOR finding (MAJOR-1: unapproved public route / spec deviation, and a test that misstates BRD). It can be closed by either:
- (a) a recorded user decision plus spec/doc delta, with the test name fixed; or
- (b) reverting to `?category=` chips as S02 specifies.

Also address MINOR-1 (ARCH reconcile) and MINOR-2 (EN alt) in round 2.
