# feature-public-ui-market-vinhomes · phase-1-task-02 — Header nổi bo tròn kính mờ

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · layout dùng chung mọi trang → STRICT.

## Việc
- `HeaderFrame`/`Header`: thanh nổi cách mép ~16px (mobile 8px), bo `--radius-pill`, cao 64px (≥ xl 72px), nền `--color-glass` + `backdrop-filter: blur(24px)` (fallback nền đặc khi trình duyệt không hỗ trợ), sticky.
- Trên hero: giữ quy tắc trong suốt → kính mờ khi cuộn (design-spec S01.1) nhưng ở dạng thanh nổi; logo vàng trên nền sáng (BL-018) giữ nguyên.
- ≥ xl: logo trái · menu ngang giữa (DesktopNav đã hỗ trợ `children` dropdown) · tìm kiếm + VI|EN + CTA phải, **không** nút Menu (BL-019). < xl: logo · nút Menu (MobileMenu giữ nguyên).
- Bù khoảng trên cho trang không có hero + `scroll-margin` cho neo để nội dung không bị che; skip link vẫn hoạt động.
- Test: Header/HeaderFrame/DesktopNav cập nhật; focus ring nhìn thấy trên kính mờ.
- Docs: design-spec §2.1, DESIGN.md Header.

## Acceptance
- [ ] Thanh nổi bo tròn kính mờ, sticky, VI/EN cùng bố cục; < xl giữ nút Menu
- [ ] Chữ/icon header ≥ 4.5:1 cả trên hero lẫn nền sáng; không CLS


## Carry-over từ P1-T01 (reviewer r2)
- m-a: `docs/DESIGN.md:193` thêm dòng `--text-h2-sm` (24→30px, heading phụ trong nội dung/trang chi tiết), bỏ "heading phụ trong nội dung" khỏi dòng H3; `skills/react-nodejs/design-tokens.md:182` sửa tiêu đề "Hệ góc vuông kiến trúc" cho khớp thang radius mới.
