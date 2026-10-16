# Business Requirements Document (BRD)
## Website/Sàn Bất Động Sản (tham chiếu: bdstanlong.vn)

| Thông tin | Nội dung |
|---|---|
| Tên dự án | Sàn BĐS (nền tảng đăng tin, môi giới, dự án) |
| Phiên bản tài liệu | 1.2 |
| Ngày | 15/10/2026 |
| Trạng thái | Draft |
| Người soạn | (điền) |
| Project sponsor | (điền) |
| Người phê duyệt BRD | (điền) |
| Ngân sách dự kiến | (điền) |
| Mốc go-live mong muốn | (điền) |
| Nguồn tham chiếu | https://bdstanlong.vn/ — Công ty CP Dịch vụ và Đầu tư Tân Long (Tân Long Land) |
| Quan hệ với site tham chiếu | **Chỉ tham khảo** cấu trúc thông tin (đã chốt 15/10/2026). KHÔNG migrate và KHÔNG sao chép nội dung/hình ảnh/dữ liệu tin từ bdstanlong.vn |

### Lịch sử phiên bản
| Phiên bản | Ngày | Nội dung thay đổi |
|---|---|---|
| 1.0 | 15/10/2026 | Bản nháp đầu |
| 1.1 | 15/10/2026 | Thống nhất mức ưu tiên FR ↔ MoSCoW ↔ roadmap; cập nhật địa giới hành chính 2 cấp (34 tỉnh/thành); bổ sung yêu cầu pháp lý (Luật KD BĐS 2023, TMĐT, dữ liệu cá nhân); bổ sung trường dữ liệu tin, vòng đời tin, quy tắc lead, báo cáo vi phạm, ma trận phân quyền, migration dữ liệu; KPI/NFR đo được; thêm danh sách câu hỏi mở (§13) |
| 1.2 | 15/10/2026 | Chốt Q1: chỉ tham khảo bdstanlong.vn, không migrate → bỏ các nội dung migrate/redirect từ site cũ; BO-1 chuyển thành (điền); §13 thêm cột trạng thái |

---

## 1. Tổng quan

### 1.1. Bối cảnh
Thị trường bất động sản Việt Nam cần một nền tảng trực tuyến cho phép:
- Môi giới/doanh nghiệp **đăng tin** bán & cho thuê (nhà, đất, căn hộ, biệt thự, shophouse, văn phòng...).
- Người mua/thuê **tìm kiếm, lọc, xem chi tiết và liên hệ** nhanh.
- Giới thiệu **dự án BĐS** (từ các chủ đầu tư Vin, Sunshine, Ciputra...) và **tin tức** ngành.
- Quản lý **hệ thống văn phòng/chi nhánh** và nhân sự môi giới.

Website mới lấy bdstanlong.vn làm mẫu tham chiếu về cấu trúc danh mục, bộ lọc và luồng nội dung, nhưng sẽ được xây dựng theo kiến trúc hiện đại, có CMS quản trị và API tách biệt.

> Lưu ý: dự án chỉ tham khảo cấu trúc thông tin của bdstanlong.vn; mọi nội dung, hình ảnh, dữ liệu tin phải do dự án tự sở hữu hoặc được cấp phép.

### 1.2. Mục tiêu nghiệp vụ
| Mã | Mục tiêu | Chỉ số đo lường (KPI) | Mốc đo |
|---|---|---|---|
| BO-1 | Số hóa toàn bộ danh mục tin bán/cho thuê | ≥ (điền) tin active — toàn bộ là tin nhập mới (không migrate); nguồn tin chính: (điền) | 12 tháng sau go-live |
| BO-2 | Tăng lượng khách hàng tiềm năng (lead) | ≥ 3.000 lead hợp lệ/tháng (đã loại trùng/spam); tỷ lệ **lead → giao dịch thành công** ≥ 5% | Từ tháng thứ 6 sau go-live |
| BO-3 | SEO & tăng traffic tự nhiên | ≥ 300.000 session organic/tháng; Top 10 Google cho ≥ (điền) từ khóa trong danh sách mục tiêu (điền: danh sách từ khóa) | 12 tháng sau go-live |
| BO-4 | Quản lý tập trung nhiều văn phòng/chi nhánh | 100% văn phòng dùng chung nền tảng | 6 tháng sau go-live |
| BO-5 | Tăng độ tin cậy & minh bạch tin đăng | Tỷ lệ tin bị báo cáo vi phạm (được xác nhận) < 1% tổng tin active; 100% tin có thông tin pháp lý | Hàng tháng |
| BO-6 | Tạo nguồn thu (đăng tin trả phí, gói VIP, quảng cáo) | Doanh thu nền tảng ≥ (điền) VNĐ/năm | 12 tháng sau khi Phase 3 go-live |

### 1.3. Phạm vi
**Trong phạm vi (In-scope):**
- Website công khai (public) cho người dùng cuối.
- Hệ thống quản trị nội dung (CMS/Admin) cho nhân viên & môi giới.
- Cổng đăng tin cho môi giới/đối tác (self-service) — Phase 2.
- API backend, cơ sở dữ liệu, tìm kiếm, tích hợp liên hệ (form, hotline, chat).
- Nhập liệu ban đầu (tin, dự án, bài viết) từ nguồn nội bộ/đối tác qua import hàng loạt — không migrate từ bdstanlong.vn.
- SEO; ngôn ngữ: tiếng Việt từ Phase 1, tiếng Anh ở Phase 3 (điền: xác nhận có làm EN hay không).

