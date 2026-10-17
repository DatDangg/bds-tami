# Run Journal — build/tami-website · layer-6-task-05

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-05
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T09:30:00.000Z
filesTouched: ["context/progress.json","docs/API_SPEC.md","docs/ARCHITECTURE.md","src/collections/News.ts","src/collections/Projects.ts","src/collections/Rentals.ts","src/components/forms/LeadFormSlot.tsx","src/components/layout/FloatingContact.test.tsx","src/components/layout/FloatingContact.tsx","src/components/projects/ProjectCard.tsx","src/hooks/rentals/field-validators.ts","src/i18n/messages/en.json","src/i18n/messages/vi.json","src/lib/click-stats/click-types.ts","src/lib/content/resolve-missing-page.test.ts","src/lib/content/resolve-missing-page.ts","src/lib/format.test.ts","src/lib/format.ts","src/lib/news/news-queries.ts","src/lib/projects/project-queries.ts","tasks/tami-website/layer-14-task-02.md","tasks/tami-website/layer-6-task-05.md","tests/integration/content-redirects.test.ts","tests/integration/news.test.ts","tests/integration/projects.test.ts"]
filesNew: [".context/review-reports/build-tami-website-layer-6-task-05-round-1-review.md",".context/review-reports/build-tami-website-layer-6-task-05-round-2-review.md",".context/runs/build-tami-website-layer-6-task-05.md","src/app/(frontend)/[locale]/du-an/[slug]/page.test.tsx","src/app/(frontend)/[locale]/du-an/[slug]/page.tsx","src/components/layout/ClickRefMarker.tsx","src/components/projects/Documents.tsx","src/components/projects/FloorPlans.tsx","src/components/projects/LegalPolicy.tsx","src/components/projects/ProjectAmenities.tsx","src/components/projects/ProjectDetail.tsx","src/components/projects/ProjectHero.tsx","src/components/projects/ProjectLocation.tsx","src/components/projects/ProjectOverview.tsx","src/components/projects/ProjectSection.tsx","src/components/projects/ProjectSpecs.tsx","src/components/projects/ProjectStickyCta.tsx","src/components/projects/ProjectSubNav.tsx","src/components/projects/project-detail.test.tsx","src/fields/ward-in-province.ts","src/lib/projects/project-detail-view.test.ts","src/lib/projects/project-detail-view.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-05-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-6-task-08 (tuyển dụng)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: ... rồi layer 6"}]
batchQueue: []
```

## History

- 2026-10-18T08:15:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 4f14678, working tree sạch.
- 2026-10-18T08:45:00.000Z ✅ DONE builder attempt 1 — /du-an/[slug] ISR (hero, sub-nav IntersectionObserver, tổng quan, vị trí LazyMap, tiện ích, mặt bằng tabs+lightbox, pháp lý/chính sách, tài liệu PDF, dự án khác, LeadFormSlot, sticky CTA mobile), ClickRefMarker refCollection/refId, beacon text/plain, validator upload mặc định gallery/cover, ward∈province, placeholder khi mất ảnh, proxy 404. test 135 file 1.474 PASS, build OK. Trình duyệt :3227 OK, curl 404/301/ISR. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-18T09:00:00.000Z ✅ DONE reviewer round 1 STRICT — PASS. MINOR-1 panel Chính sách ẩn trên desktop tới khi hydrate (hidden + Tailwind v4 !important), MINOR-2 sticky CTA hiện trên desktop trước hydrate + thiếu safe-area, MINOR-3 chuyển ward validator ra file chung, MINOR-4 #sales-policy không mở accordion. Primary cho sửa ngay vì lỗi hiển thị thật. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T09:15:00.000Z ✅ DONE builder fix attempt 2 — LegalPolicy bỏ hidden → max-lg:hidden (state nâng lên, hash mở panel), SubNav phát hashchange, StickyCta lg:hidden + safe-area, ward validator → src/fields/ward-in-province.ts. test 135 file 1.477 PASS, build OK; trình duyệt + no-JS iframe :3227 OK. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T09:30:00.000Z ✅ DONE reviewer round 2 — PASS. Primary sửa 2 MINOR nhỏ (try/catch hash, regex test) + chạy lại test file/lint/typecheck PASS. ARCH §5.1 + API_SPEC §3.4. Close-out → commit.
