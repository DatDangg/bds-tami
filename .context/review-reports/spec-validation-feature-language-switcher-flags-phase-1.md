Agent: spec-validator

# Spec Validation — feature/language-switcher-flags (BL-063) · phase 1 · round 1 (phase review)

**Entry Mode:** full_docs (change doc + SPECIFICATIONS 1.51.0 + spec update + CHANGELOG + test-scope v67 + task T01 + review r1 + code + ảnh)
**Sources validated against:** `spec/changes/2026-10-22-language-switcher-flags.md`, `SPECIFICATIONS.md:9,19,21,207` (diff working tree vs HEAD `294f1c6`), `spec/updates/2026-10-22-language-switcher-flags.md`, `spec/CHANGELOG.md:73`, `spec/test-scope/current.json` (v67), `spec/changes/BACKLOG.md:73`, `tasks/feature-language-switcher-flags/phase-1-task-01.md`, `.context/review-reports/feature-language-switcher-flags-phase-1-task-01-round-1-review.md`, `.context/design-spec.md:85,86,95,96,101-105,111,157`, `docs/DESIGN.md:260,262`, `docs/BRD.md:155`, code `src/components/layout/LanguageSwitcher.tsx`, `flag-icons.tsx`, `Header.tsx:64`, `MobileMenu.tsx:81`, `Footer.tsx:67`, `src/i18n/messages/{vi,en}.json:4-8`, `src/app/(frontend)/globals.css:17,29,37,38,178,230`; test `LanguageSwitcher.test.tsx`, `flag-icons.test.tsx`, `DesktopNav.test.tsx:118-130`, `PublicShell.test.tsx:162-186`; ảnh `.context/review-reports/assets/bl063-p1t01-*` (9 file; validator xem `header-top-1440-zoom`, `header-scrolled-1440-zoom`, `menu-390`, `footer-390-zoom`).

## Verdict: ✅ COMPLETE (PASS)

Không có ❌, không HIGH conflict, 1 ⚠️ LOW (câu footer ở `SPECIFICATIONS.md:19` còn ghi `VI | EN` như hiện trạng — cùng dòng với cụm header đã đổi). Code, test, ảnh và as-built spec khớp 4 acceptance; intent docs không bị sửa; không migration.

## Coverage Matrix (acceptance ↔ task ↔ implementation ↔ spec)

