---
id: lead-lost-reason-not-cleared
type: bug
status: done
created: 2026-11-26
---

# Admin Lead: lý do "Không thành" không bị xoá khi đổi trạng thái khác — QA 44

## Yêu cầu
Khi lead rời trạng thái "Không thành", lý do không thành phải được xoá.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Admin, 1920 — Admin › Lead › chi tiết lead.
- Bước: 1) đổi trạng thái sang "Không thành", nhập lý do → Lưu 2) đổi về "Mới" → Lưu 3) bấm lại "Không thành" xem lý do.
- Expected: lý do không thành bị xoá khi lead không còn ở "Không thành".
- Actual: lead ở "Mới" vẫn giữ lý do không thành cũ.

## Acceptance (bắt buộc)
- [ ] Lưu lead với status ≠ "Không thành" → trường lý do (và các trường phụ thuộc nếu có) = rỗng ở DB
- [ ] Áp dụng cả khi đổi qua API/bulk edit (hook server-side), không chỉ UI
- [ ] Đổi lại "Không thành" → ô lý do trống, vẫn bắt buộc nhập như cũ
- [ ] Test hook

## Ghi chú
Nguồn: QA sheet dòng 44 (20/11/2026, Thấp).
