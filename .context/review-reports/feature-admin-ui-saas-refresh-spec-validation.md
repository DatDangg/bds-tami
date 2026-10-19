Agent: spec-validator

# Spec validation (pre-plan) — BL-015 `feature/admin-ui-saas-refresh` · round 1

- Mode: **Spec validation** (trước khi builder chạy task) · Ngày: 2026-10-19
- Nguồn: `spec/changes/2026-10-19-admin-ui-saas-refresh.md` (Acceptance), `docs/specs/2026-10-19-admin-ui-saas-design.md` (§0–§9, §7 "Đã chốt"), `SPECIFICATIONS.md` F10 FR-ADM-19 (dòng 80, `spec_version` 1.11.0 dòng 9), `spec/updates/2026-10-19-admin-ui-saas-refresh.md` (có), `tasks/feature-admin-ui-saas-refresh/phase-1-task-01..06.md`, `docs/PERMISSION.md`, `spec/changes/2026-10-19-select-dropdown-styling.md` (BL-016), code `src/payload.config.ts`, `src/collections/*`, `src/access/*`, `src/fields/*`, `src/globals/*`, `src/components/admin/*`, `src/lib/translation/*`, `.github/workflows/ci.yml`.

## Verdict: ✅ PASS (kèm ghi chú bắt buộc cho builder)

Không có ❌, không có mâu thuẫn mức HIGH chặn build. 1 ⚠️ coverage (ảnh "trước"). Có 6 ghi chú mức MEDIUM: nếu builder làm đúng nguyên văn task sẽ gây lỗi hoặc làm sai thiết kế. Primary nên chép các ghi chú này vào prompt builder (hoặc vào task file) trước khi gọi builder.

---

## 1. Ma trận phủ Acceptance → task

| # | Acceptance (change doc dòng) | Task phủ | Status | Ghi chú |
|---|---|---|---|---|
| A1 | Style chung, AA sáng+tối (25) | T01 yêu cầu 1–5, test contrast | ✅ | Có test token TS↔SCSS |
| A2 | Dashboard theo quyền (26) | T04 (STRICT, test integration admin vs sale) | ✅ | Xem N1–N3 (tên field/quyền thật) |
| A3 | Sidebar nhóm nghiệp vụ, nhãn VI (27) | T03 | ✅ | Xem N4 (thứ tự nhóm khi có collection plugin) |
| A4 | Việt hoá toàn bộ nhãn + test quét (28) | T02 (test quét + kiểm âm tính) | ✅ | Xem N5 (COLLECTION_LABELS kiêm danh sách collection có dịch), N6 (phạm vi test quét) |
| A5 | List: cột mặc định + badge + thumbnail (29) | T05 | ✅ | Xem N8 |
| A6 | Form: tab/nhóm, trường phụ ở sidebar (30) | T06 (STRICT) | ✅ | Xem N7 |
| A7 | Không đổi schema/DB/access/API (31) | Ràng buộc chung cả 6 task + gate `generate:types` + `migrate:create`; T06 yêu cầu 5 chứng minh 4 lớp | ✅ | Xem N9 (gate cần nói rõ hơn) |
| A8 | Responsive mobile/tablet (32) | T01, T04 (1440/768/390), T05, T06 | ✅ | `project-config` khai mobile test 375 (`responsive_breakpoints`), task dùng 390 → nên chụp thêm 375 hoặc ghi lý do |
| A9 | Ảnh trước/sau các màn chính (33) | Các task yêu cầu kiểm "sau" trên trình duyệt; design §6 liệt kê 6 màn × sáng/tối × 1440/390 | ⚠️ PARTIAL | **Chưa task nào giao chụp ảnh "trước"**. T01 đổi CSS toàn admin → sau T01 mất baseline. Cần: T01 chụp baseline 6 màn trước khi sửa (hoặc primary chụp từ staging/commit `1c0554a`), phase review ghép bộ trước/sau |

## 2. Spec delta FR-ADM-19 ↔ design §7 "Đã chốt"

