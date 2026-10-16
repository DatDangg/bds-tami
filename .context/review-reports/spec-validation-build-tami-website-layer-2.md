Agent: spec-validator

# Spec Validation — build tami-website, layer 2 close (round 1)

- Mode: Phase review (layer close, initial build)
- Scope: `tasks/tami-website/layer-2-task-01, 03, 04, 05, 06, 07, 08, 09.md`, commit a3d7204..e073e38 (e1d193e, 337e52e, cca03c3, cc0ab4a, 7bb41b2, e7663f7, 0708acd, 1f4d2f7, e073e38).
- Loại khỏi scope: `layer-2-task-02` (provinces/wards + seed), đang BLOCKED chờ user gửi danh mục hành chính. Không tính là gap của layer này. Danh sách task bị chặn ở mục cuối.
- Sources: SPECIFICATIONS.md v1.2.2 (F8, F9, F10, NFR-01/04/06/07, § Authentication dòng 131), docs/API_SPEC.md §2-§3.5, docs/ERD.md §4.1/§4.12/§4.13/§5/§7, docs/ARCHITECTURE.md §4/§5.1/§5.3/§5.4/§6.2/§6.3, docs/PERMISSION.md §3.4/§5/§6/§7, `.context/design-spec.md`, `.context/decisions.md` (Decision 2, 3), `.context/project-config.md` § Secrets, task file + reviewer report round cuối (task-01 r2, 03 r2, 04 r3, 05 r3, 06 r2, 07 r1, 08 r2, 09 r2), code `src/**`, `migrations/*`.
- Verify (read-only, Docker dev bật, HEAD e073e38): `pnpm test` → 52 files / 524 tests PASS. Còn cảnh báo deprecation `pg` "client.query() when already executing" (đã ghi residual task-03).
- Working tree: `src/payload-types.ts` chỉ khác CRLF (`git diff` rỗng nội dung), không phải thay đổi code.

## Verdict: ✅ COMPLETE (PASS)

Mọi acceptance criteria của 8 task trong scope đều có code, test và reviewer PASS. Follow-up layer 1 liên quan layer 2 đã đóng. Không có [MISSING].

Lưu ý: còn 1 mục MEDIUM chưa có task (G1, cache ảnh `/api/media/file/*` mâu thuẫn ARCHITECTURE §5.1) và 5 mục LOW chưa có task. Không mục nào chặn đóng layer 2. Riêng G1 phải gắn vào task trước khi chạy `layer-3-task-03`.

