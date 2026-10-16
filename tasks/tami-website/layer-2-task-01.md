# Task 01: Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — upload/file access + schema
- Blast radius: src/collections/Media.ts; src/collections/PrivateFiles.ts; src/lib/upload/validate-file.ts (sniff MIME bằng magic bytes + giới hạn dung lượng); …
- Doc impact (dự kiến): ERD §4.12 nếu giới hạn/cỡ ảnh khác
- Decision impact: NO

## Requirements
- FR-ADM-12
- NFR-04 (MIME thật)
- ERD §4.12
- ARCHITECTURE §5.3
- design-spec §6.2 (video hero)

## Description
Hai collection upload dùng `@payloadcms/storage-s3`: `media` (bucket public, ảnh resize WebP) và `private-files` (bucket private, không URL công khai).

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-01`, `layer-4-task-02`, `layer-5-task-01`, `layer-5-task-02`, `layer-5-task-03`, `layer-5-task-04`, `layer-6-task-09`, `layer-6-task-10`, `layer-8-task-01`

## Acceptance Criteria
- [x] `media`: ảnh JPG/PNG/WebP/AVIF ≤ 10MB sinh `thumb` 400w, `card` 800w, `large` 1600w, `og` 1200×630 dạng WebP; PDF ≤ 20MB; video MP4/WebM ≤ 15MB
- [x] Kiểm MIME thật bằng nội dung file (không tin đuôi/Content-Type); sai → 415, quá cỡ → 413
- [x] Tên file lưu ngẫu nhiên; `alt` (localized) bắt buộc với ảnh; `caption` localized; `uploadedBy` tự gán
- [x] Quyền `media`: khách đọc; staff upload; sale chỉ sửa file mình upload; admin toàn quyền
- [x] `private-files`: không có URL công khai, không đọc qua REST với khách/sale; chỉ admin (tải qua endpoint riêng ở task CV)
- [x] Không cho upload SVG/HTML (chống XSS)

## Tests cần viết
- Integration: upload ảnh JPG thật → có 4 cỡ WebP
- Integration: file `.jpg` nhưng nội dung là HTML → 415; ảnh 11MB → 413
- Integration: khách GET `private-files` → 401/403; sale → 403
- Integration: sale sửa media của sale khác → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-01-round-<R>-review.md`

## Migration
- Bảng `media`, `media_locales`, `private_files`, cột `staff.avatar_id`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS (reviewer xác minh)
- Verify commands + result: install --frozen-lockfile/lint/typecheck/test (325; media-upload 18 test, S3 + DB thật)/build = PASS; audit high exit 0; migrate:down + migrate trên dev OK (builder)
- Reviewer verdict: STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-2-task-01-round-2-review.md`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/ERD.md §4.1 staff.avatar đã có — đúng thiết kế, no doc change
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-01 media` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Media.ts
- src/collections/PrivateFiles.ts
- src/lib/upload/validate-file.ts (sniff MIME bằng magic bytes + giới hạn dung lượng)
- src/payload.config.ts (plugin storage-s3 2 bucket)
- src/collections/Staff.ts (thêm `avatar`)
- migrations/*

## Notes
- Video chỉ dùng cho `homepage.hero.slides[].video` (ràng buộc ở task homepage).
- Cần SeaweedFS dev chạy với 2 bucket (task scaffold).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