| Quyết định §7 | FR-ADM-19 (SPECIFICATIONS.md:80) | Task | Khớp |
|---|---|---|---|
| Q1 thẻ admin (lead mới, chưa phân công, hồ sơ mới, nội dung đang hiển thị) / sale (lead mới được giao, đang xử lý, nháp của mình, tin đang đăng), không so với hôm qua | Có, đủ | T04 yêu cầu 3 | ✅ — chênh nhẹ: §3.2 + T04 ghi "tin đang đăng **của mình**", FR-ADM-19 và §7 chỉ ghi "tin đang đăng". Theo §3.2 (bảng chi tiết) là của mình → builder lọc `author`, xem N1 |
| Q2 khung ở BL-015, FR-ADM-14 cắm sau | Có ("FR-ADM-14 … cắm vào khung này sau") | T04 doc impact ghi chú vào L13-T01 | ✅ |
| Q3 7 nhóm, không ẩn mục, quyền giữ nguyên | Có | T03 yêu cầu 1, 3, 5 | ✅ |
| Q4 không icon menu | Có | T03, T04 yêu cầu 7 | ✅ |
| Q5 thumbnail projects = ảnh đầu `gallery` | Có | T05 yêu cầu 3 | ✅ |
| Q6 dòng 48px | Có | T01, T05 | ✅ |
| Q7 style select admin vào T01 | "ô chọn (select) admin cùng một style" | T01 yêu cầu 2, 6 | ✅ |
| Song song T01∥T02, T04∥T05 | — (không thuộc spec) | header T01/T02/T04/T05 | ✅ — xem §6 |

Version: SPECIFICATIONS `spec_version 1.11.0` + `spec/updates/2026-10-19-admin-ui-saas-refresh.md` đã có (đúng §9 MINOR).
Thông tin trạng thái cũ chưa cập nhật (doc hygiene, không chặn): design doc dòng 4 vẫn ghi "⏸ chờ user duyệt design"; `spec/changes/BACKLOG.md:25` BL-015 vẫn ghi "chờ user duyệt tokens/plan, chưa code".

## 3. Không đổi schema/access/API — gate

- Cả 6 task có cùng ràng buộc: không đổi `name`, không bọc vào `group`/`tabs` có `name`; kiểm `generate:types` + `migrate:create`. T06 có thêm test lưu/đọc integration và liệt kê `siblingData`. ✅
- Code hỗ trợ tab không tên: `src/lib/translation/leaves.ts:95-105` duyệt `row`/`collapsible`/tab không tên như vỏ giao diện (không đổi path dịch); `src/fields/slug.ts:42` dùng `flattenedFields`. ✅
- Gate cần nói rõ thêm: xem N9.

## 4. Thẻ dashboard ↔ quyền thật (file:line cho builder)

