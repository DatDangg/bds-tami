---
id: post-detail-unified-layout
type: feature
status: done
completed: 2026-10-20
created: 2026-10-20
---

# Tin đăng BĐS (danh sách `/tin-bds` + chi tiết `/tin-bds/[slug]`) đồng bộ UI với dự án + cho thuê

## Yêu cầu
User 2026-10-20: "update lại UI của cái đăng tin BĐS cho giống cái dự án với cho thuê".
Hiện `PostDetail` (`src/components/posts/PostDetail.tsx`) tự dựng layout riêng, chưa dùng
`DetailLayout` / `DetailSection` / `DetailSubNav` / `DetailAsideFit` (`src/components/detail/`) mà
chi tiết dự án + cho thuê đã dùng sau BL-027…BL-031.

## Acceptance (bắt buộc)
- [x] Chi tiết tin đăng BĐS có nền màu trang + nội dung trong thẻ trắng bo góc giống chi tiết dự án/cho thuê.
- [x] Có thanh mục con (sticky, active theo mục đang xem, rộng bằng lưới nội dung) theo các mục hiện có của tin đăng; mục rỗng ẩn.
- [x] Cột phải: thẻ liên hệ/tư vấn dính khi cuộn, không cuộn riêng (cùng hành vi `DetailAsideFit`).
- [x] Thư viện ảnh / breadcrumb / khoảng cách giữ đồng bộ với chi tiết cho thuê.
- [x] **Danh sách** `/tin-bds` (+ `/tin-bds/danh-muc/[category]`) đồng bộ UI với `/du-an` và `/cho-thue`: hero/đầu trang, bộ lọc, thẻ tin, lưới, phân trang, trạng thái rỗng (`PostListPage` theo khuôn `RentalListPage`/`ProjectListPage`).
- [x] Không đổi dữ liệu, SEO/JSON-LD, URL; responsive 375/768/1280; /en giữ nguyên chữ dịch.

## Ghi chú
- Scope: cả trang **chi tiết** lẫn **danh sách** — user xác nhận 2026-10-20.
- Tham chiếu: BL-027 (`feature-detail-pages-unified-layout`), BL-028, BL-029, BL-031.
