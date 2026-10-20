---
id: admin-nav-clarity
type: feature
status: in_progress
created: 2026-10-20
---

# Admin điều hướng: sidebar dễ phân biệt nhóm/mục + lối tắt sửa website trên Tổng quan

## Yêu cầu
User 2026-10-20 (ảnh sidebar, đăng nhập admin):

1. **Sidebar khó phân biệt** — nhóm 7 nhóm của BL-015 T03 (`src/components/admin/admin-groups.ts`):
   - Tiêu đề nhóm ("Khách hàng", "Nội dung"…) chữ nhỏ xám, mục con chữ to đậm đen → mắt đọc mục con trước, nhóm chìm; nhóm đang mở/đóng gần như giống nhau (chỉ khác mũi tên mảnh).
   - Không có khoảng/vạch ngăn rõ giữa các nhóm; mục con không thụt lề so với nhóm.
   - Mục đang chọn ("Trang chủ") chỉ nền be rất nhạt — khó thấy đang ở đâu.
   - Không có icon (Payload 3.91 không cho icon qua config — chốt design Q4 BL-015; có thể làm bằng CSS/`Nav` tuỳ biến nếu cần).
2. **Tổng quan thiếu lối tắt sửa website** — mục Trang chủ / Menu đầu trang / Chân trang / Cấu hình chung chỉ có ở thẻ "Website" cuối trang (`NavGroupCards`, phải cuộn qua "Lead mới nhất" + "Bài của bạn") → user tưởng không có. Kiểm local 2026-10-20: link `/admin/globals/homepage` có, chỉ bị chìm.

### Bổ sung 2026-10-21 (user duyệt ghép từ `docs/reviews/2026-10-21-admin-audit.md` §1, §2)
3. **Sidebar quá nhiều mục kỹ thuật** (khi đăng nhập admin): Tệp CV ứng viên (mở ra chỉ thấy mã, bấm file 404 — CV đã tải ở Hồ sơ ứng tuyển), Lịch sử chăm sóc (đã có trong form Lead), Tỉnh/Phường, Nhật ký thao tác, Lượt bấm liên hệ, Thống kê liên hệ theo ngày, Chi phí dịch tự động.
4. **Khối "Mục quản lý"** (`NavGroupCards`) lặp lại y hệt sidebar, chiếm gần nửa Tổng quan.
5. **Không có nút xem website** công khai sau khi sửa bài.
6. **Banner dịch lỗi** (`TranslationFailedBanner`) đỏ chiếm cả chiều ngang → nhân viên tưởng hệ thống sập.
7. **Nút "＋ Tạo mới ▾"** nhỏ ở góc — thao tác hay dùng nhất bị giấu trong dropdown.

