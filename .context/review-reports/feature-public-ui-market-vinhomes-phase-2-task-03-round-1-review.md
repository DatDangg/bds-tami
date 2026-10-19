Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-03 · round 1 (slider Ưu đãi + Dự án kính mờ)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT (nâng từ NORMAL)
- **Reason:** đụng phần dùng chung: hook slider + `SliderArrow` mới, prop tuỳ chọn mới của `PostCard` (danh sách tin BĐS + trang chủ), class CSS toàn cục `.glass-panel`, xoá khoá trong file message VI/EN dùng chung — và việc xoá khoá đã gây hồi quy ngoài trang chủ.
- **Blast radius:** trang chủ (`ProjectsSlider` viết lại, `FeaturedOffers` bọc client `OffersSlider`, `home-view.ts` thêm `ProjectSlideView.salesStatus/stats`); `PostCard` prop `imageSizes` (tương thích ngược); `globals.css` `.glass-panel` (mới); `vi.json`/`en.json` xoá `layout.footer.columns.explore`, `page.home.projects.explore`, `page.home.offers.viewAll` → **footer mọi trang công khai bị ảnh hưởng** (`load-shell.ts:53`); bundle client `ProjectsSlider` import runtime `lib/projects/project-view` (không kéo `payload`). Không đổi route/layout/loader/schema.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS (message không type-check nên lọt khoá thiếu) |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 174 files, 1729 tests (không test nào phủ tiêu đề cột footer qua `load-shell`) |
| `next build` + bảng route (primary, `build-p2t03`) | PASS, bảng route không đổi |
| Trình duyệt (primary) | 6 thẻ dự án kính mờ hiển thị; seed không có `scale` → `<dl>` ẩn đúng; khối Ưu đãi đang tắt trong seed |

## Responsive gate (tính CSS)
Không cuộn ngang trang (slider cuộn trong list); breakpoint min-width; thẻ 464px chỉ từ `sm`; độ rộng Ưu đãi khớp gap; chữ dùng token; ảnh `aspect-[464/600]`, `sizes` đúng, lazy, không CLS; chạm ≥ 44px; reduced-motion OK. Chưa xác nhận: ở 375px khung kính (tiêu đề 2 dòng + vị trí + 2 hàng số liệu) có che badge trên thẻ ~281×363px không.

## Skill gates
aislop skip · oxlint skip (ESLint 0 error) · ocr skip · AI-readable OK (1 chỉ báo: chú thích trỏ "design-spec S01.6" sai mục) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- **[MAJOR]** Xoá khoá dịch footer vẫn đang dùng — `src/i18n/messages/vi.json:47-49`, `en.json:47-49` bỏ `layout.footer.columns.explore` nhưng `src/components/layout/load-shell.ts:53` vẫn `t("footer.columns.explore")` (namespace `layout`) → mọi trang công khai hai ngôn ngữ hiện khoá thô + next-intl log MISSING_MESSAGE. Sửa: khôi phục 2 locale + thêm test chặn (khoá dùng trong `load-shell` phải tồn tại). Hai khoá còn lại đã bỏ (`page.home.projects.explore`, `page.home.offers.viewAll`) không còn tham chiếu.
- **[MINOR]** Vòng focus bị cắt bởi `overflow-x-auto` (`ProjectsSlider.tsx` link `outline-offset-4`; `OffersSlider.tsx` `ul` không padding; `PostCard.tsx:42`) → thêm `pt-2`/`px-1.5` + scroll-padding hoặc ring vào trong.
- **[MINOR]** `OffersSlider.test.tsx` test mũi tên: jsdom `clientWidth = 0` nên chỉ chứng minh `left: 0` → stub `clientWidth` và assert ±900.
- **[MINOR]** Tên truy cập của link thẻ dự án quá dài → `aria-labelledby` id tiêu đề (+ `aria-describedby` nếu cần).
- **[MINOR]** Chú thích cũ: `ProjectsSlider.tsx` "design-spec S01.6" → mục "3"; `PostCard.tsx` "Server Component" → server/client.

## Kiểm OK
Hook tách ra giống logic cũ (IntersectionObserver 0.6, wrap-around, reduced motion, cleanup); carousel a11y (region, slide group, list `tabIndex=0`, nút có nhãn, chấm `aria-current`, không autoplay); xử lý null số liệu (`positiveOrNull`, trim `handoverTime`, ẩn ô/`<dl>`); `.glass-panel` đặc mặc định → kính trong `@supports` → đặc khi reduced-transparency, chữ `text-text`; link theo locale (`/en/property-news`); `PostCard` tương thích ngược; docs S01 #3/#5 + DESIGN.md khớp; file cấm không đụng.

## Residual risk
375/768/1280, kính mờ thật, vuốt/scroll-snap thật, CLS/LCP, badge vs khung kính trên mobile — kiểm trình duyệt.

## Verdict: FAIL (MAJOR khoá footer)
