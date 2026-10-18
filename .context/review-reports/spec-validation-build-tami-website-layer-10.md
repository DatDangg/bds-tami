Agent: spec-validator

# Spec validation — build/tami-website — layer 10 (đóng layer, trước ⏸ Mốc M2)

- Mode: Phase review (đóng layer, initial build, AGENTS.md bước 5g). Sau layer 10 là ⏸ **M2**: "Tính năng Must xong (website VI/EN, lead, tuyển dụng, tự dịch)" (`docs/diagrams/layer-plan.md:26,45`; `progress.json:648-651` M2 `pending`).
- Phạm vi: 5 task L10-T01…T05. Commit (base `ef39df4`): `f404dcb` (T01), `5dbce88` (T04), `954f146` (T05), `c023647` (T03), `eec9389` (BL-004), `6321020` (T02, HEAD). Cả 5 task có trong `progress.json` `completedTasks` (STRICT PASS: T01 r1, T04 r2, T05 r2, T03 r2, T02 r4).
- Nguồn: `docs/BRD.md` (`:136-152,174-175,189-208,218`), `.context/design-spec.md` (§1.2 `:24-36`, §2.1 `:79`, §3.2 `:142`, §3.3 `:144-160`, §3.5 `:168-173`, S04 `:350`, S07 `:407-423`, S14 `:519`, S15 `:529-540`, S16 `:547`), `docs/API_SPEC.md` (§4 `:189-207`, §5.1 `:225-229`, §5.2 `:231-233`), `docs/PERMISSION.md` (§4 `:82-96`, §5 `:98-115`, §6 `:117-119`), `docs/ERD.md`, `docs/ARCHITECTURE.md`, `docs/runbooks/deploy.md`, `docs/runbooks/restore.md`, `spec/changes/BACKLOG.md`, task file L10 + L11/L12/L13, report review L10, report layer 9.

## Verify (chạy hôm nay, HEAD 6321020, checkout chính)

| Lệnh (`project-config.md`) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (không lỗi) |
| `pnpm lint` | PASS (không lỗi, không cảnh báo) |
| `pnpm test` | PASS: **227 file, 2.400 test, 0 lỗi** (gồm `contrast.test.ts` sau BL-004, `messages-check.test.ts`, `list-no-loading.test.ts`, integration `retranslate`, `locale-counterpart`, `data-retention`, `leads-public`) |
| `pnpm build` | Không chạy. Dựa evidence: builder/reviewer ghi build PASS ở worktree từng task và sau khi squash T02 (`layer-10-task-02.md:65`) |
| migration / deploy / ssh | Không chạy (ngoài quyền). Layer 10 **không có migration mới** (diff `ef39df4..HEAD` không đụng `src/migrations/`) |
| `git status` | Chỉ `importMap.js`, `payload-types.ts` khác ở EOL (diff nội dung rỗng); `.claude/launch.json`, run journal validate chưa track |

## Verdict: ⚠️ GAPS FOUND (không chặn M2 về chức năng)

Đạt **24/24 AC** của 5 task: T01 4, T02 7, T03 4, T04 4, T05 5. Không có requirement Must bị bỏ sót, không có conflict HIGH. Intent docs không bị sửa. Doc as-built gần khớp nhưng còn vài chỗ thiếu.

Gap còn mở:
- **G34** (MEDIUM): `?service=` không điền sẵn lời nhắn ở form Liên hệ (S14/S15). Follow-up từ L6-T07 đến nay chưa giao task nào.
- **G35** (LOW): một số chi tiết lead form trong design-spec chưa làm, chưa ghi ở đâu.
- **G36** (LOW): header trong suốt mới có ở trang chủ. Chi tiết dự án và Dịch vụ chưa có.
- **G37** (LOW): doc as-built thiếu, chủ yếu là `/api/locale-counterpart`.
- **G38** (LOW): sổ sách task/progress. Primary tự sửa được.

