# Task 01: Deploy production (cần user duyệt, mốc M5) + kiểm tra AI-readiness + bàn giao

## Layer
15 — Release: deploy production

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — production + migration + dữ liệu thật
- Blast radius: (server) /opt/tami/.env (không commit); (server) tami.conf Nginx; docs/runbooks/deploy.md, docs/runbooks/restore.md (cập nhật)
- Doc impact (dự kiến): docs/runbooks/*; ARCHITECTURE §6.3 (tên miền thật)
- Decision impact: NO

## Requirements
- NFR-05, NFR-06, NFR-10
- .agent/devops.md Phase 3 + Phase Final (AI-readiness)
- SPECIFICATIONS § Câu hỏi mở (Q1, Q4, Q5, Q6, tên miền cần trước go-live/production)

## Description
Promote đúng image + migration đã chạy ở staging lên production sau khi user duyệt.

## Dependencies
- `layer-14-task-01` Header bảo mật: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy (thứ tự: làm sau khi Should xong)
- `layer-14-task-02` Kiểm tra CWV, WCAG AA, responsive trên các trang chính và sửa lỗi nhỏ (thứ tự: làm sau khi Should xong)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (cần staging đủ Must để đo/kiểm)
- `layer-13-task-01` Dashboard admin (FR-ADM-14): lead, nội dung, lượt bấm, cảnh báo dịch, chi phí dịch (thứ tự: làm sau khi Should xong)
- `layer-13-task-02` Quản lý chuyển hướng 301 trong admin (FR-ADM-15): kiểm tra hợp lệ, chống vòng/chuỗi (thứ tự: làm sau khi Should xong)
- `layer-13-task-03` Trang đích khu vực Cho thuê (FR-PUB-16, S06) (thứ tự: làm sau khi Should xong)
- `layer-13-task-04` Khối Đối tác / chủ đầu tư trên trang chủ (FR-PUB-17) (thứ tự: làm sau khi Should xong)

Mở khoá cho: `layer-16-task-01`

## Acceptance Criteria
- [ ] ⏸ Mốc M5: user duyệt production deploy; đã có tên miền, Q4 nội dung thật, Q6 hạn mức Claude API, Q5 (pháp lý EN) xử lý
- [ ] Không có migration `HIGH_RISK_MIGRATION` chưa xử lý; migration đã chạy staging
- [ ] Deploy qua GitHub Environment `production` (required reviewers) đúng digest image staging
- [ ] Health check production 200; fail → tự rollback image trước
- [ ] Không seed dữ liệu mẫu ở production; chỉ seed nền
- [ ] AI-readiness: `llms.txt`, `robots.txt` (không chặn AI crawlers, có Sitemap), sitemap, JSON-LD — kiểm bằng curl
- [ ] Uptime Kuma + backup production chạy; diễn tập khôi phục lần đầu lên staging (RTO đo được)
- [ ] Search Console + GA4 cấu hình (ID trong site-settings)

## Tests cần viết
- Evidence: log deploy, health, curl các file AI-readiness, kết quả backup/restore

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Thao tác server: chỉ sau khi user xác nhận từng bước; evidence ghi vào task + Run Journal
- Reviewer report path: `.context/review-reports/build-tami-website-layer-15-task-01-round-<R>-review.md`

## Migration
- Chạy `payload migrate` production với đúng tập migration đã qua staging. Cấm `db push`, reset, seed mẫu, clone data staging→prod.

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
- Doc impact result: pending (dự kiến: docs/runbooks/*; ARCHITECTURE §6.3 (tên miền thật))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-15): task-01 deployprod` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-15/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- (server) /opt/tami/.env (không commit)
- (server) tami.conf Nginx
- docs/runbooks/deploy.md, docs/runbooks/restore.md (cập nhật)

## Notes
- Hẹn giờ xuất bản (Could) KHÔNG nằm trong lần deploy này; làm ở layer cuối và lên production qua lần deploy kế tiếp (CD: staging → duyệt tay → production).
- Sau task này: spec-publisher sinh `spec/test-scope/current.json` (`trigger: initial-build`) theo `.agent/loop.md`; chạy lại sau khi Could lên production.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