**Ngoài phạm vi (Out-of-scope) — giai đoạn đầu:**
- Ứng dụng mobile native (chỉ responsive web).
- Giao dịch/thanh toán đặt cọc online.
- Ký số hợp đồng, eKYC pháp lý chuyên sâu.
- CRM nội bộ chuyên dụng (chỉ tích hợp qua API nếu cần).

### 1.4. Đối tượng người dùng (Stakeholders & Personas)
| Persona | Vai trò | Nhu cầu chính |
|---|---|---|
| Khách vãng lai (Guest) | Người tìm mua/thuê | Xem danh sách, tìm kiếm, xem chi tiết, liên hệ, báo cáo tin sai |
| Khách hàng tiềm năng (Lead) | Đã để lại thông tin | Được tư vấn, nhận tin phù hợp |
| Môi giới nội bộ / Nhân viên sale | Nhân sự công ty, thuộc 1 văn phòng | Đăng tin nhanh, quản lý lead được giao, theo dõi hiệu quả |
| Trưởng văn phòng / Trưởng nhóm | Quản lý 1 văn phòng | Phân công lead, xem báo cáo của văn phòng |
| Đối tác môi giới | Cá nhân/tổ chức bên ngoài | Đăng tin (miễn phí/trả phí), gói VIP |
| Quản trị viên nội dung (Editor) | Duyệt & biên tập | Kiểm duyệt tin, xử lý báo cáo vi phạm, quản lý dự án/tin tức |
| Admin hệ thống | Quản trị toàn quyền | Phân quyền, cấu hình, thống kê |
| Ban lãnh đạo | Ra quyết định | Dashboard, báo cáo lead/hiệu quả văn phòng/doanh thu |

---

## 2. Phân tích hiện trạng (tham chiếu bdstanlong.vn)

### 2.1. Cấu trúc thông tin (Information Architecture)
Trang tham chiếu có các nhóm chức năng chính:

**Menu chính:**
- Trang chủ
- Về công ty (`info.bdstanlong.vn`)
- **Dự án** (phân loại theo loại hình)
- **Nhà đất bán**
- **Nhà đất cho thuê**
- **Tin tức BĐS**
- Tuyển dụng (`tuyendung.bdstanlong.vn`)

**Phân loại Dự án:** Căn hộ/Chung cư, Biệt thự & liền kề, Cao ốc văn phòng, Trung tâm thương mại, Khu đô thị mới, Khu phức hợp, Nhà ở xã hội, Khu nghỉ dưỡng/Sinh thái, Khu công nghiệp, Dự án khác.

**Nhà đất bán:** Bán shophouse (chân đế, thấp tầng), Bán biệt thự, Bán nhà, Bán căn hộ, Bán đất, Bán khách sạn, Bán đất nền dự án, Bán khu nghỉ dưỡng, Bán văn phòng.

**Nhà đất cho thuê:** Cho thuê shophouse (chân đế, thấp tầng), biệt thự, nhà, căn hộ, căn hộ dịch vụ, văn phòng.

**Chuyên mục tin tức:** Tin tức BĐS, M&A, Pháp luật, Phong thủy, Tư vấn xây nhà, Mẫu nhà đẹp, Ảnh nhà đẹp, Nội bộ.

> Trên nền tảng mới, toàn bộ danh mục trên là **dữ liệu cấu hình** (quản lý qua FR-ADM-04), không cố định trong code.

### 2.2. Bộ lọc tìm kiếm hiện có
- **Loại nhà đất** (dropdown theo danh mục)
- **Khu vực**: Toàn quốc + ~63 tỉnh/thành, theo địa giới **trước 01/07/2025** → **đã lỗi thời** (xem §3.5)
- **Diện tích**: Không xác định, ≤30, 30–50, 50–80, 80–100, 100–150, 150–200, 200–250, 250–300, 300–500, ≥500 m²
- **Số phòng**: Không xác định, 1+, 2+, 3+, 4+, 5+
- **Hướng nhà**: Đông, Tây, Nam, Bắc, Đông-Bắc, Tây-Bắc, Tây-Nam, Đông-Nam
- **Mức giá**: Thỏa thuận, <500tr, 500–800tr, 800tr–1 tỷ, 1–2, 2–3, 3–5, 5–7, 7–10, 10–20, 20–30, >30 tỷ (tin cho thuê cần thang giá riêng theo tháng)
- **Bộ lọc dự án**: Nhóm dự án, Khu vực, Mức giá, Trạng thái (Đang mở bán / Sắp mở bán / Đóng giao dịch), Hướng nhà

