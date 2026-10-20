# feature-post-detail-unified-layout · phase-1-task-01 — Tin đăng BĐS (danh sách + chi tiết) đồng bộ UI với dự án / cho thuê (BL-032)

- Change doc: `spec/changes/2026-10-20-post-detail-unified-layout.md` (BACKLOG BL-032) — follow-up BL-027 (khung chi tiết chung), BL-028, BL-029, BL-031.
- Phụ thuộc: không. Một task (cùng khu vực `src/components/posts/`, trùng file PostCard/i18n → không tách song song).
- Trạng thái: `done` — reviewer PASS (r1 NORMAL, r2 FAST); — user "/change xử lý 2 cái, tự quyết đừng hỏi t nhé" (auto proceed, không checkpoint duyệt plan).

## Classification / Risk
- Type: **MODIFY** (UI; không đổi schema/API/quyền/dữ liệu/URL/SEO)
- Risk: **MEDIUM** — `PostCard` dùng chung (slider Ưu đãi trang chủ, Tin liên quan chi tiết dự án, Tin liên quan chi tiết tin); thêm khoá i18n vi/en.
- Expected review level: **NORMAL** (shared component `PostCard`).
- Blast radius: `/tin-bds`, `/tin-bds/danh-muc/[category]`, `/tin-bds/[slug]` (+ `/en/property-news...`), trang chủ (slider Ưu đãi), `/du-an/[slug]` (khối Tin liên quan — nhóm tin đăng).
- Doc impact: `SPECIFICATIONS.md` F4 + Giao diện (đã ghi spec delta), `.context/design-spec.md` S08/S09 (đã ghi as-built BL-032). No API/ERD impact.

## Hiện trạng (đã đọc)
- `src/components/posts/PostDetail.tsx`: layout riêng (header `max-w-text`, ảnh bìa `max-w-5xl`, `PostShareRail` ≥ xl, form lead full-width dưới bài, Tin liên quan nền `bg-bg-alt`), KHÔNG dùng `src/components/detail/*`.
- Khuôn: `src/components/rentals/RentalDetail.tsx` (DetailLayout before/subNav/aside/after, `RentalOverview` = section `#overview` không dùng DetailSection, `SaleContactBox` dùng `DETAIL_ASIDE_CARD_CLASS` + `LeadFormSlot headingId` trong suốt p-0, `ProjectStickyCta`, `article.pb-16 lg:pb-0`), `src/lib/rentals/rental-detail-sections.ts` (visible sections + DOM id).
- `src/components/posts/PostListPage.tsx` dùng `CategoryListTemplate` (giống `/du-an`), không có băng tìm kiếm (spec F4: không có tham số lọc). `PostListBody`: dòng kết quả + thẻ `feature` ngang 7/5 + lưới 4 cột. `PostCard` card: ảnh 16:10, tiêu đề `text-h4 font-semibold` (khác RentalCard/ProjectCard: ảnh 4:3, `line-clamp-2 font-display text-h4`, `gap-1`).

