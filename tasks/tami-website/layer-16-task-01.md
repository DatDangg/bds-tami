# Task 01: Hẹn giờ xuất bản (FR-ADM-16, Could): `publishedAt ≤ now` + job revalidate mỗi phút

> **SUPERSEDED (2026-10-28, BL-091):** user chốt 2026-10-27 chỉ làm hẹn giờ cho **Tin tức**, **không** job/cron (lọc `publishedAt ≤ now` lúc truy vấn, ISR 60s), không email. Đã build ở `tasks/feature-news-scheduled-publish/phase-1-task-01.md`. Task này **không chạy** khi loop tới layer 16 (Dự án / Cho thuê / Tin BĐS giữ ô chỉ đọc); muốn mở rộng → change request mới.

## Layer
16 — Could: hẹn giờ xuất bản (lên production ở lần deploy kế tiếp)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Could
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — đổi điều kiện công khai dùng chung + cron
- Blast radius: src/lib/content/public-queries.ts (`publicWhere` thêm `publishedAt ≤ now`); src/fields/published-at.ts (cho sửa, mặc định now); src/jobs/publish-scheduled.ts (cron mỗi phút); …
- Doc impact (dự kiến): ERD §1 đã mô tả; cập nhật nếu cơ chế khác
- Decision impact: NO

## Requirements
- FR-ADM-16
- ERD §1 (điều kiện `publishedAt ≤ now`)
- SPECIFICATIONS § Quy tắc biên (Hẹn giờ xuất bản, ghi chú M4)

## Description
Cho phép đặt `publishedAt` ở tương lai; bài `published` chưa tới giờ không hiện công khai; job mỗi phút revalidate bài vừa tới giờ.

## Dependencies
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)
- `layer-8-task-05` `sitemap.xml` (vi + en, alternates), `robots.txt`, `llms.txt` (dùng kết quả của task này)
- `layer-9-task-07` Job `translate-content` + hook tự dịch khi lưu bản `vi` đã xuất bản / global (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-15-task-01` Deploy production (cần user duyệt, mốc M5) + kiểm tra AI-readiness + bàn giao (thứ tự ưu tiên: Could sau production, lên prod ở lần deploy kế tiếp)

Mở khoá cho: không có

## Acceptance Criteria
- [ ] `publicWhere` (một chỗ) thêm `publishedAt ≤ now` — áp cho trang, API công khai, sitemap, khối trang chủ, tin tương tự
- [ ] Admin đặt giờ tương lai cho bài `published` → admin thấy nhãn "Hẹn giờ"; khách không thấy
- [ ] Job mỗi phút: tìm bài có `publishedAt` trong (lần chạy trước, now] → revalidate chi tiết + danh sách + trang chủ + sitemap cả vi/en; idempotent, lưu mốc lần chạy
- [ ] Bài lên web ≤ 1 phút sau giờ hẹn (+ cache CDN 60s)
- [ ] Lead/ứng tuyển vào bài chưa tới giờ → 400 (không công khai)
- [ ] Lên production qua lần deploy kế tiếp bằng pipeline CD (staging → duyệt tay → production), không thêm task deploy riêng

## Tests cần viết
- Integration: bài hẹn +5 phút không ra ở danh sách/API/sitemap; giả lập thời gian tới → ra
- Integration: job chạy 2 lần cùng cửa sổ → revalidate 1 lần mỗi đường dẫn

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-16-task-01-round-<R>-review.md`

## Migration
- Có thể cần bảng/global nhỏ lưu mốc lần chạy (hoặc dùng `payload-jobs`); nếu thêm thì additive.
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
- Doc impact result: pending (dự kiến: ERD §1 đã mô tả; cập nhật nếu cơ chế khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-16): task-01 schedule` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-16/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/lib/content/public-queries.ts (`publicWhere` thêm `publishedAt ≤ now`)
- src/fields/published-at.ts (cho sửa, mặc định now)
- src/jobs/publish-scheduled.ts (cron mỗi phút)
- src/hooks/translation/enqueue-translation.ts (dịch trước khi tới giờ: được, nhưng không revalidate /en sớm)

## Notes
- M4: điều kiện `publishedAt ≤ now` chỉ thêm ở task này (publicWhere đã thiết kế để thêm một chỗ).
- Cache CDN: trang chưa tới giờ trả 404 có thể bị cache 60s — chấp nhận (≤ 1 phút).
- Phụ thuộc `deployprod` chỉ để giữ thứ tự (Could sau khi đã lên production); production không phụ thuộc task này.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-8-task-05 round 2 (MINOR)
- [ ] `/sitemap.xml`, `/sitemaps/*`, `/llms.txt` có query string: 301 về URL sạch thay vì 404 (link có `utm_*` từ trợ lý AI); test riêng nhánh query/503 cho `/llms.txt`.
- [ ] Sửa comment `src/lib/http/cache-policy.ts:26-27,33-34` và bullet layer-4-task-03 trong ARCHITECTURE (sitemap/llms không còn thuộc rule path có đuôi file).
- [ ] Lookahead `sitemaps/[^/]+$` để path nhiều đoạn (`/sitemaps/a/b.xml`) vẫn có TTL ngắn.
- [ ] Kiểm sitemap/llms loại tin hẹn giờ (`publishedAt > now`) khi `publicWhere` thêm điều kiện.
- [ ] (G32 spec-validation layer 8) Khi thêm `publishedAt ≤ now` vào `buildPublicWhere`/`publicWhere`: LOẠI TRỪ `services` và `pages` (không có `publishedAt`) — nếu không, dịch vụ và trang pháp lý biến mất; snapshot test `buildPublicWhere` (L8-T03) sẽ đỏ có chủ đích.
