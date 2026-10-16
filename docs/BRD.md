# Business Requirements Document (BRD) — Website TAMI

| Thông tin | Nội dung |
|---|---|
| Tên dự án | Website thương hiệu TAMI |
| Phiên bản | 1.3 |
| Ngày | 16/10/2026 |
| Trạng thái | Đã duyệt phạm vi giai đoạn 1 |
| Người soạn | (điền) |
| Người phê duyệt | (điền) |
| Mốc go-live mong muốn | (điền) |
| Tham khảo giao diện | https://vinhomes.vn/ (chỉ tham khảo bố cục, không sao chép nội dung/hình ảnh) |
| Tài liệu liên quan | `docs/ARCHITECTURE.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/API_SPEC.md` |

### Lịch sử phiên bản

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0–1.2 | 15/10/2026 | Bản nháp theo hướng **sàn BĐS** (tham chiếu bdstanlong.vn). Lưu tại `docs/archive/BRD-v1.2-san-bds.md`, chỉ để tham khảo |
| 1.3 | 16/10/2026 | **Đổi định vị**: website thương hiệu của TAMI, công ty tự đăng nội dung, khách để lại liên hệ. Bỏ toàn bộ tính năng sàn (tài khoản người ngoài, kiểm duyệt, báo cáo vi phạm, VIP/thanh toán, xác minh môi giới). Bỏ mục Mua bán. Thêm Dịch vụ, Đăng tin BĐS (tin BĐS/voucher), Tuyển dụng vào giai đoạn 1. Chỉ 2 vai trò: Admin, Sale |

---

## 1. Tổng quan

### 1.1. Bối cảnh

TAMI là doanh nghiệp bất động sản hoạt động ở các mảng:
- **Phân phối** dự án cho các chủ đầu tư.
- **Môi giới** bất động sản.
- **Khai thác căn hộ dịch vụ**.

Kênh tiếp nhận khách hiện tại: **Phòng kinh doanh** tiếp nhận thông tin rồi chuyển cho sale.

Website cần **định hướng khách hàng, tạo sự tin tưởng và xây dựng nhận diện thương hiệu TAMI**, đồng thời là kênh thu thông tin khách hàng tiềm năng (lead) cho đội sale.

> Hoa hồng phân phối/môi giới (70% / 50%, thay đổi tùy thời điểm) là thông tin kinh doanh nội bộ: **không hiển thị trên website** và **không nằm trong phạm vi** hệ thống giai đoạn 1.

### 1.2. Mục tiêu nghiệp vụ

| Mã | Mục tiêu | Chỉ số đo (KPI) |
|---|---|---|
| BO-1 | Xây dựng nhận diện và độ tin cậy thương hiệu TAMI | Traffic organic, thời gian ở lại trang, tỷ lệ quay lại (điền mục tiêu) |
| BO-2 | Thu lead cho đội sale | Số lead hợp lệ/tháng (điền); 100% lead được giao cho sale |
| BO-3 | Giới thiệu dự án, BĐS cho thuê, ưu đãi của TAMI | Số tin/dự án đang hiển thị; tỷ lệ xem chi tiết → để lại liên hệ |
| BO-4 | Tuyển dụng qua website | Số hồ sơ ứng tuyển/tháng (điền) |

### 1.3. Phạm vi

**Trong phạm vi (giai đoạn 1):**
- Website công khai: Trang chủ (giới thiệu TAMI), Dự án, Cho thuê, Đăng tin BĐS, Tin tức, Tuyển dụng, Liên hệ, trang Dịch vụ, trang pháp lý.
- Trang quản trị (CMS) cho Admin và Sale.
- Thu lead từ form, phân công lead cho sale, theo dõi trạng thái chăm sóc.
- Nhận hồ sơ ứng tuyển (CV).
- SEO, responsive mobile-first, tiếng Việt.

**Ngoài phạm vi:**
- Mục **Mua bán** (không làm).
- Tài khoản cho khách hoặc môi giới bên ngoài, tự đăng tin, kiểm duyệt tin, báo cáo vi phạm.
- Gói đăng tin, VIP, thanh toán online.
- Tính hoa hồng, CRM chuyên sâu.
- App mobile native, đa ngôn ngữ, tìm kiếm theo bản đồ, autocomplete.

> Hệ thống được thiết kế để **có thể mở rộng** cho bên ngoài đăng tin sau này (xem `docs/ARCHITECTURE.md` §9), nhưng không xây dựng tính năng đó trong giai đoạn 1.

### 1.4. Người dùng

