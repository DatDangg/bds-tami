---
id: admin-ux-audit-2
type: feature
status: done
completed: 2026-10-21
created: 2026-10-21
---

# Admin UX — các mục còn lại từ báo cáo audit lần 2

## Yêu cầu
User 2026-10-21 gửi báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` ("xem cái report kia đi"). Đối chiếu code: phần lớn mục chip lọc / cột / Việt hoá / form đã làm ở BL-039…042. Change này chỉ gồm các mục **còn hở**:

| # | Mục (§ report) | Hiện trạng code |
|---|---|---|
| A1 | Ẩn nút/tab **API** ở màn sửa (§2.3.1) | chưa có `hideAPIURL` ở collection/global nào |
| A2 | Tắt **"+ Thêm mới" inline** ở ô quan hệ danh mục nền: Tỉnh/thành, Phường/xã, Người tạo / Sale phụ trách (§2.3.4) | chưa có `allowCreate: false` |
| A3 | Chữ ô upload "Tạo mới hoặc Chọn từ thư viện…" → "Tải lên" (§2.3.5) | chưa ghi đè trong `payload-vi-overrides.ts` |
| A4 | Danh sách: **"Tạo mới" thành nút chính** to (góc phải), "Thùng rác" thành nút phụ (§2.1.3, §4.4) | còn link nhỏ cạnh tiêu đề |
| A5 | Lead: tách **"Xuất Excel"** khỏi hàng chip lọc thành nút hành động riêng (§2.2.1) | `LeadExportSlot` đứng cạnh chip |
| A6 | Thao tác hàng loạt khi chọn dòng: hiện gần bảng (thanh nổi đáy) thay vì text mờ góc trên (§2.1.5) | mặc định Payload |
| A7 | Màn sửa: thanh Lưu luôn thấy khi cuộn + nút Quay lại danh sách + Xem trên website (§2.3.2–3) | cần kiểm tra trình duyệt — Payload 3.91 doc controls có thể đã dính |
| A8 | Dashboard: nút "Tạo loại khác" lệch tỉ lệ so với thẻ thao tác; hàng "Sửa website" trông như tab lọc (§2.4) | BL-041 tạo, cần chỉnh style |
| A9 | Media: xem dạng **lưới ảnh** thay bảng tên tệp UUID (§2.5) | đang bảng `filename/alt/mimeType` |
| A10 | Liên kết menu/trang chủ: chọn trang bằng **dropdown** thay gõ mã `home/projects…` (§2.6.2, `src/fields/nav-link.ts`) | đang ô text + mô tả mã |
| A11 | Dịch AI: gom checkbox "Có bản tiếng Anh" (sidebar) với nút "Dịch lại bằng AI" (tab Bản dịch) cùng một chỗ (§2.3.6) | đang tách 2 nơi |
| A12 | Cột thao tác nhanh trên từng dòng (Xem web / Sửa / Nhân bản / Xoá) (§2.1.4) | chưa có |

## Quyết định của user (2026-10-21)
- **Q1 → A13 (thêm):** "Hiển thị cột" + "Lọc nâng cao" **chỉ hiện cho role `admin`**, ẩn hẳn với `sale` (role hiện có: admin/sale). Giữ lọc trường kỹ thuật của BL-039. **Tách 2 nút ra khỏi viền ô tìm kiếm**: ô tìm chỉ còn kính lúp + text; "Cột" và "Lọc" thành 2 nút phụ/icon button bên phải ô tìm (cạnh Xuất Excel nếu có). Lý do: sale chỉ cần chip lọc nhanh; admin cần đối soát.
- **Q2 → chia 2 giai đoạn.** User nói "Mục 1–7 trước" nhưng mô tả theo nội dung (hideAPIURL, allowCreate, Tạo mới góc phải, Lưu dính) và xếp Bulk bar + Media grid sang giai đoạn 2 → hiểu theo **nội dung**:
  - **Giai đoạn 1 (làm trước):** A1, A2 (ưu tiên cao — chặn rác DB), A3, A4, A5, A7, A13.
  - **Giai đoạn 2 (sau, chờ checkpoint):** A6, A8, A9, A10, A11, A12, A14.
- **Q3 → A14 (thêm, giai đoạn 2):** gom 14 tab global Trang chủ còn 5 tab theo luồng trang:
  1. Đầu trang & Banner (Thanh thông báo + Banner)
  2. Giới thiệu & Uy tín (Giới thiệu + Điểm mạnh + Đối tác)
  3. Sản phẩm & Tin nổi bật (Dự án nổi bật + Cho thuê + Dịch vụ + Ưu đãi + Tin tức)
  4. Chuyển đổi & Bố cục (Mời tư vấn + Thứ tự khối)
  5. SEO & Đa ngôn ngữ (SEO + Bản dịch)
  Trong mỗi tab: mỗi khối là collapsible kèm công tắc "Hiện khối này trên web" (dùng cờ bật/tắt sẵn có nếu có; nếu phải thêm field → migration additive). **Chỉ đổi bố cục admin** — tab Payload không đổi tên field (`tabs` không `name`) → dữ liệu/API giữ nguyên; tab có `name` thì phải giữ path hoặc migration versioned.

## Acceptance (bắt buộc)
- [x] Mỗi mục A được chọn: hành vi như bảng trên, áp dụng mọi collection liên quan, không đổi API/quyền.
- [x] A2 không chặn chọn giá trị có sẵn; admin vẫn tạo Tỉnh/Phường/Nhân viên ở màn riêng.
- [x] A4/A5/A6/A8 kiểm tra sáng/tối, 375px + 1280px.
- [x] A9: lưới có thumbnail, alt/tên dễ đọc, vẫn tìm/lọc/chọn được; drawer chọn ảnh không vỡ.
- [x] A10: giá trị lưu không đổi format (mã trang hoặc URL đầy đủ) → không cần migration dữ liệu; nếu cần thì versioned.
- [x] Test hiện có xanh; mục chạm tuỳ biến Payload ghi rõ gap phiên bản 3.91 nếu không làm được.

## Ghi chú
Ảnh trong report nằm ngoài repo (thư mục antigravity), không cần. Ảnh hưởng: `src/payload.config.ts`, `src/collections/*`, `src/fields/nav-link.ts`, `src/components/admin/**`, `src/lib/admin/payload-vi-overrides.ts`. Nên tách task theo nhóm A.

## Tiến độ (change-request, 2026-10-21)
- **GĐ1 — done** (spec 1.44.0 / test-scope v55): A1 ẩn API (e83a86b) · A2 tắt "+ Thêm mới" inline ô Tỉnh/Phường/Nhân viên (e83a86b; Danh mục giữ nút — spec-validator F1) · A3 "Tải lên" (e83a86b) · A4 Tạo mới nút chính / Thùng rác phụ (b7f762c) · A5 Xuất Excel lên hàng tìm kiếm (b7f762c) · A13 Cột/Lọc chỉ admin + tách khỏi ô tìm (b7f762c) · A7 thanh Lưu nền đặc + Quay lại danh sách + Xem trên website (d641351).
- **GĐ2 — done** (coordinator: làm cùng lượt; spec 1.45.0 / test-scope v56): A6 thanh hàng loạt nổi đáy + A12 cột Thao tác (9f18876) · A9 Media dạng lưới (a336fcf) · A8 Tổng quan (15d2e8b) · A10 ô Liên kết chọn trang (e7641aa) · A11 Dịch AI một chỗ (e2c2473) · A14 Trang chủ 5 tab (6e65c31).
- Không đổi schema/DB/access/API; `payload migrate:create` → "No schema changes detected".
- Phase review: `.context/review-reports/feature-admin-ux-audit-2-phase-review.md` — PASS.
- Gap Payload 3.91: nút upload hard-code `general:createNew` (A3 qua provider); không có slot thanh tìm kiếm (A5 CSS theo DOM nội bộ); `admin.preview` không phù hợp (A7 component riêng); nút Nhân bản/Xoá gốc cần ngữ cảnh form (A12 gọi REST tương đương); ô "Chọn tất cả trên trang" (Media) không có tên đọc; A3/A5/A6/A9/A13 dựa class nội bộ Payload — kiểm lại khi nâng Payload.
- Residual: thanh hàng loạt desktop căn giữa cửa sổ (không trừ sidebar); Media lưới mất sắp xếp theo cột; sale đã lưu cột riêng trước BL-051 không thấy cột Thao tác; `public-doc-url.ts` chép logic `buildPublicWhere` (cập nhật cùng khi thêm hẹn giờ FR-ADM-16); vài tổ hợp sáng/tối × 375/1280 chưa chụp.
