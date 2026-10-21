# Spec Update — 2026-10-21 site-url-build-inlined (URL gốc canonical / sitemap / OG / JSON-LD ra http://localhost:3000)

**spec_version:** 1.45.0 → 1.45.1 (PATCH — bug-fix kèm làm rõ F11 SEO: URL gốc tuyệt đối lấy từ `NEXT_PUBLIC_SITE_URL` lúc chạy của từng môi trường; không thêm tính năng, không đổi schema, API, quyền, URL, i18n. Theo `docs/SPEC_VERSIONING.md`: PATCH = làm rõ, không đổi behavior đã định.)

**BRD:** không đổi.

**Trigger:** bug-fix (Change Request **BL-053**, BUG). Change doc `spec/changes/2026-10-21-site-url-build-inlined.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/bug-site-url-build-inlined/phase-1-task-01.md`. Review: `.context/review-reports/bug-site-url-build-inlined-phase-1-task-01-round-1-review.md` (STRICT, PASS r1; 3 MINOR không chặn).

**Root cause:** `src/lib/seo/site-url.ts` đọc `process.env[SITE_URL_KEY]` với `SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL"`. Compiler của Next lan truyền hằng thành `process.env.NEXT_PUBLIC_SITE_URL` rồi thay bằng giá trị lúc build. Image build với placeholder `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (`docker/Dockerfile`) → bundle server chứa `let e="http://localhost:3000".trim();`, giá trị runtime (`https://tami.genieplatform.cloud`) bị bỏ qua. `getEnv()` (`src/lib/env.ts`) truyền nguyên object `process.env` nên không bị gập (admin `SiteLink`, link email đúng).

**Quyết định:** D1 tách hàm thuần `parseSiteUrl(env)` đọc `env.NEXT_PUBLIC_SITE_URL`; `getSiteUrl()` gọi `parseSiteUrl(process.env)` (truyền nguyên object → không gập hằng, cùng kiểu `getEnv()`). Giữ hành vi: build phase → `undefined`; thiếu/sai/không http(s) → `undefined`; trả `origin`. D2 Dockerfile đổi placeholder build thành `http://build-placeholder.invalid` (vẫn qua `z.url()`) + guard `scripts/check-build-placeholder.mjs` sau `pnpm build` quét `.next/server` + `.next/static` → thấy placeholder thì build FAIL. D3 rà các chỗ khác đọc `NEXT_PUBLIC_*`: đều qua `getEnv()` (an toàn); `NEXT_PUBLIC_HOTLINE` cố ý là biến build. Server không cần đổi env — chỉ build lại image + redeploy.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | BUG (config SEO dùng chung + build pipeline) | (commit close-out BL-053) | Sửa: `src/lib/seo/site-url.ts`, `docker/Dockerfile`. Mới: `scripts/check-build-placeholder.mjs`. Test: `src/lib/seo/site-url.test.ts` (+2 case `parseSiteUrl`). Doc: `SPECIFICATIONS.md` (F11 — câu "URL gốc tuyệt đối (BL-053)") | `.context/review-reports/bug-site-url-build-inlined-phase-1-task-01-round-1-review.md` (STRICT PASS) |

## Requirements (SPECIFICATIONS.md)

- **F11 SEO — URL gốc tuyệt đối (LÀM RÕ):** canonical, `hreflang`, `og:url`, JSON-LD (kể cả Breadcrumb), sitemap, `robots.txt`, `llms.txt` dùng `NEXT_PUBLIC_SITE_URL` lúc chạy của từng môi trường; không đóng cứng lúc build; build FAIL nếu placeholder lọt vào bundle (BL-053).
- Deployment: staging vẫn `noindex` (không đổi).

## Schema / Migration / API

Không. Migration: none. Không đổi i18n key. Không đổi env bắt buộc (vẫn `NEXT_PUBLIC_SITE_URL`).

## Hành vi bị thay thế

| Trước | Sau (BL-053) |
|---|---|
| Canonical / `<loc>` sitemap / `og:url` / JSON-LD trên staging = `http://localhost:3000` (giá trị lúc build) | = `https://tami.genieplatform.cloud` (giá trị `NEXT_PUBLIC_SITE_URL` lúc chạy) |
| Image build bằng `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, không kiểm bundle | Placeholder `http://build-placeholder.invalid` + guard: placeholder trong bundle → build FAIL |

## Số đo / verify

- Repro trước fix: `pnpm build` với `NEXT_PUBLIC_SITE_URL=http://build-placeholder.invalid` → 3 chunk `.next/server` chứa `let e="http://build-placeholder.invalid".trim();`; guard trên bundle đó → exit 1.
- Sau fix: `grep -r build-placeholder.invalid .next/server .next/static` rỗng; guard exit 0; chunk biên dịch đọc `var e=process.env; ... e.NEXT_PUBLIC_SITE_URL` lúc chạy.
- Verify (lệnh từ `.context/project-config.md`, reviewer STRICT r1): `pnpm vitest run src/lib/seo` 8 file / 75 test PASS, `pnpm typecheck` PASS, `pnpm lint` 0 error.
- Chưa kiểm trên staging thật (cần build lại image + redeploy).

## Ảnh hưởng test

- Direct: trên staging `https://tami.genieplatform.cloud` sau redeploy — `<link rel="canonical">`, `hreflang`, `og:url`, JSON-LD (Organization, RealEstateListing, Article, JobPosting, FAQPage, BreadcrumbList), `sitemap.xml` + sitemap con (`<loc>`), `robots.txt` (dòng Sitemap), `llms.txt` dùng `https://tami.genieplatform.cloud`, không còn `http://localhost:3000` / `build-placeholder.invalid`.
- Dependents: mọi trang công khai vi/en dùng `getSiteUrl()` — layout `[locale]`, trang chủ (`load-home.ts`), danh sách/chi tiết Dự án, Cho thuê, Đăng tin BĐS, Tin tức, Tuyển dụng, `Breadcrumb`.
- Regression: staging vẫn `noindex` (meta robots / header) và chặn truy cập công khai; link "Xem website" admin + link trong email (qua `getEnv()`) vẫn đúng; build Docker thành công khi không có placeholder trong bundle.
- Residual: chưa chạy `next start` / staging thật sau fix; bản sửa dựa vào việc Next/SWC không gập hằng qua `var e=process.env; e.X` (đúng với phiên bản hiện tại, guard Docker bắt nếu nâng Next làm hỏng). MINOR mở: guard `try/catch` nuốt mọi lỗi đọc thư mục; `findPlaceholderFiles` chưa có unit test. Risk medium.