### 2.3. Điểm mạnh & điểm cần cải thiện (Gap analysis)
| Điểm quan sát ở site mẫu | Đánh giá | Định hướng cho nền tảng mới |
|---|---|---|
| Cấu trúc danh mục rất đầy đủ, SEO-friendly URL | 👍 Mạnh | Kế thừa & tối ưu |
| Số lượng tin lớn (15k+ bán, 12k+ thuê) | 👍 Mạnh | Cần kiến trúc chịu tải, tìm kiếm nhanh |
| Bộ lọc chi tiết | 👍 Tốt | Bổ sung tìm kiếm theo bản đồ, từ khóa |
| Khu vực theo địa giới cũ (63 tỉnh, có cấp quận/huyện) | ⚠️ Lỗi thời | Chuyển sang mô hình 2 cấp + bảng ánh xạ địa chỉ cũ → mới |
| UI/UX thiên cũ, load ảnh chậm | ⚠️ Cần cải thiện | Thiết kế responsive, lazy-load, WebP |
| Tìm kiếm chủ yếu theo dropdown, chưa có autocomplete/bản đồ | ⚠️ Thiếu | Search engine + map (Phase 3) |
| Thiếu đăng tin self-service, chưa có tài khoản người dùng | ⚠️ Thiếu | Xây module tài khoản + đăng tin (Phase 2) |
| Chưa rõ CRM/lead tracking | ⚠️ Thiếu | Lead capture (Phase 1) → lead pipeline (Phase 2) |
| Chưa thấy thông tin pháp lý chuẩn hóa trên tin đăng | ⚠️ Thiếu | Trường pháp lý bắt buộc (§3.5) |
| Hotline/phone-ring nổi bật | 👍 Tốt | Giữ, tối ưu CTA và đo lường cuộc gọi |

---

## 3. Yêu cầu nghiệp vụ (Business Requirements)

> Quy ước: cột **Ưu tiên** theo MoSCoW, cột **Phase** theo roadmap §10. Một yêu cầu Must chỉ có nghĩa là bắt buộc **trong phase được ghi**.

### 3.1. Nhóm chức năng công khai (Public Website)

| Mã | Yêu cầu | Ưu tiên | Phase |
|---|---|---|---|
| FR-PUB-01 | Trang chủ hiển thị banner, dự án nổi bật, tin bán/cho thuê mới, tin tức (có thể bật/tắt từng khối qua CMS) | Must | 1 |
| FR-PUB-02 | Danh sách **Dự án** có phân trang, phân loại theo loại hình dự án (cấu hình được) | Must | 1 |
| FR-PUB-03 | Danh sách **Nhà đất bán** theo danh mục | Must | 1 |
| FR-PUB-04 | Danh sách **Nhà đất cho thuê** theo danh mục | Must | 1 |
| FR-PUB-05 | Trang chi tiết tin: gallery ảnh, giá, diện tích, số phòng, hướng, mô tả, **thông tin pháp lý**, vị trí, mã tin, ngày đăng/cập nhật, thông tin liên hệ | Must | 1 |
| FR-PUB-06 | Trang chi tiết dự án: tổng quan, chủ đầu tư, vị trí, tiện ích, mặt bằng, **pháp lý dự án**, chính sách bán, tài liệu, CTA | Must | 1 |
| FR-PUB-07 | Trang chi tiết bài viết/tin tức + chuyên mục | Must | 1 |
| FR-PUB-08 | **Bộ lọc tìm kiếm nâng cao** (loại, khu vực, giá, diện tích, số phòng, hướng) | Must | 1 |
| FR-PUB-09 | Tìm kiếm từ khóa autocomplete | Should | 3 |
| FR-PUB-10 | Tìm kiếm theo bản đồ (map view) | Should | 3 |
| FR-PUB-11 | Đăng ký nhận tin (newsletter) qua email, có xác nhận đồng ý & hủy đăng ký | Should | 2 |
| FR-PUB-12 | Form liên hệ / đăng ký tư vấn → tạo lead (có ô đồng ý xử lý dữ liệu cá nhân, captcha) | Must | 1 |
| FR-PUB-13 | Hotline & nút gọi nổi (click-to-call), nút Zalo | Must | 1 |
| FR-PUB-14 | So sánh tin, lưu tin yêu thích (wishlist; Phase 1–2 lưu trên trình duyệt, đồng bộ tài khoản sau khi có FR-ACC) | Could | 3 |
| FR-PUB-15 | Trang tĩnh: Giới thiệu, Hỗ trợ, FAQ, Liên hệ, Điều khoản, Chính sách bảo mật, Quy chế hoạt động | Must | 1 |
| FR-PUB-16 | Trang **Hệ thống phân phối/văn phòng** theo tỉnh/thành | Should | 1 |
| FR-PUB-17 | Trang **Tuyển dụng** | Should | 2 |
| FR-PUB-18 | Đa ngôn ngữ (VI/EN) | Could | 3 |
| FR-PUB-19 | Sơ đồ web (sitemap) & breadcrumb | Must | 1 |
| FR-PUB-20 | **Báo cáo tin vi phạm** (sai giá, sai ảnh, đã bán, lừa đảo, trùng tin...) → vào hàng đợi xử lý của Editor | Must | 1 |
| FR-PUB-21 | Đo lường hotline: ghi nhận click-to-call/Zalo theo tin/dự án; (điền: có dùng dịch vụ call tracking/tổng đài ảo không) | Should | 2 |

### 3.2. Nhóm chức năng tài khoản & đăng tin (Self-service)

| Mã | Yêu cầu | Ưu tiên | Phase |
|---|---|---|---|
| FR-ACC-01 | Đăng ký/đăng nhập (email, SĐT, Google/Facebook); tài khoản đăng tin phải xác thực SĐT | Must | 2 |
| FR-ACC-02 | Quên/đổi mật khẩu, xác thực OTP | Must | 2 |
| FR-ACC-03 | Hồ sơ người dùng (gồm số chứng chỉ hành nghề môi giới nếu là môi giới), quản lý tin đã đăng | Must | 2 |
| FR-ACC-04 | Đăng/sửa/xóa/gia hạn tin, đánh dấu "đã bán/đã cho thuê" (có kiểm duyệt) | Must | 2 |
| FR-ACC-05 | Upload ảnh, tài liệu, chọn danh mục, khu vực, ghim vị trí trên bản đồ | Must | 2 |
| FR-ACC-06 | Quản lý lead nhận được, cập nhật trạng thái tư vấn | Must | 2 |
| FR-ACC-07 | Gói đăng tin (miễn phí / VIP / trả phí) | Could | 3 |
| FR-ACC-08 | Báo cáo hiệu quả tin (view, click, lead) | Should | 2 |
| FR-ACC-09 | Đánh dấu tin VIP/đẩy tin (bump) | Could | 3 |
| FR-ACC-10 | Người dùng xem, tải về và yêu cầu xóa dữ liệu cá nhân của mình | Must | 2 |

