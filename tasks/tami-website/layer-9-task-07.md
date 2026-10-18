# Task 07: Job `translate-content` + hook tự dịch khi lưu bản `vi` đã xuất bản / global

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — gửi dữ liệu ra ngoài + hook trên mọi collection nội dung + chi phí
- Blast radius: src/jobs/translate-content.ts; src/hooks/translation/enqueue-translation.ts (afterChange, debounce ~1 phút theo bản ghi); src/hooks/translation/detect-manual-en.ts (beforeChange khi locale=en); …
- Doc impact (dự kiến): ARCHITECTURE §5.4 nếu luồng khác
- Decision impact: NO

## Requirements
- BR-07, BR-08
- FR-ADM-17
- ARCHITECTURE §5.4 (`translate-content`)
- API_SPEC §5
- ERD §1.1 (`translation`)

## Description
Tự dịch các trường localized đã đổi sang `en`, sinh slug EN, bật `hasEnglish`, revalidate `/en`; tôn trọng bản sửa tay.

## Dependencies
- `layer-4-task-04` `TranslationService` (Claude API) + collection `translation-usage` + hạn mức chi phí (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-8-task-01` Global `homepage` (khối, thứ tự, hero video tuỳ chọn, CTA banner) (dùng kết quả của task này)
- `layer-7-task-01` Collection `property-posts` (Đăng tin BĐS) + job `expire-offers` (dùng kết quả của task này)
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)
- `layer-6-task-01` Deploy staging sớm: Compose staging, Nginx, Cloudflare/noindex, CD chạy thật, health check (dùng staging sớm để kiểm trên môi trường thật)

Mở khoá cho: `layer-10-task-02`, `layer-16-task-01`

## Acceptance Criteria
- [x] Bản sao (Duplicate) giữ nguyên nhóm `translation` (status/sourceHash/enSource) → reset nhóm trong `beforeDuplicate` hoặc job coi bản sao là chưa dịch; có test (`src/fields/translation.ts:24-46`, MINOR-1) (review L5-T03 round 1)
- [x] Job chỉ retry lỗi tạm thời (`rate_limited`, `provider_unavailable`); KHÔNG retry `invalid_input`, `invalid_output`, `refused`, `truncated`, `budget_exceeded`, `not_configured`, `not_allowed` (tránh trả tiền lặp) — có test (review L4-T04 round 2 MINOR-A)
- [x] Giảm chặn nhầm trong `validateModelOutput` (`src/lib/translation/segments.ts`): chỉ chặn `<` khi mở thẻ HTML; bỏ dấu câu cuối URL trước khi so URL nguồn; test với `≥/≤/→`, "trên 100m2" → "over 100m2", URL kèm dấu câu; test chia lô với nội dung khác nhau mỗi item + assert dừng khi chạm hạn mức giữa lô + khoá shape `output_config` (review L4-T04 round 2 MINOR-B/C)
- [x] Lưu bản `vi` `published` (hoặc global) → enqueue 1 job/bản ghi (gộp nhiều lần lưu trong ~1 phút)
- [x] Chỉ dịch trường có `sourceHash` đổi; `enSource=manual` → không dịch đè, đặt `viChangedAfterManual=true` khi bản vi đổi
- [x] Sửa tay bất kỳ trường `en` → `enSource=manual`
- [x] Dịch xong: điền trường en, sinh slug en (unique), bật `hasEnglish` khi đủ trường bắt buộc, `translation.status=done`, `model`, `translatedAt`, revalidate đường dẫn `/en`
- [x] `pages`: dịch xong đặt `pending_review`, **không** bật `hasEnglish`
- [x] Lỗi: thử 3 lần backoff; vẫn lỗi → `status=failed`, `lastError` (không chứa nội dung); vượt hạn mức → dừng + email admin
- [x] `site-settings.translationEnabled=false` → không enqueue
- [x] Mục tiêu bản EN lên web ≤ 10 phút sau xuất bản (đo trên dev với SDK mock + độ trễ)
- [x] Job translate-content chỉ gửi field localized công khai của collection (allowlist theo field), có test — review L4-T04 round 1 MINOR-1

## Tests cần viết
- Integration (SDK mock): publish vi → job → en đủ trường, hasEnglish=true
- Integration: sửa tay en rồi sửa vi → không dịch đè, cờ viChangedAfterManual
- Integration: SDK lỗi 3 lần → failed
- Integration: pages → pending_review, hasEnglish vẫn false
- Integration: lead/job-application không bao giờ enqueue

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-07-round-<R>-review.md`

## Migration
- Cần migration `20261018_140000_translate_content` (`migrations/20261018_140000_translate_content.ts`): chỉ `ADD VALUE IF NOT EXISTS 'translate-content'` vào hai enum `task_slug` của `payload_jobs` / `payload_jobs_log` (additive, không đổi bảng nội dung, không backfill; `down` xoá dòng job của task rồi dựng lại enum). Cờ gửi email hạn mức dùng bảng `payload_kv` sẵn có, không thêm bảng/cột.

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 lost update — job ghi lại field top-level từ bản đọc trước khi gọi API
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (214 file, 2.284) · `pnpm build` PASS; migration up→down→down→up; đã áp DB dev
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-9-task-07-round-2-review.md`); MINOR A/B/C → `layer-10-task-02.md`
- Spec Validator verdict (layer close): GAPS (D5 một phần, BL-008) — `.context/review-reports/spec-validation-build-tami-website-layer-9.md`

## Doc / Decision Impact
- Doc impact result: ARCHITECTURE §5.4 (job, debounce, xếp job ngoài transaction, khe hở không khoá dòng), ERD (translation group)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-07 tjob` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/jobs/translate-content.ts
- src/hooks/translation/enqueue-translation.ts (afterChange, debounce ~1 phút theo bản ghi)
- src/hooks/translation/detect-manual-en.ts (beforeChange khi locale=en)
- src/hooks/translation/compute-source-hash.ts
- gắn hook vào factory kit + globals

## Notes
- Không gọi Claude API thật trong test/CI. Có thể thử thật trên staging (đã có từ task staging sớm) với hạn mức thấp.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
