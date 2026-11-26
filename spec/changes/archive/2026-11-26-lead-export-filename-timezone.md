---
id: lead-export-filename-timezone
type: bug
status: done
created: 2026-11-26
---

# Admin Lead Xuất Excel: tên file theo giờ UTC thay vì giờ Việt Nam — QA 45

## Yêu cầu
Tên file xuất Excel dùng giờ Việt Nam (Asia/Ho_Chi_Minh).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Admin, 1920 — Admin › Lead › Xuất Excel.
- Bước: bấm Xuất Excel lúc 00:23 ngày 20/11 (giờ VN).
- Expected: `tami-leads-202611200023.xlsx`.
- Actual: `tami-leads-202611191723.xlsx` (UTC).

## Acceptance (bắt buộc)
- [ ] Timestamp tên file format theo Asia/Ho_Chi_Minh, độc lập TZ server
- [ ] Kiểm các ngày/giờ trong nội dung file export (cột createdAt…) có cùng lỗi không — nếu có, ghi rõ/sửa cùng
- [ ] Test với thời điểm qua nửa đêm (UTC 17:23 → VN 00:23 hôm sau)

## Ghi chú
Nguồn: QA sheet dòng 45 (20/11/2026, Thấp).
