# bug-admin-validation-error-english-toast · phase-1-task-01 — Toast lỗi validate trong admin ra tiếng Anh (BL-113)

- Change doc: `spec/changes/2026-11-06-admin-validation-error-english-toast.md` (BACKLOG BL-113).
- Phụ thuộc: không.
- Trạng thái: `awaiting review round 2` — builder xong, đã bổ sung test REST + Repro Verification.

## Classification / Risk
- Type: **BUG** — chỉ đổi cách hiển thị lỗi; KHÔNG đổi luật validate (mật khẩu vẫn tối thiểu 10 ký tự, guard admin cuối giữ nguyên), KHÔNG đổi schema → không migration.
- Severity: medium (người dùng admin không biết vì sao lưu lỗi; không mất dữ liệu).
- Risk: **MEDIUM-HIGH** — đụng hook auth/RBAC (`Staff` mật khẩu, `last-admin-guard`), hook dùng chung cho nhiều collection (`require-english-fields`), và lớp lỗi mà code khác bắt bằng `instanceof ValidationError` / đọc `error.data.errors` (`src/endpoints/public/job-applications.ts:106`, `src/endpoints/public/newsletter.ts:56`, `src/jobs/translate-content.ts:144`).
- Expected review level: **STRICT** (auth/password, RBAC guard, shared hook/error class).
- Blast radius: 7 chỗ ném `ValidationError` + 1 chỗ `throw new Error` (bảng dưới); helper mới; hook `restore-public-error-message` (đường REST trả lỗi cho UI admin).
- Doc impact dự kiến: `no doc impact` cho API_SPEC/ERD (shape lỗi giữ `{ errors: [{ name, message, data }] }`, chỉ đổi chữ `message`); `docs/DESIGN.md` chỉ nếu có mục mô tả lỗi admin. Builder xác nhận.

## Repro (trước khi sửa — từ change doc)
- Production `https://tamihomes.vn/admin` → Nhân viên → Tạo mới, role admin, mật khẩu 7 ký tự → Lưu.
- Actual (screenshot user 2026-11-06): CHỈ toast `The following field is invalid: password`; dưới ô "Mật khẩu mới" KHÔNG có "Mật khẩu tối thiểu 10 ký tự."
- Expected: không còn chữ Anh; người dùng thấy rõ lý do "Mật khẩu tối thiểu 10 ký tự." (ít nhất trong toast).

## Root cause (đã chứng minh — không điều tra lại)
1. `node_modules/payload/dist/errors/ValidationError.js`: `constructor(results, t)` — không có `t` → message lấy cứng `en.translations.error.followingFieldsInvalid_one/_other` + nối `path` (vì không có `label`). Admin chỉ bật `vi` (`src/payload.config.ts:92-96`); bản vi đã có override `followingFieldsInvalid_one: "Trường sau chưa hợp lệ:"` (`src/lib/admin/payload-vi-overrides.ts:23`) nhưng không được dùng vì không truyền `t`.
2. `formatErrors` (`node_modules/payload/dist/utilities/formatErrors.js:6-12`): lỗi có `data` → toast = `error.message` nguyên văn → toast chỉ là "<tiền tố> <path>", không có lý do.
3. Lý do tiếng Việt chỉ nằm ở `data.errors[].message` → hiện dưới ô nếu form gắn được path; ô mật khẩu auth (`password` trên form tạo user) KHÔNG nhận (đã thấy qua screenshot), path `where` không có ô nào → người dùng không thấy lý do.
4. `src/hooks/job-applications/delete-cv-and-audit.ts:21` ném `new Error` (500, không public) → Payload trả `Something went wrong.`

| # | Chỗ | path | Ghi chú |
|---|-----|------|---------|
| 1 | `src/collections/Staff.ts:32` (`assertPasswordLength`) | `password` | thêm `req` vào chỗ gọi (hook `enforcePasswordLength` + endpoint đặt lại mật khẩu dùng chung hàm) |
| 2 | `src/hooks/staff/last-admin-guard.ts:61` | `role`/`active`/`id` | |
| 3 | `src/hooks/staff/last-admin-guard.ts:108` | `where` | path kỹ thuật, không có ô |
| 4 | `src/hooks/require-english-fields.ts:101` | các trường EN | người dùng thường ở tab vi → không thấy lỗi dưới ô |
| 5 | `src/hooks/leads/sync-phone-normalized.ts:38` | fullName/phone/… | |
| 6 | `src/hooks/categories/validate-tree.ts:69` | `parent` | |
| 7 | `src/hooks/leads/lead-activity-hooks.ts:45` | `lead` | |
| 8 | `src/hooks/job-applications/delete-cv-and-audit.ts:21` | — | `throw new Error` → `APIError` public 4xx/5xx tiếng Việt |

