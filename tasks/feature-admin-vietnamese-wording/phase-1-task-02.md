# feature-admin-vietnamese-wording · phase-1-task-02 — Rà ngữ nghĩa nhãn admin của dự án (collection/global, trường, mô tả, tab, option, nút tuỳ biến, dashboard) (BL-040)

- Change doc: `spec/changes/2026-10-20-admin-vietnamese-wording.md` (BACKLOG BL-040).
- Task anh em: `phase-1-task-01.md` (ghi đè chữ mặc định Payload). Khác file → song song được.
- Trạng thái: `done` — Reviewer STRICT r1 FAIL (MAJOR-1 Q5) → r2 PASS (`.context/review-reports/feature-admin-vietnamese-wording-phase-1-task-02-round-{1,2}-review.md`); spec 1.33.0 / scope v41; user duyệt checkpoint 2026-10-20 "ok theo đề xuất": **Q1–Q10 đều theo khuyến nghị** (Q1 A giữ "Lead", bỏ lặp "Lead khách hàng"; Q2 "Tin bất động sản" trong admin; Q3 "Sale phụ trách" mọi chỗ; Q4 "Tệp CV ứng viên" + "tệp"; Q5 "Ngày X"; Q6 đổi toán tử lọc + sửa export-filters.ts + test; Q7 "tài liệu" → "mục"; Q8 "Dữ liệu nền" / "Mục quản lý" / "Cài đặt website"; Q9 giữ từ mượn; Q10 chấp nhận lệch xoá/xóa). Cột slug thô → BL-043 (ngoài phạm vi). BL-039 sau này dùng "Tiếng Việt / Tiếng Anh".

## Classification / Risk
- Type: **MODIFY** (chỉ đổi `label` / `labels` / `admin.description` / chữ option / chữ trong component admin; **không đổi** `name`, slug,
  `value` option, schema, URL, access).
- Risk: **LOW–MEDIUM** — nhãn collection dùng chung cho menu trái + dashboard + banner dịch lỗi (`lib/translation/admin-ui.ts`
  `COLLECTION_LABELS` lấy từ `collection-labels.ts`); vài test assert chữ (`DashboardLinks.test.tsx:31-33`,
  `DashboardParts.test.tsx:102-105` "Lead khách hàng"; test component admin khác sẽ dò khi code).
- Expected review level: **NORMAL**.
- Lưu ý migration: `label` của field/select **không** sinh migration Postgres (chỉ `name`/`value` mới đổi cột/enum) → kiểm lại bằng
  `pnpm payload migrate:create --dry` hoặc `git diff src/payload-types.ts` sau `generate:types` (types chỉ đổi JSDoc nếu có). Không chạm migration.
- Blast radius: menu trái, Tổng quan, form + danh sách mọi collection/global, file Excel xuất lead (tiêu đề cột), nhật ký thao tác.
- Doc impact: FR-ADM-19 (bảng nhãn collection/nhóm) → spec delta + spec-publisher sau khi duyệt.

## Phạm vi đã rà
`src/lib/admin/collection-labels.ts`, `src/components/admin/admin-groups.ts`, 21 collection + `projects/market-blocks.ts` +
`_shared/content-defaults.ts` + `redirects-plugin.ts`, 4 global + `homepage/blocks.ts`, 18 file `src/fields/**`, mọi component admin
(`src/components/admin/**` gồm dashboard, Xuất Excel, chip lọc nhanh `lib/admin/quick-filters.ts`, lọc dịch + banner dịch
`lib/translation/admin-ui.ts`), tiêu đề cột Excel `src/endpoints/admin/leads-export.ts`, thông báo validate/hook liên quan.
**~690 chuỗi rà** (grep chuỗi có dấu tiếng Việt + tiếng Anh hiển thị, bỏ comment/test). Chuỗi ổn không liệt kê.

Ngoài phạm vi chữ (ghi để user biết, không làm ở BL-040): cột "Loại dữ liệu"/"Loại nội dung" ở Nhật ký thao tác và Lượt bấm liên hệ
đang hiện **giá trị** slug thô (`leads`, `rentals`…) — muốn hiện tên tiếng Việt cần thêm Cell, đề xuất task sau; cột ID/slug/SEO trong
"Hiển thị cột" → BL-039.

