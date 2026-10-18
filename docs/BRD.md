# Business Requirements Document (BRD) — Website TAMI

| Thông tin | Nội dung |
|---|---|
| Tên dự án | Website thương hiệu TAMI |
| Phiên bản | 1.6 |
| Ngày | 19/10/2026 |
| Trạng thái | Đã duyệt phạm vi giai đoạn 1 |
| Người soạn | (điền) |
| Người phê duyệt | (điền) |
| Mốc go-live mong muốn | (điền) |
| Tham khảo giao diện | https://vinhomes.vn/ — bố cục và phong cách theo vinhomes.vn, dùng màu/logo/ảnh/nội dung của TAMI, không sao chép nội dung/hình ảnh (chi tiết `docs/DESIGN.md`) |
| Tài liệu liên quan | `docs/ARCHITECTURE.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/API_SPEC.md` |

### Lịch sử phiên bản

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0–1.2 | 15/10/2026 | Bản nháp theo hướng **sàn BĐS** (tham chiếu bdstanlong.vn). Lưu tại `docs/archive/BRD-v1.2-san-bds.md`, chỉ để tham khảo |
| 1.3 | 16/10/2026 | **Đổi định vị**: website thương hiệu của TAMI, công ty tự đăng nội dung, khách để lại liên hệ. Bỏ toàn bộ tính năng sàn (tài khoản người ngoài, kiểm duyệt, báo cáo vi phạm, VIP/thanh toán, xác minh môi giới). Bỏ mục Mua bán. Thêm Dịch vụ, Đăng tin BĐS (tin BĐS/voucher), Tuyển dụng vào giai đoạn 1. Chỉ 2 vai trò: Admin, Sale |
| 1.4 | 16/10/2026 | **Song ngữ Việt – Anh**: website công khai có bản tiếng Anh (URL `/en/...`), tiếng Việt là mặc định. Thêm §2.1, FR-PUB-18, 19, FR-ADM-17, BR-07, BR-17; sửa FR-PUB-15, BR-05, A5. Chốt giao diện theo phong cách vinhomes.vn. Trang quản trị vẫn chỉ tiếng Việt |
| 1.5 | 16/10/2026 | **AI tự dịch sang tiếng Anh** (Claude API): xuất bản bản tiếng Việt là tự dịch và hiện bản tiếng Anh, nhân viên sửa tay được; trang pháp lý phải duyệt tay. Thêm FR-ADM-18, BR-08; sửa FR-ADM-17, BR-07, NFR-09, A5, Q5, ngoài phạm vi |
| 1.6 | 19/10/2026 | BR-08: sửa tay bản tiếng Anh của trang pháp lý đã duyệt → ẩn `/en` tới khi admin duyệt lại (user quyết 19/10/2026, BL-013) |

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
- SEO, responsive mobile-first.
- **Song ngữ**: tiếng Việt (mặc định) và tiếng Anh cho toàn bộ website công khai (giao diện + mọi loại nội dung). Bản tiếng Anh do **AI tự dịch** từ bản tiếng Việt, nhân viên sửa tay khi cần. Trang quản trị chỉ tiếng Việt.

**Ngoài phạm vi:**
- Mục **Mua bán** (không làm).
- Tài khoản cho khách hoặc môi giới bên ngoài, tự đăng tin, kiểm duyệt tin, báo cáo vi phạm.
- Gói đăng tin, VIP, thanh toán online.
- Tính hoa hồng, CRM chuyên sâu.
- Ngôn ngữ thứ 3 trở lên; dịch chiều Anh → Việt; dịch dữ liệu khách gửi (lead, CV).
- Giao diện trang quản trị bằng tiếng Anh.
- App mobile native, tìm kiếm theo bản đồ, autocomplete.

> Hệ thống được thiết kế để **có thể mở rộng** cho bên ngoài đăng tin sau này (xem `docs/ARCHITECTURE.md` §9), nhưng không xây dựng tính năng đó trong giai đoạn 1.

