---
id: lead-form-name-validation
type: bug
status: done
created: 2026-11-17
---

# Form tư vấn chấp nhận họ tên có ký tự đặc biệt hoặc toàn số — QA 38 + 39

## Yêu cầu
Kiểm định dạng họ tên ở form gửi yêu cầu tư vấn (client + server): không nhận ký tự đặc biệt không hợp lệ, không nhận tên toàn số; báo lỗi ngay dưới ô và không gửi form.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Khách — form "Gửi yêu cầu tư vấn" (LeadForm), 1920.
- QA 38: họ tên "Nguyễn @An#" + SĐT hợp lệ + tích đồng ý → Gửi → **được chấp nhận** (expected: báo lỗi tại ô).
- QA 39: họ tên "090777123" → Gửi → **được chấp nhận** (expected: báo lỗi, không gửi).

## Acceptance (bắt buộc)
- [x] Luật họ tên được user chốt trước khi code (đề xuất: chữ cái mọi ngôn ngữ kể cả dấu tiếng Việt, khoảng trắng, `'`, `-`, `.`; không số, không ký tự đặc biệt khác; trim, gộp khoảng trắng)
- [x] Cùng luật ở client và API `POST /api/public/leads` (không lách được bằng gọi thẳng API)
- [x] Lỗi tiếng Việt / tiếng Anh theo locale, dưới ô họ tên
- [x] Kiểm các form dùng chung LeadForm (liên hệ, chi tiết dự án/tin, tin tức…) và form ứng tuyển nếu cùng trường
- [x] Test hồi quy (tên hợp lệ có dấu vẫn qua)

## Ghi chú
2 dòng QA cùng root cause → 1 task. Nguồn: QA sheet dòng 38, 39 (16/11/2026, Thấp).
