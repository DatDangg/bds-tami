# feature-public-ui-market-vinhomes · phase-4-task-01 — Chi tiết dự án: hero, menu neo, thẻ Tư vấn 1:1 dính phải

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL.

## Việc
- ProjectHero restyle (ảnh + h1 serif viết thường, badge gradient).
- ProjectSubNav dạng viên thuốc, dính dưới header nổi.
- ≥ lg: bố cục 2 cột, cột phải thẻ "Tư vấn 1:1" `sticky` (hotline + LeadForm; form chỉ render 1 lần — không nhân đôi id); < lg giữ ProjectStickyCta đáy màn hình.

## Acceptance
- [ ] Thẻ tư vấn dính ≥ lg, không che nội dung; lead vẫn gửi `source=project`