## Bảng đề xuất (chỉ chuỗi cần đổi)

### 1. Menu trái + Tổng quan
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `collection-labels.ts:11` private-files (số nhiều / số ít) **[Q4]** | Tệp riêng tư (CV) / Tệp riêng tư | Tệp CV ứng viên / Tệp CV | User: "Tệp riêng tư" không hiểu là gì. User gợi ý "File CV ứng viên" — đề xuất "Tệp" cho khớp chữ Payload |
| `collection-labels.ts:10` media | Thư viện media / Tệp media | Thư viện ảnh & tệp / Ảnh, tệp | "media" là thuật ngữ |
| `collection-labels.ts:14` click-stats-daily | Thống kê lượt bấm theo ngày | Thống kê liên hệ theo ngày | User nêu khó hiểu; nói rõ là bấm Hotline/Zalo/Fanpage |
| `collection-labels.ts:15` translation-usage | Chi phí dịch theo tháng | Chi phí dịch tự động | User nêu; nói rõ là dịch AI (đã chia theo tháng ở cột) |
| `collection-labels.ts:28` leads **[Q1]** | Lead khách hàng / Lead | A: Lead / Lead · B: Khách hàng tiềm năng / Khách hàng tiềm năng | "Lead khách hàng" lặp nghĩa |
| `collection-labels.ts:29` lead-activities **[Q1]** | Lịch sử chăm sóc lead / Hoạt động chăm sóc lead | A: Lịch sử chăm sóc / Hoạt động chăm sóc · B: như A | Đã nằm trong nhóm "Khách hàng", bỏ chữ "lead" thừa |
| `collection-labels.ts:30` redirects | Chuyển hướng URL | Chuyển hướng đường dẫn | "URL" |
| `admin-groups.ts:13` nhóm **[Q8]** | Danh mục | Dữ liệu nền | Nhóm "Danh mục" chứa collection cũng tên "Danh mục" → trùng |
| `dashboard/NavGroupCards.tsx:10` **[Q8]** | Danh mục quản lý | Mục quản lý | Tránh trùng nhóm/collection "Danh mục" |
| `dashboard/dashboard-queries.ts:72,80,109,118` **[Q1]** | Lead mới · Lead chưa phân công · Lead mới được giao · Lead đang chăm sóc | A: giữ · B: Khách mới · Khách chưa phân công · Khách mới được giao · Khách đang chăm sóc | Theo Q1 |
| `dashboard/dashboard-queries.ts:81` **[Q3]** | Mới, chưa có người phụ trách | Mới, chưa giao sale | Thống nhất "Sale phụ trách" |
| `dashboard/RecentLists.tsx:28,32` **[Q1]** | Lead mới nhất · Lead được giao gần đây · Chưa có lead nào. | A: giữ · B: Khách mới nhất · Khách được giao gần đây · Chưa có khách nào. | Theo Q1 |

