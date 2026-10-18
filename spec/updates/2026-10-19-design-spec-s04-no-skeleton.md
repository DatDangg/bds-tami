# Spec Update — 2026-10-19 design-spec-s04-no-skeleton

**spec_version:** 1.4.0 → 1.4.1 (PATCH — làm rõ intent trạng thái chờ ở trang danh sách cho khớp ràng buộc kỹ thuật và hành vi đã có; không thêm requirement)

**Trigger:** feature-update (Change Request MODIFY, BL-011) — change doc `spec/changes/archive/2026-10-19-design-spec-s04-no-skeleton.md`, task `tasks/feature-design-spec-s04-no-skeleton/phase-1-task-01.md`

**Nguồn:** gap L10-T04 (`tasks/tami-website/layer-10-task-04.md`) + L9-T08 round 1 M1 (`loading.tsx` cấp route làm `notFound()` vượt số trang thành soft-404 HTTP 200). User DUYỆT sửa intent 2026-10-19. Intent ghi vào `.context/design-spec.md`.

**Requirements:**
- SỬA **design-spec §3.2** (Loading skeleton): bỏ "Dùng `loading.tsx` của route + `Suspense` cho lưới" → **cấm** `loading.tsx` cấp route cho trang danh sách `force-dynamic` (kể cả thư mục cha) vì gây soft-404; lưới danh sách dùng phản hồi chờ như S04; skeleton chỉ dùng cho `Suspense` cục bộ của khối con.
- SỬA **design-spec S04** (`/cho-thue`) States: "Đổi bộ lọc/trang/chip: giữ kết quả cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route".
- SỬA **design-spec S02** (`/du-an`), **S08** (`/tin-bds`), **S10** (`/tin-tuc`) States: "skeleton" → phản hồi chờ như S04.
- Liên quan (không đổi chữ): **FR-PUB-02, FR-PUB-04, FR-PUB-06, FR-PUB-08, FR-PUB-09** (trang danh sách dự án, cho thuê, Đăng tin BĐS, tin tức, tuyển dụng).

**Code:** không đổi — đã khớp từ L10-T04: `src/components/layout/PendingRegion.tsx` (`PendingRegion`, `PendingLink`), `src/components/rentals/RentalListPage.tsx`, `src/components/templates/CategoryListTemplate.tsx`; test chặn `src/app/(frontend)/[locale]/list-no-loading.test.ts`.

**Schema/API:** không đổi.

**Ảnh hưởng:**
- Trang danh sách: `/cho-thue`, `/cho-thue/danh-muc/*`, `/du-an`, `/tin-tuc` (+ danh mục), `/tin-bds` (+ danh mục), `/tuyen-dung` (và `/en` tương ứng).
- Retest: trạng thái chờ khi đổi bộ lọc/trang/chip; `?page` vượt → HTTP 404 thật (không soft-404).

**Gap ghi nhận (không đổi intent):** S03 (`/du-an/[slug]`) và S07 (`/cho-thue/[slug]`) còn ghi skeleton trang chi tiết, code chưa có — chờ user chốt.

**Docs đã cập nhật:** `.context/design-spec.md` §3.2, S02, S04, S08, S10; `SPECIFICATIONS.md` (version). As-built: no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 4
