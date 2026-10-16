Agent: reviewer

# Review: tasks/tami-website/layer-1-task-02.md, round 4

- **Review level:** STRICT
- **Reason:** Đụng auth (chính sách mật khẩu, override endpoint `/reset-password`), RBAC/access, schema + migration. Round này chỉ kiểm lại M4 theo hướng A đã duyệt.
- **Blast radius:** `src/collections/Staff.ts` (endpoint `POST /api/staff/reset-password`, hook mật khẩu, login hooks), `src/access/*`, migration `20261016_092103_staff_auth`, form đặt lại mật khẩu trong admin UI, `tests/integration/access.test.ts`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (không có lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 4 file, 45/45 test. Log `APIError: Thiếu mật khẩu mới.` là lỗi mà test thiếu password mong đợi |
| `pnpm build` | PASS (Next 16.4.2) |

## Kiểm then chốt: M4 (đọc source Payload 3.91.0)
- **Cùng parser:** endpoint gọi `addDataAndFileToRequest(copy)` (`Staff.ts:57`). Handler mặc định là endpoint đã bọc bởi `wrapInternalEndpoints`, và wrapper gọi `addDataAndFileToRequest(req)` trên request gốc (`payload/dist/utilities/wrapInternalEndpoints.js:11-15`). `wrapInternalEndpoints` gán lại `endpoint.handler` trực tiếp, nên `defaultEndpoint.handler` (`Staff.ts:71`) chính là hàm đã bọc. Hai bên dùng cùng một hàm.
- **Cùng input:** `req` là `Request` gốc đã được `Object.assign` thêm thuộc tính (`createPayloadRequest.js:78`). Vì vậy `req.clone()` tee body: clone và bản gốc nhận cùng byte, cùng header, cùng method. Endpoint gắn lại `payload` (nên `bodyParser`/`upload` options giống nhau) và `routeParams` (`Staff.ts:55-56`). Auth strategy không đọc body. Repo không cấu hình `upload`/`bodyParser`, nên `useTempFiles` mặc định là false và parse chỉ diễn ra trong bộ nhớ.
- **Các trường hợp biên:** hàm parse cho cùng kết quả với cùng input (`addDataAndFileToRequest.js:9-93`).
  - `_payload` gửi dạng file trước: file vào `files`, text vào `fields._payload`. Có test ở `access.test.ts:379-392`.
  - Nhiều `_payload` dạng text: `buildFields` gộp thành mảng, không còn là string, nên `data` rỗng ở cả hai bên, endpoint trả 400.
  - Content-type lạ, thiếu content-type, body rỗng: `data` rỗng, endpoint trả 400 (`Staff.ts:59`).
  - JSON lỗi: cả hai bên đều trả `APIError('Invalid JSON', 400)`.
  - Field `file` dạng string: route `staff` không có `upload`, nên cả hai bên đều trả 400 trước khi đọc file.
- **Không gọi lại chính nó:** chỉ tìm handler trong các phần tử nằm sau `ownIndex` (`Staff.ts:64-67`). Theo `sanitize.js:77-98`, endpoint tuỳ biến đứng trước, endpoint auth mặc định được push sau. Không tìm thấy thì throw (`Staff.ts:68-70`).
- **Luồng hợp lệ:** JSON 10 ký tự trả 200 và đăng nhập được (`access.test.ts:317-338`). Multipart như form admin trả 200, có `message` và `user.id` (`:351-367`).
- **M2/m5 giữ nguyên:** email `access.update: isAdmin` ở `Staff.ts:119`. `recordLastLogin` vẫn ghi thẳng adapter (`Staff.ts:79-87`). Các test liên quan PASS.

## Skill gates
- aislop / oxlint / ocr: chưa chạy, vì không nằm trong verify commands được allow và repo chưa cấu hình oxlint. Lint qua eslint và typecheck đều PASS.
- AI-readable: OK. File 147 dòng, handler khoảng 23 dòng. Comment giải thích WHY, có hằng số đặt tên. Không có indicator nào.
- Responsive: N/A (không đụng UI). ai-friendly-web: N/A (nội bộ). blitzstrike: skip (không cài).

## Findings
- **[MINOR] m6:** `_payload` multipart gửi JSON lỗi khiến `JSON.parse` (`addDataAndFileToRequest.js:52`) ném `SyntaxError` không bọc, nên trả 500 thay vì 400. Payload mặc định cũng như vậy, không phải regression. Có thể bọc `try/catch` rồi trả `APIError` 400 nếu muốn.
- **[MINOR] m7:** mỗi request reset parse body 2 lần (tee buffer body trong bộ nhớ). Body của form reset nhỏ nên chấp nhận được.
- Residual risk (giữ từ round 2–3): Local API `payload.resetPassword()` và GraphQL `resetPasswordStaff` (nếu sau này bật) không kiểm độ dài mật khẩu. Admin UI chưa được xác minh trên trình duyệt; mới dựa trên test integration với `FormData` giống form admin.

## Verdict
✅ **PASS**: M4 đã đóng. Bản clone và request gốc được parse bằng cùng hàm của Payload trên cùng byte, nên không còn khác biệt nào để lách. Verify 5/5 PASS. Không có CRITICAL/MAJOR.
