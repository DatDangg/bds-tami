Agent: reviewer

# Review: BL-054 phase-2-task-01, Tin tức list `/tin-tuc` + category page (round 1)

- Worktree: `.worktrees/feature-news-careers-contact-redesign__phase-2__task-01` (uncommitted; base staging 223620b)
- **Review level:** STRICT
- **Reason:** public SEO page (noindex/canonical); new user params `q`/`tag`/`sort`; hand-written SQL (`drizzle.execute`) on user input; shared `NewsCard` (variant `feature` removed, `grid` added); `most-read.ts` changed; `rental-search-sql.ts` now exports `escapeLike`.
- **Blast radius:** `/[locale]/tin-tuc` and `/[locale]/tin-tuc/danh-muc/[category]` (page + metadata); `NewsCard` (home page and detail page use `card`/`row`, unchanged; grep found no remaining `variant="feature"`); `loadNewsListing`, `listPublicNews` (new options `ids`/`sort`, defaults unchanged); `findMostReadNews` (the "Đọc nhiều" block); `rental-search-sql.ts` (export only, logic unchanged); i18n `page.news.v2`; docs API_SPEC §3.14 / DESIGN / design-spec.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` (DB up) |
| `pnpm typecheck` | PASS (0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 warnings, both in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src/components/news src/lib/news src/lib/search src/components/home "src/app/(frontend)/[locale]/tin-tuc"` | PASS: 28 files, 300 tests |
| `pnpm vitest run tests/integration/news.test.ts tests/integration/news-views.test.ts --no-file-parallelism` | PASS: 2 files, 45 tests (WARN about translation jobs is expected noise) |

## Focus checks
- **SQL injection:** `news-search.ts` uses only the drizzle `sql` template. `locale`, LIKE terms (`escapeLike` + `%…%`), `tag`, statuses, `LIMIT`, and the `translate()` tables are all bound parameters. Identifiers and column names are fixed. The integration test checks `' OR 1=1 --` and `%`, both returning empty without error. OK.
- **Public rules only:** `publicNewsSql` = `status IN ('published') AND deleted_at IS NULL` (+ `has_english` on `/en`), matching `buildPublicWhere` (`access/publishedOnly.ts:13-16`). The final list still goes through `findPublicList`. The test confirms drafts are not found and draft tags are not counted. OK.
- **Searches the language being viewed:** joins `news_locales` with `_locale = ${locale}`. The test confirms `/en` finds an article by its EN title ("district") and `/vi` does not. OK.
- **Pagination / featured:** unfiltered pages exclude the 4 featured articles from the grid on every page (`excludeIds`). The union of flagged + newest is always enough for 4. Integration tests "khối nổi bật 4 bài + lưới 12; trang 2 không lặp; đủ mọi bài" pass for both `/tin-tuc` and the category page. Filtered pages have no featured block and exclude nothing. OK.
- **noindex + canonical:** `buildNewsListMetadata` → `forceNoindex: filtered` + `pageFor` returns the clean path (no `?page`) when filtered. Unfiltered keeps `?page=n`. `/en` ignores `tag` (`parseNewsFilters`). OK.
- **NewsCard `feature` removed:** no call site left in `src/` (Grep). OK.
- **Empty blocks hidden:** NewsMostRead / NewsTopics / NewsFeaturedBlock return `null` when empty. A DB error in a sidebar block → `orEmpty` logs and hides the block. `/en` topics = `[]`. OK.
- **Turnstile:** `NewsletterSignup {...(turnstileSiteKey ? { turnstileSiteKey } : {})}`, and the ConsultSection form "Tư vấn nhu cầu" is kept (only on `/tin-tuc`, not on category pages). OK.
- **MINOR-1 from the P1-T03 review (`most-read.ts`):** empty cards are filtered before backfill, with 2x overfetch. OK.
- **a11y:** a single link per card (no nested `<a>`), heading levels h1 → h2 → h3 (filtered → h2), `aria-current` on chips/tags, sort `<label htmlFor>`, `<noscript>` submit, form GET works without JS. Badge uses `text-badge-foreground` (builder reports 9.7:1). OK.