## Coverage matrix

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | `media`: JPG/PNG/WebP/AVIF ≤10MB, PDF ≤20MB, MP4/WebM ≤15MB; 4 cỡ WebP thumb 400 / card 800 / large 1600 / og 1200×630 | ERD §4.12:439-444, FR-ADM-12 (SPEC F10:76) | ✅ | `src/lib/upload/validate-file.ts:20-28`; `src/collections/Media.ts:47-52`; `tests/integration/media-upload.test.ts` (18 test) |
| 2 | Kiểm MIME thật bằng magic bytes; sai → 415, quá cỡ → 413; chặn SVG/HTML | NFR-04 (SPEC:151) | ✅ | `validate-file.ts:59-68` (`fileTypeFromBuffer`), `:75-89` ghi đè tên UUID + MIME; trần 20MB `payload.config.ts:72` |
| 3 | Tên file ngẫu nhiên; `alt` localized bắt buộc với ảnh; `caption` localized; `uploadedBy` tự gán, bất biến | task-01 AC | ✅ | `validate-file.ts:86`; `Media.ts:7-16,55-73` (`uploadedBy` read chỉ staff) |
| 4 | Quyền `media`: khách đọc, staff upload, sale sửa file của mình, admin xoá | PERMISSION §3.1:46 | ✅ | `Media.ts:29-34` |
| 5 | `private-files`: không URL công khai, chỉ admin; CV qua endpoint kiểm quyền | NFR-04, ERD §4.12:446, PERMISSION §3.3:69 | ✅ | `src/collections/PrivateFiles.ts:15-27`; `payload.config.ts:80-85` (`generateFileURL: ""`). Endpoint tải CV deferred: `layer-6-task-10:37` |
| 6 | `staff.avatar` (follow-up layer 1, mục 3) | ERD §4.1:126 | ✅ (đóng) | migration `20261016_104218_media_uploads.ts` (`staff.avatar_id`) |
| 7 | `audit-logs` chỉ thêm, chỉ admin đọc, không ai sửa/xoá qua API | ERD §4.13:450-460, PERMISSION §3.4:76 | ✅ | `src/collections/AuditLogs.ts:20-25` |
| 8 | Danh sách action audit + `writeAuditLog` lọc khoá nhạy cảm, ghi `ipHash` | PERMISSION §6:112, ERD §4.13:455 | ✅ | `src/lib/audit/actions.ts:5-23` (thêm `staff.activate`, `staff.delete`, đã reconcile ERD:455 + PERMISSION:112); `src/lib/audit/sanitize-meta.ts`, `write-audit-log.ts` |
| 9 | Ghi audit staff.create / update_role / deactivate / reset_password / auth.login_failed | FR-ADM-11/13, PERMISSION §6 | ✅ | `src/collections/Staff.ts:123-133`; `src/hooks/staff/*`. Residual: Local API `payload.login` không ghi login_failed (chấp nhận) |
| 10 | Luôn còn ≥1 admin active, kể cả bulk và race (follow-up layer 1, mục 4) | ERD §4.1, PERMISSION §3.4:75 | ✅ (đóng) | `src/hooks/staff/last-admin-guard.ts` (advisory xact lock + `rejectBulkChangeOfActiveAdmins`); `Staff.ts:126-128`; test `audit-staff.test.ts:406-489` |
| 11 | Index `audit_logs` | ERD §5:524 | ✅ | `AuditLogs.ts:28`; ERD:524 đã ghi đúng as-built |
| 12 | Session hết hạn sau 8 giờ không hoạt động; refresh ≤1 lần/15 phút; tab ẩn không refresh; 401 → login; cookie HttpOnly/Secure(prod)/SameSite=Lax | SPEC:131, PERMISSION §7:118 | ✅ | `Staff.ts:110-112`; `src/lib/session/keepalive.ts`; `src/components/admin/SessionKeepAlive.tsx`; `payload.config.ts:33`; Decision 2 (`.context/decisions.md:27`); `tests/integration/session-refresh.test.ts` |
| 13 | Admin: logo TAMI, tiêu đề "TAMI Admin", màu nhấn #8C6733 (AA), Montserrat, chỉ tiếng Việt, giữ locale nội dung VI/EN | design-spec (admin), SPEC F12 | ✅ | `payload.config.ts:33-37,53,56-57`; `src/app/(payload)/custom.scss`; `importMap.js:1-13`. Chưa kiểm trực quan trên trình duyệt (residual reviewer) |
| 14 | `GET /api/health` 200/503 `{status, checks{db,redis,storage}}`, timeout ≤2s, `no-store`, không lộ chi tiết | API_SPEC §3.5:126-137, ARCHITECTURE §6.4 bước 3, NFR-06 | ✅ | `src/app/(payload)/api/health/route.ts`; `src/lib/health/run-health-checks.ts:1`, `probes.ts:23-33`; `tests/integration/health.test.ts`. Đường 200 đã chạy trên Docker (task-06:58) |
| 15 | `POST /api/public/click-events` → 204, zod, `type` ngoài tập → 400, 30/phút/IP, không Turnstile | FR-PUB-12 (SPEC F8:69-70), API_SPEC §3.4:113-124 | ✅ | `src/endpoints/public/click-events.ts:44-64,84-85`; `src/lib/security/rate-limit.ts:14` |
| 16 | Job gộp hằng giờ vào `click-stats-daily`, unique 4 cột, idempotent; xoá >90 ngày sau khi gộp; chỉ admin đọc | ERD §4.13:462, §7:553, ARCHITECTURE §5.4:191 | ✅ | `src/jobs/aggregate-click-stats.ts:59-122` (cron `0 0 * * * *`); `ClickStatsDaily.ts:21-23`; `ClickEvents.ts:20`; Decision 3 (`decisions.md:35`); migration `20261016_160726_click_events.ts` đã apply trên dev (task-07:67) |
| 17 | Gallery: ảnh LCP `priority`, còn lại lazy, CLS 0; lightbox ←/→/Esc, bẫy focus, trả focus | FR-PUB-03/05, NFR-01, design-spec §3.7 | ✅ | `src/components/media/Gallery.tsx:54-102`, `ResponsiveImage.tsx:21-25,87-89`, `Lightbox.tsx:57-90` |
| 18 | LazyMap: ảnh tĩnh + nút "Xem bản đồ" trước viewport, MapLibre import động, không cần API key; ẩn địa chỉ chỉ hiện vòng 300m | FR-PUB-05, design-spec:185 | ✅ | `LazyMap.tsx:58,111-123,172-208`; `map-geometry.ts` `approximateLocation`. Contract phía server deferred: `layer-7-task-03:46` |
| 19 | VideoFacade: chỉ nhúng iframe khi bấm; Save-Data không tải thumbnail | design-spec §3.8 | ✅ | `VideoFacade.tsx:29-41,70,86-88`; `video-url.ts` (whitelist host, youtube-nocookie) |
| 20 | Nút chỉ icon có `aria-label` theo locale, touch ≥44px, không cuộn ngang 375px | NFR-07 | ✅ (đọc class) | `Lightbox.tsx:23` (`size-11`), `VideoFacade.tsx:88`, `globals.css` (zoom 44px khi `pointer: coarse`); `messages/{vi,en}.json` namespace `media`. Chưa kiểm trực quan vì chưa có route nào dùng |
| 21 | Form: consent chưa tick thì không gửi + lỗi đúng ngôn ngữ; link chính sách theo locale | FR-PUB-13, BR-30 | ✅ | `use-public-form.ts:145`; `ConsentCheckbox.tsx:45-53`; `src/i18n/routing.ts:41` |
| 22 | Turnstile chỉ tải khi form vào viewport hoặc focus | BR-16 | ✅ | `TurnstileWidget.tsx:57-90` |
| 23 | `details` gắn vào đúng field + `aria-invalid`; lỗi chung `role="alert"`; thành công chuyển focus tới tiêu đề `role="status"`; không dùng placeholder thay label | NFR-07, design-spec §1.4/§3.3/§3.4 | ✅ | `submit-helpers.ts:61-74`; `use-public-form.ts:70-74,98-122`; `FormField.tsx:76-85`; `FormStatus.tsx:18-63` |
| 24 | Lỗi API trả theo `locale` (follow-up layer 1, mục 12) | API_SPEC §2:28 | ✅ (deferred) | Pipeline vẫn hard-code tiếng Việt (`public-pipeline.ts:64,67,77,80,87,89`). Có task: `layer-6-task-09:43`, `layer-9-task-02:44`, `layer-7-task-04:37`. Cả 3 task này đều bị chặn bởi layer-2-task-02 (xem cuối) |

