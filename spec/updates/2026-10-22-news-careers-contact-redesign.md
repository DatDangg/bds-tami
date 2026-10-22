# Spec Update — 2026-10-22 news-careers-contact-redesign (redesign Tin tức / Chi tiết tin tức / Tuyển dụng / Chi tiết tuyển dụng / Liên hệ)

**spec_version:** 1.46.2 → 1.47.0 (MINOR — thêm requirement bố cục mới cho 5 màn + 2 collection mới + trường mới additive cho `job-postings` / `site-settings` + 3 endpoint mới + tham số URL mới. Không breaking: URL / lọc cũ giữ, trường cũ giữ nguyên, migration chỉ ADD.)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-054**, MODIFY + ADDITIVE schema). Change doc `spec/changes/2026-10-21-news-careers-contact-redesign.md`. Design: `docs/specs/listing-detail-redesign/tin-tuc.webp`, `chi-tiet-tin-tuc.webp`, `tuyen-dung.webp`, `chi-tiet-tuyen-dung.webp`, `lien-he.webp`.

**Trạng thái:** planned — spec delta đã ghi, chưa build. Chế độ auto proceed, `builder-strong` mọi task, commit `staging` không push. Làm sau BL-052 (đã xong), tái dùng `src/components/listing/*` + `src/components/detail/*`.

## Requirements (SPECIFICATIONS.md)

- **Giao diện — THÊM khối "Redesign Tin tức / Chi tiết tin tức / Tuyển dụng / Chi tiết tuyển dụng / Liên hệ (BL-054 …)"** (ngay sau khối BL-052). Thay điểm bố cục BL-045 cho `/tin-tuc` (+ `/tin-tuc/danh-muc/[category]`), `/tin-tuc/[slug]`, `/tuyen-dung`, `/tuyen-dung/[slug]`, `/lien-he`. 4 đoạn BL-045 "Tin tức", "Bài viết", "Tuyển dụng", "Liên hệ" đánh dấu *(bố cục thay bởi BL-054)*.
  - **Giữ nguyên:** header, footer, `ConsultBanner`, token / Montserrat / element sẵn có (`no-raw-colors.test`), LeadForm + form ứng tuyển (nguồn, Turnstile, consent, rate limit, trường hiện có), form "Tư vấn nhu cầu" cuối mọi trang `/tin-tuc` (F5), tin tuyển dụng hết hạn (băng, ẩn form, `noindex`, bỏ JSON-LD), canonical / JSON-LD, 1 `h1`/trang, i18n vi/en (BR-07).
  - **`/tin-tuc`:** hero ảnh (`pageHeroes.news`) + ô tìm `q` + nút "Tìm" (form GET) → chip danh mục → khối nổi bật trang 1 (1 lớn + 3 nhỏ; `isFeatured` trước rồi mới nhất; không lặp trong lưới) → "Bài viết mới nhất" + `sort` (`newest` | `oldest`) → lưới 3 cột + phân trang số (BL-052) → cột phải "Đọc nhiều" (top 5) · "Bản tin thị trường" · "Chủ đề" (≤ 12 tag, link `?tag=`) → form "Tư vấn nhu cầu" → banner tư vấn.
  - **`/tin-tuc/[slug]`:** badge danh mục, `h1`, sapo, nhãn "TAMI HOMES" (không hiện tên nhân viên) · ngày · "N phút đọc" (tự tính, `estimateReadMinutes`), chia sẻ (Facebook, Zalo, copy link, Web Share) → ảnh bìa + chú thích → đoạn mở đầu đóng khung; cột trái dính "Mục lục" (`NewsToc`) + thẻ "Tư vấn miễn phí" (→ `/lien-he`, không form); style H2 số tròn 01/02/03 (CSS counter), trích dẫn ngoặc lớn, danh sách dấu tích; "Thẻ:" chip tag; "Bài viết liên quan" 3 thẻ + "Xem tất cả tin tức". Beacon lượt xem chỉ ở trang này.
  - **Khối mới trình soạn `news.content`:** "Số liệu nổi bật" (1–4 `value` + `label`), "Dự án nhắc đến" (chọn 1 dự án → thẻ; dự án chưa xuất bản / thiếu EN → ẩn), "Ảnh cạnh chữ" (ảnh + chữ + trái/phải). Render theo danh sách cho phép; dịch tự động đi qua chữ trong khối; không đổi bảng DB.
  - **`/tuyen-dung`:** hero (`pageHeroes.careers`) + nút "Xem vị trí đang tuyển" (`#open-positions`) → 4 phúc lợi (`careersPerks`) → "Vị trí đang tuyển" + "N vị trí": chip phòng ban, ô khu vực (`province`), ô tìm `q` (form GET) → danh sách hàng (phòng ban + "Tuyển gấp", tên, tỉnh, hình thức, lương, "Hạn: dd/mm/yyyy" — `/en` MM/DD/YYYY) + phân trang → "Quy trình ứng tuyển — N bước" (`careersProcess`, trống → ẩn) → banner "Gửi CV ngay" (hành vi cũ) → banner tư vấn.
  - **`/tuyen-dung/[slug]`:** hero ảnh nhạt (breadcrumb, phòng ban + "Tuyển gấp", tiêu đề 2 dòng, mô tả ngắn, hàng thông tin icon, "Ứng tuyển ngay" + "Chia sẻ") → cột trái thẻ "Mô tả công việc" / "Yêu cầu" / "Quyền lợi" (trống → ẩn) → cột phải dính form ứng tuyển hiện có (giữ ô "Lời nhắn") → "Vị trí khác" 4 thẻ + "Xem tất cả vị trí".
  - **`/lien-he`:** hero ảnh (`pageHeroes.contact`) → 4 thẻ nổi (Hotline, Email, Zalo OA, Giờ làm việc; thiếu dữ liệu → ẩn) → form "Bạn cần TAMI hỗ trợ điều gì?" (LeadForm `source=contact`, **không** chip loại yêu cầu) · "Hệ thống văn phòng" (tab ẩn khi 1 văn phòng, bản đồ, thẻ văn phòng, "Chỉ đường") → banner "Gia nhập TAMI HOMES" → `/tuyen-dung`. Không banner tư vấn.
