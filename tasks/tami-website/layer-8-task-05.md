# Task 05: `sitemap.xml` (vi + en, alternates), `robots.txt`, `llms.txt`

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — ảnh hưởng index toàn site + rò nội dung chưa công khai
- Blast radius: src/app/sitemap.ts (hoặc chia sitemap index theo collection); src/app/robots.ts; src/app/llms.txt/route.ts
- Doc impact (dự kiến): ARCHITECTURE §4/§5
- Decision impact: NO

## Requirements
- FR-PUB-15
- BR-07
- skills/ai-friendly-web
- SPECIFICATIONS F3/F6 (rented, hết hạn không vào sitemap)

## Description
Sitemap song ngữ có `hreflang` alternates, robots theo môi trường, llms.txt sinh từ nội dung thật.

## Dependencies
- `layer-7-task-01` Collection `property-posts` (Đăng tin BĐS) + job `expire-offers` (dùng kết quả của task này)
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-16-task-01`

## Acceptance Criteria
- [x] Chỉ nội dung công khai (`publicWhere`); loại tin `rented`, tuyển dụng hết hạn, `seo.noindex`
- [x] URL EN chỉ khi `hasEnglish`; mỗi URL có alternates vi/en/x-default khi có cả hai
- [x] `lastmod` = `updatedAt`
- [x] Production: robots cho phép (kể cả GPTBot/ClaudeBot/PerplexityBot), có `Sitemap:`; chặn `/admin`, `/api`. Staging: `Disallow: /`
- [x] Chia sitemap khi > 50.000 URL

## Tests cần viết
- Integration: draft/rented/hết hạn không có trong sitemap; EN chưa dịch không có
- Unit: robots theo `APP_ENV`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-05-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): M1 danh mục `seo.noindex` vẫn vào sitemap (không select `seo`)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 (builder)
- Verify commands + result: worktree lint/typecheck/build PASS, test 1.768 PASS; sau squash staging (đủ L8): lint, typecheck, test 177 file 1.925, build PASS
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-8-task-05-round-2-review.md`)
- Spec Validator verdict (layer close): GAPS (task đạt AC; gap G31 ngoài task) — `.context/review-reports/spec-validation-build-tami-website-layer-8.md`

## Doc / Decision Impact
- Doc impact result: docs/ARCHITECTURE.md §5 as-built (sitemap index, robots Sitemap, llms.txt)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-05 sitemap` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/sitemap.ts (hoặc chia sitemap index theo collection)
- src/app/robots.ts
- src/app/llms.txt/route.ts

## Notes
- Task hẹn giờ (Could) bổ sung điều kiện `publishedAt ≤ now` qua `publicWhere` — không sửa ở đây.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-08
- `src/lib/seo/robots.ts` (L5-T08) cho production `allow: ["/", "/api/media/file/"]` + `disallow: ["/admin", "/api/"]` vì ảnh/OG phục vụ ở `/api/media/file/` (ARCHITECTURE §5). Khi thêm dòng `Sitemap:` phải GIỮ ngoại lệ `/api/media/file/` này (AC44 chỉ nói chặn `/admin`, `/api`).

## Quyết định thiết kế / as-built (builder)
- Sitemap = route handler (không dùng `sitemap.ts` của Next vì cần index): `/sitemap.xml` (index) + `/sitemaps/<nhóm>-<n>.xml`. Nhóm = allowlist trong `src/lib/seo/sitemap-data.ts` (collection nội bộ không thể lọt vào). Mỗi file ≤ 20.000 bản ghi (≤ 40.000 URL) nên < 50.000.
- Loại: rentals chỉ `status = published` (rented bị noindex); job-postings `deadline >= startOfVietnamDay` (cùng quy ước `isPastDeadline`); `seo.noindex` xét theo từng ngôn ngữ (nhóm `seo` localized). Danh mục (news, property_post) có trang nên vào sitemap; danh mục `rental` chờ L8-T03. Trang tĩnh gồm `/cho-thue` danh sách theo `routing.ts` (trang do L8-T03).
- Pháp lý (`pages`): theo `kind`, EN khi `hasEnglish`. x-default = bản vi. Một ngôn ngữ duy nhất → không alternates.
- robots: giữ `/api/media/file/`; thêm `Sitemap:` chỉ ở production và khi biết `NEXT_PUBLIC_SITE_URL`; AI crawlers gộp chung nhóm `*` (nhóm riêng theo bot sẽ bỏ qua `Disallow` của `*`).
- llms.txt: `src/app/llms.txt/route.ts` → `src/lib/seo/llms-route.ts` (+ `llms-txt.ts` thuần). Chỉ link thật, 5 mục mới nhất mỗi collection.
- Cache: dùng rule `DOTTED_PATH_SOURCE` có sẵn (CDN 60s); route `force-dynamic` vì đọc DB/env lúc chạy. Không thêm unstable_cache.
- Chưa làm (ngoài scope): `llms-full.txt`, `/.well-known/llms.txt`.

## Follow-up từ review layer-8-task-05 round 2 (MINOR) → layer-16-task-01
- Chuyển sang `layer-16-task-01.md` (task đổi `publicWhere` hẹn giờ, sitemap tự nhận).
