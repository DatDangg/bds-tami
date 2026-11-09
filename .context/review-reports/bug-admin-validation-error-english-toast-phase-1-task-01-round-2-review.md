Agent: reviewer

# Review — bug-admin-validation-error-english-toast · phase-1-task-01 · round 2 (BL-113)

- **Review level:** STRICT
- **Reason:** đụng hook mật khẩu Staff (auth, gồm cả endpoint `/reset-password`), guard admin cuối (RBAC), hook dùng chung `require-english-fields`, và lớp lỗi `ValidationError` mà code khác bắt bằng `instanceof` / đọc `data.errors`.
- **Blast radius:** `src/collections/Staff.ts` (beforeValidate `enforcePasswordLength` nay được export, endpoint reset-password), `src/hooks/staff/last-admin-guard.ts`, `src/hooks/require-english-fields.ts` (mọi collection song ngữ), `src/hooks/leads/sync-phone-normalized.ts`, `src/hooks/leads/lead-activity-hooks.ts`, `src/hooks/categories/validate-tree.ts`, `src/hooks/job-applications/delete-cv-and-audit.ts`, helper mới `src/lib/errors/vi-validation-error.ts`. Code bắt lỗi: `src/endpoints/public/job-applications.ts`, `src/endpoints/public/newsletter.ts`, `src/jobs/translate-content.ts`; hook REST afterError `src/hooks/restore-public-error-message.ts`. Không đổi schema/API shape.

## Verify commands + result
| Command (từ `.context/project-config.md`) | Result |
|---|---|
| `pnpm typecheck` | PASS (`tsc --noEmit`, không lỗi) — chạy sau lần sửa TS cuối |
| `pnpm lint` | PASS (`eslint .`, không lỗi) |
| `pnpm test -- src/lib/errors src/collections/staff-password-length.test.ts src/hooks src/endpoints/public/job-applications.test.ts src/endpoints/public/newsletter.test.ts src/jobs` | PASS — 28 file, 193 test (round 1: 190; +3 test mới: errors rỗng, `formatErrors`, `/reset-password`) |

## Đóng các finding round 1
- **M1 (MAJOR) — ĐÃ ĐÓNG.** Task file: trạng thái đổi sang `awaiting review round 2` (dòng 5); Acceptance đã tick đủ, ghi rõ phần thay thế trình duyệt (dòng 54-61); mục Repro Verification có before/after/evidence và `Status: PASS` (dòng 66-72); Residual risk (dòng 74-78) gồm gợi ý ô mật khẩu không làm, chưa kiểm trình duyệt, path tiếng Anh khi nhiều trường, proxy 5xx; Doc impact `no doc impact` (dòng 80-81). Evidence kiểm chứng được bằng test tự động mà reviewer đã chạy lại:
  - `src/collections/staff-password-length.test.ts:36-41` — đưa lỗi qua `formatErrors` của Payload (cùng hàm tạo body REST), khẳng định `errors[0].message === "Mật khẩu tối thiểu 10 ký tự."` và không chứa "The following field".
  - `src/collections/staff-password-length.test.ts:43-54` — gọi handler endpoint `/reset-password` thật với mật khẩu 9 ký tự → `ValidationError` với message tiếng Việt. Không có false-positive: nếu không tìm thấy endpoint thì `caught` trả `undefined` → `toBeInstanceOf` fail. `assertPasswordLength` ném trước khi đụng `req.payload.collections`, nên `payload = {}` trong test là đủ.
  - Before-fix được giải thích đúng theo constructor `ValidationError(results, t)` (không có `t` → tiền tố en + path); hợp với root cause đã chứng minh.
- **m2 (MINOR) — ĐÃ ĐÓNG.** `enforcePasswordLength` được export (`src/collections/Staff.ts:45`); test import trực tiếp (`staff-password-length.test.ts:5,7-12`), không còn `beforeValidate[0]`. Nhánh `/reset-password` đã có test.
- **m3 (MINOR) — ĐÃ ĐÓNG.** `buildToastMessage([])` → `"Dữ liệu không hợp lệ."` (`src/lib/errors/vi-validation-error.ts:19`); test `vi-validation-error.test.ts:45-47`.
- **m1 (MINOR, round 1)** — chưa sửa, đã ghi vào Residual risk của task (hợp lệ, không chặn).

## Soát lại diff toàn task (regression)
- Helper giữ instance `ValidationError`, `data.errors` giữ nguyên shape, status 400 (`vi-validation-error.test.ts:16-21`); chỉ ghi đè `message`.
- 7 chỗ ném lỗi đều qua helper, có truyền `req`; điều kiện luật không đổi (`< MIN_PASSWORD_LENGTH`, `totalDocs === 0`, `touched.totalDocs > 0`, `problem`, `!isUuid`, anonymized `changed.length`, `missing.length`).
- Grep `new ValidationError` trong `src`: chỉ `src/lib/errors/vi-validation-error.ts:35` + 3 file test giả lập (`job-applications.test.ts`, `newsletter.test.ts`, `restore-public-error-message.test.ts`) — đạt Acceptance.
- `delete-cv-and-audit.ts`: `APIError(..., 502, undefined, true)`, id chỉ vào `logger.error`, message không PII; test `delete-cv-and-audit.test.ts` phủ cả nhánh lỗi + thành công. Vẫn throw sau delete trong cùng `req` → rollback như cũ.
- Không có thay đổi ngoài scope trong các file task; không drive-by refactor.

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS (chỉ hook server + thông báo lỗi).

## Skill gates
- aislop: skip — Bash của reviewer giới hạn ở verify commands + git (gate Claude Code), không chạy được `aislop scan`.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); `pnpm lint` (eslint) PASS thay thế.
- ocr (open-code-review): skip, ocr not installed / ngoài danh sách lệnh được phép.
- AI-readable: OK — tên rõ (`createViValidationError`, `buildToastMessage`, `enforcePasswordLength`), hàm ngắn (<20 dòng), indirection 1 bước, comment nêu WHY; 0 indicator. Helper nằm `src/lib/errors/` đúng convention `src/lib/*`.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không có môi trường được phép; không đổi bề mặt auth (chỉ đổi chữ lỗi, luật giữ nguyên).

## Findings

### [CRITICAL]
- Không có.

### [MAJOR]
- Không có.

### [MINOR]
- **n1 — Thứ tự import** `src/collections/Staff.ts:18`: `../lib/errors/vi-validation-error` đặt trước `../lib/admin/collection-labels` (không theo alphabet trong nhóm). Lint không bắt; không chặn. Fix tùy chọn: chuyển xuống sau dòng `collection-labels`.
- **m1 (từ round 1, giữ nguyên)** — toast nhiều trường hiện path tiếng Anh (`fullName, phone`); đã ghi Residual risk, đề xuất task riêng thêm `label` tiếng Việt cho `ViFieldError`.

## Residual risk
- Chưa kiểm trên trình duyệt admin thật (toast client); evidence dựa trên `formatErrors` của Payload + handler endpoint thật — reviewer không chạy app theo quyền.
- Proxy/CDN ngoài repo có thể thay body 5xx (502 của #8) — không xác minh được từ repo.
- Đường `restore-public-error-message` ở build production (minify `name`) đã kiểm ở round 1 bằng đọc code; không có thay đổi mới ảnh hưởng.

## Verdict
✅ **PASS** — M1/m2/m3 round 1 đã đóng; Repro Verification `Status: PASS` có evidence test tự động kiểm chứng được (reviewer chạy lại: typecheck/lint PASS, vitest 28 file/193 test PASS); không phát sinh regression; không còn CRITICAL/MAJOR.