| Người dùng | Vai trò | Nhu cầu |
|---|---|---|
| Khách truy cập | Không đăng nhập | Tìm hiểu TAMI, xem dự án / BĐS cho thuê / ưu đãi / tin tức, để lại liên hệ, ứng tuyển |
| **Admin** | 1 tài khoản, quản trị toàn quyền | Quản lý mọi nội dung, cấu hình web, tài khoản sale, phân công lead, xem CV |
| **Sale** | Nhiều tài khoản | Đăng bài mọi loại, chăm sóc lead được giao |

---

## 2. Cấu trúc website

**Menu chính:** Trang chủ · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ

| Trang | URL | Nội dung |
|---|---|---|
| Trang chủ | `/` | **Chính là trang giới thiệu TAMI** (không có trang Giới thiệu riêng): Hero slide · Về TAMI · Dự án nổi bật · Dịch vụ · Ưu đãi nổi bật · Footer liên hệ |
| Dự án | `/du-an`, `/du-an/[slug]` | Danh sách + chi tiết dự án, form để lại thông tin |
| Cho thuê | `/cho-thue`, `/cho-thue/danh-muc/[category]`, `/cho-thue/[slug]` | BĐS cho thuê có bộ lọc; chi tiết có form liên hệ |
| Đăng tin BĐS | `/tin-bds`, `/tin-bds/danh-muc/[category]`, `/tin-bds/[slug]` | Tin BĐS, voucher, ưu đãi…; chi tiết có form liên hệ |
| Tin tức | `/tin-tuc`, `/tin-tuc/danh-muc/[category]`, `/tin-tuc/[slug]` | Tin tức chung xung quanh |
| Tuyển dụng | `/tuyen-dung`, `/tuyen-dung/[slug]` | Việc làm + form nộp CV |
| Liên hệ | `/lien-he` | Form liên hệ, bản đồ, hotline, địa chỉ |
| Dịch vụ | `/dich-vu/[slug]` | Phân phối · Môi giới · Khai thác căn hộ dịch vụ (link từ trang chủ + footer) |
| Pháp lý | `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` | Bắt buộc vì có thu dữ liệu cá nhân |
| Quản trị | `/admin` | CMS |

**Nút nổi góc dưới bên phải** (mọi trang): Hotline (click-to-call) · Zalo · Fanpage.

> **Đăng tin BĐS ≠ Tin tức.** *Đăng tin BĐS* là tin thương mại của TAMI (tin BĐS, voucher, ưu đãi) và có form thu lead. *Tin tức* là tin tức chung (thị trường, đời sống, sự kiện), không thu lead.
>
> **Cho thuê ≠ Đăng tin BĐS.** *Cho thuê* là danh sách BĐS cho thuê **có cấu trúc** (giá, diện tích, phòng…) để lọc. *Đăng tin BĐS* là **bài đăng dạng tin**.

---

## 3. Yêu cầu chức năng

Quy ước ưu tiên: **Must** = bắt buộc cho go-live, **Should** = nên có trong giai đoạn 1, **Could** = làm nếu còn thời gian.

