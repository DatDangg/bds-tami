Agent: spec-validator

# Spec validation — build/tami-website — layer 9 (đóng layer)

- Mode: Phase review (đóng layer, initial build, AGENTS.md bước 5g). Checkpoint layer 9: "không dừng hỏi user sau layer này" (`layer-9-task-0N.md:6`). Mốc M2 nằm sau layer 10 (`docs/diagrams/layer-plan.md:26,45`; `progress.json` approvalMilestones M2 `pending`).
- Phạm vi: 8 task L9-T01…T08, commit `7d1907f` (T03), `db74dee` (T02), `d6f08ab` (T08), `c30fa45` (T01), `c0f20ce` (T04), `9c39c00` + `ec14db0` (T06), `a183c53` (T05), `5655e0d` (T07, HEAD). Tất cả có trong `progress.json` `completedTasks` (STRICT PASS, report round cuối ở `:395-448`).
- Nguồn: `SPECIFICATIONS.md` (`:72,81,164-167`), `docs/BRD.md` (`:134,150,174,186-219,246`), `.context/design-spec.md` S01 (`:215-284`), `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/ARCHITECTURE.md`, `docs/diagrams/layer-plan.md`, `spec/changes/BACKLOG.md`, report layer 8, report review L9 round cuối, task file L9/L10/L13/L16.

## Verify (chạy hôm nay, HEAD 5655e0d, checkout chính)

| Lệnh (`project-config.md`) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, 0 cảnh báo) |
| `pnpm test` | PASS: 214 file, 2.284 test, 0 lỗi (kể cả `contrast.test.ts`; lỗi CRLF BL-004 chỉ xuất hiện ở worktree) |
| `pnpm build` | Không chạy (dựa evidence builder/reviewer: T05 build lỗi do môi trường tải Google Font ở worktree; các task sau PASS) |
| migration / deploy / ssh | Không chạy (ngoài quyền) |

## Verdict: ⚠️ GAPS FOUND

Đạt 46/47 AC (T03 4, T02 6, T08 6, T01 6, T04 3, T06 5, T05 5, T07 12). AC còn lại là D5 ở L9-T08, chỉ đạt một phần và chờ user quyết. Không có conflict HIGH, không có requirement Must bị bỏ sót. Follow-up layer 8 giao cho layer 9 đã đóng hết (G31, G32, follow-up L8-T01/T02). Doc as-built khớp code và intent docs không bị sửa.

Còn mở:
- **D5** (MEDIUM): user phải chọn phương án.
- **BL-008** (MEDIUM, PII): đang pending, chưa xếp lịch.
- **G33** (LOW): một số follow-up chưa giao cho task nào, một số task file chưa cập nhật. Primary tự sửa được.
- **G30**: phải làm trước lần push staging kế tiếp. Local đang đi trước `origin/staging` **26 commit**.

## Ma trận coverage

### L9-T03 Phân công lead (FR-ADM-09, BR-12/13, design doc D6)

| # | AC | Nguồn | Status | Evidence / note |
|---|---|---|---|---|
| 1 | Endpoint 401→403→404→400 sale `active` → chỉ ghi `assignedTo` | task `:38`, API_SPEC §4 `:194` | ✅ | PERMISSION §3.3 as-built (thứ tự thật 401→403→400→404, đã ghi); review r2 PASS |
| 2 | Một hook duy nhất: activity `assignment`, `assignedAt`, email, audit `lead.assign` (trừ tự giao) | task `:39` | ✅ | API_SPEC `:194`; ERD §4.11; test integration `lead-assign` |
| 3 | Form admin cho kết quả như endpoint, không sinh trùng | `:40` | ✅ | review r2. MAJOR-1 r1 (gán cho sale khoá) đã sửa: validate `assignedTo` dùng `isAssignableSale` |
| 4 | Sale không đổi được `assignedTo` | `:41` | ✅ | PERMISSION `leads.assignedTo` as-built |