Cross-doc conflict HIGH: không có. Có 1 conflict MEDIUM chưa có task (G1).

## Follow-up layer 1 → trạng thái sau layer 2

| Mục (report layer 1) | Trạng thái |
|---|---|
| Coverage mục 3 `staff.avatar` | Đóng: layer-2-task-01 |
| Coverage mục 4 ≥1 admin active | Đóng: layer-2-task-03 |
| Coverage mục 12 lỗi theo locale | Vẫn deferred (layer-6-task-09, layer-9-task-02). Hai task này phải đổi chữ ký pipeline dùng chung, nên ảnh hưởng cả click-events (residual layer 1 vẫn còn) |
| As-built mục 1 (ARCHITECTURE §6.3 env) | Đóng: `ARCHITECTURE.md:241-248` |
| As-built mục 2 (`project-config.md` § Secrets thiếu `APP_ENV`, `EMAIL_ALLOWLIST`, `TRUST_CF_CONNECTING_IP`, `SMTP_PORT`, `EMAIL_FROM_ADDRESS`) | **Còn mở** (`project-config.md:117`). Cần `/brainstorm secrets`, không sửa tay |
| As-built mục 3 (cách chạy worker) | Đóng: `ARCHITECTURE.md:224` |
| As-built mục 4 (cây thư mục) | Đóng phần layer 1: `ARCHITECTURE.md:97-112`. Phần layer 2 xem R1 |
| As-built mục 5 (503 + Retry-After) | Đóng: `API_SPEC.md:49,51` |

