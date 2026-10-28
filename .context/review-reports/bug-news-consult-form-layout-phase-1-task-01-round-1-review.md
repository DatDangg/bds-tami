Agent: reviewer

# Review — bug-news-consult-form-layout · phase-1-task-01 · round 1 (BL-098)

- **Review level:** FAST
- **Reason:** The diff adds 2 utility classes (`mx-auto w-full`) to a local, non-exported `ConsultSection` card. It also adds 1 test and edits 1 as-built line in design-spec. It does not touch shared components, API, auth, schema, data or `LeadForm`. The builder's tests pass, and I re-ran them myself.
- **Blast radius:** `/tin-tuc` and `/en/news` (all pages) — only the consult card at the bottom. `ConsultSection` is rendered only when `context` is null (`NewsListPage.tsx:142`), so category pages are unaffected. `LeadForm` props (`source="contact"`, turnstile), `id="lead-form"`, scroll-margin and heading are unchanged.

## Root cause / fix match
- Root cause: the card had `max-w-2xl` but no `mx-auto` inside a `max-w-container` section, so it stuck to the left edge. The code confirms this. The fix adds `mx-auto w-full` and keeps `max-w-2xl` (42rem), which matches the design-spec S10 width limit. The task file explains the choice of centering over a full-width or 2-column layout: the spec already fixes the width at 42rem, and a 2-column layout would need new content.
- Design-spec edit: 1 as-built note was added in S10 and the intent was not changed. OK.

## Verify commands + result
- `pnpm typecheck` — PASS (tsc exit 0)
- `pnpm lint` — PASS (eslint, no output)
- `pnpm vitest run src/components/news` — PASS, 8 files / 99 tests
- Evidence: I opened `bl098-after-1440.png`. The card spans about x=384–1056 of 1440, so it is centred. The builder's Playwright measurements are in the task file: 304/304 at 1920 and 1440, 48/48 at 768, 390 unchanged, no horizontal scroll. They are consistent with the CSS: `mx-auto` + `w-full` + `max-w-2xl` inside a padded container.

## Bug repro closure
- Repro Verification status is PASS, with before/after Playwright numbers and screenshots. The BL-098 test failed before the fix and passes after it. The evidence can be checked. OK.

## Responsive Checklist Gate (only the diff's change)
- Layout / no horizontal scroll: OK — `w-full max-w-2xl` cannot exceed the parent. The task reports `pageHScroll=false` at 1920/1440/768/390.
- Mobile-first / grid / container: OK / N/A — no new breakpoints. The container is a rem max-width (42rem), not a fixed px width.
- Typography/Spacing: N/A (unchanged)
- Media: N/A
- Touch/Interaction: N/A (the form controls are unchanged)
- Viewport/A11y (100vh, reduced-motion, overflow hidden): N/A — not introduced.

## Skill gates
- aislop: skipped — the code diff is 1 class string + 1 test, too small for a meaningful score.
- oxlint (anti-slop): skipped — the repo uses eslint, and `pnpm lint` passes.
- ocr: skipped — ocr is not installed.
- AI-readable: OK — 0 indicators. The JSDoc was updated to describe the new behaviour.
- ai-friendly-web: N/A — a layout fix that does not change crawlability.
- blitzstrike: N/A — FAST level, no security surface.

## Findings
- [MINOR] `src/components/news/NewsListPage.test.tsx:250-254` — The test only checks the class names `mx-auto` and `max-w-2xl`. jsdom cannot measure layout, so the real centering is proven by the Playwright evidence, not by this unit test. Acceptable; no change needed.

No CRITICAL or MAJOR findings.

## Verdict
PASS