### 3.1. Website công khai

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-PUB-01 | Trang chủ gồm các khối: Hero slide, Về TAMI, Dự án nổi bật, Dịch vụ, Ưu đãi nổi bật, Footer liên hệ | Must | Admin chỉnh được nội dung, thứ tự và bật/tắt từng khối; hero slide tối thiểu 1, tối đa 8 slide |
| FR-PUB-02 | Danh sách dự án, lọc theo loại hình, tỉnh/thành, trạng thái mở bán; phân trang | Must | Chỉ hiển thị dự án đã xuất bản |
| FR-PUB-03 | Chi tiết dự án: tổng quan, chủ đầu tư, vị trí (bản đồ), tiện ích, mặt bằng, pháp lý, chính sách bán hàng, tài liệu, thư viện ảnh, form để lại thông tin | Must | Gửi form tạo lead gắn với dự án |
| FR-PUB-04 | Danh sách Cho thuê có bộ lọc: danh mục, tỉnh/thành, phường/xã, khoảng giá/tháng, diện tích, số phòng ngủ, nội thất; sắp xếp mới nhất / giá tăng / giá giảm; tìm theo từ khóa (gõ không dấu vẫn ra) | Must | Bộ lọc phản ánh trên URL (chia sẻ được); p95 ≤ 500ms |
| FR-PUB-05 | Chi tiết tin cho thuê: thư viện ảnh, video, mã tin, giá/tháng, diện tích, phòng ngủ/WC, tầng, hướng, nội thất, thời hạn thuê, đặt cọc, dịch vụ bao gồm, ngày trống, mô tả, vị trí, sale phụ trách, form liên hệ, tin tương tự | Must | Tin "Đã thuê" vẫn mở được, có nhãn và gợi ý tin tương tự |
| FR-PUB-06 | Danh sách Đăng tin BĐS theo danh mục (Tin BĐS, Voucher/Ưu đãi, …) | Must | Danh mục do admin cấu hình |
| FR-PUB-07 | Chi tiết bài Đăng tin BĐS: nội dung, thư viện ảnh, thông tin tùy chọn (giá, khu vực, dự án/tin cho thuê liên quan, hạn ưu đãi), form liên hệ | Must | Bài có hạn ưu đãi đã qua thì hiện nhãn "Đã kết thúc" |
| FR-PUB-08 | Tin tức: danh sách theo danh mục, chi tiết bài, bài liên quan | Must | |
| FR-PUB-09 | Tuyển dụng: danh sách vị trí đang tuyển, chi tiết, form ứng tuyển kèm CV (PDF/DOC/DOCX ≤ 5MB) | Must | Vị trí quá hạn nộp tự ẩn khỏi danh sách |
| FR-PUB-10 | Trang Dịch vụ (Phân phối, Môi giới, Khai thác căn hộ dịch vụ) | Must | Admin thêm/sửa được |
| FR-PUB-11 | Trang Liên hệ: form, bản đồ, hotline, địa chỉ, email | Must | |
| FR-PUB-12 | Nút nổi góc dưới phải: Hotline, Zalo, Fanpage | Must | Link lấy từ cấu hình; ghi nhận số lượt bấm |
| FR-PUB-13 | Mọi form thu thông tin có ô **đồng ý xử lý dữ liệu cá nhân** (link chính sách) và chống spam | Must | Không tick thì không gửi được |
| FR-PUB-14 | Trang pháp lý: Chính sách bảo mật, Điều khoản sử dụng | Must | |
| FR-PUB-15 | SEO: URL thân thiện, meta, Open Graph, `sitemap.xml`, `robots.txt`, breadcrumb, schema.org (`RealEstateListing`, `Article`, `JobPosting`, `Organization`) | Must | |
| FR-PUB-16 | Trang đích theo khu vực cho Cho thuê, ví dụ `/cho-thue/khu-vuc/ha-noi` | Should | |
| FR-PUB-17 | Khối giới thiệu đối tác / chủ đầu tư (logo) trên trang chủ | Should | |

### 3.2. Quản trị (CMS)

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-ADM-01 | CRUD Dự án | Must | Có nháp/xuất bản, lịch sử phiên bản |
| FR-ADM-02 | CRUD Tin cho thuê | Must | Mã tin tự sinh (`CT-000001`), không sửa được |
| FR-ADM-03 | CRUD bài Đăng tin BĐS | Must | |
| FR-ADM-04 | CRUD Tin tức | Must | |
| FR-ADM-05 | CRUD Tuyển dụng; xem và đổi trạng thái hồ sơ ứng viên | Must | Chỉ admin xem CV |
| FR-ADM-06 | CRUD Danh mục riêng cho từng loại nội dung (Cho thuê / Đăng tin BĐS / Tin tức / Dự án / Tuyển dụng), có danh mục cha–con | Must | Danh mục đang có nội dung thì không xóa được |
| FR-ADM-07 | CRUD Chủ đầu tư, Dịch vụ | Must | |
| FR-ADM-08 | Quản lý trang chủ, menu, footer, cấu hình chung (logo, hotline, Zalo, fanpage, địa chỉ, email nhận thông báo) | Must | |
| FR-ADM-09 | Quản lý lead: danh sách, lọc theo trạng thái/nguồn/sale/thời gian, xem chi tiết, phân công, ghi chú, đổi trạng thái | Must | Theo §4.2 |
| FR-ADM-10 | Xuất lead ra Excel | Must | Chỉ admin; mỗi lần xuất ghi nhật ký |
| FR-ADM-11 | Quản lý tài khoản sale: tạo, khóa, đặt lại mật khẩu | Must | Chỉ admin |
| FR-ADM-12 | Thư viện ảnh/file: upload, tự resize, alt text | Must | Ảnh ≤ 10MB; tự chuyển WebP |
| FR-ADM-13 | Nhật ký thao tác (audit log) cho: phân công lead, xuất dữ liệu, xóa nội dung, đổi tài khoản/quyền | Must | |
| FR-ADM-14 | Dashboard: số lead theo trạng thái/nguồn/sale, số nội dung đang hiển thị, lượt bấm hotline/Zalo/fanpage | Should | |
| FR-ADM-15 | Quản lý chuyển hướng 301 | Should | |
| FR-ADM-16 | Hẹn giờ xuất bản bài | Could | |

