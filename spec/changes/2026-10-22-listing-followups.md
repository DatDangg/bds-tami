---
id: listing-followups
type: feature
status: pending
created: 2026-10-22
---

# Việc còn mở sau BL-052 (danh sách / chi tiết Dự án, Cho thuê, Tin BĐS) (BL-055)

## Nguồn
Phase review cuối BL-052 (`.context/review-reports/feature-listing-detail-redesign-phase-3-phase-review.md` mục (c)) + review P2-T04 / P3-T01 / P3-T06. Không chặn BL-052; gom để xử lý sau.

## Danh sách
- **C-1** Link cũ `?category=<slug>` ở `/tin-bds` và `/cho-thue`: chuyển hướng 308 sang `/…/danh-muc/<slug>` khi URL chỉ có `category` (hiện `/tin-bds` trả noindex + canonical sang trang danh mục — tín hiệu trái nhau; `/cho-thue` index).
- **C-4** `/du-an`: `priceMax=0` / `areaMax=0` gõ tay coi như không giới hạn (đồng bộ `/tin-bds`).
- **C-5** Index `rentals_amenities.value` nếu dữ liệu lớn (đo `EXPLAIN` trước) + ca `locale=en` cho số đếm tiện ích `/cho-thue`.
- **C-6** GIST index `property_posts.location` — chỉ khi có lọc theo bản đồ / bán kính.
- **C-7** Integration test hay timeout ở `beforeAll` khi chạy cả bộ (`media-upload`, `session-refresh`, `jobs-email`, `access`…) → tăng `hookTimeout` hoặc giảm tải setup.
- **C-8** Backfill: `isOfferPost` trùng logic `hasPostOffer` / `isVoucherPost` (`src/lib/posts/post-kind.ts`) → dùng chung.
- Đo LCP thật (bản build) cho 6 trang danh sách / chi tiết.

## Phân loại dự kiến
MODIFY + BUG nhỏ; C-1 đụng SEO (STRICT); C-5/C-6 cần migration (additive).
