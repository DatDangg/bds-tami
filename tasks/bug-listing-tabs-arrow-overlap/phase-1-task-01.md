# bug-listing-tabs-arrow-overlap · phase-1-task-01 — Thanh danh mục danh sách: nút mũi tên đè lên mục cuối (BL-086, follow-up BL-084)

- Change doc: `spec/changes/2026-10-27-listing-tabs-arrow-overlap.md` (BACKLOG BL-086). Feedback user 2026-10-27 (ảnh `/cho-thue` ~1320px) về fix BL-084 (commit de736c0).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r2 (`.context/review-reports/bug-listing-tabs-arrow-overlap-phase-1-task-01-round-2-review.md`; r1 FAIL MAJOR-1 nudge khi focus chuột). Spec: no spec change (1.59.0), test-scope v87. Doc impact: `.context/design-spec.md` 1 dòng hành vi tràn (as-built).

## Classification / Risk
- Type: **BUG** (UI layout/a11y; không đổi API/schema/requirement).
- Risk: **MEDIUM** — `ListingTabsScroller` / `ListingCategoryTabs` dùng chung cho `/cho-thue`, `/du-an`, `/tin-bds` (+ trang danh mục con).
- Expected review level: **STRICT** (shared component dùng ở nhiều route; a11y focus).
- Doc impact: dự kiến chỉ `.context/design-spec.md` dòng hành vi tràn (BL-084 đã thêm 1 dòng — cập nhật cho khớp "làn riêng"), còn lại no doc impact.

## Repro
- `/vi/cho-thue` ở ~1320px (cũng 1280/1440 tùy số danh mục): mục "Mặt bằng kinh doanh" thấy một phần ở mép phải, nút mũi tên tròn trắng 44px (`ListingTabsScroller.tsx:82`, `absolute right-1 top-1/2` z-20) nằm ĐÈ lên chữ "Mặ…".
- Expected: nút không che phần tử tab nào ở mọi vị trí cuộn; mục bị cắt chỉ mờ dần ở mép vùng cuộn.

## Root cause (change-request, từ code)
- `src/components/listing/ListingTabsScroller.tsx:69-85`: wrapper `relative` chứa vùng cuộn full width; fade (`absolute inset-y-0 w-12`) và `SliderArrow` (`absolute top-1/2 left-1/right-1`) được đặt **chồng lên** vùng cuộn thay vì chiếm chỗ riêng → nội dung cuộn chạy bên dưới nút. Fade 3rem hẹp hơn chỗ nút chiếm (4px + 44px + đổ bóng) và nằm cùng chỗ, nên phần tab ngay dưới nút bị che thật (không chỉ mờ).
- MINOR-1 BL-084 (`:73-84`): nút render có điều kiện theo `canScrollBack/Forward` → bấm "Danh mục sau" tới cuối, nút unmount khi đang focus → focus rơi về `body`.
- MINOR-2 BL-084: link được focus bằng Tab cuộn tới sát mép, nằm dưới fade/nút.

## Thiết kế fix (gợi ý — builder chọn, ghi Decision log)
- Bố cục ≥ md khi tràn: `[làn nút trước] [vùng cuộn flex-1, min-w-0] [làn nút sau]` — nút nằm NGOÀI vùng cuộn, vùng cuộn thu hẹp nhường chỗ; fade đặt ở mép trong của vùng cuộn (wrapper `relative` của riêng vùng cuộn).
- Khi tràn: hiện cả 2 làn, nút ở mép không còn chỗ cuộn → `disabled` (+ ẩn mờ/không tương tác), KHÔNG unmount → không mất focus (MINOR-1). Nếu chọn ẩn làn khi ở mép thì phải chuyển focus hợp lý và tránh layout nhảy — ưu tiên giữ làn + disabled.
- Không tràn → không làn/nút thừa, layout như cũ (tab bắt đầu ở cùng vị trí `px-gutter`). Cẩn thận vòng lặp đo: hiện làn làm vùng cuộn hẹp lại; quyết định "tràn" nên dựa trên bề rộng nội dung so với bề rộng khung NGOÀI (hoặc có hysteresis) để không nhấp nháy ở bề rộng biên.
- < md: không nút, vẫn vuốt + fade như cũ.
- MINOR-2: `scroll-padding-inline` (vd `scroll-px-12`) trên vùng cuộn để link focus bằng bàn phím không nằm dưới fade.
- Giữ: link render server (children), căn giữa tab `aria-current` khi mount chỉ bằng `scrollLeft`, reduced-motion, i18n `page.listing.tabs.previous/next`, không JS vẫn cuộn được.