| Hạng mục | Thực tế code | Hệ quả cho T04 |
|---|---|---|
| Sale đọc `job-applications`? | **Không**: `access.read: isAdmin` (`src/collections/JobApplications.ts:83`), `admin.hidden` non-admin (`:80`); status `new` có (`:7`) | Thẻ "Hồ sơ ứng tuyển mới" chỉ admin, kiểm bằng `permissions.collections['job-applications'].read` ✅ đúng thiết kế |
| Tên field người phụ trách lead | `assignedTo` (relationship → `staff`, `src/collections/Leads.ts:119`); status `new/contacted/consulting/won/lost/spam` (`src/lib/leads/lead-values.ts:6`, `Leads.ts:84-91`) | Chưa phân công: `{ status: { equals: "new" }, assignedTo: { exists: false } }` (giống job `remind-unassigned-leads`, comment `Leads.ts:184`) |
| Sale đọc lead | `isAssignedOrAdmin` (`Leads.ts:187`) → `overrideAccess:false` tự lọc `assignedTo = user.id` | "Lead mới được giao" / "đang xử lý" chỉ cần where theo status ✅. Nhưng thẻ "chưa phân công" **phải ẩn theo role** (sale có quyền read leads nên permissions không tự ẩn; nếu đếm sẽ luôn ra 0) |
| Tên field tác giả | `author` (relationship → `staff`, `src/fields/author.ts:14`), gắn qua `withContentDefaults` | "Bản nháp của mình": `{ status: { equals: "draft" }, author: { equals: user.id } }`. `pages` **không có `author`** (omit, design `content-defaults.ts:61`) — đã ngoài 4 loại ✅ |
| Sale đọc nội dung | `makePublishedOnly` → staff active đọc **tất cả** (`src/access/publishedOnly.ts:20-24`, gắn ở `src/collections/_shared/content-defaults.ts:152`) | **N1:** Design §3 nói "sale chỉ đếm được … bài của mình" là sai với nội dung. `overrideAccess:false` **không** lọc theo tác giả → "Tin đang đăng (của mình)" phải thêm `author: { equals: user.id }` rõ ràng, nếu không sale thấy tổng toàn hệ thống |
| "Đang hiển thị" | Công khai = `PUBLIC_STATUSES` (`publishedOnly.ts:4-7`): rentals gồm `published` + `rented`; `buildPublicWhere` (`:13-16`) thêm `deletedAt exists false` | **N2:** dùng lại `PUBLIC_STATUSES` (+ `buildPublicWhere`) thay vì tự viết `status = published`, để rentals `rented` khớp với site. Content/leads có `trash: true` → kiểm (test) `count` mặc định không tính bản đã xoá mềm |
| Lối tắt tạo | `create`: content `isStaff` (`content-defaults.ts:153`); `services`/`pages` admin (`Services.ts:32`, `Pages.ts:28`); categories/developers/provinces/wards admin; `media` `isStaff` (`Media.ts:33`); `leads` `denyAll` (`Leads.ts:187`); `job-applications`/`private-files`/`audit-logs`/click/translation-usage `denyAll`; **`lead-activities` `addManualActivity`** (`LeadActivities.ts:76`) | **N3:** dùng **allowlist** collection nội dung cho lối tắt (projects, rentals, property-posts, news, job-postings, services, pages; media tuỳ chọn) rồi lọc theo `permissions.create`. Nếu lặp mọi collection theo `create`, sale sẽ có lối tắt "Lịch sử chăm sóc" (tạo activity không gắn lead) — sai ý "tạo nội dung" |
| Card "Danh mục quản lý" | Globals `read: () => true` nhưng ẩn với non-admin bằng `admin.hidden: hideFromNonAdmin` (`Footer.ts:15-16`, `Header.ts:17-18`, `SiteSettings.ts:56-57`, `Homepage.ts:193-194`); `redirects` hidden non-admin (`redirects-plugin.ts:21`); `staff` read `selfOrAdmin` (`Staff.ts:117`) | Lọc mục bằng `permissions.read` **và** `admin.hidden(user)` (giống nav). Nếu chỉ dùng `read`, sale sẽ thấy nhóm Website (Cấu hình chung/Trang chủ/…) trên dashboard dù menu trái ẩn |
| PII "Lead mới nhất" | `fullName`/`phone`/`email` sale đọc được trên lead được giao; `assigneeInactive` chỉ admin đọc (`Leads.ts:37`, `:134`) | `select` hẹp: `code, fullName, status, assignedTo, createdAt`; không lấy phone/email. Badge "Sale đã nghỉ" (T05) chỉ admin có dữ liệu |
| "Bạn sửa gần đây" | Không có field `updatedBy`/người sửa cuối (grep `src/` rỗng); `audit-logs` chỉ admin và chỉ ghi thao tác nhạy cảm | Không có nguồn "do tôi sửa" rẻ và chính xác → builder dùng `author = me` sắp `-updatedAt` (sale) / `-updatedAt` toàn bộ (admin), và **đặt nhãn đúng nghĩa** (vd "Bài của bạn cập nhật gần đây"); ghi lý do như T04 yêu cầu 6 đã cho phép |

## 5. Chồng lấn L13-T01 (FR-ADM-14) và BL-016

- **L13-T01:** FR-ADM-19 + T04 ghi FR-ADM-14 cắm vào khung sau; T04 doc impact giao việc ghi chú vào `tasks/tami-website/layer-13-task-01.md` (hiện file chưa có ghi chú — grep "BL-015" rỗng, đúng vì chờ T04). T04 không tạo endpoint `GET /api/admin/dashboard` → không lấn API của L13-T01. ✅
- **BL-016:** T01 làm phần style react-select admin, T01 yêu cầu 6 cấm đụng `TranslationStatusFilter`. BL-016 Acceptance (dòng 26) vẫn tương thích ("style select field admin rà theo BL-015 nếu cần"). Còn thiếu: BL-016 change doc / BACKLOG chưa ghi quyết định Q7 (tách; phần admin của BL-016 chạy **sau** BL-015 T01). Chỉ là doc hygiene → primary nên ghi 1 dòng vào `spec/changes/2026-10-19-select-dropdown-styling.md`. ✅ (ghi chú)