## Residual / MINOR của reviewer: phân loại

### Deferred, đã có task xử lý
| Residual | Nguồn | Task xử lý |
|---|---|---|
| Pipeline trả lỗi chỉ bằng tiếng Việt (cả 400 không có detail hiện ở `/en`) | task-09 r2 MINOR-R2-3; layer 1 mục 12 | `layer-6-task-09:43`, `layer-9-task-02:44` |
| Contract `approximateLocation` phía server khi `showExactAddress=false` | task-08 r2 n2 | `layer-7-task-03:46` (đã ghi) |
| `nosniff` + PDF `Content-Disposition: attachment` cho `/api/media/file/*` | task-01 r1 MINOR 3 | `layer-14-task-01:98` |
| CSP cho OSM tiles, YouTube/TikTok, Turnstile | task-08 | `layer-14-task-01:25,43` |
| Endpoint tải CV từ bucket private (attachment, no-store, audit) | task-01 AC | `layer-6-task-10:37` |
| SeaweedFS không publish cổng ra host (bucket private không đọc ẩn danh từ ngoài) | task-01 r1 residual | `layer-3-task-03:37`; bucket riêng staging/prod `layer-3-task-03:41` |
| Component media/form chưa route nào dùng (chưa kiểm bundling MapLibre, CSS động, trực quan 375/768/1280) | task-08 r2, task-09 r2 | Media: `layer-6-task-05`, `layer-6-task-07` (không bị chặn, nên là nơi kiểm đầu tiên), `layer-7-task-03`, `layer-8-task-04`, `layer-9-task-01`. Form: `layer-7-task-04`, `layer-10-task-01` |
| Endpoint leads/job-applications phải nhận `consent` `true`/`"true"`, lưu consentAt/consentVersion | task-09 r2 residual | `layer-9-task-02:39,42`, `layer-6-task-09:39,41` |
| Secure cookie phụ thuộc `NODE_ENV=production` ở staging/prod | task-04 r3 | Image Docker build production (`layer-3-task-03`). Không có AC tường minh, mức thấp |

