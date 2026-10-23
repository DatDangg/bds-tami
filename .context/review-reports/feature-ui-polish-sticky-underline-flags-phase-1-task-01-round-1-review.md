Agent: reviewer

# Review: feature-ui-polish-sticky-underline-flags · phase-1-task-01 · round 1

- Task: `tasks/feature-ui-polish-sticky-underline-flags/phase-1-task-01.md` (BL-074 mục 1, MODIFY)
- Branch: `staging` (chưa commit)
- Review level: **STRICT**
- Reason: component dùng chung (`DetailLayout`, `DetailSubNav`, `DetailContactAside`) cho 3 trang chi tiết (Dự án / Cho thuê / Tin BĐS); `DetailLayout` còn dùng cho Dịch vụ / Tuyển dụng; đụng sticky, scroll-spy, anchor `#lead-form`.

## Blast radius
- `src/components/detail/DetailLayout.tsx` → `DetailPageShell` → `ProjectDetail` (`/du-an/<slug>`), `RentalDetail` (`/cho-thue/<slug>`, cả `belowSpecBar`), `PostDetail` (`/tin-bds/<slug>`, vi+en).
- `DetailLayout` không subNav: `JobDetail` (Tuyển dụng), `dich-vu/[slug]/page.tsx` (Dịch vụ). Nhánh `subNav` falsy render `<>{leadingColumn}{mainColumn}</>` nên DOM giống cũ. Class lưới vẫn cùng tập class, chỉ đổi thứ tự token (`py-4 lg:py-8` ra cuối); Tailwind không phụ thuộc thứ tự token.
- `DetailSubNav`: thêm prop `frameClassName`, mặc định = khung cũ → chỗ dựng đứng riêng (test) không đổi. Ngoài `DetailLayout` không có caller production nào khác.
- `DetailContactAside.SCROLL_MT_CLASS`: chỉ đổi < lg (`+1rem`), ≥ lg giữ `+4.5rem`.
- Không có code/CSS/e2e nào phụ thuộc `[data-detail-page] > nav` (Grep `src/` + selector: không có). `DetailAsideFit` và scroll-spy không đọc vị trí DOM của nav.
- Không đổi API/schema/i18n/migration.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (eslint, exit 0, không warning) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, exit 0) |
| `pnpm test` (toàn bộ) | PASS: 436 files / 4591 tests, exit 0 (log stderr "Not implemented: navigation…" / seed english là noise có sẵn, không fail) |
| `pnpm test src/components/detail …project-detail… …rental-detail… src/components/posts` | PASS: 15 files / 173 tests |

## Đánh giá kỹ thuật

### Root cause → fix
- Root cause đúng: nav sticky là con trực tiếp của gốc `[data-detail-page]`, nên khối chứa sticky là cả trang. Vì vậy < lg thanh dính đè lên `aside` (xếp sau cột trái).
- Fix < lg: nav + (leading) + cột chính nằm trong `div.lg:contents` (block thường ở < lg). Khối chứa sticky của nav thành wrapper, nên nav thôi dính khi chạm đáy cột trái (trừ `mb-4`). `aside` đứng ngoài wrapper với `pt-6`, nên khe tối thiểu đáy thanh → thẻ form = 16 (`mb-4`) + 24 (`pt-6`) = 40px ≥ 16px yêu cầu. CSS math khớp số đo builder (≥ 40px ở mọi mức cuộn).
- Fix ≥ lg: wrapper `display: contents`, nên nav, leading và cột chính thành grid item của lưới. Nav `lg:col-span-2` nằm hàng 1; cột chính + aside nằm hàng 2. Lưới không `items-start`, aside stretch cao bằng hàng, nên thẻ phụ vẫn sticky suốt cột trái như cũ.

