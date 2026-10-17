Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 4 (round 1)

- Mode: Phase review (đóng layer, initial build). Sau layer này là ⏸ mốc **M1**.
- Scope: `tasks/tami-website/layer-4-task-01..07.md`; commit 196c8ec (T01), fcf5b30 (T02), 6d92b09 (T03), 0e4f3f7 (T04), 85128a5 (T05), 1f80813 (defer T06), 12369a2 (T07). HEAD 12369a2.
- Ngoài scope: `layer-4-task-06` (DEFERRED theo user, progress.json:206-211, decision :250-252); `layer-2-task-02` (vẫn blocked, progress.json:201-205).
- Nguồn đã đối chiếu: SPECIFICATIONS.md (NFR-01/03/05/06/09/10 `:148-157`); docs/BRD.md (FR-PUB-12 `:145`, FR-PUB-17 `:150`, FR-ADM-06/07/08 `:163-165`, FR-ADM-17 `:174`, BR-07/08 `:189-195`, BR-30 `:217`); docs/ERD.md §1 `:8-29`, §1.1 `:31-51`, §4.3 `:158-181`, §4.4 `:183-195`, §4.13 `:476`, §4.15 `:490-513`, §5 `:542`; docs/PERMISSION.md §3.2 `:50-60`, §3.4 `:78`, §4 `:80-91`; docs/API_SPEC.md §1 `:6-16`, §3 `:53-159`; docs/ARCHITECTURE.md §4 `:82-131`, §5.1 `:159-164`, §6.2 `:233-253`, §6.4 `:278-298`, §7 `:314`, §8 `:320-346`, §9.1 `:352-357`; `.context/decisions.md` Decision 4/5; `.context/progress.json`; report reviewer round cuối của 6 task; report spec-validation layer 3; code `src/**`, `seed/`, `docker/**`, `scripts/deploy/**`, `.github/workflows/deploy.yml`; task file layer 5–9, 12, 14, 15.
- Verify (Docker dev `tami-*` đang chạy, HEAD 12369a2):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **77 file / 827 test PASS** (gồm integration DB thật). Vẫn còn cảnh báo deprecation `pg` "client.query() when already executing" (đã biết từ layer 2).
  - `pnpm build`, `docker build`, `actionlint`, `shellcheck`, `deploy.test.sh`, `docker/backup/test/e2e.sh`: không chạy lại; lấy theo evidence builder + reviewer (L4-T05 r2, L4-T07 r2 reviewer tự chạy e2e).
- Working tree: sạch, chỉ có `.context/runs/build-tami-website-layer-4-validate.md` (journal của primary).

## Verdict: ✅ COMPLETE (PASS) cho 6 task đã làm, kèm follow-up phải gắn vào task trước khi chạy layer 5

27/27 AC của T01, T02, T03, T04, T05, T07 đều có code, có test hoặc evidence chạy thật, reviewer PASS mức STRICT. Không có [MISSING] so với AC đã cam kết của layer 4. Follow-up G7, G9, R7, R9 và n1/n2 của layer 3 đã đóng.

Không có conflict mức HIGH. Có **1 gap MEDIUM về phạm vi mốc M1 (G10, do T06 hoãn)** cần user xác nhận ở checkpoint M1, và 4 mục LOW/process (G11–G14) cần primary gắn vào AC task đích. Không mục nào làm sai AC của layer 4.

## Coverage matrix

