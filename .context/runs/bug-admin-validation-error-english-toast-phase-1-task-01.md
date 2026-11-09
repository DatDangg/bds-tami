# Run Journal — bug/admin-validation-error-english-toast · phase-1-task-01

```yaml
workItem: bug/admin-validation-error-english-toast
phaseTask: phase-1-task-01
step: closeout
agent: spec-publisher
status: running                     # cancel sẽ redo bước này
attempt: 1
interrupted: false
updatedAt: 2026-11-09T02:35:34Z
filesTouched: []
filesNew:
  - tasks/bug-admin-validation-error-english-toast/phase-1-task-01.md
evidence:
  reportPath: null
  round: 0
  verdict: null
next: "spec-publisher (BUG) → progress → archive change → commit"
loopSignal: none
approvals:
  - { gate: phase_plan, at: null, ok: null }
batchQueue: []
```

## Notes / WIP reasoning

- Classify BUG (chỉ đổi hiển thị lỗi, không đổi luật validate/schema).
- Root cause lấy từ change doc, đã đối chiếu `ValidationError.js` + `formatErrors.js:6-12` (toast = error.message nguyên văn).
- Override vi `followingFieldsInvalid_*` đã có sẵn (`src/lib/admin/payload-vi-overrides.ts:23`) — không cần thêm.
- Consumer `instanceof ValidationError` / `data.errors`: job-applications.ts:106, newsletter.ts:56, translate-content.ts:144 → helper phải trả instance ValidationError, giữ data.errors.
- spec-publisher: chưa chạy (BUG — chạy sau reviewer PASS). spec hiện tại 1.62.1.

## History

- 2026-11-09 journal created — phase plan lập xong, dừng ở checkpoint duyệt plan
- 2026-11-09T02:25:46Z user duyệt plan (builder sonnet) → gọi builder
- 2026-11-09T02:28:55Z builder DONE: helper src/lib/errors/vi-validation-error.ts + 7 chỗ + delete-cv APIError; typecheck/lint PASS, vitest 125+286 PASS; gợi ý ô mật khẩu không làm (residual)
- 2026-11-09T02:28:55Z gọi reviewer round 1
- 2026-11-09T02:31:24Z reviewer r1 FAIL (M1 task file repro verification trống + thiếu test REST; code OK) report .context/review-reports/bug-admin-validation-error-english-toast-phase-1-task-01-round-1-review.md → gọi builder fix
- 2026-11-09T02:33:45Z builder fix DONE: test REST formatErrors + /reset-password, task file repro PASS, m2/m3 sửa; typecheck/lint PASS, vitest 259 PASS
- 2026-11-09T02:33:45Z gọi reviewer round 2
- 2026-11-09T02:35:34Z reviewer r2 PASS (.context/review-reports/bug-admin-validation-error-english-toast-phase-1-task-01-round-2-review.md)
- 2026-11-09T02:35:34Z gọi spec-publisher
