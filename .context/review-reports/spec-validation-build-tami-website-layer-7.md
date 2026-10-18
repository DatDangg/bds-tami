Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 7 (round 1)

- Mode: Phase review (đóng layer, initial build, AGENTS.md bước 5g). Checkpoint của layer: "không dừng hỏi user sau layer này" (`layer-7-task-0N.md:6`).
- Scope: `tasks/tami-website/layer-7-task-01.md` … `layer-7-task-04.md`. Commit: T01 f29176c, T02 df521df, T04 49c7ade, T03 37b4fa9 (HEAD). `origin/staging` vẫn ở b936204 (local ahead 8): **layer 7 chưa push, chưa deploy staging**.
- Nguồn đã đối chiếu: BRD FR-PUB-04 `:137`, FR-PUB-05 `:138`, FR-PUB-09 `:142`, FR-ADM-03 `:160`, BR-01 `:183`, BR-02 `:184`, BR-04 `:186`, BR-06 `:188`; SPECIFICATIONS `:166` (tin Đã thuê); `.context/design-spec.md` §3.4 `:162-166`, S07 `:397-414`; docs/API_SPEC.md §3.2 `:85-91`, §3.3 `:93-115`, §3.8 `:169-179`; docs/ERD.md §4.7 `:296-326`, §5 `:569`, §6 `:588-594`; docs/ARCHITECTURE.md §4 `:93,104,106,117-118,126,128`, §5.1 `:181`, §5.4 `:223`; `docs/diagrams/layer-plan.md:42`; `.context/progress.json` (`completedTasks :332-356`, `inProgressTask: null :360`); report reviewer round cuối 4 task; report spec-validation layer 6; task file L8-T03, L8-T04, L12-T01, L13-T03, L15-T01; code `src/collections/PropertyPosts.ts`, `src/jobs/expire-offers.ts`, `src/lib/content/offer-status.ts`, `src/app/(payload)/api/internal/revalidate/route.ts`, `src/lib/rentals/rental-queries.ts`, `src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx`, `src/components/rentals/{RentalDetail,SaleContactBox}.tsx`, `src/components/careers/{ApplyForm,JobDetail}.tsx`, `src/lib/seo/json-ld.ts`, `src/shared/types/api.ts`, `docker/nginx/*.conf`, compose staging/prod.
- Verify (spec-validator tự chạy, HEAD 37b4fa9):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **155 file / 1.694 test PASS** (khớp số primary báo sau squash; `contrast.test.ts` PASS trên staging, lỗi CRLF chỉ ở worktree)
  - `pnpm build`, `next start`/curl, bench, Docker e2e, ssh: **không chạy**. Lấy theo evidence builder/reviewer trong task file.
  - `git status --short` trước/sau: chỉ `.claude/launch.json` và `.context/runs/build-tami-website-layer-7-validate.md` (untracked của primary).

## Verdict: ✅ COMPLETE (PASS) — 100% AC đạt; kèm 2 [PARTIAL] so với design-spec (chờ user quyết, không chặn layer 8) và 2 gap LOW + vệ sinh task file

- **27 AC đã cam kết**: T01 (6), T02 (6), T03 (6), T04 (3) + follow-up gắn vào task (G12, G22, revalidate liên tiến trình, reindex searchText, G26, G27, 404 có nội dung, address/location ẩn, FloatingContact ref). **Tất cả đạt**, có code + test hoặc evidence chạy thật.
- Reviewer PASS cả 4 task, đều mức STRICT (T03 task đề NORMAL nhưng review STRICT): T01 r2, T02 r1, T03 r2, T04 r2.
- Không có [MISSING] so với AC. Không có conflict HIGH. Intent docs (BRD, SPEC, design-spec) **không bị sửa/hạ cấp**; hai lệch so với design-spec được builder ghi là "gap chờ user" đúng quy định.
- G26/G27 (layer 6 giao L7-T03) đã đóng; G27 đã gắn cho L8-T03/L8-T04/L13-T03; G28 đã gắn L15-T01.

## Coverage matrix

### layer-7-task-01: `property-posts` + job `expire-offers` + revalidate nội bộ

