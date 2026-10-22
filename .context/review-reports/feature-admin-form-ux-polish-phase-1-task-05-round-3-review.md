Agent: reviewer

# Review — admin-form-ux-polish / phase-1-task-05 / round 3

- Review level: **NORMAL**
- Reason: Admin SEO preview/form behavior; no schema or public API changes, but preview must match metadata on multiple public routes.
- Blast radius: `src/components/admin/SeoPreview.tsx`, `src/lib/admin/seo.ts`, shared SEO field configuration, and preview on six content collections, legal pages, and homepage.

## Verify commands + result

- `pnpm exec vitest run --project unit src/lib/admin/seo.test.ts src/components/admin/SeoPreview.test.tsx src/fields/seo.test.ts` — **PASS**, 31 tests.
- Reported evidence from main session: `pnpm vitest run --project unit --project ui` — **3335/3335 PASS**; `pnpm typecheck` PASS; `npx eslint src tests` 0 errors; `pnpm build` PASS. Not rerun here.
- Integration/browser screenshots — **BLOCKED**, reported Postgres 5433 down and Docker daemon off; not treated as a code failure.

## Responsive Checklist Gate

Applicable: admin UI changes. Static CSS inspection only; no browser verification available at 375/768/1280.

| Item | Result | Evidence |
|---|---|---|
| Layout / overflow | OK (static) | New preview uses normal flow, wrapping text (`overflow-wrap:anywhere`); no fixed-width container/grid. Actual `scrollWidth ≤ clientWidth` remains unverified. |
| Mobile-first / grid / container | OK | No grid or fixed-width layout added. New ≤640px rule only reduces card padding; base styles apply otherwise. |
| Typography / spacing | OK (static) | New font sizes use `rem`; spacing uses 8/10/12/14/16px increments. No new heading style. |
| Media / images | N/A | No media added; sharing-image preview option is out of scope. |
| Touch / interaction | N/A | No new interactive controls, navigation, or tables. |
| Viewport / accessibility | OK (static) | No viewport-height or motion rules; preview is a labelled section. Browser/assistive-technology behavior not verified. |

Residual risk: no browser evidence at 375/768/1280 or requested 1440/390 screenshots; overflow and rendered visual behavior remain unverified.

## Skill gates

- `aislop`: **skip — CLI unavailable**; `aislop scan --changes --json` returned command-not-found, no score.
- `oxlint`: **skip, oxlint not configured**; config/tool availability check was blocked by shell permission.
- `ocr`: **skip — unavailable/unverified**; shell permission denied while checking tool availability; no review run.
- AI-readable: **OK** — names/flow are traceable and helper/component files have distinct responsibilities; no ≥3 chaos indicators identified. No principal architecture/workflow documentation change.
- AI-friendly-web: **N/A** — private admin UI; not public-facing.
- Blitzstrike: **N/A** — no new endpoint or sensitive security surface.
- Impeccable/frontend checklist: **N/A** — internal admin interface; responsive gate above applies.

## Findings

### [MAJOR] Homepage preview omits the public metadata title/description fallbacks

- `src/components/admin/SeoPreview.tsx:33-41,66-68`
- Homepage `generateMetadata` supplies translated `t("title")` and `t("description")` (`src/app/(frontend)/[locale]/page.tsx:19-25`), while the admin global has no `title` form field or route description field. When `seo.metaTitle` / `seo.metaDescription` are blank, this component therefore renders generic placeholders instead of the actual homepage metadata fallback. The existing homepage test covers only a non-empty `seo.metaTitle`, so it misses this parity regression.
- Suggested fix: resolve the homepage translated title/description using the same locale resources or another shared source used by public metadata, and add an empty-SEO homepage test asserting those fallback values.

## Residual risk

- `hasEnglish` handling now correctly treats only `true` as available for collection records, so undefined/false uses the Vietnamese path; homepage is explicitly treated as bilingual; legal pages use fixed localized paths. Locale `all` normalizes to Vietnamese. Tests cover true/false/undefined helper cases and legal/home path cases.
- Title suffix and route description fallbacks match inspected `buildPageMetadata` rules for ordinary content routes; tests assert concrete expected results, not merely helper self-consistency.
- Integration/browser validation and screenshots remain blocked/unverified as noted above.

## Verdict

❌ **FAIL** — homepage blank-SEO preview does not represent public metadata title/description.
