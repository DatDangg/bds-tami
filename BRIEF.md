# Project Brief

## Project Name
Website TAMI

## Description
Website thương hiệu của TAMI, doanh nghiệp bất động sản làm phân phối dự án cho chủ đầu tư, môi giới và khai thác căn hộ dịch vụ.
Công ty tự đăng dự án, BĐS cho thuê, tin BĐS / voucher / ưu đãi, tin tức, tin tuyển dụng. Khách xem rồi để lại liên hệ, lead được giao cho sale chăm sóc.
Mục tiêu chính: tạo niềm tin, xây dựng nhận diện thương hiệu và thu lead cho đội sale.

Chi tiết: `docs/BRD.md` (v1.3).

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
- **Không có** mục Mua bán; **không** cho người ngoài đăng tin ở giai đoạn này

## Non-functional Requirements
- SEO: SSR/ISR, sitemap, schema.org (gồm `JobPosting`)
- Core Web Vitals "Good" trên mobile; API lọc p95 ≤ 500ms
- Thiết kế cho 100.000 tin / 1.000 người đồng thời; app stateless, scale ngang được
- Bảo mật: HTTPS, Cloudflare, Turnstile + rate limit cho form, lớp xác thực thứ 2 cho `/admin`, CV không có link công khai
- Backup ra ngoài server (RPO ≤ 15 phút, RTO ≤ 4 giờ); có staging riêng
- Chỉ dùng phần mềm mã nguồn mở, tự host trên server của công ty

## Notes
- Stack: Next.js + Payload CMS 3 + PostgreSQL (PostGIS) + Redis + SeaweedFS, Docker Compose, Cloudflare. Chi tiết: `docs/ARCHITECTURE.md`
- Dữ liệu: `docs/ERD.md` · Phân quyền: `docs/PERMISSION.md` · API: `docs/API_SPEC.md`
- Tham khảo giao diện: https://vinhomes.vn/ (chỉ bố cục, không sao chép nội dung)
- Chuẩn bị sẵn để sau này có thể mở cho bên ngoài đăng tin (ARCHITECTURE §9.2), nhưng không làm tính năng đó bây giờ
- Còn chờ: logo/màu thương hiệu (`docs/DESIGN.md`), cấu hình server, tên miền, nội dung ban đầu
