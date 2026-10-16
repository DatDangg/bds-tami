# Project Brief

## Project Name
Website TAMI

## Description
Website thương hiệu của TAMI, doanh nghiệp bất động sản làm phân phối dự án cho chủ đầu tư, môi giới và khai thác căn hộ dịch vụ.
Công ty tự đăng dự án, BĐS cho thuê, tin BĐS / voucher / ưu đãi, tin tức, tin tuyển dụng. Khách xem rồi để lại liên hệ, lead được giao cho sale chăm sóc.
Mục tiêu chính: tạo niềm tin, xây dựng nhận diện thương hiệu và thu lead cho đội sale.

Website song ngữ: tiếng Việt (mặc định) và tiếng Anh (`/en`). Trang quản trị chỉ tiếng Việt.

Chi tiết: `docs/BRD.md` (v1.4).

## Target Users
- Khách tìm thuê BĐS, tìm hiểu dự án, quan tâm ưu đãi của TAMI (không cần đăng nhập)
- Ứng viên tuyển dụng
- Nhân viên TAMI: 1 Admin + nhiều Sale (đăng bài, chăm sóc lead)

## Core Features
- Trang chủ = trang giới thiệu TAMI (Hero slide, Về TAMI, Dự án nổi bật, Dịch vụ, Ưu đãi nổi bật, Footer liên hệ)
- Dự án: danh sách, chi tiết, form để lại thông tin
- Cho thuê: danh sách BĐS cho thuê có bộ lọc, chi tiết, form liên hệ
- Đăng tin BĐS: tin BĐS, voucher, ưu đãi theo danh mục, có form liên hệ
- Tin tức: tin tức chung (khác Đăng tin BĐS, không thu lead)
- Tuyển dụng: danh sách việc, nộp CV
- Liên hệ, trang Dịch vụ, trang pháp lý; nút nổi Hotline / Zalo / Fanpage
- Admin (Payload CMS): đăng mọi loại bài, danh mục cha–con cho từng loại, quản lý lead (phân công, trạng thái, ghi chú, xuất Excel), tài khoản sale, cấu hình trang chủ
- Song ngữ Việt – Anh cho toàn bộ website công khai; nút chuyển ngôn ngữ VI / EN; bản tiếng Anh do nhân viên nhập trong admin
- **Không có** mục Mua bán; **không** cho người ngoài đăng tin ở giai đoạn này

## Non-functional Requirements
- SEO: SSR/ISR, sitemap, schema.org (gồm `JobPosting`), `hreflang` cho hai ngôn ngữ
- Core Web Vitals "Good" trên mobile; API lọc p95 ≤ 500ms
- Thiết kế cho 100.000 tin / 1.000 người đồng thời; app stateless, scale ngang được
- Bảo mật: HTTPS, Cloudflare, Turnstile + rate limit cho form, lớp xác thực thứ 2 cho `/admin`, CV không có link công khai
- Backup ra ngoài server (RPO ≤ 15 phút, RTO ≤ 4 giờ); có staging riêng
- Chỉ dùng phần mềm mã nguồn mở, tự host trên server của công ty

## Notes
- Stack: Next.js + Payload CMS 3 + PostgreSQL (PostGIS) + Redis + SeaweedFS, Docker Compose, Nginx có sẵn, Cloudflare. Chi tiết: `docs/ARCHITECTURE.md`
- Server: VPS dùng chung 4 vCPU / 15GB RAM / SSD 200GB (SSH alias `server`), đã kiểm tra đủ dùng (ARCHITECTURE §6.1)
- Dữ liệu: `docs/ERD.md` · Phân quyền: `docs/PERMISSION.md` · API: `docs/API_SPEC.md`
- Giao diện: bố cục và phong cách theo https://vinhomes.vn/ (hero full màn hình, tiêu đề serif in hoa, slider dự án), dùng màu/logo/ảnh/nội dung của TAMI, không sao chép nội dung (`docs/DESIGN.md`)
- Chuẩn bị sẵn để sau này có thể mở cho bên ngoài đăng tin (ARCHITECTURE §9.2), nhưng không làm tính năng đó bây giờ
- Màu thương hiệu và logo đã có (`docs/DESIGN.md`, `assets/brand/`). Font tạm chốt EB Garamond + Montserrat. Còn chờ: tên miền, nội dung ban đầu (cả bản tiếng Anh)
