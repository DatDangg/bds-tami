# Spec Update — 2026-11-26 lead-lost-reason-not-cleared

**spec_version:** 1.64.4 -> 1.64.5 (PATCH — as-built bug-fix BL-127, QA 44)
**Trigger:** bug-fix (BL-127, `bug-lead-lost-reason-not-cleared`)
**Requirements:** LÀM RÕ F9 Lead trong SPECIFICATIONS.md (tìm "BL-127", ngay sau đoạn BR-11): lưu lead có trạng thái kết quả khác `lost` -> `lostReason = null` (form admin, API, sửa hàng loạt); đổi lại "Không thành" -> ô lý do trống, vẫn bắt buộc (BR-11). Không backfill: lead cũ còn lý do tồn đọng được xoá ở lần lưu kế tiếp, xuất Excel vẫn hiện tới lúc đó.
**Ảnh hưởng:** `src/hooks/leads/status-activity.ts` (hook mới `clearLostReasonWhenNotLost`, beforeChange), `src/collections/Leads.ts` (đăng ký hook), `src/hooks/leads/status-activity.test.ts`. Không API shape/schema/quyền/migration.
**Evidence:** `.context/review-reports/bug-lead-lost-reason-not-cleared-phase-1-task-01-round-1-review.md` (STRICT PASS r1).
**Scope sinh:** spec/test-scope/current.json (scopeVersion 126, risk medium)
