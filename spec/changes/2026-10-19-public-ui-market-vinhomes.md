---
id: public-ui-market-vinhomes
type: feature
status: in_progress
created: 2026-10-19
---

# Giao diện website công khai theo market.vinhomes.vn (section + phong cách, màu TAMI)

## Yêu cầu
User yêu cầu (2026-10-19) xem lại cách thiết kế UI của Vinhomes, so với hiện tại và **dựng theo các section của
market.vinhomes.vn**. User chốt:
- **Phạm vi = section + phong cách**: theo bố cục section và cảm giác của market (thẻ bo góc, nút viên thuốc, header
  nổi kính mờ, tiêu đề serif viết thường), **vẫn dùng màu TAMI** (vàng champagne + đen/kem), không dùng navy Vinhomes.
- **Đầu trang danh sách = banner ảnh thấp (~240px) + băng tìm kiếm gọn kiểu market** thay form lọc dài (gộp với BL-017).
- Chỉ lấy bố cục/cảm giác — không sao chép nội dung, ảnh, logo, chữ của Vinhomes (BRD LGL-04).

## Khảo sát (2026-10-19, đọc DOM ở 1440px)

### Phong cách market.vinhomes.vn
- Tiêu đề Playfair (serif) **viết thường**, h1 60px / h2 48px, weight 400; chữ thường Mulish 16px.
- Header sticky dạng **thanh nổi bo tròn hoàn toàn**, nền màu thương hiệu ~70% + `backdrop-filter: blur(24px)`, cao 72px,
  rộng gần full (cách mép ~50px): logo trái · menu ngang giữa (có dropdown) · tìm kiếm + tài khoản phải. Không nút Menu ở desktop.
- Nút: viên thuốc (radius full); primary nền màu thương hiệu chữ trắng; secondary nền trắng viền + chữ màu thương hiệu; chip viền trắng 30%.
- Thẻ: dự án lớn 464×600 bo 20px, khung kính mờ đè ảnh; thẻ tin/căn bo 20px nền trắng (trang danh sách) hoặc trong suốt trên nền tối (trang chủ).
- Nền: phần lớn section nền tối màu thương hiệu, nhấn bằng gradient vàng; badge trạng thái gradient (xanh "Đang bán").
- Cấu trúc tương đương phải map sang token TAMI: navy → đen/`--color-dark`, gradient vàng → vàng champagne TAMI.