Phải làm hoặc cần user quyết trước khi duyệt M2:
- **G30 + push staging**: theo quyết định 2026-10-19 (`progress.json:633`), push và sửa nginx gộp một lần trước M2. Local đang đi trước `origin/staging` **34 commit**.
- **BL-013**: chờ user quyết.
- **BL-011**: cần user duyệt Change Request.

## Ma trận coverage

### L10-T01 LeadForm (FR-PUB-03/05/07/11/13, BR-10, BR-17, design-spec §1.2/§3.3)

| # | AC / requirement | Nguồn | Status | Evidence / note |
|---|---|---|---|---|
| 1 | Nút gửi "Nhận tư vấn / Get advice"; tin rented → tiêu đề "Nhận tư vấn căn tương tự / Find similar units", nguồn vẫn là tin đó | task `:40`, §1.2 `:28-29` | ✅ (AC) / ⚠️ S07 | `LeadForm.tsx:93` (`form.lead.submit` = `vi.json:149` / `en.json:149`); `SaleContactBox.tsx:70,73` (`titleRented` `vi.json:523`, `source="rental" sourceId={rentalId}`). Lệch: S07 `:412` ghi "nút gửi **cùng nhãn đó**" nhưng nút vẫn là "Nhận tư vấn" (xem G35) |
| 2 | Gửi `source`, `sourceId`, `locale`, `utm`, `pageUrl`; consent link chính sách đúng ngôn ngữ | task `:41`, §3.3 `:147-148`, BR-10/17 | ✅ | `LeadForm.tsx:29-38` (bỏ `sourceId` khi `contact`); `utm.ts:37-56` (URL → sessionStorage); `locale` qua `usePublicForm` (review r1 mục 1); `ConsentCheckbox.tsx:45-53` (`Link` next-intl, tab mới + `aria-describedby`). BL-010: UTM mới chỉ được ghi ở trang có form |
| 3 | Thành công `role="status"`; lỗi map vào field | task `:42`, §3.3 `:154-160` | ✅ | `LeadForm.tsx:69,77-91`; `FormStatus.tsx:29` (`role="status"` + focus tiêu đề); 429 dùng tông warning + hotline (`:83-90`) |
| 4 | Turnstile lười; HTML trang không đổi (client island) | task `:43` | ✅ | `"use client"`; review r1 mục 6-7 (build: route vẫn SSG/ISR) |
| — | 4 bề mặt (BR-10): cho thuê, Đăng tin BĐS, dự án, liên hệ | BRD `:199` | ✅ | `SaleContactBox.tsx:73`, `PostDetail.tsx:82`, `ProjectDetail.tsx:96`, `lien-he/page.tsx:84` |
| — | Follow-up L9-T02 (đệm thời gian/residual, test rollback `project`, UUID lead-activity, đọc stream có giới hạn) | task `:95-99` | ✅ code / ⚠️ checkbox | Code đã làm, xác minh ở review r1 mục 8-10 (`leads.ts:43-59`, `lead-activity-hooks.ts:43-46`, `leads-public.test.ts:318-335`). Checkbox `:96-99` vẫn `[ ]` (G38) |
| — | `?service=<slug>` điền sẵn lời nhắn (S14 `:519`, S15 `:533`) | design-spec | ❌ [MISSING] | Không có code đọc `service` (Grep `src/`). `dich-vu/[slug]/page.tsx:93` vẫn tạo link `?service=`. `lien-he/page.tsx:55` có comment "form tự đọc `?service=` ở client khi được ráp" nhưng thực tế không đọc. Follow-up L6-T07 (`layer-6-task-07.md:66`) bị rơi (G34) |

