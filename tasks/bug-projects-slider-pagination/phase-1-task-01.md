# bug-projects-slider-pagination · phase-1-task-01 — Slider Dự án nổi bật: mũi tên/chấm chuyển sai (BL-038)

- Change doc: `spec/changes/archive/2026-10-20-projects-slider-pagination-bug.md` (BACKLOG BL-038).
- Phụ thuộc: không. Chạy TRƯỚC BL-037 (cùng chạm `ProjectsSlider.tsx`).
- Trạng thái: `done` — Reviewer STRICT PASS r1, spec 1.31.1 / scope v39 — user "làm đi" (auto proceed).

## Classification / Risk
- Type: **BUG** (UI client-side; không schema/API/quyền/dữ liệu/i18n mới).
- Risk: **MEDIUM** — hook dùng chung `useSnapSlider` (ProjectsSlider dùng `current`/`scrollToSlide`; OffersSlider + RentalsTabs chỉ dùng `listRef` + `scrollByPage`).
- Expected review level: **STRICT** (shared hook) hoặc NORMAL theo reviewer.
- Blast radius: trang chủ `/vi`, `/en` — slider Dự án nổi bật (mũi tên + chấm), slider Ưu đãi, slider Cho thuê (chỉ `scrollByPage`, không đổi).
- Doc impact: `.context/design-spec.md` S01 khối 3 (chấm = số vị trí cuộn được; cuối → vòng về đầu) → spec-publisher PATCH.

## Repro (trước khi sửa)
Đo trên dev server 1280×900 (`ul.clientWidth` 1265, `scrollWidth - clientWidth` = 1702, 6 thẻ 464px gap 24px → mép trái thẻ `31 + 488·i`, offset snap `0, 488, 976, 1464, 1952, 2440`).
Pane trình duyệt bị ẩn nên IntersectionObserver không phát callback (đã xác nhận: observer thử nghiệm `seen: []`) → mô phỏng hình học thuật toán hiện tại (`threshold 0.6`, callback `for` lấy entry giao cắt CUỐI):
- Tải trang (scroll 0): thẻ 0 (100%) + thẻ 1 (100%) ≥ 0.6, thẻ 2 chỉ 56% → batch đầu [0 true, 1 true] → `current = 1` → **chấm 2 active trong khi thẻ đầu là thẻ 1** (chấm lệch).
- Bấm › → `scrollToSlide(2)` → scroll 976 → batch [2 true, 3 true] → `current = 3`.
- Bấm › → `scrollToSlide(4)` → thẻ 4 offset 1952 > max 1702 → cuộn kẹt ở 1702 → thẻ 4, 5 hiện → `current = 5`.
- Bấm › → `scrollToSlide(6 % 6 = 0)` → về đầu.
→ Mỗi lần › nhảy **2 thẻ** (1→3→5→đầu) = "nhảy cóc"; chấm 1, 3, 5 (index 0/2/4) gần như không bao giờ active; thẻ 4/5 không cuộn tới `inline:start` được.

## Root cause (chứng minh bằng code + hình học)
`src/components/home/use-snap-slider.tsx:21-33` — `current` lấy từ IntersectionObserver: khi ≥ 2 thẻ cùng ≥ 60% hiện, vòng `for` gọi `setCurrent` cho mọi entry, entry CUỐI (index lớn nhất) thắng → `current` = thẻ phải nhất đang hiện, không phải thẻ đầu. `scrollToSlide(current ± 1)` (`:35-41`) cộng/trừ từ giá trị lệch đó → nhảy cóc; số chấm = số thẻ dù chỉ có 5 vị trí cuộn được ở 1280px.

## Thiết kế fix
`src/components/home/use-snap-slider.tsx`:
- Bỏ IntersectionObserver. Khi `observe` (`trackCurrent && count > 1`):
  - `measure()`: nếu `list.clientWidth === 0` (chưa layout / jsdom) → giữ mặc định. Ngược lại `offsets[i] = rect(child i).left − rect(child 0).left` (độc lập scrollLeft), `max = scrollWidth − clientWidth`; `pageCount` = index thẻ đầu tiên có `offset ≥ max − 1` cộng 1 (không có → `count`); tất cả vừa khung → 1. Lưu offsets vào ref, `setPageCount`, rồi `updateCurrent()`.
  - `updateCurrent()`: `s = scrollLeft`; `s ≥ max − 1` → `pageCount − 1` (cuộn hết = chấm cuối active); ngược lại index trong `[0, pageCount−1]` có `min(offset, max)` gần `s` nhất.
  - Lắng `scroll` (passive, gộp bằng `requestAnimationFrame`) → `updateCurrent`; `ResizeObserver` trên list (nếu có) → `measure`. Cleanup đủ.
