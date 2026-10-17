Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 5 (round 1)

- Mode: Phase review (đóng layer, initial build). Checkpoint của layer: "không dừng hỏi user" (task file dòng 6). Mốc duyệt kế tiếp là M2 (sau L10, progress.json:327-332).
- Scope: `tasks/tami-website/layer-5-task-02,03,05,06,07,08.md`; commit 927b891 (T02), e157b77 (T03), 2607704 (T05), 2f9c5f7 (T06), 7f7f721 (T07), a614b3d (regen importMap), ccaa1d2 (T08). HEAD ccaa1d2.
- Ngoài scope: `layer-5-task-01` (projects) và `layer-5-task-04` (job-postings), cả hai bị chặn bởi `layer-2-task-02` (progress.json:243-247, decision :302-305). Không tính vào verdict. Ảnh hưởng phía sau ở G19.
- Nguồn đã đối chiếu: SPECIFICATIONS.md (F7 `:66-67`, F8 `:69-70`, F11 `:78-79`, F12 `:81-91`, NFR `:148-157`, Quy tắc biên `:167,170`, Deployment `:201`); docs/BRD.md LGL-03 `:246`; `.context/design-spec.md` §2.5 `:107`, §3.10 `:194-206`, S17 `:550-555`, S18 `:557-563`; docs/ARCHITECTURE.md §4 `:82-133`, §5.1 `:161-168`; docs/ERD.md §3 `:99-110`, §4.13 `:470`, §4.14 `:478-488`; docs/API_SPEC.md `:3`, §3.4 `:113-124`; `docs/diagrams/layer-plan.md:533-566`; `.context/progress.json`; report reviewer round cuối của 6 task; report spec-validation layer 4; code `src/**`, `migrations/`, `docker/**`, `.github/workflows/`; task file layer 6–15.
- Verify (Docker dev đang chạy, HEAD ccaa1d2, spec-validator tự chạy):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **99 file / 1029 test PASS** (có integration với DB thật: log "Pulling schema from database"). Vẫn còn cảnh báo deprecation `pg` "client.query() when already executing" (đã biết từ layer 2).
  - `pnpm build`: exit 0. Bảng route: `● /[locale]` (không có path con), `ƒ /[locale]/[...rest]`, `ƒ /robots.txt`, `○ /_not-found`. Sau build `git status` không đổi.
  - `pnpm e2e:revalidate`, trình duyệt, curl `next start`: không chạy lại. Lấy theo evidence của builder/primary trong task file và journal.
- Working tree: chỉ có `.claude/launch.json` và `.context/runs/build-tami-website-layer-5-validate.md` (journal của primary), cả hai untracked.

## Verdict: ✅ COMPLETE (PASS) cho 6 task đã làm, kèm gap phải gắn vào task trước khi chạy tiếp

**40/40 AC** của T02 (8), T03 (5), T05 (10, thêm 1 AC `[→]` đã trả về L4-T06 theo G11), T06 (5), T07 (6), T08 (6) có code và test hoặc evidence chạy thật. Reviewer PASS mức STRICT cho cả 6 task. Không có [MISSING] so với AC đã cam kết.

Có một AC đạt kèm điều kiện: **T06 AC5 (404/500 đúng ngôn ngữ)** chỉ đạt sau khi trang hydrate. HTML server là shell rỗng. Builder đã thêm cụm "(sau hydrate, xem Residual risk 1)" vào chữ của AC (`layer-5-task-06.md:42`). Mục này ghi thành G15 (MEDIUM), không làm verdict thành FAIL, vì status 404 và noindex đều đúng và S17/S18 không yêu cầu chạy được khi không có JS.

Không có conflict mức HIGH giữa code và intent docs. Có 5 gap mới (G15–G19), 1 trong số đó cần user quyết (G19), và một số mục reconcile as-built doc (R14–R17).

## Coverage matrix

### layer-5-task-02: `services` + `pages` + đồng bộ `privacyPolicyVersion`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | `slugField.beforeDuplicate` (chuyển từ T01) | review L4-T01 r2 MINOR-1 | ✅ | `src/fields/slug.ts:108-123`; test `services-pages.test.ts:206-231` (reviewer T02 r1) |
| 2 | G12: thêm vào `PublicCollectionSlug` và allowlist dịch | spec-validation L4 G12 | ✅ | `src/lib/content/public-queries.ts:11` (`services`, `pages`, `news`); `src/lib/translation/allowlist.ts:13,15` |
| 3 | G7: dùng `withContentDefaults` qua `omit`/`fieldAccess` | spec-validation L3 G7 | ✅ | `Services.ts:50` (`omit: author, isFeatured, publishedAt`); `Pages.ts:59-60` |
| 4 | `services` đủ trường ERD §4.9, `coverImage` bắt buộc khi published, chỉ admin ghi | FR-ADM-07, ERD §4.9 | ✅ | `Services.ts:38,42` |
| 5 | `pages.kind` unique, không đổi, không slug; `version`, `effectiveDate` | ERD §4.9b, FR-PUB-14 | ✅ | `Pages.ts:29,37-40`, `src/hooks/pages/lock-kind.ts` |
| 6 | `privacy` published → `site-settings.privacyPolicyVersion` | BR-30 | ✅ | `src/hooks/pages/sync-privacy-version.ts`; ERD §4.9b as-built (gỡ xuất bản thì giữ version) |
| 7 | `pages.hasEnglish` chỉ admin bật | PERMISSION §4 | ✅ (access) | `Pages.ts:60`. Checkbox vẫn readOnly trên UI admin, đã gắn `layer-10-task-02.md:37` |
| 8 | Seed 2 bản `pages` idempotent | AC | ✅ | builder chạy 2 lần: tạo 2 rồi bỏ qua 2 (T02:69) |

