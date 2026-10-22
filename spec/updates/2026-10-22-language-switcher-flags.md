# Spec Update — 2026-10-22 language-switcher-flags

**spec_version:** 1.50.0 → 1.51.0 (MINOR — đổi hình thức nút chuyển ngôn ngữ FR-PUB-19: hai cờ vuông SVG VN / UK thay chữ `VI | EN`; user chọn cờ vuông 2026-10-22)
**Trigger:** feature-update (BL-063, change-request class MODIFY)
**Work item:** `feature/language-switcher-flags` phase 1 · T01 NORMAL PASS r1 (3 MINOR không chặn) · commit close-out sắp tới (primary commit sau khi publish)
**Change doc:** `spec/changes/2026-10-22-language-switcher-flags.md` · task `tasks/feature-language-switcher-flags/phase-1-task-01.md` · review `.context/review-reports/feature-language-switcher-flags-phase-1-task-01-round-1-review.md`

## Lý do
Nút đổi ngôn ngữ (header desktop + header nổi khi cuộn, menu toàn màn hình, footer) là chữ `VI | EN`. User chọn đổi sang cờ vuông (2026-10-22): cờ Việt Nam cho `vi`, cờ Anh cho `en`, chỉ cờ không chữ; ngôn ngữ đang chọn rõ ràng, ngôn ngữ kia mờ hơn, hover sáng lên. Không emoji (emoji cờ không hiện trên Windows). Hành vi link / cookie / a11y giữ nguyên.

## Requirements
- **SỬA — Khung trang (`SPECIFICATIONS.md:19`):** cụm phải header ≥ xl "tìm, VI|EN, nút CTA" → "tìm, **cờ VI / EN**, nút CTA"; cùng dòng: ghi chú BL-020 "ngôn ngữ đang chọn đậm" → "có ring — cờ VI / EN từ BL-063"; hàng cuối footer "phải `VI | EN`" → "cờ VI / EN (BL-063)" (spec-validator phase 1 gap non-blocking, đã sửa trước close-out).
- **SỬA — F12 / FR-PUB-19 nút chuyển ngôn ngữ (`SPECIFICATIONS.md:207`):** thêm as-built BL-063 — nút chuyển ngôn ngữ = **hai cờ vuông SVG inline** VN / UK (chỉ cờ, không chữ, không emoji; khung 24×24 bo ≤ 2px, viền mảnh nét trên nền sáng / tối); ngôn ngữ đang xem `aria-current` + ring 2px có offset (phân biệt không chỉ bằng màu), ngôn ngữ kia mờ 60%, hover/focus 100%; `aria-label` "Tiếng Việt" / "English", `title`, `lang` / `hreflang`; vùng bấm ≥ 44×44; xuất hiện ở header (≥ sm), menu toàn màn hình, footer. **Đích link và cookie `NEXT_LOCALE` không đổi.**
- **THÊM:** không có requirement mới (chỉ đổi hình thức + as-built).
- **XOÁ:** không.

## Ảnh hưởng
- Module: `src/components/layout/LanguageSwitcher.tsx` (viết lại JSX, prop mới `tone?: "on-light" | "on-dark"` chỉ đổi màu `ring-offset-*`; `localeSwitchHref`, `buildLocaleCookie`, thứ tự `locales` giữ), NEW `src/components/layout/flag-icons.tsx` (`FlagIcon({ locale, className })`, SVG `viewBox 0 0 24 24`, `aria-hidden` + `focusable="false"` + `data-flag`; VN `#DA251D` + sao `#FFFF00`; UK Union Jack giản lược `#012169` / `#C8102E`; màu quốc kỳ cố định, không theo token). Call site: `MobileMenu.tsx:81`, `Footer.tsx:67` thêm `tone="on-dark"`; `Header.tsx` không đổi (`hidden sm:flex`).
- Không đổi schema / API / i18n key / route / quyền, **không migration**.
- Test: NEW `flag-icons.test.tsx` (vuông 24×24, trang trí, `data-flag`, màu VN / UK); `LanguageSwitcher.test.tsx` +4 (1 cờ / link khớp locale + không text; `aria-current` + `ring-2` / `opacity-60`; `title` + `aria-label` + `hreflang` / `lang`; `tone` đổi ring-offset) — 2 test href cũ giữ; `DesktopNav.test.tsx:118-130` bỏ assert ngăn `|` → assert group không text + svg `aria-hidden[data-flag]` trong mỗi link. `PublicShell.test.tsx` / `Header.test.tsx` không đổi, PASS.
- Doc as-built (builder đã sửa): `.context/design-spec.md` §2.1 (:85, :86 "cờ VI / EN"), §2.2 (:96), §2.3 (viết lại as-built BL-063), §2.4 (:110); `docs/DESIGN.md:262` (Language Switcher → hai cờ vuông VN / UK). `docs/API_SPEC.md` không đổi.
- Scope: `spec/test-scope/current.json` v67 (bản cũ v66 → `spec/test-scope/archive/test-scope-1.50.0-66.json`).

## Verify
- `pnpm typecheck` PASS · `npx eslint` 7 file scope (LanguageSwitcher.tsx/.test.tsx, flag-icons.tsx/.test.tsx, Footer.tsx, MobileMenu.tsx, DesktopNav.test.tsx) 0 lỗi (`pnpm lint` exit 1 sẵn do `.local-seed/*` git-ignored, ngoài scope) · `npx vitest run src/components/layout` 22 file / 158 PASS · `pnpm test` 420 file / 4.398 PASS · `pnpm build` PASS.
- Ảnh (Browser pane dev server, DB local): `.context/review-reports/assets/bl063-p1t01-header-top-1440{.jpg,-zoom.png}`, `-header-scrolled-1440{.jpg,-zoom.png}`, `-menu-390.jpg`, `-footer-1440{.jpg,-zoom.png}`, `-footer-390{.jpg,-zoom.png}` — header kính sáng: cờ VN ring vàng + offset, cờ UK mờ; menu + footer nền tối: ring offset tối đúng; cờ 24px đều, viền mảnh nét.
- Reviewer tự chạy lại typecheck + vitest layout + eslint scope PASS; `pnpm test` / `pnpm build` đủ bộ do primary chạy.

## Residual
- 3 MINOR reviewer (không chặn): (1) `tone="on-dark"` dùng `ring-offset-dark` (`--color-dark` #111111) trong khi menu toàn màn hình nền `--color-dark-deep` (#0a0c10) — lệch nhỏ, không thấy ở ảnh; (2) `flag-icons.test.tsx` chưa assert hình học sao (10 điểm) / 4 path Union Jack (reviewer đã kiểm tay); (3) chưa có test `onClick` ghi cookie chỉ ở ngôn ngữ kia (hành vi cũ giữ nguyên).
- Chưa chụp trạng thái hover / focus (chỉ kiểm lớp bằng test; vòng focus theo `:focus-visible` toàn site) và chưa có ảnh 768px (header ≥ sm hiện switcher; CSS không có nhánh md riêng).
- Union Jack giản lược (không counterchange) — chấp nhận ở 24px.
