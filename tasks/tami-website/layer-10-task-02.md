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
- [x] Admin bật được `pages.hasEnglish` trong UI: field `hasEnglish` dùng chung đang `admin.readOnly: true` (`src/fields/translation.ts:17`) → (cập nhật round 2) KHÔNG bỏ readOnly: bật `hasEnglish` của `pages` chỉ qua nút "Duyệt bản EN" → `POST /api/admin/translations/pages/:id/approve` (ô tick chỉ đọc; hook `guardEnglishApproval` giữ nguyên giá trị với mọi request không mang cờ duyệt, tránh form cũ tự duyệt bản AI) (MINOR-2) (review L5-T02 round 1)
- [x] Retranslate: authenticate → quyền sửa bài (admin, hoặc sale là `author`; `services`/`pages`/globals chỉ admin) → 404 nếu ngoài phạm vi → enqueue `force: true` (đặt lại `enSource=ai`) → 202; rate limit 30/giờ/user; audit `content.retranslate`
- [x] `:collection` ngoài allowlist → 404
- [x] Danh sách nội dung lọc theo: chưa dịch / AI dịch / đã sửa tay / dịch lỗi / bản Việt đổi sau khi sửa tay
- [x] Có bài `failed` hoặc vượt hạn mức → banner cảnh báo trong admin cho admin
- [x] Pháp lý: admin bấm duyệt (khi `hasEnglish` còn tắt: bản AI `pending_review`, bản EN sửa tay/dán, kể cả khi dịch tắt) → `hasEnglish=true` + audit `content.approve_translation` + status `done`; thiếu trường EN bắt buộc → 422 kèm danh sách trường; `hasEnglish` đã true → 409; sale không thấy nút (endpoint 403)
- [x] Pháp lý bị AI dịch lại (nút Dịch lại hoặc tự dịch khi sửa bản Việt) → `hasEnglish=false` + `pending_review` + revalidate /vi và /en, ẩn /en tới khi admin duyệt (quyết định user 2026-10-18)

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
- Attempt: 4 (user cho phép vượt 3 — 2026-10-18)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS
- Verify commands + result: worktree: lint · typecheck · build PASS, test 2.288 PASS. Sau squash lên staging (cả layer 10): lint · typecheck · build PASS; pnpm test 2.400 → 1 fail tương tác T03×T02 (locale-counterpart bật hasEnglish pages không cờ duyệt) → sửa test truyền context approveEnglish, chạy lại 8 PASS
- Reviewer verdict: STRICT PASS round 4 (`.context/review-reports/build-tami-website-layer-10-task-02-round-4-review.md`); round 1 FAIL (MAJOR-1 pháp lý bản AI hiện ngay), round 2 FAIL (MAJOR-A form cũ tự duyệt), round 3 FAIL (MAJOR-H chỉ duyệt bản AI) — user quyết 2 lần; MINOR round 4 → layer-13-task-01; residual → BACKLOG BL-012, BL-013
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/API_SPEC.md §5.1 + §5.2 (as-built), docs/ARCHITECTURE.md (job translate-content, duyệt pháp lý)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-10): task-02 tadmin` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-10/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

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
