# Spec Update — 2026-10-22 listing-detail-design-match

**spec_version:** 1.46.1 → 1.46.2 (PATCH — ghi as-built, không đổi requirement / intent)
**Trigger:** bug-fix (BL-056, change-request class BUG)
**Work item:** `bug/listing-detail-design-match` phase-1-task-01 — Reviewer round 2 STRICT PASS (`.context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-2-review.md`)
**Change doc:** `spec/changes/2026-10-22-listing-detail-design-match.md` · task `tasks/bug-listing-detail-design-match/phase-1-task-01.md`

## Lý do
UI chi tiết + danh sách Dự án / Cho thuê / Tin BĐS (redesign BL-052) lệch ảnh design đã duyệt
(`docs/specs/listing-detail-redesign/detail-du-an.webp`, `list-du-an.webp`). Sửa A1–A5 + A8 (user chốt 2026-10-22);
A6 (breadcrumb hero), A7 (carousel tương tự) giữ nguyên; nhóm B (thiếu dữ liệu CMS) ngoài phạm vi.

## Requirements
- **THÊM / SỬA / XOÁ:** không. F2 / F3 / F4 và khối "Redesign danh sách + chi tiết … (BL-052)" giữ nguyên ý định.
- **Làm rõ as-built** (SPECIFICATIONS.md, khối BL-052, mục mới "As-built khung chi tiết (bug-fix BL-056)"):
  1. Thanh thông số nổi: ≥ xl giá trị 1 dòng (cắt `…` + `title`); < xl tối đa 2 dòng + `title`, không tràn ngang.
  2. Tổng quan (3 màn, `DetailOverviewIntro`): đoạn dẫn = tóm tắt (`summary` / `excerpt`) → không có thì đoạn văn đầu có chữ
     của rich text; phần còn lại trong `<details>` "Xem thêm / Thu gọn" ("Read more / Show less"), luôn có trong HTML;
     không có gì thêm → không nút.
  3. Tổng quan Dự án ≥ xl: lưới thông tin 2 cột + thẻ sản phẩm 3 cột (ô lẻ cuối kéo hết hàng); không sản phẩm → lưới rộng hết.
  4. Form lead cột liên hệ chi tiết dạng compact (icon + placeholder, nhãn `sr-only`, nút full-width "Nhận tư vấn ngay");
     `/lien-he`, `/tin-tuc` giữ dạng mặc định.
  5. Tiện ích không ảnh: danh sách rộng hết (sm 2 / lg 3 cột khi ≥ 2 mục).
  6. Thẻ nổi bật danh sách: "Nhận tư vấn" là nút outline.

## Ảnh hưởng
- Module: `src/components/detail/*` (dùng chung 3 màn chi tiết), `src/components/forms/FormField.tsx`,
  `src/components/leads/LeadForm.tsx` (cả `/lien-he`, `/tin-tuc`), `src/components/{projects,rentals,posts}/*` chi tiết + thẻ nổi bật,
  helper mới `src/lib/content/rich-text-lead.ts`, i18n `detailKit.overview.*`, `form.lead.submitNow`.
- Không đổi schema / API / quyền, không migration.
- Test: chi tiết Dự án / Cho thuê / Tin BĐS (VI/EN × 390/768/1440), 3 trang danh sách (thẻ nổi bật), regression form lead `/lien-he`, `/tin-tuc`.
- Scope: `spec/test-scope/current.json` v60.
