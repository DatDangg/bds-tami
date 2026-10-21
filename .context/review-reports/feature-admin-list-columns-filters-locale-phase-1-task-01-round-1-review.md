Agent: reviewer

# Review — feature-admin-list-columns-filters-locale · phase-1-task-01 · round 1 (BL-039 T01)

- **Review level:** STRICT
- **Reason:** helper dùng chung (`hideTechnicalListFields`) áp lên config của cả 21 collection admin qua `ADMIN_COLLECTIONS` (payload.config); khai lại base field upload của Media/PrivateFiles (rủi ro schema/S3); Lọc dịch / chip / xuất Excel dựa `where`.
- **Blast radius:** `src/lib/admin/list-filter.ts` (+test), `src/collections/admin-collections.ts` (mới), `src/payload.config.ts`, 5 collection đổi tên import (Leads/News/Projects/PropertyPosts/Rentals); runtime: menu "Hiển thị cột"/"Thêm bộ lọc" mọi collection, Media/PrivateFiles qua plugin `@payloadcms/storage-s3` (plugin-cloud-storage `getFields`) + `mergeBaseFields` của Payload 3.91.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/lib/leads` | PASS — 45 file / 372 test |
| `pnpm typecheck` | PASS (0 lỗi) |
| `pnpm lint` | 0 error, 2 warning cũ (`tools/task-dashboard/server.mjs`) — ngoài diff |
| `pnpm payload generate:types` | skip, không nằm trong lệnh reviewer được phép chạy; kiểm bằng đọc code (xem mục 2) |

## Kiểm theo trọng tâm
1. **D1–D4, G3/G4, FR-ADM-19:** helper mở rộng đúng D1 (đổi tên, `hiddenPaths` = chỉ lọc (G4), `hiddenColumnPaths` = cột+lọc; upload chỉ ẩn lọc; `ui` có `Cell` giữ cột, `ui` không Cell ẩn (G3); `searchReindexPending`, `hasEnglish` ẩn; `createdAt/updatedAt` giữ). D2: map một lần trên 21 collection, redirects không đổi (có lý do). D4: test duyệt `ADMIN_COLLECTIONS` thật + mẫu nghiệp vụ JobPostings/JobApplications/Pages/Categories; test BL-021 cũ cập nhật đúng (bỏ `hasEnglish`).
2. **Schema/S3:** `mergeBaseFields` (payload/dist/fields/mergeBaseFields.js) `deepMergeWithReactComponents(baseField, stub)` — stub chỉ có `name/type/admin` nên giữ nguyên hooks `afterRead/beforeChange` (generateFilePathOrURL), `hidden`, `readOnly`, `label`; base list (`uploads/getBaseFields.js:96-110`) luôn có đủ `url, thumbnailURL, filename, mimeType, filesize, width, height` → không thêm cột DB. Qua plugin-cloud-storage `getFields.js`: url = `{...baseURLField, ...stub}` rồi plugin tự gắn hook adapter (`generateFileURL`, `disablePayloadAccessControl` giữ nguyên) → hành vi upload/S3 không đổi; cờ `disableListColumn` của url còn. Thứ tự field sau merge không đổi (stub ở cuối, base field được push theo thứ tự base như trước). Thứ tự `ADMIN_COLLECTIONS` khớp hệt mảng cũ trong payload.config (Staff, Media, PrivateFiles, AuditLogs, … LeadActivities).
3. **defaultColumns/useAsTitle:** `keptColumns` loại trừ khỏi ẩn cột; test "cột mặc định và useAsTitle không bị ẩn khỏi cột" duyệt config thật. OK.
4. **Lọc dịch / chip / Excel:** cờ `admin.disable*` chỉ ảnh hưởng menu UI, không đổi `where`/access/endpoint; test `src/components/admin` + `src/lib/leads` PASS.
5. **D3:** đúng với Payload 3.91 — `@payloadcms/ui/dist/elements/ColumnSelector/index.js:20` và `providers/TableColumns/buildColumnState/filterFields.js` chỉ bỏ `field.hidden` (top-level, `fieldIsHiddenOrDisabled` ở `payload/dist/fields/config/types.js:40`) hoặc `admin.disableListColumn`, và miễn `id`; `deletedAt` được `collections/config/sanitize.js:146` tự thêm với `admin.hidden` chỉ khi config chưa khai. Không ẩn được nếu không khai field → gap ghi đúng.

## Findings

### [MAJOR] M1 — Nhóm `sizes` của Media vẫn hiện trong "Hiển thị cột" ở config thật (cờ bị plugin S3 ghi đè); test không phủ
- `src/lib/admin/list-filter.ts:333` (`UPLOAD_SIZES_STUB`) + `:354-360`: stub `sizes` được gắn `disableListColumn/disableListFilter` ở `ADMIN_COLLECTIONS`, nhưng `s3Storage` (payload.config.ts:106, `collections: { media: true }`) chạy SAU, và `plugin-cloud-storage/dist/fields/getFields.js` dựng lại `sizesField = { ...existingSizesField, name: 'sizes', type: 'group', admin: { hidden: true }, fields: imageSizes.map(...) }` → `admin` bị thay hẳn, cờ mất; các nhóm con `thumb/card/large/og` dựng mới không cờ. Sau đó base field của Payload (`getBaseFields.js:156-190`) chỉ gắn `disableListColumn` cho nhóm size khi `size.admin.disableListColumn`. `filterFields` không bỏ `admin.hidden` → "Sizes > Thumb > URL/Width/…" vẫn còn trong menu cột Media — trái bảng "Danh sách ẩn thêm" (nhóm `sizes` (Media)) và Acceptance #1 đã tick.
- Test `list-filter.test.ts:290-297` chỉ kiểm `url/thumbnailURL/filesize/width/height` trên config TRƯỚC plugin, không kiểm `sizes` → false confidence.
- **Fix đề xuất:** khai `admin: { disableListColumn: true, disableListFilter: true }` trên từng entry `imageSizes` trong `src/collections/Media.ts:62-67` (Payload hỗ trợ sẵn, lan xuống nhóm size + lá; không đổi schema) và bỏ `UPLOAD_SIZES_STUB`; HOẶC áp helper trong plugin cuối (sau `s3Storage`). Thêm test kiểm cờ trên config sau plugin (vd chạy `s3Storage(...)`/`adminNavGroupsPlugin` trên config hoặc assert `imageSizes[].admin.disableListColumn`). Nếu chọn không xử lý → sửa bảng/Acceptance và ghi residual thay vì khẳng định đã ẩn.

### [MINOR] m1 — Dòng điều kiện quá dài, khó đọc
- `src/lib/admin/list-filter.ts:406` — object `hidden` một dòng ~250 ký tự gộp 6 điều kiện. Tách `filterOnly` thành biến riêng như `both`.

### [MINOR] m2 — Residual chưa xem UI thật
- Task tự ghi chưa xác nhận menu cột Media bằng trình duyệt; M1 cho thấy đọc code trước-plugin là chưa đủ. Sau fix nên ghi evidence dựa config sau plugin.

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, không nằm trong lệnh được phép của reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (eslint `pnpm lint` 0 error) |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 1 indicator nhẹ (m1); hàm ≤50 dòng, file ≤300 dòng, comment nêu WHY |
| ai-friendly-web | N/A — admin nội bộ |
| blitzstrike | N/A — không đổi auth/endpoint/input |
| Responsive Checklist | N/A — chỉ đổi config cờ admin Payload, không route/component/CSS |
| Surgical diff | OK — mọi dòng trace về BL-039 T01 |

## Verdict: FAIL
Lý do: M1 (MAJOR) — mục "nhóm `sizes` (Media)" ẩn khỏi cột không có hiệu lực trong config thật do plugin S3 ghi đè `admin`, test không phát hiện. Phần còn lại (schema/S3 hooks, thứ tự collection, defaultColumns, D3, Lọc dịch/chip/Excel) đạt.
