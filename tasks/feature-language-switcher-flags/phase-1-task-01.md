# feature-language-switcher-flags · phase-1-task-01 — Nút đổi ngôn ngữ: cờ vuông VN / UK (SVG inline) thay chữ `VI | EN`

- Nguồn: BL-063 · change doc `spec/changes/2026-10-22-language-switcher-flags.md` (user chọn cờ vuông 2026-10-22).
- Không đổi schema / API / i18n key / route. Đổi hình thức một thành phần UI dùng chung (header, menu toàn màn hình, footer) → spec delta design-spec §2.3 (spec-publisher ghi `SPECIFICATIONS.md`, MINOR).
- **AUTO PROCEED** (user 2026-10-22: "tự quyết, đừng hỏi t"): phương án đã chốt ở § Quyết định, builder không hỏi.

## Classification / Risk
- Type: **MODIFY** (đổi hình thức nút chuyển ngôn ngữ FR-PUB-19, giữ nguyên hành vi link / cookie / a11y).
- Risk: **LOW** — UI thuần; blast radius là 1 component client `LanguageSwitcher` xuất hiện ở 3 chỗ (`Header.tsx:64` ≥ sm, `MobileMenu.tsx:81`, `Footer.tsx:67`) trên nền sáng (header kính mờ), nền tối (menu toàn màn hình, footer). Không logic mới.
- Expected review level: **NORMAL** (shared component + a11y; không auth / schema / API).
- Blast radius: `src/components/layout/LanguageSwitcher.tsx`, file icon cờ mới, `LanguageSwitcher.test.tsx`, `DesktopNav.test.tsx:118-130` (assert ngăn `|`), `PublicShell.test.tsx:162+` (tên link — giữ), `Header.test.tsx:216` (tên link — giữ), `.context/design-spec.md` §2.3 (+ các chỗ ghi `VI | EN` :85, :86, :96, :110), `docs/DESIGN.md:262`.

## Hiện trạng (file:line — không spawn Explore)
- `src/components/layout/LanguageSwitcher.tsx:16-54`: `role="group"` + `aria-label={t("switchLanguage")}`; map `locales` → mỗi mục `<a hrefLang lang aria-label={t("languageName.<locale>")}>` chữ `{locale}` in hoa (`uppercase`); ngôn ngữ đang xem `href={pathname}` + `aria-current="true"` + `font-bold`; ngôn ngữ kia `href={localeSwitchHref(pathname, locale)}` + `onClick` ghi cookie `buildLocaleCookie(locale)` + `hover:underline`; ngăn `<span aria-hidden className="px-2">|</span>`; mỗi mục `min-h-11 min-w-11`.
- Test hiện có: `LanguageSwitcher.test.tsx` (href trang tương ứng — giữ nguyên, chỉ tra theo `getByRole("link", { name })`), `DesktopNav.test.tsx:118-130` (44×44, `aria-current`, **ngăn `|` có `px-2`** → phải đổi), `PublicShell.test.tsx:162-185` (tên link, `hreflang`, `lang` — giữ), `Header.test.tsx:216` (tên "English" trong dialog — giữ).
- Chuỗi i18n `common.switchLanguage`, `common.languageName.{vi,en}` ở `src/i18n/messages/{vi,en}.json:4-8` — dùng lại, không thêm key.
- Không có icon cờ sẵn trong repo (`public/brand` chỉ logo; `src/components` không có flag). Icon khác trong repo dùng `@phosphor-icons/react` (vd `MagnifyingGlass` ở Header) — Phosphor không có cờ quốc gia → tự vẽ SVG.

## Quyết định (AUTO PROCEED)
1. **Cờ = SVG inline, tự vẽ, file mới `src/components/layout/flag-icons.tsx`** export `FlagIcon({ locale, className })` (hoặc 2 component `FlagVi` / `FlagGb`): `viewBox="0 0 24 24"` **vuông**, `aria-hidden="true"`, `focusable="false"`, thuộc tính `data-flag={locale}` để test tra. Không emoji, không ảnh ngoài, không thư viện mới.
   - **VN:** nền đỏ `#DA251D`, sao vàng 5 cánh `#FFFF00` ở giữa (polygon tính sẵn, bán kính ngoài ~6.5, bán kính trong ~2.5 trên lưới 24).
   - **UK (Union Jack, đơn giản hoá cho ô vuông):** nền xanh `#012169`; chéo trắng (2 đường `stroke-width` 5) + chéo đỏ `#C8102E` (`stroke-width` 2); thập trắng (`stroke-width` 7) + thập đỏ (`stroke-width` 4). Không cần lệch pha (counterchange) chéo đỏ ở cỡ 24px — ghi rõ trong JSDoc là bản giản lược.
   - Màu cờ là màu cố định (không theo token / dark mode) — đúng bản chất quốc kỳ.