| # | Requirement (change doc acceptance) | Task | Implementation / evidence | Spec 1.51.0 + doc as-built | Status |
|---|---|---|---|---|---|
| 1 | Header (desktop + header nổi khi cuộn), menu mobile, footer hiện 2 cờ vuông thay chữ; bấm đổi đúng URL như hiện tại | T01 §Quyết định 1–4, Acceptance [x]1 | `LanguageSwitcher.tsx:27-58` map `locales` → `<a href={isCurrent ? pathname : localeSwitchHref(...)}>` chứa `FlagIcon` (không text); call site `Header.tsx:64` (`hidden sm:flex`, không đổi), `MobileMenu.tsx:81` + `Footer.tsx:67` (`tone="on-dark"`). Test href cũ giữ: `LanguageSwitcher.test.tsx:27-42` (`/cho-thue→/en/for-rent`, `/en/careers→/tuyen-dung`, trang slug qua `/api/locale-counterpart`), `PublicShell.test.tsx:172-186` (`/en`, `/`); `LanguageSwitcher.test.tsx:50-61` 1 svg `data-flag` khớp locale / link, `textContent` rỗng; `DesktopNav.test.tsx:128-129`. Ảnh: `bl063-p1t01-header-top-1440{.jpg,-zoom.png}`, `-header-scrolled-1440{…}`, `-menu-390.jpg`, `-footer-1440{…}`, `-footer-390{…}` — validator xem 4 ảnh: 2 cờ, không chữ, không ngăn `\|`, ring vàng + offset đúng nền | `SPECIFICATIONS.md:19` (header "cờ VI / EN"), `:207` as-built BL-063 (header ≥ sm, menu toàn màn hình, footer; đích link + cookie không đổi); design-spec `:85,:86,:96,:105,:111`; `DESIGN.md:260,262`; test-scope `specRefs[0..1]`, `impact.direct[0..4]` | ✅ |
| 2 | Cờ SVG inline/tĩnh (không emoji), góc vuông bo ≤ 2px, kích thước đều, nét trên nền sáng lẫn tối/hero | T01 Quyết định 1–2, Acceptance [x]2 | `flag-icons.tsx:10-27` svg `viewBox 0 0 24 24`, `aria-hidden` + `focusable=false` + `data-flag`, màu cố định; khung `LanguageSwitcher.tsx:49` `size-6 overflow-hidden rounded-[2px] ring-1 ring-black/20`. Test `flag-icons.test.tsx:6-16` (viewBox vuông, trang trí, `size-6`, không text) + `:18-25` (màu VN/UK). Ảnh header kính sáng + menu/footer `#111`/`#0a0c10`: cờ UK vẫn nét (thập trắng + viền mảnh); header trên hero = kính mờ sáng nên "nền hero" đã bao bởi ảnh header-top | `:207` "hai cờ vuông SVG inline … khung 24×24 bo ≤ 2px, viền mảnh nét trên nền sáng lẫn tối"; design-spec `:102`; test-scope `specRefNotes.Cờ` | ✅ |
| 3 | Đang chọn phân biệt không chỉ bằng màu; `aria-label` "Tiếng Việt"/"English"; `aria-current`; `lang`/`hreflang` giữ | T01 Quyết định 2, Acceptance [x]3 | `LanguageSwitcher.tsx:33-37` `hrefLang`/`lang`/`aria-label`/`title`/`aria-current`; `:50-51` `ring-2 ring-accent-text ring-offset-2` + `ring-offset-glass`/`-dark` (hình học); `:43` ngôn ngữ kia `opacity-60 hover/focus-visible:opacity-100 motion-reduce:transition-none`. i18n key sẵn có `vi.json:4-7`, `en.json:4-7` (không thêm key — đúng task). Token có thật: `globals.css:17` accent-text (`:230` đổi on-dark trong `.theme-dark-block`), `:29` glass, `:37` dark, `:178` duration-fast. Test `LanguageSwitcher.test.tsx:63-98`, `DesktopNav.test.tsx:121-125`, `PublicShell.test.tsx:174-180` | `:207` (aria-current + ring 2px offset, mờ 60%, aria-label/title/lang/hreflang); design-spec `:102-103`; test-scope `impact.direct[5]` | ✅ |
| 4 | Vùng bấm ≥ 24px (mobile ≥ 44px); `LanguageSwitcher.test.tsx` cập nhật | T01 Acceptance [x]4 | `:42` `min-h-11 min-w-11` mọi breakpoint; test `LanguageSwitcher.test.tsx:72`, `DesktopNav.test.tsx:126`; `LanguageSwitcher.test.tsx` +4 test BL-063 (`:45-99`) | `:207` "vùng bấm ≥ 44×44"; test-scope `acceptance[3]` ghi rõ as-built ≥ 44 mọi breakpoint | ✅ |
| 5 | Yêu cầu (không phải acceptance): ngôn ngữ kia mờ hơn, hover sáng lên | T01 Quyết định 2 | `:43` opacity 60 → 100 hover/focus; test assert lớp `:71`. Không có ảnh hover/focus (residual đã ghi ở task, review, spec update `:31`, test-scope `verification.note`) | `:207`, design-spec `:103` | ✅ (ảnh hover là residual, không chặn) |
| 6 | Intent docs không bị sửa; SPEC chỉ đổi khối as-built | — | `git status --short docs/BRD.md docs/PRD.md docs/USER_FLOW.md docs/API_SPEC.md` rỗng; `git diff -U0 SPECIFICATIONS.md` chỉ 3 hunk `:9` (version), `:19` (cụm header), `:207` (as-built). `docs/BRD.md:155` FR-PUB-19 "Nút chuyển ngôn ngữ VI / EN" là intent, không quy định chữ hay cờ → không mâu thuẫn | — | ✅ |
| 7 | Spec artifact nhất quán: update ↔ CHANGELOG ↔ test-scope v67 ↔ BACKLOG | — | `spec/updates/...:3` 1.50.0 → 1.51.0 MINOR; `CHANGELOG.md:73` 1.51.0 scope v67; test-scope `specVersion 1.51.0`, `scopeVersion 67`, `previousScope` archive v66 (file có trên đĩa `spec/test-scope/archive/test-scope-1.50.0-66.json`); `specRefs` trỏ `:207`, `:19`, design-spec §2.3 — đúng dòng; `changed.files` khớp `git status` (9 file); `migration: "không"`; `BACKLOG.md:73` BL-063 `in_progress` (đúng tới close-out) | — | ✅ |
| 8 | Verify tự chạy (validator) | — | `pnpm typecheck` PASS (exit 0) · `pnpm test` xem § Verify | — | ✅ (typecheck) / residual (`pnpm test` chưa xong trong phiên validator) |

## Cross-Document Conflicts

