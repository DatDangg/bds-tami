# feature-news-toc-compact · phase-1-task-01 — Mục lục cột trái chi tiết Tin tức gọn hơn: cột rộng hơn, mục thấp hơn, mục lục chiếm hết phần cao còn lại của cột dính

- Nguồn: BL-067 · change doc `spec/changes/2026-10-23-news-toc-compact.md` (Yêu cầu + Acceptance + Ghi chú hướng gợi ý). Change doc chưa commit — nằm ở checkout chính.
- Áp `/tin-tuc/[slug]` + `/en/news/[slug]`, chỉ ≥ lg (bản cột trái). Bản gập < lg (`NewsTocDisclosure`) KHÔNG đổi.
- **AUTO PROCEED** (primary: "tự chọn hướng hợp lý, không hỏi user lại"). Builder không hỏi; chỗ mơ hồ chọn phương án đơn giản nhất, ghi vào Verification summary.
- **Chạy song song với BL-066** ở checkout chính (popup tư vấn: leads, migration enum, PublicShell). Chỉ đụng file trong § Blast radius. KHÔNG đụng leads / `PublicShell` / `migrations/` / `spec/` / `SPECIFICATIONS.md` / `.context/progress.json` / `spec/changes/**`.

## Classification / Risk
- Type: **MODIFY** (UI only — CSS/layout mục lục BL-062). Không schema / API / auth / migration.
- Risk: **LOW** — chỉ trang chi tiết tin tức; `DETAIL_ASIDE_STICKY_CLASS` / `DetailAsideFit` dùng chung KHÔNG sửa (chỉ dùng như cũ).
- Expected review level: **NORMAL** (component client có hành vi cuộn; reviewer tự chọn).
- Blast radius: `src/components/news/NewsToc.tsx` (nhánh `numbered` của `TocLinks` + `NewsTocSidebar`), `src/components/news/NewsArticleSidebar.tsx` (khối dính), `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:148` (cột lưới), test `src/components/news/NewsToc.test.tsx` (+ test trang / sidebar nếu có assert lớp cột), doc as-built `.context/design-spec.md` S11 + `docs/DESIGN.md` (dòng Chi tiết tin tức).

## Hiện trạng (file:line — không spawn Explore)
- `page.tsx:148` lưới thân bài `lg:grid-cols-[15rem_minmax(0,1fr)]` gap-x-12 → cột trái 240px.
- `NewsToc.tsx:14` `LINK_BASE` = `min-h-11 py-2 pr-2 text-small` (44px/mục); nhánh `numbered` (`TocLinks` ~:51): cấp 2 `gap-3 pl-[calc(1.25rem-2px)]` + số tròn `size-7` (28px), cấp 3 `gap-3 pl-16`. `NewsTocSidebar` `nav` `max-h-[max(12rem,calc(100dvh-var(--sticky-top)-24rem))]` cuộn riêng `py-5 pr-4`, nhãn `px-5`; effect tự cuộn mục active vào giữa khung (giữ).
- Chữ còn lại mỗi mục ≈ 240 − 2 − 18 − 28 − 12 − 8 − 16 ≈ 156px → tiêu đề tiếng Việt 50–70 ký tự wrap 3–4 dòng; `max-h` trừ cứng 24rem cho thẻ tư vấn → khung mục lục thấp, phải cuộn.
- `NewsArticleSidebar.tsx`: `DetailAsideFit as="div"` (`--detail-aside-top = --sticky-top + 1.5rem`) → con đầu `flex flex-col gap-6` + `DETAIL_ASIDE_STICKY_CLASS` chứa `NewsTocSidebar` + `section#article-consult`.

## Quyết định (lựa chọn của change-request, ghi theo mục Ghi chú change doc)
1. **Nới cột trái:** `lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]` (gap-x-12 giữ). 1024: thân bài còn ≈ 976 − 256 − 48 = 672px (≈ hiện tại 688px — không hẹp đáng kể); ≥ 1280: 288px cột trái, thân bài vẫn ≥ 68ch max của `news-prose`. Không lên 20rem để không bóp thân bài ở 1280.
2. **Mục thấp hơn (chỉ nhánh `numbered`, bản cột trái):** `min-h-8` (32px ≥ 24px WCAG 2.5.8 AA) + `py-1.5` + `leading-snug`; số tròn `size-6` (24px) `text-[0.6875rem]`/token xsmall gần nhất (không mã màu rời); `gap-2.5`; padding trái cấp 2 `pl-[calc(1rem-2px)]` (nhãn "MỤC LỤC" `px-4` thẳng hàng); cấp 3 thụt thẳng mép chữ cấp 2 = `pl-[calc(1rem-2px+1.5rem+0.625rem)]` (không số) thay `pl-16`; khoảng cách dọc giữa mục `gap-0.5`/không thêm. `nav` `py-4 pr-3`. Bản gập `NewsTocDisclosure` (không `numbered`) GIỮ `min-h-11` (màn chạm < lg) — tách `LINK_BASE` thành phần chung + kích thước theo nhánh.
3. **Mục lục chiếm hết phần cao còn lại thay vì trừ cứng 24rem:** khối dính (con đầu của `DetailAsideFit` trong `NewsArticleSidebar`) ≥ lg thành cột flex có `lg:max-h-[max(26rem,calc(100dvh-var(--detail-aside-top)-1rem))]`; `nav` mục lục `lg:min-h-0 lg:shrink` + `overflow-y-auto` (bỏ `max-h` cứng của `nav`), thẻ tư vấn `shrink-0`. → Viewport đủ cao: mục lục hiện trọn, không cuộn; viewport thấp / bài rất dài: chỉ khung mục lục cuộn, thẻ tư vấn + nút "Nhận tư vấn" luôn thấy; viewport rất thấp (< 26rem khả dụng): khối cao 26rem, `DETAIL_ASIDE_STICKY_CLASS` (đo `--detail-aside-h`) dính theo đáy như cũ. Không đổi `DetailAsideFit` / `DETAIL_ASIDE_STICKY_CLASS`.
4. **Bài rất dài:** giữ cuộn trong khung + tự cuộn mục active vào giữa (effect sẵn có). KHÔNG ẩn/thu gọn cấp 3 (YAGNI; mục thấp + khung cao hơn đủ cho acceptance) — nếu đo thấy bài thực tế vẫn cuộn ở 1440×900 với ≤ 10 heading thì ghi số đo vào Verification summary trước khi thêm gì.
5. Giữ: link `#id`, `aria-current="location"` + vạch vàng + số nền vàng cho mục active, số 01/02 `aria-hidden` cấp 2, cuộn mượt / reduced-motion, focus ring, ẩn khi in, `NewsTocDisclosure` < lg, thứ tự DOM.

