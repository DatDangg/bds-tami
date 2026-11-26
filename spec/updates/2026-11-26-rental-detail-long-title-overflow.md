# Spec Update — 2026-11-26 rental-detail-long-title-overflow

**spec_version:** 1.64.2 → 1.64.3 (PATCH — as-built bug-fix UI BL-125, QA 42)
**Trigger:** bug-fix (BL-125, `bug-rental-detail-long-title-overflow`)
**Requirements:** LÀM RÕ mục chi tiết Dự án / Cho thuê / Tin BĐS trong SPECIFICATIONS.md (tìm "BL-125"): tiêu đề `h1` + dòng địa chỉ của hero (`DetailHeroMosaic`) và mô tả khối (`DetailSection`, vd "Hình ảnh của {tiêu đề}.") tự ngắt dòng với chuỗi dài không khoảng trắng (`break-words [overflow-wrap:anywhere]`): không cắt chữ trong hero, trang không tràn ngang ở 390px.
**Ảnh hưởng:** `src/components/detail/DetailHeroMosaic.tsx`, `src/components/detail/DetailSection.tsx` (+ 2 test). Dùng chung cho chi tiết Cho thuê, Tin BĐS, Dự án. Không API/schema/quyền/migration.
**Không đổi:** tiêu đề có khoảng trắng hiển thị như cũ (desktop không đổi); bố cục/khoảng cách; breadcrumb overlay (đã `truncate`).
**Evidence:** `.context/review-reports/bug-rental-detail-long-title-overflow-phase-1-task-01-round-1-review.md` (STRICT PASS r1). Residual risk: chưa đo `scrollWidth <= 390` bằng trình duyệt thật (không có dev server/Docker), verify theo class + unit test + lập luận CSS.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 124, risk low-medium)