### layer-5-task-03: `news`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 9 | Duplicate: `slugs.en` sinh lại hoặc rỗng, `hasEnglish=false` | review L5-T02 MINOR-3 | ✅ | sửa `hasEnglishField` `beforeDuplicate` → false; test `news.test.ts` (T03:61) |
| 10 | G12 allowlist | L4 G12 | ✅ | `public-queries.ts:11`, `allowlist.ts:12`, `allowlist.test.ts:7-8` |
| 11 | Đủ trường ERD §4.8 | FR-ADM-04, ERD §4.8 | ✅ | `src/collections/News.ts`; ERD §4.8 as-built (`cover` R khi published, `tags` ở `news_texts`) |
| 12 | Index `(status, has_english, category_id, published_at DESC)` + UNIQUE `(_locale, slug)` | ERD §5 | ✅ | `migrations/20261017_093650_news.ts:157`; UNIQUE do Payload sinh. Test index trên DB thật đã gắn `layer-6-task-06.md:38` |
| 13 | Không thu lead | F5 (SPEC:61) | ✅ | test không có quan hệ leads (T03:61) |

### layer-5-task-05: khung trang công khai

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 14 | G14 (L4): e2e lưu header/footer → `/`, `/en` đổi ở lần tải đầu | spec-validation L4 G14 | ✅ (chạy tay) | `tests/e2e/revalidate-globals.ts`, 9/9 PASS hai lần (T05:71). Không nằm trong `pnpm test`/CI, xem G18 |
| 15 | Bỏ lookbehind trong `scrub-text.ts` | L3-T01 MINOR-1 | ✅ | test cấm `(?<` (T05:72) |
| 16 | Logger lọc tham số `%s/%d`, SĐT dạng ngoặc | L3-T01 MINOR-2/3 | ✅ | T05:73, :80. Giới hạn còn lại (full-width, cắt 4096) gắn `layer-15-task-01.md:40` |
| 17 | Upload source map GlitchTip | L3 follow-up | ✅ (chưa chạy với GlitchTip thật) | `scripts/upload-sourcemaps.mjs`, `next.config.ts`, `docs/runbooks/deploy.md` §8 |
| 18 | Prometheus scrape app | — | [→] trả về L4-T06 | G11 layer 4, `layer-5-task-05.md:42` |
| 19 | Menu 7 mục, không "Mua bán" | FR-ADM-08, design-spec §2.1 | ✅ | `messages/*.json` `layout.nav.items`; ARCH §5.1:167 |
| 20 | Menu ngang chỉ ≥ xl; < xl menu toàn màn hình (bẫy focus, Esc, khoá cuộn) | design-spec §2.1-2.2 | ✅ | `MobileMenu.tsx` (Radix Dialog); đo `body[data-scroll-locked]` (T05:78) |
| 21 | Nút tìm kiếm → `/cho-thue?q=` · `/en/for-rent?q=` | F3 (SPEC:55) | ✅ (link 404 tới khi có trang Cho thuê) | T05:76, :91. Xem G19 |
| 22 | Global thiếu EN → menu cố định `en.json` | SPEC Quy tắc biên :167 | ✅ | ARCH §5.1:167; `load-shell.ts:66` (copyright); RTL test |
| 23 | LanguageSwitcher ở header/menu/footer, ghi `NEXT_LOCALE` phía client | FR-PUB-19, F12 :82 | ✅ (tạm về trang chủ) | Map trang tương ứng ở L10-T03 |
| 24 | Skip link đầu tiên, landmark | NFR-07, design-spec §1.4 | ✅ | `PublicShell` (skip link → header → `main#main` → footer) |
| 25 | Responsive 375/768/1280, link "Cài đặt cookie" | NFR-07 | ✅ | primary đo 375/768/1280; touch target ≥ 44 (T05:81) |

