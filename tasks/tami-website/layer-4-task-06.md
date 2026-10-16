# Task 06: Stack giám sát: Prometheus, Grafana, Loki, GlitchTip, Uptime Kuma + cảnh báo

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — hạ tầng trên server dùng chung, expose cổng
- Blast radius: docker/monitoring/docker-compose.monitoring.yml; docker/monitoring/prometheus.yml, alerts.yml; docker/monitoring/loki-config.yml, promtail-config.yml; …
- Doc impact (dự kiến): docs/runbooks/monitoring.md (mới)
- Decision impact: NO

## Requirements
- NFR-06
- ARCHITECTURE §8 (giám sát, cảnh báo)
- project-config `monitor_enabled: true`

## Description
Compose giám sát dùng chung prod/staging, bind `127.0.0.1`, có dashboard và cảnh báo cơ bản.

## Dependencies
- `layer-3-task-03` Dockerfile + Compose staging/prod + cấu hình Nginx host (dùng kết quả của task này)
- `layer-3-task-01` Giám sát phía app: GlitchTip (Sentry SDK), log JSON cho Loki, metrics Prometheus nội bộ (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [ ] Mọi UI giám sát chỉ bind `127.0.0.1`, truy cập qua Nginx + Cloudflare Access
- [ ] Cảnh báo: ổ cứng > 80%, 5xx tăng đột biến, `/api/health` fail, backup không chạy (metric từ task backup)
- [ ] Uptime Kuma: trang chủ, `/api/health`, staging mỗi phút; kênh email/Telegram cấu hình bằng env
- [ ] `mem_limit` từng service, tổng ~1GB

## Tests cần viết
- `docker compose config` hợp lệ; `promtool check rules alerts.yml` nếu có

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-06-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: docs/runbooks/monitoring.md (mới))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-06 monstack` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- docker/monitoring/docker-compose.monitoring.yml
- docker/monitoring/prometheus.yml, alerts.yml
- docker/monitoring/loki-config.yml, promtail-config.yml
- docker/monitoring/grafana/provisioning/*
- docs/runbooks/monitoring.md

## Notes
- HỎI USER TRƯỚC KHI LÀM: server đã có Grafana/Prometheus/Loki của dự án khác chưa; dùng chung hay tách riêng cho TAMI. Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
