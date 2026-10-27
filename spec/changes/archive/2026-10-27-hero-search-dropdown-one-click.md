---
id: hero-search-dropdown-one-click
type: bug
status: done
created: 2026-10-27
---

# Trang chủ: mở dropdown khác chỉ cần 1 click (follow-up BL-083)

## Yêu cầu
Feedback user 2026-10-27 về fix BL-083 (commit cdfcdc2): hiện đang mở "Mức giá" mà bấm "Diện tích" thì lần 1 chỉ đóng Mức giá, phải bấm lần 2 mới mở Diện tích. User muốn: **bấm 1 lần vào chip khác → đóng dropdown đang mở VÀ mở luôn dropdown vừa bấm**.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/` (trang chủ), khu "Tùy chọn khác", Khách, mọi cỡ màn
- Bước: mở Mức giá → bấm chip Diện tích (1 lần).
- Expected: Mức giá đóng, Diện tích mở ngay; không bao giờ 2 danh sách cùng mở.
- Actual: Mức giá đóng, Diện tích không mở (cần bấm thêm).
- Nguyên nhân: fix BL-083 để card kế thừa `pointer-events: none` của Radix Select modal (`src/components/home/HeroSearch.tsx:185` `not-in-data-[scroll-locked]:pointer-events-auto`), nên click vào chip khác bị nuốt thành "click ngoài".

## Acceptance (bắt buộc)
- [ ] 1 click vào chip khác: đóng cái đang mở + mở cái vừa bấm; luôn tối đa 1 danh sách mở (vd: nâng state `open` lên `HeroSearch` / nhóm "Tùy chọn khác", `OptionSelect` nhận `open`/`onOpenChange` opt-in — consumer khác giữ nguyên).
- [ ] Click ra ngoài / Esc vẫn đóng; bàn phím vẫn dùng được; trước hydrate (select gốc) không đổi; slider hero vẫn nhận click ở vùng ngoài card khi không có dropdown mở.
- [ ] Test hành vi 1-click (fail với code hiện tại) + kiểm trình duyệt thật 1920 và 390.
