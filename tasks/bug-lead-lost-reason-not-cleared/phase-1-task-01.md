# bug-lead-lost-reason-not-cleared · phase-1-task-01 — Lead rời trạng thái "Không thành" vẫn giữ lý do (BL-127)

- Change doc: `spec/changes/2026-11-26-lead-lost-reason-not-cleared.md` (BACKLOG BL-127, QA 44, Thấp).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/bug-lead-lost-reason-not-cleared-phase-1-task-01-round-1-review.md`); 2 MINOR (ERD §lostReason — đã cập nhật lúc close-out; chỉ unit test, chưa test DB thật). Spec 1.64.5 / scope v126.

## Classification / Risk
- Type: **BUG** (batch BL-125→129 user duyệt + auto proceed 2026-11-26; quyết định: xoá ở hook server-side).
- Severity: low.
- Risk: **MEDIUM** — hook collection `leads` (dữ liệu khách, Sale được sửa `status` + `lostReason`); ghi đè dữ liệu (xoá lý do) khi lưu. Không schema/migration.
- Expected review level: STRICT (hook ghi dữ liệu lead, quyền Sale).
- Doc impact dự kiến: ERD/PERMISSION không đổi field; SPECIFICATIONS as-built PATCH (BR-11 bổ sung "rời lost → xoá lý do").

## Root cause (đã xác định từ code)
- `src/collections/Leads.ts:103-112` — field `lostReason`: chỉ có `validate` (bắt buộc khi `status === "lost"`) và `admin.condition` ẩn ô khi status ≠ lost. Không có gì xoá giá trị khi status rời `lost`.
- `src/collections/Leads.ts:261` — `beforeChange: [stampLeadTimestamps, stampAssignedAt]`; `stampLeadTimestamps` (`src/hooks/leads/status-activity.ts:11-18`) chỉ đóng dấu thời gian, không đụng `lostReason`.
- → Đổi `lost` → `new`: ô bị ẩn nhưng giá trị cũ vẫn nằm trong form/DB; đổi lại `lost` ô hiện lại với lý do cũ. API/bulk edit cũng vậy. Export Excel (`src/endpoints/admin/leads-export.ts:46/81`) xuất luôn lý do cũ của lead không còn "Không thành".

## Thiết kế fix
- Thêm hook `beforeChange` (server-side) cho `leads`, vd `clearLostReasonWhenNotLost` cạnh `stampLeadTimestamps` trong `src/hooks/leads/status-activity.ts` (file này KHÔNG bẩn sẵn) — đăng ký ở `Leads.ts:261`.
- Logic: trạng thái sau khi lưu = `data.status ?? originalDoc?.status`; nếu ≠ `"lost"` → `lostReason = null` (cả khi `data` không gửi `lostReason` nhưng `originalDoc` còn lý do — update một phần qua API vẫn phải xoá). Status = `lost` → giữ nguyên (validate cũ vẫn bắt buộc nhập).
- Create (`operation === "create"`) cũng áp dụng (lead tạo với status ≠ lost không mang lý do).
- Không đổi validate, admin condition, activity `status_change` (`recordStatusChange` đọc `doc.lostReason` chỉ khi lost).
- Không backfill dữ liệu cũ (lead đang có lý do cũ được xoá ở lần lưu kế tiếp) → ghi Residual; nếu builder thấy cần migration data thì DỪNG, ghi lại để hỏi user, không tự làm.
- KHÔNG đụng `src/hooks/leads/on-assignment-change.ts` (đang có thay đổi chưa commit ngoài scope).

## Files
- Sửa: `src/hooks/leads/status-activity.ts`, `src/collections/Leads.ts`. Mới: `src/hooks/leads/status-activity.test.ts`.
- Test: unit test hook (vd `src/hooks/leads/status-activity.test.ts` mới hoặc thêm vào test có sẵn) — create/update, partial update, lost giữ lý do, rời lost xoá lý do, bulk (hook chạy theo từng doc — test logic hook là đủ).
- KHÔNG đụng: file bẩn có sẵn ngoài scope, `.context/runs/*`.

## Acceptance
- [ ] Lưu lead với status ≠ "Không thành" → `lostReason` = null ở DB (UI, API, bulk edit — đều qua hook collection).
- [ ] Update một phần chỉ gửi `status` (≠ lost) → lý do cũ bị xoá.
- [ ] Đổi lại "Không thành" → ô lý do trống, vẫn bắt buộc nhập (validate cũ).
- [ ] Status vẫn `lost`, sửa field khác → lý do giữ nguyên.
- [ ] Test hook FAIL trước / PASS sau.
- [ ] `pnpm vitest run src/hooks/leads src/collections`, `pnpm typecheck`, eslint file đổi PASS.

## Verification Plan
- Test-first unit test hook với `data`/`originalDoc`/`operation` giả.
- Integration DB (nếu có) skip — không có Docker.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: Admin › Lead › chi tiết: Không thành + lý do → Lưu → Mới → Lưu → bấm lại Không thành: lý do cũ còn.
- Expected: lý do bị xoá khi rời Không thành.
- Actual before fix: không có hook nào xoá `lostReason`; test hook mới (6 case) FAIL (hook chưa tồn tại) — lý do cũ còn khi rời Không thành.
- Actual after fix: hook `clearLostReasonWhenNotLost` đặt `lostReason = null` khi trạng thái sau lưu ≠ lost (create, update đầy đủ, update một phần); vẫn lost giữ nguyên.
- Evidence: `src/hooks/leads/status-activity.test.ts` 6/6 PASS; `vitest run src/hooks/leads src/collections` 130/130; typecheck + eslint sạch. Field `lostReason` không có `access` riêng nên Sale vẫn ghi được null do hook. Integration DB skip (no Docker).
- Status: PASS

## Residual risk
- Không backfill: lead cũ đã có lý do thừa chỉ được dọn ở lần lưu kế tiếp (export Excel vẫn xuất lý do cũ đến lúc đó). Chưa chạy integration DB. Reviewer điền thêm nếu có.

## Doc / Decision Impact
- ERD §4.11 / BR-11: bổ sung câu "rời `lost` → hệ thống xoá `lostReason`" nếu ERD mô tả field (as-built, builder kiểm `docs/ERD.md` — file đang bẩn sẵn: KHÔNG sửa, ghi vào report để close-out xử lý). SPECIFICATIONS as-built PATCH qua spec-publisher.
