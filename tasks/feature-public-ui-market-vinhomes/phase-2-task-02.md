# feature-public-ui-market-vinhomes · phase-2-task-02 — Thanh thông báo + hero + ô tìm kiếm đè đáy hero

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI · ảnh hưởng LCP trang chủ → STRICT.

## Việc
- `AnnouncementBar` phía trên header: đóng được, nhớ theo hash nội dung (localStorage trong try/catch); chiều cao cố định, không CLS (builder chọn cách ẩn khi đã đóng, ghi decision log).
- HeroSlider: typography serif viết thường (theo P1), nút cuộn xuống.
- `HeroSearch`: ô tìm kiếm đè đáy hero (tab Cho thuê / Dự án → form GET tới `/cho-thue` hoặc `/du-an` dùng param từ khoá **hiện có**), chip "Dự án được quan tâm" link tới chi tiết dự án. Mobile: khối nằm dưới hero, chip vuốt ngang.
- Test component + URL param đúng; ảnh hero vẫn `priority`.

## Acceptance
- [ ] Thanh thông báo bật/tắt/chữ/link từ CMS, đóng được, VI/EN
- [ ] Tìm kiếm dùng URL param hiện có; chip từ CMS hoặc fallback nổi bật; không CLS, LCP không xấu đi

