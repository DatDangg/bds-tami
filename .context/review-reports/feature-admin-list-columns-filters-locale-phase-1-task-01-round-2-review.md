Agent: reviewer

# Review — feature-admin-list-columns-filters-locale · phase-1-task-01 · round 2 (BL-039 T01)

- **Review level:** STRICT
- **Reason:** helper `hideTechnicalListFields` dùng chung, áp lên config của 21 collection qua `ADMIN_COLLECTIONS`; collection upload Media/PrivateFiles đi qua plugin S3 + `mergeBaseFields` (rủi ro schema/URL ảnh). Round 1 FAIL vì M1.
- **Blast radius:** `src/lib/admin/list-filter.ts` (+2 test), `src/collections/admin-collections.ts` (mới), `src/collections/Media.ts` (`imageSizes[].admin`), `src/payload.config.ts`, 5 collection đổi tên import. Runtime: menu "Hiển thị cột"/"Thêm bộ lọc" mọi collection; Media sizes qua `@payloadcms/storage-s3`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/admin src/collections src/components/admin src/lib/leads` | PASS — 46 file / 373 test (thêm 1 file/1 test so với round 1) |
| `pnpm typecheck` | PASS (0 lỗi) |
| `pnpm lint` | 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài diff) |

## Đóng finding round 1
- **M1 — ĐÓNG.** `UPLOAD_SIZES_STUB` đã bỏ (`list-filter.ts`, chỉ còn 5 stub url/thumbnailURL/filesize/width/height). `Media.ts:65-68` gắn `admin: HIDDEN_FROM_LIST` (`disableListColumn` + `disableListFilter`) trên từng `imageSizes`. Payload 3.91 hỗ trợ sẵn: `uploads/types.d.ts:69` (`ImageSize.admin`) và `uploads/getBaseFields.js:166-233` lan cờ xuống nhóm size + các lá. Base field được gộp lúc sanitize, tức là sau plugin S3, nên cờ không bị plugin ghi đè.
- **Schema / payload-types / ảnh:** `imageSizes[].admin` chỉ được `getBaseFields` đọc để gắn cờ UI; sharp resize (`width/height/formatOptions`) không đọc nó, còn tên và kiểu field không đổi → không đổi cột DB hay `payload-types`. Hook URL do plugin S3 gắn (`generateFileURL`; private: `disablePayloadAccessControl`) không bị đụng, `sizes.*.url` vẫn sinh như cũ → frontend không ảnh hưởng. `typecheck` PASS xác nhận type hợp lệ.
- **Test mới `list-filter-sanitized.test.ts` — OK.** Gọi `buildConfig` thật với 2 `s3Storage` giống `payload.config.ts:106-117`. `postgresAdapter` chỉ khởi tạo, không kết nối (buildConfig không gọi `init`/`connect`), S3 client không gọi mạng → không cần DB/mạng, deterministic, không flaky. `visibleColumns` mô phỏng đúng `filterFields` (bỏ cả cây khi có `disableListColumn`/`hidden`, không bỏ `admin.hidden`). Regex có `sizes` nên bỏ cờ ở `imageSizes` thì test fail; task file ghi đã kiểm mutation. Test cũng kiểm vẫn còn `filename`/`mimeType`/`alt`.
- **m1 — ĐÓNG.** Điều kiện tách thành biến `both` / `filterOnly` / `keepColumn` (`list-filter.ts`, trong `visit`), đọc rõ.
- **m2 — ĐÓNG.** Task file có evidence dựa trên config sau plugin (dòng 71-72) thay cho đọc config trước plugin; phần chưa xem UI bằng trình duyệt vẫn ghi ở mục Residual.

## Rà lại toàn diff T01
Không có thay đổi mới ngoài phần sửa của round 2. Các kết luận đạt ở round 1 vẫn đúng: thứ tự `ADMIN_COLLECTIONS`, giữ `defaultColumns`/`useAsTitle`, D3, Lọc dịch/chip/Excel không đổi `where`. Mọi dòng đều trace về BL-039 T01.

## Findings
- Không còn CRITICAL/MAJOR.
- [MINOR] (không chặn) `list-filter.ts`: dòng tạo `admin` trong `withAdminFlags` và JSDoc của `UPLOAD_BASE_STUBS` vẫn dài (~180 ký tự); có thể xuống dòng cho dễ đọc. Nếu sửa thì làm tùy chọn.

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, không nằm trong lệnh được phép của reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (`pnpm lint` 0 error) |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 0 indicator đáng kể; hàm ≤50 dòng, file ≤300 dòng, comment nêu WHY |
| ai-friendly-web | N/A — admin nội bộ |
| blitzstrike | N/A — không đổi auth/endpoint/input |
| Responsive Checklist | N/A — chỉ đổi cờ config admin Payload, không có route/component/CSS |
| Surgical diff | OK |

## Residual risk
- Chưa xác nhận menu cột Media/PrivateFiles bằng trình duyệt; test sanitize thay thế bằng cách mô phỏng `filterFields`, nếu Payload đổi logic ở bản sau thì cần xem lại.

## Verdict: PASS