### layer-4-task-01: `categories` + `developers` + seed

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | CRUD danh mục riêng từng loại, cha–con | FR-ADM-06 (BRD:163), ERD §4.3:160-168 | ✅ | `src/collections/Categories.ts:30-53` (name, scope 5 giá trị, parent, description, sortOrder); scope từ `src/hooks/categories/scope-collections.ts:3` |
| 2 | Slug unique theo (`_locale`, `scope`, `slug`) | ERD §1.1:51, §4.3:163 | ✅ | `Categories.ts:57` (`scopeField: "scope"`); `content-defaults.ts:84` thêm `scopeSlugField`; ERD §4.3:178 + §5:542 đã ghi as-built `UNIQUE (scope_slug, _locale)`; `disableDuplicate` `Categories.ts:25` |
| 3 | `parent` cùng scope, tối đa 2 cấp | ERD §4.3:165 | ✅ | `Categories.ts:27` (`validateCategoryTree`), `:39` + `lock-scope` (scope khoá sau khi tạo); test `tests/integration/categories.test.ts` |
| 4 | Không xoá danh mục có con hoặc đang có nội dung | FR-ADM-06 ghi chú, ERD §4.3:170 | ✅ (mức khung) | `src/hooks/categories/guard-delete.ts:35-44` (409, tính cả bản xoá mềm), `:47-67` (chặn cả xoá hẳn lẫn xoá mềm). Bảng scope → collection `scope-collections.ts:20-26`; collection chưa có thì bỏ qua (`guard-delete.ts:40`). Test cho từng collection đã gắn ở L5-T01:46, L5-T03:41, L5-T04:44, L6-T02:49, L7-T01:47 |
| 5 | `developers`: logo, description, website, `showAsPartner`, `hasEnglish`/`translation` | FR-ADM-07, FR-PUB-17 (BRD:150), ERD §4.4:185-195 | ✅ | `src/collections/Developers.ts:30-42`, `:44-49`; `website` chỉ http(s) `:8-16` |
| 6 | Khách/sale đọc, admin ghi | PERMISSION §3.2:55-56 | ✅ | `Categories.ts:21`, `Developers.ts:28` (`readUnlessTrashed`, `isAdmin`) |
| 7 | Seed mặc định theo ERD, idempotent | ERD §4.3:172-175 | ✅ | `seed/categories.ts:7-11` (6 + 2 + 3 = 11 mục khớp ERD), `:23-51` (bỏ qua theo scope + slug, kể cả bản xoá mềm). Builder chạy 2 lần: tạo 11 rồi bỏ qua 11 |
| 8 | (G7, layer 3) factory có `omit` + `scopeField` | spec-validation L3 G7 | ✅ đóng | `src/collections/_shared/content-defaults.ts:43-59`, `:104-118`, `:127-130` |
| 9 | (n2, layer 3) `fieldAccess` bỏ `undefined`, ném lỗi khi tên lạ | L3-T02 n2 | ✅ đóng | `content-defaults.ts:96` (lọc `undefined`), `:111-116` (ném lỗi) |
| 10 | (n1, layer 3) kiểm trùng slug không dùng `ILIKE %x%` | L3-T02 n1 | ✅ đóng | `src/fields/slug.ts` dùng `in` trên ≤ 20 ứng viên/lượt (task T01:71, reviewer r2) |

### layer-4-task-02: globals `site-settings`, `header`, `footer`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 11 | Trường đúng ERD §4.15; chữ localized; link/ảnh/SĐT dùng chung | FR-ADM-08 (BRD:165), ERD §4.15:492-511 | ✅ | `src/globals/SiteSettings.ts:60-116`; `Header.ts:20,29`; `Footer.ts`; ERD §4.15:513 ghi as-built |
| 12 | Link nút nổi lấy từ cấu hình | FR-PUB-12 (BRD:145) | ✅ (dữ liệu) | `SiteSettings.ts:65-67` (`hotline`, `zaloUrl`, `fanpageUrl`, validate http(s)). Phần hiển thị nút ở L5-T06 |
| 13 | `navItems[].link` là khoá trang hoặc URL tuyệt đối | ERD §4.15:492 | ✅ | `src/lib/content/nav-link.ts` (khoá hợp lệ ERD:513, chặn `javascript:`); unit `nav-link.test.ts` |
| 14 | `notificationEmails`, `translationGlossary`, `translationEnabled` chỉ admin đọc | PERMISSION §3.2:57, BR-08 | ✅ | `SiteSettings.ts:21-35` (field access + `afterRead` xoá khoá), `:84-115`; integration `tests/integration/globals.test.ts` (REST, Local API, `?locale=all`, `?select`, `?depth`) |
| 15 | Chỉ admin ghi; lưu → làm mới cache cả vi/en | PERMISSION §3.2:57 | ✅ (mức code) | `SiteSettings.ts:55,58`, `Header.ts:16-17`, `Footer.ts:14-15`; `src/hooks/revalidate-global.ts:13-23` (`revalidateTag(global:<slug>, {expire:0})`); `src/lib/content/get-globals.ts:15`. Chưa quan sát trên Next runtime thật (chưa có consumer), xem G14 |
| 16 | `privacyPolicyVersion` chỉ đọc | BR-30 (BRD:217) | ✅ | `SiteSettings.ts:91-96` (`update: denyAll`); hook ghi ở L5-T02 |
| 17 | Nhóm `translation` trên globals | ERD §1.1:39, BR-08 | ✅ | `SiteSettings.ts:116`, `Header.ts:33`, `Footer.ts:31`; migration `20261017_034248_globals_translation_group` (additive) |
| 18 | `homepage` | FR-ADM-08 | ⏭ theo kế hoạch | Task riêng L8-T01 (L4-T02 Notes:99) |

