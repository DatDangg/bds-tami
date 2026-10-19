Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-04 · round 1 (khối Tin cho thuê + Tin tức)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** hook `afterChange`/`afterDelete` mới trên Rentals, News (mọi lần lưu admin đi qua); luật hiển thị `/en` + chi phí truy vấn trang chủ; mô tả admin mới trên global Homepage; seed; view model dùng chung `HomeBlocks`/`home-view`.
- **Blast radius:** `src/collections/Rentals.ts`, `News.ts` (mảng hook, tham số `revalidateTags`); `src/hooks/homepage/revalidate-homepage-on-service.ts`; `src/lib/home/{home-queries,home-view,load-home}.ts`; `src/components/home/{HomeBlocks,HomeRentals,RentalsTabs,HomeNews}.tsx`; `src/globals/Homepage.ts`, `homepage/blocks.ts` (chỉ mô tả admin); `seed/sample/homepage.ts`; i18n `page.home.rentals.*`, `page.home.news.*`; `payload-types.ts` (chỉ chú thích); docs. Tái dùng nguyên: `PostgresRentalSearch`, `listRentalCategoryOptions`, `findPublicList`, `RentalCard`, `NewsCard`, `useSnapSlider`/`SliderArrow`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app src/hooks` | PASS 189 files, 1851 tests |
| `pnpm vitest run tests/integration/{news,rentals,rental-search,rentals-reindex-job}.test.ts` (DB `tami_wt_bl020`) | PASS 4 files, 103 tests |
| `pnpm vitest run tests/integration/homepage.test.ts tests/integration/homepage-migration.test.ts` | PASS 28 tests (gồm `seedSampleHomepage` với blockOrder 8 khối) |
| `pnpm build` (primary, worktree sạch `build-p2t04`) | PASS, bảng route không đổi |
| **Trình duyệt (primary, `next start` :3020, DB seed-scraped: 27 tin cho thuê, 22 tin tức, blockOrder thêm rentals/news)** | **LỖI:** log server 36× `MISSING_MESSAGE: Cannot read properties of undefined (reading 'split')` tại `ProjectsSlider` `t(slide.salesStatus)` (salesStatus undefined — hồi quy P2-T03, đã commit `5ca19aa`); trang chủ **không render** khối Cho thuê/Tin tức dù đã bật + có dữ liệu |

File cấm không đụng; `payload-types.ts` chỉ đổi JSDoc → không cần migration.

## Kiểm yêu cầu (reviewer)
Hiển thị dùng lại đúng đường dẫn sẵn có (`PostgresRentalSearch` `available: true` → `status = 'published'` `rental-search-sql.ts:54`; `/en` lọc locale; danh mục chọn tay qua `findPublicList` + scope rental; fallback `listRentalCategoryOptions`; tin tức `findPublicList` chỉ field thẻ). Thứ tự admin giữ, giới hạn 4 tab / 8 tin / 3 bài ở loader + view; fallback khi chọn tay rỗng (giống chip hero). Chi phí: ≤ 9 SQL (chọn tay) / ≤ 17 SQL song song (fallback), chỉ khi khối hiện, mỗi lần tái tạo ISR 60s. Hook `createRevalidateHomepageOnListing` chạy khi doc hoặc bản trước đã xuất bản (publish, sửa, ẩn, đã thuê, xoá mềm/cứng), không ném lỗi ngoài Next (`revalidate-global.ts:14-17`, `revalidate-content.ts:15-18`), không lặp. Tablist a11y đầy đủ (roles, roving tabindex, ←/→ vòng, Home/End, panel `hidden`, không JS hiện tab 1, 1 tab thì không dựng tablist). Contrast trong `.theme-dark-block` (#111111): tiêu đề 18.9:1, trích dẫn 9.0:1, ngày 6.7:1, danh mục 10:1 — AA. Link theo locale. i18n đủ 2 ngôn ngữ.

## Responsive gate (tính CSS)
Không cuộn ngang; min-width; độ rộng slide khớp gap; chữ token; chạm 44px; reduced-motion; chỉ ẩn thanh cuộn. Chưa kiểm: vuốt thật, 3 cột tin ở 640–767px (~180px), nhãn tab dài ở 375px.

## Skill gates
aislop skip · oxlint skip (ESLint 0 error) · ocr skip · AI-readable OK (1 chỉ báo: `home-view.ts` 337 dòng) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- **[MAJOR-1]** Khối tối nội dung thứ 2 mâu thuẫn design-spec — `src/components/home/HomeNews.tsx:504` (`theme-dark-block`) vs `.context/design-spec.md:676` (tối đa 1 section tối nội dung/trang) và `:239` ("7 section… 1 khối tối nội dung (CTA)"), danh sách ngoại lệ tokens §0 chưa cập nhật; diễn giải "nền màu thương hiệu" = tối chưa ghi decision log. Sửa (a) giữ tối + ghi ngoại lệ, sửa :239/:676/tokens §0, hoặc (b) đổi nền vàng/nhạt + tính lại contrast. **Primary chọn (a).**
- **[MINOR-1]** `src/lib/home/home-view.ts` 337 dòng → tách `home-view-listings.ts`.
- **[MINOR-2]** `src/globals/Homepage.ts:28` thứ tự mặc định đặt Tin tức (tối) sát footer (tối) → không có ranh giới; thêm viền/khác sắc.
- **[MINOR-3]** `NewsCard` `sizes` lớn hơn cột thật trên trang chủ → prop `sizes` tuỳ chọn.
- **[MINOR-4]** fallback thăm dò cả 8 danh mục gốc → thăm 4 trước.
- **[MINOR-5]** `HomeNews.tsx:497` "S01 khối 11" → "S01 khối 9 (BL-020 #11)".
- **[MINOR-6]** `RentalsTabs.tsx:463` tab không chọn gần như không có tín hiệu (hover `#f1f0ee` ≈ nền `#f7f5f4`) → thêm viền/hover rõ hơn.

## Bổ sung của primary (kiểm thật)
- **[MAJOR-R1]** `ProjectsSlider` gọi `t(slide.salesStatus)` với `undefined` → 36 lỗi `MISSING_MESSAGE` trên server mỗi lần render trang chủ (dữ liệu: 61 dự án đều có `sales_status` trong DB → nghi `select`/view thiếu `salesStatus`). Hồi quy từ P2-T03 (`5ca19aa`), sửa trong task này.
- **[MAJOR-R2]** Trang chủ build sạch không hiện khối Cho thuê/Tin tức dù `rentals_enabled`/`news_enabled` = true, blockOrder có 2 khối, có 27 tin cho thuê + 22 tin tức (tiêu đề khối chưa nhập) → cần tìm root cause (ẩn khi thiếu tiêu đề? tái tạo ISR lỗi?).

## Verdict: FAIL (MAJOR-1 + MAJOR-R1 + MAJOR-R2)
