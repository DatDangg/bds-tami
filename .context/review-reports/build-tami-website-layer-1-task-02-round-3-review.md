Agent: reviewer

# Review: build-tami-website, layer-1-task-02, round 3

- Task: `tasks/tami-website/layer-1-task-02.md`
- Diff: working tree chưa commit so với HEAD `14fa4df`
- Review level: **STRICT**
- Reason: auth/RBAC (`src/access/*` dùng chung), override endpoint auth `POST /api/staff/reset-password` (kiểm soát chính sách mật khẩu), hook `afterLogin` ghi thẳng DB.
- Blast radius: `src/collections/Staff.ts` (reset-password, afterLogin); luồng quên/đặt lại mật khẩu admin (`/admin/reset/<token>`); REST `/api/staff/*`; `tests/integration/access.test.ts`.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 4 file, 44 test |
| `pnpm build` | PASS |

## Responsive Checklist Gate
N/A: diff không đụng route, component hay CSS.

## Skill gates
- aislop: skip, không nằm trong verify command được phép
- oxlint: skip, oxlint not configured (eslint + tsc PASS)
- ocr: skip, ocr not installed
- AI-readable: OK (dưới 3 indicator; comment giải thích WHY, đã khớp code)
- ai-friendly-web: N/A (nội bộ)
- blitzstrike: skip, không có môi trường được phép; thay bằng đọc source Payload 3.91.0

## Kiểm các điểm round 2

- **M3 (multipart admin form)**: đã sửa đúng đường chính. `readPasswordFromBody` đọc `_payload` từ multipart như `@payloadcms/ui` Form gửi. Test `access.test.ts:341-367` gửi `FormData` qua `handleEndpoints`: 9 ký tự 400, 10 ký tự 200, có `message` + `user`. Điều này chứng minh body gốc vẫn được handler mặc định (`addDataAndFileToRequest`) đọc sau khi đã đọc bản clone.
- **m4**: OK. Lấy endpoint cùng path và method đứng **sau** `ownIndex` (`Staff.ts:81-84`). Nếu không thấy thì ném lỗi, không tự gọi lại chính nó.
- **m5**: OK. `req.payload.db.updateOne(..., req, returning:false)` ghi thẳng adapter, không chạy hook hay operation update. Field `lastLoginAt` có `access.update: false` nhưng không bị chặn vì adapter không đi qua field access. Test `:291-297` xác nhận giá trị được ghi.
- **Regression**: không thấy. BOLA, `role`/`active`, khoá email (M2), lockout, `publishedOnly` và i18n vẫn giữ nguyên; test cũ PASS.

## Findings

### [MAJOR] M4: Kiểm độ dài mật khẩu fail-open với multipart có `_payload` dạng file, nên vẫn lách được chính sách tối thiểu 10 ký tự
- Vị trí: `src/collections/Staff.ts:48-49` và `:53`, `:77`.
- Cơ chế:
  1. Trong Staff.ts, `formData().get("_payload")` trả **entry đầu tiên**. Nếu entry đó là phần file (có `filename`) thì `raw` là `File`, nên `body = undefined` và `password = undefined`. `assertPasswordLength` chỉ kiểm khi giá trị là string, nên bỏ qua kiểm tra và chuyển tiếp cho handler mặc định.
  2. Phía Payload: `processMultipart.js:56-63` đưa phần có filename vào `files`, không vào `fields`. Một phần text `_payload` đứng sau sẽ thành `fields._payload` (string), và `addDataAndFileToRequest.js:51-52` dùng nó làm `req.data`.
- Payload đọc `req.data` từ phần text đứng sau. Vì vậy request multipart gồm `[_payload; filename="x"]` rồi `[_payload = {"token":..., "password":"123"}]` sẽ đặt được mật khẩu 3 ký tự. Đây cùng loại lỗi với M1 round 1.
- Điều kiện: cần reset token hợp lệ. Thực tế là chủ tài khoản tự hạ chính sách cho mật khẩu của mình bằng request tự soạn. Ai đã có token thì vốn đặt được mật khẩu bất kỳ dài ≥10.
- Mức độ xác minh: chỉ đọc source của undici FormData và busboy/Payload 3.91.0. Chưa chạy được, vì reviewer không được tự viết hay chạy script.
- Cách sửa (fail-closed, 2-3 dòng):
  - Sau khi đọc body, nếu `typeof password !== "string"` thì ném `APIError(400)`. Handler mặc định của Payload cũng sẽ fail khi thiếu password, nên chặn sớm không làm mất luồng hợp lệ nào.
  - Và/hoặc: dùng `getAll("_payload")`, yêu cầu có đúng một entry kiểu string, ngược lại trả 400.
  - Thêm test: multipart có phần file `_payload` đứng trước phần text `_payload` chứa mật khẩu 9 ký tự phải nhận 400, và login bằng mật khẩu đó phải thất bại.

### [MINOR] m6: Không có Content-Type thì trả 415
- `Staff.ts:50-51`: request không có body hoặc header cũng nhận 415 thay vì lỗi "thiếu token/mật khẩu" của Payload. Admin UI và client JSON không bị ảnh hưởng. Mục này chấp nhận được, chỉ ghi nhận.

## Residual risk
- Local API `payload.resetPassword()` và GraphQL `resetPasswordStaff` (nếu sau này bật route GraphQL) không kiểm độ dài mật khẩu. Giữ nguyên như round 2.
- M4 và luồng admin UI được xác minh bằng đọc source `@payloadcms/ui` / `@payloadcms/next` / `payload` 3.91.0, chưa chạy trên trình duyệt.
- `refresh`/`me` với token cũ của tài khoản bị khoá sẽ xử lý ở task session.

## Verdict
**FAIL**: M3, m4 và m5 đã sửa đúng; verify 5/5 PASS. Còn **[MAJOR] M4**: nhánh multipart fail-open khi `_payload` đầu tiên là file, nên vẫn lách được giới hạn 10 ký tự. Cách sửa: trả 400 khi `password` không phải string, và thêm 1 test.