### layer-4-task-03: truy vấn công khai + Cache-Control

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 19 | `publicWhere` là nơi duy nhất dựng điều kiện công khai (status, chưa xoá mềm, EN → `hasEnglish`) | ERD §1:29, BR-07 | ✅ | `src/lib/content/public-queries.ts:22-27` (dùng chung `buildPublicWhere` với access); L16-T01:38 sẽ thêm `publishedAt ≤ now` đúng chỗ này |
| 20 | Local API luôn `overrideAccess: false`, `fallbackLocale: false`; EN không trả chữ Việt; thiếu EN → `null` | API_SPEC §1:12, BR-07 | ✅ | `public-queries.ts:30-39`, `:106-122`; integration `public-queries*.test.ts` |
| 21 | Phân trang kẹp giới hạn | NFR-01 | ✅ | `src/lib/content/pagination.ts`; `public-queries.ts:74` |
| 22 | Trang công khai `public, s-maxage=60, stale-while-revalidate=300`; HTML không phụ thuộc cookie | ARCH §5.1:159, NFR-03 | ✅ | `src/lib/http/cache-policy.ts:8,61-68`; `next.config.ts:12`. Đo `next start` (T03:66-80): không `Set-Cookie`, biến thể RSC `no-store` (`cache-policy.ts:45-54`), path có đuôi file TTL 60s (`:30,38`) |
| 23 | `/admin`, `/api/*` không cache, trừ `/api/media/file/*` immutable (G1) | ARCH §5.1:164, decision G1 (progress:236) | ✅ | `cache-policy.ts:17,66,76-85` (`withDefaultNoStore`); ảnh qua `Media.upload.modifyResponseHeaders`; đo 200/304 `immutable`. G1 phía app đóng |
| 24 | (MINOR-B L4-T02) gói `server-only` | L4-T02 r2 | ✅ đóng | `package.json:50` |

### layer-4-task-04: TranslationService + `translation-usage`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 25 | `@anthropic-ai/sdk`, model/key từ env, chỉ server | ARCH §7:314, NFR-09 | ✅ | `package.json:24`; `src/lib/translation/translation-service.ts:22,46`; `.env.example:43-48` |
| 26 | Chỉ nội dung công khai (allowlist, chặn lead/CV/staff...) | BR-08:195, ARCH §7 | ✅ | `src/lib/translation/allowlist.ts:8-24,34-42` (allowlist, kiểm đầu tiên) |
| 27 | richText dịch theo text node, giữ cấu trúc; output không hợp lệ → lỗi; không nhận HTML | FR-ADM-17:174 ("giữ nguyên định dạng") | ✅ | `lexical.ts:43,61`; `segments.ts:110` (`validateModelOutput`); test `lexical.test.ts`, `translation-service.test.ts` |
| 28 | Hạn mức tháng: kiểm trước, cộng dồn sau, `budget_exceeded` | BR-08, ERD §4.13:476, NFR-09 | ✅ | `budget.ts:58-67` (`>=`), `:76` (upsert `ON CONFLICT (month)`); integration `translation-usage.test.ts` (25 lần song song) |
| 29 | `translation-usage` chỉ admin đọc, không ai ghi qua API | PERMISSION §3.4:78, ERD §4.13 | ✅ | `src/collections/TranslationUsage.ts:17` |
| 30 | Thuật ngữ (TAMI HOMES, tên dự án) | BR-08:194 | ✅ | `prompt.ts:23,28` |
| 31 | `lastError` chỉ mã đã lọc; log không chứa nội dung | L4-T02 MINOR-A, ERD §1.1:49 | ✅ | `errors.ts:30` (`toLastError`), `claude-client.ts:100` |
| 32 | Dịch tự động khi xuất bản, ≤ 10 phút, retry | FR-ADM-17, BR-08 | ⏭ theo kế hoạch | Job + hook ở L9-T07 (AC :47-57). Test chỉ SDK mock theo user |

