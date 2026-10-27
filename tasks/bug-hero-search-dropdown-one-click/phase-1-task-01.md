# bug-hero-search-dropdown-one-click · phase-1-task-01 — Trang chủ: 1 click vào chip khác phải đóng dropdown đang mở VÀ mở chip vừa bấm (BL-085, follow-up BL-083)

- Change doc: `spec/changes/2026-10-27-hero-search-dropdown-one-click.md` (BACKLOG BL-085). Feedback user 2026-10-27 về fix BL-083 (commit cdfcdc2).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-hero-search-dropdown-one-click-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.59.0), test-scope v86. Doc impact: no doc impact.

## Classification / Risk
- Type: **BUG** (UI interaction; không đổi API/schema/requirement).
- Risk: **MEDIUM** — nếu thêm prop opt-in vào `src/components/ui/option-select.tsx` (component dùng chung: HeroSearch, FilterFacets, ProjectFilters, JobFilters, FormField, *SortControl, FloorPlans) thì consumer khác phải giữ nguyên hành vi.
- Expected review level: **STRICT** (đổi shared component) — NORMAL nếu chỉ đổi `HeroSearch.tsx`.
- Doc impact: dự kiến `no doc impact`.

## Repro
- `/vi` (trang chủ), tab Cho thuê, hàng "Tùy chọn khác". Mở "Mức giá" → click chuột thật 1 lần vào "Diện tích".
- Expected: Mức giá đóng, Diện tích mở ngay; luôn tối đa 1 listbox mở.
- Actual (as-built BL-083): Mức giá đóng, Diện tích KHÔNG mở (phải bấm lần 2).

## Root cause (change-request, từ code + root cause BL-083 đã xác nhận)
- Radix Select là modal: khi mở, body nhận `data-scroll-locked` + `pointer-events: none` (`disableOutsidePointerEvents`).
- Fix BL-083 (`src/components/home/HeroSearch.tsx:185` `not-in-data-[scroll-locked]:pointer-events-auto`) cho thẻ kế thừa `none` khi khoá → pointerdown vào chip khác không chạm trigger, chỉ là "pointerdown outside" của layer đang mở → đóng; trigger chip mới không nhận sự kiện → không mở. Đó là hành vi click-outside đúng chuẩn Radix nhưng cần 2 click.
- Lý do BL-083 ban đầu (2 dropdown cùng mở khi thẻ `pointer-events-auto`): trigger mới mở trong `onPointerDown`, layer mới mount trước khi listener pointerdown-outside của layer cũ chạy → layer cũ không còn là layer cao nhất có `disableOutsidePointerEvents` → không dismiss. Mỗi `OptionSelect` tự giữ state `open` (uncontrolled) nên không có gì ép cái cũ đóng.

## Thiết kế fix (gợi ý — builder chọn, ghi Decision log)
- Nâng state "đang mở cái nào" lên `HeroSearch` (1 state cho mọi `OptionSelect` trong thẻ, cả 2 tab), `OptionSelect` nhận `open` / `onOpenChange` **opt-in** (truyền thẳng xuống Radix `Select` Root; không truyền → uncontrolled như cũ, consumer khác không đổi).
- Trigger mới nhận được pointerdown thì `onOpenChange(true)` của nó set state = chính nó → cái cũ `open=false` (controlled) đóng ngay. `onOpenChange(false)` của cái cũ (nếu Radix vẫn gọi do dismiss/close) phải dùng cập nhật có điều kiện (`prev === name ? null : prev`) để không đóng nhầm cái mới.
- Để trigger mới nhận được click, trigger (hoặc thẻ / hàng "Tùy chọn khác") phải `pointer-events: auto` cả khi body khoá → bỏ/thu hẹp `not-in-data-[scroll-locked]:pointer-events-auto`. Khi bỏ, PHẢI chứng minh không quay lại bug BL-083 (không bao giờ 2 listbox cùng mở) — nhờ state đơn nhất ở trên. Cập nhật comment BL-083 trong `HeroSearch.tsx` + test BL-083 tương ứng.
- Kiểm kỹ focus: khi cái cũ đóng, Radix Select trả focus về trigger CŨ (`onUnmountAutoFocus` / `onCloseAutoFocus`) — không được cướp focus khỏi dropdown mới (bàn phím ArrowDown/Enter/Esc trong dropdown mới phải chạy). Nếu bị, chặn auto-focus khi đóng do chuyển sang chip khác (vd `onCloseAutoFocus` preventDefault có điều kiện — chỉ ở nhánh opt-in).
- Vùng gutter ngoài thẻ (section `pointer-events-none`) vẫn bấm xuyên tới slider khi KHÔNG có dropdown mở; khi mở, click ngoài thẻ vẫn bị body chặn và chỉ đóng dropdown.
- Pre-hydrate (`progressive` → `<select>` gốc) không đổi.

