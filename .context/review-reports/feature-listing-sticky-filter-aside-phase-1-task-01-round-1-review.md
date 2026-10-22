# Agent: reviewer — feature-listing-sticky-filter-aside · phase-1-task-01 · round-1

- Task: `tasks/feature-listing-sticky-filter-aside/phase-1-task-01.md` (BL-061, yêu cầu 1 + 2 của `spec/changes/2026-10-22-listing-sticky-filter-aside.md`)
- Ngày review: 2026-10-22 · Branch: `staging` (chưa commit, working tree)

## Review level: NORMAL
**Reason:** UI thuần, không auth / schema / API / tenant; nhưng đụng component dùng chung 3 màn danh sách (`FilterSidebar`, `SpotlightSlider`, 3 `*SpotlightContent`) + a11y link phủ + root cause mới phát hiện (`active:translate-y-px`) → không FAST; không có risk đỏ nên không STRICT.

## Blast radius
- `src/components/listing/FilterPanel.tsx` — `FilterSidebar` (3 màn `/du-an`, `/cho-thue`, `/tin-bds` + danh mục, vi/en). `FilterSheet` (< lg) không đổi.
- `src/components/listing/SpotlightSlider.tsx` — slider nổi bật 3 màn.
- `src/components/listing/spotlight-content-classes.ts` (mới) → `ProjectSpotlightContent.tsx`, `RentalSpotlightContent.tsx`, `PostSpotlightContent.tsx`.
- Không đụng `useSnapSlider`, `ResponsiveImage`, i18n, URL, API, schema, `spec/**`, `SPECIFICATIONS.md`.

## Verify commands + result (từ `.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | exit 0 |
| `npx eslint <11 file scope>` | exit 0 |
| `npx vitest run src/components/listing src/components/projects/project-components.test.tsx src/components/posts/post-components.test.tsx src/components/rentals/RentalCard.test.tsx` | 9 files / 102 tests PASS, exit 0 |
| `pnpm test` đủ bộ · `pnpm build` | không chạy lại (builder báo 4403 pass / build exit 0; scope test đã tự chạy PASS, không nghi ngờ) |

## Kiểm nội dung (theo trọng tâm)

### (1) Sticky filter — OK
- `FilterPanel.tsx:73-74` `LISTING_FILTER_STICKY_CLASS` = `lg:sticky lg:top-[calc(var(--sticky-top)+1rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-contain lg:[scrollbar-width:thin]`, áp lên `aside` (:88) cùng `max-lg:hidden` giữ nguyên.
- Lưới cha 3 `*ListBody` (`ProjectListBody.tsx:141`, `RentalListBody.tsx:184`, `PostListBody.tsx:149`) đều `grid items-start … lg:grid-cols-[16rem_minmax(0,1fr)]` → ô `aside` cao bằng nội dung, containing block sticky = hàng lưới; FAQ / Điểm mạnh / CTA nằm ngoài lưới → thôi dính khi hết kết quả. Đúng cơ chế.
- Token: `--sticky-top: var(--header-offset)` (4rem / ≥ lg 4.5rem) ở `globals.css:240-247`; trang danh sách không `data-detail-page` nên không bị override 0.5/1rem (:259-263). Builder đo top 88px = 72 + 16, max-h 796 = 900 − 72 − 32 — khớp công thức.
- `100dvh` (không `100vh`); `overscroll-y-contain` đúng yêu cầu "cuộn bộ lọc không cuộn trang".
- Không ảnh hưởng form GET no-JS: chỉ thêm class lên `aside`, test no-JS `listing-filters.test.tsx:296` vẫn PASS. `Select` dựng qua Radix portal nên không bị `overflow-y-auto` cắt; thumb `RangeSliderFacet` (`after:-inset-3` = 12px) nằm trong `p-5` (20px) nên không sinh h-scroll trong aside.
- Ảnh `bl061-p1t01-cho-thue-1440-filter-scrolled.png`: nội dung bộ lọc đã cuộn bên trong thẻ (nhóm Nội thất / Tiện ích thấy, chip đầu bị cắt tại mép trên thẻ), header + lưới kết quả ở vị trí bình thường.

### (2) Link phủ — OK
- `SpotlightSlider.tsx:63` `li` `group/spot relative isolate` → stacking context riêng / containing block cho `::after` của link. Ô ảnh `div.relative` đứng trước slot trong DOM, `::after` (positioned, z-auto) đứng sau → overlay phủ trên ảnh.
- Khung điều khiển `:78` `absolute … z-10` là anh em sau `ul` trong `section relative` → nổi trên mọi `li`; nút `pointer-events-auto` nhận click, không nằm trong `a`.
- "Nhận tư vấn" `relative z-10` (`SPOTLIGHT_SECONDARY_LINK_CLASS`) trong cùng stacking context `li` → trên `::after` (z-auto) → tới `#lead-form`. Không lồng `<a>`: `::after` là pseudo của chính link, test `a a` = 0 (`SpotlightSlider.test.tsx:54`).
- Root cause `active:translate-none`: `button.tsx:8` `buttonVariants` có `active:translate-y-px`, không có `relative` / `hover:` transform. Thuộc tính `translate` tạo containing block cho descendant absolute → `::after` co về nút khi nhấn → mouseup rơi ngoài `a` → `click` không điều hướng. Phân tích đúng. `cn(buttonVariants(), SPOTLIGHT_STRETCHED_LINK_CLASS)` — tailwind-merge xoá `active:translate-y-px` (test `project-components.test.tsx:142-143` khoá). Chỉ áp cho link phủ của thẻ nổi bật, nút khác (kể cả "Nhận tư vấn") giữ hiệu ứng nhấn. Không có hover transform nên không có vòng lặp hover/co overlay.
- Focus-visible: `section` `has-[[data-stretched-link]:focus-visible]:ring-2 … ring-focus-ring … ring-offset-2` (`--color-focus-ring` tồn tại `globals.css:54`); đặt lên `section` vì `li` trong `ul overflow-x-auto` sẽ cắt ring — hợp lý. Ảnh `bl061-p1t01-du-an-1440-spotlight-focus.png` thấy ring vàng quanh thẻ + nút "Xem chi tiết" focus. Link `a` vẫn có outline UA mặc định.
- Tên truy cập: chữ + `sr-only ": {title}"` không đổi (test `getByRole("link", { name: "Xem chi tiết: …" })` 3 file PASS).