### layer-4-task-05: CD GitHub Actions

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 33 | Chỉ chạy sau CI PASS trên `staging`, không từ `main` | AGENTS Non-negotiables, ARCH §6.4:292 | ✅ | `.github/workflows/deploy.yml:15-18,31-34` |
| 34 | Migrate trước khi đổi app; health fail → rollback | ARCH §6.4:282-286 | ✅ (dry-run + test) | `scripts/deploy/deploy.sh` (thứ tự ARCH:295); `deploy.test.sh` stub rollback, exit 3 |
| 35 | Production cần duyệt tay, đúng digest staging | ARCH §6.4:284, Decision 4 | ✅ (cấu hình) | `deploy.yml:132,145-150`; `staging.history` kiểm phía server. Required reviewers phải tạo tay trên GitHub (L6-T01:48) |
| 36 | `HIGH_RISK_MIGRATION` chặn production | AGENTS Non-negotiables | ✅ | `scripts/deploy/lib/high-risk-gate.sh` + test |
| 37 | Không in secret | project-config Secrets | ✅ | token qua stdin, không xtrace (reviewer r2) |
| 38 | NFR-10: staging tách prod, CI/CD | SPEC:157 | ✅ (chưa chạy thật) | Chạy thật lần đầu ở L6-T01:58 |

### layer-4-task-07: backup

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 39 | WAL liên tục, RPO ≤ 15 phút | NFR-05 (SPEC:152) | ✅ | `docker/docker-compose.{prod,staging}.yml:161` (`archive_timeout=300`); đo thật 297 s (T07:100) |
| 40 | Full tuần, diff ngày, giữ 30 ngày | AC1, ARCH §8:335 | ✅ (vượt) | `docker/backup/pgbackrest.conf:15-20` (6 full ⇒ ≥ 35 ngày, PITR 30 ngày; Decision 5 (5)) |
| 41 | restic file hằng ngày, 30 ngày + 12 tháng | ARCH §8:336 | ✅ | `docker/backup/restic-backup.sh:68` |
| 42 | Kho ngoài server, đích qua env | NFR-05, decision progress:255 | ✅ | `*-env.example`, `.env.example:93` (`BACKUP_ENV_DIR`); đích thật chọn khi deploy |
| 43 | Heartbeat "backup thành công lần cuối" | AC4 | ✅ (phát) / ⚠️ (chưa có nơi nhận) | `docker/backup/lib.sh:37-41` (textfile metric), file `.success`, URL push tuỳ chọn. Bên nhận (node_exporter/Prometheus/Uptime Kuma) thuộc T06 đang hoãn, xem G10 |
| 44 | Runbook khôi phục, RTO ≤ 4 giờ | NFR-05 | ✅ (local) | `docs/runbooks/restore.md`; số liệu đo local. RTO thật đo ở L15-T01:46 (diễn tập đầu) |
| 45 | Trần WAL bảo vệ ổ server dùng chung | review L4-T07 r1 MAJOR-1 | ✅ | compose `BACKUP_ARCHIVE_PUSH_QUEUE_MAX` 4GiB/8GiB; e2e "kho không với tới" |

### layer-4-task-06: stack giám sát (DEFERRED)

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 46 | Uptime Kuma, Prometheus, Grafana, Loki, cảnh báo | NFR-06 (SPEC:153), ARCH §8:323-329 | ⏸ DEFERRED (user duyệt) | progress.json:206-211, :250-252; T06:3. Phải xong trước M3: T06 mở khoá L12-T01 (T06:34). 4 AC code đã chuyển sang L5-T05:38-41; AC "dropped WAL" đã thêm T06:37 |

**Cross-doc conflict:** không có mức HIGH. 1 conflict LOW (ARCH §6.2:238 vs §9.1:356, xem phần doc).

## Follow-up từ report layer 3: trạng thái

