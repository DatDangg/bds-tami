---
id: api-error-name-minified
type: bug
status: done
created: 2026-10-28
---

# Admin prod: mọi lỗi APIError hiện "An unknown error occurred." thay vì thông báo tiếng Việt (BL-093)

Nguồn: follow-up BL-088 (root cause đã chứng minh ở `tasks/bug-admin-upload-oversize-toast/phase-1-task-01.md` mục 2), ghi nhận 2026-10-28.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: admin `/admin` (bản build production / staging) · Admin/Sale
- Bước tái hiện: thao tác bị chặn có chủ đích, vd xoá danh mục/phường/tin tuyển dụng/media đang được dùng (guard-delete 409), lưu Staff sai quy tắc, slug trùng/không hợp lệ.
- Expected: toast hiện đúng thông báo tiếng Việt server ném ra.
- Actual: build prod minify → `ExtendableError` gán `this.name = this.constructor.name` = `""` → `payload/dist/utilities/formatErrors.js` nhánh `if (incoming.name)` sai → "An unknown error occurred.". Dev không minify nên dev hiện đúng.
- Điểm ném `new APIError` (ngoài test, đã sửa riêng `src/lib/upload/validate-file.ts` ở BL-088): `src/collections/Provinces.ts`, `src/collections/Staff.ts` (2), `src/fields/slug.ts`, `src/hooks/{categories,job-postings,media,wards}/guard-delete.ts`, `src/hooks/pages/sync-privacy-version.ts`. Có thể còn `Forbidden`/`ValidationError` khác — grep đủ.

## Acceptance (bắt buộc)
- [x] Một cách chung (helper/cấu hình) để mọi lỗi public ném từ code repo giữ `name` đúng ở build prod — không vá rải rác từng chỗ nếu tránh được; `validate-file.ts` dùng chung cách mới.
- [x] Test khoá: lỗi ném ra qua `formatErrors` (hoặc tương đương) trả đúng message khi `constructor.name` rỗng (mô phỏng minify).
- [x] Kiểm build production (`pnpm build` + start) ít nhất 1 trường hợp 409 guard-delete hiện đúng tiếng Việt.
- [x] Không đổi mã HTTP / hành vi chặn hiện có.

## Kết quả
- Done 2026-10-28: hook `config.hooks.afterError` `restorePublicErrorMessage` (`src/hooks/restore-public-error-message.ts`) — task `tasks/bug-api-error-name-minified/phase-1-task-01.md`, STRICT PASS r1, no spec change (1.61.0) / test-scope v95.
