Agent: spec-validator

# Spec Validation: build tami-website, addendum đóng layer 5 (3 task từng bị chặn) — round 1

- Mode: Phase review (bổ sung cho report đóng layer 5 `.context/review-reports/spec-validation-build-tami-website-layer-5.md`). Đánh số gap nối tiếp sau G19.
- Scope: `tasks/tami-website/layer-2-task-02.md` (6289863), `layer-5-task-01.md` (9ababea), `layer-5-task-04.md` (8cee087, gồm migration thứ hai `20261017_132020_job_applications_cv_nullable`). HEAD 8cee087.
- Nguồn đã đối chiếu: SPECIFICATIONS.md (`:17`, F2 `:51`, F6 `:63-64`, `:119`, `:140`, NFR-04 `:151`, LGL `:158`); docs/BRD.md (FR-PUB-04 `:137`, FR-ADM-01 `:158`, FR-ADM-05 `:162`, BR-02 `:184`, BR-04 `:186`, BR-05 `:187`, BR-20/21 `:212-213`, BR-30…32 `:217-219`, LGL-01/02/03 `:244-246`); docs/ERD.md §4.2 `:133-164`, §4.3 `:180-189`, §4.5 `:205-235`, §4.6/4.7 `:246-247,296-297`, §4.10 `:361-407`, §5 `:535-563`, §6 `:569`, §7 `:576-585`; docs/PERMISSION.md §3.1–3.3 `:35-69`, §6 `:112`; docs/API_SPEC.md §3.2 `:85-87`; docs/ARCHITECTURE.md §4 `:102,129,131`, `:212`; `.context/design-spec.md` S12 `:485-489`; `docs/diagrams/layer-plan.md:541-550,586`; `.context/progress.json` (decisions `:333-341`, completedTasks `:240-260`); `spec/changes/BACKLOG.md:11-13`; `.agent/rollback.md`; `scripts/deploy/deploy.sh`; `docs/runbooks/deploy.md` §4 `:99-125`; `docs/runbooks/restore.md:122`; `docker/Dockerfile`; `.github/workflows/ci.yml`; 7 report reviewer (L2-T02 r1–r3, L5-T01 r1, L5-T04 r1–r3); task file layer 6, L7-T01, L8-T02, L9-T06, L15-T01; code `src/collections/{Provinces,Wards,Projects,JobPostings,JobApplications}.ts`, `src/fields/scoped-category.ts`, `seed/**`, `migrations/2026101{6,7}_*.ts`, `src/lib/content/public-queries.ts`, `src/lib/translation/allowlist.ts`.
- Verify (spec-validator tự chạy, Docker dev đang chạy, HEAD 8cee087):
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm test`: exit 0, **104 file / 1102 test PASS** (có integration DB thật). Vẫn còn cảnh báo deprecation `pg` "client.query() when already executing" (đã biết).
  - `pnpm build`: exit 0. Bảng route không đổi so với layer 5 (`● /[locale]`, `ƒ /[locale]/[...rest]`, `ƒ /robots.txt`, `○ /_not-found`).
  - `git status --short` trước/sau như nhau: chỉ `.claude/launch.json` và journal `.context/runs/build-tami-website-layer-5-validate-addendum.md` (untracked).
  - `pnpm payload migrate` không chạy (không thuộc allow-list; chỉ chạy lúc deploy). Lấy evidence builder: migrate:status 16/16 trên dev (L5-T04:65).

## Verdict: ✅ COMPLETE (PASS) — 15/15 AC

**15/15 AC** đã cam kết của L2-T02 (5), L5-T01 (5, cộng 1 AC `[→]` đã chuyển sang L5-T02 và đã tính ở report layer 5 dòng #1), L5-T04 (5) có code + test hoặc evidence chạy thật. Reviewer PASS mức STRICT cả 3 task (L2-T02 FAIL r1 → PASS r2 → PASS r3 delta; L5-T01 PASS r1; L5-T04 FAIL r1 → PASS r2 → PASS r3 delta). Không có [MISSING] so với AC.

Không có conflict mức HIGH giữa code và intent docs. **G19 đã giải quyết**: cả 10 task layer 6 đều đã đủ dependency theo task file. Có 6 gap mới (G20–G25), đều LOW/MEDIUM, không chặn verdict; 2 mục reconcile as-built (R18, R19). Cần user quyết: BL-003, cùng các đầu vào sẵn có của L6-T01 (xem cuối report).

**Layer 5 giờ đã đủ 8/8 task** (55/55 AC tính cả report layer 5).

## Coverage matrix

### layer-2-task-02: `provinces`, `wards` + khung seed

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | `provinces` (code U, name, shortName, slug U, sortOrder); `wards` (province, code U, name, type, slug unique trong tỉnh, legacyNames) | ERD §4.2 `:135-154` | ✅ | `Provinces.ts:24-30`; `Wards.ts:20-37` (UNIQUE `(province, slug)` `:20`; `type` `phuong/xa/dac_khu` `:5`); migration `20261017_122831_provinces_wards.ts`. `legacyNames` là mảng `{ name }`, đã ghi as-built ERD `:161` |
| 2 | 34 tỉnh + phường/xã theo danh mục chính thức sau 01/07/2025, có tên cũ | LGL-01 (BRD `:244`), SPEC `:119,:158` | ✅ | Nguồn user duyệt (progress.json `:333-336`): xlsx chính cho mã/tên, CSV chỉ cho `legacyNames`. `seed/data/administrative-units.json`: 34 tỉnh, 3.321 đơn vị (687/2.621/13), 10.643 tên cũ (L2-T02:62). Ghi đè 40153016 "Đào Duy Từ" theo quyết định user (progress.json `:338-341`), reviewer r3 xác nhận chỉ một dòng đổi và slug giữ nguyên. Cả xlsx, csv, JSON, converter đều có trong commit 6289863 |
| 3 | Seed idempotent, upsert theo `code` | AC | ✅ | `seed/geo.ts:51-107` (chỉ ghi khi khác); test `geo-seed.test.ts:92,105`; dev: lần 1 tạo 34/3.321, lần 2 không đổi (L2-T02:63) |
| 4 | `--sample` bị chặn khi `APP_ENV=production` | AC | ✅ | `seed/index.ts:85-89`; test `geo-seed.test.ts:162` |
| 5 | Khách/sale chỉ đọc; admin sửa | PERMISSION §3.2 `:54` | ✅ | `Provinces.ts:22`, `Wards.ts:19`; test `geo-seed.test.ts:117` (r2 n2 xoá ward thật bằng quyền sale → 403) |

Liên quan: FR-PUB-04 (lọc tỉnh/phường) mới có dữ liệu, bộ lọc ở L7-T02. Xoá tỉnh còn phường bị chặn 409 (`Provinces.ts:6-11`, test `:155`).

### layer-5-task-01: `projects`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 6 | G12: `projects` vào `PublicCollectionSlug` và allowlist dịch | spec-validation L4 G12 | ✅ | `public-queries.ts:11`; `translation/allowlist.ts:9`; test `projects.test.ts:298-322` |
| 7 | Đủ trường ERD §4.5 (`location` PostGIS, `scale`, `amenities`, `floorPlans`, `documents`, `legalInfo`, `salesPolicy`) | FR-ADM-01, LGL-02, ERD §4.5 | ✅ | `Projects.ts:91-126`; migration `geometry(Point)` + `CREATE EXTENSION IF NOT EXISTS postgis` `:6`. CI dùng `postgis/postgis:17-3.5` (`ci.yml:22`), staging/prod cùng image |
| 8 | `gallery` bắt buộc khi `published`; ảnh đầu là ảnh đại diện | ERD §4.5 `:224` | ✅ | `validateGallery` `Projects.ts:29-34` (dùng `previousValue`); test `:214-230` |
| 9 | Bộ field chung (slug, seo, status, publishedAt, author, isFeatured, hasEnglish/translation, versions, xoá mềm, revalidate) | BR-02, BR-04, BR-05 | ✅ | `withContentDefaults` `Projects.ts:128`; RBAC sale chỉ bài của mình, admin khôi phục/xoá hẳn (reviewer r1:47, khớp PERMISSION §3.1 `:39`) |
| 10 | Index `(status, has_english, sales_status, province_id)` + GIST `location` + UNIQUE `(_locale, slug)` | ERD §5 `:546-547,561` | ✅ | migration `:297-298` (`projects_location_gist_idx`, `projects_list_idx`); `\di` trên DB dev (L5-T01:67, đóng MINOR-4) |

### layer-5-task-04: `job-postings` + `job-applications`

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 11 | G12: `job-postings` vào allowlist | L4 G12 | ✅ | `public-queries.ts:11`; `translation/allowlist.ts:14` |
| 12 | `job-postings` đủ trường ERD §4.10, `deadline` bắt buộc + index | FR-ADM-05, ERD §4.10 `:365-381`, §5 `:550` | ✅ (lệch nhỏ G25) | `JobPostings.ts:59-79` (lương max ≥ min `:33-40`, `quantity min 1`, `deadline` R+I `:69-75`); `job_postings_list_idx (status, has_english, deadline)` migration `:184`. **`category` bắt buộc trong code, ERD ghi tuỳ chọn**: G25 |
| 13 | `job-applications`: chỉ admin đọc/sửa; khách/sale không đọc; không tạo qua REST | PERMISSION §3.3 `:68`, BR-32, FR-ADM-05 "Chỉ admin xem CV" | ✅ | `JobApplications.ts:71` (`create: denyAll`), `admin.hidden` cho sale `:68`; test sale GET → 403, khách POST → 403 qua Local API `overrideAccess:false` (L5-T04:65) |
| 14 | Trường khách gửi chỉ đọc trong admin | AC, PERMISSION §3.3 | ✅ | `submittedFieldAccess` `JobApplications.ts:21-52,77,90`; `ipHash` `read: denyAll` `:89` |
| 15 | Trạng thái `new → reviewing → interview → hired \| rejected` | BR-20 (BRD `:212`), SPEC F6 `:64` | ✅ | `JobApplications.ts:6`, mặc định `new` `:84`. Không ép thứ tự chuyển (ERD as-built `:406`) |

Thêm (ngoài AC, do review sinh ra): xoá hồ sơ xoá luôn CV + audit `content.purge` không có PII, thứ tự hook audit trước, S3 sau cùng, CV lỗi thì rollback cả hai (`JobApplications.ts:73-75`; test DB thật `job-postings.test.ts:505-530`); `disableBulkDelete` chặn REST/admin (`payload delete.js:24`); xoá hẳn tin còn hồ sơ → 409. Migration `cv_id` nullable (`20261017_132020…:3-6`) chỉ nới ràng buộc, không phải `HIGH_RISK_MIGRATION`, tương thích ngược với image trước. Theo quyết định primary, tạo migration mới thay vì sửa migration đã apply (L5-T04:72): đúng luật.

BR-30 (lưu thời điểm + phiên bản đồng ý): đã có trường `consentAt`/`consentVersion` R (`JobApplications.ts:39-40`); phần ghi giá trị ở L6-T09 AC3. BR-21 (email + lưu locale): trường `locale` R `:42-51`; email ở L6-T09 AC4. BR-31 (CV 12 tháng): cột `cv_id` đã cho phép NULL để L9-T06 xoá CV. Phần ẩn danh các trường khác còn hở: G23.

## Phán quyết các mục được giao

### 1. As-built docs vs code: ✅ khớp, còn vài chỗ LOW (R18)
- ERD §4.2 as-built `:158-164` khớp `Provinces.ts`, `Wards.ts`, `seed/geo.ts`, `scripts/build-admin-units.mjs` (override, alias, các điều kiện fail). ERD §4.5 as-built `:235` khớp `Projects.ts`. ERD §4.10 as-built `:383,393,403-407` khớp `JobPostings.ts`, `JobApplications.ts`, cả 2 migration. ERD §5 `:547,550` khớp SQL tuỳ biến. PERMISSION §3.3 `:68` khớp access. API_SPEC chưa bị ảnh hưởng (chưa có endpoint; §3.2 `:87` tương thích với trường đã xây, theo reviewer L5-T04 r1:45). R15 (API_SPEC:3) đã đóng: Grep "chưa có code" trong API_SPEC không còn kết quả.
- Lệch còn lại: xem R18 (ERD §5 `:555` câu chung "partial index" mâu thuẫn với ghi chú "không partial"; ARCH §4 thiếu runner seed mới) và G25 (`job-postings.category`).

### 2. Follow-up đã gắn vào task sau: đúng chỗ, còn sót 3 chỗ

| Nguồn | Mục | Task đích | Trạng thái |
|---|---|---|---|
| L2-T02 residual | hook `searchText` phải lấy `legacyNames[].name` | L6-T02:102-103 | ✅ (khớp ERD §6 `:569`) |
| L5-T01 MINOR-3 | mẫu dự án đang là draft không ảnh → cần mẫu có ảnh + published | L6-T04:93-94 | ✅ chỗ đặt hợp lý; nhưng (a) commit ảnh vào repo là **quyết định của user** (reviewer L5-T01 r1:59,66), task ghi như đã chốt; (b) L6-T01 AC `:62` cần trang có dữ liệu trên staging, xem G24 |
| L5-T01 MINOR-1 | gallery/cover gọi validator `upload` mặc định | L6-T05:103 | ✅ cho projects/news. ❌ **chưa gắn** cho rentals (validator "≥ 3 ảnh" của L6-T02 sẽ lặp đúng mẫu này): G22 |
| L5-T01 MINOR-2 | `ward` thuộc `province` đã chọn | L6-T05:104 | ✅ cho projects. ❌ **chưa gắn** cho `rentals` (ERD §4.6 `:246-247`, ward R) và `property-posts` (§4.7 `:296-297`): G22 |
| L5-T01 MINOR-5 | FK NOT NULL + set null → 500; xoá media làm rỗng gallery | L15-T01:107-108 (guard 409), L6-T05:105 (placeholder) | ✅ |
| L5-T01 MINOR-4/6 | migrate evidence + `\di`; ERD §5 không partial | L5-T01:67; ERD `:547` | ✅ đóng |
| L5-T04 | danh sách lọc `deadline ≥ hôm nay`, chi tiết hết hạn vẫn mở | L6-T08:96-97 | ✅ (khớp SPEC F6 `:64`) |
| L5-T04 | endpoint từ chối tin hết hạn/nháp/xoá mềm; `locale` mặc định `vi`; Local API `overrideAccess` | L6-T09:96-97 | ✅ |
| L5-T04 | data-retention: đặt `cv=null` + `anonymizedAt` trước, sau đó xoá `private-files`; không bulk delete theo `where` | L9-T06:96-98 | ✅. Còn hở cách ẩn danh các trường NOT NULL: G23 |
| L5-T04 r3 n1 | test bulk delete → 403 | — | không gắn (reviewer ghi là tuỳ chọn, Payload core đã bảo đảm). R19 |
| L5-T04 | `down` lỗi ở 8 migration | BACKLOG BL-003 | ✅ đã ghi, chờ user (mục 4) |
| L2-T02 r3 r3-1 | comment `scripts/admin-units/vietnamese-key.ts:37` ngược với `:2` | — | không gắn (chỉ là chữ). R19 |

### 3. G19: ✅ đã giải quyết. Cả 10 task layer 6 chạy được
- Lý do: L2-T02, L5-T01, L5-T04 đã nằm trong `completedTasks` (progress.json `:240-260`).
- Dependency theo từng task file (Grep `^- \`layer-` trong `layer-6-task-*.md`) đều nằm trong `completedTasks`: L1-T06, L1-T07, L2-T01, L2-T02, L2-T03, L2-T08, L3-T02, L3-T03, L4-T01, L4-T03, L4-T05, L5-T01…T08. L4-T06 (deferred) **không** là dependency của task nào trong layer 6 (chỉ L12-T01 cần). **Trong layer 6 không có task nào phụ thuộc task khác cùng layer** (`layer-plan.md:541-550`).
- Riêng **L6-T01** vẫn phải hỏi user trước khi làm (Notes `:114`, AC ⏸ `:56`). Runner/registry đã chốt (progress.json `:303-306`). Còn chờ user: tên miền staging, Cloudflare Access hay basic auth, secret staging, cảnh báo G10 (`:48`), đích backup S3/SFTP (`:49`, progress.json `:313-316`), Authenticated Origin Pulls (`:53`).
- **Thứ tự đề xuất** (không bắt buộc theo dependency; sắp theo rủi ro làm lại và đường găng):
  1. **L6-T03**: redirect 301 + sửa cấu trúc root/404 (G15). Đụng mọi route, nên làm trước các trang để khỏi sửa lại. STRICT.
  2. **L6-T02**: `rentals`. Đây là đường găng (mở L7-T01/02/03, L8-T02, L8-T05, L9-T07). STRICT. Làm kèm G22.
  3. **L6-T09**: endpoint ứng tuyển. STRICT. Cùng L6-T08 mở L7-T04.
  4. **L6-T10**: endpoint tải CV + audit. STRICT.
  5. **L6-T06**: trang Tin tức (kèm test `CategoryListTemplate` G18).
  6. **L6-T07**: Dịch vụ / Liên hệ / Pháp lý.
  7. **L6-T04**: danh sách dự án (seed mẫu có ảnh; cần user đồng ý commit ảnh).
  8. **L6-T05**: chi tiết dự án (kèm sửa collection `Projects.ward`/`gallery`).
  9. **L6-T08**: tuyển dụng (xem G25 trước khi dựng chip danh mục).
  10. **L6-T01**: deploy staging, sau khi user trả lời các đầu vào. Nên chạy sau T04–T08 để AC `:62` ("các trang đã có mở được") có nghĩa, và có dữ liệu mẫu published (G24). Nếu user muốn staging thật sớm (đúng tinh thần "staging sớm sau L5"), T01 **chạy được ngay bây giờ**, chấp nhận lúc đầu chỉ có khung trang + dịch vụ/pháp lý/tin tức.

