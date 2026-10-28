# bug-admin-job-deadline-date-format · phase-1-task-01 — Admin Tuyển dụng: "Hạn nộp hồ sơ" hiện "thg 10 30" thay vì dd/MM/yyyy (BL-097)

- Change doc: `spec/changes/2026-10-28-admin-job-deadline-date-format.md` (BACKLOG BL-097, QA sheet 28/10 dòng 18, Trung bình).
- Phụ thuộc: BL-076 (`af1e983`, chưa push/deploy). Batch BL-095→BL-100 user duyệt "auto proceed".
- Trạng thái: `done` — **fixed by af1e983, chờ deploy**. Không đổi code → không builder/reviewer. Spec: no spec change (1.61.0), test-scope v101.

## Classification / Risk
- Type: **BUG** (hiển thị admin; không đổi API/schema/requirement). Risk: LOW (không có diff code).
- Review level: n/a (không đổi code). Doc impact: no doc impact.

## Root cause
- QA test trên bản deploy chưa có BL-076. Trước `af1e983`, field `deadline` (`src/collections/JobPostings.ts`) chỉ có `admin.date.pickerAppearance: "dayOnly"` không có `displayFormat` → Payload 3.91 `node_modules/@payloadcms/ui/dist/elements/DatePicker/DatePicker.js:53` hard-code `dateFormat = "MMM dd"`; với locale `vi` của date-fns, `MMM dd` render "thg 10 30" (đúng chuỗi QA báo).
- `af1e983` (BL-076) đổi sang `admin: { date: adminDate("dayOnly") }` → `displayFormat: "dd/MM/yyyy"` (`src/fields/admin-date.ts`), unit test `src/fields/admin-date.test.ts` chặn mọi field date dùng `MMM`.

## Repro trên code hiện tại (HEAD `7b0a315`, dev `http://localhost:3000`, Edge, 1920×1080, TZ Asia/Ho_Chi_Minh, locale vi-VN)
- Danh sách `/admin/collections/job-postings`: cột Hạn nộp hồ sơ `08/10/2026 + Đã quá hạn`, `16/12/2026`, `17/11/2026`, `16/12/2026` — dd/MM/yyyy (`.context/review-reports/assets/bl097-list-1920.png`).
- Form tin `12b1c2a1-…` tab "Thông tin tuyển dụng": ô hiển thị `16/12/2026` (`bl097-form-field-1920.png`).
- Ô chọn ngày: header dropdown "Tháng Mười Hai" / "2026", thứ "Th 2 … CN" — không có "thg" (`bl097-picker-1920.png`).
- Chọn tháng sau, ngày 15 → ô `15/01/2027` → Lưu → reload → ô `15/01/2027` (MATCH), API `deadline = 2027-01-15T12:00:04.000Z` = 15/01/2027 19:00 giờ VN → đúng ngày GMT+7 (`bl097-form-reopened-1920.png`).
- Dữ liệu dev đã khôi phục về `2026-12-16T16:26:04.270Z` sau probe.
- Script: `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\252b8873-425c-4c6a-966c-b60b663a3c53\scratchpad\bl097\probe.mjs` (+ `restore.mjs`), chạy `node` từ `D:\prj\bds`.

## Acceptance
- [x] Kiểm lại trên code hiện tại (có `af1e983`) — hết lỗi, đóng với evidence.
- [x] Ô + ô chọn ngày hiển thị dd/MM/yyyy; lưu/mở lại đúng ngày (GMT+7).
- [x] Cột danh sách cùng định dạng (dd/MM/yyyy, custom `JobDeadlineCell`).

## Verification summary
- Playwright probe PASS (trên). Không chạy lint/typecheck/test vì không đổi code (`verify: skip, no code change`).

## Residual risk
- Server test chưa có `af1e983` → QA sẽ còn thấy "thg 10 30" cho tới khi deploy; cần QA kiểm lại sau deploy.

## Doc impact
- no doc impact.
