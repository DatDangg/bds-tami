Agent: spec-validator

# Spec Validation Report — TAMI (/start bước 1b, round 1)

**Entry Mode:** full_docs (dự án mới, **no app code**: bỏ phần đối chiếu code)
**Spec:** `SPECIFICATIONS.md` spec_version 1.2.0
**Sources validated against:** `BRIEF.md`, `docs/BRD.md` v1.5, `docs/ARCHITECTURE.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/API_SPEC.md`, `docs/DESIGN.md`, `docs/INDEX.md`, `spec/updates/2026-10-16-*.md` (2 file), `spec/CHANGELOG.md`, `spec/changes/BACKLOG.md` (rỗng), `.context/project-config.md`
(Không có `.context/doc-index.json` → dùng `docs/INDEX.md` để phân loại; `docs/archive/` là historical, không dùng để validate.)

## Verdict: ❌ FAIL

Lý do: 1 nhóm ❌ (thiếu NFR), 2 conflict mức HIGH (quyền Sale; schema `pages` chưa có), cùng ≥ 3 ⚠️. Danh sách ngắn, sửa được trong 1 vòng.

---

## Feature Coverage Matrix

| # | Requirement | Source | Status | Notes |
|---|---|---|---|---|
| 1 | FR-PUB-01 Trang chủ (khối, bật/tắt, 1–8 slide) | BRD §3.1 | ✅ | SPEC F1 :46-47 |
| 2 | FR-PUB-02 Danh sách dự án + **phân trang** | BRD:135 | ⚠️ | SPEC F2 :50 thiếu "phân trang" |
| 3 | FR-PUB-03 Chi tiết dự án + **thư viện ảnh** | BRD:136 | ⚠️ | SPEC F2 :50 thiếu thư viện ảnh |
| 4 | FR-PUB-04 Bộ lọc Cho thuê, URL, p95 ≤ 500ms | BRD:137 | ⚠️ | Có bộ lọc + URL (:53); thiếu p95 (không có mục NFR) |
| 5 | FR-PUB-05 Chi tiết tin cho thuê | BRD:138 | ⚠️ | SPEC :53 chỉ nêu điều khoản thuê; thiếu ảnh/video/tầng/hướng… (ERD §4.6 có đủ) |
| 6 | FR-PUB-06/07, BR-06 | BRD:139-140, :188 | ✅ | SPEC F4; thiếu vế "rời khối Ưu đãi nổi bật" (nhỏ) |
| 7 | FR-PUB-08…14 | BRD:141-147 | ✅ | F5–F9 |
| 8 | FR-PUB-15 / NFR-03 SEO | BRD:148, :229 | ✅ | F11 |
| 9 | FR-PUB-16 trang đích khu vực (Should) | BRD:149 | ✅ | F3 (DESIGN không có màn này, xem N8) |
| 10 | FR-PUB-17 đối tác (Should) | BRD:150 | ✅ | F1 |
| 11 | FR-PUB-18/19 song ngữ, nút VI/EN | BRD:151-152 | ✅ | F12 |
| 12 | FR-ADM-01…05 CRUD | BRD:158-162 | ✅ | F2–F6, F10 |
| 13 | FR-ADM-06 danh mục cha–con, **không xoá khi có nội dung** | BRD:163 | ⚠️ | SPEC F10 :74 thiếu tiêu chí chặn xoá (ERD §4.3 có) |
| 14 | FR-ADM-07…11, 13…15 | BRD:164-172 | ✅ | F9, F10 |
| 15 | FR-ADM-12 ảnh **≤ 10MB**, WebP | BRD:169 | ⚠️ | SPEC :74 thiếu giới hạn dung lượng |
| 16 | FR-ADM-16 hẹn giờ xuất bản (Could) | BRD:173 | ⚠️ | Chưa có cơ chế: ERD chỉ ghi ở `news.publishedAt` (:301), ARCH §5.4 không có job/revalidate theo giờ |
| 17 | FR-ADM-17 AI dịch, **EN lên web ≤ 10 phút** | BRD:174 | ⚠️ | SPEC F12 :83 thiếu SLA 10 phút |
| 18 | FR-ADM-18 sửa tay EN, dịch lại, **lọc theo trạng thái dịch** | BRD:175 | ⚠️ | SPEC F12 thiếu bộ lọc trạng thái dịch |
| 19 | BR-01…08, 10…17, 20…21, 30…32 | BRD §4 | ✅ | SPEC :134 tham chiếu theo mã; F9 thiếu "lostReason bắt buộc" (BR-11), "email khi admin giao lại" (BR-13), "giờ hành chính" (BR-14) |
| 20 | **NFR-01** CWV p75 mobile + API p95 | BRD:227 | ❌ | SPEC không có mục NFR, không tham chiếu BRD §5 |
| 21 | NFR-02, 05, 06, 10 | BRD:228-236 | ✅ | Scalability Profile + Deployment |
| 22 | **NFR-04** Bảo mật (OWASP, header CSP/HSTS…) | BRD:230; ARCH §7 | ⚠️ | SPEC chỉ có phần auth (:125-130) |
| 23 | **NFR-07** WCAG 2.1 A (AA trang chính) | BRD:233 | ❌ | Không có trong SPEC |
| 24 | **NFR-08** Trình duyệt (gồm webview Zalo/Facebook) | BRD:234 | ❌ | Không có trong SPEC |
| 25 | NFR-09 Chi phí / OSS tự host | BRD:235 | ⚠️ | SPEC chỉ nêu hạn mức Claude (:83); xem N5 |
| 26 | LGL-01…04 | BRD §6 | ⚠️ | SPEC không tham chiếu BRD §6 (chỉ ngầm qua `provinces (34)`, `wards (kèm tên cũ)`) |
| 27 | §7.2 nội dung lên web ≤ 1 phút | BRD:267 | ⚠️ | Không có trong SPEC (ARCH §5.1 có) |

