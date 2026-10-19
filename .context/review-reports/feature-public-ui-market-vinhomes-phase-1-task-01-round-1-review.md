Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-1-task-01 · round 1
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** đổi token dùng chung trong `globals.css` (radius, cỡ chữ, màu, gradient), `Button`/`Badge` dùng chung, `cn`/`FONT_SIZE_TOKENS` — dùng trên mọi trang public.
- **Blast radius:** mọi component `rounded-md/lg/xl` (4px → 12/16/20px, kể cả `ui/dialog.tsx:55`, `ui/select.tsx:48`, `forms/FormStatus.tsx:29,58`, `careers/ApplyForm.tsx:116`); mọi `text-display/h1/h2` (desktop 56/40/30 → 60/56/44px, gồm h2 của SimilarRentals, ProjectSection, LegalPolicy, ProjectDetail, PostDetail, tin-tuc/[slug], dich-vu/[slug], JobDetail); mọi Button/Badge (pill); badge trạng thái dự án (`SALES_STATUS_BADGE_VARIANT`); i18n bỏ `page.home.about.*`, `page.home.projects.watermark`. Không đổi API/schema/data.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error; 2 warning cũ ở `tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n` | PASS 159 files, 1592/1592 |
| `pnpm vitest run src/app` | PASS 11 files, 84/84 |
| `pnpm build` | không chạy (primary xử lý) |
| `pnpm test` đầy đủ | không chạy (builder báo 2756/2757, 1 timeout Header.test chạy riêng PASS) |

Contrast tính lại: `#3c2704` / `#c9a15f` 5.89 · trắng / `#2f7d5b` 4.99 · `#e0bf89` / `#1c1c1c` 9.72 · text / kính mờ trên nền đen 10.8 — đều AA. `.theme-dark-block` không ghi đè `--color-success*`/`--color-primary`/`--color-on-dark` → badge gradient vẫn AA trong khối tối. Accent text trên kính mờ ~3.0:1 khi nền đen — builder đã ghi thành luật cho task header.

## Responsive gate (tính bằng CSS, không có trình duyệt)
Không cuộn ngang (chỉ đổi radius/cỡ chữ; clamp heading tại 375px ≈ 32/30/26px; giữ `text-balance`, `max-w-[22ch]`); heading `clamp()` theo rem; ảnh giữ `aspect-*` + `overflow-hidden`; nút giữ `h-11`; MobileMenu giữ `min-h-14`; `motion-reduce` giữ. Residual: h2 44px xuống dòng ở 768px và CLS do metrics font mới chưa kiểm trình duyệt thật.

## Skill gates
aislop: skip (không có trong lệnh được phép) · oxlint: skip (repo dùng ESLint) · ocr: skip (chưa cài) · AI-readable: OK (1 chỉ báo: lệch docs — m1, m2) · ai-friendly-web: N/A · blitzstrike: N/A.

## Findings

### [MAJOR] M1 — Heading weight 400 không thực hiện được: chỉ nạp file EB Garamond 500
`src/lib/fonts.ts:7` `weight: ["500"]`. Quyết định user #1 + task yêu cầu heading weight 400; docs ghi 400. next/font chỉ phục vụ mặt 500 nên trình duyệt vẫn vẽ 500. **Sửa:** nạp `weight: ["400","500"]` (hoặc chỉ `"400"` sau khi kiểm chỗ dùng `font-display` + `font-medium/semibold`, vd `PostCard.tsx:59`), giữ preload, thêm assert test.

### [MAJOR] M2 — Hạ heading phụ xuống `text-h3` làm đảo thứ bậc heading
- `src/components/rentals/RentalDetail.tsx:129`: `<h1>` trang còn `text-h3` (~25px) trong khi `SimilarRentals.tsx:15` `<h2>` `text-h2` 44px; `RentalSpecs.tsx:63`, `RentalTerms.tsx:58` h2 cũng `text-h3`.
- `src/components/content/RichText.tsx:183`: h2 nội dung bằng cỡ h3 (dòng 184).
- `src/components/careers/JobDetail.tsx:118` vs `:130`: hai h2 cùng trang 25px và 44px.
**Sửa:** thêm token heading trong nội dung/trang chi tiết (giữ h2 cũ `clamp(1.5rem, 1.35rem + 0.62vw, 1.875rem)`, vd `--text-h2-sm`, đăng ký `FONT_SIZE_TOKENS`) dùng cho RichText h2, RentalDetail h1 (hoặc `text-h1`), JobDetail h2, LeadFormSlot, ContactDetails; đảm bảo h1 mỗi trang ≥ h2.

### [MINOR] m1 — `.context/design-spec.md` lệch code 2 chỗ
Khối "Về TAMI" (~dòng 250) còn ghi số liệu `--text-h1` (code `text-h2`, `AboutBlock.tsx:33`); Dự án nổi bật (~dòng 256) còn ghi tên slider `--text-h2` (code `text-h3`, `ProjectsSlider.tsx:80`).

### [MINOR] m2 — Chưa cập nhật file nguồn token
`globals.css:2` trỏ `skills/react-nodejs/design-tokens.md` là nguồn; file đó còn `--text-watermark` (dòng 139), radius 4px, H1/H2 in hoa, weight 500. Cập nhật hoặc ghi chú BL-020.

### [MINOR] m3 — tailwind-merge chưa biết `rounded-pill`
`src/lib/utils.ts:22-24` chưa extend theme radius → `cn(buttonVariants(), "rounded-xl")` giữ cả hai class. **Sửa:** `extendTailwindMerge({ extend: { theme: { radius: ["pill"] } } })` + test.

### [MINOR] m4 — Variant `chip` của Button không có bảo đảm contrast, chưa có chỗ dùng
`button.tsx:16-17` `text-on-dark` trên nền trong suốt. Ghi rõ chỉ dùng trong `.theme-dark-block` hoặc trên scrim ≥ `--color-overlay`, hoặc test khi task sau dùng.

### [MINOR] m5 — Panel 2px cũ cạnh phong cách mới (ngoài scope)
`LeadFormSlot.tsx:25`, `SaleContactBox.tsx:32`, `OfferBox.tsx:44`, `JobDetail.tsx:70,86` vẫn `rounded-sm`. Có thể xử lý trong P2–P4.

## Kiểm khác: không có vấn đề
Bỏ in hoa đủ cho heading trong scope; bỏ watermark sạch; API Button/Badge tương thích ngược; radius thẻ chỉ đổi class; không đụng file cấm; không lấn sang header (task 02); không màu raw ngoài token.

## Verdict: FAIL
Builder sửa M1, M2; sửa kèm m1, m2, m3 (rẻ).
