# feature-seed-english-data · phase-1-task-01 — Bộ máy seed EN viết sẵn (`seed/english/`) + script + nối vào seed + dữ liệu EN cho danh mục / chủ đầu tư / dịch vụ / tuyển dụng / trang pháp lý / global public / alt ảnh

- Nguồn: BL-064 · change doc `spec/changes/2026-10-22-seed-english-data.md`. Spec delta: `SPECIFICATIONS.md` F12 bullet "Dữ liệu dev song ngữ (BL-064…)".
- **AUTO PROCEED** (user "tự quyết, đừng hỏi"): builder không hỏi; chỗ mơ hồ tự chọn phương án đơn giản nhất rồi ghi vào Verification summary.
- T02 (Dự án), T03 (Cho thuê + Tin BĐS), T04 (Tin tức) CHỈ thêm file dữ liệu dùng bộ máy của task này → định dạng dữ liệu + công cụ export phải rõ, ổn định, có tài liệu.

## Classification / Risk
- Type: **MODIFY** (dữ liệu seed dev; không đổi schema / API / UI / migration).
- Risk: **MEDIUM** — ghi DB dev qua Local API `overrideAccess` + hook (slug EN, `requireEnglishFields`, approve-english trang pháp lý, job dịch AI phải KHÔNG bị xếp hàng). Không chạm code app ngoài `seed/` + `scripts/` + `package.json` (script).
- Expected review level: NORMAL (reviewer tự chọn).

## Hiện trạng (đã đo trên DB dev 127.0.0.1:5433/tami, 2026-10-23)
- Bản ghi (hasEnglish / tổng): projects 3/61 · rentals 0/32 · property_posts 0/38 · news 0/24 · services 0/3 · job_postings 3/4 · categories 5/16 · developers 0/29 · pages (legal) en 0/2 · media alt en 7/481. Global homepage/site_settings/header/footer có dòng `en` nhưng có thể thiếu trường (so từng trường: vi có chữ mà en null/rỗng — kể cả mảng con `site_settings_*_locales`, `homepage_*_locales`, `newsDetail.contactNote` mới của BL-062, migration `20261022_172224_news_detail_contact_note`).
- `seed/scraped/data.json` KHÔNG có trên máy (gitignore) → nguồn `vi` của 150+ bản ghi scraped chỉ còn trong DB. Khoá idempotent của seed hiện có = **tiêu đề `vi`** (`scripts/seed-scraped.ts` `exists()`; mẫu `seed/sample/*` cũng theo title/name).
- Mẫu đã có EN: `seed/sample/projects.ts` (`english`, `addEnglish`, media `altEn`), `seed/sample/job-postings.ts`, `seed/shell-globals.ts` (header/footer từ `src/i18n/messages/en.json`), `seed/sample/homepage.ts`. Job dịch AI bỏ qua khi `context[TRANSLATION_JOB_CONTEXT_KEY]` (`src/hooks/translation/translation-targets`).
- Field logic: `src/fields/translation.ts` (`hasEnglish` readonly → chỉ ghi được với `overrideAccess`), `src/hooks/require-english-fields.ts` (bật `hasEnglish` khi thiếu trường EN bắt buộc → ValidationError), `src/fields/slug.ts` (slug EN sinh từ title EN khi trống; KHÔNG ghi locale `all`), `src/hooks/pages/approve-english.ts` (trang pháp lý), `src/jobs/translate-content*.ts` (ngữ nghĩa `enSource` / `sourceHash` / `status`).
- DB dev: `docker exec tami-postgres psql -U tami -d tami` (user/db từ `.env.local`). Dev server :3000 đang chạy.