- **F5 / F6 / F7:** thêm ghi chú trỏ khối BL-054; dữ liệu / quyền cũ giữ.
- **API Endpoints:** thêm `POST /api/public/news-views`, `POST /api/public/newsletter`, `GET /api/admin/newsletter-subscribers/export`.
- **Database Schema:** thêm `newsletter-subscribers` (nhóm Khách hàng), `news-views-daily` (nhóm Hệ thống).

## Schema mới (migration versioned, chỉ ADD — không `HIGH_RISK_MIGRATION`)

| Đối tượng | Trường |
|---|---|
| `news-views-daily` (MỚI) | `news` (rel), `day` (ngày VN), `views` (số); unique `(news, day)`; chỉ admin đọc, không ai tạo/sửa qua API |
| `newsletter-subscribers` (MỚI) | `email` duy nhất (chữ thường), `locale` vi/en, `status` `active`/`unsubscribed`, `consentAt`, `privacyPolicyVersion`, `sourcePath`, ngày tạo; admin xem / sửa trạng thái / xoá, sale không thấy |
| `job-postings` | `isUrgent` checkbox `DEFAULT false` ("Tuyển gấp") |
| `site-settings` | `offices` (≤ 10: `name` + `address` localized bắt buộc, `image`, `location`, `phone`, `email`), `workingHours` (`hours` + `days` localized), `careersProcess` (≤ 6 bước: `icon`, `title` localized bắt buộc, `description` localized) |

Trường cũ `address` / `mapLocation` / `hotline` / `email` giữ nguyên; `offices` trống → web dùng chúng làm 1 văn phòng. Script dev `pnpm backfill:offices` (dry-run mặc định, `--apply` ghi, chỉ điền khi trống, báo cáo `docs/reports/`; staging/prod chỉ khi user bảo).

## Endpoint mới

| Method | Path | Quyền / ràng buộc |
|---|---|---|
| `POST` | `/api/public/news-views` | Khách — `{ newsId }` qua `sendBeacon` / `fetch keepalive`, không chặn render (ISR giữ); rate limit; bỏ bot (UA rỗng / crawler / headless / preview); chỉ bài đã xuất bản; chống trùng mỗi người · bài · ngày bằng `HMAC(secret, ip+ua+ngày+bài)` trong Redis TTL hết ngày — không lưu IP/UA thô; upsert nguyên tử; Redis lỗi → không đếm (pipeline trả 503, beacon bỏ qua);|
| `POST` | `/api/public/newsletter` | Khách — validate email, consent bắt buộc, Turnstile, rate limit; email đã có → trả thành công như nhau (không lộ), bản `unsubscribed` được bật lại + cập nhật consent |
| `GET` | `/api/admin/newsletter-subscribers/export` | admin — xuất Excel (`xlsx-stream`) |

