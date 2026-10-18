Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 8 (round 1)

- Mode: Phase review (đóng layer, initial build, AGENTS.md bước 5g). Checkpoint của layer: "không dừng hỏi user sau layer này" (`layer-8-task-0N.md:6`). Mốc M2 nằm sau layer 10 (`layer-10-task-03.md:6`).
- Scope: `tasks/tami-website/layer-8-task-01.md` … `-05.md`. Commit: T01 7581ee1, T04 ce01ba1, T02 64074c6, T03 e68858d, T05 b57c662 (HEAD). `origin/staging` vẫn ở b936204, local đi trước **15 commit**: layer 7 + 8 chưa push, chưa deploy staging.
- Nguồn đã đối chiếu: `docs/BRD.md:89,108` (route Cho thuê); `.context/design-spec.md` S04 `:333-353`, S05 `:357-369`, S08 `:427-440`, S09 `:442-462`, §6.3 `:612`; `docs/API_SPEC.md` §2 `:39`, §3.2 `:91`, §3.3 `:105,110,120`; `docs/ERD.md` §4.11 `:430-488`, §4.12 `:492`, §4.15 `:547-566`; `docs/PERMISSION.md` §3.3 `:66-71`, §5 `:100-111`; `docs/ARCHITECTURE.md` `:127-128,175-176,184`; `docs/diagrams/layer-plan.md:43`; `spec/changes/BACKLOG.md`; `.context/progress.json` (`completedTasks :359-393`, `inProgressTask: null :395`, decision layer 7 `:527`); report reviewer round cuối của 5 task; report spec-validation layer 7; task file L9-T01, L9-T02, L9-T03, L10-T03, L12-T01, L13-T03, L16-T01. Code: `src/globals/Homepage.ts`, `src/hooks/media/guard-delete.ts`, `src/lib/translation/allowlist.ts`, `src/collections/{Leads,Services,Pages}.ts`, `src/i18n/routing.ts`, `src/lib/seo/sitemap-data.ts`, `src/components/posts/{PostDetail,OfferBox}.tsx`, `src/lib/rentals/rental-view.ts`, `src/shared/types/api.ts`, `src/endpoints/public/job-applications.ts`, `src/components/careers/ApplyForm.tsx`, cây `src/app/(frontend)/[locale]/**/page.tsx`.
- Verify (spec-validator tự chạy trên HEAD b57c662):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **177 file / 1.925 test PASS** (khớp số primary báo sau squash)
  - `pnpm build`, `next start`/curl, migration, Docker, ssh: **không chạy**. Lấy theo evidence của builder/reviewer.
  - `git status --short` trước/sau: chỉ `.claude/launch.json` và `.context/runs/build-tami-website-layer-8-validate.md` (file untracked của primary).

## Verdict: ⚠️ GAPS FOUND. 28/28 AC đạt, nhưng thiếu task làm trang danh mục Cho thuê (G31). Không chặn layer 9; phải xếp task trước M2.

- **28 AC đã cam kết**: T01 (6), T02 (8), T03 (6), T04 (3), T05 (5). Ngoài ra còn các follow-up gắn vào task: G12, G23, G27, 6 follow-up L7-T02, G29 ×3, D2. **Tất cả AC đạt**, có code + test (test hôm nay PASS).
- Reviewer PASS cả 5 task ở mức STRICT: T01 r2, T02 r2, T03 r1, T04 r1 (task ghi NORMAL), T05 r2.
- Follow-up layer 7 giao layer 8: G29 (3 mục) và D2 **đã đóng**. G30 vẫn mở đúng chỗ (L12-T01 `:126`), và **phải làm trước lần push kế tiếp**.
- Intent docs (`SPECIFICATIONS.md`, BRD, design-spec, design doc) **không có diff** trong `ece17d8..HEAD`: không bị hạ cấp. Doc as-built (API_SPEC, ERD, PERMISSION, ARCHITECTURE) khớp code đã đọc.
- **[MISSING] G31 (MEDIUM):** route `/cho-thue/danh-muc/[category]` (BRD `:89,108`, design-spec S05) **không có task nào làm**. Builder L8-T03 ghi "L10-T03 làm", nhưng L10-T03 là task hoàn thiện bản EN, không có trang này. Trang chi tiết tin cho thuê (L7-T03) **đang link tới route này và ra 404**.
- 4 nhóm lệch design-spec cần user quyết (D4, D5) và vài gap LOW (G32, R23). Không có conflict HIGH.