### L10-T02 Admin dịch (FR-ADM-17/18, BR-08, API_SPEC §4/§5.1/§5.2, PERMISSION §4/§6)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | `pages.hasEnglish` chỉ bật qua "Duyệt bản EN"; hook `guardEnglishApproval` giữ giá trị khi request không mang cờ duyệt | ✅ | `hooks/pages/approve-english.ts:16-20`; `Pages.ts` `beforeChange`; `fieldAccess hasEnglish update: isAdmin` (`Pages.ts:64`); `fields/translation.ts:16,19` (readOnly) |
| 2 | Retranslate: 401 → allowlist/UUID 404 → 429/503 → quyền sửa (404) → 409/503 → audit fail-closed → enqueue `force` → 202 | ✅ | `endpoints/admin/retranslate.ts:85-127`. Quyền theo `access.update` của chính collection/global (`:52-77`), rate limit `admin-retranslate` 30/giờ. Thứ tự as-built (rate limit trước ownership) đã ghi ở API_SPEC `:229`, nhưng PERMISSION §5 `:110-115` chưa ghi (G37) |
| 3 | `:collection` ngoài allowlist → 404 | ✅ | `retranslate.ts:94-95`; test `leads` → 404 (`retranslate.test.ts`) |
| 4 | Lọc 5 trạng thái dịch | ✅ | `lib/translation/admin-ui.ts:4-10`; `beforeList` cho mọi collection có `translation` (`content-defaults.ts` diff) |
| 5 | Banner `failed`/vượt hạn mức cho admin | ✅ | `TranslationFailedBanner.tsx:23-84` (`beforeDashboard`, chỉ admin, `budget_exceeded`). Banner chỉ hiện ở dashboard và gọi 13 request mỗi lần mở; đã giao `layer-13-task-01.md:93` |
| 6 | Duyệt pháp lý: 401/403/400/404/409/422 + audit `content.approve_translation` + `done` | ✅ | `endpoints/admin/approve-english.ts:22-52`; hook `approveEnglish` cùng transaction (`hooks/pages/approve-english.ts:27-54`); UI ẩn với sale (`ApproveEnglishButton.tsx:38`) |
| 7 | Pháp lý bị AI dịch lại → `hasEnglish=false` + `pending_review` + revalidate, ẩn `/en` (quyết định user) | ✅ | `jobs/translate-content-save.ts:23-25`; ARCHITECTURE `translate-content` as-built |
| — | BR-08 "bản Việt đã đổi" nhắc admin/người đăng | ✅ | `viChangedAfterManual` hiển thị readOnly trong nhóm `translation` + bộ lọc `viChanged` |
| — | PERMISSION §6: audit "Dịch lại bằng AI" + "Duyệt bản tiếng Anh" | ✅ | `retranslate.ts:108-115`; `approve-english.ts:31-38`; enum ERD `:519` |
| — | Follow-up L9-T07 MINOR-A/B/C | ✅ code / ⚠️ checkbox | A: `lockRow` `translate-content-save.ts:55-65,80`. B: vị từ `missingEnglishFields` `:31` (không còn thử rồi bắt lỗi). C: test mới `translate-content.test.ts:551`. Checkbox `layer-10-task-02.md:96-98` vẫn `[ ]` (G38) |
| — | Residual r4 | → BACKLOG / task | BL-012 (`isFilled` coi richText rỗng là đủ), BL-013 (sửa EN pháp lý sau khi duyệt, **chờ user**), MINOR-J/L/I → `layer-13-task-01.md:89-93` |

