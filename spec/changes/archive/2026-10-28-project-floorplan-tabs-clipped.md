---
id: project-floorplan-tabs-clipped
type: bug
status: done
created: 2026-10-28
---

# Chi tiết dự án: dãy nút chọn tầng/mặt bằng bị cắt ở mép phải (QA sheet bug 15, Trung bình)

## Yêu cầu
Dãy nút chọn ở mục Mặt bằng phải hiển thị đủ hoặc có cách cuộn/điều hướng rõ ràng tới mọi lựa chọn.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/du-an/astor-1` (VI), Khách, 768 / 1024 / 1440 / 1920
- Bước tái hiện: mở chi tiết dự án Astor 1 → mục Mặt bằng → xem dãy nút chọn tầng/mặt bằng → thử cuộn ngang / chọn mục bên phải
- Expected: mọi lựa chọn hiện đủ hoặc có cơ chế cuộn/điều hướng rõ ràng
- Actual: một phần nút phía phải bị cắt tại mép vùng hiển thị

## Acceptance (bắt buộc)
- [x] Mọi nút mặt bằng truy cập được bằng chuột, bàn phím, vuốt ở 768–1920 và 390
- [x] Có gợi ý cuộn khi tràn (cân nhắc dùng lại `ListingTabsScroller` của BL-084/BL-086), không đè lên nút
- [x] Ảnh Playwright trước/sau

## Ghi chú
Nguồn: QA sheet 28/10/2026 dòng 15. Liên quan BL-084/BL-086 (thanh danh mục tràn khung).