## Coverage matrix

### layer-8-task-01: global `homepage` + chặn xoá media đang dùng

| # | AC / requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Lưu `services` làm mới trang chủ vi/en + tag | task :40, FR-ADM-08 | ✅ | `src/hooks/homepage/revalidate-homepage-on-service.ts`, gắn ở `Services.ts:7`; test `homepage.test.ts` (reviewer r2 MINOR-3 đã đóng: dịch vụ nháp không làm mới, dịch vụ công khai thì làm mới) |
| 1b | FR-ADM-16 (`publishedAt ≤ now`) phải loại trừ services/pages | task :40 | ⚠️ chưa chuyển | Services/Pages không có `publishedAt` (`Services.ts:46`, `Pages.ts:59` `omit`). L16-T01 (task FR-ADM-16) chưa ghi ràng buộc này → G32 |
| 2 | G12 `homepage` trong `TRANSLATABLE_GLOBALS` + tag | task :41 | ✅ | `allowlist.ts:24`; test `allowlist.test.ts`; `global-cache.ts` (`PUBLIC_GLOBAL_SLUGS`) |
| 3 | Đủ khối: hero 1–8 slide, image R, video MP4/WebM ≤ 15MB; about+stats; featuredProjects ≤ 6; services; featuredOffers; partners; ctaBanner (title R khi enabled); blockOrder gồm ctaBanner; seo | task :42, ERD §4.15 `:547-558` | ✅ | `Homepage.ts:13-17,27-48,81-180,203`; ràng buộc title khi bật từ bản en (`:57-63`, MAJOR-1 r1 đã đóng, có test hồi quy); `blockOrder` không trùng khối (`:65-68`) |
| 4 | Chữ localized; quan hệ/ảnh dùng chung; group `translation` | task :43 | ✅ | `titleField` localized; upload/relationship không localized; `translationGroup()` `:204` |
| 5 | Chỉ admin ghi; lưu → revalidate `/`, `/en` | task :44 | ✅ | `access: { read: () => true, update: isAdmin }` `:192`; `createRevalidateHomepageGlobal` `:193`; test sale → 403 |
| 6 | Không có dải 4 lối tắt | task :45 | ✅ | Không có field lối tắt (ERD as-built `:566`) |
| T | 0/9 slide → lỗi; video 20MB, video là ảnh → lỗi; sale → 403 | task :48-49 | ✅ | `tests/integration/homepage.test.ts`; migration up→down→up (`homepage-migration.test.ts`) |
| F | Chặn xoá media đang dùng (MINOR-1 r1) | review r2 | ✅ / ⚠️ MINOR | `guard-delete.ts`, ERD `:492,566`. MINOR-A (truyền `req` làm đổi `req.locale`, `:11`), MINOR-C (test thiếu case), MINOR-D (race 2 admin) đã chuyển sang `layer-9-task-01.md:97-100` |

FR-PUB-01 (phần dữ liệu), FR-ADM-08: ✅. Phần hiển thị trang chủ làm ở L9-T01.

