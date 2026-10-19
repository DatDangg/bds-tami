Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-1-task-02 · round 1 (header nổi kính mờ sáng)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** layout dùng chung mọi trang public (HeaderFrame, Header, DesktopNav, LanguageSwitcher, nút mở MobileMenu) + token CSS toàn cục + offset sticky/neo ở ~12 component.
- **Phạm vi:** diff chưa commit trên `cca654d` (P1-T01); bỏ qua `src/payload-types.ts` (CRLF).

## Blast radius
Mọi trang public (thanh header, focus ring, thứ tự skip link, nút Menu mobile); trang chủ (HeroSlider kéo lên dưới header bằng `--header-offset`); chi tiết dự án (ProjectSubNav sticky + observer margin, scroll-margin ProjectSection/LegalPolicy/form); chi tiết cho thuê (aside sticky, SaleContactBox, thanh lọc mobile RentalFilters); chi tiết tuyển dụng (aside, ApplyFormSlot); tin tức/tin BĐS (PostShareRail, neo heading RichText); trang pháp lý (TableOfContents). Docs: design-spec §2.1/§2.7/S01.1, DESIGN.md, design-tokens.md §4. Không đụng API/data/schema/auth.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ `tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 171 files, 1679 tests |
| `pnpm build` (primary, worktree sạch `build-p1t02` ngoài `.claude/`) | PASS — Compiled successfully |
| Kiểm trình duyệt (primary, `next start` :3020, DB `tami_wt_bl020` seed `--sample`) | 1280 VI/EN: pill 1233×72, đủ 7 mục + tìm + VI\|EN, không tràn; `/tin-tuc` (không hero) không bị che; 375 `/du-an` scrollWidth = 375, có nút Menu; pane bật `prefers-reduced-transparency` → nền đặc (fallback đúng); khe m-4 dưới header trên chi tiết dự án nhìn chấp nhận được |

## Kiểm trọng tâm
- Header luôn kính mờ sáng, kể cả trên hero: không còn `data-header-hero`/`HEADER_HERO_ATTRIBUTE`/`data-solid`/`.logo-on-*` (trừ assert phủ định trong test); bỏ selector `:is(.site-header:has(...))`; `.theme-dark-block` vẫn đúng cho Footer, MobileMenu (`MobileMenu.tsx:58`), hero; MobileMenu vẫn `logo.onDark` (`MobileMenu.tsx:63`), Header truyền đủ `logo` (`Header.tsx:74`).
- MobileMenu render qua `DialogPrimitive.Portal` (`MobileMenu.tsx:51`) → `backdrop-filter` của thanh không bẫy overlay `fixed`, `pointer-events-none` không ảnh hưởng; dropdown DesktopNav trong thanh nên `pointer-events-auto`; SkipLink ngoài header.
- `--header-offset` 5rem (8+64+8) / lg 6.5rem (16+72+16) khớp markup; header sticky trong luồng → không che, không CLS, không JS (HeaderFrame thành server component); không còn `top-16/18/24/28`, `-mt-16`, `lg:pt-18`, `scroll-mt-<n>` hay 64/72px cứng.
- Dropdown DesktopNav: cầu hover `before:` đúng; bàn phím/aria giữ nguyên.
- BL-019 (≥ xl không nút Menu) và BL-018 (logo vàng trên nền sáng) giữ nguyên.
- Fallback: nền đặc mặc định → kính trong `@supports` → đặc lại dưới `prefers-reduced-transparency` (thứ tự đúng).
- AA: `--color-text` trên kính 10.83:1 (nền đen) / 17.55:1 (nền trắng); bỏ accent khỏi thanh; VI|EN chọn = đậm + `aria-current`; focus ring trong thanh = `--color-text`.
- Docs khớp code; carry-over m-a của P1-T01 đã đóng. Không đụng file cấm.

## Responsive gate
Không cuộn ngang (375: thanh 359px, nội dung 335px); chỉ breakpoint `min-width`; chạm ≥ 44px; < xl nút Menu, 768/1024 cụm phải < ½ hàng; hero `h-svh`; không `overflow:hidden` mới. 1280 VI/EN: tính toán OK, primary đã kiểm trình duyệt OK.

## Skill gates
aislop skip · oxlint skip (ESLint PASS) · ocr skip · AI-readable OK (2 chỉ báo: `max-w-[84rem]`, `OBSERVER_MARGIN` lặp phép tính offset) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
Không CRITICAL, không MAJOR.
- **[MINOR] m-1** `src/components/projects/ProjectSubNav.tsx:14` `OBSERVER_MARGIN` −160px = scroll-margin ≥ lg (104+56) → không còn khe, mục trước có thể còn "visible" nếu cuộn mượt > `SCROLL_LOCK_MS`; chú thích "~156px" sai. → dùng ~−168px, sửa chú thích.
- **[MINOR] m-2** `src/components/layout/HeaderFrame.test.tsx:10` `not.toHaveClass("fixed","absolute")` yếu → tách 2 assert.
- **[MINOR] m-3** builder đổi hành vi trên hero (task ghi "trong suốt → kính khi cuộn"; làm "luôn kính mờ sáng") — khớp quyết định user (README) và lý do AA, đã ghi design-spec S01.1/§2.7 → nêu rõ ở checkpoint.
- **[MINOR] m-4** khe trong suốt giữa thanh nổi và thanh dính (`ProjectSubNav.tsx:83`, `RentalFilters.tsx:47`) → kiểm trình duyệt (primary: chấp nhận được; menu neo restyle ở P4-T01).
- **[MINOR] m-5** `src/components/layout/HeaderFrame.tsx:12` `max-w-[84rem]` không có lý do/token → thêm chú thích.

## Residual risk
Glass/blur trên Safari (`-webkit-`), hover dropdown qua khe 2px chưa kiểm trình duyệt thật; nhảy tới `#main` trên trang không hero vẫn nằm dưới header (có từ trước, đề xuất task riêng).

## Verdict: PASS
(m-1, m-2, m-5 được builder sửa sau review — xem Verification summary task file.)
