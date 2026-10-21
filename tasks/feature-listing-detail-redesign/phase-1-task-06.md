# feature-listing-detail-redesign · phase-1-task-06 — Chi tiết Dự án `/du-an/[slug]` theo design mới

- Nguồn: BL-052 change doc (Quyết định Dự án 2, 3, 4, 8); design `detail-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Chi tiết Dự án".
- Plan: phase 1 wave B (song song P1-T04, P1-T07). **Không** sửa `ProjectCard` / `project-view` card mapping / file danh sách (thuộc P1-T04, P1-T05) — "Dự án tương tự" dùng `ProjectCard` như đang có.
- Phụ thuộc: P1-T01 (trường mới), P1-T03 (component chi tiết).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, LCP, form lead, JSON-LD, scroll-spy.
- Expected review level: **STRICT**.
- Blast radius: `src/components/projects/ProjectDetail.tsx` + khối (`ProjectOverview`, `ProjectLocation`, `NearbyTabs`, `ProjectAmenities`, `FloorPlans`, `PriceTable`, `LegalPolicy`, `Documents`, `ProjectFaq`, `ProjectHighlights`, `ProjectListings`, `ProjectSpecs`, `SimilarProjects`, `ProjectStickyCta`, `use-project-facts`), `src/lib/projects/project-detail-view.ts`, route `du-an/[slug]/page.tsx`, i18n.

## Scope
1. `DetailPageShell` + `DetailHeroMosaic` (gallery, badge danh mục + tình trạng, `h1`, địa chỉ, `summary`, video nếu `videoUrl`) → `DetailSpecBar`: Giá từ (giá hiệu lực — dùng helper P1-T04 nếu đã merge, không thì helper thuần trong `project-detail-view` rồi P1-T04 gom; ghi rõ trong task) · Quy mô (`scale.landAreaM2` → ha, "36,21 ha") · Diện tích (`areaFromM2`–`areaToM2` m²) · Chủ đầu tư · Bàn giao (`scale.handoverTime`) · Loại hình (`productTypes` nhãn i18n). **Không ô Pháp lý.**
2. Tab dính: Tổng quan · Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp (khối có dữ liệu mới có tab; thứ tự đúng thứ tự khối).
3. Tổng quan: eyebrow "Giới thiệu" + `h2` "Tổng quan dự án" + `overview` + `DetailInfoGrid` (Tên thương mại, Chủ đầu tư, Vị trí, Quy mô, Loại hình, Bàn giao) + `DetailStatCards` từ `products`.
4. Cột phải: `DetailContactAside` — form "Nhận thông tin dự án" (LeadForm `source=project`, `#lead-form` duy nhất, trường hiện có) + Hotline `site-settings.hotline` "Gọi ngay". < lg: sau nội dung + `ProjectStickyCta` giữ.
5. Vị trí: eyebrow "Kết nối" + `h2` + địa chỉ + bản đồ sẵn có (`ProjectLocation`, điểm lân cận có toạ độ) + `DetailDistanceList` "Khoảng cách đến các địa điểm quan trọng" từ `nearbyAmenities` (icon theo nhóm). Bỏ tab lân cận theo nhóm (`NearbyTabs`) nếu không còn dùng.
6. Tiện ích nổi bật: eyebrow "Không gian sống" + `h2` + `DetailFeatureList` (ảnh `amenitiesImage`, mục icon + `name` + `description`, > 5 → "Khám phá tất cả tiện ích").
7. Hình ảnh: eyebrow "Thư viện ảnh" + `h2` + `DetailGalleryGrid` + "Xem tất cả hình ảnh".
8. Khối giữ lại (sau Hình ảnh), vẽ lại kiểu đầu khối mới: Nổi bật, Mặt bằng, Bảng giá (+ ngày cập nhật), Pháp lý & chính sách (+ tài liệu PDF, neo `#documents` mở khối nếu thu gọn), Tin liên quan (quy tắc F2 giữ), Hỏi đáp (+ JSON-LD FAQPage giữ).
9. "Dự án tương tự": `SimilarCarousel` + "Xem tất cả dự án" → `/du-an`; rồi dải Điểm mạnh (theo cờ) → `ConsultBanner` (→ `#lead-form` + `tel:`).
10. Khối trống ẩn cả khối lẫn tab; `/en` bỏ hàng thiếu chữ EN như F2.
11. Kiểm trình duyệt: so `detail-du-an.webp` 1440px, 390px, VI + EN, dự án ít dữ liệu (không video/sản phẩm/ảnh tiện ích).

## Acceptance
- [ ] Bố cục khớp `detail-du-an.webp` desktop; mobile hợp lý; không tim; không ô Pháp lý trên thanh thông số.
- [ ] Khối trống ẩn (video, sản phẩm, tiện ích, ảnh, FAQ…), test cho dự án tối thiểu + đầy đủ.
- [ ] Một LeadForm, `#lead-form`, JSON-LD (Breadcrumb, FAQ…) giữ; 1 `h1`.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Bổ sung từ review P1-T03 (change-request 2026-10-21)
- **Bố cục theo design:** cột phải (form + hotline) chỉ **cạnh khối Tổng quan** (dính trong phạm vi đó); Vị trí / Tiện ích / Hình ảnh / khối giữ lại / Tương tự là **dải full-width nền xen kẽ** qua slot `after` của `DetailPageShell` (cập nhật mô tả slot hoặc thêm prop riêng). Kiểm: scroll-spy tab vẫn chạy cho khối trong `after`, `#lead-form` + CTA dính đáy < lg vẫn tới form.
- `DetailSpecBar`: lg 3 cột, xl 1 hàng 6 ô (chữ không gãy giữa từ 1024–1150px); key `label+index` ở `DetailSpecBar` / `DetailInfoGrid`.
