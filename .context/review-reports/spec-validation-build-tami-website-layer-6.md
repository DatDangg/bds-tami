Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 6 (round 1)

- Mode: Phase review (đóng layer, initial build, AGENTS.md bước 5g). Checkpoint của layer: "không dừng hỏi user sau layer này" (task file dòng 6). Mốc duyệt kế tiếp là M2 (sau L10, `progress.json:474-478`).
- Scope: `tasks/tami-website/layer-6-task-01.md` … `layer-6-task-10.md`. Commit: T03 0f7e5fa, BL-003 71f1be6, T02 fa17162, T09 f972a5a, T10 ea7877b, T06 57d43bc, T07 dfd1945, T04 4f14678, T05 e810c62, T08 ba64fd3, T01 8604da9 (phần A) + c0406c2/0dfc8f9 (CI) + b936204 (dependency runtime) + 334f1ee (journal) + 43e4614 (đóng). HEAD 43e4614. Ghi chú: brief ghi T09 là "f972a5a/690d3e1", nhưng 690d3e1 là commit đóng layer 2. Commit của T09 chỉ có f972a5a.
- Nguồn đã đối chiếu: SPECIFICATIONS.md (F6 `:64`, F7 `:66`, F11 `:79`); docs/BRD.md (FR-PUB-10 `:143`, FR-PUB-11 `:144`, FR-PUB-15 `:148`, FR-PUB-18 `:151`, NFR-10 `:236`, route `:94,:113`); `.context/design-spec.md` S03 `:331`, S04 `:333-355`, S05 `:357-371`, S14 `:514`; docs/API_SPEC.md §3.2 `:85-91`, §3.4 `:115-130`, §4 `:167-179`, §5 `:193`; docs/ERD.md (§3 `:108`, §4.2 `:154-164`, §4.6 `:275-284`, §4.10 `:406-420`, §5 `:568`, §7 `:594`); docs/ARCHITECTURE.md §4 `:86-137`, §5.1 `:165-178`, §6 `:284-291`; docs/runbooks/deploy.md §2 `:30-63`, §9 `:198-281`; `docs/diagrams/layer-plan.md`; `.context/progress.json` (completedTasks `:262-329`, decisions `:413-461`, milestones `:464-497`); `.context/decisions.md`; `spec/changes/BACKLOG.md:11-13`; journal `.context/runs/build-tami-website-layer-6-task-01.md`; report reviewer round cuối của 10 task; report spec-validation layer 5 + addendum; task file L7-T01, L8-T02, L9-T06, L12-T01, L15-T01; code `src/**`, `migrations/**`, `docker/Dockerfile`, `.github/workflows/{ci,deploy}.yml`, `scripts/deploy/**`, `scripts/seed*.ts`.
- Verify (spec-validator tự chạy, HEAD 43e4614, Docker dev đang chạy):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **142 file / 1.539 test PASS** (có integration với DB thật: log "Pulling schema from database"; rentals, redirects, job-applications, private-file-download). Có cảnh báo `revalidatePath` ngoài Next trong test hook danh mục. Đây là hành vi đã biết và có chủ đích.
  - `pnpm build`, `next start` + curl, trình duyệt, ssh server: **không chạy** (theo phạm vi brief). Các mục này lấy theo evidence của builder/primary trong task file và journal.
  - `git status --short` trước/sau: chỉ `.claude/launch.json` và `.context/runs/build-tami-website-layer-6-validate.md` (untracked, của primary).

## Verdict: ✅ COMPLETE (PASS), kèm 3 gap LOW và mục reconcile doc

Tổng cộng **59 AC đã cam kết**. Chia ra: T01 (16), T02 (7), T03 (4), T04 (4), T05 (5), T06 (8), T07 (3), T08 (4), T09 (5), T10 (3). Ngoài ra còn các follow-up gắn vào task: G15 (a)(b), G17, G18, G20, G21, G22, G24, G25 và L6-T03→T05/06/07/08. Kết quả:

- **50 AC đạt đầy đủ**, có code + test hoặc evidence chạy thật.
- **8 AC của L6-T01 đạt một phần hoặc hoãn hẳn.** Tất cả đều nằm trong các ngoại lệ user đã duyệt: staging sslip.io không Cloudflare, staging không backup, không báo động tới M3, hoãn diễn tập rollback. Mỗi phần chưa làm đều có checkbox ở task nhận: `layer-12-task-01.md:115-123` hoặc `layer-15-task-01.md:175-180`. Không có phần nào bị bỏ rơi.
- **1 AC đạt kèm lệch nhỏ:** T05 "JSON-LD Organization" (G26, LOW).