2. **Bố cục mỗi mục:** vẫn `<a hrefLang lang aria-label>` (tên truy cập "Tiếng Việt" / "English"), vùng bấm **`min-h-11 min-w-11`** (≥ 44px mọi breakpoint — thoả "≥ 24px, mobile ≥ 44px"), `inline-flex items-center justify-center rounded-full`; bên trong khung cờ `size-6` (24×24) **`rounded-[2px]`** `overflow-hidden` + viền mảnh **`ring-1 ring-black/20`** để nét trên nền sáng lẫn nền tối (cờ đã có màu đậm nên không cần đổi viền theo nền; không dùng `ring-white` trên nền sáng).
   - **Đang chọn:** `opacity-100` + **`ring-2 ring-offset-2 ring-accent`** (ring-offset theo nền: trong header dùng `ring-offset-glass`/nền sáng; menu + footer nền tối → thêm prop `tone?: "on-light" | "on-dark"` cho `LanguageSwitcher` chỉ để chọn màu `ring-offset-*`; mặc định `on-light`; `MobileMenu` + `Footer` truyền `on-dark`). Phân biệt **không chỉ bằng màu**: ring dày 2px + offset (hình học) + `aria-current="true"` + `title`/`aria-label`.
   - **Ngôn ngữ kia:** `opacity-60`, `hover:opacity-100 focus-visible:opacity-100`, `transition-opacity motion-reduce:transition-none`; focus hiển thị bằng `focus-visible:outline-2 focus-visible:outline-offset-2 outline-accent` (hoặc lớp focus-ring sẵn có trong repo — Grep `focus-visible:` trong `Button`/`NavAnchor` để dùng cùng lớp).
   - Bỏ ngăn `|`; hai mục cách nhau `gap-1` (vùng bấm 44px kề nhau, cờ cách nhau ≥ 20px). Bỏ `uppercase text-small font-semibold` khỏi wrapper (không còn chữ). Giữ `role="group"` + `aria-label` nhóm, `className` prop, `onClick` ghi cookie, `localeSwitchHref`.
   - Thêm `title={t("languageName.<locale>")}` cho tooltip chuột (ngoài `aria-label`).
3. **Call site:** `Header.tsx:64` giữ `className="hidden sm:flex"`; `MobileMenu.tsx:81` → `<LanguageSwitcher tone="on-dark" />`; `Footer.tsx:67` → `tone="on-dark"`. Không đổi gì khác ở 3 file này.
4. **Không đổi** `localeSwitchHref`, cookie, `hreflang`/`lang`, thứ tự `locales` (vi trước, en sau).

## Scope
1. Sửa theo § Quyết định 1–4.
2. Test (vitest + Testing Library, TDD — fail trước, pass sau):
   - `LanguageSwitcher.test.tsx`: giữ 2 test href; thêm (a) mỗi link chứa đúng 1 `svg[data-flag]` khớp locale, **không có text node "VI"/"EN"** (`link.textContent?.trim() === ""`); (b) link đang xem có `aria-current="true"` + lớp ring đậm (`ring-2`), link kia có `opacity-60` và không `aria-current`; (c) `title` + `aria-label` = "Tiếng Việt" / "English" đúng theo locale; (d) `tone="on-dark"` đổi lớp ring-offset.
   - `DesktopNav.test.tsx:118-130`: bỏ assert ngăn `|` (`span[aria-hidden]` `px-2`) → thay bằng "không còn ngăn `|`" + svg `aria-hidden` có trong mỗi link; giữ assert `min-h-11 min-w-11`.
   - `PublicShell.test.tsx` / `Header.test.tsx`: chạy lại, không sửa trừ khi fail vì text.
   - Test icon: `flag-icons.test.tsx` — render 2 cờ, `aria-hidden="true"`, `viewBox` vuông `0 0 24 24`, `data-flag`.
