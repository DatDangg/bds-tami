# feature-public-ui-market-vinhomes · phase-2-task-03 — Slider Ưu đãi + Dự án lớn kính mờ có số liệu

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL.

## Việc
- FeaturedOffers → slider thẻ căn bo 20px + "Xem thêm" (scroll-snap, vuốt được, nút trước/sau ≥ md; tái dùng cơ chế của ProjectsSlider, không thêm thư viện).
- FeaturedProjects/ProjectsSlider: thẻ lớn ~464×600 bo 20px, khung kính mờ đè ảnh: tên, địa điểm, badge trạng thái gradient, **số liệu từ field sẵn có** `scale.landAreaM2`, `scale.totalUnits`, `scale.handoverTime` (thiếu thì ẩn ô) — theo chốt câu 3.
- Test render số liệu / ẩn khi thiếu.

## Acceptance
- [ ] Hai slider vuốt được trên mobile, dùng bàn phím được trên desktop; chữ trên kính mờ đạt AA

