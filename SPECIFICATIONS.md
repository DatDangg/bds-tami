# SPECIFICATIONS.md

<!--
  Dự án làm mới từ đầu (chưa có code): file này được viết tay ngày 16/10/2026 từ thiết kế đã duyệt,
  thay vì reverse-engineer bằng /spec-init. Sau khi build, mọi thay đổi đi qua `/change` (agent change-request).
  Nguồn: docs/BRD.md v1.5 · docs/ARCHITECTURE.md · docs/ERD.md · docs/PERMISSION.md · docs/API_SPEC.md · docs/DESIGN.md
-->

- **spec_version:** 1.5.0
- **updated_at:** 2026-10-19
- **Trạng thái:** đã duyệt thiết kế, chưa có code

## Overview

Website thương hiệu TAMI (BĐS: phân phối, môi giới, khai thác căn hộ dịch vụ). Công ty tự đăng nội dung; khách xem và để lại liên hệ; lead được giao cho sale. Một app Next.js + Payload CMS gồm website công khai và trang quản trị `/admin`.

**Menu:** Trang chủ (= giới thiệu) · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ. **Không có Mua bán.**

**Khung trang:** header ≥ xl một hàng (logo trái · menu giữa · tìm, VI|EN, nút CTA, nút Menu phải). Logo lấy từ CMS `site-settings.logo` / `logoDark` (thiếu → logo mặc định); nút CTA lấy từ global `header.ctaButton` — chỉ hiện khi có nhãn ở ngôn ngữ đang xem + link (BR-07). Menu toàn màn hình (mọi breakpoint) xổ menu con dạng accordion; footer < md cột link dạng accordion (cột Liên hệ luôn mở), ≥ md dạng lưới. Chi tiết: `.context/design-spec.md` §2.1 / §2.2 / §2.4.

**Ngôn ngữ:** website công khai song ngữ **tiếng Việt (mặc định, URL không tiền tố)** và **tiếng Anh (`/en/...`)**; trang quản trị chỉ tiếng Việt. **Giao diện:** bố cục và phong cách theo vinhomes.vn, màu/logo/nội dung của TAMI (`docs/DESIGN.md`).

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

### F2. Dự án: FR-PUB-02, FR-PUB-03, FR-ADM-01
Danh sách lọc theo loại hình / tỉnh / trạng thái mở bán, có phân trang, chỉ dự án đã xuất bản. Chi tiết: tổng quan, chủ đầu tư, bản đồ, tiện ích, mặt bằng, pháp lý, chính sách bán hàng, tài liệu, thư viện ảnh, form lead (tạo lead gắn dự án).

### F3. Cho thuê: FR-PUB-04, FR-PUB-05, FR-PUB-16, FR-ADM-02
Danh sách có bộ lọc (danh mục, tỉnh, phường, giá/tháng, diện tích, phòng ngủ, nội thất, từ khoá không dấu, sắp xếp), bộ lọc nằm trên URL. Bộ lọc p95 ≤ 500ms. Chi tiết gồm thư viện ảnh (tối thiểu 3 ảnh khi xuất bản), video, mã tin, giá/tháng, diện tích, phòng ngủ/WC, tầng, hướng, nội thất, mô tả, vị trí, điều khoản thuê (thời hạn tối thiểu, cọc, kỳ thanh toán, dịch vụ bao gồm, ngày trống), sale phụ trách, form lead, tin tương tự. Mã tin `CT-xxxxxx`. Trạng thái `draft/published/hidden/rented`; tin đã thuê vẫn giữ trang, có nhãn "Đã thuê" và gợi ý tin tương tự, gắn `noindex, follow` và không vào sitemap. Nút tìm kiếm trên header dẫn tới `/cho-thue?q=` (giai đoạn 1 không có tìm kiếm toàn site).

### F4. Đăng tin BĐS: FR-PUB-06, FR-PUB-07, FR-ADM-03
Bài dạng tin (tin BĐS, voucher, ưu đãi) theo danh mục; trường tuỳ chọn giá, khu vực, dự án / tin cho thuê liên quan, hạn ưu đãi + mã voucher. Có form lead. Quá hạn ưu đãi thì gắn "Đã kết thúc" và rời khối "Ưu đãi nổi bật" (BR-06).

