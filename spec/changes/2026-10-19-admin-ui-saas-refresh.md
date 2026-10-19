---
id: admin-ui-saas-refresh
type: feature
status: in_progress
created: 2026-10-19
backlog: BL-015
---

# Làm lại giao diện admin (Payload) theo phong cách gọn, hiện đại kiểu SaaS

## Yêu cầu
MODIFY (UI admin). User thấy admin "trông xấu" ở **mọi khu vực** — muốn chỉnh lại UI theo phong cách **gọn, hiện đại kiểu SaaS**:
trung tính, nhiều khoảng trắng, màu nhấn TAMI (`#8C6733`) dùng tiết chế.

Hiện trạng: admin là Payload mặc định, chỉ mới ghi đè màu nhấn (palette `success`), font Montserrat, nút primary và
logo sáng/tối (`src/app/(payload)/custom.scss`). Chưa tuỳ biến bố cục, dashboard, sidebar, bảng, form.

Phạm vi (user chọn "all"):
1. **Dashboard** — thay lưới card collection mặc định: thống kê nhanh (vd lead mới / chưa phân công, hồ sơ ứng tuyển mới), lối tắt tạo nội dung, nhóm theo nghiệp vụ.
2. **Sidebar / điều hướng** — nhóm menu theo nghiệp vụ (`admin.group`), thứ tự hợp lý, nhãn tiếng Việt, icon nếu phù hợp.
3. **Danh sách (bảng)** — cột mặc định hợp lý (`defaultColumns`), thumbnail ảnh, badge trạng thái, mật độ dòng.
4. **Form sửa bài** — chia tab/nhóm trường, đẩy trường phụ sang sidebar phải, nhãn + mô tả trường tiếng Việt.

## Acceptance
- [ ] Style chung (màu nền/viền trung tính, bo góc, bóng, khoảng cách, typography) nhất quán sáng + tối; giữ màu nhấn TAMI, mọi cặp chữ/nền đạt WCAG AA (≥ 4.5:1 chữ, ≥ 3:1 UI)
- [ ] Dashboard tuỳ biến có thống kê nhanh + lối tắt, tôn trọng phân quyền (role không có quyền collection thì không thấy số liệu/lối tắt của nó)
- [ ] Sidebar nhóm theo nghiệp vụ, nhãn tiếng Việt
- [ ] **Việt hoá toàn bộ nhãn admin**: hiện UI Payload đã ở `vi` (`payload.config.ts` i18n) nhưng hầu hết field/collection/global thiếu `label` / `labels: { singular, plural }` → Payload tự sinh từ tên field/slug ra tiếng Anh ("Site Name", "Property Posts"…). Bổ sung `label` cho mọi field, `labels` cho mọi collection, `label` cho global, nhãn option của select, nhãn hàng array (`admin.components.RowLabel` hoặc `labels`) — kể cả collection plugin (redirects) và Media/PrivateFiles. Có test quét config: không field hiển thị nào thiếu label
- [ ] Màn danh sách các collection chính có cột mặc định + badge trạng thái + thumbnail (nơi có ảnh)
- [ ] Form các collection chính chia tab/nhóm, trường phụ ở sidebar
- [ ] Không đổi schema/DB, không đổi access control, không đổi API — chỉ cấu hình `admin.*` + CSS + component admin
- [ ] Responsive admin không vỡ ở mobile/tablet
- [ ] Ảnh chụp trước/sau các màn chính để user duyệt

## Ghi chú
- Cần chốt design (tokens + mock vài màn chính) với user **trước** khi builder code — qua bước design của change-request.
- Không đụng site public (`src/app/(frontend)`).
- Lưu ý: label/group/tabs là cấu hình `admin` của field — nếu bọc field vào `tabs`/`group` có tên sẽ đổi cấu trúc dữ liệu → chỉ dùng tab **không tên** / `row` / `collapsible` để không sinh migration.
- Có thể tách nhiều task (style chung → sidebar → dashboard → list → form).
