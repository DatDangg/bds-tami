Agent: spec-validator

# Phase review: feature BL-027 `detail-pages-unified-layout` (MODIFY), phase 1 (the only phase), round 1

- Mode: **Phase review** (after T01 STRICT PASS r3 at `046d891`, and T02 FAST PASS r2, not yet committed)
- Sources checked: change doc `spec/changes/2026-10-20-detail-pages-unified-layout.md`, the user decisions (passed in by the primary and recorded in `tasks/feature-detail-pages-unified-layout/phase-1-task-01.md:6`), the T01 and T02 task files, `git diff SPECIFICATIONS.md` (spec delta, not yet published), `git show 046d891`, the uncommitted diff of `src/components/rentals/*`, `src/lib/rentals/rental-detail-sections*.ts` and `src/i18n/messages/*.json`, `.context/design-spec.md` §2.1/§1/S03/S07, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, and the review reports for T01 r1–r3 and T02 r1–r2.
- Out of scope: the user's dirty files (`next.config.ts`, `src/payload-types.ts`, `.claude/launch.json`, `template-feedback.md`, `.context/runs/*`) and the projects/* files that are dirty only from EOL changes (T01 m-4).
- Verify commands were not re-run here. The evidence comes from the task files and reviewer reports: T01 vitest 26 files/236 PASS, lint 0 errors, typecheck PASS; T02 vitest 15 files/187 PASS, lint 0 errors, typecheck PASS.

## Verdict: ✅ COMPLETE (PASS) — implementation has no MISSING/PARTIAL gaps; close-out conditions remain (doc reconcile + 1 LOW wording issue in the spec delta)

All 7 Acceptance items in the change doc, plus the 4 user decisions, have code or test evidence. The spec delta matches the code and does not lower the intent. The remaining items are doc reconcile work that close-out already plans (design-spec §1/§2.1/S03/S07, docs/DESIGN.md, docs/ARCHITECTURE.md, decisions.md) and residual visual risk (768px, reduced-motion, rented listing, browsers without `:has()`). The user has accepted that residual risk or it is outside the scope of the tests.

## Coverage matrix: change-doc Acceptance ↔ code/test

