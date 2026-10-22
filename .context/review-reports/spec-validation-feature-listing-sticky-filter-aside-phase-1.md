Agent: spec-validator

# Spec validation (phase review): feature-listing-sticky-filter-aside, phase 1 (BL-061, MODIFY)

- Mode: **Phase review** (build checked against the change doc and the current spec)
- Change doc: `spec/changes/2026-10-22-listing-sticky-filter-aside.md` (3 requirements, 7 Acceptance items)
- Tasks:
  - `tasks/feature-listing-sticky-filter-aside/phase-1-task-01.md`: committed in `b0fdc6a`. Reviewer NORMAL PASS r1 (`feature-listing-sticky-filter-aside-phase-1-task-01-round-1-review.md`).
  - `phase-1-task-02.md`: uncommitted working tree. Reviewer NORMAL PASS r1 (`feature-listing-sticky-filter-aside-phase-1-task-02-round-1-review.md`).
- Sources read:
  - `git show b0fdc6a`: `FilterPanel.tsx`, `SpotlightSlider.tsx`, `spotlight-content-classes.ts`, `RentalSpotlightContent.tsx`, plus the stat for the other 2 `*SpotlightContent` files and 5 test files.
  - `git diff`: `DetailPageShell.tsx`, `DetailLayout.tsx`, `DetailAsideFit.tsx`, `ProjectDetail.tsx`, `RentalDetail.tsx`, `PostDetail.tsx`, `ProjectLocation.tsx`, `ProjectAmenities.tsx`, `LegalPolicy.tsx`, `DetailGalleryGrid.tsx`, `project-detail.test.tsx`, `docs/DESIGN.md`, `.context/design-spec.md`.
  - `SPECIFICATIONS.md:38-49, :63` and `spec/updates/2026-10-21-listing-detail-redesign.md:44`.
  - Screenshots `.context/review-reports/assets/bl061-*` (7 for p1t01 and 8 for p1t02 exist on disk).

## Verdict: ✅ PASS (phase COMPLETE, with residual evidence gaps and a required spec delta)

- No acceptance item is unmet in code. No HIGH conflict is left unresolved: the conflict with intent text is the expected MODIFY delta, which the user approved on 2026-10-22 and which is recorded in the change doc.
- Two items are ⚠️ only because they were checked by unit tests and class assertions, not by a browser. This is residual, not a FAIL.

## Coverage matrix (Acceptance ↔ task ↔ implementation ↔ evidence)