### layer-8-task-02: `leads` + `lead-activities`

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Đủ trường ERD §4.11; `code` sequence chỉ đọc; `phoneNormalized` index | ERD `:434-461` | ✅ | `Leads.ts:37-134` khớp từng dòng ERD; `code` dùng `systemFieldAccess` + `assignLeadCode`; index đơn `:65` và index tổng hợp DESC trong migration (ERD `:483,586-587`) |
| 2 | Không tạo lead qua REST công khai | task :40 | ✅ | `access.create: denyAll` `:154` |
| 3 | Sale đọc/sửa lead được giao (status, ghi chú); không sửa dữ liệu khách; không xoá; không xuất | PERMISSION `:66,92-93` | ✅ | `isAssignedOrAdmin` read/update; `customerFieldAccess = { update: isAdmin }` `:26`; `assignedTo` chỉ admin `:101`; `delete: isAdmin` |
| 4 | `lost` bắt buộc `lostReason` (BR-11) | ERD `:447` | ✅ | validator `:93-94` (bỏ qua khoảng trắng); test |
| 5 | Đổi status → `status_change`; `firstContactedAt` lần đầu rời `new` | ERD `:450,478` | ✅ | `recordStatusChange`, `stampLeadTimestamps` (`:158-159`); test "đổi status → 1 activity" |
| 6 | `lead-activities` chỉ thêm; sale thêm note/call trên lead được giao | ERD `:467`, PERMISSION `:67,71` | ✅ | M1 r1 đã đóng (`create = isStaff` + `guardManualActivity`); test sale xoá → 403 |
| 7 | Lọc admin theo trạng thái/nguồn/sale/thời gian; cảnh báo sale `active=false` | FR-ADM-09 | ✅ | index trên `status/source/assignedTo/createdAt`; `assigneeInactive` ảo + `LeadAssigneeWarning` `:103-110` |
| 8 | SĐT/email chỉ admin + sale phụ trách (BR-32) | BR-32 | ✅ | Đọc theo bản ghi (`isAssignedOrAdmin`). `ipHash` không ai đọc được; `userAgent` chỉ admin đọc |
| F | G23 ẩn danh dùng giá trị thay thế, không NULL | task :106 | ✅ | `ANONYMIZED_PLACEHOLDER` (ERD `:487`); L9-T06 `:101` dùng cùng giá trị |
| — | "sale A đọc lead B → 404" | task :49 | ✅ đọc / ℹ️ sửa = 403 | Đọc thì không thấy (lọc ở DB). Sửa theo id thì Payload trả **403**. Không trái PERMISSION: luật 404 ở §5 `:111` chỉ áp cho endpoint tự viết `/api/admin/*` (`:100`). Theo cách Payload xử lý `where` của access, id không tồn tại cũng ra 403 nên không lộ việc lead có tồn tại hay không. As-built PERMISSION `:71` mới nói 403 cho activity, chưa nói cho update lead → R23 |
| — | Side effect phân công (activity `assignment`, email, audit) | design doc D6 | [→] L9-T03 | `layer-9-task-03.md:25,28,39` (một hook duy nhất); ERD `:488` ghi luật phải bọc `asSystemActivity`. MINOR m1 (cờ boolean với bulk update) đã chuyển sang `layer-9-task-02.md:102` |

FR-ADM-09 (phần dữ liệu), BR-11, BR-17, BR-30, BR-32: ✅.

### layer-8-task-03: danh sách Cho thuê S04 + follow-up L7

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Mọi bộ lọc trên URL; URL chia sẻ ra đúng kết quả; tham số lạ bị bỏ qua | S04, §3.5 | ✅ | `src/lib/search/url-params.ts` (`parseRentalFilters` dùng schema API, giá trị lạ bị bỏ); unit round-trip + RTL đổi lọc → URL |
| 2 | `?q=` rỗng / có giá trị | S04 `:352` | ✅ | test RTL focus; tiêu đề "Kết quả cho" |
| 3 | Phường theo tỉnh; danh mục gồm danh mục con | FR-PUB-04 | ✅ | `ward` cần `province` (API_SPEC `:105`); SQL lọc phường thuộc tỉnh; danh mục cha đã xoá mềm bị loại |
| 4 | Không có kết quả → trống + xoá lọc + tối đa 3 gợi ý "Bỏ …" | S04 `:350` | ✅ | `EmptyState` + `MAX_SUGGESTIONS` |
| 5 | Sheet mobile; thanh lọc desktop; 375 px không cuộn ngang | S04 `:341-347` | ✅ | Builder đo `scrollWidth=375` trên build thật; reviewer kiểm theo class (residual) |
| 6 | `noindex` khi lọc sâu; trang gốc + lọc danh mục/tỉnh vẫn index | task :42 | ✅ (AC) / ⚠️ lệch S04 | Code đúng AC. Design-spec S04 `:354` muốn **mọi** tham số lọc ngoài `page` đều noindex, canonical về trang gốc **hoặc trang danh mục/khu vực**. AC chọn tạm cho index `?category=`/`?province=` vì trang S05/S06 chưa có. Khi có S05/S06 thì phải đổi canonical → gắn với G31. MINOR-1 (slug lạ vẫn index) → L13-T03 `:93` |
| — | States: skeleton 6 thẻ khi tải lần đầu; mờ 50% + `aria-busy` khi đổi lọc; lỗi API | S04 `:349-351` | ⚠️ [PARTIAL] | Mờ 50% + `aria-busy` và khung lỗi "Thử lại" có làm. **Skeleton không có**, và cả site không có `loading.tsx` nào (Glob `src/app/(frontend)/**/loading.tsx` rỗng). S08 `:440` cũng ghi "skeleton" → D5 |
| — | Chip danh mục link tới S05 | S04 `:338` | ⚠️ [PARTIAL] | Đang là `?category=` vì S05 chưa có; ghi rằng "L10-T03 đổi" nhưng L10-T03 không có việc này → G31 |
| F | G27 test quét trang động ↔ `MISSING_PAGE_RULES` | task :96-97 | ✅ | `resolve-missing-page.test.ts` (regex hẹp, MINOR-3 → L13-T03 `:94`) |
| F | 6 follow-up L7-T02 (ward/province, danh mục xoá mềm, snapshot `publicWhere`, bench guard, hook tỉnh, gộp RentalCard) | task :100-106 | ✅ | test tương ứng trong `rental-search-sql.test.ts`, `bench-guard.test.ts`, `rental-search.test.ts` |
| F | Reindex nền khi > 500 tin | task :104 | [→] BL-006 | `SYNC_REINDEX_LIMIT = 500` (`reindex-in-hook.ts`); job nền cần migration enum → `spec/changes/BACKLOG.md:26` |
| F | G29: ảnh kế khi ảnh đầu bị xoá + `locale`; `code: "postingClosed"`; test migration `payload_jobs_log` | task :109-111 | ✅ đóng | `shared/types/api.ts:14-15`, `job-applications.ts:58,213`, `ApplyForm.tsx:40,104`, test `job-applications.test.ts:245,250`, `ApplyForm.test.tsx:172`; API_SPEC §2 `:39`, §3.2 `:91` |
| F | D2 tin tương tự ±30%, < 4 thì bỏ điều kiện giá | progress `:527` | ✅ đóng | `SIMILAR_PRICE_TOLERANCE` trong `rental-queries.ts`, có test tích hợp. MINOR-4 (bù thay vì thay hẳn) → L13-T03 `:95` |
| API | `ward` thiếu `province` → 400; thêm `available`; thêm `code` | API_SPEC `:39,105,110,120` | ✅ chấp nhận | Đổi contract đã reconcile vào as-built. Không có client ngoài, link cũ `/cho-thue?ward=x` không lỗi (trang bỏ qua tham số); `postingClosed` giữ `details: []` nên vẫn tương thích ngược |