### 2. Khách hàng (Lead, Lịch sử chăm sóc, file Excel)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `Leads.ts:216` mô tả **[Q1]** | Khách để lại thông tin từ website; sale chỉ thấy lead được giao, admin phân công và xuất Excel. | A: giữ · B: thay "lead" → "khách" | Theo Q1 |
| `Leads.ts:48` **[Q1]** | Mã lead | A: giữ · B: Mã khách | |
| `Leads.ts:59` **[Q1]** | Nguồn lead | A: giữ · B: Nguồn khách | |
| `Leads.ts:20` option nguồn `property_post` **[Q2]** | Đăng tin BĐS | Tin bất động sản | Menu admin gọi "Tin bất động sản" — một khái niệm một tên |
| `Leads.ts:67` **[Q2]** | Tin BĐS quan tâm | Tin bất động sản quan tâm | như trên |
| `Leads.ts:84` option ngôn ngữ | English | Tiếng Anh | Lẫn tiếng Anh; khớp email ("Tiếng Anh") |
| `Leads.ts:138` **[Q5]** | Giao lúc | Ngày giao | Khớp cột Excel "Ngày giao", "Ngày tạo" |
| `Leads.ts:164` **[Q5]** | Liên hệ lần đầu lúc | Ngày liên hệ đầu tiên | Mẫu "Ngày …" |
| `Leads.ts:169` **[Q5]** | Đã nhắc phân công lúc | Ngày nhắc phân công | |
| `Leads.ts:170` **[Q5]** | Đã ẩn danh lúc | Ngày xoá thông tin cá nhân | "ẩn danh" khó hiểu; nghĩa thật là xoá dữ liệu cá nhân sau thời hạn |
| `Leads.ts:174` **[Q5]** | Đồng ý chính sách lúc | Ngày đồng ý chính sách | |
| `Leads.ts:183` nhóm | Tham số UTM | Nguồn quảng cáo (UTM) | Nói nghĩa trước, giữ "UTM" cho marketing |
| `Leads.ts:189` | Trang giới thiệu (referrer) | Trang khách đến từ | "referrer" |
| `LeadActivities.ts:38` **[Q1]** | Lead | A: giữ · B: Khách hàng | |
| `LeadActivities.ts:35` **[Q3]** | Người phụ trách trước / Người phụ trách sau | Sale phụ trách trước / Sale phụ trách sau | Lead dùng "Sale phụ trách" |
| `LeadActivities.ts:14` option `merged` | Gộp lead | Khách gửi lại (đã gộp) | Nói rõ chuyện gì xảy ra |
| `LeadActivities.ts:87` mô tả **[Q1]** | Ghi chú, cuộc gọi và các thay đổi của lead; chỉ thêm, không sửa/xoá. | A: giữ · B: "…của khách…" | |
| `leads-export.ts:31` cột Excel **[Q3]** | Người phụ trách | Sale phụ trách | Khớp admin |

### 3. Tuyển dụng + Tệp CV
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `JobApplications.ts:63` option | English | Tiếng Anh | Lẫn tiếng Anh |
| `JobApplications.ts:86` mô tả | Hồ sơ ứng viên nộp qua website (chỉ admin xem); tự ẩn danh sau 12 tháng. | Hồ sơ ứng viên nộp qua website (chỉ admin xem); tự xoá thông tin cá nhân và CV sau 12 tháng. | "ẩn danh" |
| `JobApplications.ts:54` **[Q5]** | Đồng ý chính sách lúc | Ngày đồng ý chính sách | |
| `JobApplications.ts:109` **[Q5]** | Đã ẩn danh lúc | Ngày xoá thông tin cá nhân | |
| `CvDownloadButton.tsx:19` | CV đã được xoá (hồ sơ đã ẩn danh). | CV đã được xoá (hồ sơ quá thời hạn lưu). | |
| `PrivateFiles.ts:27` mô tả | CV ứng viên (bucket riêng, chỉ admin tải qua nút trong hồ sơ ứng tuyển). | CV ứng viên gửi qua website, lưu riêng tư; chỉ admin tải được bằng nút "Tải CV" trong hồ sơ ứng tuyển. | "bucket" |
| cột "MIME Type" (Payload gán cứng `payload/dist/uploads/getBaseFields.js:13`, không qua i18n) — Thư viện ảnh & tệp + Tệp CV | MIME Type | Loại tệp | Tiếng Anh. Đổi bằng cách khai lại field `mimeType` (cùng `name`, chỉ `label`) trong `Media.ts`/`PrivateFiles.ts` — Payload gộp field upload trùng tên; builder phải kiểm schema không đổi |

