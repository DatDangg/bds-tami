# SPECIFICATIONS.md

<!--
  Dự án làm mới từ đầu (chưa có code): file này được viết tay ngày 16/10/2026 từ thiết kế đã duyệt,
  thay vì reverse-engineer bằng /spec-init. Sau khi build, mọi thay đổi đi qua `/change` (agent change-request).
  Nguồn: docs/BRD.md v1.5 · docs/ARCHITECTURE.md · docs/ERD.md · docs/PERMISSION.md · docs/API_SPEC.md · docs/DESIGN.md
-->

- **spec_version:** 1.29.0
- **updated_at:** 2026-10-20
- **Trạng thái:** đã build (initial build xong), đang vận hành — mọi thay đổi qua `/change` (Change Request); BL-020 đã build đủ P1–P5

## Overview

Website thương hiệu TAMI (BĐS: phân phối, môi giới, khai thác căn hộ dịch vụ). Công ty tự đăng nội dung; khách xem và để lại liên hệ; lead được giao cho sale. Một app Next.js + Payload CMS gồm website công khai và trang quản trị `/admin`.

**Menu:** Trang chủ (= giới thiệu) · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ. **Không có Mua bán.**

**Khung trang:** header ≥ xl một hàng (logo trái · menu ngang giữa · phải: tìm, VI|EN, nút CTA) — **không có nút Menu** (menu ngang là điều hướng duy nhất, như vinhomes.vn desktop — BL-019); < xl có nút Menu mở menu toàn màn hình. Header là thanh **kính mờ sáng** (nền kem ~80% + blur 24px) ở mọi trang kể cả trên hero / banner ảnh (không có biến thể trong suốt), hai hình dạng theo vị trí cuộn (BL-025): **ở đầu trang (chưa cuộn) là thanh phẳng full-width** sát mép trên/trái/phải, góc vuông, không bóng, cao bằng `--header-offset` (80px; ≥ lg 104px), nội dung vẫn trong khung 84rem căn giữa; **khi cuộn xuống thành thanh nổi bo tròn** cách mép 8px (≥ lg 16px), cao 64px (≥ lg 72px), rộng tối đa 84rem, có bóng; cuộn về đầu → phẳng lại; chuyển đổi mượt, tức thì khi `prefers-reduced-motion`; server render trạng thái phẳng. **Ngoại lệ trang chi tiết dự án / chi tiết cho thuê / chi tiết tin đăng BĐS (BL-027, BL-032):** ở đầu trang header phẳng như trên, **cuộn xuống thì header trượt lên ẩn hẳn** (không thành thanh nổi), **không hiện lại khi cuộn lên** — chỉ hiện lại khi về đầu trang hoặc khi focus bàn phím (Tab) vào header; chỉ còn thanh mục con dính **sát đỉnh trang** đúng lề của header nổi (8px; ≥ lg 16px); neo bù `scroll-margin` theo vị trí đó (không chừa chỗ header). Trước khi JS chạy (chưa hydrate) header đầy đủ có thể che thanh mục con — rủi ro user chấp nhận 2026-10-20. Header sticky, chiếm chỗ trong luồng đúng `--header-offset` ở **cả hai** trạng thái (không CLS; hero, thanh dính, `scroll-margin` neo bù theo); trình duyệt không hỗ trợ `backdrop-filter` hoặc `prefers-reduced-transparency` → nền đặc; trên kính chỉ dùng màu chữ `--color-text` (mục đang xem gạch chân màu chữ, ngôn ngữ đang chọn đậm, focus ring màu chữ) (BL-020). Logo lấy từ CMS: header dùng `site-settings.logo`, menu toàn màn hình + footer dùng `logoDark` (thiếu → logo mặc định: bản vàng `/brand/tami-logo-gold.png` trên header, bản trắng ở menu toàn màn hình + footer — BL-018, BL-020); nút CTA lấy từ global `header.ctaButton` — chỉ hiện khi có nhãn ở ngôn ngữ đang xem + link (BR-07). Menu toàn màn hình (chỉ < xl; đang mở mà cửa sổ rộng lên ≥ xl thì tự đóng, nhả khoá cuộn nền) xổ menu con dạng accordion; footer < md cột link dạng accordion (cột Liên hệ luôn mở), ≥ md dạng lưới. Chi tiết: `.context/design-spec.md` §2.1 / §2.2 / §2.4.

**Ngôn ngữ:** website công khai song ngữ **tiếng Việt (mặc định, URL không tiền tố)** và **tiếng Anh (`/en/...`)**; trang quản trị chỉ tiếng Việt. **Giao diện:** bố cục và cảm giác theo market.vinhomes.vn (tinh chỉnh tham chiếu vinhomes.vn của BRD; chỉ bố cục/cảm giác, không sao chép nội dung/ảnh/logo — LGL-04), màu/logo/nội dung của TAMI (`docs/DESIGN.md`): thẻ bo 20px, nút + badge viên thuốc (badge "Đang mở bán" gradient xanh, "Sắp mở bán" gradient vàng, "Đã bàn giao" trung tính), heading serif viết thường weight 400 (EB Garamond + Montserrat), không chữ chìm (watermark); thẻ lưới trên nền sáng (RentalCard, ProjectCard, PostCard, NewsCard) là thẻ trắng bo 20px có viền, hover đổ bóng nhẹ; **mọi thẻ là link** (Dự án, Tin cho thuê, Đăng tin BĐS, Tin tức mọi biến thể, Ưu đãi chi tiết tin đăng, Việc làm, slider dự án trang chủ) khi hover hoặc focus bàn phím: tiêu đề **không gạch chân**, chữ đổi sang vàng thương hiệu `--color-accent-text` (trong khối nền tối thành `#E0BF89`), `transition-colors` (tức thì khi `prefers-reduced-motion`); link khác giữ hover cũ (BL-034) — riêng NewsCard trên nền tối (khối Tin tức trang chủ) giữ thẻ phẳng trong suốt; **trang danh sách** (Dự án, Cho thuê, Đăng tin BĐS, Tin tức, Tuyển dụng + trang danh mục / khu vực) dùng banner gọn cao cố định 240px (FR-ADM-20) và lưới 1 / 2 / 3 / **4 cột (≥ xl)** (BL-020 P3); **chi tiết dự án, chi tiết cho thuê và chi tiết tin đăng BĐS dùng chung một bố cục** (BL-027, BL-032, F2, F3, F4): nền trang vàng nhạt `--color-primary-subtle`, thanh mục con viên thuốc trắng **rộng bằng khung nội dung bên dưới** (khung `max-w-container` + `px-gutter`: mép trái thẳng mép thẻ trắng nội dung, mép phải thẳng mép thẻ tư vấn / liên hệ; < lg thẳng mép thẻ nội dung; nút căn trái, tràn thì cuộn ngang trong thanh — BL-028) (mục đang xem nền `--color-primary` chữ `--color-primary-foreground`), các khối nội dung nằm trong **một thẻ trắng bo góc lớn (~28px)** ngăn bằng đường kẻ, ≥ lg 2 cột với thẻ tư vấn / liên hệ dính cột phải tách riêng — thẻ **không có thanh cuộn riêng** (BL-031): dính `top = min(--sticky-top + 4.5rem, 100dvh − chiều cao thẻ − 1rem)` (chiều cao đo bằng `DetailAsideFit`, biến `--detail-aside-h`), thẻ vừa viewport dính dưới thanh mục con, thẻ cao hơn cuộn theo trang tới khi đáy thẻ cách đáy viewport 1rem rồi dính (không cắt, nút gửi tới được); không JS → dính trên như cũ — < lg thẻ đó nằm sau thẻ nội dung — không nền section xen kẽ tràn viền (BL-020 P4); chi tiết `docs/DESIGN.md` § "Bo góc, kính mờ, gradient (BL-020)". **Ô chọn (select) công khai** (lọc dự án / cho thuê / tuyển dụng, sắp xếp, mặt bằng, `FormField` dạng select) dùng Select TAMI (Radix, theo token: cùng chiều cao/viền/bo góc với input, chữ dài cắt `…` không đè mũi tên, danh sách theo token không tràn màn hình, bàn phím + typeahead, vùng chạm ≥ 44px), không dùng `<select>` gốc của trình duyệt; **ô nhập form công khai** (input, textarea, select Radix + `<select>` gốc progressive, ô file, ô thả CV) bo `--radius-md` (12px) đồng bộ thẻ 20/28px + nút viên thuốc, checkbox bo 6px (= `--radius-md`/2), khung form lead/ứng tuyển mặc định (`LeadFormSlot`) bo `--radius-lg` (16px); admin Payload không đổi (BL-030); giá trị lên URL / submit form như cũ (mục "Tất cả" = giá trị rỗng). Form GET lọc dự án / tuyển dụng / **cho thuê** vẫn lọc được khi không có JS: trước hydrate là `<select>` gốc đã style cùng kiểu, sau hydrate chuyển Select TAMI; không tự gửi khi đổi (nút "Lọc" / "Tìm kiếm"). Băng tìm kiếm Cho thuê là form GET thật: từ khoá + "Loại" lọc được không JS; ô "Khoảng giá" (đặt cặp `priceMin`/`priceMax`) và nút "Bộ lọc" cần JS (BL-020 P3). Admin dùng ô chọn của Payload (react-select), không dùng Radix (BL-016).

