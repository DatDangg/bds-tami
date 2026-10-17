# Task 04: Khối Đối tác / chủ đầu tư trên trang chủ (FR-PUB-17)

## Layer
13 — Should: dashboard, redirect UI, trang khu vực, đối tác

Checkpoint: ⏸ **Mốc M4** — dừng chờ user duyệt sau layer này (Should xong (dashboard, redirect UI, trang khu vực, đối tác))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Should
- Scope: SINGLE_SURFACE
- Review level expected: **FAST** — một khối hiển thị, dữ liệu sẵn có
- Blast radius: src/components/home/PartnersBlock.tsx; src/app/(frontend)/[locale]/page.tsx (thêm khối theo blockOrder)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-17
- design-spec S01.6

## Description
Logo wall các `developers.showAsPartner`, ngay dưới hero theo screen spec.

## Dependencies
- `layer-9-task-01` Trang chủ (S01): hero slide, Về TAMI, dự án nổi bật, dịch vụ, ưu đãi, CTA (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (thứ tự ưu tiên: Should làm sau khi toàn bộ Must đã lên staging)

Mở khoá cho: `layer-14-task-01`, `layer-14-task-02`, `layer-15-task-01`

## Acceptance Criteria
- [ ] G13: sửa `developers` (`showAsPartner`, logo) phải làm mới cache khối đối tác trang chủ vi/en; test hook (spec-validation layer 4)
- [ ] Chỉ logo (alt = tên chủ đầu tư), sắp theo `sortOrder`
- [ ] Bật/tắt + vị trí theo `homepage.partners` / `blockOrder`
- [ ] EN: thiếu title EN → ẩn khối

## Tests cần viết
- Integration render: 0 đối tác → không render khối

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-13-task-04-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-13): task-04 partners` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-13/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức FAST)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/home/PartnersBlock.tsx
- src/app/(frontend)/[locale]/page.tsx (thêm khối theo blockOrder)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
