---
id: eslint-ignore-playwright-report
type: bug
status: done
created: 2026-10-28
---

# `pnpm lint` toàn repo FAIL vì `playwright-report/` (BL-094)

Nguồn: ghi nhận lặp lại ở BL-088..091 (builder/reviewer phải lint từng file đổi), 2026-10-28.

## Bối cảnh
- `playwright-report/` là output Playwright (đã gitignore `.gitignore:42`) nhưng không có trong `ignores` của `eslint.config.mjs` → `pnpm lint` lint cả bundle báo cáo → FAIL.
- Kiểm cả `test-results/` (output Playwright khác) nếu có.

## Acceptance (bắt buộc)
- [x] `eslint.config.mjs` `ignores` thêm `playwright-report/` (+ `test-results/` nếu có), comment ngắn theo kiểu các dòng hiện có.
- [x] `pnpm lint` toàn repo PASS (hoặc chỉ còn lỗi thật không liên quan → ghi rõ, không sửa ngoài scope).

## Kết quả (2026-10-28)
- Done — task `tasks/bug-eslint-ignore-playwright-report/phase-1-task-01.md`; `eslint.config.mjs` ignores thêm `playwright-report/` + `test-results/`. `pnpm lint` toàn repo: trước exit 1 (3064 problems, 100% trong `playwright-report/trace/`) → sau exit 0. Reviewer FAST PASS r1. No spec change (1.61.0) / test-scope v93.