### 4. Trường dùng chung mọi nội dung (đường dẫn, SEO, bản dịch)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `fields/slug.ts:119` | Đường dẫn (slug) | Đường dẫn trang | "slug" |
| `fields/slug.ts:125` mô tả | Để trống để tự sinh từ tiêu đề. Trùng sẽ tự thêm -2, -3... | Phần cuối địa chỉ trang, vd du-an-abc. Để trống thì tự tạo từ tiêu đề; trùng thì tự thêm -2, -3… | Giải thích đường dẫn là gì |
| `fields/slug.ts:105` lỗi | Slug không được để trống (nhập tiêu đề hoặc nhập slug). | Đường dẫn trang không được để trống (nhập tiêu đề hoặc đường dẫn). | "slug" |
| `Provinces.ts:51`, `Wards.ts:41` | Đường dẫn (slug) | Đường dẫn | "slug" |
| `fields/seo.ts:16` | Tiêu đề SEO (meta title) | Tiêu đề hiện trên Google | Thuật ngữ dev |
| `fields/seo.ts:17` | Mô tả SEO (meta description) | Mô tả hiện trên Google | |
| `fields/seo.ts:18` | Ảnh chia sẻ mạng xã hội (OG image) | Ảnh khi chia sẻ lên mạng xã hội | "OG image" |
| `fields/seo.ts:19` | Không cho máy tìm kiếm lập chỉ mục (noindex) | Ẩn trang khỏi Google | "noindex", "lập chỉ mục" |
| `fields/seo.ts:20` | URL chuẩn (canonical) | Đường dẫn gốc (khi trang trùng nội dung) + mô tả "Thường để trống." | "canonical", "URL" |
| `fields/translation.ts:50` mô tả | Hệ thống tự dịch VI → EN khi xuất bản; các mục dưới đây chỉ đọc. | Hệ thống tự dịch tiếng Việt sang tiếng Anh khi xuất bản; các mục dưới đây chỉ đọc. | "VI → EN" |
| `fields/translation.ts:63` | Bản Việt đã đổi sau khi sửa tay bản Anh | Bản tiếng Việt đã sửa sau khi sửa tay bản tiếng Anh | Thống nhất "tiếng Việt/tiếng Anh" |
| `fields/translation.ts:64` | Dấu nội dung nguồn đã dịch | Mã kiểm tra bản đã dịch (hệ thống) | Khó hiểu; báo là trường hệ thống |
| `fields/translation.ts:65` **[Q5]** | Dịch lúc | Ngày dịch | |
| `fields/translation.ts:17` option nguồn EN | AI dịch | Dịch tự động (AI) | Khớp "Dịch tự động" ở Cấu hình chung |
| `lib/translation/admin-ui.ts:8` (lọc dịch) | AI dịch | Dịch tự động (AI) | như trên |
| `lib/translation/admin-ui.ts:9` (lọc dịch) | Đã sửa tay | Sửa tay | Khớp option trường "Nguồn bản tiếng Anh" |
| `lib/translation/admin-ui.ts:11` (lọc dịch) | Bản Việt đổi sau khi sửa tay | Bản tiếng Việt đã sửa sau khi sửa tay bản tiếng Anh | Khớp nhãn trường |
| `lib/translation/admin-ui.ts:87` (nút Dịch lại) | Đã xếp hàng dịch lại. Bản tiếng Anh sẽ được cập nhật sau ít phút. | Đã gửi yêu cầu dịch lại. Bản tiếng Anh sẽ được cập nhật sau ít phút. | "xếp hàng" (queue) |
| `lib/translation/admin-ui.ts:92` | …(Cài đặt chung hoặc hạn mức dịch tháng bằng 0)… | …(Cấu hình chung hoặc hạn mức dịch tháng bằng 0)… | Tên global là "Cấu hình chung" |
| `ApproveEnglishButton.tsx:11` | …Nhập ở bản EN rồi duyệt lại. | …Nhập ở bản tiếng Anh rồi duyệt lại. | "EN" |
| `ApproveEnglishButton.tsx:63` | Duyệt bản EN | Duyệt bản tiếng Anh | "EN" |
| `fields/search-reindex-pending.ts:61` | Đang dựng lại chỉ mục tìm kiếm | Đang cập nhật dữ liệu tìm kiếm | "chỉ mục" |
| `SearchReindexPendingWarning.tsx:14` | Nhiều tin cho thuê đang được dựng lại chỉ mục tìm kiếm ở chế độ nền; kết quả tìm kiếm theo tên mới sẽ đầy đủ sau ít phút. | Đang cập nhật dữ liệu tìm kiếm cho nhiều tin cho thuê; tìm theo tên mới sẽ đầy đủ sau ít phút. | như trên |
| `fields/nav-link.ts:14` mô tả (Menu, Chân trang, Trang chủ) | Khoá trang (home, projects, …) hoặc địa chỉ https://... | Mã trang có sẵn: home (Trang chủ), projects (Dự án), rentals (Cho thuê), property-posts (Tin BĐS), news (Tin tức), careers (Tuyển dụng), contact (Liên hệ), privacy-policy, terms-of-use — hoặc địa chỉ đầy đủ https://… | "Khoá trang" khó hiểu; giải nghĩa mã (mã giữ nguyên vì là giá trị) |

