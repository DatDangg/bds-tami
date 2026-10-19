# Spec Update — 2026-10-19 header-logo-gold

**spec_version:** 1.12.0 → 1.12.1 (PATCH — làm rõ logo mặc định của "Khung trang" cho khớp `docs/DESIGN.md` § Logo; không thêm/xoá requirement, không đổi schema/API/quyền)

**Trigger:** feature-update (Change Request MODIFY, BL-018) — change doc `spec/changes/2026-10-19-header-logo-gold.md` (archive → `spec/changes/archive/2026-10-19-header-logo-gold.md`), task `tasks/feature-header-logo-gold/phase-1-task-01.md`

**Nguồn:** user thấy logo đen ở header nền sáng không đẹp, muốn logo vàng. `docs/DESIGN.md` § Logo vốn ghi `tami-logo-gold.png` là logo chính cho header nền sáng, nhưng `BrandLogo.tsx` dùng `/brand/tami-logo-dark.png` cho `tone="on-light"` → lệch thiết kế.

**Requirements:**
- SỬA (làm rõ) **SPECIFICATIONS.md "Khung trang"**: khi CMS chưa có `site-settings.logo` / `logoDark` → logo mặc định là bản **vàng** `/brand/tami-logo-gold.png` cho nền sáng (header đặc: sticky khi cuộn + trang không có hero), bản **trắng** cho nền tối (header trong suốt trên hero, footer, menu toàn màn hình). Logo CMS vẫn ưu tiên.
- Bản đen `/brand/tami-logo-dark.png` chỉ còn cho in ấn / dự phòng (không xoá file).
- Liên quan (không đổi chữ): **NFR-07** (WCAG) — xem ghi chú tương phản.

**Tương phản (user chấp nhận):** logo vàng trên #FFFFFF trung vị 1.50:1 (1.04–2.01:1), trên #F7F5F4 1.38:1 — không đạt 3:1 non-text (WCAG 1.4.11). User chọn **phương án B** (2026-10-19, "dùng vàng thử đi"): chấp nhận ~1.5:1 (logo/logotype được WCAG miễn trừ). Không thêm test contrast cho logo.

**Intent docs đã sửa (change-request):** `docs/DESIGN.md` § Logo (vàng = header nền sáng; đen chỉ in ấn/dự phòng) + bảng Header ("logo vàng"); `.context/design-spec.md` §2.1 (biến thể Đặc logo vàng, dòng Logo mặc định).

**Code dự kiến (builder chốt):**
- `src/components/layout/BrandLogo.tsx` — `STATIC_LOGO["on-light"].url` → `/brand/tami-logo-gold.png` (giữ 800×416, không CLS)
- `src/components/layout/Header.test.tsx` — cập nhật đường dẫn tĩnh; khẳng định footer/menu (on-dark) vẫn trắng

**Schema / API / Access:** không đổi. **Migration:** none.

**Ảnh hưởng:**
- Header mọi trang công khai VI/EN ở trạng thái nền sáng (sticky khi cuộn, trang không có hero).
- Retest: header trong suốt trên hero / footer / menu toàn màn hình giữ logo trắng; `site-settings.logo` có → dùng logo CMS; kích thước logo không đổi (không CLS).

**Docs as-built dự kiến (builder):** `docs/ARCHITECTURE.md` chỉ khi có nhắc logo đen mặc định; `docs/API_SPEC.md` / `docs/ERD.md`: no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 14