Reviewer PASS cho cả 10 task. Mức review: STRICT cho T02/T03/T09/T10 và phần A của T01. T04/T05/T06/T07/T08 được review ở mức STRICT dù task đề NORMAL. Phần B của T01 qua NORMAL round 6.

Không có [MISSING] so với AC. Không có conflict mức HIGH giữa code và intent docs. Intent docs (SPEC, BRD, design-spec) không bị hạ cấp cho khớp code: các lệch đều được ghi ở as-built hoặc decision log. Gap layer 5 (G15–G25) đều đã đóng hoặc đã chuyển đúng chỗ (xem mục "Gap layer 5").

## Coverage matrix

### layer-6-task-01: Deploy staging (staging tạm `https://187-52-119-50.sslip.io`)

| # | AC (dòng task) | Status | Evidence / nơi nhận |
|---|---|---|---|
| 1 | L47 runbook `siteName` trước khi publish privacy; lỗi rõ; `seed-sample-services` chặn production | ✅ | `src/hooks/pages/sync-privacy-version.ts:6,26` (APIError 400 rõ) + test `pages-hooks.test.ts:54-69`; `scripts/seed-sample-services.ts:7`; `docs/runbooks/deploy.md:263` |
| 2 | L48 G10 báo động + đối chiếu `budget.ts` | ✅ quyết định / [→] | G10: user chọn không báo động tới M3 (`progress.json:448-450`), giám sát bật ở L12-T01 (phụ thuộc L4-T06). `budget.ts` chuyển `layer-15-task-01.md:179` |
| 3 | L49 backup lần đầu | [→] user duyệt | Staging không backup (`progress.json:443-445`); đủ chi tiết L49 chuyển `layer-15-task-01.md:178` |
| 4 | L50 rollback qua symlink `current` + assert; init.sql không recreate; required reviewers; nhánh mặc định; secret DEPLOY_* | ✅ | `scripts/deploy/lib/release.sh:48-50`; `deploy.test.sh:149-152`; postgres Created 06:25:55Z giữ nguyên qua b936204 (task :89); nhánh mặc định = staging + required reviewers (journal :46, :49; runbook `:33-42`) |
| 5 | L51 pin action theo SHA | ✅ | `ci.yml:66,71,73`, `deploy.yml:44,53,55,65` |
| 6 | L52 / G20 `seed/` trong image | ✅ | `docker/Dockerfile:73-74`; seed nền chạy trên staging (journal :49) |
| 7 | L53 `nginx -v`, `docker version`; Origin Pulls; 2 IP qua Cloudflare | ✅ phần server / [→] | nginx 1.24, Docker 29.7 (task :88); 2 IP qua X-Real-IP: A 429, B 400 (task :86). Origin Pulls + 2 IP qua Cloudflare chuyển `layer-15-task-01.md:176` |
| 8 | L54 cache rule Cloudflare `/api/*` | [→] | `layer-15-task-01.md:176` |
| 9 | L55 cache rule Cloudflare cho biến thể RSC | [→] | `layer-15-task-01.md:176`; origin vẫn trả `no-store` (ARCH §5.1 `:169`) |
| 10 | L56 ⏸ xác nhận mỗi bước chạm server | ✅ | journal :38-57 (mỗi bước có xác nhận của user) |
| 11 | L57 compose `tami-staging-*`, chỉ app bind `127.0.0.1:3011` | ✅ | task :85; journal :49 |
| 12 | L58 `nginx -t` rồi reload; chỉ nhận IP Cloudflare; không sửa site khác | ✅ / [→] | `nginx -t` PASS, site khác vẫn 200 (journal :38-39). Phần "chỉ nhận IP Cloudflare" chuyển `layer-15-task-01.md:177` |
| 13 | L59 DNS/SSL/Access Cloudflare; noindex + robots | ✅ thay thế / [→] | basic auth + `X-Robots-Tag: noindex, nofollow, noarchive` + `Disallow: /` (task :85; runbook §9 `:258`). Phần Cloudflare chuyển L15. Đạt SPEC § Deployment "staging chặn truy cập công khai + noindex" |
| 14 | L60 CD chạy thật + thử rollback | ✅ / [→] | CD b936204: image digest → migrate (19 migration) → app + jobs → health 200 (journal :49). Diễn tập rollback chuyển `layer-12-task-01.md:118` (user, `progress.json:458-460`). Tạm dựa `deploy.test.sh` PASS |
| 15 | L61 seed nền + `--sample` chỉ ở staging; email chỉ tới allowlist | ✅ | journal :49-51 (34 tỉnh, 3.321 phường/xã, 11 danh mục, 2 pages; mẫu 6 dự án / 2 tin cho thuê / 4 tin tuyển dụng); `seed-run.ts:11` chặn ở production |
| 16 | L62 các trang đã có mở được | ✅ phần lớn / [→] | `/`, `/en`, `/du-an`, chi tiết, `/en/projects`, `/tin-tuc`, `/tuyen-dung`, `/lien-he` 200 (task :87). Trang pháp lý/dịch vụ là bản nháp seed → 404 đúng. Phần publish + kiểm chuyển `layer-12-task-01.md:122` |
| F | G17 `NEXT_PUBLIC_HOTLINE` build-arg | ✅ code / [→] | `Dockerfile:40-42`, `deploy.yml:75`. Biến repo chưa đặt → `layer-12-task-01.md:121` |
| F | G18 importMap drift | ✅ | `ci.yml:128-132` |
| F | G18 source map GlitchTip thật | [→] | `layer-12-task-01.md:123` |
| F | G21 migrate trên DB trống trong CI | ✅ | `ci.yml:85-93` (DB `tami_migrate` riêng); CD đã apply đủ 19 migration trên DB staging trống. Index kiểm qua test `news-migration` (T06). Xem G28 |
| F | G24 chỉ kiểm trang đã build; lần deploy đầu không rollback | ✅ | task :87, :92 |
| F | L6-T09 `TRUST_CF_CONNECTING_IP` | ✅ thay thế / [→] | staging dùng `TRUST_X_REAL_IP=true` (ARCH `:284-285`, runbook §9.3); phần Cloudflare chuyển `layer-15-task-01.md:176` |
| F | L6-T07 bản đồ `/lien-he` trên staging | [→] | site-settings chưa có `mapLocation` → `layer-12-task-01.md:119` |