### L10-T03 Bản EN công khai (FR-PUB-18/19, BR-07, SPEC F12)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | `en.json` đủ khoá `vi.json` (kiểm trong `pnpm test`); không có em-dash/en-dash | ✅ | `src/i18n/messages-check.ts` + `.test.ts` (chạy trong 2.400 test hôm nay); `scripts/i18n-check.ts` |
| 2 | Chuyển ngôn ngữ ở trang chi tiết → trang tương ứng; chưa có bản dịch → danh sách hoặc trang chủ | ✅ | `counterpart-url.ts:20-30,84-90`; `resolve-counterpart.ts:24-51` (EN chỉ khi `hasEnglish` + có slug EN; pháp lý tra theo `kind`); route `api/locale-counterpart/route.ts:20-35` (302, `Location` do server dựng, không thể thành open redirect). S16 `:547`: pháp lý chưa duyệt → `/en` trang chủ ✅ (MAJOR-1 r1 đã đóng) |
| 3 | hreflang chỉ khi có cả hai bản | ✅ | review r2 PASS; `locale-counterpart.test.ts` integration |
| 4 | Nhãn enum dịch qua file chuỗi | ✅ | review r2 |
| — | Follow-up S01: h1 = tiêu đề slide 1 | ✅ | `HomeBlocks.tsx:32` (S01 `:284`) |
| — | Follow-up S01.1: header trong suốt đè hero | ✅ trang chủ / ⚠️ S03, S14 | `HeaderFrame.tsx` + `globals.css:172-223` + `HeroSlider.tsx:110` `data-header-hero`. design-spec §2.1 `:79` yêu cầu thêm "chi tiết dự án, dịch vụ" nhưng chưa có `data-header-hero` ở đó (G36) |
| — | Follow-up khoảng hở điều khiển hero mobile; xoá khoá i18n chết | ✅ code / ⚠️ checkbox | `HeroSlider.tsx:143` `pb-40 sm:pb-24`; `vi.json` chỉ còn `careerDetail.applyForm.fallback`, khoá này vẫn đang dùng. Checkbox `layer-10-task-03.md:99-104` vẫn `[ ]` (G38) |
| — | Doc impact ghi "no doc impact" | ⚠️ | Route công khai mới `GET /api/locale-counterpart` (302, `s-maxage=60`) chưa có trong API_SPEC/ARCHITECTURE (G37) |

### L10-T04 Phản hồi chờ (D5, design-spec §3.5/S04 `:350`)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Mọi trang danh sách: vùng kết quả mờ + `aria-busy`, link chờ có chỉ báo | ✅ | `PendingRegion.tsx` (Provider/Region/Link/FormPendingMarker); dùng ở `CategoryListTemplate.tsx:97`, áp cho `ProjectListPage.tsx:93`, `NewsListPage.tsx:57`, `PostListPage.tsx:57`, `JobListPage.tsx:118`, `RentalListNavigation.tsx:30`; `Pagination`, `ActiveFilters`, `EmptyState`, `ProjectFilters`, `JobFilters` |
| 2 | Không `loading.tsx`; `?page=` vượt vẫn 404 | ✅ | Glob `src/app/**/loading.tsx` = 0 file; test chặn đi ngược tới `app/` (`list-no-loading.test.ts`) |
| 3 | reduced-motion, không CLS, JS tối thiểu | ✅ | review r2 |
| 4 | Ghi gap Change Request cho design-spec §3.5 (không tự sửa intent) | ✅ | BL-011 (`BACKLOG.md`), cần user duyệt. `.context/design-spec.md` không có diff trong range |

### L10-T05 Xoá CV an toàn (BL-008, BR-31)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | `beforeDelete` trên `private-files` xoá S3 tường minh; lỗi → throw, dòng DB còn; dùng chung cho mọi đường xoá | ✅ | `hooks/private-files/delete-object-before-delete.ts:10-14`; `PrivateFiles.ts` hooks; `delete-private-file.ts:9-13` (ném khi `errors`); `delete-cv-and-audit.ts`; `removeOrphanCv` |
| 2 | Key dựng từ prefix thật | ✅ | `private-objects.ts:16-19` |
| 3 | Quét bucket ↔ DB, có ngưỡng thời gian, dry-run, chỉ log số lượng | ✅ | `purge-orphan-objects.ts:88-103` (`off`/`dry-run` mặc định/`delete`, ngưỡng 100 object hoặc 20%, khoá advisory); env `env.ts` `RETENTION_ORPHAN_OBJECT_SCAN`; compose staging/prod `dry-run` |
| 4 | Audit meta ghi `failedSteps`/`failedRecords` | ✅ | `run-data-retention.ts`, ERD §7 as-built |
| 5 | Sửa comment `delete-cv-and-audit.ts:8` | ✅ | diff |
| — | MINOR r2 | → task | `layer-12-task-01.md:128-131`, gồm cả việc ERD §7 thiếu dòng quét object mồ côi |