### 3.3. Nhóm quản trị (Admin/CMS)

| Mã | Yêu cầu | Ưu tiên | Phase |
|---|---|---|---|
| FR-ADM-01 | CRUD Tin bán/cho thuê | Must | 1 |
| FR-ADM-02 | CRUD Dự án | Must | 1 |
| FR-ADM-03 | CRUD Bài viết/Tin tức theo chuyên mục | Must | 1 |
| FR-ADM-04 | CRUD Danh mục, Khu vực (Tỉnh/Thành → Phường/Xã/Đặc khu), Hướng, Mức giá, Diện tích | Must | 1 |
| FR-ADM-05 | Kiểm duyệt tin (duyệt/từ chối kèm lý do, ẩn/hiện) | Must | 1 |
| FR-ADM-05b | Gắn/gỡ VIP, quản lý vị trí hiển thị trả phí | Could | 3 |
| FR-ADM-06a | Danh sách lead, phân công môi giới thủ công, thông báo email cho người được giao | Must | 1 |
| FR-ADM-06b | Lead pipeline đầy đủ: phân công tự động theo quy tắc §3.6.2, SLA, chống trùng, lịch sử chăm sóc | Must | 2 |
| FR-ADM-07 | Quản lý người dùng & phân quyền theo vai trò (RBAC) theo ma trận §3.7 | Must | 1 |
| FR-ADM-08 | Quản lý văn phòng/chi nhánh, gán nhân sự vào văn phòng | Should | 1 |
| FR-ADM-09 | Quản lý banner, menu, trang tĩnh, SEO metadata, redirect 301 | Must | 1 |
| FR-ADM-10a | Dashboard cơ bản: số tin theo trạng thái, số lead theo nguồn/văn phòng, traffic (nhúng GA) | Must | 1 |
| FR-ADM-10b | Dashboard nâng cao: hiệu quả môi giới/văn phòng, thời gian phản hồi lead, tỷ lệ chuyển đổi | Should | 2 |
| FR-ADM-10c | Báo cáo doanh thu gói đăng tin/quảng cáo | Could | 3 |
| FR-ADM-11 | Quản lý gói đăng tin & thanh toán | Could | 3 |
| FR-ADM-12 | Lịch sử thao tác (audit log) — tối thiểu cho duyệt tin, phân công lead, phân quyền, xuất dữ liệu | Must | 1 |
| FR-ADM-13 | Quản lý đa ngôn ngữ & dịch nội dung | Could | 3 |
| FR-ADM-14 | Hàng đợi xử lý báo cáo vi phạm (FR-PUB-20): xác nhận/bác bỏ, ẩn tin, cảnh cáo/khóa tài khoản | Must | 1 |
| FR-ADM-15 | Import dữ liệu hàng loạt (Excel/CSV/API) cho tin, dự án, bài viết; báo cáo lỗi import | Must | 1 |
| FR-ADM-16 | Quản lý trạng thái xác minh môi giới (chứng chỉ hành nghề) | Should | 2 |

### 3.4. Yêu cầu phi chức năng (NFR)

| Mã | Yêu cầu | Tiêu chí |
|---|---|---|
| NFR-01 | Hiệu năng | Core Web Vitals đạt "Good" ở p75 trên mobile (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1); API tìm kiếm p95 ≤ 500ms |
| NFR-02 | Khả năng mở rộng | Chịu ≥ 50.000 tin active; ≥ (điền, đề xuất 500) người dùng đồng thời ở giờ cao điểm, kiến trúc scale ngang được khi cần |
| NFR-03 | SEO | SSR/SSG, URL thân thiện, sitemap.xml, schema.org, meta OG |
| NFR-04 | Bảo mật | OWASP Top 10, HTTPS, chống spam tin, rate limit, captcha, mã hóa dữ liệu cá nhân nhạy cảm |
| NFR-05 | Sao lưu & khôi phục | Backup DB liên tục (point-in-time recovery), **RPO ≤ 15 phút** cho dữ liệu lead/tin; media backup hàng ngày; RTO ≤ 4h; diễn tập khôi phục 6 tháng/lần |
| NFR-06 | Khả dụng | Uptime ≥ 99.5%/tháng |
| NFR-07 | Khả năng truy cập | Responsive mobile-first, WCAG 2.1 mức A (mục tiêu AA cho trang chính) |
| NFR-08 | Tương thích | Chrome, Safari, Edge, Firefox (2 phiên bản gần nhất); Zalo in-app browser |
| NFR-09 | Tuân thủ pháp lý | Theo §3.5 |
| NFR-10 | Khả năng bảo trì | Tách module, tài liệu API, CI/CD |
| NFR-11 | Lưu trữ dữ liệu | Lead lưu tối đa (điền) tháng sau lần tương tác cuối rồi ẩn danh hóa; audit log lưu ≥ (điền) tháng |

