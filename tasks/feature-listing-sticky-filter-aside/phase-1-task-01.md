# feature-listing-sticky-filter-aside · phase-1-task-01 — Danh sách: cột "Bộ lọc" dính dưới header + cuộn riêng; thẻ nổi bật bấm cả thẻ vào chi tiết

- Nguồn: BL-061 · change doc `spec/changes/2026-10-22-listing-sticky-filter-aside.md` (yêu cầu 1 + 2). Yêu cầu 3 (chi tiết 2 cột) là T02 — KHÔNG làm ở đây.
- Áp cho cả 3 màn danh sách `/du-an` · `/cho-thue` (+ danh mục) · `/tin-bds` (+ danh mục), vi + en. Không đổi schema / API / i18n / URL.
- **AUTO PROCEED** (user 2026-10-22: "tự quyết, đừng hỏi t"): phương án đã chốt ở § Quyết định, builder không hỏi; chỉ dừng khi thực sự blocked.

## Classification / Risk
- Type: **MODIFY** (đổi hành vi bố cục khung danh sách chung BL-052 — `SPECIFICATIONS.md:39` "Trang danh sách (khung chung)"; design-spec :233).
- Risk: **LOW–MEDIUM** — UI thuần, nhưng là component dùng chung 3 màn (`FilterSidebar`, `SpotlightSlider`, 3 `*SpotlightContent`). Không auth / schema / API.
- Expected review level: **NORMAL** (shared component + a11y link phủ).
- Blast radius: `src/components/listing/FilterPanel.tsx` (`FilterSidebar` :78-103), `src/components/listing/SpotlightSlider.tsx` (:44-81), `src/components/projects/ProjectSpotlightContent.tsx` (:53-62), `src/components/rentals/RentalSpotlightContent.tsx` (:56-64), `src/components/posts/PostSpotlightContent.tsx` (:81-90); test `SpotlightSlider.test.tsx`, `listing-filters.test.tsx` / `listing-layout.test.tsx` (nếu assert class sidebar), `project-components.test.tsx` / `RentalCard.test.tsx` / posts test có render SpotlightContent; doc as-built `.context/design-spec.md:233`, `docs/DESIGN.md:275`.

## Hiện trạng (file:line — không spawn Explore)
- Lưới thân trang: `ProjectListBody.tsx:146` / `RentalListBody.tsx:184` / `PostListBody.tsx` (tương tự): `grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[17.5rem_minmax(0,1fr)]` — cột trái `<FilterSidebar>` (`aside … max-lg:hidden`), cột phải thẻ nổi bật → `ResultsBar` → lưới + phân trang. Các khối sau lưới (`LearnMoreFaq`, `StrengthsBlock`, `ConsultBanner` — `ProjectListPage.tsx:196-199`) nằm **ngoài** lưới này → sticky trong ô lưới tự hết khi hết hàng lưới (= hết cột kết quả). `items-start` đã có nên ô `aside` cao bằng nội dung chính nó → **sticky cần đặt lên chính `aside`** (ô lưới `self-start` + `sticky` hoạt động vì containing block là grid area cao bằng hàng).
- Header trang danh sách luôn hiện (không `data-detail-page`): `--sticky-top` = `--header-offset` (4rem; ≥ lg 4.5rem) — `src/app/(frontend)/globals.css:240-263`. Header nổi kính mờ khi cuộn vẫn chiếm vị trí đó.
- `SpotlightSlider.tsx:51-67`: `section` > `ul` scroll-snap > `li` (`grid w-full shrink-0 snap-start lg:grid-cols-[…]`) chứa ô ảnh + `item.content` (slot). Mũi tên + bộ đếm ở `div.pointer-events-none.absolute` (:69-80) là **anh em sau `ul`** trong `section`, nút `pointer-events-auto`.
- `*SpotlightContent`: hai `<Link>` ở cuối: "Xem chi tiết" (`buttonVariants()`, `href=data.href`) + "Nhận tư vấn" (`outline`, `href=${data.href}#lead-form`). Ảnh / tiêu đề / mô tả / `dl` không phải link.
- `Select` của bộ lọc (`SelectFacet`) dựng qua Radix portal → không bị `overflow-y-auto` của aside cắt; `RangeSliderFacet` thumb nằm trong luồng.

