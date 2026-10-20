# Spec Update — 2026-10-20 single-font-montserrat (một font Montserrat cho toàn site công khai)

**spec_version:** 1.30.0 → 1.31.0 (MINOR — đổi intent giao diện: bỏ serif thương hiệu EB Garamond, phân cấp chữ bằng cỡ + độ đậm Montserrat; không đổi schema, API, quyền, dữ liệu CMS, URL, metadata, JSON-LD)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-036**, MODIFY UI). Change doc `spec/changes/2026-10-20-single-font-montserrat.md` (archive ở close-out → `spec/changes/archive/2026-10-20-single-font-montserrat.md`). Task `tasks/feature-single-font-montserrat/phase-1-task-01.md`. Review: `.context/review-reports/feature-single-font-montserrat-phase-1-task-01-round-2-review.md` (STRICT, PASS; round 1 tại `...-round-1-review.md`).

**Quyết định (user 2026-10-20 "sao font chữ mỗi chỗ 1 cái thế" → "chung 1 loại thôi chứ nhỉ", chọn Montserrat; đổi intent design-spec đã duyệt trong chat):** D1 chỉ tải Montserrat (`next/font`, subset latin + vietnamese, weight 400/500/600) — bỏ EB Garamond khỏi `src/lib/fonts.ts` và biến font ở `PublicDocument`. D2 giữ token `--font-display` nhưng trỏ về Montserrat (không đổi hàng loạt class `font-display` → `font-sans`). D3 thang chữ mới hợp sans: display 52→28px, h1 48→26, h2 38→24, h2-sm 26→22, h3 22→20, h4 18; weight mặc định display/h1/h2/h2-sm/h3 500, h4/price 600 qua `--text-*--font-weight` (chỉ weight đã nạp, không bold giả); line-height 1.15/1.15/1.2/1.25/1.3; letter-spacing −0.01em cho display/h1/h2. D4 h1 hero chi tiết dự án bỏ `font-normal` (nhận weight token). D5 sentence case (BL-020) giữ, không thêm `uppercase`. D6 admin (đã Montserrat), email, trang lỗi toàn cục không đổi.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (font + thang chữ) | close-out BL-036 (commit chứa file này) | Sửa: `src/lib/fonts.ts`, `src/components/layout/PublicDocument.tsx`, `src/app/(frontend)/globals.css`, `src/components/projects/ProjectHero.tsx`. Test: `src/lib/fonts.test.ts`, `src/components/projects/project-detail.test.tsx`. Doc: `SPECIFICATIONS.md` (Giao diện, bảng stack UI, S03 h1, PostCard), `.context/design-spec.md`, `docs/DESIGN.md`, `skills/react-nodejs/design-tokens.md` | `.context/review-reports/feature-single-font-montserrat-phase-1-task-01-round-2-review.md` (STRICT PASS) |

## Requirements (SPECIFICATIONS.md)

- **Giao diện (SỬA):** một font duy nhất Montserrat cho site công khai; phân cấp tiêu đề bằng cỡ + độ đậm 500/600; bỏ EB Garamond.
- **Bảng stack — UI (SỬA):** "font Montserrat duy nhất (`next/font`, subset `vietnamese`; bỏ EB Garamond — BL-036)".
- **F2 / S03 bố cục chi tiết dự án (SỬA):** h1 hero viết thường (Montserrat), bỏ "serif weight 400".
- **F4 PostCard (SỬA):** tiêu đề h4 Montserrat thay serif.
- Design as-built: `.context/design-spec.md` § typography + bảng kiểm, `docs/DESIGN.md`, `skills/react-nodejs/design-tokens.md`.

## Schema / Migration / API

Không. Migration: none. Không đổi i18n key.

## Hành vi bị thay thế

| Trước | Sau (BL-036) |
|---|---|
| Tiêu đề, giá, thông số, địa chỉ, hotline, menu mobile, "+N" gallery, tiêu đề accordion… dùng EB Garamond (serif); phần còn lại Montserrat | Mọi chữ trang công khai dùng Montserrat |
| Tải 2 font (EB Garamond + Montserrat) | Tải 1 font (Montserrat 400/500/600) — bớt tải, nhẹ LCP |
| Thang display 52 / h1 48 / h2 38 / h2-sm 26 / h3 22px, serif weight 400 | display 28 / h1 26 / h2 24 / h2-sm 22 / h3 20 / h4 18px; weight 500 (display→h3), 600 (h4, price) |
| h1 hero chi tiết dự án `font-normal` | h1 nhận weight token (500) |

## Số đo / verify

- Verify (lệnh từ `.context/project-config.md`, reviewer STRICT round 2): `pnpm vitest run src/lib src/components` 1919/1919 PASS, `pnpm typecheck` PASS, `pnpm lint` 0 error.
- Chưa kiểm trên trình duyệt thật (390 / 1280).

## Ảnh hưởng test

- Direct: mọi heading / giá / thông số trang công khai đổi font sang Montserrat + cỡ + độ đậm mới; không còn request tải EB Garamond; tiếng Việt đủ dấu.
- Dependents: mọi trang `(frontend)` VI/EN — trang chủ, danh sách + chi tiết dự án / cho thuê / tin BĐS / tin tức / tuyển dụng, liên hệ, pháp lý, menu mobile, footer.
- Regression: không tràn chữ / xuống dòng bất thường ở 390 và 1280; dấu chồng (Ầ/Ỗ/Ẫ) không bị xén ở tiêu đề thẻ `line-clamp-2`; sentence case giữ; admin / email / trang lỗi toàn cục không đổi.
- Residual: chưa kiểm trực quan trình duyệt thật — risk medium (đổi typography toàn site).
