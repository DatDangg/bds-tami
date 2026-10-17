# Run Journal — build/tami-website · layer-4-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-4-task-01
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T05:15:00.000Z
filesTouched: [".context/progress.json","docs/ERD.md","migrations/index.ts","package.json","src/access/access.test.ts","src/access/index.ts","src/collections/_shared/content-defaults.test.ts","src/collections/_shared/content-defaults.ts","src/fields/slug.ts","src/lib/slug.test.ts","src/lib/slug.ts","src/payload-types.ts","src/payload.config.ts","tasks/tami-website/layer-4-task-01.md"]
filesNew: [".context/runs/build-tami-website-layer-4-task-01.md","migrations/20261017_031052_categories_developers.json","migrations/20261017_031052_categories_developers.ts","scripts/seed-categories.ts","seed/categories.ts","src/access/readUnlessTrashed.ts","src/collections/Categories.ts","src/collections/Developers.ts","src/fields/name.ts","src/fields/scope-slug.ts","src/fields/slug.test.ts","src/hooks/categories/","tests/fixtures/categories/","tests/integration/categories.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-4-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-4-task-02."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T04:22:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T04:22:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 83caaa4; src/payload-types.ts dirty chỉ CRLF. Docker dev tami-* chạy.
- 2026-10-17T04:40:00.000Z ✅ DONE builder attempt 1 — Categories (scopeSlug ẩn → UNIQUE(scope_slug,_locale)), Developers, guard tree/delete, seed idempotent (pnpm seed:categories), factory omit/scopeField/route:null, fieldAccess undefined/tên lạ, slug in[base..-20]. Migration 20261017_031052 additive (primary đã soát: không DROP/SET NOT NULL/backfill), applied dev batch 7. test 66 file 667 PASS, build OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T04:52:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 Payload beforeDuplicate thêm " - Copy" cho scopeSlug mọi locale → slug en trùng (locale,scope,slug). MINOR-1 scope đổi được qua overrideAccess; MINOR-2 parent trong trash; MINOR-3 scope ngoài enum → 500; MINOR-4 lỗi race báo trên field ẩn. Drift migration chưa kiểm. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T05:00:00.000Z ✅ DONE builder fix attempt 2 — MAJOR-1 disableDuplicate Categories (Local/REST 400); MINOR-1 lock-scope hook; MINOR-2 parent trong trash; MINOR-3 isAllowedScope → 400; MINOR-4 residual. Drift: migrate:create → No schema changes, không sinh file. test 672 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T05:15:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (672 test, migrate:status 7/7). Residual MINOR-1 slug duplicate developers → AC L5-T01; seed COPY → AC L6-T01. Close-out → commit.