---

## 4. Quy tắc nghiệp vụ

### 4.1. Nội dung

- **BR-01** Trạng thái tin cho thuê: `Nháp → Đang hiển thị → Ẩn | Đã thuê`. Tin `Đã thuê` vẫn giữ URL, hiện nhãn và gợi ý tin tương tự.
- **BR-02** Bài viết (dự án, Đăng tin BĐS, tin tức, tuyển dụng): `Nháp → Đã xuất bản → Ẩn`.
- **BR-03** Xóa nội dung là **xóa mềm**; chỉ admin khôi phục hoặc xóa hẳn.
- **BR-04** Mỗi nội dung có người đăng (`author`). Sale chỉ sửa/xóa nội dung **của mình**; admin sửa/xóa tất cả. ⚠️ Giả định, chỉnh được.
- **BR-05** Slug tự sinh từ tiêu đề (tiếng Việt không dấu), không trùng trong cùng loại. Đổi slug của nội dung đã xuất bản thì tự tạo redirect 301.
- **BR-06** Bài Đăng tin BĐS có hạn ưu đãi: quá hạn thì gắn nhãn "Đã kết thúc" và rời khối "Ưu đãi nổi bật".

### 4.2. Lead

- **BR-10** Nguồn lead: form tin cho thuê, form bài Đăng tin BĐS, form dự án, form liên hệ chung.
- **BR-11** Trạng thái: `Mới → Đã liên hệ → Đang tư vấn → Đã chốt | Không thành (bắt buộc lý do) | Spam`.
- **BR-12** Phân công:
  - Lead từ **tin cho thuê / bài Đăng tin BĐS**: tự giao cho **sale đã đăng nội dung đó** (nếu sale còn hoạt động; nếu không thì chờ admin giao).
  - Lead từ **dự án / form liên hệ**: chờ **admin** giao.
- **BR-13** Thông báo: lead mới thì email cho admin (và cho sale được tự giao). Admin giao lại thì email cho sale mới.
- **BR-14** Lead `Mới` chưa có người phụ trách sau **30 phút** (giờ hành chính) thì nhắc admin. ⚠️ Giả định.
- **BR-15** Chống trùng: cùng SĐT + cùng nội dung nguồn trong **7 ngày** thì gộp vào lead cũ (ghi thêm hoạt động), không tạo lead mới. ⚠️ Giả định.
- **BR-16** Chống spam: captcha ẩn (Cloudflare Turnstile) + giới hạn 5 lần gửi / 10 phút / IP.

### 4.3. Tuyển dụng

- **BR-20** Trạng thái hồ sơ: `Mới → Đang xem → Phỏng vấn → Nhận | Loại`.
- **BR-21** Có hồ sơ mới thì email báo admin.

### 4.4. Dữ liệu cá nhân

- **BR-30** Lưu thời điểm và nội dung đồng ý (phiên bản chính sách) cho mỗi lead và hồ sơ.
- **BR-31** Lead lưu **24 tháng** kể từ lần tương tác cuối, CV lưu **12 tháng**, sau đó tự ẩn danh hoặc xóa. ⚠️ Giả định.
- **BR-32** SĐT/email khách chỉ hiện cho admin và sale phụ trách.

---

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu | Tiêu chí |
|---|---|---|
| NFR-01 | Hiệu năng | Core Web Vitals "Good" ở p75 mobile (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1); API lọc p95 ≤ 500ms |
| NFR-02 | Khả năng mở rộng | App stateless, scale ngang được; giai đoạn 1 chạy trên 1 server; mục tiêu thiết kế 100.000 tin, 1.000 người dùng đồng thời |
| NFR-03 | SEO | Render phía server (SSR/ISR), theo FR-PUB-15 |
| NFR-04 | Bảo mật | HTTPS, OWASP Top 10, `/admin` có lớp xác thực thứ 2, rate limit, captcha form, CV không có link công khai |
| NFR-05 | Sao lưu | DB: sao lưu liên tục (RPO ≤ 15 phút) + bản đầy đủ hằng ngày; file: hằng ngày; lưu **ngoài server**; RTO ≤ 4 giờ; diễn tập khôi phục 6 tháng/lần |
| NFR-06 | Khả dụng | Uptime ≥ 99.5%/tháng |
| NFR-07 | Truy cập | Responsive mobile-first, WCAG 2.1 mức A (mục tiêu AA cho trang chính) |
| NFR-08 | Tương thích | Chrome, Safari, Edge, Firefox (2 bản gần nhất); trình duyệt trong Zalo/Facebook |
| NFR-09 | Chi phí | Chỉ dùng phần mềm mã nguồn mở, tự host trên server của công ty. Dịch vụ trả phí chỉ gồm tên miền (và email/SMS nếu vượt gói free) |
| NFR-10 | Bảo trì | Có staging tách biệt production; CI/CD; có tài liệu kiến trúc và dữ liệu |

