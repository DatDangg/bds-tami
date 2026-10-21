Agent: reviewer

# Review — feature-admin-list-columns-filters-locale · phase-1-task-03 · round-1

- Review level: **STRICT**
- Reason: slot server gọi Local API `categories` theo quyền người xem; chip ghi vào `where` URL ghép với Lọc dịch/bộ lọc tay/tìm kiếm; đụng 5 collection config + importMap (shared admin list).
- Blast radius: `src/lib/admin/collection-quick-filters.ts` (mới), `src/components/admin/CollectionQuickFilterSlot.tsx` (mới), `src/lib/admin/quick-filters.ts` (chỉ export `cond`), `src/collections/{Projects,News,PropertyPosts,JobPostings,JobApplications}.ts` (thêm `beforeListTable`; export `SALES_STATUS_LABELS`/`APPLICATION_STATUS_LABELS`), `src/app/(payload)/admin/importMap.js` (+2 dòng). Danh sách admin 5 collection. Lead/Cho thuê/BL-041 không bị chạm.

## Verify commands + result
- `pnpm vitest run src/lib/admin src/components/admin src/collections src/lib/careers` → 46 files / 323 tests PASS.
- `pnpm typecheck` → PASS (tsc --noEmit, 0 lỗi).
- `pnpm lint` → 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope).

## Kiểm theo trọng tâm
1. **D9–D11 / FR-ADM-19 "Chip lọc nhanh mở rộng" / BL-022** — OK. 1 slot chung theo `collectionSlug`; nhóm: Dự án (salesStatus đủ 3 giá trị từ `SALES_STATUSES`/`SALES_STATUS_LABELS` + Nháp/Xuất bản), Tin tức/Tin BĐS (Trạng thái bài + Danh mục), Tuyển dụng (Đang tuyển/Hết hạn), Hồ sơ ứng tuyển (5 trạng thái). Mỗi nhóm có `allLabel: "Tất cả"`; ghép từng nhánh OR qua `withChip`/`currentChip` có sẵn; test chứng minh giữ `hasEnglish` + tìm kiếm, đổi chip thay chứ không cộng dồn, bỏ chọn xoá. Giá trị chip đều là chuỗi không falsy (`String(doc.id)` khớp vòng URL qs).
2. **Local API danh mục** — OK. `overrideAccess: false` + `user` từ `BeforeListTableServerProps`; `where: { scope: { equals } }` với giá trị thật `"news"` / `"property_post"` (khớp `CATEGORY_SCOPES` trong `src/hooks/categories/scope-collections.ts:3`); `sort: "sortOrder"`, `limit: 12`, `depth: 0`, `locale: "vi"`, `fallbackLocale: false`; 1 query/render, không N+1. `categories.read = readUnlessTrashed` → không ném Forbidden; danh mục ở thùng rác bị loại mặc định. Thiếu bọc lỗi — xem MINOR-1.
3. **Tuyển dụng** — OK. `startOfVietnamDay(now)` = 00:00 VN (UTC−7h). `deadline` dayOnly lưu `YYYY-MM-DDT12:00:00Z` (= 19:00 VN cùng ngày) → bài hạn hôm nay `>= 17:00Z hôm trước` → "Đang tuyển"; hạn hôm qua `12:00Z < 17:00Z` → "Hết hạn". Cùng biểu thức với danh sách công khai (`src/lib/careers/job-queries.ts:72`). `fields: ["status","deadline"]` → cả 2 chip thay status+deadline (test có).
4. **Thứ tự/ẩn** — OK. Slot đặt trước, `withContentDefaults` append `TranslationStatusFilter` sau (`content-defaults.ts:173`), test khoá index 0. Thùng rác → `null` (segments[2]); drawer do `QuickFilterChips` tự ẩn. `quick-filters.ts` (client bundle) không import collection/Payload server — logic nhóm nằm ở file lib mới chỉ slot server dùng. importMap đúng path/export.
5. **Không đổi schema/access/endpoint** — OK (chỉ `admin.components` + export hằng nhãn). BL-041 không bị chạm.

## Responsive Checklist Gate (diff đụng UI qua slot; CSS dùng lại BL-022, không đổi CSS)
- Layout/không tràn ngang: OK — `.quick-filter-chips__scroller { flex-wrap: nowrap; overflow-x: auto; max-width: 100% }`, `__group { min-width: 0; max-width: 100% }` (`_lists.scss:240-263`); 12 chip danh mục cuộn ngang trong nhóm.
- Grid auto-fit/minmax: N/A (flex).
- Typography rem/clamp: N/A — không đổi CSS trong diff (px có sẵn từ BL-022, ngoài scope).
- Media: N/A.
- Touch target ≥44px: OK — `__chip { min-height: 44px }`.
- Nav mobile / table wrapper: N/A.
- 100vh / reduced-motion / overflow hidden: N/A (không thêm).
- Residual: chưa soi app thật ở 375/768/1280 (không có browser trong quyền reviewer); xác minh bằng CSS.

## Skill gates
- aislop: skip, không nằm trong verify commands được allow.
- oxlint (anti-slop): skip, oxlint not configured trong profile; `pnpm lint` 0 error.
- ocr (open-code-review): skip, ocr not installed/không trong allow-list.
- AI-readable: OK — tên rõ, hàm < 50 dòng, file ~112 dòng, hằng `MAX_CATEGORY_CHIPS`/`TRASH_SEGMENT_INDEX` có tên, comment nêu WHY; 0 indicator đáng kể.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không có môi trường; không endpoint mới, access không nâng).

## Findings
- **[MINOR-1]** `src/lib/admin/collection-quick-filters.ts:62-73` — `payload.find` danh mục không bọc try/catch; lỗi query ném lên làm vỡ cả view danh sách Tin tức/Tin BĐS. Rủi ro thực tế thấp (cùng DB với truy vấn danh sách chính) nhưng nên suy giảm êm: bọc try/catch, `payload.logger.error(...)`, trả `undefined` (chỉ còn nhóm Trạng thái bài) + 1 test.
- **[MINOR-2]** `collection-quick-filters.ts:64` — lấy cả danh mục con (chỉ lọc `scope`), hiển thị phẳng theo `sortOrder`, nhãn không có ngữ cảnh cha; spec không cấm. Nếu có danh mục con cùng tên ở 2 nhánh sẽ khó phân biệt — cân nhắc `parent: { exists: false }` hoặc ghi rõ hành vi trong spec ở task sau.
- **[MINOR-3]** `collection-quick-filters.ts:79` — `docs.slice(0, MAX_CATEGORY_CHIPS)` thừa khi đã `limit: 12` (phòng thủ, vô hại).
- Residual: mốc ngày Tuyển dụng tính lúc render (qua nửa đêm VN cần tải lại; chip cũ trên URL sẽ không sáng ngày hôm sau) — đã ghi trong task; 375px chưa soi app thật.

## Verdict
✅ **PASS** — không CRITICAL/MAJOR; 3 MINOR không chặn.
