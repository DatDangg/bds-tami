Agent: reviewer

# Review: build-tami-website layer-2-task-01, round 2 (kiểm phần sửa MINOR sau round 1)

- **Review level:** STRICT, phạm vi hẹp
- **Reason:** phần sửa đụng migration `down()` và field-level access của collection `media` (upload/file access, shared collection).
- **Blast radius:** `migrations/20261016_104218_media_uploads.ts` (chỉ rollback), `src/collections/Media.ts` (field `uploadedBy` đọc qua REST/GraphQL/Local API có `overrideAccess: false`), `tests/integration/media-upload.test.ts`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK (exit 0) |
| `pnpm lint` | OK (exit 0) |
| `pnpm typecheck` | OK (exit 0) |
| `pnpm test` | OK: 31 files, **325 passed** (round 1: 324, tăng 1), 0 failed/skipped |
| `pnpm build` | OK (exit 0) |

**Số test thật của `media-upload.test.ts`:** đếm `it(` được **18** (dòng 117…329). Round 1 có 17, tổng repo tăng đúng 1 (+1 ca video 413). Ca "khách không thấy uploadedBy" được gộp vào test có sẵn ở dòng 141 chứ không phải test mới. Builder báo "17 → 19" là sai, "18/18" mới đúng. Chỉ sai ở phần báo cáo, code không lỗi.

## Kiểm phần sửa
- **`down()`** (dòng 104-112): mọi `DROP CONSTRAINT`/`DROP INDEX` đã có `IF EXISTS`. Sau `DROP TABLE ... CASCADE` thì FK `staff_avatar_id_media_id_fk` không còn làm rollback lỗi. Các lệnh `DROP COLUMN` còn lại chạy được vì cột vẫn tồn tại. Rollback trên dev do builder tự chạy, reviewer không chạy lại (không thuộc allowlist).
- **`up()`** (dòng 3-94): nội dung khớp mô tả round 1 (CREATE TABLE/ADD COLUMN nullable/FK/INDEX, additive) và bố cục dòng khớp tham chiếu round 1 (`up` 4-93, `down` 101-104). Không có HIGH_RISK_MIGRATION.
- **`uploadedBy`** (`Media.ts:66-73`): đã thêm `access: { read: isStaff }`. Hook `stampUploader` không đổi. Các test có sẵn vẫn PASS: gán khi tạo (dòng 130), chống spoof (dòng 217), bất biến khi sửa (dòng 240). Test dòng 150-153 xác nhận khách không thấy field này còn sale thấy.
- **Video > 15MB** (dòng 192-196): file 16MB có header `ftyp` MP4 hợp lệ trả 413. Vì 16MB nhỏ hơn trần 20MB nên 413 đến từ policy video, không phải từ trần chung.

## Responsive Checklist Gate
N/A: diff không đụng UI.

## Skill gates
- aislop: skip (không có trong allowlist verify).
- oxlint: skip, oxlint not configured. eslint PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK, 0 indicator (comment ghi lý do, hàm/file ngắn).
- ai-friendly-web: N/A.
- blitzstrike: skip (không có môi trường được phép).

## Findings
- **[MINOR]** Builder báo sai số test media-upload ("17 → 19"); thực tế là 18. Đề xuất sửa con số trong task file/journal cho đúng.
- MINOR 3 của round 1 (header nosniff/attachment cho PDF) vẫn để task sau như đã đề xuất; không chặn.

## Residual risk
- Migration là file untracked nên không có diff git của `up()` so với round 1; chỉ đối chiếu được qua nội dung và số dòng trong report round 1.
- Kết quả migrate:down/up chỉ dựa vào báo cáo của builder.

## Verdict
**PASS**: không có CRITICAL/MAJOR. Các MINOR 1, 2, 4 của round 1 đã xử lý xong.
