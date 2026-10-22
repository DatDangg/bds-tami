Agent: spec-validator

# Spec validation (phase review): BL-062 feature-news-list-detail-v2, phase 1, round 1

- **Mode:** Phase review, run after both tasks passed review.
  - T01 is committed as `83bb1ec`. Reviewer gave FAST PASS in round 1.
  - T02 is uncommitted in the working tree. Reviewer gave STRICT PASS in round 2: `.context/review-reports/feature-news-list-detail-v2-phase-1-task-02-round-2-review.md`.
- **Sources checked:**
  - Change doc: `spec/changes/2026-10-22-news-list-detail-v2.md` (D1–D10, the mobile section, Acceptance, Q1–Q5).
  - Spec delta: `SPECIFICATIONS.md:90-95`.
  - Pre-build validation: `.context/review-reports/spec-validation-feature-news-list-detail-v2-pre-build.md`.
  - Task files: `tasks/feature-news-list-detail-v2/phase-1-task-0{1,2}.md`.
  - Design image: `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc-v2.webp`.
  - Screenshots: `.context/review-reports/assets/bl062-p1t02-*` (7 files).
  - The code listed below, read with Read and `git diff` / `git show`.
- **Out of scope:** dirty files that are not part of BL-062 (`.claude/*`, `.context/project-config.md`, `CLAUDE.md`, `opencode.jsonc`).

## Verdict: ✅ COMPLETE (PASS)

Every requirement and acceptance item is implemented. There are no MISSING items and no blocking PARTIAL items.

Some items are only proven by tests or by calculation, not by looking at the page in a browser, because the local DB has no suitable data:
- `/en` pages.
- An article without a cover image.
- Saving the field in the admin UI.
- Keyboard focus.

These are recorded as residual risk and do not block close-out.

The spec delta needs a few as-built amendments at close-out; the list is below.

## Coverage matrix: requirements

| Req | Spec source | Implementation | Status | Note |
|---|---|---|---|---|
| L1 "Đọc nhiều" renamed to "Được quan tâm nhiều" / "Most popular" | change doc §1; `SPECIFICATIONS.md:91` | `vi.json` / `en.json` `page.news.v2.mostRead` (83bb1ec) | ✅ met | Data source unchanged (`loadMostReadNews`) |
| L2 Newsletter block above "Được quan tâm nhiều"; the same order below lg | §1; `:91` (Bản tin → Được quan tâm nhiều → Chủ đề) | `NewsListPage.tsx` sidebar order (83bb1ec) | ✅ met (+ test) | The sidebar is one fragment, so the < lg order follows automatically. `NewsListPage.test.tsx` checks the order and the vi/en names |
| Q1 Large featured card label "TAMI REAL ESTATE" | Q1; `:91` | `page.news.v2.brand` | ✅ met | |
| Author label "Bài viết bởi TAMI REAL ESTATE" / "By TAMI REAL ESTATE", no staff name | §2; `:92` | `page.newsDetail.v2.author`; `NewsArticleHero.tsx:62` | ✅ met (+ test) | `NewsDetailPage.test.tsx:105` asserts there is no "Ban biên tập". No staff-name read |
| D1 Full-width cover hero | `:93` D1 | `NewsArticleHero.tsx` (cover `priority`, `banner-scrim` + gradient, overlay breadcrumb, chip as link, white `h1` ≥ lg max 36rem, sapo, logo + author + `<time>` + read time, `ShareButtons tone="on-dark"`, `bg-dark-deep` when there is no cover) | ✅ met | Matches the image at 1440 (`bl062-p1t02-full-1440.png`, `hero-1440.png`). Button order differs from the image (see N3). Hero height is 529px on the real article (see A6) |
| D2 Cover image only in the hero | `:93` D2 | `NewsArticleCover` removed (Grep `src` finds 0 matches); `page.tsx:187` JSON-LD keeps the cover; `globals.css` `.news-prose > figure img` rounded + `figcaption` italic, centred | ✅ met | |
| D3 Lead paragraph without a box | `:93` D3 | `globals.css` `.news-prose > p:first-child` uses `--text-lead`, `text-secondary` | ✅ met | |
| D4 Sticky left column: TOC + consult card | `:93` D4; Q4 | `NewsArticleSidebar.tsx` (`DetailAsideFit as="div"` + `--detail-aside-top` + `DETAIL_ASIDE_STICKY_CLASS`); `NewsToc.tsx` (numbered circles, active item has a left bar + gold number + `aria-current`, soft `max-h` with inner scroll); `page.tsx:148` grid has no `items-start`, related section sits outside the grid | ✅ met (+ browser measurements) | Builder measured: top 96px, stops before related; 1024×768 "Nhận tư vấn" bottom at 667 < 768; active item changes on scroll. Consult card → `/lien-he` (see N1) |
| D4 < lg layout | change doc §3; `:93` | `NewsTocDisclosure` at the top of the article; sidebar after the article in the DOM | ✅ met | Measured at 390 and 768 |
| D5 Numbered `h2`, ≈ 22–24px; content aligned with heading text | `:93` D5 | `globals.css` `h2` `--text-h3` 600; ≥ md `h2 ~ :not(h2), h2 ~ ul.list-disc` get `margin-inline-start: 3.25rem` | ✅ met | Round 1 MAJOR fixed. Measured 393 / 445 / 445 at 1440 and 23 / 75 / 75 at 768 |
| D6 ✓ on every root-level `ul`; `ol` keeps numbers | `:93` D6 | `.news-prose > ul.list-disc` `primary-soft` + `accent-text` tick; `ol` untouched | ✅ met | Nested lists keep their old style (pre-build N3) |
| D7 Contact box at the end of every article | `:93` D7 + `:94` | `NewsArticleContactNote.tsx` (plain text via React text nodes, split on "TAMI REAL ESTATE" → link `/lien-he#lead-form`); `load-news-contact-note.ts` (trim, error → default); `get-globals` → `read-global.ts:13` `fallbackLocale: false` | ✅ met (+ test) | `NewsDetailPage.test.tsx:201,214` covers admin text, the default vi/en and that HTML is not rendered |
| D8 Tag chips without `#`; hidden on `/en`; no tags → no row | `:93` D8 | `NewsArticle.tsx:30-53`; `page.tsx:121` | ✅ met (+ test) | |
| D9 Related articles | `:93` D9 | `page.tsx:157-178` `bg-surface`, uppercase eyebrow, "Xem tất cả →", grid 1/2/3; `NewsCard variant="related"` 16:7, badge + date, `h3` clamped to 2 lines, excerpt 2 lines, `CardArrow`, single link | ✅ met (+ test) | Other `NewsCard` variants unchanged |
| D10 ConsultBanner kept | `:93` D10 | `page.tsx:179` | ✅ met | |
| Schema: `site-settings` localized field, ADD-only migration | `:94`; Q3 | `site-settings/news-detail.ts` (group `newsDetail`, `contactNote` textarea localized, maxLength 500, `trimText`, Vietnamese description); tab "Tin tức"; `payload-types.ts` 2 hunks | ✅ met | Migration details in the next section |
| No API / permission / URL / JSON-LD / view-beacon change | `:94` | `page.tsx` keeps `generateMetadata`, `JsonLd`, `NewsViewBeacon`, 404 | ✅ met | `docs/API_SPEC.md`: no impact |