| # | Requirement (change doc) | Evidence | Status | Note |
|---|---|---|---|---|
| A1 | Both detail pages share one layout (sub-nav + content column + sticky consult card ≥ lg), reusing a shared component | `src/components/detail/DetailLayout.tsx:31-47`; `ProjectDetail.tsx:85-167`; `RentalDetail.tsx:130-167`; shared `DetailSection.tsx:26-36`, `DetailSubNav.tsx:28`, `DETAIL_ASIDE_CARD_CLASS` (`DetailLayout.tsx:8-9`) used by both `ProjectDetail.tsx:101` and `SaleContactBox.tsx:37`; tests `DetailLayout.test.tsx`, `project-detail.test.tsx` (`[data-detail-page]`, `rounded-[28px]`), `rental-detail.test.tsx:102-125` | ✅ | No copied layout code. `ProjectSubNav`/`ProjectSection` deleted (rename in `046d891`) |
| A1b | Same section heading style | `DetailSection.tsx:30` `font-display text-h2`; rental Terms/Description/Video/Location/Legal use `DetailSection` (`RentalDetail.tsx` RentalLongSections, `RentalTerms.tsx` non-collapsed); "Chi tiết" `RentalSpecs.tsx:63` → `text-h2` | ✅ | Rental "Tổng quan" uses the h1 as its label, with no visible h2 (single h1). Agreed in the T02 design (D2) |
| A2 | Scrolling down hides the header completely; only the sub-nav sticks at the page top (8/16px); smooth, no CLS; other pages keep BL-025/026 | `globals.css:248-252` (`--sticky-top` 0.5rem / ≥ lg 1rem under `html:has([data-detail-page])`), `:255-266` (transform `translateY(-100%)` when `[data-scrolled]:not(:has(:focus-visible))`, `--duration-slow` + `--ease-standard`, reduced-motion `transition: none`); `DetailSubNav.tsx:82` `sticky top-(--sticky-top)`; `HeaderFrame.tsx:40` keeps `h-(--header-offset)` in the flow (no CLS); test `detail-header-css.test.ts` (3 tests); dev-server 1280/375 measurements (T01:58-59, T02:52) | ✅ | Matches the user decisions: scrolling up does not bring the header back, it returns only at the top of the page or on Tab focus. Other pages are unaffected because `data-detail-page` appears only in `DetailLayout` (grep: only projects/rentals use it). Residuals: m-7 brief overlap after an anchor jump from the top; m-1 before hydration (user accepted) |
| A3 | Pale yellow background from a token (no new hex) | `DetailLayout.tsx:33` `bg-primary-subtle`; tests `DetailLayout.test.tsx` and `rental-detail.test.tsx:104` | ✅ | Dev server rgb(248,243,235) = #f8f3eb |
| A4 | Section content inside a rounded white card; consult card stays separate on the right | `DetailLayout.tsx:37` `rounded-[28px] bg-surface p-5 md:p-8 xl:p-10`; aside outside the card `:38-42`; `SaleContactBox.tsx:37` changed from `bg-primary-subtle` to a white card with `DETAIL_ASIDE_CARD_CLASS`; test `rental-detail.test.tsx:109-119` | ✅ | 28px = user decision "~28px". This is an arbitrary value with no token; it is explained in the T01 design (D3) |
| A5 | Active button `--color-primary` with `--color-primary-foreground` text ≥ 4.5:1; normal + focus-visible buttons clear on pale yellow | `DetailSubNav.tsx:96-97` (`bg-primary text-primary-foreground`; normal `text-text-secondary hover:bg-surface-muted`; `focus-visible:outline-focus-ring`); `src/lib/contrast.test.ts:71,195` (primary-foreground/primary ≥ TEXT), `:99` (focus-ring/surface); test `project-detail.test.tsx` "mục đang xem tô nền primary…" | ✅ | The links sit on the white pill (`ul bg-surface`), not directly on the yellow, so the focus-ring/surface contrast pair applies. Not checked visually on the yellow background (residual, LOW) |
| A6 | Section anchors not covered by the sub-nav (correct scroll-margin) | `DetailSection.tsx:29`, `Documents.tsx`, `LegalPolicy.tsx`, `DETAIL_ASIDE_CARD_CLASS`, `RentalDetail.tsx:57` (#overview), `RentalTerms.tsx:54` (#terms collapsed), `SaleContactBox.tsx:77` (#lead-form) all use `calc(var(--sticky-top)+4.5rem)`; tests `project-detail.test.tsx` (7 ids + #related-listings + card), `rental-detail.test.tsx:127-136`; dev server lands #location/#lead-form/#description at 88px | ✅ | `LeadFormSlot.tsx` default changed to `--sticky-top + 1rem`. On other pages `--sticky-top` = `--header-offset`, so behaviour is unchanged. `OBSERVER_MARGIN` -88px is approximate (T01 m-2, residual) |
| A7 | No horizontal overflow at 375/768/1280px; reduced-motion unchanged | Dev server 375 + 1280 `scrollWidth = clientWidth` (T01:58-59, T02:52); `globals.css:264-266`; `DetailSubNav.tsx:19-21,72` (`behavior: auto` when reduced motion) | ⚠️ evidence partial (residual, does not block) | 768px and reduced-motion were not checked visually on either page. The grid applies only from `lg`, so 768 uses the same 1-column layout as 375 (low risk). This is recorded in both tasks' Residual risk |
| U1 | Rental sub-sections: Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý; empty sections hide; no Thư viện | `src/lib/rentals/rental-detail-sections.ts` (`RENTAL_SECTION_IDS`, `visibleRentalSections`); render conditions in `RentalDetail.tsx:164-166` match it (`hasTerms`, `hasDescription`, `videoUrl`, `map`, `legalNote` are `string \| null` and already trimmed in `rental-view.ts:170-175`); i18n `vi.json`/`en.json` `page.rentalDetail.subNav*`; tests `rental-detail-sections.test.ts` (4), `rental-detail.test.tsx:76-100` (every anchor points to a real element) | ✅ | |
| U2 | Scrolling up does not bring the header back | `globals.css:260` (depends only on `data-scrolled`, no scroll direction) | ✅ | |
| U3 | Below lg, the rental contact card comes after the content card | `DetailLayout.tsx:37-42` (DOM order card → aside); test `rental-detail.test.tsx:124` | ✅ | Differs from design-spec S07 at 375px (see the doc reconcile list) |
| U4 | Before hydration the header covers the sub-nav (accepted risk) | `globals.css:248` (fixed `--sticky-top`); recorded in the spec delta (Khung trang) + T01 Residual | ✅ accepted | |
| T02 | Rented listing: banner + badge + "Căn tương tự đang trống" after the gallery + "Giá tham khảo" + collapsed Terms + form title + noindex/no JSON-LD unchanged | `RentalDetail.tsx` `before` (Breadcrumb `jsonLd={!view.rented}`, RentedBanner, Badge, `view.rented && similarBlock`), `after={!view.rented ? similarBlock : null}` (:162); test `rental-detail.test.tsx:138-166`; `page.tsx` not changed | ✅ | The "Điều khoản" anchor on a rented listing lands on a closed accordion and does not open it (T02 m-2, residual accepted) |
| T02 | Single h1; one lead form in the DOM (`#lead-form`, `source=rental`) | test `rental-detail.test.tsx:83,129-130,153-154` | ✅ | |

## Spec delta (`git diff SPECIFICATIONS.md`) ↔ code

| Spec delta passage | Matches code? | Lowers intent? | Note |
|---|---|---|---|
| Khung trang: detail-page exception — header slides up and hides when scrolling down, does not return on scroll-up, returns at the page top / on keyboard Tab focus; sub-nav at 8/16px; scroll-margin follows; before-JS risk accepted | ✅ `globals.css:240-266` | No. It records exactly change-doc point 2 as corrected by the user, plus the user decision | Reduced-motion for the hide/show slide is not stated inside the exception sentence; the general BL-025 sentence ("tức thì khi `prefers-reduced-motion`") still covers it. LOW, optional |
| Giao diện: both detail pages share one layout, `--color-primary-subtle` background, white pill sub-nav with active `--color-primary`/`--color-primary-foreground`, one white card ~28px with divider lines, ≥ lg 2 columns with separate sticky card, < lg card after the content card | ✅ `DetailLayout.tsx`, `DetailSubNav.tsx:97`, `DetailSection.tsx:9` | No | |
| F2: sub-nav sticks at the page top 8/16px, active item yellow with dark text, scroll-margin | ✅ | No | **[LOW] Leftover wording:** the same F2 paragraph still says "**< lg:** thẻ đó nằm **cuối cột chính** (sau Hỏi đáp — hoặc sau khối cuối cùng đang hiện)". In the code the aside sits **outside** the white card, after it (`DetailLayout.tsx:37-42`). This is not strictly wrong (in 1-column layout it is still "at the end"), but it is less precise than the Giao diện line ("< lg thẻ đó nằm sau thẻ nội dung"). Suggest aligning it to "sau thẻ nội dung (sau Hỏi đáp…)" before spec-publish |
| F3: detail layout = shared layout; order breadcrumb → Đã thuê banner → gallery (LCP; rented: similar listings) → sub-nav 6 items → white card → white sticky contact card ≥ lg, < lg after the content card → Tin tương tự | ✅ `RentalDetail.tsx:130-167` | No (the contact card moving below lg is a user decision) | |

There is no conflict with other parts of SPECIFICATIONS.md. Other pages (Tin tức, Tuyển dụng, Tin BĐS detail) keep using `--header-offset` (`JobDetail.tsx:85`, `ApplyFormSlot.tsx:25`, `PostShare.tsx:143`, `TableOfContents.tsx:37`, `RichText.tsx:192`), which is consistent with the scope "only project detail + rental detail".

## Gaps

- No [MISSING].
- No [PARTIAL] in the implementation.
- [LOW / spec-delta wording] F2 "< lg: thẻ đó nằm cuối cột chính" (see the table above). Fix before spec-publisher bumps to 1.23.0. Related tasks: T01 (close-out phase).

## As-built doc reconcile at close-out (exact lines)

`.context/design-spec.md`:
- **Line 70** (§1 heading size): "Heading phụ trong nội dung/trang chi tiết (… **mục chi tiết tin cho thuê**, … khung phải …) dùng `--text-h2-sm`". Rental detail section headings + "Chi tiết" are now `text-h2` (`DetailSection.tsx:30`, `RentalSpecs.tsx:63`). The form title in the contact card (`LeadFormSlot`) is still `text-h2-sm`, so line 70 needs updating: remove "mục chi tiết tin cho thuê" (and "khung phải" if it means the section, not the form title).
- **§2.1 line 80/81** (Header variant / Trang không có hero): add the detail-page exception (scrolled → `translateY(-100%)` hides it, no return on scroll-up, returns at the top / on `:has(:focus-visible)`, flow height still `--header-offset`).
- **§2.1 line 86** (Sticky): "Thanh phụ dính dưới header (**ProjectSubNav**) dùng `top: var(--header-offset)`; mọi đích neo dùng `scroll-margin-top` = `--header-offset` + 1rem (+ 4.5rem …)". Change to `DetailSubNav` + `--sticky-top` (`:root` = `--header-offset`; detail page 0.5rem / ≥ lg 1rem) and scroll-margin = `--sticky-top` + 4.5rem.
- **S03 line 350** (item 3, sub-nav): "`top: var(--header-offset)` nên giữ khe như thanh nổi thứ hai", "mục đang xem nền **`--color-dark` chữ sáng**", "`scroll-margin-top` = `--header-offset` + 4.5rem". Change to `top: var(--sticky-top)` (8/16px, sticks at the page top), active `--color-primary` / `--color-primary-foreground`, scroll-margin = `--sticky-top` + 4.5rem.
- **S03 line 351** (Layout): add the `--color-primary-subtle` page background + main column = one white card `bg-surface` 28px radius `p-5/md:p-8/xl:p-10`; "Thẻ `position: sticky` tại `top = header + 4.5rem`, cao tối đa `100dvh - header - 5.5rem`" → `--sticky-top + 4.5rem` / `100dvh - --sticky-top - 5.5rem`; "< lg `aside` nằm cuối cột chính" → after the content card (outside the card). Grid gap changed to `gap-x-8` / xl `gap-x-10` (`DetailLayout.tsx:36`; previously 10/12).
- **S03 line 363** (item 11 Tư vấn 1:1): "< lg nằm cuối cột chính" + "`scroll-margin-top` = `--header-offset` + 4.5rem" → after the content card + `--sticky-top` + 4.5rem.
- **S07 line 447** (item 2): "nút 'Xem video' nếu có `videoUrl`" → Video is its own section `#video` inside the white card (the code already worked this way before; reconcile anyway).
- **S07 line 448** (item 3): "Hai cột (≥ lg: nội dung 8 cột + khung phải 4 cột dính `top: header + 24px`)" → shared layout: sub-nav with 6 items (empty ones hidden) + white card `minmax(0,1fr)` + 22rem/xl 24rem, sticky contact card at `--sticky-top + 4.5rem`.
- **S07 line 449**: content order is now Tổng quan (h1 + code/date + address + Thông số chính + Chi tiết) → Điều khoản → Mô tả → Video → Vị trí → Pháp lý, with the anchor ids.
- **S07 line 450** ("Khung phải (`--color-primary-subtle`, padding 24px)") → white card 20px radius, border, `--shadow-md` (`DETAIL_ASIDE_CARD_CLASS`).
- **S07 line 459**: the rented case "Tin tương tự chuyển lên ngay sau thư viện ảnh (trước nội dung)" is still correct; add "(before the sub-nav)".
- **S07 line 464** (375): "khung giá + form nằm **sau** Thông số chính" → after the content card (user decision U3).
- **S07 line 466** (1024): "2 cột 8/4" → `minmax(0,1fr)` + 22rem.
- S07 line 469 / S03 line 374 (skeleton states): no change needed. S03 A11y line 375: still correct (`nav[aria-label="Mục lục dự án"]`); add the rental `nav[aria-label="Mục lục tin cho thuê"]` to S07.

Other as-built docs (not included in the close-out plan in T01:68, add them):
- `docs/DESIGN.md:240` (Chi tiết dự án row: "thanh mục con viên thuốc dính **dưới header nổi**") → sticks at the page top, header hidden, white card, yellow background.
- `docs/DESIGN.md:242` (Chi tiết tin cho thuê row: "Thư viện ảnh lớn → 2 cột: …") → shared layout + sub-nav.
- `docs/DESIGN.md:260` (header: "luôn là thanh nổi…; thanh dính phụ và neo dùng biến này") → add the detail-page exception + `--sticky-top`.
- `docs/ARCHITECTURE.md:181` ("thanh mục con dính (`ProjectSubNav`, …)") → `DetailSubNav` (`src/components/detail/`), `DetailLayout`, `DetailSection`.
- `.context/decisions.md`: append the change to the BL-025 decision for detail pages (T01:14).

## Residual risk (not a gap; already in the task files)

- Not checked visually: 768px, reduced-motion, rented listing, browsers without `:has()`, focus ring of the sub-nav links on the yellow background.
- m-1 (before hydration the header covers the sub-nav) was accepted by the user and is recorded in the spec delta.
- m-7: the header briefly overlaps the sub-nav after a hero anchor jump from the top. The final state is correct.
- `OBSERVER_MARGIN` -88px is approximate (< lg is ~8px too large; wrong without `:has()`).
- Collapsed rental Terms: the `#terms` anchor does not open the accordion; it repeats the frame classes of `DetailSection` (T02 m-1/m-2).
- T01 m-8 (record the attempt-3 measurement in the task file) and m-4 (stage only files with real changes; leave the EOL-only files out) are close-out items.