FR-PUB-04 (trang danh sách), NFR-01 (đã bench ở L7): ✅ (trừ D5, G31).

### layer-8-task-04: trang Đăng tin BĐS S08/S09 (+ S05 tin BĐS)

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Nhãn "Đã kết thúc" theo `isOfferEnded`; ẩn mã voucher khi kết thúc | task :40, BR-06 | ✅ (AC) / ⚠️ lệch S09 | `post-view.ts:19,142,152` (`voucherCode: null`); `OfferBox.tsx:67-74`; test `post-components.test.tsx:100`, `page.test.tsx` kiểm `innerHTML` không chứa mã. S09 `:449` muốn "mã gạch ngang" → D4a |
| 2 | Giá/ghi chú giá, khu vực, link dự án/tin cho thuê liên quan | task :41, S09 `:446-450` | ✅ | `OfferBox` + truy vấn liên quan qua `findPublicList` (reviewer) |
| 3 | `LeadFormSlot`; JSON-LD Article | task :42 | ✅ | `PostDetail.tsx:4,77`; JSON-LD Article không có author/voucher (reviewer) |
| T | Ưu đãi hết hạn → badge + ẩn voucher | task :45 | ✅ | như #1; phân trang hai nhóm (còn hạn trước) có test `property-posts.test.ts:240-276` |
| F | G27 rule 404 cho `/tin-bds/[slug]` + danh mục | task :94 | ✅ | `MISSING_PAGE_RULES` thêm 2 rule, có test |
| + | Trang S05 `/tin-bds/danh-muc/[category]` (ngoài Files) | builder :97 | ✅ chấp nhận | Cần cho tab S08 (design-spec `:369`); khớp BRD `:90,109` |
| — | Nút chia sẻ đầu bài; Web Share API < sm; nút dính ≥ xl | S09 `:445,459-460` | ⚠️ [PARTIAL] | Nút ở footer sau form (`PostDetail.tsx:92`), dùng lại `ShareButtons` của tin tức → D4b |
| — | Banner ảnh `pageBanners.propertyPosts` | §6.3 `:612` | ✅ (fallback được phép) | `pageBanners` chưa có trong `site-settings` (Grep `src` không thấy); design-spec cho phép dùng banner chữ → D4c chỉ cần ghi nhận |
| — | Bài liên quan đủ 3 thẻ (lấy bù từ nhóm đã kết thúc) | S09 `:455` | ⚠️ treo | MINOR-1 r1 `[ ]` ở `layer-8-task-04.md:104`, task đã đóng, không task nào nhận → G32 |
| — | States: skeleton (S08 `:440`) | design-spec | ⚠️ [PARTIAL] | như D5 |