## Cross-Document Conflicts

| Conflict | Source A | Source B | Impact |
|---|---|---|---|
| Sale "đăng mọi loại bài" | SPEC:128, BRD:77, BRIEF:18, PERMISSION:11 | PERMISSION §3.1 :42-43: Sale **không** tạo/sửa `services`, `pages` | **HIGH** (RBAC) |
| `pages` không có định nghĩa trường | SPEC:118, ERD:27, :38, :105 (có nhắc "pages loại pháp lý") | ERD §4 không có mục `pages`; PERMISSION:89 + BR-08 cần phân biệt trang pháp lý | **HIGH** (thiếu schema) |
| Nút tìm kiếm trên header | DESIGN:233 | BRD/SPEC/API_SPEC không có tìm kiếm toàn site; ERD:517 nói tìm `property-posts`/`news` nhưng không có FR/route/endpoint | MEDIUM |
| `db_tool: none`, `migration_required: false` | project-config:38-39 | SPEC:30 Postgres; ERD:14 `payload migrate` | MEDIUM (brainstorm chốt) |
| Audit log khi **xem danh sách** lead | ARCH:265 | PERMISSION §6 :110 + ERD:430 (enum không có action xem danh sách; không tách "xoá hẳn") | LOW |
| Hai đường phân công lead | API_SPEC:121 (`POST /api/admin/leads/:id/assign` sinh activity + email) | PERMISSION:85 (admin sửa `assignedTo` qua REST) + API_SPEC:138 (hook `afterChange` cũng sinh activity + email) | LOW (nguy cơ sinh trùng activity/email) |
| Hero video, "dải 4 lối tắt", "banner CTA" | DESIGN:211, :237 | ERD:467 `slides.image` chỉ có ảnh; FR-PUB-01 / global `homepage` không có các khối này | LOW |
| Phiên bản BRD | BRIEF:13 "v1.4" | BRD:6 v1.5; SPEC:6 v1.5 | LOW |
| Trạng thái DESIGN | INDEX:15 "chưa điền (chờ logo, màu, font)"; DESIGN:16 "BRD v1.3" | DESIGN đã điền đủ; BRD v1.5 | LOW |
| Endpoint API | SPEC:98-110 | API_SPEC §3–4 | ✅ khớp 10/10 |
| Danh sách collection | SPEC:116-122 | ERD §3 | ✅ khớp (trừ `pages` thiếu chi tiết) |
| Stack | SPEC:23-38 | ARCH §3 | ✅ khớp; SPEC thiếu bản đồ (OSM + MapLibre, ARCH:62) và GA4 + Search Console (ARCH:66) |