### L9-T02 `POST /api/public/leads` (FR-PUB-13, BR-10/12/13/15/16/17/30)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Thứ tự rate limit 5/10'/IP → Turnstile → zod → nguồn công khai (`rented` vẫn nhận) | ✅ | API_SPEC `:88` as-built; ARCHITECTURE §5.2 as-built |
| 2 | Chống trùng 7 ngày → `mergedCount`, activity `merged`, `lastActivityAt` | ✅ | API_SPEC `:88` (khoá advisory theo SĐT + nguồn + bản ghi) |
| 3 | Tự giao chỉ `rental`/`property_post` khi author là sale active (BR-12, quy tắc biên SPEC `:165`) | ✅ | `isAssignableSale(author)`, task `:108` |
| 4 | Lưu consent/locale/utm/pageUrl/referrer/ipHash/UA (BR-30, BR-17) | ✅ | API_SPEC `:88` |
| 5 | Email lead mới tới `notificationEmails`, tiếng Việt, ghi ngôn ngữ khách | ✅ | template `new-lead`; gộp thì không gửi email |
| 6 | Response giống nhau giữa tạo mới và gộp; lỗi theo locale | ✅ | G3 (layer 2): message luôn có chữ "captcha" ở vi/en (API_SPEC `:88`). Residual: có thể đoán qua độ trễ (task `:69`), đã chuyển sang L10-T01 `:96` |
| — | Follow-up L8-T02 (`asSystemActivity` dạng bộ đếm, lead không phải UUID → 400) | ✅ | task `:102-108` `[x]`; MINOR còn lại → `layer-10-task-01.md:95-99` |

### L9-T08 Danh mục Cho thuê (BRD `:89,108`, S05, G31, D5)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Route `/cho-thue/danh-muc/[category]` ↔ `/en/for-rent/category/[category]`, gồm danh mục con, 404 có nội dung | ✅ | `src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx` (+ test), `src/i18n/routing.ts:16` |
| 2 | Chip S04 và link chi tiết trỏ trang danh mục; `?category=` canonical về trang danh mục | ✅ | Chọn canonical, không dùng 301 (đã ghi quyết định ở task `:75`) |
| 3 | Sitemap nhóm danh mục cho thuê | ✅ | `src/lib/seo/sitemap-data.ts:47-51` |
| 4 | Metadata/BreadcrumbList, `seo.noindex` | ✅ | `rental-list-metadata.ts` (m1 r1) |
| 5 | **D5 skeleton `loading.tsx`** | ⚠️ [PARTIAL] | Bỏ vì gây soft-404 (đo 9/9 route, task `:110-124`). Có test chặn `list-no-loading.test.ts`. Chỉ `/cho-thue` có `PendingRegion`. ARCHITECTURE `:185` ghi đúng as-built. **Chờ user** |
| 6 | Hook revalidate danh mục làm mới path mới | ✅ | Đã có sẵn từ L8, không sửa |

### L9-T01 Trang chủ (FR-PUB-01, NFR-01/07, S01)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Hero LCP `priority`, video ≥1024/không reduced-motion/không Save-Data, carousel a11y | ✅ | review r2 PASS (4 MAJOR r1 đã đóng); `HeroSlider.test.tsx:49` |
| 2 | Dự án nổi bật ≤6 chọn tay/`isFeatured`; ưu đãi còn hạn | ✅ | `home-queries.ts`, `buildHomeView` |
| 3 | Dịch vụ bento 7/5 | ✅ | `ServicesBento.tsx` |
| 4 | CTA "Nhận tư vấn" | ✅ | `home/CtaBanner.tsx` |
| 5 | `/en` ẩn khối thiếu chữ EN (SPEC `:167`, BR-07) | ✅ | Quy tắc "bật + có title ở locale", test integration EN |
| 6 | JSON-LD Organization; eyebrow ≤ 1/3 | ✅ | `HomePage.test.tsx:13` |
| — | Lệch S01: `h1` sr-only = tên site (S01 `:284`: h1 = title slide 1) | ⚠️ [→] | `HomeBlocks.tsx:32`. Đã chuyển `layer-10-task-03.md:99` |
| — | Lệch S01.1: header trong suốt đè hero (`design-spec.md:233`) | ⚠️ [→] | Chưa làm. Đã chuyển `layer-10-task-03.md:101` |
| — | Khối Đối tác (FR-PUB-17 Should, S01.6) | [→] | `layer-13-task-04.md` (M4), đúng phân loại Should |
| — | Follow-up L8-T01 (guard-delete `req.locale`, test xoá media, race CTA) | ✅ | `src/hooks/media/guard-delete.ts:14` dùng `req.payload.db.findGlobal`; task `:98-100` `[x]` |
| — | G32a: `findRelatedPosts` bù bài đã kết thúc cho đủ 3 thẻ (S09 `:455`) | ✅ | `src/lib/posts/post-queries.ts:130-138` |