### F5. Tin tức: FR-PUB-08, FR-ADM-04
Tin tức chung theo danh mục, có tags, bài liên quan. Không thu lead.

### F6. Tuyển dụng: FR-PUB-09, FR-ADM-05
Danh sách việc (tự ẩn khi quá hạn nộp; mở URL trực tiếp thì hiện băng "đã hết hạn", ẩn form, `noindex`, bỏ JSON-LD), chi tiết, form nộp CV (PDF/DOC/DOCX ≤ 5MB). Admin quản lý hồ sơ (`new/reviewing/interview/hired/rejected`). JSON-LD `JobPosting`.

### F7. Dịch vụ, Liên hệ, trang pháp lý: FR-PUB-10, 11, 14
Trang dịch vụ (Phân phối, Môi giới, Khai thác CHDV), trang liên hệ (form, bản đồ, hotline), chính sách bảo mật, điều khoản.

### F8. Nút liên hệ nổi: FR-PUB-12
Hotline / Zalo / Fanpage ở góc dưới phải mọi trang; ghi nhận lượt bấm.

### F9. Lead: FR-PUB-13, FR-ADM-09, FR-ADM-10; BR-10…16
Form lead ở tin cho thuê, bài Đăng tin BĐS, dự án, trang liên hệ; consent bắt buộc; Turnstile + rate limit; chống trùng 7 ngày; tự giao cho sale đăng bài (tin cho thuê / bài Đăng tin BĐS), còn lại admin giao; email thông báo; nhắc lead chưa giao sau 30 phút; trạng thái `new/contacted/consulting/won/lost/spam`, chuyển `lost` bắt buộc nhập lý do (BR-11); admin giao lại thì email cho sale mới (BR-13); nhắc admin khi lead `new` chưa có người phụ trách sau 30 phút **giờ hành chính** (BR-14, định nghĩa ở § Quy tắc biên); lịch sử chăm sóc; xuất Excel (admin, ghi audit log). UTM (`utm_source/medium/campaign/term/content`) được ghi ở **mọi** trang công khai VI/EN (island client ở khung trang, không làm trang thành dynamic) vào `sessionStorage` của phiên — URL mới có UTM ghi đè bản đã lưu, URL không có UTM không ghi; form lead gửi kèm UTM của URL hiện tại, không có thì bản đã lưu (BR-10, design-spec §3.3). Phân công chỉ sinh activity/email/audit ở **một** nơi (hook `leads.afterChange`, `docs/API_SPEC.md` §5).

### F10. Quản trị: FR-ADM-06, 07, 08, 11, 12, 13, 14, 15, 16
Danh mục cha–con theo từng loại nội dung (danh mục đang có nội dung thì không xoá được), chủ đầu tư, dịch vụ (chỉ admin), trang pháp lý (chỉ admin, `docs/ERD.md` §4.9b), menu/footer/cấu hình chung, tài khoản sale, thư viện ảnh (ảnh ≤ 10MB, tự resize WebP), audit log, dashboard, redirect 301, hẹn giờ xuất bản, lịch sử phiên bản, xoá mềm. Nội dung xuất bản/sửa lên trang công khai trong ≤ 1 phút (BRD §7.2).

### F11. SEO: FR-PUB-15, NFR-03
SSR/ISR, URL tiếng Việt không dấu + URL tiếng Anh `/en/...`, meta + OG theo từng ngôn ngữ, `hreflang` (`vi`, `en`, `x-default`), `<html lang>`, `sitemap.xml` gồm cả hai bản, `robots.txt`, breadcrumb, JSON-LD (`Organization`, `RealEstateListing`, `Article`, `JobPosting`, có `inLanguage`), redirect 301 khi đổi slug (theo từng ngôn ngữ).

