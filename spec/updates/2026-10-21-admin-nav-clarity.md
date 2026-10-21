# Spec Update — 2026-10-21 admin-nav-clarity (sidebar phân cấp rõ + nhóm Nâng cao + Tổng quan thẻ thao tác nhanh)

**spec_version:** 1.35.0 → 1.36.0 (MINOR — đổi hành vi điều hướng/Tổng quan admin: nhóm menu mới "Nâng cao", ẩn 2 mục khỏi menu, bố cục Tổng quan mới; không đổi schema, slug, access control, endpoint)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-041**, MODIFY). Change doc `spec/changes/2026-10-20-admin-nav-clarity.md` (archive ở close-out → `spec/changes/archive/2026-10-20-admin-nav-clarity.md`). Task `tasks/feature-admin-nav-clarity/phase-1-task-01.md` (sidebar + Nâng cao + ẩn mục + Xem website, commit `f3d5291`) · `tasks/feature-admin-nav-clarity/phase-1-task-02.md` (Tổng quan + banner dịch lỗi). Review: T01 STRICT r1 FAIL (M1 vạch active ẩn ở 375/768/1024, M2 toggle 36px) → r2 PASS; T02 STRICT r1 PASS (4 MINOR). Phase review: `.context/review-reports/spec-validation-feature-admin-nav-clarity-phase-1.md` (code 10/10; 1 PARTIAL doc reconcile design doc BL-015 → xử lý ở close-out).

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (ĐỔI):**
  - Menu trái: từ "7 nhóm" → thêm nhóm thứ 8 **"Nâng cao"**.
  - Thêm câu "**Điều hướng rõ (BL-041)**": tiêu đề nhóm đậm/viết hoa, mục con thụt lề, vạch/khoảng ngăn nhóm, mở/đóng dễ nhận; mục đang chọn nền nhấn nhạt + vạch TAMI trái + chữ đậm; hover/focus rõ; AA sáng/tối; 375px dùng được. `private-files` (Tệp CV ứng viên) và `lead-activities` (Lịch sử chăm sóc) `admin.hidden` — không hiện menu, CV tải ở Hồ sơ ứng tuyển, lịch sử chăm sóc trong form Lead (drawer); không xoá collection/đổi access/API. Nhóm "Nâng cao" cuối menu, mặc định thu gọn: Tỉnh/thành · Phường/xã · Nhật ký thao tác · Lượt bấm liên hệ · Thống kê liên hệ theo ngày · Chi phí dịch tự động. Header admin có nút "Xem website" (tab mới, `NEXT_PUBLIC_SITE_URL`).
  - Thêm câu "**Tổng quan (BL-041)**": hàng thẻ thao tác nhanh thay "＋ Tạo mới ▾" (Đăng tin cho thuê mới · Phân công lead (N chưa giao) chỉ admin · Viết tin tức; loại khác qua "Tạo loại khác"); hàng "Sửa website" (Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung) chỉ admin; bỏ khối "Mục quản lý"; cảnh báo dịch lỗi mức nhẹ (vàng/viền, không `role=alert`) + câu trấn an + link. Bỏ "lối tắt tạo nội dung" khỏi câu Tổng quan cũ.

## Hành vi bị thay thế

| Trước | Sau (BL-041) |
|---|---|
| Sidebar 7 nhóm; tiêu đề nhóm nhỏ xám, mục con to đậm; mục chọn chỉ nền be rất nhạt | Tiêu đề nhóm 12px/700 viết hoa màu chữ chính; mục con thụt lề + viền trái; vạch ngăn nhóm; mục chọn nền `--admin-accent-soft` + vạch TAMI 3px trái + chữ đậm |
| Tệp CV ứng viên, Lịch sử chăm sóc hiện trong menu | Ẩn khỏi menu; route `/admin/collections/private-files` và `/admin/collections/lead-activities` (list/doc) → 404; join "Lịch sử chăm sóc" trong form Lead + Tải CV ở Hồ sơ ứng tuyển vẫn chạy |
| Tỉnh/Phường trong "Dữ liệu nền"; audit/lượt bấm/thống kê/chi phí dịch trong "Hệ thống" | Dồn vào nhóm "Nâng cao" cuối menu, thu gọn mặc định (lần đầu, khi chưa có preference nav) |
| Không có lối ra website công khai | Nút "Xem website" trên thanh đầu admin, mở tab mới |
| Tổng quan: nút "＋ Tạo mới ▾" nhỏ ở góc | Hàng thẻ thao tác nhanh lớn đầu trang + menu phụ "Tạo loại khác" |
| Lối tắt Trang chủ/Menu/Chân trang/Cấu hình chung chỉ ở thẻ "Website" cuối trang (khối "Mục quản lý") | Hàng "Sửa website" đầu trang (chỉ admin); khối "Mục quản lý" bỏ hẳn |
| Banner dịch lỗi đỏ, chiếm cả chiều ngang (`role=alert`) | Cảnh báo nhẹ vàng/viền (`role=status`), "N bài chưa dịch được sang tiếng Anh — bản tiếng Việt vẫn hiển thị bình thường" + link |

Không đổi: schema/DB, access control, endpoint, quyền xem từng mục (bảng chỉ-admin vẫn chỉ admin thấy), số đếm thẻ Tổng quan.

## Code (as-built)

- T01 (`f3d5291`): `src/components/admin/admin-groups.ts` (+ test) — nhóm "Nâng cao"; `src/components/admin/NavAdvancedCollapse.tsx` (+ test, provider đăng ký ở `src/payload.config.ts`); `src/components/admin/SiteLink.tsx` (+ test); `src/collections/LeadActivities.ts`, `src/collections/PrivateFiles.ts` (`admin.hidden`) + `src/collections/admin-hidden.test.ts`; `src/components/admin/styles/_surfaces.scss`, `_controls.scss`; `src/app/(payload)/admin/importMap.js`; `docs/ARCHITECTURE.md`.
- T02 (working tree): `src/components/admin/dashboard/QuickActions.tsx`, `WebsiteShortcuts.tsx` (mới), `DashboardHeader.tsx`, `DashboardView.tsx`, `dashboard-data.ts` (+ `dashboard-actions.test.ts`), xoá `NavGroupCards.tsx`; `src/components/admin/TranslationFailedBanner.tsx` (+ test); `src/components/admin/styles/_dashboard.scss`, `_dashboard-lists.scss`, `_surfaces.scss`; `tests/integration/admin-dashboard.test.ts`; `src/payload-types.ts`; doc reconcile `docs/specs/2026-10-19-admin-ui-saas-design.md`.

## Ảnh hưởng

- **Trực tiếp:** sidebar mọi màn admin, thanh đầu admin (Xem website), màn Tổng quan (admin + sale).
- **Phụ thuộc:** form Lead → join "Lịch sử chăm sóc" (collection ẩn, drawer); Hồ sơ ứng tuyển → Tải CV (`private-files` ẩn); route list/doc của 2 collection ẩn nay 404.
- **Hồi quy:** Tổng quan role sale vs admin (thẻ/lối tắt theo quyền), preference nav (mở/đóng nhóm lưu lại), 375px.
- Không migration, không đổi quyền, không endpoint mới.