## Quyết định (AUTO PROCEED)
1. **Bộ lọc dính, cuộn riêng (`FilterSidebar`)** — thêm vào class gốc `aside` (:84): `lg:sticky lg:top-[calc(var(--sticky-top)+1rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:overflow-y-auto lg:overscroll-y-contain` + thanh cuộn mảnh `[scrollbar-width:thin]` (+ `lg:self-start` cho chắc dù lưới đã `items-start`). Tách thành hằng xuất `LISTING_FILTER_STICKY_CLASS` trong `FilterPanel.tsx` (JSDoc: dính dưới header đang hiện; cao tối đa = phần màn hình còn lại; cuộn bên trong; `overscroll-contain` để cuộn hết bộ lọc không kéo trang; hết hàng lưới (= hết kết quả) thì thôi dính vì FAQ/CTA nằm ngoài lưới). Không đổi `max-lg:hidden`, không đổi `FilterSheet`.
   - Padding thẻ `p-5` giữ; nội dung cuộn **bên trong** thẻ (thẻ là vùng cuộn) — chấp nhận tiêu đề "Bộ lọc" cuộn theo (không làm tiêu đề dính riêng — YAGNI).
   - Không đo chiều cao bằng JS; CSS thuần.
2. **Thẻ nổi bật bấm cả thẻ (link phủ / stretched link, KHÔNG lồng `<a>`)**:
   - `SpotlightSlider.tsx` `li` (:56): thêm `relative group/spot` (containing block cho link phủ) — `li` đã `grid`; giữ `isolate`? → thêm `isolate` lên `li` để stacking của link phủ không tràn sang slide khác.
   - Khung phủ điều khiển (:69): thêm `z-10` để mũi tên / bộ đếm nổi trên link phủ (đang `absolute`, anh em sau `ul`).
   - Ba `*SpotlightContent`: link "Xem chi tiết" thêm class `after:absolute after:inset-0 after:content-[''] after:rounded-[20px]` (phủ toàn `li`; `rounded` để vùng focus/hover theo bo thẻ) — **giữ nguyên** chữ, `sr-only` tên tin, `buttonVariants()` (nút vẫn nhìn thấy, là mục focus). Thêm `data-stretched-link` để test tra. Link "Nhận tư vấn" thêm `relative z-10` (nằm trên vùng phủ → bấm vào vẫn tới `#lead-form`, không mở chi tiết). Link khác bên trong nội dung (nếu có, vd link danh mục) cũng `relative z-10` — hiện 3 file không có link khác.
   - Focus bàn phím: link "Xem chi tiết" là nút có outline sẵn (`buttonVariants` focus-visible). Thêm cho thẻ: `li` `group-has-[[data-stretched-link]:focus-visible]/spot:…`? → đơn giản: dùng `has-[[data-stretched-link]:focus-visible]:ring-2 has-[[data-stretched-link]:focus-visible]:ring-focus-ring` trên `li`? `li` nằm trong vùng cuộn `overflow-x-auto` của `ul` nên ring bị cắt ở mép → đặt lên `section` (gốc `SpotlightSlider`, đã `relative overflow-hidden rounded-[20px]`): `has-[[data-stretched-link]:focus-visible]:ring-2 ring-focus-ring ring-offset-2`. Kiểm `ring-focus-ring` có token (Grep `focus-ring` trong globals.css / tailwind) — không có thì dùng `outline-focus-ring` tương đương đang dùng ở `ARROW_CLASS`.
   - Hover: `li` có `group/spot`; tiêu đề `h2`/`h3` trong 3 `*SpotlightContent` thêm `group-hover/spot:text-accent-text transition-colors duration-(--duration-fast) motion-reduce:transition-none` (tín hiệu cả thẻ bấm được); con trỏ pointer tự có vì vùng phủ là `<a>`.
   - Chấp nhận: không bôi đen chữ trên thẻ bằng chuột (đặc tính link phủ) — ghi residual.