3. Kiểm thị giác (Browser pane, dev server `.claude/launch.json` nếu chạy được; DB local): chụp header đầu trang + header nổi khi cuộn (1440), menu toàn màn hình (390), footer (1440 + 390), trạng thái hover/focus → lưu `.context/review-reports/assets/bl063-p1t01-<tên>.png`. Không chạy được → ghi residual.
4. Doc impact (as-built, builder sửa): `.context/design-spec.md` §2.3 (:101-103) mô tả cờ vuông + trạng thái; các chỗ `VI | EN` ở :85, :86, :96, :110 đổi thành "cờ VI / EN" (giữ ý bố cục); `docs/DESIGN.md:262` cột 2 "Chữ `VI | EN`" → "Hai cờ vuông VN / UK (SVG inline, chỉ cờ)". KHÔNG sửa `SPECIFICATIONS.md` / `spec/**` (spec-publisher làm).
5. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file scope>` (`pnpm lint` exit 1 sẵn do `.local-seed/*` git-ignored, ngoài scope) · `pnpm test` · `pnpm build`.

## Acceptance
- [x] Header (desktop + header nổi khi cuộn), menu toàn màn hình, footer hiện 2 cờ vuông SVG thay chữ; bấm đổi đúng URL như hiện tại (test href giữ PASS).
- [x] Cờ SVG inline, không emoji, `rounded-[2px]`, 24×24 đều nhau, có viền mảnh nét trên nền sáng lẫn tối.
- [x] Đang chọn: ring 2px + `aria-current="true"`; ngôn ngữ kia mờ 60%, hover/focus 100%; `aria-label` "Tiếng Việt"/"English", `lang`/`hreflang` giữ.
- [x] Vùng bấm ≥ 44×44 mọi breakpoint; test cập nhật PASS.
- [x] design-spec + DESIGN.md as-built; không đụng spec/**.
- [x] typecheck + eslint (scope) + test + build PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Builder (attempt 1, 2026-10-22)** — builder dừng trước khi ghi mục này (đang chờ `pnpm test`/`pnpm build`); primary (change-request) đọc đĩa + `git diff`, chạy lại verify và ghi thay (redo bước, không tính attempt).

Thay đổi:
- NEW `src/components/layout/flag-icons.tsx` — `FlagIcon({ locale, className })`: SVG `viewBox 0 0 24 24`, `aria-hidden` + `focusable="false"` + `data-flag`; VN nền `#DA251D` + sao vàng `#FFFF00` (polygon tính sẵn); UK Union Jack giản lược (xanh `#012169`, chéo trắng 5 / đỏ 2, thập trắng 7 / đỏ 4; không counterchange — ghi rõ JSDoc). Màu quốc kỳ cố định, không theo token.
- `src/components/layout/LanguageSwitcher.tsx` — bỏ chữ + ngăn `|`; mỗi mục `<a hreflang lang aria-label title>` `min-h-11 min-w-11 rounded-full`, khung cờ `size-6 rounded-[2px] ring-1 ring-black/20`; đang xem `aria-current` + `ring-2 ring-accent-text ring-offset-2` + `ring-offset-glass` (mặc định) / `ring-offset-dark` (prop mới `tone="on-dark"`); ngôn ngữ kia `opacity-60 hover/focus-visible:opacity-100 transition-opacity duration-(--duration-fast) motion-reduce:transition-none`; `onClick` ghi cookie chỉ ở ngôn ngữ kia (như cũ); `localeSwitchHref`/thứ tự `locales` giữ.
- `MobileMenu.tsx:81`, `Footer.tsx:67` → `<LanguageSwitcher tone="on-dark" />`; `Header.tsx` không đổi (`hidden sm:flex`).
- Test: NEW `flag-icons.test.tsx` (3 test: vuông 24×24, trang trí, data-flag; màu VN/UK); `LanguageSwitcher.test.tsx` +4 test (1 cờ/link khớp locale + không text; aria-current + ring-2 / opacity-60; title + aria-label + hreflang/lang; `tone` đổi ring-offset); `DesktopNav.test.tsx:118-130` bỏ assert ngăn `|` → assert group không text + svg `aria-hidden[data-flag]` trong mỗi link. `PublicShell.test.tsx` / `Header.test.tsx` không đổi, PASS.
- Doc as-built: `.context/design-spec.md` §2.1 (:85, :86), §2.2 (:96), §2.3 (:101-103 viết lại as-built BL-063), §2.4 (:110); `docs/DESIGN.md:262` (Language Switcher → hai cờ vuông). KHÔNG đụng `SPECIFICATIONS.md` / `spec/**`.

Verify (`.context/project-config.md`, primary chạy lại trên đĩa 2026-10-22):
- `pnpm typecheck` → PASS (exit 0).
- `npx eslint` 7 file scope (LanguageSwitcher.tsx/.test.tsx, flag-icons.tsx/.test.tsx, Footer.tsx, MobileMenu.tsx, DesktopNav.test.tsx) → 0 lỗi (`pnpm lint` exit 1 sẵn do `.local-seed/*` git-ignored, ngoài scope).
- `npx vitest run src/components/layout` → 22 file / 158 test PASS.
- `pnpm test` → 420 file / 4.398 test PASS (exit 0).
- `pnpm build` → PASS (exit 0).
- Kiểm thị giác (builder, Browser pane dev server, DB local): `.context/review-reports/assets/bl063-p1t01-header-top-1440{.jpg,-zoom.png}`, `-header-scrolled-1440{.jpg,-zoom.png}`, `-menu-390.jpg`, `-footer-1440{.jpg,-zoom.png}`, `-footer-390{.jpg,-zoom.png}` — primary xem lại: header kính sáng hiện cờ VN (ring vàng + offset) + cờ UK mờ; menu toàn màn hình + footer nền tối ring offset tối đúng; cờ vuông đều 24px, viền mảnh nét.

Doc impact: design-spec + DESIGN.md as-built (trên); `docs/API_SPEC.md` không đổi (không contract). SPEC F12 / Khung trang (:19 "VI|EN") → spec-publisher.

Residual:
- Chưa chụp trạng thái hover/focus (chỉ kiểm lớp bằng test); vòng focus dùng quy tắc `:focus-visible` toàn site.
- Union Jack giản lược (không counterchange) — chấp nhận ở 24px.
- Không commit (primary commit sau Reviewer PASS).
