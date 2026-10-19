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
- [x] Hàng theo danh mục + form tư vấn; phân trang / canonical SEO không đổi (STRICT PASS r3)


## Carry-over từ P1-T01 (reviewer r2)
- m-b: chú thích `src/lib/fonts.ts:7` ("tránh bold giả") — PostCard `font-semibold` (600) > 500: đổi thẻ sang `font-medium` + chỉ nạp 400/500 phù hợp, hoặc sửa chú thích.
- m-c: `NewsCard.tsx:57`, `PostCard.tsx:59` `lg:text-h2` (nay 44px) → cân nhắc `lg:text-h2-sm`.

## Carry-over từ P3-T02 (reviewer r1)
- MINOR-1: `CategoryListTemplate.tsx` render `searchBar` (`-mt-12`) cả khi `compactBanner` false → chỉ render khi cả hai / union type.
- MINOR-2: banner compact giữ đệm đáy 3rem khi không có `searchBar` (`/tin-bds`, `/tuyen-dung`) → biến thể không đệm đáy.
- MINOR-3: test assert chuỗi class Tailwind (`ProjectListPage.test.tsx`, `CategoryListTemplate.test.tsx`) → `data-*`/role.

## Kết quả (2026-10-20)
- Reviewer STRICT r1 FAIL (bài 5–16 mất khỏi phân trang) → r2 FAIL (n1–n4 có thể mất) → r3 PASS (hẹp, tiền lệ 2cfe320).
- Quyết định agent (user ủy quyền 2026-10-20): tab danh mục = pill link (`aria-current`), không phải ARIA tabs; trang 1 = "Tin nổi bật" (1 lớn + 4, `isFeatured` trước rồi mới nhất) → mỗi danh mục cấp 1 một hàng ≤ 4 bài (gồm bài danh mục con, tối đa 6 hàng, không loại trùng giữa hàng) → "Tin khác" (`buildMoreNews`: 4 bài mới nhất chưa hiện + lưới trang 1 cũ, trừ bài ở "Tin nổi bật") → phân trang → form "Tư vấn nhu cầu"; trang ≥ 2 giữ lưới phân trang cũ; form LeadForm `source=contact` ở mọi trang `/tin-tuc` (kể cả `?page=N`), không ở trang danh mục; trang danh mục banner compact + lưới 4 cột; `PageBanner overlap` (đệm đáy chỉ khi có băng tìm kiếm).
