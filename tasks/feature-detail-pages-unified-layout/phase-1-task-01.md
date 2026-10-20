# feature-detail-pages-unified-layout · phase-1-task-01 — Khung chi tiết dùng chung + header ẩn khi cuộn + chi tiết dự án (BL-027)

- Change doc: `spec/changes/2026-10-20-detail-pages-unified-layout.md` (BACKLOG BL-027)
- Nền: BL-020 P4/P5 (`ProjectDetail`, `ProjectSubNav`, `ProjectSection`), BL-025/026 (`HeaderFrame`, `1a9c38d`).
- Phụ thuộc: không. Task sau (`phase-1-task-02`, chi tiết cho thuê) phụ thuộc task này → chạy **tuần tự** (cùng file dùng chung).
- Trạng thái: `done` (review STRICT PASS round 3). Lịch sử: (2026-10-20: user cho phép review round 3 — "Cho sửa vòng 3: đặt lại khoảng dính của thanh mục con 8/16px cố định trên mọi trang chi tiết, chấp nhận rủi ro lúc trang chưa tải xong JS.") — user duyệt phase plan 2026-10-20 ("ok", chốt 4 đề xuất mặc định: mục con cho thuê Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý; cuộn lên header KHÔNG hiện lại (chỉ đầu trang / focus Tab); thẻ liên hệ cho thuê < lg sau thẻ nội dung; bo thẻ trắng ~28px).

## Classification / Risk
- Type: **MODIFY** (UI/bố cục; không đổi schema/API/quyền/nguồn lead/JSON-LD)
- Risk: **MEDIUM** — đụng header dùng chung mọi route `(frontend)` + thanh mục con/neo cuộn của chi tiết dự án.
- Expected review level: **STRICT** (shared component + navigation: header, sticky/scroll-margin dùng chung)
- Blast radius: header mọi trang công khai (chỉ đổi hành vi khi trang có đánh dấu chi tiết); `/du-an/[slug]` + `/en/projects/[slug]`; mọi `scroll-mt`/`sticky top` đang tính theo `--header-offset`.
- Doc impact: `SPECIFICATIONS.md` (Khung trang + F2 bố cục chi tiết), `.context/design-spec.md` §2.1 + S03 — change-request cập nhật ở close-out.
- Decision impact: sửa quyết định BL-025 "header sticky mọi trang, scroll-margin bù theo `--header-offset`" cho riêng trang chi tiết → append `.context/decisions.md` ở close-out.

## Thiết kế (quyết định change-request)
- **D1 — đánh dấu trang chi tiết bằng CSS, không prop xuyên layout:** khung chi tiết render `data-detail-page` trên phần tử gốc. `globals.css` dùng `html:has([data-detail-page])` để:
  - `.site-header[data-scrolled]` → trượt lên ẩn hẳn (CHỈ `translateY(-100%)`, KHÔNG `visibility`/`opacity`: link header phải còn focus được thì Tab mới đưa header trở lại), `--duration-slow` + `--ease-standard`, tức thì khi `prefers-reduced-motion`. Ở đầu trang (chưa cuộn) header phẳng như BL-025. Chiều cao trong luồng `--header-offset` giữ nguyên → không CLS.
  - `.site-header:has(:focus-visible)` → hiện lại (chỉ focus bàn phím; `:focus-within` bị bỏ vì focus chuột/chạm, vd. Radix trả focus về hamburger, giữ header che thanh mục con) (người dùng bàn phím Tab/Shift+Tab vào menu vẫn thấy header).
  - Không cần sửa `HeaderFrame` JS (đã có `data-scrolled`); trang khác giữ nguyên thanh nổi BL-025/026 vì `:has()` không khớp.
- **D2 — biến vị trí dính `--sticky-top`:** `:root { --sticky-top: var(--header-offset) }`; `html:has([data-detail-page]) { --sticky-top: 0.5rem }` CỐ ĐỊNH (≥ lg `1rem`), KHÔNG phụ thuộc `.site-header[data-scrolled]` (round 3 theo quyết định user 2026-10-20; để `scroll-mt` tính đúng 8/16px khi bấm neo từ đầu trang, không thừa ~88px) = đúng lề trên của header nổi (8/16px). Thanh mục con `sticky top-(--sticky-top)`, thẻ tư vấn dính, mọi `scroll-mt` của khối/neo trong trang chi tiết (ProjectSection, Documents `#documents`, LegalPolicy, LeadFormSlot `#lead-form`, consult card) đổi sang `--sticky-top` + chiều cao thanh mục con + khe. Trang khác `--sticky-top` = `--header-offset` → không đổi hành vi. Trình duyệt không có `:has()` → header nổi như cũ và `--sticky-top` = `--header-offset` (nhất quán, không chồng nhau).
  - Thanh mục con chỉ chạm đỉnh khi đã cuộn qua hero/breadcrumb (≫ ngưỡng 4px) nên lúc đó header đã ẩn → không cần animate `top`; chuyển động lên đỉnh là chuyển động sticky tự nhiên.
  - `OBSERVER_MARGIN` của thanh mục con tính lại theo vị trí mới (≈ 16 + 54 + 18 = ~88px, xấp xỉ, ghi chú lý do).