## Quyết định (change-request, ghi lại)
- D1 Dữ liệu EN **commit** trong `seed/english/data/*.json` (khoá = tiêu đề/tên `vi` đúng như DB), kể cả bản dịch của dữ liệu scraped (nguồn vi chỉ còn trong DB; dev-only). Không gọi AI lúc seed.
- D2 Richtext (Lexical): EN lưu dạng **mảng chuỗi theo thứ tự text node** của cây `vi`; áp = clone cây `vi`, thay `text` từng node theo thứ tự → giữ nguyên cấu trúc (heading/list/link/format). Số node lệch (vi đã đổi) → bỏ qua bản ghi đó + cảnh báo, KHÔNG ghi nửa vời.
- D3 Mảng localized (vd `amenities`, `faqs`, `products`, `highlights`, khối site-settings/homepage): EN theo **thứ tự hàng** của bản `vi`, ghi kèm `id` hàng hiện có (theo mẫu `withIds` ở `seed/shell-globals.ts`) để không tạo hàng mới / không mất hàng `vi`.
- D4 Bật `hasEnglish: true` + `translation.enSource = "manual"` (+ `status` phù hợp ngữ nghĩa job — builder đọc `src/jobs/translate-content*.ts` rồi chọn giá trị để job AI KHÔNG dịch đè; ghi lý do). Trang pháp lý: coi như EN đã duyệt (đi đường duyệt/hook hiện có hoặc `overrideAccess`, ghi lý do).
- D5 Slug EN: không gửi slug → hook sinh từ title EN lần đầu; chạy lại không đổi slug.
- D6 Idempotent: chạy lại cho kết quả giống hệt; không tạo bản ghi mới; chỉ ghi locale `en` (không bao giờ ghi `vi`); nên bỏ qua ghi khi EN hiện tại đã bằng dữ liệu (tránh version/revision rác) — tự chọn, ghi lại.
- D7 Alt ảnh: media có alt `vi` dạng `<tiêu đề vi> - ảnh N` / `<tiêu đề vi> - ảnh bìa` → alt EN `<tiêu đề EN> - photo N` / `<tiêu đề EN> - cover image`, sinh tự động từ title EN của bản ghi. Ảnh khác (mẫu, homepage, global) → dữ liệu EN tường minh nếu `vi` có mà `en` thiếu.
- D8 Bản ghi mẫu đã có EN từ `seed/sample/*` giữ cách cũ; bộ máy bỏ qua hoặc ghi giống — không phá.
- D9 Cửa vào: `pnpm seed:english [<collection>…]` (`payload run scripts/seed-english.ts`, tham số vị trí lọc collection vì `payload run` nuốt cờ `--x`; chặn `APP_ENV=production`), thêm bước cuối `SAMPLE_STEPS` (`seed/index.ts`) và gọi cuối `scripts/seed-scraped.ts` (nhánh không `remove`).
- D10 Công cụ export cho T02–T04: `pnpm seed:english:export <collection> <out.json>` xuất bản `vi` của mọi bản ghi collection theo **đúng định dạng dữ liệu EN** (chuỗi vi tại chỗ chuỗi EN) để người dịch chỉ thay chuỗi; kèm `seed/english/README.md` mô tả định dạng, trường bắt buộc EN theo collection, quy tắc dịch (tên riêng giữ, thuật ngữ BĐS, giá/số giữ, quy ước địa danh), cách chạy + câu SQL đếm coverage.
- D11 Chỉ DB dev (`.env.local` → 127.0.0.1:5433/tami). CẤM chạy lên staging/prod, cấm `db push` / `migrate reset` / seed reset.

## Scope
1. `seed/english/` — bộ máy áp dữ liệu: đọc `seed/english/data/<collection>.json`, tìm bản ghi theo khoá `vi` (bỏ bản đã xoá mềm), ghi locale `en` theo D2–D7, trả `{ applied, unchanged, missing, mismatched }` mỗi collection; log rõ.
2. Hàm thuần có unit test (vitest, TDD): thay text node Lexical (đếm lệch → báo), ghép mảng theo id, sinh alt EN, kiểm entry thiếu trường bắt buộc EN (dùng danh sách required có sẵn trong code nếu được, không chép tay).
3. `scripts/seed-english.ts` + `scripts/seed-english-export.ts` + script `package.json`; nối `seed/index.ts` (SAMPLE_STEPS cuối) + cuối `scripts/seed-scraped.ts`.
4. **Dữ liệu EN của task này** (viết tay, tiếng Anh tự nhiên, thuật ngữ BĐS chuẩn): `categories` (16), `developers` (29 — tên thương hiệu giữ; "Công ty CP/TNHH …" → dạng tự nhiên "… JSC" / "… Co., Ltd." ; mô tả nếu có), `services` (3, đủ richtext), `job-postings` (bản còn thiếu), `pages` (2 trang pháp lý — dịch đủ), global **homepage / site-settings (mọi trường + mảng localized: page heroes, listing pages + FAQ + quick search, offices, careers perks/process, newsDetail.contactNote…) / header / footer**: chỉ điền chỗ EN đang thiếu hoặc còn tiếng Việt; chỗ đã có EN hợp lý giữ nguyên. Media alt: cơ chế D7 + alt tường minh cho ảnh không theo mẫu.
5. Chạy trên DB dev: `pnpm seed:english` 2 lần → lần 2 không đổi dữ liệu; bản `vi` không đổi (so dump `vi` trước/sau các collection đụng tới).
6. Đếm coverage sau khi chạy (SQL `has_english` / tổng + số trường EN rỗng của global) — ghi vào Verification summary.
7. Kiểm `/en` (dev :3000): `/en`, trang dịch vụ EN, 1 trang pháp lý EN, trang liên hệ EN (route theo `src/i18n/routing.ts`) — có chữ EN, phần global không rơi tiếng Việt. Không chụp được ảnh → ghi residual, không bịa.
8. Doc impact: chỗ docs đang mô tả lệnh seed (Grep `seed:` trong `README.md` / `docs/`) — thêm `pnpm seed:english`. KHÔNG sửa `SPECIFICATIONS.md` / `spec/**`.
9. Verify (`.context/project-config.md`): `pnpm typecheck` · `pnpm lint` (hoặc `npx eslint seed scripts` nếu lint toàn repo quá chậm — ghi rõ) · `pnpm test` (đủ bộ). Không đổi app → không bắt buộc `pnpm build` (ghi lý do).
10. **KHÔNG commit / stage.** Không đụng file dirty ngoài scope: `.claude/*`, `.context/project-config.md`, `CLAUDE.md`, `opencode.jsonc`, `src/app/(payload)/admin/importMap.js`, `template-feedback.md`, `spec/changes/**`, `.context/runs/**`, `.context/review-reports/assets/**`.
11. Ghi `## Verification summary` cuối file này (đã làm, định dạng dữ liệu tóm tắt, quyết định D4/D6, kết quả 2 lần chạy, coverage, verify, residual) trước khi trả report. Report mở đầu `Agent: builder`.