### 1.4. Người dùng

| Người dùng | Vai trò | Nhu cầu |
|---|---|---|
| Khách truy cập | Không đăng nhập | Tìm hiểu TAMI, xem dự án / BĐS cho thuê / ưu đãi / tin tức, để lại liên hệ, ứng tuyển |
| **Admin** | 1 tài khoản, quản trị toàn quyền | Quản lý mọi nội dung, cấu hình web, tài khoản sale, phân công lead, xem CV |
| **Sale** | Nhiều tài khoản | Đăng dự án, tin cho thuê, Đăng tin BĐS, tin tức, tuyển dụng (Dịch vụ và trang pháp lý chỉ admin); chăm sóc lead được giao |

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

### 2.1. URL theo ngôn ngữ

Tiếng Việt **không có tiền tố**; tiếng Anh có tiền tố `/en` và đường dẫn tiếng Anh. Slug của từng bài cũng theo ngôn ngữ (bản tiếng Anh có slug tiếng Anh riêng).

| Trang | Tiếng Việt | Tiếng Anh |
|---|---|---|
| Trang chủ | `/` | `/en` |
| Dự án | `/du-an`, `/du-an/[slug]` | `/en/projects`, `/en/projects/[slug]` |
| Cho thuê | `/cho-thue`, `/cho-thue/danh-muc/[category]`, `/cho-thue/khu-vuc/[province]`, `/cho-thue/[slug]` | `/en/for-rent`, `/en/for-rent/category/[category]`, `/en/for-rent/area/[province]`, `/en/for-rent/[slug]` |
| Đăng tin BĐS | `/tin-bds`, `/tin-bds/danh-muc/[category]`, `/tin-bds/[slug]` | `/en/property-news`, `/en/property-news/category/[category]`, `/en/property-news/[slug]` |
| Tin tức | `/tin-tuc`, `/tin-tuc/danh-muc/[category]`, `/tin-tuc/[slug]` | `/en/news`, `/en/news/category/[category]`, `/en/news/[slug]` |
| Tuyển dụng | `/tuyen-dung`, `/tuyen-dung/[slug]` | `/en/careers`, `/en/careers/[slug]` |
| Liên hệ | `/lien-he` | `/en/contact` |
| Dịch vụ | `/dich-vu/[slug]` | `/en/services/[slug]` |
| Pháp lý | `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` | `/en/privacy-policy`, `/en/terms-of-use` |
| Quản trị | `/admin` | — (chỉ tiếng Việt) |

