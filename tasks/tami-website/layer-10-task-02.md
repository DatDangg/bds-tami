# Task 02: Admin dịch: nút "Dịch lại bằng AI", lọc trạng thái dịch, duyệt bản EN trang pháp lý, cảnh báo lỗi dịch

## Layer
10 — Tích hợp: form lead, admin dịch, hoàn thiện bản EN

Checkpoint: ⏸ **Mốc M2** — dừng chờ user duyệt sau layer này (Tính năng Must xong (website VI/EN, lead, tuyển dụng, tự dịch) — staging sớm đã chạy từ L6)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — endpoint admin + BOLA + gửi dữ liệu ra ngoài
- Blast radius: src/endpoints/admin/retranslate.ts (`POST /api/admin/translations/:collection/:id`); src/components/admin/RetranslateButton.tsx, TranslationStatusFilter.tsx, TranslationFailedBanner.tsx, ApproveEnglishButton.tsx
- Doc impact (dự kiến): API_SPEC §5.1 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-17 (cảnh báo admin khi lỗi)
- FR-ADM-18
- BR-08 (pháp lý admin duyệt)
- API_SPEC §4, §5.1
- PERMISSION §4, §6

## Description
Công cụ trong `/admin` để quản lý bản dịch.

## Dependencies
- `layer-9-task-07` Job `translate-content` + hook tự dịch khi lưu bản `vi` đã xuất bản / global (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-13-task-01`

## Acceptance Criteria
- [ ] Admin bật được `pages.hasEnglish` trong UI: field `hasEnglish` dùng chung đang `admin.readOnly: true` (`src/fields/translation.ts:17`) → `withFieldAccess`/nút duyệt phải bỏ readOnly khi override update cho admin (MINOR-2) (review L5-T02 round 1)
- [ ] Retranslate: authenticate → quyền sửa bài (admin, hoặc sale là `author`; `services`/`pages`/globals chỉ admin) → 404 nếu ngoài phạm vi → enqueue `force: true` (đặt lại `enSource=ai`) → 202; rate limit 30/giờ/user; audit `content.retranslate`
- [ ] `:collection` ngoài allowlist → 404
- [ ] Danh sách nội dung lọc theo: chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đổi sau khi sửa tay
- [ ] Có bài `failed` hoặc vượt hạn mức → banner cảnh báo trong admin cho admin
- [ ] Pháp lý `pending_review`: admin bấm duyệt → `hasEnglish=true` + audit `content.approve_translation`; sale không thấy nút

## Tests cần viết
- Integration: sale retranslate bài người khác → 404; bài mình → 202 + audit
- Integration: collection `leads` → 404
- Integration: admin duyệt pages → hasEnglish true + audit

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-10-task-02-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: API_SPEC §5.1 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-10): task-02 tadmin` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-10/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/admin/retranslate.ts (`POST /api/admin/translations/:collection/:id`)
- src/components/admin/RetranslateButton.tsx, TranslationStatusFilter.tsx, TranslationFailedBanner.tsx, ApproveEnglishButton.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-9-task-07 round 2 (MINOR)
- [ ] `src/jobs/translate-content-save.ts:41-52`: khoá dòng `SELECT … FOR UPDATE` trên session `payload.db.sessions[req.transactionID]` trước khi đọc lại (đóng khe hở ms; tệ nhất mất bản dịch thay vì mất dữ liệu admin).
- [ ] `translate-content-save.ts:11,21-27`: lần thử bật `hasEnglish` lỗi kiểm tra → Payload rollback + gỡ transaction của job; ghi dự phòng chạy transaction riêng → quyết định `hasEnglish` trước khi ghi bằng predicate `requireEnglishFields` thay vì bắt lỗi (hoặc sửa comment).
- [ ] `tests/integration/translate-content.test.ts:533`: assertion `toBeGreaterThan(jobsBefore - 1)` lỏng → thêm case admin chỉ đổi link (hook không xếp job) và kiểm số job +1 từ `row_changed`.
