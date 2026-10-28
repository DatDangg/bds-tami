---
id: projects-category-breadcrumb-title
type: feature
status: done
created: 2026-10-27
---

# Dự án: trang danh mục riêng `/du-an/danh-muc/<slug>` — breadcrumb + tiêu đề theo danh mục (BL-090)

Nguồn: QA sheet "TAMI – Báo bug" dòng 12 (27/10/2026, mức Trung bình, ảnh bug11.png).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/du-an?category=...` (vd `?category=tami-phan-phoi`) · Khách · 1920
- Bước tái hiện: mở Dự án → lần lượt chọn "Căn hộ chung cư", "Khu đô thị", "Nhà phố, biệt thự", "Nghỉ dưỡng" → xem breadcrumb trên banner và tiêu đề chính dưới breadcrumb.
- Expected: breadcrumb và tiêu đề chính phản ánh đúng danh mục đang chọn, cập nhật mỗi lần đổi danh mục.
- Actual: breadcrumb và tiêu đề không hiển thị đúng danh mục đã chọn (giữ nội dung chung/danh mục khác).

## Quyết định user (2026-10-27)
Chọn **cách B**: mỗi danh mục dự án có trang riêng như S05 (Cho thuê / Tin BĐS / Tin tức), không chỉ đổi chữ trên trang lọc.

## Acceptance (bắt buộc)
- [x] Route mới `/du-an/danh-muc/[category]` · `/en/projects/category/[category]` (khai `src/i18n/routing.ts`), dùng lại danh sách dự án với danh mục khoá (gồm danh mục con nếu có).
- [x] Trang danh mục: `<title>` "<Tên danh mục> – Dự án | TAMI", breadcrumb Trang chủ › Dự án › <Danh mục cha nếu có> › <Danh mục>, H1 = tên danh mục, mô tả `categories.description` nếu có; VI/EN đúng tên theo ngôn ngữ.
- [x] Tab danh mục trên `/du-an` link sang URL mới, tab đang xem `aria-current`; "Tất cả" về `/du-an`. Bộ lọc / sắp xếp / phân trang / ô tìm `q` giữ danh mục.
- [x] Link cũ `/du-an?category=<slug>` → **308** sang trang danh mục (giữ tham số khác nếu có — đối chiếu cách `/tin-bds` BL-055 khi làm). Slug lạ → bỏ, không lỗi.
- [x] `/du-an/danh-muc/<slug-không-tồn-tại>` → 404.
- [x] Sitemap có các trang danh mục dự án (VI/EN), canonical + hreflang đúng.
- [x] Dự án không thể có slug `danh-muc` (và bản EN tương ứng) — không đè `/du-an/[slug]`.
- [x] Spec delta (design-spec S05 thêm Dự án, DESIGN.md, API_SPEC) + spec-publish.

## Ghi chú
Còn hỏi user: "TAMI phân phối" là danh mục loại hình hay nhãn — chưa trả lời thì mặc định coi là danh mục (đang là tab cùng hàng). Dùng chung cách làm với `/cho-thue/danh-muc/[category]`.

## Kiểm tra 2026-10-27
- QA mô tả **đúng hiện trạng**: `/du-an`, `?category=can-ho-chung-cu|khu-do-thi|nha-pho-biet-thu|nghi-duong|tami-phan-phoi` đều có title "Dự án | TAMI", breadcrumb "Trang chủ › Dự án", H1 "Dự án đang phân phối". Danh sách vẫn lọc đúng và tab danh mục đang chọn có `aria-current`.
- Nhưng đây là **đúng thiết kế hiện tại, không phải lỗi code**: Dự án không có trang danh mục riêng (design-spec S05 chỉ có Cho thuê / Tin BĐS / Tin tức); `?category=` của `/du-an` chỉ là bộ lọc trên cùng trang (DESIGN.md "Danh sách dự án", BL-052) → hero/breadcrumb giữ của `/du-an`, giống `/tin-bds?category=` kèm tham số khác (API_SPEC).
- → Phân loại lại **MODIFY** (đổi thiết kế): cần user chốt có làm không — chỉ đổi tiêu đề/breadcrumb/title theo danh mục, hay làm hẳn trang danh mục dự án `/du-an/danh-muc/<slug>` như S05.

## Kết quả (2026-10-28)
- Done — cách B: task `tasks/feature-projects-category-page/phase-1-task-01.md`, STRICT PASS r1 (`.context/review-reports/feature-projects-category-page-phase-1-task-01-round-1-review.md`), spec-validation post-build PASS (`.context/review-reports/feature-projects-category-page-phase-1-validation.md`). Spec 1.60.0 / test-scope v91 (v90 archive). Dự án `?category=` cũ 308 luôn (giữ mọi tham số khác) — Decision 11. "TAMI phân phối" mặc định coi là danh mục (câu hỏi user vẫn mở). Residual: kiểm read-only slug dự án `danh-muc`/`category` trên staging/prod trước deploy.
