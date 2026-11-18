---
id: admin-map-gray-tiles
type: bug
status: done
created: 2026-11-17
---

# Bản đồ chỉ hiện nền xám, không có đường phố/địa danh (marker vẫn hiện) — QA 40

## Yêu cầu
Bản đồ vị trí phải tải đầy đủ nền (đường phố, địa danh) cùng marker.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Admin — `https://179-197-242-57.sslip.io/admin/collections/projects/81fccaa8-0726-4c5b-89e6-b7e332d4c610` (staging mới). Bước QA ghi "Cấu hình chung → khu vực bản đồ" nhưng URL là chi tiết dự án → kiểm cả hai.
- Bước: 1. Đăng nhập Admin · 2. mở khu vực bản đồ · 3. Kinh độ 105.8524 · 4. Vĩ độ 21.0285 · 5. quan sát bản đồ.
- Expected: nền bản đồ (đường phố, địa danh) + marker đúng Hồ Hoàn Kiếm.
- Actual: chỉ nền xám, marker vẫn hiện. Màn 1920. Ảnh: bug40.png (sheet QA).

## Acceptance (bắt buộc)
- [ ] Root cause chứng minh (tile OSM bị chặn/Referer/CSP/server mới/…), không đoán
- [ ] Nền bản đồ tải đủ ở admin và các trang khách có bản đồ (chi tiết dự án, cho thuê, tin BĐS, liên hệ) trên staging mới
- [ ] Kiểm trên staging sau deploy, có ảnh chụp
- [ ] Test hồi quy

## Ghi chú
Nguồn tile hiện tại `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (`src/components/media/LazyMap.tsx:20`). Nguồn: QA sheet "TAMI – Báo bug" dòng 40 (17/11/2026, Trung bình).
