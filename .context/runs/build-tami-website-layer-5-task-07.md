# Run Journal — build/tami-website · layer-5-task-07

```yaml
workItem: build/tami-website
phaseTask: layer-5-task-07
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T18:50:00.000Z
filesTouched: ["context/design-spec.md",".context/progress.json","src/components/layout/Footer.tsx","src/components/layout/PublicShell.test.tsx","src/components/layout/PublicShell.tsx","src/components/layout/load-shell.ts","src/components/layout/shell-data.ts","src/i18n/messages/en.json","src/i18n/messages/vi.json","tasks/tami-website/layer-14-task-01.md","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-5-task-07.md"]
filesNew: [".context/review-reports/build-tami-website-layer-5-task-07-round-1-review.md",".context/review-reports/build-tami-website-layer-5-task-07-round-2-review.md",".context/runs/build-tami-website-layer-5-task-07.md","src/components/analytics/","src/components/consent/","src/lib/consent/"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-5-task-07-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-5-task-08 (nền SEO)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T17:50:00.000Z, ok: true, note: "User: cứ làm lần lượt, chỉ dừng khi cần hỏi"}]
batchQueue: []
```

## History

- 2026-10-17T17:50:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 2f9c5f7, working tree sạch.
- 2026-10-17T18:05:00.000Z ✅ DONE builder attempt 1 — consent-cookie {v,analytics,ts,pv}, CookieBanner + ConsentPreferences (Radix dialog), GoogleAnalytics chỉ khi đồng ý, rút đồng ý xoá _ga*, --floating-bottom-offset < md. lint/typecheck OK, test 95 file 987 PASS, build OK (build sinh lại importMap.js: thêm Lexical — thiếu từ L5-T02/T03). Chưa kiểm trình duyệt. Lệch spec: thêm pv; footer mở dialog thay vì banner. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T18:15:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 hydrate render enabled=false → clearGoogleAnalyticsCookies xoá _ga mỗi lần tải trang. MINOR-1 footer link vô dụng khi không có GA ID; MINOR-2 focus rơi về body sau lưu dialog. Lệch pv + dialog: chấp nhận (ghi as-built). importMap commit riêng (fix). ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-17T18:35:00.000Z ✅ DONE builder fix attempt 2 — GoogleAnalytics chỉ render khi decided !== undefined (+test hydrate, xác nhận fail khi bỏ guard); footer ẩn Cài đặt cookie khi không có GA ID; focus về main#main / nút footer. test 95 file 991 PASS, build OK. Trình duyệt next start :3219 — 375/768/1280 không cuộn ngang, nút ≥44, nút nổi không bị che; đồng ý → reload giữ _ga + 1 request gtag; từ chối không gtag; rút đồng ý xoá _ga*. Server đã tắt theo PID, dòng site_settings test đã xoá. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T18:50:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (991 test). MINOR-A → L15-T01. design-spec §3.10 as-built. Close-out → commit.