## Acceptance (change doc)

| # | Acceptance item | Status | Evidence |
|---|---|---|---|
| AC1 | `/tin-tuc` + `/en/news`: new name; Newsletter above it | **met + test** | T01 test plus i18n. `/en` is checked by test |
| AC2 | 1440 detail matches D1–D10 next to the v2 image | **met** | `bl062-p1t02-full-1440.png` and `hero-1440.png` compared with the design image. Small differences: share button order (N3), hero height (A6) |
| AC3 | White hero text meets AA on the brightest image (≥ 3 articles) | **met by calculation** | Worst case is a pure white image under the 0.6 scrim → background ≈ (114,110,103) → 5.07:1. Round-1 `/90` issue removed. Builder opened 4 articles. No per-article pixel sampling (residual) |
| AC4 | No cover → dark hero; no `h2` → no TOC; no tags → no row; < 3 related → shows what exists; 0 → hidden | **met by test only** (no-cover, 0 related); **met** (rest) | `NewsDetailPage.test.tsx:115,187`. No cover-less article in the DB |
| AC5 | Left column sticks until related, does not overlap it; long TOC scrolls inside; active item updates | **met** | Builder browser measurements (1440, 1024×768) plus structure test `:145,169` |
| AC6 | Contact box: admin text vi/en, empty → default, brand → contact form | **met by test** (vi/en, empty); admin UI save not exercised | `:201,214`. Schema plus migration applied locally |
| AC7 | `ol` gets no ✓; images inside the article show with caption | **met** | CSS targets only `ul.list-disc`; figure / figcaption rules exist |
| AC8 | 1440 / 1024 / 768 / 390, vi + en; no horizontal overflow; visible keyboard focus | **met for vi**; **en and focus are test/class-only** | `scrollWidth === clientWidth` at 1440 / 768 / 390. No EN article in the DB. Focus is checked through `focus-visible:outline-*` classes, not real keyboard testing |

## Migration check (gate `migration_required: true`)

- File: `migrations/20261022_172224_news_detail_contact_note.ts`.
  - `up`: `ALTER TABLE "site_settings_locales" ADD COLUMN "news_detail_contact_note" varchar;`. Nullable, nothing else in the file.
  - `down`: `DROP COLUMN` of that same column.
  - Result: **ADD-only, SAFE_ADDITIVE.** No `HIGH_RISK_MIGRATION`.
- `migrations/index.ts`: one entry added. The other diff hunk only adds a trailing comma to the previous entry (formatting).
- The `.json` snapshot is untracked. Close-out must stage it together with the `.ts`.
- Applied with `pnpm payload migrate` on the local dev DB, per the builder.

## As-built docs vs code

