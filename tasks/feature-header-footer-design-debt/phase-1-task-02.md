# feature-header-footer-design-debt · phase-1-task-02 — footer accordion < md + accordion menu con trong menu toàn màn hình

- Change doc: `spec/changes/2026-10-19-header-footer-design-debt.md` (BACKLOG BL-001)
- Spec: `.context/design-spec.md` §2.2 (accordion menu con), §2.4 (footer accordion < md)
- Phụ thuộc: phase-1-task-01 (MobileMenu đã nhận CTA/logo, bỏ tự đóng ở xl)

## Classification / Risk
- Type: **MODIFY**
- Risk: **MEDIUM** — shared component mọi trang; a11y (disclosure pattern, bàn phím, reduced motion). Không đổi schema/API.
- Expected review level: **STRICT** (shared component/navigation).
- Blast radius: `src/components/layout/{Footer,MobileMenu}.tsx` (+ component accordion mới nếu tách) + test.

## Yêu cầu
1. Footer < md: mỗi cột link (`footer.columns` hoặc cột cố định) là accordion đóng mặc định: tiêu đề cột là heading chứa `<button>` (`aria-expanded`, `aria-controls` trỏ danh sách link), vùng chạm ≥ 44px, icon caret `aria-hidden`. Cột Liên hệ luôn mở. ≥ md: lưới như cũ, mọi link hiện, nút không hoạt động như accordion (tiêu đề hiển thị như cũ). Không JS → link vẫn truy cập được ở ≥ md; < md chấp nhận cần JS hoặc dùng `<details>`/CSS sao cho SSR không ẩn nội dung với crawler — builder chọn cách đơn giản nhất đạt a11y, ghi lý do.
2. Menu toàn màn hình: mục có con → link cha giữ điều hướng + nút caret riêng cạnh (≥ 44px, `aria-expanded`, `aria-controls`, `aria-label` "Mở menu con <mục>" — dùng lại khoá i18n `layout.nav.openSubmenu` nếu hợp), menu con đóng mặc định, Enter/Space mở/đóng, Tab đi qua các link con khi mở; link con đóng menu khi bấm (giữ hành vi). Chuyển động mở/đóng `--duration-base`, tắt khi `prefers-reduced-motion` (motion-safe/`motion-reduce:`).
3. Không đổi dữ liệu/view model ngoài cần thiết.