---

## 6. Yêu cầu pháp lý

| Mã | Yêu cầu | Ảnh hưởng |
|---|---|---|
| LGL-01 | Địa giới hành chính 2 cấp (34 tỉnh/thành, hiệu lực 01/07/2025) | Vị trí lưu theo Tỉnh/Thành → Phường/Xã; lưu thêm tên cũ để tìm kiếm |
| LGL-02 | Luật Kinh doanh BĐS 2023: công khai thông tin BĐS đưa vào kinh doanh | Dự án và tin cho thuê có trường pháp lý |
| LGL-03 | Bảo vệ dữ liệu cá nhân | Consent, chính sách bảo mật, thời hạn lưu (BR-30…32), giới hạn người xem |
| LGL-04 | Bản quyền nội dung | Không sao chép nội dung/hình ảnh từ website tham khảo |

> Giai đoạn 1 chỉ công ty tự đăng nội dung nên **không** thuộc diện sàn giao dịch TMĐT. Nếu sau này mở cho bên thứ ba đăng tin, phải đánh giá lại nghĩa vụ đăng ký với Bộ Công Thương **trước** khi mở.

---

## 7. Luồng nghiệp vụ

### 7.1. Khách để lại liên hệ

1. Khách xem dự án / tin cho thuê / bài Đăng tin BĐS / trang Liên hệ.
2. Điền form (họ tên, SĐT, email tùy chọn, nhu cầu), tick đồng ý rồi gửi.
3. Hệ thống kiểm tra chống spam và chống trùng (BR-15, BR-16), tạo lead `Mới`.
4. Phân công theo BR-12, gửi email theo BR-13.
5. Sale liên hệ khách, cập nhật trạng thái và ghi chú cho tới khi `Đã chốt` hoặc `Không thành`.

### 7.2. Đăng nội dung

1. Admin/Sale đăng nhập `/admin`.
2. Chọn loại nội dung, điền thông tin, chọn danh mục, upload ảnh.
3. Lưu nháp hoặc Xuất bản. Trang công khai cập nhật trong vòng 1 phút.

### 7.3. Ứng tuyển

1. Ứng viên xem vị trí, điền form, đính kèm CV, tick đồng ý rồi gửi.
2. Email báo admin. Admin xem CV và đổi trạng thái hồ sơ.

---

## 8. Giả định & câu hỏi mở

| # | Nội dung | Trạng thái |
|---|---|---|
| A1 | Sale chỉ sửa/xóa nội dung của mình (BR-04) | ⚠️ Giả định |
| A2 | Gộp lead trùng trong 7 ngày (BR-15) | ⚠️ Giả định |
| A3 | Nhắc lead chưa giao sau 30 phút (BR-14) | ⚠️ Giả định |
| A4 | Lưu lead 24 tháng, CV 12 tháng (BR-31) | ⚠️ Giả định |
| A5 | Chỉ tiếng Việt | ⚠️ Giả định |
| A6 | Mục tiêu tải khi thiết kế: 100.000 tin, 1.000 người đồng thời (NFR-02) | ⚠️ Giả định |
| Q1 | Mục tiêu KPI cụ thể (BO-1…BO-4) | ⏳ Chờ điền |
| Q2 | Logo, font, hình ảnh (cho `docs/DESIGN.md`) | ✅ Màu + logo đã có 16/10/2026 (`assets/brand/`) · ⏳ font, hình ảnh chờ cung cấp |
| Q3 | Cấu hình server, tên miền | ✅ Server đã kiểm tra 16/10/2026: VPS dùng chung 4 vCPU / 15GB RAM / SSD 200GB, đủ dùng (`docs/ARCHITECTURE.md` §6.1) · ⏳ tên miền chờ cung cấp |
| Q4 | Nội dung ban đầu: danh sách dự án, tin cho thuê, dịch vụ, bài giới thiệu | ⏳ Chờ cung cấp |
