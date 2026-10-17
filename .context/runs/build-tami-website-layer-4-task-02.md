# Run Journal — build/tami-website · layer-4-task-02

```yaml
workItem: build/tami-website
phaseTask: layer-4-task-02
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T06:10:00.000Z
filesTouched: [".context/progress.json","docs/ERD.md","migrations/index.ts","src/payload-types.ts","src/payload.config.ts","src/fields/translation.ts","src/access/index.ts","tasks/tami-website/layer-4-task-02.md"]
filesNew: [".context/runs/build-tami-website-layer-4-task-02.md","migrations/20261017_033508_globals_site_header_footer.json","migrations/20261017_033508_globals_site_header_footer.ts","src/fields/nav-link.ts","src/globals/","src/hooks/revalidate-global.ts","src/lib/content/get-globals.ts","src/lib/content/global-cache.ts","src/lib/content/nav-link.test.ts","src/lib/content/nav-link.ts","src/lib/content/read-global.ts","tests/fixtures/globals/","tests/integration/globals.test.ts","src/access/hideFromNonAdmin.ts","src/hooks/trim-text.ts","migrations/20261017_034248_globals_translation_group.ts","migrations/20261017_034248_globals_translation_group.json"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-4-task-02-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-4-task-03."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T05:25:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T05:25:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 196c8ec, working tree sạch. Docker dev tami-* chạy.
- 2026-10-17T05:40:00.000Z ✅ DONE builder attempt 1 — globals SiteSettings/Header/Footer, field read isAdmin + afterRead stripInternalFields, readPublicGlobal overrideAccess:false, revalidateTag global:<slug> + unstable_cache, nav-link key/URL validate. Migration 20261017_033508 additive (primary soát: ALTER chỉ trên bảng mới), applied batch 8, drift sạch. test 68 file 695 PASS, build OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T05:50:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 3 global thiếu nhóm translation (ERD §1.1, PERMISSION §4). MINOR-1 sale thấy global trong admin; MINOR-2 server-only; MINOR-3 test locale=all/depth/select; MINOR-4 URL lưu chưa trim. Không rò field nội bộ. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T06:00:00.000Z ✅ DONE builder fix attempt 2 — MAJOR-1 translationGroup() cho 3 global (không hasEnglish), migration MỚI 20261017_034248 additive (21 ADD COLUMN nullable/default + enum + index; primary soát), applied batch 9, drift sạch; MINOR-1 hideFromNonAdmin; MINOR-2 server-only; MINOR-3 7 ca truy vấn; MINOR-4 trim-text. test 708 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T06:10:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (708 test, migrate:status 9/9). MINOR-A → AC L4-T04, MINOR-B → AC L4-T03. Close-out → commit.