- Khách vào lần đầu luôn thấy tiếng Việt; **không** tự chuyển theo ngôn ngữ trình duyệt (để Google index đủ cả hai bản). Lựa chọn của khách được nhớ bằng cookie.
- Tên tỉnh/thành, phường/xã giữ nguyên tiếng Việt ở cả hai bản (tên riêng); slug địa danh dùng chung.

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
| FR-PUB-15 | SEO: URL thân thiện, meta, Open Graph, `sitemap.xml`, `robots.txt`, breadcrumb, schema.org (`RealEstateListing`, `Article`, `JobPosting`, `Organization`) | Must | Mỗi bản ngôn ngữ có meta riêng, `<html lang>` đúng, thẻ `hreflang` (`vi`, `en`, `x-default` → bản tiếng Việt) trỏ chéo khi có cả hai bản; sitemap liệt kê cả hai bản |
| FR-PUB-16 | Trang đích theo khu vực cho Cho thuê, ví dụ `/cho-thue/khu-vuc/ha-noi` | Should | |
| FR-PUB-17 | Khối giới thiệu đối tác / chủ đầu tư (logo) trên trang chủ | Should | |
| FR-PUB-18 | Website công khai song ngữ Việt – Anh: giao diện (menu, nút, nhãn, form, thông báo lỗi, thông báo cảm ơn) và nội dung (trang chủ, dự án, cho thuê, Đăng tin BĐS, tin tức, dịch vụ, tuyển dụng, trang pháp lý, menu/footer, danh mục) | Must | URL theo §2.1; bản EN chỉ hiện nội dung đã có bản dịch (BR-07); số, ngày hiển thị theo định dạng của ngôn ngữ đang xem; tiền luôn là VNĐ |
| FR-PUB-19 | Nút chuyển ngôn ngữ VI / EN trên header, menu và footer | Must | Chuyển sang đúng trang tương ứng ở ngôn ngữ kia; trang chưa có bản dịch thì về trang danh sách (hoặc trang chủ) của ngôn ngữ kia |

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
| FR-ADM-17 | **AI tự dịch** bản tiếng Anh cho mọi nội dung và cấu hình hiển thị (trang chủ, menu, footer, danh mục) khi bản tiếng Việt được xuất bản hoặc sửa (BR-08) | Must | Bản tiếng Anh lên web trong ≤ 10 phút sau khi xuất bản; dịch lỗi thì thử lại, vẫn lỗi thì bản EN không hiện và admin thấy cảnh báo; giữ nguyên định dạng bài (tiêu đề, danh sách, đậm, link, ảnh) |
| FR-ADM-18 | Xem và sửa tay bản tiếng Anh (chuyển VI / EN ngay trong form soạn bài); nút **"Dịch lại bằng AI"**; lọc nội dung theo trạng thái dịch (chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đã đổi sau khi sửa tay) | Must | Bản đã sửa tay **không** bị AI dịch đè, trừ khi bấm "Dịch lại bằng AI" |

---

## 4. Quy tắc nghiệp vụ

### 4.1. Nội dung

- **BR-01** Trạng thái tin cho thuê: `Nháp → Đang hiển thị → Ẩn | Đã thuê`. Tin `Đã thuê` vẫn giữ URL, hiện nhãn và gợi ý tin tương tự.
- **BR-02** Bài viết (dự án, Đăng tin BĐS, tin tức, tuyển dụng): `Nháp → Đã xuất bản → Ẩn`.
- **BR-03** Xóa nội dung là **xóa mềm**; chỉ admin khôi phục hoặc xóa hẳn.
- **BR-04** Mỗi nội dung có người đăng (`author`). Sale chỉ sửa/xóa nội dung **của mình**; admin sửa/xóa tất cả. ⚠️ Giả định, chỉnh được.
- **BR-05** Slug tự sinh từ tiêu đề **theo từng ngôn ngữ** (tiếng Việt bỏ dấu; tiếng Anh lấy từ tiêu đề tiếng Anh), không trùng trong cùng loại và cùng ngôn ngữ. Đổi slug của nội dung đã xuất bản thì tự tạo redirect 301 cho đúng ngôn ngữ đó.
- **BR-06** Bài Đăng tin BĐS có hạn ưu đãi: quá hạn thì gắn nhãn "Đã kết thúc" và rời khối "Ưu đãi nổi bật".
- **BR-07** Trạng thái xuất bản (`status`) dùng chung cho cả hai ngôn ngữ. Bản tiếng Việt là bắt buộc. Nội dung chỉ hiện ở bản tiếng Anh khi đã có bản dịch hoàn chỉnh (cờ "Đã có bản tiếng Anh", hệ thống tự bật khi AI dịch xong hoặc nhân viên sửa tay đủ trường bắt buộc); chưa có thì **không** hiện ở `/en` (không lấy chữ tiếng Việt thay vào), không có trong sitemap tiếng Anh, URL tiếng Anh trả 404.
- **BR-08** Dịch tự động:
  - Xuất bản / sửa bản tiếng Việt thì AI dịch **các trường đã đổi** sang tiếng Anh và tự hiện bản tiếng Anh (không chờ duyệt).
  - Nhân viên sửa tay bản tiếng Anh thì bản đó thành "đã sửa tay": AI không dịch đè nữa; khi bản tiếng Việt đổi tiếp, admin/người đăng thấy nhắc "bản Việt đã đổi" để tự sửa hoặc bấm "Dịch lại bằng AI".
  - **Trang pháp lý** (Chính sách bảo mật, Điều khoản) AI chỉ dịch nháp; **admin duyệt** rồi mới hiện ở `/en`.
  - Bản tiếng Anh của trang pháp lý **đã duyệt** mà bị sửa tay tiếp (sửa nội dung tiếng Anh, không phải bấm duyệt) thì mất trạng thái duyệt và **ẩn khỏi `/en`** cho tới khi admin duyệt lại — giống khi AI dịch lại. Lưu mà không đổi nội dung tiếng Anh (chỉ sửa bản Việt hoặc thông tin khác) thì giữ duyệt.
  - Tên riêng giữ nguyên: TAMI HOMES, tên dự án, tên chủ đầu tư, tên đường, địa danh. Dùng bảng thuật ngữ do admin cấu hình (vd "căn hộ dịch vụ" → "serviced apartment").
  - Chỉ gửi **nội dung công khai** cho dịch vụ AI; **không bao giờ** gửi lead, CV, dữ liệu khách hàng hay dữ liệu nội bộ.

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
- **BR-17** Lead lưu **ngôn ngữ khách đã dùng** khi gửi form (`vi` / `en`), hiện trong admin và email thông báo để sale chọn ngôn ngữ khi liên hệ. Email gửi nội bộ luôn bằng tiếng Việt. Chống trùng (BR-15) không phân biệt ngôn ngữ.