## Missing Edge Cases
- "Giờ hành chính" (BR-14, ARCH §5.4) chưa định nghĩa: giờ nào, thứ 7/CN, ngày lễ.
- Sale bị khoá (`active=false`): lead đang giao cho sale đó xử lý ra sao; trang tin vẫn hiện "Sale phụ trách" của người đã nghỉ?
- Globals `header`/`footer`/`homepage` chưa có bản EN (fallback `false`) thì `/en` hiển thị gì: không có quy tắc chặn/hiện.
- Lead gửi từ tin `rented`: form còn nhận không (API_SPEC:69 "đang công khai", ERD:29 coi `rented` là công khai).
- Hẹn giờ xuất bản: job/revalidate lúc tới giờ.
- Hai người sửa cùng bài (document locking), empty state khi bộ lọc không có kết quả, trang lỗi 500 (DESIGN chỉ có 404).

## Non-functional Gaps
- SPEC không có mục NFR (NFR-01, 04, 07, 08, 09).
- Danh sách biến môi trường/secret: SPEC không có; project-config:115 ghi `DATABASE_URL, JWT_SECRET` (mẫu template), trong khi thực tế cần `PAYLOAD_SECRET`, `ANTHROPIC_API_KEY`, `TRANSLATION_MODEL`, `TRANSLATION_MONTHLY_BUDGET_USD`, khoá Turnstile, Brevo SMTP, S3/SeaweedFS, Redis, `DATABASE_URL_PROD/STAGING` (ARCH:236).
- "Session hết hạn sau 8 giờ **không hoạt động**" (SPEC:129, PERMISSION:116): `tokenExpiration` của Payload tính theo thời gian tuyệt đối, cần cơ chế làm mới. Residual risk.

---

## BLOCKING (sửa trước brainstorm/graph)

**B1. [MISSING] Thiếu mục Non-functional Requirements**: `SPECIFICATIONS.md` (sau §Business Rules, ~:138).
Đề xuất: thêm `## Non-functional Requirements` liệt kê NFR-01 (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, p95 ≤ 500ms), NFR-04 (OWASP Top 10, CSP/HSTS/X-Frame-Options/Referrer-Policy, MIME check: ARCH §7), NFR-07 (WCAG 2.1 A, AA cho trang chính), NFR-08 (Chrome/Safari/Edge/Firefox 2 bản gần nhất + webview Zalo/Facebook), NFR-09, và tham chiếu `docs/BRD.md` §5, §6 (LGL).

**B2. [CONFLICT HIGH] Phạm vi đăng bài của Sale**: SPEC:128, BRD:77, BRIEF:18, PERMISSION:11 ("mọi loại bài") ↔ PERMISSION:42-43 (Sale không tạo/sửa `services`, `pages`).
Đề xuất: **user chốt**. Hướng hợp lý theo FR-PUB-10 ("Admin thêm/sửa"): sửa SPEC:128 (và BRIEF/PERMISSION:11) thành "Sale đăng dự án, cho thuê, Đăng tin BĐS, tin tức, tuyển dụng; Dịch vụ và trang pháp lý chỉ admin". BRD là intent doc nên chỉ sửa câu chữ BRD:77 khi user duyệt.

**B3. [MISSING HIGH] Chưa định nghĩa collection `pages`**: ERD §4 (sau :316); có nhắc ở SPEC:118, ERD:27, :38, PERMISSION:43, :89.
Đề xuất: thêm ERD §4.x `pages` gồm `title`, `slug`, loại trang (vd `kind`: `privacy` | `terms` | …) để phân biệt trang pháp lý theo BR-08 / PERMISSION:89, `content`, `status`, `hasEnglish`, `translation`, `seo`, và cách map route cố định `/chinh-sach-bao-mat` ↔ `/en/privacy-policy`. Ghi rõ `pages` có `author` hay không, vì `isAuthorOrAdmin` và nút dịch lại phụ thuộc vào trường này.

**B4. [CONFLICT MEDIUM, scope] Tìm kiếm trên header**: DESIGN:233 có nút tìm kiếm; ERD:517 tìm `property-posts`/`news`; BRD/SPEC/API_SPEC không có FR, route hay endpoint nào cho việc này.
Đề xuất: **user chốt** (validator không tự thêm requirement): (a) nút tìm kiếm chỉ dẫn tới `/cho-thue?q=`, bỏ câu ERD:517; hoặc (b) thêm FR tìm kiếm toàn site qua Change Request, kèm route và endpoint.

**B5. [CONFIG] `.context/project-config.md` còn placeholder và sai DB gate**: :38-39 `db_tool: none` / `migration_required: false` khiến migration gate bị bỏ qua dù dùng Postgres + `payload migrate`; :22 package_manager chưa điền (SPEC:38 = pnpm); :115 secrets là mẫu template.
Đề xuất: bước brainstorm (bước 2) đặt `db_tool: other` (Payload/Drizzle), `migration_required: true`, `migration_command`, `package_manager: pnpm`, `staging_db: DATABASE_URL_STAGING`, `prod_db: DATABASE_URL_PROD`, và sửa danh sách secrets theo ARCH:236. Phải xong trước graph.

