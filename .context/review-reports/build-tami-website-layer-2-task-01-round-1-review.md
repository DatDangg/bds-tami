Agent: reviewer

# Review — build-tami-website layer-2-task-01 (media + private-files trên SeaweedFS S3), round 1

- **Review level:** STRICT
- **Reason:** upload/file access, schema migration, access control (BOLA), shared collection `media` dùng ở nhiều task sau.
- **Blast radius:** `src/collections/Media.ts`, `src/collections/PrivateFiles.ts`, `src/lib/upload/validate-file.ts` (+ test), `src/collections/Staff.ts` (`avatar`), `src/payload.config.ts` (2 plugin s3Storage, `upload.limits`), `migrations/20261016_104218_media_uploads.*`, `src/payload-types.ts`, deps `@payloadcms/storage-s3`, `file-type`, dev `@aws-sdk/client-s3`. Các task dùng media/CV sau này (layer 4/5/6/8).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK (exit 0) |
| `pnpm lint` | OK, 0 lỗi |
| `pnpm typecheck` | OK |
| `pnpm test` | OK — 31 files, 324 tests passed, **0 skipped** (integration media-upload chạy với DB + SeaweedFS thật; log có lỗi 403/400 là lỗi mong đợi trong test) |
| `pnpm build` | OK (exit 0) |
| `pnpm audit --audit-level high` | 2 low, 1 moderate, 1 high **(1 ignored)**, high đã nằm trong danh sách ignore có sẵn, không do task này |

Working tree sau `stash`/`pop`: `git stash list` rỗng; file thay đổi/mới khớp phạm vi task (+ run journal, progress). Không thừa/mất file.

## Kiểm tra trọng tâm
- **Migration** (`20261016_104218_media_uploads.ts:4-93`): chỉ CREATE TABLE / ADD COLUMN nullable / ADD FK trên cột mới / CREATE INDEX. Additive, không có HIGH_RISK_MIGRATION.
- **Guard `createUploadGuard`** (`validate-file.ts:75-90`): đọc `args.req.file` do Payload đã parse (không tự parse body, đúng bài học error-memory 2026-10-16). Sniff bằng `file-type`, ghi đè `name` (UUID + đuôi theo nội dung) và `mimetype`.
  - REST multipart: test 415 HTML-giả-jpg, SVG, 413 ảnh 11MB, 413 >20MB (busboy `abortOnLimit` mặc định true, `payload/dist/uploads/fetchAPI-multipart/index.js:7`).
  - Local API overrideAccess: test 415/413 với private-files.
  - Tạo bằng `data.url` không kèm file: guard trả 400 trước `getExternalFile` (có test).
  - Update không kèm file: `generateFileData.js:64` lấy nguồn từ `originalDoc` chứ không từ data client, nên client không chèn được URL ngoài. Update có kèm file thì vẫn qua guard.
  - Duplicate: `disableDuplicate: true`; nhánh `duplicateFromID` chỉ sao chép file đã được kiểm.
  - Giới hạn: ảnh 10MB, PDF 20MB, video 15MB, CV 5MB PDF/DOC/DOCX. Đúng AC. `limitInputPixels: 80M`.
- **private-files:** chỉ admin cho cả 4 thao tác; `generateFileURL` trả rỗng; `handlers` trả 404 (đã test cả admin lẫn khách); bucket riêng `S3_BUCKET_PRIVATE` (đã test object nằm ở private, không có ở public).
- **Quyền media:** read công khai; create `isStaff`; update `ownedByUserOrAdmin("uploadedBy")` (sale sửa của người khác bị 403, đã test); delete chỉ admin. `uploadedBy` bị ghi đè khi create và giữ bất biến khi update (đã test spoof). `alt` bắt buộc với ảnh (đã test).

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip (lệnh không nằm trong allowlist verify của reviewer). Đọc tay không thấy slop.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS.
- ocr: skip, ocr not installed / không trong allowlist.
- AI-readable: OK. Tên rõ ràng, hàm < 50 dòng, file < 300 dòng, hằng số có tên (`MB`, `HTTP_*`), comment giải thích WHY. 0 indicator.
- ai-friendly-web: N/A (không phải task public-facing web).
- blitzstrike: skip (không có môi trường được phép).

## Findings
- **[MINOR]** `migrations/20261016_104218_media_uploads.ts:101-104`: `down()` chạy `DROP TABLE "media" CASCADE` trước, lệnh này đã gỡ luôn FK `staff_avatar_id_media_id_fk`. Sau đó `ALTER TABLE "staff" DROP CONSTRAINT "staff_avatar_id_media_id_fk"` không có `IF EXISTS` nên sẽ lỗi khi rollback. Đây là artifact của generator Payload và không ảnh hưởng `up`. Đề xuất: thêm `IF EXISTS` cho các DROP CONSTRAINT/INDEX trong `down` (migration chưa apply staging/prod nên sửa được).
- **[MINOR]** `src/collections/Media.ts:30,66-71`: `read: () => true` làm lộ `uploadedBy` (id staff) và metadata cho khách. Rủi ro thấp (chỉ là UUID, không populate được staff). Đề xuất: thêm field-level `access.read: isStaff` cho `uploadedBy`.
- **[MINOR]** `src/lib/upload/validate-file.ts:25` + `Media.ts`: PDF công khai phục vụ inline trên cùng origin; magic-bytes chỉ kiểm phần đầu file (polyglot JPEG/PDF + payload vẫn qua được). Content-Type đã bị ép đúng nên rủi ro XSS thấp. Đề xuất ở task sau: header `X-Content-Type-Options: nosniff` + `Content-Disposition: attachment` cho PDF, hoặc phục vụ media từ domain riêng.
- **[MINOR]** `tests/integration/media-upload.test.ts`: thiếu ca AVIF/WebP/PNG, video MP4/WebM (≤15MB và >15MB → 413). Unit `validate-file.test.ts` có thể đã bao một phần. Đề xuất bổ sung 1 ca video 413.

## Residual risk
- Chính sách bucket private trên SeaweedFS (cấm anonymous read) là cấu hình hạ tầng, ngoài code; chưa kiểm chứng ngoài việc object nằm đúng bucket.
- Chưa có CDN/header bảo mật cho file public (xem MINOR 3).

## Verdict
**PASS**: không có CRITICAL/MAJOR; còn 4 MINOR đề xuất xử lý sau.
