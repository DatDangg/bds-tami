---
id: form-fields-rounded
type: feature
status: done
created: 2026-10-20
---

# Ô nhập form bo góc hài hoà với thẻ/nút

## Yêu cầu
User 2026-10-20 (ảnh form "Nhận thông tin dự án" trong thẻ tư vấn): "xem lại mấy cái phần nhập form có bo góc chưa?". Hiện ô nhập gần như vuông trong khi thẻ bo 28px và nút pill → cần bo góc ô nhập cho đồng bộ.

Hiện trạng (đã đọc code): `src/components/ui/input.tsx:11` và textarea/checkbox (`src/components/ui/checkbox.tsx:17`, textarea trong `src/components/forms/FormField.tsx`) dùng `rounded-sm` = `--radius-sm: 2px` (`src/app/(frontend)/globals.css:99`). `LeadFormSlot` cũng `rounded-sm`.

## Acceptance (bắt buộc)
- [ ] Input, textarea, select của form công khai bo góc rõ (đề xuất `--radius-md` 12px; checkbox bo nhẹ ~4–6px) — agent chốt theo design tokens, không hardcode px.
- [ ] Áp dụng nhất quán mọi form công khai dùng component chung (lead form, ứng tuyển, liên hệ…); focus ring / trạng thái lỗi vẫn theo viền bo.
- [ ] Không đổi admin Payload.
- [ ] Test/snapshot cập nhật.

## Ghi chú
Đổi shared component → blast radius rộng (mọi form). Nếu đổi token `--radius-sm` toàn cục sẽ ảnh hưởng chỗ khác — ưu tiên đổi class ở component.