## Thiết kế (change-request tự chốt — auto proceed)
### Chi tiết `/tin-bds/[slug]`
- **D1 — khung:** `PostDetail` → `DetailLayout`. `before` = `Breadcrumb className="py-2"` (giữ items + JSON-LD breadcrumb như cũ) + ảnh bìa (nếu có) trong `mx-auto mt-4 w-full max-w-container px-gutter pb-8`, bo 20px (`overflow-hidden rounded-[20px]`), 16:9, `priority`, `sizes` theo khung container. Không có ảnh bìa → chỉ breadcrumb.
- **D2 — khối + thanh mục con:** helper mới `src/lib/posts/post-detail-sections.ts` (`POST_SECTION_IDS = overview, offer, content, gallery`; `visiblePostSections`; `POST_SECTION_DOM_ID`) theo khuôn rental. Tổng quan luôn có (section `#overview` như `RentalOverview`: danh mục link, `h1` `font-display text-h2 text-balance` duy nhất, ngày đăng, `PostShare`). Ưu đãi `#offer` khi có offer (OfferBox đã có tiêu đề riêng → bọc section neo, không lặp tiêu đề). Nội dung `#content` (DetailSection "Nội dung"/"Content") khi richText có nội dung. Hình ảnh `#gallery` (DetailSection t("gallery")) khi gallery > 0. Nhãn thanh: khoá mới `page.posts.subNavLabel` + `page.posts.subNav.{overview,offer,content,gallery}` (+ `sections.content`) vi/en.
- **D3 — thẻ liên hệ:** component mới `PostContactBox` (`DETAIL_ASIDE_CARD_CLASS`): nút gọi hotline (Button dark full width, `tel:`; chỉ khi có hotline) + `LeadFormSlot` (tiêu đề t("leadForm.title"), `headingId` export làm `asideLabelledBy`, trong suốt p-0 như SaleContactBox) + `LeadForm source=property_post sourceId=doc.id` (giữ turnstile/hotline props). Bỏ link hotline rời dưới form (thay bằng nút).
- **D4 — chia sẻ:** bỏ `PostShareRail` (khung mới không còn lề trái cột chữ); `PostShare` trong Tổng quan hiện mọi breakpoint (< sm nút Web Share, ≥ sm hàng ngang) — bỏ `xl:hidden`. Xoá `PostShareRail` + test của nó nếu không còn nơi dùng.
- **D5 — Tin liên quan:** `after` = section nền `bg-bg-alt py-section-tight` như `SimilarRentals` (h2 `font-display text-h2-sm`, lưới sm:2 lg:3, `PostCard headingLevel="h3"`).
- **D6 — mobile:** `ProjectStickyCta label={t("leadForm.title")}` trỏ đúng id form lead (kiểm `LeadFormSlot`/`LEAD_FORM_DOM_ID`); `article` `pb-16 lg:pb-0`.
- JSON-LD `Article` ở route giữ nguyên; route `page.tsx` không đổi props trừ khi cần.

### Danh sách `/tin-bds` (+ danh mục)
- **L1:** giữ `CategoryListTemplate` (cùng template `/du-an`); KHÔNG thêm băng tìm kiếm/lọc (spec F4: không có tham số lọc; thêm tham số = đổi URL/dữ liệu, ngoài phạm vi).
- **L2:** `PostListBody` như khối lưới `/du-an`: `section aria-label` (khoá `gridLabel` mới hoặc t("title")) chứa dòng "Có N kết quả" + lưới 1/2/3/4; bài nổi bật = thẻ đầu lưới (`priority`), bỏ thẻ ngang. Bỏ biến thể `feature` của `PostCard` + khoá i18n không còn dùng (`featuredLabel`, `moreLabel`) nếu không nơi nào dùng (vi/en đồng bộ).
- **L3:** `PostCard` card cùng kiểu RentalCard/ProjectCard: ảnh `aspect-[4/3]` (ResponsiveImage aspectRatio 4/3), tiêu đề `line-clamp-2 font-display text-h4`, thân `gap-1`; giữ danh mục, excerpt (`line-clamp-2 text-small text-text-secondary`), giá, ngày/hạn, badge, ảnh mờ khi kết thúc.
- **L4:** trạng thái trống: `emptyState` tiêu đề riêng — khoá mới `page.posts.empty.noPosts` ("Chưa có tin đăng.") / `empty.noPostsInCategory` ("Chưa có tin đăng trong mục này." + `backHref` `/tin-bds`) vi/en.

