# Spec Update — 2026-10-22 listing-detail-redesign-as-built (close-out BL-052)

**spec_version:** 1.46.0 → 1.46.1 (PATCH — làm rõ as-built sau khi build xong BL-052; một quyết định user đổi câu spec "số đếm cho chip" thành "chip đơn chọn không đếm". Không thêm requirement, không breaking, không đổi schema ngoài 2 migration additive đã có ở 1.46.0.)

**BRD:** không đổi.

**Trigger:** feature-update — change-request close-out as-built (BL-052 `listing-detail-redesign`, MODIFY + ADDITIVE schema). Plan: `spec/updates/2026-10-21-listing-detail-redesign.md` (1.46.0 / scope v58). Change doc `spec/changes/2026-10-21-listing-detail-redesign.md`.

**Trạng thái build:** 17 task / 3 phase done, merged `staging` (HEAD 838606c). Phase review P1+P2 (G1 đã đóng bằng P2-T04) và P3 code PASS; P-1/P-2/P-3 đã xử lý. Verify tại HEAD: `pnpm typecheck` PASS · `pnpm lint` PASS (0 lỗi) · `pnpm test` 385 file / 3878 test PASS · `pnpm build` PASS (worktree P3-T06). Bằng chứng trình duyệt: 11 URL VI/EN × 1440/768/390 không tràn ngang, 1 `h1`/trang; LCP chưa đo (residual).

## Quyết định user (2026-10-22)
- **B1 — chip đơn chọn không hiện số đếm** (Phòng ngủ / Nội thất `/cho-thue`, Tình trạng `/du-an`, Phòng ngủ `/tin-bds`) theo design; ô tích + tab vẫn đếm. Sửa câu "Số đếm (tab, ô tích, chip)" trong khối BL-052.
- **`/en` giữ ngày en-US `MM/DD/YYYY`** như toàn site, kể cả hạn ưu đãi trên thẻ voucher.

## Requirements (SPECIFICATIONS.md — khối BL-052 ở Giao diện)
- **SỬA (tại chỗ, đánh dấu "as-built BL-052"):**
  - Số đếm: chip đơn chọn không đếm; tab danh mục Cho thuê / Tin BĐS đếm theo danh mục cấp 1 (gồm con).
  - FAQ JSON-LD: `/du-an`, `/tin-bds` theo điều kiện `noindex`; `/cho-thue` chỉ khi URL không tham số; trang danh mục hiện khối FAQ nhưng không phát `FAQPage`.
  - Nhãn tiện ích nổi bật "Hồ bơi, gym, spa" (không gạch dài).
  - Dải / tab Hình ảnh chi tiết chỉ hiện khi ≥ 2 ảnh.
  - Ô "Dự án" `/cho-thue`: chỉ dự án có tin còn trống.
  - `/tin-bds`: nhận `?category=<slug>` cũ (lọc + tab, noindex, canonical → trang danh mục); Hướng + Tình trạng bàn giao là ô tích nhiều lựa chọn (OR) có số đếm; `priceMax=0` / `areaMax=0` = không giới hạn trên; `q` khớp tiêu đề + tóm tắt + địa chỉ + phường + tỉnh (không dấu).
  - Tên báo cáo backfill `backfill-listing-fields-<ngày>-<giờ>-<dry-run|apply>.md`.
- **THÊM mục "As-built (close-out BL-052)"**: bỏ nút chia sẻ hero chi tiết Dự án + Cho thuê (Tin BĐS giữ); bỏ neo `#details`/`#video` (Cho thuê), `#content` (Tin BĐS); giá cho thuê "Thương lượng"/"Liên hệ" thay "Thoả thuận"; `/cho-thue` bỏ hàng chip "Đang lọc", slider giá VNĐ kẹp 0–100 triệu, "Xoá tất cả" trên `?category=` xoá luôn danh mục, noindex giữ quy tắc F3; `/tin-bds` hàng "N phù hợp" trở lại, nhãn hướng dùng chung `listingOptions.direction`, `PostCard` chỉ còn `listing` + `home`; backfill bỏ qua tin có ưu đãi, giá trị mâu thuẫn → danh sách soát; 3 FK `site_settings_listing_pages_*_learn_more_image_id_media_id_fk` > 63 ký tự (Postgres cắt tên, chấp nhận); ngày `/en` en-US.
- **Còn mở (backlog, không chặn close-out):** C-1 308 cho `?category=` (`/tin-bds`, `/cho-thue`); C-4 `/du-an` `priceMax=0` = không giới hạn; C-5 index `rentals_amenities.value` + ca EN đếm tiện ích; C-6 GIST `property_posts.location`; C-7 integration `hookTimeout`; C-8 backfill `isOfferPost` trùng `hasPostOffer`.

## Ảnh hưởng
- **Schema / DB:** không đổi thêm. Migration `20261021_135620_listing_detail_redesign`, `20261021_173246_property_post_specs` — SAFE_ADDITIVE (đã migrate DB dev).
- **API / URL:** as-built tại `docs/API_SPEC.md` §3.9 (`/du-an`), §3.10 (`/cho-thue` + `GET /api/public/rentals?project=`), §3.11 (`/tin-bds`).
- **Doc as-built đã reconcile (đối chiếu, không sửa lại):** `docs/API_SPEC.md`, `docs/DESIGN.md`, `docs/ERD.md`, `.context/design-spec.md`.
- **Test-scope:** `spec/test-scope/current.json` v59 (trigger close-out as-built, risk HIGH). Bản planned v58 → `spec/test-scope/archive/test-scope-1.46.0-58.json`.