## Tech Stack

| Lớp | Công nghệ |
|---|---|
| Ngôn ngữ / runtime | TypeScript, Node.js LTS |
| Web + CMS + API | Next.js (App Router, SSR/ISR) + Payload CMS 3 |
| UI | Tailwind CSS + shadcn/ui; font EB Garamond + Montserrat (`next/font`, subset `vietnamese`) |
| Song ngữ | Payload `localization` (`vi` mặc định, `en`) cho nội dung; `next-intl` cho định tuyến `/en` + chuỗi giao diện |
| Dịch tự động | Claude API (`@anthropic-ai/sdk`), chạy trong Payload Jobs; model cấu hình qua env `TRANSLATION_MODEL` |
| Database | PostgreSQL + PostGIS + `unaccent` + `pg_trgm`; Payload Postgres adapter (Drizzle) |
| Cache / rate limit | Redis (hoặc Valkey) |
| File | SeaweedFS (S3 API) + `@payloadcms/storage-s3`; ảnh resize bằng `sharp` |
| Tác vụ nền | Payload Jobs Queue |
| Hạ tầng | Docker Compose trên server công ty (dùng chung), Nginx có sẵn trên host, Cloudflare (free) |
| Email | Brevo SMTP |
| Bản đồ | OpenStreetMap + MapLibre GL (không cần API key trả phí) |
| Analytics | Google Analytics 4 + Google Search Console (banner đồng ý cookie; chỉ tải GA4 sau khi khách đồng ý, chốt 16/10/2026) |
| Giám sát | Prometheus, Grafana, Loki, GlitchTip, Uptime Kuma |
| CI/CD | GitHub Actions (staging → duyệt → production) |
| Package manager | pnpm |

Lý do lựa chọn: `docs/ARCHITECTURE.md` §3.

## Features

Mã yêu cầu theo `docs/BRD.md`. Mức ưu tiên: mọi FR là **Must**, trừ **Should**: FR-PUB-16 (trang đích khu vực), FR-PUB-17 (khối đối tác), FR-ADM-14 (dashboard), FR-ADM-15 (redirect 301) · **Could**: FR-ADM-16 (hẹn giờ xuất bản). Graph xếp Should/Could vào layer sau Must.

### F1. Trang chủ (giới thiệu TAMI): FR-PUB-01, FR-PUB-17
Các khối Hero slide (1–8; ảnh bắt buộc, video tuỳ chọn từng slide), Về TAMI (kèm số liệu), Dự án nổi bật, Dịch vụ (thẻ ảnh), Ưu đãi nổi bật, Đối tác, banner CTA "Nhận tư vấn", Footer liên hệ. Admin bật/tắt và sắp xếp khối qua global `homepage`.

**Bố cục kiểu market (BL-020 Phase 2):**
- **Thanh thông báo** chỉ ở trang chủ (`/`, `/en`), trên cùng (trên header nổi, trong luồng), mặc định **tắt**; admin bật + chữ (localized) + link tuỳ chọn. Khách đóng được, nhớ theo hash chữ + link theo ngôn ngữ (đổi nội dung → hiện lại), tải lại không nháy.
- **Hero** có nút cuộn xuống tới **ô tìm kiếm đè đáy hero**: tab Cho thuê gửi GET `/cho-thue?q=`; tab Dự án gửi GET `/du-an?province=&status=` (chỉ tham số lọc sẵn có, không có từ khoá); tablist ←/→/Home/End; gửi được khi không JS. Chip "Dự án được quan tâm": CMS ≤ 6 dự án công khai, trống → dự án nổi bật mới nhất; `/en` chỉ dự án có EN.
- **Dự án nổi bật** = slider thẻ lớn ~464×600 bo 20px, khung kính mờ đè ảnh: tên, tỉnh, badge trạng thái, số liệu từ field sẵn có (diện tích đất, tổng số căn, bàn giao — thiếu thì ẩn).
- **Ưu đãi nổi bật** = slider thẻ tin + "Xem thêm" → `/tin-bds`. Đây cũng là "slider banner ưu đãi" của bố cục market — không có khối riêng.
- **Cho thuê** ("Thuê nhà ở & kinh doanh"): tab theo danh mục cho thuê (CMS ≤ 4 danh mục scope cho thuê, kiểm ở server; trống → các danh mục đang có tin), mỗi tab slider ≤ 8 tin còn trống + "Xem thêm" → `/cho-thue/danh-muc/<slug>`; không JS hiện tab đầu.
- **Tin tức** (khối tối): intro + 3 bài (CMS ≤ 3, trống → 3 bài mới nhất) + "Xem tất cả".
- **Banner CTA "Đăng ký tham quan"**: ảnh tràn viền tuỳ chọn (`ctaBanner.image`, thiếu → ảnh nền cũ) qua scrim, chữ trắng đạt AA; nút chính + nút phụ tuỳ chọn (chỉ hiện khi đủ nhãn + link hợp lệ).
- Thẻ dịch vụ (trang chủ + "Dịch vụ khác") bo 20px, chữ trên khung kính.
- `rentals`, `news` tham gia `blockOrder`; khối không nằm trong "Thứ tự khối" thì không hiện — bản ghi trang chủ có sẵn cần admin thêm hai khối này sau khi deploy (không tự thêm, không data migration). Thanh thông báo và ô tìm kiếm có bật/tắt, vị trí cố định.
- Lưu / ẩn / xoá tin cho thuê hoặc tin tức đang/vừa công khai làm mới trang chủ `/vi` `/en` (không làm mới cache toàn site); riêng tin cho thuê và Tin BĐS gắn dự án còn làm mới chi tiết dự án liên quan theo quy tắc ở F2 (BL-020 P4).