## Mốc M2: đánh giá phạm vi Must (toàn bộ L0–L10)

`progress.json` có 66 task trong `completedTasks`. Task nào thuộc layer ≤ 10 mà chưa xong chỉ có `layer-4/task-06` (stack giám sát), đã hoãn có quyết định tới trước M3 (`progress.json:488-493`).

| Nhóm M2 | Trạng thái | Còn mở |
|---|---|---|
| Website VI/EN (FR-PUB-01…19, BR-07) | ✅ đủ chức năng | G36 (header trong suốt S03/S14), BL-001 (design debt header/footer, chờ user), BL-007 (nút chia sẻ S09, trước M3) |
| Lead (FR-PUB-13, BR-10…17, FR-ADM-09/10, BR-14/15/16, BR-30/31) | ✅ end-to-end: form 4 bề mặt → endpoint → phân công → nhắc → xuất → lưu trữ | G34 (`?service=`), G35 (chi tiết form, GA4 `generate_lead`), BL-010 (UTM toàn site). E2E thật qua route + Turnstile → L11-T01 |
| Tuyển dụng (FR-PUB-09, FR-ADM-05, BR-20/21) | ✅ | BL-005 (% upload + kéo-thả, design debt) |
| Tự dịch (FR-ADM-17/18, BR-08) | ✅ | BL-012 (richText rỗng coi là đủ, BUG pending), BL-013 (**chờ user**). Chưa đo "≤ 10 phút" trên Claude API thật. Staging đang tắt dịch (`TRANSLATION_MONTHLY_BUDGET_USD=0`, `progress.json:607-609`), nên trên staging "Dịch lại" trả 409 là đúng thiết kế, và chưa kiểm được dịch thật trên staging |
| Bảo vệ dữ liệu (BL-008) | ✅ đóng | Bật `delete` cho quét mồ côi là thao tác tay sau khi xác nhận bucket (runbook deploy §3.3) |

Kết luận M2: **đủ Must về chức năng.** Không còn requirement Must nào ở mức MISSING. Gap còn lại là chi tiết intent của design-spec (G34–G36) và sổ sách/doc (G37, G38). Điều kiện trước khi duyệt M2 theo chính quyết định user: **push staging + G30**.

## Doc reconcile

- As-built đã cập nhật trong `ef39df4..HEAD`:
  - `docs/API_SPEC.md` §5.1 `:229`, §5.2 `:233`.
  - `docs/ARCHITECTURE.md`: job `data-retention` + `translate-content`, có `lockRow` và luồng duyệt pháp lý.
  - `docs/ERD.md`: §4.10 xoá hồ sơ, `private-files` `:510`, §7 audit meta.
  - `docs/runbooks/deploy.md:97`, `docs/runbooks/restore.md:171`, `.env.example`, compose staging/prod.

  Đối chiếu với code ở các dòng dẫn trên: khớp. ✅
