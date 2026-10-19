# Spec Update — 2026-10-19 list-page-banner-image

**spec_version:** 1.11.0 → 1.12.0 (MINOR — thêm requirement FR-ADM-20; schema thêm field mới, không đổi quyền/API)

**Trigger:** feature-update (Change Request ADDITIVE, BL-017) — change doc `spec/changes/2026-10-19-list-page-banner-image.md`, task `tasks/feature-list-page-banner-image/phase-1-task-01.md`

**Nguồn:** đầu các trang danh sách chỉ có chữ trên nền kem (`PageBanner` biến thể Chữ), nhìn trống so với trang con vinhomes.vn. User chốt (2026-10-19): admin upload ảnh banner cho từng trang danh sách trong Cài đặt website; trang chưa có ảnh dùng một ảnh mặc định chung; chưa có cả ảnh chung thì giữ biến thể Chữ.

**Requirements:**
- THÊM **FR-ADM-20 — Ảnh banner trang danh sách** vào **F10** trong `SPECIFICATIONS.md` (header F10 thêm "20"):
  - Global `site-settings` (Cài đặt website) có nhóm "Ảnh banner trang danh sách": 1 ảnh **mặc định** + 1 ảnh riêng cho Dự án (`/du-an`), Cho thuê (`/cho-thue`), Đăng tin BĐS (`/tin-bds`), Tin tức (`/tin-tuc`), Tuyển dụng (`/tuyen-dung`) — upload từ `media`, nhãn tiếng Việt, chỉ admin sửa, **không localized** (VI và EN cùng ảnh).
  - Hiển thị: có ảnh riêng → biến thể Ảnh; không có → ảnh mặc định; không có cả hai → biến thể Chữ như cũ. Trang danh mục con (`/<loại>/danh-muc/[category]`) dùng ảnh của trang danh sách cha.
  - Biến thể Ảnh: scrim để chữ trắng (tiêu đề + mô tả) đạt AA kể cả trên ảnh rất sáng; ảnh `priority` (LCP); khung cao cố định, không CLS.
  - Ngoài phạm vi (BL-020): banner thấp ~240px, băng tìm kiếm dưới banner, header trong suốt trên banner ảnh. Trang Liên hệ và chi tiết dịch vụ không dùng nhóm ảnh này.
- Liên quan (không đổi chữ): **FR-PUB-02/04/06/08/09** (các trang danh sách + danh mục con công khai), **NFR-07** (responsive, WCAG/AA).

**Intent docs đã sửa (change-request):** `.context/design-spec.md` §2.7 + §6.3 (pageBanners đã làm, bỏ contact), `docs/DESIGN.md` (dòng "pageBanners làm ở BL-017").

**Code dự kiến (builder chốt):**
- `src/globals/SiteSettings.ts` (group `pageBanners`, tab nhãn VI)
- `migrations/<mới>` (vd `site_settings_page_banners`: `.ts` + `.json` + `migrations/index.ts`)
- `src/payload-types.ts` (regenerate)
- `src/lib/content/page-banner.ts` + unit test (`resolvePageBanner`: riêng → mặc định → không có; id chưa populate = không có)
- `src/components/layout/PageBanner.tsx` (scrim riêng banner đạt AA, không đổi `--color-overlay` toàn cục) + test contrast
- `src/components/projects/ProjectListPage.tsx`, `src/components/rentals/RentalListPage.tsx`, `src/components/posts/PostListPage.tsx`, `src/components/news/NewsListPage.tsx`, `src/components/careers/JobListPage.tsx` (đọc `getSiteSettings`, lỗi → warn + biến thể Chữ)

**Schema:** `site-settings` thêm group `pageBanners` gồm 6 upload → `media` (`default`, `projects`, `rentals`, `propertyPosts`, `news`, `careers`), không localized → **migration additive** (chỉ `ADD COLUMN ..._id` nullable + FK `ON DELETE SET NULL` + index trên `site_settings`; không DROP/đổi type/NOT NULL/backfill — không HIGH_RISK).
**API/Access:** không đổi (kế thừa quyền global: đọc công khai, chỉ admin sửa).

**Ảnh hưởng:**
- Admin › Cài đặt website: nhóm ảnh banner mới; lưu/đọc global.
- Trang danh sách + danh mục con VI/EN: Dự án, Cho thuê, Đăng tin BĐS, Tin tức, Tuyển dụng — biến thể Ảnh/fallback/Chữ.
- Retest: biến thể Chữ khi không có ảnh (watermark, mô tả danh mục), header/hero trang chủ không đổi (scrim hero giữ token cũ), ISR/dynamic của route giữ nguyên, site-settings lỗi → trang không 500.

**Docs as-built dự kiến (builder):** `docs/ERD.md` §4.15 `site-settings` thêm `pageBanners` + migration; `docs/ARCHITECTURE.md` nếu có mục liên quan. `docs/API_SPEC.md`: no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 13