### F2. Dự án: FR-PUB-02, FR-PUB-03, FR-ADM-01
Danh sách lọc theo loại hình / tỉnh / trạng thái mở bán, có phân trang, chỉ dự án đã xuất bản. Bố cục `/du-an` (BL-020 P3): băng tìm kiếm gọn đè mép dưới banner 240px gồm **Tỉnh + Trạng thái + nút "Lọc"** (form GET, chạy không JS, đổi ô chọn không tự gửi; không ô từ khoá vì danh sách dự án không có `q`, không nút "Bộ lọc" vì không có lọc phụ); hàng "Có N kết quả" + "Xoá bộ lọc"; lưới 4 cột ≥ xl, ProjectCard thẻ trắng bo 20px (cả "Dự án khác"). Tham số URL, phân trang, canonical không đổi. Chi tiết: tổng quan, chủ đầu tư, điểm nổi bật, bản đồ + tiện ích xung quanh (khoảng cách), tiện ích, mặt bằng, pháp lý (kèm tài liệu PDF), chính sách bán hàng, bảng giá theo loại căn, thư viện ảnh, tin liên quan, câu hỏi thường gặp, form lead (tạo lead gắn dự án).

**Bố cục chi tiết (BL-020 P4 + P5, design-spec S03):** hero ảnh (`priority`, không CLS) + h1 serif viết thường weight 400. **Thanh mục con** dạng viên thuốc trắng rộng bằng khung nội dung (trải qua cả cột thẻ tư vấn ≥ lg, nút căn trái — BL-028) dính sát đỉnh trang (8px; ≥ lg 16px — header ẩn khi cuộn trên trang chi tiết, BL-027; mục đang xem nền vàng `--color-primary` chữ đen `--color-primary-foreground`; neo bù `scroll-margin` để tiêu đề mục không bị thanh che; mục đang xem `aria-current`; cuộn qua hết mục cuối — không mục nào trong dải quan sát và mục cuối nằm hẳn phía trên dải — thì **không nút nào active / `aria-current`**, cuộn ngược vào một mục thì mục đó active lại; ở đầu trang / phía trên mục đầu thì mục đầu giữ active; vừa bấm nút (khoá cuộn ~1s) không bị bỏ active — BL-029; F3 cùng component), theo đúng thứ tự khối trong cột chính: Tổng quan · Nổi bật · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Giá · Thư viện · Tin liên quan · Hỏi đáp (mục chỉ hiện khi khối có nội dung; nhãn mới "Nổi bật / Giá / Hỏi đáp", EN "Highlights / Pricing / FAQ"). **≥ lg:** 2 cột — nội dung bên trái, thẻ **"Tư vấn 1:1"** dính cột phải (hotline + **một** LeadForm duy nhất của trang, `#lead-form`, nguồn `project` gắn dự án; không có thanh cuộn riêng — thẻ vừa viewport dính dưới thanh mục con, cao hơn thì cuộn theo trang tới khi đáy thẻ chạm đáy viewport − 1rem rồi dính, xem Giao diện — BL-031). **< lg:** thẻ đó nằm sau thẻ nội dung (sau Hỏi đáp — hoặc sau khối cuối cùng đang hiện; ngoài thẻ trắng, BL-027), vẫn giữ CTA dính đáy (`ProjectStickyCta`) nhảy tới `#lead-form`. Các khối phân tách bằng đường kẻ (không nền section xen kẽ tràn viền); Thư viện là thẻ tối bo 20px; Mặt bằng tab viên thuốc. **Tài liệu (PDF) là mục con trong khối Pháp lý** (thẻ trắng bo 20px), không còn mục riêng trên thanh mục con; neo `#documents` (nút tài liệu ở hero) vẫn dùng được — mở khối Pháp lý nếu đang thu gọn ở mobile (kể cả bấm lại lần hai) rồi cuộn tới danh sách tài liệu. **"Tin liên quan"** (trong cột chính, sau Thư viện): ≤ 4 tin cho thuê `published` + ≤ 4 Tin BĐS chưa "Đã kết thúc" (BR-06) gắn đúng dự án (`relatedProject`), mới nhất trước, cùng quy tắc công khai như danh sách (`/en` chỉ tin có bản EN); nhóm trống thì ẩn nhóm, cả hai trống thì ẩn khối và mục trên thanh mục con; **không có "Xem thêm"** (không có tham số lọc theo dự án). **CTA "Đăng ký tham quan"** cuối trang (banner tối) → `#lead-form`, nút phụ `tel:` hotline khi có; chữ theo i18n, không field CMS mới. VI/EN cùng bố cục.

**Làm mới chi tiết dự án (BL-020 P4):** khi tin cho thuê hoặc Tin BĐS đang hoặc vừa công khai đổi (xuất bản, sửa, ẩn, xoá, chuyển sang dự án khác) → làm mới trang chi tiết của dự án **cũ và mới**, cả `vi` lẫn `en`; không làm mới danh sách hay trang chủ vì lý do này (trang chủ theo F1). Tin chưa từng công khai (nháp) không kích hoạt. Ưu đãi hết hạn rời khối theo chu kỳ ISR (≤ 1 phút).

**Khối nội dung mở rộng (BL-020 P5):** admin nhập ở tab **"Nội dung mở rộng"** của dự án; mọi field đều tuỳ chọn (dự án cũ lưu / xuất bản như trước, không thêm trường bắt buộc tiếng Anh); khối nào trống thì ẩn cả khối lẫn mục trên thanh mục con.
- **Điểm nổi bật** (≤ 8 hàng): tiêu đề (bắt buộc trong hàng), mô tả, mã icon (lưu; hiện dùng icon chung) → lưới thẻ.
- **Tiện ích xung quanh** (≤ 40 hàng): nhóm (giáo dục · y tế · mua sắm · công viên · giao thông · khác; mặc định "khác"), tên (bắt buộc trong hàng), khoảng cách dạng chữ (vd "1,2 km", "5 phút"; không dịch), toạ độ tuỳ chọn → nằm trong khối Vị trí: tab theo nhóm (ARIA tabs: ←/→ vòng, Home/End, panel focus được; một nhóm thì không dựng tab) + điểm trên bản đồ sẵn có cho hàng có toạ độ; dự án không có toạ độ chỉ hiện danh sách.
- **Bảng giá theo loại căn** (≤ 30 hàng): loại căn (bắt buộc trong hàng), diện tích từ–đến (m²), giá từ–đến (VND), tình trạng (còn hàng · sắp hết · hết hàng), ghi chú; số không âm, "đến" ≥ "từ" khi có cả hai (server validate); kèm **ngày cập nhật giá** `priceUpdatedAt` (hiện `dd/MM/yyyy`). Giá hiện rút gọn ("3 tỷ – 4 tỷ"); chỉ có một đầu → "Từ …" / "Đến …"; không có giá → **"Liên hệ"**; giá trị **0 coi như chưa nhập**. Bảng cuộn ngang trong khung ở mobile, không tràn trang. Không quản lý quỹ căn từng căn.
- **Câu hỏi thường gặp** (≤ 20 hàng): câu hỏi + trả lời (cả hai bắt buộc trong hàng) → accordion `<details>/<summary>` + JSON-LD `FAQPage` theo **ngôn ngữ của trang**, không fallback.
- **Pháp lý** không thêm field: gộp `legalInfo` + tài liệu PDF sẵn có thành một khối; "Chính sách bán hàng" giữ khối riêng cạnh Pháp lý.
- `/en`: hàng nào thiếu chữ tiếng Anh thì bỏ khỏi trang (không rơi về tiếng Việt, không ô trống); khối không còn hàng nào thì ẩn.