FR-PUB-06, FR-PUB-07, BR-06 (hiển thị): ✅.

### layer-8-task-05: sitemap / robots / llms.txt

| # | AC | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Chỉ nội dung công khai; loại `rented`, tuyển dụng hết hạn, `seo.noindex` | task :41, SPEC F3/F6 | ✅ | `sitemap-data.ts:23-47` (rentals `status=published` `:25`, jobs `deadline ≥ startOfVietnamDay` `:32`); M1 r1 (noindex của danh mục) đã đóng, có test `sitemap-rentals.test.ts:147`, `sitemap-jobs.test.ts` |
| 2 | URL EN chỉ khi `hasEnglish`; alternates vi/en/x-default | task :42, BR-07 | ✅ | reviewer r2; x-default = vi |
| 3 | `lastmod = updatedAt` | task :43 | ✅ | select `updatedAt` (`:142`, reviewer) |
| 4 | Production cho phép (cả AI bot), có `Sitemap:`, chặn `/admin`, `/api` (giữ `/api/media/file/`); staging `Disallow: /` | task :44, :98 | ✅ | `src/lib/seo/robots.ts`; unit theo `APP_ENV` |
| 5 | Chia file khi > 50.000 URL | task :45 | ✅ | index `/sitemap.xml` + `/sitemaps/<nhóm>-<n>.xml`, ≤ 20.000 bản ghi/file |
| — | Danh mục Cho thuê trong sitemap | builder :102 | ⚠️ chờ | Chưa vào sitemap vì trang chưa có. Builder ghi "chờ L8-T03", nhưng L8-T03 không làm trang này → G31 |
| F | MINOR m7–m9 + hẹn giờ | review r2 | [→] L16-T01 `:100-104` | ✅ đã gắn |

FR-PUB-15 (sitemap/robots/llms): ✅.

## Gap / follow-up của layer 7 giao cho layer 8

| Gap | Trạng thái | Evidence |
|---|---|---|
| G29 (1) test migration chèn `payload_jobs_log` | **Đóng** | `layer-8-task-03.md:111` |
| G29 (2) `code: "postingClosed"` | **Đóng** | xem T03 |
| G29 (3) ảnh kế khi ảnh đầu bị xoá + `locale` ảnh thẻ | **Đóng** | `layer-8-task-03.md:109` |
| D1 giữ 8 tin tương tự khi đã thuê | **Đóng** (user duyệt) | progress `:527` |
| D2 lọc giá ±30% | **Đóng** | xem T03 |
| D3 % upload + kéo-thả CV | **Đã chuyển** BL-005 | `BACKLOG.md:25` |
| G27 cho L8-T03/L8-T04 | **Đóng** | xem T03, T04; L13-T03 `:90` còn mở đúng chỗ |
| G30 Nginx `/api/internal/` trên server | **Mở, đã gắn** L12-T01 `:126` | Local đi trước origin 15 commit. **Phải làm trước lần push kế tiếp** |
| G28 CI kiểm số migration/index | Mở, L15-T01 | Layer 8 thêm 2 migration (`homepage_global`, `leads`); khi làm L15-T01 cần cập nhật lại con số |

## As-built doc vs code

- `docs/API_SPEC.md` §2 `:39`, §3.2 `:91`, §3.3 `:105,110,120`: khớp code (`api.ts:14-15`, `job-applications.ts:213`, schema `ward`/`available`).
- `docs/ERD.md` §4.11 `:480-488` (gồm luật `asSystemActivity`, G23), §4.12 `:492`, §4.15 `:566`: khớp `Leads.ts`, `Homepage.ts`, `guard-delete.ts`. Câu cũ "title bắt buộc chỉ ở bản vi" ở giữa đoạn `:566` hơi gây hiểu lầm, nhưng câu bổ sung cuối đoạn đã nói đủ (bật từ en mà title vi rỗng → 400). Không cần sửa gấp.
- `docs/PERMISSION.md` §3.3 `:71`: khớp. Còn thiếu một câu về update lead không được giao trả 403 → R23.
- `docs/ARCHITECTURE.md` `:127-128` (RentalListPage/RentalFilters), `:175-176` (sitemap/llms), `:184` (lib/posts): khớp. Bullet cũ L4-T03 vẫn ghi sitemap/llms thuộc DOTTED (m8); đã gắn L16-T01 `:102`.
- Intent docs: không có diff trong `ece17d8..HEAD`. ✅ Các lệch design-spec (D4, D5, noindex S04) đều được ghi là gap chờ user, **không** sửa intent cho khớp code.