3. **Không đổi** `useSnapSlider`, cấu trúc `ul`/`li`, `aria-roledescription`, bộ đếm, `ResponsiveImage` sizes.

## Scope
1. Sửa theo § Quyết định 1–3.
2. Test (vitest + Testing Library, TDD — fail trước, pass sau):
   - `listing-filters.test.tsx` (hoặc file test mới `FilterPanel.test.tsx` nếu chưa có test `FilterSidebar`): `aside` có `lg:sticky`, `lg:overflow-y-auto`, `lg:overscroll-y-contain`, `lg:max-h-[…100dvh…]`, vẫn `max-lg:hidden`; hằng `LISTING_FILTER_STICKY_CLASS` được áp. `FilterSheet` không có các lớp này.
   - `SpotlightSlider.test.tsx`: (a) `li` có `relative`; khung điều khiển có `z-10`; (b) render với content chứa link có `data-stretched-link` → **không** có `a` lồng trong `a` (`container.querySelectorAll("a a").length === 0`); (c) `section` có lớp `has-[…focus-visible]:ring-2`.
   - Test 3 `*SpotlightContent` (`project-components.test.tsx` / `RentalCard.test.tsx` / `PostCard`/posts test — tìm file đang render chúng bằng Grep `SpotlightContent`): link "Xem chi tiết" có `after:absolute after:inset-0` + `data-stretched-link`; link "Nhận tư vấn" có `relative z-10` và `href` kết thúc `#lead-form`; tên truy cập hai link không đổi.
3. Kiểm thị giác + hành vi (Browser pane, dev server `tami-dev` trong `.claude/launch.json`, DB local; `/du-an`, `/cho-thue`, `/tin-bds` vi + en, 1440 / 1024 / 768 / 390):
   - 1440 + 1024: kéo trang → bộ lọc luôn trong màn hình dưới header; bộ lọc dài hơn màn hình (`/cho-thue` nhiều nhóm) cuộn được bên trong, không bị cắt; cuộn chuột trong bộ lọc tới đáy không kéo trang; kéo tới FAQ/CTA → bộ lọc thôi dính, không đè. Chụp `.context/review-reports/assets/bl061-p1t01-<màn>-<w>.png` (ít nhất: du-an-1440 giữa trang, cho-thue-1440 bộ lọc cuộn trong, du-an-1440 cuối lưới/FAQ, tin-bds-1024, cho-thue-390 ngăn kéo không đổi, en-1440).
   - Thẻ nổi bật: bấm ảnh / tiêu đề / vùng trống → vào chi tiết; bấm "Nhận tư vấn" → URL `#lead-form` chi tiết (không về trang chi tiết thường — kiểm URL); mũi tên chuyển slide không điều hướng; Tab tới "Xem chi tiết" + Enter mở chi tiết; ring focus quanh thẻ.
   - Không chạy được dev server → ghi residual, không bịa.