### L9-T04 Nhắc lead chưa giao (BR-14, SPEC `:164`)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Tính 30 phút theo giờ hành chính; lead ngoài giờ tính từ đầu giờ làm kế | ✅ | `business-hours.ts`; `remind-unassigned-leads.ts:81`; cron UTC `:160` khớp 08:00–17:30 VN |
| 2 | Mỗi lead chỉ nhắc 1 lần | ✅ | `remindedAt` ghi cùng transaction với email (`:100-114`); khoá advisory chống chạy chồng (`:39-41`), tức MINOR-1 đã đóng ở T06 |
| 3 | Một email gộp, không có SĐT/email khách | ✅ | `:117-133` (chỉ mã lead + link) |
| — | Migration `20261018_113101_leads_reminded_at` thêm cột (additive) | ✅ | ERD §4.11 + ARCH §5.4 đã cập nhật. Task file DoD `:79` vẫn để `[ ]` (G33) |

### L9-T06 Data-retention (BR-31, LGL-03, ERD §7, quyết định user Q1–Q5 `progress.json:592-594`)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Lead quá 24 tháng không tương tác: ẩn danh, giữ số liệu (Q2, Q4) | ✅ | `src/lib/retention/anonymize-leads.ts:57-93`: xoá thêm ipHash/UA/pageUrl, referrer chỉ còn origin, activity note/call, gồm cả lead xoá mềm |
| 2 | Hồ sơ quá 12 tháng: ẩn danh + xoá CV (S3 + `private-files`) (Q3) | ✅ | `purge-applications.ts:21-46`: `cv=null` trước, xoá S3 tường minh, xử lý theo id, dùng giá trị thay thế (G23) |
| 3 | Audit quá 24 tháng; `click-events` | ✅ | `purge-logs.ts`; click-events do `aggregate-click-stats` xoá (ERD §7) |
| 4 | Theo lô, idempotent, `dryRun`, log chỉ số lượng | ✅ | `run-data-retention.ts:25-52`; registry khoá advisory 726001-726004 |
| 5 | Không đụng nội dung | ✅ | `run-data-retention.ts:17` |
| — | Q1 `private-files` chỉ chứa CV, khoá upload | ✅ | ERD/ARCH/PERMISSION đã sửa (diff `b527146..HEAD`) |
| — | Q5 migration `down` không xoá audit | ✅ | ERD §7 as-built |
| — | Follow-up cũ L1-T07/L5-T04/G23/L6-T09/L9-T04 MINOR-1 | ✅ code / ⚠️ task file | Code đã làm (dẫn chứng ở trên, `purge-orphan-cvs.ts`). Checkbox trong `layer-9-task-06.md:97-108` vẫn `[ ]` (G33) |
| — | Xoá CV ở đường khác (admin xoá hồ sơ, `removeOrphanCv`) để lại object PII mồ côi khi S3 lỗi | ⚠️ BL-008 | `spec/changes/BACKLOG.md:18`, pending, chưa có lịch |

### L9-T05 Xuất lead Excel (FR-ADM-10, PERMISSION §5/§6)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1 | Chỉ admin (401/403), 10 lần/giờ/user | ✅ | API_SPEC `:201` as-built |
| 2 | Lọc theo trạng thái/nguồn/sale/ngày; stream; `no-store` | ✅ | khớp 1-1 với danh sách admin (MAJOR r1/r2 đã đóng ở r3) |
| 3 | Escape `= + - @` | ✅ | `quotePrefix` (cả tab/CR/LF) |
| 4 | Audit `lead.export` có bộ lọc + số dòng, không PII, fail-closed | ✅ | API_SPEC `:201` |
| 5 | Không xuất PII của lead đã ẩn danh | ✅ | integration `leads-export` |
| — | MINOR-1/2/(3) r3 | ⚠️ treo | `layer-9-task-05.md:92-95` `[ ]`, chưa giao task nào (G33). DoD `:76-78,81` còn `[ ]` |

### L9-T07 Tự dịch (BR-07, BR-08, FR-ADM-17)

