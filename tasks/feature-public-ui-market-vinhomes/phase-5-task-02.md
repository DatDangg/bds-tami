# feature-public-ui-market-vinhomes · phase-5-task-02 — UI các khối mới chi tiết dự án

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI + SEO (JSON-LD) → STRICT.

## Việc
- Điểm nổi bật (lưới thẻ), bản đồ + tab tiện ích quanh theo `category` (tablist a11y; marker nếu có toạ độ), khối Pháp lý (richText + danh sách PDF), Bảng giá (bảng cuộn ngang mobile, ngày cập nhật, "Liên hệ" khi trống giá), FAQ (accordion `details/summary` + JSON-LD `FAQPage` đúng locale).
- Menu neo theo thứ tự: Tổng quan · Nổi bật · Vị trí · Tiện ích · Pháp lý · Giá · Tin liên quan · FAQ (mục trống tự ẩn).
- Docs: design-spec S03, DESIGN.md.

## Acceptance
- [ ] Mỗi khối ẩn khi trống; JSON-LD hợp lệ; VI/EN cùng bố cục
