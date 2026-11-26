# Spec Update — 2026-11-26 lead-export-filename-timezone

**spec_version:** 1.64.6 -> 1.64.7 (PATCH — as-built bug-fix BL-129, QA 45)
**Trigger:** bug-fix (BL-129, `bug-lead-export-filename-timezone`)
**Requirements:** LÀM RÕ F9 trong SPECIFICATIONS.md (tìm "BL-129", ngay sau đoạn BL-127): tên file xuất Excel Lead (`GET /api/admin/leads/export`, `tami-leads-YYYYMMDDHHmm.xlsx`) và Bản tin (`GET /api/admin/newsletter-subscribers/export`, `tami-ban-tin-YYYYMMDDHHmm.xlsx`) dùng mốc giờ Asia/Ho_Chi_Minh, độc lập TZ server (vd 2026-11-19T17:23Z -> 202611200023). Cột ngày/giờ trong nội dung file đã là giờ VN, không đổi.
**Ảnh hưởng:** `src/lib/export/file-stamp.ts` (mới, `exportFileStamp`), `src/lib/export/file-stamp.test.ts`, `src/lib/format.ts` (export TIME_ZONE), `src/endpoints/admin/leads-export.ts`, `src/endpoints/admin/newsletter-export.ts` và 2 test tương ứng. Không API shape/schema/quyền/migration.
**Evidence:** `.context/review-reports/bug-lead-export-filename-timezone-phase-1-task-01-round-1-review.md` (STRICT PASS r1).
**Scope sinh:** spec/test-scope/current.json (scopeVersion 128, risk low)