FR/NFR liên quan: NFR-10 (staging tách biệt production + CI/CD): ✅. Staging dùng env và DB riêng (`/opt/tami/staging.env`, `tami-staging-postgres`). Production chưa có env, nên việc kiểm "khác DB production" chuyển `layer-15-task-01.md:180`.

### layer-6-task-02: `rentals`

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | G12 allowlist | ✅ | reviewer r2; `public-queries.ts`/`allowlist.ts` |
| 2 | Đủ trường ERD §4.6 + `rentalTerms` | ✅ | migration `20261017_143212_rentals.ts` (bảng `rentals_rental_terms_included_services` `:196-197`); ERD §4.6 as-built `:275-284` |
| 3 | `code` theo sequence, chỉ đọc, không trùng khi song song | ✅ | `CREATE SEQUENCE rentals_code_seq` `:8`, UNIQUE `rentals_code_idx` `:198`; ERD `:275`; test 20 tin song song (task :69) |
| 4 | publish cần ≥ 3 ảnh; giá bắt buộc trừ khi thoả thuận | ✅ | integration rentals (33 test, DB thật) |
| 5 | `rented` → `rentedAt` | ✅ | như trên |
| 6 | `searchText` localized gồm `legacyNames[].name` | ✅ | ERD `:282`, `:582`; follow-up L2-T02 đóng |
| 7 | 5 index + GIST + UNIQUE `(_locale, slug)` | ✅ | migration `:214`, `:256-261` |
| F | G22 ward ∈ province + validator upload mặc định | ✅ | `src/fields/ward-in-province.ts` (dùng chung cho Rentals và Projects, ARCH `:174`) |

FR-ADM-02, BR-01, BR-04, LGL-02: phần dữ liệu ✅. Trang ở L7-T03 và L8-T03. `searchText`/address/location ẩn với khách (MAJOR-1 r1 đã sửa), khớp API_SPEC §3.3 `:111`. `down` đã dùng `DROP CONSTRAINT IF EXISTS` (`:282`), không lặp BL-003.

