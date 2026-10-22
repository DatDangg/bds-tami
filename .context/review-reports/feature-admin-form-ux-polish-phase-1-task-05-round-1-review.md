Agent: reviewer

# Review — admin-form-ux-polish / phase-1-task-05

- Review level: **NORMAL**
- Reason: Task is an admin UI change with no intended schema/migration/API change; shared SEO configuration and preview logic create broader content-form impact, but no red-risk category requires STRICT.
- Blast radius: `src/fields/seo.ts`, shared content-field placement in `src/collections/_shared/content-defaults.ts`, SEO preview/counter components and styles, Payload admin import map, and admin label guardrail. Public metadata behavior is read-only and must remain unchanged.
- Scope: approved option B. No observed edits to `src/lib/seo/**`, specs, or progress state in the task diff. No migration artifact observed.

## Verify commands + result

- `pnpm typecheck` — **Blocked**: shell execution permission denied; could not independently run.
- `npx eslint src tests` — **Blocked**: shell execution permission denied; could not independently run.
- `pnpm vitest run --project unit --project ui` — **Blocked**: shell execution permission denied; could not independently run.
- Builder journal records unit+ui 3317/3317 PASS, typecheck PASS, eslint 0 errors; this is reported evidence only, not independently verified.
- Integration/build — **BLOCKED** per task context: Postgres `127.0.0.1:5433` unavailable and Docker daemon off; not counted as code failure.
- Admin screenshots at 1440/390 — **BLOCKED** for same DB environment. No 1440/390 screenshots available; visual layout remains unverified.
- Diff/status reviewed. There are unrelated-to-this-task worktree changes (`src/payload-types.ts`, run journal, and import map may be shared); review finding below concerns only the SEO changes.

## Responsive Checklist Gate

Applicable: project has UI and diff changes UI. No browser verification possible; CSS/math inspection only.

| Item | Result | Evidence |
|---|---|---|
| Layout / overflow | N/A (not fully verifiable) | Preview uses wrapping (`overflow-wrap:anywhere`) and mobile padding rule; no fixed-width container added. No screenshot or browser scroll-width check at 390/1440. |
| Mobile-first / grid / container | N/A | No grid or fixed-width container introduced; only a `max-width:640px` enhancement is added, not mobile-first `min-width`. |
| Typography / spacing | OK | New text sizes use `rem` (0.8125/0.875/1.0625rem); margin/padding are fixed spacing values; there is no heading requiring `clamp()`. |
| Media / images | N/A | No image/video preview added; explicitly excludes option C. |
| Touch / interaction | N/A | No new buttons/nav/table interaction; collapsible is Payload native. |
| Viewport / accessibility | N/A | No viewport sizing, animation, or overflow hiding introduced. `aria-label` is present on preview section and counters use `aria-live="polite"`. |

Residual risk: no browser, no 1440/390 screenshots; actual Payload-rendered component sizing and horizontal overflow unverified.

## Skill gates

- `aislop`: **skip — blocked**; required `aislop scan --changes --json` could not run because shell permission denied. Code inspection found no obvious swallowed errors, `as any`, dead code, or TODO stub; score unavailable.
- `oxlint`: **skip, oxlint not configured** (no configuration evidence found during this scoped review; shell unavailable to run).
- `ocr`: **skip, ocr not installed / unavailable**; cannot check installation or run CLI because shell denied.
- AI-readable: **OK** — new components/helpers have descriptive names and simple direct flow; no ≥3 chaos indicators observed; no main application flow/documentation change.
- AI-friendly-web: **N/A** — private admin form, not public-facing web surface.
- Blitzstrike: **N/A** — no new public endpoint or sensitive security surface; task is UI-only.
- Impeccable / frontend checklist: **N/A for public site**; admin UI craft is checked via responsive checklist above, with screenshots blocked.

## Findings

### [MAJOR] Preview does not represent actual generated metadata

- `src/lib/admin/seo.ts:90-96` and `src/components/admin/SeoPreview.tsx:32-38,44-46`
- `buildPageMetadata` appends the site name to the title when absent (`src/lib/seo/metadata.ts:68-71`), and always computes a canonical URL from the current page path when a custom canonical is absent (`metadata.ts:73-79`). The preview instead truncates the bare title and shows a literal `duong-dan-trang` placeholder when canonical is empty/invalid. Thus the central Google preview cannot match real `<title>` and URL on the common empty-canonical path, contrary to approved B's preview intent and requirement to match metadata behavior. The implementation also claims title/description fallback parity but uses one generalized excerpt→summary→rich-description order for all forms, rather than each route's actual `description` input.
- Suggested fix: supply the effective public URL and site name to the preview (or explicitly scope the UI as an approximation and revise acceptance before approval); derive description fallback based on the current collection/global’s actual metadata input mapping. Add tests for absent canonical/site-name suffix and representative per-collection fallback mappings.

### [MAJOR] Test suite does not establish parity for the seven collections and Homepage

- `src/components/admin/SeoPreview.test.tsx:17-48`
- Current tests cover a generic excerpt, generic rich-text description, explicit SEO values, canonical accepted/rejected, and empty state. They do not test the required seven collection + Homepage mapping or actual `buildPageMetadata` output; the implementation is a separate reimplementation. The failed-parity behavior above is therefore not caught. Tests for canonical only verify the supplied URL/rejection, not fallback to the real page canonical.
- Suggested fix: cover each actual route's input-field mapping and site-name/canonical output contract, with expected values derived from route metadata inputs (not by asserting the helper against itself).

### [MINOR] New code/test verification not independently runnable

- Worktree overall; command execution blocked by permission denial.
- Required configured verification commands could not be executed by reviewer; reported builder results cannot substitute for independent verification under review policy.
- Suggested fix: rerun required commands in an authorized environment and attach output. (This finding alone is not the verdict blocker; the two MAJOR findings are.)

## Verdict

❌ **FAIL** — two MAJOR preview fidelity/coverage gaps remain. Independent verify commands and visual checks were blocked; see residual risks above.
