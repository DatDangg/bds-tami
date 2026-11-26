---
id: job-posting-duplicate-slug-date
type: bug
status: done
created: 2026-11-26
---

# Admin Tuyển dụng: "Tạo bản sao" giữ slug cũ và ngày xuất bản cũ — QA 43

## Yêu cầu
Bản sao tin tuyển dụng phải có slug sinh theo tiêu đề mới và ngày xuất bản mới (không sớm hơn ngày tạo).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Admin, 1920 — Admin › Tuyển dụng › nút "…" → Tạo bản sao.
- Bước: tạo bản sao → đổi tiêu đề → Lưu.
- Expected: slug mới theo tiêu đề mới; ngày xuất bản mới.
- Actual: tin "Giám đốc" vẫn mang slug `truong-nhom-kinh-doanh-da-dong-3`; ngày xuất bản 18/10 sớm hơn ngày tạo 28/10. Ảnh: bug43.png.

## Acceptance (bắt buộc)
- [ ] Bản sao: slug được reset để sinh lại từ tiêu đề (khi lưu với tiêu đề mới → slug theo tiêu đề mới, vẫn đảm bảo unique)
- [ ] Bản sao: ngày xuất bản reset (rỗng/hiện tại theo quy tắc collection), không giữ ngày bản gốc; trạng thái/các field hệ thống (hạn nộp đã đóng, đếm…) xem xét reset hợp lý
- [ ] Kiểm các collection khác có slug + Tạo bản sao (news, projects, rentals…) — nếu cùng lỗi, sửa chung một chỗ
- [ ] Test

## Ghi chú
Nguồn: QA sheet dòng 43 (20/11/2026, Thấp).
