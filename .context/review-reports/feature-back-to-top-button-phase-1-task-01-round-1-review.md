Agent: reviewer

# Review — feature-back-to-top-button · phase-1-task-01 · round 1 (BL-035)

- **Review level:** NORMAL
- **Reason:** ADDITIVE client component cộng với việc chỉnh khung định vị của một shared layout component (`PublicShell` / `FloatingContact`) hiển thị trên mọi trang công khai. Không đụng auth/tenant/schema/API/dữ liệu/URL, không có risk đỏ → không cần STRICT.
- **Blast radius:** mọi route `(frontend)` qua `PublicShell`; nút liên hệ nổi (`FloatingContact`: sendBeacon/toggle không đổi, chỉ chuyển class định vị lên `FloatingDock`); tương tác vị trí với `CookieBanner` (< md, `--floating-bottom-offset`) và `ProjectStickyCta` (`--sticky-cta-height`); i18n `page.floating`. Admin không dùng `PublicShell` → không bị ảnh hưởng.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/layout src/components/consent` | PASS — 18 file / 141 test |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — không có lỗi |
| `pnpm lint` (`eslint .`) | 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |

## Kiểm theo danh sách cần soi
- **Không chồng nút liên hệ / cookie banner < md / sticky CTA:** OK. `FloatingDock.tsx:10` giữ nguyên chuỗi `bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--floating-bottom-offset,0px)+var(--sticky-cta-height,0px))]`, `right-[max(1rem,…)]`, `z-(--z-floating)`, giống hệt class cũ của `FloatingContact` (đã xem trong diff). Khung neo theo đáy, dùng `flex-col` + `gap-3` với BackToTop ở trên → nút trên ẩn/hiện không làm xê dịch nút liên hệ; nút ẩn bằng `invisible` nên vẫn chiếm chỗ, không gây nhảy layout.
- **Vẫn hiện khi FloatingContact trả null:** OK. BackToTop là con độc lập của dock (`PublicShell.tsx`). Có test `PublicShell.test.tsx` cho trường hợp "không có link liên hệ nổi nào" (`floatingContact: {}`).
- **pointer-events:** OK. Dock có `pointer-events-none`; nút BackToTop và group của FloatingContact có `pointer-events-auto`. Khi ẩn, `visibility:hidden` khiến nút không nhận click hay focus (dù có `pointer-events-auto`) và bị loại khỏi cây a11y.
- **Reduced-motion:** OK. `motion-reduce:transition-none` trên nút; khi click, `matchMedia("(prefers-reduced-motion: reduce)")` → `behavior: "instant"`. Gọi `matchMedia?.(…).matches` an toàn khi không có `matchMedia` vì optional chaining ngắt cả chuỗi.
- **Focus về #main:** OK. `PublicShell.tsx:27` có `<main id="main" tabIndex={-1}>`; gọi `focus({ preventScroll: true })` nên không cắt ngang việc cuộn mượt. Có test.
- **Nhãn a11y vi/en:** OK. Đã thêm `page.floating.backToTop` = "Lên đầu trang" / "Back to top"; có test cho cả 2 locale.
- **48px:** OK. `size-12` (3rem = 48px ≥ 44px).
- **Token tồn tại:** OK. Trong `src/app/(frontend)/globals.css` có `--color-focus-ring` (54), `--color-surface-muted` (24), `--color-border` (25), `--color-surface` (23), `--color-text` (33), `--duration-fast` (167), `--ease-standard` (115), `--z-floating` (179). Kiểu focus ring `focus-visible:outline-2 outline-offset-2 outline-focus-ring` giống các nút khác (HeroSlider, use-snap-slider, ActiveFilters).
- **SSR/hydration:** OK. `useState(false)` nên server và lần render đầu đều ẩn; vị trí được tính lại trong `useEffect` khi mount (có test cho trường hợp đã cuộn sâu khi mount).
- **Dọn listener:** OK. Gỡ `scroll` và `resize` bằng cùng tham chiếu `schedule`, đồng thời `cancelAnimationFrame` khung đang chờ. Listener `scroll` dùng passive và được gom qua rAF.
- **FloatingContact giữ nguyên hành vi:** OK. Diff chỉ đổi className của group và JSDoc; logic sendBeacon/toggle/trả null không đổi, các test cũ vẫn PASS.
- **print:hidden:** OK, có trên dock.
- **Không áp dụng admin:** OK. Chỉ mount trong `PublicShell`.

## Responsive Checklist Gate (diff đụng UI — 375 / 768 / 1280, xác minh bằng CSS math, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Phần tử `fixed` neo bên phải, rộng 48px, không có chiều rộng cố định nào tràn viewport |
| Mobile-first media query | OK | Chỉ dùng `md:` (min-width) của FloatingContact sẵn có; BackToTop không có breakpoint |
| Grid auto-fit / container không fixed px | N/A | Không có grid; dock co theo nội dung |
| Font-size rem | N/A | Không có chữ, chỉ có icon (24 là thuộc tính size của icon, không phải font) |
| Heading fluid / spacing scale | N/A / OK | `gap-3` theo scale |
| Media / ảnh / embed | N/A | Không có |
| Touch target ≥ 44px | OK | `size-12` = 48px |
| Nav hamburger / table wrapper | N/A | Không có |
| Không dùng 100vh | OK | Không dùng; ngưỡng hiện nút tính bằng `innerHeight` trong JS |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` + cuộn `instant` |
| Không che lỗi bằng overflow:hidden | OK | Không dùng |

