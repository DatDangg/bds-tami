# Run Journal — build/tami-website · layer-2-task-09

```yaml
workItem: build/tami-website
phaseTask: layer-2-task-09
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-16T17:16:57.000Z
filesTouched: [".context/progress.json","src/components/icons.ts","src/i18n/messages/vi.json","src/i18n/messages/en.json","vitest.config.ts","tasks/tami-website/layer-2-task-09.md"]
filesNew: [".context/runs/build-tami-website-layer-2-task-09.md","src/components/forms/"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-2-task-09-round-2-review.md
  round: 2
  verdict: PASS
next: "done — layer 2 hết task khả dụng (task-02 blocked) → spec-validator layer 2."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-16T16:55:28.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-16T16:55:28.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 1f4d2f7; src/payload-types.ts dirty chỉ CRLF (ngoài manifest). Docker dev đang chạy.
- 2026-10-16T17:06:10.000Z ✅ DONE builder — src/components/forms/ (FormField, ConsentCheckbox, TurnstileWidget lazy viewport/focusin, FormStatus, use-public-form, submit-helpers) + tests; i18n form.*; vitest inline next-intl. lint/typecheck/build PASS, test 516 PASS. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-16T17:10:45.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 parseDetails bỏ item không path → 400 validate hiện nhầm captcha, mất message server. 7 MINOR (retry gửi dữ liệu cũ, lastSubmit giữ PII, multipart bỏ extra không phải chuỗi, double-submit theo status, loadTurnstile cache fail, expired reset trùng, key trùng). ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-16T17:14:19.000Z ✅ DONE builder fix — parseDetails giữ item chỉ message; 400 không detail → body.error, captcha chỉ khi error khớp /captcha/i; retry requestSubmit; xoá lastSubmit; extra multipart String/JSON; inFlightRef; loadTurnstile không cache fail; bỏ reset trùng; dedupe key. lint/typecheck/build PASS, test 524 PASS. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-16T17:16:57.000Z ✅ DONE reviewer round 2 STRICT — PASS, 4 MINOR. closeout: no doc impact; progress += layer-2/task-09; commit.
