# feature-news-detail-card-toc · phase-1-task-01 — Chi tiết tin tức: nền màu + thẻ trắng + mục lục dính cột trái (BL-033)

- Change doc: `spec/changes/2026-10-20-news-detail-card-toc.md` (BACKLOG BL-033) — follow-up BL-027 (khung chi tiết chung), BL-032 (tin đăng).
- Phụ thuộc: không. Một task (cùng route + RichText + section-headings, không tách song song).
- Trạng thái: `done` — reviewer PASS (r1 NORMAL, r2 FAST); user "/change xử lý 2 cái, tự quyết đừng hỏi t nhé" (auto proceed, không checkpoint duyệt plan).

## Classification / Risk
- Type: **MODIFY** (UI trang S11 có sẵn + thêm mục lục; không đổi schema/API/quyền/dữ liệu CMS/URL/SEO/JSON-LD). Backlog ghi ADDITIVE → chỉnh MODIFY vì đổi bố cục trang đã có.
- Risk: **MEDIUM** — `RichText` dùng chung (dự án, dịch vụ, tin đăng, tuyển dụng, pháp lý), `section-headings` dùng bởi trang pháp lý (S16), `DetailLayout` dùng chung 3 trang chi tiết; nếu tách hook active-section khỏi `DetailSubNav` thì đụng component dùng chung.
- Expected review level: **NORMAL** (shared component, không auth/schema).
- Blast radius: `/tin-tuc/[slug]` + `/en/news/[slug]`; gián tiếp: mọi nơi dùng `RichText` (phải không đổi output khi không bật chế độ mục lục), trang pháp lý (id `muc-N` giữ nguyên), chi tiết dự án/cho thuê/tin đăng (`DetailLayout`, `DetailSubNav` nếu refactor).
- Doc impact: `SPECIFICATIONS.md` F5 + `.context/design-spec.md` S11 + bảng header §2.1 (đã ghi spec delta). No API/ERD impact.

## Hiện trạng (đã đọc)
- `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`: `<article>` breadcrumb → header `max-w-text` (danh mục, h1 `text-h1`, ngày + phút đọc) → ảnh bìa `max-w-5xl` → `RichText` `max-w-text` → footer tags + `ShareButtons` → Tin liên quan `bg-bg-alt` → `JsonLd` Article. Không dùng `DetailLayout`.
- `src/components/detail/DetailLayout.tsx`: gốc `data-detail-page` + `bg-primary-subtle`; lưới ≥ lg `[1fr][22rem]` thẻ trắng + aside phải; props before/subNav/children/aside/after. Không có slot cột trái.
- `src/components/detail/DetailSubNav.tsx`: IntersectionObserver (rootMargin -88px/-45%), khoá cuộn 1s sau click, replaceState + hashchange, scrollIntoView smooth/auto theo reduced-motion, focus target, auto-scroll ngang mục active.
- `src/lib/content/section-headings.ts` + `RichText anchorSections`: id `muc-N` cho `h2` cấp gốc (trang pháp lý S16, `src/components/legal/TableOfContents.tsx` — `<details>` < xl + aside dính ≥ xl, không highlight).
- `src/lib/slug.ts` `slugify` (bỏ dấu, đ→d) + `suffixedSlug`.

