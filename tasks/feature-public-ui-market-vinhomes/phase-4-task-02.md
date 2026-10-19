# feature-public-ui-market-vinhomes · phase-4-task-02 — Chi tiết dự án: tin liên quan + CTA tham quan + restyle khối

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI · NORMAL (truy vấn mới qua `rentals.project`, `property-posts.relatedProject` — đã có index).

## Việc
- Khối "Tin liên quan": tin cho thuê + tin BĐS thuộc dự án (≤ 4 mỗi loại, đã xuất bản, đúng locale), ẩn khi trống; thêm vào menu neo.
- CTA "Đăng ký tham quan" cuối trang (cuộn tới thẻ tư vấn/form).
- Restyle Tổng quan / Vị trí / Tiện ích / Mặt bằng / Thư viện / Pháp lý / Tài liệu theo token P1.
- Chi tiết dự án revalidate khi tin liên quan đổi (kiểm hook hiện có).

## Acceptance
- [x] Tin liên quan đúng dự án + locale; không N+1; LCP vẫn là ảnh hero (STRICT PASS r1)


## Kết quả (2026-10-20)
- Reviewer STRICT r1 PASS (nâng từ NORMAL vì hook trên collection Rentals/PropertyPosts).
- Quyết định agent (user ủy quyền 2026-10-20): "Tin liên quan" trong cột chính sau Tài liệu, mục cuối thanh mục con; 2 nhóm Cho thuê (≤ 4, chỉ `published`) / Tin BĐS (≤ 4, ưu đãi chưa kết thúc), ẩn nhóm/khối khi trống; **không "Xem thêm"** (không có URL param lọc theo dự án — không thêm param); CTA "Đăng ký tham quan" dùng lại `CtaBanner` tối ở cuối trang (→ `#lead-form`, nút phụ `tel:` hotline khi có), chữ i18n, không field CMS mới; hook làm mới chi tiết dự án cũ + mới (vi/en) khi tin công khai đổi, không đụng danh sách/trang chủ; nhãn nhóm là `<p>` (không heading) để h3 thẻ ngay dưới h2.
- Kiểm dev :3001: dự án không có tin liên quan → khối + mục menu ẩn đúng; DB worktree không có tin gắn dự án nên chưa thấy khối có dữ liệu (residual).
