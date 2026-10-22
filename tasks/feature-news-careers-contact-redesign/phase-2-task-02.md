# feature-news-careers-contact-redesign · phase-2-task-02 — Chi tiết tin tức `/tin-tuc/[slug]` theo design

- Nguồn: BL-054; design `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc.webp`. Spec 1.47.0 khối BL-054 mục "Chi tiết tin tức".
- Plan: phase 2 wave B (song song P2-T04).
- Phụ thuộc: P1-T02 (render khối), P1-T03 (`NewsViewBeacon`), P2-T01 (thẻ lưới tin mới cho "Bài viết liên quan", link `?tag=`).

## Classification / Risk
- Type: **MODIFY**. Risk: **MEDIUM–HIGH** — trang chi tiết ISR, style nội dung `RichText` (dùng chung trang khác → style mới chỉ áp ở bài tin tức), mục lục, chia sẻ. Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/tin-tuc/[slug]/*`, `src/components/news/NewsDetailPage*.tsx` (hoặc file chi tiết hiện có), `src/components/news/NewsArticleSidebar.tsx`, `src/components/news/NewsToc.tsx`, `src/components/news/ShareButtons.tsx`, `src/components/content/RichText.tsx` (chỉ thêm biến thể/`className` cho bài tin — không đổi mặc định trang khác), CSS nội dung bài (`globals.css` / module), i18n namespace `page.newsDetail.v2`, `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Bài viết), `docs/DESIGN.md`.

## Files to Create/Modify
- `src/app/(frontend)/[locale]/tin-tuc/[slug]/`
- `src/components/news/NewsArticleSidebar.tsx`
- `src/components/news/NewsToc.tsx`
- `src/components/news/ShareButtons.tsx`
- `src/components/news/NewsArticle.tsx`
- `src/app/(frontend)/globals.css`

## Scope (theo spec — xem ảnh design)
1. Đầu bài: breadcrumb → badge danh mục → `h1` lớn → sapo (`excerpt`) → hàng tác giả = nhãn thương hiệu i18n "TAMI HOMES" + logo (không đọc / hiện tên `staff` — spec-validation F3) · ngày · "N phút đọc" + nút chia sẻ (Facebook, Zalo, sao chép link — `use-copy-link` sẵn có, "thêm" = `navigator.share` nếu có, không thì ẩn).
2. Ảnh bìa bo góc + chú thích (caption / alt của media; không có → không chú thích). Đoạn văn đầu tiên của nội dung đóng khung nền nhạt (token surface), không lặp.
3. Cột trái dính ≥ lg: "Mục lục" (`NewsToc` sẵn có, mục đang đọc tô đậm; chỉ khi có heading) + thẻ "Tư vấn miễn phí" (chữ + nút "Nhận tư vấn" → `/lien-he`; không form). < lg: mục lục thành khối gập đầu bài (disclosure sẵn có), thẻ tư vấn sau nội dung. Bỏ cột phải "Bài viết mới" BL-045 (design không có).
4. Style nội dung (chỉ bài tin tức): H2 có số tròn 01 / 02 / 03 tự động (CSS counter; id neo giữ), trích dẫn có dấu ngoặc lớn trang trí (`aria-hidden`), `ul` dấu tích tròn (token màu nhấn), `ol` giữ số. Khối P1-T02 hiển thị trong cột nội dung.
5. Cuối bài: dòng "Thẻ:" chip tag (link `/tin-tuc?tag=`; **`/en` ẩn dòng này** — tags chưa localized, spec-validation F2) → "Bài viết liên quan" 3 thẻ (thẻ lưới P2-T01) + link "Xem tất cả tin tức" → banner tư vấn.
6. Gắn `NewsViewBeacon` (P1-T03) với id bài. JSON-LD Article / Breadcrumb, metadata, 1 `h1` giữ.
7. Responsive 375 / 768 / 1280 / 1440 không tràn.
8. Test: component (đoạn mở đầu, H2 số, tag link, chia sẻ, mục lục ẩn khi không heading), trang (beacon gắn, JSON-LD giữ); chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t02-*`.

## Acceptance
- [ ] Bố cục khớp `chi-tiet-tin-tuc.webp` ở desktop; mobile mục lục gập.
- [ ] Style số H2 / trích dẫn / dấu tích chỉ áp ở bài tin tức (trang dự án / dịch vụ / pháp lý không đổi).
- [ ] Lượt xem được gửi 1 lần / lần xem.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
- **Style riêng bài tin = lớp `news-prose` trong `globals.css`** (ngoài `@layer` để thắng utility mặc định của `RichText`), gắn duy nhất ở `NewsArticleBody` (`src/components/news/NewsArticle.tsx`). `RichText.tsx` KHÔNG sửa → trang dự án / dịch vụ / pháp lý không đổi (test quét `src/**/*.tsx`: chỉ `NewsArticle.tsx` dùng `"news-prose"`). Chỉ áp con trực tiếp (cấp gốc Lexical).
- **Đoạn mở đầu = `p:first-child`**: chỉ đóng khung khi nội dung BẮT ĐẦU bằng đoạn văn (đoạn rỗng không render nên không tính). Bài mở bằng heading / ảnh / khối → không khung (không "kéo" đoạn dưới heading lên). Thuần CSS nên không lặp nội dung.
- **Số H2**: CSS counter `decimal-leading-zero`, `content: … / ""` (alt rỗng — trình đọc màn hình không đọc "01"; trình duyệt cũ dùng khai báo dự phòng). Chỉ `h2` cấp gốc; `id` neo / `scroll-mt` của `RichText` giữ.
- **Dấu tích**: vòng tròn `primary-deep` + tích vẽ bằng viền `surface` (không SVG, không mã màu rời). Scope `ul.list-disc` vì khối "Số liệu nổi bật" (P1-T02) cũng là `ul` cấp gốc — phát hiện khi chụp 390, đã sửa + test.
- **Mục lục cột trái**: khôi phục `NewsTocSidebar` (bản dính BL-033, commit 844a131 — logic active "heading cuối đã qua vạch" + test) với style design (vạch trái, mục active vạch nhấn + đậm, không thẻ); việc dính chuyển lên `aside` (`NewsArticleSidebar`) vì cột chứa cả thẻ tư vấn; nav ≤ 45dvh cuộn riêng. `ACTIVE_LINE_PX` 48 → 112 vì trang không còn `data-detail-page` (`--sticky-top` = header 64/72px). `NewsTocDisclosure` thêm lại `lg:hidden`.
- **DOM order**: đầu bài → ảnh/mục lục gập/nội dung/thẻ → `aside` (lưới ≥ lg đặt `col-start-1 row-start-2`) → < lg thẻ tư vấn tự rơi sau nội dung, không nhân đôi component.
- **Chia sẻ**: thêm `variant="icons"` vào `ShareButtons` (mặc định giữ nguyên cho tuyển dụng / `DetailShareButton`). "Thêm" = `navigator.share` đọc qua `useSyncExternalStore` (server = false, không hydration mismatch; ESLint cấm setState trong effect). Huỷ bảng chia sẻ bỏ qua. Không có Zalo icon trong Phosphor → chữ "Zalo".
- **Tác giả**: nhãn i18n cố định `page.newsDetail.v2.author` + logo tĩnh trắng (`BrandLogo tone="on-dark"`) trong avatar tối; không đọc `doc.author`.
- **Chú thích ảnh bìa**: `caption` → `figcaption` (ảnh giữ `alt`); không caption mà có `alt` → `figcaption` = alt và ảnh `alt=""` (không đọc 2 lần); không có cả hai → không chú thích, ảnh `alt` = tiêu đề.
- **Tags `/en`**: page truyền mảng rỗng ở `/en` → không dòng "Thẻ:", không link `?tag=`. Link `/tin-tuc?tag=` dùng `next/link` (không `PendingLink` của trang danh sách).
- **Bỏ "Bài viết mới"** (BL-045) → bỏ query `listPublicNews` ở trang + hằng `LATEST_NEWS_COUNT` (chết) ở `news-queries.ts`; bỏ key i18n `page.newsDetail.{latest*,consult*,related*}` cũ (không còn ai dùng — grep `src`, `tests`) và **close-out MINOR P2-T01: xoá `page.news.readArticle`** (grep không còn dùng). Namespace mới `page.newsDetail.v2` (author, shareLabel, shareMore, consultEyebrow/Title/Text/Cta, tags, related, viewAll).
- **Bài viết liên quan**: `NewsCard variant="grid"` + `sizes` riêng cho lưới 3 cột full container; `h2` kiểu eyebrow như design (tên truy cập "Bài viết liên quan" giữ).
- **Lệch design (ghi vào design-spec)**: thẻ tư vấn không có ảnh tòa nhà (không có trường media; spec chỉ yêu cầu chữ + nút); avatar = logo thay chữ "T"; đoạn ">>>Xem thêm…" của dữ liệu thật là đoạn thường.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm build` PASS (`/[locale]/tin-tuc/[slug]` vẫn `●` SSG/ISR).
- Test (không chạy full `pnpm test` theo chỉ dẫn — Postgres dùng chung): `vitest run src/components/news src/components/content src/components/careers src/components/detail src/components/ui` 25 file / 266 test PASS (trước khi sửa scope `ul.list-disc`); sau sửa `src/components/news src/components/content` 9 file / 113 test PASS; `vitest run src/i18n src/lib/news src/app tests/unit` 26 file / 244 test PASS. Không chạy integration: không đổi endpoint / query / schema (chỉ bỏ hằng không dùng).
- Test mới / cập nhật: `NewsArticle.test.tsx` (đoạn mở đầu là con đầu, bài mở bằng heading không khung, khối số liệu không `list-disc`, CSS counter + alt rỗng, quote, `ul.list-disc`, không mã màu, chỉ bài tin dùng `news-prose`, chú thích caption/alt); `NewsDetailPage.test.tsx` viết lại theo BL-054 (thứ tự đầu bài, không tên staff, chia sẻ icon, chú thích, mục lục gập `lg:hidden`, `news-prose`, tag link, beacon 1 lần với id bài, cột trái sticky + mục lục + thẻ tư vấn không form, không "Bài viết mới", liên quan 3 thẻ + "Xem tất cả", JSON-LD Article + BreadcrumbList, không heading → không mục lục, `/en` ẩn "Thẻ:", 404); `NewsToc.test.tsx` khôi phục 6 test `NewsTocSidebar` + test ẩn < lg / màu active + Disclosure `lg:hidden`; `news-components.test.tsx` +3 test `ShareButtons variant="icons"` (nút "thêm" chỉ khi có `navigator.share`, gọi với title/url, huỷ không ném; status sr-only).
- Trình duyệt (dev port 3122, DB `tami_wt54_p2t01`; đã tắt): bài `net-dac-biet-udic-riverside-2-vinh-tuy-co-gi` (vi + en) được chèn thêm vào DB worktree 1 trích dẫn + 3 khối (`statHighlights`, `imageText`, `projectMention`) sau đoạn đầu mục 1 (có sẵn heading + danh sách); bài không heading `bo-tri-can-ho-121-m2-co-3-phong-ngu`. Không tràn ngang ở 1440 / 768 / 390 (`scrollWidth == clientWidth` mọi trang). 1 `h1`/trang. Ảnh (CDP Edge headless, full page): `.context/review-reports/assets/bl054-p2t02-{vi,en,noheading}-{1440,390}.png`, `bl054-p2t02-vi-768.png`, cận cảnh nội dung `bl054-p2t02-vi-{1440,390}-content.png`.
- Beacon: mở trang trong trình duyệt → đúng 1 `POST /api/public/news-views` → 204 mỗi lần tải trang; `news_views_daily` của bài 489c9d26 tạo hàng mới `views = 1` (created 05:52:48Z, ngày VN 22/10); tải lại cùng trình duyệt → request thứ 2 gửi (1 request / lần tải) nhưng server khử trùng theo khách/ngày (`view-dedupe`) nên `views` vẫn 1 — đúng thiết kế P1-T03.
- `src/payload-types.ts` hiện `M` chỉ do dev server ghi lại khác line ending (diff nội dung rỗng) — không phải thay đổi của task.

## Review

## Doc impact
- `.context/design-spec.md` S11: thêm blockquote "As-built BL-054 P2-T02" (bố cục, `news-prose`, cột trái, cuối trang, lệch design).
- `docs/DESIGN.md` bảng trang: dòng "Chi tiết tin tức" as-built BL-054 (BL-045 đánh dấu đã thay).
- `docs/ERD.md` §4.8 `news.content`: ghi node `block` (3 khối P1-T02, nằm trong JSON, không bảng/migration).
- Không đổi API / schema / migration.
