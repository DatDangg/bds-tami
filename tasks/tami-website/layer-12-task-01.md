# Task 01: Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging

## Layer
12 — Redeploy staging đủ Must + giám sát/backup + chạy E2E trên staging

Checkpoint: ⏸ **Mốc M3** — dừng chờ user duyệt sau layer này (Staging đầy đủ Must + giám sát/backup + E2E PASS trên staging)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — thao tác trên server thật dùng chung + migration + secret
- Blast radius: (server) /opt/tami-staging/.env (không commit); (server) /etc/nginx/sites-available/tami-staging.conf (copy từ repo); docs/runbooks/deploy.md (cập nhật kết quả); …
- Doc impact (dự kiến): docs/runbooks/deploy.md, ARCHITECTURE §6.4 (chốt cách deploy)
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- NFR-05, NFR-06, NFR-10
- ARCHITECTURE §6, §7, §8
- .agent/devops.md Phase 3
- AGENTS.md Non-negotiables (migration)

## Description
Deploy qua pipeline bản đủ toàn bộ Must lên staging (đã dựng sớm), bật stack giám sát + backup, chạy bộ E2E smoke vào staging và smoke thủ công.

## Dependencies
- `layer-4-task-05` CD GitHub Actions: image theo SHA → staging (migrate, health) → duyệt tay → production (dùng kết quả của task này)
- `layer-4-task-06` Stack giám sát: Prometheus, Grafana, Loki, GlitchTip, Uptime Kuma + cảnh báo (dùng kết quả của task này)
- `layer-4-task-07` Backup: pgBackRest (WAL liên tục) + restic (file) + runbook khôi phục (dùng kết quả của task này)
- `layer-10-task-01` Ráp form lead vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ (dùng kết quả của task này)
- `layer-10-task-03` Hoàn thiện bản EN công khai: `en.json`, chuyển ngôn ngữ đúng trang tương ứng, hreflang toàn site (dùng kết quả của task này)
- `layer-10-task-02` Admin dịch: nút "Dịch lại bằng AI", lọc trạng thái dịch, duyệt bản EN trang pháp lý, cảnh báo lỗi dịch (dùng kết quả của task này)
- `layer-9-task-03` Phân công lead: hook `leads.afterChange` (nơi duy nhất) + `POST /api/admin/leads/:id/assign` (dùng kết quả của task này)
- `layer-9-task-04` Job `remind-unassigned-leads` theo giờ hành chính (BR-14) (dùng kết quả của task này)
- `layer-9-task-05` Xuất lead ra Excel `GET /api/admin/leads/export` + audit (dùng kết quả của task này)
- `layer-9-task-06` Job `data-retention`: ẩn danh lead 24 tháng, xoá CV 12 tháng, dọn log (dùng kết quả của task này)
- `layer-7-task-04` Form ứng tuyển trên trang chi tiết tuyển dụng (dùng kết quả của task này)
- `layer-8-task-05` `sitemap.xml` (vi + en, alternates), `robots.txt`, `llms.txt` (dùng kết quả của task này)
- `layer-6-task-03` Redirect 301 tự động khi đổi slug (theo từng ngôn ngữ) + xử lý redirect phía website (dùng kết quả của task này)
- `layer-6-task-10` Endpoint tải CV `GET /api/admin/private-files/:id/download` + audit (dùng kết quả của task này)
- `layer-2-task-04` Phiên đăng nhập hết hạn sau 8 giờ không hoạt động (làm mới token) (dùng kết quả của task này)
- `layer-2-task-05` Giao diện admin: logo TAMI, màu nhấn, font, nhóm menu tiếng Việt (dùng kết quả của task này)
- `layer-6-task-01` Deploy staging sớm: Compose staging, Nginx, Cloudflare/noindex, CD chạy thật, health check (dùng staging sớm để kiểm trên môi trường thật)
- `layer-11-task-01` E2E smoke (Playwright): trang chủ, lọc cho thuê, gửi lead, ứng tuyển, chuyển EN (dùng kết quả của task này)

Mở khoá cho: `layer-13-task-01`, `layer-13-task-02`, `layer-13-task-03`, `layer-13-task-04`, `layer-14-task-01`, `layer-14-task-02`, `layer-15-task-01`

