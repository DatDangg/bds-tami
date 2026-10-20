# Spec Update — 2026-10-20 post-detail-unified-layout (tin đăng BĐS danh sách + chi tiết đồng bộ UI với dự án / cho thuê)

**spec_version:** 1.26.0 → 1.27.0 (MINOR — đổi yêu cầu trình bày trang tin đăng BĐS + thẻ `PostCard` dùng chung; không đổi schema, API, quyền, URL, phân trang, canonical, nguồn lead, JSON-LD)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-032**, MODIFY UI). Change doc `spec/changes/2026-10-20-post-detail-unified-layout.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-post-detail-unified-layout/phase-1-task-01.md`. Review: `.context/review-reports/feature-post-detail-unified-layout-phase-1-task-01-round-1-review.md` (NORMAL, PASS, 4 MINOR tuỳ chọn).

**Quyết định (change-request tự chốt, user "tự quyết đừng hỏi"):** D1 `PostDetail` → `DetailLayout` (before = breadcrumb + ảnh bìa 16:9 bo 20px `pb-8`); D2 helper `src/lib/posts/post-detail-sections.ts` (`overview`, `offer`, `content`, `gallery`, mục trống ẩn); D3 `PostContactBox` mới (`DETAIL_ASIDE_CARD_CLASS`: nút gọi hotline + `LeadFormSlot` + `LeadForm source=property_post`); D4 bỏ `PostShareRail`, `PostShare` trong Tổng quan mọi breakpoint; D5 Tin liên quan ở `after` nền `bg-bg-alt`; D6 `ProjectStickyCta` < lg → `#lead-form`. L1 giữ `CategoryListTemplate`, không thêm lọc; L2 bài nổi bật = thẻ đầu lưới; L3 `PostCard` ảnh 4:3 + tiêu đề `line-clamp-2 font-display text-h4`; L4 trạng thái trống có tiêu đề riêng. Khoá i18n: thêm `gridLabel`, `empty.*`, `subNavLabel`, `subNav.*`, `sections.content`, `leadForm.callHotline`; xoá `page.posts.featuredLabel` / `moreLabel` / `leadForm.hotline`.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, trang tin đăng BĐS + `PostCard` dùng chung) | close-out BL-032 (commit chứa file này) | `src/components/posts/{PostDetail,PostCard,PostListBody,PostListPage,PostShare}.tsx`, `src/components/posts/PostContactBox.tsx` (mới), `src/lib/posts/post-detail-sections.ts` (mới), `src/i18n/messages/{vi,en}.json`. Test `post-components.test.tsx`, `PostShare.test.tsx`, `PostListPage.test.tsx`, `tin-bds/[slug]/page.test.tsx`, `post-detail-sections.test.ts` (mới). Doc: `SPECIFICATIONS.md` F4 + Giao diện, `.context/design-spec.md` S08 / S09 | NORMAL PASS r1 |

## Requirements (SPECIFICATIONS.md)

- **Overview — Giao diện (SỬA):** ngoại lệ header ẩn khi cuộn + khung chi tiết chung nay áp cả chi tiết tin đăng BĐS (ngoài dự án, cho thuê).
- **F4 Đăng tin BĐS — chi tiết (SỬA):** khung chi tiết chung — breadcrumb → ảnh bìa 16:9 bo 20px → thanh mục con dính Tổng quan · Ưu đãi · Nội dung · Hình ảnh (mục trống ẩn) → một thẻ trắng; thẻ liên hệ "Nhận tư vấn" (nút gọi hotline + một form lead `property_post`) dính ≥ lg không cuộn riêng, < lg sau thẻ + CTA dính đáy; Tin liên quan ngoài thẻ. Một cụm chia sẻ ở Tổng quan (< sm Web Share, ≥ sm hàng ngang) — **bỏ cụm dọc lề trái ≥ xl** của BL-007.
- **F4 — danh sách (SỬA):** bài nổi bật là thẻ đầu lưới (không thẻ ngang); dòng "Có N kết quả" + lưới trong section có nhãn; thẻ ảnh 4:3, tiêu đề serif 2 dòng như thẻ dự án / cho thuê; trạng thái trống "Chưa có tin đăng." / "Chưa có tin đăng trong mục này." (+ link quay lại ở danh mục).
- Design as-built: `.context/design-spec.md` S08 + S09 ghi chú BL-032 reconcile cùng task.

## Schema / Migration / API

Không. Migration: none. URL, tham số, phân trang, canonical, JSON-LD `Article` + breadcrumb không đổi.

## Hành vi bị thay thế

| Trước | Sau (BL-032) |
|---|---|
| Chi tiết tin: bố cục riêng (header `max-w-text`, ảnh bìa `max-w-5xl`, form lead full-width dưới bài) | Khung chi tiết chung như dự án / cho thuê (thẻ trắng + thẻ liên hệ dính cột phải + thanh mục con) |
| Header trang chi tiết tin: thanh nổi | Ẩn khi cuộn xuống (ngoại lệ chi tiết, như BL-027) |
| ≥ xl cụm chia sẻ dọc dính lề trái (`PostShareRail`, BL-007) + bản ngang `xl:hidden` | Một cụm ở Tổng quan mọi breakpoint; không còn rail |
| Link hotline rời dưới form | Nút "Gọi hotline {phone}" trong thẻ liên hệ |
| Danh sách: bài nổi bật thẻ ngang 7/5 trên lưới | Thẻ đầu lưới (ảnh `priority`) |
| `PostCard` ảnh 16:10, tiêu đề `text-h4 font-semibold` | Ảnh 4:3, `line-clamp-2 font-display text-h4` |
| Trạng thái trống không tiêu đề riêng | "Chưa có tin đăng." / "Chưa có tin đăng trong mục này." + quay lại |

## Số đo / verify

- vitest posts/detail/home/lib-posts/route tin-bds 19 file / 154 test PASS; typecheck PASS; lint 0 error (2 warning cũ ngoài scope).
- Chưa đo trên trình duyệt thật 375 / 768 / 1280.

## Ảnh hưởng test

- Direct: `/tin-bds/[slug]` + `/en/property-news/[slug]` (khung, thanh mục con, thẻ liên hệ, chia sẻ, Tin liên quan, CTA < lg); `/tin-bds` + `/tin-bds/danh-muc/[category]` (+ EN) (lưới, thẻ đầu nổi bật, trạng thái trống).
- Dependents: `PostCard` ở slider Ưu đãi trang chủ và khối Tin liên quan chi tiết dự án; `DetailLayout` / `DetailSubNav` / `DetailAsideFit` dùng chung.
- Regression: chi tiết dự án / cho thuê không đổi; một `h1`; JSON-LD; lead `property_post`; tin hết hạn / kết thúc (badge, ảnh mờ, noindex nếu có); phân trang + canonical danh sách.
- Residual: chưa đo trực quan 375/768/1280; 4 MINOR review tuỳ chọn chưa xử lý.
