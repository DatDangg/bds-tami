Agent: reviewer

# Review: build/tami-website layer-6-task-06, round 1 (Tin tức S10/S11 + trang danh mục S05)

- **Review level:** STRICT
- **Reason:** The task file expects NORMAL, but the diff touches several red-risk areas. (1) `src/proxy.ts` now does a DB lookup on the hot path for every `/tin-tuc/*` and `/en/news/*` request, with an in-memory cache, a timeout and fail-open. (2) `RichText` is a shared XSS-sensitive renderer that every later detail page will reuse. (3) `Categories` gets a new revalidate hook and a factory refactor (shared collection config). (4) `content-paths.internalPath` is generalised, and it is a shared cache-key builder.
- **Scope:** uncommitted diff vs HEAD `ea7877b` (11 modified + new files; excluded `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`).
- **Blast radius:** every public request through `proxy.ts` (redirect, then missing-page check, then next-intl), the Payload `categories` collection (afterChange/afterDelete on every admin edit, including rental/property_post/project/job scopes), `internalPath` callers (revalidate hooks for every content collection), `RichText` consumers (news now; projects/services/jobs later), `global-not-found` rendering path, the news list/detail/category routes, i18n `page.news` messages, and the test fixture `tests/fixtures/news/payload-config.ts`.

## Verify commands + result (from `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 122 files, 1346 tests (exit 0) |
| `pnpm build` | PASS (exit 0). Route table: `● /[locale]/tin-tuc`, `● /[locale]/tin-tuc/[slug]`, `ƒ /[locale]/tin-tuc/danh-muc/[category]` |

Note on the build label: `/[locale]/tin-tuc` shows as `●` even though it sets `force-dynamic`. The label comes from the `generateStaticParams` it inherits from `[locale]/layout`. `.next/prerender-manifest.json` lists only `/[locale]/tin-tuc/[slug]` under dynamic/ISR routes, not `/[locale]/tin-tuc`, so the list page really renders per request. The label is cosmetic.

`pnpm install --frozen-lockfile` was not run: the lockfile is unchanged in the diff. I did not start `next start` or a browser, so runtime/browser evidence comes from the builder.

## Acceptance criteria

| AC | Status | Evidence |
|---|---|---|
| `news_list_idx` exists after real migration (`pg_indexes`) | OK | `tests/integration/news-migration.test.ts:50` |
| Category in trash branch + UX decision on restore | OK | `tests/integration/news.test.ts` "danh mục ở thùng rác": assigning a trashed category is blocked; a category with news cannot be soft-deleted (409), so restoring a news item always finds a live category |
| G14 `revalidatePath` hits real Next cache | OK (builder evidence) | ARCH §5.1 bullet: MISS→HIT, PATCH then immediate MISS→HIT. Only meaningful because the detail page has `generateStaticParams() { return [] }` (`[slug]/page.tsx:34`) |
| G13 categories edits refresh list/category caches + hook test | OK | `revalidate-category.ts:15-68` + unit `revalidate-category.test.ts` + integration (rename/slug change/soft delete/other scope). See MINOR-5 on effect |
| RichText renders no arbitrary HTML; external link `rel="noopener"` | OK | `RichText.tsx:152-203` allowlist, `default → null` drops the whole branch; `safeHref` `:51-66`; `rel="noopener noreferrer"` for external or newTab `:94`; tests `RichText.test.tsx:15-95` |
| Related = same category, excludes current, max 3 | OK | `news-queries.ts:73-83` (via `findPublicList` → `publicWhere`); integration tests incl. `/en` |
| JSON-LD `Article` has `inLanguage` | OK | `json-ld.ts:129`; `serializeJsonLd` escapes `<` (`json-ld.ts:175`) |
| No lead form | OK | no form in the news components/pages |
| Follow-up G18 (CategoryListTemplate test) | OK | `CategoryListTemplate.test.tsx:35-86`: `aria-current`, EmptyState + `parentListHref`, pagination hidden when empty |
| Follow-up L6-T03 (404 with server HTML content) | OK | `resolve-missing-page.ts` + `proxy.ts:253-254`; tests in `proxy.test.ts` + `resolve-missing-page.test.ts`; builder curl evidence |

## Gate checks (requested focus)