| Mục | Trạng thái | Evidence |
|---|---|---|
| G1 (cache ảnh) | **Đóng phần app.** Còn rule Cloudflare | `cache-policy.ts:17`; L6-T01:52 |
| G2 (`refCollection` allow-list) | Mở, **vẫn chỉ ở Notes** | L5-T06:94 (không phải AC), xem G14 |
| G3 (lỗi captcha bằng chữ) | Mở, đã gắn task (bị chặn bởi L2-T02) | L6-T09:92, L9-T02:97 (Notes) |
| G4, G5, G6 | Đóng (layer 3) | |
| G7 (factory `omit`/`scopeField`) | **Đóng** | dòng 8 ma trận; áp dụng ở L5-T02:38 |
| G8 (follow-up vào AC) | **Phần lớn đóng**, còn 3 mục chưa gắn | Đã gắn: n2/n1 (đóng ở T01), MINOR-1/2/3 L3-T01 + source map + Prometheus → L5-T05:38-41; MINOR-8 → L5-T08:38; AOP/2 IP/nginx -v → L6-T01:51. **Chưa gắn:** quan sát revalidate trên Next thật (đề xuất L6-T06), 5 header lặp `tami-staging.conf` (đề xuất L14-T01), n3 (tuỳ chọn). Xem G14 |
| G9 (ISR theo process) | **Đóng** | ARCH §9.1:356-357 (user chốt, commit 83caaa4) |
| R4 (`project-config.md` § Secrets) | **Vẫn mở, dài thêm** | `project-config.md:117` vẫn thiếu các biến đã nêu ở layer 3, nay thêm `BACKUP_ENV_DIR`, `BACKUP_ARCHIVE_PUSH_QUEUE_MAX`, `POSTGRES_USER/PASSWORD/DB` (`.env.example:78-93`) và secret GitHub `DEPLOY_*` (runbook deploy). Cần `/brainstorm secrets` |
| R6 (cây thư mục ARCH §4) | Một phần, **mở lại cho layer 4** | Xem mục doc |
| R7 (API_SPEC metrics/monitoring-config) | **Đóng** | API_SPEC §3.6:139-147, §3.7:149-159 |
| R8 (vệ sinh task layer 3) | Gần đóng | Còn `layer-3-task-03.md:63` "chờ Reviewer STRICT" |
| R9 (lệnh `jobs`) | **Đóng** | ARCH §6.2:239, §4:126 |

## Gaps và đề xuất task đích

### [PARTIAL] G10 MEDIUM: T06 hoãn làm mốc M1 thiếu phần "giám sát", và heartbeat backup chưa có nơi nhận
- M1 mô tả "Nền xong (... CD/giám sát/backup dạng file)" (progress.json:265). Thực tế: CD ✅ dạng file, backup ✅ dạng file (test e2e local), **giám sát chỉ có phần phía app** (GlitchTip SDK, `/api/metrics`, log JSON từ L3-T01). Stack Prometheus/Grafana/Loki/Uptime Kuma và cảnh báo chưa có file nào (`docker/monitoring/` chưa tồn tại).
- Hệ quả:
  - NFR-06 (uptime ≥ 99,5%) chưa có cơ chế đo. Chấp nhận được trước M3 vì chưa có production.
  - Heartbeat backup (`lib.sh:37-41`, Decision 5 (6)) không có nơi nhận. textfile metric cần node_exporter/Prometheus, URL push cần Uptime Kuma. L6-T01:47 yêu cầu "đặt `HEARTBEAT_URL_WAL`" nhưng chưa có đích. Nghĩa là từ khi staging chạy backup (L6) tới khi xong T06 (trước L12), **backup hỏng hay WAL bị bỏ sẽ không ai biết**. Rủi ro dữ liệu thấp (staging), nhưng runbook/Decision 5 coi heartbeat `wal` là cảnh báo sớm duy nhất.
- Ràng buộc đã đúng: T06 mở khoá L12-T01 (T06:34), nên không thể qua M3 khi thiếu T06.
- **Đề xuất (user quyết ở M1, không tự chọn):** (a) chấp nhận M1 với phạm vi "giám sát phía app", ghi rõ vào milestone note; và (b) chọn một trong hai: bật riêng Uptime Kuma (phần nhỏ của T06) cùng L6-T01 để có đích cho `HEARTBEAT_URL_*`, hoặc ghi rõ ở L6-T01 rằng staging chạy không có cảnh báo backup cho tới T06. Nếu chọn dịch vụ heartbeat bên ngoài thì phải hỏi user vì NFR-09 chỉ liệt kê một số dịch vụ miễn phí được dùng.

