# Task 01: Dashboard admin (FR-ADM-14): lead, nội dung, lượt bấm, cảnh báo dịch, chi phí dịch

## Layer
13 — Should: dashboard, redirect UI, trang khu vực, đối tác

Checkpoint: ⏸ **Mốc M4** — dừng chờ user duyệt sau layer này (Should xong (dashboard, redirect UI, trang khu vực, đối tác))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Should
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — endpoint admin phân quyền theo vai trò (sale chỉ số liệu của mình)
- Blast radius: src/endpoints/admin/dashboard.ts; src/components/admin/Dashboard.tsx (admin.components.views / beforeDashboard)
- Doc impact (dự kiến): API_SPEC §4 nếu shape khác
- Decision impact: NO

## Requirements
- FR-ADM-14
- API_SPEC §4 (`/api/admin/dashboard`)

## Description
Endpoint số liệu + view dashboard trong `/admin`.

## Dependencies
- `layer-9-task-03` Phân công lead: hook `leads.afterChange` (nơi duy nhất) + `POST /api/admin/leads/:id/assign` (dùng kết quả của task này)
- `layer-2-task-07` Ghi lượt bấm Hotline/Zalo/Fanpage: `click-events`, `click-stats-daily`, endpoint + job gộp (dùng kết quả của task này)
- `layer-10-task-02` Admin dịch: nút "Dịch lại bằng AI", lọc trạng thái dịch, duyệt bản EN trang pháp lý, cảnh báo lỗi dịch (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (thứ tự ưu tiên: Should làm sau khi toàn bộ Must đã lên staging)

Mở khoá cho: `layer-14-task-01`, `layer-14-task-02`, `layer-15-task-01`

## Acceptance Criteria
- [ ] Admin: số lead theo trạng thái/nguồn/sale/khoảng thời gian, số nội dung đang hiển thị, lượt bấm hotline/Zalo/fanpage (từ `click-stats-daily`), số bài dịch lỗi / chờ duyệt, chi phí dịch tháng
- [ ] Sale: chỉ số liệu lead của mình; không thấy chi phí dịch
- [ ] Truy vấn tổng hợp bằng SQL/aggregation (không tải toàn bộ bản ghi); ≤ 1s với dữ liệu mẫu lớn

## Tests cần viết
- Integration: sale chỉ thấy lead mình; admin thấy toàn bộ
- Integration: số đếm khớp dữ liệu fixture

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-13-task-01-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: API_SPEC §4 nếu shape khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-13): task-01 dashboard` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-13/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/admin/dashboard.ts
- src/components/admin/Dashboard.tsx (admin.components.views / beforeDashboard)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-10-task-02 round 4 (MINOR)
- [ ] `src/collections/Pages.ts:55`: comment nút duyệt → "hiện khi `hasEnglish` còn tắt".
- [ ] `src/endpoints/admin/approve-english.ts:31-39,65-67`: kiểm đủ trường EN chạy ngoài transaction → đưa vào cùng transaction (tránh 500 khi bản EN bị xoá giữa chừng).
- [ ] Nút "Duyệt bản EN": nhắc "Lưu bản EN trước khi duyệt" (endpoint duyệt bản đã lưu, không phải form chưa lưu); kiểm trên trình duyệt form nạp lại sau `router.refresh()`.
- [ ] Banner lỗi dịch gọi 13 request mỗi lần mở dashboard → gộp 1 endpoint tổng hợp (dùng chung với dashboard FR-ADM-14).
