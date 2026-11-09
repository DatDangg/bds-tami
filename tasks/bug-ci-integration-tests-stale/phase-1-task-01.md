# bug-ci-integration-tests-stale · phase-1-task-01 — CI đỏ: 6 test integration lỗi thời sau BL-110 / BL-109

- Trạng thái: `done` — reviewer FAST PASS r1 (`.context/review-reports/bug-ci-integration-tests-stale-phase-1-task-01-round-1-review.md`); no doc impact (test-only).
- Nguồn: CI run 42590116192 (commit 2a6f47da) FAIL → Deploy staging skipped.

## Classification / Risk
- BUG (test-only). Risk: LOW — chỉ sửa test, KHÔNG đổi source. Review: FAST/NORMAL.

## Root cause
1. BL-110 (75e1eb69) cố ý bỏ `legacyNames` (tên phường cũ) khỏi `searchText` + đổi tên cũ không reindex; builder chỉ chạy unit nên 5 test integration còn kỳ vọng hành vi cũ:
   - `tests/integration/rental-search.test.ts:246` "khớp tên cũ của phường, mã tin và từ trong địa chỉ; nhiều từ là AND"
   - `tests/integration/rental-search.test.ts:541` "đổi tên cũ của phường làm mới searchText … tìm được ngay"
   - `tests/integration/rentals.test.ts` "vi: mã + tiêu đề + địa chỉ + phường + tỉnh + tên phường cũ + tên dự án…"
   - `tests/integration/rentals.test.ts` "tìm bằng tên phường cũ (searchText chứa legacyNames[].name)"
   - `tests/integration/rentals.test.ts` "mỗi ngôn ngữ có searchText riêng…; đổi phường/địa chỉ ở vi làm mới cả bản en" (~:443)
2. BL-109 (497402e0): `tests/integration/site-settings-social-links.test.ts:91` "nhiều dòng 'Khác' khác link -> lưu được" fail `ValidationError: Thông tin công ty > Tên website` (siteName required) — fixture thiếu trường bắt buộc / phụ thuộc thứ tự test.

## Việc
- Cập nhật test theo hành vi hiện hành (BL-110: searchText KHÔNG chứa tên cũ, tìm tên cũ KHÔNG ra; đổi tên cũ KHÔNG ghi lại searchText). Giữ phần assert còn đúng (mã, địa chỉ, AND nhiều từ…). Không hạ assert vô lý.
- Social links: fixture đủ trường bắt buộc (siteName) để test đúng mục tiêu.
- KHÔNG sửa `src/`.

## Verify
- Chạy integration của 3 file trên (lệnh theo `.context/project-config.md`) PASS; typecheck + lint PASS.

## Acceptance
- [x] 6 test PASS, không đổi source; CI xanh sau push.