### 4. BACKLOG BL-003 (`down` lỗi ở 8 migration): **không chặn L6-T01**, không đổi chiến lược rollback hiện hành
- Đã kiểm: Grep `DROP CONSTRAINT "payload_locked_documents_rels_.*_fk"` ra đúng 8 file khớp danh sách BL-003 (click_events, categories_developers, translation_usage, services_pages, news, provinces_wards, projects, job_postings). Ví dụ `20261017_130625_job_postings.ts:194-201`: `DROP TABLE … CASCADE` rồi mới `DROP CONSTRAINT`.
- `.agent/rollback.md` chỉ là checkpoint **git** (commit/tag/revert). Không có bước rollback DB và không gọi `migrate:down`, nên BL-003 không ảnh hưởng file này. (Ghi chú ngoài scope: file này còn mẫu generic `git push origin main --force` / `reset --hard` `:23,51-54`, trái với `forbidden_branch: main` và guard. Đó là template cũ, không nằm trong addendum này.)
- Deploy thật: `deploy.sh` chỉ chạy `up` (`run_migrations` `:189-193`). Rollback chỉ quay **image** (`rollback_to_previous` `:227-236`, log "migration đã chạy KHÔNG bị hoàn tác"). Runbook `deploy.md` §4 `:102-104` đã ghi "Migration đã chạy KHÔNG rollback được" và yêu cầu expand/contract. Phục hồi DB là PITR/restore (`restore.md:122`). Chiến lược thực tế đang là **fix-forward**, và không đường nào dùng `down`. Vì vậy BL-003 **không chặn** L6-T01.
- Điểm user cần biết khi quyết BL-003: cho tới trước L6-T01, cả 8 migration (và 9 migration còn lại) **mới chỉ apply trên DB dev**. Nếu chọn sửa `down` (chỉ thêm `IF EXISTS`, giữ nguyên `up` và snapshot), **đây là thời điểm rẻ nhất**: sau khi L6-T01 apply lên staging thì luật "không sửa migration đã apply" áp cho môi trường dùng chung. Nếu chọn fix-forward, chỉ cần thêm một dòng vào runbook §4 ("không dùng `payload migrate:down` ở staging/prod; `down` chỉ dùng ở dev và đang lỗi ở 8 migration, xem BL-003") và đóng BL-003.
- Thêm: `down` của `20261017_132020_job_applications_cv_nullable.ts:9-12` (không nằm trong 8 file) sẽ fail khi đã có hồ sơ ẩn danh (`cv_id` NULL). Comment trong file đã ghi rõ. Không cần làm gì thêm.
- Rủi ro liên quan thật sự với L6-T01 là chuỗi migration **chưa từng chạy trọn trên DB trống** kể từ L3-T03 (xem G21). Vì `down` không dùng được, đây là chỗ cần đề phòng.