## Acceptance
- [ ] `pnpm seed:english` chạy được, idempotent (2 lần), không đổi `vi`, không xếp job dịch AI.
- [ ] categories / developers / services / job-postings / pages: 100% `hasEnglish = true`; global public không còn trường EN trống khi `vi` có chữ.
- [ ] Export tool + README đủ để T02–T04 chỉ thêm `seed/english/data/<collection>.json`.
- [ ] Unit test PASS; typecheck + lint + test PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (builder, 2026-10-23)

**Đã làm** (không commit/stage; không migration; không đụng file ngoài scope):
- `seed/english/`: `format.ts` (định dạng + hàm thuần), `apply.ts` (collection + global), `media.ts` (alt D7), `export.ts`, `index.ts` (`runSeedEnglish`, chặn production), `README.md`, `data/{categories,developers,services,job-postings,pages,globals,media}.json`.
- `scripts/seed-english.ts`, `scripts/seed-english-export.ts`; `package.json`: `seed:english`, `seed:english:export`; nối vào `seed/index.ts` (bước cuối `SAMPLE_STEPS`) và cuối `scripts/seed-scraped.ts` (nhánh không `remove`); `docs/runbooks/deploy.md` (1 câu ở bước seed --sample).
- Test: `tests/unit/seed-english-format.test.ts` (7), `tests/integration/seed-english.test.ts` (5, DB tạm, collection `projects` thật: mảng localized `amenities`/`faqs`, richText, `scale.handoverTime`, hasEnglish, slug EN, idempotent, lệch số ô chữ → bỏ cả bản ghi, thiếu trường bắt buộc).

**Định dạng dữ liệu**: `{ "<name|title vi>": { "<đường dẫn trường>": "<EN>" | ["<EN text node>", …] } }`; đường dẫn = tên trường nối `.`, hàng array = chỉ số hàng (vd `amenities.0.name`, `scale.handoverTime`, `seo.metaTitle`); richText = mảng chuỗi theo thứ tự text node (dùng `extractTextNodes`/`applyTextNodes` của job dịch, kiểm khung cây). globals: khoá ngoài = slug. media.json: `{alt vi: alt en}`. Dựng trên `collectLeaves`/`buildEnglishWrite` (`TRANSLATABLE_FIELDS`) nên không chép danh sách trường. Export `pnpm seed:english:export <nhóm> <out.json> [missing]` xuất đúng định dạng này (chữ vi tại chỗ chuỗi EN).