| # | Acceptance (change doc :26-32) | Task | Implementation (cite) | Evidence | Status |
|---|---|---|---|---|---|
| A1 | ≥ lg, 3 list pages: the filter stays on screen under the header. A long filter scrolls inside without being cut, and scrolling the filter does not scroll the page (`overscroll-contain`). | T01 | `FilterPanel.tsx` `LISTING_FILTER_STICKY_CLASS` (`lg:sticky lg:top-[calc(var(--sticky-top)+1rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain`). It is applied to `FilterSidebar`'s `aside`, which is shared by all 3 `*ListBody`. | `listing-filters.test.tsx`. Browser: `/du-an` 1440 sticky top 88px, max-h 796. `/cho-thue` 1440 filter scrollHeight 1445 > 794, scrolled inside while the page stayed still. Screenshots `bl061-p1t01-du-an-1440.png`, `-cho-thue-1440-filter-scrolled.png`, `-tin-bds-1024.png`. | ✅ |
| A2 | When the result grid ends, the filter stops sticking and does not cover FAQ/CTA/footer. < lg is unchanged (drawer). | T01 | The sticky element is a grid cell with `self-start`. FAQ, Strengths and CTA sit outside the grid (T01 §Hiện trạng, `ProjectListPage.tsx:196-199`). `max-lg:hidden` and `FilterSheet` are unchanged. | Test: Sheet has no sticky classes. Browser: aside top −455 at the end of the grid (`bl061-p1t01-du-an-1440-end-of-grid.png`). 390 shows `display:none` plus a 44px "Bộ lọc" button (`-cho-thue-390.png`). 768 was measured. | ✅ |
| A3 | Spotlight cards on all 3 list pages: clicking the image, title or empty space opens the detail page. "Nhận tư vấn" keeps its old behaviour. Arrows and dots do not navigate. No `<a>` inside `<a>`. Tab reaches the card and Enter opens it. | T01 | `spotlight-content-classes.ts`: `SPOTLIGHT_STRETCHED_LINK_CLASS` (`after:absolute after:inset-0 … active:translate-none`) and `SPOTLIGHT_SECONDARY_LINK_CLASS` (`relative z-10`). `SpotlightSlider.tsx`: `li` `group/spot relative isolate`, controls `z-10`, `section` has `has-[[data-stretched-link]:focus-visible]:ring-2`. The 3 `*SpotlightContent` files carry `data-stretched-link`. | Tests: `SpotlightSlider.test.tsx` (`a a` = 0), `project-components`, `post-components`, `RentalCard`. Browser on `/du-an` with real clicks: image, title and empty area go to detail; "Nhận tư vấn" goes to `…#lead-form`; arrow gives 2/5 and the URL stays put; Tab plus Enter works; ring visible (`-du-an-1440-spotlight-focus.png`). | ✅ (residual R1) |
| A4 | Project / Rental / Property-post detail ≥ lg: every content block is in the left column. The form and hotline stick in the right column while scrolling past those blocks and stop at "… tương tự" / "Tin liên quan" without covering it. | T02 | `DetailPageShell.tsx`: `bands` are rendered after `children` inside the `cards` column. `after` is passed alone to `DetailLayout after`, outside the grid. The JSDoc records the reusable formula. `PostDetail` keeps `RelatedPosts` in `after`. `RentalDetail` keeps similar listings in `after`, or in `belowSpecBar` for rented listings. | `DetailPageShell.test.tsx` (order overview → bands → aside → after), `project-detail.test.tsx` (bands inside the column), `rental-detail.test.tsx`. Browser: project 1440 sticky 88px and it stops at the end of the grid (`-du-an-1440-mid-amenities.jpg`, `-du-an-1440-stop-similar.png`); `-cho-thue-1440-mid-gallery.jpg`; `-tin-bds-1440-stop-related.jpg`. | ✅ (residual R2) |
| A5 | Wide blocks (map + recent list, gallery, price table, floor plans, 2-column legal/policy) still look right in the narrower column: they stack or reduce columns when needed, with no horizontal overflow. | T02 | Column is `@container/detail` (`DetailLayout.tsx:57`). `ProjectLocation` uses `@3xl`/`@5xl`, `ProjectHighlights` uses `@md`/`@3xl`, `LegalPolicy` uses `@3xl` for 2 columns, and `DetailGalleryGrid` uses an `@md` bento. `ProjectListings`, `RentalTerms`, `RentalAmenities` and `DetailFeatureList` were converted. `ProjectAmenities` uses `-mx-5/-mx-8` with a local `--spacing-gutter`. `PriceTable` keeps its inner scroll. | Class tests (`project-detail-blocks`, `project-market-blocks`, `DetailGalleryGrid`, `DetailLists`). Browser checked only Location, Amenities and Gallery: `scrollWidth − clientWidth = 0` at 1440/1024/768/390, and Location stacks at 1024 (`-du-an-1024-location.jpg`). | ⚠️ residual R3 (browser coverage is partial; no defect found) |
| A6 | The sub-nav and each block's `scroll-mt` stay correct. The mobile sticky-bottom CTA and `#lead-form` still work. | T02 | Ids and `scroll-mt` are unchanged (assertion for 8 ids in `project-detail.test.tsx`). `#lead-form` is unique. `DetailSubNav` scans by id. | Browser: at 390 the CTA scrolls to `#lead-form` (formTop 80px, `-du-an-390-mid-amenities.jpg`). | ✅ (cosmetic finding G3) |
| A7 | Check 1440 / 1024 / 768 / 390 in vi and en. | T01+T02 | — | vi is covered at all 4 widths across the 2 tasks. en only at 1440 (`bl061-p1t01-en-1440.png`, `bl061-p1t02-du-an-en-1440-location.jpg`). en `/projects` has no featured items, so the spotlight was not seen in en. | ⚠️ PARTIAL evidence (R4) |

## Gaps

