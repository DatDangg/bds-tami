# feature-listing-detail-redesign · phase-1-task-04 — Dữ liệu danh sách Dự án (lọc / đếm / nổi bật / giá) + thẻ Dự án mới

- Nguồn: BL-052 change doc (Quyết định Dự án 1, 5, 6, 7).
- Spec: 1.46.0 khối BL-052 mục "Giá dự án", "`/du-an`" (tham số + thẻ), "Trang danh sách (khung chung)" (số đếm, nổi bật không lặp).
- Plan: phase 1 wave B (sau P1-T01; song song P1-T06, P1-T07).
- Phụ thuộc: P1-T01 (trường + `payload-types`).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — query công khai, tham số URL, thẻ dùng chung (trang chủ ProjectsSlider, "Dự án tương tự").
- Expected review level: **STRICT**.
- Blast radius: `src/lib/projects/*` (`project-filters`, `project-queries`, `project-view`, `project-listings`), `src/components/projects/ProjectCard.tsx`, thẻ trên trang chủ.

## Scope
1. `effectivePriceFromVnd(project)` (Quyết định 6) = min `priceTable[].priceFrom` > 0; bảng giá không có giá → `priceFromVnd` nếu > 0; không có → `null`. Dùng cho thẻ, lọc giá, sắp `price_asc`/`price_desc` (null xếp cuối). Rút gọn "5,4 tỷ" bằng formatter sẵn có.
2. `parseProjectFilters` mở rộng: `province` nhiều slug (`a,b` / khoá lặp; slug đơn cũ vẫn chạy), `type` (⊂ `PROPERTY_TYPES`, OR), `feature` (⊂ `PROJECT_FEATURES`, AND), `priceMin`/`priceMax` (tỷ, số nguyên 0–50; > 50 kẹp; min > max → đổi chỗ hoặc bỏ — ghi quyết định), giữ `category`/`status`/`q`/`developer`/`sort`/`page`. Giá trị lạ bị bỏ (không 400/500). `projectQueryString` serialize ổn định. `hasFilterParams` tính tham số mới (→ noindex).
3. `listPublicProjects` (lọc/sắp trong bộ nhớ trên ≤ 1000 dự án công khai như BL-045): áp các bộ lọc mới; trả thêm **facet counts** — mỗi chiều (category cấp 1 cho tab, status, province, developer?, type, feature) = số dự án khớp mọi bộ lọc khác trừ chiều đó; tab "Tất cả" = khớp mọi bộ lọc trừ category. Danh sách tỉnh: chỉ tỉnh có ≥ 1 dự án công khai, sắp theo số đếm (không lọc) giảm dần.
4. **Nổi bật**: ≤ 5 dự án `isFeatured` khớp bộ lọc (mới nhất trước), chỉ khi `page === 1`; lưới loại các dự án này ở **mọi trang** (phân trang trên phần còn lại); `totalDocs` ("N phù hợp") = tổng khớp (gồm nổi bật). Ghi rõ trong JSDoc + test.
5. `toProjectCards` / view thêm: `productTypes` (nhãn i18n, ≤ 3 + số còn lại), `priceFromLabel` hoặc cờ "Liên hệ", `areaRange`, `handoverTime`, `summary`, nhãn danh mục — cho thẻ thường + thẻ nổi bật.
6. `ProjectCard` mới theo design (biến thể `listing` — lưới, thẻ nổi bật, "Dự án tương tự", thẻ dự án trong trang chi tiết); **trang chủ (`ProjectsSlider`/`FeaturedProjects`) giữ biến thể hiện tại** (không tag/giá) — spec F3-r1: ảnh + badge tình trạng, tên 2 dòng, ghim tỉnh, tag loại sản phẩm, "Giá từ" (vàng) hoặc "Liên hệ", nút mũi tên tròn; cả thẻ là link (BL-034 hover). Không tim. Kiểm trang chủ không đổi giao diện (test snapshot/attr biến thể cũ). `SimilarProjects` thuộc P1-T06 — chỉ đổi `ProjectCard` + view.
7. Thẻ nổi bật: component nội dung cho `SpotlightSlider` (P1-T02 làm khung; nếu P1-T02 chưa merge thì tạo `ProjectSpotlightContent` thuần nhận props — P1-T05 ghép).

## Acceptance
- [ ] Test parse/serialize (đa giá trị, lạ, slug cũ), test facet counts (bỏ chính chiều), test nổi bật không lặp + `totalDocs`, test giá hiệu lực.
- [ ] Integration test `listPublicProjects` trên DB worktree (dữ liệu tạo trong test, xoá sau).
- [ ] Trang chủ giữ thẻ cũ + `/du-an` hiện tại vẫn render (thẻ mới), không lỗi.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
