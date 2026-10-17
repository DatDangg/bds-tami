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
- [x] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [x] `job-postings` đủ trường ERD §4.10, `deadline` bắt buộc + index
- [x] `job-applications`: chỉ admin đọc/sửa (`status`, `note`); khách/sale không đọc; không tạo qua REST công khai (chỉ qua endpoint ở task sau)
- [x] Trường khách gửi (`fullName`, `phone`, `email`, `message`, `cv`, `consent*`, `locale`) chỉ đọc trong admin
- [x] Trạng thái `new → reviewing → interview → hired | rejected`

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
- Attempt: 3
- Last failure type: review FAIL round 1 (M1 xoá hồ sơ ứng tuyển để lại CV) — sửa attempt 2; attempt 3 = MINOR m5–m8
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS toàn bộ (gồm G12)
- Verify commands + result: pnpm lint / typecheck = PASS; pnpm test 104 file 1.102 PASS (25 integration job-postings, DB thật); pnpm build PASS. Migration dev: `20261017_130625_job_postings` (batch 15) + `20261017_132020_job_applications_cv_nullable` (batch 16), migrate:status 16/16, `cv_id` nullable. "Khách POST → 403" kiểm qua Local API `overrideAccess:false` (cùng access check với REST)
- Reviewer verdict: STRICT FAIL round 1 → PASS round 2 → PASS round 3 (delta) — `.context/review-reports/build-tami-website-layer-5-task-04-round-3-review.md`
- Residual risk: S3 chỉ giả lập trong test. Local API bulk delete (overrideAccess) vẫn bỏ qua `disableBulkDelete` → ghi vào L9-T06. Ẩn tin hết hạn làm ở truy vấn danh sách L6-T08 (chi tiết vẫn mở cho link chia sẻ). `down` của migration job_postings (và 7 migration đã commit) lỗi khi rollback — pattern Payload sinh, chờ user (BACKLOG BL-003)
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.10 + §5 (`job_postings_list_idx`), `docs/PERMISSION.md` §3.3
- Decision log: thêm migration riêng cho `cv_id` nullable thay vì sửa migration đã apply (primary); guard 409 xoá cứng tin còn hồ sơ (reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-04 jobsposts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/JobPostings.ts, JobApplications.ts
- seed/sample/job-postings.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
