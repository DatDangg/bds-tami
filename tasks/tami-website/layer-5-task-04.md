# Task 04: Collection `job-postings` + `job-applications` (quản lý hồ sơ)

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + PII ứng viên
- Blast radius: src/collections/JobPostings.ts, JobApplications.ts; seed/sample/job-postings.ts; migrations/*
- Doc impact (dự kiến): ERD §4.10 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-05
- BR-20, BR-21 (locale), BR-30, BR-32
- ERD §4.10
- PERMISSION §3.3

## Description
Tin tuyển dụng (dùng bộ field chung) và hồ sơ ứng tuyển chỉ admin xem, đổi trạng thái.

## Dependencies
- `layer-2-task-02` `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-08`, `layer-6-task-09`, `layer-6-task-10`, `layer-8-task-05`, `layer-9-task-06`, `layer-9-task-07`

## Acceptance Criteria
- [ ] `job-postings` đủ trường ERD §4.10, `deadline` bắt buộc + index
- [ ] `job-applications`: chỉ admin đọc/sửa (`status`, `note`); khách/sale không đọc; không tạo qua REST công khai (chỉ qua endpoint ở task sau)
- [ ] Trường khách gửi (`fullName`, `phone`, `email`, `message`, `cv`, `consent*`, `locale`) chỉ đọc trong admin
- [ ] Trạng thái `new → reviewing → interview → hired | rejected`

## Tests cần viết
- Integration: sale sửa/xoá tin tuyển dụng của sale khác → 403; xoá mềm + admin khôi phục; không xoá được danh mục đang có tin tuyển dụng
- Integration: sale GET job-applications → 403; khách POST REST `/api/job-applications` → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-04-round-<R>-review.md`

## Migration
- Bảng `job_postings`, `job_postings_locales`, `job_applications`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

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
- Doc impact result: pending (dự kiến: ERD §4.10 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-04 jobsposts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/JobPostings.ts, JobApplications.ts
- seed/sample/job-postings.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