- Còn thiếu hoặc lệch (G37):
  - (a) `GET /api/locale-counterpart` (`src/app/(payload)/api/locale-counterpart/route.ts`) không có trong API_SPEC §3 hay ARCHITECTURE. Task T03 lại ghi "no doc impact".
  - (b) Bảng §4 của API_SPEC `:191-197` chưa có dòng `POST /api/admin/translations/pages/:id/approve`. Endpoint này chỉ được mô tả ở §5.2.
  - (c) ARCHITECTURE `:185` còn ghi "phản hồi chờ khi lọc ở `/cho-thue` dùng `PendingRegion`", trong khi giờ mọi trang danh sách đều dùng.
  - (d) PERMISSION §5 chưa ghi as-built rằng `retranslate` kiểm rate limit trước ownership. Không lộ dữ liệu vì cả hai trường hợp đều trả 404.
  - (e) ERD §7 thiếu dòng về bước quét object mồ côi. Đã giao `layer-12-task-01.md:131`.
  - (f) `docs/diagrams/layer-plan.md:45` vẫn ghi L10 có 3 task, thực tế là 5.
- Intent docs (`SPECIFICATIONS.md`, `docs/BRD.md`, `docs/PRD`/`USER_FLOW` nếu có, `.context/design-spec.md`): **không có diff** trong range. Câu skeleton ở design-spec §3.5/S04 `:350` (và §3.2 `:142`) được đưa vào Change Request BL-011, không tự sửa. ✅

## Task file / progress ↔ git log

- `completedTasks` có đủ 5 task L10, thứ tự khớp commit (T01 → T04 → T05 → T03 → T02). Report path và round khớp file thật trong `.context/review-reports/`. ✅
- AC và DoD của 5 task đều `[x]`. "Feature Verification" ghi lệnh verify và kết quả, verdict reviewer và round. ✅
- G33 (layer 9) đã đóng: không còn `[ ]` ở `layer-9-*.md`; dòng BL-004 trùng trong BACKLOG đã xoá. ✅
- BACKLOG: BL-004 và BL-008 → `done`; thêm BL-010…BL-013. ✅
- Lệch (G38):
  - Checkbox follow-up đã làm nhưng vẫn `[ ]`: `layer-10-task-01.md:96-99`, `layer-10-task-02.md:96-98`, `layer-10-task-03.md:99-104`.
  - "Decision log: pending" ở T01/T02/T03. Các quyết định user trong layer chưa vào `progress.json.decisions` (cuối mảng là `:631-635`, layer 9): pháp lý bị AI dịch lại → `hasEnglish=false`; duyệt mọi bản EN pháp lý + 422; T02 được attempt 4.
  - `inProgressTask` đổi từ `null` sang `[]` (`progress.json:486`), lệch kiểu so với trước.
  - Mốc thời gian lẫn lộn: decision `2026-10-19T00:30Z` và task T04/T05 ghi "user duyệt 2026-10-19", trong khi commit và `lastUpdated` là `2026-10-18T15:10Z`. `lastUpdated` vì thế lùi về trước.

## Gaps

### [MISSING] G34 MEDIUM: `?service=<slug>` không điền sẵn lời nhắn ở form Liên hệ
- Requirement: design-spec S14 `:519` và S15 `:533` (intent). FR-PUB-10/11 (Must) không ghi chi tiết này.
- Task liên quan: L6-T07 ghi rõ "`?service=` chưa có nơi đọc (LeadForm sau)" (`layer-6-task-07.md:66`). L10-T01 không nhận việc này, không có AC, không có backlog.
- Hiện trạng: trang Dịch vụ link tới `/lien-he?service=moi-gioi` nhưng form để trống, nên sale không biết khách hỏi dịch vụ nào. Comment `lien-he/page.tsx:55` mô tả hành vi không tồn tại.
- Đề xuất: **cần user chọn**.
  - (A, đề xuất) Task nhỏ trước M2 hoặc gộp L11-T01: `LeadForm` đọc `?service=` ở client, tra tên dịch vụ, điền sẵn `message` theo locale, giữ ISR. Thêm RTL test. Sửa comment.
  - (B) BACKLOG, làm trước M3.