## Thiết kế (change-request tự chốt — auto proceed)
- **D1 — khung:** trang tin tức dùng `DetailLayout` (nền `bg-primary-subtle`, `data-detail-page` → header ẩn khi cuộn, `--sticky-top` 8/16px). Không `subNav`, không `aside` phải. `before` = Breadcrumb `py-2` (items giữ nguyên). `after` = Tin liên quan (section `bg-bg-alt py-section-tight` như hiện tại). `JsonLd` giữ nguyên dữ liệu.
- **D2 — slot cột trái:** thêm prop tuỳ chọn cho `DetailLayout` (vd `leading?: ReactNode` + nhãn) → khi có: lưới ≥ lg `[15rem][minmax(0,1fr)]` (xl `[16rem][minmax(0,1fr)]`), cột trái đứng TRƯỚC thẻ trắng trong DOM; khi không có → DOM/class của 3 trang chi tiết hiện tại **không đổi** (test DetailLayout cũ vẫn PASS). Không dùng cả `leading` và `aside` cùng lúc (không cần hỗ trợ 3 cột). Khi không có heading → không truyền `leading` → lưới mặc định; thẻ trắng không bị lệch (đề xuất: khi không `aside`/`leading` thì thẻ chiếm toàn bộ khung — chấp nhận; builder có thể giới hạn `max-w` thẻ cho bài không mục lục nếu đẹp hơn, ghi lại).
- **D3 — thẻ trắng:** danh mục (link `min-h-11`) · `h1` `font-display text-h2 text-balance` (đồng bộ tin đăng BL-032) · meta ngày + phút đọc · ảnh bìa 16:9 bo 20px `overflow-hidden` `priority` (`sizes` theo cột thẻ) · mục lục gập < lg · RichText (giữ `max-w-[68ch]`) · tags · `ShareButtons`. Thứ tự giữ như cũ.
- **D4 — id heading:** helper thuần mới (vd trong `src/lib/content/section-headings.ts`): `collectTocHeadings(data, reservedIds?)` → `{ id, text, level: 2 | 3 }[]` theo thứ tự các heading cấp gốc có chữ (Lexical `h1`/`h2` → 2, `h3`–`h6` → 3; cùng quy tắc `headingTag` của RichText). id = `slugify(text, ~60)`; rỗng → `muc-<thứ tự>`; trùng (với heading trước hoặc `reservedIds` của trang như `related-news`) → `suffixedSlug` `-2`, `-3`…. `RichText` thêm chế độ (vd prop `headingIds?: string[]` hoặc `anchorHeadings`) gắn đúng id đó lên heading cấp gốc theo thứ tự, `scroll-mt-[calc(var(--sticky-top)+1rem)]`, `tabIndex={-1}` để nhận focus. `anchorSections` (pháp lý, `muc-N`) giữ nguyên hành vi. Không bật → output RichText không đổi.
- **D5 — mục lục (client, component mới `src/components/news/NewsToc.tsx` hoặc tương đương):** `nav aria-label` = `page.news.tocTitle` ("Mục lục" / "Contents", khoá mới vi/en). ≥ lg (`hidden lg:block`): thẻ trắng bo 20px `p-5`, `sticky top-(--sticky-top)`, `max-h-[calc(100dvh-var(--sticky-top)-1rem)] overflow-y-auto overscroll-contain`, tiêu đề "Mục lục", danh sách `ol`, `h3` thụt lề (`pl-4`), link `min-h-11`/vùng chạm đủ, mục active `aria-current="location"` + nền/chữ nhấn (`bg-primary-subtle`/`text-text` font-semibold hoặc vạch trái `border-primary`), mục active tự cuộn vào giữa khung mục lục (chỉ cuộn khung, không cuộn trang; tức thì). < lg (`lg:hidden`): `<details>` đóng mặc định, `summary` "Mục lục" `min-h-11`, cùng danh sách link, đặt trong thẻ sau ảnh bìa, trước nội dung. Ẩn khi in. Link là `#id` thật (không JS vẫn chạy).
- **D6 — active section:** tái dùng logic của `DetailSubNav` nếu hợp lý — đề xuất tách phần click (replaceState + `hashchange`, scrollIntoView theo reduced-motion, focus, khoá cuộn 1s) và/hoặc observer thành hook dùng chung trong `src/components/detail/` **mà không đổi hành vi DetailSubNav** (test cũ PASS). Quy tắc active cho mục lục: heading CUỐI CÙNG có `top` ≤ vạch (`--sticky-top` + ~1rem + khe, xấp xỉ 32px) là mục active; phía trên heading đầu → không mục nào active; cuộn quá heading cuối vẫn giữ mục cuối (nội dung mục cuối kéo dài tới hết bài). Nếu tách hook làm phức tạp/rủi ro → viết scroll-spy nhỏ riêng (rAF-throttled scroll listener hoặc IntersectionObserver), ghi lý do vào task.
- **D7 — không heading:** `collectTocHeadings` rỗng → không render cả hai bản mục lục, không truyền `leading`.
- **D8:** không đổi `generateMetadata`, `loadArticle`, JSON-LD, URL, dữ liệu CMS; `/en/news/[slug]` dùng cùng code.

### Quyết định thực tế (builder)
- D1–D8 giữ nguyên. Cụ thể: `DetailLayout` thêm prop `leading` (bọc `hidden lg:block print:hidden`, DOM thẻ trắng đứng sau); không `leading` → class lưới giống hệt cũ (có test so chuỗi).
- D4: `collectTocHeadings(data, reservedIds)` + `isTocHeading` trong `section-headings.ts` (slug tối đa 60, `appendUniqueSuffix`, rỗng → `muc-<thứ tự>`); `RichText` prop `headingIds` (heading cấp gốc có chữ, theo thứ tự; `tabIndex=-1`, `scroll-mt-[calc(var(--sticky-top)+1rem)]`). `anchorSections` không đổi. Trang truyền `reservedIds = ["related-news"]`.
- D5/D6: `src/components/news/NewsToc.tsx` xuất 2 component: `NewsTocSidebar` (≥ lg, scroll-spy rAF đo mép trên heading, vạch 48px, khoá 1s sau click, active tự cuộn `nav.scrollTop`) và `NewsTocDisclosure` (< lg, `<details>` đóng, bấm mục thì gập + cuộn). KHÔNG tách hook từ `DetailSubNav`: nó chọn "khối đầu tiên trong dải" bằng IntersectionObserver, mục lục cần "heading cuối đã qua vạch" — hai quy tắc khác nhau, tách sẽ phải thêm nhánh vào component dùng ở 3 trang (rủi ro đổi hành vi); `DetailSubNav` không bị sửa.
- Bản gập không có highlight active (danh sách đóng, khung nhỏ). Bản dính ẩn < lg bằng wrapper `DetailLayout`.
- Bài không có heading: không `leading`, thẻ trắng chiếm toàn khung (ảnh 16:9 + chữ `max-w-[68ch]` căn trái) — chấp nhận, không thêm `max-w` riêng.
- `<article>` bao ngoài `DetailLayout`; `JsonLd` vẫn trong `<article>`. Ảnh bìa `sizes="(min-width: 1280px) 880px, (min-width: 1024px) 60vw, 100vw"`.

