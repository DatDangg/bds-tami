---
id: careers-search-scroll-top
type: bug
status: done
created: 2026-10-27
---

# Tuyển dụng: bấm "TÌM" làm trang tải lại và nhảy lên đầu (BL-089)

Nguồn: QA sheet "TAMI – Báo bug" dòng 11 (27/10/2026, mức Trung bình).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/tuyen-dung` · Khách · 1920
- Bước tái hiện: mở Tuyển dụng → cuộn xuống danh sách vị trí → nhập từ khóa vào "Tìm theo tên vị trí..." → bấm "TÌM" → xem vị trí cuộn.
- Expected: danh sách lọc theo từ khóa, trang không tự cuộn về đầu; người dùng vẫn ở khu vực tìm kiếm/kết quả.
- Actual: trang refresh và quay lên đầu; phải cuộn xuống lại mới thấy kết quả.

## Acceptance (bắt buộc)
- [ ] Sau khi bấm TÌM (hoặc Enter), kết quả cập nhật và khu vực tìm kiếm/kết quả vẫn trong khung nhìn (không về đầu trang).
- [ ] URL vẫn giữ tham số tìm kiếm (chia sẻ/tải lại được); không có JS vẫn tìm được (form GET).
- [ ] Bàn phím/screen reader: focus không bị mất sau khi tìm.

## Kiểm tra 2026-10-27
- **Xác nhận là bug**, tái hiện trên staging 1920×1080: cuộn tới ô tìm (scrollY 523) → bấm TÌM → `/tuyen-dung?province=&q=tu+van`, scrollY = 0.
- Nguyên nhân: `JobFilters` dùng `next/form` (`src/components/careers/JobFilters.tsx:36`) mặc định `scroll` = true → điều hướng xong cuộn về đầu trang. Không phải tải lại toàn trang.

## Kết quả 2026-10-28
- Done: `tasks/bug-careers-search-scroll-top/phase-1-task-01.md` — `<Form scroll={false}>` + `JobKeywordInput` (giữ focus khi Enter). NORMAL PASS r1. no spec change (1.59.0) / test-scope v89.