| # | AC / requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Gộp validator ảnh bìa (MINOR-4 L5-T03) | task :39 | ✅ | `src/fields/cover-image.ts` (`validateCoverWhenPublished`), dùng ở `PropertyPosts.ts:59`, news, services; ERD `:322` |
| 2 | G12 allowlist | task :40 | ✅ | `public-queries.ts:11` có `property-posts`; ERD `:326` (`TRANSLATABLE_COLLECTIONS`) |
| 3 | Đủ trường ERD §4.7 (offer group, quan hệ tuỳ chọn) | ERD `:298-318` | ✅ | `PropertyPosts.ts:27-36, 52-70`; `isFeatured`/status/author/seo/publishedAt từ `withContentDefaults` (`content-defaults.ts:28,89`). `cover` R → "bắt buộc khi published" ghi as-built ERD `:322` (cùng quy ước news) — chấp nhận |
| 4 | `isOfferEnded` nguồn duy nhất "Đã kết thúc" + loại khỏi khối nổi bật (BR-06) | BRD `:188` | ✅ (phần dữ liệu) | `offer-status.ts:16-40` (`isOfferEnded`, `offerNotEndedWhere`, `offerJustEndedWhere`); test biên giờ VN `offer-status.test.ts`. Hiển thị nhãn + khối nổi bật thật làm ở L8-T04 / L9 |
| 5 | Job 00:05 revalidate chi tiết + trang chủ vi/en, idempotent | ARCH §5.4 `:223` | ✅ | `expire-offers.ts:29-54` (cron `0 5 17 * * *` `:64`, không đổi bản ghi, trần 500 có cảnh báo `:43-45`); test `expire-offers.test.ts` |
| 6 | Index `(status, has_english, category_id, published_at DESC)`, `(status, is_featured, offer_end_at)` | ERD §5 `:569` | ✅ | migration `20261018_075627_property_posts`; ERD as-built `:569` |
| T | Sale sửa/xoá bài sale khác 403; xoá mềm + admin khôi phục; chặn xoá danh mục đang dùng | task :49, BR-04 | ✅ | `tests/integration/property-posts.test.ts` |
| F | G22 ward theo province + validator upload mặc định | task :110 | ✅ | `PropertyPosts.ts:67` (`validateWardWithOptionalProvince`); ERD `:323` |
| F | Revalidate liên tiến trình cho `expire-offers` + `close-job-postings` | task :113 | ✅ code / [→] e2e | `route.ts:13-15`, `lib/revalidate/internal-revalidate.ts`; cả 2 job dùng `revalidateFromJob` (`close-job-postings.ts:31`, `expire-offers.ts:30`); Nginx `location ^~ /api/internal/` ở 3 conf (`tami.conf:60`, `tami-staging.conf:68`, `tami-staging-sslip.conf:69`); API_SPEC §3.8 `:169-179`. Smoke Docker thật → `layer-12-task-01.md:124`. Xem G30 |
| F | Follow-up r2 MINOR-1 (test migration chèn dòng `payload_jobs_log`) | task :116 | ⚠️ treo | Checkbox `[ ]` trong task đã đóng, không có task nhận → G29 |

FR-ADM-03, BR-02, BR-04, BR-06 (phần dữ liệu/job): ✅.

### layer-7-task-02: `SearchService` + `GET /api/public/rentals` + trigram

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Tham số đúng §3.3, limit ≤ 48, sai → 400 | API_SPEC `:97-109` | ✅ | `rentalSearchParamsSchema` (`shared/types/api.ts:67-81`); as-built `:115` |
| 2 | `RentalCard` chỉ trường công khai, không `address` khi `showExactAddress=false` | API_SPEC `:111` | ✅ | SQL chỉ trả địa chỉ khi bật (as-built `:115`); integration `rentals.test.ts` |
| 3 | Chỉ `published`/`rented` theo `publicWhere`; EN lọc `hasEnglish` | ERD §1 | ✅ | test đối chiếu `publicWhere` (as-built `:115`). Snapshot test khi thêm hẹn giờ → `layer-8-task-03.md:101` |
| 4 | `q` chuẩn hoá như `searchText`, không dấu, tham số hoá | ERD §6 `:590-592` | ✅ | `rental-search-sql.ts` + test injection |
| 5 | Rate limit 60/phút; `s-maxage=60`, cache key gồm locale | API_SPEC `:113` | ✅ / [→] | `Cache-Control: public, s-maxage=60`; `locale` là query param nên nằm trong URL key. Cloudflare Cache Rule → L15-T01 |
| 6 | Bench 100.000 tin p95 ≤ 500 ms | NFR-01 | ✅ (dev) / [→] | p95 80.4 ms (task :104); đo lại staging → `layer-12-task-01.md:125` |
| F | Reindex `searchText` khi đổi tên dự án / `legacyNames` | task :108 | ✅ | `reindex-rental-search-text.ts`, hook `projects`/`wards`, `pnpm reindex:rentals-search`; ERD `:592`. Đổi tên tỉnh + job nền → `layer-8-task-03.md:103-104` |

