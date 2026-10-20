Agent: reviewer

# Review: feature-form-fields-rounded, phase-1-task-01, round 1 (BL-030)

- Task: `tasks/feature-form-fields-rounded/phase-1-task-01.md`
- Change doc: `spec/changes/2026-10-20-form-fields-rounded.md`
- Diff scope: src/components/ui/{input,checkbox,select,option-select}.tsx, src/components/forms/{FormField,LeadFormSlot,FormField.test}.tsx, src/components/careers/CvPicker.tsx, src/app/(frontend)/globals.css (comment only), .context/design-spec.md, docs/DESIGN.md, skills/react-nodejs/design-tokens.md. Other dirty files (next.config.ts, src/components/projects/*, src/payload-types.ts, ...) are the user's unrelated work and were not reviewed.

## Review level: STRICT (light)
Reason: the diff changes shared UI components (Input, Checkbox, SelectTrigger, OptionSelect, FormField, LeadFormSlot) used by every public form and filter. The rubric puts shared components under STRICT. In practice the risk is low because only class names change: no logic, API, schema, auth or data changes.

## Blast radius
Every public form that uses the shared controls: lead forms (Contact `lien-he/page.tsx`, project detail, rental `SaleContactBox`, property post `PostDetail`, news list), the apply form (`ApplyFormSlot` + `CvPicker`), and the project, rental and job filters, sort and search bar (`ListSearchBar`, `JobFilters`, `RentalFilters` via OptionSelect/Input). `LeadFormSlot` defaults change from 2px to 16px only for the callers that do not override it (Contact, PostDetail, ApplyFormSlot). SaleContactBox keeps `bg-transparent p-0`, so the radius change is not visible there. Admin is not affected: `git status -- src/components/admin` is clean.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components` | PASS, 855/855 tests |
| `pnpm lint` | PASS, 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this diff) |
| `pnpm typecheck` | PASS (`tsc --noEmit` clean) |

## Specific checks
1. **Public field corners `rounded-sm` changed to `rounded-md`: OK.** The base classes of Input (`ui/input.tsx:11`), SelectTrigger (`ui/select.tsx:21`), OptionSelect native (`ui/option-select.tsx:43`), FormField controlBase (textarea/file, `forms/FormField.tsx:44`), and CvPicker (drop zone `:88` and selected-file row `:137`) are all changed. I grepped `rounded-sm` across `src` (excluding admin). Every remaining hit is something other than a field: icon buttons (sheet/dialog close, CvPicker X `:145`, MobileMenu, Lightbox), panels/badges (OfferBox, JobDetail, RentalTerms, LazyMap, Gallery), Pagination, SkipLink, ShareButtons/PostShare, CookieBanner, RichText code, skeleton, and the dropdown item `ui/select.tsx:70`. The task file explicitly keeps the dropdown item at `rounded-sm`. I also grepped raw `<input|textarea|select>` outside ui/admin. Apart from hidden inputs, the only ones are the CvPicker hidden file input and FormField, which uses controlBase. **No field-like control was missed.**
2. **`--radius-sm` unchanged: OK.** `globals.css` changes only the comment; `--radius-sm: 2px` stays. Admin files are untouched.
3. **Checkbox `rounded-[calc(var(--radius-md)/2)]`: OK.** The project uses Tailwind `^4.3.3`. The dev build generated the CSS: `.next/dev/static/chunks/src_app_(frontend)_globals_css_*.single.css:1568-1569` contains `border-radius: calc(var(--radius-md) / 2);`. Tailwind v4 normalizes the math operators, so the value is valid, and it resolves to 6px.
4. **LeadFormSlot `rounded-lg` vs caller className: OK.** `cn` uses `extendTailwindMerge` with `theme.radius: ["pill"]` (`src/lib/utils.ts:23-28`). tailwind-merge puts arbitrary `rounded-[20px]` (`DETAIL_ASIDE_CARD_CLASS`, `detail/DetailLayout.tsx:9`) and `rounded-xl` (`news/NewsListPage.tsx:94`) in the same `rounded` group, so the later class wins. A new test checks this override (`FormField.test.tsx:131-138`). `file:rounded-pill` uses the `--radius-pill` token, which is registered in the theme.
5. **Focus and error states: OK.** Focus (`focus-visible:border-ring`) and error (`aria-invalid:border-error`) are drawn on the element's own `border`, so they follow the border-radius. The focus-visible outline on OptionSelect also follows border-radius in modern browsers. CvPicker uses `md:border-error`, which is on the same element as `md:rounded-md`.
6. **Docs: OK.** design-spec §3.2, docs/DESIGN.md (radius table) and skills/react-nodejs/design-tokens.md all say: fields use md, checkbox uses md/2, the lead panel uses lg, and sm is no longer used for fields. The `SPECIFICATIONS.md` update and version bump are listed under Doc impact for the spec-publisher step after review. That is outside this builder diff and should be tracked in close-out.
7. **Tests: OK.** The tests assert class names for input, textarea, select, file, file:rounded-pill, checkbox, and the LeadFormSlot default plus override. For a change that only touches classes, this is enough. They also check that `rounded-sm` is gone.

## Responsive Checklist Gate
The diff touches UI, so the gate applies. This change only touches border-radius and does not affect layout or sizing.
- Layout (no horizontal scroll, mobile-first, grid, container): **N/A** for this change. No width, grid or media-query changes. CvPicker keeps the original `md:` prefix.
- Typography/Spacing: **N/A**. No font or spacing changes.
- Media: **N/A**.
- Touch/Interaction: **OK**. Sizes are unchanged (h-12 fields, checkbox hit area `after:-inset-3` kept, CvPicker X `size-11`).
- Viewport/A11y: **OK**. No new 100vh or animation. Focus and error borders still follow the radius.
- Not checked visually at 375/768/1280 (no browser): see Residual risk.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). eslint and tsc PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Class-only change, no new functions, no magic numbers (checkbox derives from the md token), 0 indicators.
- ai-friendly-web: N/A. UI radius change, no change to crawl or SEO surfaces.
- blitzstrike: N/A. Not a security-sensitive task.

## Findings
- [CRITICAL] None.
- [MAJOR] None.
- [MINOR] `src/components/forms/FormField.test.tsx:124-129`: the Checkbox test sits in `FormField.test.tsx` even though Checkbox is in `ui/checkbox.tsx`. Suggestion, not blocking: move it to `src/components/ui/checkbox.test.tsx` if that file is created later.
- [MINOR] Outside this diff: `rentals/RentalFilters.tsx:96,110` still has `rounded-md` overrides that are now redundant. The task chose to keep them to keep the diff small. They are harmless, so no action is needed.

## Residual risk
- No visual check at 375/768/1280. The checkbox at 6px and the 12px fields inside the 16px LeadFormSlot panel were checked only through generated CSS and reasoning.
- The tests run on a working tree that also contains the user's unrelated changes. The result is still PASS.

## Verdict: PASS