## Files
- `src/components/home/HeroSearch.tsx`, `src/components/home/HeroSearch.test.tsx`, `src/components/ui/option-select.tsx` (+ test nếu có).
- KHÔNG đụng file dirty của việc khác: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/ward-in-province.ts`, `src/components/admin/WardField*`, `tools/*`, `spec/changes/BACKLOG.md`, `tasks/bug-admin-province-ward-cascade/`.

## Acceptance
- [ ] 1 click chuột thật vào chip khác: đóng cái đang mở + mở cái vừa bấm; luôn tối đa 1 listbox mở (kể cả click nhanh liên tiếp nhiều chip).
- [ ] Click ra ngoài / Esc vẫn đóng; bàn phím (Tab tới chip, Enter/Space/ArrowDown mở, chọn bằng Enter) vẫn đúng; chọn giá trị bằng chuột vẫn đúng; submit gửi đúng filter.
- [ ] Trước hydrate (select gốc) không đổi; slider hero vẫn nhận click ở gutter ngoài thẻ khi không có dropdown mở.
- [ ] Consumer khác của `OptionSelect` không đổi hành vi (không truyền prop mới).
- [ ] Test hành vi 1-click (FAIL với code hiện tại, PASS sau) + kiểm trình duyệt thật (Playwright, dev server `http://localhost:3000`, KHÔNG dừng server) ở 1920 và 390, ảnh trước/sau `.context/review-reports/assets/bl085-*.png`.
- [ ] `pnpm typecheck` · `pnpm test` (ít nhất suite liên quan + toàn bộ unit nếu khả thi) · `pnpm lint` (hoặc eslint file đổi) · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause từ code + root cause BL-083 đã xác nhận (không spawn Explore).

## Repro Verification
- Original repro: `/vi`, tab Cho thuê, mở "Mức giá" rồi click chuột thật 1 lần vào "Diện tích".
- Expected: Mức giá đóng, Diện tích mở ngay; tối đa 1 listbox.
- Actual before fix: Mức giá đóng, Diện tích không mở (phải bấm lần 2) — tái hiện trên dev server 1920 bằng click thật (aria-expanded cả 5 ô = false, 0 listbox), ảnh `.context/review-reports/assets/bl085-before-1920.png`.
- Actual after fix: 1 click → Mức giá `aria-expanded=false`, Diện tích `true`, đúng 1 listbox (sau animation đóng), focus nằm trong dropdown mới; 3 click liên tiếp Mức giá→Nội thất→Tiện ích rồi ArrowDown+Enter chọn "Hồ bơi" đúng; Esc đóng + trả focus trigger; click ngoài đóng. Ảnh `bl085-after-1920.png`, `bl085-after-390.png` (viewport pane 349px CSS, DPR 2).
- Evidence: test `HeroSearch.test.tsx` (BL-083/BL-085 class + 1-click flow), `option-select.test.tsx` (open/onOpenChange opt-in); typecheck, 444 file / 4661 test PASS; eslint 3 file đổi sạch.
- Status: PASS (reviewer STRICT PASS r1).

## Decision log (builder)
- State đơn nhất `openOption` ở HeroSearch; `OptionSelect` nhận `open`/`onOpenChange` opt-in, truyền thẳng Radix Root (consumer khác không đổi). `onOpenChange` dùng cập nhật có điều kiện (`next ? name : current===name ? null : current`) nên dismiss muộn của cái cũ không đóng nhầm cái mới.
- Không đổi class thẻ (vẫn `not-in-data-[scroll-locked]:pointer-events-auto` để gutter bấm xuyên); chỉ bật `pointer-events-auto` ở div lưới 5 chip → trigger nhận pointerdown khi body khoá, còn tab/ô từ khoá/nút Tìm kiếm vẫn bị khoá như modal thường.
- Focus: không cần chặn `onCloseAutoFocus` — kiểm thật thấy focus ở option của dropdown mới, bàn phím chạy.
- jsdom không áp CSS tailwind nên test 1-click luồng state pass cả với code cũ; phần FAIL-trước/PASS-sau của test là assert `pointer-events-auto` trên hàng chip + test controlled `OptionSelect`; hành vi thật chứng minh bằng click chuột thật.
- `pnpm build`: builder không chạy (lo đè `.next` của dev server); reviewer chạy `pnpm build` PASS — Next 16 dev ghi `.next/dev` nên không xung đột, dev server vẫn sống.

## Close-out (change-request)
- Reviewer STRICT PASS r1, 3 MINOR: (1) test jsdom không khoá được việc gỡ wiring `open`/`onOpenChange` mà vẫn giữ `pointer-events-auto` hàng chip (BL-083 có thể quay lại mà test không đỏ) → follow-up; (2) ảnh 390 chưa thể hiện dropdown mở, chưa thử tap cảm ứng thật → follow-up; (3) cập nhật dòng build ở Repro Verification — đã sửa.
- Hành vi as-built: đang mở 1 ô "Tùy chọn khác", bấm 1 lần vào ô khác → ô cũ đóng, ô mới mở ngay; luôn tối đa 1 danh sách mở; Esc / click ngoài đóng; ngoài hàng 5 ô, phần còn lại của thẻ vẫn bị khoá khi dropdown mở (click = đóng).
- Spec: no spec change (1.59.0); test-scope v86 (v85 archive). Doc impact: no doc impact.