## Acceptance (bắt buộc)
- [ ] Sidebar: tiêu đề nhóm và mục con phân cấp rõ (cỡ/độ đậm/màu/viết hoa hoặc thụt lề — design đề xuất, user duyệt ảnh trước/sau); có khoảng/vạch ngăn nhóm; trạng thái mở/đóng nhóm dễ nhận; mục đang chọn nổi rõ (nền + vạch màu nhấn TAMI), đạt tương phản AA sáng **và** tối.
- [ ] Hover/focus bàn phím mục sidebar thấy rõ; 375px menu thu gọn vẫn dùng được.
- [ ] Tổng quan: hàng lối tắt "Sửa website" ngay đầu trang (dưới lời chào/cạnh "Tạo mới") gồm Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung — chỉ hiện với role admin (cùng quy tắc `hideFromNonAdmin`).
- [ ] **Bỏ khối "Mục quản lý"** (`NavGroupCards`) khỏi Tổng quan (quyết định user 2026-10-21, thay cho "giữ nguyên thẻ nhóm cuối trang"); cập nhật test dashboard tương ứng.
- [ ] Sidebar: **ẩn** Tệp CV ứng viên (`private-files`) và Lịch sử chăm sóc (`lead-activities`) khỏi menu — **trước khi chốt ẩn `lead-activities` phải thử** ô Lịch sử chăm sóc trong form Lead (xem/thêm) vẫn chạy; hỏng → không ẩn, đưa vào nhóm "Nâng cao". Không xoá collection, không đổi access/API.
- [ ] Sidebar: Tỉnh/thành, Phường/xã, Nhật ký thao tác, Lượt bấm liên hệ, Thống kê liên hệ theo ngày, Chi phí dịch tự động dồn vào nhóm **"Nâng cao"** cuối sidebar, **mặc định thu gọn**; quyền xem giữ nguyên (bảng chỉ-admin vẫn chỉ admin thấy).
- [ ] Header admin có nút **"Xem website"** (icon mở tab mới) trỏ trang chủ công khai (lấy URL site từ cấu hình, không hardcode domain).
- [ ] Banner dịch lỗi: đổi sang mức cảnh báo nhẹ (màu vàng/viền), câu chữ trấn an ("N bài chưa dịch được sang tiếng Anh — bản tiếng Việt vẫn hiển thị bình thường") + link xem danh sách; vẫn chỉ hiện khi N > 0.
- [ ] Đổi "＋ Tạo mới ▾" thành hàng thẻ thao tác nhanh lớn ở đầu Tổng quan: "Đăng tin cho thuê mới", "Phân công lead (N chưa giao)" (link danh sách lead lọc chưa giao), "Viết tin tức" — theo quyền role; vẫn giữ đường tạo các loại còn lại (dropdown phụ hoặc link nhỏ).
- [ ] Đổi thứ tự/nhóm sidebar chỉ ở phạm vi trên; không đổi schema/access; chỉ config `admin.group`/`admin.hidden` + CSS + component admin. Ảnh trước/sau desktop 1440 + 375, sáng/tối.

## Ghi chú
- Liên quan: BL-015 T03/T04 (sidebar 7 nhóm, dashboard), BL-040 (tên mục/nhóm có thể đổi chữ — làm BL-040 trước hoặc cùng đợt để chụp ảnh một lần).
- BL-043: Lượt bấm liên hệ / Nhật ký thao tác **vẫn hiện** (trong nhóm "Nâng cao") nên BL-043 làm như cũ.
- Chưa kiểm: `admin.hidden` của Payload 3.91 có chặn luôn route admin của collection không — agent kiểm trước khi dùng (nếu chặn thì `lead-activities` chỉ được ẩn bằng cách khác hoặc để nhóm "Nâng cao").
- Hoãn (chưa BL): Ctrl+K tìm nhanh, phễu lead / biểu đồ lượt bấm / chi phí dịch trên Tổng quan — xem `docs/reviews/2026-10-21-admin-audit.md`.

## Xử lý (change-request, 2026-10-21 — auto proceed theo chỉ thị user)
- Classification: **MODIFY** (FR-ADM-19). Spec delta: câu "Điều hướng rõ (BL-041)" + "Tổng quan (BL-041)".
- Task: `tasks/feature-admin-nav-clarity/phase-1-task-01.md` (sidebar + Nâng cao + ẩn mục + Xem website) · `phase-1-task-02.md` (Tổng quan + banner).
- Quyết định tự xử lý (chi tiết + lý do trong task file): D1 ẩn `private-files`/`lead-activities` bằng `admin.hidden: true` (Payload 3.91 chặn route list/doc nhưng drawer mặc định `overrideEntityVisibility=true` → join Lịch sử chăm sóc trong form Lead vẫn chạy; thử thực tế, hỏng thì chuyển "Nâng cao"); D2 thành phần nhóm "Nâng cao"; D3 thu gọn mặc định bằng ghi preference nav một lần; D4 phân cấp thị giác do agent chốt (không chờ duyệt ảnh); D5 "Xem website" theo `NEXT_PUBLIC_SITE_URL`; D6–D7 thẻ thao tác nhanh (phân công lead chỉ admin) + "Tạo loại khác"; D8 Sửa website chỉ admin; D9 bỏ "Mục quản lý"; D10 banner warning `role=status`; D11 bố cục.