### 5. Dự án, Tin BĐS, Danh mục
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `projects/market-blocks.ts:29-31` option Bảng giá | Còn hàng · Sắp hết · Hết hàng | Còn căn · Sắp hết căn · Hết căn | Từ bán lẻ, sai ngữ cảnh BĐS |
| `projects/market-blocks.ts:62`, `Projects.ts:88` | Mã icon | Biểu tượng (tuỳ chọn) | "Mã icon" |
| `Projects.ts:166` tab | Nội dung mở rộng | Bảng giá & thông tin thêm | Tab chứa điểm nổi bật, tiện ích xung quanh, bảng giá, FAQ — tên cũ không gợi |
| `hooks/categories/scope-collections.ts:9` **[Q2]** | Đăng tin BĐS | Tin bất động sản | Một khái niệm một tên |
| `Provinces.ts:13` (thông báo chặn xoá) **[Q2]** | tin đăng BĐS | tin bất động sản | như trên |

### 6. Hệ thống (Nhật ký, Lượt bấm, Chi phí dịch, Nhân viên, Chuyển hướng)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `AuditLogs.ts:12` option | Xoá nội dung (thùng rác) | Chuyển nội dung vào thùng rác | Phân biệt với xoá vĩnh viễn |
| `AuditLogs.ts:14` option | Xoá hẳn nội dung | Xoá vĩnh viễn nội dung | Khớp nút Payload "Xoá vĩnh viễn" |
| `hooks/audit-content-delete.ts:37` tóm tắt | Xoá mềm | Chuyển vào thùng rác | "xoá mềm" là thuật ngữ dev |
| `hooks/audit-content-delete.ts:44` tóm tắt | Xoá hẳn | Xoá vĩnh viễn | như trên |
| `AuditLogs.ts:10-11` option **[Q1]** | Phân công lead · Xuất Excel lead | A: giữ · B: Phân công khách · Xuất Excel khách hàng | |
| `AuditLogs.ts:62` | ID bản ghi | Mã bản ghi | "ID" |
| `AuditLogs.ts:65` | Chi tiết (JSON) | Chi tiết kỹ thuật | "JSON" |
| `AuditLogs.ts:66` | Mã băm IP | IP (đã ẩn danh) | "băm" (hash) |
| `ClickEvents.ts:34` | Trang | Trang được bấm | Rõ nghĩa trong danh sách |
| `ClickEvents.ts:35`, `ClickStatsDaily.ts:36` | Loại nội dung gắn kèm | Loại nội dung | Bỏ chữ thừa |
| `ClickEvents.ts:36`, `ClickStatsDaily.ts:37` | ID nội dung gắn kèm | Mã nội dung | "ID" |
| `TranslationUsage.ts:18` mô tả | Mức dùng AI dịch theo tháng (số lần gọi, token, chi phí ước tính) để theo dõi hạn mức. | Mức dùng dịch tự động theo tháng (số lần dịch, lượng chữ, chi phí ước tính) để theo dõi hạn mức. | "token", "gọi" |
| `TranslationUsage.ts:26` | Tháng (YYYY-MM) | Tháng (vd 2026-10) | "YYYY-MM" |
| `TranslationUsage.ts:32` | Token đầu vào | Lượng chữ gửi dịch (token) | "Token" đứng đầu, khó hiểu |
| `TranslationUsage.ts:33` | Token đầu ra | Lượng chữ nhận về (token) | |
| `TranslationUsage.ts:34` | Số lần gọi AI | Số lần dịch | |
| `Staff.ts:109` mô tả | Tài khoản nội bộ đăng nhập trang quản trị (admin / sale). | Tài khoản nội bộ đăng nhập trang quản trị (quản trị viên / nhân viên sale). | Khớp tên vai trò |
| `redirects-plugin.ts:27` mô tả | Chuyển hướng 301 từ đường dẫn cũ sang mới (tự tạo khi đổi slug; sửa tay khi cần). | Tự chuyển khách từ đường dẫn cũ sang đường dẫn mới (tạo tự động khi đổi đường dẫn trang; có thể sửa tay). | "301", "slug" |

