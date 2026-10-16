# Task 03: Dockerfile + Compose staging/prod + cấu hình Nginx host

## Layer
3 — Bộ field nội dung dùng chung + giám sát app + Docker

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — hạ tầng mạng/expose cổng trên server dùng chung, secret
- Blast radius: docker/Dockerfile (multi-stage, user non-root, HEALTHCHECK `/api/health`); docker/docker-compose.prod.yml, docker/docker-compose.staging.yml; docker/nginx/tami.conf, tami-staging.conf; …
- Doc impact (dự kiến): ARCHITECTURE §6 nếu cổng/service khác
- Decision impact: NO

## Requirements
- NFR-02, NFR-04, NFR-10
- ARCHITECTURE §6.1–§6.3, §7 (mạng)
- SPECIFICATIONS § Deployment
- .devops/templates/docker-vps.md

## Description
Image production (Next standalone) dùng chung cho `app` và `jobs`; compose riêng cho staging và production; file Nginx cho host.

## Dependencies
- `layer-2-task-06` `GET /api/health` (DB, Redis, S3) (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-05`, `layer-4-task-06`, `layer-4-task-07`, `layer-6-task-01`

## Acceptance Criteria
- [ ] Compose project riêng, container tiền tố `tami-` / `tami-staging-`, network riêng
- [ ] Chỉ app bind cổng: prod `127.0.0.1:3010`, staging `127.0.0.1:3011`; Postgres/Redis/SeaweedFS không publish cổng
- [ ] Mỗi service có `mem_limit` theo ARCHITECTURE §6.2; `restart: unless-stopped`; log driver phù hợp Loki
- [ ] Service `jobs` dùng cùng image, chạy `pnpm jobs`
- [ ] Nginx: chỉ nhận dải IP Cloudflare (`allow`/`deny` + `real_ip_header CF-Connecting-IP`), `/admin` + `/api` không cache, staging thêm `X-Robots-Tag: noindex` và chặn truy cập công khai (Cloudflare Access hoặc basic auth)
- [ ] Staging và prod dùng DB/Redis/bucket khác nhau (`DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`)
- [ ] `docker build` thành công local; image không chứa `.env`, source map public, devDependencies

## Tests cần viết
- `docker build` + `docker compose -f docker/docker-compose.staging.yml config` hợp lệ
- Chạy image local với DB dev: `/api/health` 200
- `nginx -t` trên file cấu hình (container nginx tạm) nếu có thể; không đụng server thật

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-03-round-<R>-review.md`

## Migration
- Không tạo migration. Container app **không** tự chạy migrate khi start; migrate là bước riêng trong pipeline deploy.

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
- Doc impact result: pending (dự kiến: ARCHITECTURE §6 nếu cổng/service khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-03 docker` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- docker/Dockerfile (multi-stage, user non-root, HEALTHCHECK `/api/health`)
- docker/docker-compose.prod.yml, docker/docker-compose.staging.yml
- docker/nginx/tami.conf, tami-staging.conf
- .dockerignore
- .env.example (khối staging/prod)

## Notes
- KHÔNG SSH vào server ở task này. Mọi thao tác trên server làm ở task deploy-staging/production có user duyệt.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-04
- `src/lib/fonts.ts` dùng `next/font/google`: `next build` tải font từ Google Fonts nên bước build trong Dockerfile/CI cần mạng ra ngoài tới Google Fonts. Nếu build bị cô lập mạng thì chuyển sang `next/font/local` (tải sẵn file woff2 vào repo).

## Follow-up từ review layer-1-task-06 (16/10/2026) — BẮT BUỘC
- [ ] Đặt `TRUST_CF_CONNECTING_IP=true` cho staging và production (thiếu cờ → mọi khách chung bucket rate limit `unknown` → 1 kẻ spam chặn form lead toàn site).
- [ ] Nginx: chỉ allow dải IP Cloudflare + `deny all`; cổng app chỉ bind 127.0.0.1, không lộ trực tiếp.
- [ ] Nginx chuyển nguyên header `CF-Connecting-IP` (không ghi đè/không nhận từ client ngoài Cloudflare).
- [ ] Đề xuất bật Cloudflare Authenticated Origin Pulls (mTLS) vì dải IP Cloudflare dùng chung mọi khách hàng — hỏi user.
- [ ] Smoke test: 2 IP khác nhau rơi vào 2 bucket khác nhau.
- [ ] Từ review layer-1-task-07: đặt bắt buộc `APP_ENV=production` (prod) / `APP_ENV=staging` + `EMAIL_ALLOWLIST` (staging) cho cả service `app` và `jobs`; service `jobs` chạy `pnpm jobs` (image cần `payload` CLI + loader TS).
- [ ] Từ review layer-1-task-07 round 2: service `jobs` đặt `stop_grace_period: 60s` (worker chờ vòng đang chạy, tối đa 10 job SMTP); cân nhắc timeout cho nodemailer; kiểm SIGTERM thật trên Linux và job kẹt `processing=true` sau SIGKILL.
