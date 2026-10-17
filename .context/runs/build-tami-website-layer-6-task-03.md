# Run Journal — build/tami-website · layer-6-task-03

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-03
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T02:00:00.000Z
filesTouched: ["context/progress.json","docs/API_SPEC.md","docs/ARCHITECTURE.md","docs/ERD.md","migrations/index.ts","next.config.ts","package.json","pnpm-lock.yaml","spec/changes/BACKLOG.md","src/app/(frontend)/[locale]/[...rest]/page.tsx","src/app/(frontend)/[locale]/layout.tsx","src/app/(frontend)/[locale]/not-found.test.tsx","src/app/(frontend)/[locale]/not-found.tsx","src/collections/_shared/content-defaults.test.ts","src/collections/_shared/content-defaults.ts","src/payload-types.ts","src/payload.config.ts","src/proxy.ts","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-6-task-03.md","tasks/tami-website/layer-6-task-04.md","tasks/tami-website/layer-6-task-05.md","tasks/tami-website/layer-6-task-06.md","tasks/tami-website/layer-6-task-07.md","tasks/tami-website/layer-6-task-08.md","tasks/tami-website/layer-7-task-03.md","tests/fixtures/job-postings/payload-config.ts","tests/fixtures/news/payload-config.ts","tests/fixtures/projects/payload-config.ts","tests/fixtures/services-pages/payload-config.ts","tests/fixtures/test-content/payload-config.ts","tests/integration/proxy.test.ts"]
filesNew: [".context/review-reports/build-tami-website-layer-6-task-03-round-1-review.md",".context/review-reports/build-tami-website-layer-6-task-03-round-2-review.md",".context/runs/build-tami-website-layer-6-task-03.md","migrations/20261017_135306_redirects.json","migrations/20261017_135306_redirects.ts","src/app/global-not-found.tsx","src/collections/redirects-plugin.ts","src/components/layout/PublicDocument.tsx","src/hooks/create-slug-redirect.ts","src/lib/content/find-redirect.ts","src/lib/content/internal-path.test.ts","src/lib/content/internal-path.ts","src/lib/content/redirect-paths.test.ts","src/lib/content/redirect-paths.ts","src/lib/content/resolve-redirect.test.ts","src/lib/content/resolve-redirect.ts","tests/integration/content-redirects.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-03-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Kế: BL-003 sửa down migration (commit riêng), rồi L6-T02 (rentals)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: ... rồi layer 6"}]
batchQueue: []
```

## History

- 2026-10-18T00:40:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD ed37f66, working tree sạch. Thứ tự layer 6 theo spec-validation addendum: T03 → T02 → T09 → T10 → T06 → T07 → T04 → T05 → T08 → T01.
- 2026-10-18T01:15:00.000Z ✅ DONE builder attempt 1 — plugin-redirects (admin-only, to text, 301), hook afterChange tạo redirect khi đổi slug (chống chuỗi/vòng), proxy.ts tra redirect → 301 thật; experimental.globalNotFound + PublicDocument (404 SSR có nội dung vi/en), bỏ [...rest], rewrite afterFiles; migration 20261017_135306_redirects. test 106 file 1.134 PASS, build OK. curl :3221: 404 SSR đủ header/footer no-store; 301 + Location; RSC no-store. Residual: trang chi tiết gọi notFound() vẫn shell rỗng. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-18T01:25:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: M1 open redirect /evil.com qua regex + new URL. MINOR m1 proxy chờ DB không timeout, m2 301 cache, m3 redirect treo sau xoá cứng, m4 race unique from, m5 evidence. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T01:45:00.000Z ✅ DONE builder fix attempt 2 — isSafeInternalPath chung (chặn , //, /, /%2F, /%5C đầu), proxy chỉ 301 cùng origin; lookup timeout 400ms + cache 60s; pool connectionTimeout 5s; advisory lock chống race. test 108 file 1.174 PASS, build OK. curl :3222: target độc không theo, 301/404 đúng. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-18T02:00:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. ARCH §5.1 bổ sung validator/timeout/cache/lock. MINOR → L15-T01. Close-out → commit (kèm ghi quyết định user 2026-10-18 + follow-up L6-T04..08, L7-T03).
