# Task 09: Endpoint `POST /api/public/job-applications` (multipart, CV, email)

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — endpoint công khai + upload + PII
- Blast radius: src/endpoints/public/job-applications.ts; src/shared/types/api.ts (schema job application); src/lib/email/templates/new-application.ts
- Doc impact (dự kiến): API_SPEC §3.2 nếu contract khác
- Decision impact: NO

## Requirements
- FR-PUB-09
- BR-21, BR-30, BR-16
- NFR-04
- API_SPEC §3.2
- PERMISSION §5

## Description
Nhận hồ sơ ứng tuyển kèm CV, lưu file private, email admin.

## Dependencies
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-7-task-04`

## Acceptance Criteria
- [x] Thứ tự: rate limit 3/giờ/IP → Turnstile → validate (zod, consent `true`) → kiểm vị trí `published` và chưa quá `deadline` (400 nếu không)
- [x] CV PDF/DOC/DOCX ≤ 5MB, kiểm MIME thật (415/413), lưu `private-files` tên ngẫu nhiên
- [x] Lưu `consentAt`, `consentVersion` (= `privacyPolicyVersion`), `locale`, `ipHash`
- [x] Enqueue email tới `notificationEmails` (tiếng Việt, có ngôn ngữ ứng viên)
- [x] Response 200 `{ success: true, data: { received: true } }`; lỗi theo `locale`

## Tests cần viết
- Integration: hồ sơ hợp lệ → 1 application + 1 private file + 1 job email
- Integration: file exe đổi đuôi .pdf → 415; 6MB → 413; vị trí hết hạn → 400; thiếu consent → 400; vượt 3/giờ → 429

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-09-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 PASS + follow-up L5-T04 (tin hết hạn/nháp/xoá mềm bị từ chối, locale mặc định vi, tạo qua Local API overrideAccess) + G3
- Verify commands + result: pnpm lint / typecheck = PASS; pnpm test 112 file 1.255 PASS (10 integration với DB + Redis + SeaweedFS thật, Turnstile mock); pnpm build PASS; curl next start :3223 body > 5 MB → 413
- Reviewer verdict: STRICT PASS round 1 — `.context/review-reports/build-tami-website-layer-6-task-09-round-1-review.md`
- Lệch: không tạo `src/lib/email/templates/new-application.ts` — dùng lại template `job-application` (L1-T07) đủ dữ liệu BR-21. Sửa ngoài phạm vi: `PrivateFiles.ts` thêm MIME `application/msword` (trước đó .doc luôn bị từ chối)
- Residual risk: `TRUST_CF_CONNECTING_IP` phải bật ở staging/prod (→ L6-T01). CV mồ côi khi tiến trình chết giữa 2 bước → job dọn (L9-T06). MINOR 1 (ký tự NUL/điều khiển trong fullName/message → 500), 4 (giới hạn số part), 5 (thu hẹp map ValidationError), 7 (test chưa kiểm object S3) → L15-T01. Helper deadline chuyển `src/lib/` dùng chung ở L6-T08
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-6.md`

## Doc / Decision Impact
- Doc impact result: `docs/API_SPEC.md` §3.2 as-built
- Decision log: deadline mở hết ngày theo giờ VN; bù trừ xoá CV thay transaction; thiếu cấu hình → lưu + cảnh báo, lỗi hàng đợi → 200 (reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-09 applyapi` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-09` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/endpoints/public/job-applications.ts
- src/shared/types/api.ts (schema job application)
- src/lib/email/templates/new-application.ts

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G3 — form client nhận lỗi captcha bằng chữ "captcha" trong message (src/components/forms/submit-helpers.ts:90-92): khi làm lỗi theo locale phải giữ chữ "captcha" ở cả vi/en hoặc thêm mã lỗi `captcha_failed` vào API_SPEC §2 + client.
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-04
- [x] Endpoint từ chối ứng tuyển vào tin hết hạn / chưa xuất bản / đã xoá mềm; `locale` mặc định `vi`; tạo `job-applications` qua Local API `overrideAccess: true` (API create bị chặn với mọi người).
