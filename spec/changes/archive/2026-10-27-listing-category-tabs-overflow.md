---
id: listing-category-tabs-overflow
type: bug
status: done
created: 2026-10-27
---

# Cho thuê: thanh danh mục cắt mất "Mặt bằng kinh doanh" ở mép phải

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/cho-thue`, VI, Khách, 1920 (sheet QA bug 9, Trung bình)
- Bước: quan sát thanh danh mục loại hình dưới banner, mục cuối.
- Expected: hiện đủ tên mọi danh mục; nếu không đủ rộng phải có cơ chế cuộn ngang/bố cục thích ứng mà người dùng nhận biết được.
- Actual: mục cuối bị cắt ở mép phải.
- Root cause: `src/components/listing/ListingCategoryTabs.tsx:36` — `ul` `max-w-container overflow-x-auto [scrollbar-width:none]`: nội dung 1413px > khung 1280px, cuộn được nhưng ẩn thanh cuộn, không có gợi ý (fade/nút mũi tên).

## Acceptance (bắt buộc)
- [ ] Ở 1920/1440/1280/768/390: hoặc mọi mục vừa khung, hoặc có gợi ý cuộn rõ (fade mép + nút mũi tên ≥ md / cuộn vuốt mobile) và mục đang chọn được cuộn vào tầm nhìn.
- [ ] Không vỡ các trang khác dùng `ListingCategoryTabs`. Theo design tokens hiện có.
- [ ] Ảnh chụp trước/sau trong review report.
