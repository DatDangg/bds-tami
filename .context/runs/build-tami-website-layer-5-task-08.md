# Run Journal — build/tami-website · layer-5-task-08

```yaml
workItem: build/tami-website
phaseTask: layer-5-task-08
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T19:50:00.000Z
filesTouched: ["context/progress.json","docker/Dockerfile","docs/ARCHITECTURE.md","src/app/(frontend)/[locale]/layout.tsx","src/components/layout/Breadcrumb.tsx","src/lib/http/cache-policy.test.ts","src/lib/http/cache-policy.ts","src/lib/seo/json-ld.test.ts","src/lib/seo/json-ld.ts","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-5-task-08.md","tasks/tami-website/layer-8-task-05.md"]
filesNew: [".context/review-reports/build-tami-website-layer-5-task-08-round-1-review.md",".context/review-reports/build-tami-website-layer-5-task-08-round-2-review.md",".context/runs/build-tami-website-layer-5-task-08.md","src/app/robots.ts","src/components/seo/","src/lib/seo/metadata.test.ts","src/lib/seo/metadata.ts","src/lib/seo/robots.test.ts","src/lib/seo/robots.ts","src/lib/seo/site-url.test.ts","src/lib/seo/site-url.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-5-task-08-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Hết task chạy được của layer 5 (T01, T04 chặn bởi layer-2-task-02) → spec-validator layer 5."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T17:50:00.000Z, ok: true, note: "User: cứ làm lần lượt, chỉ dừng khi cần hỏi"}]
batchQueue: []
```

## History

- 2026-10-17T18:55:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 7f7f721, working tree sạch.
- 2026-10-17T19:10:00.000Z ✅ DONE builder attempt 1 — site-url (đọc runtime, không inline), metadata builder (title/desc/OG fallback, hreflang khi hasEnglish, noindex APP_ENV≠production), JSON-LD Organization/RealEstateListing/Article/JobPosting + JsonLd component, robots.ts force-dynamic, cache-policy RSC rule DOTTED_PATH_SOURCE. test 99 file 1029 PASS, build OK. curl next start :3220: RSC:1 → no-store; staging robots Disallow /, /en noindex; production sau revalidate không noindex; không localhost. Điểm cần soát: HTML prerender đầu tiên sau deploy mang noindex tới lần revalidate 60s. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T19:20:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 noindex ép buộc phải là noindex,follow (DESIGN.md:305); MAJOR-2 robots Disallow /api/ chặn /api/media/file/*; MAJOR-3 HTML prerender lúc build mang noindex + thiếu canonical, CDN giữ tới swr 300s. Primary chọn hướng MAJOR-3: không prerender trang công khai lúc build (ISR theo request đầu ở runtime) — quyết định kỹ thuật, không cần user. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-17T19:35:00.000Z ✅ DONE builder fix attempt 2 — noindex,follow cho ép buộc/seo.noindex (nofollow chỉ non-prod); robots production Allow /api/media/file/; generateStaticParams [] → không prerender trang công khai (ISR theo request); MINOR offer UnitPriceSpecification MONTH, DEFAULT_COUNTRY, siteName 1 lần. Follow-up ghi L8-T05. test 99 file 1029 PASS, build OK. curl :3220 (.next sạch): request đầu staging noindex,nofollow; production không robots meta; cache-control HTML giữ nguyên; RSC no-store. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T19:50:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (1029 test). MINOR test khoá layout → L15-T01. ARCHITECTURE §5 as-built. Close-out → commit.
