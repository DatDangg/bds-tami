---
id: project-location-address-dedupe
type: bug
status: done
created: 2026-10-27
---

# Chi tiết dự án: địa chỉ mục "Vị trí dự án" lặp phường/tỉnh

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/du-an/astor-1`, VI, Khách, 1920 (sheet QA bug 6, Trung bình)
- Bước: cuộn tới "Vị trí dự án", đọc dòng địa chỉ dưới tiêu đề.
- Expected: địa chỉ đầy đủ, không lặp.
- Actual: "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội, Phường Phú Thượng, Hà Nội".
- Root cause: `src/components/projects/ProjectLocation.tsx:63` ghép `[address, areaLabel].join(", ")` không kiểm tra; `address` admin nhập đã gồm phường + tỉnh.

## Acceptance (bắt buộc)
- [ ] Khi `address` đã chứa tên phường/tỉnh (so không phân biệt hoa thường, không dấu) thì không ghép lại phần đó; thiếu phần nào thì chỉ thêm phần thiếu.
- [ ] Kiểm các chỗ khác ghép address + phường/tỉnh tương tự (dự án/cho thuê/tin BĐS) và áp cùng quy tắc nếu bị lặp.
- [ ] Test.
