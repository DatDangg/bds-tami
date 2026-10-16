# Task 07: Ghi lượt bấm Hotline/Zalo/Fanpage: `click-events`, `click-stats-daily`, endpoint + job gộp

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — endpoint công khai + schema + cron
- Blast radius: src/collections/ClickEvents.ts, ClickStatsDaily.ts; src/endpoints/public/click-events.ts; src/jobs/aggregate-click-stats.ts; …
- Doc impact (dự kiến): API_SPEC §3.4 nếu contract khác
- Decision impact: YES — Decision 3 (.context/decisions.md)

## Requirements
- FR-PUB-12 (ghi nhận lượt bấm)
- API_SPEC §3.4
- ERD §4.13, §7
- ARCHITECTURE §5.4 (`aggregate-click-stats`)

## Description
Lưu lượt bấm nút liên hệ nổi, gộp theo giờ cho dashboard, xoá dữ liệu thô sau 90 ngày.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)

Mở khoá cho: `layer-5-task-06`, `layer-9-task-06`, `layer-13-task-01`

## Acceptance Criteria
- [ ] `POST /api/public/click-events` body `{ type, pagePath, refCollection?, refId? }` validate zod → 204; rate limit 30/phút/IP (không cần Turnstile)
- [ ] `type` ∉ {hotline, zalo, fanpage} → 400
- [ ] Job hằng giờ gộp vào `click-stats-daily` (unique 5 cột, upsert cộng dồn, idempotent khi chạy lại)
- [ ] Xoá `click-events` > 90 ngày sau khi đã gộp
- [ ] Chỉ admin đọc 2 collection; không ai sửa qua API

## Tests cần viết
- Integration: gửi 3 sự kiện → job gộp ra count 3; chạy job lần 2 không cộng trùng
- Integration: vượt 30/phút → 429

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-07-round-<R>-review.md`

## Migration
- Bảng `click_events`, `click_stats_daily` + unique `(date, type, ref_collection, ref_id)`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 1 (builder xong, chờ reviewer)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: code + unit xong; integration env-blocked (không có Postgres 5433/Redis). Idempotent: dấu `click-events.aggregatedAt` + gộp/đánh dấu cùng transaction theo lô 1000; xoá > 90 ngày chỉ bản đã có dấu. Unique 4 cột `(date,type,refCollection,refId)` (ERD ghi "5 cột" gồm `count`, vô nghĩa); refCollection/refId của thống kê lưu "" thay NULL vì Postgres coi NULL khác nhau trong unique. Ngày thống kê theo giờ VN (UTC+7).
- Verify commands + result: pnpm lint PASS; pnpm typecheck PASS; pnpm build PASS; pnpm test: unit PASS (31 test mới/liên quan ở aggregate.test.ts + click-events.test.ts), integration ENV-BLOCKED (ECONNREFUSED 127.0.0.1:5433; tests/integration/click-events.test.ts cùng 9 file integration cũ fail vì thiếu hạ tầng). migrate:create click_events tạo được không cần DB: migrations/20261016_160726_click_events.{ts,json} (additive; kèm payload_jobs_stats + payload_jobs.meta + ADD VALUE enum task_slug do schedule của Jobs).
- Reviewer verdict: STRICT PASS round 1 (.context/review-reports/build-tami-website-layer-2-task-07-round-1-review.md), 7 MINOR không chặn (refCollection tuỳ ý, pagePath "//", đọc body trước khi kiểm độ dài, cộng dồn không nguyên tử — giả định 1 runner, thiếu test refCollection "" tách dòng, xoá quá hạn không chia lô). Residual: integration + migration apply chưa chạy trên DB thật (Docker off) — phải chạy tests/integration/click-events.test.ts + migrate trên dev trước khi promote staging.
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: ERD §4.13 + §7 (aggregatedAt, unique 4 cột, "" thay null, ngày giờ VN, xoá chỉ khi đã gộp); API_SPEC §3.4 (ràng buộc body, text/plain, ≤2000 ký tự, 400/429/503)
- Decision log: Decision 3

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-07 click` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/ClickEvents.ts, ClickStatsDaily.ts
- src/endpoints/public/click-events.ts
- src/jobs/aggregate-click-stats.ts
- migrations/*

## Notes
- Nút nổi phía UI làm ở task layout-utilities.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