### [PARTIAL] G35 LOW: chi tiết lead form theo design-spec chưa làm (chưa giao task/backlog)
- S07 `:412`: tin "Đã thuê" thì nút gửi cũng đổi thành "Nhận tư vấn căn tương tự". Hiện chỉ đổi tiêu đề. Câu AC của task (`:40`) mơ hồ nên reviewer chấp nhận.
- §3.3 `:146`: biến thể **Rút gọn** cho khung tin cho thuê (không có email, lời nhắn 1 dòng). Hiện đang dùng bản Đầy đủ.
- §3.3 `:145`: đếm ký tự khi lời nhắn > 800/1000. Chưa có.
- §3.3 `:157`: panel thành công có hotline, và bắn GA4 `generate_lead` khi đã đồng ý cookie. Chưa có, Grep `generate_lead` = 0.
- Đề xuất: ghi BACKLOG (BL-014), làm cùng L14-T02 (CWV/a11y/responsive). `generate_lead` ảnh hưởng đo hiệu quả quảng cáo, nên **user chọn** làm trước M3 hay sau.

### [PARTIAL] G36 LOW: header trong suốt mới có ở trang chủ
- design-spec §2.1 `:79` yêu cầu biến thể trong suốt cho "trang chủ, chi tiết dự án, dịch vụ". Hiện chỉ `HeroSlider.tsx:110` có `data-header-hero`. Hero S03 (`:308`, 100svh) và S14 (`:516`, 70svh) chưa có.
- Cơ chế đã dùng lại được: chỉ cần thêm `data-header-hero` và kéo hero lên `-mt-16 lg:-mt-18`, cần kiểm độ tương phản.
- Đề xuất: giao `layer-14-task-02` hoặc BACKLOG. Primary tự xử lý được.

### [PARTIAL] G37 LOW: doc as-built còn thiếu
- Chi tiết là các mục (a) tới (f) ở phần Doc reconcile.
- Đề xuất: primary bổ sung (a) (b) (c) (d) (f) khi close-out layer, có dẫn chứng code (as-built, không cần user). (e) đã giao L12-T01.

### [PARTIAL] G38 LOW: sổ sách task/progress
- Chi tiết ở phần Task file / progress ↔ git log.
- Đề xuất: primary tick các checkbox follow-up đã làm (có dẫn chứng ở ma trận), ghi 3 quyết định user L10 vào `progress.json.decisions`, đưa `inProgressTask` về `null`, chuẩn hoá ngày. Cập nhật "Spec Validator verdict" của 5 task sau report này.

### Đã ghi BACKLOG / task sau (không chặn M2)
- BL-010 UTM toàn site (MODIFY, pending).
- BL-011 sửa intent design-spec §3.5: **cần user duyệt CR**.
- BL-012 `isFilled` richText rỗng (BUG, MEDIUM về BR-07): đề xuất làm trước L12/M3 vì ảnh hưởng mọi collection tự bật `hasEnglish`.
- BL-013 sửa EN pháp lý sau khi duyệt: **chờ user**.
- BL-001/005/007/009: carry-over.
- MINOR L10 đã giao: `layer-11-task-01.md:88-91`, `layer-12-task-01.md:128-131`, `layer-13-task-01.md:89-93`, `layer-13-task-03.md:103-106`.
- L4-T06 stack giám sát: hoãn tới trước M3.

## Lưu ý trước lần push staging (G30, điều kiện M2 theo quyết định 2026-10-19)

- Local đi trước `origin/staging` **34 commit** (đếm hôm nay; `origin/staging` lúc 2026-10-18 13:37 +07). Theo `layer-12-task-01.md:126`: chặn `/api/internal/` → 404 ở nginx, chạy `nginx -t`, reload, rồi `curl -I` kiểm. Việc này chạm server nên cần user xác nhận.
- Migration áp lần này: 3 migration additive của L9 (`20261018_113101_leads_reminded_at`, `20261018_130000_data_retention`, `20261018_140000_translate_content`). L10 không có migration. Không có `HIGH_RISK_MIGRATION`.
- Env mới: `RETENTION_ORPHAN_OBJECT_SCAN` (để `dry-run`; giá trị lạ làm app/jobs không boot, `layer-12-task-01.md:129`). Staging tắt dịch (budget 0), nên trên staging nút "Dịch lại" trả 409 và nút "Duyệt bản EN" vẫn dùng được.
- Route `/api/locale-counterpart` nằm dưới `/api/`. Staging không có CDN, nên mỗi lần bấm chuyển ngôn ngữ ở trang có slug là 1 truy vấn DB, chưa có rate limit (đã ghi `layer-13-task-03.md:106`).