- `scrollToSlide(target)`: `idx = ((target % pageCount) + pageCount) % pageCount` (giữ hành vi VÒNG ở đầu/cuối như cũ); `list.scrollTo?.({ left: min(offsets[idx], max), behavior })`. Chưa đo (offsets rỗng) → fallback `children[idx].scrollIntoView` như cũ.
- Trả thêm `pageCount` (mặc định `count`). `scrollByPage` không đổi.
- Cập nhật JSDoc hook (không còn "IntersectionObserver, không dùng scroll listener").

`src/components/home/ProjectsSlider.tsx`: chấm = `pageCount` (key theo index, nhãn `goTo index+1` giữ), cụm điều khiển hiện khi `pageCount > 1`; mũi tên dùng `scrollToSlide(current ± 1)`.

Mobile vuốt + snap CSS giữ nguyên. Hành vi đầu/cuối: **vòng** (giữ như trước, không cần user chốt).

## Files
- `src/components/home/use-snap-slider.tsx`, `src/components/home/ProjectsSlider.tsx`, `src/components/home/ProjectsSlider.test.tsx`.
- KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, `src/components/projects/*`, `.claude/launch.json`.

## Acceptance
- [ ] Test repro (6 thẻ, layout giả lập 1280px): 5 chấm; scroll 0 → chấm 1 active; › → `scrollTo({left: 488})`; scroll 1702 → chấm 5 active; › ở cuối → `scrollTo({left: 0})`; ‹ ở đầu → `scrollTo({left: 1702})`; bấm chấm 3 → `left: 976`.
- [ ] Trước fix test repro FAIL, sau fix PASS.
- [ ] Không layout (clientWidth 0): chấm = số thẻ, không crash.
- [ ] OffersSlider / RentalsTabs test không đổi vẫn PASS.
- [ ] `pnpm vitest run src/components/home`, `pnpm typecheck`, `pnpm lint` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: slider Dự án nổi bật 6 thẻ ở 1280px — chấm = số thẻ (6), mũi tên nhảy cóc 2 thẻ.
- Expected: 5 chấm; scroll 0 → chấm 1; › → `scrollTo({left:488})`; scroll 1702 → chấm 5; › cuối → `left:0`; ‹ đầu → `left:1702`; chấm 3 → `left:976`.
- Actual before fix: test `ProjectsSlider > BL-038 ...` FAIL — `expected [...] to have a length of 5 but got 6` (code cũ, ProjectsSlider.test.tsx:64).
- Actual after fix: test BL-038 PASS (layout giả lập 1280px: clientWidth 1265, scrollWidth 2967, mép trái thẻ 31+488i, rAF đồng bộ).
- Evidence: `pnpm vitest run src/components/home` → 9 files, 82 tests PASS (gồm OffersSlider/RentalsTabs/HomeBlocks không đổi).
- Status: PASS (kiểm tra thực tế trên trình duyệt: chưa làm, để reviewer/primary).

## Verification summary
- `pnpm vitest run src/components/home`: PASS (82/82).
- `pnpm typecheck`: PASS.
- `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope).
- Files: `src/components/home/use-snap-slider.tsx`, `src/components/home/ProjectsSlider.tsx`, `src/components/home/ProjectsSlider.test.tsx`.
- Reviewer r1 STRICT PASS (4 MINOR) `.context/review-reports/bug-projects-slider-pagination-phase-1-task-01-round-1-review.md`.
- Spec 1.31.0 → **1.31.1** (PATCH), scope **v39** — `spec/updates/2026-10-20-projects-slider-pagination-bug.md`; design-spec S01 khối 3 "Điều khiển".

## Residual risk
- Chưa kiểm trình duyệt thật (pane preview ẩn → IO/rAF/smooth scroll không chạy); bấm › liên tiếp khi đang cuộn mượt có thể tính từ vị trí giữa chừng (mất 1 lần bấm).
- MINOR reviewer: hook ~90 dòng (nên tách hàm đo/nearest), `Element.prototype.scrollTo` trong test không khôi phục, ResizeObserver chưa có test.
- Doc impact: design-spec S01 khối 3 + SPECIFICATIONS 1.31.1. No API/ERD impact.
