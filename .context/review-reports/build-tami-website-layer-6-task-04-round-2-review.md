Agent: reviewer

# Review: build/tami-website, layer-6-task-04, round 2

**Task:** `tasks/tami-website/layer-6-task-04.md` (S02 Projects list, sample data with images)
**Scope:** uncommitted diff vs HEAD `dfd1945`, excluding `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`
**Context:** Round 1 FAIL on MAJOR-1 (unapproved route `/du-an/danh-muc/[category]`). The user chose option (b) (progress.json 2026-10-18T07:35): drop the route and make the chips `/du-an?category=<slug>` links, as S02 specifies.

## Review level: STRICT

**Reason:** the diff changes shared modules. These are `CategoryListTemplate` (also used by news S05/S10), `findPublicList` in `public-queries.ts` (used by every public list), and the seed (writes data and uploads media). It also defines a public URL/SEO contract. Round 1 also touched `routing.ts`, `resolve-missing-page.ts` (proxy) and `revalidate-category.ts` (hook), so this round has to confirm they were restored.

## Blast radius
- Public routes: `/du-an` and `/en/projects` only. The build route table has no project category route.
- `CategoryListTemplate`: news list and category pages. The new props are opt-in (`chipsLabel`, `scrollChips`, `toolbar`, `emptyState`). With none of them passed, the markup does not change, and a test covers that.
- `findPublicList`: new optional `select`, spread only when passed. Existing callers are unchanged.
- `pnpm seed --sample` (dev/staging only). `formatVndCompact` (new helper).
- Not changed: `src/i18n/routing.ts`, `src/i18n/routing.test.ts`, `src/lib/content/resolve-missing-page.ts`, `src/hooks/categories/revalidate-category.ts` and its test. `git diff HEAD -- <files>` is empty for all of them.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint, no output) |
| `pnpm typecheck` | PASS (tsc --noEmit, no output) |
| `pnpm test` | PASS: 132 files, 1,429 tests (DB integration ran) |
| `pnpm build` | PASS. Routes: `● /[locale]/du-an`. No `du-an/danh-muc` route. `tin-tuc/danh-muc/[category]` is unchanged. |
| `git diff HEAD -- routing.ts routing.test.ts resolve-missing-page.ts revalidate-category.ts` | empty (restored as the builder claimed) |
| Browser / curl | not run by reviewer (outside allowed commands); builder evidence (:3226) accepted where the code supports it |

## Requested checks
1. **Leftover references to the removed route.** Grep for `projects/category|du-an/danh-muc|projectCategoryHref|ProjectCategoryPage` across the repo:
   - `src/`, messages, routing, proxy rules, hooks and docs: none. ARCH §5.1 explicitly says there is no project category route.
   - One stale string remains in a test fixture (MINOR-1).
   - The task file Blast radius / Files still mention "(nếu S05 áp dụng)" (MINOR-2).
   - There is no sitemap code yet (layer-8), so nothing to update there.
2. **`findPublicList` `select`.**
   - Backward compatible: the spread `...(options.select ? { select } : {})` only applies when `select` is passed.
   - `where` is still built from `publicWhere` plus the caller's `where`, so `select` cannot bypass access, status, soft-delete or `hasEnglish` filters.
   - With `depth: 1`, Payload populates relations in full, so `visibleCategory` still sees `hasEnglish` and slug on the category.
   - The integration tests (`tests/integration/projects.test.ts:392-435`) run `listPublicProjects` with `select` active. They check VI/EN `hasEnglish`, pagination, and category/province/status filters.
3. **Unknown `?category=`.**
   - The page ignores it: `loadCategoryContext` returns null, the list is unfiltered, the "Tất cả" chip is current, no hidden input is added, and the status is 200.
   - S02 does not define behaviour for an unknown slug. Ignoring it matches the user decision and the filter-parse rule for other params.
   - The metadata treats it as filtered (`noindex, follow`, canonical `/du-an`). That follows design-spec line 355 (any parameter other than `page` → noindex) and avoids an indexable duplicate.
   - Covered by tests at `ProjectListPage.test.tsx:139` and `:224`.
4. **Canonical on filtered URLs.**
   - design-spec line 355 says: params other than `page` → `noindex, follow`, canonical to the URL with no params.
   - The implementation does that: `hasFilterParams` → `forceNoindex`, and `pathFor` drops `?page` when filtered. Unfiltered page ≥ 2 keeps `?page=n`, the same as news.
   - hreflang is always `/du-an` ↔ `/en/projects`.
   - Tests at `:207`, `:216` and `:224`.
5. **ARCH note (`docs/ARCHITECTURE.md`, layer-6-task-04 bullet).** It matches the code:
   - Route scope, and no `pathnames`/`MISSING_PAGE_RULES`/revalidate entry for the project category.
   - `parseProjectFilters` rules and `force-dynamic`.
   - Chips keep province/status, drop page, `aria-current`, and mark the parent chip for child categories.
   - GET form, scroll-chip behaviour, SEO rule, `select` via `PublicListOptions.select`, and seed + `formatVndCompact`.
   - The existing layer-6-task-06 bullet ("trang danh mục chỉ news/rental/property_post có") stays correct.
6. **Round 1 MINORs.**
   - MINOR-1 (ARCH): fixed.
   - MINOR-2 (EN alt): fixed. `altEn` is used at `seed/sample/projects.ts:206,239`.
   - MINOR-3: scroll chips fixed. Skeleton is still missing (see MINOR-4). The child-chip issue is fixed (the parent root chip is marked).
   - MINOR-4 (function length): partly fixed (see MINOR-3).
   - MINOR-6 (duplicate query): metadata no longer looks up the category; `select` was added.

