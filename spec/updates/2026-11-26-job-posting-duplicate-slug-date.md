# Spec Update — 2026-11-26 job-posting-duplicate-slug-date

**spec_version:** 1.64.5 -> 1.64.6 (PATCH — as-built bug-fix BL-128, QA 43)
**Trigger:** bug-fix (BL-128, `bug-job-posting-duplicate-slug-date`)
**Requirements:** LÀM RÕ F12 trong SPECIFICATIONS.md (tìm "BL-128", ngay trước bullet `hasEnglish`; BR-05 slug): "Tạo bản sao" ở news / projects / rentals / property-posts / job-postings / services / developers -> bản sao `draft` + `publishedAt` trống (lần xuất bản đầu đóng dấu ngày mới; cả bản hẹn giờ Tin tức). Slug của bản chưa từng công khai (status draft/hidden VÀ publishedAt trống), slug lưu đúng bằng `slugify(title)` hoặc dạng `-N` và không bị người dùng sửa -> theo tiêu đề mới khi lưu (unique bằng hậu tố; cả API cập nhật một phần chỉ đổi tiêu đề). Bản published/rented/đã từng xuất bản hoặc slug sửa tay giữ slug (URL ổn định).
**Ảnh hưởng:** `src/fields/status.ts`, `src/fields/published-at.ts`, `src/fields/slug.ts`, `src/fields/slug.test.ts`, `src/fields/published-at.test.ts`, `src/fields/status.test.ts`. Không API shape/schema/quyền/migration.
**Evidence:** `.context/review-reports/bug-job-posting-duplicate-slug-date-phase-1-task-01-round-1-review.md` (FAIL r1), `...-round-2-review.md` (STRICT PASS r2).
**Scope sinh:** spec/test-scope/current.json (scopeVersion 127, risk medium)