## Gaps và đề xuất task đích

### [PARTIAL] G20 LOW: AC "Dockerfile COPY `seed/`" của L6-T01 đã lỗi thời so với runner `pnpm seed` mới
- `layer-6-task-01.md:52` ghi "Dockerfile COPY `seed/` (và chạy `seed:categories` được trong container)". Sau L2-T02, seed nền là `pnpm seed` → `scripts/seed.mjs` → `scripts/seed-run.ts` → `seed/index.ts` (địa giới + danh mục + pages; `--sample` thêm mẫu). Runner đọc `seed/data/administrative-units.json` qua `import.meta.url` (`seed/geo.ts:36`).
- Image runtime chỉ copy `src`, `scripts`, `migrations` (`docker/Dockerfile:61-68`), **không có `seed/`**. AC `:61` ("Seed nền tỉnh/phường, danh mục, pages + `--sample` chỉ ở staging") vì vậy chưa chạy được trong container.
- **Đề xuất:** primary sửa chữ AC `:52`: "COPY `seed/` (ít nhất `seed/*.ts`, `seed/sample/`, `seed/data/administrative-units.json`; không cần xlsx/csv) và chạy `pnpm seed` / `pnpm seed --sample` (hoặc `payload run scripts/seed-run.ts [sample]`) trong container staging; kiểm image prod từ chối `--sample` khi `APP_ENV=production`". Owner: L6-T01. Không cần user.

