---
id: bathrooms-filter
type: feature
status: done
created: 2026-11-02
---

# Bộ lọc số phòng tắm — Cho thuê + Tin BĐS (QA sheet 30/10 dòng 23)

## Yêu cầu
ADDITIVE: thêm tiêu chí lọc **số phòng tắm** vào bộ lọc `/cho-thue` (QA yêu cầu) và `/tin-bds` (cùng dữ liệu, tránh QA báo lại).
Dữ liệu đã có: trường `bathrooms` ở `src/collections/Rentals.ts:212` và `src/collections/PropertyPosts.ts`; hiện chưa có tham số lọc (`src/lib/search/url-params.ts:38`, `src/lib/posts/post-filters.ts`).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/cho-thue` (VI, Khách) → mở Bộ lọc.
- Expected: có tiêu chí số phòng tắm.
- Actual: chỉ có số phòng ngủ.

## Acceptance (bắt buộc)
- [x] `/cho-thue` và `/tin-bds` có ô lọc số phòng tắm, cùng kiểu và cùng giá trị với ô phòng ngủ của trang đó (1/2/3/4+; 4 = từ 4 trở lên).
- [x] Tham số URL `bathrooms` đọc/ghi giống `bedrooms` (sai giá trị thì bỏ qua), có chip bộ lọc đang bật + nút xoá, giữ khi phân trang/đổi sort.
- [x] Lọc đúng trên dữ liệu; tin không nhập số phòng tắm không khớp khi đang lọc.
- [x] Nhãn VI/EN đủ; responsive như các ô lọc hiện có.
- [x] Test cho parse URL + điều kiện lọc; cập nhật API_SPEC (tham số mới) + design-spec nếu có mô tả bộ lọc.

## Ghi chú
Không cần migration (cột đã có). Có thể cân nhắc index nếu planner cần — builder đánh giá.
