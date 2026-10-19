# Spec Update — 2026-10-19 desktop-header-no-menu-button

**spec_version:** 1.12.1 → 1.13.0 (MINOR — đổi hành vi khung trang đã chốt ở BL-001: nút Menu không còn ở mọi breakpoint; không đổi schema/API/quyền)

**Trigger:** feature-update (Change Request MODIFY, BL-019) — change doc `spec/changes/2026-10-19-desktop-header-no-menu-button.md` (archive → `spec/changes/archive/2026-10-19-desktop-header-no-menu-button.md`), task `tasks/feature-desktop-header-no-menu-button/phase-1-task-01.md`, commit `cdd9ef4`

**Nguồn:** ≥ xl header đã có menu ngang 7 mục nhưng vẫn hiện nút MENU mở menu toàn màn hình → trùng lặp. vinhomes.vn ở 1440px (kiểm 2026-10-19) không có nút Menu trên desktop; `docs/DESIGN.md` mô tả nhầm bố cục mobile của họ thành bố cục chung → BL-001 chốt "nút Menu ở mọi breakpoint".

**Requirements:**
- SỬA **SPECIFICATIONS.md "Khung trang"**:
  - ≥ xl: header một hàng logo trái · menu ngang giữa (dropdown mục con) · phải: tìm kiếm, VI|EN, nút CTA (nếu bật). **Không có nút Menu** (không hiển thị, không nhận focus, không có trong cây a11y).
  - < xl: giữ nút Menu mở menu toàn màn hình (accordion menu con, hotline, mạng xã hội) như cũ.
  - Menu toàn màn hình đang mở mà cửa sổ rộng lên ≥ xl → tự đóng, nhả khoá cuộn nền + bẫy focus.
- Intent docs đã sửa trong commit (change-request): `docs/DESIGN.md` (dòng Header, Menu toàn màn hình), `.context/design-spec.md` §2.1 (bố cục < xl / ≥ xl) + §2.2.

**Code (diff thật `cdd9ef4`):**
- `src/components/layout/MobileMenu.tsx` — trigger `xl:hidden`, bỏ class nhãn xl/2xl thừa; `useMediaQuery("(min-width: 1280px)")` (tái dùng `src/components/home/use-environment.ts`) → đang mở ở ≥ xl thì `setOpen(false)` lúc render.
- `src/components/layout/Header.tsx` — chỉ JSDoc/comment (thứ tự Tab ≥ xl: logo, menu ngang, tìm, ngôn ngữ, CTA).
- `src/components/layout/Header.test.tsx` — trigger có `xl:hidden`; test mới: rộng lên ≥ xl thì menu đóng + nhả `data-scroll-locked`.

**Schema / API / Access:** không đổi. **Migration:** none.

**Ảnh hưởng:**
- Header mọi trang công khai VI/EN ở ≥ 1280px (không còn nút Menu, thứ tự Tab đổi).
- Retest: < xl nút Menu + menu toàn màn hình; resize khi menu mở; header 1 hàng không tràn ở 1280px VI/EN.

**Review:** NORMAL PASS round 1 — `.context/review-reports/feature-desktop-header-no-menu-button-phase-1-task-01-round-1-review.md` (MINOR 2 chấp nhận: resize lên ≥ xl khi menu mở → focus về `body`).

**Residual:** chưa đo trực quan hàng 1280px VI/EN trên trình duyệt thật.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 15
