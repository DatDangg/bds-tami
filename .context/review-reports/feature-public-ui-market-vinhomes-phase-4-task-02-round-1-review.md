Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-4-task-02 · round 1

## Review level
**STRICT** (ghi đè NORMAL của task) — thêm hook afterChange/afterDelete vào 2 collection dùng chung (`Rentals`, `PropertyPosts`), truy vấn công khai mới phải theo quy tắc hiển thị, đổi invalidation ISR.

## Blast radius
- Mọi lần lưu/xoá tin cho thuê / tin BĐS (hook chạy trong request lưu).
- Trang chi tiết dự án `/vi|en/du-an/[slug]`.
- `src/lib/rentals/rental-queries.ts`: export `RENTAL_CARD_FIELDS`, `withCoverImages` (hành vi không đổi).
- `SECTION_IDS` / `visibleSections` (subnav), i18n.
- Restyle `FloorPlans`, `Documents`; dùng lại `CtaBanner`.

## Verify
| Command | Result |
|---|---|
| `pnpm lint` | 0 error (2 warning ngoài diff) |
| `pnpm typecheck` | PASS |
| `pnpm test src/lib/projects src/components/projects src/hooks/projects src/collections "src/app"` | 23 files / 199 tests PASS |
| Full test / build | builder 287 files / 3026 PASS, build PASS |

## Kiểm đúng đắn
- Hiển thị công khai: `findProjectListings` qua `findPublicList` như trang danh sách (`publicWhere` status + chưa xoá mềm + `hasEnglish` ở `/en`, `overrideAccess:false`, `trash:false`, `fallbackLocale:false`); rentals chỉ `published`, posts `offerNotEndedWhere(now)` (H1). `buildPublicWhere` chưa có lọc ngày xuất bản — trang danh sách cũng vậy. Test kiểm `deletedAt`, `hasEnglish`, `overrideAccess:false`, số truy vấn.
- Hook: bắn khi tin công khai trước hoặc sau lưu (xuất bản, sửa, ẩn, xoá mềm/thùng rác, khôi phục, `published` → `rented` qua `previousDoc`); đổi dự án → làm mới cả cũ và mới (`relationId` cho quan hệ populated); xoá hẳn; nháp / không dự án → bỏ qua. Đường dẫn `internalPath(CONTENT_ROUTES.projects.detail, …)` mọi slug vi/en như `createRevalidateContent`; trang ISR (`generateStaticParams` `[]`, 60s) → `revalidatePath` đúng; đổi slug dự án do hook Projects sẵn có xử lý. Bulk: mỗi doc 1 `projects.find`. Không có cờ `context` bỏ revalidate trong codebase. `revalidateWithNext` tự bắt lỗi.
- Truy vấn: 2 find song song + 1 truy vấn ảnh gom khi có tin cho thuê; không N+1 (test 3 call).
- LCP: RentalCard/PostCard `priority=false` → ảnh hero vẫn LCP.
- A11y: nhãn nhóm `<p>` + `ul aria-labelledby`, h3 thẻ dưới h2 section — hợp lệ.
- i18n VI/EN đủ (`listings`, `listings.*`, `visitCta.*`); docs cập nhật.

## Responsive gate (tính CSS)
Layout `grid sm:grid-cols-2` OK (375: 1 cột; 768 ~340px/cột; 1280 ~390px/cột) · token OK · ảnh OK (ghi chú finding 2) · pill FloorPlans `min-h-11` OK · subnav thêm 1 mục OK · không vh/motion mới · `overflow-hidden` Documents chỉ bo góc. **PASS**

## Skill gates
aislop/oxlint/ocr/blitzstrike skip; AI-readable OK; ai-friendly-web N/A.

## Findings
1. **[MINOR]** `src/hooks/projects/revalidate-project-on-listing.ts:18-31` `projects.find` không try/catch, chạy cùng `req` → lỗi tra cứu làm hỏng lần lưu. Khớp `createRevalidateContent` sẵn có. *(Primary: không sửa — trong transaction Postgres, truy vấn lỗi đã làm hỏng transaction nên try/catch không cứu được lần lưu; giữ đồng nhất với hook sẵn có, ghi residual.)*
2. **[MINOR]** `src/components/projects/ProjectListings.tsx:47` `RentalCard` dùng `sizes` của trang danh sách 4 cột; ở cột 2 thẻ ~390px → màn DPR cao có thể nhận ảnh hơi nhỏ. Fix: prop `imageSizes` cho RentalCard. *(Chuyển P5-T02.)*
3. **[MINOR]** `src/collections/Rentals.ts:141` có thể revalidate 2 lần nếu `refreshOtherLocaleSearchText` update lồng — chỉ tốn thêm, không sai.
4. **[MINOR]** `du-an/[slug]/page.tsx:103` `now` cố định theo cache → ưu đãi hết hạn trong 60s cửa sổ cache vẫn hiện — như trang danh sách, chấp nhận.

## Residual risk
Truy vấn chỉ test mock `payload.find`, chưa chạy DB thật; responsive tính CSS.

## Verdict
**PASS**
