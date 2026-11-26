---
id: admin-address-map-location-input
type: feature
status: done
created: 2026-11-26
---

# Admin: nhập địa chỉ / toạ độ bản đồ dễ và đúng hơn (Tin BĐS + mọi ô "Toạ độ bản đồ")

## Yêu cầu
Phân loại dự kiến: MODIFY (UX admin, không đổi schema/đường dẫn dữ liệu, không migration).
User duyệt làm cả 3 phần, tuần tự T01 → T02 → T03.

**T01 — Tin BĐS: đưa Địa chỉ + Toạ độ ra chỗ dễ thấy.**
Hiện `address` + `location` nằm trong collapsible "Thông số bất động sản" (`src/collections/PropertyPosts.ts:77-78`, khối có mô tả
"Để trống nếu tin là voucher/ưu đãi") → người nhập bỏ qua hoặc tưởng địa chỉ chỉ nhập bằng toạ độ. Chuyển 2 ô ra ngay dưới hàng
Tỉnh/thành – Phường/xã trong tab "Thông tin tin đăng" (giống Cho thuê `src/collections/Rentals.ts:186-201`, Dự án `src/collections/Projects.ts:203-208`).
Collapsible không tên → trường vẫn ở cấp gốc, dữ liệu giữ nguyên.

**T02 — Kiểm tra toạ độ ở cả 6 ô `point` (trường dùng chung, vd `src/fields/map-location.ts`).**
Các ô: Cho thuê `location`, Dự án `location`, Dự án → Tiện ích xung quanh `location` (`src/collections/projects/market-blocks.ts:128`),
Tin BĐS `location`, Cài đặt website `mapLocation` (`src/globals/SiteSettings.ts:92`), Hệ thống văn phòng `location`
(`src/globals/site-settings/contact-offices.ts:21`). Hiện không có validate: nhập ngược → web `isValidLocation`
(`src/components/media/map-geometry.ts:5`) loại toạ độ |lat| > 90 → **bản đồ ẩn lặng lẽ**, admin không báo gì.
- Trống → hợp lệ (toạ độ không bắt buộc).
- Trong vùng Việt Nam (vĩ độ ~8–24, kinh độ ~102–110; builder chốt biên có lề, gồm Hoàng Sa/Trường Sa nếu cần) → hợp lệ.
- Hai số bị đảo (kinh độ nằm trong dải vĩ độ VN và ngược lại) → lỗi "Có vẻ bạn nhập ngược kinh độ và vĩ độ".
- Ngoài Việt Nam → lỗi "Toạ độ không nằm ở Việt Nam, kiểm tra lại".
- Giữ nguyên `access`/`admin.description` riêng từng chỗ (Cho thuê `readExactAddress`, mô tả Tin BĐS / Tiện ích).
- Trước khi bật: quét DB (dev/staging) tìm toạ độ hiện có nằm ngoài vùng → báo danh sách cho user (bản ghi đó sẽ bị chặn lưu tới khi sửa).

**T03 — Ô "Dán từ Google Maps" + thứ tự Vĩ độ trước.**
Custom admin Field component cho trường dùng chung ở T02:
- 1 ô dán nhận: cặp số `10.7769, 106.7009` (kiểu chuột phải Google Maps; có/không dấu cách, số âm) và link đầy đủ
  (`…/@lat,lng,17z`, `?q=lat,lng`, `!3dlat!4dlng`) → tự điền đúng 2 ô.
- Hai ô số hiển thị **Vĩ độ trước, Kinh độ sau** (khớp Google Maps); dữ liệu lưu vẫn GeoJSON `[lng, lat]` như cũ.
- Link "Xem trên Google Maps" để kiểm ghim.
- Link rút gọn `maps.app.goo.gl/…` không tự giải (cần gọi server ra ngoài — YAGNI) → nhắc "Dán cặp số thay vì link rút gọn".

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin` → Tin bất động sản (sale/admin); mọi form có "Toạ độ bản đồ".
- Bước tái hiện: tạo Tin BĐS → tab "Thông tin tin đăng" → ô Địa chỉ chỉ thấy khi mở khối "Thông số bất động sản";
  dán toạ độ Google Maps `10.77, 106.70` theo thứ tự ô (Kinh độ trước) → lưu thành công.
- Expected: Địa chỉ cạnh Tỉnh/Phường; toạ độ ngược bị báo lỗi; dán từ Google Maps tự điền đúng.
- Actual: Địa chỉ bị giấu; lưu được toạ độ ngược, bản đồ trang công khai biến mất không báo.

## Acceptance (bắt buộc)
- [x] T01: Form Tin BĐS hiện Địa chỉ + Toạ độ ngay dưới Tỉnh/Phường, ngoài khối "Thông số bất động sản"; tin cũ giữ nguyên dữ liệu; không migration.
- [x] T02: Cả 6 ô toạ độ dùng chung 1 trường; trống lưu được; toạ độ VN lưu được; đảo kinh/vĩ → lỗi "nhập ngược"; ngoài VN → lỗi; validate chạy cả server (API/seed).
- [x] T02: Có báo cáo quét toạ độ hiện có ngoài vùng (hoặc "không có") trước khi bật.
- [x] T03: Dán cặp số / link đầy đủ Google Maps điền đúng vĩ độ/kinh độ; link rút gọn → thông báo hướng dẫn; ô Vĩ độ đứng trước Kinh độ; link "Xem trên Google Maps" mở đúng điểm.
- [x] Unit test: parser (cặp số, các dạng link, khoảng trắng, số âm, chuỗi rác) + validator (trống / VN / đảo / ngoài VN).
- [ ] (RESIDUAL — chưa kiểm trình duyệt; bản đồ công khai: web isValidLocation không đổi, dữ liệu dev 551 toạ độ hợp lệ) Kiểm admin thật (Tin BĐS + Cho thuê) 1440 & 390, sáng/tối; bản đồ trang công khai vẫn hiện đúng với dữ liệu cũ.

## Ghi chú
- Không đổi kiểu dữ liệu `point` (GeoJSON `[lng, lat]`), GIST index giữ nguyên.
- Cho thuê làm tròn toạ độ khi ẩn địa chỉ chính xác (`src/components/media/LazyMap.tsx`) — không đổi.
- Doc impact dự kiến: `docs/DESIGN.md` (admin form), có thể `docs/ERD.md` ghi luật validate toạ độ.

## Kết quả (2026-11-26)
- T01 `32f86155` NORMAL PASS r1 · T02 `6a1ebe15` STRICT PASS r1 · T03 STRICT FAIL r1 → PASS r2 (commit close-out).
- Spec **1.65.0 / scope v130**; spec-validation phase PASS (`.context/review-reports/spec-validation-feature-admin-address-map-location-input-phase-1.md`).
- Quét toạ độ DB dev (read-only): 551 toạ độ (projects 61, tiện ích 488, rentals 2), 0 đảo / 0 ngoài VN.
- Gate còn mở: (G1) kiểm admin trình duyệt 1440/390 sáng/tối; (G2) quét staging/prod cùng truy vấn read-only TRƯỚC deploy — bản ghi toạ độ sai sẽ bị chặn lưu (cả job dịch / hook / backfill).
