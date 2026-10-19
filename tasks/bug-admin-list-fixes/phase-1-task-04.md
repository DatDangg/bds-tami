# bug-admin-list-fixes · phase-1-task-04 — danh sách trường "Thêm bộ lọc" + lọc "Thuộc dự án" theo tên (#06 #07)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T4).

## Classification / Risk
- Type: **MODIFY** (#06: rút gọn trường lọc) + **BUG** (#07: bộ lọc quan hệ mất nhãn).
- Risk: **HIGH → STRICT** — đổi cấu hình field dùng chung (`withContentDefaults`, nhóm SEO/translation) cho nhiều collection; phần #07 chạm cách REST xác định locale (shared, mọi client admin).

## Repro #07 (đã làm, dev worktree 2026-10-19, DB `tami_wt_bl021`, `pnpm seed --sample`)
1. Admin → Cho thuê → Bộ lọc → Thêm bộ lọc → `Thuộc dự án` `bằng` → ô giá trị là select theo **tên** dự án, gõ "Đà Nẵng" ra đúng dự án (Payload `RelationshipFilter`, `useAsTitle: title`). Gõ không dấu "da nang" → "Không có lựa chọn" (`like` phân biệt dấu).
2. Chọn "Dự án mẫu Căn hộ Sông Sài Gòn" → URL `where[or][0][and][0][project][equals]=<uuid>` → **tải lại trang** → ô giá trị **trống** (bộ lọc vẫn áp, người dùng không biết đang lọc dự án nào).

## Root cause #07 (đã chứng minh)
- `src/payload.config.ts:95-100` `localization: { defaultLocale: "vi", fallback: false }`. Payload `sanitizeLocales` (`payload/dist/utilities/addLocalesToRequest.js`) chỉ thay locale thiếu bằng `defaultLocale` khi `localization.fallback` bật → REST không có `?locale` chạy với `req.locale = null` → trường localized trả `null`.
  Kiểm trên trình duyệt: `GET /api/projects/<id>?depth=0` → `title: null`; `&locale=vi` → tên VI; `&locale=en` → tên EN.
- `@payloadcms/ui/dist/elements/WhereBuilder/Condition/Relationship/index.js` `addOptionByID` gọi `/${relation}/${id}?depth=0` **không** gửi `locale` (danh sách option thì có `locale`). Khi tải lại, effect "nạp option cho value chưa có" chạy (option list bị CLEAR/abort khi mount) → thêm option `{ label: null }`; `optionsReducer` ADD bỏ qua id đã có → nhãn rỗng vĩnh viễn.

## Fix (phạm vi)
### #07
- Không bật `fallback` (BR-07). Sửa ở tầng app: request REST không có `locale` → dùng `defaultLocale` (`vi`) cho thao tác **đọc** — chọn cách hẹp + đơn giản nhất, có lý do (vd hook `beforeOperation` read cho các collection làm đích quan hệ được lọc trong admin, hoặc gắn chung qua `withContentDefaults`; không đổi REST có `locale` tường minh, không đổi `locale=all`). Đánh giá blast radius với client public/REST hiện có (grep caller `fetch('/api/...` không gửi locale) và ghi lại.
- Tuỳ chọn (nếu rẻ): tìm không dấu trong bộ lọc quan hệ — **không bắt buộc**, chỉ ghi residual nếu không làm.
### #06
- "Thêm bộ lọc" của rentals / projects / property-posts / news / leads chỉ còn trường nghiệp vụ: `admin.disableListFilter: true` cho nhóm SEO (title/description/OG image/noindex/canonical), nhóm translation (status/enSource/viChanged/hash/translatedAt/model/lastError — đã có dropdown "Trạng thái dịch" riêng), richText/textarea dài (mô tả, ghi chú pháp lý, nội dung), media/gallery, link video, toạ độ, hash/kỹ thuật (searchText, ipHash, userAgent…), `id`. Giữ: trạng thái, danh mục, dự án, tỉnh/phường, giá, diện tích, phòng, hướng, nội thất, tác giả, nổi bật, có bản tiếng Anh, ngày xuất bản/tạo/cập nhật; Leads giữ trạng thái/nguồn/sale/ngày + UTM nghiệp vụ. Ghi bảng giữ/ẩn từng collection vào Verification summary.
- `disableListFilter` không được ảnh hưởng: cột danh sách, form sửa, `TranslationStatusFilter` (lọc qua `where` vẫn chạy — kiểm `translation.*` vẫn query được), export lead (T3).

## Acceptance
- [ ] Tải lại trang có bộ lọc "Thuộc dự án" → ô giá trị hiện đúng tên dự án (kiểm thật trên trình duyệt hoặc integration: `GET /api/projects/:id` không locale trả tên VI).
- [ ] REST có `?locale=en` / `locale=all` không đổi hành vi.
- [ ] "Thêm bộ lọc" 5 collection chỉ còn trường nghiệp vụ (test đọc config: các field kỹ thuật có `disableListFilter`).
- [ ] Lọc "Trạng thái dịch" (T1) vẫn hoạt động.
- [ ] `pnpm test` (unit/ui + integration liên quan) / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
**#07 — cách sửa:** hook `defaultReadLocale` (`src/hooks/default-read-locale.ts`, `beforeOperation`, chỉ `operation === "read"` = find/findByID) đặt `req.locale = defaultLocale` khi request không có locale; gắn trong `withContentDefaults` (projects, rentals, property-posts, news, categories, developers, services, pages, job-postings — mọi collection có trường localized làm đích quan hệ). `localization.fallback` vẫn `false` (BR-07). Vì sao hẹp: (1) Payload destructure `req.locale` SAU `beforeOperation` nên đặt ở hook là đủ; (2) không đụng `payload.config`/middleware nên không ảnh hưởng ghi, GraphQL, global; (3) `?locale=en`/`vi`/`all` có giá trị nên hook bỏ qua. Blast radius: Local API luôn tự có locale (createLocalReq) → không đổi; trang công khai dùng Local API → không đổi; grep `fetch("/api/…` phía client: chỉ `TranslationFailedBanner` (đọc `translation`, không localized) và các endpoint `/api/admin/*` (không phải đọc collection) → không phụ thuộc locale null; test integration hiện có không dựa vào locale null (306 test PASS). Khác biệt hành vi duy nhất: REST đọc không `?locale` giờ trả bản VI thay vì `null` ở trường localized. Provinces/Wards/Staff không localized nên không cần.
**#07 test:** `tests/integration/projects.test.ts` > "REST đọc không có ?locale (BL-021 #07)" (qua `handleEndpoints`): không locale → tên VI, `vi`/`en`/`all` giữ nguyên, `find` cũng đúng. Đã xác nhận FAIL khi tắt hook (title `undefined`/null), PASS khi bật.
**#06 — cách sửa:** `hideTechnicalListFilters(collection, hiddenPaths)` (`src/lib/admin/list-filter.ts`) đặt `admin.disableListFilter: true` ở từng trường LÁ (Payload kiểm cờ ở lá, không kế thừa từ group; cờ chỉ ẩn khỏi menu "Thêm bộ lọc" — `reduceFieldsToOptions` còn chủ động giữ field đó nếu có trong URL; không chặn query `where`, cột, form). Quy tắc: tự ẩn theo kiểu (richText, textarea, upload, point, json, array, blocks, ui, join) + luôn ẩn nhóm `seo`, `translation`, `slug`, `scopeSlug` + đường dẫn riêng từng collection.
| Collection | Giữ trong "Thêm bộ lọc" | Ẩn (ngoài quy tắc kiểu + SEO/translation/slug) |
|---|---|---|
| rentals | title, category, code, project, province, ward, status, hasEnglish, isFeatured, author, publishedAt, rentedAt, priceMonthlyVnd, priceNegotiable, areaM2, floor, bedrooms, bathrooms, houseDirection, balconyDirection, furnishing, rentalTerms.{minLeaseMonths, depositMonths, paymentCycle, availableFrom} | address, showExactAddress, videoUrl, rentalTerms.includedServices (hasMany), searchText; mô tả/ghi chú pháp lý (richText/textarea), gallery, location |
| projects | title, category, developer, salesStatus, province, ward, status, hasEnglish, isFeatured, author, publishedAt, priceFrom/ToVnd, areaFrom/ToM2 | address, scale.* (cả nhóm); summary/overview/legalInfo/salesPolicy, gallery/documents, floorPlans, amenities, location |
| property-posts | title, category, priceVnd, province, ward, relatedProject, relatedRental, offer.startAt, offer.endAt, status, hasEnglish, isFeatured, author, publishedAt | priceNote, offer.voucherCode; excerpt/content/offer.terms, cover/gallery |
| news | title, category, status, hasEnglish, isFeatured, author, publishedAt | tags; excerpt/content, cover |
| leads | code, status, source, assignedTo, assignedAt, rental, propertyPost, project, firstContactedAt, lastActivityAt, utm.{source,medium,campaign,term,content} | fullName, phone, phoneNormalized, email, locale, consentAt, consentVersion, pageUrl, referrer, mergedCount, remindedAt, anonymizedAt (tên/SĐT/email đã có ô tìm kiếm); message, lostReason, activities |
Lưu ý: `id` là trường ngầm của Payload (không nằm trong config) nên không ẩn được ở tầng config — ghi residual.
**#06 test:** `src/lib/admin/list-filter.test.ts` đọc config 5 collection, so tập trường còn lọc được với bảng trên (+ nhóm `translation` còn trường `status` nhưng ẩn khỏi menu → `TranslationStatusFilter` lọc qua `where` vẫn chạy; cột/hook/access không đổi).
**Verify:** `pnpm vitest run --project unit --project ui` 203 file/1990 test PASS; integration (projects, rentals, news, property-posts, leads, leads-export, categories, retranslate, translate-content, content-defaults, admin-form-layout, locale-counterpart, public-queries) 13 file/306 test PASS; `pnpm lint` PASS; `pnpm typecheck` PASS. Chưa kiểm trực quan trên trình duyệt (reviewer/primary có thể xem nhanh menu "Thêm bộ lọc" + tải lại bộ lọc Thuộc dự án). Không migration.

## Doc impact / Reconcile
- `docs/API_SPEC.md` mục Ngôn ngữ (as-built): REST đọc collection nội dung không `locale` → `vi` (hook `defaultReadLocale`), `en`/`all` giữ nguyên, không fallback. Không đổi schema/ERD. `disableListFilter` chỉ là cấu hình admin — no doc impact.
## Review
- STRICT PASS round 1 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-04-round-1-review.md`; 3 MINOR đã sửa (JSDoc, format/import, helper test tab).
- Primary kiểm trình duyệt (dev :3021, seed --sample): tải lại với bộ lọc dự án → hiện tên; trường lọc rentals 50 → 29; chọn/đổi/xoá "Trạng thái dịch" giữ điều kiện "Trạng thái = Nháp" (xác nhận cả T1).
## Residual risk
- `id` / "Đã Xoá Lúc" (trường Payload) vẫn hiện trong menu lọc.
- Tìm không dấu trong bộ lọc quan hệ (`like` phân biệt dấu) chưa làm (tuỳ chọn).
- REST đọc không `?locale` của collection nội dung nay trả VI thay vì `null`; Media (ngoài `withContentDefaults`) vẫn `null`.
- Điều kiện `translation.*` hiện thành hàng disabled trong panel Bộ lọc (bỏ được bằng nút xoá hoặc dropdown "Trạng thái dịch").
