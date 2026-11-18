# bug-admin-map-gray-tiles · phase-1-task-01 — Bản đồ chỉ hiện nền xám, marker vẫn hiện (BL-121, QA 40)

- Change doc: `spec/changes/2026-11-17-admin-map-gray-tiles.md` (BACKLOG BL-121).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/bug-admin-map-gray-tiles-phase-1-task-01-round-1-review.md`, 4 MINOR không chặn). Spec 1.63.3 / scope v120. CHƯA commit (user yêu cầu 2026-11-18), staging chưa kiểm.

## Classification / Risk
- Type: **BUG** (thứ tự bug duyệt 2026-11-17; hướng sửa user chọn **phương án A — OpenFreeMap** 2026-11-18).
- Severity: medium (mọi bản đồ công khai mất nền với người xem dùng DNS VNPT; không mất dữ liệu).
- Risk: **MEDIUM** — component dùng chung `LazyMap` (4 nơi: `ProjectLocation`, `RentalDetail`, `PostDetail`, `OfficeSystem`). Không đổi API, schema, toạ độ, logic làm tròn `approximate`.
- Expected review level: NORMAL (shared component → reviewer có thể nâng STRICT).
- User yêu cầu: **KHÔNG commit, KHÔNG push/deploy** — dừng trước bước commit.

## Root cause (đã chứng minh 2026-11-17)
`src/components/media/LazyMap.tsx:17-23` dùng nguồn raster `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. DNS của nhà mạng VNPT trả NXDOMAIN cho `*.openstreetmap.org`:
- `nslookup tile.openstreetmap.org` qua DNS mặc định (static.vnpt.vn) → "Non-existent domain"; qua 1.1.1.1 → 151.101.x.91; TCP 151.101.1.91:443 → True ⇒ chặn tầng DNS ISP.
- Browser trên staging mới: `fetch` `tile.openstreetmap.org`, `a.tile.openstreetmap.org`, `www.openstreetmap.org` FAIL ~17ms; cùng lúc `tile.openstreetmap.de`, `a.basemaps.cartocdn.com`, `tiles.openfreemap.org` OK.
- `/du-an/vlasta-premier-phu-hoi` (toạ độ QA 105.8524/21.0285): canvas MapLibre dựng, worker 200, 0 tile thành công → nền `bg-surface-muted` (xám) + marker DOM. Console sạch.
- Loại trừ: Nginx `tami-staging-sslip-179.conf` không có CSP; `Referrer-Policy: strict-origin-when-cross-origin`; app không đặt CSP toàn site.
- Admin không có bản đồ (field `location` là `type: "point"` của Payload); bản đồ QA thấy là trang khách cùng toạ độ.

## Kiểm nguồn thay thế — OpenFreeMap (2026-11-18)
- `nslookup tiles.openfreemap.org` qua DNS VNPT → 104.26.6.23 / 104.26.7.23 / 172.67.74.56 (Cloudflare) — không bị chặn.
- Style `https://tiles.openfreemap.org/styles/liberty`: mọi tài nguyên (style, TileJSON `planet`, vector tile `.pbf`, raster `natural_earth`, glyphs, sprite) chỉ ở host `tiles.openfreemap.org`. Vector maxzoom 14 (MapLibre overzoom lên 15+ bình thường).
- TileJSON tự mang attribution: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" (link openfreemap.org, openmaptiles.org, openstreetmap.org/copyright) → `AttributionControl` của MapLibre tự hiện.

### Điều khoản dùng (đọc https://openfreemap.org/ và https://openfreemap.org/tos/ ngày 2026-11-18)
- Thương mại: trang chủ FAQ trả lời "Yes" cho câu hỏi dùng thương mại; ToS không cấm, không nói riêng về thương mại.
- Không đăng ký, không API key, không cookie; instance công khai không giới hạn lượt xem/request (chỉ giới hạn tải offline: ≤ 3.000 tile / 50 MB mỗi lần, ≤ 4 request song song — không áp dụng cho bản đồ nhúng).
- Attribution: **bắt buộc** (trang chủ) — "OpenFreeMap © OpenMapTiles Data from OpenStreetMap"; MapLibre hiện tự động từ TileJSON. Không được tắt `AttributionControl`.
- Không SLA, "AS-IS", không bảo đảm chính xác/sẵn sàng, có thể ngừng dịch vụ không báo trước; luật Hungary, trọng tài Budapest; request đi qua Cloudflare.
- Dữ liệu vẫn từ OSM → cách hiển thị biên giới/Hoàng Sa–Trường Sa do OSM quyết (user đã biết khi chọn A).
- Residual: không SLA → nếu cần cam kết, phương án dự phòng là tự host (OpenFreeMap mã nguồn mở) hoặc nhà cung cấp VN (B). Lỗi tải style → `LazyMap` đã có trạng thái `error` + "Thử lại".

