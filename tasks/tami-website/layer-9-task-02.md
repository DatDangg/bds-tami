# Task 02: Endpoint `POST /api/public/leads`: chống spam, chống trùng 7 ngày, tự giao, email

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — endpoint công khai + PII + chống trùng + phân công
- Blast radius: src/endpoints/public/leads.ts; src/lib/leads/dedupe.ts, assign.ts, create-or-merge.ts; src/shared/types/api.ts (LeadInput); …
- Doc impact (dự kiến): API_SPEC §3.1 nếu contract khác
- Decision impact: NO

## Requirements
- FR-PUB-13
- BR-10, BR-12, BR-13 (email lead mới), BR-15, BR-16, BR-17, BR-30
- API_SPEC §3.1
- ARCHITECTURE §5.2
- SPECIFICATIONS § Quy tắc biên (sale khoá, tin đã thuê)

## Description
Nhận lead từ mọi form công khai; phản hồi luôn giống nhau dù tạo mới hay gộp.

## Dependencies
- `layer-8-task-02` Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao) (dùng kết quả của task này)
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`

## Acceptance Criteria
- [ ] Thứ tự: rate limit 5/10 phút/IP → Turnstile → validate zod (consent `true`, độ dài, SĐT VN) → `sourceId` phải là bản ghi đang công khai (tin `rented` vẫn nhận)
- [ ] Chống trùng: cùng `phoneNormalized` + `source` + bản ghi nguồn trong 7 ngày, chưa won/lost/spam → tăng `mergedCount`, activity `merged`, cập nhật `lastActivityAt`; không tạo lead mới
- [ ] Tự giao (BR-12): `rental`/`property_post` và `author` đang `active` → `assignedTo = author`; còn lại để trống
- [ ] Lưu `consentAt`, `consentVersion`, `locale`, `utm`, `pageUrl`, `referrer`, `ipHash`, `userAgent`
- [ ] Enqueue email lead mới tới `notificationEmails` (tiếng Việt, ghi ngôn ngữ khách)
- [ ] Response 200 `{received: true}` giống hệt nhau giữa tạo mới và gộp; lỗi theo `locale`

## Tests cần viết
- Integration: gửi 2 lần cùng SĐT trong 7 ngày → 1 lead, `mergedCount=1`; ngày thứ 8 → 2 lead
- Integration: tin của sale khoá → không tự giao
- Integration: response tạo mới == gộp (so body)
- Integration: thiếu consent/turnstile sai/vượt rate → 400/400/429
- Unit dedupe/assign

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-02-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: API_SPEC §3.1 nếu contract khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-02 leadapi` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/public/leads.ts
- src/lib/leads/dedupe.ts, assign.ts, create-or-merge.ts
- src/shared/types/api.ts (LeadInput)
- src/lib/email/templates/new-lead.ts

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G3 — form client nhận lỗi captcha bằng chữ "captcha" trong message (src/components/forms/submit-helpers.ts:90-92): khi làm lỗi theo locale phải giữ chữ "captcha" ở cả vi/en hoặc thêm mã lỗi `captcha_failed` vào API_SPEC §2 + client.
- Activity/email/audit khi `assignedTo` đổi do hook ở task lead-assignment (kể cả tự giao); endpoint chỉ đặt `assignedTo`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