## NON-BLOCKING (ghi chú, nên sửa cùng vòng)

- **N1** BRIEF:13 "v1.4" → "v1.5".
- **N2** INDEX:15 sửa "chưa điền" → "đã điền (màu, logo, font, bố cục)"; DESIGN:16 "v1.3" → "v1.5".
- **N3** Bổ sung chi tiết còn thiếu trong SPEC, theo matrix #2-5, 13, 15, 17, 18, 27 (phân trang, thư viện ảnh, trường chi tiết tin thuê, chặn xoá danh mục, ảnh ≤ 10MB, EN ≤ 10 phút, lọc trạng thái dịch, publish ≤ 1 phút) và BR-11/13/14 trong F9.
- **N4** SPEC Tech Stack thêm Bản đồ (OSM + MapLibre GL) và Analytics (GA4 + Search Console), theo ARCH:62, :66 và ERD `gaMeasurementId`.
- **N5** NFR-09 / BRIEF:38 ghi "chỉ OSS tự host, ngoại lệ Claude API", nhưng stack dùng Cloudflare, Turnstile, Cloudflare Access, Brevo, GA4 (SaaS miễn phí). Cần làm rõ câu chữ: "không dùng dịch vụ **trả phí** ngoài…". GA4 còn kéo theo yêu cầu cookie consent (LGL-03), hiện chưa có.
- **N6** Thống nhất audit: ARCH:265 (xem danh sách lead) với PERMISSION §6 và enum ERD:430; thêm action cho xoá hẳn / đặt lại mật khẩu nếu cần.
- **N7** Chốt **một** đường phân công lead (endpoint hoặc REST + hook) để không sinh activity/email hai lần (API_SPEC:121, :138; PERMISSION:85).
- **N8** DESIGN thiếu màn trang đích khu vực (FR-PUB-16) và các trang danh mục. Hero video, lối tắt, banner CTA chưa có trường trong ERD `homepage` (:467): bước `/design` chốt hoặc bỏ.
- **N9** ERD tự mâu thuẫn nhẹ: slug "R, U" ở từng bảng so với §1.1 (unique theo `_locale`); `rentals.searchText` (:252) nằm ở bảng chính, còn §5/§6 nói nó localized.
- **N10** Bổ sung các edge case ở mục "Missing Edge Cases" (sale bị khoá, globals EN, lead từ tin `rented`, hẹn giờ, lock, empty state, trang 500).
- **N11** Số admin: "1" (BRD:76) hay "≥ 1" (SPEC:128, PERMISSION:10)? Nên ghi rõ có cho phép nhiều admin không.
- **N12** SPEC chưa có mục câu hỏi mở: Q1 KPI, Q4 nội dung ban đầu, Q5 luật sư duyệt bản EN pháp lý, Q6 hạn mức Claude (cần trước production), tên miền.
- **N13** SPEC không ghi mức ưu tiên Must/Should/Could (FR-PUB-16/17, FR-ADM-14/15 là Should; FR-ADM-16 là Could). Graph cần thông tin này để xếp layer: nên ghi kèm mã trong SPEC.
- **N14** project-config:105 `ui.responsive_breakpoints [375, 768, 1280]` lệch DESIGN:266-273 (640/768/1024/1280/1536): chốt ở brainstorm/design.

## Suggestions
- Sửa B1–B4 trong `SPECIFICATIONS.md` / `docs/ERD.md` / `docs/PERMISSION.md` / `docs/DESIGN.md`. B2 và B4 cần user trả lời trước. Sau đó bump spec_version (PATCH 1.2.1 nếu chỉ làm rõ; MINOR nếu thêm FR tìm kiếm), rồi re-validate round 2.
- B5 xử lý ngay trong brainstorm (bước 2).

## Verdict Reasoning
FAIL vì: ❌ thiếu NFR-01/07/08 (B1); 2 conflict HIGH (B2 RBAC, B3 schema `pages`); ≥ 3 ⚠️ (matrix #2-5, 13, 15-18, 22, 25-27). API endpoint, danh sách collection và stack khớp tốt giữa SPEC ↔ API_SPEC ↔ ERD ↔ ARCH. Phần lớn gap là bổ sung câu chữ, không phải thiết kế lại.
