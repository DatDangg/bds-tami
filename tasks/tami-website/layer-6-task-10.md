# Task 10: Endpoint tải CV `GET /api/admin/private-files/:id/download` + audit

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — file access + PII + BOLA
- Blast radius: src/endpoints/admin/private-file-download.ts; src/components/admin/CvDownloadButton.tsx (trong form job-application)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-ADM-05 (chỉ admin xem CV)
- PERMISSION §3.3, §5, §6
- API_SPEC §4
- NFR-04

## Description
Admin tải CV qua endpoint kiểm quyền, stream từ bucket private, ghi audit.

## Dependencies
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [x] Thứ tự: authenticate (401) → authorize admin (403) → id không tồn tại 404 → stream file với `Content-Disposition: attachment`, `Cache-Control: no-store`
- [x] Ghi audit `application.view_cv` mỗi lần tải
- [x] Sale/khách → 401/403; không có URL công khai nào trỏ tới file

## Tests cần viết
- Integration: admin tải → 200 + audit; sale → 403; khách → 401; id lạ → 404

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-10-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS toàn bộ
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 115 file 1.273 PASS (10 integration DB + S3 thật); pnpm build PASS (reviewer chạy — builder bị khoá .next bởi dev server khác)
- Reviewer verdict: STRICT PASS round 1 — `.context/review-reports/build-tami-website-layer-6-task-10-round-1-review.md`
- Residual risk: MINOR 1 (resolveObjectKey bỏ qua `prefix` plugin storage), 2 (test admin bị khoá nhận cả 401/403 → siết 401), 3 (thuộc tính `download` làm lưu trang lỗi thành file) → L15-T01. F1 tài khoản bị khoá tạm (`lockUntil`) còn JWT cũ vẫn tải được — hành vi chung Payload. Nút admin chỉ kiểm jsdom, chưa kiểm trình duyệt
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-6.md`

## Doc / Decision Impact
- Doc impact result: `docs/API_SPEC.md` §4 as-built
- Decision log: audit `docId` = id private-file (reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-10 cvdl` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-10` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/endpoints/admin/private-file-download.ts
- src/components/admin/CvDownloadButton.tsx (trong form job-application)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
