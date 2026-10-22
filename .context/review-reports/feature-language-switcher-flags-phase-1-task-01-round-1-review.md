# Agent: reviewer — feature-language-switcher-flags · phase-1-task-01 · round-1

- Task: `tasks/feature-language-switcher-flags/phase-1-task-01.md` (BL-063 — nút đổi ngôn ngữ dùng cờ vuông SVG VN/UK thay chữ `VI | EN`)
- Change doc: `spec/changes/2026-10-22-language-switcher-flags.md`
- Branch: `staging` (uncommitted), ngày review 2026-10-22

## Review level: NORMAL
**Reason:** shared UI component (`LanguageSwitcher`) dùng ở 3 chỗ (header ≥ sm, menu toàn màn hình, footer) + a11y; không auth / schema / API / cookie logic mới (`localeSwitchHref`, `buildLocaleCookie` giữ nguyên). Không risk đỏ → không cần STRICT; không FAST vì shared component.

## Blast radius
- `src/components/layout/LanguageSwitcher.tsx` (viết lại JSX, thêm prop `tone`), NEW `flag-icons.tsx` + `flag-icons.test.tsx`.
- Call site: `Footer.tsx:67`, `MobileMenu.tsx:81` (chỉ thêm `tone="on-dark"`); `Header.tsx` không đổi.
- Test: `LanguageSwitcher.test.tsx` (+4), `DesktopNav.test.tsx:124-130` (bỏ assert ngăn `|`); `PublicShell.test.tsx` / `Header.test.tsx` không đổi (vẫn PASS trong `src/components/layout`).
- Doc as-built: `.context/design-spec.md` §2.1/2.2/2.3/2.4, `docs/DESIGN.md:260-262`. Không đụng `spec/**` / `SPECIFICATIONS.md` (đúng — spec-publisher làm).

## Verify commands + result (reviewer tự chạy, `.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx vitest run src/components/layout` | PASS — 22 file / 158 test |
| `npx eslint` 7 file scope (LanguageSwitcher.tsx/.test.tsx, flag-icons.tsx/.test.tsx, Footer.tsx, MobileMenu.tsx, DesktopNav.test.tsx) | 0 lỗi (exit 0) |
| `pnpm test` (420 file / 4398) · `pnpm build` | primary đã chạy PASS — không chạy lại |

## Kiểm theo acceptance (change doc + task)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 2 cờ vuông thay chữ ở header (đầu trang + nổi khi cuộn), menu, footer; href giữ | OK | `LanguageSwitcher.tsx:32` `href={isCurrent ? pathname : localeSwitchHref(...)}` như cũ; 2 test href cũ giữ PASS; ảnh `bl063-p1t01-header-top-1440-zoom.png`, `-header-scrolled-1440-zoom.png`, `-menu-390.jpg`, `-footer-1440-zoom.png`, `-footer-390-zoom.png` |
| SVG inline, không emoji, góc ≤ 2px, kích thước đều | OK | `flag-icons.tsx:10-27` `viewBox 0 0 24 24`; khung `size-6 rounded-[2px] overflow-hidden` (`LanguageSwitcher.tsx:49`) |
| Nét trên nền sáng lẫn tối | OK | `ring-1 ring-black/20` + màu cờ đậm; ảnh footer-390-zoom cờ UK rõ trên #111 nhờ thập trắng |
| Đang chọn phân biệt không chỉ bằng màu | OK | `ring-2 ring-offset-2` (hình học) + `aria-current="true"` (:37, :50); ngôn ngữ kia `opacity-60` (:43) |
| `aria-label` / `title` / `lang` / `hreflang` | OK | :33-36; test "title + aria-label…" |
| Vùng bấm ≥ 44px | OK | `min-h-11 min-w-11` (:42) mọi breakpoint; test DesktopNav + LanguageSwitcher assert |
| Cookie chỉ ghi khi bấm ngôn ngữ kia | OK | :38 `onClick={isCurrent ? undefined : …}` — hành vi cũ |
| SVG hợp lệ | OK | Sao: kiểm toán toạ độ (tâm 12,12, R 6.5 / r 2.5, góc −90°, −54°, −18°, 18°, 54°…): (18.18, 9.99), (15.82, 17.26), (13.47, 9.98), (14.38, 12.77), (12, 14.5) khớp `STAR_POINTS`. Union Jack: chéo trắng 5 / đỏ 2 vẽ trước, thập trắng 7 / đỏ 4 vẽ sau (đúng thứ tự xếp lớp) |
| Lớp Tailwind v4 có thật | OK | `--color-accent-text` (globals.css:17; `.theme-dark-block` :230 đổi sang on-dark-accent → ring trên nền tối đúng token), `--color-glass` :29, `--color-dark` :37, `--duration-fast` :178; cú pháp `duration-(--duration-fast)` đã dùng ở `button.tsx:8`, `input.tsx:11` … |
| `cn` gộp `ring-1 ring-black/20` + `ring-2 ring-accent-text` | OK | `src/lib/utils.ts:23-32` dùng `extendTailwindMerge` → class sau thắng; ảnh header zoom hiện ring vàng, không viền đen |
| Test không giả PASS | OK | Assert bằng DOM/attribute thật (`svg[data-flag]`, `aria-current`, `textContent` rỗng, class `ring-offset-*` theo `tone`), không mock component |
| Surgical diff | OK | Footer/MobileMenu mỗi file 1 dòng; DesktopNav test chỉ đổi assert ngăn `|`; không drive-by |
| Doc as-built không sửa intent | OK | Chỉ design-spec + DESIGN.md (as-built); `spec/**` không đổi |

