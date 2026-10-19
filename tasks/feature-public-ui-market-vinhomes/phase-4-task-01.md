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


## Carry-over từ P1-T02 (reviewer r1)
- m-4: khe trong suốt (8px / lg 16px) giữa header nổi và ProjectSubNav dính (`top: var(--header-offset)`) — khi restyle menu neo dạng viên thuốc, quyết định giữ khe (kiểu thanh nổi) hay đặt `top: calc(var(--header-offset) - <lề dưới>)` + chỉnh scroll-margin/OBSERVER_MARGIN.
