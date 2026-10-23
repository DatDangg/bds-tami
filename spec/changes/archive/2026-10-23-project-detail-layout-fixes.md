---
id: project-detail-layout-fixes
type: bug
status: done
created: 2026-10-23
---

# Chi tiết dự án: thẻ Sản phẩm co chữ, ảnh khối Tiện ích kéo dài, khối Dự án tương tự không tách biệt

## Yêu cầu
User 2026-10-23 (ảnh chụp staging, dự án The Windsor Collection) báo 3 lỗi giao diện trang chi tiết dự án.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/du-an/<slug>` công khai, desktop ≥ xl (ảnh chụp ~1540px).
- **Lỗi 1 – Thẻ Sản phẩm (khối Tổng quan):** `DetailStatCards columns={3}` (`src/components/projects/ProjectOverview.tsx:66`, `src/components/detail/DetailStatCards.tsx`) dựng 3 cột cố định ở xl trong cột phải hẹp (`minmax(0,9fr)`) → tên loại sản phẩm dài (vd "The Elton – Liền kề, song lập The Royal (CT07)") xuống dòng từng chữ, cắt giữa từ ("Everbloo / m"), thẻ cao kéo dài, "m²" rơi xuống dòng riêng.
  - Expected: thẻ đọc được với tên 3–6 từ; không cắt giữa từ; số lượng + diện tích không vỡ dòng.
  - Actual: thẻ hẹp ~200px, chữ dọc.
  - Đã giảm tạm bằng dữ liệu (rút gọn tên trên staging), nhưng sale nhập tên dài vẫn vỡ.
- **Lỗi 2 – Ảnh khối Tiện ích:** `DetailFeatureList` có `image` (`src/components/detail/DetailFeatureList.tsx:39-40`, dùng ở `ProjectAmenities` khi không mục nào có ảnh riêng) → ảnh bên trái **kéo cao theo độ dài danh sách** (10 tiện ích → ảnh dọc rất cao, bị crop) thay vì giữ tỉ lệ 4:3.
  - Expected: ảnh giữ tỉ lệ (4:3) hoặc dính (sticky) trong khi danh sách cuộn; không phụ thuộc số mục.
  - Actual: ảnh cao ≈ chiều cao danh sách.

- **Lỗi 3 – Khối "Dự án tương tự" không tách biệt:** nền khối (`SimilarCarousel` trong `ProjectAfter`, `src/components/projects/ProjectDetail.tsx:197-211`) cùng màu kem với phần nội dung phía trên → nhìn liền một mảng, không phân biệt được hết nội dung dự án / bắt đầu phần gợi ý.
  - Expected: khối "Dự án tương tự" tách biệt rõ với nội dung chi tiết (khác nền, hoặc có khoảng/viền phân cách theo design tokens).
  - Actual: trùng nền với phần trên.

## Acceptance (bắt buộc)
- [ ] Khối "Dự án tương tự" phân biệt rõ với phần nội dung phía trên (nền/khoảng cách/phân cách theo design tokens), kiểm tra cả light theme ở 375px và 1440px.
- [ ] Thẻ Sản phẩm: tên dài ~45 ký tự hiển thị không cắt giữa từ, không dọc từng chữ ở 1440px và 1920px; 375px/768px vẫn ổn.
- [ ] Ảnh khối Tiện ích giữ tỉ lệ cố định bất kể 3 hay 12 mục (kể cả khi bấm "Khám phá tất cả tiện ích").
- [ ] Kiểm tra lại 3 dự án thật trên staging (Maison Privée, Astor 1, The Windsor Collection) + 1 dự án mẫu.

## Ghi chú
Ảnh chụp lỗi do user gửi trong phiên 2026-10-23. Root cause chưa xác minh (mới đọc code sơ bộ) — xác định khi xử lý `/change`.