### Sticky trong grid item (rủi ro Firefox/Safari)
- Theo css-position-3, sticky bị giới hạn bởi *containing block* của phần tử. Blink (sticky constraints trong `LayoutBoxModelObject`), Gecko (`StickyScrollContainer::ComputeStickyLimits` dùng content rect của `GetContainingBlock()`) và WebKit (`computeStickyPositionConstraints` dùng `containingBlock()`) đều lấy **box của grid container**, không lấy grid area. Pattern "ô header sticky trong CSS grid" chạy ổn trên cả 3 engine cũng dựa vào điều này. `display: contents` của wrapper không tạo box, nên containing block là lưới.
- Kết luận: ≥ lg thanh dính suốt chiều cao lưới; Chromium đã đo (builder). Firefox/Safari chưa đo thực tế, rủi ro thấp (xem Residual risk).
- Thay đổi hành vi ≥ lg: thanh thôi dính ở cuối lưới, không còn dính trên `after`. Đã ghi trong Decision log + spec delta và được chấp nhận.

### Khoảng cách / mép (BL-028)
- Trước: nav có khung riêng `mx-auto w-full max-w-container px-gutter`, lưới `py-4 lg:py-8`. Sau: nav nằm trong lưới (lưới cùng khung `mx-auto w-full max-w-container px-gutter`), nên bề rộng `ul` = content box lưới, như cũ.
  - Khe trên thanh = `pb-8` của `before`, không đổi.
  - Khe thanh → nội dung = `mb-4 lg:mb-8` (16/32), thay cho phần trên của `py-4 lg:py-8`.
  - Lưới chỉ có `gap-x` (không row-gap), nên ≥ lg không phát sinh khe thừa.
- ≥ lg nav span 2 cột: mép trái = mép cột trái, mép phải = mép aside (đúng BL-028). Khớp số đo builder (khe 16→16, 32→32; ul l105 r1321 @1440, l27 r982 @1024).
- Không có margin-collapse bất ngờ: nav là con đầu wrapper (không margin-top), `mb-4` gặp sibling cột chính.

### Scroll-spy / anchor
- `DetailSubNav` không phụ thuộc vị trí DOM của nav: IntersectionObserver theo `#id` các khối. `OBSERVER_TOP_PX` vẫn đúng vì nav vẫn `top var(--sticky-top)` và cao như cũ. `DetailSection` `scroll-mt +4.5rem` vẫn đúng vì trong cột trái thanh vẫn dính.
- `#lead-form` < lg `scroll-mt +1rem`: khi thẻ ở top 24px thì đáy wrapper ≈ 0, nên đáy nav ≤ −16px (đã ra khỏi màn) và không che thẻ. ≥ lg giữ `+4.5rem`.

### A11y / thứ tự DOM / print
- Thứ tự DOM & tab: before → nav → (leading) → cột chính → aside → after, giống trước (nav trước đây đứng ngay trước lưới). Landmark `nav[aria-label]` giữ nguyên. `display: contents` chỉ đặt trên `div` không role nên không mất semantics.
- Print: nav vẫn `print:hidden` (đi qua `cn`); wrapper là block khi in.

### Test
- `DetailLayout.test.tsx` khẳng định cấu trúc mới:
  - nav là con đầu của `div.lg:contents`, cột chính là con cuối;
  - aside là sibling nằm ngoài wrapper;
  - lưới có `pb-4 lg:pb-8`, không có `py-4`;
  - nav có `lg:col-span-2 mb-4 lg:mb-8`, không có `max-w-container`.
- Nhánh không subNav vẫn giữ assert DOM cũ: thẻ là con đầu, chuỗi class lưới đầy đủ, leading đứng trước thẻ.
- `DetailBlocks.test.tsx` kiểm cả 2 `scroll-mt` mới. `project-detail`/`rental-detail` cập nhật đường đi DOM, vẫn kiểm `pb-8` của khối trước tab.
- jsdom không đo được layout sticky. Phần hình học dựa vào số đo builder + CSS math; cấu trúc DOM (điều kiện đủ của fix) đã được khóa bằng test.