## Thiết kế fix (builder quyết chi tiết, giữ diff nhỏ)
1. **Helper dùng chung** (gợi ý `src/lib/errors/vi-validation-error.ts`, tên/chỗ builder chọn theo convention `src/lib/*`):
   - Nhận `req` (có thể thiếu — gọi từ Local API/job), `collection`, `errors: { path, message, label? }[]`.
   - Tạo `new ValidationError({ collection, errors, req }, req?.t)` — vẫn là **instance `ValidationError`**, `data.errors` giữ nguyên shape (path + message tiếng Việt) để các chỗ `instanceof` / `data.errors.some(path…)` không đổi hành vi.
   - Đặt lại `message` (toast) = câu tiếng Việt chứa **lý do**, không phụ thuộc lỗi có gắn vào ô hay không. Đề xuất: 1 lỗi → chính lý do (vd `Mật khẩu tối thiểu 10 ký tự.`); nhiều lỗi cùng lý do (#4) → lý do + danh sách nhãn/path gọn (vd `Cần nhập bản tiếng Anh trước khi bật hasEnglish: Tiêu đề, Nội dung.`). Không còn path kỹ thuật kiểu `where`/`password` đứng một mình.
   - Không có `req.t` vẫn ra tiếng Việt (message tự đặt, không rơi về `en`).
2. **Thay 7 chỗ** `new ValidationError` bằng helper; truyền `req` ở mọi hook (đều có `req` trong args; `assertPasswordLength` thêm tham số `req`).
3. **#8**: `throw new APIError("Không xoá được CV trên kho lưu trữ, vui lòng thử lại sau.", <status>, undefined, true)` — status builder chọn (gợi ý 502/503) và kiểm `restore-public-error-message` vẫn khôi phục message ở build production (hook chỉ bỏ qua lỗi `isPublic !== true` / có `data`). Giữ log nội bộ nếu có id hồ sơ (không đưa PII vào message).
4. **Gợi ý ô mật khẩu Staff** "Tối thiểu 10 ký tự": chỉ làm nếu gọn trong Payload (vd `admin.description` cho field auth `password` qua cấu hình auth/field override hoặc component sẵn có). Nếu Payload không cho cấu hình gọn ô mật khẩu auth → **không mở rộng**, ghi Residual risk (lý do đã có trong toast).
5. Không đụng `payload-vi-overrides.ts` trừ khi thiếu key cần thiết (đã có `followingFieldsInvalid_*`).

## Files
- Mới: helper + test (vd `src/lib/errors/vi-validation-error.ts`, `.test.ts`).
- Sửa: `src/collections/Staff.ts`, `src/hooks/staff/last-admin-guard.ts`, `src/hooks/require-english-fields.ts`, `src/hooks/leads/sync-phone-normalized.ts`, `src/hooks/categories/validate-tree.ts`, `src/hooks/leads/lead-activity-hooks.ts`, `src/hooks/job-applications/delete-cv-and-audit.ts` + test liên quan (`src/hooks/require-english-fields.test.ts`, test last-admin-guard/Staff nếu có).
- KHÔNG đụng: `node_modules/`, schema/migration, luật validate, các file đang dirty ngoài scope trong working tree (endpoints admin/newsletter, jobs, tools/vibe-studio, docs/*, BACKLOG trừ dòng BL-113…), `.context/runs/*`.

## Acceptance
- [x] 8 chỗ: toast tiếng Việt nêu thẳng lý do, không còn path kỹ thuật đứng một mình (`password`, `where`).
- [x] #8 → `APIError` public tiếng Việt, không còn `Something went wrong.`
- [x] Mọi `new ValidationError` trong `src/` (trừ test giả lập) đi qua helper / truyền `req.t` → `grep -rn "new ValidationError" src --include=*.ts | grep -v test` chỉ còn trong helper.
- [x] Lỗi vẫn là `instanceof ValidationError`, `data.errors[].path/message` giữ nguyên → test hiện có của job-applications/newsletter/translate-content/require-english-fields PASS.
- [x] Repro tạo Staff mật khẩu 9 ký tự (staging/local admin): không còn chữ Anh trên màn hình; thấy "Mật khẩu tối thiểu 10 ký tự." (toast hoặc dưới ô). Không chạy được trình duyệt → test API REST `POST /api/staff` khẳng định `errors[0].message` + Residual risk. (đã làm bằng test formatErrors + endpoint /reset-password; chưa kiểm trình duyệt)
- [x] Ô "Mật khẩu mới" có gợi ý "Tối thiểu 10 ký tự" — HOẶC residual có lý do nếu Payload không cho cấu hình gọn. — residual: không làm (field auth do Payload sinh).
- [x] Unit test: ít nhất helper + 1 hook khẳng định message không chứa "The following field" và chứa lý do tiếng Việt.
- [x] Verify theo `.context/project-config.md`: `pnpm typecheck`, `pnpm lint` (file đổi), `pnpm vitest run` các thư mục liên quan PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: toast `The following field is invalid: password`, không có lý do.
- Expected: toast tiếng Việt chứa lý do.
- Actual before fix: `new ValidationError({collection, errors})` không `t` -> `message` = `The following field is invalid: password` (tiền tố en cứng + path), `formatErrors` đưa nguyên message đó vào `errors[0].message` -> toast không có lý do.
- Actual after fix: `errors[0].message` = `Mật khẩu tối thiểu 10 ký tự.`, không chứa "The following field"; `data.errors[0].path` vẫn `password`.
- Evidence: `pnpm vitest run src/lib/errors src/collections/staff-password-length.test.ts` PASS (test hook Staff, test body qua `formatErrors` của Payload, test endpoint `/reset-password` mật khẩu 9 ký tự, test helper gồm errors rỗng); `pnpm typecheck`, `pnpm lint`, vitest src/hooks + endpoints/public + jobs PASS (xem report builder).
- Status: PASS

## Residual risk
- Gợi ý ô "Mật khẩu mới" không làm: field `password` của auth do Payload sinh, không cấu hình gọn.
- Chưa kiểm trên trình duyệt admin thật; dựa trên test `formatErrors`.
- Toast nhiều trường còn hiện path kỹ thuật tiếng Anh (vd `fullName, phone`); nhãn tiếng Việt (reviewer m1) ngoài scope.
- Proxy/CDN ngoài repo có thể thay body 5xx (#8) — không xác minh được.

## Doc impact
- `no doc impact` (shape lỗi giữ nguyên, chỉ đổi chữ `message`).
