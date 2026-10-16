# Spec Update — 2026-10-16 lam-ro-spec-validation-r1

**spec_version:** 1.2.0 → 1.2.1 (PATCH — làm rõ, không thêm tính năng; chưa có code)
**BRD:** v1.5 (chỉ sửa câu chữ vai trò Sale ở §1.4, user duyệt 16/10/2026)

**Nguồn:** `.context/review-reports/spec-validation-round-1.md` (round 1, FAIL); round 2 PASS: `.context/review-reports/spec-validation.md` trong `/start` bước 1.

**Quyết định của user:**
- B2: Sale tạo/sửa dự án, cho thuê, Đăng tin BĐS, tin tức, tuyển dụng; **Dịch vụ và trang pháp lý chỉ admin** (khớp ma trận `docs/PERMISSION.md` §3.1)
- B4: nút tìm kiếm trên header dẫn tới `/cho-thue?q=`; giai đoạn 1 không có tìm kiếm toàn site

**Thay đổi:**
- THÊM mục `Non-functional Requirements` (NFR-01…10, LGL-01…04) trong `SPECIFICATIONS.md`
- THÊM định nghĩa collection `pages` (`kind` = `privacy` | `terms`, route cố định, không `author`/`slug`) ở `docs/ERD.md` §4.9b
- THÊM mức ưu tiên Must/Should/Could, mục `Quy tắc biên` (⚠️ giả định), mục `Câu hỏi mở` (Q1, Q4–Q7, tên miền)
- LÀM RÕ: chi tiết F2/F3/F4/F9/F10/F12 theo tiêu chí BRD (phân trang, thư viện ảnh, chặn xoá danh mục, ảnh ≤ 10MB, EN ≤ 10 phút, lọc trạng thái dịch, publish ≤ 1 phút, BR-11/13/14)
- LÀM RÕ: một đường phân công lead duy nhất (hook `leads.afterChange`), audit log thống nhất (`content.purge`, `staff.reset_password`), `rentals.searchText` localized, ký hiệu `U` của slug
- Stack: thêm bản đồ (OSM + MapLibre) và analytics (GA4 + Search Console)

**Docs đã cập nhật:** `SPECIFICATIONS.md`, `BRIEF.md`, `docs/BRD.md` §1.4, `docs/PERMISSION.md`, `docs/ERD.md`, `docs/API_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/INDEX.md`

**Scope sinh:** chưa sinh — dự án chưa có code
