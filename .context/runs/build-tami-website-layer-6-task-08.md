# Run Journal — build/tami-website · layer-6-task-08

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-08
step: closeout
agent: primary
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-18T10:20:00.000Z
filesTouched: ["context/progress.json","docs/API_SPEC.md","docs/ARCHITECTURE.md","docs/ERD.md","migrations/index.ts","seed/sample/job-postings.ts","src/collections/JobPostings.ts","src/components/forms/LeadFormSlot.tsx","src/components/layout/Breadcrumb.tsx","src/components/projects/ProjectStickyCta.tsx","src/endpoints/public/job-applications.test.ts","src/endpoints/public/job-applications.ts","src/fields/scoped-category.ts","src/i18n/messages/en.json","src/i18n/messages/vi.json","src/jobs/index.ts","src/lib/content/resolve-missing-page.test.ts","src/lib/content/resolve-missing-page.ts","src/lib/news/news-queries.ts","src/lib/projects/project-filters.ts","src/lib/seo/json-ld.test.ts","src/lib/seo/json-ld.ts","src/payload-types.ts","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-6-task-08.md","tasks/tami-website/layer-7-task-01.md","tests/integration/job-postings.test.ts"]
filesNew: [".context/review-reports/build-tami-website-layer-6-task-08-round-1-review.md",".context/runs/build-tami-website-layer-6-task-08.md","migrations/20261017_175237_close_job_postings_task.json","migrations/20261017_175237_close_job_postings_task.ts","src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.test.tsx","src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx","src/app/(frontend)/[locale]/tuyen-dung/page.tsx","src/components/careers/ApplyFormSlot.tsx","src/components/careers/JobCard.tsx","src/components/careers/JobDetail.tsx","src/components/careers/JobFilters.tsx","src/components/careers/JobListPage.test.tsx","src/components/careers/JobListPage.tsx","src/jobs/close-job-postings.test.ts","src/jobs/close-job-postings.ts","src/lib/careers/deadline.test.ts","src/lib/careers/deadline.ts","src/lib/careers/job-filters.test.ts","src/lib/careers/job-filters.ts","src/lib/careers/job-json-ld.ts","src/lib/careers/job-queries.ts","src/lib/careers/job-view.test.ts","src/lib/careers/job-view.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-08-round-1-review.md
  round: 1
  verdict: PASS
next: "Task done + committed. Còn L6-T01 (deploy staging) — cần user cung cấp hạ tầng."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: ... rồi layer 6"}, {gate: G25, at: 2026-10-18T00:45:00.000Z, ok: true, note: "category tuỳ chọn theo ERD"}]
batchQueue: []
```

## History

- 2026-10-18T09:35:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD e810c62, working tree sạch.
- 2026-10-18T10:05:00.000Z ✅ DONE builder attempt 1 — /tuyen-dung (lọc deadline ≥ hôm nay VN), /tuyen-dung/[slug] (hết hạn: banner, noindex,follow, không JSON-LD, không form), JobPosting JSON-LD, ApplyFormSlot, helper deadline chung src/lib/careers/deadline.ts, G25 category tuỳ chọn, job close-job-postings + migration 20261017_175237 (ADD VALUE enum), seed 4 tin published (1 hết hạn). test 141 file 1.530 PASS, build OK. curl :3228 OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-18T10:20:00.000Z ✅ DONE reviewer round 1 STRICT — PASS. Task file ghi migration (M2). Follow-up → L7-T01 (revalidate liên tiến trình), L15-T01. Close-out → commit.
