---
id: header-nav-gold-underline
type: bug
status: done
created: 2026-10-27
closed: 2026-10-27
---

# Header: mục menu đang xem + hover dùng gạch chân vàng (thay viên thuốc xám)

## Yêu cầu
User 2026-10-27 (ảnh menu ngang header ≥ xl: "TRANG CHỦ" đang xem có nền xám bo tròn): "header ban đầu đang là gạch chân vàng mà sao thành như này" → "gạch chân vàng vừa để cho active vừa để là hover, nhưng chỉ mỗi header thôi".

## Bối cảnh / tái hiện (bug)
- Màn/route/role: header công khai, menu ngang ≥ xl, mọi trang, VI/EN.
- Actual: mục đang xem = viên thuốc nền `--color-text` 10%, hover = nền 6% (`src/components/layout/DesktopNav.tsx:65`).
- Nguồn: BL-074 (commit 82979e4, 24/10) bỏ gạch chân toàn site rồi đổi menu header sang viên thuốc. Ý user khi đó là bỏ gạch chân ở các link/nút khác — KHÔNG áp cho menu header.

## Acceptance (bắt buộc)
- [ ] Menu ngang header (`DesktopNav`): mục đang xem (`aria-current="page"`) có gạch chân **vàng** (token accent của TAMI, chọn biến thể đủ thấy trên nền kính sáng của header); hover mục khác cũng hiện gạch chân vàng. Bỏ nền viên thuốc (cả hover lẫn active).
- [ ] CHỈ menu header. Các chỗ khác BL-074 đã bỏ gạch chân (link, nút, footer, bộ lọc, mục lục…) GIỮ NGUYÊN không gạch chân. Menu toàn màn hình (< xl) không đổi trừ khi cùng component.
- [ ] Mục đang xem phân biệt được không chỉ bằng màu (vạch là hình dạng — WCAG 1.4.1 OK); vạch vàng là thành phần phi chữ → cần ≥ 3:1 với nền header (WCAG 1.4.11), ghi tỉ lệ đo được. Focus-visible giữ nguyên. Hover có transition `--duration-fast`, tắt khi reduced motion.
- [ ] Khoảng cách các mục, chiều cao header, không tràn ở 1280/1440/1920; menu con (dropdown) vẫn mở đúng.
- [ ] Cập nhật `.context/design-spec.md` §2.1 "Mục đang xem" (as-built). Ảnh trước/sau 1280 + 1920.