### layer-6-task-03: Redirect 301 + 404 SSR

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Đổi slug vi/en của bài đã published → redirect; bản nháp không tạo | ✅ | `src/hooks/create-slug-redirect.ts`; ARCH §5.1 `:172` (2) |
| 2 | Không chuỗi, không vòng | ✅ | cập nhật A→C, xoá redirect trùng URL công khai; khoá `pg_advisory_xact_lock` |
| 3 | URL cũ trả 301 | ✅ | `src/proxy.ts` → `resolveRedirect` trước next-intl; curl `next start` 301 + `Location` giữ query (task :62). Open redirect (M1 r1) đã chặn bằng `isSafeInternalPath` |
| 4 | Chỉ admin xem/sửa `redirects` | ✅ | `collections/redirects-plugin.ts` (ARCH `:172`) |
| F | G15 (a) 404 HTML server có nội dung; (b) tra redirect trước `notFound()`; locale sai; R16 note ARCH | ✅ | `src/app/global-not-found.tsx`, `experimental.globalNotFound`, rewrite `/__not-found__/:segment`; curl `/khong-ton-tai` `<h1>Không tìm thấy trang` `lang="vi"`, `/en/...` `lang="en"`, `/wp-login.php` 404 có nội dung (task :62); ARCH §5.1 `:172` |

BR-05, FR-PUB-15 (redirect): ✅. API_SPEC §5 `:193` và ERD §3 `:108` đã reconcile.

### layer-6-task-04: Danh sách dự án (S02)

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Bộ lọc trên URL; `/en` chỉ dự án `hasEnglish` | ✅ | `parseProjectFilters`, `findPublicList` (ARCH `:173`) |
| 2 | Thẻ: link phủ thẻ, badge, `line-clamp-2` | ✅ | reviewer r2 |
| 3 | Meta + breadcrumb + trạng thái trống | ✅ | lọc → `noindex, follow` + canonical `/du-an` (design-spec S04 `:355`) |
| 4 | Responsive 375/768/1280 | ✅ | trình duyệt `next start` :3226 (task :63) |
| F | Mẫu dự án có ảnh + published | ✅ | 6 WebP CC0 94 KB (`seed/sample/images/README.md`), theo quyết định user `progress.json:418-420` |

Đã bỏ route `/du-an/danh-muc/[category]` theo user (`progress.json:433-435`). Việc này khớp design-spec S05 `:359-362`: S05 chỉ áp cho Cho thuê, Đăng tin BĐS, Tin tức. Lệch được chấp nhận: chip là link có `aria-current` thay vì `button[aria-pressed]`, và chưa có skeleton. Hai điểm này đã ghi ở task :65.

### layer-6-task-05: Chi tiết dự án (S03)

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Không có EN → 404 EN; slug cũ → 301 | ✅ | `MISSING_PAGE_RULES` `/du-an/[slug]`; curl (task :65) |
| 2 | Ảnh LCP `priority`; bản đồ lười; PDF mở tab mới | ✅ | ARCH `:174` |
| 3 | Vùng `LeadFormSlot` | ✅ | ARCH `:174` |
| 4 | JSON-LD Organization/breadcrumb; meta + OG | ⚠️ lệch nhỏ | `RealEstateListing` + `BreadcrumbList` + OG 1200×630 ✅. **Trang chi tiết không có Organization**: G26 |
| 5 | Đúng một `h1` | ✅ | task :65 |
| F | refCollection/refId, beacon `text/plain` (G18), validator upload mặc định, ward∈province, placeholder khi mất ảnh, 404 có nội dung | ✅ | API_SPEC §3.4 `:117`; ARCH `:174` |

### layer-6-task-06: Tin tức (S10, S05, S11)

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Test `news_list_idx` sau migration thật | ✅ | `news-migration` chạy migration trên DB tạm (task :66) |
| 2 | Test category trong thùng rác + quyết định UX khôi phục | ✅ | reviewer r1 |
| 3 | G14 `revalidatePath` trúng cache Next thật | ✅ | PATCH → request kế tiếp MISS rồi HIT có nội dung mới (ARCH `:175` (2)) |
| 4 | G13 sửa `categories` làm mới trang danh mục | ✅ | `src/hooks/categories/revalidate-category.ts` (ARCH `:175` (3)) |
| 5 | RichText không render HTML tuỳ ý; link ngoài `noopener` | ✅ | allowlist node, `rel="noopener noreferrer"` |
| 6 | Bài liên quan cùng danh mục, tối đa 3, loại bài hiện tại | ✅ | ARCH `:175` (4) |
| 7 | JSON-LD `Article` có `inLanguage` | ✅ | `json-ld.ts:113-130` |
| 8 | Không có form lead | ✅ | SPEC F5 |
| F | G18 test `CategoryListTemplate`; 404 có nội dung (proxy) | ✅ | `resolve-missing-page.ts` |

