# Run Journal — bug/homepage-field-errors-toast-still-shown · phase-1-task-01

```yaml
workItem: bug/homepage-field-errors-toast-still-shown
phaseTask: phase-1-task-01
step: done
agent: reviewer
status: done
attempt: 2
interrupted: true
updatedAt: 2026-11-10T00:00:00Z
filesTouched: [src/hooks/restore-public-error-message.ts, src/hooks/restore-public-error-message.test.ts, src/globals/homepage/blocks.ts, src/globals/Homepage.ts, src/components/admin/styles/_field-errors.scss, "src/app/(payload)/admin/importMap.js"]
filesNew: [src/fields/max-selection.ts, src/fields/max-selection.test.ts, src/components/admin/MaxSelectionHint.tsx, src/components/admin/MaxSelectionHint.test.tsx, tests/e2e/admin/homepage-max-selection.spec.ts, tasks/bug-homepage-field-errors-toast-still-shown/phase-1-task-01.md]
evidence:
  reportPath: .context/review-reports/bug-homepage-field-errors-toast-still-shown-phase-1-task-01-round-1-review.md
  round: 1
  verdict: FAIL
next: "xong — commit + push staging 2026-11-18 (user test local OK)"
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-11-09, ok: "user: 'OK, làm luôn' sau khi duyệt hướng sửa BL-119"}]
batchQueue: []
```

## Notes / WIP reasoning

- Root cause A: lỗi onChange chỉ hiện sau submit (useField showError); relationship hasMany không khoá theo maxRows.
- Root cause B (toast): build production trả 400 thiếu `data.errors` (formatErrors instanceof lệch bản sao payload trong bundle) → không gắn lỗi vào ô → FormErrorFocus gắn cờ unmatched → toast hiện. Repro trên `next start -p 3100` (ảnh bl119-before-prod-*).
- Probe Playwright lỡ 1 lần Lưu thành công ở viewport 390 (homepage dev): rentals.categories vẫn [] như ban đầu, không đổi dữ liệu.
- Working tree có sẵn nhiều file M/?? không thuộc task (snapshot `.context/runs/.bl119-baseline-status.txt`) — không commit chúng.

## History

- 2026-11-09 journal created; ▶ START change-request
- 2026-11-09 root cause A+B chứng minh (Playwright dev + prod build); task file tạo; ▶ START builder attempt 1
- 2026-11-09 ✅ DONE builder attempt 1 (typecheck/lint/vitest/e2e PASS); orchestrator: prod build (next start :3100) xác minh — 400 có data.errors, lỗi dưới ô + viền đỏ, khối tự mở, toast ẩn; khoá chọn (rentals 4, featured 6); thêm CSS ẩn "+ Thêm mới" khi đủ; dev data homepage rentals.categories khôi phục [] (đã lỡ lưu 4 rồi seed 5 qua SQL để thử dữ liệu cũ)
- 2026-11-09 ▶ START reviewer round 1
- 2026-11-09 ✅ DONE reviewer r1 FAIL (MAJOR-1 CSS :has lan sang field-type cha; MAJOR-2 repro pending)
- 2026-11-09 ▶ START builder attempt 2
- 2026-11-09 ✅ DONE builder attempt 2 (CSS scope + e2e); prod build dựng lại, ảnh after2-*; Repro Verification điền PASS
- 2026-11-09 ▶ START reviewer round 2
- 2026-11-10 reviewer r2 bị treo (không có report) → interrupted, redo reviewer r2 qua change-request (không tăng attempt); ▶ START
- 2026-11-10 resume: không có report r2 dở; :3000/:3100 không listen; .next BUILD_ID 2026-11-09 18:02. ▶ START [agent: reviewer] round 2 (cancel sẽ redo bước này)
- 2026-11-10 reviewer r2 lượt 1: code PASS (MAJOR-1/2 đóng), typecheck/lint/vitest PASS, UI BLOCKED (Postgres :5433 tắt). Change-request bật Docker + tami-postgres/redis, xoá probe `tests/e2e/admin/_bl119-probe.spec.ts` (MINOR-1); reviewer tiếp tục phần UI live (cùng round 2)