Tham số URL mới: `/tin-tuc` `q`, `tag`, `sort`; `/tuyen-dung` `q`. Có lọc / tìm → `noindex` như hiện tại.

## Quyết định (user chốt 2026-10-21)

1. "Đọc nhiều" = đếm lượt xem theo ngày (chống trùng cơ bản, không lưu dữ liệu cá nhân), top 5 / 30 ngày; thiếu → bù `isFeatured` rồi mới nhất; cache ≤ 1 giờ.
2. "Bản tin thị trường" lưu email đăng ký (email, consent + phiên bản chính sách, ngày, ngôn ngữ), Turnstile, xuất Excel. **Chưa** gửi mail định kỳ.
3. Khối mới trình soạn: "Số liệu nổi bật", "Dự án nhắc đến", "Ảnh cạnh chữ". Trích dẫn / danh sách tích / số 01-02 cạnh H2 làm bằng style.
4. Văn phòng: thiết kế cho nhiều, hiện dùng 1 — `site-settings.offices`; 1 văn phòng → ẩn tab; dữ liệu ban đầu từ trường cũ (không mất dữ liệu).
5. Giờ làm việc: `site-settings.workingHours` (localized); trống → ẩn thẻ.
6. **Không** chip loại yêu cầu trên form liên hệ.
7. "Tuyển gấp": công tắc `job-postings.isUrgent`.
8. Quy trình ứng tuyển sửa trong admin (`careersProcess`, cạnh `careersPerks`); trống → ẩn.
9. "N phút đọc" tính tự động từ nội dung (không thêm trường).
10. Chi tiết tuyển dụng theo `chi-tiet-tuyen-dung.webp`, dùng trường hiện có (chỉ thêm `isUrgent`).

## Ảnh hưởng

- **Module:** `src/components/news/*`, `src/components/careers/*`, `src/components/contact/*`, tái dùng `src/components/listing/*` + `src/components/detail/*` (BL-052); `src/collections/{News,JobPostings}.ts`, collection mới `NewsViewsDaily` + `NewsletterSubscribers`; `src/globals/SiteSettings.ts` + `site-settings/*`; trình soạn richText (`createRichTextEditor`) + `RichText` render khối; endpoint public news-views / newsletter + admin export; `src/lib/{news,careers}/*`; dịch tự động (TRANSLATABLE_FIELDS); `migrations/*`; script `backfill:offices`; `messages/*`.
- **Phụ thuộc:** LeadForm (`/lien-he`, `/tin-tuc`), form ứng tuyển, header / footer / ConsultBanner (dùng `site-settings`), JSON-LD `JobPosting` / `NewsArticle` / `BreadcrumbList`, sitemap, khối Tin tức trang chủ (`NewsCard`).
- **Bảo mật / dữ liệu cá nhân:** email bản tin là PII (chính sách bảo mật hiện có, quyền admin-only); 2 endpoint public mới (rate limit, Turnstile, lọc bot, không lưu IP thô).
- **Doc impact khi build:** `.context/design-spec.md`, `docs/DESIGN.md`, `docs/ERD.md`, `docs/API_SPEC.md`, `docs/PERMISSION.md`.
- **Test-scope:** `spec/test-scope/current.json` v61 (risk HIGH).

## Sửa sau spec-validation r1 (2026-10-22)
- F1 Redis lỗi → không đếm (thay "vẫn đếm"). F2 `/en` ẩn "Chủ đề" / dòng "Thẻ:" và bỏ qua `?tag=` (tags chưa localized; tag EN = change request sau). F3 tác giả = nhãn thương hiệu, không lộ tên `staff`. F6 banner tư vấn giữ ở 2 màn tuyển dụng. F7 mục BL-052 (Tìm nhanh, Loại sản phẩm / Tiện ích, backfill nội dung) không áp dụng. F8 thẻ Zalo OA hiện `siteName`. F9 tìm `q` không dấu bằng cơ chế sẵn có, không thêm cột. F10 chữ đồng ý nêu mục đích nhận bản tin. F12 breadcrumb hero `/tuyen-dung`.