Phạm vi thêm: trang S05 `/tin-tuc/danh-muc/[category]`. Trang này đúng design-spec `:362`.

### layer-6-task-07: Dịch vụ (S14), Liên hệ (S15), Pháp lý (S16)

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Pháp lý route theo `kind`, có `version` + `effectiveDate`, EN chỉ khi `hasEnglish` | ✅ | `chinh-sach-bao-mat/page.tsx`, `dieu-khoan-su-dung/page.tsx`; `MISSING_PAGE_RULES` (ARCH `:176` (1)) |
| 2 | Liên hệ: hotline, email, địa chỉ, bản đồ lười từ `mapLocation`, `LeadFormSlot` | ✅ code / [→] kiểm bằng mắt | test ẩn bản đồ khi thiếu `mapLocation`; sửa worker MapLibre (`scripts/copy-maplibre-worker.mjs`). Hiển thị thật chuyển `layer-12-task-01.md:119` |
| 3 | Dịch vụ: hero `coverImage`, banner CTA | ✅ | ARCH `:176` (5) |

FR-PUB-10/11/14: ✅. Phần form của FR-PUB-11 làm ở L10-T01. Không có trang danh sách `/dich-vu`. Điều này khớp BRD `:94,:113` (chỉ có `/dich-vu/[slug]`).

### layer-6-task-08: Tuyển dụng (S12, S13)

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Danh sách lọc `deadline ≥ hôm nay (giờ VN)` | ✅ | `src/lib/careers/deadline.ts`, `job-queries.ts` (ARCH `:177` (1)(2)) |
| 2 | Chi tiết hết hạn: băng, ẩn form, `noindex`, không JSON-LD | ✅ | curl APP_ENV=production (task :65); khớp SPEC F6 `:64` |
| 3 | Còn hạn: JobPosting (lương, `validThrough`, `inLanguage`), `ApplyFormSlot` | ✅ | `validThrough …T23:59:59+07:00` |
| 4 | `close-job-postings` chỉ revalidate, không đổi status | ✅ | `src/jobs/close-job-postings.ts`; migration `20261017_175237` chỉ `ADD VALUE` enum (không phải HIGH_RISK) |
| F | G25 `category` tuỳ chọn; G24 mẫu tuyển dụng published; helper deadline dùng chung | ✅ | `scopedCategoryField("job", { required: false })`; seed 4 tin published (ARCH `:177` (4)(6)) |

Giới hạn đã biết: revalidate từ tiến trình jobs không tác động tới cache Next. Trang vẫn đúng nhờ ISR 60 s và danh sách dynamic. Đã ghi task :67 và để L7-T01 chọn cơ chế.

### layer-6-task-09: `POST /api/public/job-applications`

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | Thứ tự rate limit → Turnstile → zod (consent) → tin published + còn hạn | ✅ | API_SPEC §3.2 as-built `:91` |
| 2 | CV PDF/DOC/DOCX ≤ 5 MB, MIME thật (415/413), tên ngẫu nhiên | ✅ | magic bytes `inspectUpload`; curl body > 5 MB → 413 |
| 3 | `consentAt`, `consentVersion`, `locale`, `ipHash` | ✅ | BR-30 |
| 4 | Enqueue email tới `notificationEmails` | ✅ | template `job-application` (BR-21). Lệch tên file template đã ghi task :66 |
| 5 | 200 `{success, data:{received:true}}`; lỗi theo `locale` | ✅ | `job-application-messages.ts`; G3 (giữ chữ "captcha") đóng: `job-applications.ts:58,75` |

### layer-6-task-10: Tải CV

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | 401 → 403 → 404 → stream `attachment`, `no-store` | ✅ | API_SPEC §4 as-built `:179`. Thêm 400 cho id không phải UUID, và trả 403 trước khi tra id để chống dò. Không lệch intent |
| 2 | Audit `application.view_cv` mỗi lần tải | ✅ | fail-closed (audit lỗi thì huỷ stream, trả 500) |
| 3 | Sale/khách 401/403; không có URL công khai tới file | ✅ | `/api/private-files/file/:name` → 404 |

FR-ADM-05, PERMISSION §3.3/§5/§6, NFR-04: ✅. `@aws-sdk/client-s3` ban đầu bị khai là devDependency nên image prod thiếu (lỗi lộ ra ở CD lần đầu). Đã sửa ở b936204 và có test chặn import runtime ngoài `dependencies`.

