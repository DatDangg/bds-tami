# Spec Update — 2026-10-22 news-careers-contact-redesign-as-built (close-out BL-054)

**spec_version:** 1.47.0 → 1.47.1 (PATCH — làm rõ as-built sau khi build xong BL-054. Không thêm requirement, không breaking. Schema: thêm migration thứ 2 chỉ ADD giá trị enum audit; cả 2 migration SAFE_ADDITIVE.)

**BRD:** không đổi.

**Trigger:** feature-update — change-request close-out as-built (BL-054 `news-careers-contact-redesign`, MODIFY + ADDITIVE schema). Plan: `spec/updates/2026-10-22-news-careers-contact-redesign.md` (1.47.0 / scope v61). Change doc `spec/changes/2026-10-21-news-careers-contact-redesign.md`.

**Trạng thái build:** 10 task / 3 phase done (P1 schema + khối soạn bài + lượt xem + bản tin; P2 5 màn; P3-T01 dọn MINOR phase review C1–C11), merged `staging` (HEAD d69bcc0). Phase review P1+P2: 0 MAJOR, 6 MINOR → xử lý ở P3-T01 (STRICT PASS r3). Verify: full test 407 file / 4165 test PASS ở d69bcc0 (sau P3-T01; trước đó 4159 ở 8326e98); P3-T01 thêm test (unit + UI 59 file 539/539, integration news + job-postings + job-applications 77/77, newsletter + globals 39/39), `pnpm typecheck` / `pnpm lint` / `pnpm i18n:check` / `pnpm build` PASS. Số full test cuối tại HEAD do primary cập nhật nếu khác.

## Requirements (SPECIFICATIONS.md — khối BL-054 ở Giao diện)
- **SỬA tại chỗ (đánh dấu "as-built BL-054"):**
  - Trạng thái trống `/tin-tuc`: nút "Xoá lọc" về trang đang xem (ở trang danh mục là chính danh mục), thay "về `/tin-tuc`".
  - Nhãn tác giả chi tiết tin: "Ban biên tập TAMI HOMES" / "TAMI HOMES Editorial Team" + logo (vẫn không đọc / hiện tên nhân viên).
  - Schema / migration: 2 migration versioned chỉ ADD (`20261022_022857_news_careers_contact_redesign`, `20261022_031905_newsletter_export_audit`).
- **THÊM mục "As-built (close-out BL-054)":**
  - Migration 2 thêm enum audit `newsletter.export` (`ADD VALUE`, `down` rỗng giữ vết); FK `news_views_daily.news_id` `ON DELETE cascade`.
  - Dedupe lượt xem theo `ipHash` HMAC sẵn có; "Đọc nhiều" cache 10 phút, tag `news:most-read`.
  - Tìm `q` / `tag` tin tức bằng SQL `lower(translate())` (DB không có `unaccent`), trần 1000 id, lọc danh mục trong SQL; `q` tuyển dụng quét ≤ 500 tin còn hạn theo tiêu đề.
  - Chi tiết tin: `.news-prose` chỉ ở bài tin; đoạn mở đầu chỉ khi nội dung bắt đầu bằng paragraph; cột trái dính = mục lục (BL-033) + thẻ tư vấn; bỏ cột "Bài viết mới"; "Dự án nhắc đến" lưu id (`maxDepth: 0`), luôn tải qua truy vấn công khai.
  - Bản tin: email đã `active` trùng → không ghi lại; không honeypot; rate limit 5 / 10 phút; Xuất Excel khoá khi có lọc khác `status`; field consent khoá update (admin chỉ đổi `status`).
  - Tuyển dụng: giữ nút "Tìm" (WCAG 3.2.2); banner CV dùng ảnh hero Tuyển dụng; chi tiết giữ `DetailLayout` (nền `primary-subtle`); bỏ khối tóm tắt workplace / số lượng (workplace vẫn ở JSON-LD); tách đoạn dẫn bảo thủ (chỉ paragraph chữ thuần đứng đầu → hero hiện đủ + bỏ khỏi thân; khác → không tách); nút submit "Gửi hồ sơ"; "Vị trí khác" ở cả tin còn hạn và hết hạn; tin hết hạn có thẻ "Gửi CV".
  - Liên hệ: Hotline / Zalo không ghi `click-events` (như trang cũ); văn phòng không toạ độ → không bản đồ, "Chỉ đường" theo địa chỉ; tên fallback "Văn phòng {siteName}"; không placeholder mẫu.
  - `pnpm backfill:offices` trên DB dev = skip-no-source (DB dev không có địa chỉ / hotline).
- **Còn mở (backlog, không chặn close-out):** double opt-in bản tin; trang Chính sách bảo mật nhắc bản tin + thời hạn lưu `newsletter-subscribers` (NEEDS_USER); tag EN riêng; `TRUST_CF_CONNECTING_IP` staging / prod; sticky cột trái chi tiết tin ở lg thấp; chuẩn hoá NFD; quét tuyển dụng → cột `searchText` khi nhiều tin; `maxLength` khối khi dịch; đồng bộ SQL tìm tin nếu thêm hẹn giờ xuất bản.

## Ảnh hưởng
- **Schema / DB:** `20261022_022857_news_careers_contact_redesign` (bảng `news_views_daily`, `newsletter_subscribers`, `site_settings_offices` / `_careers_process` + locales, cột nullable `working_hours_*`, `job_postings.is_urgent DEFAULT false`) + `20261022_031905_newsletter_export_audit` (enum audit) — SAFE_ADDITIVE, đã migrate DB dev.
- **API / URL:** `POST /api/public/news-views`, `POST /api/public/newsletter`, `GET /api/admin/newsletter-subscribers/export`; tham số `/tin-tuc` `q` / `tag` / `sort`, `/tuyen-dung` `q` — as-built tại `docs/API_SPEC.md`.
- **Doc as-built đã reconcile:** `docs/API_SPEC.md`, `docs/DESIGN.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `.context/design-spec.md` (S13 / S15).
- **Test-scope:** `spec/test-scope/current.json` v62 (close-out as-built, risk HIGH). Bản planned v61 → `spec/test-scope/archive/test-scope-1.47.0-61.json`.