- **[PARTIAL — evidence] R1 / A3:** a real click was run only on `/du-an`. `/cho-thue` and `/tin-bds` were checked by JS measurement (sticky, 0 nested `a`, stretched link present) plus unit tests. The mechanism is the same shared class and shared component, so the risk is low. Residual, not FAIL.
- **[PARTIAL — evidence] R2 / A4:** the screenshot `bl061-p1t02-du-an-1440-stop-similar.png` is cropped and does not show the "Dự án tương tự" block itself. The stop point is backed by `getBoundingClientRect` numbers in the T02 Verification summary. The "stop" on `tin-bds-1440-stop-related` is shown. Residual.
- **[PARTIAL — evidence] R3 / A5:** the local DB has no project with Nổi bật, Mặt bằng, Bảng giá, 2-column Pháp lý & chính sách, Tin đăng, Hỏi đáp, or the "Kết nối hạ tầng" card. Those blocks are verified only by jsdom and class tests (T02 Verification summary residual (1); reviewer T02 MINOR #5). This needs a visual check on staging data before or at deploy. Residual, not FAIL.
- **[PARTIAL — evidence] R4 / A7:** en was checked only at 1440. The vi matrix is complete, and en uses the same components with only text changed. Residual.
- **G1 (spec conflict, needs a delta — MEDIUM):** `SPECIFICATIONS.md:63` (BL-060 item 5) still says the Location "Kết nối hạ tầng" layout is "≥ xl lưới 12 cột **5 · 4 · 3**, lg 7/5 + thẻ hàng dưới".
  - As built, the breakpoints follow column width: ≥ 48rem column gives 12 columns at 7/5, and **≥ 64rem column** gives 5·4·3.
  - The left column is about 792px at 1440 and about 571px at 1024, and it stays below 64rem even at the maximum container width. So **the 5·4·3 layout no longer appears at any viewport**.
  - At 1024 the 7/5 layout no longer appears either: blocks stack in one column.
  - Change doc acceptance A5 ("xếp dọc/thu cột khi cần") allows this, but the BL-060 text must be rewritten. Do not mark it as a defect.
- **G2 (spec conflict, needs a delta — expected MODIFY):** the following text contradicts the build and is replaced by BL-061:
  - `SPECIFICATIONS.md:44`: "Cột phải ≥ lg … nằm **cạnh khối Tổng quan** và dính trong phạm vi khối đó; các khối sau … là **dải rộng hết khung, nền xen kẽ** (không thẻ trắng) — cùng khung cho chi tiết Cho thuê / Tin BĐS".
  - `spec/updates/2026-10-21-listing-detail-redesign.md:44`, which records the same decision.
- **G3 (cosmetic, not blocking):** reviewer T02 MINOR #3. Jumping to `#legal` or `#sales-policy` puts the heading flush with the tab bar, because the legal card wraps 2 sections and `scroll-mt` sits on the inner sections. The other cards keep their padding. A6 is still met functionally.
- **G4 (stale code comments, LOW):** this is code hygiene, not a spec gap. Suggested follow-up the next time these files are touched.
  - `src/components/projects/project-detail.test.tsx:157`: the test title still says "các khối sau là dải rộng hết khung nền xen kẽ ngoài lưới", but the body asserts the opposite (bands are inside the column).
  - JSDoc in `ProjectLocation.tsx:53` and `ProjectAmenities.tsx:38` still says "dải rộng hết khung". `ProjectLocation.tsx` (the JSDoc for the span helpers) still says "xl 5/4/3 (lg: …)".
- **G5 (mobile order change, LOW, note for the delta):**
  - Before: < lg, the contact column came right after Tổng quan and before the bands (task `feature-listing-detail-redesign/phase-2-task-03.md:34`).
  - Now: it comes after **all** content blocks.
  - This is still consistent with `SPECIFICATIONS.md:38` ("cột phải chi tiết xuống sau nội dung + thanh CTA dính đáy") and with the change doc (A6 only asks that the CTA and `#lead-form` work). The delta should state the new order explicitly so test-scope does not expect the form right after Tổng quan.
- **Non-gap (accepted residuals):**
  - Text on the spotlight card cannot be selected with the mouse, which is a property of the stretched link (T01 decision 2).
  - Image `sizes` were not retuned for the narrower column (reviewer T02 MINOR #2). This affects performance only; a follow-up is recommended.
  - `FloorPlans`, `DetailInfoGrid` and `DetailStatCards` still use viewport breakpoints (T02 residual 3-4). They overflow nothing.

## Required spec delta (for spec-publisher at close-out — MINOR bump, intent docs, change doc already user-approved)

1. **`SPECIFICATIONS.md:39` (Trang danh sách — khung chung), item (3):** add one as-built BL-061 sentence:
   - At ≥ lg, the "Bộ lọc" column sticks under the header (`--sticky-top` + 1rem). Its maximum height is the remaining screen height. It scrolls internally with `overscroll-contain`.
   - It stops sticking at the end of the result grid (FAQ, Strengths and CTA sit outside the grid).
   - < lg is unchanged (Sheet).
2. **`SPECIFICATIONS.md:43` (`/du-an` … "Thẻ nổi bật: …"), applied to all 3 pages** (`:45` and `:48` refer back to the same frame): the whole spotlight card is a link to the detail page.
   - Use a stretched link from the "Xem chi tiết" button, with no nested `<a>`.
   - "Nhận tư vấn" (→ `#lead-form`), the arrows and the counter keep their own behaviour.
   - Keyboard focus shows a ring around the card. Hovering changes the title colour.
3. **`SPECIFICATIONS.md:44` (Chi tiết Dự án — "Cột phải ≥ lg"):** replace "cạnh khối Tổng quan … dải rộng hết khung, nền xen kẽ (không thẻ trắng)" with the BL-061 layout:
   - Every content block (Tổng quan, Vị trí, Tiện ích, Hình ảnh, Nổi bật, Mặt bằng, Bảng giá, Pháp lý & chính sách, Tin liên quan/Tin đăng, Hỏi đáp) is a white card in the left column.
   - Multi-column blocks change their column count by **column width**, not by viewport.
   - The right column (form plus hotline) sticks for the full height of the left column and stops at "… tương tự" / "Tin liên quan", which stay outside the grid at full width, together with the Strengths strip and the consult banner.
   - Below lg, the contact column comes after **all** content blocks (G5). The sticky-bottom CTA → `#lead-form` is unchanged.
   - This applies to `:46` (Cho thuê) and `:49` (Tin BĐS), which say "cùng khung".
   - Note that this replaces the P1-T03 review decision of BL-052 and the design `detail-du-an.webp` for this part (user 2026-10-22).
4. **`SPECIFICATIONS.md:63` (BL-060 item 5):** rewrite the Location breakpoints by column width:
   - Column ≥ 48rem: 12 columns, map + list at 7/5, card on the next row.
   - Column ≥ 64rem: 5·4·3.
   - Narrower: stacked.
   - Missing part: 8/4.
   - State that in the 2-column layout (container ≤ 84rem) the 5·4·3 layout does not appear in practice (G1).
5. **`spec/updates/<date>-listing-sticky-filter-aside.md`** (new): record the decisions above, and that they supersede `spec/updates/2026-10-21-listing-detail-redesign.md:44`. Do not edit the old update file.
6. **`spec/test-scope/current.json`** (scopeVersion +1). Test points:
   - Filter sticky, internal scroll and stop on the 3 list pages.
   - Spotlight whole-card click, "Nhận tư vấn" exception, no `a a`, Tab/Enter.
   - On the 3 detail pages, the form sticks to the end of the content and does not cover the related block.
   - No horizontal overflow at 1440/1024/768/390.
   - `#lead-form` and the sticky CTA on mobile.
   - **Mark risk on the blocks without local data (R3)** so the test template checks them on staging.

No migration, API or schema impact. `docs/DESIGN.md:240,242,244,276` and `.context/design-spec.md:233,235,395,496,545` are already updated as-built and match the code.

## Verify (as reported; not re-run by this validator)
- T01 (commit trailer + reviewer): `pnpm typecheck` PASS, eslint (scope) PASS, `pnpm test` 420 files / 4403 PASS, `pnpm build` PASS.
- T02 (builder): typecheck PASS, eslint (scope) PASS, `pnpm test` 420 files / 4406 PASS, `pnpm build` PASS.
- T02 reviewer: typecheck PASS, eslint on 20 files PASS, scoped test 25 files / 289 PASS. The reviewer did not re-run build or the full suite (shared `.next` with the dev server). That is residual and is accepted in the reviewer's report.