## Files (dự kiến)
- `src/components/posts/PostDetail.tsx`, `PostContactBox.tsx` (mới), `PostShare.tsx`, `PostCard.tsx`, `PostListBody.tsx`, `PostListPage.tsx`
- `src/lib/posts/post-detail-sections.ts` (mới) + test
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`
- Test: `src/components/posts/post-components.test.tsx`, `PostListPage.test.tsx`, `PostShare.test.tsx`, test mới cho PostDetail; test trang chủ slider nếu assert class PostCard
- KHÔNG đụng: `src/components/projects/*`, `next.config.ts`, `src/payload-types.ts` (thay đổi chưa commit của user).

## Acceptance
- [ ] Chi tiết: nền `bg-primary-subtle` (`data-detail-page`), nội dung trong một thẻ trắng bo 28px, thanh mục con dính theo mục hiện có (mục rỗng ẩn), thẻ liên hệ dính ≥ lg không cuộn riêng (`DetailAsideFit`), ảnh bìa ↔ thanh mục con `pb-8`
- [ ] Một `h1`; JSON-LD Article + breadcrumb giữ; form lead `source=property_post` duy nhất
- [ ] Danh sách: thẻ/lưới/kết quả/trống đồng bộ `/du-an` `/cho-thue`; URL/phân trang/canonical không đổi
- [ ] vi/en đủ khoá; 375/768/1280 không tràn ngang
- [ ] `pnpm vitest run src/components/posts src/components/detail src/components/home src/lib/posts`, `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Builder đã làm D1–D6 + L1–L4 đúng thiết kế. File mới: `PostContactBox.tsx`, `src/lib/posts/post-detail-sections.ts` (+ test). Sửa: `PostDetail.tsx` (DetailLayout, section Tổng quan/Ưu đãi/Nội dung/Hình ảnh, ProjectStickyCta, article pb-16 lg:pb-0), `PostShare.tsx` (xoá `PostShareRail`, bỏ `xl:hidden`), `PostCard.tsx` (xoá biến thể `feature`; ảnh 4:3, tiêu đề line-clamp-2 font-display text-h4, gap-1), `PostListBody.tsx` (một section gridLabel: dòng kết quả + lưới; nổi bật = thẻ đầu, priority), `PostListPage.tsx` (EmptyState tiêu đề riêng + backHref), vi/en.json.
- Quyết định: Tổng quan h1 `text-h2` như rental; mục Nội dung chỉ dựng khi `hasRichText` (tái dùng helper careers); Ưu đãi bọc div neo `#offer` (OfferBox giữ h2 riêng); thay khoá `leadForm.hotline` bằng `leadForm.callHotline` ("Gọi hotline {phone}") vì không còn link hotline rời; xoá khoá `featuredLabel`/`moreLabel` (page.posts) — khoá `page.news.featuredLabel` giữ nguyên. Thêm khoá `gridLabel`, `empty.*`, `subNavLabel`, `subNav.*`, `sections.content` (vi/en đồng bộ). Anchor `LEAD_FORM_DOM_ID` mặc định "lead-form" khớp LeadFormSlot. Route page.tsx không đổi.
- Test: cập nhật `post-components.test.tsx`, `PostShare.test.tsx`, `PostListPage.test.tsx` (trống + danh mục trống), `tin-bds/[slug]/page.test.tsx` (khung chung, subnav, aside, không rail); thêm `post-detail-sections.test.ts`.
- Verify: `pnpm vitest run src/components/posts src/components/detail src/components/home src/lib/posts "src/app/(frontend)/[locale]/tin-bds"` → 19 files / 154 tests PASS; `pnpm lint` → 0 error (2 warning cũ ở tools/task-dashboard, ngoài scope); `pnpm typecheck` PASS. Chưa kiểm thủ công 375/768/1280 trên trình duyệt.
- Sau review round 1 (change-request sửa MINOR-1): `PostListPage` chỉ truyền `backHref` khi trong danh mục (trang /tin-bds trống không còn link về chính nó) + test. Scoped suite 19 file / 154 test PASS, lint 0 error, typecheck PASS. Review r2 FAST PASS.
- Smoke dev server :3000 (curl): /tin-bds 200, /en/property-news 200; chi tiết `/tin-bds/ban-nha-pho-shophouse-elegant-park-...` 200 có `data-detail-page`, `#overview`, đúng 1 `#lead-form`, 1 `h1`, JSON-LD còn.
- Reports: `.context/review-reports/feature-post-detail-unified-layout-phase-1-task-01-round-1-review.md` (NORMAL PASS, 4 MINOR), `...-round-2-review.md` (FAST PASS). Spec 1.27.0 / scope v34.

## Residual risk
- Chưa xem trình duyệt thật ở 375/768/1280 (chỉ đọc class + smoke HTML).
- MINOR-2 (PostDetail ~70 dòng, có thể tách RelatedPosts), MINOR-3 (`hasRichText` import từ `lib/careers/job-view`), MINOR-4 (thiếu test sticky CTA href/1 form) — hoãn.
- PostCard đổi ảnh 16:10 → 4:3 + tiêu đề serif 2 dòng ở mọi nơi dùng (slider Ưu đãi trang chủ, Tin liên quan chi tiết dự án) — chủ ý đồng bộ; test `src/components/projects/*` không chạy (thư mục có thay đổi chưa commit của user), typecheck PASS.
- Bỏ rail chia sẻ ≥ xl (thay quyết định BL-007) và link hotline rời → nút gọi hotline trong thẻ liên hệ.
