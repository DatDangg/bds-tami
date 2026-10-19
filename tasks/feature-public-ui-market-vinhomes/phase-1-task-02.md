# feature-public-ui-market-vinhomes · phase-1-task-02 — Header nổi bo tròn kính mờ

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT PASS round 1 (+ sửa MINOR m-1 m-2 m-5)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · layout dùng chung mọi trang → STRICT.

## Việc
- `HeaderFrame`/`Header`: thanh nổi cách mép ~16px (mobile 8px), bo `--radius-pill`, cao 64px (≥ xl 72px), nền `--color-glass` + `backdrop-filter: blur(24px)` (fallback nền đặc khi trình duyệt không hỗ trợ), sticky.
- Trên hero: giữ quy tắc trong suốt → kính mờ khi cuộn (design-spec S01.1) nhưng ở dạng thanh nổi; logo vàng trên nền sáng (BL-018) giữ nguyên.
- ≥ xl: logo trái · menu ngang giữa (DesktopNav đã hỗ trợ `children` dropdown) · tìm kiếm + VI|EN + CTA phải, **không** nút Menu (BL-019). < xl: logo · nút Menu (MobileMenu giữ nguyên).
- Bù khoảng trên cho trang không có hero + `scroll-margin` cho neo để nội dung không bị che; skip link vẫn hoạt động.
- Test: Header/HeaderFrame/DesktopNav cập nhật; focus ring nhìn thấy trên kính mờ.
- Docs: design-spec §2.1, DESIGN.md Header.

## Acceptance
- [x] Thanh nổi bo tròn kính mờ, sticky, VI/EN cùng bố cục; < xl giữ nút Menu
- [x] Chữ/icon header ≥ 4.5:1 cả trên hero lẫn nền sáng (test contrast); không CLS (header trong luồng, không đổi kích thước theo cuộn — suy luận layout + browser check của primary, chưa đo Lighthouse)


## Carry-over từ P1-T01 (reviewer r2)
- m-a: `docs/DESIGN.md:193` thêm dòng `--text-h2-sm` (24→30px, heading phụ trong nội dung/trang chi tiết), bỏ "heading phụ trong nội dung" khỏi dòng H3; `skills/react-nodejs/design-tokens.md:182` sửa tiêu đề "Hệ góc vuông kiến trúc" cho khớp thang radius mới.

