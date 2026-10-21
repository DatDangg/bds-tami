# Spec Update — 2026-10-21 admin-nav-dashboard-sitelink (mục "Tổng quan" đầu menu + "Xem website" không bị ô Ngôn ngữ đè)

**spec_version:** 1.43.0 → 1.43.1 (PATCH — bug-fix kèm làm rõ FR-ADM-19: ghi thành chữ hành vi vốn được kỳ vọng — dashboard có lối vào từ menu, nút trên header không chồng nhau; không thêm tính năng, không đổi schema/API/quyền. Theo `docs/SPEC_VERSIONING.md`: PATCH = làm rõ, không đổi behavior đã định.)

**BRD:** không đổi.

**Trigger:** bug-fix (Change Request **BL-050**, BUG). Change doc `spec/changes/2026-10-21-admin-nav-dashboard-sitelink.md`. Task `tasks/bug-admin-nav-dashboard-sitelink/phase-1-task-01.md`. Review: `.context/review-reports/bug-admin-nav-dashboard-sitelink-phase-1-task-01-round-1-review.md` (NORMAL, PASS r1; 4 MINOR không chặn).

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (SỬA, thêm 2 câu):**
  - Mục **"Tổng quan"** đứng đầu menu trái, trên các nhóm, dẫn về `/admin`, trạng thái đang chọn như các mục khác.
  - Nút "Xem website" và ô chọn ngôn ngữ nội dung không chồng nhau ở mọi bề rộng (cách ≥ 8px); mobile chỉ còn icon, vùng bấm 44px.

## Root cause (tóm tắt)

1. Payload `DefaultNav` chỉ render nhóm collection/global; project chưa khai `admin.components.beforeNavLinks` → dashboard tuỳ biến không có lối vào trên menu.
2. Payload 3.91 đặt ô Ngôn ngữ thật `position:absolute; right: base(4.5)` (90px) giả định `--gutter-h` mặc định 60px; project override `--gutter-h` 32/20/16px (BL-015) → ô thật lệch trái 33–45px so với ô giữ chỗ, đè đuôi chữ "Xem website" (đo: chồng 13px ở 1600, 8px ở 1000).

## Hành vi mới

| Trước | Sau (BL-050) |
|---|---|
| Menu trái không có mục dẫn về Tổng quan | "Tổng quan" đầu menu, vạch ngăn với nhóm đầu; ở `/admin` là mục đang chọn (không link chính nó) |
| Ô Ngôn ngữ đè "Xem website" 13px (1600) / 8px (1000) | Cách 20px (1600) / 37px (1000); ô thật trùng khít ô giữ chỗ (`right: calc(var(--gutter-h) + 25px)`) |

## Code (as-built)

- `src/components/admin/NavDashboardLink.tsx` (mới, + `NavDashboardLink.test.tsx`).
- `src/payload.config.ts` — `admin.components.beforeNavLinks`.
- `src/app/(payload)/admin/importMap.js` — regen (thêm NavDashboardLink).
- `src/components/admin/styles/_surfaces.scss` — `.tami-nav-dashboard` + `.app-header__localizer.localizer` (+ rtl).
- `src/components/admin/admin-mobile-overflow.test.ts` — assert SCSS.

## Ảnh hưởng

- **Trực tiếp:** menu trái admin (mục Tổng quan), header admin ("Xem website" + ô Ngôn ngữ).
- **Phụ thuộc:** mọi màn `/admin/**` đã đăng nhập (khung dùng chung).
- **Hồi quy:** active state nav (BL-041), nhóm "Nâng cao" thu gọn, header mobile 375 không tràn, chuyển ngôn ngữ nội dung qua ô Ngôn ngữ.
- Không migration, không đổi quyền, không endpoint mới. Doc: no doc impact (`docs/DESIGN.md` không có mục nav/header admin).
