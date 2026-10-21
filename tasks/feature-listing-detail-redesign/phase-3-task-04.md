# feature-listing-detail-redesign · phase-3-task-04 — Chi tiết Tin BĐS `/tin-bds/[slug]` theo khung chi tiết mới

- Nguồn: BL-052 change doc mục "Tin BĐS".
- Spec: 1.46.0 khối BL-052 mục "Chi tiết Tin BĐS".
- Plan: phase 3 wave B (song song P3-T02, P3-T05). **Không** sửa `PostCard` / `post-view` card mapping (P3-T02) — "Tin liên quan" dùng thẻ như đang có.
- Phụ thuộc: P3-T01, P1-T03.

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, BR-06 (ưu đãi hết hạn), form lead, JSON-LD Article.
- Expected review level: **STRICT**.
- Blast radius: `src/components/posts/PostDetail.tsx`, `OfferBox`, `CopyVoucherButton`, `PostContactBox`, `RelatedPosts`, `src/lib/posts/post-detail-sections.ts`, route `tin-bds/[slug]/page.tsx`, i18n.

## Scope
1. `DetailPageShell` + `DetailHeroMosaic` (ảnh bìa + `gallery` thumbnail; badge danh mục + trạng thái ưu đãi; `h1`; khu vực / `address`; `excerpt`; không video) → `DetailSpecBar`: tin BĐS = Giá · Diện tích · Phòng ngủ/tắm · Hướng · Mặt tiền · Số tầng; tin voucher = Hạn ưu đãi · Trạng thái (+ Giá nếu có). Ô trống bỏ; không ô nào → không render thanh.
2. Tab: Tổng quan (`content` + `DetailInfoGrid`: Loại hình, Tình trạng bàn giao, dự án / tin cho thuê liên quan (link), ngày đăng) · Ưu đãi (`OfferBox` mã voucher + điều kiện giữ) · Vị trí (khi có `location` → bản đồ sẵn có; chỉ `address`/khu vực → dòng địa chỉ) · Hình ảnh (`DetailGalleryGrid`) · Tin liên quan.
3. Cột phải `DetailContactAside`: form `source=property_post` duy nhất ("Nhận tư vấn") + hotline; < lg thanh dính đáy giữ. Chia sẻ (cơ chế sẵn có) trong hero/Tổng quan.
4. Cuối: `SimilarCarousel` "Tin liên quan" → dải Điểm mạnh (cờ propertyPosts) → `ConsultBanner` (`#lead-form` + `tel:`). JSON-LD `Article` + `BreadcrumbList` giữ.
5. Kiểm 1440 / 390, VI + EN, tin BĐS đủ trường / tin cũ trống / voucher còn hạn / hết hạn.

## Acceptance
- [x] Cùng khung chi tiết; thanh thông số theo loại tin; ô trống ẩn.
- [x] Voucher: hộp mã + điều kiện giữ, hết hạn hiện "Đã kết thúc" (BR-06).
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (close-out 2026-10-22)
- Commit: 32f5d44 · Review: r1 STRICT PASS (`.context/review-reports/feature-listing-detail-redesign-phase-3-task-04-round-1-review.md`).
- Verify: typecheck · lint · test 383 file / 3822 PASS · build PASS.
- Kiểm thực tế: Trình duyệt (builder): 1440/390, 1 h1, 4 tab, thanh liên hệ dính mobile.
- Doc impact: as-built: bỏ neo #content (nội dung vào Tổng quan); giữ nút chia sẻ hero (ngoại lệ so với Dự án/Cho thuê). Không đổi API/schema.
- Residual risk: EN + voucher hết hạn chỉ qua unit test (dev không có dữ liệu).
