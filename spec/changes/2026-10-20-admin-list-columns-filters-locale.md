---
id: admin-list-columns-filters-locale
type: feature
status: pending
created: 2026-10-20
---

# Admin danh sách: gọn "Hiển thị cột" + "Bộ lọc" cho mọi màn, ô "Ngôn ngữ" dễ đọc

## Yêu cầu
User 2026-10-20 (ảnh màn `/admin/collections/job-postings`):

1. **Hiển thị cột** — menu chọn cột liệt kê cả trường kỹ thuật: `SEO > …` (meta title/description, OG image, noindex, canonical), `Bản dịch tiếng Anh > …` (Nguồn bản tiếng Anh, Bản Việt đã đổi sau khi sửa tay, Dấu nội dung nguồn đã dịch, Dịch lúc, Mô hình AI, Lỗi gần nhất, Dịch lại bằng AI), `ID`, `Đường dẫn (slug)`, `Có bản tiếng Anh`, `Đã Xóa Lúc`, các trường richText/textarea dài (Mô tả công việc, Yêu cầu ứng viên, Quyền lợi). Chưa BL nào xử lý — BL-021 T4 chỉ làm "Thêm bộ lọc".
2. **Bộ lọc ("Thêm bộ lọc")** — BL-021 T4 (`src/lib/admin/list-filter.ts`) chỉ áp cho rentals / projects / property-posts / news / leads. Các màn còn lại (Tuyển dụng `JobPostings`, Hồ sơ ứng tuyển, Trang `Pages`, Dịch vụ, Chủ đầu tư, Danh mục, Tỉnh/Phường, Media, Staff, Audit log…) vẫn hiện trường kỹ thuật → áp cùng quy tắc.
3. **Ô "Ngôn ngữ: vi"** (góc phải header danh sách/form) — hiện mã thô `vi` / `en`; xổ xuống đè chữ "Rác". Đổi nhãn thành "Tiếng Việt" / "English" (`localization.locales` có `label`), sửa vị trí/z-index không đè nút "Rác".

## Acceptance (bắt buộc)
- [ ] "Hiển thị cột" ở mọi collection admin chỉ còn trường nghiệp vụ; trường SEO, bản dịch tiếng Anh (`translation.*`), hash/timestamp kỹ thuật, richText/textarea dài, `deletedAt` không nằm trong menu (`admin.disableListColumn` hoặc helper chung tương tự `list-filter.ts`). Cột mặc định đang hiện không đổi.
- [ ] "Thêm bộ lọc" ở mọi collection admin (không chỉ 5 màn BL-021) chỉ còn trường nghiệp vụ; test kiểu `src/lib/admin/list-filter.test.ts` phủ thêm các collection mới áp.
- [ ] Ô chọn ngôn ngữ hiện "Tiếng Việt" / "English" (nhãn cả trên nút lẫn danh sách xổ); danh sách xổ không che nút "Rác"/"Tạo mới"; desktop + 375px.
- [ ] Không đổi schema/DB, không đổi access; lọc dịch, chip lọc nhanh, xuất Excel (BL-021/022) vẫn chạy.

## Ghi chú
- Mặc định đề xuất (cần user xác nhận khi `/change`): danh sách trường được giữ cho từng collection do agent đề xuất theo nghiệp vụ, user duyệt ở checkpoint.
- Liên quan: BL-015 (UI admin), BL-021 T4/T6, BL-016 T02 (`TranslationStatusFilter`).
