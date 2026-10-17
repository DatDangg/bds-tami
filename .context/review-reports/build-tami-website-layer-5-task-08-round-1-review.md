Agent: reviewer

# Review: build/tami-website, layer-5-task-08 (SEO foundation), round 1

- **Review level:** STRICT
- **Reason:** shared SEO helpers used by every public page (metadata, robots, JSON-LD), indexing decisions (noindex/robots.txt), CDN cache rules (`cache-policy.ts` feeds `next.config` headers), runtime env reading. The task file also requires STRICT.
- **Scope:** uncommitted diff vs HEAD `7f7f721`: `src/lib/seo/{site-url,metadata,robots}.ts` (+tests), `src/app/robots.ts`, `src/components/seo/JsonLd.tsx` (+test), `src/lib/seo/json-ld.ts` (+test), `src/components/layout/Breadcrumb.tsx`, `src/lib/http/cache-policy.ts` (+test), `src/app/(frontend)/[locale]/layout.tsx`, `docker/Dockerfile` (comment only). `.claude/launch.json` ignored.

## Blast radius
- Every public page under `[locale]` (layout `generateMetadata`: metadataBase + non-prod noindex), and every future page that calls `buildPageMetadata` (L6-T01/04-08, L7-T03, L8-T03/04/05, L9-T01, L13-T03).
- `/robots.txt` in production and staging (crawl policy for the whole site, including `/api/media/file/*` images).
- CDN cache behavior for dotted paths (`robots.txt`, `sitemap.xml`, `llms.txt`, static files) when the request carries RSC headers or `_rsc`.
- Breadcrumb JSON-LD on every page that renders `Breadcrumb`.
- Prerendered `/vi` and `/en` HTML in the Docker image (build-time metadata).

## Verify commands + result
| Command (from `.context/project-config.md`) | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS, 99 files / 1029 tests |
| `pnpm build` | PASS. `/vi` and `/en` are SSG (`●`), `/robots.txt` is dynamic (`ƒ`), Proxy (middleware) present |
| `pnpm install --frozen-lockfile` | not re-run (lockfile untouched by diff) |

I did not start a server. The builder's `next start :3220` curl evidence was accepted only as corroboration. It is consistent with the code: the RSC rules are ordered after their base rules, and the prerendered HTML carries noindex until the first revalidation.

