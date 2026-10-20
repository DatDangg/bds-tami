Agent: spec-validator

# Phase review — feature-admin-raw-slug-columns · phase 1 (BL-043) · round 1

- Mode: Phase review (delta check + build check, D4: một lần, change 1 task, LOW risk)
- Input: worktree `claude/admin-bl039-043`, uncommitted diff + untracked files
- Reviewer report: `.context/review-reports/feature-admin-raw-slug-columns-phase-1-task-01-round-1-review.md` (PASS)
- Commands: chỉ `git diff` + Read/Grep (không chạy test/build theo chỉ thị)

## Verdict: ✅ COMPLETE (có 1 điểm cần user quyết, không chặn)

## (a) Spec delta ↔ change doc ↔ task decisions

| Requirement | Source | Status | Note |
|---|---|---|---|
| Slug → tên tiếng Việt từ `collection-labels.ts` (nguồn duy nhất) | change doc AC1; SPEC FR-ADM-19 "Cột loại dữ liệu (BL-043)" | ✅ | Delta ghi rõ "lấy từ `collection-labels.ts`" |
| Dùng số ít | task D1; delta "tên tiếng Việt số ít" | ✅ | Delta khớp D1 |
| Danh sách + màn chi tiết | change doc AC1 "và màn chi tiết nếu hiện"; delta "cả ở danh sách lẫn màn chi tiết" | ✅ | D3 (mô tả dưới ô read-only) không trái delta |
| Mã lạ giữ nguyên, trống `—` | AC1 + AC4; delta | ✅ | |
| Lọc/sắp xếp theo giá trị gốc; select option tiếng Việt nếu có | AC2; D2 | ✅ | D2: field `text` → ô lọc chữ, không có select; delta ghi "(ô lọc là ô chữ, nhập mã gốc)" — giải thích rõ nhánh "nếu có select" không áp dụng |
| Xuất/API không đổi, không đổi schema/DB | AC3; delta | ✅ | |
| Test cell: biết/lạ/rỗng | AC4 | ✅ | |
| Phạm vi 3 collection (audit-logs, click-events, click-stats-daily) | change doc "có thể cả click-stats-daily"; delta nêu cả 3 | ✅ | |

Không thấy contradiction giữa delta và change doc / D1–D4.

## (b) Delta ↔ implementation

| Requirement | Implementation | Status | Note |
|---|---|---|---|
| Helper slug → singular, lạ giữ, rỗng/không chuỗi `—` | `src/lib/admin/collection-labels.ts` `collectionDisplayName` (dùng `Object.hasOwn`, an toàn prototype) | ✅ | Test `collection-labels.test.ts` (rentals, job-applications, old-collection, constructor, null/undefined/""/5/{}) |
| Ô danh sách | `src/components/admin/CollectionNameCell.tsx` (bọc `LinkedCell`) | ✅ | Test `CollectionNameCell.test.tsx` biết/lạ/rỗng |
| Màn chi tiết | `src/components/admin/CollectionNameHint.tsx` (Description, `useField`) "Tên gọi: …"; rỗng → không render | ✅ | Ô nhập vẫn mã gốc (D3). Residual: chưa kiểm trực quan trên trình duyệt (builder ghi nhận) |
| Gắn vào AuditLogs.collection | `src/collections/AuditLogs.ts:61` `admin.components.Cell` + `Description` | ✅ | name/type/label giữ nguyên |
| Gắn vào ClickEvents.refCollection | `src/collections/ClickEvents.ts:35` | ✅ | |
| Gắn vào ClickStatsDaily.refCollection | `src/collections/ClickStatsDaily.ts:36` | ✅ | `NO_REF = ""` (`src/lib/click-stats/aggregate.ts:11`) → ô hiện `—`, Hint ẩn — đúng "trống → —" |
| importMap | `src/app/(payload)/admin/importMap.js` thêm 2 entry đúng path | ✅ | |
| Không đổi schema/API/export | diff chỉ `admin.components`; không migration, không endpoint | ✅ | |
| Giá trị `refCollection` hợp lệ đều có nhãn | `CLICK_REF_COLLECTIONS` (`src/lib/click-stats/click-types.ts:13`) — enum ở endpoint public, toàn slug collection trong `ADMIN_COLLECTION_LABELS` | ✅ | |

## (c) Không xung đột với quy tắc FR-ADM-19 khác

| Rule | Status | Note |
|---|---|---|
| "Nhãn collection/global chỉ ở `collection-labels.ts`" | ✅ | Helper đọc `ADMIN_COLLECTION_LABELS`, không lặp chuỗi nhãn ở component. Chữ "Tên gọi:" là chữ UI, không phải nhãn collection |
| "Không đổi schema/DB, access control, không thêm endpoint" | ✅ | |
| Ô trống `—` (BL-021) | ✅ | Thống nhất |
| Ngữ nghĩa chữ BL-040 (không lộ thuật ngữ dev) | ✅ | Đây chính là mục tiêu của delta |

## Gaps

- [PARTIAL — advisory, cần user quyết, KHÔNG chặn] **Slug global trong Nhật ký thao tác vẫn hiện mã thô.**
  `src/endpoints/admin/retranslate.ts:106-111` ghi `collection: slug` với `slug = id` khi dịch lại global
  (vd `site-settings`, `homepage`, `header`, `footer`). `collectionDisplayName` chỉ tra `ADMIN_COLLECTION_LABELS`,
  nên các dòng này hiện nguyên mã (vd `site-settings`) dù `collection-labels.ts` đã có `ADMIN_GLOBAL_LABELS`
  ("Cấu hình chung"…). Theo câu chữ delta ("tên tiếng Việt số ít" + "mã lạ hiện nguyên") đây vẫn **đúng spec**
  (global không có singular; được xử lý như mã lạ), nhưng lệch tinh thần change doc ("người dùng không hiểu mã thô").
  Đề xuất: user quyết có mở rộng helper tra cả `ADMIN_GLOBAL_LABELS` (sửa nhỏ, cần cập nhật delta) hay giữ nguyên.
  Liên quan: task `tasks/feature-admin-raw-slug-columns/phase-1-task-01.md` Scope 1.

## Residual risk

- Description dưới ô read-only ở màn chi tiết chưa kiểm trực quan (đã có unit test với `useField` mock).
- Không chạy lại verify command (chỉ thị read-only); dựa vào Verification summary builder + reviewer PASS.