### F3. Cho thuê: FR-PUB-04, FR-PUB-05, FR-PUB-16, FR-ADM-02
Danh sách có bộ lọc (danh mục, tỉnh, phường, giá/tháng, diện tích, phòng ngủ, nội thất, từ khoá không dấu, sắp xếp), bộ lọc nằm trên URL. Bộ lọc p95 ≤ 500ms. Bố cục danh sách (`/cho-thue`, trang danh mục, trang khu vực — BL-020 P3): **băng tìm kiếm gọn** đè mép dưới banner 240px gồm ô từ khoá + "Loại" (= danh mục `category`) + "Khoảng giá" (4 mức gợi ý < 5tr · 5–10tr · 10–20tr · > 20tr, đặt cặp `priceMin`/`priceMax`; khoảng tự nhập thì ô hiện "Khoảng giá tuỳ chọn") + nút **"Bộ lọc"** + nút "Tìm kiếm". "Bộ lọc" mở Popover (≥ lg, có nút Đóng) / Sheet (< lg) chứa lọc phụ (tỉnh, phường, khoảng giá tự nhập, diện tích, phòng ngủ, nội thất); nút có **badge** đếm lọc phụ đang bật (tỉnh, phường, diện tích, phòng ngủ, nội thất, khoảng giá tự nhập — từ khoá, Loại, mốc giá gợi ý không tính). **Sắp xếp** nằm ở hàng "Có N kết quả" (dùng chung bản nháp lọc đang sửa); lưới 1 / 2 / 3 / 4 cột (4 ≥ xl), RentalCard thẻ trắng bo 20px; **bỏ thanh lọc dính đáy màn hình mobile** (thay bằng băng tìm kiếm đầu trang). Tham số URL (tên, giá trị, `page`), phân trang, canonical, quy tắc `noindex` không đổi. Chi tiết gồm thư viện ảnh (tối thiểu 3 ảnh khi xuất bản), video, mã tin, giá/tháng, diện tích, phòng ngủ/WC, tầng, hướng, nội thất, mô tả, vị trí, điều khoản thuê (thời hạn tối thiểu, cọc, kỳ thanh toán, dịch vụ bao gồm, ngày trống), sale phụ trách, form lead, tin tương tự. **Bố cục chi tiết (BL-027, design-spec S07):** cùng khung với chi tiết dự án (Giao diện) — đầu trang breadcrumb → băng "Đã thuê" (nếu có) → thư viện ảnh (ảnh LCP; tin đã thuê: "Căn tương tự đang trống" ngay sau) → khoảng 32px (`pb-8`, BL-031 — khối liền trước thanh mục con, kể cả khối tin tương tự của tin đã thuê) → thanh mục con **Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý** (mục chỉ hiện khi khối có dữ liệu; Tổng quan = tiêu đề h1 + mã tin/ngày đăng/địa chỉ + thông số chính + chi tiết) → thẻ trắng chứa các khối theo thứ tự đó; thẻ liên hệ (giá, sale/hotline, form lead `source=rental` duy nhất) là thẻ trắng dính ≥ lg (không thanh cuộn riêng, BL-031), < lg nằm sau thẻ nội dung (thanh dính đáy vẫn dẫn tới `#lead-form`) → Tin tương tự. Mã tin `CT-xxxxxx`. Trạng thái `draft/published/hidden/rented`; tin đã thuê vẫn giữ trang, có nhãn "Đã thuê" và gợi ý tin tương tự, gắn `noindex, follow` và không vào sitemap. Nút tìm kiếm trên header dẫn tới `/cho-thue?q=` (giai đoạn 1 không có tìm kiếm toàn site).

### F4. Đăng tin BĐS: FR-PUB-06, FR-PUB-07, FR-ADM-03
Bài dạng tin (tin BĐS, voucher, ưu đãi) theo danh mục; trường tuỳ chọn giá, khu vực, dự án / tin cho thuê liên quan, hạn ưu đãi + mã voucher. Có form lead. Danh sách `/tin-bds` + trang danh mục (BL-020 P3): banner gọn 240px, **không có băng tìm kiếm** (trang không có từ khoá / lọc / sắp xếp sẵn; thêm tham số mới ngoài phạm vi), hàng "Có N kết quả" (tổng bài, tính cả bài nổi bật), lưới 1 / 2 / 3 / 4 cột (4 ≥ xl); PostCard thẻ trắng bo 20px ở mọi nơi dùng (slider Ưu đãi trang chủ, bài liên quan). Phân trang, canonical không đổi. **Đồng bộ danh sách Dự án / Cho thuê (BL-032):** bài nổi bật (vẫn đứng đầu trang 1, ảnh LCP) là **thẻ đầu của lưới** như mọi thẻ khác (bỏ thẻ ngang lớn 7/5); hàng "Có N kết quả" + lưới nằm trong một `section` có nhãn như `/du-an`; PostCard cùng kiểu chữ/tỉ lệ với RentalCard / ProjectCard (ảnh 4:3, tiêu đề serif `text-h4` tối đa 2 dòng); trạng thái trống có tiêu đề riêng ("Chưa có tin đăng" / trong danh mục + nút về `/tin-bds`). Quá hạn ưu đãi thì gắn "Đã kết thúc" và rời khối "Ưu đãi nổi bật" (BR-06). **Chi tiết bài (BL-032):** dùng **cùng khung chi tiết chung** với dự án / cho thuê (Giao diện — `DetailLayout`): breadcrumb → ảnh bìa (bo 20px, rộng khung nội dung, ảnh LCP) → khoảng 32px → thanh mục con **Tổng quan · Ưu đãi · Nội dung · Hình ảnh** (mục chỉ hiện khi có dữ liệu; Tổng quan = danh mục + tiêu đề h1 + ngày đăng + chia sẻ) → thẻ trắng chứa các khối theo thứ tự đó; thẻ liên hệ (nút gọi hotline nếu có + form lead `source=property_post` duy nhất, tiêu đề "Nhận tư vấn") dính cột phải ≥ lg (không thanh cuộn riêng, `DetailAsideFit`), < lg nằm sau thẻ nội dung + thanh "Nhận tư vấn" dính đáy dẫn tới form → Tin liên quan (nền xám, ngoài thẻ). Header ẩn khi cuộn như chi tiết dự án / cho thuê. Chia sẻ (Facebook, Zalo, sao chép link) **một cụm trong khối Tổng quan**: < sm 1 nút "Chia sẻ" Web Share API (fallback menu), ≥ sm hàng ngang — **bỏ cụm chia sẻ dính lề trái ≥ xl** (khung mới không còn lề trái cột chữ). JSON-LD `Article` + breadcrumb, URL, dữ liệu không đổi (design-spec S08 / S09).

### F5. Tin tức: FR-PUB-08, FR-ADM-04
Tin tức chung theo danh mục, có tags, bài liên quan. Bố cục danh sách (BL-020 P3, design-spec S10): banner gọn 240px (không băng tìm kiếm) + hàng danh mục dạng viên thuốc là **link** (`aria-current` ở mục đang xem; không phải ARIA tabs). **Trang 1 `/tin-tuc`:** "Tin nổi bật" (1 bài lớn + 4 bài; bài `isFeatured` trước rồi mới nhất) → mỗi danh mục cấp 1 một hàng ≤ 4 bài (gồm bài của danh mục con; tối đa 6 hàng; không loại trùng giữa các hàng) + "Xem thêm" tới trang danh mục → "Tin khác" (bài mới nhất chưa hiện + lưới trang 1 cũ, trừ bài đã ở "Tin nổi bật" — không bài nào mất khỏi chuỗi phân trang) → phân trang → form "Tư vấn nhu cầu". **Trang ≥ 2 (`?page=N`):** lưới phân trang (4 cột ≥ xl) như cũ + form. **Trang danh mục** (`/tin-tuc/danh-muc/[category]`): banner gọn + lưới 4 cột, **không form**. Tham số URL (`page`), offset phân trang, canonical, metadata không đổi. NewsCard lưới trên nền sáng là thẻ trắng bo 20px có viền; trên nền tối (khối Tin tức trang chủ) giữ thẻ phẳng trong suốt. **Thu lead:** form "Tư vấn nhu cầu" (LeadForm nguồn `contact`, consent + Turnstile + rate limit, admin giao) ở cuối **mọi trang `/tin-tuc`** (`/en/news`, kể cả `?page=N`); trang danh mục và **chi tiết tin tức không có form** (BL-020 P3). **Chi tiết tin tức `/tin-tuc/[slug]` (BL-033, design-spec S11):** khung chi tiết chung (`DetailLayout`, nền `--color-primary-subtle`, header ẩn khi cuộn như chi tiết dự án / cho thuê / tin đăng; không thanh mục con viên thuốc): breadcrumb → MỘT thẻ trắng bo 28px chứa danh mục, h1, ngày + thời gian đọc, ảnh bìa (bo 20px), nội dung, tags, chia sẻ; **Bài liên quan** ngoài thẻ, phía dưới. **Mục lục** tự sinh từ `h2`/`h3` cấp gốc của nội dung (id ổn định = slug tiếng Việt bỏ dấu của chữ tiêu đề, trùng thêm `-2`, `-3`…, rỗng → `muc-N`; không đổi dữ liệu CMS): ≥ lg cột trái dính `top: var(--sticky-top)`, mục đang đọc được đánh dấu (`aria-current`), bấm cuộn tới heading có bù `scroll-margin`, danh sách dài giới hạn cao theo viewport và cuộn riêng trong khung; < lg khối gập "Mục lục / Contents" (đóng mặc định) đầu thẻ, trước nội dung; bài không có heading → không có mục lục, không chừa cột trống. URL, metadata, canonical, JSON-LD `Article` không đổi.