FR-PUB-04 (phần API + tìm kiếm): ✅. Phần URL/bộ lọc UI ở L8-T03. 6 MINOR reviewer đã chuyển đủ vào `layer-8-task-03.md:99-104`.

### layer-7-task-03: Chi tiết tin cho thuê (S07)

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Mã tin, giá/tháng hoặc "Thoả thuận", diện tích, PN/WC, tầng, hướng, nội thất, điều khoản, mô tả, vị trí (ẩn số nhà), video facade | FR-PUB-05 `:138`, S07 `:403` | ✅ | `RentalDetail.tsx`, `RentalSpecs`, `RentalTerms`, `SaleContactBox.tsx:31-38`, `VideoFacade` `:60-65`. Lệch bố cục nhỏ: video là section riêng thay vì nút "Xem video" cạnh thư viện (S07 `:401`) — không ảnh hưởng chức năng |
| 2 | Sale phụ trách tên/SĐT; sale khoá → hotline chung, không hiện tên | SPEC § Quy tắc biên, S07 `:404` | ✅ | `rental-queries.ts:108-125` (`active !== true` → null); `SaleContactBox.tsx:42-54`; test page |
| 3 | Rented: badge, `noindex, follow`, gợi ý tương tự nổi bật, không JSON-LD | BR-01 `:183`, S07 `:407-414` | ✅ | `page.tsx:85` (`forceNoindex`), `:140` (JSON-LD chỉ khi `!rented`); `RentalDetail.tsx:111,118,125`; giá mờ + "Giá tham khảo" `SaleContactBox.tsx:29-30`; giữ nút gọi sale đúng S07 `:412` |
| 4 | Tin tương tự cùng danh mục + tỉnh, loại tin hiện tại, tối đa 4 | task :44, S07 `:405,413` | ✅ (AC) / ⚠️ [PARTIAL] design-spec | `rental-queries.ts:39-55`: 4 khi published, **8 khi rented** (design-spec S07 `:413` "4-8 tin" → đúng intent, lệch chữ AC); chỉ gợi ý `published`. **Chưa lọc giá ±30%** (S07 `:405`) → D1/D2 |
| 5 | `LeadFormSlot` (biến thể "Nhận tư vấn căn tương tự") | SPEC `:166`, S07 `:412` | ✅ | `SaleContactBox.tsx:64-68`; form thật L10-T01 (`source=rental`, `sourceId`) |
| 6 | `showExactAddress=false` → `approximateLocation`, không toạ độ thật trong HTML | contract L2-T08 | ✅ | `toRentalDetailView` là nơi duy nhất gọi; đo `next start` chỉ có `10.777,106.701` (task :117); test page |
| F | G26 Organization trong JSON-LD | report L6 G26 | ✅ đóng | `json-ld.ts:73,86-87` (`publisher` Organization); dùng ở `cho-thue/[slug]/page.tsx:152` và `du-an/[slug]/page.tsx:125` |
| F | G27 `/cho-thue/[slug]` vào `MISSING_PAGE_RULES` + 404 có nội dung | report L6 G27 | ✅ đóng | ARCH §5.1 `:181`; curl `/cho-thue/khong-ton-tai` 404 có h1 + header/footer (task :131) |
| F | address/location optional + bản đồ gần đúng server-side | follow-up L6-T02 | ✅ | `findRentalPrivateFields` `rental-queries.ts:87-97` (`select` 2 trường) |
| F | FloatingContact ref + offset thanh dính đáy | follow-up L5-T06 | ✅ | `ClickRefMarker collection="rentals"` `RentalDetail.tsx:158`; `ProjectStickyCta` `:159` |
| F | MAJOR-1 r1 lộ `media.uploadedBy` | review r1 | ✅ đóng | `findPublicAvatar` `overrideAccess:false` `rental-queries.ts:128-136` + whitelist ảnh; test integration |
| F | MINOR r2 (ảnh đầu bị xoá → ảnh kế; locale ảnh thẻ) | task :143 | ⚠️ chuyển một phần | `layer-8-task-03.md:105` chỉ ghi "gộp RentalCard", chưa ghi 2 điểm cụ thể `rental-queries.ts:71,74` → G29 |

