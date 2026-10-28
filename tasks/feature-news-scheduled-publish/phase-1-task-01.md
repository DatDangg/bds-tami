# feature-news-scheduled-publish · phase-1-task-01 — Tin tức: hẹn giờ xuất bản (FR-ADM-16 thu hẹp)

- Change doc: `spec/changes/2026-10-27-news-scheduled-publish.md` (BACKLOG BL-091, QA sheet 27/10 dòng 13)
- Spec: SPECIFICATIONS.md 1.61.0 — "Quy tắc biên" → dòng "Hẹn giờ xuất bản (FR-ADM-16 — BL-091 …)"; test-scope v92; delta `spec/updates/2026-10-28-news-scheduled-publish.md`.
- Auto proceed: CÓ — user duyệt batch BL-088..091 ("scope đã chốt: … 091 chỉ Tin tức, chưa gửi mail"). Quyết định user 2026-10-27: chỉ Tin tức; không cronjob (lọc `publishedAt ≤ now` lúc truy vấn, cache ~60s); không email.
- Spec validation: `.context/review-reports/feature-news-scheduled-publish-spec-validation*.md` (r1 FAIL 3 warning → đã xử lý: cache "Đọc nhiều" 60s; giờ VN không đổi schema; `layer-16-task-01` superseded).

## Hiện trạng (change-request đã đọc code)
- `src/fields/published-at.ts`: `publishedAtField()` dùng chung cho mọi collection nội dung (qua `src/collections/_shared/content-defaults.ts` → `buildSharedFields`): `readOnly`, `access.create/update: denyAll`, hook `stampFirstPublish` (`previousValue ?? value` → đã có giá trị thì GIỮ; chưa có + `published` → now). Picker `dayAndTime` có sẵn.
- `src/access/publishedOnly.ts`: `buildPublicWhere(statuses)` = status ∈ statuses + `deletedAt` không có; `makePublishedOnly` (khách → where, staff active → true, khoá → false). Dùng cho news, projects, property-posts, job-postings… (`content-defaults` → `makePublishedOnly(publicStatuses)`), rentals riêng.
- `src/lib/content/public-queries.ts`: `publicWhere(collection, locale)` (mọi trang công khai đi qua `findPublicList` / `findPublicBySlug` / `findPublicOne`).
- SQL thô của Tin tức (không qua `publicWhere`): `src/lib/news/news-search.ts` `publicNewsSql` (dùng bởi `findFilteredNewsIds` tìm `q`/tag và `listTopNewsTags` khối Chủ đề); `src/lib/news/most-read.ts` `rankNewsByViews`. `loadMostReadNews` cache `MOST_READ_CACHE_SECONDS = 600`.
- Cache trang: `src/app/(frontend)/[locale]/layout.tsx` `revalidate = 60`; `/tin-tuc` và trang danh mục `force-dynamic`; chi tiết `/tin-tuc/[slug]` ISR (`generateStaticParams` `[]`). Sitemap / llms force-dynamic.
- Mẫu admin Cell + notice dưới ô: `src/collections/JobPostings.ts:100` (`JobDeadlineDisplay#JobDeadlineCell` + `afterInput: [JobDeadlineDisplay#JobDeadlineNotice]`), `src/components/admin/JobDeadlineDisplay.tsx`.
- Spec-validator đã xác nhận: mọi đường đọc tin công khai khác (danh sách, danh mục, chi tiết, tin liên quan, trang chủ, sitemap, llms, chuyển ngôn ngữ, resolve-missing-page, endpoint `news-views`) đều đi qua `publicWhere` hoặc access của khách. Builder vẫn grep lại `"news"` trong `src/lib`, `src/endpoints`, `src/components/home` để chắc.

