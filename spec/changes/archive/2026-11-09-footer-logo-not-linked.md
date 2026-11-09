---
id: footer-logo-not-linked
type: bug
status: done
created: 2026-11-09
---

# Footer: bấm logo TAMI Homes không về trang chủ (QA bug 34)

## Bối cảnh / tái hiện (bug)
- Mọi trang, Khách → cuộn xuống footer → bấm logo
- Expected: về trang chủ
- Actual: không điều hướng

## Điều tra sơ bộ
`src/components/layout/Footer.tsx:55` render `<BrandLogo>` không bọc link (Header có). Hướng: bọc link về trang chủ theo locale (`/` hoặc `/en`), có tên truy cập (aria-label), alt logo rỗng khi trong link (theo comment BrandLogo).

## Acceptance (bắt buộc)
- [ ] Bấm logo footer về trang chủ đúng ngôn ngữ; test hồi quy

Nguồn: QA sheet "TAMI – Báo bug" (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4) dòng 34.
