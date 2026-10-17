# Run Journal — build/tami-website · layer-5-task-05

```yaml
workItem: build/tami-website
phaseTask: layer-5-task-05
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T16:45:00.000Z
filesTouched: [".context/progress.json",".env.example",".github/workflows/deploy.yml","docker/Dockerfile","docs/ARCHITECTURE.md","docs/runbooks/deploy.md","next.config.ts","package.json","pnpm-lock.yaml","src/app/(frontend)/[locale]/layout.tsx","src/app/(frontend)/[locale]/page.tsx","src/components/icons.ts","src/i18n/messages/en.json","src/i18n/messages/vi.json","src/lib/logger.test.ts","src/lib/logger.ts","src/lib/monitoring/scrub-text.test.ts","src/lib/monitoring/scrub-text.ts","tasks/tami-website/layer-5-task-05.md"]
filesNew: [".context/runs/build-tami-website-layer-5-task-05.md","public/brand/tami-logo-dark.png","scripts/seed-shell-globals.ts","scripts/upload-sourcemaps.d.mts","scripts/upload-sourcemaps.mjs","seed/shell-globals.ts","src/components/layout/","src/lib/monitoring/browser-sourcemaps.ts","tests/e2e/","tests/unit/upload-sourcemaps.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-5-task-05-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-5-task-06."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T15:10:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T15:10:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD e157b77, working tree sạch.
- 2026-10-17T15:50:00.000Z ✅ DONE builder attempt 1 — layout công khai (Header/DesktopNav/MobileMenu Radix Dialog/Footer/LanguageSwitcher/SkipLink), shell-data fallback en.json, scrub-text bỏ lookbehind, logger %s/%d, source map upload qua sentry-cli chỉ khi có token (xoá .map), e2e revalidate 9/9, seed:shell. test 85 file 915 PASS, build OK. Primary kiểm trình duyệt next start :3217 — 375/768/1280 không cuộn ngang, skip link đầu, landmark đủ, menu mobile mở/khoá cuộn/Esc đóng/trả focus, /en không chữ Việt, search /cho-thue?q=; đã tắt server. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T16:05:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 scrub-text bỏ qua dãy ≥12 số → lọt +842838234567/0084…/+840…; MAJOR-2 LanguageSwitcher 32×44, tel/mailto MenuContact không min-height (Responsive gate FAIL); MAJOR-3 DesktopNav submenu thiếu aria-expanded/Enter/Esc. 7 MINOR. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T16:25:00.000Z ✅ DONE builder fix attempt 2 — scrubText che mọi dạng SĐT VN qua normalizePhone trước luật ≥12 số; touch target ≥44 (LanguageSwitcher, MenuContact, logo, footer, skip link); DesktopNav disclosure aria-expanded/Enter/Space/Esc/click ngoài, hover chỉ mouse; MINOR-3/5/6. test 86 file 924 PASS, build OK. Primary đo lại :3218 ở 375: 0 phần tử <44×44 (trang + menu mở), scrollWidth 375; đã tắt server. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T16:45:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (924 test, Responsive gate PASS). MINOR → AC L14-T02, L15-T01. Close-out → commit.
