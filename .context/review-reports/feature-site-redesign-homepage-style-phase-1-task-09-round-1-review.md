Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-09 · round 1 (BL-045)

- Review level: **STRICT**
- Reason: the task changes queries for the public news and property-post listings (`news-listing.ts`, `post-queries.ts#findFeaturedPost`, `post-listing.ts`). The risks are leaking draft posts or expired offers and duplicating or losing posts across pages. It also changes the grid in shared components (`NewsListBody`, `PostListBody`).
- Blast radius: `/tin-tuc` + `/tin-tuc/<danh-mục>` (vi/en), `/tin-bds` + `/tin-bds/<danh-mục>` (vi/en). Callers: `NewsListPage.tsx:48`, `PostListPage.tsx:44`. `findFeaturedPost` now takes an optional 4th parameter, and the call without it keeps the old behaviour. No schema, API contract or auth changes.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src` | PASS (exit 0) |
| `pnpm vitest run tests/integration/news.test.ts tests/integration/property-posts.test.ts` | PASS 2 files / 53 tests. They actually ran against the temp DB, none were skipped. |

## Kiểm tra yêu cầu
- **Featured post on category pages (GAP-1)**
  - News: `news-listing.ts:30-36` makes 2 limit-1 queries scoped to `categoryIds`, which covers the category and its children (`isFeatured`, falling back to the newest post). The grid excludes `leadDoc` on every page, so there is no duplicate on page 2.
  - The integration test `news.test.ts:348-364` checks three things: page 1 has a featured post that is not in the grid; pages 1 and 2 together give 14 unique posts; an `isFeatured` post in a child category wins.
  - Posts: `post-listing.ts:38` calls `findFeaturedPost(..., categoryIds)`, which only picks `isFeatured` posts whose offer has not ended, with no fallback. That matches the root `/tin-bds` rule. The grid excludes `featuredDoc` (`:43`).
- **Public posts only**: both featured paths go through `findPublicList`, which always adds `publicWhere`, so drafts are excluded. Posts also add `offerNotEndedWhere(now)` (`post-queries.ts:121`). The `category in` filter matches `listPublicPosts:93`. No new query bypasses `publicWhere`.
- **Query load**: category pages add 2 news queries (limit 1, run in parallel) or 1 post query (limit 1). This is the same as the existing root listing pages. Acceptable.
- **4-column grid at ≥ xl (GAP-2)**: `NewsListBody.tsx:19` and `PostListBody.tsx:19` add `xl:grid-cols-4`, and the unit tests lock it in. The 1440 screenshot `site-redesign-t09-news-category-1440.png` shows 4 cards per row plus a horizontal featured post in category "Thị trường".
- **i18n /en (GAP-4)**: `site-redesign-t09-en-project-detail-1440.png` shows EN nav, breadcrumb, subnav and form. Province names in Vietnamese are data. The builder's note that `/en/news` is empty because the dev DB has no EN posts is reasonable.

## Responsive Checklist Gate
The diff only adds the `xl:` breakpoint (≥1280). Mobile and tablet are unchanged.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| No horizontal scroll | OK | Columns go 1 → sm 2 → lg 3 → xl 4, mobile first. At 1280 the container is about 1216px, so each card is about 290px wide with `gap-6`, which does not overflow (CSS math). |
| Mobile first, `min-width` | OK | Tailwind `sm/lg/xl` are min-width breakpoints. |
| Grid without fixed columns / auto-fit | OK | Uses Tailwind step columns, the same convention as `ProjectListPage`/`RentalListPage` (spec `:21` asks for 1/2/3/4 columns). |
| Typography/Spacing | N/A | Not changed. |
| Media | N/A | Not changed. |
| Touch target / nav / table | N/A | Not changed. |
| Viewport / reduced-motion / overflow hidden | N/A | Not changed. |

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). ESLint passes.
- ocr: skip, ocr not installed.
- AI-readable: OK. Functions are short (`loadNewsListing` about 20 lines), names are clear, no magic numbers, and the docstrings in the diff were updated. 1 stale comment outside the diff (MINOR-1). Fewer than 3 indicators.
- ai-friendly-web: N/A. This is a layout/query change, not public SEO infrastructure.
- blitzstrike: skip. No pentest environment, and the task adds no new input/auth.

## Findings
- **[MINOR-1]** `src/lib/news/news-queries.ts:49`: the docstring for `featuredOnly` still says "bài nổi bật đầu trang 1 `/tin-tuc`", but it is now also used on category pages. Fix: change it to "trang 1 `/tin-tuc` và trang danh mục".
- **[MINOR-2]** `tests/integration/property-posts.test.ts:575-578` only tests `findFeaturedPost(..., categoryIds)`. No integration test runs `loadPostListing` with `categoryIds` to check that the featured post is excluded from the category grid on page 1 and page 2, or that `totalDocs` counts +1. Also, `site-redesign-t09-posts-category-1440.png` shows an empty category ("Voucher / Ưu đãi"), so there is no visual evidence of a featured post on a `/tin-bds` category page. The logic is the same as the root page (`post-listing.ts:38-50`), so the risk is low. Fix: add 1 integration case for `loadPostListing({ page: 1|2, categoryIds })`.
- **[MINOR-3]** Residual from GAP-4: `pnpm build` was not run (task:25), and no 390 screenshots were retaken. The gap report (`spec-validation…phase-1.md:94-95`) asks for both. This does not block T09, since the change is xl-only and typecheck passes. Close-out or spec-validator round 2 must run `pnpm build`.
- **[MINOR-4]** (optional, perf) The 2 limit-1 queries in `listPublicNews` have no `select` (full richText at depth 1). This was already true on root `/tin-tuc`, and T09 now applies it to every category page and page. Fix later by adding a card `select` the way `POST_CARD_FIELDS` does.

## Residual risk
- `/en/news` with a category and a featured post has not been seen live, because the dev DB has no EN posts. The integration tests only cover `vi`, but the query is locale-independent and still passes through `findPublicList`.
- I checked 2 of the 10 T09 screenshots (news-category, en-project-detail) and the posts-category one. I did not open the rest.

## Verdict
**PASS**: no CRITICAL or MAJOR findings. GAP-1 and GAP-2 are fixed as specified, the public queries keep `publicWhere`, and posts are not duplicated or lost across pages. Hand the 4 MINORs to close-out.