## Responsive Checklist Gate (diff touches UI): checked by CSS math, no browser
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Chip row with `scrollChips`: `overflow-x-auto flex-nowrap` scrolls inside its own box (`pr-8`, mask fade). From `sm:` up it is `flex-wrap overflow-visible`. Grid `sm:grid-cols-2 lg:grid-cols-3` = `minmax(0,1fr)`. Toolbar `flex-col` below `lg`. Builder measured 375/768/1280 with no document h-scroll. |
| Mobile-first `min-width` | OK | Only `sm:`/`lg:` variants. |
| Grid auto-fit/minmax | OK (justified) | S02 fixes 1/2/3 columns. `grid-cols-N` uses `minmax(0,1fr)`. |
| Container not fixed px | OK | `max-w-container px-gutter` tokens. |
| Typography rem / fluid | OK | `text-small` token. The banner is the existing `PageBanner`. |
| Media | OK | Unchanged from round 1: `ResponsiveImage` with `sizes`, aspect ratio, `priority` on the first card. |
| Touch ≥ 44px | OK | Chips `min-h-11` (44px). Selects/buttons unchanged from round 1 (`h-12`, `min-h-11`). |
| Nav mobile / table | N/A | No new nav and no tables. Chips scroll horizontally below `sm` as S02 at 375 specifies. |
| 100vh | OK | Not used. |
| prefers-reduced-motion | OK | Scroll-snap has no animation. The card zoom keeps `motion-reduce` (round 1). |
| overflow:hidden masking a bug | OK | The chip row uses `overflow-x-auto`, not hidden. `py-1 -my-1` keeps the focus ring from being clipped. |

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, `aislop` not installed |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint and tsc PASS. |
| ocr | skip, ocr not installed |
| AI-readable | OK, 1 indicator (< 3). `ProjectListPage` is about 70 lines, mostly JSX (MINOR-3). Names are clear, constants are named (`PROJECT_CARD_FIELDS`, `MAX_SLUG_LENGTH`, `CHIP_SCROLL_CLASS`), comments explain WHY, and ARCH is updated. |
| ai-friendly-web | N/A. robots/sitemap/llms are owned by layer-8 and the diff does not touch them. |
| blitzstrike | skip. Read-only public listing. Inputs are whitelisted (status lookup, slug ≤ 100 chars, province/category resolved by DB lookup through `publicWhere`/`overrideAccess:false`). |

## Findings

### [CRITICAL]
None.

### [MAJOR]
None. Round 1 MAJOR-1 is closed: the route, pathname, missing-page rule and revalidate entry are gone, the restored files match HEAD, and the chips are `?category=` links as in S02.

### [MINOR]
1. **Stale test fixture that uses the removed route.** In `src/components/projects/project-components.test.tsx:90-91`, `ProjectFilters actionPath="/du-an/danh-muc/can-ho"` and its assertion still use a URL that no longer exists. The test passes but is misleading. Fix: use `/du-an` (or `/en/projects`).
2. **Task file not reconciled.** In `tasks/tami-website/layer-6-task-04.md:16,86`, Blast radius / Files still list `du-an/danh-muc/[category]/page.tsx (nếu S05 áp dụng)`. At close-out, update the file and record Decision impact = YES (user decision 2026-10-18).
3. **Function length.** `ProjectListPage` in `src/components/projects/ProjectListPage.tsx:67-136` is about 70 lines (rule ≤ 50; builder claimed about 55). Suggestion: extract the `toolbar`/`emptyState` elements into small helpers. Not blocking (1 AI-readable indicator).
4. **S02 deviations to log as accepted.**
   - S02 A11y (`.context/design-spec.md:302`) asks for `button[aria-pressed]` in `role="group"`. The implementation uses `nav[aria-label] > a[aria-current="page"]`. That is the correct ARIA for navigating links and works without JS; the user decision gives links.
   - The "loading skeleton 6 thẻ" has no `loading.tsx`.
   - Record both as accepted deviations in the task close-out, or as a design-spec delta.
5. **`select` has no negative assertion.** No test proves that `overview` and other long fields are excluded from list results. Optional: in the integration test, add `expect(doc.overview).toBeUndefined()`.
6. **Out of scope (carried over from round 1 MINOR-5).** A 404 for an out-of-range `?page` on force-dynamic lists inherits `public, s-maxage=60`. Same as `/tin-tuc`; propose a separate task.

## Residual risk
- The reviewer did not run a browser or curl. Responsive behaviour (the mask fade, `sm:mask-none` overriding the arbitrary `[mask-image]`) was checked by CSS reading plus builder evidence at 375/768/1280.
- The 404-with-content for the removed URLs (`/du-an/danh-muc/x`) is builder curl evidence. In the code they no longer match any route, so they fall to `global-not-found`, as ARCH L6-T03 describes.
- The round 1 residuals (translate-content hook vs seeded EN, pg deprecation warning) still apply.

## Verdict: PASS

No CRITICAL or MAJOR findings. Round 1 MAJOR-1 is closed by the user-chosen option (b). Lint, typecheck, test (1,429) and build PASS. Address MINOR-1/2/4 at close-out (test string, task file, accepted deviations); MINOR-3 and MINOR-5 are optional.
