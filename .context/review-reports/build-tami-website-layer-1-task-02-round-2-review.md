Agent: reviewer

# Review: build-tami-website, layer-1-task-02, round 2

- Task: `tasks/tami-website/layer-1-task-02.md`
- Diff: working tree chưa commit so với HEAD `14fa4df`
- Review level: **STRICT**
- Reason: auth/RBAC (`src/access/*` dùng chung), override endpoint auth `POST /api/staff/reset-password`, schema `staff` (khai báo lại field auth `email`), hook `afterLogin` ghi vào DB.
- Blast radius: `src/collections/Staff.ts` (endpoint reset-password, field `email`, `afterLogin`); luồng quên/đặt lại mật khẩu của admin UI (`/admin/reset/<token>`); REST `/api/staff/*`; `tests/integration/access.test.ts`.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 4 file, 42 test (round 1 có 38) |
| `pnpm build` | PASS (`/[locale]`, `/admin/[[...segments]]`, `/api/[...slug]`) |

## Responsive Checklist Gate
N/A: diff không đụng route, component hay CSS.

## Skill gates
- aislop: skip, không có trong danh sách verify command được phép chạy
- oxlint: skip, oxlint chưa được cấu hình; eslint và tsc PASS
- ocr: skip, ocr chưa cài
- AI-readable: OK. Hằng có tên, hàm ngắn, comment giải thích WHY. Comment `Staff.ts:40` nói đây là "đường REST duy nhất" nhưng thực tế đường này chặn mất form reset của admin (xem M3). Tổng cộng dưới 3 indicator.
- ai-friendly-web: N/A (nội bộ)
- blitzstrike: skip, không có môi trường được phép; thay bằng đọc mã nguồn Payload 3.91.0

## Kiểm tra các điểm round 1

- **M1, root cause**: builder xác định đúng. `resetPasswordOperation` hash mật khẩu trước khi gọi `beforeValidate` và không gọi `beforeOperation`, nên chặn ở endpoint là hợp lý.
  - Thứ tự endpoint: OK. `collections/config/sanitize.js:77-98` đặt endpoint tuỳ biến lên trước rồi mới `push` endpoint auth mặc định; `handleEndpoints.js:163` dùng `find`, nên endpoint tuỳ biến được chọn trước.
  - Đọc body từ `req.clone()` rồi giao cho handler mặc định: OK. Handler mặc định được bọc `wrapInternalEndpoints`, tự gọi `addDataAndFileToRequest` trên body gốc chưa bị đọc. Token, lockout, cookie và response shape (`auth/endpoints/resetPassword.js`) không bị đổi.
  - Lách bằng Content-Type: không lách được. Header `application/json-x` vượt qua `startsWith`, nhưng Payload so khớp chính xác `application/json` (`addDataAndFileToRequest.js:14-17`), nên `req.data` rỗng và reset thất bại. Multipart thì bị trả 415. Query string không được Payload đọc làm `data`.
  - GraphQL: repo không có route `/api/graphql` nên mutation `resetPasswordStaff` không bị lộ. Nếu sau này thêm route GraphQL thì đây sẽ thành đường vòng (xem Residual risk).
  - Local API `payload.resetPassword()` không kiểm độ dài: **chấp nhận**. Chỉ code server gọi được hàm này, không có input của người dùng đi thẳng vào; trong repo hiện chưa có lời gọi nào. Có ghi vào Residual risk.
  - **Vấn đề mới:** khi chặn multipart, builder đã làm hỏng form reset của chính admin Payload (M3).
- **M2**: OK. `mergeBaseFields` dùng `deepMergeWithReactComponents(baseField, userField)`, nên field email vẫn giữ `validate: email`, hook lowercase/trim, `unique` và `required`. Schema và migration không đổi, login không bị ảnh hưởng. Có test cho cả hai chiều: sale đổi email thì giá trị không đổi, admin đổi thì được.
- **m1 (`lastLoginAt`)**: đã sửa. `afterLogin` gọi `payload.update` với `overrideAccess` và cùng `req` (cùng transaction), có test.
- **m2 (lockTime)**: sửa một phần. Test mới chỉ kiểm config (`lockTime === 600000`), chưa kiểm `lockUntil` thực tế. Chấp nhận.
- **m3**: chưa làm. Mục này không bắt buộc.
- **Regression ở các phần đã PASS round 1**: không thấy. BOLA, quyền sửa `role`/`active`, `active=false`, lockout, `publishedOnly` và i18n `{ vi }` không đổi; test cũ vẫn PASS.