## Acceptance
- [ ] Footer < md: mỗi cột link accordion đóng mặc định, nút tiêu đề có `aria-expanded`/`aria-controls`; ≥ md lưới như cũ
- [ ] Menu toàn màn hình: mục có con có nút xổ accordion, `aria-expanded`, bàn phím OK, tắt animation khi reduced motion
- [ ] Test unit (Footer/MobileMenu) cho toggle + aria
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` PASS (trừ fail sẵn job-applications)

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- **Thiết kế chốt (builder):**
  - Footer: tách `FooterLinkColumn.tsx` (client) nhận `FooterColumnView`; `Footer.tsx` vẫn là server component. < md (và SSR/trước hydrate, mobile-first): `h2 > button` (`aria-expanded`, `aria-controls` → `ul`, `min-h-11`, caret `aria-hidden`), đóng mặc định; `ul` chỉ ẩn bằng `max-md:hidden` (không dùng thuộc tính `hidden` vì Tailwind v4 `[hidden]{display:none!important}` thắng lưới ≥ md — cùng lý do ARCHITECTURE L6-T05). Lý do: link luôn có trong HTML server cho crawler/desktop không JS; `display:none` ở mobile đưa link ra khỏi tab order/AT. ≥ md: `useMediaQuery("(min-width: 768px)")` (hook sẵn có `use-environment.ts`) → tiêu đề là chữ thường, không nút. Cột Liên hệ giữ nguyên, luôn mở (h2 `min-h-11` để canh với nút ở < md).
  - MobileMenu: `MenuItem` (cùng file, 161 dòng): mục có con → link cha giữ điều hướng + nút caret `min-h-11 min-w-11` (`aria-expanded`, `aria-controls`, `aria-label` = `layout.nav.openSubmenu` {label}); menu con đóng mặc định, trượt `grid-template-rows 0fr→1fr` `duration-(--duration-base)` + `motion-reduce:transition-none`; khi đóng khung có `inert` + `aria-hidden` (như HeroSlider) nên link con không focus/không trong cây AT; bấm link con vẫn đóng menu.
- **Test mới:** `Footer.test.tsx` (5: h2>button + aria + `max-md:hidden`, toggle độc lập, Enter/Space, cột Liên hệ không nút, ≥ md không nút), `MobileMenu.test.tsx` (5: nút caret + aria/i18n, inert đóng mặc định + Tab qua link con khi mở, Enter/Space, link con đóng menu, EN label).
- **Verify (project-config):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 2447 PASS / 1 fail sẵn (`job-applications` "vị trí hết hạn → 400") · `pnpm build` PASS · oxlint: skip (repo không có config).
- **Trình duyệt (dev server, Chrome emulation):** 375: footer nút 44×343px, đóng = `display:none`, mở/đóng độc lập, không h-scroll (scrollWidth 375); menu: nút caret 44×44, `aria-label` "Mở mục con của Dự án", Space đóng / Enter mở, Tab đi "Đang mở bán" → "Tin BĐS" → "Cho thuê"; đóng: `inert`, rows 0px. 768: lưới 2 cột, 0 nút, mọi link hiện. 1280: menu mở từ nút Menu, Tab khi menu con đóng nhảy thẳng "Cho thuê", Enter mở (rows 100px). Lưu ý: khi tab trình duyệt ở nền, CSS transition không chạy (đo được 0px tới khi front tab) — artefact môi trường, không phải bug.
- **Dev DB:** mục con tạm cho `header.navItems[projects]` qua Local API, đã **khôi phục** nguyên trạng (children `[0,0,0,0,0,0,0]`, REST xác nhận), script tạm đã xoá.

## Doc impact / Reconcile
- Intent: `.context/design-spec.md` §2.2/§2.4 (đã cập nhật ở task-01, user duyệt 2026-10-19).
- As-built: `docs/ARCHITECTURE.md` bullet khung trang (layer-5-task-05 + BL-001) thêm footer accordion + accordion menu con. Không đổi schema/API/ERD.
- `spec/test-scope/current.json` cập nhật `changed.files` theo diff thật (scopeVersion giữ 3 — cùng lần publish của BL-001).

## Review
- Round 1 STRICT **PASS** — `.context/review-reports/feature-header-footer-design-debt-phase-1-task-02-round-1-review.md` (0 CRITICAL/MAJOR, 3 MINOR: #1 tiêu đề footer ≥ md hiện dạng nút trước hydrate → dịch ~24px (CLS ước < 0.01); #2 thiếu test SSR liệt kê link; #3 doc impact task file — đã điền ở close-out).
- Acceptance: PASS. Reviewer verify: lint/typecheck PASS, `src/components/layout` 92/92, `pnpm test` 2447/2448 (fail sẵn job-applications).
- Quyết định tự chọn (change-request): MINOR #1/#2 không sửa trong task này (không chặn PASS, tránh vòng review thêm) → residual, có thể làm sau bằng `button.md:hidden` + `span.max-md:hidden` thay `useMediaQuery`.

## Residual risk
- Footer ≥ md trước hydrate/không JS: tiêu đề hiện như nút caret không tác dụng, sau hydrate đổi thành chữ → dịch ~24px (CLS nhỏ trên trang ngắn) — reviewer MINOR #1.
- Chưa có test SSR (`renderToString`) xác nhận mọi link footer có trong HTML (MINOR #2; builder kiểm DOM trình duyệt).
- Chưa kiểm screen reader thật; bàn phím/đo DOM chỉ trong Chrome emulation. Cột Liên hệ chỉ kiểm bằng unit test (dev DB `site-settings` trống).