| Conflict | Source A | Source B | Impact |
|---|---|---|---|
| Footer hàng cuối còn ghi `VI \| EN` như hiện trạng | `SPECIFICATIONS.md:19` (khối Footer BL-044): "**hàng cuối** … bản quyền trái · phải `VI \| EN` + nút Cài đặt cookie"; cùng dòng còn "(… **ngôn ngữ đang chọn đậm**, focus ring màu chữ) (BL-020)" | `SPECIFICATIONS.md:207` as-built BL-063 (cờ ở footer; đang xem = ring, không đậm chữ); `.context/design-spec.md:111` + `docs/DESIGN.md:262` đã đổi "cờ VI / EN"; spec update `:12` chỉ liệt kê cụm header của `:19` | LOW ⚠️ — mâu thuẫn nội bộ trong một dòng spec; `:207` là nguồn as-built nên không gây hiểu sai requirement, nhưng nên sửa 2 cụm ở `:19` (footer `VI \| EN` → "cờ VI / EN"; "ngôn ngữ đang chọn đậm" → "ngôn ngữ đang chọn có ring") trước khi commit spec (file đang dirty, không cần bump version) |
| "LanguageSwitcher chưa đổi (BL-037)" | `SPECIFICATIONS.md:21`, `.context/design-spec.md:157` (hover link điều hướng BL-037: LanguageSwitcher chưa đổi hover) | Code `:43` hover nay đổi opacity (không đổi màu / gạch chân) | INFO — câu BL-037 nói về hover màu/gạch chân; cờ không có chữ nên vẫn đúng. Không cần sửa |
| Trạng thái "commit sắp tới" | `spec/updates/...:5`, `CHANGELOG.md:73` (không ghi SHA), test-scope `status` / `reviewResults[0]` / `changeDocStatus` | `git log`: T01 chưa commit (đúng hiện trạng) | INFO — nhất quán với đĩa; cần điền SHA khi primary close-out (như vòng BL-055) |

Không có HIGH conflict.

## Gaps

### (a) Code cần sửa
Không có (blocking: 0).

### (b) As-built cần ghi vào spec / artifact (non-blocking)
- **[PARTIAL]** `SPECIFICATIONS.md:19` — khối Footer còn "phải `VI | EN` + nút Cài đặt cookie" và khối BL-020 "ngôn ngữ đang chọn đậm" là hiện trạng cũ; đổi thành "cờ VI / EN (§2.3)" + "ngôn ngữ đang chọn có ring" để khớp `:207` / design-spec `:111`. Spec update `:12` nên bổ sung 2 cụm này. Sửa trước commit close-out, không bump version.
- **[PARTIAL]** Ghi SHA commit T01 vào `spec/updates/...:5`, `CHANGELOG.md:73`, test-scope `status` / `reviewResults[0]` / `changeDocStatus` khi close-out (pattern BL-055); change doc `status: pending` → `done` + tick 4 acceptance + archive.

### (c) Backlog follow-up (không thuộc BL-063, từ reviewer MINOR + residual)
- `tone="on-dark"` dùng `ring-offset-dark` (`--color-dark` #111111) còn menu toàn màn hình nền `--color-dark-deep` #0a0c10 (design-spec `:95`) — lệch nhỏ không thấy ở ảnh `menu-390`; design-spec `:103` đã ghi as-built `--color-dark` nên doc khớp code; tuỳ chọn đổi `ring-offset-bg` theo `.theme-dark-block`.
- Test hình học sao (10 điểm) / 4 path Union Jack; test `onClick` ghi cookie chỉ ở ngôn ngữ kia.
- Ảnh hover/focus và 768px chưa chụp (CSS không có nhánh md riêng; vòng focus `:focus-visible` toàn site).
- Kiểm hiển thị cờ trên Windows / macOS / Android thật ở staging (test-scope `riskNote` (1)).

## Missing Edge Cases
Không phát hiện thêm: trang vi / en, trang slug qua `/api/locale-counterpart`, chặn cookie (link vẫn hoạt động — JSDoc `:17`), reduced motion (`motion-reduce:transition-none`), < sm (header ẩn switcher, menu toàn màn hình có cờ — ảnh `menu-390`), header nổi 52/56px chứa vùng bấm 44px (ảnh `header-scrolled-1440-zoom`).

## Non-functional Gaps
Không. A11y: tên truy cập trên `<a>` (không phải phần tử generic), svg `aria-hidden`, `role=group` + `aria-label`, trạng thái không chỉ màu. Không migration (`migration: "không"`), không đổi schema / API / i18n key / route.

## Verify (validator tự chạy, `.context/project-config.md`)
- `pnpm typecheck` → PASS (exit 0).
- `pnpm test` (420 file) → chạy nền, **chưa kết thúc trong phiên validator** (không poll thêm theo Tool Loop Guard) → ghi **residual**: code không đổi so với lúc builder / primary / reviewer ghi `pnpm test` 420 file / 4.398 PASS + `npx vitest run src/components/layout` 22 file / 158 PASS (task §Verification, review r1 bảng verify). Primary nên xác nhận exit code `pnpm test` trước commit close-out (theo quy trình sẵn có).

## Verdict Reasoning
4 acceptance change doc đều có evidence code + test + ảnh (header đầu trang / nổi khi cuộn 1440, menu 390, footer 1440 / 390); `SPECIFICATIONS.md:207`, design-spec §2.1–2.4, `DESIGN.md:260,262`, CHANGELOG 1.51.0, test-scope v67 mô tả đúng as-built (ring-offset theo `tone`, opacity 60, 44×44, header ≥ sm); intent docs không đổi; không migration; typecheck PASS. Gap còn lại chỉ là 2 cụm hiện trạng cũ trong `SPECIFICATIONS.md:19` (cùng dòng đã sửa một phần) và điền SHA khi close-out → **COMPLETE / PASS**, 0 blocking, 2 non-blocking (b) + 4 follow-up (c) + 1 residual verify.