### 3.5. Yêu cầu pháp lý & tuân thủ

> Các điểm dưới đây cần **tư vấn pháp lý xác nhận** trước khi chốt SRS. Người phụ trách pháp lý: (điền).

| Mã | Yêu cầu | Ảnh hưởng đến hệ thống |
|---|---|---|
| LGL-01 | **Địa giới hành chính 2 cấp** (hiệu lực từ 01/07/2025: 34 tỉnh/thành, bỏ cấp quận/huyện) | Model Location 2 cấp; bộ lọc 34 tỉnh/thành; lưu thêm "địa chỉ cũ" để hiển thị tham chiếu; bảng ánh xạ phường/xã cũ → mới để chuẩn hóa dữ liệu import và cho phép tìm theo tên cũ; landing page SEO vẫn hỗ trợ tên khu vực cũ mà người dùng quen tìm |
| LGL-02 | **Luật Kinh doanh BĐS 2023** và văn bản hướng dẫn: công khai thông tin BĐS đưa vào kinh doanh | Tin đăng/dự án có trường pháp lý bắt buộc (loại giấy tờ, tình trạng pháp lý); dự án hình thành trong tương lai cần thông tin cho phép bán/huy động vốn |
| LGL-03 | **Môi giới phải có chứng chỉ hành nghề** theo Luật KD BĐS 2023 | Lưu và hiển thị số chứng chỉ của môi giới; quy trình xác minh (FR-ADM-16); (điền: có bắt buộc đối tác bên ngoài khai chứng chỉ mới được đăng tin không) |
| LGL-04 | **Quy định thương mại điện tử**: website cho bên thứ ba đăng tin bán/cho thuê có thể thuộc diện sàn giao dịch TMĐT, phải đăng ký với Bộ Công Thương | Cần Quy chế hoạt động sàn công khai (FR-PUB-15); cơ chế xử lý khiếu nại, gỡ tin vi phạm (FR-PUB-20, FR-ADM-14); (điền: kết luận pháp lý về nghĩa vụ đăng ký, phải có trước khi mở Phase 2) |
| LGL-05 | **Bảo vệ dữ liệu cá nhân** (Luật Bảo vệ dữ liệu cá nhân và văn bản hướng dẫn) | Consent rõ ràng khi thu lead/newsletter; chính sách bảo mật; quyền truy cập/xóa dữ liệu (FR-ACC-10); thời hạn lưu (NFR-11); phân quyền xem SĐT khách theo §3.7; ghi log truy cập/xuất dữ liệu |
| LGL-06 | **Quản lý thông tin trên mạng**: xác thực tài khoản đăng nội dung, lưu vết, gỡ nội dung vi phạm | Xác thực SĐT khi đăng tin (FR-ACC-01); audit log (FR-ADM-12); (điền: có cần giấy phép trang thông tin điện tử tổng hợp không) |
| LGL-07 | Quyền sở hữu nội dung | Cấm sao chép nội dung/ảnh từ site tham chiếu; ảnh/tài liệu do môi giới/chủ đầu tư cung cấp phải có cam kết quyền sử dụng khi đăng |

### 3.6. Quy tắc nghiệp vụ

#### 3.6.1. Vòng đời tin đăng
`Nháp → Chờ duyệt → Đang hiển thị → (Hết hạn | Đã bán/Đã cho thuê | Bị ẩn do vi phạm | Bị từ chối)`
- Thời hạn hiển thị mặc định: (điền) ngày; gửi nhắc gia hạn trước (điền) ngày.
- Tin hết hạn/đã bán vẫn giữ URL (hiển thị nhãn + gợi ý tin tương tự) để không mất SEO; sau (điền) tháng thì noindex.
- Phát hiện **tin trùng**: cảnh báo khi trùng ảnh hoặc trùng (địa chỉ + diện tích + giá) với tin đang hiển thị.
- Mỗi tin có **mã tin** duy nhất, hiển thị công khai.
- Tiêu chí duyệt tin (checklist kiểm duyệt): (điền: ảnh tối thiểu, mô tả tối thiểu, nội dung cấm, có pháp lý...).
- SLA duyệt tin: (điền, đề xuất ≤ 4 giờ làm việc).

#### 3.6.2. Lead
- Nguồn lead: form tin/dự án, form liên hệ chung, click-to-call, Zalo, Messenger, newsletter.
- Trạng thái: `Mới → Đã liên hệ → Đang tư vấn → Đã chốt | Không thành (kèm lý do) | Spam/Trùng`.
- **Phân công**:
  - Lead từ tin của môi giới → gán cho người đăng tin.
  - Lead từ dự án/form chung → (điền: xoay vòng trong văn phòng phụ trách khu vực / trưởng văn phòng phân công tay).
- **SLA phản hồi**: (điền, đề xuất ≤ 15 phút giờ hành chính); quá hạn → nhắc lại và báo trưởng văn phòng.
- **Chống trùng**: cùng SĐT + cùng tin/dự án trong (điền) ngày → gộp vào lead cũ.
- **Định nghĩa "giao dịch thành công"** dùng cho KPI BO-2: lead ở trạng thái "Đã chốt" có (điền: hợp đồng/biên nhận cọc được xác nhận bởi trưởng văn phòng).