## Residual risk của lần validate này

- Không chạy `pnpm build`, `next start`/curl, migration, S3/Docker thật. 302 của `/api/locale-counterpart`, header trong suốt, phản hồi chờ, responsive 375/768/1280 dựa trên test, report reviewer và đọc code.
- Đọc chọn lọc. Không đọc toàn văn `PendingRegion.tsx`, `use-public-form.ts`, `run-data-retention.ts`, `translate-content.ts`, `messages-check.ts`, hreflang trong `buildPageMetadata`. Các dòng ma trận tương ứng dựa trên Read/Grep có mục tiêu, 2.400 test PASS hôm nay và report STRICT round cuối.
- Mục tiêu "≤ 10 phút" (FR-ADM-17) và dịch thật qua Claude API chưa đo trên môi trường thật.
- Integration lead đi qua `handleLead` với Turnstile giả, chưa qua route thật với test key. Đã giao L11-T01.

## Cần user quyết (tại checkpoint M2)

1. **Push staging + G30** (nginx chặn `/api/internal/`): xác nhận thời điểm. Theo quyết định 2026-10-19, việc này phải xong trước khi duyệt M2.
2. **G34 `?service=`**: (A) task nhỏ trước M2 hoặc gộp L11-T01, hay (B) BACKLOG trước M3.
3. **BL-013**: BR-08 có bắt duyệt lại mọi lần sửa bản EN pháp lý sau khi đã duyệt không.
4. **BL-011**: duyệt Change Request sửa câu skeleton ở design-spec §3.5/S04 (và §3.2 `:142`) cho khớp giới hạn soft-404 đã đo.
5. **G35**: ghi BACKLOG chi tiết lead form, và có làm `generate_lead` GA4 trước M3 không.

Primary tự xử lý, không cần user: G36 (giao L14-T02 hoặc BACKLOG), G37 (bổ sung doc as-built), G38 (sổ sách).

## Tóm tắt cho user

- Layer 10 xong 5/5 task, 24/24 tiêu chí đạt, test 2.400/2.400 PASS, lint/typecheck sạch.
  - Đã có: form "Nhận tư vấn" ở 4 nơi (cho thuê, tin BĐS, dự án, liên hệ); công cụ dịch trong admin (dịch lại, lọc, cảnh báo lỗi, duyệt bản EN trang pháp lý); bản tiếng Anh hoàn chỉnh với nút chuyển ngôn ngữ về đúng trang; phản hồi chờ ở mọi trang danh sách; xoá CV an toàn khi kho file lỗi (BL-008 đóng).
- Về M2: tính năng Must (web VI/EN, lead, tuyển dụng, tự dịch) đã đủ. Còn vài chi tiết thiết kế nhỏ:
  - Bấm "Nhận tư vấn" ở trang Dịch vụ rồi sang Liên hệ, form chưa tự ghi tên dịch vụ.
  - Nút gửi của tin "Đã thuê" chưa đổi chữ.
  - Header trong suốt mới có ở trang chủ.
- Trước khi duyệt M2 cần anh cho đẩy code lên staging (đang chậm 34 commit) và cập nhật nginx (G30). Anh cũng cần quyết BL-013 (sửa bản EN pháp lý sau khi duyệt có phải duyệt lại không) và duyệt sửa câu "skeleton" trong design-spec (BL-011).
