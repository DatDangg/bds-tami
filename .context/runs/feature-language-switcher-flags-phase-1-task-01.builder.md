# builder note — feature-language-switcher-flags / phase-1-task-01 (BL-063)

## Đã làm
- `src/components/layout/flag-icons.tsx` (mới): `FlagIcon({ locale, className })` SVG inline vuông `0 0 24 24`, `aria-hidden` + `focusable="false"` + `data-flag`; VN đỏ `#DA251D` + sao vàng polygon tính sẵn; UK Union Jack giản lược (chéo trắng 5 / đỏ 2, thập trắng 7 / đỏ 4), ghi JSDoc là bản giản lược.
- `LanguageSwitcher.tsx`: bỏ chữ `VI|EN` + ngăn `|`; 1 nhánh render chung cho 2 mục (`isCurrent`), thêm `title`, prop `tone` ("on-light" mặc định → `ring-offset-glass`; "on-dark" → `ring-offset-dark`). Đang chọn: khung cờ `ring-2 ring-accent-text ring-offset-2` (dùng `accent-text` thay `accent` trong task vì `--color-accent` = primary-soft #ead3ae quá nhạt trên kính; `accent-text` tự đổi sang on-dark-accent trong `.theme-dark-block`). Ngôn ngữ kia `opacity-60 hover/focus-visible:opacity-100`. Focus: dùng `:focus-visible` toàn site (globals.css), không thêm lớp riêng.
- `MobileMenu.tsx:81`, `Footer.tsx:67`: `tone="on-dark"`. `Header.tsx` không đổi.
- Test: `flag-icons.test.tsx` (mới), `LanguageSwitcher.test.tsx` (+4 test), `DesktopNav.test.tsx` (bỏ assert ngăn `|`). TDD: 5 fail trước (module thiếu, title/ring/opacity), pass sau.
- Doc as-built: `.context/design-spec.md` §2.1/2.2/2.3/2.4 (chỗ `VI | EN`), `docs/DESIGN.md` hàng Header + Language Switcher.
- Ảnh: `.context/review-reports/assets/bl063-p1t01-{header-top-1440,header-scrolled-1440,footer-1440,menu-390,footer-390}.jpg` + `*-zoom.png` (chụp trên dev server 3000 đang chạy của chat khác — cùng thư mục repo nên có code mới; `pnpm dev` thứ hai bị next khoá).

## Verify
- typecheck PASS, eslint scope PASS (exit 0), 5 test file scope PASS (52 test). oxlint: repo không có config → skip.
- `pnpm test` đủ bộ + `pnpm build`: xem § Verification summary trong task file.

## Còn dở / residual
- Hover ở 390 không đo được (Tailwind v4 `hover:` gated `(hover: hover)`, emulation mobile là touch) — đúng kỳ vọng.
- Không commit (primary lo).