## Responsive Checklist Gate (diff đụng UI)
Breakpoints profile: 375 / 768 / 1280 (+ ảnh builder 390 / 1440).
- **Layout:** OK — `flex items-center gap-1`, không container `px` cố định; cờ 24px là icon (`size-6` = 1.5rem). Không có horizontal scroll phát sinh (2 × 44px + 4px = 92px). Ở < sm header ẩn switcher (`hidden sm:flex`, không đổi) → nằm trong menu (ảnh menu-390 OK).
- **Typography/Spacing:** N/A — không còn chữ; spacing `gap-1` theo scale.
- **Media:** OK — SVG inline `viewBox` vuông + `size-6` (aspect 1:1 cố định), không ảnh raster.
- **Touch/Interaction:** OK — `min-h-11 min-w-11` = 44×44 mọi breakpoint (test assert); nav không đổi; table N/A.
- **Viewport/A11y:** OK — `motion-reduce:transition-none` (:43); không `100vh`; `overflow-hidden` chỉ cắt SVG trong khung bo góc (ring là box-shadow, không bị cắt — ảnh xác nhận).
- Chưa xác minh bằng ảnh ở 768 (tablet: header ≥ sm hiện switcher) → **Residual risk**, CSS không có nhánh riêng cho md nên rủi ro thấp.

## Skill gates
- `aislop`: **skip, aislop not installed** (kiểm tay: không code chết, không comment WHAT thừa, không abstraction thừa).
- `oxlint` (anti-slop): **skip, oxlint not configured** (không có `.oxlintrc*`); eslint scope 0 lỗi.
- `ocr` (open-code-review): **skip, ocr not installed**.
- AI-readable: **OK** — 0/≥3 indicator: tên rõ (`FlagIcon`, `tone`, `isCurrent`), hàm ≤ 50 dòng, indirection 1 bước, hằng màu/toạ độ có JSDoc giải thích WHY, design-spec + DESIGN.md cập nhật.
- ai-friendly-web: **N/A** (không đổi llms/robots/sitemap).
- blitzstrike: **N/A** (không auth/input).

## Findings
Không có CRITICAL / MAJOR.

- **[MINOR]** `src/components/layout/LanguageSwitcher.tsx:51` — `tone="on-dark"` dùng `ring-offset-dark` (`--color-dark` #111111) nhưng menu toàn màn hình nền `--color-dark-deep` (#0a0c10, design-spec §2.2); lệch ~7 đơn vị, không nhìn thấy ở ảnh menu-390. Đề xuất (tuỳ chọn): đổi offset theo `tone` thành `ring-offset-bg` để ăn theo `--color-bg` của `.theme-dark-block`, hoặc chấp nhận và ghi vào design-spec.
- **[MINOR]** `src/components/layout/flag-icons.test.tsx:18-25` — chưa assert hình học sao (10 điểm polygon) / 4 path Union Jack; reviewer đã kiểm toán tay nên không chặn. Đề xuất: thêm `expect(polygon.getAttribute("points")?.split(" ")).toHaveLength(10)`.
- **[MINOR]** `LanguageSwitcher.test.tsx` — không có test `onClick` ghi cookie chỉ ở ngôn ngữ kia (hành vi cũ giữ nguyên, code :38 rõ ràng); đề xuất task riêng nếu muốn khoá hành vi này bằng test.

## Residual risk
- Chưa có ảnh hover/focus và ảnh 768px (builder ghi residual; vòng focus theo `:focus-visible` toàn site, không lớp riêng).
- Union Jack giản lược (không counterchange) — chấp nhận ở 24px theo quyết định task.
- `pnpm test` / `pnpm build` đầy đủ do primary chạy, reviewer không chạy lại.

## Verdict: ✅ PASS
Không CRITICAL/MAJOR; acceptance change doc + task đủ bằng chứng (code, test, ảnh); verify reviewer tự chạy PASS. Builder có thể xử lý 3 MINOR ở vòng sau hoặc task riêng, không chặn commit.