### Gaps chưa có task (không chặn đóng layer 2)
- **G1 [PARTIAL] MEDIUM: ảnh `media` không được cache CDN theo thiết kế.** URL ảnh as-built là `/api/media/file/<uuid>.<ext>`: plugin s3 cho `media` không đặt `generateFileURL` (`payload.config.ts:74-79`), và `ResponsiveImage` dùng thẳng `media.url`/`sizes.*.url` (`ResponsiveImage.tsx:21-39`). ARCHITECTURE §5.1 lại yêu cầu "Ảnh: `Cache-Control: public, max-age=31536000, immutable`" (`ARCHITECTURE.md:148`) và "`/api/*` không cache (Cloudflare bypass)" (`:149`). Các task sau làm đúng như chữ: `layer-3-task-03:40` ("`/api` không cache" ở Nginx) và `layer-4-task-03:16,85` (next.config không cache `/api`). Nếu không sửa, mọi ảnh sẽ đi xuyên qua app → SeaweedFS mỗi request, rủi ro cho NFR-01 (LCP) và RAM server dùng chung. Chưa xác minh Payload có tự đặt `Cache-Control` cho route file hay không (không tìm thấy trong dist `@payloadcms/storage-s3`). Đề xuất (chọn 1, cần quyết định): (a) thêm ngoại lệ `/api/media/file/*` → cache immutable vào AC `layer-3-task-03` + `layer-4-task-03` + Cloudflare cache rule ở `layer-6-task-01`, hoặc (b) đổi cách phục vụ media (domain/route riêng). Ghi ARCHITECTURE §5.1/§5.3 cho khớp. Không tự quyết thay user/primary.
- **G2 LOW: `refCollection`/`refId` của click-events không có allow-list** (`click-events.ts:13`, task-07 r1 MINOR-1). Khách có thể tạo dòng rác trong `click-stats-daily` (bị chặn bởi 30/phút/IP). Dashboard `layer-13-task-01:36` đọc bảng này. Đề xuất ghi vào AC `layer-5-task-06` (nút nổi chốt tập giá trị) hoặc `layer-13-task-01`.
- **G3 LOW: nhận diện lỗi captcha dựa vào chữ "captcha" trong message** (`submit-helpers.ts:90-92`, task-09 r2 MINOR-R2-2). Khi `layer-6-task-09`/`layer-9-task-02` dịch message theo locale, nếu câu mới không chứa "captcha" thì client mất nhãn captcha (vẫn hiện message trung tính, không sai). Đề xuất thêm vào AC 2 task đó: hoặc giữ chữ "captcha" trong message cả hai ngôn ngữ, hoặc thêm mã máy đọc được (vd `code: "captcha_failed"`) vào API_SPEC §2.
- **G4 LOW: process có thể crash khi DB chết nếu không có handler `unhandledRejection`** (task-06 r2 residual: `getPayload` lúc DB down sinh unhandled rejection). `layer-3-task-01` (GlitchTip/Sentry, `instrumentation.ts`) là nơi hợp lý nhưng AC chưa nêu. Đề xuất thêm AC "unhandledRejection được ghi nhận, không làm chết process" vào `layer-3-task-01`.
- **G5 LOW: test integration flaky 1/3 lần** (task-04 r3 M1: `tests/integration/session-refresh.test.ts:41-44` `afterAll` không guard `staffId`; DB test dùng chung, chạy song song). Lần chạy validate này PASS 524/524. Chưa có task. Đề xuất gom vào task CI kế tiếp (vd `layer-4-task-05`) hoặc tạo task nhỏ.
- **G6 LOW: job `aggregate-click-stats` cộng dồn không nguyên tử, giả định chỉ 1 process `jobs`** (task-07 r1 MINOR-4). ARCHITECTURE §6.2:224 chưa ghi ràng buộc "1 bản `jobs`". Đề xuất ghi vào ARCHITECTURE (xem R2) hoặc AC compose `layer-3-task-03`.

### Residual chấp nhận (không cần task)
- `auth.login_failed` không ghi qua Local API `payload.login`; TOCTOU hẹp ở `rejectBulkChangeOfActiveAdmins`; `disableTransaction: true` bỏ qua advisory lock (task-03 r2). Chưa có caller.
- Tile OSM không hợp traffic lớn (task-08). SPEC/ARCHITECTURE:62 chọn OSM có chủ đích. Cần theo dõi khi vận hành.
- Thumbnail `i.ytimg.com` là request bên thứ ba trước khi bấm (task-08 m5). Ghi vào nội dung trang chính sách bảo mật (nội dung, không phải code).
- Lưới làm tròn 0,001° có thể thô hơn (task-08 n1). Spec (`design-spec.md:185`) đạt. Có thể cân nhắc ở `layer-7-task-03`.
- `pagePath` nhận `//host` (task-07 r1 MINOR-2): `click-stats-daily` không lưu `pagePath`, admin chỉ xem dạng chữ. Rủi ro thấp.
- Đa tab session chỉ kiểm bằng đọc source Payload, chưa E2E (task-04 r3).

## As-built doc cần reconcile (LOW, không chặn layer)

