Agent: reviewer

# Review — build/tami-website · layer-5-task-06 · round 1

- Task: `tasks/tami-website/layer-5-task-06.md` (Thành phần trang dùng chung + 404/500 + G2 click-events)
- Scope: uncommitted diff vs HEAD `2607704` (tracked diff + untracked files listed by `git status --short -uall -- src`)
- Review level: **STRICT**
- Reason: shared components used by every public page (Breadcrumb/Pagination/EmptyState/PageBanner/FloatingContact/CategoryListTemplate), a public API endpoint's validation contract (`/api/public/click-events`), `ShellView` shape changed (shared type), and the route-level 404/500 boundaries. The task file also expects STRICT.

## Blast radius
- `ShellView` gets a required `floatingContact` field. Producers: `load-shell.ts` (updated). Test fixture `PublicShell.test.tsx` (updated). Typecheck passes, so no other producer was missed.
- `PublicShell` now renders `FloatingContact` (a client component) on every public page and sends beacons to `/api/public/click-events`.
- `clickEventBodySchema` is stricter: `refCollection` must now be one of 11 ERD collections, and `pagePath` rejects `//` and `/\`. No client sent `refCollection` before this change (FloatingContact only sends `type` and `pagePath`), so nothing currently calling it breaks.
- New route `[locale]/[...rest]` (ƒ dynamic, confirmed in build output, so no ISR cache-fill). It has the lowest route priority and does not shadow `/admin`, `/api/*` or the SSG `/vi` and `/en` pages.
- Layer-6 pages (S02–S10, S05) will use Breadcrumb, Pagination, EmptyState and CategoryListTemplate.

## Verify commands + result (from `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK (Done 1.7s) |
| `pnpm lint` | OK (eslint, 0 errors) |
| `pnpm typecheck` | OK (`tsc --noEmit`, exit 0) |
| `pnpm test` | OK — 93 files, 954 tests passed (matches builder claim) |
| `pnpm build` | OK, exit 0. Routes: `/[locale]/[...rest]` ƒ, `/vi` `/en` ● SSG, `/_not-found` ○ |

No server was started (the reviewer does not run the app).

## Acceptance criteria
| AC | Result | Evidence |
|---|---|---|
| Floating button bottom-right, Hotline/Zalo/Fanpage from `site-settings`; sendBeacon with correct `type`/`pagePath`; does not cover cookie banner | OK (cookie part depends on a contract, see R2) | `FloatingContact.tsx:35-101`, `shell-data.ts:156-169` (http(s)-only, `tel:`), `load-shell.ts:60`. Tests `FloatingContact.test.tsx:28-49` decode the Blob body: `{type:"zalo", pagePath:"/en/for-rent"}`. Bottom offset is `var(--floating-bottom-offset,0px)` (`FloatingContact.tsx:46`) |
| Breadcrumb has JSON-LD `BreadcrumbList` | OK | `Breadcrumb.tsx:60-65`, `json-ld.ts:11-27`. Absolute URLs, positions start at 1, `<` escaped to `<` |
| Pagination has `aria-current` and real links | OK | `Pagination.tsx:53-60` (`<Link href>` for every page, current page is a `span aria-current="page"`), `rel=prev/next` on the step links |
| Empty state has a clear-filters button | OK | `EmptyState.tsx:30-34` (real link `clearFiltersHref`), plus "Nhận tư vấn" link and the `empty` variant with a back link (§3.9) |
| 404 and 500 in the current language, linking to that language's home | OK in browser (SSR caveat, see R1) | `not-found.tsx` (resolveNavLink per locale, noindex), `[...rest]/page.tsx` → `notFound()`, `error.tsx` (i18n + digest + reset + localized home link), `global-error.tsx` (self-contained bilingual page, NEXT_PUBLIC_HOTLINE). Tests `not-found.test.tsx` cover EN with no Vietnamese text, `/en` links and the catch-all throwing a 404 digest |
| G2 follow-up: refCollection limited to ERD collections, pagePath rejects "//" | OK | `click-events.ts:12-21`, `click-types.ts:10-22`. Tests `click-events.test.ts:58-60`. `.trim()` runs before the refine, so `"  //x"` is also rejected |

Required tests: the RTL Zalo beacon test exists, the Pagination href test exists (`Pagination.test.tsx`), and the "/en/khong-ton-tai → EN 404" test exists as unit-level (catch-all throws the 404 digest plus EN render). It is not a real HTTP integration test (see R1).

## Design-spec conformance
- §2.5: safe-area offsets, 48px circles, colors, mobile collapse with `aria-expanded`/`aria-controls`, and buttons hidden when a link is missing all conform. The spec's `refCollection?/refId?` beacon fields are not supported by the component props (MINOR-1).
- §2.6: `nav[aria-label]`, `ol`, last item `aria-current` and not a link, `CaretRight` 12px `aria-hidden`, mobile "← parent" when more than 3 items, JSON-LD all conform.
- §2.7: image variant `clamp(240px,42svh,440px)` with scrim and centered h1; text variant `bg-alt` with watermark at ≥ md and `60ch` description. Conforms.
- §3.6: first/last/±1/…, labelled Prev/Next, mobile "Trước · Trang x/y · Sau". Conforms. "Scroll to top of grid" happens naturally on full navigation.
- §3.9: filtered and empty variants conform. Partial-load error and toast belong to other tasks.
- S05: banner → breadcrumb → chips (`aria-current`) → grid/empty → pagination. Conforms. Data, SEO and the EN 404 are explicitly left to the route.
- S17: copy, buttons (Dark/Outline), quick links, noindex conform. The EN "available in Vietnamese" line is optional per spec ("chỉ khi xác định được bản VI tương ứng; nếu không thì bỏ"), so omitting it is compliant.
- S18: error.tsx and global-error.tsx content conform, with GlitchTip reporting via `reportClientError` and no stack shown.

## Responsive Checklist Gate (diff touches UI; widths 375 / 768 / 1280; verified by CSS math, no browser)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375 | OK | All containers are `w-full max-w-container px-gutter`. Breadcrumb `ol` and chips use `flex-wrap`. At 375, mobile Pagination is Prev (~90px) + status + Next (~80px), well under 375. FloatingContact is `fixed`. The watermark is `hidden md:block` inside `overflow-hidden isolate` (decorative clipping only, not hiding a layout bug) |
| Mobile-first (`min-width`) | OK | Only `md:` (min-width) variants are used |
| Grid uses auto-fit/minmax | N/A | The template does not own the grid (children are passed in) |
| Container not fixed px | OK | `max-w-container` token. Banner height uses `clamp()` |
| Font in rem / fluid heading | OK | Token classes `text-h1`/`text-small`/`text-lead` (from layer-1 tokens) |
| Media `max-width`/`aspect-ratio`/`sizes` | OK | PageBanner uses the existing `ResponsiveImage` with `sizes="100vw" priority decorative` |
| Touch target ≥ 44×44 | OK | Floating `size-12` (48px). Pagination cells `min-h-11 min-w-11`. Breadcrumb links, chips and 404 quick links `min-h-11`. global-error buttons `minHeight/minWidth 44` |
| Nav on mobile | OK | Floating group collapses to one toggle < md. Breadcrumb collapses to "← parent" when more than 3 items |
| Table | N/A | no table |
| 100vh | OK | `100dvh` (global-error), `42svh` (banner). No bare `100vh` |
| prefers-reduced-motion | OK | Only `transition-colors` with token durations. No movement animation |
| aria-current / nav labels | OK | Breadcrumb, Pagination, chips. `aria-label` comes from i18n |
| /en has no Vietnamese text | OK | All `page.*` strings in en.json are English. `not-found.test.tsx:16-23` regex check |

Not verified in a browser: the real rendering at 375/768/1280. CSS math shows no overflow risk.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip — `aislop` is not in the allowed verify-command set for the reviewer (Bash is limited to profile commands and git). Manual slop scan: no dead code, no placeholder copy, comments explain why (not what) |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc*`). eslint passes |
| ocr (open-code-review) | skip, ocr not installed / not in the allowed command set |
| AI-readable | OK — 0 hard indicators. All new files are under 110 lines and functions under 50 lines; names are explicit; indirection is 1–2 steps. Soft note: `EmptyState.tsx:28` `(description ?? filtered) &&` is terse (MINOR-4). Below the threshold of 3 |
| ai-friendly-web | N/A — shared component task. robots/sitemap/llms.txt belong to the SEO task |
| blitzstrike | skip — no allowed runtime environment. Static security review below |

## Security review
- JSON-LD: `serializeJsonLd` escapes `<` (blocks a `</script>` breakout). Data is `JSON.stringify`'d. CMS labels are safe. OK.
- Floating links: `isHttpUrl` blocks `javascript:` (test `shell-data.test.ts:128-135`); `tel:` comes from `toTelHref`; external links use `rel="noopener noreferrer"`. OK.
- Beacon body: only `type` (typed `ClickType`) and `pagePath` (sliced to 500). No PII. Errors are swallowed. OK.
- Endpoint: the zod enum for refCollection removes junk rows. `//` and `/\` are rejected. pagePath is stored only, never used as a redirect target, so there is no open redirect. MAX_BODY_CHARS and the rate-limit pipeline are unchanged. OK.
- Error pages: no stack, only the digest. noindex on 404 and global-error. OK.

## Builder residual risks — ruling
- **R1 (404/500 SSR HTML is an empty `__next_error__` shell, localized only after hydration): ACCEPTABLE for this task, must be logged as a follow-up.** This is plausible and consistent with how Next handles a `notFound()` that escapes the shell when the root layout is the dynamic `[locale]/layout.tsx` (there is no `app/layout.tsx`). The reviewer could not verify it, because running the app is outside reviewer permissions. Why it is not blocking: HTTP status 404 and noindex are correct, the AC ("hiện đúng ngôn ngữ… có link về trang chủ") is met in a real browser, and S17/S18 have no no-JS requirement. Required action at close-out: record it in the task Residual risk and in the gap register / layer-5 spec-validation as a follow-up. Candidate fixes: next-intl's documented pass-through `app/layout.tsx` plus `app/not-found.tsx`, or `experimental.globalNotFound`. It also affects the invalid-locale `notFound()` at `layout.tsx:28`. This is not a user decision now; surface it at the layer checkpoint.
- **R2 (no cookie banner yet; avoidance via `--floating-bottom-offset`): ACCEPTABLE.** The contract is clear and tested (`FloatingContact.test.tsx:80-83`). Follow-up: the cookie-banner task (§3.10) and the sticky price bar (§2.5 last bullet, §4.7) must set this variable. Add a note to those task files.
- **R3 (no "available in Vietnamese" line; CategoryListTemplate has no test): ACCEPTABLE.** S17 explicitly says to omit the line when the VI counterpart cannot be determined. CategoryListTemplate is pure composition of tested parts. A dedicated test is MINOR-5 and can come with the layer-6 S05 route tests.

## Findings
### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
1. `src/components/layout/FloatingContact.tsx:18,35`: §2.5 specifies a beacon `{type, pagePath, refCollection?, refId?}`, but the component cannot receive a ref. Detail pages in layer 6 (rentals/projects) will need it for per-listing stats. Fix: add optional `ref?: {collection: ClickRefCollection; id: string}` prop/context, passed into `sendClickBeacon`. It can be done in the layer-6 detail task. Note it there.
2. `src/components/layout/FloatingContact.tsx:21`: the Blob uses `type: "application/json"`, which is not a CORS-safelisted type for `sendBeacon`. That is fine same-origin, but some browsers have historically rejected or preflighted it. The comment itself says the endpoint reads text. Fix: use `text/plain;charset=UTF-8`.
3. `src/lib/seo/json-ld.ts:19`: `new URL(entry.href, siteUrl)` throws if `NEXT_PUBLIC_SITE_URL` is malformed, which would break every page that has a breadcrumb. The env is operator-controlled, so risk is low. Fix: validate once with try/catch and skip the JSON-LD on failure.
4. `src/components/layout/EmptyState.tsx:28`: `(description ?? filtered) &&` is a terse boolean/string mix. Fix: `const desc = description ?? (filtered ? t("filteredDescription") : undefined)`.
5. `src/components/templates/CategoryListTemplate.tsx`: no dedicated test. Cover it with the layer-6 S05 route test (chips `aria-current`, empty variant goes to `parentListHref`, pagination hidden when empty).
6. `src/components/layout/Pagination.tsx:43`: `aria-live="polite"` on server-rendered status text has no effect, because a page change is a full navigation. Harmless; can be removed.
7. `src/lib/click-stats/click-types.ts:10`: the comment cites "ERD §3", while the task note cites ERD §2. The reviewer did not cross-check the 11 slugs against `docs/ERD.md` (read-tool cap). Confirm the list at layer spec-validation.

## Residual risk
- R1 is not verified at the HTTP level (no app run). No real browser check was done at 375/768/1280.
- `error.tsx` is a client boundary and cannot export metadata. Whether Next injects `noindex` on the 500 response was not verified (the status code is 500 either way).
- The read-tool cap (25) was reached. `Breadcrumb.test`, `Pagination.test`, `EmptyState.test`, `error.test` and `json-ld.test` were not read individually; they are covered by the passing `pnpm test`.

## Verdict
**PASS** — no CRITICAL or MAJOR findings; all 5 ACs plus the G2 follow-up are met; all verify commands pass. MINOR items and the R1/R2 follow-ups should be recorded at close-out (task Residual risk and gap register / next-task notes).