| Doc | Status | Note |
|---|---|---|
| `.context/design-spec.md` S10 (T01) | ✅ matches | "As-built BL-062 (P1-T01)" line |
| `.context/design-spec.md:598` S11 | ✅ matches | Reviewer MINOR-A is fixed: sapo `text-on-dark` solid, clamped to 4 lines < lg, full ≥ lg. Also documents the TOC numbering of level-2 headings only, `max-h`, the contact box, the overlay Breadcrumb fix, the `related` card |
| `docs/DESIGN.md:246` Chi tiết tin tức + Tin tức row | ✅ matches | BL-054 is moved to "(đã thay)" |
| `docs/ERD.md:631` `site-settings.newsDetail` | ✅ matches | Column, migration, `fallbackLocale: false`, `TRANSLATABLE_FIELDS` |
| `docs/API_SPEC.md` | n/a | No API impact |
| Reviewer MINOR-B (test for "TAMI REAL ESTATE" in the prompt) | ✅ done | `translation-service.test.ts:107` |

## Gaps

### Blocking

None.

### Non-blocking (notes)

- **N1 [PARTIAL, cosmetic] Different targets for the consult card and the contact box.**
  - The consult card's "Nhận tư vấn" goes to `/lien-he` (`page.tsx:155`). The brand link in the contact box goes to `/lien-he#lead-form` (`page.tsx:152`).
  - Q2 said "cùng đích nút Nhận tư vấn thẻ trái; trang Liên hệ có neo form thì thêm neo", which suggests the card should also use `#lead-form`.
  - The spec delta D4 says `/lien-he`, so the code matches the spec. A one-line follow-up can unify them if wanted.
- **N2 [residual] Not seen in a browser:**
  - `/en/news/[slug]` (the DB has no EN article).
  - The no-cover hero.
  - Saving `contactNote` in admin and seeing it on the page.
  - Real keyboard focus.
  - All are covered by tests. Recommended for staging smoke testing.
- **N3 [cosmetic] Hero share-button order.**
  - Design order: copy → Facebook → Zalo → more.
  - Code order (shared `ShareButtons`): Facebook → Zalo → copy → more.
  - The "more" button only appears when `navigator.share` exists, as the spec allows.
- **N4 [residual] Contact text is auto-translated.** `newsDetail` is in `TRANSLATABLE_FIELDS`, so the EN text is filled from VI automatically. If the model changes the brand string, `/en` loses the link (no crash). This is mitigated by `ALWAYS_KEEP` in `prompt.ts`.
- **N5 [trivial] Stale code comment.** `NewsToc.tsx:153` still says the collapsed TOC sits "sau ảnh bìa", but there is no cover in the article body any more. Comment only.
- **N6 [close-out] Selective staging of `src/payload-types.ts`.** Stage only the 2 BL-062 hunks (`git add -p`), as the task notes. The current diff shows only those 2 hunks; confirm again at staging.

## As-built amendments for `SPECIFICATIONS.md` (spec delta BL-062, applied at close-out via spec-publisher)

1. **TOC numbering:** circled numbers 01/02… only for level-2 headings, matching the `news-prose` `h2` counter. Level-3 headings are indented with no number.
2. **Hero sapo:** clamped to 4 lines below lg (`max-lg:line-clamp-4`), not clamped at ≥ lg. Hero text uses solid `text-on-dark`, ≈ 5.07:1 worst case on a white image.
3. **Hero height:** `min-h` 26rem (≥ lg 28.75rem ≈ 460px). Real content can make it taller (529px measured on the Udic article). The ≈ 420–460px range is a minimum, not a fixed height.
4. **`contactNote` translation:**
   - Add: "`newsDetail` nằm trong `TRANSLATABLE_FIELDS['site-settings']` → bản EN tự dịch từ VI như các trường site-settings khác; `/en` vẫn đọc `fallbackLocale: false` (rỗng → mặc định i18n)."
   - Add: "TAMI REAL ESTATE" is in `ALWAYS_KEEP` of the translation prompt (BR-08) so the brand link survives in EN.
5. **Admin details:** tab "Tin tức", group "Trang chi tiết tin tức", field "Khung liên hệ cuối bài", `maxLength` 500, trimmed. The public loader falls back to the i18n default when global reading fails.
6. **Shared component change:** with more than 3 items, `Breadcrumb variant="overlay"` keeps only "← mục cha" below md. Fixed so the pill class no longer overrides `hidden`. This affects every overlay breadcrumb with more than 3 items. Overlays with ≤ 3 items change `display` from `inline-flex` to `flex` and look the same.
7. **Components removed:** `NewsArticleCover` and `NewsArticleHeader`. New: `NewsArticleHero` and `NewsArticleContactNote`. New variants: `NewsCard variant="related"` and `ShareButtons tone="on-dark"`.
8. **`news-prose`:** the `max-width: 46rem` limit on p / ul / ol / h2 / h3 was removed, so text spans the full column as in v2. Indentation is `margin-inline-start: 3.25rem` (≥ md) for every block after the first `h2`.
9. **`/en` date:** "Published: {date}" uses the existing formatter (MM/DD/YYYY). VI uses "Ngày đăng: dd/mm/yyyy".
10. **Contact box target:** `/lien-he#lead-form`. Consult card target: `/lien-he` (see N1). The contact box is `role="note"` with an `Info` icon.
