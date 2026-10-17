Agent: reviewer

# Review: build/tami-website layer-6-task-07, round 1 (Dịch vụ S14, Liên hệ S15 chưa có form, Pháp lý S16)

- **Review level:** STRICT
- **Reason:** The task file expects NORMAL, but the diff touches shared pieces: `RichText` (used by every content page), `src/proxy.ts` → `resolve-missing-page.ts` (404 routing), `public-queries.ts` (new public query `findPublicOne`), the build pipeline (`package.json` dev/build, `.gitignore`, `eslint.config`, `vitest.config`), `LazyMap`, and `Header`/`Footer`/`FloatingContact`.
- **Scope:** uncommitted diff against HEAD `57d43bc`. Ignored: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`.
- **Blast radius:**
  - Every page that renders `RichText`: news detail, services, legal.
  - Proxy 404 for `/dich-vu/*`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` and their EN equivalents.
  - `findLocalizedSlugs` now also accepts `services`.
  - `toOgImage` moved into `metadata.ts`.
  - The shell (header, footer and floating button get `print:hidden`; `SocialLinks` is now exported).
  - `LazyMap` (worker URL) and the `pnpm dev` / `pnpm build` scripts.
  - Docker and CI, through `pnpm build`.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | skip. The diff only changes `scripts` in package.json; no dependency or lockfile change. |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 128 files, 1,383 tests, exit 0, **on the first run**. The 3 integration `beforeAll` failures the builder reported did NOT come back. The stack trace in the log comes from a test that expects an error (`rentals.test.ts`). Flakiness: not reproduced. |
| `pnpm build` | PASS (exit 0). The copy script ran first, and `public/vendor/maplibre/{maplibre-gl-worker.mjs, maplibre-gl-shared.mjs}` exist. `/[locale]/dich-vu/[slug]`, `lien-he`, `chinh-sach-bao-mat`, `dieu-khoan-su-dung` are `●` (ISR). |

## Acceptance criteria and follow-ups

| Item | Result | Evidence |
|---|---|---|
| AC1: legal route fixed by `kind`; `version` + `effectiveDate`; EN only when `hasEnglish` | OK | `LegalPage.tsx:44` ("Phiên bản · Hiệu lực từ"). `legal-page.ts:17` uses `findPublicOne` + `publicWhere`, so `/en` requires `hasEnglish=true`. Proxy rules at `resolve-missing-page.ts:61-62`. Tests: unit `resolve-missing-page.test.ts` ("EN chưa duyệt → 404 EN") and integration `services-pages.test.ts:828` (draft / EN not approved / soft-deleted → null). hreflang `en` only when `hasEnglish` (`LegalPage.tsx:28`). The language switcher always sends users to the other locale's home page, which matches S16 / FR-PUB-19. |
| AC2: contact page shows hotline/email/address/lazy map from `site-settings.mapLocation`, plus `LeadFormSlot` | OK (map rendering NOT verified, see M1) | `lien-he/page.tsx:66-86`. `contact-view.ts:24-29`: point is `[lng,lat]`; an invalid value gives `null`, which hides the whole map block. `LeadFormSlot` has `id="lead-form"`. Test `lien-he/page.test.tsx` (no mapLocation → map hidden). |
| AC3: services hero uses `coverImage`; CTA banner at the end | OK | `dich-vu/[slug]/page.tsx:97-108` (falls back to a text banner when there is no cover). `CtaBanner` links to `/lien-he?service=<slug>` (encoded). "Dịch vụ khác" shows 2 cards in a 2-column grid from md. JSON-LD `Service` + escaped serialize. |
| L6-T03 follow-up: 404 with content | OK | New rules in `MISSING_PAGE_RULES`. A rule without `param` matches the exact URL (unit tests cover `/en/chinh-sach-bao-mat`, `/chinh-sach-bao-mat/x` → no match). The builder's curl evidence showed 404 + h1 + header/footer + noindex. |
| L6-T06 follow-up: RichText `break-words`, table `role=region` + label, `doc` link | OK | `RichText.tsx:348`, `:226-231`, `doc-link.ts`. Tests in `RichText.test.tsx`. On legal pages the link stays plain text (m4). |
| RichText `doc` link: no draft leak | OK | Lexical populates the linked doc with `overrideAccess:false` (`guestReadOptions`), so a guest's `access.read` (`buildPublicWhere`: status + soft delete) filters out draft, hidden and soft-deleted docs, which stay as unpopulated ids and render as text. `/en` additionally requires `hasEnglish === true` (`doc-link.ts:29`). Collections without a public page return null. |
| i18n: no Vietnamese on /en | OK | New `en.json` keys are all English. Working hours come from i18n. `fallbackLocale:false` on queries. |
| a11y | OK | One `h1` (PageBanner or hero). The TOC uses native `<details>`/`<summary>` (min-h-11). From xl the sticky `nav` is `top-24` and headings have `scroll-mt-24`. Two navs share the same label, but one is always `display:none`. The hotline link has an aria-label. Table regions are labelled. |
| Print | OK | `print:hidden` on Header, Footer, FloatingContact, CtaBanner and TOC. CookieBanner already had `print:hidden`. |

## Out-of-task fix: MapLibre worker

- **Docker:** `docker/Dockerfile:44` runs `pnpm build`, so the copy step runs. The runner stage copies `public` from the builder after the build (`Dockerfile:63`). OK.
- **CI:** `.github/workflows/ci.yml:95` runs `pnpm build`. OK. No other place calls `next dev` or `next build` directly; there is no playwright or compose file that bypasses the script.
- **Version:** `maplibre-gl` is pinned exactly at `6.11.2`. The package `exports` has no development condition, so dev and prod use the same `dist/maplibre-gl.mjs`. The worker is a module worker (`new Worker(e,{type:'module'})`) and imports only `./maplibre-gl-shared.mjs`. Both files are copied from the same node_modules, so they always match the installed version. OK.
- **Cache:** see m2. `/vendor/maplibre/*.mjs` falls under the `DOTTED_PATH_SOURCE` rule (short CDN TTL + SWR, unversioned name).
- **CSP:** there is no CSP today (grep found nothing in next.config/proxy). L14-T01 will need a follow-up, see m3.

## Responsive Checklist Gate

There was no browser in the review environment, so these were checked by CSS math. The builder also reported a browser check at 375/768/1280.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Contact page is one column on mobile, `lg:grid-cols-12` from lg. Legal page is one column, `xl:grid-cols-[15rem_minmax(0,48rem)]` only from xl. RichText has `break-words [overflow-wrap:anywhere]`. Email uses `break-all`. |
| Mobile-first `min-width` | OK | Only `md:`/`lg:`/`xl:` prefixes are used. |
| Grid `auto-fit`/`minmax`, no fixed container width | OK | "Dịch vụ khác" is 1→2 columns per design-spec. The fixed 240px sidebar at xl is intentional (S16). Containers use `max-w-*` tokens. |
| Typography rem / fluid | OK | Uses tokens `text-display`/`text-h1`/`text-h2`/`text-lead`; no raw px font sizes. |
| Spacing scale | OK | `py-section(-tight)`, `px-gutter`, `gap-*`. |
| Media | OK | Hero uses `ResponsiveImage` with `sizes="100vw"` + priority. Map aspect ratio comes from `LazyMap` (L2-T08). |
| Touch target ≥44px | OK | TOC links and summary `min-h-11`, hotline `min-h-14`, email `min-h-11`, CTA `size="lg"`. |
| Nav on mobile | N/A | No new nav (the shell is unchanged apart from `print:hidden`). |
| Table scroll wrapper | OK | Wrapper is `tabIndex=0`, `role=region`, `aria-label`. |
| Viewport units | OK (m5) | Hero `h-[60svh] lg:h-[70svh]` uses svh rather than vh, but has no vh fallback. |
| prefers-reduced-motion | OK | No new animation, only `transition-colors`. |
| No `overflow:hidden` hiding bugs | OK | `overflow-hidden` is used only on the hero to crop the image. |

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip, aislop not installed (not in PATH or `node_modules/.bin`) |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc*`). ESLint passes. |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK, 1 indicator found, below the FAIL threshold of 3. `renderNode` in `RichText.tsx` is about 58 lines; it was already near 50 before this task and the diff adds 1 line. All files are ≤300 lines. Comments explain WHY. ARCH §5.1 is updated (as-built). |
| ai-friendly-web | N/A. robots/llms/sitemap belong to the SEO task. This task does not change crawler rules. |
| blitzstrike | skip, no tool / no allowed environment. No new auth or input surface; public read-only pages. |

## Findings

### CRITICAL
None.

### MAJOR
None.

### MINOR

**M1. Map rendering in the production build is NOT verified.**
- Where: `src/components/media/LazyMap.tsx:456` (`setWorkerUrl`).
- Problem: the unit test only asserts that `setWorkerUrl` is called with the right path. Neither the builder nor the reviewer saw the map draw tiles, and the reviewer has no browser tool. Worst case, the map stays broken exactly as before (the bug predates this task, from L2-T08), so this is not a regression.
- Suggested fix: the primary checks visually in a browser (`next start`: the request to `/vendor/maplibre/maplibre-gl-worker.mjs` returns 200 with a JS content-type, the `.mjs` files load, the canvas draws OSM tiles), or add an e2e test that waits for a tile request. Record the result in the task file before close-out.

**m2. Worker URL is unversioned while the main bundle is hashed.**
- Where: `LazyMap.tsx:448`, `scripts/copy-maplibre-worker.mjs:9`.
- Problem: after a maplibre upgrade, the CDN can keep serving the old worker during the short TTL plus the `stale-while-revalidate` window. The new main chunk would then talk to the old worker and the map could break for a few minutes. The risk is low because the version is pinned exactly.
- Suggested fix: copy into `public/vendor/maplibre/<version>/` (read from `maplibre-gl/package.json`) or add `?v=<version>`. Optionally add an `immutable` cache rule for `/vendor/*` that runs after `DOTTED_PATH_SOURCE`.

**m3. CSP follow-up for L14-T01.**
- Where: n/a (no CSP exists yet).
- What the CSP will need:
  - `worker-src 'self'`: a same-origin module worker; `blob:` is not needed since the URL is set.
  - `script-src 'self'`: covers the worker importing `maplibre-gl-shared.mjs`.
  - `connect-src https://tile.openstreetmap.org`: tiles are fetched inside the worker.
  - `img-src` as appropriate.
- Suggested fix: add these to the L14-T01 task file.

**m4. Internal links in legal content always render as plain text.**
- Where: `src/lib/legal/legal-page.ts:17` (`depth: 0`).
- Problem: with depth 0 the link `doc` is never populated, so `resolveInternalDocHref` returns null. This is safe (no leak), but the L6-T06 follow-up "doc link renders a real link" does not apply to legal pages.
- Suggested fix: use `depth: 1`. Population goes through guest `access.read`, so it stays safe.

**m5. Hero has no fallback for browsers without `svh` support.**
- Where: `dich-vu/[slug]/page.tsx:98` (`h-[60svh]` / `lg:h-[70svh]`).
- Problem: browsers that don't support `svh` (Safari before 15.4) ignore the height. It degrades gracefully: the hero just becomes content height.
- Suggested fix: add `h-[60vh] supports-[height:100svh]:h-[60svh]` or an equivalent.

**m6. Legal pages have no meta description.**
- Where: `src/components/legal/LegalPage.tsx:23-30`.
- Problem: `buildLegalMetadata` does not pass `description`.
- Suggested fix: use `seo.description` if present, or the version line.

**m7. Long render line in `RichText`.**
- Where: `src/components/content/RichText.tsx:348`.
- Problem: the context object is built inline on a line of more than 200 characters.
- Suggested fix: move it into a `const ctx` before the return. Readability only.

## Residual risk

- Map: worker load and tile drawing not confirmed in a browser (M1).
- Map privacy: OSM tile requests start when the map enters the viewport (`rootMargin: 200px`), before any consent. This behaviour predates the task (L2-T08), and SPEC does not require consent for the map. Out of scope; propose a separate task if the legal team wants it gated on interaction.
- Integration flakiness: the builder saw it once; it did not reproduce in this review run. Keep watching.
- Responsive and design checks were done by CSS math plus the builder's browser evidence; the reviewer could not verify them visually.

## Verdict

✅ PASS: no CRITICAL or MAJOR findings, and all AC items and follow-ups are met. Before close-out, the primary should confirm the map visually or record that it was not verified (M1), and add m3 to L14-T01.