## Gap layer 5 (G15–G25) giao cho layer 6

| Gap | Trạng thái | Evidence |
|---|---|---|
| G15 404/500 HTML server rỗng | **Đóng** cho URL không khớp route và cho mọi trang chi tiết/danh mục đã có (proxy `MISSING_PAGE_RULES`) | L6-T03 + T05–T08. Giới hạn còn lại đã ghi ARCH `:172`, `:175`: `notFound()` ném từ page (vd `?page=99`) vẫn ra shell rỗng. Trang động tương lai chưa gắn follow-up: G27 |
| G16 doc click-events | **Đóng** | API_SPEC §3.4 `:124-130` |
| G17 hotline build-arg | **Đóng phần code**; kiểm thật → L12-T01 `:121` | |
| G18 test CategoryListTemplate | **Đóng** (L6-T06) | |
| G18 beacon `text/plain` | **Đóng** (L6-T05) | API_SPEC `:117` |
| G18 CI importMap | **Đóng** | `ci.yml:128-132` |
| G18 `e2e:revalidate` vào CI | Mở, đã gắn | `layer-12-task-01.md:112` |
| G18 source map GlitchTip thật | Mở, đã gắn | `layer-12-task-01.md:123` |
| G18 design debt header / Debian 11 | Mở, đã ghi | BL-001, BL-002 (`BACKLOG.md:11-12`), chờ user |
| G18 Notes L15 → AC | **Đóng** | `layer-15-task-01.md:102,105` là checkbox |
| G19 | Đóng (addendum) | |
| G20 seed trong image | **Đóng** | `Dockerfile:73-74` |
| G21 migrate DB trống | **Đóng** | `ci.yml:85-93`; CD staging chạy đủ 19 migration trên DB trống |
| G22 rentals/projects | **Đóng**; property-posts đã gắn | `ward-in-province.ts`; `layer-7-task-01.md:102` |
| G23 cách ẩn danh | Mở, đã gắn | `layer-9-task-06.md:101`, `layer-8-task-02.md:105` |
| G24 | **Đóng** | task L6-T01 :87, :92; L6-T08 seed published |
| G25 | **Đóng** (user chọn theo ERD) | L6-T08; ERD §4.10 |
| BL-003 `down` | **Đóng** trước khi lên staging | 71f1be6; `BACKLOG.md:13` done |
| R4 `/brainstorm secrets` | **Vẫn mở, dài thêm** | `project-config.md:117` còn thiếu `APP_ENV`, `NEXT_PUBLIC_HOTLINE`, `GLITCHTIP_*`, `METRICS_TOKEN`, `EMAIL_ALLOWLIST`, `TRUST_X_REAL_IP`, `TRUST_CF_CONNECTING_IP` (đều có trong ARCH §6 / runbook §9). Cần user |
| R14/R18 ARCH §4 | **Vẫn mở** | R21 |
| R18 ERD | **Vẫn mở** | `ERD.md:154` ("array of text"), `:568` (câu chung về partial index) |

## Gaps (mới) và task đề xuất nhận

### [PARTIAL] G26 LOW: AC L6-T05 "JSON-LD Organization" không có trên trang chi tiết dự án; căn cứ PASS của reviewer không đúng
- Reviewer L6-T05 r1 (`build-tami-website-layer-6-task-05-round-1-review.md:73`) ghi rằng Organization "met by the site-wide Organization JSON-LD (L5-T08)". Grep `buildOrganizationJsonLd` cho thấy hàm này **chỉ** được dùng ở `src/app/(frontend)/[locale]/lien-he/page.tsx:90`. Hiện **không có** Organization JSON-LD dùng chung toàn site. `buildRealEstateListingJsonLd` (`src/lib/seo/json-ld.ts:74-100`) cũng không có node Organization.
- Mức độ thấp vì intent vẫn được phủ: design-spec S03 `:331` chỉ yêu cầu `RealEstateListing` + `BreadcrumbList`. SPEC F11 `:79` / FR-PUB-15 yêu cầu site có Organization: đã có ở `/lien-he`, và trang chủ sẽ có (`layer-9-task-01.md:45`).
- **Đề xuất:** primary sửa ghi chú Feature Verification của L6-T05 thành "Organization: theo S03 không bắt buộc trên S03; site có ở `/lien-he` và L9-T01". Cách khác (tuỳ chọn, rẻ): thêm `provider`/`seller` Organization vào `RealEstateListing` khi làm L7-T03 (dùng chung builder). Không cần user.