## 6. Thứ tự / phụ thuộc / song song

Thứ tự `T01 ∥ T02 → T03 → T04 ∥ T05 → T06` hợp lý: T03 sau T02 (cùng file collection), T05 sau T03 (cùng file), T06 cuối (cùng file với T02/T03/T05).

Rủi ro xung đột file khi chạy song song:

| Cặp | File có thể đụng cả hai | Mức | Đề xuất |
|---|---|---|---|
| T01 ∥ T02 | `src/components/admin/TranslationFailedBanner.tsx` (T01 restyle; T02 nếu xử lý N5 sẽ sửa phần dùng `COLLECTION_LABELS`); `custom.scss` (nếu T02 thêm style RowLabel) | Thấp–TB | T02 **không** sửa `custom.scss`; nếu cần đổi banner theo N5 thì chỉ đổi phần import/nguồn danh sách, merge sau T01 |
| T04 ∥ T05 | `src/app/(payload)/admin/importMap.js` (cả hai thêm component → **chắc chắn conflict**); `custom.scss` (style dashboard và badge); T04 dùng badge tạm, T05 làm `StatusBadge` | TB | Sau khi merge: chạy lại `pnpm generate:importmap` (CI kiểm lệch ở `.github/workflows/ci.yml:148-151`), không sửa tay importMap. Style của T04/T05 đặt trong khối riêng có comment ranh giới trong `custom.scss` (hoặc file SCSS riêng import vào), để merge không đè nhau. T05 yêu cầu 8 đã cấm sửa file dashboard ✅ |
| T04 ↔ T03 | T04 dùng const nhóm `src/components/admin/admin-groups.ts` của T03 | — | Tuần tự, đã khai phụ thuộc ✅ |

---

## 7. Ghi chú bắt buộc cho builder (N1–N9)

