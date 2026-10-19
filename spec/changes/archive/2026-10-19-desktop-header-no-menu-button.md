---
id: desktop-header-no-menu-button
type: feature
status: done
created: 2026-10-19
---

# Header desktop bỏ nút Menu (chỉ menu ngang, như vinhomes.vn)

## Yêu cầu
Ở ≥ xl (1280px) header đã có menu ngang 7 mục nhưng vẫn hiện nút **MENU** mở menu toàn màn hình → trùng lặp, thừa.
Đã kiểm tra vinhomes.vn ở 1440px (2026-10-19): desktop **không có nút Menu** — logo trái · menu ngang · VI/EN ·
tìm kiếm · tài khoản. Nút Menu chỉ là bố cục mobile của họ.

Gốc lỗi: `docs/DESIGN.md:235` mô tả header Vinhomes "logo ở giữa … nút menu" (thực ra là bố cục mobile) như bố cục
chung → BL-001 / `.context/design-spec.md` §2.1 chốt "nút Menu có ở mọi breakpoint".

## Acceptance (bắt buộc)
- [ ] ≥ xl: không hiện nút Menu; header gồm logo · menu ngang (dropdown mục con) · tìm kiếm · VI|EN · CTA (nếu bật).
- [ ] < xl: giữ nút Menu mở menu toàn màn hình như hiện tại (accordion mục con, hotline, mạng xã hội).
- [ ] Nếu đang mở menu toàn màn hình rồi resize lên ≥ xl thì menu đóng/không kẹt khoá cuộn nền.
- [ ] Thứ tự Tab ở ≥ xl hợp lệ (không còn nút ẩn nhận focus); header 1 hàng không tràn ở 1280px (VI và EN).
- [ ] Cập nhật `docs/DESIGN.md` (dòng Header + Menu toàn màn hình) và `.context/design-spec.md` §2.1/§2.2: tách rõ bố cục desktop (menu ngang, không nút Menu) và mobile (logo giữa, nút Menu).

## Ghi chú
File liên quan: `src/components/layout/Header.tsx` (comment dòng ~36 "Nút Menu có ở mọi breakpoint"), `src/components/layout/MobileMenu.tsx`.
Sửa thay đổi đã chốt ở BL-001 → MODIFY.