- **D3 — component chung `src/components/detail/`:**
  - `DetailSubNav` (chuyển từ `ProjectSubNav`, giữ nguyên logic IntersectionObserver/scroll lock/focus/`aria-current`/neo thật chạy không JS); nút active `bg-primary text-primary-foreground` (#141414 trên #e0bf89 ≈ 10:1); nút thường `text-text-secondary hover:bg-surface-muted`; focus-visible ring theo token, rõ trên nền vàng nhạt. Nhãn `aria-label` truyền qua prop (dùng chung 2 trang).
  - `DetailSection` (chuyển từ `ProjectSection`): `section[aria-labelledby]` + `h2 font-display text-h2` + kẻ trên giữa các khối, `tabIndex={-1}`, `scroll-mt` theo D2; tone `dark` giữ cho Thư viện.
  - `DetailLayout` (server): props `subNav`, `children` (cột chính), `aside` (thẻ dính), `before?` (hero/breadcrumb/gallery), `after?` (Dự án khác / Tin tương tự / CTA). Dựng: gốc `data-detail-page` + nền `bg-primary-subtle` (token `--color-primary-subtle`, không hex mới) → `before` → thanh mục con → lưới ≥ lg `minmax(0,1fr)_22rem` (xl `24rem`) → **cột chính là MỘT thẻ trắng** `bg-surface rounded-[28px]` (bo lớn, gần ảnh Vinhomes; token radius nếu có, không thì 1 giá trị arbitrary ghi lý do) `p-5 md:p-8 xl:p-10` chứa các `DetailSection` → `aside` thẻ dính (`lg:sticky lg:top-[calc(var(--sticky-top)+4.5rem)]`, max-h phần viewport còn lại, cuộn trong). < lg: aside nằm sau thẻ nội dung.
  - `ProjectSubNav`/`ProjectSection` bỏ (đổi import), không để file re-export thừa.
- **D4 — chi tiết dự án dùng `DetailLayout`:** hero + breadcrumb vào `before`; 11 khối giữ thứ tự/điều kiện `visibleSections`; Pháp lý/Chính sách (`LegalPolicy`) + Bảng giá + Tin liên quan + FAQ nằm trong thẻ trắng (khối đầu không kẻ trên); Thư viện vẫn thẻ tối bo 20px bên trong thẻ trắng; thẻ "Tư vấn 1:1" giữ nguyên nội dung/`#lead-form`/nguồn `project`, tách riêng bên phải; "Dự án khác" (`bg-bg-alt`) + CTA banner + `ProjectStickyCta` giữ ngoài thẻ, ngoài lưới.
- **D5 — giữ nguyên:** JSON-LD, metadata, ISR, nội dung khối, i18n hiện có (chỉ thêm khoá nếu cần), `ProjectStickyCta`, hành vi `#documents` mở khối Pháp lý thu gọn.

## Files (dự kiến)
- `src/app/(frontend)/globals.css` (D1, D2)
- `src/components/detail/DetailLayout.tsx`, `DetailSubNav.tsx`, `DetailSection.tsx` (mới, chuyển từ projects/)
- `src/components/projects/ProjectDetail.tsx`, `ProjectOverview.tsx`, `ProjectHighlights.tsx`, `ProjectLocation.tsx`, `ProjectAmenities.tsx`, `PriceTable.tsx`, `ProjectFaq.tsx`, `ProjectListings.tsx`, `LegalPolicy.tsx`, `Documents.tsx` (đổi import + `scroll-mt`)
- `src/components/forms/LeadFormSlot.tsx` (`scroll-mt` → `--sticky-top`)
- Xoá `src/components/projects/ProjectSubNav.tsx`, `ProjectSection.tsx`
- Test: `src/components/projects/project-detail.test.tsx`, `project-market-blocks.test.tsx` (cập nhật), `src/components/detail/*.test.tsx` (mới), `src/components/layout/HeaderFrame.test.tsx` nếu cần

## Acceptance
- [ ] Chi tiết dự án dựng bằng `DetailLayout` + `DetailSubNav` + `DetailSection` (component chung, không copy)
- [ ] `/du-an/[slug]`: cuộn > 4px → header ẩn hẳn (không còn thanh nổi), về đầu trang → header phẳng hiện lại; Tab vào header khi đã cuộn → header hiện; reduced-motion tức thì; không CLS (`.site-header` vẫn cao `--header-offset` trong luồng)
- [ ] Thanh mục con dính tại 8px (< lg) / 16px (≥ lg) từ mép trên, cùng lề như header nổi; trang khác (trang chủ, danh sách, tin tức…) header nổi BL-025/026 không đổi
- [ ] Nền trang chi tiết = `--color-primary-subtle` (class token, không hex mới)
- [ ] Các khối nội dung nằm trong một thẻ trắng bo góc lớn; thẻ "Tư vấn 1:1" tách riêng, dính ≥ lg với `top` theo `--sticky-top`
- [ ] Nút mục con active `bg-primary` + `text-primary-foreground` (≥ 4.5:1); nút thường + focus-visible rõ trên nền vàng nhạt
- [ ] Neo `#overview`…`#faq`, `#documents`, `#lead-form`: tiêu đề không bị thanh mục con che, không thừa khoảng trống cũ của header
- [ ] Mục đang xem (`aria-current`) đúng khi cuộn với vị trí thanh mới
- [ ] 375 / 768 / 1280px không tràn ngang
- [ ] `pnpm vitest run src/components/projects src/components/detail src/components/layout`, `pnpm lint`, `pnpm typecheck` PASS (lệnh theo `.context/project-config.md`)

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- `pnpm vitest run src/components/projects src/components/detail src/components/layout src/components/forms`: 25 file / 233 test PASS (+ `src/lib/contrast.test.ts` 44 PASS). `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope). `pnpm typecheck`: PASS.
- Attempt 2 (reviewer round 1 FAIL: M-1, m-1, m-3, m-4): header hiện lại bằng `:not(:has(:focus-visible))`; `--sticky-top` chỉ đổi khi `.site-header[data-scrolled]` tồn tại; thêm `src/components/detail/detail-header-css.test.ts` (3 test khẳng định selector). Chạy lại: vitest 26 file / 236 test PASS, lint 0 error (2 warning cũ), typecheck PASS. m-4: `git diff --ignore-space-at-eol --stat` trùng `git diff --stat` (11 file, chỉ file có sửa nội dung); các file còn lại chỉ `M` do stat/autocrlf, i/lf w/lf, không đổi nội dung.
- Dev server (`/du-an/centerville-van-giang`) (attempt 1, trước khi đổi selector; chưa kiểm lại bằng mắt sau attempt 2): 1280px — header cuộn xuống trượt lên ẩn (translateY -104px, bottom 0), thanh mục con dính ở 16px, khối neo `#location` hạ cánh ở 88px (= 16 + 54 + 18), `--sticky-top` 1rem, nền rgb(248,243,235), scrollWidth = clientWidth. 375px — thanh mục con ở 8px, header ẩn, `--sticky-top` .5rem, không tràn ngang, thẻ trắng bo lớn + nút active vàng chữ tối.
- Attempt 3 (user duyệt 2026-10-20; reviewer round 2 M-2): `--sticky-top` cố định 0.5rem / 1rem (≥ lg) dưới `html:has([data-detail-page])`, không phụ thuộc `data-scrolled`; giữ quy tắc ẩn header `.site-header[data-scrolled]:not(:has(:focus-visible))`. `detail-header-css.test.ts` cập nhật (khẳng định selector không chứa data-scrolled). Chạy lại: vitest 26 file / 236 test PASS, lint 0 error (2 warning cũ), typecheck PASS. Dev server 1280px `/du-an/centerville-van-giang`: từ đầu trang bấm hero "Nhận tư vấn" → `#lead-form` hạ cánh top = 88px (16 + 54 + 18), không khoảng trống thừa; `--sticky-top` 1rem; không tràn ngang.
- Acceptance criteria: PASS (trừ mục user chấp nhận rủi ro m-1; 768px / reduced-motion / không `:has()` chưa kiểm bằng mắt — xem Residual risk). Reviewer verdict: STRICT FAIL r1 (M-1) → FAIL r2 (M-2) → **PASS r3** (MINOR m-7, m-8, m-4 xử lý ở close-out).

## Review
- Round 1 STRICT FAIL — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-01-round-1-review.md`
- Round 2 STRICT FAIL — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-01-round-2-review.md`
- Round 3 STRICT PASS (user cho phép round 3) — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-01-round-3-review.md`

## Doc impact / Reconcile
- Reconcile gộp ở close-out phase (commit của phase-1-task-02): SPECIFICATIONS.md Khung trang + F2, design-spec §2.1 + S03, decisions.md, spec-publish 1.23.0 / scope v29. Commit này không đổi doc.

## Residual risk
- Chưa kiểm bằng mắt: cuộn LÊN không hiện lại header (chỉ bằng CSS, theo thiết kế), Tab-focus hiện header (`:has(:focus-visible)`), reduced-motion, 768px, trình duyệt không có `:has()`.
- (a) m-1 — RỦI RO USER ĐÃ CHẤP NHẬN 2026-10-20: không JS / trước khi hydrate, header giữ chiều cao đầy đủ che thanh mục con đang dính ở 8/16px (`--sticky-top` cố định).
- Header ẩn dùng `transform` (không `visibility:hidden`) để link header còn focus được bằng Tab; người dùng đọc màn hình vẫn thấy link header (ngoài màn hình).
- (b) m-2 — `OBSERVER_MARGIN` -88px là xấp xỉ (< lg dư ~8px; trình duyệt không có `:has()` thì sai vì `--sticky-top` = `--header-offset`).
- (c) m-6 — hiện lại header chỉ khi `:has(:focus-visible)` (focus bàn phím), không phải `:focus-within`.
- m-7 — ngay sau khi bấm nút hero ở đầu trang, header (đang trượt ẩn trong `--duration-slow`) che thanh mục con vừa dính trong chốc lát; vị trí cuối đúng.