## Hướng làm (quyết định change-request)
1. **Điều kiện công khai chỉ cho Tin tức** — `src/access/publishedOnly.ts`: `buildPublicWhere(statuses, options?: { scheduled?: boolean; now?: Date })`; `scheduled` → AND thêm `{ or: [{ publishedAt: { exists: false } }, { publishedAt: { less_than_equal: now.toISOString() } }] }` (now mặc định `new Date()` lúc gọi — mỗi request). `makePublishedOnly(statuses, options)` truyền tiếp. Gọi không `options` → where y hệt hiện tại (test khoá deep-equal cho các collection khác). Sửa comment "áp cho mọi collection" cho đúng phạm vi.
2. **`publicWhere`**: `collection === "news"` → `buildPublicWhere(PUBLIC_STATUSES.default, { scheduled: true })`. Sửa comment dòng ~20.
3. **Access đọc của khách cho `news`**: thêm option vào `ContentOptions` (vd `scheduledPublish?: boolean`), chỉ `src/collections/News.ts` bật; `withContentDefaults` dùng nó cho `access.read` (`makePublishedOnly(publicStatuses, { scheduled: true })`) và cho ô `publishedAt` (bước 5). Không sửa `Projects.ts` / `PropertyPosts.ts` / `Rentals.ts` (file dirty BL-076..078, CẤM đụng).
4. **SQL thô**: `publicNewsSql` và `rankNewsByViews` thêm `AND (n."published_at" IS NULL OR n."published_at" <= <now>)` (now là tham số, test truyền được). `MOST_READ_CACHE_SECONDS` 600 → **60** (comment: giữ mức trễ hẹn giờ ~60s, BL-091).
5. **Ô "Ngày xuất bản" (chỉ news)** — `publishedAtField({ scheduled?: boolean })`:
   - `scheduled` → bỏ `denyAll` (để access collection quyết định; ai sửa được bài thì sửa được ô), `readOnly: false`, description: giờ Việt Nam (GMT+7); để trống thì tự điền khi xuất bản lần đầu; đặt giờ tương lai để hẹn giờ.
   - Hook khi `scheduled`: giá trị gửi lên có → dùng giá trị đó (kể cả quá khứ); trống + status `published` → now (cả lần đầu lẫn khi xoá trống ở bài đang published); trống + không published → để trống. Không `scheduled` → hành vi y hệt cũ (test khoá).
   - `admin.components.afterInput`: component client mới (vd `src/components/admin/ScheduledPublishNotice.tsx`): (a) ghi chú "Giờ Việt Nam (GMT+7)"; nếu offset của máy TẠI ngày giờ đang chọn (`new Date(value).getTimezoneOffset() !== -420`) → cảnh báo máy không ở GMT+7, giờ chọn tính theo giờ máy; (b) bài đã lưu `published` với `publishedAt` cũ ≤ now và giá trị đang chọn > now → cảnh báo "Tin đang hiện trên web sẽ bị ẩn tới <dd/MM/yyyy HH:mm>" (không chặn lưu); (c) giá trị > now (đang hẹn giờ) → thông tin "Tin sẽ tự hiện trên web lúc …". Ngày giờ hiển thị luôn `Asia/Ho_Chi_Minh`.
   - `admin.components.Cell` cho danh sách news: hiện ngày như cũ; nếu `status === "published"` và `publishedAt > now` → nhãn **"Đã hẹn giờ · dd/MM/yyyy HH:mm"** (giờ VN). Hàm format/so sánh tách thuần (unit test), dùng chung Cell + notice.
   - `src/app/(payload)/admin/importMap.js` đang DIRTY (dòng WardField của BL-077): được phép thêm dòng import/map cho component BL-091 (chạy generate importmap hoặc sửa tay), KHÔNG xoá/sửa dòng WardField. Change-request sẽ stage riêng dòng BL-091. Báo rõ các dòng đã thêm.
6. **Không** job/cron, **không** email, **không** đổi schema/migration (`published_at` + index có sẵn; không bật `timezone` của Payload). `payload-types.ts` không đổi (nếu generate ra diff → báo).
7. Revalidate khi lưu giữ như cũ (không cần thêm).

## Classification / Risk
- Type: **ADDITIVE** (FR-ADM-16 thu hẹp cho Tin tức). Không schema/migration.
- Risk: **HIGH** — access đọc của khách + `buildPublicWhere` dùng chung, nhiều route public, sitemap/JSON-LD, admin field dùng chung mọi collection. Reviewer: **STRICT**.
- Blast radius: `/tin-tuc` (+ danh mục, `q`, tag, Chủ đề, Đọc nhiều), `/tin-tuc/[slug]` (+ tin liên quan, JSON-LD, metadata), `/en/news…`, trang chủ khối Tin tức, sitemap, llms.txt, `/api/news` khách, `/api/public/news-views`, admin `/admin/collections/news` (list + form); regression: Dự án / Cho thuê / Tin BĐS / Tuyển dụng (where + ô chỉ đọc không đổi).
- Doc impact (change-request reconcile ở close-out): `docs/ERD.md` §1 dòng 29 + dòng 371, `docs/PERMISSION.md` (read khách news), `docs/API_SPEC.md` (loader Đọc nhiều + điều kiện công khai news).