### layer-5-task-06: thành phần trang dùng chung + 404/500 + G2

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 26 | Nút nổi Hotline/Zalo/Fanpage từ site-settings, sendBeacon đúng body, không đè banner | FR-PUB-12, F8, design-spec §2.5 | ✅ | `FloatingContact.tsx:35-101`, `var(--floating-bottom-offset)` `:46`; test giải mã Blob. Chưa gửi `refCollection/refId`, đã gắn `layer-6-task-05.md:96`, `layer-7-task-03.md:98` |
| 27 | Breadcrumb + JSON-LD `BreadcrumbList` | FR-PUB-15 | ✅ | `Breadcrumb.tsx:31,62` (chỉ render JSON-LD khi `getSiteUrl()` hợp lệ), `json-ld.ts:17-28` |
| 28 | Phân trang `aria-current`, link thật | design-spec §3.6 | ✅ | `Pagination.tsx:53-60` |
| 29 | Trạng thái trống có nút xoá bộ lọc | SPEC Quy tắc biên :170 | ✅ | `EmptyState.tsx:30-34` |
| 30 | 404/500 đúng ngôn ngữ, link về trang chủ ngôn ngữ đó | SPEC :170, S17, S18 | ✅ trên trình duyệt / ⚠️ HTML server | `not-found.tsx:9,17-46`, `[...rest]/page.tsx:7-9`, `error.tsx`, `global-error.tsx`. HTML server là shell `__next_error__` rỗng: **G15** |
| 31 | G2 (L2): `refCollection` giới hạn theo ERD, chặn `pagePath` `//`, `/\` | spec-validation L2 G2 | ✅ đóng | `click-events.ts:13-21`; `click-types.ts:10-22` (đối chiếu ở mục "Phán quyết 2") |

### layer-5-task-07: banner cookie + GA4

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 32 | Chưa chọn/từ chối → không gtag, không `_ga` | LGL-03 (BRD:246), design-spec §3.10:202 | ✅ | `CookieBanner.test.tsx:49-64` + trình duyệt |
| 33 | Đồng ý → gtag với `gaMeasurementId`; không có ID → không banner | §3.10:202 | ✅ | test `:66-72`, `:106-112` |
| 34 | Đổi `privacyPolicyVersion` → hỏi lại | §3.10:201, BR-30 | ✅ | `consent-cookie.ts:42` (`pv` so với version hiện hành); test `:92-97` |
| 35 | Rút lại → xoá `_ga*`, lần sau không GA4 | §3.10:203 | ✅ | test `:185-206` + trình duyệt |
| 36 | Banner client sau hydrate, overlay cố định, không bẫy focus; dialog modal | §3.10:204-205 | ✅ | `CookieBanner.tsx:113` (GA chỉ mount khi đã đọc cookie, sửa MAJOR-1 r1); test hydrate `:130-157` |
| 37 | HTML không đổi theo cookie | §1.5, ARCH §5.1 | ✅ | server snapshot `UNREAD`; `PublicShell.tsx:22-26` tính `showCookieSettings` từ site-settings, không đọc cookie |

### layer-5-task-08: nền SEO

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 38 | Rule RSC `no-store` cho `DOTTED_PATH_SOURCE`; sửa comment/test | review L4-T03 r3 MINOR-1/2 | ✅ | `cache-policy.ts:64-71` (reviewer T08 r2); ARCH §5.1:165 |
| 39 | URL tuyệt đối lấy lúc chạy (L3-T03 MINOR-8) | spec-validation L3 | ✅ | `site-url.ts:8,15-26` (khoá động, trả `undefined` lúc build); compose `NEXT_PUBLIC_SITE_URL` bắt buộc `docker-compose.{prod,staging}.yml:54` |
| 40 | Meta/OG fallback `metaTitle`→`title`, `metaDescription`→`summary/excerpt`, OG `seo.ogImage`→ảnh đại diện→mặc định | ERD §4.14:482-484 | ✅ | `metadata.ts:59-71,107` |
| 41 | hreflang vi/en/x-default chỉ khi `hasEnglish` | BR-07, F11 :79 | ✅ | `metadata.ts:85-95` |
| 42 | noindex khi `seo.noindex`/trang yêu cầu/staging | F3 :55, F6 :64, SPEC :201 | ✅ | `metadata.ts:98-119` (noindex theo nội dung vẫn `follow`; ngoài prod `nofollow`); layout `:28-34`; `robots.ts:7-11`; compose `APP_ENV` `:30` |
| 43 | JSON-LD hợp lệ, escape `</script>` | F11 :79 | ✅ | `json-ld.ts` (Organization, RealEstateListing, Article, JobPosting, BreadcrumbList, đều có `inLanguage` trừ Organization/Breadcrumb), `serializeJsonLd` `:174-176` |

FR/NFR do layer 5 phủ (một phần, theo kế hoạch): FR-PUB-12 (đủ phần nút + ghi lượt bấm), FR-PUB-14/FR-ADM-07 (dữ liệu), FR-ADM-04, FR-ADM-08 (hiển thị menu/footer), FR-PUB-15/NFR-03 (helper; trang thật nối ở L6+), FR-PUB-19 (tạm), LGL-03 (cookie), NFR-07 (khung). Phần còn lại của F11 (sitemap, `Sitemap:` trong robots, llms.txt) ở L8-T05; redirect 301 ở L6-T03.

## Phán quyết các mục được giao

### 1. 404/500 HTML server rỗng (L5-T06 residual 1) → G15, giao `layer-6-task-03`, không cần user quyết
- Hiện trạng: không có `src/app/layout.tsx`; root layout là `src/app/(frontend)/[locale]/layout.tsx` (Glob `src/app/**`). `notFound()` ở `[...rest]/page.tsx:8` và ở layout khi locale sai (`layout.tsx:44`) cho ra shell `__next_error__`. Nội dung đúng ngôn ngữ chỉ có sau hydrate. Status 404 và noindex (`not-found.tsx:9`) đúng.
- L5-T08 đặt `generateStaticParams() → []` (`layout.tsx:15-17`), `dynamicParams` mặc định true. Việc này **không sửa và không làm nặng thêm** lỗi này: locale vẫn render theo request, locale sai vẫn `notFound()` lúc chạy (reviewer T08 r2:44-46). Trên thực tế locale sai gần như không xảy ra vì `proxy.ts` coi mọi path không có `/en` là `vi`, nên `/xx` rơi vào `[...rest]`.
- Vì sao chọn L6-T03: task này sẽ "dùng resolve-redirect trong `not-found`/trang chi tiết" (`layer-6-task-03.md:16,87`) và có AC "URL cũ trả 301" (`:38`). Nếu tra redirect bên trong `not-found.tsx` khi shell lỗi đã gửi đi, Next sẽ chuyển hướng phía client chứ không trả HTTP 301. Như vậy BR-05 (301) sẽ không đạt. Hai việc này có chung gốc, nên làm cùng một task.
- Không cần user quyết: đây là quyết định kỹ thuật (đổi cấu trúc route), không đổi intent. S17/S18 không phải sửa. Chỉ cần user quyết nếu muốn **chấp nhận hành vi hiện tại vĩnh viễn**.

### 2. 11 tên collection trong `CLICK_REF_COLLECTIONS`: ✅ khớp ERD
- `click-types.ts:10-22`: `provinces, wards, categories, developers` + `projects, rentals, property-posts, news, services, job-postings, pages`.
- ERD §3 `docs/ERD.md:104-105`: nhóm "Danh mục nền" (4) + "Nội dung" (7). Trùng đúng 11 slug, không thừa, không thiếu. Collection khách hàng/file/hệ thống bị loại đúng.
- Comment trong code ghi "ERD §3" là đúng. Ghi chú task (`layer-5-task-06.md:99`) ghi "ERD §2" là sai số mục (§2 là sơ đồ quan hệ). Chỉ là chữ.
- Nhưng API_SPEC §3.4 và ERD §4.13 chưa ghi ràng buộc mới, xem G16.

### 3. L5-T07 lệch được chấp nhận (`pv`, footer mở dialog): ✅ nhất quán, không cần spec delta
- `design-spec.md:206` có note as-built đủ 3 ý: `pv`, footer mở thẳng dialog Tuỳ chọn, ẩn link khi không có GA ID (thêm ý `--floating-bottom-offset`). Khớp code `consent-cookie.ts:2-5,16,42,65-67`, `PublicShell.tsx:22-26`, `Footer.tsx:73-75`.
- Intent `design-spec.md:201` (`{v:1, analytics, ts}`) và `:203` ("Mở lại từ footer") không bị vi phạm. `pv` là trường thêm để thực hiện chính dòng :201 ("Đổi `privacyPolicyVersion` → hỏi lại"). Dialog Tuỳ chọn vẫn là "mở lại" lựa chọn.
- SPECIFICATIONS.md:37 chỉ ghi "banner đồng ý cookie; chỉ tải GA4 sau khi khách đồng ý", không ghi chi tiết cookie, nên không lệch. BRD LGL-03 `:246` cũng không bị lệch.

### 4. L5-T08: không prerender, robots, `getSiteUrl()` lúc chạy: ✅ ARCH as-built khớp code
- `ARCHITECTURE.md:166` khớp `layout.tsx:13-17,22,28-34`, `site-url.ts:8-31`, `robots.ts:7-11`, `src/app/robots.ts` (`ƒ` trong bảng build). Kết quả build hôm nay xác nhận `● /[locale]` không có path con.
- Chính sách robots khớp SPEC :201 ("Staging chặn truy cập công khai + noindex") và F11 :79. Ngoại lệ `/api/media/file/` khớp ARCH §5.3:197. Follow-up "giữ ngoại lệ khi thêm `Sitemap:`" đã gắn `layer-8-task-05.md:97-98`.
- Điều kiện vận hành: `APP_ENV` đặt cứng trong compose (`prod :30` = production, `staging :30` = staging), `NEXT_PUBLIC_SITE_URL` bắt buộc ở cả hai compose (`:54`). Dev không đặt `APP_ENV` thì noindex, đây là mặc định an toàn.
- Decision có trong `progress.json:311-315`. Test khoá `generateStaticParams → []` đã gắn `layer-15-task-01.md:104-105`.
- Hệ quả đã biết: request đầu sau deploy render lúc chạy, ISR cache theo container (ARCH §9.1, G9 đã chốt 1 bản app). Chấp nhận.

### 5. Mục env-blocked từ layer trước mà layer 5 dựa vào
- **Không còn mục nào chặn.** Decision "L2-T07 integration + migration env-blocked" (`progress.json:266-270`) đã được giải quyết từ layer 4. Lần chạy hôm nay có integration với DB thật (99 file PASS). Migration của layer 5 (`20261017_092524_services_pages` batch 11, `20261017_093650_news` batch 12) đã apply và kiểm drift trên DB dev (T02:69, T03:62).
- Còn **chưa kiểm trên môi trường thật** (không chặn layer 5, đều đã có task đích): apply migration L5 lên staging, CD/backup/Cloudflare thật (L6-T01); upload source map lên GlitchTip thật (T05 residual; không có AC riêng, xem G18); dữ liệu GA4 thật (L15-T01:48); `pnpm e2e:revalidate` chỉ chạy tay (G18).

## Follow-up từ report layer 4: trạng thái

| Mục | Trạng thái | Evidence |
|---|---|---|
| G2 (`refCollection` allow-list) | **Đóng** | ma trận #31 |
| G10 (giám sát hoãn, heartbeat backup) | Mở, đã gắn | `layer-6-task-01.md:48`; M1 duyệt với ghi chú (`progress.json:325`) |
| G11 (Prometheus về L4-T06) | **Đóng** | `layer-5-task-05.md:42` |
| G12 (allowlist) | **Đóng cho services/pages/news**; còn mở cho projects/job-postings/rentals/property-posts/homepage, đã gắn AC | L5-T01:38, L5-T04:38, L6-T02:38, L7-T01:40, L8-T01:41 |
| G13 (categories/developers revalidate) | Mở, đã gắn | L6-T06:41, L13-T04:35 |
| G14: e2e revalidate globals | **Đóng** | ma trận #14 |
| G14: quan sát revalidate nội dung trên Next thật | Mở, đã gắn | L6-T06:40 |
| G14: fallback EN `siteName/address/copyright` | **Đóng** | `load-shell.ts:66` (copyright → `en.json`); `address` localized, EN trống thì bỏ (`shell-data.ts:146-154`) |
| G14: 5 header lặp `tami-staging.conf` | Mở, đã gắn | L14-T01:41 |
| G14: bảng giá `budget.ts` | Mở, đã gắn | L6-T01:48 |
| G14: Debian 11 EOL | **Vẫn chưa ghi** | `spec/changes/BACKLOG.md` không có (Grep "Debian\|EOL" rỗng), xem G18 |
| R4 (`project-config.md` § Secrets) | **Vẫn mở, dài thêm** | `project-config.md:117` còn thiếu thêm `APP_ENV`, `NEXT_PUBLIC_HOTLINE`, `GLITCHTIP_*` (4 biến, `.env.example`), ngoài các biến đã nêu ở layer 4. Cần `/brainstorm secrets` |
| R10 (ARCH §4) | Một phần, **mở lại cho layer 5** | R14 |
| R12 (API_SPEC:3 "chưa có code") | **Vẫn mở** | `API_SPEC.md:3`; R15 |
| R13 (vệ sinh task L4) | Không kiểm lại | |

## Follow-up review layer 5: đã gắn đúng chỗ chưa

| Nguồn | Mục | Task đích | Trạng thái |
|---|---|---|---|
| L5-T02 MINOR-1/4 | runbook siteName trước publish privacy; guard seed prod | L6-T01:47 | ✅ |
| L5-T02 MINOR-2 | `hasEnglish` readOnly UI | L10-T02:37 | ✅ |
| L5-T02 MINOR-3 | test duplicate | L5-T03 AC1 | ✅ đóng |
| L5-T02 MINOR-5 | services làm mới trang chủ; FR-ADM-16 loại trừ services/pages | L8-T01:40 | ✅ |
| L5-T03 MINOR-1 | Duplicate giữ nhóm `translation` | L9-T07:47 | ✅ |
| L5-T03 MINOR-2/3 | test index trên DB thật; nhánh category trong thùng rác | L6-T06:38-39 | ✅ |
| L5-T03 MINOR-4 | gom validator ảnh bìa | L7-T01:39 | ✅ |
| L5-T05 r2 MINOR-1/4 | Esc menu con khi hover | L14-T02:42 | ✅ |
| L5-T05 r2 MINOR-2/3 | scrubText full-width, cắt 4096 | L15-T01:40 | ✅ |
| L5-T05 decision log | header 2 hàng, ctaButton/logo CMS, footer accordion | chỉ ở decision log T05:91-95 | ⚠️ không có task đích (chấp nhận như design debt, xem G18) |
| L5-T06 MINOR-1 | FloatingContact `refCollection/refId` | L6-T05:96, L7-T03:98 | ✅ |
| L5-T06 R2 | `--floating-bottom-offset` | L5-T07 (đã làm), L6-T05:97, L7-T03:99 | ✅ |
| L5-T06 MINOR-2 | Blob beacon `text/plain` | — | ❌ chưa gắn (G18) |
| L5-T06 MINOR-3 | `new URL` ném lỗi khi site URL sai | — | ✅ **đóng bởi L5-T08**: `site-url.ts:19-25` validate, `Breadcrumb.tsx:31,62` bỏ JSON-LD khi `undefined` |
| L5-T06 MINOR-5 | test `CategoryListTemplate` | — | ❌ chưa gắn (G18) |
| L5-T06 MINOR-4/6 | `EmptyState` biểu thức, `aria-live` thừa | — | chấp nhận, không cần task |
| L5-T06 MINOR-7 | đối chiếu 11 collection | spec-validation này | ✅ đóng (Phán quyết 2) |
| L5-T07 MINOR-A | focus sau Từ chối/Đồng ý | L15-T01:101-102 | ✅ (ở Notes, không phải AC) |
| L5-T07 | CSP cho GA | L14-T01:101-102 | ✅ |
| L5-T07 | CI kiểm importMap không lệch | — | ❌ chưa gắn (G18) |
| L5-T08 MINOR-2 | test khoá `generateStaticParams → []` | L15-T01:104-105 | ✅ (ở Notes) |
| L5-T08 MAJOR-2 follow-up | giữ `Allow: /api/media/file/` khi thêm Sitemap | L8-T05:97-98 | ✅ |

## Gaps và đề xuất task đích

### [PARTIAL] G15 MEDIUM: 404/500 không có nội dung trong HTML server (root layout nằm dưới `[locale]` động)
- Requirement: SPEC Quy tắc biên :170 (500 đúng ngôn ngữ), design-spec S17:552 ("`not-found.tsx` trong từng nhánh locale... có header + footer đầy đủ"), S18:559-560, FR-PUB-15/BR-05 (301 khi đổi slug, phụ thuộc gián tiếp).
- Hiện trạng: xem Phán quyết 1. Khách không chạy JS, bot không render JS, và trình duyệt in-app chặn script sẽ thấy trang trắng kèm status 404. AC T06 bị thêm điều kiện "(sau hydrate)" sau khi làm.
- Rủi ro lớn hơn ở phía sau: L6-T03 dự định tra redirect trong `not-found`. Khi đó sẽ không trả được HTTP 301 thật.
- **Đề xuất:** thêm AC vào `layer-6-task-03`: "(a) sửa cấu trúc root: `src/app/layout.tsx` pass-through + `src/app/not-found.tsx` theo hướng dẫn next-intl, hoặc `experimental.globalNotFound`; curl `next start` `/en/khong-ton-tai` và `/khong-ton-tai` trả 404 và HTML server có `h1` đúng ngôn ngữ cùng header/footer; (b) tra redirect TRƯỚC `notFound()` (trong `[...rest]/page.tsx` / trang chi tiết hoặc ở `proxy.ts`), không tra trong `not-found.tsx`; curl slug cũ → `301` + `Location`". Review STRICT vì đụng mọi route. Primary gắn, không cần user.

### [PARTIAL] G16 LOW-MEDIUM: as-built doc của click-events chưa reconcile sau khi siết G2 (L5-T06 ghi sai "no doc impact")
- `docs/API_SPEC.md:120` ghi `pagePath` "bắt đầu bằng `/`, 1–500 ký tự" và `:121` ghi `refCollection` "slug `[a-z0-9-]`, ≤ 64 ký tự". Code `click-events.ts:13-20` hiện chặn `//`, `/\`, có `trim()`, và `refCollection` là enum 11 giá trị `CLICK_REF_COLLECTIONS`. Một client gửi slug khác (vd `leads`) giờ nhận 400. Đây là **thay đổi contract API**, thuộc bảng Doc Impact của AGENTS.md ("API contract/endpoint/response shape → `docs/API_SPEC.md`").
- `docs/ERD.md:470` (§4.13 `click-events`) chưa ghi `refCollection` bị giới hạn theo ERD §3.
- **Đề xuất:** primary reconcile lúc close-out layer 5 (as-built, có evidence code): API_SPEC §3.4 sửa 2 dòng ràng buộc + trỏ `src/lib/click-stats/click-types.ts`; ERD §4.13 thêm một câu as-built; sửa `layer-5-task-06.md:74` Doc impact. Không cần user.

### [PARTIAL] G17 LOW: `NEXT_PUBLIC_HOTLINE` không được truyền lúc build image, nên `global-error` không bao giờ hiện hotline
- design-spec S18:561: `global-error.tsx` lấy hotline "từ biến build (`NEXT_PUBLIC_HOTLINE`) để chắc chắn hiển thị khi DB lỗi". Code `global-error.tsx:6,61,67` đúng (rỗng thì bỏ câu hotline).
- Grep `docker/Dockerfile`, `.github/workflows/*.yml`: không có `NEXT_PUBLIC_HOTLINE`. Chỉ có ở `.env.example:53`. Image build trong CI sẽ inline chuỗi rỗng, nên trang lỗi gốc trên staging/prod không có số hotline. Image dùng chung staging→prod không gây vấn đề vì hotline giống nhau.
- **Đề xuất:** AC vào `layer-6-task-01` (lần build image thật đầu tiên): truyền `NEXT_PUBLIC_HOTLINE` làm build-arg từ GitHub `vars`, ghi runbook deploy, kiểm `global-error` trong image có số. Thêm vào danh sách R4 (`/brainstorm secrets`).

### [PARTIAL] G18 LOW (quy trình): follow-up/residual chưa có task đích
| Residual | Nguồn | Đề xuất task đích |
|---|---|---|
| Test riêng `CategoryListTemplate` (chips `aria-current`, empty → `parentListHref`, ẩn phân trang khi trống) | L5-T06 MINOR-5 | AC `layer-6-task-06` (consumer S05 đầu tiên **chạy được**; L6-T04 đang bị chặn) |
| Blob beacon nên `text/plain;charset=UTF-8` | L5-T06 MINOR-2 | AC `layer-6-task-05` cùng follow-up `refCollection` (đã có ở :96), hoặc `layer-14-task-02` |
| CI kiểm `importMap.js` không lệch (lỗi thật đã xảy ra, a614b3d) | L5-T07 residual | AC `layer-6-task-01` hoặc task CI tương ứng: `payload generate:importmap` + `git diff --exit-code` |
| `pnpm e2e:revalidate` chỉ chạy tay, không trong CI | L5-T05 | AC `layer-12-task-01` (E2E smoke staging) |
| Upload source map GlitchTip thật chưa kiểm | L5-T05 residual | AC `layer-6-task-01` (bật `GLITCHTIP_AUTH_TOKEN` staging, kiểm stack không minify) |
| Design debt header (2 hàng ở xl, `ctaButton`/logo CMS, footer accordion < md, menu toàn màn hình thiếu accordion con) | L5-T05 decision log :91-92 | Ghi `spec/changes/BACKLOG.md` hoặc AC `layer-14-task-02`, vì `header.ctaButton`/`logo` là trường CMS admin nhập được mà website bỏ qua |
| Base Debian 11 EOL image postgres/backup | L4 G14 (chưa xử lý) | Ghi `spec/changes/BACKLOG.md` |
| Chuyển "focus sau Từ chối/Đồng ý" (L15-T01:101) và "test khoá layout" (L15-T01:104) từ Notes thành AC | L5-T07 MINOR-A, L5-T08 MINOR-2 | `layer-15-task-01` (giữ chỗ, nhưng đổi thành checkbox AC để không bị bỏ sót) |

### [PARTIAL] G19 MEDIUM, **cần user quyết**: L5-T01/T04 bị chặn làm tắc phần lớn layer 6 và mốc "staging sớm sau L5"
- Layer plan đã duyệt "staging sớm sau L5" (`progress.json:15-17`, `layer-plan.md:586`). Nhưng `layer-6-task-01` (deploy staging) phụ thuộc `layer-5-task-01`, `layer-5-task-04` và `layer-2-task-02` (`layer-plan.md:541`).
- Trong layer 6 hiện chỉ chạy được **T03, T06, T07**. T01, T02, T04, T05, T08, T09, T10 đều bị chặn trực tiếp hoặc bắc cầu bởi L2-T02 (`layer-plan.md:541-550`). Phía sau còn L7-T01, L8-T01/02/05, L9-T07 (`:551-566`).
- Hệ quả thấy được: nút tìm kiếm header (`/cho-thue?q=`) và mục menu Dự án/Cho thuê/Tuyển dụng sẽ 404 trên mọi bản build cho tới khi có dữ liệu. G10 (cảnh báo backup staging) và mọi bước "chạy thật lần đầu" (CD, backup, Cloudflare, migration L5) đều dồn về L6-T01.
- **User chọn:** (a) gửi dữ liệu tỉnh/phường chính thức để mở khoá L2-T02 → L5-T01/T04 → L6; hoặc (b) duyệt tách `layer-6-task-01` khỏi L5-T01/L5-T04/L2-T02, deploy staging sớm với phần đã có (services/pages/news, khung, SEO, cookie) để kiểm CD/backup/Cloudflare thật sớm, rồi redeploy khi có dữ liệu. Phương án (b) đổi plan đã duyệt nên phải có user đồng ý. Spec-validator không tự chọn.

## As-built doc cần reconcile (LOW, không chặn)
- **R14: ARCH §4 cây thư mục** (`ARCHITECTURE.md:86-133`) thiếu phần layer 5 thêm: `src/components/layout/` (shell, FloatingContact, Breadcrumb, Pagination, EmptyState, PageBanner), `components/consent/`, `components/analytics/`, `components/seo/`, `components/templates/`; `src/lib/consent/`; `src/hooks/pages/`; `src/app/robots.ts`, `src/app/global-error.tsx`, `[locale]/[...rest]`, `not-found.tsx`, `error.tsx`; `tests/e2e/`; `scripts/upload-sourcemaps.mjs`. `:119` `seo/` ghi "Sinh metadata, JSON-LD, sitemap" (sitemap chưa có, nên đổi thành `site-url`, `metadata`, `json-ld`, `robots`; sitemap ở L8-T05).
- **R15: API_SPEC.md:3** vẫn "thiết kế ban đầu, chưa có code" (R12 layer 4, chưa sửa). Gộp với G16.
- **R16: design-spec S17** không cần sửa. Sau khi G15 xong, nên thêm note as-built về cấu trúc root layout vào ARCH §5.1.
- **R17: Vệ sinh task file layer 5:** `layer-5-task-02.md:68` "(chờ Reviewer STRICT)"; `layer-5-task-03.md:55` "chờ reviewer STRICT", `:68` "Decision log: pending"; `layer-5-task-05.md:70` "builder tự đánh dấu [x] (chờ Reviewer STRICT)"; `layer-5-task-06.md:99` "ERD §2" (đúng là §3). Cả 6 task còn "Spec Validator verdict (layer close): pending" (`T02:71`, `T03:64`, `T05:86`, `T06:71`, `T07:65`, `T08:67`). Primary cập nhật khi close-out layer.

ERD §4.8, §4.9, §4.9b, §5 đã reconcile as-built ở T02/T03 và khớp code đã đọc. design-spec §3.10:206 và ARCH §5.1:166-167 khớp code.

## Residual risk của lần validate này
- Không chạy `pnpm e2e:revalidate`, không mở trình duyệt, không curl `next start`. G15 (shell rỗng) dựa vào quan sát của builder và phân tích của reviewer T06; spec-validator không tự đo HTML server.
- Không đọc toàn văn `News.ts`, `Services.ts`, `Pages.ts`, `sync-privacy-version.ts`, `CookieBanner.tsx`, `GoogleAnalytics.tsx`, `FloatingContact.tsx`, `load-shell.ts`. Các dòng ma trận liên quan dựa vào đoạn code đã Grep/Read, test PASS hôm nay và reviewer STRICT.
- Build hôm nay compile nhanh (616 ms, có cache Turbopack). Bảng route và exit 0 vẫn đáng tin cho cấu hình route.
- Không xác minh tính hợp lệ schema.org bằng Rich Results Test.

## Tóm tắt cho user

**Layer 5 đã có gì (6/8 task):**
- **Dịch vụ** và **2 trang pháp lý** (chính sách bảo mật, điều khoản) trong admin, chỉ admin sửa. Xuất bản chính sách bảo mật thì phiên bản tự cập nhật để dùng cho đồng ý của khách.
- **Tin tức** trong admin (danh mục, tags, ảnh bìa, xoá mềm, sale chỉ sửa bài của mình).
- **Khung website**: header, menu (menu toàn màn hình trên điện thoại), footer, nút chuyển ngôn ngữ. Menu/footer chưa có bản tiếng Anh thì `/en` tự dùng menu tiếng Anh cố định.
- **Thành phần dùng chung**: nút Hotline/Zalo/Fanpage nổi (có đếm lượt bấm), breadcrumb, phân trang, trạng thái "không có kết quả", trang 404/500 theo ngôn ngữ.
- **Banner cookie**: không đồng ý thì không tải Google Analytics; đổi chính sách bảo mật thì hỏi lại; rút lại đồng ý từ footer.
- **Nền SEO**: thẻ meta/OG, canonical, hreflang (chỉ khi có bản tiếng Anh), JSON-LD, robots.txt. Staging luôn bị chặn Google. Địa chỉ website lấy lúc chạy nên một image dùng được cho cả staging và production.
- Kiểm tra lại hôm nay: lint, typecheck, build và 1029/1029 test đều đạt.

**Anh cần quyết định:**
1. **G19: dữ liệu tỉnh/phường đang chặn phần lớn layer 6, kể cả "deploy staging sớm".** Chọn: (a) gửi dữ liệu chính thức; hoặc (b) cho phép deploy staging sớm với phần đã có (dịch vụ, pháp lý, tin tức, khung trang), rồi deploy lại khi có Dự án/Cho thuê/Tuyển dụng. Nếu không quyết, layer 6 chỉ làm được 3 task (redirect slug, trang Tin tức, trang Dịch vụ/Liên hệ/Pháp lý).
2. Chạy `/brainstorm secrets` để cập nhật danh sách biến môi trường (thiếu thêm `APP_ENV`, `NEXT_PUBLIC_HOTLINE`, `GLITCHTIP_*` so với layer 4).

**Để anh biết (không cần quyết, primary tự gắn vào task):**
- Trang 404/500 hiện đúng ngôn ngữ trên trình duyệt, nhưng nội dung chỉ hiện sau khi JavaScript chạy (G15). Sẽ sửa ở task redirect slug (L6-T03) vì cùng gốc với việc trả 301 cho link cũ.
- Tài liệu API của bộ đếm lượt bấm cần cập nhật theo ràng buộc mới (G16). Số hotline trên trang lỗi nặng chưa được truyền vào bản build (G17). Một số việc nhỏ cần gắn vào task (G18).