1. **R1: ARCHITECTURE §4 cây thư mục** (`ARCHITECTURE.md:94-107`): thiếu các thư mục layer 2 thêm: `src/lib/{audit,upload,session,health,click-stats}/`, `src/hooks/staff/`, `src/components/{admin,media,forms}/`, `src/endpoints/public/`, route `src/app/(payload)/api/health/`.
2. **R2: ARCHITECTURE §5.4 / §6.2** (`:191`, `:224`): `aggregate-click-stats` chạy đầu mỗi giờ (`0 0 * * * *`, hàng đợi `default`), và giả định chỉ 1 process `jobs` (G6).
3. **R3: ARCHITECTURE §5.1 / §5.3** (`:148-149`, `:178`): ghi URL thật của media (`/api/media/file/*`, proxy qua Payload) và cách cache, sau khi chốt G1.
4. **R4: `.context/project-config.md` § Secrets** (`:117`): còn mở từ layer 1 (mục 2). Làm qua `/brainstorm secrets`.
5. **R5: task file hygiene (close-out)**:
   - AC checkbox của task-03..09 vẫn `[ ]` dù Feature Verification ghi đạt.
   - DoD "Committed" của task-05..09 vẫn `[ ]` dù đã có commit cc0ab4a..e073e38.
   - Mục Retry ghi trạng thái cũ: task-07:58 "chờ reviewer", task-08:55 "chờ reviewer round 2", task-09:55 "chưa review lại", task-06:55 "chờ reviewer".
   - Mọi task còn "Spec Validator verdict (layer close): pending".

Các doc đã reconcile đúng trong layer 2 (không cần làm lại):
- ERD §4.12, §4.13 (action mới, click-events/aggregatedAt/unique 4 cột/""/ngày giờ VN), §5:524, §7:553
- PERMISSION §3.4:75, §6:112, §7:118
- API_SPEC §3.4:115-124, §3.5:126-137
- decisions.md Decision 2, 3

## Task layer sau bị chặn bởi layer-2-task-02

Tính theo mục "Dependencies" của từng task (bao cả bắc cầu).

**Phụ thuộc trực tiếp (4):**
- `layer-5-task-01` (projects, `:30`)
- `layer-5-task-04` (job-postings/applications, `:30`)
- `layer-6-task-01` (deploy staging sớm; AC seed tỉnh/phường `:52`, dependency `:41`)
- `layer-6-task-02` (rentals, `:31`)

**Bắc cầu (34):**
- Layer 6: `layer-6-task-04`, `05` (qua 5-01); `layer-6-task-08`, `09`, `10` (qua 5-04)
- Layer 7: `layer-7-task-01`, `02`, `03` (qua 6-02); `layer-7-task-04` (qua 6-08/6-09)
- Layer 8: `layer-8-task-01`, `02`, `03`, `04`, `05`
- Layer 9: `layer-9-task-01`, `02`, `03`, `04`, `05`, `06`, `07`
- Layer 10: `layer-10-task-01`, `02`, `03`
- Layer 11: `layer-11-task-01`
- Layer 12: `layer-12-task-01` (qua 6-01, 6-10, 8-05, 9-0x…)
- Layer 13: `layer-13-task-01`, `02`, `03`, `04` (qua 12-01)
- Layer 14–16: `layer-14-task-01`, `02`, `layer-15-task-01`, `layer-16-task-01`

**Không bị chặn, chạy được ngay (19):**
- `layer-3-task-01`, `02`, `03`
- `layer-4-task-01` … `07`
- `layer-5-task-02`, `03`, `05`, `06`, `07`, `08`
- `layer-6-task-03`, `06`, `07`

Hệ quả: hết layer 5 (trừ 5-01, 5-04) và 3 task của layer 6 thì pipeline dừng hẳn nếu chưa có data địa giới. Đáng chú ý:
- `layer-6-task-01` (deploy staging sớm) bị chặn, nên mọi việc kiểm trên staging thật cũng bị chặn.
- 2 task sửa pipeline lỗi theo locale (`layer-6-task-09`, `layer-9-task-02`) cũng bị chặn.

## Residual risk của lần validate này
- Không mở trình duyệt. UI admin và component media/form chỉ kiểm qua test RTL, đọc class và reviewer report.
- G1: chưa xác minh header cache thực tế của route `/api/media/file/*` (không chạy dev server, không đọc được dist plugin qua Glob).
- Design tokens / contrast admin dựa vào số tính tay của builder và reviewer (task-05 r3).
