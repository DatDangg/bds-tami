# Task 01: Scaffold Next.js + Payload 3 + tooling + Docker Compose dev

## Layer
0 — Nền: scaffold ứng dụng

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Nền
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — nền dùng chung: config Payload/DB adapter, cấu trúc thư mục, env
- Blast radius: package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, eslint.config.mjs, vitest.config.ts; src/payload.config.ts; src/app/(payload)/** (do Payload sinh), src/app/(frontend)/[locale]/layout.tsx + page.tsx (placeholder); …
- Doc impact (dự kiến): README (cách chạy dev). ARCHITECTURE không đổi.
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- NFR-02 (stateless)
- NFR-10
- ARCHITECTURE §3, §4
- design doc D1, D2, D3

## Description
Dựng app Next.js (App Router) nhúng Payload CMS 3, TypeScript strict, pnpm; có đủ script `lint`/`typecheck`/`test`/`build`; Postgres adapter (`idType: uuid`), `localization` vi/en `fallback: false`, GraphQL tắt, admin tiếng Việt; Docker Compose dev cho PostgreSQL+PostGIS, Redis, SeaweedFS.

## Dependencies
- Không có (task đầu tiên)

Mở khoá cho: `layer-1-task-01`, `layer-1-task-02`, `layer-1-task-03`, `layer-1-task-04`, `layer-1-task-05`, `layer-1-task-06`, `layer-1-task-07`

## Acceptance Criteria
- [ ] `pnpm install` tạo lockfile; sau đó `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` đều PASS
- [ ] Cấu trúc thư mục đúng ARCHITECTURE §4 (`collections/`, `globals/`, `access/`, `hooks/`, `endpoints/`, `jobs/`, `lib/`, `components/`, `i18n/`, `seed/`, `migrations/`, `docker/`)
- [ ] `payload.config.ts`: Postgres adapter `idType: "uuid"`, `localization: { locales: ["vi","en"], defaultLocale: "vi", fallback: false }`, `graphQL.disable: true`, admin `i18n` tiếng Việt
- [ ] `src/lib/env.ts` validate env bằng zod; thiếu biến bắt buộc thì app báo lỗi rõ tên biến (không in giá trị); `.env.example` liệt kê đủ biến ở `project-config.md` § Secrets, không có secret thật
- [ ] `docker compose -f docker/docker-compose.dev.yml up -d` chạy Postgres có đủ 3 extension `postgis`, `unaccent`, `pg_trgm`, Redis, SeaweedFS (2 bucket `public`, `private`); mọi cổng bind `127.0.0.1`
- [ ] Mở `http://localhost:3000/admin` thấy màn tạo tài khoản đầu tiên của Payload (giao diện tiếng Việt)
- [ ] Migration khởi tạo sinh bằng `pnpm payload migrate:create`, nằm trong `migrations/`; không dùng `push: true` ở bất kỳ môi trường nào

## Tests cần viết
- Unit `src/lib/env.test.ts`: thiếu biến → throw có tên biến; đủ biến → parse đúng kiểu
- Smoke: Vitest chạy được 2 project `unit` và `integration` (integration dùng DB dev qua `DATABASE_URL_TEST`)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install` (lần đầu, tạo lockfile) → `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`; từ task sau dùng `pnpm install --frozen-lockfile`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-0-task-01-round-<R>-review.md`

## Migration
- Migration khởi tạo (bảng hệ thống của Payload). Additive. Tắt `push` của adapter (`push: false`). Chỉ chạy `payload migrate` trên DB dev local.
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
- Doc impact result: pending (dự kiến: README (cách chạy dev). ARCHITECTURE không đổi.)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-0): task-01 scaffold` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-0/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, eslint.config.mjs, vitest.config.ts
- src/payload.config.ts
- src/app/(payload)/** (do Payload sinh), src/app/(frontend)/[locale]/layout.tsx + page.tsx (placeholder)
- src/lib/env.ts (zod validate env), .env.example
- docker/docker-compose.dev.yml, docker/postgres/init.sql (CREATE EXTENSION postgis, unaccent, pg_trgm)
- migrations/ (migration khởi tạo)
- README.md (mục chạy dev)
- tests/setup.ts

## Notes
- Lần đầu chưa có lockfile nên bước install chưa thể `--frozen-lockfile`; từ task sau bắt buộc frozen.
- Chọn phiên bản Payload 3 ổn định mới nhất hỗ trợ `trash` (xoá mềm) và Jobs Queue; ghi phiên bản vào `.context/decisions.md`.
- Không cài thư viện UI/i18n ở task này (task riêng).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