### [PARTIAL] G11 LOW-MEDIUM: AC "Prometheus scrape được app" ở L5-T05 không kiểm được khi chưa có Prometheus
- L5-T05:41 (chuyển từ T06) là cấu hình mạng của Prometheus (network chung hoặc host-gateway). Không có stack giám sát thì builder/reviewer L5-T05 không có gì để chứng minh AC này. L5-T05 còn là task UI (header/menu/footer), không liên quan.
- **Đề xuất:** trả AC này về `layer-4-task-06` (đúng chỗ dựng Prometheus). Giữ ở L5-T05 3 AC phía code (lookbehind, logger, source map). Primary sửa task file, không cần user.

### [PARTIAL] G12 LOW: allowlist kiểu "chặn mặc định" ở layer 4 cần collection sau tự thêm vào, nhưng chưa có trong AC task đích
- `public-queries.ts:11` `PublicCollectionSlug` chỉ cho `categories | developers`. Các task L5-T01 (projects), L5-T02 (services, pages), L5-T03 (news), L5-T04 (job-postings), L6-T02 (rentals), L7-T01 (property-posts) phải thêm slug vào đây. Nếu không, trang công khai không gọi được `findPublicList` (lỗi typecheck, nên không lỗi im lặng). Grep task layer 5–7 không thấy nhắc tới.
- `allowlist.ts:24` `TRANSLATABLE_GLOBALS` chưa có `homepage`. ERD §1.1:39 và FR-ADM-17:174 yêu cầu dịch cả trang chủ. L9-T07 phụ thuộc L8-T01 nhưng AC chưa nhắc. Thiếu thì job dịch trả `not_allowed` cho trang chủ.
- **Đề xuất:** thêm 1 dòng AC vào từng task collection ("thêm slug vào `PublicCollectionSlug`; `rentals` dùng `PUBLIC_STATUSES.rentals`") và vào L8-T01 hoặc L9-T07 ("thêm `homepage` vào `TRANSLATABLE_GLOBALS`, có test").

### [PARTIAL] G13 LOW: đổi `categories`/`developers` không làm mới cache trang
- Cả hai dùng `route: null` (`Categories.ts:59`, `Developers.ts:47`), nên `content-defaults.ts:131-134` bỏ hook revalidate. Đổi tên danh mục hoặc bật `showAsPartner` sẽ không làm mới trang danh sách, bộ lọc hay khối đối tác. Các trang này chỉ cập nhật khi hết ISR/`s-maxage` của chính trang. Nếu trang đặt `revalidate` dài thì sẽ chậm hơn mục tiêu "≤ 1 phút" (ARCH §5.1:159).
- **Đề xuất:** thêm AC cho task trang danh mục (L6-T04/L6-T05/L6-T06 tuỳ trang đầu tiên render danh mục) và L13-T04 (khối đối tác): lưu category/developer phải làm mới đúng path/tag liên quan, hoặc ghi rõ trang đó dùng TTL ≤ 60 s.

