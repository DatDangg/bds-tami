# feature-admin-list-columns-filters-locale · phase-1-task-03 — Chip lọc nhanh Dự án / Tin tức / Tin BĐS / Tuyển dụng / Hồ sơ ứng tuyển (BL-039 #4)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "**Chip lọc nhanh mở rộng (BL-039)**".
- Phụ thuộc: T01, T02 (cùng file collection). Trạng thái: `done` — Reviewer STRICT r1 PASS (`.context/review-reports/feature-admin-list-columns-filters-locale-phase-1-task-03-round-1-review.md`); MINOR-1 (try/catch query danh mục) + MINOR-3 sửa sau r1, primary kiểm lại diff + xác nhận `limit` vẫn áp khi `pagination: false` (payload `collections/operations/find.js:71-72`, drizzle `find/findMany.js:117`); MINOR-2 giữ theo spec.

## Classification / Risk
- Type: **MODIFY** (thêm nhóm chip + slot `beforeListTable`; dùng lại `QuickFilterChips` + `quick-filters.ts`). Không đổi schema/access/endpoint.
- Risk: **MEDIUM** — `where` URL ghép với Lọc dịch/bộ lọc tay; danh mục lấy động bằng Local API → review **STRICT** nếu chạm lõi `quick-filters.ts`, không thì NORMAL.
- Blast radius: `src/lib/admin/quick-filters.ts` (+test), slot `src/components/admin/*QuickFilterSlot.tsx`, `src/collections/{Projects,News,PropertyPosts,JobPostings,JobApplications}.ts`, `src/app/(payload)/admin/importMap.js` (sinh lại).
- Doc impact: FR-ADM-19 (đã ghi). Migration: không.

## Quyết định (auto proceed)
- D9 Không viết cơ chế chip thứ 2: thêm hằng nhóm chip trong `quick-filters.ts` + slot server; ưu tiên 1 slot chung (vd `CollectionQuickFilterSlot` đọc `collectionSlug`/`params.segments[1]` → nhóm) thay vì copy 5 file; giữ `LeadQuickFilterSlot`/`RentalQuickFilterSlot` nếu gộp làm tăng rủi ro. Ẩn ở thùng rác như slot cũ. Thứ tự `beforeListTable`: chip trước, ô "Trạng thái dịch" sau.
- D10 Nhóm chip:
  - **Dự án**: "Tình trạng mở bán" (`salesStatus`, `Tất cả` + mọi `SALES_STATUSES` theo `SALES_STATUS_LABELS`); "Trạng thái bài" (`status`, `Tất cả` · `Nháp` = draft · `Xuất bản` = published; trạng thái khác chỉ ở `Tất cả`).
  - **Tin tức**, **Tin BĐS**: "Trạng thái bài" như trên; "Danh mục" (`category`, `Tất cả` + danh mục có `scope` đúng loại nội dung — Local API trong slot server, `sort: sortOrder`, tối đa 12 (nhiều hơn → 12 đầu, còn lại qua Lọc nâng cao), quyền người xem (`overrideAccess: false` + `user`), nhãn = `name` locale vi). Không có danh mục → không hiện nhóm. Chip = `category equals <id>` (không gồm danh mục con — hành vi mong đợi).
  - **Tuyển dụng**: "Tình trạng" `Tất cả` · `Đang tuyển` = `status equals published` VÀ `deadline greater_than_equal <đầu ngày hôm nay giờ VN, ISO>` · `Hết hạn` = `deadline less_than <đầu ngày hôm nay>` (replaces `status`+`deadline`). Mốc ngày dùng lại `startOfVietnamDay` (`src/lib/careers/deadline`) — khớp danh sách công khai + job đóng tin; tính lúc render slot server, ổn định trong ngày (F5 cùng ngày chip vẫn sáng); hạn chế qua ngày ghi residual. `deadline` bắt buộc nên không cần nhánh "chưa có hạn".
  - **Hồ sơ ứng tuyển**: "Trạng thái" (`status`, `Tất cả` + mọi `APPLICATION_STATUSES` theo `APPLICATION_STATUS_LABELS`).
  - Lead/Cho thuê không đổi.
- D11 Test: `quick-filters.test.ts` cho nhóm mới (withChip/currentChip, ghép AND với where có sẵn + Lọc dịch); test slot (thùng rác → null; danh mục rỗng → không nhóm; Tuyển dụng dùng mốc ngày VN — tiêm `now`). A11y chip như BL-022 (component sẵn).

## Acceptance
- [ ] Chip ở Dự án (tình trạng mở bán; Nháp/Xuất bản), Tin tức + Tin BĐS (trạng thái; danh mục), Tuyển dụng (Đang tuyển/Hết hạn), Hồ sơ ứng tuyển (trạng thái). Chip Lead/Cho thuê giữ nguyên.
- [ ] Chip ghép bộ lọc/Lọc dịch/tìm kiếm không mất điều kiện; ẩn ở thùng rác + list drawer; 375px không tràn.
- [ ] Không đổi schema/access/endpoint.

## Verify
`pnpm vitest run src/lib/admin src/components/admin src/collections`, `pnpm typecheck`, `pnpm lint`; sinh lại importMap theo lệnh dự án.

## Verification summary (builder)
- Acceptance: chip Dự án (tình trạng mở bán; Nháp/Xuất bản), Tin tức + Tin BĐS (trạng thái; danh mục), Tuyển dụng (Đang tuyển/Hết hạn), Hồ sơ ứng tuyển (trạng thái) — xong, qua 1 slot chung. Lead/Cho thuê không đổi. Ghép where/Lọc dịch/tìm kiếm kiểm bằng unit test (`withChip`/`currentChip`). Ẩn thùng rác = slot trả null; ẩn list drawer = `QuickFilterChips` sẵn. Không đổi schema/access/endpoint. 375px: dùng lại CSS BL-022 (chưa soi bằng app).
- Files: `src/lib/admin/collection-quick-filters.ts` (+test), `src/components/admin/CollectionQuickFilterSlot.tsx` (+test), `src/lib/admin/quick-filters.ts` (export `cond`), `src/collections/{Projects,News,PropertyPosts,JobPostings,JobApplications}.ts` (slot `beforeListTable`; export `SALES_STATUS_LABELS`/`APPLICATION_STATUS_LABELS`), `src/app/(payload)/admin/importMap.js` (+2 dòng, sinh bằng `pnpm generate:importmap`).
- Verify: `pnpm vitest run src/lib/admin src/components/admin src/collections` 43 file / 303 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard).
- Quyết định builder: 1 slot async chung đọc `collectionSlug`; logic nhóm đặt ở file lib mới (không nhét vào `quick-filters.ts` để file client-bundle không kéo import collection/Payload); slot đứng đầu `beforeListTable` nên chạy trước ô "Trạng thái dịch" do `withContentDefaults` append; chip danh mục dùng id dạng chuỗi (khớp vòng URL, tránh falsy); nhãn danh mục `name` locale vi, không fallback.
- Residual: mốc ngày Tuyển dụng tính lúc render slot (qua nửa đêm VN cần tải lại trang); chưa chạy app thật (next dev) để soi 375px/tương tác; danh mục >12 chỉ 12 đầu theo sortOrder.
- Fix MINOR sau r1: query danh mục bọc try/catch (`payload.logger.error`, bỏ nhóm Danh mục, trang không vỡ) + test; bỏ `slice(0, 12)` thừa (giới hạn nằm ở `limit` của truy vấn). MINOR-2 giữ nguyên theo spec. Verify lại: vitest 43 file PASS, typecheck PASS, lint 0 error.