#### 3.6.3. Báo cáo vi phạm
- Guest không cần đăng nhập vẫn báo cáo được (có captcha).
- Editor xử lý trong (điền) giờ; tin bị ≥ (điền) báo cáo được tự động ẩn tạm chờ xem xét.
- Tài khoản bị xác nhận vi phạm (điền) lần → khóa đăng tin.

### 3.7. Ma trận phân quyền (sơ lược)

| Chức năng | Guest | Đối tác MG | MG nội bộ | Trưởng VP | Editor | Admin | Lãnh đạo |
|---|---|---|---|---|---|---|---|
| Xem tin/dự án công khai | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Đăng/sửa tin | — | Tin của mình | Tin của mình | Tin trong VP | Tất cả | Tất cả | — |
| Duyệt tin, xử lý vi phạm | — | — | — | — | ✔ | ✔ | — |
| CRUD dự án, bài viết | — | — | — | — | ✔ | ✔ | — |
| Xem lead (gồm SĐT khách) | — | Lead của mình | Lead của mình | Lead trong VP | — | ✔ | Số liệu tổng hợp |
| Phân công lead | — | — | — | Trong VP | — | ✔ | — |
| Xuất dữ liệu lead | — | — | — | (điền) | — | ✔ (ghi log) | — |
| Quản lý người dùng, phân quyền | — | — | — | — | — | ✔ | — |
| Dashboard | — | Của mình | Của mình | Của VP | Nội dung | Toàn hệ thống | Toàn hệ thống |

---

## 4. Luồng nghiệp vụ chính (Business Flows)

### 4.1. Khách tìm & liên hệ (Guest → Lead)
1. Guest vào trang chủ → chọn danh mục (Bán/Thuê/Dự án).
2. Áp dụng bộ lọc (khu vực, giá, diện tích...).
3. Xem danh sách → mở trang chi tiết.
4. Bấm "Liên hệ" / hotline / Zalo / điền form tư vấn (đồng ý xử lý dữ liệu cá nhân).
5. Hệ thống tạo **Lead**, kiểm tra trùng →
   - Phase 1: gửi email cho người phụ trách (người đăng tin hoặc hộp thư văn phòng); Admin/Trưởng VP phân công thủ công trong CMS.
   - Phase 2: phân công tự động theo §3.6.2, thông báo realtime/email/Zalo OA.
6. Môi giới liên hệ, cập nhật trạng thái lead theo §3.6.2.

### 4.2. Môi giới đăng tin (Self-service — Phase 2)
1. Đăng nhập (đã xác thực SĐT) → chọn "Đăng tin" → chọn loại (bán/thuê).
2. Nhập thông tin (gồm pháp lý), upload ảnh/tài liệu, chọn danh mục & khu vực, ghim bản đồ.
3. Hệ thống kiểm tra trùng → gửi → trạng thái "Chờ duyệt".
4. Editor duyệt/từ chối (kèm lý do) theo checklist §3.6.1.
5. Tin hiển thị công khai; môi giới theo dõi view/lead; gia hạn hoặc đánh dấu đã bán.

> Tin **dự án** chỉ do Editor/Admin tạo (FR-ADM-02), môi giới không tự đăng dự án.

### 4.3. Quản trị nội dung
1. Admin/Editor tạo/sửa Dự án, Tin, Bài viết, Danh mục (hoặc import hàng loạt — FR-ADM-15).
2. Gắn SEO (title, description, slug, ảnh).
3. Xuất bản / hẹn giờ / ẩn.
4. Theo dõi dashboard.

### 4.4. Nhập liệu ban đầu (trước go-live Phase 1)
1. Xác định nguồn dữ liệu: (điền: file Excel của văn phòng/môi giới; dữ liệu chủ đầu tư; nhập tay qua CMS).
2. Làm sạch & chuẩn hóa: địa chỉ theo địa giới mới (LGL-01), danh mục, đơn vị giá, loại bỏ tin hết hạn/trùng.
3. Import qua FR-ADM-15, kiểm tra mẫu.

---

## 5. Mô hình dữ liệu (sơ lược)

Thực thể chính:
- **User** (id, vai trò, văn phòng, SĐT đã xác thực, số chứng chỉ môi giới, trạng thái xác minh, trạng thái)
- **Category** (loại nhà đất, loại dự án, chuyên mục tin — cấu hình được)
- **Location** — 2 cấp: Tỉnh/Thành phố → Phường/Xã/Đặc khu; kèm bảng **LocationLegacyMap** (tỉnh/quận/phường cũ → phường/xã mới) phục vụ chuẩn hóa dữ liệu import, tìm kiếm theo tên cũ và landing page SEO
- **Property** (tin bán/thuê):
  - Cơ bản: mã tin, tiêu đề, mô tả, loại giao dịch (bán/thuê), danh mục, người đăng, văn phòng
  - Giá: giá, đơn vị (tổng / theo m² / theo tháng), thỏa thuận (có/không)
  - Đặc điểm: diện tích, mặt tiền, đường vào, số tầng, số phòng ngủ, số WC, hướng nhà, hướng ban công, nội thất
  - Vị trí: địa chỉ (theo địa giới mới), địa chỉ cũ (tham chiếu), Location, **tọa độ lat/lng**, dự án liên quan (nếu có)
  - Pháp lý: loại giấy tờ (sổ đỏ/sổ hồng, HĐMB, đang chờ sổ, khác), ghi chú pháp lý
  - Media: ảnh, video, tài liệu
  - Vòng đời: trạng thái (§3.6.1), ngày đăng, ngày duyệt, ngày hết hạn, lý do từ chối, VIP