- **RichText XSS:** OK.
  - Text is rendered only through React children.
  - Unknown node types (`html`, `block`, `relationship`) are dropped together with their children.
  - Depth is capped at 20.
  - `safeHref` rejects control chars and whitespace, `//host`, `/\`, and `javascript:`/`data:`/`vbscript:`; it accepts only http(s)/mailto/tel/`/path`/`#`.
  - `target="_blank"` always comes with `rel`.
  - Upload nodes are limited to `relationTo: "media"` with an `image/*` mime type.
  - Internal `doc` links are dropped to plain text (safe, but see MINOR-8).
- **Proxy hot path:** OK. Details:
  - Only matched dynamic URLs hit the DB, through the same `findPublicBySlug` the page uses.
  - Lookups time out after 400 ms, and the timer is cleared in `finally`.
  - A late rejection is swallowed (`lookup.catch`).
  - On error or timeout it returns `null`, so the page handles the request, and nothing is cached.
  - Cache: 60 s for existing pages, 10 s for missing ones, capped at 1000 keys.
  - Rewrite target `/__not-found__/missing` uses the same unmatched-path shape L6-T03 already relies on for `/__not-found__/:segment`. None of the new routes collide (they all sit under the static `tin-tuc`).
  - The 404 is `private, no-cache, no-store`, so the CDN never pins a 404 over a freshly published article.
  - Bot amplification: before this task a random slug already cost one `findPublicBySlug` in the page. Now that query moves to the proxy and the page is not rendered, so the net DB cost per random slug is about the same. The eviction strategy is weak (MINOR-1).
- **Cache policy:** detail page is ISR (manifest confirms). List pages are `force-dynamic`, which ARCH §5.1 documents: there is no Next cache entry, and the CDN keeps them per `next.config.ts` headers. Page 1 canonical has no query; `?page=n` canonical is `?page=n` (`NewsListPage.tsx:25-27`). Residual risk: builder evidence does not explicitly show `Cache-Control: public, s-maxage=60` on `/tin-tuc?page=2` (force-dynamic default is `private, no-store` unless the next.config rule wins as ARCH states).
- **`/en` filtering of populated relations:** OK. `visibleCategory` (`news-view.ts:24-29`) hides categories with `hasEnglish !== true`. Related/list queries go through `publicWhere`. Parent categories are filtered in breadcrumbs.
- **JSON-LD:** valid shape with `inLanguage`, publisher and BreadcrumbList. Image fallback bug (MINOR-2). No `author` (MINOR-3).
- **Images/LCP:** detail cover `priority` + `sizes`; S10 lead card `priority`; card `sizes` per variant; aspect ratios set. Category page S05 has no featured block, so no image gets `priority` (MINOR-7).
- **a11y:**
  - Single `h1`; body headings demoted to h2/h3.
  - Cards are a single link, with no nested `<a>`.
  - Focus rings are present.
  - Share result is announced via `role=status`; share links follow label-in-name.
  - The table scroll wrapper is focusable but unnamed (MINOR-6).
- **i18n:** `page.news` keys are added symmetrically to vi/en (19 lines each). Components contain no hard-coded Vietnamese; only the brand names "Facebook"/"Zalo" are literals.
- **Zalo share URL** `https://sp.zalo.me/plugins/share?dl=...&type=link` (`ShareButtons.tsx:57`): unverified (MINOR-4).

## Responsive Checklist Gate (diff touches UI: news pages/components)

