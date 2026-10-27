Agent: reviewer

# Review — bug-hero-search-dropdown-overlap · phase-1-task-01 · round 1 (BL-083)

- Review level: **NORMAL**
- Reason: diff chỉ 1 class trên thẻ HeroSearch (`src/components/home/HeroSearch.tsx:184`) + 1 test. Không đổi `option-select.tsx`/`select.tsx` (shared), không API/schema/auth. Không có lý do nâng STRICT.
- Blast radius: chỉ thẻ tìm kiếm trang chủ (`/vi`, `/en`). Selector chỉ nhắm phần tử này. `data-scroll-locked` trên body cũng do Dialog/Sheet khác đặt (vd mobile nav Header): lúc đó thẻ thành `pointer-events:none`, nhưng body cũng đang `none`, overlay modal che trang, nội dung modal được portal ra ngoài thẻ → không có hệ quả xấu. Select content được portal (`src/components/ui/select.tsx:41`), không nằm trong thẻ → listbox vẫn tương tác được.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm vitest run src/components/home` | PASS — 12 file, 113 test |
| `pnpm exec eslint src/components/home/HeroSearch.tsx src/components/home/HeroSearch.test.tsx` | PASS (exit 0) |
| `pnpm build` | PASS (exit 0) |
| CSS Tailwind v4 sinh ra (grep `.next/static/chunks/26vian4cymu44.css`) | `.not-in-data-\[scroll-locked\]\:pointer-events-auto:not(:where([data-scroll-locked]) *){pointer-events:auto}` — đúng ý đồ: chỉ `auto` khi KHÔNG có tổ tiên `[data-scroll-locked]`. Có tác dụng khi Select mở (body có attribute → rule không khớp → thẻ kế thừa `none` từ section); khi đóng thì `auto` như cũ (gutter của section vẫn `none` → bấm xuyên tới slider). `:not()` với selector phức hợp chạy được trên Chrome 88+/FF 84+/Safari 9+. |

## Root cause
Đúng. `pointer-events-auto` viết thẳng trên thẻ ghi đè giá trị `none` kế thừa từ body (Radix `disableOutsidePointerEvents`) → pointerdown chạm được trigger thứ hai → trigger mở trong `onPointerDown`, layer mới mount trước khi layer cũ xử lý pointerdown-outside → layer cũ không còn được dismiss. Ảnh before (`bl083-before-1920-b.png`) cho thấy 2 listbox cùng mở. Fix (phương án A) nhắm đúng gốc, không đụng component dùng chung.

## Acceptance
- "Mở dropdown thứ hai thì dropdown đầu đóng (chỉ 1 mở)": **đạt về bất biến "chỉ 1 mở"**. Hành vi sau fix: click trigger thứ hai → dropdown đầu đóng, 0 mở (ảnh `bl083-after-1920-b.png`: không có listbox, focus quay về "Mức giá"). Bấm lần nữa thì mở cái thứ hai. Đây là hành vi click-outside chuẩn của Radix Select modal và giống mọi `OptionSelect` ở trang khác (FilterFacets/JobFilters không có override pointer-events; đã grep `pointer-events-auto` toàn `src`, không có cái nào bọc OptionSelect). Chấp nhận được: nhất quán toàn site, không cần thêm controlled-open (phương án B làm tăng rủi ro trên component dùng chung). Đọc câu chữ thì "mở cái thứ hai" ngay sau 1 click chưa đạt → ghi MINOR để PO/QA biết.
- Bàn phím/Esc: fix chỉ đụng `pointer-events`, không ảnh hưởng focus/keyboard. Builder ghi lại: Esc, Enter/ArrowDown/Enter đều đúng. OK.
- Không JS: không có JS thì không có `data-scroll-locked` → thẻ `auto`. DOM/`<select>` progressive giữ nguyên. OK.
- Gutter bấm xuyên khi đóng: CSS math (section `none`, chỉ thẻ `auto` khi không khoá). Builder kiểm `elementFromPoint` ở gutter thì ra slider. OK.

## Bug repro closure
Task có `Repro Verification` Status PASS kèm evidence: ảnh before/after 1920 + 390 (`.context/review-reports/assets/bl083-before-*`, `bl083-after-*`, `bl083-1920-final.png`), Playwright msedge click thật, test "BL-083" fail trước/pass sau. Tôi đã xem before-1920-b (2 listbox mở) và after-1920-b (0 listbox): khớp mô tả. Selector CSS đã kiểm trực tiếp từ build. Reviewer không tự chạy trình duyệt (Bash chỉ cho phép verify command) → xem Residual risk.

## Responsive Checklist Gate
Diff chỉ đổi `pointer-events`, không đổi layout/typography/media.
- Layout (scroll ngang, mobile-first, grid, container): N/A (layout không đổi; ảnh 390 của builder không có tràn)
- Typography/Spacing: N/A
- Media: N/A
- Touch/Interaction: OK. Touch target không đổi. Ảnh after-390 của builder: tap trigger thứ hai khi đang mở thì đóng, không chồng.
- Viewport/A11y: OK. Không thêm `100vh`/`overflow:hidden`/motion.

## Skill gates
- aislop: skip, không chạy (ngoài allow-list verify command; diff chỉ 1 class + 1 test, không có dấu hiệu slop)
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); eslint PASS
- ocr (open-code-review): skip, ocr not installed / ngoài allow-list
- AI-readable: OK. 0 indicator (không có tên mơ hồ, magic number hay indirection). Thiếu comment WHY là MINOR, chưa phải indicator FAIL.
- ai-friendly-web: N/A (không đổi route/SEO)
- blitzstrike: N/A (NORMAL, không có bề mặt bảo mật)

## Findings
- [MINOR] `src/components/home/HeroSearch.tsx:184`: class `not-in-data-[scroll-locked]:pointer-events-auto` không tự giải thích, dễ bị người sau "đơn giản hoá" về `pointer-events-auto` và mở lại bug. Đề xuất thêm 1 dòng comment WHY (vd: "Radix Select modal đặt `data-scroll-locked` + body `pointer-events:none`; không ghi đè lúc đó để click chip khác thành click-outside — BL-083").
- [MINOR] `src/components/home/HeroSearch.test.tsx:192-199`: test chỉ khoá tên class (jsdom không mô phỏng được pointer-events/hit-testing), nên không chứng minh hành vi. Chấp nhận vì đã có evidence Playwright. Nếu muốn có regression thật, thêm e2e Playwright (mở Mức giá → click Diện tích → `getByRole('listbox')` count ≤ 1) ở task sau.
- [MINOR] Acceptance wording: sau fix, click trigger thứ hai chỉ đóng cái đầu (0 mở), không mở luôn cái thứ hai. Hành vi này giống chuẩn Radix ở các trang khác, nên reviewer chấp nhận. Change-request/PO nên cập nhật tick acceptance theo đúng hành vi này để QA không báo lại.
- Ngoài scope, đề xuất task riêng: các phần tử khác có `pointer-events-auto` tường minh (HeaderFrame bar, HeroSlider controls `HeroSlider.tsx:211,246`, BackToTop, FloatingContact, DetailSubNav, SpotlightSlider) vẫn nhận click khi một Select/Dialog modal đang mở. Không gây chồng dropdown, nhưng không nhất quán với modal blocking. Đây là vấn đề có sẵn, không tính cho task này.

## Residual risk
- Reviewer không tự chạy dev server/Playwright (Bash chỉ cho phép verify command + git). Hành vi click thật dựa vào ảnh và ghi chép của builder, đối chiếu với selector CSS kiểm trực tiếp từ build. Ảnh 390 xem qua tên file/mô tả, chưa mở từng ảnh.
- Tap cảm ứng thật (Radix mở Select bằng `click` với pointerType touch) chỉ kiểm qua emulation 390 của builder, chưa thử trên thiết bị thật.

## Verdict
✅ **PASS**. Không có CRITICAL/MAJOR. Root cause đúng, fix hẹp và đúng selector. Verify typecheck/test/eslint/build PASS. Repro Verification PASS có evidence.
