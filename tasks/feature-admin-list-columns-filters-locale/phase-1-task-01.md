# feature-admin-list-columns-filters-locale · phase-1-task-01 — "Hiển thị cột" + "Thêm bộ lọc" chỉ còn trường nghiệp vụ ở MỌI collection (BL-039 #1 #2)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md` (BACKLOG BL-039). Spec delta: FR-ADM-19 câu "**Danh sách gọn (BL-039)**".
- Phụ thuộc: không. Trạng thái: `done` — Reviewer STRICT r2 PASS (`.context/review-reports/feature-admin-list-columns-filters-locale-phase-1-task-01-round-2-review.md`; r1 FAIL M1 nhóm `sizes` Media mất cờ sau plugin s3Storage).

## Classification / Risk
- Type: **MODIFY** (config admin field `admin.disableListColumn` / `disableListFilter`; không đổi schema/DB/access/endpoint).
- Risk: **MEDIUM** — chạm config mọi collection (shared helper); Lọc dịch / xuất Excel dựa `where` → review **STRICT** (shared, nhiều collection).
- Blast radius: `src/lib/admin/list-filter.ts` (+test), mọi `src/collections/*.ts`, `src/collections/_shared/content-defaults.ts`, `redirects-plugin.ts`, có thể `payload.config.ts`.
- Doc impact: FR-ADM-19 (đã ghi delta). ERD/API_SPEC: no doc impact. Migration: không (xác nhận không sinh migration — `admin.*` không đổi DB).

## Quyết định (auto proceed — user chỉ thị 2026-10-21)
- D1 **Quy tắc chung**, mở rộng helper hiện có (không viết helper thứ 2): `hideTechnicalListFilters` → helper chung (vd `hideTechnicalListFields(collection, { hiddenPaths })`; giữ tên cũ làm alias nếu tiện) đặt CẢ `disableListColumn` lẫn `disableListFilter`:
  - Ẩn khỏi **cột + bộ lọc**: nhóm `seo` (cả cây), nhóm `translation` (cả cây — "Bản dịch tiếng Anh > …"), `slug`, `scopeSlug`, `hasEnglish` ("Có bản tiếng Anh" — đã có ô "Trạng thái dịch"), `searchText` / trường hash-dấu / timestamp kỹ thuật, kiểu `richText`, `textarea`, `json`, `array`, `blocks`, `point`, `join` (join: giữ hành vi hiện có nếu Payload không cho cột join).
  - Chỉ ẩn khỏi **bộ lọc** (cột giữ): `upload` (cột ảnh `gallery`/`cover` đang là cột mặc định).
  - Ẩn khỏi **cột + bộ lọc** thêm (spec-validator G3): trường `ui` KHÔNG có `admin.components.Cell` (nút thao tác `approveEnglishAction` Pages, `cvDownload` JobApplications…) và trường ảo kỹ thuật (`searchReindexPending` — `src/fields/search-reindex-pending.ts`). Helper KHÔNG được tắt cột cho trường `ui` có `Cell` (T04 cần).
  - `hiddenPaths` hiện có (BL-021: Rentals `address`/`showExactAddress`/`videoUrl`…, PropertyPosts `priceNote`, Projects `address`/`scale`/`priceUpdatedAt`) GIỮ nghĩa cũ = **chỉ ẩn bộ lọc** (spec-validator G4 — chốt): đó là trường nghiệp vụ, vẫn chọn làm cột được. Trường cần ẩn CỘT riêng từng collection → tham số riêng (vd `hiddenColumnPaths`), ghi vào bảng "Danh sách ẩn thêm".
  - `createdAt`/`updatedAt` GIỮ (nghiệp vụ "Ngày tạo"/"Ngày sửa").
  - `defaultColumns` của mọi collection KHÔNG đổi; test khẳng định không trường nào trong `defaultColumns` hay `useAsTitle` bị `disableListColumn`.