## Acceptance
- [ ] Chỉ Tin tức: ô "Ngày xuất bản" sửa được, chọn ngày + giờ, lưu đúng; để trống → tự điền khi xuất bản lần đầu; xoá trống ở bài published → điền lại now.
- [ ] Tin `published` có `publishedAt > now` không hiện với khách ở: danh sách + danh mục, chi tiết (404), tìm `q`, tag, khối Chủ đề, "Đọc nhiều", tin liên quan, trang chủ, sitemap, JSON-LD, llms.txt, `/api/news` khách, đếm lượt xem. `publishedAt` trống vẫn hiện như cũ.
- [ ] Tới giờ tự hiện không thao tác thêm (lọc lúc truy vấn; ISR 60s; cache Đọc nhiều 60s).
- [ ] Staff active (admin + sale) vẫn đọc tin hẹn giờ (admin/API đăng nhập); danh sách admin có nhãn "Đã hẹn giờ · <ngày giờ>".
- [ ] Đổi ngày tin đang lên web sang tương lai → cảnh báo dưới ô; máy không GMT+7 → cảnh báo múi giờ.
- [ ] Dự án / Cho thuê / Tin BĐS (+ Tuyển dụng) không đổi hành vi — test khoá: where khách deep-equal cũ, ô `publishedAt` vẫn readOnly + denyAll, hook giữ giá trị cũ.
- [ ] Unit test: `publishedOnly` (news có điều kiện, khác không), `public-queries` publicWhere, `published-at` hook (scheduled vs không), format/so sánh nhãn, notice/Cell component, news-search/most-read SQL có điều kiện (nếu có kiểu test SQL sẵn).
- [ ] Integration test Postgres (Docker tami-postgres/redis/seaweedfs): khách `find` news không thấy bài tương lai, thấy bài quá khứ/null; staff thấy; `findFilteredNewsIds` + `listTopNewsTags` + `rankNewsByViews` bỏ bài tương lai; project published với `publishedAt` tương lai (ghi `overrideAccess`) vẫn hiện với khách.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS (lint toàn repo FAIL chỉ do `playwright-report/` → ghi rõ, chạy eslint file đổi).
- [ ] Playwright (dev server port **3100**, KHÔNG 3000; tắt sau khi đo), 1920 admin + 1440/390 public: tạo/sửa tin đặt giờ tương lai trong admin → list có nhãn, cảnh báo hiện khi đổi tin đang lên web; khách: `/tin-tuc` không có, `/tin-tuc/<slug>` 404, sitemap không có; đặt giờ ~1–2 phút tới → sau giờ + ≤ 60s hiện ở `/tin-tuc` + chi tiết 200. Dọn dữ liệu test sau khi đo. Ảnh `.context/review-reports/assets/bl091-*.png`.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `docs/**`, `tasks/tami-website/**` (change-request lo).
- KHÔNG đụng file dirty không thuộc change: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/collections/{Projects,PropertyPosts,Rentals}.ts`, `src/fields/ward-in-province.ts` (+test), `src/components/admin/WardField*`, `tools/**`, `tasks/bug-admin-province-ward-cascade/`, `tests/e2e/admin/`, `playwright.config.ts`, `docs/content-intake/`, `docs/testing/`, `template-feedback*.md`. `importMap.js`: chỉ THÊM dòng BL-091.
- KHÔNG commit, KHÔNG revert/checkout/stash file nào. Không cài dependency mới.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (+ integration theo `.context/project-config.md`) + Playwright như Acceptance.

## Builder log

### Builder (BL-091) — 2026-10-28
**Quyết định**
- `buildPublicWhere/makePublishedOnly(statuses, { scheduled?, now? })`: `scheduled` AND thêm `or[publishedAt exists:false, publishedAt ≤ now]`; không option = where y hệt cũ (test deep-equal). `publicWhere` bật `scheduled` chỉ cho `news`. Export thêm type `PublicWhereOptions`.
- `ContentOptions.scheduledPublish` (chỉ `News.ts` bật) → `access.read` của khách + `publishedAtField({ scheduled })`. Không đụng Projects/PropertyPosts/Rentals.ts.
- `publishedAtField({ scheduled: true })`: bỏ `denyAll`/`readOnly`; hook `stampScheduledPublish`: có giá trị gửi lên → dùng; không gửi (`undefined`, update từng phần) → giữ giá trị đã lưu; trống (`null`/"") + published → now; trống + chưa published → trống. Bản không-scheduled giữ hook cũ (test khoá).
- SQL thô: `publicNewsSql(locale, now)` + `rankNewsByViews(..., now = new Date())` thêm `(n."published_at" IS NULL OR n."published_at" <= $now::timestamptz)`; `findFilteredNewsIds(..., now)` / `listTopNewsTags(..., now)` tham số `now` cuối, mặc định `new Date()`; `findMostReadNews` truyền `options.now`. `MOST_READ_CACHE_SECONDS` 600 → 60.
- Admin: `src/lib/admin/scheduled-publish.ts` (hàm thuần: format dd/MM/yyyy HH:mm Asia/Ho_Chi_Minh, `isScheduledPublish`, `scheduledPublishLabel`, `buildScheduleNotices`) + `src/components/admin/ScheduledPublishDisplay.tsx` (`ScheduledPublishCell` = nhãn "Đã hẹn giờ · …" hoặc `DefaultCell`; `ScheduledPublishNotice` = ghi chú GMT+7 / cảnh báo múi giờ máy / cảnh báo tin đang lên web bị ẩn / báo giờ tự hiện). Offset múi giờ máy đo bằng `useSyncExternalStore` (server + hydrate đầu = GMT+7, sau đó theo máy) — bản đầu dùng `useState`+effect bị lint `set-state-in-effect`. Style `.tami-schedule-cell` thêm vào `_forms.scss`; ghi chú dùng lớp có sẵn `tami-field-hint(--warn)`.
- importMap: chạy `pnpm generate:importmap`; diff so với trước đó đúng 4 dòng thêm (không đụng dòng WardField).
- Không migration/cron/email. Picker của Payload dùng giờ máy trình duyệt (định dạng "thg 10 29, 2026 9:30 AM"), nên cảnh báo múi giờ là cần thiết.

**File đổi**: `src/access/{publishedOnly.ts,index.ts}`, `src/lib/content/public-queries.ts`, `src/lib/news/{news-search.ts,most-read.ts}`, `src/fields/published-at.ts`, `src/collections/_shared/content-defaults.ts`, `src/collections/News.ts`, `src/components/admin/styles/_forms.scss`, `src/app/(payload)/admin/importMap.js` (chỉ THÊM), `src/payload-types.ts` (generate tự đổi 1 dòng comment description của `News.publishedAt` — KHÔNG có đổi kiểu).
**File mới**: `src/lib/admin/scheduled-publish.ts`, `src/components/admin/ScheduledPublishDisplay.tsx`.
**Test**: mới `src/access/publishedOnly.test.ts`, `src/fields/published-at.test.ts`, `src/lib/admin/scheduled-publish.test.ts`, `src/components/admin/ScheduledPublishDisplay.test.tsx`, `src/lib/news/scheduled-publish-sql.test.ts`; sửa `src/lib/content/public-queries.test.ts` (news có điều kiện, các collection khác không), `src/collections/_shared/content-defaults.test.ts`, integration `tests/integration/{news,news-views,projects}.test.ts`.

**Verify**
- `pnpm typecheck` PASS. `pnpm test` (unit + ui + integration, Docker Postgres) PASS: 452 files / 4748 tests (chạy trước khi đổi cách đo offset; sau đó chạy lại component test + eslint file đổi PASS). `pnpm lint` toàn repo FAIL chỉ do `playwright-report/` (như đã biết); eslint các file đổi 0 lỗi.
- Playwright (Edge, dev 3100, đã tắt server, dữ liệu test đã xoá — 0 dòng `BL091%` trong DB dev): form 1920 (tin đang lên web đổi sang 29/10 09:30 → cảnh báo "sẽ bị ẩn tới 29/10/2026 09:30"), lưu đúng `2026-10-29T02:30Z`, list có "Đã hẹn giờ · 29/10/2026 09:30", máy New York → cảnh báo múi giờ; khách: `/tin-tuc?q=` không có tin hẹn giờ (1440 + 390), `/tin-tuc/<slug>` 404, `/sitemaps/news-1.xml` + llms.txt + `/api/news` khách không có; đặt giờ +80s → trước giờ 404, sau giờ ~3s hiện (list + chi tiết 200). Ảnh `.context/review-reports/assets/bl091-*.png`.

**Residual**
- Đo ở dev (không ISR): trễ ≤ 60s trên production dựa vào `revalidate = 60` + cache Đọc nhiều 60s, chưa đo trên build production.
- Nhãn "Đã hẹn giờ" cần cột `status` có trong dòng danh sách; nếu admin ẩn cột Trạng thái khỏi bảng mà Payload không nạp `status` thì cột ngày hiện như thường (không nhãn).
- Dòng audit log của thao tác test (tạo/xoá tin BL091) còn trong `audit_logs` dev (không xoá).
- `src/payload-types.ts` diff 1 dòng comment do generate.

### Fix MINOR (reviewer r1) — Builder
- MINOR-1: `buildScheduleNotices` coi tin đã lưu `published` có `publishedAt` trống hoặc ≤ now là đang lên web → đổi sang tương lai ra cảnh báo "sẽ bị ẩn"; thêm unit case.
- MINOR-2: bỏ "Giờ Việt Nam (GMT+7)." khỏi description field (`published-at.ts`), giữ một chỗ ở notice. `pnpm generate:types` chạy lại: `src/payload-types.ts` chỉ đổi dòng comment description `News.publishedAt`.
- MINOR-3: ghi chú múi giờ tĩnh là `<p>` thường; chỉ cảnh báo/thông tin động nằm trong `<div role="status">`.
- Verify: typecheck PASS; eslint file đổi 0 lỗi; vitest (scheduled-publish, fields, component) 69 test PASS.
