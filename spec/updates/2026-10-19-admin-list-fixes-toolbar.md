# Spec Update — 2026-10-19 admin-list-fixes T6 (thanh công cụ danh sách admin)

**spec_version:** 1.15.0 → 1.15.1 (PATCH — làm rõ vị trí control danh sách admin trong FR-ADM-19; chỉ bố cục, không thêm requirement, không đổi schema/DB, API, quyền, dữ liệu)

**Trigger:** bug-fix (Change Request BL-021, task cuối T6 — #08). Change doc `spec/changes/archive/2026-10-19-admin-list-fixes.md` (archive, BL-021 done). Task `tasks/bug-admin-list-fixes/phase-1-task-06.md`. Delta T1–T5: `spec/updates/2026-10-19-admin-list-fixes.md` (1.15.0).

**Nguồn:** user báo #08 — "Xuất Excel" (Lead) và ô "Trạng thái dịch" lơ lửng trên đầu trang, lệch lề với tiêu đề / ô tìm kiếm / nút Cột–Bộ lọc, mỗi control một khối.

## Đã làm (T6)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| T6 (#08) | MODIFY (bố cục) | `c69f6e5` | "Xuất Excel" (`Leads.ts`) và "Trạng thái dịch" (`withContentDefaults`) chuyển slot `beforeList` (ngoài `Gutter`, trên tiêu đề) → `beforeListTable` (trong `Gutter`, ngay sau hàng tìm kiếm / Hiển thị cột / Bộ lọc, render cả khi 0 kết quả); lớp chung `.list-toolbar-item` (inline-flex, căn đáy, tự xuống dòng, `max-width: 100%`, nút ≥ 44px); `LeadExportButton` bỏ inline style; logic quyền/drawer/thùng rác/thông báo không đổi | NORMAL PASS r1 |

## Requirements

- LÀM RÕ **FR-ADM-19 / Danh sách admin**: nút "Xuất Excel" (Lead) và ô "Trạng thái dịch" (danh sách nội dung) nằm trong lề trang, ngay dưới hàng tìm kiếm / Hiển thị cột / Bộ lọc, cùng một hàng; hẹp thì tự xuống dòng, không tràn ngang ở 375px; vùng bấm ≥ 44px; lọc ra 0 kết quả vẫn thấy ô lọc dịch để bỏ lọc.

**Schema / Access / API:** không đổi. Không migration. `importMap.js` không đổi nội dung.

**Ảnh hưởng:**
- Admin: danh sách mọi collection bọc `withContentDefaults` (projects, rentals, property-posts, news, services, job-postings, pages, categories, developers…) — vị trí ô "Trạng thái dịch"; danh sách Leads — vị trí nút "Xuất Excel".
- SCSS admin toàn cục: thêm `.list-toolbar-item` (`_lists.scss`), bỏ `max-width`/`margin-bottom` riêng của `.translation-status-filter` (`_controls.scss`).
- Retest: sale không thấy nút xuất; thùng rác + list drawer vẫn ẩn nút; ô lọc dịch vẫn là `SelectInput` có `<label>` (BL-016); export/lọc dịch hoạt động như 1.15.0.

**Residual:** không collection nào có cả hai mục — "cùng hàng" chỉ kiểm bằng chèn tạm DOM; đáy nút lệch đáy ô select ~5px (wrapper field Payload); 768px chưa kiểm trực quan; phụ thuộc Payload 3.91 đặt `BeforeListTable` trong `Gutter` sau `ListControls` (test chỉ ghim key slot).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 18