## Responsive Checklist Gate (375 / 768 / 1280)
Evidence: builder screenshots `bl054-p2t01-vi-1440.png`, `-vi-390.png` (viewed) and `-vi-768`, `-category-*`, `-q-*`, `-en-*` (present), plus CSS math.
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | 390 screenshot has no overflow. Category chips use `CategoryChipList scroll`. Grid and columns use `minmax(0,…)`. |
| Mobile-first min-width | OK | `md:grid-cols-2 lg:grid-cols-3`, `lg:grid-cols-[minmax(0,1fr)_18rem]`, `xl:…21rem`. Sidebar moves below the grid under lg. |
| Grid columns / container | OK | 375: 1 column. 768: 2 columns. 1280: 3 columns + 21rem sidebar (1fr ≈ 820px → card ≈ 260px). Container `max-w-container px-gutter`. Fixed columns are only at lg+ and use rem. |
| Typography rem / fluid | OK | Uses `text-h2/h3/h4/small/xsmall` tokens. No hard-coded px font sizes. |
| Media | OK | `ResponsiveImage` with `sizes` per variant, `aspectRatio` 16/10, 4/3, 1/1. Lead image has `priority`. |
| Touch target ≥ 44 | OK | Topic chips `min-h-11` (from lg `min-h-9`, desktop). Each card/row is a whole link with `min-h-11`. Sort select is the shared chip component. |
| Nav / table | N/A | Header unchanged; no table. |
| 100vh / reduced-motion / overflow-hidden | OK | No `100vh`. Zoom effect is the shared `CARD_IMAGE_ZOOM` (pre-existing). `overflow-hidden` only clips images inside cards. |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint 0 errors.
- ocr (open-code-review): skip, `ocr` not installed.
- AI-readable: OK. Clear names, small functions, constants named (`NEWS_FEATURED_COUNT`, `NEWS_FILTER_MAX_IDS`, `NEWS_TOP_TAGS_LIMIT`, `OVERFETCH_FACTOR`), comments explain WHY, API_SPEC/DESIGN updated. 0–1 indicators.
- ai-friendly-web: N/A (this task does not change llms/robots/sitemap; filtered pages are noindex,follow).
- blitzstrike: skip, not installed. SQL injection was checked manually (above) and by integration tests.

## Findings
No CRITICAL. No MAJOR.

- **[MINOR-1]** `src/lib/news/news-search.ts:31-46`: `findFilteredNewsIds` does not take `categoryIds`, so the 1000-id cap applies site-wide before narrowing by category in `listPublicNews`. With more than 1000 site-wide matches for `q`/`tag`, older articles on a category page can be missing. Fix: pass `categoryIds` into the SQL (`AND n."category_id" IN (...)`), or record the limit in residual risk.
- **[MINOR-2]** `src/lib/news/news-search.ts:57-68`: `listTopNewsTags` decides "public" in SQL only and has no `findPublicList` safety net (unlike the comment on lines 17-18). If the public rule later adds `publishedAt <= now` (FR-ADM-16) to `buildPublicWhere`, tags from scheduled articles would leak into "Chủ đề". Fix: build `publicNewsSql` from the same source as `PUBLIC_STATUSES`/`buildPublicWhere`, or add a comment in `publishedOnly.ts` pointing to this SQL.
- **[MINOR-3]** `src/components/news/NewsListPage.tsx` (`emptyState` filtered → `clearFiltersHref={ownPath}`): on a category page, "Xoá lọc" returns to the category, while the spec says "nút về `/tin-tuc`". This is arguably acceptable (it stays in the current category). The spec owner should confirm, or the spec should be changed.
- **[MINOR-4]** `src/i18n/messages/{vi,en}.json:205` `page.news.readArticle` is now unused (it was only used by the removed `feature` variant). Remove it to avoid a dead key.
- **[MINOR-5]** `src/lib/search/unaccent-sql.ts`: `translate()` only covers precomposed Vietnamese (NFC). Content stored as NFD (combining marks, e.g. pasted from some sources) will not match an unaccented search. Residual risk is low because Payload/the browser usually submits NFC. Can be fixed later by normalizing NFC in a beforeChange hook.

## Residual risk
- Responsive and contrast were checked from builder screenshots and CSS math, not in a live browser (reviewer cannot run the app).
- `readMinutes` is computed from full `content` (the list query already used depth 1 with full docs before this task, so no regression). A `select` could be optimized later.

## Verdict
PASS: no CRITICAL/MAJOR; all verify commands PASS. The MINOR items can go into a follow-up task.
