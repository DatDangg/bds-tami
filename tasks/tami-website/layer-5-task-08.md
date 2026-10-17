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
- [x] Khi thêm `robots.ts`/`sitemap.ts`/`llms.txt`: sinh rule `has` RSC (`rsc`, `next-router-*`, `_rsc`) → `no-store` cho cả `DOTTED_PATH_SOURCE` (đặt sau rule của nó) trong `src/lib/http/cache-policy.ts`; đo `next start` các route này với và không `RSC: 1`; sửa comment `cache-policy.ts:43` + tiêu đề test `cache-policy.test.ts:79` đang ghi `private, no-store` thành `no-store` (review L4-T03 round 3 MINOR-1/2)
- [x] `NEXT_PUBLIC_SITE_URL` đang là localhost lúc `docker build` (L3-T03 MINOR-8): URL tuyệt đối (canonical, OG, JSON-LD, sitemap) phải lấy lúc chạy hoặc build-arg đúng môi trường (spec-validation layer 3)
- [x] Meta lấy `seo.metaTitle` → `title`; `metaDescription` → `summary`/`excerpt`; OG image → `seo.ogImage` → ảnh đại diện → ảnh OG mặc định
- [x] `hreflang` vi, en, x-default (→ vi) **chỉ** khi bản ghi có `hasEnglish`
- [x] `noindex` khi `seo.noindex` hoặc khi trang yêu cầu (tin đã thuê, tuyển dụng hết hạn, staging)
- [x] JSON-LD hợp lệ schema.org, escape `</script>`

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
- Attempt: 2
- Last failure type: review FAIL round 1 (MAJOR-1 noindex ép buộc phải follow; MAJOR-2 robots chặn /api/media/file/; MAJOR-3 HTML prerender lúc build mang noindex/thiếu canonical) — đã sửa attempt 2
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 6/6 PASS
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 99 file 1029 PASS; pnpm build PASS (`.next/server/app` chỉ còn _not-found/_global-error HTML). curl `next start` (.next sạch, `NEXT_PUBLIC_SITE_URL` lúc chạy): request đầu `APP_ENV=staging` → `noindex, nofollow`, robots `Disallow: /`; `APP_ENV=production` → không robots meta, robots Allow `/api/media/file/`; HTML `public, s-maxage=60, stale-while-revalidate=300`; `RSC: 1` → `no-store` (trang + robots/sitemap/llms/png); không chuỗi localhost
- Reviewer verdict: STRICT FAIL round 1 → STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-5-task-08-round-2-review.md`
- Residual risk: chưa trang nào gọi `buildPageMetadata`/JSON-LD builders (nối ở L6+), nên canonical chưa xuất hiện. Request đầu sau deploy render runtime (chậm hơn, CDN hấp thụ). ISR cache trên đĩa theo container (chỉ ảnh hưởng khi chạy 2+ bản app — xem ARCHITECTURE §9.1). MINOR: chưa có test khoá `generateStaticParams() → []` + noindex non-prod ở layout → L15-T01. Không có field ảnh OG mặc định trong site-settings: caller truyền `defaultImage`, cuối cùng logo tĩnh
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-5.md`

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5 as-built layer-5-task-08 (site URL lúc chạy, noindex theo env, không prerender trang công khai lúc build, robots)
- Decision log: MAJOR-3 — không prerender trang công khai lúc build (primary chọn, quyết định kỹ thuật; reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-08 seo` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-08` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/seo/metadata.ts (meta, OG, canonical, `alternates.languages` vi/en/x-default khi `hasEnglish`, noindex)
- src/lib/seo/json-ld.ts (Organization, RealEstateListing, Article, JobPosting, BreadcrumbList, có `inLanguage`)
- src/components/seo/JsonLd.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
