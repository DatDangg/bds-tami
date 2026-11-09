Agent: reviewer

# Review — bug-admin-validation-error-english-toast · phase-1-task-01 · round 1 (BL-113)

- **Review level:** STRICT
- **Reason:** sửa hook mật khẩu Staff (auth, cả đường `/reset-password`), guard admin cuối (RBAC), hook dùng chung `require-english-fields`, và lớp lỗi `ValidationError` mà code khác bắt bằng `instanceof` / đọc `data.errors`.
- **Blast radius:** `src/collections/Staff.ts` (beforeValidate + endpoint reset-password), `src/hooks/staff/last-admin-guard.ts`, `src/hooks/require-english-fields.ts` (mọi collection song ngữ), `src/hooks/leads/sync-phone-normalized.ts`, `src/hooks/leads/lead-activity-hooks.ts`, `src/hooks/categories/validate-tree.ts`, `src/hooks/job-applications/delete-cv-and-audit.ts`; code bắt lỗi: `src/endpoints/public/job-applications.ts:106`, `src/endpoints/public/newsletter.ts:56`, `src/jobs/translate-content.ts:144`; hook `src/hooks/restore-public-error-message.ts` (REST afterError). Không đổi schema/API shape.

## Verify commands + result
| Command (từ `.context/project-config.md`) | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm lint` | PASS (eslint ., không lỗi) |
| `pnpm test -- src/lib/errors src/collections/staff-password-length.test.ts src/hooks src/endpoints/public/job-applications.test.ts src/endpoints/public/newsletter.test.ts src/jobs` | PASS — 28 file, 190 test |

## Kiểm từng trọng tâm
1. **Helper giữ instance + shape** — OK. `createViValidationError` (`src/lib/errors/vi-validation-error.ts:33-37`) gọi `new ValidationError({ collection, errors }, req?.t)` rồi chỉ ghi đè `message`; `data.errors` không đổi, status 400. `formatErrors` (payload `utilities/formatErrors.js:6-15`) đọc `incoming.message` cho lỗi có `data` → toast = message tiếng Việt, không phụ thuộc `name` (an toàn với minify). Test job-applications/newsletter/translate-content PASS.
2. **7 chỗ đổi + luật không đổi** — OK. Cả 7 chỗ đi qua helper và truyền `req`; điều kiện `< MIN_PASSWORD_LENGTH`, LAST_ADMIN logic, điều kiện tree/anonymized/lead uuid giữ nguyên. Endpoint `/reset-password` vẫn gọi `assertPasswordLength(password, Staff.slug, req)` (`Staff.ts:72`). 1 lỗi → toast = lý do (`where`/`password` không còn đứng một mình).
3. **delete-cv-and-audit** — OK. `APIError(..., 502, undefined, true)` → `data` mặc định `null`, `isPublic` true → `isErrorPublic` true; build production `name` rỗng → `restorePublicErrorMessage` khôi phục message (điều kiện `isPublic === true && data == null` khớp). Message không chứa id/PII; id chỉ vào `logger.error`. Vẫn `throw` sau khi Local API delete trong cùng `req` → rollback như cũ. Không thấy nginx `proxy_intercept_errors`/`error_page 5xx` trong repo chặn body 502.
4. **Grep `new ValidationError` trong src** — OK: chỉ `src/lib/errors/vi-validation-error.ts:34` + 3 file test (giả lập lỗi, hợp lệ).
5. **Verify** — PASS (bảng trên).

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS (chỉ hook server + thông báo lỗi).

## Skill gates
- aislop: skip — Bash của reviewer bị giới hạn ở verify commands + git (gate Claude Code), không chạy được `aislop scan`.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS thay thế.
- ocr (open-code-review): skip, ngoài danh sách lệnh được phép / ocr not installed.
- AI-readable: OK — tên rõ (`createViValidationError`, `buildToastMessage`), hàm ngắn, không indirection thừa, comment nêu WHY; 0 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không có môi trường được phép; không đổi bề mặt auth (chỉ đổi chữ lỗi).

## Findings

### [MAJOR] M1 — Repro Verification chưa có, Status vẫn `pending` (bug task → unverifiable)
- `tasks/bug-admin-validation-error-english-toast/phase-1-task-01.md:66-72`: "Actual before fix / after fix / Evidence: (builder ghi)", `Status: pending`; dòng 5 vẫn `planned`; checklist Acceptance (dòng 54-61) chưa tick. Builder notes xác nhận "chưa chạy trình duyệt" và không có test REST `POST /api/staff` khẳng định `errors[0].message` như Acceptance dòng 58 yêu cầu.
- Theo luật reviewer: bug task không có Repro Verification `PASS` kèm evidence kiểm chứng được → FAIL.
- **Fix:** builder điền mục Repro Verification: before = message gốc `The following field is invalid: password` (có thể trích từ chạy helper cũ / payload `ValidationError` không `t`), after = `Mật khẩu tối thiểu 10 ký tự.`, evidence = test tự động (tối thiểu `src/collections/staff-password-length.test.ts` + `vi-validation-error.test.ts`; tốt hơn thêm 1 test đi qua `formatErrors`/`routeError` hoặc REST `POST /api/staff` khẳng định body `errors[0].message`), ghi rõ lệnh + kết quả, đổi `Status: PASS`; cập nhật trạng thái task, tick Acceptance; ghi Residual risk cho gợi ý ô mật khẩu (không làm) và phần chưa kiểm trên trình duyệt; ghi Doc impact (`no doc impact`) vào task file.

### [MINOR] m1 — Toast nhiều trường lộ tên path kỹ thuật tiếng Anh
- `src/lib/errors/vi-validation-error.ts:24`: `${message} (${paths.join(", ")})` → vd "Lead đã xoá thông tin cá nhân, không thể sửa thông tin khách (fullName, phone)". Đúng design ("nhãn/path gọn"), không đứng một mình, nên không chặn; đề xuất sau này cho phép `label` tiếng Việt trong `ViFieldError`.

### [MINOR] m2 — Test Staff phụ thuộc vị trí hook
- `src/collections/staff-password-length.test.ts:7`: lấy `Staff.hooks.beforeValidate[0]`; thêm hook trước nó sẽ làm test sai đối tượng. Đề xuất export `enforcePasswordLength`/`assertPasswordLength` hoặc tìm theo tham chiếu. Chưa có test cho nhánh endpoint `/reset-password` (dùng chung hàm nên rủi ro thấp).

### [MINOR] m3 — `errors` rỗng → message rỗng
- `buildToastMessage([])` trả `""`; hiện không có caller gửi mảng rỗng. Không bắt buộc sửa.

## Residual risk
- Chưa kiểm trên trình duyệt admin thật (toast client hiển thị đúng message) — dựa trên đọc `formatErrors`/`routeError` payload 3.91.0.
- Proxy/CDN trước tamihomes.vn ngoài repo có thể thay body 5xx (502) — không xác minh được từ repo.

## Verdict
❌ **FAIL** — code đúng và verify PASS, nhưng thiếu Repro Verification `PASS` có evidence (M1). Builder bổ sung mục Repro Verification/Acceptance/Doc impact trong task file (kèm evidence test tự động), rồi chạy lại review round 2.
