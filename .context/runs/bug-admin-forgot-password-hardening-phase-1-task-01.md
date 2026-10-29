# Run Journal — bug/admin-forgot-password-hardening · phase-1-task-01

```yaml
workItem: bug/admin-forgot-password-hardening
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-29T00:00:00+07:00
filesTouched: [src/collections/Staff.ts, src/lib/email/transport.ts, src/payload.config.ts]
filesNew: [tasks/bug-admin-forgot-password-hardening/phase-1-task-01.md, src/endpoints/admin/staff-forgot-password.ts, src/endpoints/admin/staff-forgot-password.test.ts, src/lib/email/send-error-fields.ts, src/lib/email/send-error-fields.test.ts, src/lib/email/smtp-config.ts, src/lib/email/smtp-config.test.ts, src/lib/email/transport.test.ts]
evidence:
  reportPath: .context/review-reports/bug-admin-forgot-password-hardening-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS
  level: STRICT
next: "done — commit (see git log)"
loopSignal: none
approvals: [{gate: change_doc, at: 2026-10-28, ok: "user: Có, thêm task (BL-100)"}, {gate: batch, ok: "auto proceed"}]
```

## Notes
Dirty tree ngoài batch không stage. BL-095 change doc + dòng BACKLOG BL-095 không đụng.

## History
- 2026-10-29 journal created; root cause from code; START builder (cancel sẽ redo bước này)
- 2026-10-29 INTERRUPTED (session cũ thoát giữa builder). Đĩa: M Staff.ts transport.ts payload.config.ts; ?? staff-forgot-password(.test).ts, deferred-send.ts, send-error-fields.ts, smtp-config(.test).ts, transport.test.ts. /resume → redo builder trên đĩa (attempt giữ 1). START builder (cancel sẽ redo bước này)
- builder DONE (redo): req.data không được Payload parse cho custom endpoint → parse trên req.clone(); cả handler mặc định chạy nền khi có email (ALS bỏ, deferred-send.ts xoá); live dev smtp.invalid: 200 đồng nhất, 9–13ms cả 2 nhánh; 400 giữ; log whitelist; typecheck/lint/test 4842 PASS. START reviewer r1 STRICT (cancel sẽ redo bước này)
- reviewer r1 STRICT PASS, 5 MINOR (dup default-endpoint lookup; no throttle for background work on unknown emails; prod rewrites to/cc/bcc string→array; whitespace email 200 vs 400; test không assert SMTP_PASS) — chấp nhận, ghi follow-up. START spec-publisher (cancel sẽ redo bước này)
- spec-publisher DONE: no spec change 1.61.0, scope v104. Doc reconcile API_SPEC §4 + ARCHITECTURE env. progress/BACKLOG/archive updated. Commit (BACKLOG chỉ hunk BL-100 qua update-index). DONE