### (3) Test — chấp nhận
- Test khoá: không `a a` (hành vi thật), `href` "Nhận tư vấn" kết thúc `#lead-form`, tên link, `data-stretched-link` chỉ ở 1 link, `active:translate-y-px` bị loại. Các assert còn lại là class Tailwind (bất khả kháng trong jsdom — hành vi CSS/click thật được builder kiểm trên Browser pane có ảnh + số đo). TDD (fail trước / pass sau) theo journal.

### (4) AI-slop / dead code — OK
- Không dead code, không comment WHAT; JSDoc giải thích WHY (containing block, isolate, vì sao ring ở section, vì sao `translate-none`). Hằng đặt tên rõ, tách module không "use client" đúng lý do (server component import chuỗi).

### (5) Doc as-built — OK
- `.context/design-spec.md:233` + `docs/DESIGN.md:275` thêm câu BL-061 khớp code (công thức top/max-h, overscroll, thôi dính, link phủ, z-10, ring, hover). Không đụng `spec/**` / `SPECIFICATIONS.md` (diff spec/ chỉ `BACKLOG.md` — ngoài scope task, bỏ qua theo chỉ đạo primary).

## Responsive Checklist Gate (diff đụng UI — chỉ phần thay đổi)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout: không h-scroll; mobile-first `min-width`; không fixed px | OK | Chỉ thêm class `lg:` (min-width 1024); < lg `max-lg:hidden` giữ, FilterSheet không đổi (test). Ring = box-shadow, không tạo scrollable overflow. Builder đo 390/768 không h-scroll (`bl061-p1t01-cho-thue-390.png`). |
| Typography/Spacing | OK | Tiêu đề dùng token `text-h3`; lề `1rem/2rem` trong calc, không `px`. |
| Media | N/A | Không đổi `ResponsiveImage` / sizes. |
| Touch/Interaction | OK | Nút 44px (`h-11`) không đổi; vùng bấm thẻ mở rộng; mũi tên 44px `z-10` vẫn bấm được (builder click thật). |
| Viewport/A11y | OK | `100dvh` (không `100vh`); `motion-reduce:transition-none` ở tiêu đề; không dùng `overflow:hidden` che lỗi (overflow-y-auto có chủ đích). |
| 375 / 768 / 1280 | OK (CSS math) | < 1024: aside `display:none`, không class mới có hiệu lực. ≥ 1024: 1 cột lọc 16rem + kết quả; sticky trong hàng lưới. Ảnh 1024/1440/390 có. |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` not installed |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`); eslint scope exit 0 |
| ocr (open-code-review) | skip, `ocr` not installed |
| AI-readable | OK — 0 indicator (tên rõ, hàm ngắn, comment WHY, doc as-built cập nhật) |
| ai-friendly-web | N/A — không đổi robots/sitemap/llms, không đổi public contract |
| blitzstrike | N/A — không auth/API/input |

## Findings
Không có CRITICAL / MAJOR.

- [MINOR] `src/components/listing/spotlight-content-classes.ts:11` — `after:content-['']` thừa với Tailwind v4 (variant `after:` đã tự đặt `content: var(--tw-content)` mặc định `''`); `after:rounded-[20px]` trên overlay trong suốt không có tác dụng thị giác (section đã `overflow-hidden rounded-[20px]`). Vô hại; có thể bỏ ở lần chạm file sau, không cần round 2.
- [MINOR] `src/components/listing/FilterPanel.tsx:74` — `lg:self-start` lặp với `items-start` của lưới cha (3 ListBody). Có chủ đích (phòng thủ, đã ghi trong task); giữ được.
- [MINOR] Test 5 file phần lớn assert class Tailwind (hợp đồng CSS), không mô phỏng được sticky/click qua `::after` trong jsdom — đã bù bằng kiểm thật của builder (ảnh + số đo). Chấp nhận.

## Residual risk
- Click thật chỉ chạy trên `/du-an`; `/cho-thue` + `/tin-bds` dùng chung `SpotlightSlider` + cùng hằng class nên cơ chế giống nhau (đo JS: 0 `a a`, link phủ có).
- Chữ trên thẻ nổi bật không bôi đen được bằng chuột (đặc tính link phủ — đã chấp nhận ở task).
- Rê chuột lên bất kỳ chỗ nào của thẻ cũng kích `hover:` của nút "Xem chi tiết" (pseudo `::after` thuộc chính link) — đặc tính stretched link, không phải lỗi.
- `:has()` trên `section` — baseline mọi trình duyệt hiện đại từ 2023; trình duyệt cũ chỉ mất ring quanh thẻ, link vẫn có outline UA.
- Reviewer không chạy app; dựa vào ảnh + số đo trong Verification summary và test scope tự chạy.

## Verdict: ✅ PASS