## Responsive Checklist Gate
Diff đụng UI (layout chi tiết). Reviewer không có browser tool, nên xác minh bằng CSS math + số đo builder (Chromium 390/768/1024/1440).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Nav không còn khung riêng, nằm trong content box lưới `w-full max-w-container px-gutter`; `ul` vẫn `overflow-x-auto`; không thêm width cố định |
| Mobile-first `min-width` | OK | Chỉ dùng biến thể `lg:` (min-width): `lg:contents`, `lg:col-span-2`, `lg:mb-8`, `lg:pb-8`, `lg:scroll-mt-…` |
| Grid không cột cố định px | N/A | Template cột lưới không đổi (`minmax(0,1fr)_22rem/24rem` có sẵn, ngoài scope) |
| Container không fixed px | OK | Không thêm width px |
| Font rem / heading clamp | N/A | Không đổi typography |
| Spacing theo scale | OK | `mb-4/lg:mb-8`, `pb-4/lg:pb-8`, `1rem`/`4.5rem` là token spacing |
| Media (img/video) | N/A | Không đổi media |
| Touch target ≥ 44px | N/A | Nút thanh không đổi kích thước |
| Nav mobile không tràn | OK | Thanh vẫn cuộn ngang < lg, mục active tự vào giữa (code không đổi) |
| Table scroll wrapper | N/A | Không có bảng |
| Không `100vh` đơn thuần | N/A | Không thêm; class aside sẵn có dùng `100dvh` |
| `prefers-reduced-motion` | OK | `handleClick` vẫn tôn trọng `prefersReducedMotion()` (không đổi) |
| Không che lỗi bằng `overflow:hidden` | OK | Không thêm overflow hidden; fix bằng cách giới hạn khối chứa sticky |

## Skill gates
- aislop: skip, `aislop` không nằm trong quyền Bash của reviewer (chỉ verify commands + git). Đọc tay diff: không thấy AI-slop (comment giải thích WHY, không có code thừa).
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS.
- ocr (open-code-review): skip, `ocr` không nằm trong quyền Bash của reviewer.
- AI-readable: OK, 0 indicator. Hàm `DetailLayout` ~40 dòng; tên rõ (`mainColumn`, `leadingColumn`, `GRID_PADDING_BELOW_SUBNAV`, `DEFAULT_FRAME_CLASS`); không magic number; comment nêu WHY. Doc flow do change-request reconcile (design-spec S03/§2.1, SPECIFICATIONS BL-074).
- ai-friendly-web: N/A (không đổi public meta/robots/sitemap).
- blitzstrike: N/A (không đụng auth/input/API).

## Findings
- [CRITICAL] Không có.
- [MAJOR] Không có.
- [MINOR] `src/components/detail/DetailLayout.tsx:69`: chưa có caller nào kết hợp `subNav` + `leading` + `aside`. Nếu có, ≥ lg với `GRID_WITH_LEADING` 2 cột thì nav ở hàng 1, leading + cột chính ở hàng 2, `aside` tràn xuống hàng 3. Đây là hành vi có sẵn trước fix (aside vốn đã wrap), không cần sửa trong task này; nếu sau này dùng kết hợp thì cần test riêng.
- [MINOR] `src/components/detail/DetailLayout.test.tsx:159`: assert `toBe` theo đúng chuỗi class, nên test giòn với thứ tự token. Tập class tương đương bản cũ nên hành vi không sai, chỉ ghi nhận.
- [MINOR] Chưa có test tự động về hình học (jsdom không đo được sticky). Nếu repo có e2e Playwright cho trang chi tiết, lần sau nên thêm assert `form.top − nav.bottom ≥ 16` ở 390px. Không chặn PASS.

## Residual risk
- Firefox / Safari chưa đo thực tế, gồm: ≥ lg sticky trong grid item hàng 1 span 2 cột; < lg sticky trong wrapper block. Theo spec và cách cài đặt của 3 engine, containing block của sticky là box lưới (`display:contents` không tạo box), nên dự kiến đúng. QA nên soi 1 lượt Safari iOS (390) + Firefox desktop (1440).
- Reviewer không có browser tool, nên số đo hình học dựa vào evidence của builder (Chromium) + CSS math (đã khớp).

## Verdict
**PASS**: không có CRITICAL/MAJOR. lint, typecheck, test PASS (436/4591). Root cause đã được sửa đúng bằng cấu trúc; nhánh không subNav giữ nguyên DOM.