FR-PUB-05, BR-01, FR-PUB-15 (RealEstateListing): ✅. Sitemap loại tin rented (S07 `:408`) thuộc L8-T05.

### layer-7-task-04: Form ứng tuyển

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Kiểm loại/cỡ file client trước khi gửi (server vẫn kiểm) | design-spec §3.4 `:164` | ✅ | `ApplyForm.tsx:19` (`CV_MAX_BYTES` 5 MB), `accept` `:119`; tên/dung lượng/nút xoá; RTL file 6 MB bị chặn |
| 2 | Gửi kèm `locale`; thông báo theo ngôn ngữ | API_SPEC §3.2 `:87` | ✅ | `ApplyForm.test.tsx` (`role="status"` thành công) |
| 3 | Tin hết hạn không render form | SPEC F6 | ✅ | `JobDetail.tsx:104,126,158` |
| F | Lỗi CV gắn ô CV (MAJOR-1 r1) | §3.4 `:164` "413/415 tại ô CV" | ✅ | server trả `details:[{field:"cv"}]`; API_SPEC `:91` reconcile (thêm phần tử, không đổi shape); `ApplyForm.tsx:103` |
| — | Thanh tiến trình upload "%" (XHR) + vùng kéo-thả ≥ md | design-spec §3.4 `:163,165` | ⚠️ [PARTIAL] | Chỉ "Đang gửi…" + ô file native (task :67) → D3 |
| F | MINOR-A r2: mã máy đọc `postingClosed` thay quy ước "400 không details" | task :96 | ⚠️ treo | Checkbox `[ ]` trong task đã đóng, không có task nhận → G29 |

FR-PUB-09 (form CV), FR-PUB-13: ✅.

## Gap layer 6 giao cho layer 7

| Gap | Trạng thái | Evidence |
|---|---|---|
| G26 Organization JSON-LD | **Đóng** | `json-ld.ts:86-87`; dự án + cho thuê |
| G27 404 có nội dung | **Đóng** cho `/cho-thue/[slug]`; đã gắn L8-T03 `:96`, L8-T04 `:93`, L13-T03 `:90` | ARCH `:181` |
| G28 CI kiểm số migration/index | Mở, đã gắn | `layer-15-task-01.md:181` (giờ là 21 migration, không còn 19 — cập nhật con số khi làm) |
| Follow-up L6-T08 revalidate từ job | **Đóng** (code) | xem T01; e2e → L12-T01 `:124` |
| Follow-up L6-T02 searchText cũ | **Đóng** | xem T02 |
| R18/R20/R21 | Đã reconcile ở 0368b5d (theo commit message); ARCH §4 hiện có `lib/rentals`, `lib/careers`, `lib/projects`, `components/rentals` (`:124-128`) | — |

## As-built doc vs code

- ERD §4.7 `:320-326`, §5 `:569`, §6 `:592`; API_SPEC §3.2 `:91`, §3.3 `:115`, §3.8 `:169-179`; ARCH §4 `:93,104,106,117-118,126,128`, §5.1 `:181`, §5.4 `:223`: **khớp code** đã đọc.
- Intent docs: BRD/SPEC/design-spec không có diff trong 4 commit layer 7 → không hạ cấp. ✅

## Gaps

