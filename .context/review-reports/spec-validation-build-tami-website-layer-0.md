Agent: spec-validator

# Phase review: build tami-website, layer 0 (đóng layer)

- Scope: `tasks/tami-website/layer-0-task-01.md`, commit `4263910`
- Reviewer: STRICT PASS round 1 (`.context/review-reports/build-tami-website-layer-0-task-01-round-1-review.md`)
- Nguồn đối chiếu: SPECIFICATIONS.md v1.2.2 (F12), docs/ARCHITECTURE.md §3–4, docs/ERD.md §1–1.1, docs/specs/2026-10-16-tami-website-design.md D1–D3

## Verdict
✅ COMPLETE. Mọi chỗ lệch spec đều đã có task follow-up. Không có gap nào chưa được giao task.

## Ma trận coverage
| Requirement | Nguồn | Status | Bằng chứng / ghi chú |
|---|---|---|---|
| Next.js App Router + Payload 3, TS, 1 package | ARCH §3 · Design D1 | OK | package.json; decisions.md Decision 1 (Next 16.4.2 + Payload 3.91.0) |
| Cấu trúc thư mục | ARCH §4 | OK (tới mức scaffold) | src/{collections,globals,access,hooks,endpoints,jobs,lib,components,i18n}, migrations/, seed/, docker/. `src/i18n/*`, `middleware.ts` thuộc layer-1-task-03; docker prod/staging + nginx thuộc task deploy |
| Postgres + PostGIS + unaccent + pg_trgm | ERD §1 · D2 | OK | docker/postgres/init.sql; integration smoke xác nhận 3 extension |
| UUID PK | ERD §1 | OK | src/payload.config.ts:41 `idType: "uuid"` |
| Migration versioned, cấm push | ERD §1 · D2 · AGENTS | OK | payload.config.ts:43 `push: false`; migrations/20261016_090115_init.ts chỉ additive |
| localization vi/en, defaultLocale vi, fallback false | ERD §1.1 · D3 · BR-07 | OK | payload.config.ts:33-38 |
| GraphQL tắt (REST + Local API) | ARCH §3 | OK | payload.config.ts:28 |
| Admin chỉ tiếng Việt | Spec/AC task | PARTIAL, có follow-up | payload.config.ts:30 `supportedLanguages: { vi, en }` → giao cho layer-1-task-02 (F1) |
| VI không tiền tố, EN `/en/...` (`localePrefix: 'as-needed'`) | SPEC F12 · ARCH D6 · D3 | PARTIAL, có follow-up | Hiện chỉ có `src/app/(frontend)/[locale]/`, `/` trả 404 và `/vi` render được. Đã giao layer-1-task-03 (F4): as-needed, redirect 301 `/vi/*` về bản không tiền tố |
| Env validate (zod), .env.example không có secret | NFR-10 · project-config § Secrets | OK | src/lib/env.ts, src/lib/env.test.ts; build cần đủ 17 biến → layer-1-task-01 (F2) |
| Staff auth collection (slug khớp ERD) | ERD §staff | OK (tối thiểu) | src/collections/Staff.ts; layer-1-task-02 mở rộng vai trò/field |
| Stateless (NFR-02) | NFR-02 | OK tới mức scaffold | Không có state cục bộ; Redis/S3 storage gắn ở task sau |

## Gaps
- [PARTIAL] F12 / D6: route VI đang có tiền tố `/vi`. Task xử lý: `tasks/tami-website/layer-1-task-03.md` (§Follow-up F4).
- [PARTIAL] Admin chỉ tiếng Việt: `supportedLanguages` còn `en`. Task xử lý: `tasks/tami-website/layer-1-task-02.md` (§Follow-up F1).
- Không có [MISSING].

## Doc reconcile cần làm
- `docs/ARCHITECTURE.md:105` (§4) ghi `src/middleware.ts`. Next 16 dùng `proxy.ts`. Doc này là as-built nên reconcile ở layer-1-task-03 khi tạo file (task đã ghi chú). Nên sửa luôn câu "middleware `next-intl`" ở `docs/ARCHITECTURE.md:142`.
- `README.md` (mục chạy dev) và `decisions.md` đã cập nhật trong layer 0. ERD và API_SPEC không bị ảnh hưởng.

## Residual risk
- AC "/admin hiện màn tạo tài khoản đầu tiên tiếng Việt": reviewer chưa xác minh runtime và spec-validator cũng không chạy app. Cần evidence khi làm layer-1-task-02 (sau khi bỏ `en`).
- SeaweedFS 2 bucket mới kiểm tĩnh qua compose/s3.json.
- Tách bạch: `pnpm audit` còn high `braces` (build-time). Đã giao layer-1-task-01 (F3).

## Đề xuất
1. Sang layer 1.
2. Khi review layer-1-task-03, phải kiểm `/` render bản VI, `/vi/*` trả 301, và ARCHITECTURE §4 đã đổi sang `proxy.ts` (dòng 105 và 142).
3. Khi review layer-1-task-02, phải kiểm `supportedLanguages: { vi }` và có evidence màn admin tiếng Việt.