### Trang chủ market → TAMI
| # | Section market | TAMI hiện tại | Việc cần làm |
|---|---|---|---|
| 1 | Thanh thông báo khuyến mãi trên cùng (đóng được) | — | Thêm (bật/tắt + chữ + link trong CMS) |
| 2 | Hero full màn hình, tiêu đề serif, nút cuộn | HeroSlider ✅ | Đổi typography theo phong cách mới |
| 3 | Ô tìm kiếm đè đáy hero + chip "Dự án được quan tâm" + slider banner ưu đãi | — | Thêm: tìm tin cho thuê/dự án, chip dự án nổi bật |
| 4 | Giới thiệu nền tảng | AboutBlock ✅ | Restyle |
| 5 | "Mua từ chủ đầu tư" — slider thẻ căn + "Xem thêm" | FeaturedOffers (đang tắt ở dev) | Đổi sang slider thẻ |
| 6 | Slider dự án lớn, khung kính mờ + số liệu (diện tích, mật độ, khởi công) | FeaturedProjects/ProjectsSlider | Thêm số liệu dự án lên thẻ |
| 7 | "Đăng ký tham quan" ảnh tràn viền + 2 nút | CtaBanner (nền đen, 1 nút) | Thêm ảnh nền + nút thứ 2 |
| 8 | "Thuê nhà ở/kinh doanh" — slider tin cho thuê | **không có** | **Thêm khối tin cho thuê** (tab theo danh mục, gộp văn phòng/mặt bằng = #10 market) |
| 9 | "Đồng hành trọn hành trình" — 3 thẻ dịch vụ trên ảnh | ServicesBento | Restyle |
| 11 | "Tin tức" nền màu thương hiệu: intro + 3 bài | **không có** | **Thêm khối tin tức** |

### Trang danh sách (Cho thuê / Dự án / Tin BĐS)
- Market: băng tìm kiếm (ô từ khoá + vài dropdown Loại/Khoảng giá + nút "Bộ lọc" mở thêm) → breadcrumb → "Có N kết quả" + sắp xếp → lưới **4 cột** thẻ trắng bo 20px.
- TAMI: banner 280px + form lọc đầy đủ 266px + lưới 3 cột.
- Chốt: banner ảnh ~240px (BL-017) + băng tìm kiếm gọn (lọc phụ trong "Bộ lọc" sheet/popover), lưới 4 cột ≥ xl.

### Tin tức
- Market: tab danh mục → "Tin nổi bật" (1 lớn + list) → mỗi danh mục 1 hàng bài + "Xem thêm" → form "Tư vấn nhu cầu".
- TAMI: 1 bài nổi bật + lưới chung → thêm hàng theo danh mục + form tư vấn cuối trang.

### Chi tiết dự án
- Market: hero ảnh + h1 → menu neo dính (Tổng quan · Khu · Vị trí · Tiện ích · Pháp lý · Giá & quỹ căn) → thẻ "Tư vấn 1:1" dính bên phải
  → điểm nổi bật → bản đồ + tab tiện ích quanh (trường, y tế, mua sắm…) → tài liệu pháp lý → bảng giá → tin liên quan → FAQ → CTA tham quan.
- TAMI: Tổng quan · Vị trí · Tiện ích · Thư viện ảnh · form · Dự án khác (đã có menu neo dính).
- Không cần schema mới: thẻ tư vấn dính bên phải, tin liên quan, restyle. **Cần schema mới (hỏi user khi phase-plan):** điểm nổi bật, tiện ích quanh dự án, tài liệu pháp lý, bảng giá/quỹ căn, FAQ.

## Tiến độ
Plan phase/task: `tasks/feature-public-ui-market-vinhomes/README.md`.

| Phase | Nội dung | Trạng thái | Commit | Spec / scope |
|---|---|---|---|---|
| P1 | Tokens phong cách market (màu TAMI) + header nổi bo tròn kính mờ sáng | **done** (T01 STRICT PASS r2, T02 STRICT PASS r1, spec-validation PASS) | 3c1621d, ab3f95a, f25afe1 | 1.16.0 / v19 — `spec/updates/2026-10-19-public-ui-market-vinhomes-phase-1.md` |
| P2 | Trang chủ: schema Homepage (thanh thông báo, ô tìm kiếm hero, khối tin cho thuê, tin tức, CTA ảnh + 2 nút) + UI | pending | — | — |
| P3 | Trang danh sách (banner 240px, băng tìm kiếm, lưới 4 cột) + Tin tức | pending | — | — |
| P4 | Chi tiết dự án: thẻ tư vấn dính, tin liên quan, CTA | pending | — | — |
| P5 | Schema dự án (highlights, nearbyAmenities, priceTable, faqs) + UI | pending | — | — |

Ghi chú P1: header **luôn** kính mờ sáng (kể cả trên hero) theo quyết định user — thay biến thể trong suốt và "logo trắng trên hero" của BL-018.

## Acceptance (bắt buộc)
- [x] Design tokens + `docs/DESIGN.md` + `.context/design-spec.md` cập nhật phong cách mới (bo góc, nút viên thuốc, serif viết thường, header nổi kính mờ) với màu TAMI; đạt AA sáng/tối.
- [x] Header: thanh nổi bo tròn kính mờ, menu ngang ≥ xl không nút Menu (BL-019), logo vàng trên nền sáng (BL-018); < xl giữ nút Menu.
- [ ] Trang chủ có đủ các section #1–#11 ở bảng trên (các section quản lý qua global Homepage: bật/tắt + thứ tự như hiện có).
- [ ] Trang danh sách: banner ~240px (BL-017) + băng tìm kiếm gọn + lưới 4 cột ≥ xl; bộ lọc hiện có không mất chức năng (URL params giữ nguyên).
- [ ] Tin tức: hàng theo danh mục + form tư vấn cuối trang.
- [ ] Chi tiết dự án: thẻ tư vấn dính bên phải ≥ lg + tin liên quan; phần cần schema mới tách phase riêng sau khi user duyệt.
- [ ] Responsive mobile (thanh/khối tìm kiếm, slider vuốt được), VI/EN cùng bố cục, không CLS, giữ NFR hiệu năng (LCP).

## Ghi chú
- Làm theo nhiều phase (vd: P1 tokens + header · P2 trang chủ · P3 trang danh sách + tin tức · P4 chi tiết dự án · P5 phần cần schema).
- Liên quan: BL-016 (dropdown), BL-017 (banner), BL-018 (logo vàng), BL-019 (bỏ nút Menu desktop) — nên xử lý gộp/tuần tự trong change này để tránh sửa trùng file.
- Chờ BL-015 (admin UI) xong trước vì đang có nhiều file chưa commit.
