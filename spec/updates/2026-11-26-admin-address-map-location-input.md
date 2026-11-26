# Spec Update — 2026-11-26 admin-address-map-location-input

**spec_version:** 1.64.8 -> 1.65.0 (MINOR — change BL-131, MODIFY: thêm luật validate toạ độ server + ô nhập admin mới)
**Trigger:** feature-update (BL-131, `feature/admin-address-map-location-input`)
**Requirements:** SỬA mục F10 (và F4 Tin BĐS) trong SPECIFICATIONS.md, đoạn "Nhập địa chỉ / toạ độ bản đồ trong admin (BL-131"; bullet "Toạ độ bản đồ" trong `docs/ERD.md`.
- T01 Tin BĐS: "Địa chỉ" + "Toạ độ bản đồ" ngay dưới Tỉnh/thành · Phường/xã (tab "Thông tin tin đăng"), ngoài khối "Thông số bất động sản".
- T02 Trường dùng chung `src/fields/map-location.ts` cho 6 ô point; validate server (API/seed/job): trống hợp lệ; trong VN (vĩ 7–24, kinh 101.5–118, gồm Hoàng Sa/Trường Sa) hợp lệ; đảo -> "Có vẻ bạn nhập ngược kinh độ và vĩ độ."; ngoài VN -> "Toạ độ không nằm ở Việt Nam, kiểm tra lại.". Giữ access `readExactAddress` (Cho thuê) và mô tả từng chỗ.
- T03 Ô "Dán từ Google Maps" (cặp số `lat, lng` hoặc link đầy đủ `@lat,lng` / `?q=` / `!3d!4d`), Vĩ độ hiển thị trước Kinh độ (lưu vẫn `[lng, lat]`), link "Xem trên Google Maps"; link rút gọn `maps.app.goo.gl` -> nhắc dán cặp số.
**Ảnh hưởng:** `src/collections/PropertyPosts.ts`, `src/collections/Rentals.ts`, `src/collections/Projects.ts`, `src/collections/projects/market-blocks.ts`, `src/globals/SiteSettings.ts`, `src/globals/site-settings/contact-offices.ts`, `src/fields/map-location.ts`, `src/lib/admin/map-location-parse.ts`, `src/components/admin/MapLocationField.tsx` (+ scss, importMap). Cập nhật/lưu bản ghi có toạ độ cũ sai (API, job, hook) giờ bị chặn tới khi sửa.
**Không đổi:** kiểu dữ liệu `point` (GeoJSON `[lng, lat]`), GIST index, `isValidLocation` (`src/components/media/map-geometry.ts`), làm tròn toạ độ Cho thuê khi ẩn địa chỉ chính xác, schema/migration, API shape.
**Evidence/Residual risk:** quét DB dev 551 toạ độ, 0 sai; staging/prod CHƯA quét — bản ghi sai (nếu có) sẽ không lưu được tới khi sửa.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 130, risk medium)
