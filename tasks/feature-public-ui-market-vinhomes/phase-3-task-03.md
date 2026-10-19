# feature-public-ui-market-vinhomes · phase-3-task-03 — Trang Tin tức theo danh mục + form tư vấn

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL (form dùng LeadForm sẵn có, `source=contact`, không đổi enum).

## Việc
- `/tin-tuc` trang 1: tab danh mục (link `/tin-tuc/danh-muc/<slug>`), "Tin nổi bật" (1 bài lớn + list 4 bài; `isFeatured` trước rồi mới nhất), mỗi danh mục 1 hàng ≤ 4 bài + "Xem thêm"; trang 2+ (`?page=`) giữ lưới phân trang hiện có.
- Form "Tư vấn nhu cầu" cuối trang (LeadForm, Turnstile + consent như trang Liên hệ).
- Trang danh mục tin tức: banner + lưới 4 cột.

## Acceptance
- [ ] Hàng theo danh mục + form tư vấn; phân trang / canonical SEO không đổi


## Carry-over từ P1-T01 (reviewer r2)
- m-b: chú thích `src/lib/fonts.ts:7` ("tránh bold giả") — PostCard `font-semibold` (600) > 500: đổi thẻ sang `font-medium` + chỉ nạp 400/500 phù hợp, hoặc sửa chú thích.
- m-c: `NewsCard.tsx:57`, `PostCard.tsx:59` `lg:text-h2` (nay 44px) → cân nhắc `lg:text-h2-sm`.