## Gaps

### [MISSING] G31 MEDIUM: trang danh mục Cho thuê `/cho-thue/danh-muc/[category]` (S05) không có task nào làm
- Yêu cầu: BRD `:89,108` (route vi + en), design-spec S05 `:357-369`, S04 `:338` (chip danh mục là link tới S05).
- Hiện trạng: route đã khai trong `src/i18n/routing.ts:16-19`, hook `revalidate-category.ts:17` đã làm mới đường dẫn này, nhưng **không có `page.tsx`** (Glob cây `[locale]`). Trang chi tiết tin cho thuê đang link danh mục tới route này: `rental-view.ts:86`, test `cho-thue/[slug]/page.test.tsx:101`. Khách bấm vào sẽ gặp **404** (lỗi có từ L7-T03, đang chạy trên local).
- Không task nào nhận: `layer-8-task-03.md:97,119` ghi "L10-T03", nhưng `layer-10-task-03.md` là task hoàn thiện bản EN (en.json, chuyển ngôn ngữ, hreflang), không có trang này. L13-T03 chỉ làm `/cho-thue/khu-vuc/[province]`. `layer-plan.md` không có task nào cho trang này.
- Kéo theo: (a) chip S04 vẫn là `?category=`; (b) canonical của `?category=` phải đổi về S05 khi có trang (S04 `:354`); (c) sitemap chưa có nhóm `categories-rentals` (`sitemap-data.ts:35-46`); (d) phải thêm rule vào `MISSING_PAGE_RULES` (test G27 sẽ báo nếu quên).
- **Phương án:**
  - **(A, đề xuất)** Primary thêm task mới ở layer 9 hoặc 10 (**trước M2**), ví dụ `layer-10-task-0X` "Trang danh mục Cho thuê S05". Task dùng lại `RentalListPage` + `CategoryListTemplate` + `dropUnknownSlugs` và gồm đủ (a)–(d). Mức NORMAL, không migration. Đây là việc chia task, không thêm requirement: route đã có trong BRD.
  - (B) Gộp vào L13-T03 (trang khu vực, dùng chung code danh sách). Nhược điểm: L13 nằm sau M2, nên link 404 trên trang chi tiết tồn tại qua mốc M2 và qua các lần deploy staging.
  - (C) Tạm đổi link danh mục trên trang chi tiết thành `/cho-thue?category=` cho tới khi có S05. Chỉ vá triệu chứng, vẫn cần A hoặc B.

### [PARTIAL] D4: lệch design-spec S09 (L8-T04), cần user quyết
- **D4a. Mã voucher khi ưu đãi hết hạn**: code ẩn hẳn mã và hiện "Ưu đãi đã kết thúc". S09 `:449` muốn "mã gạch ngang". AC task (`:40`) và reviewer chọn ẩn để không lộ mã có thể còn dùng được. Hai nguồn (AC task và design-spec) đang mâu thuẫn.
  - **(A, đề xuất)** Giữ cách ẩn mã. Mở Change Request sửa S09 `:449` thành "ẩn mã + dòng Ưu đãi đã kết thúc" (user duyệt, vì design-spec là intent doc).
  - (B) Làm đúng S09: hiện mã gạch ngang. Mã sẽ có trong HTML, cần user chấp nhận rủi ro mã cũ bị dùng lại.
- **D4b. Nút chia sẻ**: hiện ở cuối bài; chưa dùng Web Share API ở < sm; chưa dính cột trái ở ≥ xl (S09 `:445,459-460`).
  - **(A, đề xuất)** Ghi BACKLOG (nợ thiết kế, cùng kiểu BL-001/BL-005), làm trước M3. Đây là việc nhỏ (chuyển `ShareButtons` lên header + nhánh `navigator.share`) và nên áp chung cho tin tức (S11 "như S09").
  - (B) Gắn ngay vào L10-T01, task đang ráp form thật vào `PostDetail`.
  - (C) Change Request bỏ yêu cầu này khỏi S09.