### [PARTIAL] G21 MEDIUM: chuỗi 17 migration chưa từng chạy trọn trên DB trống kể từ L3-T03; CI không chạy migrate
- `.github/workflows/ci.yml` không có bước `migrate` (Grep rỗng). Test integration dựng schema bằng `push: true` (reviewer L5-T01 MINOR-4). Lần cuối chạy migrate trên DB trống là L3-T03 (`layer-3-task-03.md:69`, lúc đó còn 17 bảng). Từ đó có thêm 11 migration, gồm SQL viết tay: `CREATE EXTENSION postgis`, GIST, các index `*_list_idx`, và `ALTER … DROP NOT NULL`. Tất cả chỉ apply dần trên DB dev.
- L6-T01 (`:73`) sẽ chạy toàn bộ lần đầu trên staging. `down` không dùng được (BL-003) và runbook coi migration là không hoàn tác. Nếu lỗi thứ tự hoặc SQL tay xuất hiện, nó sẽ lộ ra ngay trên môi trường dùng chung.
- **Đề xuất:** thêm AC vào L6-T01, làm trước bước chạm server: "trên một DB postgis trống (Docker cục bộ hoặc job CI), chạy `pnpm payload migrate` toàn bộ → `migrate:status` đủ 17/17 → `\di` có `projects_list_idx`, `projects_location_gist_idx`, `news_list_idx`, `job_postings_list_idx`; tốt nhất thêm job CI `migrate` trên service `postgis/postgis:17-3.5` để chặn hồi quy". Việc này cũng phủ AC `layer-6-task-06.md:38` (test `news_list_idx` sau migrate thật). Owner: L6-T01. Không cần user.

