---
id: admin-vietnamese-wording
type: feature
status: done
created: 2026-10-20
---

# Admin: rà và sửa chữ tiếng Việt khó hiểu (chữ mặc định Payload + nhãn collection)

## Yêu cầu
User 2026-10-20: "cái dịch trong admin đang không phù hợp, một số cái không hiểu là gì, như Rác, Tệp riêng tư".

Hai nguồn chữ:
1. **Bản dịch tiếng Việt mặc định của Payload** (`@payloadcms/translations/languages/vi`) — `src/payload.config.ts:96` mới ghi đè đúng 1 khoá (`general.noLabel`). Ví dụ lấy từ gói: `trash: 'Rác'` (nút góc phải danh sách), `deletedAt: 'Đã Xóa Lúc'` (viết hoa lẫn), `collections: 'Collections'`, `globals: 'Cấu hình chung (globals)'`, `apiKey: 'API Key'`, `unpublish: 'Ẩn tài liệu'`, `noResults: 'Danh sách rỗng: … dữ kiện …'`, `filterWhere: 'Lọc {{label}} với điều kiện:'`, `searchBy: 'Tìm với {{label}}'`.
2. **Nhãn collection/global của dự án** (`src/lib/admin/collection-labels.ts`) — vd `private-files`: "Tệp riêng tư (CV)" (người dùng không biết là gì), `leads`: "Lead" / "Lead khách hàng" (tiếng Anh), "Thống kê lượt bấm theo ngày", "Chi phí dịch theo tháng".

User 2026-10-20 (bổ sung): "kiểm tra lại hết mấy cái text xem ngữ nghĩa" → phạm vi là **toàn bộ chữ trong admin**, gồm cả nhãn trường, mô tả (`admin.description`), tên tab/nhóm, giá trị select/badge, thông báo/toast, nút tuỳ biến (Xuất Excel, chip lọc, lọc dịch, banner dịch lỗi), dashboard — không chỉ chữ mặc định Payload.

## Acceptance (bắt buộc)
- [x] Rà toàn bộ chữ hiện trên các màn admin (sidebar, dashboard, danh sách, form của **mọi** collection + global, menu cột/bộ lọc, thùng rác, phiên bản, tài khoản, toast) → kiểm **ngữ nghĩa** (đúng nghĩa nghiệp vụ, người không rành kỹ thuật hiểu được, không lẫn tiếng Anh/thuật ngữ dev như "slug", "canonical", "noindex", "globals", "hash") → bảng đề xuất `màn / chữ hiện tại → chữ mới / lý do` cho user duyệt ở checkpoint **trước khi code**.
- [x] Gợi ý mặc định (user chốt): "Rác" → "Thùng rác"; "Đã Xóa Lúc" → "Ngày xoá"; "Collections" → "Danh mục quản lý"; "Tệp riêng tư (CV)" → "File CV ứng viên"; "Lead" → "Khách hàng tiềm năng" hoặc giữ "Lead" nếu đội sale quen dùng.
- [x] Ghi đè chữ Payload qua `i18n.translations.vi` ở `payload.config.ts` (một nơi, có test khoá các chuỗi đã sửa); nhãn dự án sửa ở `collection-labels.ts` (nguồn duy nhất).
- [x] Không đổi slug/schema/URL/access; banner dịch lỗi (`lib/translation/admin-ui.ts`) vẫn đúng nhãn.
- [x] Viết hoa thống nhất (chỉ chữ đầu câu), không lẫn tiếng Anh trừ thuật ngữ user chốt giữ.

## Ghi chú
- Liên quan: BL-015 T02 (việt hoá nhãn), BL-039 (ô "Ngôn ngữ" `vi/en` — xử lý ở BL-039, không trùng).
- Doc impact dự kiến: FR-ADM-19 (nhãn admin) trong spec.
