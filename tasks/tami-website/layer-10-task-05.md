# Task 05: Xoá CV an toàn khi S3 lỗi: hook `beforeDelete` trên `private-files` + quét object mồ côi (BL-008)

## Layer
10 — Ráp form lead, admin dịch, hoàn thiện EN (+ task bổ sung từ spec-validation layer 9)

Checkpoint: Sau layer 10 là mốc M2 — dừng cho user duyệt.

## Type
build (initial) — task bổ sung (user duyệt 2026-10-19)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — dữ liệu cá nhân (CV) trên S3, hook xoá dùng chung mọi đường xoá
- Blast radius: src/collections/PrivateFiles.ts (beforeDelete), src/lib/retention/delete-private-file.ts, src/hooks/job-applications/delete-cv-and-audit.ts, src/endpoints/public/job-applications.ts (removeOrphanCv), quét đối chiếu bucket ↔ DB
- Doc impact (dự kiến): ARCHITECTURE / ERD nếu lệch
- Decision impact: NO

## Requirements
- BR-31 / PII — `SPECIFICATIONS.md`
- BL-008 `spec/changes/BACKLOG.md`; review `.context/review-reports/build-tami-website-layer-9-task-06-round-2-review.md`; quyết định user 2026-10-19

## Description
`@payloadcms/plugin-cloud-storage` `afterDelete` nuốt lỗi S3 → xoá dòng DB mà object CV còn trong bucket private, mồ côi vĩnh viễn. Gom việc xoá object vào 1 hook `beforeDelete` trên `PrivateFiles` (tự `DeleteObject`, ném lỗi khi thất bại → không xoá dòng), mọi đường xoá dùng chung; thêm quét object mồ côi hiện có.

## Dependencies
- `layer-9-task-06` Job data-retention (`deletePrivateFile`) (dùng kết quả của task này)
- `layer-6-task-09` Endpoint job-applications (dùng kết quả của task này)

## Acceptance Criteria
- [x] Hook `beforeDelete` trên `private-files`: xoá object S3 tường minh, lỗi → throw, dòng DB không bị xoá; dùng chung cho admin xoá hồ sơ (`delete-cv-and-audit.ts`), `removeOrphanCv`, admin xoá private-files trực tiếp, job data-retention (dùng lại hoặc thay `deletePrivateFile`, không xoá đôi gây lỗi)
- [x] Key S3 dựng từ prefix lưu trữ thật (không giả định bucket không prefix)
- [x] Quét đối chiếu bucket ↔ DB: object không có dòng `private-files` và cũ hơn ngưỡng → xoá (trong job data-retention hoặc lệnh tay có dry-run), log chỉ số lượng
- [x] Audit meta data-retention ghi số bước/bản ghi lỗi (MINOR L9-T06 r2)
- [x] Sửa comment sai ở `delete-cv-and-audit.ts:8`

## Tests cần viết
- Integration S3 thật + mock lỗi tầng S3 client: mọi đường xoá → DB còn, object còn, lần sau xử lý được
- Test "object đã xoá rồi commit lỗi" (MINOR L9-T06 r2)
- Quét mồ côi: dry-run đếm đúng, chạy thật xoá đúng, không đụng object có dòng DB

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-10-task-05-round-<R>-review.md`

## Migration
- Không dự kiến. Cần schema → dừng báo user.

## Retry / Error Memory
- Attempt: 2
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS
- Verify commands + result: worktree: lint · typecheck · build PASS; test 2.220 PASS + chạy lại access/media-upload/data-retention 65 PASS (contrast CRLF BL-004). Sau squash lên staging: lint · typecheck PASS, data-retention + env + job-applications 46 PASS
- Reviewer verdict: STRICT PASS round 2 (`.context/review-reports/build-tami-website-layer-10-task-05-round-2-review.md`); round 1 FAIL (CRITICAL-1 test quét bucket dùng chung, MAJOR-1 quét mồ côi không guard); MINOR round 2 → layer-12-task-01
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/ARCHITECTURE.md, docs/ERD.md, docs/runbooks/deploy.md §3.3, docs/runbooks/restore.md §6, .env.example, compose staging/prod (RETENTION_ORPHAN_OBJECT_SCAN=dry-run)
- Decision log: user duyệt 2026-10-19 (progress.json decisions)

## Commit / Tracking
- 1 task = 1 commit; trailer theo `.agent/workflows/state-commit.md` §2.8
- Progress: `.context/progress.json`

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/PrivateFiles.ts
- src/lib/retention/delete-private-file.ts, purge-*.ts
- src/hooks/job-applications/delete-cv-and-audit.ts
- src/endpoints/public/job-applications.ts

## Notes
- Đọc: BL-008, review L9-T06 round 2, `node_modules/@payloadcms/plugin-cloud-storage/dist/hooks/afterDelete.js`. Sau task: đổi BL-008 → done.