### [PARTIAL] G14 LOW (quy trình): residual chưa gắn vào task hoặc backlog
| Residual | Nguồn | Đề xuất task đích |
|---|---|---|
| E2E revalidate: lưu header/footer làm trang `/`, `/en` đổi (chưa có consumer `get-globals`) | L4-T02 r2 residual:81 | AC `layer-5-task-05` (consumer đầu tiên của globals) |
| Quan sát revalidate nội dung trên cache Next thật | L3-T02 r2 (G8 layer 3) | AC `layer-6-task-06` (như đề xuất layer 3, chưa gắn) |
| Fallback khi trường EN của global còn trống (vd `siteName` en) | L4-T02 r2 residual:82 | Đã có một phần ở L5-T05:45 (menu cố định `en.json`); bổ sung `siteName`/`address`/`copyright` EN trống vào cùng AC |
| 5 header bảo mật lặp ở `tami-staging.conf` | L3-T03 r2 (G8 layer 3) | AC `layer-14-task-01` |
| G2 `refCollection` allow-list | spec-validation L2 | Đổi từ Notes thành AC ở `layer-5-task-06` |
| Bảng giá `budget.ts` phải đối chiếu trước khi đặt hạn mức production | L4-T04 r2 residual:78 | AC `layer-15-task-01` (go-live) hoặc `layer-6-task-01` khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` staging |
| Base Debian 11 EOL của image postgres/backup | L4-T07 r2 residual:68, Decision 5 | Ghi vào `spec/changes/BACKLOG.md` (task riêng, có diễn tập) |
| Đo NFR-01 (CWV p75, API lọc p95 ≤ 500 ms) | NFR-01 | Không thuộc layer 4. Chỉ nhắc: L14-T02 (CWV) phải có số đo |

Residual chấp nhận (không cần task): L4-T01 MINOR-4 (lỗi race báo trên `scopeSlug`), L4-T05 MINOR-3 (release chờ khoá bị prune, fail an toàn), L4-T03 MINOR-B (file `public/` `max-age=0`), L4-T03 draft/live preview (dự án tắt drafts, ERD §1:19; chỉ cần AC khi có change request bật preview).

## As-built doc cần reconcile (LOW, không chặn)
- **R10: ARCH §4 cây thư mục** (`ARCHITECTURE.md:86-131`) thiếu phần layer 4 thêm: `src/lib/http/cache-policy.ts` (`:106` chỉ ghi `ok()/fail()`), `src/lib/content/` (`:113` chỉ ghi `content-paths`, thiếu `public-queries`, `pagination`, `get-globals`, `read-global`, `global-cache`, `nav-link`), `src/hooks/categories/`, `scripts/deploy/` (+ `lib/`), `.github/actions/ssh-deploy/`, `docker/backup/` (+ `test/`), `docs/runbooks/`.
- **R11: ARCH §6.2:238** ghi `app` prod "1 bản (có thể chạy 2)", mâu thuẫn §9.1:356 "đúng 1 bản `app`" (G9 user chốt). Đề xuất sửa §6.2 thành "1 bản (bản thứ 2 cần điều kiện §9.1)". Conflict LOW.
- **R12: API_SPEC.md:3** vẫn ghi "thiết kế ban đầu, chưa có code". Bảng tóm tắt §3:55-61 chưa có dòng `/api/monitoring-config`, `/api/metrics` (đã có §3.6/§3.7). Layer 4 không thêm endpoint tuỳ biến nào. REST tự sinh của `categories`, `developers`, globals, `translation-usage` theo đúng §1:13, nên **không thiếu endpoint** cho layer 4.
- **ERD:** §4.3, §4.4, §4.13, §4.15, §5 đã reconcile as-built. Có một điểm cần làm rõ (⚠️ LOW, intent): ERD §1.1:38 nói `hasEnglish` cần thêm "mô tả ngắn" và "nội dung chính", còn `categories`/`developers` truyền `englishRequiredFields: ["name","slug"]` (`Categories.ts:58`, `Developers.ts:46`), vì `description` không bắt buộc ở bản `vi`. Cách làm hợp lý. Đề xuất ghi một dòng as-built ở ERD §4.3/§4.4, không đổi intent.
- **Runbooks:** `docs/runbooks/deploy.md`, `restore.md` đã có. `docs/runbooks/monitoring.md` thuộc T06 (hoãn).
- **Vệ sinh task file layer 4 (R13):** `layer-4-task-01.md:68` "chờ Reviewer STRICT", `layer-4-task-03.md:62` "chờ Reviewer STRICT", `layer-4-task-07.md:57` "reviewer chưa chạy" (reviewer đều đã PASS). Cả 6 task còn "Spec Validator verdict (layer close): pending" (`T01:84`, `T02:72`, `T03:85`, `T04:79`, `T05:81`, `T07:65`). Primary cập nhật khi close-out layer.

## Đánh giá T06 deferred với mốc M1
- **Không làm sai AC của layer 4.** Quyết định có ghi (progress.json:250-252, T06:3), 4 AC code đã chuyển và kiểm thật ở L5-T05:38-41, AC dropped-WAL đã gắn T06:37, phụ thuộc T06 → L12-T01 giữ được cổng trước M3.
- **Làm phạm vi M1 hẹp hơn mô tả:** "giám sát dạng file" mới có phía app. User cần biết điều này khi duyệt M1 (G10).
- **Rủi ro trong giai đoạn L6–L11:** staging chạy mà không có cảnh báo web chết hay backup hỏng. Nên chốt ở M1 có bật Uptime Kuma sớm cùng L6-T01 hay không (G10 (b)).
- L5-T05:41 (Prometheus) nên trả về T06 (G11).

## Residual risk của lần validate này
- Không chạy lại `pnpm build`, `docker build`, `actionlint`, `shellcheck`, `deploy.test.sh`, e2e backup. Các mục này dựa vào evidence của builder và reviewer (reviewer L4-T07 r2 tự chạy e2e, reviewer L4-T05 r2 tự chạy actionlint/shellcheck).
- CD, backup, Cloudflare đều **chưa chạy trên server thật**. Kiểm lần đầu ở L6-T01 (đã có AC cho từng bước).
- TranslationService chưa gọi API Anthropic thật (user chốt chỉ dùng SDK mock). Shape `output_config` chỉ được đối chiếu với SDK 0.135.0.
- Không đọc toàn văn `slug.ts`, `nav-link.ts`, `deploy.sh`, `lib/*.sh`, `pg-backup.sh`. Các dòng ma trận liên quan dựa vào đoạn code đã đọc, test PASS và reviewer STRICT.

## Tóm tắt cho user ở mốc M1

**Nền đã có gì (layer 0–4):**
- Khung web Next.js + Payload, đăng nhập admin, phân quyền admin/sale, song ngữ VI/EN, bộ giao diện nền, upload ảnh/CV, bộ trường dùng chung cho mọi bài (slug, SEO, trạng thái, xoá mềm, lịch sử).
- **Danh mục** cho 5 loại nội dung (tối đa 2 cấp, không xoá được khi còn dùng) có sẵn 11 danh mục mặc định, và **chủ đầu tư** (logo, cờ hiện ở khối đối tác).
- **Cấu hình chung, menu, footer** có bản tiếng Anh. Email nhận thông báo và bảng thuật ngữ dịch chỉ admin thấy.
- **Lớp đọc dữ liệu cho website**: chỉ trả nội dung đã xuất bản, `/en` không bao giờ hiện chữ tiếng Việt. Chính sách cache: trang mới lên web trong khoảng 1 phút, ảnh cache 1 năm, admin/API không cache.
- **Bộ dịch AI** (Claude), mới ở mức "dịch vụ": chỉ dịch nội dung công khai, giữ định dạng bài, có trần chi phí theo tháng. Phần tự dịch khi bấm xuất bản làm ở layer 9.
- **Quy trình deploy tự động** (dạng file, chưa chạy thật): đẩy lên nhánh `staging` thì tự lên staging, production phải có người bấm duyệt, lỗi thì tự quay về bản cũ.
- **Sao lưu** (dạng file, đã thử thật trên máy dev): database lưu liên tục (mất tối đa khoảng 5 phút dữ liệu), file ảnh lưu hằng ngày, có hướng dẫn khôi phục từng bước.
- Kiểm tra lại hôm nay: lint, typecheck và 827/827 test đều đạt.

**Còn hoãn hoặc chờ:**
- **Bộ giám sát** (Uptime Kuma, Grafana, cảnh báo) đang hoãn theo quyết định của anh. Bắt buộc làm trước mốc M3. Hiện mới có phần giám sát trong app (ghi lỗi, log, số đo).
- Danh mục tỉnh/phường (layer-2-task-02) vẫn chờ anh gửi dữ liệu chính thức. Việc này chặn trang Cho thuê và deploy staging (L6).
- CD, backup, Cloudflare chưa chạy trên server thật. Lần đầu sẽ ở bước deploy staging (L6), và mỗi bước chạm server đều hỏi anh trước.

**Anh cần làm / quyết định:**
1. **Duyệt M1** với phạm vi giám sát mới ở "phía app" (stack giám sát hoãn tới trước M3).
2. **Chọn cách báo động cho backup trên staging** trong giai đoạn chưa có bộ giám sát: (a) bật riêng Uptime Kuma sớm cùng lúc deploy staging, hoặc (b) chấp nhận staging chưa có cảnh báo tới trước M3.
3. Gửi dữ liệu tỉnh/phường khi có (mở khoá layer-2-task-02).
4. Khi tới deploy staging: chốt **nơi để backup** (server khác của công ty hay Backblaze B2...), tạo GitHub Environment `production` có người duyệt, và đặt nhánh mặc định của repo là `staging`.
5. Chạy `/brainstorm secrets` để cập nhật danh sách biến môi trường trong cấu hình dự án (đang thiếu khoảng 20 biến).
