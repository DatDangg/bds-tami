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

## Verification summary (Builder)

## Review

## Doc impact
