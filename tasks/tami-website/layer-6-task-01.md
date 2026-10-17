# Task 01: Deploy staging sớm: Compose staging, Nginx, Cloudflare/noindex, CD chạy thật, health check

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — thao tác trên server thật dùng chung + migration lần đầu + secret
- Blast radius: (server) /opt/tami-staging/.env (không commit); (server) /etc/nginx/sites-available/tami-staging.conf (copy từ `docker/nginx/`); docs/runbooks/deploy.md (cập nhật kết quả thật); …
- Doc impact (dự kiến): docs/runbooks/deploy.md; ARCHITECTURE §6.4 (chốt cách runner/registry)
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- NFR-10 (staging tách biệt, CI/CD)
- ARCHITECTURE §6.1–§6.4, §7
- SPECIFICATIONS § Deployment
- .agent/devops.md Phase 3
- AGENTS.md Non-negotiables (migration)

## Description
Đưa bản đầu (khung website + nội dung đợt 1) lên staging để các task sau kiểm thử trên môi trường thật; pipeline CD (task CD) chạy thật lần đầu.

## Dependencies
- `layer-4-task-05` CD GitHub Actions: image theo SHA → staging (migrate, health) → duyệt tay → production (dùng kết quả của task này)
- `layer-3-task-03` Dockerfile + Compose staging/prod + cấu hình Nginx host (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-07` Banner đồng ý cookie + tải GA4 sau khi đồng ý (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-2-task-02` `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)

Mở khoá cho: `layer-9-task-07`, `layer-12-task-01`

## Acceptance Criteria
- [ ] Dockerfile COPY `seed/` (và chạy `seed:categories` được trong container) trước deploy staging (review L4-T01)
- [ ] Từ layer-1-task-06/L3-T03: kiểm `nginx -v` (≥ 1.18 cho `listen 443 ssl http2`) và `docker version` trên server; hỏi user bật Authenticated Origin Pulls (khối conf đã có, đang comment); smoke test 2 IP thật qua Cloudflare rơi vào 2 bucket rate limit (spec-validation layer 3)
- [ ] Cloudflare cache rule: `/api/*` bypass **trừ `/api/media/file/*`** → cache (Edge TTL theo header origin immutable) — **chỉ áp host prod**; host staging bypass cache toàn bộ (hoặc Cloudflare Access) để ảnh/static staging không lọt qua basic auth (review L3-T03 round 2 MINOR-R2-1/R2-2) (G1 (user chốt 2026-10-17, phương án a): ngoại lệ cache cho ảnh `/api/media/file/*`)
- [ ] ⏸ Mỗi bước chạm server (tạo thư mục, `.env`, Nginx, Cloudflare, chạy pipeline) chỉ làm sau khi user xác nhận trong chat
- [ ] Compose staging chạy `tami-staging-*` (app, jobs, postgres, redis; SeaweedFS bucket riêng); chỉ app bind `127.0.0.1:3011`
- [ ] Nginx `tami-staging.conf`: `nginx -t` PASS rồi mới reload; chỉ nhận IP Cloudflare; không sửa file site khác
- [ ] Cloudflare: DNS staging, SSL Full Strict, Cloudflare Access (hoặc basic auth) chặn công khai; `X-Robots-Tag: noindex` + robots `Disallow: /`
- [ ] Pipeline CD chạy thật từ nhánh `staging`: image theo SHA → `payload migrate` → app + jobs up → `/api/health` 200; thử rollback một lần (health fail giả lập) có ghi evidence
- [ ] Seed nền (tỉnh/phường, danh mục, pages) + dữ liệu mẫu `--sample` chỉ ở staging; email chỉ tới `EMAIL_ALLOWLIST`
- [ ] Các trang đã có (dự án, tin tức, dịch vụ, pháp lý, tuyển dụng) mở được qua tên miền staging

## Tests cần viết
- Evidence: log pipeline, `curl -I` health + trang chủ qua Cloudflare, `nginx -t`, ảnh chụp trang
- Xác nhận DB staging khác DB production (tên env `DATABASE_URL_STAGING`)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-01-round-<R>-review.md`

## Migration
- Chạy lần đầu toàn bộ migration đã commit tới L5 trên DB staging (bảng mới, additive). Kiểm danh sách migration trước khi chạy; cấm `db push`/reset. Từ đây migration đã apply ở staging **không được sửa**.
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
- Doc impact result: pending (dự kiến: docs/runbooks/deploy.md; ARCHITECTURE §6.4 (chốt cách runner/registry))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-01 deploystg0` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- (server) /opt/tami-staging/.env (không commit)
- (server) /etc/nginx/sites-available/tami-staging.conf (copy từ `docker/nginx/`)
- docs/runbooks/deploy.md (cập nhật kết quả thật)
- .context/decisions.md (runner, registry, tên miền staging)

## Notes
- HỎI USER TRƯỚC KHI LÀM: tên miền staging, cách runner (self-hosted `/opt/actions-runner-tami` hay build GitHub + SSH), registry (GHCR?), secret staging, Cloudflare Access hay basic auth. Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Firewall server đang tắt: KHÔNG tự bật (ảnh hưởng dự án khác), chỉ báo cáo.
- Giám sát + backup chưa bật ở đây; bật ở task redeploy staging đầy đủ.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
