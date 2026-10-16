# Task 04: Form ứng tuyển trên trang chi tiết tuyển dụng

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — UI form gọi endpoint đã review
- Blast radius: src/components/careers/ApplyForm.tsx; src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx (ráp form)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-09
- FR-PUB-13
- design-spec §3.4, S13

## Description
Ráp form ứng tuyển (multipart, chọn file, consent, Turnstile) vào `ApplyFormSlot`.

## Dependencies
- `layer-6-task-08` Trang Tuyển dụng: danh sách + chi tiết, hết hạn, JSON-LD JobPosting (S12, S13) (dùng kết quả của task này)
- `layer-6-task-09` Endpoint `POST /api/public/job-applications` (multipart, CV, email) (dùng kết quả của task này)
- `layer-2-task-09` Bộ form dùng chung: field có label/lỗi, ô consent, widget Turnstile lười (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-11-task-01`

## Acceptance Criteria
- [ ] Kiểm loại/cỡ file phía client trước khi gửi (server vẫn kiểm lại)
- [ ] Gửi kèm `locale`; thông báo thành công/lỗi theo ngôn ngữ
- [ ] Tin hết hạn không render form

## Tests cần viết
- RTL: file 6MB bị chặn client; submit thành công hiện `role="status"`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-04-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-7): task-04 applyform` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/careers/ApplyForm.tsx
- src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx (ráp form)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