### F6. Tuyển dụng: FR-PUB-09, FR-ADM-05
Danh sách việc (tự ẩn khi quá hạn nộp; mở URL trực tiếp thì hiện băng "đã hết hạn", ẩn form, `noindex`, bỏ JSON-LD), chi tiết, form nộp CV (PDF/DOC/DOCX ≤ 5MB; màn ≥ md có thêm vùng kéo-thả tệp cạnh nút "Chọn tệp", kiểm đuôi + dung lượng như khi chọn tệp; khi gửi, nút hiện % tiến trình tải lên thật và trình đọc màn hình đọc được — design-spec §3.4). Admin quản lý hồ sơ (`new/reviewing/interview/hired/rejected`). JSON-LD `JobPosting`.

### F7. Dịch vụ, Liên hệ, trang pháp lý: FR-PUB-10, 11, 14
Trang dịch vụ (Phân phối, Môi giới, Khai thác CHDV), trang liên hệ (form, bản đồ, hotline), chính sách bảo mật, điều khoản.

### F8. Nút liên hệ nổi: FR-PUB-12
Hotline / Zalo / Fanpage ở góc dưới phải mọi trang; ghi nhận lượt bấm.

### F9. Lead: FR-PUB-13, FR-ADM-09, FR-ADM-10; BR-10…16
Form lead ở tin cho thuê, bài Đăng tin BĐS, dự án, trang liên hệ, trang danh sách Tin tức `/tin-tuc` (form "Tư vấn nhu cầu", nguồn `contact` — BL-020 P3); consent bắt buộc; Turnstile + rate limit; chống trùng 7 ngày; tự giao cho sale đăng bài (tin cho thuê / bài Đăng tin BĐS), còn lại admin giao; email thông báo; nhắc lead chưa giao sau 30 phút; trạng thái `new/contacted/consulting/won/lost/spam`, chuyển `lost` bắt buộc nhập lý do (BR-11); admin giao lại thì email cho sale mới (BR-13); nhắc admin khi lead `new` chưa có người phụ trách sau 30 phút **giờ hành chính** (BR-14, định nghĩa ở § Quy tắc biên); lịch sử chăm sóc; xuất Excel (admin, ghi audit log; xuất đúng bộ lọc đang áp trong danh sách lead — trạng thái / nguồn / sale phụ trách với toán tử "bằng", ngày tạo với "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng", điều kiện của chip lọc nhanh Trạng thái lead (`status` "nằm trong" tập trạng thái hợp lệ, "chưa có sale phụ trách" — BL-022), **kể cả khi đang có từ khoá ở ô tìm kiếm** — server tự dựng điều kiện tìm trên đúng tập trường của danh sách (mã, họ tên, SĐT mọi dạng, email; từ khoá ≤ 100 ký tự, quá → 400) nên file ra đúng tập lead đang thấy; audit chỉ ghi cờ có tìm kiếm, không ghi từ khoá (BL-021); bộ lọc khác thì nút khoá kèm thông báo nêu rõ các toán tử được hỗ trợ; nút không hiện ở thùng rác và trong cửa sổ chọn lead (list drawer)). UTM (`utm_source/medium/campaign/term/content`) được ghi ở **mọi** trang công khai VI/EN (island client ở khung trang, không làm trang thành dynamic) vào `sessionStorage` của phiên — URL mới có UTM ghi đè bản đã lưu, URL không có UTM không ghi; form lead gửi kèm UTM của URL hiện tại, không có thì bản đã lưu (BR-10, design-spec §3.3). Phân công chỉ sinh activity/email/audit ở **một** nơi (hook `leads.afterChange`, `docs/API_SPEC.md` §5).

### F10. Quản trị: FR-ADM-06, 07, 08, 11, 12, 13, 14, 15, 16, 19, 20
Danh mục cha–con theo từng loại nội dung (danh mục đang có nội dung thì không xoá được), chủ đầu tư, dịch vụ (chỉ admin), trang pháp lý (chỉ admin, `docs/ERD.md` §4.9b), menu/footer/cấu hình chung, tài khoản sale, thư viện ảnh (ảnh ≤ 10MB, tự resize WebP), audit log, dashboard, redirect 301, hẹn giờ xuất bản, lịch sử phiên bản, xoá mềm. Nội dung xuất bản/sửa lên trang công khai trong ≤ 1 phút (BRD §7.2).

