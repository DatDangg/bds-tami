# feature-admin-list-columns-filters-locale · phase-1-task-03 — Chip lọc nhanh Dự án / Tin tức / Tin BĐS / Tuyển dụng / Hồ sơ ứng tuyển (BL-039 #4)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "**Chip lọc nhanh mở rộng (BL-039)**".
- Phụ thuộc: T01, T02 (cùng file collection). Trạng thái: `pending`.

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