### [PARTIAL] G22 LOW-MEDIUM: follow-up "ward thuộc province" và "validator upload mặc định" mới gắn cho projects, chưa gắn cho rentals/property-posts
- `rentals` có `province` R + `ward` R (ERD §4.6 `:246-247`) và validator "publish cần ≥ 3 ảnh" (L6-T02 AC `:41`). Nếu viết bằng `validate` tuỳ biến giống `Projects.gallery`, lỗi MINOR-1 sẽ lặp lại: PDF lọt vào, id sai trả 500. Ward sai tỉnh sẽ làm lệch bộ lọc phường của Cho thuê (FR-PUB-04) và `searchText`.
- `property-posts` cũng có cặp province/ward (§4.7 `:296-297`). `layer-7-task-01.md:39` mới chỉ gom validator ảnh bìa.
- **Đề xuất:** primary thêm vào L6-T02 AC: "`ward` `filterOptions` theo `province` + validate phía server; validator ảnh gọi `upload` mặc định (`payload/shared`) trước rồi mới đếm ≥ 3". Thêm ý ward/province vào L7-T01. Nên tách helper dùng chung để L6-T05 (projects) dùng lại. Ghi chú: L6-T05 là task trang (review NORMAL, "không đụng schema") nhưng follow-up `:103-104` sửa collection `Projects`. Reviewer L6-T05 nên xét phần đó ở mức STRICT, hoặc chuyển 2 mục này sang L6-T02 làm cùng helper. Không cần user.