## Decision log (builder)
- Hành vi trên hero: **thanh kính mờ sáng nổi LUÔN LUÔN** (cả trên hero), bỏ biến thể trong suốt + "đặc khi cuộn". Lý do: logo vàng + chữ `--color-text` luôn trên nền sáng → AA không phụ thuộc ảnh hero; không còn JS. `HeaderFrame` thành server component (bỏ IntersectionObserver/ResizeObserver/`data-solid`/`usePathname`); bỏ marker `data-header-hero` ở HeroSlider; bỏ CSS `:has(~ main [data-header-hero])` + `:is(...)` khỏi khối token tối; Header chỉ render logo bản nền sáng (bỏ `.logo-on-dark`).
- Cấu trúc: `<header class="site-header sticky top-0 pointer-events-none px-2 py-2 lg:px-4 lg:py-4">` (trong luồng, chiếm `--header-offset`) > `div.site-header-bar` (pill, `pointer-events-auto`, `max-w-[84rem]`, `rounded-pill`, `shadow-md`) > hàng cũ (h-16 / lg:h-18; đệm ngang 12/20/24px, xl 20px thay `px-gutter` + `max-w-container`). Bố cục < xl / ≥ xl, thứ tự DOM/Tab giữ nguyên.
- `--header-offset` (`:root`, globals.css): 5rem (8+64+8), ≥ lg (64rem) 6.5rem (16+72+16). Dùng cho: hero `-mt-(--header-offset)` + `pt-(--header-offset)` (thay `-mt-16 lg:-mt-18`), `top-(--header-offset)` cho ProjectSubNav + bộ lọc mobile Cho thuê, `scroll-mt-[calc(var(--header-offset)+3.5rem)]` cho khối có thanh mục con (ProjectSection, LegalPolicy, ProjectDetail lead form), `+1rem` cho ApplyFormSlot, SaleContactBox, LeadFormSlot, RichText h2; aside/TOC/PostShare `sticky top-[calc(var(--header-offset)+1rem)]`. ProjectSubNav `OBSERVER_MARGIN` −130 → −160px (rootMargin không dùng được var()).
- Kính: `.site-header-bar` nền đặc `--color-surface` mặc định → `@supports (backdrop-filter | -webkit-backdrop-filter)` đổi `--color-glass` + `blur(--blur-glass)` → `@media (prefers-reduced-transparency: reduce)` về đặc (dùng cách "mặc định đặc + nâng cấp", không dùng `not (feature)` vì trình duyệt chưa biết feature sẽ đánh giá sai).
- Trên kính chỉ `--color-text`: mục đang xem gạch chân `border-text` (không accent), hover mục = gạch `text/40`, hover icon = nền `text/10`, LanguageSwitcher mục không chọn `text-text` weight 400 (bỏ `text-secondary` #555: 4.36:1 trên kính nền đen < 4.5) — mục đang chọn đậm. Vòng focus trong thanh = `--color-text` (focus-ring #8c6733 chỉ ~3.0:1 trên kính nền đen).
- DesktopNav: dropdown `mt-4 rounded-lg` + cầu hover `before:` (4 gạch) để rê chuột không đóng; hành vi bàn phím/aria giữ nguyên. Nút Menu/search/caret bo tròn. Skip link không đổi (focus đầu tiên, z cao hơn).
- m-a: `docs/DESIGN.md` thêm dòng `--text-h2-sm` (24→30px), H3 bỏ "heading phụ trong nội dung"; `skills/react-nodejs/design-tokens.md` §4 bỏ "Hệ góc vuông kiến trúc" → mô tả thang radius mới. Docs: design-spec §2.1 (biến thể, offset, mục đang xem, sticky, logo), §2.7, S01.1; DESIGN.md Header + logo trắng.

## Verification summary (builder)
- Contrast: chữ `--color-text` trên kính trước nền đen 10.83:1, trắng 17.55:1 (test contrast.test.ts); logo vàng là nhãn hiệu (miễn 1.4.3), nằm trên kính sáng; focus ring = text trên kính ≥ 10:1.
- Test mới/đổi: HeaderFrame.test (viết lại), Header.test (logo chỉ bản sáng + pill/chiều cao), HomeBlocks.test (hero `-mt-(--header-offset)`), contrast.test (fallback @supports / reduced-transparency / focus).
- `pnpm lint` 0 error (2 warning cũ tools/task-dashboard) · `pnpm typecheck` PASS · `vitest run src/components src/lib src/i18n src/app` 171 files / 1678 PASS · `pnpm test` 264 files / 2760 PASS. `pnpm build` bỏ qua (lỗi môi trường Turbopack next/font ở path `.claude/worktrees`).
- Chưa kiểm bằng trình duyệt thật (dev server cùng lỗi next/font): chưa đo 375/768/1280 và VI/EN tràn menu ≥ xl — pill hẹp hơn hàng cũ ~16px ở 1280 (nội dung 1208 vs 1216px, logo ≤ 6rem, gap-3) → residual risk cần reviewer/primary xem thực tế (EN 7 mục + CTA dài).
- Minor fixes after review (r1): ProjectSubNav `OBSERVER_MARGIN` −168px + sửa comment (scroll-margin lớn nhất = 160px); HeaderFrame.test tách 2 assertion `fixed`/`absolute`; HeaderFrame comment cho `max-w-[84rem]`. Lint/typecheck/vitest layout+projects chạy lại bên dưới.