### [PARTIAL] D1/D2 — S07 tin tương tự (design-spec `:405,413`) — cần user quyết
- D1 (số lượng khi rented): code lấy 8; design-spec nói "4-8", AC task nói "tối đa 4". **Code khớp intent**, chỉ lệch chữ AC task. Phương án: **(A, đề xuất)** giữ 8, primary sửa chữ AC L7-T03 thành "4 (published) / tối đa 8 (rented) theo S07"; (B) hạ về 4 (đổi hằng `SIMILAR_RENTALS_COUNT_WHEN_RENTED`).
- D2 (lọc giá ±30%): chưa làm. Phương án: **(A, đề xuất)** thêm ±30% quanh `priceMonthlyVnd` khi tin có giá, nếu < 4 kết quả thì nới về "cùng danh mục + tỉnh" (không làm danh sách thưa); gắn vào L8-T03 (đang gộp RentalCard, chạm `rental-queries.ts`); (B) bỏ ±30% → phải qua Change Request sửa design-spec S07; (C) hoãn vào BACKLOG.

### [PARTIAL] D3 — Form ứng tuyển: thanh % upload + kéo-thả ≥ md (design-spec §3.4 `:163,165`) — cần user quyết
- Phương án: (A) làm riêng trong `ApplyForm` bằng XHR `upload.onprogress` + vùng drop ≥ md, **không** đổi `usePublicForm` dùng chung (task nhỏ, NORMAL; có thể gắn L11-T01 hoặc task form sau); (B) Change Request sửa §3.4 về "spinner + Đang gửi…" như §3.3 (CV ≤ 5 MB, ô file native vẫn nhận kéo-thả); **(C, đề xuất)** ghi BACKLOG (design debt, như BL-001), làm trước M2/M3. Không được tự sửa §3.4 khi chưa có user duyệt.

### [PARTIAL] G29 LOW — follow-up treo trong task đã đóng, chưa có task nhận
- `layer-7-task-01.md:116` (test migration chèn dòng `payload_jobs_log`).
- `layer-7-task-04.md:96` (mã `postingClosed` máy đọc được; comment `job-applications.ts:58`, `ApplyForm.tsx:39`).
- `layer-7-task-03.md:143` chi tiết (`rental-queries.ts:71` ảnh đầu bị xoá → ảnh kế; `:74` truyền `locale`) chưa chép vào `layer-8-task-03.md:105`.
- **Đề xuất:** primary chuyển (1) sang L15-T01 hoặc task migration/CI kế tiếp, (2) sang L10-T01 (cùng `usePublicForm`/API form), (3) bổ sung vào L8-T03 `:105`. Không cần user.

### [PARTIAL] G30 LOW — Nginx trên server staging phải cập nhật trước lần push kế tiếp
- Repo đã thêm `location ^~ /api/internal/ { return 404; }` vào 3 conf, nhưng conf trên server cài tay (L6-T01). `origin/staging` đang chậm 8 commit; khi push, CD sẽ deploy route `/api/internal/revalidate` trong khi conf server có thể vẫn bản cũ → route lộ ra Internet (vẫn có Bearer HMAC nên rủi ro thấp). `layer-12-task-01.md:124` chỉ kiểm 404 lúc smoke.
- **Đề xuất:** thêm bước "cập nhật `tami-staging-sslip.conf` lên server + `nginx -t` + reload (⏸ xác nhận user)" vào L12-T01 hoặc ngay trước lần push staging đầu tiên của layer 7. Cùng lúc kiểm quyền `CREATE EXTENSION pg_trgm` (`:125`) vì migrate chạy trong CD.

### R22 — Vệ sinh task file (LOW, không chặn)
- `layer-7-task-04.md:75-78` DoD 4 mục đầu `[ ]` và ghi "mức NORMAL" dù đã code/test/STRICT PASS/commit; `:66` "Decision log: pending".
- `layer-7-task-03.md:87` DoD "Doc Impact reconciled" `[ ]` dù ARCH `:126,128,181` đã có; `:84` ghi chú contrast.test (nay 155/155 PASS trên staging); `:61-62` hai dòng "Last failure type". `layer-7-task-04.md:52-53` tương tự.
- Cả 4 task "Spec Validator verdict (layer close): pending" (T01 :72, T02 :71, T03 :70, T04 :62) → cập nhật sau report này.
- G28 trong L15-T01 `:181` còn ghi "19/19"; nay là 21 migration.