### [PARTIAL] G23 LOW: ẩn danh `job-applications` vướng cột NOT NULL; L9-T06 chưa nói cách biểu diễn
- `job_applications.full_name`, `phone`, `email`, `consent_at`, `consent_version`, `locale` đều NOT NULL (migration `20261017_130625_job_postings.ts:107-114`) và `required: true` (`JobApplications.ts:25-51`; `email` còn kiểm định dạng). Đã nới riêng `cv_id`.
- ERD §7 `:581` "Xoá file CV, ẩn danh thông tin cá nhân" và L9-T06 AC `:38` "ẩn danh trường cá nhân" chưa nói ẩn danh bằng giá trị thay thế hay bằng NULL. Nếu chọn NULL thì cần migration nới ràng buộc (giống `cv_id`) và đổi validate sang dạng "R cho tới khi `anonymizedAt`".
- `leads` chưa xây (L8-T02), nhưng L9-T06 AC `:37` yêu cầu "xoá `fullName`, `phone`…", nên L8-T02 nên thiết kế sẵn ràng buộc tương ứng để khỏi phải thêm migration sau.
- **Đề xuất:** thêm vào L9-T06: "chọn cách ẩn danh: giá trị thay thế cố định (vd `fullName='[đã ẩn danh]'`, email hợp lệ dạng `anonymized+<id>@invalid`), không cần migration; hoặc migration nới NOT NULL kèm validate có điều kiện. Ghi ERD §4.10/§7". Thêm vào L8-T02: "các trường PII bắt buộc cho tới khi `anonymizedAt` (BR-31)". Đây là quyết định kỹ thuật, không đổi BR-31. Không cần user.