### [PARTIAL] G27 LOW: follow-up "404 có nội dung qua `MISSING_PAGE_RULES`" chưa gắn cho các trang động sau layer 6
- ARCH §5.1 `:175` ghi quy ước "trang chi tiết mới THÊM quy tắc ở đây", nhưng hiện chỉ `layer-7-task-03.md` có follow-up này (Grep). Còn thiếu ở các task sau:
  - `layer-8-task-03` (S04 + trang danh mục S05 `/cho-thue/danh-muc/[category]`)
  - `layer-8-task-04` (S08/S09 + S05 `/tin-bds/danh-muc/[category]`, chi tiết `/tin-bds/[slug]`)
  - `layer-13-task-03` (S06 `/cho-thue/khu-vuc/[province]`)
- Nếu bỏ sót, slug lạ hoặc danh mục chưa có bản EN sẽ quay lại lỗi shell `__next_error__` rỗng (G15).
- **Đề xuất:** primary gắn vào 3 task trên mục follow-up giống `layer-6-task-05.md:108-109`, kèm curl làm bằng chứng. Không cần user.

### [PARTIAL] G28 LOW: CI migrate trên DB trống chỉ kiểm "không lỗi", chưa kiểm số migration/index
- `ci.yml:85-93` chạy `pnpm payload migrate` trên `tami_migrate` nhưng không kiểm `migrate:status` (19/19) và không kiểm `\di` (các `*_list_idx`, GIST). Hiện chỉ có `news_list_idx` được test qua `news-migration` (L6-T06). G21 gốc đề xuất kiểm thêm index.
- **Đề xuất:** thêm một bước `psql … -c "select indexname from pg_indexes where indexname in (…)"` (có danh sách đối chiếu) vào `layer-15-task-01` hoặc task CI kế tiếp. Không chặn. Không cần user.

## As-built doc cần reconcile (LOW, không chặn)
- **R20: Vệ sinh task file layer 6.**
  - (a) `layer-6-task-01.md`: cả 16 AC (`:47-62`) và các follow-up (`:130-143`) vẫn là `[ ]`, dù Feature Verification `:84-92` ghi Done/hoãn. DoD "Committed" `:114` cũng còn `[ ]`, trong khi HEAD 43e4614 đã có commit đóng. Nên đánh `[x]` cho mục Done và `[→ L12/L15]` cho mục hoãn, để người đọc sau không tưởng còn việc treo.
  - (b) Cả 10 task còn "Spec Validator verdict (layer close): pending" (T01:96, T02:72, T03:65, T04:67, T05:68, T06:70, T07:67, T08:68, T09:68, T10:62).
  - (c) T01 Decision impact `:18,:120` ghi sẽ ghi `.context/decisions.md`, nhưng file này không có quyết định sslip.io/basic auth/không backup (Grep "sslip" rỗng). Quyết định chỉ nằm ở `progress.json:438-460`, ARCH `:291` và runbook §9. Nên thêm "Decision 5" hoặc sửa chữ của task.
  - (d) T04 Retry `:56-57` có hai dòng "Last failure type".
- **R21: ARCH §4 cây thư mục** (`ARCHITECTURE.md:86-137`) chưa có phần layer 6 thêm vào: `src/endpoints/admin/` (private-file-download); `components/{projects,news,careers,content}/` (RichText); `lib/careers/`, `lib/projects/`; `hooks/rentals/`; `fields/ward-in-province.ts`; `collections/redirects-plugin.ts`; dòng `:126` của `proxy.ts` chưa nêu tra redirect và `resolve-missing-page`; `scripts/copy-maplibre-worker.mjs`, `generate-sample-images.mjs`, `seed.mjs`/`seed-run.ts` (tồn từ R18); `seed/sample/` + `images/`; `docker/nginx/tami-staging-sslip*.conf` (`:134`). Gộp với phần ARCH của R18.
- **R18 (ERD), tồn từ addendum:** `ERD.md:154` đổi kiểu thành mảng `{ name }`; `:568` thêm "as-built: các index danh sách hiện không partial".

