Agent: reviewer

# Review — admin-form-ux-polish / phase-1-task-05 / round 2

- Review level: **NORMAL**
- Reason: Admin UI change without schema/API/auth modification; preview is shared across content form types and must represent public metadata accurately.
- Blast radius: `src/lib/admin/seo.ts`, `src/components/admin/SeoPreview.tsx`, SEO fields in Payload admin, and previews for six content collections, legal pages, and homepage. No change to public metadata implementation.

## Verify commands + result

- `pnpm exec vitest run --project unit src/lib/admin/seo.test.ts src/components/admin/SeoPreview.test.tsx` — **PASS**, 25 tests.
- Reported evidence from main session: `pnpm typecheck` PASS; `npx eslint src tests` 0 errors; `pnpm vitest run --project unit --project ui` 3334/3334 PASS; `pnpm build` PASS. These commands were not rerun for this review.
- Integration/browser screenshots — **BLOCKED** per supplied evidence: Postgres unavailable and Docker daemon off. No manual app repro performed.

## Responsive Checklist Gate

Applicable (UI project and changed UI). No browser environment/evidence provided for this round; static inspection only.

| Item | Result | Evidence |
|---|---|---|
| Layout / overflow | N/A | Preview component content and prior round's stylesheet changes reviewed; no browser `scrollWidth` check at configured 375/768/1280 widths. No new fixed-width layout in the preview component. |
| Mobile-first / grid / container | N/A | Preview component adds no grid or fixed-width container. Full stylesheet responsive behavior not browser-verified. |
| Typography / spacing | N/A | Preview component introduces no CSS typography/spacing rules; stylesheet changes not rendered at all breakpoints. |
| Media / images | N/A | No images/video; option C explicitly out of scope. |
| Touch / interaction | N/A | No new touch controls, navigation, or table. |
| Viewport / accessibility | N/A | No viewport sizing or motion. Section has accessible label; dynamic behavior not browser-tested. |

Residual risk: responsive rendering/horizontal overflow at 375/768/1280 remains unverified because no browser screenshots/runtime evidence are available.

## Skill gates

- `aislop`: **skip — not run**; no result supplied for `aislop scan --changes --json`.
- `oxlint`: **skip, oxlint not configured**; scoped glob found no oxlint config.
- `ocr`: **skip, ocr not installed/verified**; not run.
- AI-readable: **OK** — inspected new helper/component/tests; descriptive names and direct flow, no three AI-chaos indicators identified; no principal workflow/documentation change.
- AI-friendly-web: **N/A** — private admin interface, not public-facing.
- Blitzstrike: **N/A** — no new public endpoint or sensitive security surface.
- Impeccable/frontend checklist: **N/A** — internal admin, responsive gate above applies.

## Findings

### [MAJOR] English preview invents a translated URL when the English translation does not exist

- `src/components/admin/SeoPreview.tsx:41-46`; `src/lib/admin/seo.ts:107-116`
- The helper always constructs the selected locale URL using the current form slug. Public detail metadata only includes `paths.en` when `doc.hasEnglish === true` and a localized English slug exists (e.g. `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:62-74`). In the absent-English case, public metadata does not claim that English URL; the preview still displays `/en/news/<slug>` while the editor is in English (or when an `all` locale is normalized to vi, it cannot tell that no translation exists). This violates the accepted preview-vs-real metadata requirement and can show a URL that resolves to no public page.
- Suggested fix: determine translation availability using the same document state/rules as the public route (`hasEnglish` plus actual localized slug) and suppress/fallback consistently when unavailable; add a component test for absent English translation and for `all` locale behavior.

## Verdict

❌ **FAIL** — the parity logic and route mapping were substantially added and the scoped tests pass, but the preview can still advertise a nonexistent translated URL. Reported full verification is positive; browser evidence remains residual risk, not the finding basis.
