# feature-listing-detail-redesign · phase-3-task-02 — Dữ liệu danh sách Tin BĐS (lọc / đếm / nổi bật / sắp xếp) + thẻ BĐS & thẻ voucher

- Nguồn: BL-052 change doc mục "Tin BĐS".
- Spec: 1.46.0 khối BL-052 mục "`/tin-bds`", "Trang danh sách (khung chung)".
- Plan: phase 3 wave B (song song P3-T04, P3-T05).
- Phụ thuộc: P3-T01.

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — query công khai, tham số URL mới, thẻ dùng chung (`PostCard` ở trang chủ slider Ưu đãi, tin liên quan dự án), BR-06.
- Expected review level: **STRICT**.
- Blast radius: `src/lib/posts/*` (`post-queries`, `post-listing`, `post-view`), `src/components/posts/PostCard.tsx` (+ `OfferStatusBadge`), trang chủ `OffersSlider`/`FeaturedOffers`, `RelatedPosts`.

## Scope
1. Parse tham số `/tin-bds`: `q` (≤ 100, khớp không dấu tiêu đề + tóm tắt + địa chỉ/tỉnh), `type` (⊂ `PROPERTY_TYPES`, nhiều, OR), `province` (nhiều slug, OR), `priceMin`/`priceMax` (tỷ), `areaMin`/`areaMax` (m²), `bedrooms` (1..4, 4 = 4+), `direction` (⊂ hướng), `handover` (⊂ `HANDOVER_CONDITIONS`), `sort` (`newest` mặc định · `price_asc` · `price_desc`, giá trống xếp cuối), `page`; giá trị lạ bị bỏ. `category` theo route danh mục như hiện tại. Có tham số → `noindex, follow` + canonical trang sạch.
2. Query: lọc thuộc tính loại tin không có giá trị đó; quy tắc công khai hiện có (`/en` chỉ tin có bản EN, …) giữ. Facet counts (tab danh mục, loại hình, tỉnh, hướng, bàn giao…) theo quy tắc "trừ chính chiều đó". Chọn cách hiệu quả (DB hoặc trong bộ nhớ có trần như dự án — ghi quyết định + trần + log khi chạm). p95 ≤ 500ms.
3. Nổi bật: `isFeatured` còn hiệu lực (BR-06 như hiện tại) ≤ 5, trang 1, không lặp trong lưới, `totalDocs` gồm nổi bật.
4. Thẻ: **thẻ BĐS** (ảnh, danh mục/loại hình tag, tiêu đề, vị trí, giá (rút gọn, `priceNote` khi không có giá → "Liên hệ"), diện tích · phòng ngủ, nút mũi tên) và **thẻ voucher** (tin có `offer.endAt` hoặc `offer.voucherCode`: ảnh, badge ưu đãi, tiêu đề, hạn ưu đãi `dd/MM/yyyy`, trạng thái Còn hạn / Đã kết thúc — BR-06, nút mũi tên). Không tim. Biến thể thẻ mới dùng cho danh sách; **trang chủ (`OffersSlider`/`FeaturedOffers`) giữ biến thể hiện tại**. `RelatedPosts` thuộc P3-T04 (không sửa ở đây). Thẻ voucher khi có ưu đãi **và không có `priceVnd` lẫn `areaM2`**; tin bán kèm ưu đãi → thẻ BĐS + badge ưu đãi.

## Acceptance
- [ ] Test parse, test lọc + đếm + nổi bật không lặp, test thẻ BĐS / voucher (hết hạn, không giá).
- [ ] Trang chủ khối Ưu đãi (giữ thẻ cũ) + tin liên quan dự án vẫn render.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