**FR-ADM-19 — Giao diện quản trị** (BL-015, design `docs/specs/2026-10-19-admin-ui-saas-design.md`): `/admin` theo phong cách gọn kiểu SaaS — nền/viền trung tính ấm, màu nhấn TAMI `#8C6733` (tối `#E0BF89`) chỉ cho nút chính/link/focus/mục đang chọn; mọi cặp chữ/nền ≥ 4.5:1 và biên điều khiển ≥ 3:1 ở cả sáng lẫn tối (token có test contrast tự động); ô chọn (select) admin cùng một style. Menu trái chia 7 nhóm nghiệp vụ tiếng Việt (Khách hàng · Nội dung · Tuyển dụng · Thư viện · Danh mục · Website · Hệ thống), không icon, quyền xem từng mục giữ nguyên. **Toàn bộ nhãn admin tiếng Việt**: mọi collection có `labels`, mọi field hiển thị có `label`, hàng array có nhãn (test quét config chặn thiếu nhãn). Màn Tổng quan tuỳ biến: thẻ đếm nhanh (admin: lead mới, lead chưa phân công, hồ sơ ứng tuyển mới, nội dung đang hiển thị; sale: lead mới được giao, lead đang xử lý, bản nháp của mình, tin đang đăng — không so sánh theo ngày), lối tắt tạo nội dung, lead mới nhất + bản sửa gần đây; số đếm bằng Local API theo quyền người xem (`overrideAccess: false`), collection không có quyền đọc/tạo thì không hiện thẻ/lối tắt; FR-ADM-14 (biểu đồ, lượt bấm, chi phí dịch) cắm vào khung này sau. Danh sách: badge trạng thái có chữ, thumbnail 40px (dự án/cho thuê = ảnh đầu `gallery`, tin BĐS/tin tức = `cover`), dòng 48px. **Danh sách admin (BL-021):** ô tìm kiếm Lead theo mã, họ tên, SĐT (gõ `0956789012` / `0956 789 012` / `+84956789012` đều ra) và email — sale vẫn chỉ thấy lead được giao; ô tìm kiếm Tin cho thuê theo mã tin, tiêu đề, địa chỉ (mọi tài khoản nội bộ). "Thêm bộ lọc" của Cho thuê / Dự án / Đăng tin BĐS / Tin tức / Lead chỉ còn trường nghiệp vụ (ẩn SEO, bản dịch, slug, nội dung dài, media, toạ độ, trường kỹ thuật); bộ lọc quan hệ (vd "Thuộc dự án") hiện đúng tên sau khi tải lại trang. Cột tiền VNĐ dạng `110.000.000 ₫` (sắp xếp/lọc vẫn theo số), ô trống hiện `—`, cột Sale phụ trách hiện họ tên ngay (không "Đang tải..."), ngày giờ admin `dd/MM/yyyy HH:mm`. Thanh công cụ danh sách: nút "Xuất Excel" (Lead) và ô "Trạng thái dịch" (danh sách nội dung) nằm trong lề trang, ngay dưới hàng tìm kiếm / Hiển thị cột / Bộ lọc, cùng một hàng (tự xuống dòng khi hẹp, không tràn ngang ở 375px, vùng bấm ≥ 44px); lọc ra 0 kết quả vẫn thấy ô lọc dịch để bỏ lọc. **Chip lọc nhanh (BL-022):** thanh chip 1 chạm phía trên bảng (trong thanh công cụ, cuộn ngang khi hẹp, không tràn trang ở 375px; mỗi chip là nút `aria-pressed`, nhóm có nhãn, thao tác được bằng bàn phím, đạt AA sáng/tối). Mỗi nhóm chọn 1, bấm lại chip đang chọn hoặc `Tất cả` = bỏ lọc nhóm đó; các nhóm AND với nhau và với bộ lọc / tìm kiếm / Lọc dịch đang có (ghép vào **từng** nhánh "hoặc" của bộ lọc, không làm mất điều kiện khác). Chip ghi điều kiện vào `where` trên URL (F5 / chia sẻ link giữ nguyên); chip sáng khi mọi nhánh chứa đúng điều kiện của chip — tự sửa bộ lọc trên cùng trường thì chip bỏ sáng; chọn chip thay mọi điều kiện cùng trường của nhóm đó (Lead: chip luôn thay điều kiện `status`; chỉ chip `Mới (chưa giao)` thay thêm điều kiện `assignedTo`, rời chip đó chỉ bỏ `assignedTo` "chưa có" — bộ lọc "Sale phụ trách" tay được giữ với các chip khác). **Tin cho thuê:** Trạng thái (`Tất cả` · `Đang cho thuê` = `published` · `Đã thuê` = `rented` · `Nháp` = `draft`; `hidden` chỉ ở `Tất cả`), Số phòng ngủ (`Tất cả` · `Studio` = 0 · `1 PN` · `2 PN` · `3 PN+` = ≥ 3), Khoảng giá `priceMonthlyVnd` (`Dưới 10tr` < 10.000.000 · `10 – 20tr` 10.000.000 ≤ x < 20.000.000 · `20 – 50tr` 20.000.000 ≤ x ≤ 50.000.000 · `Trên 50tr` > 50.000.000; nhóm giá không có chip `Tất cả`); tin chưa nhập số PN / giá không lọt chip nào của nhóm đó. **Lead:** Trạng thái (`Tất cả` · `Mới (chưa giao)` = `new` VÀ chưa có sale phụ trách · `Đang tư vấn` = `contacted` hoặc `consulting` · `Đã chốt` = `won` · `Không thành` = `lost`; `spam` chỉ ở `Tất cả`); chip không nới quyền (sale vẫn chỉ thấy lead được giao). Không có chip diện tích; không áp cho Dự án / Đăng tin BĐS. Form: tab không tên / `row` / `collapsible`, trường phụ ở sidebar phải. Ràng buộc: **không đổi schema/DB, access control, không thêm endpoint** (không sinh migration; riêng tham số lọc của endpoint xuất lead mở rộng theo F9 — `search` BL-021, chip trạng thái BL-022); responsive không vỡ ở 390px.

**FR-ADM-20 — Ảnh banner trang danh sách** (BL-017, design-spec §2.7 / §6.3): global `site-settings` (Cài đặt website) có nhóm "Ảnh banner trang danh sách" gồm 1 ảnh **mặc định** + 1 ảnh riêng cho từng trang danh sách công khai: Dự án (`/du-an`), Cho thuê (`/cho-thue`), Đăng tin BĐS (`/tin-bds`), Tin tức (`/tin-tuc`), Tuyển dụng (`/tuyen-dung`) — upload ảnh từ `media`, nhãn tiếng Việt, chỉ admin sửa, **không localized** (VI và EN cùng ảnh). Trang danh sách: có ảnh riêng → page banner biến thể Ảnh; không có → ảnh mặc định; không có cả hai → biến thể Chữ như cũ. Trang danh mục con (`/<loại>/danh-muc/[category]`) dùng ảnh của trang danh sách cha. Biến thể Ảnh: scrim đảm bảo chữ trắng đạt AA kể cả trên ảnh rất sáng, ảnh `priority` (LCP), khung cao cố định nên không CLS. Ràng buộc: schema chỉ thêm các field upload mới (migration versioned, additive); không đổi quyền/API khác. **Banner gọn (BL-020 P3):** trang danh sách (Dự án, Cho thuê, Đăng tin BĐS, Tin tức, Tuyển dụng) và trang danh mục / khu vực của chúng dùng banner cao cố định 240px (`PageBanner size="compact"`, cả biến thể Ảnh lẫn Chữ); chỉ trang có băng tìm kiếm đè mép dưới banner (Cho thuê, Dự án) mới có đệm đáy ~3rem cho băng (`overlap`), trang khác không đệm; trang pháp lý / liên hệ / dịch vụ / 404 giữ cỡ banner mặc định. Header trên banner ảnh là thanh kính mờ sáng như mọi trang (xem Khung trang). Trang Liên hệ và trang chi tiết dịch vụ không dùng nhóm ảnh này.

### F11. SEO: FR-PUB-15, NFR-03
SSR/ISR, URL tiếng Việt không dấu + URL tiếng Anh `/en/...`, meta + OG theo từng ngôn ngữ, `hreflang` (`vi`, `en`, `x-default`), `<html lang>`, `sitemap.xml` gồm cả hai bản, `robots.txt`, breadcrumb, JSON-LD (`Organization`, `RealEstateListing`, `Article`, `JobPosting`, `FAQPage` ở chi tiết dự án có câu hỏi thường gặp, có `inLanguage`), redirect 301 khi đổi slug (theo từng ngôn ngữ).