- **D4c. Banner ảnh `pageBanners.propertyPosts`**: design-spec §6.3 `:612` cho phép dùng banner chữ khi chưa có trường này. **Không phải lệch spec.** Chỉ cần user biết: muốn banner ảnh cho mọi trang danh sách thì phải thêm `site-settings.pageBanners`, tức một task có migration.

### [PARTIAL] D5: trạng thái skeleton (S04 `:349`, S08 `:440`, cùng S02/S10) chưa có trên toàn site
- Builder L8-T03 cho rằng không làm được vì trang là Server Component. Thực tế Next có thể hiện skeleton khi chuyển trang và khi stream bằng `loading.tsx` của từng route segment. Hiện cả site không có file `loading.tsx` nào, chỉ có `components/ui/skeleton.tsx`.
- **Phương án:**
  - (A) Một task nhỏ dùng chung: `loading.tsx` cho các route danh sách (`/cho-thue`, `/tin-bds`, `/tin-tuc`, `/du-an`, `/tuyen-dung`), hiện 6 thẻ skeleton theo lưới. Mức NORMAL, không migration.
  - **(B, đề xuất)** Ghi BACKLOG (nợ thiết kế), làm trước M3. Lúc đổi bộ lọc, trang đã có lớp mờ + `aria-busy` nên trải nghiệm không hỏng.
  - (C) Change Request bỏ skeleton khỏi design-spec cho các trang render phía server.

### [PARTIAL] G32 LOW: follow-up còn treo / chưa chuyển đúng chỗ
- `layer-8-task-04.md:104` (bài liên quan bù từ nhóm đã kết thúc cho đủ 3 thẻ, S09 `:455`): checkbox `[ ]` trong task đã đóng, không task nào nhận. **Đề xuất:** chuyển sang L10-T01 (cùng `PostDetail`) hoặc task D4b.
- `layer-8-task-01.md:40`, nửa sau ("FR-ADM-16 phải loại trừ services/pages"): `layer-16-task-01.md` chưa có ràng buộc này. Khi thêm `publishedAt ≤ now` vào `publicWhere` dùng chung, dịch vụ và trang pháp lý (không có `publishedAt`) có thể biến mất hết. **Đề xuất:** thêm AC vào L16-T01 kèm test.
- Không cần user quyết; primary tự chuyển.

### R23: vệ sinh task file / tracking (LOW, không chặn)
- `layer-8-task-01.md:40-45`: 6 AC vẫn để `[ ]`, `:67` "Acceptance criteria: pending", dù code/test/STRICT PASS/commit đã xong.
- `layer-8-task-03.md:63` "Verify commands + result: pending"; `:69` "Doc impact result: pending (dự kiến no doc impact)", trong khi thực tế đã sửa API_SPEC + ARCHITECTURE; `:97,119` ghi sai task nhận ("L10-T03"), nên sửa theo G31.
- `layer-8-task-05.md:66` "Verify: pending"; `:102` "danh mục rental chờ L8-T03", cũng sửa theo G31.
- `layer-8-task-04.md:15` ghi NORMAL trong khi review STRICT.
- Cả 5 task: "Spec Validator verdict (layer close): pending" và "Decision log: pending" (T01 :74, T02 :78, T03 :70, T05 :72), cập nhật sau report này.
- `docs/PERMISSION.md:71`: thêm câu "sale sửa lead không được giao qua REST Payload → 403 (id không tồn tại cũng 403, không lộ việc lead có tồn tại); luật 404 ở §5 áp cho endpoint `/api/admin/*`". Mục đích: layer 9 (`lead-assign`) không làm theo nhầm.
- `spec/changes/BACKLOG.md:24-26`: 3 dòng BL-004…BL-006 bị dán **sau** mục "Quy tắc tracking", và BL-004 dính liền dòng gạch đầu dòng `/change --list`, nên không nằm trong bảng khi render. Cần chuyển lên bảng tracking (dòng 9-13).