| # | AC | Status | Evidence / note |
|---|---|---|---|
| 1-3 | Duplicate reset `translation`; chỉ retry lỗi tạm thời; `validateModelOutput` | ✅ | review r1/r2 |
| 4 | Lưu bản vi published/global → 1 job (debounce ~1') | ✅ | `src/hooks/translation/enqueue-translation.ts:60-71,95-105` |
| 5-6 | `sourceHash` theo trường; `manual` → `viChangedAfterManual`; sửa tay EN → manual | ✅ | `translate-content.ts:86`, `detect-manual-en.ts` |
| 7 | Dịch xong: en + slug + `hasEnglish` + revalidate `/en` | ✅ | `translate-content-save.ts:18-25` |
| 8 | `pages` → `pending_review`, không bật `hasEnglish` (BR-08) | ✅ | `translate-content.ts:102` |
| 9 | Retry 3 lần, `failed`, vượt hạn mức → email admin | ✅ | `translate-content-failure.ts:52` |
| 10 | `translationEnabled=false` → không enqueue | ✅ | `enqueue-translation.ts:23-28,103` |
| 11 | ≤ 10 phút | ✅ (dev) | `tests/integration/translate-content.test.ts:269` (SDK giả). Chưa đo trên staging (độ trễ = debounce 1' + chu kỳ worker `jobs`) |
| 12 | Allowlist: chỉ field công khai; lead/CV không bao giờ vào job | ✅ | `allowlist.ts:8-24`. Phạm vi gồm trang chủ, menu, footer, danh mục (FR-ADM-17 `:174`) |
| — | MINOR-A/B/C r2 (khe hở ms không khoá dòng…) | [→] | `layer-10-task-03.md:103-106`. Ghi chú: L10-T02 (admin dịch, phụ thuộc L9-T07) hợp hơn L10-T03 (G33) |

## Follow-up layer 8 → layer 9

| Mục | Status | Evidence |
|---|---|---|
| G31 trang danh mục Cho thuê | ✅ đóng | L9-T08 |
| D5 skeleton | ⚠️ PARTIAL, chờ user | xem gap D5 |
| G32a bài liên quan đủ 3 thẻ | ✅ đóng | `post-queries.ts:130-138` |
| G32b FR-ADM-16 loại trừ services/pages | ✅ đã chuyển đúng | `layer-16-task-01.md:105` |
| Follow-up L8-T01 (guard-delete, test, race CTA) | ✅ đóng | `layer-9-task-01.md:98-100` |
| Follow-up L8-T02 (`asSystemActivity`, UUID) | ✅ đóng | `layer-9-task-02.md:102-108` |
| R23 BACKLOG BL-004..006 vào bảng | ⚠️ còn sót | Đã có trong bảng (`BACKLOG.md:14-16`), nhưng dòng BL-004 trùng vẫn dính sau `/change --list` ở `BACKLOG.md:29` |
| G30 nginx `/api/internal/` | Mở, đã gắn | `layer-12-task-01.md:126`. **Phải làm trước lần push kế tiếp** (đang đi trước 26 commit) |

## Doc reconcile

- As-built đã cập nhật trong `b527146..HEAD`: `docs/API_SPEC.md` (§3.1 lead, §4 assign/export), `docs/ERD.md` (§4.11 `remindedAt`/ẩn danh, `private-files` chỉ CV, audit `system.data_retention`, §7 as-built), `docs/ARCHITECTURE.md` (§5.1 T08, §5.2 lead, §5.4 cron remind/retention/translate, bảng storage), `docs/PERMISSION.md` (`private-files`, `leads.assignedTo`). Đã đối chiếu với code ở các dòng dẫn trên: khớp. ✅
- Intent docs (`SPECIFICATIONS.md`, `docs/BRD.md`, `.context/design-spec.md`) không có diff trong range. Các lệch S01 (h1, header trong suốt) và D5 được ghi là gap/follow-up, intent không bị hạ cấp cho khớp code. ✅
- Lưu ý: ERD/ARCH/PERMISSION đổi "private-files: CV + file nội bộ" thành "chỉ CV". Đây là đổi phạm vi dữ liệu, có quyết định user Q1 (`progress.json:593`) và BRD không nhắc file nội bộ, nên hợp lệ.

## Gaps

### [PARTIAL] D5 MEDIUM: trạng thái chờ ở trang danh sách (S04 `:349`, S08 `:440`, S02/S10)
- Hiện trạng: không làm được `loading.tsx` ở cấp route vì `notFound()` thành soft-404 HTTP 200, CDN có thể cache trang 200 sai. Chỉ `/cho-thue` mờ + `aria-busy` (`PendingRegion`). `/du-an`, `/tin-tuc`, `/tin-bds`, `/tuyen-dung` và trang danh mục của chúng không có phản hồi khi chuyển trang hoặc lọc.
- Quyết định bỏ `loading.tsx` là đúng: HTTP 404 đúng quan trọng hơn khung chờ (SEO, cache).
- Phương án:
  - **(A, đề xuất)** Task nhỏ `layer-10-task-04`, NORMAL, không migration: phản hồi chờ phía client bằng `useLinkStatus` (Next) trên Pagination, chip và link lọc, dùng `PendingRegion` chung cho 4 nhóm danh sách còn lại. Không đụng HTTP status. Giữ đúng quyết định user 2026-10-18 làm D5 trước M2.
  - (B) Ghi BACKLOG (BL-009), làm trước M3 hoặc gộp vào L14-T02 (CWV/a11y). Trải nghiệm không hỏng, chỉ thiếu phản hồi khi mạng chậm.
  - (C) Change Request sửa design-spec: trang danh sách render server không có skeleton lúc tải cứng, chỉ có phản hồi chờ khi điều hướng. Nên làm kèm A hoặc B để intent khớp giới hạn kỹ thuật đã đo.
- Đề xuất: **A + C**. C chỉ là sửa câu "skeleton 6 thẻ khi tải lần đầu" cho khớp giới hạn đã đo 9/9 route, cần user duyệt.

### [PARTIAL] BL-008 MEDIUM (PII, LGL-03): xoá CV ở đường khác để lại object S3 mồ côi
- Khi S3 lỗi, admin xoá hồ sơ, `removeOrphanCv` hoặc admin xoá `private-files` sẽ xoá dòng DB nhưng object CV vẫn còn trên S3. Job retention không quét được object này vì DB không còn dòng nào trỏ tới (`BACKLOG.md:18`).
- Phương án: (A, đề xuất) xử lý qua `/change` ngay sau M2, trước L12 (staging đủ Must): thêm hook `beforeDelete` trên `PrivateFiles` dùng lại `deletePrivateFile` + job đối chiếu bucket ↔ DB; gộp luôn MINOR r2 của T06 (prefix key `delete-private-file.ts:27-28`, test "S3 xoá rồi commit lỗi", audit meta số bước lỗi). (B) Để trước M5/production. Rủi ro thấp trên staging vì không có dữ liệu thật.

### [PARTIAL] G33 LOW: follow-up chưa giao task / task file chưa cập nhật (primary tự xử lý, không cần user)
- Chưa giao task nào: `layer-9-task-05.md:92-95` (MINOR r3), `layer-9-task-06.md:108` (index quét lead nhắc, tuỳ chọn), `:111-113` (MINOR r2 T06). Đề xuất: MINOR T06 gộp vào BL-008; MINOR T05 và index chuyển sang L14-T02 hoặc BACKLOG.
- Checkbox đã làm nhưng vẫn `[ ]`: `layer-9-task-06.md:97-107` (code đã làm, dẫn chứng ở ma trận T06).
- DoD/verification chưa cập nhật: `layer-9-task-05.md:76-78,81`; `layer-9-task-04.md:79`. "Doc impact result: pending" dù docs đã cập nhật: T01 `:72` (DoD `:86` lại ghi ERD §4.15), T06 `:68`, T07 `:87`. "Acceptance criteria: pending": T01/T02/T03/T06/T07. "Spec Validator verdict": cả 8 task, sẽ cập nhật sau report này.
- Follow-up dịch L9-T07 MINOR-A/B/C đang nằm ở L10-T03. Nên chuyển sang L10-T02 (cùng khu vực job dịch, có dependency L9-T07).
- `spec/changes/BACKLOG.md:29`: xoá dòng BL-004 trùng dính sau `/change --list`.

## Mốc M2: còn gì sau layer 10

M2 = "Tính năng Must xong (website VI/EN, lead, tuyển dụng, tự dịch)". Sau layer 9:
- Lead: endpoint, phân công, nhắc, xuất, lưu trữ đều xong. **Còn L10-T01**: ráp form vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ. Đến khi xong, khách chưa gửi được lead từ web.
- Tự dịch: job + hook xong. **Còn L10-T02**: nút "Dịch lại bằng AI", lọc trạng thái, duyệt bản EN trang pháp lý (BR-08 bắt buộc admin duyệt), cảnh báo lỗi dịch (FR-ADM-17 "admin thấy cảnh báo").
- Website VI/EN: **còn L10-T03** (`en.json`, chuyển ngôn ngữ đúng trang tương ứng, hreflang) + follow-up S01 (h1, header trong suốt, khoảng hở điều khiển hero ở mobile).
- Tuyển dụng: đã xong ở các layer trước.
- Cần user quyết trước/trong layer 10 để M2 đủ: **D5** (nếu chọn A thì thêm L10-T04).
- Không chặn M2 nhưng phải có lịch: BL-008 (trước L12/M5), L4-T06 giám sát (trước M3, đã hoãn), G30 + 3 migration mới khi deploy staging.

## Lưu ý trước lần push staging kế tiếp (G30)

- Local đi trước `origin/staging` 26 commit (đếm hôm nay). Theo `layer-12-task-01.md:126`: cập nhật nginx trên server (chặn `/api/internal/` → 404), `nginx -t`, reload, `curl -I …/api/internal/revalidate` = 404. Cần user xác nhận vì chạm server.
- Lần deploy này sẽ áp 3 migration mới của layer 9, đều additive: `20261018_113101_leads_reminded_at` (cột nullable + enum task), `20261018_130000_data_retention` (enum task + audit), `20261018_140000_translate_content` (enum task). Không có op `HIGH_RISK_MIGRATION`. `down` có xoá dòng `payload_jobs` của task tương ứng.
- Khi lên staging, job `translate-content` sẽ gọi Claude API thật mỗi lần lưu bản đã xuất bản. Nên đặt `TRANSLATION_MONTHLY_BUDGET_USD` thấp cho staging hoặc tắt `translationEnabled` cho đến khi kiểm. Job `data-retention` chạy Chủ nhật 03:00 VN và vô hại với dữ liệu test.

## Residual risk của lần validate này

- Không chạy `pnpm build`, `next start`/curl, migration, Docker/S3 thật. HTTP 404/canonical của T08, render 375/768/1280 và đo LCP trang chủ dựa trên evidence của builder/reviewer.
- Không đọc toàn văn `HeroSlider.tsx`, `create-or-merge.ts`, `leads-export.ts`, `translate-content.ts`, `export-filters.ts`. Các dòng ma trận dựa trên Read/Grep chọn lọc, test PASS hôm nay và report reviewer round cuối.
- Mục tiêu ≤ 10 phút cho bản EN mới đo trên dev bằng SDK giả, chưa đo trên staging.

## Cần user quyết (trước layer 10)

1. **D5** phản hồi chờ ở các trang danh sách: đề xuất **A + C** (task nhỏ `useLinkStatus` ở layer 10 + sửa câu skeleton trong design-spec cho khớp giới hạn đã đo). Có thể chọn B (backlog trước M3).
2. **BL-008** CV mồ côi khi S3 lỗi: đề xuất xử lý qua `/change` **ngay sau M2, trước L12**, gộp MINOR r2 của T06.
3. **G30**: xác nhận cập nhật nginx trên server trước lần push staging kế tiếp, và chọn hạn mức dịch cho staging.
4. Xác nhận các lệch đã chuyển đi: h1/header trong suốt → L10-T03; khối Đối tác → L13-T04 (Should, M4).

Primary tự xử lý, không cần user: G33 (giao follow-up, cập nhật checkbox/DoD/doc impact, chuyển MINOR dịch sang L10-T02, xoá dòng BL-004 trùng).

## Tóm tắt cho user

- Layer 9 gần như đủ: 8 task, 46/47 tiêu chí đạt, test 2.284/2.284 PASS, lint/typecheck sạch. Đã có trang chủ, API nhận lead (chống spam, chống trùng, tự giao), phân công/nhắc/xuất Excel lead, job xoá dữ liệu hết hạn, tự dịch sang tiếng Anh, trang danh mục Cho thuê (link 404 cũ đã hết).
- Thiếu 1 việc: khung chờ (skeleton) ở trang danh sách không làm được vì làm trang lỗi trả 200 thay vì 404. Em đề xuất làm phản hồi chờ phía trình duyệt trong layer 10 và sửa lại câu đó trong design-spec.
- Cần anh xếp lịch BL-008: khi kho file lỗi, xoá CV có thể để lại file của ứng viên. Đề xuất sửa ngay sau M2.
- Trước khi đẩy code lên staging (đang chậm 26 commit) phải cập nhật nginx trên server (G30) và đặt hạn mức dịch AI thấp cho staging.
- Để đạt M2 sau layer 10 còn: ráp form lead vào các trang, màn admin quản lý bản dịch, hoàn thiện bản tiếng Anh (gồm sửa h1 và header trong suốt ở trang chủ).
