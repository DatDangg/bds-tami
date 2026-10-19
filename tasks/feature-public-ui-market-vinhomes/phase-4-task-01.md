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
- [x] Thẻ tư vấn dính ≥ lg, không che nội dung; lead vẫn gửi `source=project` (NORMAL PASS r2)


## Carry-over từ P1-T02 (reviewer r1)
- m-4: khe trong suốt (8px / lg 16px) giữa header nổi và ProjectSubNav dính (`top: var(--header-offset)`) — khi restyle menu neo dạng viên thuốc, quyết định giữ khe (kiểu thanh nổi) hay đặt `top: calc(var(--header-offset) - <lề dưới>)` + chỉnh scroll-margin/OBSERVER_MARGIN.

## Kết quả (2026-10-20)
- Reviewer NORMAL r1 FAIL (M-1 pill che thẻ tư vấn khi nhảy `#lead-form` ở mobile) → r2 PASS. Kiểm trình duyệt dev :3001: 1280 thẻ sticky top 176px / cao 705px, 375 thẻ top 152px > đáy pill 134px.
- Quyết định agent (user ủy quyền 2026-10-20): thanh mục con dạng viên thuốc trắng giữ khe dưới header nổi (m-4: kiểu thanh nổi thứ hai, scroll-margin/observer +4.5rem / 176px); ≥ lg lưới `1fr` + 22rem (xl 24rem), thẻ "Tư vấn 1:1" sticky cột phải (hotline + LeadForm duy nhất, cao tối đa = viewport còn lại, cuộn trong); < lg thẻ nằm sau Tài liệu, giữ ProjectStickyCta; bỏ nền section xen kẽ full-bleed (không hợp lưới 2 cột) — phân tách bằng đường kẻ, Thư viện thành thẻ tối bo 20px; tiêu đề thẻ giữ "Nhận thông tin dự án" (spec/test/SEO); Tiện ích 3 cột ở lg, Vị trí và Pháp lý/Chính sách chia cột từ xl.
