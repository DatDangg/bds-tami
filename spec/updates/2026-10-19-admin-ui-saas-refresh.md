# Spec Update — 2026-10-19 admin-ui-saas-refresh

**spec_version:** 1.10.0 → 1.11.0 (MINOR — thêm requirement FR-ADM-19 về giao diện quản trị; không đổi API/schema/access)

**Trigger:** feature-update (Change Request MODIFY, BL-015) — change doc `spec/changes/2026-10-19-admin-ui-saas-refresh.md`, design `docs/specs/2026-10-19-admin-ui-saas-design.md` (§7 Đã chốt, §9 plan), task `tasks/feature-admin-ui-saas-refresh/phase-1-task-01..06.md`

**Nguồn:** user thấy admin "trông xấu" ở mọi khu vực — admin đang là Payload mặc định (chỉ ghi đè màu nhấn, font, nút primary, logo trong `src/app/(payload)/custom.scss`); hầu hết collection/field thiếu `label`/`labels` nên hiện nhãn tiếng Anh tự sinh.

**Requirements:**
- THÊM **FR-ADM-19 — Giao diện quản trị** vào **F10** trong `SPECIFICATIONS.md`:
  - Style: nền/viền trung tính ấm, màu nhấn TAMI `#8C6733` (tối `#E0BF89`) chỉ cho nút chính/link/focus/mục đang chọn; chữ/nền ≥ 4.5:1, biên điều khiển ≥ 3:1 ở sáng + tối (test contrast token tự động); select admin cùng một style.
  - Sidebar: 7 nhóm nghiệp vụ tiếng Việt (Khách hàng · Nội dung · Tuyển dụng · Thư viện · Danh mục · Website · Hệ thống), không icon, quyền xem từng mục giữ nguyên.
  - Nhãn: toàn bộ nhãn admin tiếng Việt — mọi collection có `labels`, mọi field hiển thị có `label`, hàng array có nhãn; test quét config chặn thiếu nhãn.
  - Tổng quan (dashboard) theo quyền: thẻ đếm nhanh (admin: lead mới, lead chưa phân công, hồ sơ ứng tuyển mới, nội dung đang hiển thị; sale: lead mới được giao, lead đang xử lý, bản nháp của mình, tin đang đăng), lối tắt tạo nội dung, lead mới nhất + bản sửa gần đây; đếm bằng Local API `overrideAccess: false`; không quyền đọc/tạo → không hiện thẻ/lối tắt.
  - Danh sách: badge trạng thái có chữ, thumbnail 40px (dự án/cho thuê = ảnh đầu `gallery`, tin BĐS/tin tức = `cover`), dòng 48px.
  - Form: tab không tên / `row` / `collapsible`, trường phụ ở sidebar phải.
  - Ràng buộc: không đổi schema/DB, access control, API (không sinh migration); responsive không vỡ ở 390px.
- Liên quan (không đổi chữ): **FR-ADM-14** (dashboard — biểu đồ, lượt bấm, chi phí dịch cắm vào khung Tổng quan sau, L13-T01), **NFR-07** (responsive, WCAG).

**Code dự kiến (builder chốt):**
- `src/app/(payload)/custom.scss` (tokens + style chung, select)
- `src/components/admin/**` (Dashboard, Cell badge/thumbnail, RowLabel…)
- `src/collections/**`, `src/globals/**`, `src/fields/**` (`labels`/`label`, `admin.group`, `defaultColumns`, tab không tên/row/collapsible, `position: 'sidebar'`)
- `src/payload.config.ts` (thứ tự collections/globals, `admin.components`), `src/app/(payload)/admin/importMap.js`
- Test: contrast token, quét nhãn config, dashboard theo quyền, cell, kiểm không đổi schema (không migration)

**Schema/API/Access:** không đổi.

**Ảnh hưởng:**
- Toàn bộ `/admin`: style sáng/tối, sidebar 7 nhóm, nhãn tiếng Việt, dashboard theo quyền (admin vs sale), list badge/thumbnail, form chia tab.
- Retest: lưu/đọc nội dung mọi collection + global qua admin (đường dẫn dữ liệu không đổi), quyền sale ở admin (menu, dashboard, list), nút dịch (translation), xuất Excel lead, tải CV, site public không đổi.

**Docs đã cập nhật:** `SPECIFICATIONS.md` F10 (FR-ADM-19) + version. As-built (`docs/API_SPEC.md`/`docs/ERD.md`): no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 12