### 7. Website (Trang chủ, Menu đầu trang, Cấu hình chung, Trang pháp lý)
| Màn/nguồn | Chữ hiện tại | Đề xuất | Lý do |
|---|---|---|---|
| `Homepage.ts:106` nhóm | Hero (băng đầu trang) | Banner đầu trang | "Hero"; "Banner" đã dùng ở Cấu hình chung |
| `Homepage.ts:239` tab | Hero | Banner đầu trang | như trên |
| `homepage/blocks.ts:52` | Ô tìm kiếm ở hero | Ô tìm kiếm trên banner | |
| `homepage/blocks.ts:57` | Dự án gợi ý (chip) | Dự án gợi ý dưới ô tìm kiếm | "chip" |
| `Homepage.ts:220` mô tả | Hero luôn đứng đầu; kéo thả… | Banner đầu trang luôn đứng đầu; kéo thả… | |
| `Homepage.ts:98` option khối | Kêu gọi hành động | Khối mời tư vấn | Dịch từ "CTA", khó hiểu |
| `Homepage.ts:247` tab | Kêu gọi | Mời tư vấn | Cụt nghĩa |
| `Header.ts:46` nhóm | Nút kêu gọi hành động | Nút nổi bật (vd Nhận tư vấn) | như trên |
| `Header.ts:20` mô tả | Menu chính (2 cấp) và nút kêu gọi hành động ở đầu trang. | Menu chính (2 cấp) và nút nổi bật ở đầu trang. | |
| `SiteSettings.ts:113` mô tả | Số hiển thị và gọi từ nút nổi (FR-PUB-12) | Số hiển thị và gọi từ nút liên hệ nổi trên website | Mã yêu cầu nội bộ "(FR-PUB-12)" |
| `SiteSettings.ts:131` | Đường dẫn | Link trang | Link ngoài: thống nhất "Link Zalo", "Link Fanpage" |
| `SiteSettings.ts:159` mô tả | Tắt nhanh dịch tự động (BR-08) | Tắt nhanh dịch tự động khi cần | "(BR-08)" |
| `SiteSettings.ts:167` mô tả | Thuật ngữ cố định cho AI dịch (BR-08) | Thuật ngữ AI luôn dịch cố định như bảng này | "(BR-08)" |
| `SiteSettings.ts:178` tab | Kỹ thuật | Thống kê & chính sách | Tab chứa mã Google Analytics + phiên bản chính sách — "Kỹ thuật" làm người dùng ngại mở |
| `SiteSettings.ts:186` mô tả | Tự cập nhật khi xuất bản chính sách bảo mật (BR-30) | Tự cập nhật khi xuất bản chính sách bảo mật | "(BR-30)" |
| `Pages.ts:64` mô tả | Phiên bản văn bản, vd 1.0. Bản chính sách bảo mật đã xuất bản là consentVersion của form (BR-30). | Phiên bản văn bản, vd 1.0. Phiên bản chính sách bảo mật đang xuất bản được lưu kèm mỗi lần khách đồng ý trên form. | "consentVersion", "(BR-30)" |

**Tổng: ~690 chuỗi rà → 100 dòng đề xuất** (1: 12 · 2: 18 · 3: 7 · 4: 24 · 5: 5 · 6: 18 · 7: 16 — dòng gộp nhiều file/chuỗi tính 1).
Trong đó **phụ thuộc câu trả lời**: Q1 (Lead) 10 dòng · Q2 (Tin BĐS) 4 · Q3 (Sale phụ trách) 3 · Q4 (tệp/file) 1 · Q5 ("Ngày …") 8 · Q8 (tên nhóm) 2.

## Kế hoạch code (sau khi duyệt)
1. `collection-labels.ts` (nguồn duy nhất nhãn collection/global — banner dịch `admin-ui.ts` tự theo), `admin-groups.ts`,
   `NavGroupCards.tsx`, dashboard, rồi lần lượt collection/global/field/component theo bảng. Chỉ đổi chuỗi; không đổi `name`/`value`/slug.
2. `mimeType` → "Loại tệp": khai field trùng tên trong `Media.ts`/`PrivateFiles.ts`; xác nhận `payload-types` + migration không đổi
   (không ghi đè `src/payload-types.ts` nếu đang dirty của user — chỉ so sánh output generate ra file tạm).
