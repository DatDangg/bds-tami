# Task 08: Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — helper dùng chung mọi trang; ảnh hưởng index
- Blast radius: src/lib/seo/metadata.ts (meta, OG, canonical, `alternates.languages` vi/en/x-default khi `hasEnglish`, noindex); src/lib/seo/json-ld.ts (Organization, RealEstateListing, Article, JobPosting, BreadcrumbList, có `inLanguage`); src/components/seo/JsonLd.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-15
- NFR-03
- BR-07 (hreflang chỉ khi có EN)
- ERD §4.14

## Description
Helper sinh `generateMetadata` và JSON-LD cho mọi trang.

## Dependencies
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-04`, `layer-6-task-05`, `layer-6-task-06`, `layer-6-task-07`, `layer-6-task-08`, `layer-7-task-03`, `layer-8-task-03`, `layer-8-task-04`, `layer-8-task-05`, `layer-9-task-01`, `layer-13-task-03`

## Acceptance Criteria
- [ ] `NEXT_PUBLIC_SITE_URL` đang là localhost lúc `docker build` (L3-T03 MINOR-8): URL tuyệt đối (canonical, OG, JSON-LD, sitemap) phải lấy lúc chạy hoặc build-arg đúng môi trường (spec-validation layer 3)
- [ ] Meta lấy `seo.metaTitle` → `title`; `metaDescription` → `summary`/`excerpt`; OG image → `seo.ogImage` → ảnh đại diện → ảnh OG mặc định
- [ ] `hreflang` vi, en, x-default (→ vi) **chỉ** khi bản ghi có `hasEnglish`
- [ ] `noindex` khi `seo.noindex` hoặc khi trang yêu cầu (tin đã thuê, tuyển dụng hết hạn, staging)
- [ ] JSON-LD hợp lệ schema.org, escape `</script>`

## Tests cần viết
- Unit: có/không EN → alternates đúng
- Unit: JSON-LD từng loại khớp snapshot + escape
- Unit: staging env → robots noindex

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-08-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-5): task-08 seo` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/lib/seo/metadata.ts (meta, OG, canonical, `alternates.languages` vi/en/x-default khi `hasEnglish`, noindex)
- src/lib/seo/json-ld.ts (Organization, RealEstateListing, Article, JobPosting, BreadcrumbList, có `inLanguage`)
- src/components/seo/JsonLd.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
