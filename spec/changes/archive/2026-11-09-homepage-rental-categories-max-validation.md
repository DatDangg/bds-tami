---
id: homepage-rental-categories-max-validation
type: bug
status: done
created: 2026-11-09
---

# Admin Homepage: "Danh mục cho thuê hiển thị" chọn được quá 4, không viền đỏ (QA bug 33)

## Bối cảnh / tái hiện (bug)
- /admin/globals/homepage → Cho thuê → "Danh mục cho thuê hiển thị", chọn 5 danh mục
- Expected: không cho vượt 4, báo lỗi tại trường + viền đỏ, không lưu
- Actual: chỉ toast chung "Trường sau chưa hợp lệ: …", vẫn chọn tiếp được, trường không đỏ

## Điều tra sơ bộ
`validateRentalCategories` (`src/globals/homepage/blocks.ts:51`) `return true` khi `event === "onChange"` → bỏ cả kiểm `maxRows` lúc đang chọn. Hướng: kiểm số lượng (đồng bộ, rẻ) cả onChange → "Tối đa 4 danh mục." + đỏ ngay; truy vấn DB (scope rental) giữ ở lúc lưu. Không viết component riêng để khoá chọn (Payload không hỗ trợ sẵn) trừ khi rẻ.

## Acceptance (bắt buộc)
- [ ] Chọn mục thứ 5 → lỗi tại trường + viền đỏ; lưu bị chặn
- [ ] Test hồi quy

Nguồn: QA sheet "TAMI – Báo bug" (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4) dòng 33.
