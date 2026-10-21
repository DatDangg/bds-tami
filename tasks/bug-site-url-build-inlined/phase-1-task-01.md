# bug-site-url-build-inlined · phase-1-task-01 — URL gốc bị nhúng placeholder lúc build (BL-053)

- Change doc: `spec/changes/2026-10-21-site-url-build-inlined.md` (BACKLOG BL-053).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r1, spec 1.45.1 / scope v57 — auto proceed (primary chỉ định). Doc impact: no doc impact (docs as-built không mô tả cơ chế đọc env; spec F11 cập nhật qua spec-publisher).

## Classification / Risk
- Type: **BUG** (cấu hình runtime dùng chung cho SEO; không schema/API/quyền/dữ liệu).
- Risk: **MEDIUM-HIGH** — `getSiteUrl()` dùng chung cho canonical / hreflang / OG url / JSON-LD / sitemap / robots / llms.txt / Breadcrumb trên mọi trang công khai; sai giá trị = SEO sai ở production.
- Expected review level: **STRICT** (shared config, SEO toàn site, build pipeline Dockerfile).
- Blast radius: `src/lib/seo/site-url.ts` và mọi nơi gọi `getSiteUrl()`; `docker/Dockerfile` (stage builder).
- Doc impact: dự kiến `docs/DESIGN.md`/ARCHITECTURE chỉ nếu mô tả cơ chế đọc env; còn lại `no doc impact` (không đổi contract/schema).

## Repro (trước khi sửa — evidence trong change doc, đo trên staging 2026-10-21)
- Container có `NEXT_PUBLIC_SITE_URL=https://tami.genieplatform.cloud`.
- `GET /` → `<link rel="canonical" href="http://localhost:3000"/>`; `GET /sitemap.xml` → mọi `<loc>` `http://localhost:3000/sitemaps/...`.
- Bundle đang chạy: `/app/.next/server/chunks/*.js` chứa `let e="http://localhost:3000".trim();`.

## Root cause
`src/lib/seo/site-url.ts:8,17` — `const SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL"; process.env[SITE_URL_KEY]` được compiler (SWC của Next) lan truyền hằng thành `process.env.NEXT_PUBLIC_SITE_URL` rồi thay bằng giá trị lúc build. Image build với placeholder `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (`docker/Dockerfile:34`) → giá trị placeholder bị đóng cứng vào bundle server, giá trị runtime bị bỏ qua.
Ngược lại `getEnv()` (`src/lib/env.ts`) truyền NGUYÊN object `process.env` vào zod → không bị gập → admin `SiteLink`/email link đọc đúng lúc chạy.

## Thiết kế fix
1. `src/lib/seo/site-url.ts`: đọc URL gốc qua đường KHÔNG gập được hằng — truyền nguyên object `process.env` vào hàm thuần (vd `parseSiteUrl(env: Record<string, string | undefined>)` đọc `env.NEXT_PUBLIC_SITE_URL`), `getSiteUrl()` gọi `parseSiteUrl(process.env)`. Giữ nguyên hành vi: `NEXT_PHASE === "phase-production-build"` → `undefined`; thiếu/sai/không http(s) → `undefined`; trả `origin`. Không dùng `getEnv()` ở đây (validate cả bộ env, ném lỗi làm sập trang công khai). Cập nhật JSDoc giải thích đúng cơ chế (khoá động KHÔNG đủ).
   - Builder tự quyết cách cụ thể nếu có cách an toàn hơn, nhưng phải CHỨNG MINH bằng bundle thực (bước 3).
2. `docker/Dockerfile`: đổi placeholder build thành giá trị phân biệt được (vd `http://build-placeholder.invalid`) + sau `pnpm build` chạy guard (vd `node scripts/check-build-placeholder.mjs`) quét `.next/server` + `.next/static` — thấy placeholder → build FAIL. Cập nhật comment Dockerfile.
3. Kiểm bundle: chạy `pnpm build` cục bộ với `NEXT_PUBLIC_SITE_URL` = placeholder phân biệt, xác nhận chunk server KHÔNG còn chuỗi placeholder (và trước fix thì CÓ — repro). Không build được cục bộ → ghi Residual risk + bằng chứng thay thế.
4. Rà các chỗ khác đọc `NEXT_PUBLIC_*`/env theo cùng mẫu khoá động/hằng ở server (`grep process.env\[`, `NEXT_PUBLIC_`): `getEnv()` (object) an toàn; `NEXT_PUBLIC_HOTLINE` cố ý là biến build (giữ); báo cáo kết quả rà, sửa chỗ nào cùng lỗi.

## Files
- `src/lib/seo/site-url.ts`, `src/lib/seo/site-url.test.ts`, `docker/Dockerfile`, `scripts/check-build-placeholder.mjs` (mới, nếu dùng) + test của script nếu hợp lý.
- KHÔNG đụng: `next.config.ts` (trừ khi cần thiết, ghi lý do), `.claude/launch.json`, `docs/specs/listing-detail-redesign/`, change doc BL-052/BL-054, `template-feedback.md`, `.context/runs/*`.

## Acceptance
- [ ] `getSiteUrl()` trả giá trị `NEXT_PUBLIC_SITE_URL` LÚC CHẠY trong bundle production (bundle không chứa placeholder build).
- [ ] Hành vi cũ giữ: build phase → `undefined`; thiếu/sai → `undefined`; trả origin không `/` cuối.
- [ ] Dockerfile guard làm build FAIL nếu placeholder lọt vào bundle.
- [ ] Unit test `site-url.test.ts` PASS (thêm case cho hàm thuần nếu tách).
- [ ] `pnpm vitest run src/lib/seo`, `pnpm typecheck`, `pnpm lint` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: canonical/sitemap trên staging ra `http://localhost:3000`.
- Expected: dùng `NEXT_PUBLIC_SITE_URL` runtime.
- Actual before fix: `pnpm build` cục bộ với `NEXT_PUBLIC_SITE_URL=http://build-placeholder.invalid` → `.next/server` có 3 chunk chứa `let e="http://build-placeholder.invalid".trim();` (đúng cơ chế staging: giá trị build đóng cứng).
- Actual after fix: build lại cùng env → `grep -r build-placeholder.invalid .next/server .next/static` = rỗng; `node scripts/check-build-placeholder.mjs` → OK (exit 0). Guard trên bundle cũ (trước fix) → exit 1 liệt kê 3 chunk, nên guard bắt được lỗi.
- Evidence: unit `src/lib/seo` 8 file / 75 test PASS (thêm 2 case `parseSiteUrl`); `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở file khác, ngoài scope). Chưa chạy `next start` runtime thực; residual risk thấp (bằng chứng là bundle không còn chuỗi + `getEnv()` cùng kiểu truyền object đã chạy đúng trên staging).
- Audit env: `getEnv()` (object) an toàn; các nơi dùng `getEnv().NEXT_PUBLIC_SITE_URL` (SiteLink, DocumentNavSlot, RowActionsCell, leads, job-applications, jobs, hooks) an toàn; `NEXT_PUBLIC_HOTLINE` (global-error, error.tsx) cố ý biến build; `process.env[APP_ENV_KEY]` không phải NEXT_PUBLIC nên không bị gập. Không còn chỗ cùng lỗi.
- Server cần đổi env: không, chỉ build lại image + redeploy.
- Status: PASS (chờ reviewer)
