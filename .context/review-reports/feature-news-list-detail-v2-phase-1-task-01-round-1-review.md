Agent: reviewer

# Review — feature-news-list-detail-v2 · phase-1-task-01 · round 1 (BL-062)

## Review level
**FAST**

## Reason
The change only touches wording and order in the news list page: 2 i18n keys (`page.news.v2.mostRead`, `page.news.v2.brand`), the order of 2 JSX siblings in `sidebar`, 1 log label, and JSDoc/tests/as-built docs. It does not touch schema, API, auth, tenant, or shared logic. Grep confirms `t("brand")` (namespace `page.news.v2`) is used only in `NewsFeaturedBlock.tsx:37`, so renaming the key has no knock-on effect elsewhere. The builder reports the full suite PASSED (4406/4406), and the reviewer re-ran the scoped verify commands below.

## Blast radius
- `src/components/news/NewsListPage.tsx`: sidebar order (`NewsletterSignup` → `NewsMostRead` → `NewsTopics`) and the `orEmpty` log label. Applies to `/tin-tuc`, `/tin-tuc/danh-muc/[category]`, `/en/news` and the EN category pages.
- `src/components/news/NewsFeaturedBlock.tsx`: large card label (via i18n).
- `src/i18n/messages/{vi,en}.json`: only `v2.brand` and `v2.mostRead` changed (diff confirms nothing else).
- JSDoc in `NewsMostRead.tsx` and `NewsListBody.tsx`; tests `NewsListPage.test.tsx` and `news-components.test.tsx`; as-built docs `.context/design-spec.md` (S10) and `docs/DESIGN.md` (Tin tức row).
- No CSS/className changes, no data, cache key or URL changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm test src/components/news` | PASS: 7 files, 82/82 tests |
| `npx eslint src/components/news` | PASS (exit 0, no output) |
| `pnpm test` (full) | Not re-run (FAST); the builder reports 4406/4406 PASS. The diff only changes strings and order inside the news module, and Grep finds no other test asserting the old strings ("Đọc nhiều" / `v2.brand`). |
| `pnpm build` | Not re-run (FAST); the builder reports PASS. Typecheck plus no new imports means low risk. |

## Responsive Checklist Gate
The diff touches UI, but only by **swapping the DOM order of 2 sidebar blocks and changing text**. No CSS, grid or className changed.
- Layout (no horizontal scroll / mobile-first / grid): **OK**. Layout classes are unchanged. The sidebar is still `1fr / 18rem` (≥ xl 21rem), and < lg it drops below the grid. Only the order of the children changed.
- Typography/Spacing: **OK**. The heading keeps its existing token. "Được quan tâm nhiều" (19 characters) is longer than "Đọc nhiều". In an 18rem column at the current heading size it fits on 1 line or wraps naturally to 2; it does not overflow because the heading has no `whitespace-nowrap` (no class changes in the diff).
- Media: **N/A** (no image changes).
- Touch/Interaction: **N/A** (no interactive element changes; the link rows in `NewsMostRead` are unchanged).
- Viewport/A11y: **OK**. The region accessible name follows i18n (tested with `getByRole("region", { name })` for vi + en). DOM order equals visual order, which is correct for screen readers too.
- Order < lg = DOM order: **OK**. Tested with `compareDocumentPosition` (newsletter → "Được quan tâm nhiều" → "Chủ đề").

**On the missing screenshots (`bl062-p1t01-*.png`):** acceptable for this scope. The change has no CSS, and both order and text are proven by automated tests that the reviewer re-ran. The builder also checked the DOM on dev :3000. Residual risk: heading wrapping at 1440/390 was not checked visually (risk is low; see Residual risk).

## Skill gates
- aislop: **skip, aislop not installed** (not on PATH).
- oxlint (anti-slop): **skip, oxlint not configured** (no `.oxlintrc*` file). ESLint on the scope passed instead.
- ocr (open-code-review): **skip, ocr not installed**.
- AI-readable: **OK**. 0 indicators: no new function, no magic numbers, JSDoc updated to match the new block name, as-built docs updated.
- ai-friendly-web: **N/A**. Text change on an existing page; does not touch robots/sitemap/llms.
- blitzstrike: **N/A** (FAST, not a sensitive task).

## Requirements coverage
- Acceptance 1 (vi "Được quan tâm nhiều" / en "Most popular"; "Bản tin thị trường" above it at both ≥ lg and < lg): **OK**. i18n diff is correct. Order is tested with `compareDocumentPosition`, and the EN region "Most popular" is tested (`NewsListPage.test.tsx:311`).
- Acceptance 2 (large featured card shows "TAMI REAL ESTATE"): **OK**. vi and en both changed, and `news-components.test.tsx:121` checks it. This matches change doc Q1 (brand name only, no "Bài viết bởi").
- Acceptance 3 (tests, verify, as-built): **OK**. `design-spec.md` has an "As-built BL-062 (P1-T01)" line and `DESIGN.md` has the updated Tin tức row. `SPECIFICATIONS.md`/`spec/**` were not touched by this task.
- Surgical diff: **OK**. Every line traces back to the task; no drive-by refactor.

## Findings
- [CRITICAL]: none.
- [MAJOR]: none.
- [MINOR] Internal comments outside scope still use the old name "Đọc nhiều": `src/lib/news/most-read.ts:13,22,105`, `src/lib/news/news-cache-tags.ts:2`, `src/hooks/news/revalidate-most-read.ts:8`, `src/components/news/NewsViewBeacon.tsx:27`, `src/collections/NewsViewsDaily.ts:7,17` (the latter is an **admin description** shown to editors). Not required by the task scope (which only asks for the JSDoc in `NewsMostRead` + `NewsListPage`). Suggestion: update the admin description in `NewsViewsDaily.ts:17` in a later task or in T02 for consistency. This does not block.
- [MINOR] `NewsListPage.test.tsx:224` uses a non-null assertion `newsletter!` right after `expect(...).not.toBeNull()`. This is acceptable in tests; no change needed.

## Residual risk
- No 1440/390 screenshots: wrapping of the new heading in the 18rem column was not visually confirmed. Low risk because the CSS did not change.
- `/en/news` in dev has no EN most-read data, so the block is hidden there. The unit test covers EN.
- The reviewer did not re-run the full suite or the build (FAST). This relies on the builder's report plus the scoped checks above.

## Verdict
**PASS**: no CRITICAL/MAJOR issues; all 3 acceptance criteria are met and verified by re-run tests.
