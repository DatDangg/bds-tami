Agent: reviewer

# Review: build-tami-website, layer-1-task-02, round 1

- Task: `tasks/tami-website/layer-1-task-02.md` (collection `staff` auth + `src/access/`, kèm follow-up F1 admin chỉ `{ vi }`)
- Diff: working tree chưa commit so với HEAD `14fa4df`
- Review level: **STRICT**
- Reason: auth/RBAC (access functions dùng chung cho mọi collection sau), schema/migration (`staff`), security (login lockout, chính sách mật khẩu).
- Blast radius: `src/collections/Staff.ts`; `src/access/*` (mọi collection ở layer 2+ sẽ import); `migrations/20261016_092103_staff_auth.*` + `migrations/index.ts`; `src/payload-types.ts`; `src/payload.config.ts` (i18n admin); REST `/api/staff/*` (login, me, refresh, forgot/reset-password, unlock); `docs/PERMISSION.md`.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (không có lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 4 file, 38 test, không có test bị skip (integration chạy trên `DATABASE_URL_TEST` = DB dev) |
| `pnpm build` | PASS (`/[locale]`, `/admin/[[...segments]]`, `/api/[...slug]`) |

## Responsive Checklist Gate
N/A: diff không đụng UI (route, component hay CSS). F1 chỉ đổi cấu hình ngôn ngữ của admin.

## Skill gates
- aislop: skip, không có trong danh sách verify command được phép chạy
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc.json`); `pnpm lint` (eslint) và `tsc` PASS
- ocr (open-code-review): skip, ocr chưa cài
- AI-readable: OK. Tên rõ ràng, hàm ngắn, hằng có tên (`MIN_PASSWORD_LENGTH`, `LOCK_TIME_MS`), comment giải thích WHY. Có 1 comment sai sự thật (xem M1). Tính ra < 3 indicator.
- ai-friendly-web: N/A (task nội bộ, không public-facing)
- blitzstrike: skip, không có môi trường được phép; đã thay bằng đọc mã nguồn Payload để kiểm luồng auth

## Kiểm tra trọng tâm

- **BOLA/IDOR (`staff`)**: OK. `read`/`update` = `ownedByUserOrAdmin("id")`, nên sale nhận constraint `{ id: { equals: user.id } }` và Payload lọc ở tầng DB cho cả list lẫn findByID. Integration test kiểm list, findByID, update và delete người khác với `overrideAccess: false`. Route REST đi qua cùng access, nên kết quả đúng cho cả hai.
- **`role`/`active` chỉ admin sửa**: OK. Field access `create/update: isAdmin`; test xác nhận sale gửi `role`/`active` thì giá trị bị bỏ qua.
- **`active=false`**: OK. `beforeLogin` chạy sau khi mật khẩu đã đúng và trong transaction (`login.js:193-295`), nên session bị rollback khi throw. Mọi hàm access dùng `active === true` (fail closed). `access.admin = isStaff`.
- **Khoá 5 lần / 10 phút**: OK theo config (`maxLoginAttempts: 5`, `lockTime: 600000`). Test kiểm việc khoá; lockTime chưa có test (m2).
- **Mật khẩu ≥ 10 ký tự**: create và update OK, có test. Luồng reset-password bị hở (M1).
- **`publishedOnly`/`buildPublicWhere`**: OK. Điều kiện nằm tập trung một chỗ, server-side, không đọc input từ client; vai trò lạ thì fail closed.
- **Không hardcode role**: OK. Mọi nơi dùng `ROLES` / `ROLE_VALUES` / `DEFAULT_ROLE`.
- **F1**: OK. `supportedLanguages: { vi }`, đã bỏ import `en`.
- **Test**: chạy trên DB thật, không mock Payload. `afterAll` xoá mọi id đã tạo; các lần create được kỳ vọng fail không để lại bản ghi. Đạt.
- **Doc impact `docs/PERMISSION.md`**: hợp lệ (as-built). Chỉ thêm mô tả hàm tạo dùng chung, không hạ intent.
- **Bất biến "≥1 admin active" (PERMISSION §1)**: chưa enforce, nhưng đã lên lịch ở `layer-2-task-03` AC dòng 39. Không tính lỗi cho task này.

## Kết luận migration `20261016_092103_staff_auth`

`ALTER TABLE "staff" ADD COLUMN "full_name" varchar NOT NULL` (dòng 6), không có default, chạy trên bảng đã tạo ở migration init. Về bản chất đây là dạng NOT NULL trên bảng có sẵn (tương tự `SET NOT NULL`): nếu bảng có row thì migration **lỗi và dừng**. Nó không làm mất dữ liệu.

**Kết luận: chấp nhận, không gắn `HIGH_RISK_MIGRATION`.** Lý do:
1. Migration init và migration này đều thuộc initial build chưa phát hành.
2. Chưa có staging/prod; DB dev có 0 row.
3. Không có thao tác phá dữ liệu ở `up`. `down` có DROP COLUMN/TYPE, đây là hành vi rollback bình thường.

Không cần tách 2 bước hoặc thêm default. Điều kiện kèm theo:
- (a) Builder ghi vào task file mục Migration rằng thực tế đây là `ALTER` (task ghi "Tạo bảng") và ghi lý do chấp nhận ở trên.
- (b) DB dev của máy khác nếu đã có user tạo qua first-register sẽ fail khi migrate. Cách xử lý: tạo lại DB dev, cấm `migrate reset` trên môi trường dùng chung.
- (c) Kể từ khi có staging, mọi cột NOT NULL thêm vào bảng đã có dữ liệu phải có default hoặc làm theo 2 bước.

## Findings

### [MAJOR] M1: Có thể đặt mật khẩu dưới 10 ký tự qua luồng reset-password
- `src/collections/Staff.ts:13-23` (`enforcePasswordLength`). Comment dòng 13 khẳng định hook "áp cho tạo, đổi và đặt lại mật khẩu", nhưng điều này sai.
- Bằng chứng: `node_modules/payload/dist/auth/operations/resetPassword.js:57-83`. Thao tác này hash `data.password` trước, sau đó gọi `beforeValidate` với `data: user` (doc chỉ có `hash`/`salt`, không có `password`). Vì vậy `data.password` là `undefined` và hook bỏ qua. Bộ validate có sẵn `generatePasswordSaltHash.js:11` chỉ kiểm mật khẩu có rỗng hay không. Kết quả: `POST /api/staff/reset-password` với mật khẩu 1–9 ký tự vẫn thành công, vi phạm PERMISSION §7 dòng 116 và AC dòng 36.
- Cách sửa: kiểm độ dài ở một chỗ mà mọi luồng ghi mật khẩu đều đi qua. Ví dụ dùng `hooks.beforeOperation`: khi `operation` thuộc `create` / `update` / `resetPassword` và `args.data?.password` là chuỗi ngắn hơn 10 thì throw `ValidationError`. Builder cần xác minh `resetPassword` có chạy `beforeOperation`; nếu không, override endpoint `reset-password`. Thêm integration test: `payload.forgotPassword` (có `disableEmail: true` để lấy token) rồi `payload.resetPassword` với mật khẩu 9 ký tự phải bị từ chối. Sửa comment cho đúng sự thật.

### [MAJOR] M2: Sale tự đổi được `email` (định danh đăng nhập) của chính mình
- `src/collections/Staff.ts:43` (`update: selfOrAdmin`) và `:55-76`: không có field-level access cho `email`.
- PERMISSION §3 dòng 75 chỉ cho sale sửa "tên, SĐT, ảnh, mật khẩu". Còn §8 dòng 112 xếp quản lý tài khoản vào việc của admin. Hiện tại sale `update` `{ email }` trên hồ sơ của mình là thành công. Đây là sai lệch so với ma trận RBAC ở collection auth: sale đổi được định danh tài khoản mà không cần admin, và luồng audit sau này không lường trước việc này.
- Cách sửa: khai báo override field `email` trong `fields` (`type: "email"`, `required`, `unique`, `access: { update: isAdmin }`) theo cách Payload hỗ trợ override field auth. Thêm integration test kiểm sale đổi email thì giá trị không đổi.

### [MINOR] m1: `lastLoginAt` có field nhưng chưa bao giờ được ghi
- `src/collections/Staff.ts:70-75`. Field này không thể create/update qua API, và cũng không có `afterLogin` nào cập nhật nó. AC chỉ yêu cầu có field. Đề xuất ghi field này trong `afterLogin` (dùng `req.payload.db.updateOne` hoặc `overrideAccess`), hoặc ghi rõ task nào sẽ làm.

### [MINOR] m2: Chưa có test cho lockTime 10 phút
- `tests/integration/access.test.ts:225-235` mới kiểm việc khoá, chưa kiểm `lockUntil ≈ now + 10 phút`. Đề xuất đọc `lockUntil` của victim (`overrideAccess: true`, `showHiddenFields: true`) rồi assert khoảng thời gian.

### [MINOR] m3: Tài khoản đã khoá mà còn cookie thì thấy ít hơn khách
- `src/access/publishedOnly.ts:23`. Với `active=false` hàm trả `false` thay vì điều kiện công khai, nên nếu frontend gọi REST kèm cookie thì nhận 403 với nội dung công khai. Hành vi này chấp nhận được về an toàn (fail closed). Nên cân nhắc trả `buildPublicWhere(statuses)` để tài khoản khoá được đối xử như khách. Không bắt buộc.

## Residual risk
- Chưa chạy REST thật bằng HTTP. Kết luận "REST giống Local API" dựa trên việc Payload dùng chung operation và access.
- Chưa kiểm `refresh`/`me` với token cũ của tài khoản vừa bị khoá. Access đều trả false nên không có quyền dữ liệu, nhưng token vẫn refresh được cho tới khi hết hạn. Theo task Notes, phần session sẽ làm ở task session-refresh.

## Verdict
**FAIL**: còn 2 MAJOR (M1 hở chính sách mật khẩu ở luồng reset-password, M2 sale tự đổi email trái PERMISSION §3). Builder sửa M1 và M2 (kèm test); các MINOR làm tuỳ chọn. Rerun reviewer ở round 2.