### [PARTIAL] G24 LOW: L6-T01 cần dữ liệu và trang chưa có, rollback thử cần ≥ 2 lần deploy
- AC `layer-6-task-01.md:62` "Các trang đã có (dự án, tin tức, dịch vụ, pháp lý, tuyển dụng) mở được qua tên miền staging": các trang đó do L6-T04…T08 làm, nhưng không nằm trong dependency của T01 (`:30-42`).
- Dữ liệu mẫu dự án **và tuyển dụng** đều là `draft` (`seed/sample/projects.ts:10,112`; `seed/sample/job-postings.ts:13,114`), nên trang công khai sẽ trống. Follow-up "mẫu published" mới gắn cho projects (L6-T04:94), chưa có cho job-postings (tin tuyển dụng không cần ảnh, có thể publish luôn).
- AC `:60` "thử rollback một lần": lần deploy đầu không có image trước, nên không rollback tự động được (`deploy.sh:186`). Phải deploy ít nhất 2 lần mới thử được.
- **Đề xuất:** primary chọn chạy T01 sau T04–T08 (thứ tự ở mục 3), hoặc sửa chữ AC `:62` thành "những trang đã build tại thời điểm deploy". Thêm vào L6-T08: "mẫu tuyển dụng có ít nhất 1 tin published còn hạn ở dev/staging". Ghi vào AC `:60`: "rollback thử ở lần deploy thứ 2". Không cần user, trừ khi user muốn deploy staging ngay.

### [PARTIAL] G25 LOW: `job-postings.category` bắt buộc trong code nhưng ERD §4.10 ghi tuỳ chọn
- ERD §4.10 `:369`: `category` không có ràng buộc R. Code dùng `scopedCategoryField("job")` (`JobPostings.ts:61`), field này luôn bắt buộc (`scoped-category.ts:21` "Danh mục không được để trống"). Reviewer L5-T04 r1:43 kiểm "missing category → 400" mà không đối chiếu ERD. As-built `:383` không ghi lệch này.
- Hệ quả: seed nền không tạo danh mục `job` (`seed/categories.ts:6`), nên trên staging/prod admin phải tạo danh mục trước khi đăng tin tuyển dụng đầu tiên. Nhánh này còn ảnh hưởng chip lọc S12 (`design-spec.md:489`).
- **Đề xuất:** mặc định theo ERD (tuỳ chọn): thêm tham số `required` cho `scopedCategoryField` và đặt `false` cho `job`. Làm đầu L6-T08 (trang S12 phải xử lý tin không có danh mục) hoặc làm việc nhỏ riêng. Chỉ cần user quyết nếu muốn **giữ bắt buộc**; khi đó primary reconcile ERD §4.10 as-built, kèm evidence code.

## As-built doc cần reconcile (LOW, không chặn)
- **R18:** ERD §5 `:555` còn câu chung "index chỉ áp lên bản ghi chưa xoá (partial index `WHERE deleted_at IS NULL`)". Câu này mâu thuẫn với ghi chú "không partial" của `projects_list_idx`, `news_list_idx`, `job_postings_list_idx` (`:547-550`). Nên sửa thành "dự kiến partial; as-built: các index danh sách hiện không partial". ERD §4.2 bảng `:154` ghi `legacyNames` là "array of text", trong khi as-built là mảng `{ name }` (đã có ở `:161`). Nên sửa kiểu trong bảng cho khỏi hiểu nhầm. ARCH §4 `:129` thiếu `seed.mjs`/`seed-run.ts` (runner `pnpm seed`), `build-admin-units.mjs` + `scripts/admin-units/`; `:131` `seed/` thiếu `index.ts`, `geo.ts`, `data/` (xlsx/csv/JSON), `sample/`; thiếu `src/hooks/job-applications/`, `src/hooks/job-postings/`. ARCH `:212` (`close-job-postings` "Ẩn tin") đã có trong doc impact dự kiến của L6-T08 `:70`.
- **R19: Vệ sinh task file:** cả 3 task còn "Spec Validator verdict (layer close): pending" (L2-T02:67, L5-T01:71, L5-T04:68). L2-T02 Blast radius `:16` và Files `:90` vẫn ghi `seed/data/provinces.json, wards.json`, trong khi thực tế là `administrative-units.json` + `scripts/build-admin-units.mjs`. Tuỳ chọn: ghi r3-1 (comment `vietnamese-key.ts:37`) và L5-T04 r3 n1 (test bulk delete 403) vào Notes của L9-T06 hoặc L15-T01 để khỏi mất.

