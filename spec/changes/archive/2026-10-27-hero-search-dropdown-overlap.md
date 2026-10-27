---
id: hero-search-dropdown-overlap
type: bug
status: done
created: 2026-10-27
---

# Trang chủ: dropdown "Tùy chọn khác" mở đồng thời, chồng lên nhau

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/` (trang chủ), VI, Khách, 1920 (sheet QA bug 8, Trung bình)
- Bước: khu tìm kiếm → "Tùy chọn khác" → mở Mức giá, rồi mở Diện tích / Loại căn hộ / Nội thất / Tiện ích.
- Expected: chỉ 1 danh sách mở; mở cái mới thì cái trước đóng; không che nội dung.
- Actual: nhiều listbox cùng `data-state=open`, chồng lấn (tái hiện trên staging 27/10: Mức giá + Diện tích cùng mở, rect 701–843 và 838–976).
- Code: `src/components/home/HeroSearch.tsx:227` → `OptionSelect` (`src/components/ui/option-select.tsx`, progressive, variant chip) → Radix Select (`src/components/ui/select.tsx`, position popper). Root cause CHƯA xác định — cần debug (vì sao Radix không đóng cái trước).

## Acceptance (bắt buộc)
- [ ] Mở dropdown thứ hai thì dropdown đầu đóng (chỉ 1 mở), ở trang chủ và các nơi khác dùng `OptionSelect` cùng hàng.
- [ ] Chọn được mọi tùy chọn, bàn phím/Esc vẫn đúng; không JS vẫn gửi form được như cũ.
- [ ] Test tái hiện (fail trước, pass sau) + kiểm trình duyệt thật.
