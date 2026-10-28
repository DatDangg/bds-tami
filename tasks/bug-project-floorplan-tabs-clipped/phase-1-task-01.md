# bug-project-floorplan-tabs-clipped · phase-1-task-01 — Chi tiết dự án: dãy tab Mặt bằng bị cắt ở mép phải, không có gợi ý/cách cuộn bằng chuột (BL-096)

- Change doc: `spec/changes/2026-10-28-project-floorplan-tabs-clipped.md` (BACKLOG BL-096, QA sheet 28/10 dòng 15, Trung bình).
- Phụ thuộc: không. Batch BL-095→BL-099 user duyệt 2026-10-28 "auto proceed".
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-project-floorplan-tabs-clipped-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v100. Doc impact: `.context/design-spec.md` S03 khối 7 (1 dòng as-built).

## Classification / Risk
- Type: **BUG** (UI layout/a11y; không đổi API/schema/requirement).
- Risk: **MEDIUM** — dự kiến tổng quát hoá `ListingTabsScroller` (shared: `/cho-thue`, `/du-an`, `/tin-bds` + danh mục con) để dùng lại cho `FloorPlans`.
- Expected review level: **STRICT** (shared component, a11y bàn phím/focus).
- Doc impact dự kiến: `.context/design-spec.md` S03 khối 7 (1 dòng hành vi tràn, as-built) nếu có mô tả; còn lại no doc impact.

## Repro
- `/du-an/astor-1` (VI, Khách). Dữ liệu dev local có sẵn Astor 1 với 12 mặt bằng (tên dài "Astor 1 – Tầng …"); không đụng staging/prod.
- Playwright (Edge) trước fix — `.context/review-reports/assets/bl096-before-{1920,1440,1024,768,390}.png`:
  - 1920/1440: tablist clientWidth 728 / scrollWidth 2550 → 8/12 tab nằm ngoài vùng nhìn, tab thứ 5 bị cắt giữa chữ ở mép phải; không fade, không nút.
  - 1024: 522/2550, 9 tab ngoài; 768: 659/2550, 9 tab ngoài.
  - 390: ≥ 6 mặt bằng → ô chọn (OptionSelect), tablist ẩn — OK.
  - Không tràn trang (page h-scroll = false).

## Root cause (change-request, từ code + đo)
- `src/components/projects/FloorPlans.tsx:57-61`: tablist là `flex gap-2 overflow-x-auto [scrollbar-width:none]` — cuộn ngang được nhưng **ẩn thanh cuộn, không fade, không nút điều hướng**. Ở ≥ md dải 12 tab (~2550px) rộng hơn nhiều so với cột nội dung (522–728px) nên phần phải bị cắt cụt tại mép, không có gợi ý còn nội dung; người dùng chuột (không trackpad/shift+wheel) **không có cách** tới các tab bên phải. Bàn phím (← → Home End) vẫn tới được vì focus tự cuộn, nhưng tab focus có thể sát mép.
- Thanh danh mục danh sách đã gặp đúng vấn đề này và đã có giải pháp: `src/components/listing/ListingTabsScroller.tsx` (BL-084/BL-086: làn nút ‹ › ngoài vùng cuộn ≥ md, fade mép, `aria-disabled` ở mép, nudge focus bàn phím khỏi fade). Component này gắn cứng i18n `page.listing.tabs.previous/next` (nhãn "danh mục"), khung `mx-auto max-w-container`, và căn giữa phần tử `[aria-current="page"]` — chưa dùng được nguyên cho tab ARIA (`aria-selected`).

## Thiết kế fix (gợi ý — builder chọn, ghi Decision log)
- Dùng lại `ListingTabsScroller` (tổng quát hoá tối thiểu, không nhân bản logic): prop tùy chọn cho nhãn nút (vd `labels?: { previous; next }`) + selector phần tử hiện tại (mặc định `[aria-current="page"]`; FloorPlans dùng `[aria-selected="true"]`). Consumer cũ (`ListingCategoryTabs`) không đổi hành vi/markup. Khung `max-w-container` vô hại trong card (đã `w-full`); nếu cần, cho tắt qua prop.
- `FloorPlans`: bọc tablist trong scroller; tablist bỏ `overflow-x-auto`, thành `flex w-max min-w-full gap-2` (tab vẫn `shrink-0`). Giữ nguyên mẫu ARIA tabs (role tablist/tab, roving tabindex, ← → Home End) — nút ‹ › nằm NGOÀI tablist, `type=button`, nhãn VI/EN mới `page.projectDetail.floorPlans.previous/next` (vd "Mặt bằng trước"/"Mặt bằng sau" · "Previous floor plans"/"Next floor plans").
- Chọn tab bằng bàn phím → tab chọn hiện đủ ngoài vùng fade (nudge sẵn có cho `:focus-visible`; chuột không dịch thanh lúc mousedown). Đổi tab qua ô chọn (< md) hoặc lightbox (onIndexChange) không bắt buộc cuộn — nếu làm, chỉ cuộn ngang (`scrollLeft`), không kéo trang.
- < md với < 6 mặt bằng: vẫn dải tab vuốt + fade (không nút); ≥ 6: ô chọn như cũ.
- Không tràn → không làn/nút/fade, layout như trước.