### 4.3. Tuyển dụng

- **BR-20** Trạng thái hồ sơ: `Mới → Đang xem → Phỏng vấn → Nhận | Loại`.
- **BR-21** Có hồ sơ mới thì email báo admin. Hồ sơ cũng lưu ngôn ngữ khách đã dùng như BR-17.

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
| NFR-09 | Chi phí | Chỉ dùng phần mềm mã nguồn mở, tự host trên server của công ty. Dịch vụ trả phí chỉ gồm tên miền (và email/SMS nếu vượt gói free) và **Claude API** để dịch tiếng Anh (tính theo lượng chữ dịch; đặt hạn mức chi tiêu hằng tháng, vượt hạn mức thì dừng dịch và báo admin) |
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
| A5 | Song ngữ Việt – Anh, tiếng Việt mặc định; admin chỉ tiếng Việt; bản tiếng Anh do AI (Claude API) tự dịch, tự lên web, nhân viên sửa tay được | ✅ Chốt 16/10/2026 |
| Q5 | Ai dịch tiếng Anh: ✅ AI tự dịch (BR-08). Bản tiếng Anh của Chính sách bảo mật / Điều khoản có cần luật sư duyệt không | ⏳ Chờ trả lời (hiện: admin duyệt) |
| Q6 | Hạn mức chi phí Claude API mỗi tháng | ⏳ Chờ điền |
| A6 | Mục tiêu tải khi thiết kế: 100.000 tin, 1.000 người đồng thời (NFR-02) | ⚠️ Giả định |
| Q1 | Mục tiêu KPI cụ thể (BO-1…BO-4) | ⏳ Chờ điền |
| Q2 | Logo, font, hình ảnh (cho `docs/DESIGN.md`) | ✅ Màu + logo đã có 16/10/2026 (`assets/brand/`) · ✅ font tạm chốt EB Garamond + Montserrat theo phong cách vinhomes.vn (đổi được nếu TAMI có font riêng) · ⏳ hình ảnh chờ cung cấp |
| Q3 | Cấu hình server, tên miền | ✅ Server đã kiểm tra 16/10/2026: VPS dùng chung 4 vCPU / 15GB RAM / SSD 200GB, đủ dùng (`docs/ARCHITECTURE.md` §6.1) · ⏳ tên miền chờ cung cấp |
| Q4 | Nội dung ban đầu: danh sách dự án, tin cho thuê, dịch vụ, bài giới thiệu | ⏳ Chờ cung cấp |