## Scope
1. Sửa theo § Quyết định 1–5. Không đổi i18n, không đổi logic active/scroll lock.
2. Test (TDD — sửa/viết trước, fail rồi pass) trong `src/components/news/NewsToc.test.tsx` (+ test trang/sidebar nếu đang assert lớp lưới `15rem` — Grep `15rem` trong `src`/`tests`):
   - Link bản cột trái có `min-h-8` (không `min-h-11`); số tròn `size-6`; cấp 3 không còn `pl-16`.
   - Link bản gập vẫn `min-h-11`.
   - `nav` cột trái không còn `max-h-[max(12rem` cứng; có `overflow-y-auto` + `lg:min-h-0`.
   - Sidebar: khối dính có lớp `lg:max-h-[max(26rem,…)]` + flex col; thẻ tư vấn `shrink-0` (nếu có test sidebar; không có thì thêm 1 test nhỏ render `NewsArticleSidebar` — cần mock `next-intl` như test news khác).
3. Kiểm thị giác (tuỳ chọn, nếu dựng được dev server — **port khác 3000**, vd `pnpm dev --port 3107`; worktree không có `.env.local` → nếu không chạy được thì ghi residual, KHÔNG copy/sửa `.env.local` của checkout chính và KHÔNG chạy test ghi DB): 1440×900, 1280×800, 1024×768; đo chiều cao `nav` vs `scrollHeight`, số dòng mỗi mục.
4. Doc impact (as-built): `.context/design-spec.md` S11 thêm dòng "As-built BL-067" (cột 16/18rem, mục 32px, số 24px, mục lục chiếm phần cao còn lại); `docs/DESIGN.md` dòng Chi tiết tin tức thêm *As-built BL-067* ngắn. Không đổi API/ERD (`no API/schema impact`). KHÔNG sửa `SPECIFICATIONS.md` / `spec/**`.
5. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file scope>` · `npx vitest run src/components/news` (+ file test trang tin nếu đụng). Không chạy integration test (DB dùng chung).
6. **KHÔNG commit / stage.**

## Retry / Escalation
- Max 3 attempt; fail lần 3 → `architecture_review_needed`, dừng.

## Status
- status: done (review NORMAL PASS r1, report `.context/review-reports/feature-news-toc-compact-phase-1-task-01-round-1-review.md`; visual 1440/1280 chưa kiểm — dev server bị chặn trong worktree, primary kiểm sau merge) · attempt: 1

## Verification summary
- Làm đúng § Quyết định 1–5, không hỏi. Quyết định nhỏ của builder: `LINK_BASE` tách thành phần chung + `LINK_SIZE_COMPACT` (`min-h-8 py-1.5 leading-snug`, nhánh numbered) / `LINK_SIZE_TOUCH` (`min-h-11 py-2`, bản gập); số tròn dùng `text-[0.6875rem]` (không có token xsmall nhỏ hơn thích hợp); không thêm ẩn/thu gọn cấp 3 (YAGNI).
- Files: `NewsToc.tsx`, `NewsArticleSidebar.tsx`, `tin-tuc/[slug]/page.tsx` (lưới 16rem/xl 18rem + comment), `NewsToc.test.tsx` (sửa + thêm), `NewsArticleSidebar.test.tsx` (mới), `.context/design-spec.md` S11, `docs/DESIGN.md`. `DetailAsideFit`/`DETAIL_ASIDE_STICKY_CLASS` không sửa. No API/schema impact.
- Verify: `npx vitest run src/components/news` 8 files / 98 tests PASS; `pnpm typecheck` PASS; `npx eslint` (5 file code/test) sạch.
- Fix sau review sơ bộ: sửa typo `px-4text-eyebrow` → `px-4 text-eyebrow` ở nhãn "Mục lục" (`NewsToc.tsx`), thêm assert nhãn có lớp `px-4` + `text-eyebrow` (`NewsToc.test.tsx`). Chạy lại vitest news / eslint NewsToc / typecheck: 8 files / 98 tests PASS, eslint sạch, typecheck PASS.
- Test-first: các assert mới được viết trước code; chưa chạy riêng bước fail (gộp một lượt chạy sau khi code) — residual nhỏ.
- Residual risk: chưa kiểm thị giác (không có `.env.local` trong worktree → không dựng dev server theo yêu cầu); chưa đo `nav` vs `scrollHeight` / số dòng mỗi mục ở 1440×900, 1280×800, 1024×768 → reviewer/primary nên xem nhanh ở checkout chính. Cần xác nhận `lg:max-h` + `lg:sticky top` hoạt động đúng khi `--detail-aside-h` đo theo khối đã bị giới hạn cao.