- D2 **Áp cho mọi collection admin**: Staff, Media, PrivateFiles, AuditLogs, ClickEvents, ClickStatsDaily, TranslationUsage, Categories, Developers, Provinces, Wards, Services, Pages, News, Projects, Rentals, PropertyPosts, JobPostings, JobApplications, Leads, LeadActivities (+ `redirects` của plugin nếu admin thấy). Cách áp: builder chọn cách ít lặp nhất (vd áp trong `withContentDefaults` + gọi ở collection còn lại, hoặc map một lần trên mảng `collections` của `payload.config.ts` giữ `hiddenPaths` riêng). Danh sách ẩn thêm từng collection (ngoài quy tắc chung) do builder đề xuất theo nghiệp vụ và **ghi vào bảng "Danh sách ẩn thêm"** (vd Media: `sizes`, `focalX/Y`, `filesize`, `width/height`; Staff: trường auth kỹ thuật `loginAttempts`, `lockUntil`, `sessions`, `resetPassword*` nếu hiện).
- D3 Trường hệ thống `id` và `deletedAt` (trash): nếu Payload 3.91 cho ẩn khỏi menu cột bằng config mà **không đổi schema** → làm; không có cách → KHÔNG thêm trường `id`/`deletedAt` vào schema, không patch `node_modules`; ghi gap/residual vào task file.
- D4 Test: mở rộng `src/lib/admin/list-filter.test.ts` (hoặc test mới cạnh nó) — duyệt config THẬT từng collection, khẳng định: SEO/translation/slug/hasEnglish/richText/textarea có `disableListColumn` + `disableListFilter`; upload chỉ `disableListFilter`; `defaultColumns` + `useAsTitle` không bị disable; trường nghiệp vụ mẫu (JobPostings `deadline`/`status`/`category`; JobApplications `status`/`jobPosting`; Pages `kind`; Categories `scope`) vẫn lọc + hiện cột được. Test BL-021 cũ giữ PASS.

## Danh sách ẩn thêm (builder điền)
| Collection | Ẩn thêm (cột+lọc) | Lý do |
|---|---|---|
| mọi collection (quy tắc chung) | `seo.*`, `translation.*`, `slug`, `scopeSlug`, `hasEnglish`, `searchText`, `searchReindexPending`, mọi trường `admin.hidden`, tên kết thúc `Hash`/`Normalized` (`ipHash`, `phoneNormalized`), kiểu richText/textarea/json/array/blocks/point/join, `ui` không Cell | không có giá trị nghiệp vụ trong danh sách (Payload không tự bỏ `admin.hidden` khỏi menu cột) |
| media, private-files | `url`, `thumbnailURL`, `filesize`, `width`, `height` (stub cùng tên/kiểu trong helper) + nhóm `sizes` của Media (cờ `admin` trên từng `imageSizes` trong `Media.ts`) | trường nền Payload tự thêm; không đổi schema. Giữ `filename`, `mimeType` |
| click-events | `aggregatedAt` | mốc kỹ thuật của job gộp thống kê |
| job-applications | `consentVersion`, `anonymizedAt` | phiên bản chính sách / cờ xoá dữ liệu: kỹ thuật (giữ `consentAt`) |
| leads | `consentVersion`, `anonymizedAt`, `mergedCount`, `remindedAt`, `assigneeInactive` | cờ/bộ đếm nội bộ của job nhắc/gộp lead |
| rentals, projects, property-posts, news, leads | (BL-021 giữ nguyên) `hiddenPaths` chỉ ẩn bộ lọc | trường nghiệp vụ, vẫn chọn làm cột |
| redirects (plugin) | không ẩn thêm | chỉ 3 trường nghiệp vụ `from`/`to`/`type` |
| `defaultColumns`/`useAsTitle` | không bao giờ ẩn cột | vd `lead-activities.content` (textarea) là cột mặc định nên giữ cột |

## Residual đã biết
- Checkpoint "chụp ảnh danh sách để user duyệt" bỏ qua theo chỉ thị auto proceed của user; danh sách trường ẩn ghi ở bảng trên thay ảnh.

## Acceptance
- [ ] "Hiển thị cột" mọi collection không còn SEO, Bản dịch tiếng Anh >…, slug, Có bản tiếng Anh, richText/textarea dài, trường kỹ thuật; cột mặc định không đổi.
- [ ] "Thêm bộ lọc" mọi collection chỉ còn trường nghiệp vụ; test phủ collection mới áp.
- [ ] ID / Đã xoá lúc: ẩn được bằng config, hoặc ghi gap rõ.
- [ ] Không đổi schema/DB/access; Lọc dịch, chip, xuất Excel vẫn chạy (test liên quan PASS); không sinh migration.

## Verify
`pnpm vitest run src/lib/admin src/collections src/components/admin`, `pnpm typecheck`, `pnpm lint`.

## Verification summary
### Acceptance
- [x] "Hiển thị cột" mọi collection: ẩn SEO, Bản dịch tiếng Anh >…, slug, hasEnglish, richText/textarea…, trường kỹ thuật; `defaultColumns` không đổi (test).
- [x] "Thêm bộ lọc" mọi collection chỉ còn trường nghiệp vụ; test duyệt config thật 21 collection.
- [x] ID / Đã xoá lúc: **gap, không ẩn được** (xem D3 bên dưới).
- [x] Không đổi schema/DB/access: `pnpm payload generate:types` chạy được, `src/payload-types.ts` không đổi; không sinh migration.