**Quyết định**
- D3 thực tế: không có array localized trong repo — mọi array dùng chung hai ngôn ngữ (id hàng giữ nguyên), nên ghi theo `rowId` của bản vi như job dịch; khoá dữ liệu dùng chỉ số hàng để commit được.
- D4: `translation = {status: "done", enSource: "manual", viChangedAfterManual: false, sourceHash: hash vi hiện tại, translatedAt, lastError: null}` — `manual` làm `translate-content` trả `manual_kept`, không dịch đè. Trang pháp lý: `hasEnglish` bật ở lần ghi thứ 2 với context `{translationJob, approveEnglish}` (qua `guardEnglishApproval`; `approveEnglish` afterChange bỏ qua vì có cờ job → không ghi audit/không đổi status), status `done`. Lý do: coi như đã duyệt (spec delta BL-064).
- D6: so từng lá (richText bằng hash ổn định) với EN hiện tại, chỉ ghi khi khác; bật `hasEnglish` ở lần ghi riêng sau khi đọc EN đã lưu (slug EN do hook sinh) — cùng vị từ `missingEnglishFields`.
- Dữ liệu khớp nhiều bản ghi trùng tên (danh mục "Căn hộ chung cư" ở 2 scope) → cùng 1 mục.
- Dữ liệu EN đã có từ seed mẫu (5 danh mục, 3 tin tuyển dụng) viết lại cùng giá trị → "không đổi" (salary giữ "15 - 30 million + commission"). Homepage: EN cũ `about.title = "About TAMI HOMES"` + accent trống → đặt `about.title = "About"`, `about.titleAccent = "TAMI HOMES"` để không trùng chữ.
- Media: 481 ảnh; 20 alt không theo mẫu có trong `media.json` (+7 cũ trùng), 461 alt theo mẫu chờ tiêu đề EN của dự án/cho thuê/BĐS/tin (T02–T04) — cơ chế đã chạy bằng test đơn vị, chưa có bản ghi nào để sinh.
- DB dev này không có dữ liệu `site-settings` offices / listingPages (FAQ, quick search) / careersProcess / newsDetail.contactNote / workingHours / address (bảng con rỗng, vi trống) → không có gì để dịch ở đó (engine + export xử lý khi vi có chữ). Header/footer/site-settings EN đã đủ, chỉ homepage thiếu 13 trường (đã ghi).

**Chạy trên DB dev (127.0.0.1:5433/tami)**: `pnpm seed:english` lần 1 (log đầu bị cắt khỏi màn hình nên không ghi lại số từng nhóm; kết quả thể hiện ở coverage bên dưới, media ghi 13 alt + 7 không đổi); các lần sau: mọi nhóm `ghi 0, không đổi N`, media `ghi 0, không đổi 20`. Thử đổi 1 chuỗi EN ở 3 nhóm (categories/services/globals) → đúng 1 bản ghi mỗi nhóm được ghi; hash toàn bộ hàng `*_locales` vi (không tính cột id, bỏ bảng versions) trước/sau giống hệt → bản vi không đổi (Payload ghi lại hàng locale nên cột `id` vi đổi, nội dung không). Khôi phục dữ liệu rồi chạy lại: idempotent. Không job `translate-content` mới do seed (3 job xuất hiện lúc `pnpm test` chạy 19:27 UTC, từ bộ test integration có sẵn, không phải seed).

**Coverage hasEnglish / tổng (trước → sau)**: categories 5/16 → 16/16 · developers 0/29 → 29/29 · services 0/3 → 3/3 · job_postings 3/4 → 4/4 · pages 0/2 → 2/2 · projects 3/61 · rentals 0/32 · property_posts 0/38 · news 0/24 (không đổi, T02–T04) · media alt EN 7/481 → 20/481 (461 chờ tiêu đề EN). `seed:english:export <nhóm> … missing` trả `{}` cho 5 collection + globals (không còn trường EN trống/còn tiếng Việt khi vi có chữ).

**`/en` (dev :3000, tự start bằng preview rồi stop)**: `/en`, `/en/services/distribution`, `/en/privacy-policy`, `/en/contact` đều 200, header/footer/hero/CTA/nội dung tiếng Anh; 0 từ tiếng Việt ở dịch vụ/pháp lý/liên hệ; `/en` chỉ còn tên tỉnh/dự án/chủ đầu tư... (phần dự án/đối tác chưa dịch thuộc T02). Không chụp ảnh (kiểm bằng text HTML).

**Verify**: `pnpm typecheck` PASS · `pnpm test` PASS (424 file, 4442 test, gồm 12 test mới) · `pnpm lint` (toàn repo): file của task sạch; còn 4 lỗi `no-explicit-any` ở `.local-seed/seed-sample-project-blocks.ts` + 2 warning `tools/task-dashboard/server.mjs` — có sẵn, ngoài scope, không sửa. `seed/` + `scripts/` chạy `eslint` thì `scripts/*` nằm trong ignore của eslint config (cảnh báo "ignored"), `seed/` + `tests/` sạch. `pnpm build` không chạy (không đổi code app).