- **N1 (T04, MEDIUM)** — `overrideAccess:false` không lọc nội dung theo tác giả cho sale (`publishedOnly.ts:20-24`). Mọi thẻ "của mình" phải có `author: { equals: user.id }` rõ ràng. Test integration phải có bài published của sale khác để chứng minh số đếm không bị gộp.
- **N2 (T04, LOW)** — "Đang hiển thị" dùng `PUBLIC_STATUSES` (rentals + `rented`) / `buildPublicWhere`; test `count` không tính bản xoá mềm (`trash: true` ở content và leads `Leads.ts:183`).
- **N3 (T04, MEDIUM)** — Lối tắt: allowlist collection nội dung ∩ `permissions.create` (tránh `lead-activities` với sale, `LeadActivities.ts:76`). Thẻ/khối phân theo **role** cho bộ thẻ admin/sale (vd "chưa phân công" sale có quyền read leads nhưng vẫn phải ẩn). Card nhóm: `read` + `admin.hidden(user)`.
- **N4 (T03, MEDIUM)** — `redirects` do plugin nối vào **cuối** mảng `collections` (`payload.config.ts:114-115`, `contentRedirectsPlugin`), nên chỉ sắp lại mảng trong `buildConfig` không đưa được nhóm "Website" (redirects + globals) lên trước "Hệ thống": nav Payload xếp nhóm theo lần xuất hiện đầu tiên, duyệt collection trước rồi mới tới global. Phương án chỉ đổi config: plugin nhỏ đặt **sau** các plugin khác, sắp lại `config.collections` theo const nhóm. Hoặc ghi rõ thứ tự thực tế và hỏi primary/user. Yêu cầu 2 của T03 đã bắt kiểm, nhưng builder cần biết trước nguyên nhân.
- **N5 (T02, MEDIUM)** — `COLLECTION_LABELS` (`src/lib/translation/admin-ui.ts:36-46`) **đồng thời là danh sách collection có bản dịch** mà banner duyệt (`TranslationFailedBanner.tsx:45-46`, query `where[translation.status]`). Nếu "mở rộng cho đủ" 22 collection như T02 yêu cầu 1, banner sẽ bắn thêm ~13 request lỗi 400 (collection không có `translation`) mỗi lần mở dashboard. Cách làm: tách nguồn nhãn chung (vd `ADMIN_COLLECTION_LABELS` cho mọi collection) và giữ/derive danh sách collection có dịch riêng (từ allowlist dịch), banner tra nhãn từ nguồn chung. Nhãn đang lệch nhau: `Header.ts:16` "Menu đầu trang" và `admin-ui.ts:48` "Đầu trang"; `job-postings` "Tuyển dụng" (admin-ui) và "Tin tuyển dụng" (design §2) → chốt một.
- **N6 (T02, LOW)** — Phạm vi test quét: (a) coi field-level `hidden: true` (vd `Rentals.ts:91`) là ẩn như `admin.hidden`; (b) field `ui`/field có `admin.components.Field` tuỳ biến (`cvDownload` `JobApplications.ts:47-49`, `assigneeInactive` `Leads.ts:135`) cần quy tắc rõ (miễn hoặc vẫn đòi label). Dù được miễn hay không, phải ghi rõ trong test. (c) Option có label = value thô tiếng Anh: `SiteSettings.ts:82` (`label: value` của `SOCIAL_PLATFORMS`), `Homepage.ts:181` (`label: block` của `HOMEPAGE_BLOCKS`). Test (d) "có label" không bắt được → sửa tay theo yêu cầu 5 (tên thương hiệu Facebook/Zalo giữ nguyên được); nên thêm assert label ≠ value cho option không phải tên riêng. (d) `join` (`activities`, `Leads.ts:161`) cũng cần label.
- **N7 (T06, HIGH-risk, đã STRICT)** — `withContentDefaults` **nối** field dùng chung (`seo`, `translation`, `hasEnglish`, `status`, `author`…) vào **cuối** `fields` (`content-defaults.ts:177`) → muốn đưa `seo`/`translation` vào tab SEO/Bản dịch phải đổi `content-defaults.ts` (dùng chung cho cả categories/developers/services/pages) hoặc thêm option đặt chỗ. Field `position: "sidebar"` nên giữ ở **cấp gốc** (ngoài `tabs`). Kiểm bằng mắt: Payload chỉ tách sidebar ở cấp gốc. Test hiện tra field cấp gốc bằng `fields.find(...)` sẽ vỡ khi bọc tab: `src/collections/_shared/content-defaults.test.ts`, `tests/integration/{services-pages,retranslate,rentals,property-posts,leads}.test.ts` → chuyển sang tra `flattenedFields`/duyệt đệ quy, **không** nới assert.
- **N8 (T05, LOW)** — `gallery` là upload `hasMany` (`Projects.ts:130-136`, `Rentals.ts:155-161`). Dữ liệu cũ có thể chứa id con trỏ hỏng/không phải ảnh (test `project-detail-view.test.ts:49`, `project-detail.test.tsx:145`) → `ThumbnailCell` phải có fallback khi phần tử đầu là id chuỗi/null/không phải `image/*`. `cover`: `PropertyPosts.ts:59`, `News.ts:25`.
- **N9 (mọi task, MEDIUM)** — Gate migration/type:
  (a) `pnpm payload migrate:create` khi không có thay đổi schema sẽ **hỏi tương tác** có tạo migration rỗng không → dùng `--skip-empty` (hoặc trả lời No) trên DB dev riêng đã migrate tới HEAD, ghi output.
  (b) "`payload-types.ts` không đổi kiểu": T03 sắp lại mảng `collections`/`globals` và T02/T05 thêm `admin.description` sẽ làm diff `payload-types.ts` khác rỗng (thứ tự interface/khoá, JSDoc). Hiểu gate là **không đổi tên interface / shape field**. Reviewer so bằng ngữ nghĩa (vd `pnpm typecheck` PASS + so danh sách interface/field), không đòi diff rỗng.
  (c) Residual risk: kiểm interface name (`Lead`, `Project`…) không đổi sau khi thêm `labels` tiếng Việt.

## 8. Gap list

- [PARTIAL] A9 Ảnh trước/sau — thiếu bước chụp baseline "trước" (đề xuất giao T01 làm trước khi sửa CSS, hoặc primary chụp từ staging). Task liên quan: T01, phase review.
- Không có [MISSING].

## 9. Residual risk

- Hành vi `count` với collection `trash: true` (mặc định có loại bản xoá mềm không) và cách Payload 3.91 gộp nhóm nav collection+global: suy từ hiểu biết về Payload, **chưa chạy để xác minh**. Builder phải chứng minh bằng test/trình duyệt (T03 yêu cầu 2, T04 yêu cầu 9).
- Validator không chạy lệnh verify (pre-plan, chưa có code mới).