### Quyết định của builder
- Mở rộng helper: `hideTechnicalListFilters` đổi tên `hideTechnicalListFields(collection, hiddenPaths /*chỉ lọc*/, hiddenColumnPaths /*cột+lọc*/)`; 5 caller cũ đổi tên.
- Áp một chỗ: `src/collections/admin-collections.ts` (`ADMIN_COLLECTIONS`, map helper trên 21 collection + bảng `EXTRA_HIDDEN_COLUMNS`); `payload.config.ts` dùng nó. Redirects plugin không đổi.
- D3 (evidence): `@payloadcms/ui/dist/elements/ColumnSelector/index.js:20` chỉ bỏ cột khi `fieldIsHiddenOrDisabled && !fieldIsID` hoặc `admin.disableListColumn`; `id` được miễn riêng (không có field config để gắn cờ). `deletedAt`/`createdAt`/`updatedAt` do `payload/dist/collections/config/sanitize.js:113-153` tự thêm (`admin.hidden` mà ColumnSelector không kiểm) và chỉ bỏ thêm khi config đã khai trường cùng tên. Khai `deletedAt` = thêm field vào schema → theo D3 KHÔNG làm. Residual: "ID" và "Đã xoá lúc" vẫn hiện trong menu cột.
- `filterFields.js` cũng kiểm `disableListColumn` ở từng nút (group bị cờ thì bỏ cả cây); helper vẫn gắn cờ từng lá cho chắc.
- `ui`: có `admin.components.Cell` → giữ cột (cho T04); không Cell → ẩn cột + lọc. `ui` luôn ẩn lọc.
- Trường nền upload (Media/PrivateFiles) khai lại bằng stub cùng tên/kiểu để `mergeBaseFields` gộp cờ (url còn cờ sau `plugin-cloud-storage/getFields.js` vì `{...baseURLField, ...existingURLField}`).

### Files
Sửa: `src/lib/admin/list-filter.ts`, `list-filter.test.ts`, `src/payload.config.ts`, `src/collections/{Leads,News,Projects,PropertyPosts,Rentals}.ts` (đổi tên import). Thêm: `src/collections/admin-collections.ts`.

### Verify
- `pnpm vitest run src/lib/admin src/collections src/components/admin`: 39 file / 275 test PASS. `pnpm typecheck` PASS. `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs).
- Doc impact: FR-ADM-19 đã có delta; ERD/API_SPEC no doc impact.

### Round 2 (sửa review r1 M1/m1/m2)
- M1: plugin S3 (`plugin-cloud-storage/dist/fields/getFields.js`, nhánh `imageSizes`) dựng lại nhóm `sizes` với `admin: { hidden: true }` nên stub `sizes` mất cờ. Đã bỏ `UPLOAD_SIZES_STUB`; thêm `admin: { disableListColumn, disableListFilter }` vào từng entry `imageSizes` ở `src/collections/Media.ts` — `payload/dist/uploads/getBaseFields.js:156-190` lan cờ xuống nhóm size + trường `url`, rồi `mergeBaseFields` giữ cờ của base. Không đổi schema.
- Test mới `src/lib/admin/list-filter-sanitized.test.ts`: `buildConfig` thật (postgresAdapter không kết nối + 2 `s3Storage` như payload.config) rồi áp luật `filterFields`; khẳng định Media/PrivateFiles không còn `url`/`sizes.*`/`filesize`/`width`/`height`/`prefix`/`_objectKey` và còn `filename`/`mimeType`/`alt`. Đã kiểm mutation: bỏ cờ ở `imageSizes` → test FAIL (còn `sizes.thumb.url`…).
- Stub `url`: plugin chạy `{...baseURLField, ...existingURLField}` giữ cờ (test trên phủ); `thumbnailURL`/`filesize`/`width`/`height` plugin không đụng.
- m1: tách `filterOnly`/`keepColumn` khỏi object `hidden`.
- Verify lại: `pnpm vitest run src/lib/admin src/collections src/components/admin` 40 file / 276 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error; `src/payload-types.ts` không đổi.
- Files thêm so với round 1: `src/collections/Media.ts`, `src/lib/admin/list-filter-sanitized.test.ts`.

### Residual
- Chưa xem menu cột bằng trình duyệt thật; evidence là config sau plugin + sanitize (test trên).
- ID / Đã xoá lúc còn hiện (gap D3).