### F12. Song ngữ Việt – Anh: FR-PUB-18, FR-PUB-19, FR-ADM-17, FR-ADM-18; BR-05, BR-07, BR-08, BR-17
- URL: tiếng Việt không tiền tố, tiếng Anh `/en` + đường dẫn tiếng Anh (bảng `docs/BRD.md` §2.1). Không tự chuyển theo ngôn ngữ trình duyệt; nhớ lựa chọn bằng cookie `NEXT_LOCALE`.
- Nội dung: các trường chữ (tiêu đề, slug, mô tả, nội dung, SEO, tên danh mục, menu/footer, khối trang chủ, alt ảnh) có bản `vi` và `en` (Payload `localized: true`); số, giá, quan hệ, trạng thái, địa danh dùng chung. Danh sách trường: `docs/ERD.md` §1.1.
- Trường `hasEnglish` ("Đã có bản tiếng Anh") trên mỗi nội dung: hệ thống tự bật khi đủ trường bắt buộc tiếng Anh; `/en` chỉ hiện nội dung có `hasEnglish = true`, **không** fallback sang tiếng Việt (chưa có thì 404 + không vào sitemap EN).
- **AI tự dịch** (BR-08): lưu bản `vi` đang `published` (hoặc global) → job `translate-content` gọi Claude API dịch các trường localized đã đổi (richText dịch từng đoạn chữ, giữ cấu trúc), sinh slug `en`, bật `hasEnglish`, xoá cache trang `/en`. Bản `en` đã sửa tay (`translation.enSource = manual`) không bị dịch đè; bản `vi` đổi sau đó thì gắn `translation.viChangedAfterManual`. Nút "Dịch lại bằng AI" trong admin. Trang pháp lý: AI dịch nháp, admin duyệt mới bật `hasEnglish`; bản EN đã duyệt mà bị sửa tay nội dung EN (không qua lệnh duyệt) → tắt `hasEnglish` (ẩn `/en`) tới khi admin duyệt lại, lưu không đổi nội dung EN thì giữ duyệt. Bảng thuật ngữ ở `site-settings.translationGlossary`. Bản tiếng Anh lên web trong ≤ 10 phút sau khi xuất bản. Lỗi: thử lại 3 lần, vẫn lỗi → `translation.status = failed` + cảnh báo dashboard. Admin lọc danh sách nội dung theo trạng thái dịch (chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đã đổi sau khi sửa tay, FR-ADM-18) — ô lọc "Trạng thái dịch" là ô chọn react-select của Payload (`SelectInput`, xoá được = "Tất cả", cùng style ô lọc Payload, BL-016); chọn/đổi/bỏ mục dịch giữ nguyên mọi bộ lọc khác đang áp (kể cả bộ lọc nhiều nhánh "hoặc" của Payload, BL-021). Hạn mức chi phí tháng qua env; vượt thì dừng dịch và báo admin. **Chỉ gửi nội dung công khai**, không gửi lead/CV.
- Chuỗi giao diện tiếng Anh (`en.json`) do AI dịch một lần lúc làm code, review trong PR.
- Chuỗi giao diện (menu cố định, nút, nhãn, lỗi form, thông báo, nhãn enum như nội thất / hướng nhà) ở `src/i18n/messages/{vi,en}.json`.
- Định dạng số/ngày theo ngôn ngữ (`Intl`); tiền luôn VNĐ.
- Nút chuyển ngôn ngữ đưa tới trang tương ứng; không có bản dịch thì về trang danh sách / trang chủ.
- Lead và hồ sơ ứng tuyển lưu `locale` khách đã dùng; email nội bộ luôn tiếng Việt.
- Admin (Payload) giao diện tiếng Việt; chuyển VI / EN khi soạn bài bằng bộ chọn locale có sẵn của Payload.
- Hàng trong các khối nội dung mở rộng của dự án (F2, BL-020 P5) có chữ `vi`/`en` riêng và nằm trong danh sách trường AI tự dịch; hàng thiếu chữ EN bị ẩn ở `/en`; dự án đã sửa tay bản EN (`enSource = manual`) không tự dịch hàng mới — nhập tay EN hoặc "Dịch lại bằng AI".
- REST đọc collection nội dung không kèm `locale` → đọc theo `vi` (không còn trả trường chữ `null`); `locale=en` / `locale=all` giữ nguyên, vẫn không fallback (BR-07, BL-021).

### Ngoài phạm vi
Mua bán, tài khoản người ngoài / tự đăng tin, kiểm duyệt, báo cáo vi phạm, VIP / thanh toán, hoa hồng, CRM, app mobile, ngôn ngữ thứ 3 trở lên, dịch chiều Anh → Việt, dịch dữ liệu khách gửi, giao diện admin tiếng Anh, tìm theo bản đồ, autocomplete, quỹ căn chi tiết từng căn, phân khu dự án.

## API Endpoints

Chi tiết: `docs/API_SPEC.md`.

| Method | Path | Quyền |
|---|---|---|
| `POST` | `/api/public/leads` | Khách (Turnstile + rate limit) |
| `POST` | `/api/public/job-applications` | Khách (Turnstile + rate limit) |
| `GET` | `/api/public/rentals` | Khách |
| `POST` | `/api/public/click-events` | Khách |
| `GET` | `/api/health` | — |
| `GET` | `/api/admin/leads/export` | admin |
| `POST` | `/api/admin/leads/:id/assign` | admin |
| `GET` | `/api/admin/private-files/:id/download` | admin |
| `GET` | `/api/admin/dashboard` | admin, sale (phạm vi của mình) |
| `POST` | `/api/admin/translations/:collection/:id` | admin, sale (bài của mình) — "Dịch lại bằng AI" |
| * | `/api/<collection>` | REST tự sinh của Payload, bảo vệ bằng `access` |

## Database Schema

Chi tiết trường, index, quy tắc: `docs/ERD.md`.

- **Tài khoản:** `staff` (`admin` | `sale`)
- **Danh mục nền:** `provinces` (34), `wards` (kèm tên cũ), `categories` (theo `scope`, cha–con), `developers`
- **Nội dung:** `projects`, `rentals`, `property-posts`, `news`, `services`, `job-postings`, `pages`
- **Khách hàng:** `leads`, `lead-activities`, `job-applications`
- **File:** `media` (public), `private-files` (CV)
- **Hệ thống:** `audit-logs`, `click-events`, `click-stats-daily`, `redirects`, `payload-jobs`, `translation-usage`
- **Globals:** `site-settings`, `homepage`, `header`, `footer`
- Khoá UUID; mã hiển thị riêng (`CT-`, `LD-`); tiền là số VNĐ; xoá mềm; versions; tìm kiếm `unaccent` + `pg_trgm`.

## Authentication

- Payload auth trên collection `staff` (session cookie HttpOnly). Khách không có tài khoản.
- 2 vai trò `admin` (BRD: 1 tài khoản; hệ thống cho phép thêm, luôn còn ít nhất 1) và `sale`. Sale tạo dự án, tin cho thuê, Đăng tin BĐS, tin tức, tuyển dụng; sửa/xoá bài của mình ⚠️; chỉ thấy lead được giao. **Dịch vụ và trang pháp lý chỉ admin** (chốt 16/10/2026). Ma trận đầy đủ: `docs/PERMISSION.md`.
- Khoá tạm sau 5 lần sai; lớp xác thực thứ 2 bằng Cloudflare Access trước `/admin`; session hết hạn sau 8 giờ không hoạt động (Payload `tokenExpiration` tính theo thời gian tuyệt đối → admin UI làm mới token khi còn hoạt động; ghi residual risk nếu không làm được).
- Để dành collection `members` cho người đăng bên ngoài (chưa tạo).

## Business Rules

Theo `docs/BRD.md` §4: BR-01…08 (nội dung; BR-07 hiển thị bản tiếng Anh, BR-08 AI tự dịch), BR-10…17 (lead, gồm BR-17 ngôn ngữ của lead), BR-20…21 (tuyển dụng), BR-30…32 (dữ liệu cá nhân).

Đã chốt: A5 song ngữ Việt – Anh (tiếng Việt mặc định, admin chỉ tiếng Việt, bản tiếng Anh do AI tự dịch và tự lên web, nhân viên sửa tay được; trang pháp lý admin duyệt).

Giả định đang áp dụng (⚠️, chỉnh qua `/change`): A1 sale chỉ sửa bài của mình · A2 gộp lead trùng 7 ngày · A3 nhắc lead chưa giao sau 30 phút · A4 lưu lead 24 tháng, CV 12 tháng · A6 thiết kế cho 100.000 tin / 1.000 người đồng thời.

## Non-functional Requirements

Nguồn: `docs/BRD.md` §5 (NFR) và §6 (LGL).