**Residual risk**
- `pnpm seed --sample` ở staging cũng chạy bước EN (spec nói chỉ dev) — bước nằm trong SAMPLE_STEPS theo D9; nếu Docker image staging không chứa `seed/english/data/*.json` thì bước chỉ log "chưa có data" (không lỗi). Chưa kiểm Dockerfile.
- Xoá mềm: bản ghi đã xoá mềm bị bỏ qua (cố ý).
- Mỗi lần ghi EN tạo thêm 1 version trong bảng versions của collection có versions (hành vi Payload); chạy lại không ghi nên không phình.
- Bộ test `pnpm test` ghi vài job `translate-content` vào `payload_jobs` của DB dev (DATABASE_URL_TEST trùng DB dev) và còn nhiều DB tạm `tami_*` từ trước — không thuộc task.
- Alt theo mẫu (461 ảnh) và dữ liệu projects/rentals/property-posts/news chờ T02–T04; engine đã test với `projects` (mảng localized + richText) trên DB tạm.

### Fix round 1 (builder, 2026-10-23) — sau reviewer STRICT FAIL r1

- **MAJOR-1 (chỉ DB dev)**: `seed/english/index.ts` thêm `englishSeedBlockReason(env)` + `assertEnglishSeedAllowed(env)`, dùng lại `checkSeedEnvironment` (`src/lib/rentals/sample-amenities.ts`, không đổi hành vi) với `ALLOW_STAGING_SEED` bị vô hiệu + chặn thêm `APP_ENV=staging`. `pnpm seed:english` bị chặn → báo lỗi, exit 1 (kiểm thật: `APP_ENV=staging pnpm seed:english` → "chỉ chạy trên DB dev … APP_ENV=staging", exit 1). Bước `SAMPLE_STEPS` (`seed/index.ts`) và cuối `scripts/seed-scraped.ts` bỏ qua kèm log "bỏ qua: không phải DB dev (<lý do>)", không ném. `docs/runbooks/deploy.md` + README sửa câu: staging tự bỏ qua bước EN.
- **MINOR-1**: test mới `tests/unit/seed-english-guard.test.ts` (guard: dev OK; production/staging/NODE_ENV=production/thiếu DATABASE_URL/URL trùng staging-prod bị chặn; `ALLOW_STAGING_SEED=1` không mở; `missingBeforeWrite`), `tests/integration/seed-english-pages.test.ts` (trang pháp lý trên config services-pages: `hasEnglish` true, `translation` done/manual, bản vi không đổi, chạy lại không ghi), và integration projects thêm `vi.spyOn(payload.jobs, "queue")` → không xếp job dịch sau `applyCollection`.
- **MINOR-2**: `apply.ts` `missingBeforeWrite` + `planWrite(..., required)`: tính trường EN bắt buộc từ EN hiện tại + dữ liệu sắp ghi (bỏ `slug`) TRƯỚC khi ghi; thiếu → bỏ cả bản ghi, không ghi gì (hậu kiểm sau ghi giữ làm lưới an toàn). Test integration đổi: tiêu đề EN không bị ghi. README sửa theo.
- **MINOR-3**: `developers.json` giữ dấu tiếng Việt trong tên riêng (Phát Đạt Group, Tân Hoàng Minh Group, Vĩnh Sơn JSC, Phú Mỹ Hưng …), bỏ "Corporation"/"brand" thừa (MIK Group, Prime Group, Sunshine Group, Vingroup, NOBLE), "Vingroup and Vinhomes JSC joint venture". README quy tắc dịch cập nhật; lưu ý `export … missing` có thể liệt kê tên riêng có dấu (bỏ qua). Đã áp lại lên DB dev.
- **MINOR-4**: alt → "Green-facade tower (dev sample)". **MINOR-5**: SQL coverage README thêm `where deleted_at is null` (cột kiểm tồn tại trên cả 9 bảng; `media` không có xoá mềm). **MINOR-6**: salary "VND 15–30 million + commission".
- **Chạy DB dev (127.0.0.1:5433/tami)**: lần 1 ghi các thay đổi developers/job-postings/media (log đầu bị tràn dòng "chưa có EN" nên không ghi số); lần 2 và lần 3 (đã đọc log): categories/developers/services/job-postings/pages/globals/media đều `ghi 0, không đổi 16/29/3/4/2/1/20`, 0 lệch/lỗi; coverage developers 29/29. Không đụng staging/prod, không ghi `vi`.
- **Verify**: `pnpm typecheck` PASS · `npx eslint seed tests` sạch (scripts/ bị ignore bởi config) · `pnpm test` PASS 426 file / 4449 test.
- Residual: `seed/sample/job-postings.ts` còn salary EN cũ "15 - 30 million + commission" (ngoài scope); seed mẫu chạy trước, bước EN ghi đè lại thành "VND 15–30 million + commission".