## Skill gates
- **aislop:** skip — reviewer chỉ được chạy các verify command đã cấu hình; không chạy được `aislop scan` trong phạm vi quyền.
- **oxlint (anti-slop):** skip, oxlint not configured (không có `.oxlintrc*`). ESLint đã PASS với 0 error.
- **ocr (open-code-review):** skip, ocr not installed / không có trong verify commands.
- **AI-readable:** OK — 0 indicator. Tên rõ (`BackToTop`, `FloatingDock`, `scrollToTop`, `schedule`); hàm ngắn (component khoảng 40 dòng); không có indirection hay magic number (ngưỡng là `innerHeight`); comment giải thích WHY (lý do dùng invisible, lý do chuyển focus, lý do pointer-events).
- **ai-friendly-web:** N/A — component UI, không đổi robots/sitemap/llms.
- **blitzstrike:** N/A — không phải task STRICT nhạy cảm.

## Findings
- **[CRITICAL]** không có.
- **[MAJOR]** không có.
- **[MINOR]** `src/components/layout/PublicShell.test.tsx:206` — lấy dock bằng `button.parentElement!`. Test sẽ vỡ nếu sau này bọc nút trong một wrapper. Đề xuất: thêm `data-testid`, hoặc dùng `closest(".fixed")` / `within` theo vai trò. Không chặn.
- **[MINOR]** `src/components/layout/BackToTop.test.tsx:92-98` — test dọn listener chỉ kiểm có gọi remove cho `scroll` và `resize`, không kiểm đúng handler đã add. Đề xuất: spy cả `addEventListener` rồi so tham chiếu handler. Không chặn; code thực tế đã gỡ đúng tham chiếu.
- **[MINOR]** `src/components/layout/BackToTop.tsx:47` — `hover:bg-surface-muted` có thể "dính" sau khi chạm trên thiết bị cảm ứng. Mức thẩm mỹ, có thể bọc bằng `@media (hover:hover)` nếu cần. Không chặn.

## Residual risk
- Chưa xác minh trực quan trên browser thật (chồng lớp với banner cookie < md hay ProjectStickyCta; thứ tự xếp khi FloatingContact bung trên mobile). Kết luận dựa trên class định vị giữ nguyên 1:1 và CSS math.
- Các thanh dính đáy khác (nếu có trang chi tiết ngoài dự án dùng sticky CTA mà không đặt `--sticky-cta-height`) là vấn đề có sẵn của nút nổi, ngoài scope.
- Working tree còn sửa dở của user (`next.config.ts`, `src/payload-types.ts`, `src/components/projects/*`); không review, và cần loại khỏi commit của task này.

## Verdict
✅ **PASS** — không còn CRITICAL/MAJOR; đã đáp ứng các acceptance của change doc; verify PASS.