3. Test: cập nhật test đang assert chữ cũ (`DashboardLinks.test.tsx`, `DashboardParts.test.tsx`, test component admin khác nếu có);
   thêm test khoá nhãn chính trong `src/lib/admin/collection-labels.test.ts` (private-files, leads, click-stats-daily, translation-usage,
   redirects) + `admin-groups.test.ts` (tên nhóm) + 1 test không còn `(slug)`, `noindex`, `canonical`, `(BR-`, `(FR-` trong nhãn/mô tả
   field của config đã sanitize (duyệt `buildConfig` → mọi field `label`/`admin.description` dạng chuỗi).
4. Verify: `pnpm vitest run src/lib/admin src/components/admin src/collections src/fields src/globals src/lib/translation src/endpoints/admin`,
   `pnpm typecheck`, `pnpm lint`.
- KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, `src/components/projects/*`, `.claude/launch.json`, `template-feedback.md`.

## Acceptance
- [ ] Mọi dòng trong bảng (theo lựa chọn Q) hiện đúng; nhãn collection chỉ sửa ở `collection-labels.ts`.
- [ ] Không còn trong nhãn/mô tả admin: "slug", "canonical", "noindex", "OG", "hash/băm", "bucket", "consentVersion", mã "(BR-…)/(FR-…)", "VI → EN".
- [ ] Một khái niệm một tên: Thùng rác · Ngày … · Sale phụ trách · Tin bất động sản · tiếng Việt/tiếng Anh · Dịch tự động (AI) · Cấu hình chung.
- [ ] Banner dịch lỗi + lọc dịch vẫn đúng nhãn (COLLECTION_LABELS lấy từ `collection-labels.ts`).
- [ ] Không đổi slug/schema/URL/access; không sinh migration.
- [ ] Verify commands PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Câu hỏi cần user chốt (T01 + T02)
- **Q1 "Lead"**: A — giữ "Lead" (đội sale quen, ngắn; chỉ bỏ "Lead khách hàng" lặp) **(khuyến nghị)** · B — đổi "Khách hàng tiềm năng"/"khách" mọi nơi (11 dòng).
- **Q2 Tin BĐS**: trong admin thống nhất "Tin bất động sản" (tên menu) thay "Đăng tin BĐS"/"tin đăng BĐS" **(khuyến nghị)** — website công khai giữ "Đăng tin BĐS".
- **Q3**: thống nhất "Sale phụ trách" (cả Excel, Lịch sử chăm sóc, Tổng quan) thay "Người phụ trách" **(khuyến nghị)**?
- **Q4 "tệp" hay "file"**: "Tệp CV ứng viên" + "tệp" mọi nơi **(khuyến nghị, khớp chữ Payload)** · hay "File CV ứng viên" + "file" mọi nơi?
- **Q5 ngày giờ**: đổi đồng loạt "X lúc" → "Ngày X" (Ngày giao, Ngày dịch, Ngày xoá thông tin cá nhân…) cho khớp "Ngày xoá"/"Ngày tạo" **(khuyến nghị)**?
- **Q6 bộ lọc**: đổi "bằng/không bằng/có trong/tồn tại/Đúng/Sai" → "là/không phải/là một trong/có giá trị/Có/Không" (kèm sửa thông báo lỗi xuất Excel) **(khuyến nghị)**?
- **Q7**: đổi "tài liệu" → "mục" trong thông báo khoá sửa / không tìm thấy (trong BĐS "tài liệu" dễ hiểu nhầm là brochure) **(khuyến nghị)**?
- **Q8 tên nhóm**: nhóm "Danh mục" → "Dữ liệu nền"; tiêu đề "Danh mục quản lý" (Tổng quan) + "Collections" → "Mục quản lý"; "globals" → "Cài đặt website" **(khuyến nghị)** — gợi ý cũ "Danh mục quản lý" trùng tên nhóm/collection "Danh mục".
- **Q9 từ mượn giữ nguyên**: SEO, Hotline, Zalo, Fanpage, Email, Logo, CV, Sale, Voucher, Spam, Studio, Slide, Banner, Excel, Menu, Website, Internet, UTM, Google Analytics — đồng ý giữ?
- **Q10 dấu**: chuỗi Payload không đổi nghĩa vẫn viết "xóa/hủy/khóa"; chuỗi đã ghi đè và chữ dự án viết "xoá/huỷ/khoá" — chấp nhận, hay ghi đè thêm ~40 khoá chỉ để đồng bộ dấu?
- Lưu ý BL-039: ô chọn ngôn ngữ dự kiến hiện "Tiếng Việt/English" — đề xuất BL-039 dùng "Tiếng Anh" cho khớp option "Tiếng Anh" ở đây.

