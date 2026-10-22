# Spec Update — 2026-10-22 button-variants-merge-and-empty-upload

**spec_version:** 1.49.0 → 1.49.1 (PATCH — ghi as-built, không đổi requirement / intent)
**Trigger:** bug-fix (BL-057, change-request class BUG — follow-up BL-056 n-1 / n-2)
**Work item:** `bug/button-variants-merge-and-empty-upload` phase-1-task-01 — Reviewer round 1 STRICT PASS (`.context/review-reports/bug-button-variants-merge-and-empty-upload-phase-1-task-01-round-1-review.md`)
**Change doc:** `spec/changes/2026-10-22-button-variants-merge-and-empty-upload.md` · task `tasks/bug-button-variants-merge-and-empty-upload/phase-1-task-01.md`

## Lý do
Hai việc còn mở sau review BL-056 (`bug-listing-detail-design-match` round 2, n-1 + n-2):
- **n-1 (lỗi hiển thị thật):** `rich-text-lead.ts` coi mọi node `upload` là nội dung thêm, trong khi `RichText` không render upload
  mà media đã xoá / chưa populate / không có `url` / không phải ảnh → Tổng quan (`DetailOverviewIntro`, 3 màn chi tiết) hiện nút
  "Xem thêm" mở ra khoảng trống.
- **n-2 (chặn tái phát):** `buttonVariants` (`cva`) chỉ nối chuỗi nên base `border-transparent` đi cùng class viền của biến thể
  `secondary` / `outline` / `chip`; gọi trần (không bọc `cn()`) có thể ra viền vô hình — root cause thật của A5 BL-056 (đã vá cục bộ bằng `cn()`).

## Requirements
- **THÊM / SỬA / XOÁ:** không. F2 / F3 / F4, khối BL-052 và mục "As-built khung chi tiết (bug-fix BL-056)" giữ nguyên ý định.
- **Làm rõ as-built** (SPECIFICATIONS.md, mục mới "As-built bug-fix BL-057" ngay sau mục BL-056):
  1. Nút "Xem thêm / Thu gọn" ở Tổng quan chỉ hiện khi phần còn lại có nội dung **hiển thị được**: node `upload` chỉ tính khi
     `relationTo === "media"`, media đã populate và có `url`, `mimeType` trống hoặc `image/*` — đúng một quy tắc với trình render rich text
     (helper dùng chung `src/lib/content/rich-text-upload.ts` › `renderableUploadImage`, dùng ở `RichText` và `rich-text-lead`).
  2. `buttonVariants(...)` trả về chuỗi class **đã gộp Tailwind** (`cn(cva(...))`): gọi trần cho `secondary` / `outline` / `chip` không còn
     `border-transparent` → viền hiện đúng màu biến thể; `primary` giữ `border-transparent`; `Button` và mọi chỗ `cn(buttonVariants(...), extra)`
     hiển thị không đổi (`extra` vẫn ghi đè được).

## Ảnh hưởng
- Module: `src/components/ui/button.tsx` (shared — mọi nút/link public dùng `buttonVariants`: Button, header CTA, menu mobile, FilterPanel,
  ListingHero chips, tuyển dụng, thẻ nổi bật, DetailShareButton, LeadForm), helper mới `src/lib/content/rich-text-upload.ts`,
  `src/components/content/RichText.tsx` (mọi rich text public), `src/lib/content/rich-text-lead.ts` → `DetailOverviewIntro` 3 màn chi tiết.
- Không đổi schema / API / quyền / i18n, không migration. Doc: `.context/design-spec.md:245` thêm câu as-built BL-057.
- Test: `src/components/ui/button.test.tsx` (+6), `src/lib/content/rich-text-lead.test.ts` (+7, fixture upload → media hợp lệ),
  `src/components/detail/DetailOverviewIntro.test.tsx` (fixture); `RichText.test.tsx` upload test giữ nguyên PASS.
- Scope: `spec/test-scope/current.json` v65.

## Verify
- `pnpm typecheck` PASS · lint 7 file scope 0 lỗi (`pnpm lint` exit 1 chỉ do `.local-seed/…` git-ignored, có sẵn) ·
  `pnpm test` 418/418 file, 4380/4380 PASS · `pnpm build` PASS.
- Chưa kiểm bằng trình duyệt (n-1 cần xoá media trong DB; n-2 đã đo `border-top-color` ở BL-056 r1) — bên test nên kiểm tay.

## Residual
- 2 MINOR từ review (không chặn): chưa có test cấp component `DetailOverviewIntro` cho case upload rỗng; type node cục bộ ở
  `RichText.tsx` và `rich-text-lead.ts` lặp lại `relationTo?` / `value?`.