## Responsive Checklist Gate
N/A. The diff has no visual UI change: `Breadcrumb.tsx` only swaps its inline `<script>` for `<JsonLd>` and reads the site URL through `getSiteUrl()`. Markup, classes and CSS are unchanged. `JsonLd` renders only `<script type="application/ld+json">`.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, aislop not installed (`command -v aislop` empty) |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc.json`/`oxlint.json`). ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK. Names are clear, functions are under 50 lines and files under 300 lines, comments explain WHY, and indirection is at most 2 steps. Only 1 indicator: the magic literal `"VN"` (MINOR-2) |
| ai-friendly-web | N/A for this task. `robots.txt` lets AI crawlers in production. `sitemap.xml`/`llms.txt` belong to L8-T05 |
| blitzstrike | skip, not installed / no authorized environment |
| Security (manual) | OK. `serializeJsonLd` escapes every `<` as `<`, so `</script>` and `<!--` cannot break out (tested for all builders and via `JsonLd`). U+2028/2029 do not matter in a non-executed `application/ld+json` block. `seo.canonical` is limited to http(s) (rejects `javascript:`). `getSiteUrl` only accepts http(s) and keeps just the origin. There is no user-controlled HTML |
| Cache safety | OK. RSC `has` rules for `DOTTED_PATH_SOURCE` come after its base rule and before `/admin`. The comment and test title now say `no-store` (AC1). The test checks rule order per source |

## Acceptance criteria
| AC | Status | Evidence |
|---|---|---|
| 1. RSC no-store rules for DOTTED_PATH_SOURCE, ordered after base; comment/test title fixed | OK | `cache-policy.ts:67-69`, `cache-policy.test.ts:79-98` |
| 2. Absolute URLs taken at runtime, not the build-time localhost value | OK, with a side effect | `site-url.ts:15-26` (dynamic key, `NEXT_PHASE` guard). Side effect on noindex: see MAJOR-3 |
| 3. Meta title / description / OG image fallback chain | OK | `metadata.ts:59-72,107`, tests 58-99 |
| 4. hreflang vi/en/x-default→vi only when `hasEnglish` | OK | `metadata.ts:86-96`, tests 24-56 |
| 5. noindex for seo.noindex / forced pages / staging | **Partially wrong** | Forced pages emit `nofollow` (MAJOR-1). Production prerender emits noindex (MAJOR-3) |
| 6. JSON-LD valid schema.org + escape `</script>` | OK, with notes | Organization/Article/JobPosting/BreadcrumbList are valid. RealEstateListing has no rent unit (MINOR-1) |

## Findings

### [MAJOR-1] Forced noindex emits `nofollow`, which contradicts the documented `noindex, follow`
- `src/lib/seo/metadata.ts:117`: `robots: noindex ? { index: false, follow: false } : …` applies to `forceNoindex` too.
- `docs/DESIGN.md:305` (as-built): rented listings and expired job posts "vẫn mở trang …, gắn `noindex, follow`". AC5 covers exactly these pages. `nofollow` also stops link equity flowing to related listings on those pages.
- `metadata.test.ts:117-122` locks in the wrong behavior.
- **Fix:** `forceNoindex` (and, if the user agrees, `seo.noindex`) → `{ index: false, follow: true }`. Keep `follow: false` only for non-production. Update the tests.

### [MAJOR-2] Production `robots.txt` blocks every media image
- `src/lib/seo/robots.ts:9`: `disallow: ["/admin", "/api/"]`. Per `docs/ARCHITECTURE.md:196`, all uploaded images, including the `og` 1200×630 size, are served from `/api/media/file/<name>`.
- Effects:
  - Googlebot cannot fetch listing, article or OG images, so Google Images and image-based rich results are lost.
  - Twitterbot and LinkedInBot obey robots.txt, so share cards lose their images.
  - The `image` field in Article/RealEstateListing JSON-LD becomes uncrawlable.
- **Fix:** `rules: { userAgent: "*", allow: ["/", "/api/media/file/"], disallow: ["/admin", "/api/"] }`. Google and Bing use the longest match, so `/api/media/file/` wins. Add a test for it. Also tell L8-T05, whose AC44 says "chặn `/admin`, `/api`", to keep the media exception.

### [MAJOR-3] (Builder decision 2) Prerendered production HTML ships `noindex` and no canonical
- `src/app/(frontend)/[locale]/layout.tsx:26-32` calls `isIndexingAllowed()` (`site-url.ts:29-31`) during `next build`. `APP_ENV` is not set in `docker/Dockerfile`; it only comes from compose at runtime. So the `/vi` and `/en` HTML baked into the image contains `<meta name="robots" content="noindex, nofollow">` and no canonical. The `pnpm build` output confirms both pages are SSG.
- The ISR timeline makes this worse:
  - The first request after every production deploy is served the stale build-time HTML.
  - The response carries `public, s-maxage=60, stale-while-revalidate=300` (`cache-policy.ts:8`), so the CDN can keep serving the noindex page for several minutes after each deploy.
  - Every page that adds `generateStaticParams` later (L6 listings/projects) inherits the same problem.
- A noindex seen by Googlebot can drop pages from the index. This repeats on every deploy.
- **Ruling: must fix. A post-deploy warm-up alone is not acceptable.** A warm-up would have to bypass the CDN, hit every prerendered URL twice with a wait in between, and run before traffic switches. That is fragile and easy to forget.
- **Recommended fix:**
  1. During the build phase (`NEXT_PHASE === "phase-production-build"`), emit no robots directive from the layout or `shouldNoindex`. Use neutral metadata, the same approach as the existing site-URL guard.
  2. Enforce non-production noindex at runtime with `X-Robots-Tag: noindex, nofollow` set in the existing Proxy (middleware) from `APP_ENV`. It runs per request and is never baked in.
  3. Staging stays protected three ways: robots.txt `Disallow: /` (force-dynamic), the runtime header, and Cloudflare Access (`ARCHITECTURE.md:264`).
- Alternative if the user prefers: stop build-time prerender (`generateStaticParams` → `[]` with `dynamicParams`), so the first render happens at runtime with the real env. Canonical/OG would then also be correct from the first request.

### [MINOR-1] RealEstateListing offer has no rental unit
- `src/lib/seo/json-ld.ts` (`buildRealEstateListingJsonLd`, `offers`): rent is periodic, but the Offer has only `price`/`priceCurrency`.
- **Fix:** when L6 wires this up, consider `priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency, unitText: "MONTH" }` and `businessFunction: "http://purl.org/goodrelations/v1#LeaseOut"`. Non-blocking.

### [MINOR-2] Hard-coded `addressCountry: "VN"`
- `src/lib/seo/json-ld.ts` (`buildJobPostingJsonLd`, `jobLocation`): magic literal.
- **Fix:** a named const (e.g. `DEFAULT_COUNTRY = "VN"`), optionally also used for Organization `PostalAddress`.

### [MINOR-3] Small cleanup in `buildPageMetadata`
- `src/lib/seo/metadata.ts:123`: `nonEmpty(input.siteName)` is computed in `buildTitle` and again here, with an `as string` cast.
- **Fix:** compute `siteName` once and reuse it. Non-blocking.

## Rulings on builder-flagged decisions
1. **Minimal `src/app/robots.ts` (force-dynamic); sitemap/llms deferred to L8-T05: ACCEPTABLE.** L8-T05 AC44 already requires the `Sitemap:` line. Fix the media exception now (MAJOR-2) and carry it into L8-T05.
2. **Prerendered `/` and `/en` carry noindex and no canonical until first revalidation: MUST FIX (MAJOR-3).** A warm-up in `deploy.sh`/L6-T01 is not enough on its own because of the CDN `s-maxage`/`stale-while-revalidate` window and future SSG pages. Use the build-phase-neutral metadata plus a runtime `X-Robots-Tag` from the Proxy, or stop build-time prerender. Choosing between those two is a builder/user call. Leaving it unfixed is not an option.
3. **No default-OG-image field in site-settings; callers pass `defaultImage`, then the static logo: ACCEPTABLE.** It avoids a schema change and the fallback chain meets AC3. Revisit only if editors ask for a dedicated OG image.

## Residual risk
- No server was started by the reviewer, so runtime header and HTML behavior is checked by code/config reasoning plus the builder's curl evidence.
- schema.org validity was checked by reading the code against schema.org/Google docs. The Google Rich Results Test was not run.

## Verdict
**FAIL**: 3 MAJOR (MAJOR-1 noindex/nofollow vs DESIGN.md:305, MAJOR-2 robots.txt blocks `/api/media/file/`, MAJOR-3 build-time noindex on prerendered production pages). Return to builder.