4. Doc impact (as-built, builder sửa): `.context/design-spec.md:233` (khung danh sách chung: thêm "≥ lg `FilterSidebar` dính dưới header `--sticky-top` + 1rem, cao tối đa phần màn hình còn lại, cuộn riêng `overscroll-contain`, thôi dính khi hết lưới kết quả (FAQ/CTA ngoài lưới); `SpotlightSlider` cả thẻ là link (link phủ từ nút "Xem chi tiết", không lồng `a`; "Nhận tư vấn" + mũi tên `z-10` giữ hành vi riêng; focus-visible ring quanh thẻ; tiêu đề đổi màu nhấn khi hover)"); `docs/DESIGN.md:275` (Khung danh sách BL-052 — câu as-built BL-061 tương tự, ngắn). KHÔNG sửa `SPECIFICATIONS.md` / `spec/**` (spec-publisher làm ở close-out).
5. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file scope>` (`pnpm lint` exit 1 sẵn do `.local-seed/*` git-ignored, ngoài scope) · `pnpm test` (đủ bộ; chạy nền được nhưng **chờ xong**) · `pnpm build`.
6. **KHÔNG commit** (primary commit sau Reviewer PASS). Không stage / không đụng file dirty ngoài scope (`.claude/**`, `.context/project-config.md`, `CLAUDE.md`, `opencode.jsonc`, `importMap.js`, `payload-types.ts`, `template-feedback.md`, change doc khác).
7. Ghi `## Verification summary` vào cuối file này (thay đổi, verify + kết quả, ảnh, doc impact, residual) **trước khi** trả report. Report mở đầu `Agent: builder`.

## Acceptance
- [ ] ≥ lg, 3 màn: kéo trang, bộ lọc luôn trong màn hình dưới header; dài hơn màn hình → cuộn bên trong, không cắt; cuộn bộ lọc không cuộn trang.
- [ ] Hết lưới kết quả → bộ lọc thôi dính, không đè FAQ/CTA/footer. < lg không đổi (nút "Bộ lọc" + Sheet / `details`).
- [ ] Thẻ nổi bật 3 màn: bấm ảnh / tiêu đề / vùng trống → chi tiết; "Nhận tư vấn" → `#lead-form` (hành vi cũ); mũi tên/bộ đếm không điều hướng; không lồng `<a>`; Tab tới được, Enter mở; focus nhìn thấy.
- [ ] Test cập nhật PASS; typecheck + eslint (scope) + test + build PASS.
- [ ] design-spec + DESIGN.md as-built; không đụng `spec/**`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Thay đổi (builder, 2026-10-22):**
- `src/components/listing/FilterPanel.tsx` — hằng xuất `LISTING_FILTER_STICKY_CLASS` (`lg:sticky lg:top-[calc(var(--sticky-top)+1rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain lg:[scrollbar-width:thin]`, JSDoc WHY) áp lên `aside` của `FilterSidebar`; `max-lg:hidden` + `FilterSheet` không đổi.
- `src/components/listing/SpotlightSlider.tsx` — `li` thêm `group/spot relative isolate`; khung mũi tên/bộ đếm thêm `z-10`; `section` thêm `has-[[data-stretched-link]:focus-visible]:ring-2 … ring-focus-ring … ring-offset-2`; JSDoc mô tả cơ chế link phủ.
- `src/components/listing/spotlight-content-classes.ts` (**mới**, module thường không "use client" vì 3 `*SpotlightContent` là server component) — `SPOTLIGHT_STRETCHED_LINK_CLASS` (`after:absolute after:inset-0 after:rounded-[20px] after:content-[''] active:translate-none`), `SPOTLIGHT_SECONDARY_LINK_CLASS` (`relative z-10`), `SPOTLIGHT_TITLE_CLASS` (tiêu đề + `group-hover/spot:text-accent-text`).
- `src/components/projects/ProjectSpotlightContent.tsx`, `src/components/rentals/RentalSpotlightContent.tsx`, `src/components/posts/PostSpotlightContent.tsx` — "Xem chi tiết" `data-stretched-link` + lớp phủ; "Nhận tư vấn" `relative z-10`; tiêu đề dùng `SPOTLIGHT_TITLE_CLASS`. Chữ / `sr-only` / href không đổi.
- **Root cause tìm được khi kiểm hành vi (không có trong § Quyết định):** `buttonVariants` có `active:translate-y-px` — transform lúc nhấn chuột biến chính link thành containing block của `::after`, vùng phủ co về đúng nút, mouseup rơi vào ảnh/chữ → `click` target là `LI` (tổ tiên chung), không điều hướng (tái hiện trên Chrome: pointerdown/mousedown target `A[stretched]`, click target `LI`). Fix: `active:translate-none` trong `SPOTLIGHT_STRETCHED_LINK_CLASS` (tailwind-merge nhóm `translate-none` loại `active:translate-y-px`), test khoá lại.
- Test (TDD, fail trước → pass sau): `listing-filters.test.tsx` (sticky class + Sheet không có), `SpotlightSlider.test.tsx` (li relative/isolate, controls z-10, không `a a`, ring `has-[…]` trên section), `project-components.test.tsx` (+ `active:translate-none` / không `active:translate-y-px`), `post-components.test.tsx`, `RentalCard.test.tsx` (describe `RentalSpotlightContent` mới).
- Doc as-built: `.context/design-spec.md` (§4 khung danh sách chung — câu **BL-061**), `docs/DESIGN.md` (hàng "Khung danh sách (BL-052)" — câu **BL-061**). Không đụng `SPECIFICATIONS.md` / `spec/**`.

**Verify (`.context/project-config.md`):**
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | exit 0 |
| `npx eslint <11 file scope>` | exit 0 (`pnpm lint` ngoài scope: `.local-seed/*` sẵn exit 1) |
| `pnpm test` (đủ bộ, sau fix `active:translate-none`) | 420 files / 4403 tests PASS, exit 0 (~4 phút) |
| `pnpm build` (sau fix) | Compiled successfully, exit 0 |
| oxlint | không có config trong repo → skip |

**Kiểm thị giác + hành vi** (dev server `next dev` cổng 3000 đang chạy từ session khác trong cùng thư mục — `tami-dev` của session này không mở được cổng 3001 vì Next chặn 2 dev server cùng dir; dùng server 3000 (HMR cùng source) qua Browser pane + Edge headless CDP để lưu PNG):
- `/du-an` 1440: cuộn 1200px → `aside` `position: sticky`, top 88px (= 4.5rem + 1rem), đáy 884 < 900, `max-height` 796px, `overflow-y: auto`, `overscroll-behavior-y: contain` — `bl061-p1t01-du-an-1440.png`.
- `/cho-thue` 1440: bộ lọc dài (scrollHeight 1445 > client 794) cuộn bên trong tới đáy (scrollTop 651), trang không cuộn theo — `bl061-p1t01-cho-thue-1440-filter-scrolled.png`.
- `/du-an` 1440 cuối lưới: `aside` trôi lên cùng hàng lưới (top −455), không đè Điểm mạnh / CTA — `bl061-p1t01-du-an-1440-end-of-grid.png`.
- `/tin-bds` 1024: sticky top 88, max-height 664 — `bl061-p1t01-tin-bds-1024.png`. `/tin-bds` 1440 (đo): sticky, 0 `a a`, mọi `li` relative.
- `/cho-thue` 390: `aside` `display: none`, nút "Bộ lọc" 44px, không h-scroll — `bl061-p1t01-cho-thue-390.png`. `/cho-thue` 768 (đo): aside ẩn, nút Bộ lọc có, không h-scroll.
- `/en/projects` 1440: sticky (top 24 khi hàng lưới ngắn vừa chạm đáy màn), nhãn EN — `bl061-p1t01-en-1440.png` (EN chỉ 3 dự án, không tin nổi bật).
- Thẻ nổi bật `/du-an` (Browser pane, click thật): bấm ảnh → `/du-an/sun-festo-town-ha-long`; bấm tiêu đề → chi tiết; bấm vùng trống dưới dải thông số → chi tiết; bấm "Nhận tư vấn" → `/du-an/sun-festo-town-ha-long#lead-form`; bấm mũi tên "sau" → handler nhận click (target `svg`, không trong `a`), `scrollTo({left: 902, smooth})`, bộ đếm `2 / 5`, URL giữ `/du-an`; Tab tới "Xem chi tiết" → `:focus-visible` true, `section:has(…)` true, ring 4px (ring-2 + offset-2) quanh thẻ — `bl061-p1t01-du-an-1440-spotlight-focus.png`; Enter → chi tiết. `elementFromPoint` tại tâm ảnh và tâm tiêu đề = link phủ.

**Residual:**
- Chữ trên thẻ nổi bật không bôi đen được bằng chuột (đặc tính link phủ, đã chấp nhận ở § Quyết định).
- `/cho-thue` / `/tin-bds` chỉ đo bằng JS + ảnh (sticky, không `a a`, stretched link có); click thật chỉ chạy trên `/du-an` — 3 màn dùng chung `SpotlightSlider` + cùng hằng class nên cơ chế giống nhau.
- Ảnh Edge headless chụp trước khi React hydrate xong (thấy nút "Áp dụng" no-JS) — bố cục sticky là CSS thuần nên không ảnh hưởng; không phải lỗi app.
