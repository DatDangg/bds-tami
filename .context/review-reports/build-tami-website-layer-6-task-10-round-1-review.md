Agent: reviewer

# Review: build/tami-website, layer-6-task-10, round 1
Task: `tasks/tami-website/layer-6-task-10.md`, endpoint `GET /api/admin/private-files/:id/download` + audit `application.view_cv` + nút "Tải CV" trong form hồ sơ ứng tuyển.
Scope: diff chưa commit so với HEAD `f972a5a` (bỏ qua `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`).

## Review level
**STRICT**

## Reason
Đụng quyền truy cập file + PII (CV ứng viên), BOLA/IDOR, khoá object S3, audit bắt buộc theo PERMISSION §6, và `payload.config.ts` dùng chung.

## Blast radius
- Mới: `src/endpoints/admin/private-file-download.ts`, `src/lib/http/content-disposition.ts` (helper dùng chung, thuần), `src/components/admin/CvDownloadButton.tsx`.
- Sửa: `src/payload.config.ts` (thêm endpoint vào `endpoints[]`), `src/collections/JobApplications.ts` (field `ui` tên `cvDownload`: không có cột DB, không cần migration), `src/app/(payload)/admin/importMap.js` (file sinh).
- Dữ liệu: chỉ thêm bản ghi vào `audit-logs`. Không đổi schema. Bucket `private` chỉ đọc.
- Client: chỉ form admin của `job-applications`. Không có API công khai mới.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 115 file, 1273 test. Test integration `tests/integration/private-file-download.test.ts` có chạy, không bị skip: `DATABASE_URL_TEST` được nạp từ `.env.local` qua `tests/setup.ts`; nếu DB/S3 không chạy thì `beforeAll` đã fail |
| `pnpm build` | PASS (exit 0). Next 16.4.2 Turbopack, compile + TypeScript OK, route `/api/[...slug]` có mặt. Lúc reviewer chạy không có lock `.next` nào chặn |
| `pnpm install --frozen-lockfile` | không chạy: lockfile không đổi trong diff |

## Responsive Checklist Gate
Diff chỉ đụng UI ở một link trong form admin của Payload (layout do Payload lo).
- Layout (horizontal scroll / grid / container): N/A. Một `<a>` inline-flex, không có width cố định, không có grid.
- Typography/Spacing: N/A. Dùng class `btn` của Payload, không có font-size riêng.
- Media: N/A. Không có ảnh/video.
- Touch target ≥ 44px: OK. `minHeight: 44` + class `btn--size-medium` (`CvDownloadButton.tsx:21`).
- Nav/table: N/A.
- Viewport/A11y (100vh, reduced-motion, overflow:hidden): N/A. Không dùng mấy thứ này.
- Residual: không có browser để đo thật ở 375/768/1280. Trang này dùng layout field chuẩn của Payload admin nên rủi ro thấp.

## Skill gates
- aislop: skip, `aislop` chưa cài. Đọc tay: không thấy slop. Tên rõ ràng, comment nói WHY, không có code chết.
- oxlint (anti-slop): skip, chưa cấu hình oxlint. ESLint + tsc PASS.
- ocr (open-code-review): skip, `ocr` chưa cài.
- AI-readable: OK. File 113/24/25 dòng; `handlePrivateFileDownload` khoảng 46 dòng (≤50); không có magic number trần (regex/hằng đều có tên); indirection ≤2. 0 indicator.
- ai-friendly-web: N/A. Endpoint admin nội bộ.
- blitzstrike: skip, không cài / không có môi trường được phép. Đã xét tay các vector (bên dưới).
- ponytail: OK. Thay đổi tối thiểu, không có abstraction thừa. `OpenPrivateObject` có thể inject nhưng chỉ có một implementation mặc định; chấp nhận được vì dùng để test.

