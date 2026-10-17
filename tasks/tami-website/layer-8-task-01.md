# Task 01: Global `homepage` (khối, thứ tự, hero video tuỳ chọn, CTA banner)

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema global + upload video
- Blast radius: src/globals/Homepage.ts; seed/sample/homepage.ts; migrations/*
- Doc impact (dự kiến): ERD §4.15 nếu lệch
- Decision impact: NO

## Requirements
- FR-PUB-01
- FR-ADM-08
- ERD §4.15 (homepage)
- design-spec §6.1, §6.2

## Description
Global trang chủ cho admin bật/tắt, sắp xếp khối và chỉnh nội dung.

## Dependencies
- `layer-7-task-01` Collection `property-posts` (Đăng tin BĐS) + job `expire-offers` (dùng kết quả của task này)
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)

Mở khoá cho: `layer-9-task-01`, `layer-9-task-07`

## Acceptance Criteria
- [ ] G12: thêm `homepage` vào `TRANSLATABLE_GLOBALS` (`src/lib/translation/allowlist.ts`) + revalidate tag global; test (spec-validation layer 4)
- [ ] Khối: `hero` (1–8 slide; `image` bắt buộc, `video` tuỳ chọn chỉ MP4/WebM ≤ 15MB), `about` (+ `stats`), `featuredProjects` (≤ 6), `services`, `featuredOffers`, `partners`, `ctaBanner` (`title` bắt buộc khi `enabled`), `blockOrder` gồm `ctaBanner`, `seo`
- [ ] Chữ localized; quan hệ/ảnh dùng chung; có `translation` group
- [ ] Chỉ admin ghi; lưu → revalidate `/` và `/en`
- [ ] Không có dải 4 lối tắt (đã bỏ)

## Tests cần viết
- Integration: 0 slide hoặc 9 slide → lỗi; video 20MB → lỗi; video là ảnh → lỗi
- Integration: sale ghi → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-01-round-<R>-review.md`

## Migration
- Bảng global `homepage` + bảng array/locales. Additive.
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
- Doc impact result: pending (dự kiến: ERD §4.15 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-01 homepage` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/globals/Homepage.ts
- seed/sample/homepage.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
