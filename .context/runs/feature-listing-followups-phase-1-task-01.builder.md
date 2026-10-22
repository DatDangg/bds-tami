# Builder summary — feature/listing-followups · phase-1-task-01 (BL-055 C-1 + C-4)

- 2026-10-22 · attempt 1 · status: DONE (chờ reviewer) · KHÔNG commit.
- Đã làm: helper `src/lib/content/legacy-category.ts` (`legacyCategoryOnly`); `permanentRedirect` trong `PostListPage.tsx` (`loadPostListData`) và `RentalListPage.tsx` (`redirectLegacyCategoryOnly`) khi URL chỉ có `?category=<slug thật>`; `parsePriceRange` `/du-an` coi `priceMax=0` là không giới hạn trên; chú thích metadata 2 màn; `docs/API_SPEC.md` §3.9/§3.10/§3.11.
- Test: TDD (3 test mới fail trước, pass sau) — `legacy-category.test.ts` (mới), `PostListPage.test.tsx`, `RentalListPage.test.tsx`, `project-filters.test.ts`.
- Verify: typecheck PASS · lint scope 0 lỗi (`.local-seed/*` đỏ sẵn) · test 419 file/4389 PASS · build PASS · curl dev server :3000: 308 thật cho `/tin-bds?category=tin-bds`, `/cho-thue?category=can-ho-dich-vu`, 200 khi kèm tham số / slug lạ.
- Còn dở: không. Residual: `/en` chưa curl thật (DB local không có danh mục EN; unit test có). Chi tiết ở § Verification summary của task file.
