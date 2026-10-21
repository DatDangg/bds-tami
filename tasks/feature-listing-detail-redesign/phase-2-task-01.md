# feature-listing-detail-redesign · phase-2-task-01 — Dữ liệu danh sách Cho thuê (tham số `project`, số đếm, nổi bật) + thẻ Cho thuê mới

- Nguồn: BL-052 change doc mục "Cho thuê".
- Spec: 1.46.0 khối BL-052 mục "`/cho-thue`", "Trang danh sách (khung chung)" (số đếm, nổi bật).
- Plan: phase 2 wave A (song song P2-T03).
- Phụ thuộc: phase 1 xong (component listing/detail, quy ước số đếm).

## Classification / Risk
- Type: **MODIFY** (+ tham số API mới, additive, không migration).
- Risk: **HIGH** — API contract `GET /api/public/rentals`, query công khai, thẻ dùng chung (trang chủ RentalsTabs/HomeRentals, "Căn tương tự").
- Expected review level: **STRICT**.
- Blast radius: `src/shared/types/api.ts` (`rentalSearchParamsSchema` + `project`), endpoint public rentals, `src/lib/rentals/*` (`rental-list-queries`, `rental-queries`, `rental-view`, `active-filters`), `src/components/rentals/RentalCard.tsx`, `docs/API_SPEC.md`.

## Scope
1. Tham số MỚI `project` (slug dự án công khai; lạ → bỏ qua, không 400 ở trang; API: theo quy ước slugParam — slug không tồn tại trả rỗng/bỏ qua, ghi quyết định) ở trang `/cho-thue` (+ danh mục) và `GET /api/public/rentals`. Danh sách dự án cho ô chọn: dự án có ≥ 1 tin cho thuê công khai.
2. Facet counts (quy tắc "mọi bộ lọc khác trừ chính chiều đó"): tab danh mục (gồm "Tất cả"), tỉnh (chỉ tỉnh có tin công khai). Truy vấn gộp/đếm theo nhóm hiệu quả — p95 ≤ 500ms (đo trên dev, ghi số).
3. Nổi bật: ≤ 5 tin `isFeatured` còn trống khớp bộ lọc, chỉ trang 1, không lặp trong lưới (phân trang trên phần còn lại; `totalDocs` gồm nổi bật). Nếu tách khỏi phân trang DB khó → ghi phương án (vd loại id nổi bật bằng `id not in`) + test.
4. View thẻ: tag danh mục + nội thất, giá/tháng (hoặc "Thương lượng"/"Liên hệ" như hiện tại), diện tích, phòng ngủ, phòng tắm, vị trí; `RentalCard` mới theo khung thẻ dự án (ảnh + badge Đã thuê nếu có, tiêu đề, vị trí, tag, giá, thông số, nút mũi tên; không tim). Biến thể `listing` cho danh sách / "Căn tương tự"; **trang chủ (`RentalsTabs`/`HomeRentals`) giữ biến thể hiện tại**. `SimilarRentals` thuộc P2-T03.
5. `docs/API_SPEC.md` thêm `project`.

## Acceptance
- [ ] Test schema param `project`, test query đếm + nổi bật không lặp, integration `GET /api/public/rentals?project=`.
- [ ] Trang chủ khối Cho thuê vẫn render, giữ giao diện thẻ cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