- **Project** (dự án: tên, chủ đầu tư, loại, vị trí + tọa độ, trạng thái mở bán, pháp lý dự án, tiện ích, mặt bằng, chính sách bán, tài liệu)
- **Article** (tin tức: tiêu đề, nội dung, chuyên mục, tags, tác giả, trạng thái, lịch xuất bản)
- **Lead** (nguồn, tin/dự án liên quan, họ tên, SĐT, email, nhu cầu, consent + thời điểm consent, trạng thái, môi giới phụ trách, văn phòng, lịch sử chăm sóc, mốc SLA)
- **Report** (báo cáo vi phạm: tin bị báo cáo, lý do, người báo cáo, trạng thái xử lý)
- **Office** (văn phòng/chi nhánh, khu vực phụ trách)
- **Media** (hình ảnh, tài liệu)
- **Package/Order** (gói đăng tin, thanh toán — Phase 3)
- **AuditLog** (người thao tác, hành động, đối tượng, thời điểm)
- **Setting/Menu/Banner/SEO/Redirect**

---

## 6. Kiến trúc & công nghệ đề xuất

> Đây là gợi ý kỹ thuật, có thể điều chỉnh theo đội ngũ.

- **Frontend:** Next.js/Nuxt (SSR/SSG cho SEO) + React/Vue, TailwindCSS, mobile-first.
- **Backend:** Node.js (NestJS) hoặc Laravel/PHP, REST/GraphQL API.
- **Database:** PostgreSQL/MySQL + Redis cache.
- **Search:** Phase 1 có thể dùng truy vấn DB + index; Phase 3 bổ sung Elasticsearch / Meilisearch (autocomplete, geo search).
- **Storage:** S3-compatible cho ảnh/tài liệu, CDN (Cloudflare).
- **Realtime/Notification:** WebSocket hoặc queue (email/SMS/Zalo OA).
- **Hạ tầng:** Docker, CI/CD, cloud VPS, monitoring (Sentry, Grafana). (điền: yêu cầu đặt máy chủ/lưu dữ liệu tại Việt Nam nếu pháp lý yêu cầu)
- **Bảo mật:** JWT/session, WAF, captcha, rate limit.

---

## 7. Tích hợp (Integrations)

| Tích hợp | Mục đích | Ưu tiên | Phase |
|---|---|---|---|
| Email (SMTP/SendGrid) | Thông báo lead, newsletter | Must | 1 |
| Google Analytics / GTM | Đo lường traffic, sự kiện click-to-call | Must | 1 |
| Zalo OA / Zalo chat | Tư vấn khách hàng, thông báo lead | Should | 1 (nút chat) / 2 (thông báo) |
| Facebook Messenger / Pixel | Kênh liên hệ, marketing | Should | 2 |
| SMS Brandname | OTP, thông báo | Must | 2 (đi kèm FR-ACC-01/02) |
| Google Maps / Mapbox | Hiển thị vị trí (Phase 1), tìm theo bản đồ (Phase 3) | Should | 1 / 3 |
| Call tracking / tổng đài ảo | Đo lường cuộc gọi hotline (FR-PUB-21) | Should | 2 |
| CRM (HubSpot/Bitrix) | Quản lý lead | Could | 3 |
| Cổng thanh toán (VNPay/Momo) | Thu phí đăng tin | Could | 3 |

---

## 8. Yêu cầu SEO & Marketing
- URL thân thiện, phân cấp như mẫu (`/ban-can-ho-tay-ho/`, `/cho-thue-biet-thu-ciputra/`).
- Landing page theo khu vực/loại hình (bán nhà Tây Hồ, thuê căn hộ Ciputra...). Với tên khu vực cũ (quận/huyện đã giải thể) vẫn giữ landing page theo tên người dùng quen tìm, nội dung map sang phường/xã mới (LGL-01).
- Redirect 301 khi đổi slug.
- Schema.org (BreadcrumbList, RealEstateListing, Article).
- Sitemap.xml, robots.txt, canonical, meta OG; hreflang khi có EN (Phase 3).
- Tối ưu Core Web Vitals, ảnh WebP, lazy-load.

---

## 9. Chỉ số đo lường (KPIs)
- Số tin đăng mới/tuần; tỷ lệ tin được duyệt; thời gian duyệt trung bình.
- Số lead hợp lệ, tỷ lệ lead → giao dịch thành công (định nghĩa §3.6.2), thời gian phản hồi lead (so với SLA).
- Số click-to-call/Zalo theo tin/dự án.
- Traffic organic, keyword ranking (danh sách mục tiêu BO-3), bounce rate.
- Tỷ lệ tin bị báo cáo vi phạm được xác nhận.
- Doanh thu gói đăng tin / quảng cáo (từ Phase 3).
- Uptime, Core Web Vitals.

---

## 10. Lộ trình triển khai (Roadmap đề xuất)

| Phase | Nội dung | Thời gian dự kiến |
|---|---|---|
| Phase 1 — MVP | Public site (trang chủ, danh mục, chi tiết tin/dự án, bài viết, tìm kiếm & lọc cơ bản, trang tĩnh, sitemap), form liên hệ → lead + phân công thủ công, báo cáo vi phạm, CMS cơ bản, RBAC, audit log, dashboard cơ bản, import & nhập liệu ban đầu, địa giới 2 cấp | 2–3 tháng |
| Phase 2 — Self-service & Lead | Tài khoản + OTP, đăng tin self-service, kiểm duyệt nâng cao, lead pipeline đầy đủ, dashboard nâng cao, newsletter, tuyển dụng, xác minh môi giới, đo lường hotline. **Điều kiện mở:** có kết luận pháp lý LGL-04 | +2–3 tháng |
| Phase 3 — Nâng cao & doanh thu | Map search, autocomplete, VIP/gói đăng tin/thanh toán, báo cáo doanh thu, đa ngôn ngữ, CRM, wishlist/so sánh | +2–3 tháng |

