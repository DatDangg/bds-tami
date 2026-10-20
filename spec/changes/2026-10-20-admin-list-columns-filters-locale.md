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

### Bổ sung 2026-10-21 (user duyệt ghép từ `docs/reviews/2026-10-21-admin-audit.md`)
4. **Cách lọc vẫn kiểu dựng truy vấn** — "Thêm bộ lọc" bắt chọn trường → toán tử → giá trị → ghép Và/Hoặc; chữ đã tiếng Việt (BL-040) nhưng nhân viên văn phòng vẫn khó dùng. Chip lọc nhanh (`QuickFilterChips.tsx`) mới có ở **Lead** và **Cho thuê**.
5. **Thiếu cột nghiệp vụ** — Dự án không thấy quy mô/giá, Cho thuê không thấy số PN/diện tích/dự án → phải mở từng bài.
6. **Ô tìm kiếm** không nói rõ đang tìm theo gì.

## Acceptance (bắt buộc)
- [ ] "Hiển thị cột" ở mọi collection admin chỉ còn trường nghiệp vụ; trường SEO, bản dịch tiếng Anh (`translation.*`), hash/timestamp kỹ thuật, richText/textarea dài, `deletedAt` không nằm trong menu (`admin.disableListColumn` hoặc helper chung tương tự `list-filter.ts`). Cột mặc định đang hiện không đổi.
- [ ] "Thêm bộ lọc" ở mọi collection admin (không chỉ 5 màn BL-021) chỉ còn trường nghiệp vụ; test kiểu `src/lib/admin/list-filter.test.ts` phủ thêm các collection mới áp.
- [ ] Ô chọn ngôn ngữ hiện "Tiếng Việt" / "English" (nhãn cả trên nút lẫn danh sách xổ); danh sách xổ không che nút "Rác"/"Tạo mới"; desktop + 375px.
- [ ] Chip lọc nhanh (dùng lại `QuickFilterChips`) thêm cho: **Dự án** (tình trạng mở bán; Nháp/Xuất bản), **Tin tức** + **Tin BĐS** (trạng thái; danh mục), **Tuyển dụng** (Đang tuyển / Hết hạn), **Hồ sơ ứng tuyển** (trạng thái hồ sơ). Chip của Lead/Cho thuê giữ nguyên.
- [ ] Nút "Bộ lọc" đổi chữ thành **"Lọc nâng cao"**, đặt sau hàng chip (người dùng thường chỉ cần chip).
- [ ] Ô tìm kiếm mỗi màn có chữ gợi ý nói rõ tìm theo gì (vd Lead: "Tìm theo tên, SĐT, mã lead…"; Cho thuê: "Tìm theo tiêu đề, mã tin CT-…") — khớp `listSearchableFields` thực tế.
- [ ] Cột mặc định thêm: **Dự án** — Quy mô (số căn) + Khoảng giá; **Cho thuê** — "2 PN · 75 m²" + Tên dự án. Ô hiển thị dạng tóm tắt, rỗng → `—`.
- [ ] Chụp ảnh danh sách hiện tại (cột/bộ lọc/chip) để user duyệt ở checkpoint trước khi code.
- [ ] Không đổi schema/DB, không đổi access; lọc dịch, chip lọc nhanh, xuất Excel (BL-021/022) vẫn chạy.

## Ghi chú
- Mặc định đề xuất (cần user xác nhận khi `/change`): danh sách trường được giữ cho từng collection do agent đề xuất theo nghiệp vụ, user duyệt ở checkpoint.
- Liên quan: BL-015 (UI admin), BL-021 T4/T6, BL-016 T02 (`TranslationStatusFilter`).
- Nguồn bổ sung: `docs/reviews/2026-10-21-admin-audit.md` §4.1, §5.1 (+ trao đổi user 2026-10-21 về bộ lọc).
