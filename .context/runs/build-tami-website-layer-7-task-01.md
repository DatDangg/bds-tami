# Run Journal — build/tami-website · layer-7-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-7-task-01
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T08:55:00Z
filesTouched: ["src/collections/News.ts","src/collections/Services.ts","src/collections/Provinces.ts","src/hooks/wards/guard-delete.ts","src/fields/ward-in-province.ts","src/lib/content/public-queries.ts","src/lib/content/public-queries.test.ts","src/payload.config.ts","src/jobs/index.ts","src/jobs/close-job-postings.ts","src/lib/env.ts","seed/index.ts","src/payload-types.ts","migrations/index.ts","docker/docker-compose.prod.yml","docker/docker-compose.staging.yml",".env.example","docker/nginx/tami.conf","docker/nginx/tami-staging.conf","docker/nginx/tami-staging-sslip.conf","docs/ERD.md","docs/ARCHITECTURE.md","docs/API_SPEC.md","tasks/tami-website/layer-7-task-01.md","tests/integration/services-pages.test.ts"]
filesNew: [".context/runs/build-tami-website-layer-7-task-01.md","src/collections/PropertyPosts.ts","src/lib/content/offer-status.ts","src/lib/content/offer-status.test.ts","src/jobs/expire-offers.ts","src/jobs/expire-offers.test.ts","src/fields/cover-image.ts","src/lib/revalidate/","src/app/(payload)/api/internal/revalidate/route.ts","seed/sample/property-posts.ts","migrations/20261018_075627_property_posts.ts","migrations/20261018_075627_property_posts.json","tests/integration/property-posts.test.ts","tests/fixtures/property-posts/", "tests/integration/property-posts-migration.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-7-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "L7-T01 done → L7-T02 (SearchService + GET /api/public/rentals)."
loopSignal: none
approvals: []
batchQueue: []
```

## History

- 2026-10-18T08:00:00Z ▶ START builder L7-T01 (cancel sẽ redo bước này). HEAD 0368b5d, git status sạch (trừ .claude/launch.json ngoài manifest, không đụng).
- 2026-10-18T08:20:00Z ✅ DONE builder L7-T01 attempt 1 — property-posts + offer-status (isOfferEnded nguồn duy nhất) + expire-offers 00:05 VN + route nội bộ /api/internal/revalidate (Bearer HMAC từ PAYLOAD_SECRET, nginx 404 /api/internal/, INTERNAL_APP_URL) áp cả close-job-postings; cover-image helper chung (services.coverImage giờ chỉ nhận ảnh); G12, G22; migration 20261018_075627_property_posts additive + 2 index SQL. lint/typecheck/test 146 file 1.579/build PASS. Builder tự ghi file .builder.md trong runs/ → primary xoá (subagent không ghi journal). ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T08:30:00Z ✅ DONE reviewer STRICT round 1 — FAIL: MAJOR-1 migration down :223 DROP CONSTRAINT sau DROP TABLE CASCADE thiếu IF EXISTS. MINOR-1 down đổi enum jobs lỗi nếu còn row expire-offers; MINOR-2 expire-offers im lặng ở trần 500; MINOR-3 lỡ ngày (chấp nhận). Bảo mật route nội bộ/nginx/compose/cron/RBAC OK. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T08:40:00Z ✅ DONE builder fix attempt 2 — down: DROP CONSTRAINT IF EXISTS + DELETE row expire-offers trước khi dựng enum; warn khi chạm trần 500 (+2 test); test migration up→down→up trên DB tạm (bỏ từng sửa thì fail đúng). lint/typecheck/test 1.582/build PASS; migrate:down + migrate trên dev OK. ▶ START reviewer STRICT round 2 (cancel sẽ redo bước này).
- 2026-10-18T08:55:00Z ✅ DONE reviewer STRICT round 2 — PASS (MINOR test log row → follow-up task; rollback note ghi task). Close-out: task file, L12 smoke revalidate nội bộ, L15 kiểm down migration enum jobs khác, progress. Commit.
