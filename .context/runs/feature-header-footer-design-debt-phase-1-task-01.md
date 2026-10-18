# Run Journal — feature/header-footer-design-debt · phase-1-task-01

```yaml
workItem: feature/header-footer-design-debt
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-19T13:00:00+07:00
filesTouched: [src/components/layout/BrandLogo.tsx, src/components/layout/DesktopNav.tsx, src/components/layout/Footer.tsx, src/components/layout/Header.tsx, src/components/layout/Header.test.tsx, src/components/layout/MobileMenu.tsx, src/components/layout/PublicShell.tsx, src/components/layout/PublicShell.test.tsx, src/components/layout/load-shell.ts, src/components/layout/shell-data.ts, src/components/layout/shell-data.test.ts, docs/ARCHITECTURE.md, .context/error-memory.md, .context/decisions.md, SPECIFICATIONS.md, spec/CHANGELOG.md, spec/test-scope/current.json, .context/design-spec.md, .context/progress.json, spec/changes/BACKLOG.md, spec/changes/2026-10-19-header-footer-design-debt.md]
filesNew: [spec/updates/2026-10-19-header-footer-design-debt.md, tasks/feature-header-footer-design-debt/phase-1-task-01.md, tasks/feature-header-footer-design-debt/phase-1-task-02.md]
evidence:
  reportPath: .context/review-reports/feature-header-footer-design-debt-phase-1-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "none — task-01 done (commit này); tiếp phase-1-task-02"
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-10-19, ok: true, note: "user auto proceed batch"}]
batchQueue: [phase-1-task-01, phase-1-task-02]
```

## Notes
- Pre-existing dirty ngoài scope (KHÔNG commit): .claude/agents/*.md, .context/project-config.md, importMap.js, payload-types.ts, .claude/launch.json, change-backlog journal, change doc pending khác.
- Spec delta: design-spec §2.1 (1 hàng ≥ xl, Logo, Nút CTA), §2.2 (accordion menu con), §2.4 (footer accordion chi tiết). Intent user duyệt 2026-10-19.
- Quyết định: logo lấy từ `site-settings.logo/logoDark` (đã có trong ERD) thay vì thêm field vào global `header` → không đổi schema, không migration. "CTA bật" = có label (locale) + link.
- Nút Menu hiện cả ≥ xl (acceptance "VI|EN + Menu phải") → bỏ tự đóng menu ở xl.

## History
- 2026-10-19 journal created; spec delta xong; ▶ START spec-publisher (cancel sẽ redo bước này)
- 2026-10-19 ✅ DONE spec-publisher: spec_version 1.3.0 → 1.4.0 (MINOR), scopeVersion 3
- 2026-10-19 ▶ START builder attempt 1 (cancel sẽ redo bước này)
- 2026-10-19 ✅ DONE builder attempt 1: lint/typecheck/build PASS, test 2437/1 fail pre-existing; browser 375/768/1280 kiểm (CTA chèn DOM mô phỏng)
- 2026-10-19 ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này)
- 2026-10-19 ✅ DONE reviewer round 1 STRICT FAIL (MAJOR-1 tràn 1280: logo CMS không giới hạn rộng, CTA không giới hạn; MINOR-1 768 lệch tâm chưa đo; MINOR-2 cache logo 60s)
- 2026-10-19 ▶ START builder attempt 2 fix (cancel sẽ redo bước này)
- 2026-10-19 ✅ DONE builder attempt 2: logo max-w, CTA max-w+truncate+title; đo 1280 (clientWidth 1265) nav↔logo/tìm ≥ 8.6px tổ hợp xấu nhất; 768 lệch tâm ≤ 2.6px; dev DB ctaButton khôi phục; lint/typecheck/build PASS, test 2437/1 pre-existing
- 2026-10-19 ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này)
- 2026-10-19 ✅ DONE reviewer round 2 STRICT PASS (2 MINOR → residual)
- 2026-10-19 close-out: ARCHITECTURE as-built, error-memory, decisions #7, task file, progress task-01 done → commit
