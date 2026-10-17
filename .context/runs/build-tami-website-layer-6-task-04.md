# Run Journal — build/tami-website · layer-6-task-04

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-04
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T08:10:00.000Z
filesTouched: ["context/progress.json","docs/ARCHITECTURE.md","seed/sample/projects.ts","src/components/templates/CategoryListTemplate.test.tsx","src/components/templates/CategoryListTemplate.tsx","src/i18n/messages/en.json","src/i18n/messages/vi.json","src/lib/content/public-queries.ts","src/lib/format.test.ts","src/lib/format.ts","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-6-task-04.md","tests/fixtures/projects/payload-config.ts","tests/integration/projects.test.ts"]
filesNew: [".context/review-reports/build-tami-website-layer-6-task-04-round-1-review.md",".context/review-reports/build-tami-website-layer-6-task-04-round-2-review.md",".context/runs/build-tami-website-layer-6-task-04.md","scripts/generate-sample-images.mjs","seed/sample/images/README.md","seed/sample/images/biet-thu-ven-bien.webp","seed/sample/images/can-ho-song-sai-gon.webp","seed/sample/images/can-ho-trung-tam.webp","seed/sample/images/khu-do-thi-sinh-thai.webp","seed/sample/images/khu-do-thi-tay-ho.webp","seed/sample/images/nha-pho-thuong-mai.webp","src/app/(frontend)/[locale]/du-an/page.tsx","src/components/projects/ProjectCard.tsx","src/components/projects/ProjectFilters.tsx","src/components/projects/ProjectListPage.test.tsx","src/components/projects/ProjectListPage.tsx","src/components/projects/project-components.test.tsx","src/lib/projects/project-filters.test.ts","src/lib/projects/project-filters.ts","src/lib/projects/project-queries.ts","src/lib/projects/project-view.test.ts","src/lib/projects/project-view.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-04-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-6-task-05 (chi tiết dự án)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: ... rồi layer 6"}, {gate: sample_images, at: 2026-10-18T00:45:00.000Z, ok: true, note: "User cho commit ảnh mẫu tự do < 2MB"}]
batchQueue: []
```

## History

- 2026-10-18T06:55:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD dfd1945, working tree sạch.
- 2026-10-18T07:20:00.000Z ✅ DONE builder attempt 1 — /du-an + /du-an/danh-muc/[category] (force-dynamic, bộ lọc GET form trên URL, noindex,follow khi lọc), ProjectCard/Filters, CategoryListTemplate thêm 3 prop tuỳ chọn, 6 ảnh WebP tự tạo CC0 94 KB + seed 6 dự án published (idempotent). test 132 file 1.433 PASS, build OK. Trình duyệt :3226 375/768/1280 OK; curl cache public + 404 có nội dung. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-18T07:35:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 route /du-an/danh-muc/[category] không có trong BRD/design-spec. User chọn bỏ route, chip = ?category= (S02). ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T07:55:00.000Z ✅ DONE builder fix attempt 2 — gỡ route danh mục dự án (page, routing, missing-page rule, nhánh revalidate), chip = /du-an?category= (giữ province/status, bỏ page, aria-current), category lạ bị bỏ qua; altEn seed; scrollChips ở 375; select field card; ARCH §5.1. test 132 file 1.429 PASS, build OK; trình duyệt :3226 OK. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T08:10:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. Primary sửa chuỗi URL cũ trong project-components.test.tsx (test-only, 8/8 PASS) + task file Decision impact YES. MINOR → L15-T01. Close-out → commit.