| Mã | Yêu cầu |
|---|---|
| NFR-01 | Core Web Vitals "Good" ở p75 mobile: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. API lọc p95 ≤ 500ms |
| NFR-02 | App stateless, scale ngang; mục tiêu 100.000 tin / 1.000 người đồng thời (§ Scalability Profile) |
| NFR-03 | SEO: SSR/ISR (F11) |
| NFR-04 | Bảo mật: HTTPS, OWASP Top 10, header CSP / HSTS / X-Frame-Options / Referrer-Policy, kiểm tra MIME thật khi upload, Turnstile + rate limit form, lớp xác thực thứ 2 cho `/admin`, CV không có link công khai (`docs/ARCHITECTURE.md` §7) |
| NFR-05 | Backup ngoài server, RPO ≤ 15 phút, RTO ≤ 4 giờ, diễn tập khôi phục 6 tháng/lần |
| NFR-06 | Uptime ≥ 99.5%/tháng |
| NFR-07 | Responsive mobile-first; WCAG 2.1 mức A, mục tiêu AA cho trang chính (trang chủ, danh sách/chi tiết dự án và cho thuê, liên hệ) |
| NFR-08 | Chrome, Safari, Edge, Firefox (2 bản gần nhất) + trình duyệt trong Zalo / Facebook |
| NFR-09 | Phần mềm tự host đều là mã nguồn mở. Dịch vụ ngoài chỉ dùng gói **miễn phí** (Cloudflare, Turnstile, Cloudflare Access, Brevo, GA4, Search Console); trả phí chỉ có tên miền (và email nếu vượt gói free) và Claude API (hạn mức tháng qua env) |
| NFR-10 | Staging tách biệt production; CI/CD; tài liệu kiến trúc và dữ liệu |
| LGL-01…04 | Địa giới 2 cấp (34 tỉnh, lưu tên cũ); trường pháp lý cho dự án / tin cho thuê; bảo vệ dữ liệu cá nhân (BR-30…32); không sao chép nội dung tham khảo |

## Quy tắc biên (edge cases)

Các quy tắc dưới đây là ⚠️ giả định mặc định để build, chỉnh qua `/change`:

- **Giờ hành chính** (BR-14): 08:00–17:30, thứ 2 – thứ 7, giờ Việt Nam; chưa trừ ngày lễ. Lead tới ngoài giờ thì đếm 30 phút từ đầu giờ làm kế tiếp.
- **Sale bị khoá** (`active = false`): lead đang giao giữ nguyên người phụ trách và hiện cảnh báo "sale đã khoá" cho admin để giao lại; lead mới từ tin của sale đó chờ admin giao (BR-12). Trang tin công khai thay "Sale phụ trách" bằng hotline chung.
- **Tin "Đã thuê"**: form vẫn nhận lead với tiêu đề "Nhận tư vấn căn tương tự"; lead gắn nguồn là tin đó.
- **Globals chưa có bản tiếng Anh**: `header` / `footer` thiếu bản EN thì `/en` dùng menu cố định trong `en.json`; khối trang chủ chưa có bản EN thì ẩn khối đó ở `/en` (không lấy chữ tiếng Việt, BR-07). Ngoại lệ khối **Cho thuê** / **Tin tức** trang chủ (BL-020): tiêu đề khối tuỳ chọn — trống ở ngôn ngữ đang xem thì dùng tiêu đề mặc định i18n (kể cả EN); khối chỉ ẩn ở `/en` khi không có tin / bài nào có bản EN.
- **Hẹn giờ xuất bản** (FR-ADM-16): bài `published` có `publishedAt` ở tương lai thì chưa hiện công khai; job Payload chạy mỗi phút revalidate các bài vừa tới giờ.
- **Đổi tên tỉnh / phường (tên, tên cũ) / dự án**: `searchText` của các tin cho thuê thuộc phạm vi đó được dựng lại để tìm kiếm không dấu khớp tên mới. ≤ 500 tin → làm ngay trong lần lưu; > 500 tin → xếp 1 job nền Payload Jobs (`reindex-rentals-search`, xử lý theo lô, idempotent, thử lại theo cấu hình Jobs) và form admin của bản ghi đó hiện cảnh báo "đang dựng lại chỉ mục tìm kiếm ở chế độ nền" tới khi job xong. Lệnh tay `pnpm reindex:rentals-search` vẫn giữ để chạy bù toàn bộ.
- **Hai người sửa cùng bài**: dùng document locking có sẵn của Payload 3.
- **Bộ lọc không có kết quả**: hiện trạng thái trống + nút xoá bộ lọc. **Lỗi máy chủ**: trang 500 đúng ngôn ngữ đang xem (screen spec ở bước `/design`).

## Câu hỏi mở

| # | Nội dung | Cần trước |
|---|---|---|
| Q1 | KPI cụ thể (BO-1…BO-4) | Go-live |
| Q4 | Nội dung ban đầu: dự án, tin cho thuê, dịch vụ, bài giới thiệu | Go-live (code dùng dữ liệu mẫu) |
| Q5 | Bản EN trang pháp lý có cần luật sư duyệt (hiện: admin duyệt) | Mở `/en` trang pháp lý |
| Q6 | Hạn mức chi phí Claude API / tháng | Production |
| — | Tên miền | Production |

## Scalability Profile

- **Scalability Option:** on
- **Tier:** Standard (thiết kế sẵn đường nâng lên High Traffic, xem `docs/ARCHITECTURE.md` §9.1)
- **CCU dự kiến:** 1.000 lúc cao điểm ⚠️ giả định
- **Peak RPS ước tính:** ~100 RPS tới origin (phần lớn trang công khai do Cloudflare trả từ cache)
- **Tỉ lệ đọc/ghi:** ~95/5
- **Peak/off-peak chênh lệch:** ~5× (tối và cuối tuần; khi chạy quảng cáo)
- **Tăng trưởng 6–12 tháng:** tới 100.000 tin cho thuê ⚠️ giả định
- **Availability (SLA):** ≥ 99.5%/tháng
- **Recovery (RTO/RPO):** RTO ≤ 4 giờ · RPO ≤ 15 phút

> Chi tiết thiết kế hạ tầng theo Tier tại `skills/scalability-architecture/`.

## Deployment

- Server công ty, **dùng chung** với dự án khác: VPS 4 vCPU / 15GB RAM / SSD 200GB, Ubuntu 24.04, Docker có sẵn (SSH alias `server`). Đủ cho giai đoạn 1.
- Docker Compose (`app`, `jobs`, `postgres`, `redis`, `seaweedfs`, giám sát), tiền tố `tami-`. Container chỉ bind `127.0.0.1` (prod `:3010`, staging `:3011`); DB/Redis/file không mở cổng ra host.
- Reverse proxy: **Nginx có sẵn trên host**, thêm file `tami.conf` / `tami-staging.conf`, không đụng site khác.
- Production và staging tách biệt (DB, Redis, bucket, tên miền riêng; `staging_db ≠ prod_db`). Staging chặn truy cập công khai + `noindex`.
- Cloudflare phía trước; server chỉ nhận traffic từ IP Cloudflare.
- CI/CD: lint/typecheck/test/build → image theo SHA → staging (`payload migrate`, health check) → **duyệt tay** → production đúng image đó.
- Backup ngoài server: pgBackRest (liên tục) + restic (file hằng ngày), diễn tập khôi phục 6 tháng/lần.
- Image PostgreSQL (dev/staging/prod) + sidecar backup chạy trên **OS còn hỗ trợ bảo mật** (Debian 12 bookworm, ghim digest/phiên bản), giữ PostgreSQL 17 + PostGIS 3.5; `pg_dump`/`pgbackrest` cùng major với server. Đổi base OS trên volume đã có dữ liệu = đổi glibc/collation ⇒ chỉ làm theo runbook (dừng app → backup → đổi image → `REINDEX` + `REFRESH COLLATION VERSION` → amcheck → bật app), **diễn tập backup/restore trên staging trước production**; deploy tự động không được tự đổi image postgres trên volume cũ (BL-002).

Chi tiết: `docs/ARCHITECTURE.md` §6–8.

---
*Viết tay từ thiết kế đã duyệt (dự án mới, chưa có code), 16/10/2026.*
*Validate bằng: .agent/spec-validator.md*
