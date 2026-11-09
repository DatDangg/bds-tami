---
id: homepage-featured-projects-max-hint
type: bug
status: done
created: 2026-11-09
---

# Admin Homepage: "Dự án hiển thị" không ghi giới hạn tối đa 6 (QA bug 32, Thấp)

## Bối cảnh / tái hiện (bug)
- /admin/globals/homepage → trường "Dự án hiển thị"
- Expected: "Tối đa 6 dự án. Để trống thì tự lấy các dự án đánh dấu nổi bật mới nhất."
- Actual: mô tả không nêu giới hạn 6

## Điều tra sơ bộ
`src/globals/Homepage.ts:199` có `maxRows: FEATURED_PROJECTS_MAX` (6) nhưng `admin.description` thiếu. Rà các relationship hasMany có maxRows khác cùng global (vd "Tin ưu đãi hiển thị" — khối hiển thị tối đa FEATURED_OFFERS_MAX) để ghi giới hạn đồng bộ.

## Acceptance (bắt buộc)
- [ ] Mô tả nêu đúng giới hạn; test schema

Nguồn: QA sheet "TAMI – Báo bug" (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4) dòng 32.
