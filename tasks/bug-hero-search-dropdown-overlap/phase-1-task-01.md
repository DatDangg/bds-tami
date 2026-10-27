# bug-hero-search-dropdown-overlap · phase-1-task-01 — Trang chủ: dropdown "Tùy chọn khác" mở đồng thời, chồng nhau (BL-083)

- Change doc: `spec/changes/2026-10-27-hero-search-dropdown-overlap.md` (BACKLOG BL-083, QA bug 8).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer NORMAL PASS r1 (`.context/review-reports/bug-hero-search-dropdown-overlap-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.59.0), test-scope v82. Doc impact: no doc impact.

## Classification / Risk
- Type: **BUG** (UI interaction; không đổi API/schema/requirement).
- Risk: **MEDIUM** — `OptionSelect`/`Select` là component dùng chung (HeroSearch, FilterFacets, JobFilters, FormField, *SortControl, FloorPlans) nếu sửa ở tầng chung.
- Expected review level: **STRICT** nếu đổi `src/components/ui/option-select.tsx`/`select.tsx` (shared component); **NORMAL** nếu chỉ đổi `HeroSearch.tsx`.
- Doc impact: dự kiến `no doc impact`.

## Repro (trước khi sửa) — change-request kiểm trên staging 2026-10-27, 1920×1080, click chuột thật
- Mở "Mức giá" → `document.body.style.pointerEvents === "none"` (Radix Select modal, `disableOutsidePointerEvents`), nhưng `elementFromPoint` tại tâm trigger "Diện tích" vẫn trả về chính trigger đó với computed `pointer-events: auto`.
- Click "Diện tích" → cả 2 trigger `data-state=open`, 2 listbox `data-state=open`.
- (Dispatch PointerEvent tổng hợp bằng JS KHÔNG tái hiện — chỉ click thật.)

## Root cause
`src/components/home/HeroSearch.tsx:182-184`: section `pointer-events-none` (để vùng gutter chồng lên HeroSlider `md:-mt-24` vẫn bấm xuyên xuống slider) + thẻ tìm kiếm `pointer-events-auto`. Khi Radix Select mở, nó chặn tương tác ngoài bằng `body { pointer-events: none }` (layer `disableOutsidePointerEvents`), nhưng `pointer-events-auto` tường minh trên thẻ ghi đè giá trị kế thừa → pointerdown chạm được trigger chip khác. Trigger Radix mở Select ngay trong `onPointerDown` (`@radix-ui/react-select` trigger `handleOpen`), layer mới (cũng `disableOutsidePointerEvents`) mount trước khi listener `pointerdown` ở document của layer cũ chạy → với layer cũ `isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex` thành false (`@radix-ui/react-dismissable-layer` `shouldHandlePointerDownOutside`) → layer cũ không dismiss → 2 dropdown cùng mở. Ở các trang khác không có `pointer-events-auto` ghi đè nên click ra ngoài bị body chặn, chỉ đóng dropdown (builder xác nhận lại bằng test/trình duyệt).

## Thiết kế fix (builder chọn, ghi Decision log)
- A (ưu tiên — sửa tại gốc, phạm vi hẹp): giữ hành vi bấm xuyên ở vùng ngoài thẻ, nhưng khi một layer modal Radix đang chặn body thì thẻ KHÔNG ghi đè `pointer-events` (vd variant theo thuộc tính body mà `react-remove-scroll`/Radix đặt khi mở — `data-scroll-locked`, hoặc bỏ cặp none/auto nếu chứng minh được slider không cần — kiểm `HeroSlider` `overlapsSearch` các control đã dời `md:bottom-28`).
- B: đảm bảo "chỉ 1 OptionSelect mở" ở tầng component (open controlled + đóng cái khác) — chỉ khi A không khả thi; phải giữ nguyên bàn phím/Esc/typeahead.
- Không đổi DOM/hành vi không-JS (`progressive` `<select>` gốc + hidden input).

## Files
- `src/components/home/HeroSearch.tsx` (+ test `HeroSearch.test.tsx` nếu có), có thể `src/components/ui/option-select.tsx` (phương án B).
- KHÔNG đụng file dirty của việc khác (xem change-request batch: `src/collections/*`, `src/fields/ward-in-province.ts`, `package.json`, `pnpm-lock.yaml`, `tools/*`, `.gitignore`, `.claude/settings.json`, importMap.js, BACKLOG.md).

## Acceptance
- [ ] Mở dropdown thứ hai thì dropdown đầu đóng (chỉ 1 mở) — click chuột thật ở trình duyệt; tương tự ở nơi khác dùng `OptionSelect` cùng hàng (FilterFacets `/cho-thue`, ProjectFilters/JobFilters).
- [ ] Chọn được mọi tùy chọn, bàn phím/Esc vẫn đúng; không JS vẫn gửi form được như cũ; vùng ngoài thẻ (gutter trên slider) vẫn bấm xuyên khi không mở dropdown.
- [ ] Test tái hiện (fail trước, pass sau) + kiểm trình duyệt thật (Playwright/dev server local, 1920 & 390). `pnpm typecheck` · `pnpm test` (unit) · eslint file đổi · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause chưa có trong change doc → tự debug trên staging (không spawn Explore), kết quả ở trên.
- 2026-10-27 (builder): chọn phương án A — `pointer-events-auto` của thẻ thành `not-in-data-[scroll-locked]:pointer-events-auto` (Tailwind v4; `react-remove-scroll` đặt `data-scroll-locked` trên body khi Select modal mở). Khi khoá, thẻ kế thừa `none` từ section → click chip khác không chạm trigger, thành pointerdown-outside đóng dropdown đầu; không đụng `OptionSelect`/`select.tsx` (không cần B). Review level dự kiến NORMAL. Doc impact: no doc impact.

## Repro Verification
- Original repro: trang chủ `/vi`, mở "Mức giá" rồi click chuột thật vào "Diện tích" (1920 và 390).
- Expected: chỉ 1 listbox mở.
- Actual before fix: `body.style.pointerEvents="none"` + `data-scroll-locked` nhưng sau click 2 → 2 listbox open, 2 trigger `aria-expanded=true` (Edge/Playwright, cả 1920 và 390; ảnh `.context/review-reports/assets/bl083-before-*.png`). Root cause xác nhận đúng.
- Actual after fix: sau click trigger thứ hai → 0 listbox (dropdown đầu đóng như click-outside ở trang khác), Esc OK; chọn option bằng chuột + bàn phím (Enter, ArrowDown, Enter) đúng; khi đóng card computed `pointer-events:auto`, section `none`, `elementFromPoint` ở gutter ngoài thẻ trả về slider (bấm xuyên giữ nguyên); khi mở card `none`. 1920 và 390 (ảnh `bl083-after-*.png`, `bl083-1920-final.png`).
- Evidence: test `HeroSearch.test.tsx` "BL-083" FAIL trước fix / PASS sau (jsdom không mô phỏng pointerdown thật → test khoá class; hành vi thật kiểm bằng Playwright msedge). `/vi/cho-thue` chỉ có 1 combobox trong main khi kiểm → FilterFacets không dùng override pointer-events, không đổi.
- Status: PASS (chờ reviewer)

## Close-out (change-request)
- Reviewer MINOR 1 xử lý: thêm comment chặn "đơn giản hoá" ngược ở `HeroSearch.tsx` (chỉ comment; eslint/typecheck/HeroSearch.test 16/16 PASS lại).
- Reviewer MINOR 3 (diễn giải acceptance): hành vi as-built = bấm chip thứ hai khi một dropdown đang mở → dropdown đầu ĐÓNG, chưa mở cái thứ hai (bấm lần nữa mới mở) — đúng click-outside chuẩn Radix như mọi `OptionSelect` khác trên site; "chỉ 1 mở" luôn đúng.
- MINOR 2 (e2e Playwright thật) + ghi chú ngoài scope (`pointer-events-auto` ở header/HeroSlider controls/BackToTop/FloatingContact vẫn bấm được khi Select mở) → follow-up, không chặn.