## Files (dự kiến)
- `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`
- `src/components/detail/DetailLayout.tsx` (+ test), có thể `DetailSubNav.tsx` + hook mới (nếu tách)
- `src/components/content/RichText.tsx` (+ test), `src/lib/content/section-headings.ts` (+ test)
- `src/components/news/NewsToc.tsx` (mới) + test
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json` (`page.news.tocTitle`)
- KHÔNG đụng: `src/components/projects/*`, `next.config.ts`, `src/payload-types.ts`, `.claude/launch.json`, `template-feedback.md` (thay đổi chưa commit của user).

## Verification
- `pnpm test` (vitest liên quan: section-headings, RichText, DetailLayout, DetailSubNav, NewsToc, trang tin tức nếu có), `pnpm lint`, `pnpm typecheck` (lệnh từ `.context/project-config.md`).
- Test bắt buộc: id slug bỏ dấu + chống trùng + rỗng → `muc-N`; RichText gắn đúng id theo thứ tự và không đổi output khi tắt; mục lục ẩn khi không heading; `aria-current` theo cuộn (mock observer/rect); click → `scrollIntoView` + focus; DetailLayout không `leading` giữ class lưới cũ.

## Retry / Escalation
- Max 3 attempt; sau 3 lần fail → `architecture_review_needed`, dừng.

## Verification summary
- Builder: `pnpm test` (full) 296 files / 3114 tests PASS (gồm mới: NewsToc.test, section-headings, RichText, DetailLayout; DetailSubNav cũ PASS không đổi); `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở `tools/task-dashboard/server.mjs`, ngoài scope). Chưa kiểm bằng trình duyệt (cần DB/CMS có bài); reviewer/PO nên xem `/tin-tuc/<slug>` ở 375/768/1280.
- Reviewer r1 NORMAL PASS (3 MINOR) `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-1-review.md`: MINOR-1 id trùng `main`/`floating-contact-actions` → `PAGE_RESERVED_IDS`; MINOR-2 timer khoá cuộn → ref `unlockTimer` clear trước khi đặt + khi unmount; MINOR-3 link mục lục `break-words [overflow-wrap:anywhere]`. Change-request sửa cả 3; `pnpm vitest run src/components/news src/components/content src/components/detail src/lib/content` 21 file / 216 test PASS, `pnpm typecheck` PASS, `pnpm lint` 0 error.
- Reviewer r2 FAST PASS `.context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-2-review.md` (ghi chú: `cta-scrim` là data-testid → đã bỏ khỏi danh sách reserved; news test 34 PASS, typecheck PASS).
- Spec validator PASS `.context/review-reports/feature-news-detail-card-toc-spec-validation.md` (N1 sửa dòng Responsive S11; N2 → residual).

## Residual risk
- Chưa xem trình duyệt thật (cần CMS có bài có heading): soi `/tin-tuc/<slug>` + `/en/news/<slug>` ở 375/768/1024/1280 — vị trí dính, vạch active `ACTIVE_LINE_PX=48` (hằng xấp xỉ so với `scroll-mt`), mục lục dài cuộn trong khung.
- Trạng thái header còn hiện (đầu trang, header có `:focus-visible`, chưa hydrate) có thể che tạm heading vừa cuộn tới vì chỉ bù `--sticky-top` + 1rem (cùng rủi ro đã chấp nhận ở BL-027).
- Trang tin tức nay ẩn header khi cuộn (gốc `data-detail-page`) như các trang chi tiết khác.
- Bài không heading: thẻ trắng chiếm toàn khung, chữ ≤ 68ch căn trái (không thêm max-w riêng).
- Bản gập < lg không highlight mục đang đọc.
- Đổi chữ heading trong CMS đổi id (link chia sẻ có `#id` cũ mất neo) — chấp nhận vì id theo chữ tiêu đề là yêu cầu.
