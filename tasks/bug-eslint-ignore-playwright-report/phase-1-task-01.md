# bug-eslint-ignore-playwright-report · phase-1-task-01 — `pnpm lint` toàn repo PASS: ignore output Playwright (BL-094)

- Change doc: `spec/changes/2026-10-28-eslint-ignore-playwright-report.md` (BACKLOG BL-094). User duyệt 2026-10-28 "ghi BL rồi làm luôn đi" (batch follow-up 1/3, không checkpoint plan).
- Phụ thuộc: không.
- Trạng thái: `done`

## Classification / Risk
- Type: **BUG** (tooling — cấu hình lint; không đổi code app/API/schema/requirement).
- Risk: **LOW** — chỉ `eslint.config.mjs` (`ignores`).
- Expected review level: **FAST** (1 file config, không shared runtime/API/auth/schema; verify = `pnpm lint` toàn repo).
- Doc impact: `no doc impact` (không đổi contract/schema/behavior tài liệu hoá).

## Repro
- `pnpm lint` (= `eslint .`) trên HEAD 2465a05 → exit 1, `3064 problems (239 errors, 2825 warnings)`.
- Expected: exit 0.

## Root cause (change-request, đo trực tiếp — không spawn Explore)
- `eslint.config.mjs:6-30` `ignores` thiếu `playwright-report/` → ESLint lint bundle JS minified của trace viewer. Gom theo thư mục (`eslint . -f json`): **100% lỗi nằm trong `playwright-report/trace/`** (239 errors / 2825 warnings), 0 lỗi ở file nguồn.
- `test-results/` (output Playwright khác, `.gitignore:41`) cũng tồn tại, chưa có trong ignores → ignore luôn để chặn tái phát. `blob-report/` không tồn tại, không có trong `.gitignore` → không thêm (YAGNI).

## Thiết kế fix
- Thêm 2 dòng vào `ignores` (sau `coverage/`, cùng nhóm output tool), comment ngắn kiểu dòng hiện có:
  - `"playwright-report/", // báo cáo HTML Playwright, gitignore`
  - `"test-results/", // output Playwright (trace/ảnh lỗi), gitignore`

## Files
- `eslint.config.mjs` duy nhất.
- KHÔNG đụng file dirty việc khác: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/ward-in-province.ts`, `tools/**`, `spec/changes/BACKLOG.md`, change doc chưa track.

## Acceptance
- [x] `eslint.config.mjs` `ignores` có `playwright-report/` + `test-results/`, comment ngắn.
- [x] `pnpm lint` toàn repo exit 0 (hoặc chỉ còn lỗi thật không liên quan → ghi rõ, không sửa ngoài scope).

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-28 (change-request): root cause đo bằng `eslint . -f json` gom thư mục — không Explore.
- 2026-10-28 (builder): thêm `"playwright-report/"` + `"test-results/"` vào `ignores` sau `coverage/` trong `eslint.config.mjs` (attempt 1); `pnpm lint` toàn repo → exit 0, không còn problem nào (trước: exit 1, 3064 problems).

## Repro Verification
- Original repro: `pnpm lint` (= `eslint .`) toàn repo trên HEAD 2465a05.
- Expected: exit 0.
- Actual before fix: exit 1, 3064 problems (239 errors, 2825 warnings), 100% trong `playwright-report/trace/`.
- Actual after fix: exit 0, output rỗng (0 problems).
- Evidence: chạy `pnpm lint` từ `D:\prj\bds` sau khi sửa `eslint.config.mjs`; không còn lỗi ở file nào khác.
- Status: PASS

## Close-out (change-request)
- r1 FAST PASS, 0 finding (`.context/review-reports/bug-eslint-ignore-playwright-report-phase-1-task-01-round-1-review.md`); reviewer chạy `pnpm lint` độc lập → exit 0.
- Doc impact: `no doc impact`. No spec change (giữ 1.61.0); test-scope v93 (v92 archive).
- Residual: nếu sau này Playwright cấu hình `outputDir`/reporter ra thư mục lồng (vd `e2e/test-results/`) thì ignores gốc không phủ — ngoài scope.