## Verification summary (builder)
- Đã áp mọi dòng bảng §1–§7 theo Q1–Q10 đã duyệt (Q1 A giữ "Lead": chỉ `plural` leads "Lead khách hàng" → "Lead", lead-activities bỏ chữ "lead"; các dòng [Q1] khác giữ nguyên). Không bỏ dòng nào.
- Thêm ngoài bảng (cùng nguyên tắc một khái niệm một tên, chỉ chữ hiển thị): `hooks/wards/guard-delete.ts` "tin đăng BĐS" → "tin bất động sản" (đi cùng Provinces); `SiteSettings.ts` nhãn upload "Đăng tin BĐS" → "Tin bất động sản"; thông báo `endpoints/admin/retranslate.ts` + `hooks/pages/sync-privacy-version.ts` "Cài đặt chung" → "Cấu hình chung". Site công khai (`shell-data*`) không đụng.
- `mimeType` → "Loại tệp": file mới `src/fields/mime-type-label.ts` (field `{name:"mimeType", type:"text", label}`) thêm vào `Media.ts` + `PrivateFiles.ts`. `mergeBaseFields` (`payload/dist/fields/mergeBaseFields.js`) gộp sâu field base vào field khai báo → giữ `hidden/readOnly/validate`, cùng `name`/`type` text → cột DB không đổi. Test xác nhận (admin-label-scan.test.ts). Không chạy generate:types (không ghi `payload-types.ts`).
- `fields/nav-link.ts`: mô tả dựng từ `PAGE_LINK_KEY_LIST` + `Record<PageLinkKey,string>` nghĩa tiếng Việt.
- Test thêm: `src/lib/admin/collection-labels.test.ts`, `src/lib/admin/admin-label-scan.test.ts` (quét cây field đã sanitize của mọi collection/global: không còn "(slug)", noindex, canonical, "(BR-", "(FR-", "VI → EN", bucket, consentVersion, "OG image"; + kiểm mimeType), thêm ca "Dữ liệu nền" ở `admin-groups.test.ts`. Sửa test chữ cũ: `DashboardLinks/DashboardParts.test.tsx`, `SearchReindexPendingWarning.test.tsx`, `translation/admin-ui.test.ts`.
- Verify: `pnpm vitest run src/lib/admin src/components/admin src/collections src/fields src/globals src/lib/translation src/endpoints/admin src/hooks` 56 file / 452 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard). Grep: mọi chuỗi "Đề xuất" có trong code.
- Chưa làm/ngoài phạm vi: không commit; không sửa `payload-vi-overrides.ts`, `payload.config.ts`, `export-filters.ts`.

Round 2 fixes (BL-040 T02):
- MAJOR-1: Rentals.ts "Ngày cho thuê", ClickEvents.ts "Ngày gộp thống kê" (không còn label " lúc" khác trong collections/globals/fields); admin-label-scan.test.ts thêm check không label nào kết thúc " lúc".
- sync-phone-normalized.ts message dùng "đã xoá thông tin cá nhân" (không test assert).
- Projects.ts / market-blocks.ts description icon: "Tên biểu tượng hiển thị kèm tiện ích." / "...kèm điểm nổi bật." (bỏ "tuỳ chọn", "icon").
- Residual: src/jobs/* labels ngoài scope.
- Verify: vitest 550 pass; integration 33 pass; typecheck OK; lint 0 error.

- Close-out (change-request, spec-validator G1): `src/hooks/job-applications/delete-cv-and-audit.ts:33` tóm tắt nhật ký "Xoá hẳn" → "Xoá vĩnh viễn" (khớp `audit-content-delete`); `pnpm vitest run tests/integration/job-applications tests/integration/content-defaults.test.ts tests/integration/services-pages.test.ts` PASS; `pnpm test` toàn bộ 3146/3147 PASS (1 fail đua DB ở `media-upload.test.ts`, chạy riêng 20/20 PASS).