## Follow-up từ report layer 5: trạng thái cập nhật

| Mục | Trạng thái |
|---|---|
| G19 | **Đóng** (mục 3) |
| G12 (allowlist) | Đóng thêm cho `projects`, `job-postings`. Còn mở cho rentals/property-posts/homepage, đã gắn L6-T02:38, L7-T01, L8-T01 |
| R15 (API_SPEC:3) | **Đóng** |
| G15–G18, R4 | Không đổi (không thuộc addendum). R4 (`/brainstorm secrets`) vẫn chờ user |

## Residual risk của lần validate này
- Không mở xlsx/csv. Độ khớp dữ liệu địa giới dựa vào các điều kiện fail của converter, unit test đọc JSON và kiểm tra mẫu của reviewer (L2-T02 r1/r3). Con số 3.321 đơn vị (687/2.621/13) khớp số công bố sau sắp xếp 01/07/2025.
- Không chạy `pnpm payload migrate` (G21). Không kiểm S3 thật cho luồng xoá CV (test dùng spy).
- Không đọc toàn văn `seed/sample/projects.ts`, `delete-cv-and-audit.ts`, `guard-delete.ts` của job-postings và các file test. Dòng ma trận liên quan dựa vào Grep, test PASS hôm nay và reviewer STRICT.

## Tóm tắt cho user

**Đã xong thêm 3 task (layer 5 giờ đủ 8/8):**
- **Địa giới**: 34 tỉnh/thành, 3.321 phường/xã/đặc khu kèm tên cũ, lấy từ file anh duyệt (xlsx chính, CSV cho tên cũ, sửa "Phường Đào Duy Từ"). Lệnh `pnpm seed` chạy lại bao nhiêu lần cũng không nhân bản; dữ liệu mẫu bị chặn ở production.
- **Dự án** trong admin: đủ trường, bản đồ, bắt buộc có ảnh khi xuất bản, sale chỉ sửa dự án của mình.
- **Tuyển dụng** trong admin: tin tuyển dụng có hạn nộp. Hồ sơ ứng viên chỉ admin xem; admin chỉ đổi trạng thái/ghi chú. Xoá hồ sơ thì xoá luôn CV và ghi nhật ký không chứa dữ liệu cá nhân.
- Kiểm tra lại hôm nay: lint, typecheck, build và 1102/1102 test đều đạt.

**Layer 6 đã mở khoá hết (10/10 task chạy được).** Thứ tự đề xuất: L6-T03 → T02 → T09 → T10 → T06 → T07 → T04 → T05 → T08 → T01.

**Anh cần quyết định:**
1. **BL-003** (lệnh hoàn tác của 8 migration bị lỗi): không chặn deploy staging, vì deploy không bao giờ chạy hoàn tác. Chọn (a) sửa phần hoàn tác ngay bây giờ, trước khi lên staging (lúc rẻ nhất, chỉ đụng DB dev); hoặc (b) chấp nhận "chỉ sửa tiến" và ghi vào runbook.
2. **Trước L6-T01 (deploy staging):** tên miền staging; Cloudflare Access hay basic auth; secret staging; đích backup (S3 hay SFTP); cách báo động khi web/backup chết lúc chưa có stack giám sát (G10); có bật Authenticated Origin Pulls không. Thêm: anh muốn deploy staging **ngay** (lúc đầu ít trang) hay **sau khi xong các trang** dự án/tuyển dụng (đề xuất).
3. **Cho phép commit vài ảnh nhẹ vào repo** để dữ liệu mẫu dự án có ảnh và xuất bản được trên staging (L6-T04).
4. (Nhỏ) Tin tuyển dụng có **bắt buộc chọn danh mục** không? Tài liệu ghi là tuỳ chọn, code đang bắt buộc (G25). Nếu anh không trả lời, sẽ sửa theo tài liệu (tuỳ chọn).
5. Còn treo từ trước: `/brainstorm secrets` (R4), BL-001 (nợ thiết kế header/footer), BL-002 (image Debian 11 hết hỗ trợ).

**Primary tự gắn, không cần anh quyết:** G20 (đưa thư mục seed vào image), G21 (chạy thử toàn bộ migration trên DB trống trước khi lên staging), G22 (phường phải thuộc tỉnh, kiểm ảnh upload cho Cho thuê/Đăng tin), G23 (cách ẩn danh hồ sơ/lead khi hết hạn lưu), G24 (dữ liệu mẫu tuyển dụng published, thử rollback ở lần deploy thứ 2), R18/R19 (cập nhật tài liệu).