## Files
- `src/components/projects/FloorPlans.tsx`, `src/components/listing/ListingTabsScroller.tsx` (+ `ListingTabsScroller.test.tsx`), `src/components/projects/project-detail.test.tsx` (khối `describe("FloorPlans")`), `src/i18n/messages/vi.json` + `en.json` (`page.projectDetail.floorPlans.previous/next`), có thể `.context/design-spec.md` (1 dòng).
- KHÔNG đụng file dirty ngoài batch: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/agent-live.mjs`, `tools/vibe-studio/src/live-state.ts`, `.claude/hooks/live-studio.mjs`, `.context/review-reports/assets/bl054-*`, `spec/changes/*`.

## Acceptance
- [x] Mọi tab mặt bằng truy cập được bằng chuột (nút ‹ › ≥ 44px, không đè tab — rect nút ∩ rect vùng cuộn = ∅), bàn phím (← → Home End; tab chọn hiện đủ, không dưới fade), vuốt (< md) ở 1920/1440/1024/768; 390 ô chọn vẫn hoạt động.
- [x] Có gợi ý tràn (fade mép phía còn nội dung + nút) khi tràn; không tràn → không nút/fade.
- [x] `ListingCategoryTabs` (`/cho-thue`, `/du-an`, `/tin-bds`) không đổi hành vi (test cũ PASS, nhãn cũ giữ).
- [x] Ảnh Playwright trước/sau 1920/1440/1024/768/390 — `.context/review-reports/assets/bl096-{before,after}-*.png` (script đo: `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\252b8873-425c-4c6a-966c-b60b663a3c53\scratchpad\bl096-shot.mjs <before|after>`, chạy bằng `node`). Dev server `http://localhost:3000` đang chạy — KHÔNG dừng.
- [x] Test (FAIL trước / PASS sau trong jsdom: FloorPlans render trong scroller, nhãn nút mặt bằng, tablist không tự overflow) + `pnpm typecheck` · `pnpm test` · `pnpm lint` · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-28 (change-request): root cause từ code + đo Playwright (không spawn Explore). Dữ liệu dev local có Astor 1 (12 mặt bằng) — không cần dựng dữ liệu riêng. Docker Desktop + `docker/docker-compose.dev.yml` được bật lại để có DB local.

- 2026-10-29 (builder): tổng quát hoá ListingTabsScroller bằng 2 prop tùy chọn (labelNamespace mặc định "page.listing.tabs", currentSelector mặc định [aria-current="page"]); giữ khung max-w-container (vô hại trong card). FloorPlans: tablist "flex w-max min-w-full gap-2" bọc trong scroller; thêm div ngoài "hidden md:block" khi dùng ô chọn để < md không còn phần tử rỗng cộng thêm gap-6; tablist vẫn giữ "hidden md:flex" (test cũ). Không thêm cuộn khi đổi tab bằng ô chọn/lightbox (không bắt buộc). Design-spec S03 khối 7 thêm 1 dòng as-built.

## Repro Verification
- Original repro: `/du-an/astor-1` 768–1920 — 8–9/12 tab ngoài vùng nhìn, tab mép phải cắt cụt, không fade/nút.
- Expected: fade + nút ‹ › làn riêng khi tràn; mọi tab tới được bằng chuột/bàn phím/vuốt.
- Actual before fix: (xem Repro).
- Actual after fix: Playwright (Edge) sau fix, /du-an/astor-1: 1920/1440 vùng cuộn 632 (scrollWidth 2550), 1024 426, 768 563 → tablist trong scroller, 2 nút 44x44 ở làn ngoài (rect nút ∩ vùng cuộn = ∅), fade cuối khi ở đầu; clipped=0 trong tablist (tab ngoài vùng nhìn chỉ tới được bằng nút/bàn phím). Bấm "Mặt bằng sau" tới mép: scrollLeft = max (1918/2124/1987), nút sau aria-disabled, nút giữ focus (activeElement=BUTTON, không về BODY); "trước" cuộn ngược. Bàn phím End: tab 12 chọn, nằm sát mép phải (không còn fade cuối ở mép), Home về đầu; ← x4 / → x3 tab chọn cách hai mép >=146px (không dưới fade). 390: ô chọn hiện, không tablist, không h-scroll trang. /cho-thue: nhãn "Danh mục trước/sau" giữ nguyên.
- Evidence: ảnh .context/review-reports/assets/bl096-{before,after}-{1920,1440,1024,768,390}.png; test mới "BL-096" trong project-detail.test.tsx (FAIL trước: tablist có overflow-x-auto, không scroller/nút); pnpm typecheck/lint/test (456 file, 4815 test)/build PASS.
- Status: PASS

## Close-out (change-request)
- r1 STRICT PASS, 4 MINOR: MINOR-1 (indent JSX `FloorPlans`), MINOR-2 (test `vi.restoreAllMocks` trong `finally`), MINOR-3 (JSDoc `ListingTabsScroller` nêu dùng lại cho tab ARIA) — change-request sửa trước commit (không đổi hành vi), re-verify vitest projects+listing 189 PASS, `pnpm typecheck` PASS, eslint file đổi PASS. MINOR-4 (`hidden md:flex` trùng wrapper) chấp nhận.
- Follow-up (không chặn): đổi mặt bằng qua ô chọn/lightbox không cuộn tab tương ứng vào vùng nhìn; tên mặt bằng dữ liệu lặp tiền tố "Astor 1 – " làm tab dài (nội dung CMS, không phải code).
- Spec: no spec change (1.61.0); test-scope v100 (v99 archive). Doc impact: design-spec 1 dòng.