No browser was run by the reviewer. I checked CSS/classes in the code and used the builder's evidence (`next start :3224` at 375/768/1280: no horizontal scroll, touch targets ≥44, CLS 0).

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK (builder evidence) | Containers are `max-w-*` + `w-full` + `px-gutter`; table in `overflow-x-auto` (`RichText.tsx:42`). Residual: long unbroken URL text in prose has no `break-words` (MINOR-9) |
| Mobile-first media queries | OK | Tailwind `sm:`/`lg:` min-width only |
| Grid without fixed columns | OK | 1 col → `sm:grid-cols-2` → `lg:grid-cols-3` (`NewsListBody.tsx:32`, `[slug]/page.tsx:154`); featured `lg:grid-cols-12` 7/5, stacked below lg. Breakpoint-stepped, not fixed-width |
| Container not fixed px | OK | `max-w-text`/`max-w-container`/`max-w-5xl`; only `sm:w-[120px]` row thumbnail (intentional, small) |
| rem font sizes / fluid headings | OK | design-token classes `text-h1..h4`, `text-body`, `text-small`; code `0.9em` |
| Spacing scale | OK | token spacing (`py-section-tight`, `px-gutter`) |
| Images max-width + aspect-ratio | OK | `ResponsiveImage` with `aspectRatio` on cover/cards/uploads |
| srcset/sizes on important images | OK | `sizes` per variant (`NewsCard.tsx:22-26`, cover `[slug]/page.tsx:130`) |
| Video/embed aspect-ratio | N/A | none in diff |
| Touch target ≥44px | OK | share buttons `min-h-11 min-w-11`, category link `min-h-11`, card link `min-h-11`; inline prose links are exempt (WCAG 2.5.8 inline exception) |
| Nav hamburger on mobile | N/A | shell unchanged in this diff |
| Table scroll wrapper / card layout | OK | `overflow-x-auto` wrapper |
| No bare `100vh` | OK | none in diff |
| prefers-reduced-motion | OK | `motion-reduce:` on card zoom (`NewsCard.tsx:19`) |
| No `overflow:hidden` hiding bugs | OK | `overflow-hidden` only on image frames for zoom clipping |

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip: `aislop` is not in the reviewer's allowed command set (verify commands + git only); not run |
| oxlint (anti-slop) | skip, oxlint not configured (repo uses ESLint; `pnpm lint` PASS) |
| ocr (open-code-review) | skip, ocr not installed / not in allowed commands |
| AI-readable | OK: 1 indicator (`NewsDetailPage` ~100 lines, mostly JSX; `renderNode` ~52 lines as a flat switch). Names are clear, comments explain WHY, ARCH §5.1 updated for the new proxy flow. Below the 3-indicator threshold |
| ai-friendly-web | N/A for this task: robots/sitemap/llms belong to L5-T08/L8-T05; this task adds no crawler blocks (staging noindex vs production index per builder evidence) |
| blitzstrike | skip: not installed / no permitted environment. RichText/proxy reviewed manually above |
| Surgical diff | OK with note: the S05 category page + `site-identity.ts` + `resolve-missing-page.ts` go beyond the task's "Files to Create/Modify" list, but each traces to an AC/follow-up (chips need a target; L6-T03 follow-up; JSON-LD publisher). The `Categories.ts` re-indent is caused by wrapping it in the `createCategories` factory needed to inject `revalidate` in tests |

## Findings

No CRITICAL. No MAJOR.

