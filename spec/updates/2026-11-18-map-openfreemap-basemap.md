# Spec Update — 2026-11-18 map-openfreemap-basemap

**spec_version:** 1.63.2 → 1.63.3 (PATCH — as-built bug-fix BL-121)
**Trigger:** bug-fix (BL-121, `bug-admin-map-gray-tiles`)
**Requirements:** SỬA bảng công nghệ dòng "Bản đồ": "OpenStreetMap + MapLibre GL" → "OpenFreeMap (vector style `liberty`) + MapLibre GL, không cần API key; attribution 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap' (từ TileJSON) bắt buộc hiển thị". Không đổi requirement chức năng.
**Nguyên nhân:** DNS nhà mạng VNPT trả NXDOMAIN cho `*.openstreetmap.org` → raster tile không tải được → bản đồ chỉ còn nền xám + marker. Admin không có bản đồ (field `location` là 2 ô số); bản đồ trong QA là trang khách.
**Ảnh hưởng:** `LazyMap` (src/components/media/LazyMap.tsx) dùng chung 4 nơi: `ProjectLocation` (chi tiết dự án), `RentalDetail` (cho thuê, gồm vòng tròn ẩn địa chỉ 300 m), `PostDetail` (tin đăng BĐS), `OfficeSystem` (Liên hệ). Không đổi API/schema/toạ độ/logic `approximate`.
**Rủi ro còn lại:** OpenFreeMap không SLA; nhãn style Liberty ưu tiên tên tiếng Anh/không dấu (follow-up theo locale); `docs/ARCHITECTURE.md:68` và `.context/design-spec.md:206` còn ghi "OpenStreetMap tiles" — follow-up doc khi 2 file hết dirty.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 120)
