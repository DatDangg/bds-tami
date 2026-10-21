Agent: spec-validator

# Spec validation (pre-plan) — feature-admin-ux-audit-2 (BL-051, MODIFY), giai đoạn 1 — round-2

- Round 1: `.context/review-reports/feature-admin-ux-audit-2-spec-validation.md` (FAIL, F1–F3 MEDIUM, F4–F5 LOW, F6 info).
- Ghi file riêng cho round-2 (quy tắc: không gộp nhiều vòng vào một file).
- Re-checked: `SPECIFICATIONS.md:132` (đoạn BL-051), `tasks/feature-admin-ux-audit-2/phase-1-task-01.md`; grep `phase-1-task-02.md`.

## Verdict: ✅ PASS (không còn ⚠️ MEDIUM; còn 1 LOW không chặn)

## Đối chiếu fix

| Finding R1 | Fix | Evidence | Status |
|---|---|---|---|
| F1 `categories` trong A2 | Bỏ khỏi delta và T01; Danh mục được liệt kê vào nhóm "giữ nút thêm nhanh" | SPEC:132 (A2) "Ô quan hệ khác (Danh mục, Chủ đầu tư, …) giữ nút"; T01:13, 17, 27, 29 ("3 slug"), 34 (Quyết định) | ✅ Đã giải quyết — khớp change doc A2 + acceptance |
| F2 A3 với BL-040 "MỘT nơi" | Ngoại lệ hẹp: chuỗi "Tải lên" khai trong `payload-vi-overrides.ts` (có test), một thành phần nhỏ áp riêng cho nút upload | SPEC:132 (A3); T01:23 | ✅ Đã giải quyết — có tuyên bố ngoại lệ, chuỗi vẫn ở một nơi |
| F3 sale mất "Lọc nâng cao" (danh mục > 12 chip, lọc tay "Sale phụ trách") | Ghi "Hệ quả chấp nhận (Q1)"; thay câu "còn lại lọc qua Lọc nâng cao" đối với sale | SPEC:132 (A13) | ✅ Đã giải quyết |
| F4 vị trí "Trạng thái dịch" | Giữ ở hàng thanh công cụ dưới hàng tìm kiếm, cạnh chip; vẫn hiện khi 0 kết quả | SPEC:132 (A13) | ✅ Spec · xem R2-1 cho task |
| F5 nhãn nút | Giữ "Hiển thị cột" / "Lọc nâng cao"; màn hẹp chỉ còn icon, kèm tên đọc đầy đủ | SPEC:132 (A13) | ✅ Spec · xem R2-1 cho task |
| F6 vị trí thanh Lưu | Không đổi (dính đỉnh) | — | ✅ Chấp nhận (info) |

Kiểm lại chéo: các ràng buộc (không đổi schema/DB/access/API, không migration) vẫn nguyên; câu GĐ2 vẫn nguyên; không thấy mâu thuẫn mới với FR-ADM-19 (BL-039/BL-040/BL-042/BL-050).

## Findings còn lại

**R2-1 — LOW (không chặn) — T02 chưa phản ánh các mệnh đề A13 mới thêm**
- Grep `phase-1-task-02.md` không thấy các mệnh đề sau:
  - "Trạng thái dịch" vẫn ở hàng thanh công cụ và vẫn hiện khi lọc ra 0 kết quả;
  - nhãn giữ "Hiển thị cột" / "Lọc nâng cao", màn hẹp chỉ còn icon kèm tên đọc đầy đủ;
  - hệ quả với sale.
- Spec đã đủ nên reviewer vẫn đối chiếu được.
- Khuyến nghị: thêm 1–2 dòng acceptance vào T02 để builder kiểm:
  - 0 kết quả vẫn thấy ô lọc dịch;
  - `aria-label` của nút khi chỉ còn icon;
  - test khoá chuỗi "Lọc nâng cao" vẫn xanh.

## Residual risk (giữ từ R1)
- Chưa xác minh `admin.allowCreate`, `hideAPIURL`, slot của document controls trong Payload 3.91 (T01/T03 giao builder kiểm).