## Thiết kế fix (đã chốt)
- `LazyMap`: thay `OSM_STYLE` (raster OSM) bằng style URL `https://tiles.openfreemap.org/styles/liberty`; bỏ hằng `OSM_ATTRIBUTION` tự viết (attribution lấy từ TileJSON, đúng chữ OpenFreeMap yêu cầu). Giữ `attributionControl: { compact: false }`.
- Không đổi: lazy load, worker URL, marker/vòng tròn `approximate`, `fitBounds`, link Google Maps, locale control, cooperative gestures.
- Tải style lỗi (mạng/dịch vụ ngừng) → hiện trạng thái lỗi + "Thử lại" thay vì nền trống: chỉ thêm nếu đơn giản (map `error` event trước `load`); không thì ghi residual.

## Files
- Sửa: `src/components/media/LazyMap.tsx`, `src/components/media/LazyMap.test.tsx`.
- KHÔNG đụng: file bẩn sẵn (snapshot `.context/runs/.bl121-baseline-status.txt`), gồm `docs/ARCHITECTURE.md` (dòng 68 "OpenStreetMap tiles") và `.context/design-spec.md` (dòng 206) → follow-up doc khi file đó sạch.

## Acceptance
- [ ] Bản đồ dùng style OpenFreeMap; nền (đường phố, địa danh) tải được với DNS VNPT — kiểm browser built-in trên dev local, có ảnh chụp.
- [ ] Attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" hiển thị.
- [ ] Marker / vòng tròn ẩn địa chỉ / điểm phụ / fitBounds như cũ.
- [ ] Test hồi quy `LazyMap.test.tsx`: khẳng định style OpenFreeMap, không còn `tile.openstreetmap.org`; FAIL trước fix, PASS sau.
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/media` PASS.
- [ ] Staging sau deploy (chờ user duyệt deploy): admin dự án + chi tiết dự án, cho thuê, tin BĐS, liên hệ — có ảnh.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: máy dùng DNS VNPT, mở `/du-an/vlasta-premier-phu-hoi` → "Xem bản đồ" → nền xám, marker hiện.
- Expected: nền bản đồ đầy đủ + marker đúng Hồ Hoàn Kiếm.
- Actual before fix: 0 tile OSM tải được (NXDOMAIN).
- Actual after fix (unit-level): `LazyMap` truyền cho MapLibre `style === "https://tiles.openfreemap.org/styles/liberty"`, không còn `tile.openstreetmap.org` trong options; `attributionControl: { compact: false }` giữ nguyên. Kiểm browser do change-request làm.
- Evidence: test hồi quy `LazyMap.test.tsx` ("vào viewport thì import động maplibre…") FAIL trên code cũ (style là object raster OSM), PASS sau fix. `pnpm vitest run src/components/media` 61/61 PASS; `pnpm typecheck` PASS; eslint 2 file sạch.
- Browser (dev local `pnpm dev`, máy dùng DNS VNPT, 2026-11-18): `/du-an/the-crown-dai-hoang-son-bac-ninh` → "Xem bản đồ" → nền đầy đủ (đường, sông, tên phường), ghim + điểm tiện ích, attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap". Request: `tiles.openfreemap.org/styles/liberty` 200, `/planet` 200, sprite 200; 0 request tới openstreetmap.org; không có `role=alert`. Ảnh: `.context/review-reports/assets/bl121-p1t01-local-project-map.jpg`.
- Status: PASS (unit + browser local) — staging chờ deploy

## Residual risk
- OpenFreeMap không SLA (xem trên).
- Staging/production chưa kiểm (chưa deploy theo yêu cầu user).
- Nhãn bản đồ: style Liberty ưu tiên `name_en` → tên địa danh tiếng Anh/không dấu (vd "Kinh Bac Ward") thay vì tên tiếng Việt như raster OSM cũ. Ngoài scope BL-121 → follow-up (đổi `text-field` theo locale), chờ user quyết.
- Chưa kiểm browser chế độ `approximate` (DB local không có tin cho thuê có toạ độ); unit test vẫn phủ vòng tròn 300 m.
- Chưa làm: hiện trạng thái `error` + "Thử lại" khi style/tile lỗi trước `load`. Lý do bỏ: event `error` của MapLibre cũng bắn cho từng tile lỗi lẻ (không phân biệt được với lỗi style), và mount promise đã resolve ngay sau khi tạo map → thêm sẽ phải đổi luồng phase/dispose. Nếu OpenFreeMap sập, người xem thấy nền trống (marker vẫn hiện) như hiện tại.

## Doc impact
- `SPECIFICATIONS.md` dòng 120 (bảng công nghệ: Bản đồ) → OpenFreeMap (as-built, spec-publisher).
- `docs/ARCHITECTURE.md:68`, `.context/design-spec.md:206` → follow-up (file đang bẩn của việc khác).
