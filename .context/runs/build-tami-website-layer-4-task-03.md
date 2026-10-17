# Run Journal — build/tami-website · layer-4-task-03

```yaml
workItem: build/tami-website
phaseTask: layer-4-task-03
step: closeout
agent: primary
status: done
attempt: 3
interrupted: false
updatedAt: 2026-10-17T07:45:00.000Z
filesTouched: [".context/progress.json","next.config.ts","src/app/(payload)/api/[...slug]/route.ts","src/collections/Media.ts","package.json","pnpm-lock.yaml","docs/ARCHITECTURE.md","tasks/tami-website/layer-4-task-03.md","tests/fixtures/test-content/collection.ts","tests/integration/media-upload.test.ts","tasks/tami-website/layer-6-task-01.md"]
filesNew: [".context/runs/build-tami-website-layer-4-task-03.md","src/lib/content/public-queries.ts","src/lib/content/pagination.ts","src/lib/http/cache-policy.ts","src/lib/content/pagination.test.ts","src/lib/content/public-queries.test.ts","src/lib/http/cache-policy.test.ts","tests/integration/public-queries.test.ts","tests/integration/public-queries-no-status.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-4-task-03-round-3-review.md
  round: 3
  verdict: PASS
next: "Task done + committed. Task kế: layer-4-task-04 (TranslationService)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T06:20:00.000Z, ok: true}, {gate: attempt_3, at: 2026-10-17T07:12:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T06:20:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD fcf5b30, working tree sạch. Docker dev tami-* chạy.
- 2026-10-17T06:35:00.000Z ✅ DONE builder attempt 1 — publicWhere dựa buildPublicWhere (access/publishedOnly), findPublicList/BySlug overrideAccess:false fallbackLocale:false trash:false; parsePagination; next.config headers trang công khai [.] pattern, /admin no-store; /api qua withDefaultNoStore ở catch-all (config headers ghi đè route); Media modifyResponseHeaders immutable; server-only dependency. Header đo thật next start khớp AC. test 73 file 762 PASS, build OK. Không migration. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T06:48:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 cache-policy.ts:24 path có dấu chấm (robots.txt, sitemap.xml) 404 nhận s-maxage=31536000 mặc định Next → CDN giữ 1 năm. MINOR-1 populate EN không lọc hasEnglish; MINOR-2 collection: string. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T06:58:00.000Z ✅ DONE builder fix attempt 2 — MAJOR-1 DOTTED_PATH_SOURCE → public, max-age=0, s-maxage=60 (404 robots/sitemap + file public/; _next/static giữ immutable) đo thật next start; MINOR-1 ghi chú JSDoc + ARCH §5.1; MINOR-2 PublicCollectionSlug. test 777 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T07:08:00.000Z ✅ DONE reviewer round 2 STRICT — FAIL: round-1 MAJOR đóng (404 dotted 60s, /vi 301 an toàn vì localeDetection false); MAJOR-1 mới: trang public trả public s-maxage cho request RSC:1 (307 → /?_rsc, 200 text/x-component) — Cloudflare bỏ qua Vary → cache poisoning. MINOR-A denylist PublicCollectionSlug; MINOR-B public/ max-age=0. Hết 2 vòng → dừng hỏi user.
- 2026-10-17T07:12:00.000Z User duyệt attempt 3. ▶ START builder attempt 3 (cancel sẽ redo bước này).
- 2026-10-17T07:25:00.000Z ✅ DONE builder attempt 3 — rscVariantNoStoreRules: 5 rule has (rsc, next-router-prefetch/state-tree/segment-prefetch header, _rsc query) → no-store sau rule public; đo next start: RSC/_rsc no-store, HTML thường public s-maxage=60. MINOR-A allowlist categories|developers. ARCH §5.1 + AC L6-T01. test 778 PASS, build OK. ▶ START reviewer round 3 STRICT (cancel sẽ redo bước này).
- 2026-10-17T07:45:00.000Z ✅ DONE reviewer round 3 STRICT — PASS (778 test, đo next start mọi biến thể RSC). Close-out: doc no-store, MINOR-1/2 → AC L5-T08, bookkeeping task file. Commit.
