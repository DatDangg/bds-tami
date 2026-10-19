# feature-public-ui-market-vinhomes — phase/task plan (BL-020)

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` · Class: **MODIFY** (UI public) + **ADDITIVE** (khối/field CMS mới)
- Base: staging `1861843` (đã có BL-016 OptionSelect, BL-017 banner ảnh `pageBanners`, BL-018 logo vàng, BL-019 ≥ xl bỏ nút Menu)
- Worktree: `claude/angry-wiles-c1329a`, DB `tami_wt_bl020` (đã migrate)
- Spec/test-scope/BACKLOG/progress do **session chính** publish khi merge từng phase — task ở đây chỉ sửa code + `docs/DESIGN.md` + `.context/design-spec.md` + tokens.

## Hiện trạng đã kiểm (để tránh làm lại)
- Tokens `src/app/(frontend)/globals.css`: radius 2–4px, font EB Garamond (display) + Montserrat (sans), heading `uppercase` ở Hero/About/FeaturedProjects/Offers/Services/PageBanner; khối tối = `.theme-dark-block` (không có dark mode toàn trang → "AA sáng/tối" = khối sáng + khối tối).
- Homepage global: `hero`, `about`, `featuredProjects`, `services`, `featuredOffers`, `partners`, `ctaBanner` (+ `blockOrder`). **Chưa có**: thanh thông báo, ô tìm kiếm/chip, khối tin cho thuê, khối tin tức, ảnh nền + nút 2 của CTA.
- Projects: đã có `scale` (totalUnits, blocks, floors, landAreaM2, handoverTime), `amenities` (tiện ích nội khu: name+icon), `floorPlans` (title+ảnh), `legalInfo` + `salesPolicy` (richText), `documents` (PDF). **Chưa có**: điểm nổi bật, tiện ích quanh dự án (có khoảng cách), bảng giá, FAQ.
- Liên kết sẵn có cho "tin liên quan" dự án: `rentals.project`, `property-posts.relatedProject` → **không cần schema**.
- Lead `source` ∈ rental | property_post | project | contact → form tư vấn trang Tin tức dùng `contact` (không đổi enum).
- `isFeatured` có ở mọi collection nội dung (tin nổi bật Tin tức không cần schema).

## Phase / task
| Phase | Task | Nội dung | Schema? | Review |
|---|---|---|---|---|
| **P1** tokens + header | 01 | Tokens mới (radius 20px thẻ, nút viên thuốc, heading serif viết thường, kính mờ, gradient vàng) + docs | không | STRICT (shared UI) |
| | 02 | Header nổi bo tròn kính mờ (≥ xl menu ngang + dropdown; < xl giữ nút Menu) | không | STRICT |
| **P2** trang chủ | 01 | Schema Homepage: `announcementBar`, `heroSearch`, `rentals`, `news`, CTA thêm ảnh + nút 2; `blockOrder` thêm `rentals`, `news` (migration additive) | **có** | STRICT |
| | 02 | Thanh thông báo + hero typography + ô tìm kiếm đè đáy hero + chip dự án | không | STRICT |
| | 03 | Slider: Ưu đãi (thẻ căn), Dự án lớn kính mờ + số liệu | không | NORMAL |
| | 04 | Khối mới: Tin cho thuê (tab danh mục) + Tin tức (intro + 3 bài) | không | NORMAL |
| | 05 | Restyle Giới thiệu, Dịch vụ, CTA (ảnh nền + 2 nút), Đối tác | không | NORMAL |
| **P3** danh sách + tin tức | 01 | Băng tìm kiếm gọn dùng chung + banner 240px + "Có N kết quả"/sắp xếp + lưới 4 cột: `/cho-thue` (+danh mục, khu vực) | không | STRICT (URL params) |
| | 02 | Áp băng tìm kiếm cho `/du-an`, `/tin-bds` (+danh mục) | không | STRICT |
| | 03 | Tin tức: tab danh mục, nổi bật (1 lớn + list), hàng theo danh mục + "Xem thêm", form tư vấn cuối trang | không | NORMAL |
| **P4** chi tiết dự án | 01 | Hero + menu neo restyle + thẻ "Tư vấn 1:1" dính phải ≥ lg | không | NORMAL |
| | 02 | Tin liên quan (cho thuê + tin BĐS của dự án) + CTA tham quan cuối + restyle khối | không | NORMAL |
| **P5** schema dự án *(chờ user chốt)* | 01 | Schema Projects: `highlights`, `nearbyAmenities`, `priceTable`, `faqs` (migration additive, localized, dịch tự động) | **có** | STRICT |
| | 02 | UI: điểm nổi bật, bản đồ + tab tiện ích quanh, khối pháp lý (gộp legalInfo + documents), bảng giá, FAQ (+ JSON-LD FAQPage), menu neo thêm mục | không | STRICT (SEO) |

Mỗi task: builder → reviewer (report do primary ghi — guard chặn reviewer ghi trong worktree) → 1 commit. Hết phase: spec-validator → checkpoint user.
Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (theo `.context/project-config.md`); task schema thêm `pnpm payload migrate` (+ down/up) trên `tami_wt_bl020`.

## Quyết định user (2026-10-19 — duyệt theo đề xuất)
1. Giữ EB Garamond + Montserrat; heading viết thường weight 400; thẻ bo 20px; nút viên thuốc; bỏ watermark chữ chìm. **Header nổi kính mờ SÁNG** (kem ~80% + blur 24px, logo vàng, CTA vàng).
2. Thanh thông báo **chỉ trang chủ** (global Homepage).
3. Số liệu thẻ dự án trang chủ dùng **field sẵn có** (landAreaM2, totalUnits, handoverTime).
4. P5 schema duyệt 4 nhóm: highlights, nearbyAmenities, priceTable (theo loại căn), faqs. Quỹ căn chi tiết từng căn = **ngoài phạm vi**. Pháp lý dùng lại legalInfo + documents.

## Quyết định user checkpoint Phase 2 (2026-10-20)
- Duyệt Phase 2 (commit 1070257 → 8e9fd08). **Chưa làm Phase 3** — chờ user ra lệnh.
- **Q1** "slider banner ưu đãi" (#3): ánh xạ vào slider Ưu đãi (khối 5), không dựng mới, không schema.
- **Q2** homepage hiện có chưa có `rentals`/`news`: giữ bước triển khai — Admin → Trang chủ → Thứ tự khối thêm "Cho thuê", "Tin tức" (không auto-append, không data migration).
- **Q3** `SPECIFICATIONS.md:174` cho Cho thuê/Tin tức: tiêu đề khối tuỳ chọn (trống → tiêu đề mặc định i18n, kể cả EN); khối chỉ ẩn ở `/en` khi không có tin/bài có bản EN.