## Residual risk của lần validate này
- Không chạy `pnpm build`, `next start`/curl, bench, Docker e2e. HTTP status/header, HTML không lộ toạ độ, 404 có nội dung, p95 lấy theo evidence builder/reviewer.
- Job `jobs → app:3000/api/internal/revalidate` chưa chạy thật trong Docker; nếu lỗi, bài hết hạn ưu đãi chỉ làm mới khi ISR 60 s hết hạn (chấp nhận, task :70).
- `services.coverImage` nay chỉ nhận ảnh (T01 Notes :102): bản ghi staging nào đang trỏ file không phải ảnh sẽ báo lỗi khi admin lưu lại. Staging hiện chỉ có seed nên rủi ro thấp; nên kiểm khi deploy.
- `offer.endAt` nhập qua API với giờ khác 12:00 UTC chưa được kiểm ở mức validator (đã dựa `deadlineDate`); không đọc toàn văn `careers/deadline.ts`.
- Không đọc toàn văn `rental-search-sql.ts`, `internal-revalidate.ts`, `ApplyForm.tsx`, `RentalDetail.tsx`; các dòng ma trận dựa trên Read/Grep chọn lọc + test PASS hôm nay + reviewer round cuối.

## Cần user quyết trước layer 8
Không có mục nào **chặn** layer 8 (checkpoint tự sang layer kế). Cần quyết:
1. **D1** số tin tương tự khi "Đã thuê": đề xuất giữ 8 (đúng design-spec), chỉ sửa chữ AC.
2. **D2** lọc giá ±30%: đề xuất làm ở L8-T03 kèm nới điều kiện khi < 4 tin.
3. **D3** thanh % upload + kéo-thả CV: đề xuất ghi BACKLOG (design debt), hoặc chọn A (làm nhỏ trong ApplyForm) / B (Change Request bỏ khỏi design-spec).
4. Trước lần **push staging** kế tiếp: cập nhật conf Nginx trên server (G30) — cần user xác nhận vì chạm server.
5. Tồn từ layer 6 (không đổi): R4 `/brainstorm secrets` (thêm `INTERNAL_APP_URL`), BL-001/BL-002, tên miền production.

Primary tự xử lý, không cần user: G29, R22, sửa con số G28.

## Tóm tắt cho user

**Layer 7 đã có gì (4/4 task, đều qua review kỹ):**
- **Đăng tin BĐS** trong admin (tin, voucher, ưu đãi). Sale chỉ sửa bài của mình. Ưu đãi quá ngày kết thúc tự coi là "Đã kết thúc"; mỗi đêm 00:05 hệ thống làm mới trang cho khớp. Trang tuyển dụng hết hạn cũng được làm mới cùng cơ chế.
- **Tìm tin cho thuê** qua API: lọc danh mục, khu vực, giá, diện tích, phòng ngủ, nội thất; gõ không dấu vẫn ra; thử với 100.000 tin chỉ mất khoảng 0,08 giây. Không lộ địa chỉ khi tin chọn ẩn.
- **Trang chi tiết tin cho thuê**: đủ thông số, điều khoản, bản đồ khu vực gần đúng (không lộ toạ độ thật), sale phụ trách (sale bị khoá thì hiện hotline). Tin "Đã thuê" vẫn mở, có băng thông báo, không lên Google, gợi ý căn tương tự.
- **Form ứng tuyển** gắn CV trên trang tuyển dụng, chặn file sai loại/quá 5 MB ngay trên trình duyệt.
- Kiểm lại hôm nay: lint, typecheck, 1.694/1.694 test đều đạt.

**Anh cần quyết (không chặn layer 8):**
1. Tin đã thuê hiện 8 căn tương tự (thiết kế cho phép 4-8) — giữ hay về 4? Đề xuất giữ.
2. Căn tương tự chưa lọc theo giá ±30% như thiết kế — làm ở layer 8 (đề xuất) hay bỏ?
3. Form CV chưa có thanh % khi tải lên và vùng kéo-thả riêng — ghi nợ thiết kế làm sau (đề xuất), làm ngay, hay bỏ khỏi thiết kế?
4. Code layer 7 chưa đẩy lên staging. Trước khi đẩy cần cập nhật cấu hình Nginx trên server để chặn đường nội bộ mới.