## Residual risk của lần validate này
- Không chạy `pnpm build`, `next start`/curl, trình duyệt, ssh. Các khẳng định về HTTP status, header cache, HTML server 404 và trạng thái staging dựa vào evidence của builder/primary (task file, journal) và reviewer. Mục tồn lúc đóng layer ở L6-T06 :69 ("curl `-I /tin-tuc?page=2` có `public, s-maxage=60`") **chưa được đo lại**. Suy luận gián tiếp: `/du-an` và `/tuyen-dung` cũng là `force-dynamic` và đã đo được `public, s-maxage=60, stale-while-revalidate=300` từ cùng rule `next.config.ts` (L6-T04 :63, L6-T08 :65), nên rủi ro thấp.
- Staging đang dùng giá trị **tạm**: Turnstile khoá TEST (captcha luôn qua), SMTP giả `smtp.invalid`, `EMAIL_ALLOWLIST` = email user (journal :40). Đã gắn `layer-12-task-01.md:115`. Trước khi thay, staging không chứng minh được luồng form/email thật.
- `pnpm seed --sample` lần đầu trên staging exit 1, chưa rõ nguyên nhân. Đã gắn điều tra ở `layer-12-task-01.md:120`.
- Job production của CD đỏ hoặc chờ duyệt mỗi lần deploy cho tới khi có env production. Điều này đã biết (journal :49) và không ảnh hưởng staging.
- Chưa có diễn tập rollback image trên server thật. Hiện chỉ dựa vào `deploy.test.sh` (user duyệt hoãn).
- Không đọc toàn văn `Rentals.ts`, `proxy.ts`, `resolve-missing-page.ts`, `job-applications.ts`, `private-file-download.ts` và các page mới. Các dòng ma trận dựa trên Grep/Read có chọn lọc, test PASS hôm nay, reviewer round cuối và ARCH as-built.

## Cần user quyết trước layer 7
Không có quyết định nào **chặn** layer 7: checkpoint layer 6 là tự sang layer kế. Các mục còn treo:
1. **R4: `/brainstorm secrets`.** Danh sách env trong `project-config.md:117` lệch so với thực tế, thiếu 7+ biến (đã liệt kê ở bảng gap). Việc này đã treo từ layer 4.
2. **BL-001** (nợ thiết kế header/footer) và **BL-002** (image Debian 11 hết hỗ trợ). Đang `blocked` chờ user chọn thời điểm.
3. **Tên miền thật cho production** (cần trước M5, `layer-15-task-01.md:176`). Không gấp cho layer 7, nhưng là đường găng của production.
4. Chuẩn bị cho L12-T01 (không gấp): Brevo SMTP + Turnstile thật cho staging, repository variable `NEXT_PUBLIC_HOTLINE`, toạ độ `mapLocation`, publish 2 trang pháp lý trên staging.

Primary tự xử lý, không cần user: G26, G27, G28, R18, R20, R21.

## Tóm tắt cho user

**Layer 6 đã có gì (10/10 task):**
- **Staging chạy thật** tại `https://187-52-119-50.sslip.io` (có mật khẩu, chặn Google). Mỗi lần đẩy code lên nhánh `staging`, hệ thống tự build, chạy migration, khởi động và kiểm tra sức khoẻ. Đã có dữ liệu địa giới, danh mục và dữ liệu mẫu.
- **Cho thuê** trong admin: mã `CT-000001` tự sinh, cần ít nhất 3 ảnh để xuất bản, tìm được theo tên phường cũ. Địa chỉ chính xác không lộ cho khách.
- **Link cũ tự chuyển (301)** khi đổi đường dẫn bài. Trang 404 có nội dung đúng ngôn ngữ ngay cả khi không chạy JavaScript.
- **Trang công khai:** Dự án (danh sách + chi tiết), Tin tức (danh sách, theo danh mục, chi tiết), Dịch vụ, Liên hệ (chưa có form), 2 trang pháp lý, Tuyển dụng (tin hết hạn vẫn mở được nhưng có băng thông báo và ẩn form).
- **Nộp hồ sơ ứng tuyển** (CV riêng tư, chống spam, email báo admin) và **admin tải CV** (chỉ admin, có ghi nhật ký).
- Kiểm tra lại hôm nay: lint, typecheck và 1.539/1.539 test đều đạt.

**Đã hoãn theo quyết định của anh, đều đã có task nhận:** mọi thứ liên quan Cloudflare và production (L15), diễn tập rollback, kiểm bản đồ, số hotline trên trang lỗi, publish trang pháp lý trên staging, source map GlitchTip (L12).

**Anh cần biết hoặc quyết (không chặn layer 7):** `/brainstorm secrets` (danh sách biến môi trường đã lệch nhiều); BL-001/BL-002 làm khi nào; chuẩn bị tên miền thật trước khi lên production.