### F12. Song ngữ Việt – Anh: FR-PUB-18, FR-PUB-19, FR-ADM-17, FR-ADM-18; BR-05, BR-07, BR-08, BR-17
- URL: tiếng Việt không tiền tố, tiếng Anh `/en` + đường dẫn tiếng Anh (bảng `docs/BRD.md` §2.1). Không tự chuyển theo ngôn ngữ trình duyệt; nhớ lựa chọn bằng cookie `NEXT_LOCALE`.
- Nội dung: các trường chữ (tiêu đề, slug, mô tả, nội dung, SEO, tên danh mục, menu/footer, khối trang chủ, alt ảnh) có bản `vi` và `en` (Payload `localized: true`); số, giá, quan hệ, trạng thái, địa danh dùng chung. Danh sách trường: `docs/ERD.md` §1.1.
- Trường `hasEnglish` ("Đã có bản tiếng Anh") trên mỗi nội dung: hệ thống tự bật khi đủ trường bắt buộc tiếng Anh; `/en` chỉ hiện nội dung có `hasEnglish = true`, **không** fallback sang tiếng Việt (chưa có thì 404 + không vào sitemap EN).
- **AI tự dịch** (BR-08): lưu bản `vi` đang `published` (hoặc global) → job `translate-content` gọi Claude API dịch các trường localized đã đổi (richText dịch từng đoạn chữ, giữ cấu trúc), sinh slug `en`, bật `hasEnglish`, xoá cache trang `/en`. Bản `en` đã sửa tay (`translation.enSource = manual`) không bị dịch đè; bản `vi` đổi sau đó thì gắn `translation.viChangedAfterManual`. Nút "Dịch lại bằng AI" trong admin. Trang pháp lý: AI dịch nháp, admin duyệt mới bật `hasEnglish`; bản EN đã duyệt mà bị sửa tay nội dung EN (không qua lệnh duyệt) → tắt `hasEnglish` (ẩn `/en`) tới khi admin duyệt lại, lưu không đổi nội dung EN thì giữ duyệt. Bảng thuật ngữ ở `site-settings.translationGlossary`. Bản tiếng Anh lên web trong ≤ 10 phút sau khi xuất bản. Lỗi: thử lại 3 lần, vẫn lỗi → `translation.status = failed` + cảnh báo dashboard. Admin lọc danh sách nội dung theo trạng thái dịch (chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đã đổi sau khi sửa tay, FR-ADM-18). Hạn mức chi phí tháng qua env; vượt thì dừng dịch và báo admin. **Chỉ gửi nội dung công khai**, không gửi lead/CV.
- Chuỗi giao diện tiếng Anh (`en.json`) do AI dịch một lần lúc làm code, review trong PR.
- Chuỗi giao diện (menu cố định, nút, nhãn, lỗi form, thông báo, nhãn enum như nội thất / hướng nhà) ở `src/i18n/messages/{vi,en}.json`.
- Định dạng số/ngày theo ngôn ngữ (`Intl`); tiền luôn VNĐ.
- Nút chuyển ngôn ngữ đưa tới trang tương ứng; không có bản dịch thì về trang danh sách / trang chủ.
- Lead và hồ sơ ứng tuyển lưu `locale` khách đã dùng; email nội bộ luôn tiếng Việt.
- Admin (Payload) giao diện tiếng Việt; chuyển VI / EN khi soạn bài bằng bộ chọn locale có sẵn của Payload.

### Ngoài phạm vi
Mua bán, tài khoản người ngoài / tự đăng tin, kiểm duyệt, báo cáo vi phạm, VIP / thanh toán, hoa hồng, CRM, app mobile, ngôn ngữ thứ 3 trở lên, dịch chiều Anh → Việt, dịch dữ liệu khách gửi, giao diện admin tiếng Anh, tìm theo bản đồ, autocomplete.

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
- **Globals chưa có bản tiếng Anh**: `header` / `footer` thiếu bản EN thì `/en` dùng menu cố định trong `en.json`; khối trang chủ chưa có bản EN thì ẩn khối đó ở `/en` (không lấy chữ tiếng Việt, BR-07).
- **Hẹn giờ xuất bản** (FR-ADM-16): bài `published` có `publishedAt` ở tương lai thì chưa hiện công khai; job Payload chạy mỗi phút revalidate các bài vừa tới giờ.
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

Chi tiết: `docs/ARCHITECTURE.md` §6–8.

---
*Viết tay từ thiết kế đã duyệt (dự án mới, chưa có code), 16/10/2026.*
*Validate bằng: .agent/spec-validator.md*
