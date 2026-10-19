# Spec Update — 2026-10-19 public-ui-market-vinhomes Phase 1 (tokens phong cách market + header nổi kính mờ sáng)

**spec_version:** 1.15.1 → 1.16.0 (MINOR — đổi hành vi hiển thị header và phong cách giao diện công khai; không đổi schema/DB, API, quyền, dữ liệu)

**Trigger:** feature-update (Change Request BL-020, **Phase 1/5**). Change doc `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (vẫn mở, `status: in_progress`). Plan: `tasks/feature-public-ui-market-vinhomes/README.md`. Task `phase-1-task-01.md`, `phase-1-task-02.md`. Spec-validation phase 1: `.context/review-reports/feature-public-ui-market-vinhomes-phase-1-spec-validation.md` (PASS sau khi đóng G1–G4).

> **Delta này chỉ là Phase 1/5.** Còn mở: P2 trang chủ (thanh thông báo, ô tìm kiếm đè hero, khối tin cho thuê, khối tin tức, CTA ảnh + 2 nút — có schema Homepage) · P3 trang danh sách + tin tức (banner 240px, băng tìm kiếm gọn, lưới 4 cột, hàng theo danh mục) · P4 chi tiết dự án (thẻ tư vấn dính, tin liên quan) · P5 schema dự án (highlights, nearbyAmenities, priceTable, faqs). Mỗi phase phát hành delta riêng khi merge.

## Đã làm (Phase 1)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (token dùng chung) | `3c1621d` | Thang radius 2/12/16/20px + `--radius-pill`; Button mọi variant viên thuốc + variant `secondary`, `chip`; Badge pill + `--gradient-gold` / `--gradient-success`, variant `success`; heading serif viết thường weight 400 (EB Garamond 400+500, Montserrat giữ); display/h1/h2 desktop 60/56/44px + `--text-h2-sm` (cỡ h2 cũ) cho heading phụ trang chi tiết; token kính `--color-glass` / `--blur-glass`, `--color-primary-deep`; bỏ watermark chữ chìm | STRICT PASS r2 (r1 FAIL: font 400, thứ bậc heading) |
| P1-T02 | MODIFY (layout dùng chung) | `ab3f95a` | Header thanh nổi pill kính mờ sáng luôn luôn (bỏ biến thể trong suốt / đặc khi cuộn, `HeaderFrame` thành server component, không JS); `--header-offset` cho hero, thanh dính, aside, `scroll-margin` neo; fallback nền đặc (`@supports`, `prefers-reduced-transparency`); trên kính chỉ `--color-text`; dropdown DesktopNav có cầu hover; ≥ xl không nút Menu (BL-019), logo vàng (BL-018) | STRICT PASS r1 (+ sửa MINOR) |
| close-out | docs | `f25afe1` | Dọn as-built mâu thuẫn: `docs/DESIGN.md`, `.context/design-spec.md`, `skills/react-nodejs/design-tokens.md`; spec-validation phase 1; tick acceptance | spec-validator PASS |

## Requirements

- SỬA **SPECIFICATIONS.md "Khung trang"**: header = thanh nổi bo tròn kính mờ sáng (kem ~80% + blur 24px) như nhau mọi trang kể cả trên hero / banner ảnh; lề 8/16px, cao 64/72px, sticky trong luồng (`--header-offset`); nền đặc khi không có `backdrop-filter` hoặc `prefers-reduced-transparency`; trên kính chỉ màu chữ (mục đang xem gạch chân màu chữ, ngôn ngữ đang chọn đậm, focus ring màu chữ). Logo: header chỉ dùng `site-settings.logo` (mặc định vàng); `logoDark` (mặc định trắng) chỉ ở menu toàn màn hình + footer.
- SỬA **SPECIFICATIONS.md "Giao diện"**: "phong cách theo vinhomes.vn" → bố cục + cảm giác market.vinhomes.vn, màu TAMI; thẻ bo 20px, nút/badge viên thuốc, heading serif viết thường weight 400, không chữ chìm.
- SỬA **FR-ADM-20 ghi chú "Ngoài phạm vi (BL-020)"**: bỏ "header trong suốt trên banner ảnh" (header không còn trong suốt); banner 240px + băng tìm kiếm vẫn là Phase 3.

## Quyết định thiết kế bị thay thế

| Trước | Sau (BL-020 P1) |
|---|---|
| design-spec S01.1 / §2.1: header "Trong suốt trên hero ↔ Đặc khi cuộn" (IntersectionObserver) | 1 biến thể: thanh kính mờ sáng nổi, không JS |
| BL-018 (spec 1.12.1): logo **trắng** khi header trong suốt trên hero | Header luôn logo vàng; logo trắng chỉ ở menu toàn màn hình + footer |
| Gạch chân mục đang xem `--color-primary` / `--color-accent-text` | `--color-text` (accent trên kính nền đen chỉ ~3.0:1) |
| §1.7 heading in hoa | Heading viết thường; in hoa chỉ còn nút, eyebrow, menu |
| §1.6 watermark chữ chìm (`--text-watermark`, prop `watermark` của PageBanner, i18n `page.home.about.watermark` / `page.home.projects.watermark`) | Bỏ hẳn (About / Dự án trang chủ, 404, PageBanner biến thể Chữ) |
| Radius "vuông, 2–4px, không bo 8–16px" | 2 (ô nhỏ) / 12 / 16 / 20 (thẻ) / pill (nút, badge, header) |
| display 56 / h1 40 / h2 30px desktop | 60 / 56 / 44px; `--text-h2-sm` = cỡ h2 cũ (24→30px); h1 trang chi tiết cho thuê dùng `--text-h2` |
| Badge trạng thái dự án | selling → `success` (gradient xanh), upcoming → vàng (gradient), handed_over → neutral |

Token mới: `--color-glass`, `--blur-glass`, `--gradient-gold`, `--gradient-success`, `--color-primary-deep`, `--radius-pill`, `--text-h2-sm`, `--header-offset`. Button thêm `secondary`, `chip` (chip chỉ trên `.theme-dark-block` / scrim). Badge thêm `success`.

**Schema / Access / API:** không đổi. Không migration. i18n: bỏ 2 khoá watermark (vi/en).

**Intent doc:** `docs/BRD.md:12` vẫn ghi "Tham khảo giao diện: vinhomes.vn" — không sửa (intent doc, cần user duyệt); change doc BL-020 tinh chỉnh tham chiếu sang market.vinhomes.vn, chỉ bố cục/cảm giác, giữ LGL-04.

**Ảnh hưởng:**
- Mọi trang công khai VI/EN: header (layout dùng chung), heading, nút, badge, thẻ (ProjectCard, RentalCard, PostCard, NewsCard, JobCard), PageBanner, trang chủ (Hero, About, FeaturedProjects/Offers, ServicesBento, CtaBanner), trang chi tiết (thứ bậc heading), 404/error.
- Vị trí dính / neo: ProjectSubNav, bộ lọc mobile Cho thuê, aside cho thuê/tuyển dụng (SaleContactBox, ApplyFormSlot), mục lục pháp lý, PostShare, `scroll-margin` mục dự án / form lead / RichText h2.
- Test-scope cũ (scope v15) assert "logo header trên hero = trắng" → **không còn đúng**, thay bằng "header luôn logo vàng trên kính".

**Residual:** LCP/CLS chưa đo Lighthouse sau khi thêm EB Garamond 400; kính mờ Safari + cầu hover chưa thử thiết bị thật; skip link `#main` trên trang không hero nằm dưới header (có từ trước); khe trong suốt giữa thanh nổi và thanh dính (chấp nhận, restyle P4-T01); `pnpm build` chưa verify trong worktree (lỗi môi trường next/font); 1280px EN 7 mục + CTA — pill hẹp hơn hàng cũ ~16px.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 19