## Files
- `src/components/listing/ListingTabsScroller.tsx` (+ `ListingTabsScroller.test.tsx`), có thể `src/components/listing/ListingCategoryTabs.tsx`, `.context/design-spec.md` (dòng hành vi tràn).
- KHÔNG đụng file dirty của việc khác: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/ward-in-province.ts`, `src/components/admin/WardField*`, `tools/*`, `spec/changes/BACKLOG.md`, `tasks/bug-admin-province-ward-cascade/`.

## Acceptance
- [ ] Nút mũi tên nằm làn riêng ngoài vùng cuộn; ở MỌI vị trí cuộn không tab nào có pixel nằm dưới nút (đo bằng bounding rect: rect nút ∩ rect vùng cuộn = ∅); fade ở mép vùng cuộn.
- [ ] Không tràn → không nút/làn, layout như trước; mobile (< md) vẫn vuốt + fade, không nút.
- [ ] Bấm nút tới mép: focus không rơi về body (nút disabled giữ focus, hoặc chuyển focus hợp lý); Tab qua link: link focus không bị fade/nút che.
- [ ] Không nhấp nháy/vòng lặp đo ở bề rộng biên; resize cửa sổ cập nhật đúng.
- [ ] Ảnh trước/sau ở 1920/1440/1320/1280/768/390 (`/vi/cho-thue` chính, kiểm thêm `/vi/du-an`, `/vi/tin-bds`) — `.context/review-reports/assets/bl086-*.png`. Dev server `http://localhost:3000` đang chạy, KHÔNG dừng.
- [ ] Test (FAIL trước / PASS sau với phần kiểm được trong jsdom: nút không unmount khi tới mép, cấu trúc làn ngoài vùng cuộn) + `pnpm typecheck` · `pnpm test` · eslint file đổi (`pnpm lint` repo-wide có lỗi sẵn) · `pnpm build` PASS (Next 16 dev ghi `.next/dev` nên build không xung đột dev server).

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause từ code (không spawn Explore). Gộp MINOR-1/MINOR-2 của review BL-084 (`.context/review-reports/bug-listing-category-tabs-overflow-phase-1-task-01-round-1-review.md`).

- 2026-10-27 (builder): bố cục `flex` [làn trước | vùng cuộn `relative min-w-0 flex-1` + fade | làn sau]; làn `hidden md:flex w-12`, chỉ render khi tràn. "Tràn" = `scroller.scrollWidth > frame.clientWidth` (khung NGOÀI, không đổi khi làn xuất hiện) → không dao động, không cần hysteresis. Ở mép: giữ nút + `aria-disabled` (không dùng `disabled` gốc vì Chrome blur nút disabled đang focus) — thêm prop `disabled` tùy chọn cho `SliderArrow` (consumer khác không đổi). Fade thu còn w-8 ở mép trong vùng cuộn (cả < md). MINOR-2: `scroll-px-8` KHÔNG đủ (Chrome không tự cuộn khi link focus đã hở một phần — đo thực tế sl=0) → thêm `onFocus` đẩy link ra ngoài vùng fade 32px. Căn tab `aria-current` chuyển sang effect chạy sau khi làn render (vùng cuộn đã hẹp). Design-spec 1 dòng cập nhật.
- 2026-10-27 (builder, attempt 2, reviewer r1 FAIL MAJOR-1): `onFocus` nudge chạy cả khi focus bằng chuột (mousedown) → dịch thanh trước mouseup. Sửa: chỉ nudge khi `target.matches(":focus-visible")` (try/catch, selector không hỗ trợ → coi là bàn phím); bỏ qua khi target là chính scroller/không phải HTMLElement, hoặc tab rộng hơn vùng nhìn trừ 2 fade (không giật). MINOR-1: `FADE_WIDTH_PX` là nguồn duy nhất (style width của fade + `scrollPaddingInline` + nudge, bỏ `w-8`/`scroll-px-8`). MINOR-3: thêm test mép trái, chuột không cuộn, tab quá rộng. MINOR-2 (làn xuất hiện sau hydration → dịch ngang ~48px một lần khi tràn ≥ md): chấp nhận, không sửa (server không biết tràn).

## Repro Verification
- Original repro: `/vi/cho-thue` 1920/1440/1320/1280/768 — nút ‹ › 44px đè lên tab ở mép.
- Expected: rect nút ∩ rect vùng cuộn = ∅ ở mọi vị trí cuộn; mục bị cắt chỉ mờ ở mép vùng cuộn.
- Actual before fix: Playwright (Edge) đo 4 vị trí cuộn mỗi bề rộng — `overlap: true` cho mọi nút ở cả 5 bề rộng ≥ md (vd 1320: scroller 1280px, nút nằm trong). Ảnh `bl086-before-*`.
- Actual after fix: `overlap: false` mọi nút/mọi vị trí/mọi bề rộng (vùng cuộn 1184px ≥ 1280, 672px ở 768); 390: không nút, vuốt + fade; `/du-an`, `/tin-bds`: không tràn ≥ 1280 → không làn, tràn ở 768/390 như cũ; không h-scroll trang. Bấm "sau" 6 lần tới mép: nút giữ focus, `aria-disabled=true`. Sweep 1500→1100px: làn ổn định (không nhấp nháy). Tab tới link cuối: tự cuộn, cách mép vùng cuộn 33px (≥ fade 32px). Ảnh `bl086-after-*`.
- Evidence: `.context/review-reports/assets/bl086-{before,after}-{cho-thue,du-an,tin-bds}-{1920,1440,1320,1280,768,390}-{start,end}.png`; vitest ListingTabsScroller 10 test PASS; `pnpm typecheck`, `pnpm test` (4665), eslint file đổi, `pnpm build` PASS.
- Attempt 2 evidence: Playwright (msedge) chuột thật click giữa phần hở của tab bị cắt → điều hướng ngay lần click đầu: 1320 (tab cuối, hở 34px) và 1320 lặp lại, 1280 (tab cuối, hở 34px), tab đầu sau khi cuộn hết (hở 129-130px) ở 1320/1280. Tab bàn phím tới tab cuối vẫn cuộn, cách mép 33px. (Lần đo đầu "trượt" do route dev compile lần đầu quá 1.5s, đo lại với chờ 3.5s đều đúng.) vitest ListingTabsScroller 13 PASS; typecheck/test/eslint/build PASS.
- Status: PASS

## Close-out (change-request)
- r1 STRICT FAIL (MAJOR-1: nudge onFocus chạy cả khi focus bằng chuột → thanh dịch giữa mousedown/mouseup, click mép có thể trượt) → attempt 2: nudge chỉ cho `:focus-visible`, bỏ qua tab rộng hơn vùng nhìn, `FADE_WIDTH_PX` một nguồn; r2 STRICT PASS.
- MINOR còn lại (follow-up, không chặn): ≥ md khi tràn, làn nút xuất hiện sau hydrate → tab dịch ~48px một lần (server không biết tràn); test nudge giả lập `:focus-visible` (hành vi thật dựa trên Playwright Edge).
- Spec: no spec change (1.59.0); test-scope v87 (v86 archive). Doc impact: design-spec 1 dòng.