## Acceptance Criteria
- [ ] ⏸ Bước chạm server (bật giám sát, backup, kho backup ngoài server) chỉ làm sau khi user xác nhận
- [ ] Pipeline: image SHA → `payload migrate` (chỉ migration mới kể từ lần deploy trước) → app + jobs up → `/api/health` 200
- [ ] Bộ E2E smoke (task E2E) chạy vào URL staging PASS; ghi report
- [ ] Smoke thủ công: gửi lead (email tới allowlist), ứng tuyển + admin tải CV, dịch 1 bài thật bằng Claude API (hạn mức thấp), chuyển VI ↔ EN
- [ ] Uptime Kuma + Grafana thấy staging; cảnh báo thử 1 lần; backup chạy lần đầu thành công + thử khôi phục DB lên container tạm
- [ ] Staging vẫn `noindex` + chặn công khai

## Tests cần viết
- Evidence: log pipeline, report E2E, ảnh smoke, kết quả backup/restore

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Thao tác server: chỉ sau khi user xác nhận từng bước; evidence ghi vào task + Run Journal
- Reviewer report path: `.context/review-reports/build-tami-website-layer-12-task-01-round-<R>-review.md`

## Migration
- Chạy các migration mới (từ L6 tới L10) trên DB staging. Kiểm từng file trước khi chạy; không có HIGH_RISK. Cấm `db push`/reset.

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
- Doc impact result: pending (dự kiến: docs/runbooks/deploy.md, ARCHITECTURE §6.4 (chốt cách deploy))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-12): task-01 deploystg` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-12/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

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
- (server) /etc/nginx/sites-available/tami-staging.conf (copy từ repo)
- docs/runbooks/deploy.md (cập nhật kết quả)
- .context/decisions.md (runner, registry, tên miền staging)

## Notes
- HỎI USER TRƯỚC KHI LÀM: kho backup ngoài server (server khác của công ty hay Backblaze B2), kênh cảnh báo (email/Telegram). Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Firewall server đang tắt: KHÔNG tự bật, chỉ báo cáo.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5
- [ ] G18 (L5-T05): đưa `pnpm e2e:revalidate` (`tests/e2e/revalidate-globals.ts`, cần `next start`) vào CI / E2E smoke staging thay vì chỉ chạy tay; ghi kết quả vào evidence.

## Follow-up từ layer-6-task-01 (staging tạm)
- [ ] Staging đang dùng giá trị TẠM trong `/opt/tami/staging.env`: Turnstile = khoá TEST công khai Cloudflare (captcha luôn qua), SMTP giả `smtp.invalid` (email không gửi). Thay bằng Brevo + Turnstile thật trước khi kiểm E2E form/email trên staging.

## Follow-up hoãn từ layer-6-task-01 (đóng 2026-10-18)
- [ ] Diễn tập rollback image trên staging ở lần deploy thật này (runbook `docs/runbooks/deploy.md` §9 bước 12): commit cố ý làm `/api/health` lỗi qua CI/CD → exit 1, `current` + image về release trước, health 200 → revert bằng commit mới. KHÔNG làm hỏng `staging.env` (rollback dùng chung env → exit 3).
- [ ] Điền `mapLocation` ở site-settings staging rồi kiểm `/lien-he`: MapLibre vẽ tile, console không lỗi "Worker failed to load"; ảnh chụp làm evidence.
- [ ] Điều tra `pnpm seed --sample` lần đầu exit 1 trên staging (L6-T01, sau 4 dự án; lần 2 PASS): chạy trên DB trống, giữ toàn bộ output.
- [ ] Đặt repository variable `NEXT_PUBLIC_HOTLINE` (GitHub) rồi build lại; kiểm trên staging trang lỗi gốc (`global-error`, DB lỗi) hiện số hotline (G17, runbook §9 bước 13).
- [ ] Admin publish 2 trang pháp lý (seed draft; `siteName` đã điền) → kiểm `/chinh-sach-bao-mat` + trang pháp lý còn lại mở được qua staging (AC L62 của L6-T01).
- [ ] G18: kiểm upload source map GlitchTip thật: bật `GLITCHTIP_AUTH_TOKEN` (secret) + `vars.GLITCHTIP_*`, build image, gây lỗi thử, stack trace trên GlitchTip không minify (`scripts/upload-sourcemaps.mjs`, runbook §8).