## Residual risk của lần validate này
- Không chạy `pnpm build`, `next start`/curl, migration, Docker. Header HTTP thật, `scrollWidth` 375 px, 404 có nội dung và cache sitemap dựa trên evidence builder/reviewer và unit test.
- Không đọc toàn văn `RentalListPage.tsx`, `rental-search-sql.ts`, `sitemap-routes.ts`, `llms-route.ts`, `post-queries.ts`, `lead-activity-hooks.ts`. Các dòng ma trận dựa trên Read/Grep chọn lọc, test PASS hôm nay và reviewer round cuối.
- Hành vi "403 với id không tồn tại" của Payload `updateByID` là suy ra từ cách Payload xử lý access dạng `where`; chưa tự chạy kiểm.
- Migration `homepage_global` và `leads` mới áp ở DB dev; chưa chạy trên staging (chưa push). `pg_trgm` và Nginx (G30) vẫn phải kiểm ở lần deploy đầu.
- MINOR-D (race 2 admin ở ctaBanner) và m1 (`asSystemActivity` với bulk update) chưa có test tái hiện; đã gắn L9-T01/L9-T02.

## Cần user quyết (trước / trong layer 9)
Không mục nào **chặn** layer 9 (checkpoint tự sang layer kế). Cần quyết:
1. **G31** trang danh mục Cho thuê chưa có task (đang có link 404 trên trang chi tiết): đề xuất **A**, thêm task ở layer 9/10, xong trước M2.
2. **D4a** mã voucher hết hạn: đề xuất **giữ ẩn mã**, mở Change Request sửa design-spec S09.
3. **D4b** nút chia sẻ (đầu bài, Web Share mobile, dính ≥ xl): đề xuất **ghi BACKLOG**, làm trước M3.
4. **D5** skeleton khi tải trang danh sách: đề xuất **ghi BACKLOG** (hoặc A: một task nhỏ thêm `loading.tsx`).
5. Trước lần **push staging** kế tiếp (local đã đi trước 15 commit): cập nhật Nginx trên server (G30), cần user xác nhận vì chạm server.
6. Tồn từ trước, không đổi: BL-001/002/004/005/006, R4 `/brainstorm secrets`, tên miền production.

Primary tự xử lý, không cần user: G32, R23, sửa ghi chú "L10-T03" trong L8-T03/L8-T05.

## Tóm tắt cho user

**Layer 8 đã có gì (5/5 task, đều qua review kỹ):**
- **Trang chủ trong admin**: bật/tắt, sắp xếp các khối (slide ảnh/video, giới thiệu, dự án nổi bật, dịch vụ, ưu đãi, đối tác, băng kêu gọi). Chỉ admin sửa. Ảnh/video đang dùng trên trang chủ thì không xoá được.
- **Lead khách hàng**: lưu lead và lịch sử chăm sóc (chỉ thêm, không sửa/xoá). Sale chỉ thấy lead được giao, không sửa được thông tin khách. Chuyển "Không thành" phải ghi lý do.
- **Trang danh sách Cho thuê** `/cho-thue`: lọc theo khu vực, giá, diện tích, phòng ngủ…; link có bộ lọc gửi cho người khác vẫn ra đúng kết quả. Trên điện thoại bộ lọc mở từ dưới lên. Căn tương tự đã lọc giá ±30% như anh duyệt.
- **Trang Đăng tin BĐS**: danh sách, danh mục, chi tiết; ưu đãi hết hạn có nhãn "Đã kết thúc" và không lộ mã.
- **Sitemap / robots / llms.txt** cho Google và các trợ lý AI; tin đã thuê, tin nháp, tuyển dụng hết hạn không bị đưa lên.
- Kiểm lại hôm nay: lint, typecheck, 1.925/1.925 test đều đạt.

**Phát hiện cần lưu ý:** trang **danh mục Cho thuê** (ví dụ `/cho-thue/danh-muc/can-ho`) chưa có task nào làm. Trên trang chi tiết tin cho thuê, bấm vào tên danh mục đang ra trang 404.

**Anh cần quyết (không chặn layer 9):**
1. Thêm task làm trang danh mục Cho thuê ở layer 9–10, xong trước mốc M2 (đề xuất), hay để đến layer 13?
2. Ưu đãi hết hạn: giữ cách **ẩn hẳn mã** (đề xuất, an toàn hơn) và sửa thiết kế theo, hay hiện mã gạch ngang như thiết kế?
3. Nút chia sẻ chưa ở đầu bài / chưa có nút "Chia sẻ" kiểu điện thoại: ghi nợ thiết kế làm sau (đề xuất) hay làm ngay?
4. Khung chờ (skeleton) khi tải trang danh sách chưa có trên toàn site: ghi nợ thiết kế (đề xuất) hay làm một task nhỏ?
5. Code layer 7–8 chưa đẩy lên staging. Trước khi đẩy cần cập nhật cấu hình Nginx trên server.