## Findings

### [MAJOR] M3: Override `reset-password` trả 415 cho form đặt lại mật khẩu của admin Payload, luồng quên mật khẩu bị hỏng hoàn toàn
- Vị trí: `src/collections/Staff.ts:49-51`.
- Bằng chứng:
  - `@payloadcms/next/dist/views/ResetPassword/ResetPasswordForm/index.js:78-84` dùng `<Form action=".../staff/reset-password" method="POST">`.
  - `@payloadcms/ui/dist/forms/Form/index.js:315-326` gửi `body: formData`, và `:479-480` đóng gói thành `{ _payload: JSON.stringify(data) }`. Tức là request luôn là `multipart/form-data`.
  - Endpoint mới ném `APIError(..., 415)` với mọi request không phải JSON. Vì vậy staff bấm link trong email quên mật khẩu, mở `/admin/reset/<token>` và submit thì luôn nhận lỗi. Theo comment ở dòng 40, đây lại là đường reset duy nhất dành cho người dùng.
- Test chỉ gửi JSON nên không phát hiện được lỗi này (`tests/integration/access.test.ts:306-315`).
- Cách sửa: không trả 415 cho multipart mà đọc mật khẩu theo đúng cách Payload đọc.
  - `application/json`: `copy.json()`.
  - `multipart/*`: `const fd = await copy.formData()`, sau đó `JSON.parse(fd.get("_payload"))`, rồi lấy `.password`.
  - Content-Type khác: để handler mặc định xử lý (Payload không đọc ra `data`, nên reset sẽ thất bại).
  - Thêm integration test gửi `multipart/form-data` có `_payload` qua `handleEndpoints`: 9 ký tự phải nhận 400, 10 ký tự phải nhận 200. Nên kiểm thêm response 200 có `message` và `user`.
  - Sửa comment dòng 40-41 và 47-48 cho khớp với code.

### [MINOR] m4: Cách tìm handler mặc định dễ vỡ
- Vị trí: `Staff.ts:56-64`.
- Code phân biệt bằng `endpoint.handler !== resetPasswordWithLengthCheck.handler`. Nếu sau này Payload hoặc một plugin bọc/clone handler tuỳ biến lúc sanitize, `find` sẽ trả về chính endpoint này và handler gọi lại chính nó vô hạn.
- Đề xuất: lấy endpoint khớp **sau** vị trí của chính nó (dùng `findLast`, hoặc tìm từ index của endpoint hiện tại + 1), hoặc kiểm `defaultEndpoint !== self` theo vị trí trong mảng.

### [MINOR] m5: `afterLogin` dùng `payload.update` đầy đủ
- Vị trí: `Staff.ts:71-79`.
- Mỗi lần đăng nhập sẽ chạy toàn bộ update operation: mọi hook `beforeValidate`/`beforeChange`/`afterChange` và tăng `updatedAt`. Khi có audit hook ở layer sau, mỗi lần login sẽ bị ghi thành một lần "sửa hồ sơ".
- Đề xuất: dùng `req.payload.db.updateOne({ collection, where: { id }, data: { lastLoginAt }, req })`, hoặc ghi chú để task audit loại trừ trường hợp này.

## Residual risk
- Local API `payload.resetPassword()` và GraphQL `resetPasswordStaff` (khi có route GraphQL) không kiểm độ dài mật khẩu. Task nào thêm GraphQL hoặc dùng Local API reset với input người dùng phải đi qua `assertPasswordLength`.
- M3 được xác minh bằng cách đọc mã nguồn `@payloadcms/ui` / `@payloadcms/next` 3.91.0; chưa chạy admin UI trên trình duyệt.
- `refresh`/`me` với token cũ của tài khoản vừa bị khoá: giữ nguyên như round 1, sẽ xử lý ở task session.

## Verdict
**FAIL**: M1 và M2 đã sửa đúng root cause và có test, nhưng cách sửa M1 tạo ra lỗi mới **[MAJOR] M3**: form đặt lại mật khẩu của admin bị trả 415. Builder cần cho endpoint đọc được multipart `_payload` và thêm test multipart. m4 và m5 là tuỳ chọn. Rerun reviewer ở round 3.