- **[MINOR-1]** `src/lib/content/resolve-missing-page.ts:80-84`: when the cache reaches 1000 entries, `cache.clear()` also drops all "exists" entries. A bot scanning random slugs (>1000 per 10 s) keeps wiping the cache, so real pages do one DB query each time. **Fix:** evict the oldest entries (Map insertion order: delete `cache.keys().next().value` in a loop) or keep separate caps for missing vs existing entries. Consider an Nginx/Cloudflare rate limit on 404s for `/tin-tuc/*`.
- **[MINOR-2]** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:101,171`: `absoluteUrl(cover?.sizes?.large?.url ?? cover?.url ?? "", siteUrl)` returns the site root URL when the cover is missing (media in trash/unpopulated, or `validateCover` lets drafts through), so Article `image` points to the homepage. **Fix:** compute `coverUrl` only when the source URL is non-empty (e.g. `const src = cover?.sizes?.large?.url ?? cover?.url; const coverUrl = src ? absoluteUrl(src, siteUrl) : undefined;`).
- **[MINOR-3]** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:166-175`: Article JSON-LD has no `author`. Google flags this as a recommended-field warning. **Fix:** set `author` to the publisher Organization (`{ "@type": "Organization", name: siteName, url: siteUrl }`), which keeps staff private.
- **[MINOR-4]** `src/components/news/ShareButtons.tsx:57`: the Zalo share URL format (`sp.zalo.me/plugins/share?dl=…&type=link`) is unverified. Zalo's documented share flow uses the SDK button (`data-href`, often `data-oaid`). **Fix:** verify manually on a phone with Zalo installed before launch, or document the source. Also, `title={title}` on the share links (`:50,:61`) shows the article title as a tooltip on an action button. Remove it, or use the action label instead.
- **[MINOR-5]** G13 effect: `/tin-tuc` and `/tin-tuc/danh-muc/[category]` are `force-dynamic`, so the `revalidatePath` calls for list/category pages are no-ops today (freshness = CDN 60 s). The ISR detail pages, which show the category name/breadcrumb, are not revalidated by the category hook (stale up to 60 s via layout `revalidate`). ARCH §5.1 documents this. Acceptable; noting it so L6-T04/L8 do not assume immediate category refresh on detail pages.
- **[MINOR-6]** `src/components/content/RichText.tsx:130`: the table scroll wrapper has `tabIndex={0}` but no `role="region"` or accessible name. **Fix:** add `role="region"` + `aria-label` (e.g. a translated "Bảng"/"Table", passed as a prop or kept generic).
- **[MINOR-7]** `src/components/news/NewsListBody.tsx:30-38`: on S05/category pages and on `/tin-tuc?page≥2` there is no featured block, so the first grid card's image is lazy-loaded, which may delay LCP. **Fix:** pass `priority` to the first grid card when `featured.length === 0`.
- **[MINOR-8]** `src/components/content/RichText.tsx:84`: internal `doc` links (`linkType: "internal"`) render as plain text, so editors who use "link to page" lose the link with no warning. Safe for now. **Fix (follow-up):** resolve populated `fields.doc` to `publicDetailPath`, or restrict the admin editor to custom URLs.
- **[MINOR-9]** `src/components/content/RichText.tsx:216-219`: no `overflow-wrap: anywhere` / `break-words` on the prose container. A long unbroken URL or word in article text can cause horizontal scroll at 375 px (the builder tested with sample content). **Fix:** add `break-words` (or `[overflow-wrap:anywhere]`) to the RichText root class.
- **[MINOR-10]** `src/components/news/NewsListPage.tsx:83`: `/tin-tuc?page=n` emits hreflang `en: /en/news?page=n`. EN has fewer articles (only `hasEnglish`), so a high vi page number can point hreflang at an EN page that 404s. **Fix:** emit hreflang alternates only on page 1, or only when the EN total page count is ≥ n.
- **[MINOR-11]** Process: the task file's "Files to Create/Modify" / Blast radius and "Doc impact: no doc impact" are now outdated (S05 page, proxy, Categories hook, ARCH §5.1 updated). Update the task file at close-out, and note in L6-T04 that S05 news is done and must reuse `NewsListPage`/`MISSING_PAGE_RULES`.

## Rulings on builder decisions

1. **S05 news category page in this task (vs L6-T04): ACCEPTED.** S10 chips and breadcrumbs link to `/tin-tuc/danh-muc/[category]`; shipping S10 without it would produce live 404 links. It reuses `CategoryListTemplate`, is covered by the proxy rule + G13 hook + integration tests, and is documented in ARCH. Condition: record it in the task file and L6-T04 (MINOR-11).
2. **List pages `force-dynamic` (not ISR) because of `?page=`: ACCEPTED.** It is consistent with the ARCH cache policy (CDN caches by URL including query; RSC variants are `no-store`). The prerender manifest confirms that only the detail page is ISR. Residual risk: the builder should capture `curl -I /tin-tuc?page=2` showing `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (not `private, no-store`) as evidence before layer close. A later option is ISR with path-based pagination (`/tin-tuc/trang/2`) if origin load matters.
3. **Out-of-range `?page=99` → `notFound()` empty shell: ACCEPTED as a known limitation.** Status 404 + noindex are correct, crawlers never reach these URLs through rel/pagination links, and ARCH §5.1 documents it. Suggested follow-up (not blocking): handle out-of-range in the proxy, or 301 to the last valid page, so the HTML has content.

## Residual risk

- No reviewer-run browser or `next start`. Responsive/a11y/LCP/404-content/SEO-env and the MISS→HIT claims rely on builder evidence.
- The Cache-Control header on force-dynamic list pages was not shown explicitly (ruling 2).
- Zalo share endpoint is unverified (MINOR-4).
- aislop/ocr/blitzstrike were not run (not allowed or not installed).

## Verdict

**PASS.** No CRITICAL or MAJOR findings. All ACs and follow-ups (G13, G14, G18, L6-T03 404 content) are met, and lint/typecheck/test/build pass. The 11 MINOR items are recommended fixes or follow-ups and do not block.