## Security / correctness checks (STRICT)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Thứ tự 401 → 403 → 400 → 404 | OK | `private-file-download.ts:61-74`. Sale gọi id không tồn tại vẫn nhận 403 (test integration "sale -> 403, kể cả id không tồn tại") |
| Tài khoản bị khoá (`active=false`) | OK | `req.user.active !== true` → 401, đúng PERMISSION §5.1. `isAdmin` cũng kiểm `active` |
| Kiểm quyền trước khi chạm storage/DB | OK | `find` + `openObject` chỉ chạy sau 3 guard. `overrideAccess: true` chỉ dùng sau `isAdmin` |
| Khoá S3 / path traversal | OK | id bắt buộc là UUID (400). Khoá lấy từ `filename` + `_objectKey` trong DB, không lấy từ input; có segment `..` → 404 (`:45-51`) |
| Stream không buffer, huỷ khi client ngắt | OK | `transformToWebStream()` đưa thẳng vào `new Response`. Client ngắt thì Next cancel web stream, lệnh cancel truyền xuống socket S3 |
| Audit fail-closed (ghi sau khi mở object, trước khi stream) | OK | `:76-90`. Audit lỗi thì `stored.body.cancel()` rồi trả 500 không có Content-Disposition (có test). `payload.create` tự mở/commit transaction riêng nên audit đã commit trước khi gửi byte đầu tiên. Object mất → 404 và không ghi audit (có test) |
| Header | OK | Content-Disposition: phần ASCII chỉ giữ `[A-Za-z0-9._-]`, bỏ ký tự điều khiển, có `filename*` theo RFC 5987 và mã hoá cả `'()*`. Content-Type phải khớp regex, không khớp thì `application/octet-stream` (MIME có tham số như `text/html; charset` bị loại, có test). Có `nosniff`, `CSP default-src 'none'; sandbox`, `private, no-store` |
| Không có URL công khai | OK | `PrivateFiles.upload.handlers` trả 404 + `generateFileURL: () => ""` + `disablePayloadAccessControl`. Test xác nhận `/api/private-files/file/:name` trả 404 |
| CDN cache | OK | `private, no-store`, và Cloudflare bypass `/api/*` |
| CSRF | Chấp nhận | GET chỉ đọc. Cookie SameSite=Lax nên một link chéo site có thể khiến admin tải file về máy của chính admin + sinh một dòng audit. Không lộ dữ liệu cho bên thứ ba |
| UI chỉ hiện với CV dạng UUID, không lộ PII | OK | `cvDownloadPath` kiểm UUID. Field `ui` không có cột, không vào list view. Audit không chứa tên file/email/IP thô (có test) |

## Ruling: audit `docId` = id của private-file (không phải id hồ sơ)
**Chấp nhận.** Endpoint nhận id file nên đây là định danh duy nhất có thật. Đi kèm `collection: "private-files"` nên nhất quán với ERD §4.12 (`collection` + `docId`). Vẫn truy ngược được hồ sơ qua `job-applications.cv_id` cho tới khi hồ sơ bị ẩn danh. Sau khi ẩn danh thì CV cũng đã bị xoá, nên không còn gì để truy. Tránh được việc phải tra ngược hồ sơ (thêm một query, và một file có thể không thuộc hồ sơ nào). Đề xuất tuỳ chọn ở follow-up F3.

## Findings
### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. `src/endpoints/admin/private-file-download.ts:45-51`: `resolveObjectKey` bỏ qua field `prefix` của plugin. Plugin ghép khoá theo `buildPrefixWithObjectKey({ prefix, objectKey })` + filename (`plugin-cloud-storage/dist/hooks/afterChange.js:5-11`). Hiện chưa sai vì `private-files` không cấu hình `prefix` (`payload.config.ts:115`). Nếu sau này thêm `prefix`, endpoint sẽ trả 404 cho mọi file. Cách sửa: thêm `doc.prefix` vào folder, hoặc ghi chú/assert rằng collection không được có prefix.
2. `tests/integration/private-file-download.test.ts` (test "admin đã bị khoá"): đang chấp nhận cả `[401, 403]`, trong khi code và PERMISSION §5.1 quy định chắc chắn là 401. Cách sửa: assert `toBe(401)`.
3. `src/components/admin/CvDownloadButton.tsx:21`: thuộc tính `download` khiến khi phiên hết hạn hoặc lỗi 401/403/500, trình duyệt lưu JSON lỗi thành file tên "download" thay vì hiện lỗi. UX nhỏ. Cách sửa: bỏ `download` (server đã gửi `Content-Disposition: attachment`).
4. Doc impact: `docs/API_SPEC.md:171` mới chỉ có một dòng. Các task trước đều thêm ghi chú "As-built". Đề xuất khi close-out thêm as-built cho §4: thứ tự 401/403/400/404, 500 khi audit lỗi, danh sách header, `docId` = id file. Đây là doc as-built, không phải intent.

## Follow-ups (không chặn)
- F1: Tài khoản bị khoá tạm vì đăng nhập sai nhiều lần (`lockUntil`) mà vẫn còn JWT hợp lệ thì vẫn tải được. Đây là hành vi chung của Payload, không riêng task này. Nếu muốn chặn thì xử lý ở tầng auth chung.
- F2: Lỗi S3 giữa chừng làm file bị cắt cụt trong khi audit đã ghi. Chấp nhận được (audit ghi "lượt mở", không ghi "tải xong").
- F3 (tuỳ chọn): khi gọi từ nút trong form, ghi thêm `meta.applicationId` để tra cứu nhanh hơn.

## Verdict
**PASS**: không có CRITICAL/MAJOR. AC đủ: thứ tự 401→403→404 + header attachment/no-store; audit mỗi lần tải; sale/khách bị 401/403; không có URL công khai. Lint/typecheck/test/build đều PASS (reviewer tự chạy).