---

## 11. Rủi ro & Giả định

**Rủi ro:**
- Chất lượng/dữ liệu tin đăng không đồng đều → cần kiểm duyệt & chống spam.
- Không có dữ liệu sẵn (không migrate) → site mới ra mắt sẽ ít tin, khó đạt traffic/SEO ban đầu; cần kế hoạch nhập liệu và thu hút đối tác đăng tin.
- Dữ liệu nguồn (Excel văn phòng) có thể theo địa giới cấp quận/huyện cũ → tốn công chuẩn hóa sang 2 cấp.
- Sàn có thể phải đăng ký TMĐT/giấy phép trước khi mở đăng tin cho bên ngoài → có thể làm trễ Phase 2.
- SEO cạnh tranh cao → cần chiến lược nội dung & backlink.
- Chi phí lưu trữ ảnh lớn → cần CDN và nén ảnh.
- Rò rỉ dữ liệu khách hàng (SĐT lead) qua môi giới → phân quyền chặt, log truy cập/xuất dữ liệu.

**Giả định:**
- Có sẵn nguồn tin/dữ liệu từ đối tác môi giới và chủ đầu tư (điền: nguồn cụ thể và người cung cấp).
- Đội ngũ có kinh nghiệm full-stack JS hoặc PHP.
- Ngân sách hạ tầng cloud và CDN được phê duyệt.
- Có đầu mối pháp lý tư vấn các mục §3.5.

---

## 12. Phụ lục — Ma trận ưu tiên (MoSCoW tổng hợp, khớp §3 và §10)

- **Must:**
  - Phase 1: public site, danh mục, chi tiết tin/dự án, tìm kiếm & lọc cơ bản, form liên hệ → lead + phân công thủ công, báo cáo vi phạm, CMS, RBAC, audit log, dashboard cơ bản, SEO cơ bản, import/nhập liệu ban đầu, địa giới 2 cấp, tuân thủ pháp lý.
  - Phase 2: tài khoản + OTP, đăng tin self-service, lead pipeline đầy đủ, quyền dữ liệu cá nhân của người dùng.
- **Should:** văn phòng/chi nhánh, newsletter, tuyển dụng, dashboard nâng cao, báo cáo hiệu quả tin, xác minh môi giới, đo lường hotline, map search, autocomplete.
- **Could:** wishlist/so sánh, đa ngôn ngữ, gói VIP/đẩy tin/thanh toán, báo cáo doanh thu, CRM integration.
- **Won't (giai đoạn đầu):** App native, đặt cọc online, ký số.

---

## 13. Câu hỏi mở cần quyết định

| # | Câu hỏi | Ảnh hưởng | Trạng thái | Người quyết | Hạn |
|---|---|---|---|---|---|
| Q1 | Quan hệ với bdstanlong.vn? | Migration, SEO, bản quyền nội dung | ✅ Đã chốt 15/10/2026: chỉ tham khảo, không migrate | — | — |
| Q2 | Mục tiêu số tin active sau 12 tháng và nguồn tin chính (không có dữ liệu migrate)? | KPI BO-1, kế hoạch nhập liệu Phase 1 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q3 | Kết luận pháp lý: đăng ký sàn TMĐT / giấy phép trang TTĐT? | Điều kiện mở Phase 2 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q4 | Có bắt buộc đối tác bên ngoài khai chứng chỉ môi giới mới được đăng tin? | FR-ACC-03, FR-ADM-16 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q5 | Lead từ trang dự án/form liên hệ chung giao cho ai (tự chia lần lượt / trưởng VP giao / đầu mối CSKH) và sale phải gọi lại khách trong bao lâu? | FR-ADM-06b | ⏳ Chờ hỏi | (điền) | (điền) |
| Q6 | Định nghĩa "giao dịch thành công" và cách xác nhận? | KPI BO-2 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q7 | Website có thu tiền trực tiếp không (gói đăng tin/VIP, banner)? Nếu có: mục tiêu doanh thu năm. Nếu không: bỏ BO-6 và các FR thanh toán | BO-6, Phase 3 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q8 | Có làm tiếng Anh không? | FR-PUB-18, FR-ADM-13 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q9 | Thời hạn hiển thị tin, SLA duyệt tin, checklist kiểm duyệt? | §3.6.1 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q10 | Thời hạn lưu lead/audit log? | NFR-11, LGL-05 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q11 | Danh sách từ khóa SEO mục tiêu? | KPI BO-3 | ⏳ Chờ hỏi | (điền) | (điền) |
| Q12 | Số người dùng đồng thời mục tiêu? | NFR-02, chi phí hạ tầng | ⏳ Chờ hỏi | (điền) | (điền) |

---

*Tài liệu này là bản nháp. Cần trả lời các câu hỏi mở ở §13, bổ sung thông tin quản lý dự án ở đầu tài liệu và có xác nhận pháp lý cho §3.5 trước khi chuyển sang giai đoạn thiết kế (SRS/FRD).*
