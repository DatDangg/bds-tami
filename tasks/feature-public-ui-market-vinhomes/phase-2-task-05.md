# feature-public-ui-market-vinhomes · phase-2-task-05 — Restyle Giới thiệu, Dịch vụ, CTA, Đối tác

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL.

## Việc
- AboutBlock, ServicesBento (3 thẻ dịch vụ trên ảnh, bo 20px), Partners: restyle theo token P1.
- CtaBanner: ảnh nền tràn viền (field mới P2-T01; scrim đạt AA như `--color-banner-scrim`), 2 nút viên thuốc (primary + secondary); không có ảnh → nền tối như cũ.
- Docs: design-spec S01 (bảng khối #1–#11), DESIGN.md.

## Acceptance
- [ ] Trang chủ đủ section #1–#11 theo change doc; AA; responsive 375/768/1280/1440

