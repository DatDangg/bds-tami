# Task 04: Form ứng tuyển trên trang chi tiết tuyển dụng

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** (reviewer round 1) — form công khai + upload CV (dữ liệu cá nhân), sửa hook dùng chung
- Blast radius: src/components/careers/ApplyForm.tsx (+ test), ApplyFormSlot.tsx, JobDetail.tsx; src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx (+ test); src/components/forms/use-public-form.ts (shared hook, thêm tham số tuỳ chọn); src/endpoints/public/job-applications.ts (+ test: lỗi CV kèm details); src/i18n/messages/vi.json, en.json
- Doc impact (dự kiến): API_SPEC §3.2 (lỗi CV kèm details)
- Decision impact: NO

## Requirements
- FR-PUB-09
- FR-PUB-13
- design-spec §3.4, S13

## Description
Ráp form ứng tuyển (multipart, chọn file, consent, Turnstile) vào `ApplyFormSlot`.

## Dependencies
- `layer-6-task-08` Trang Tuyển dụng: danh sách + chi tiết, hết hạn, JSON-LD JobPosting (S12, S13) (dùng kết quả của task này)
- `layer-6-task-09` Endpoint `POST /api/public/job-applications` (multipart, CV, email) (dùng kết quả của task này)
- `layer-2-task-09` Bộ form dùng chung: field có label/lỗi, ô consent, widget Turnstile lười (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-11-task-01`

## Acceptance Criteria
- [x] Kiểm loại/cỡ file phía client trước khi gửi (server vẫn kiểm lại)
- [x] Gửi kèm `locale`; thông báo thành công/lỗi theo ngôn ngữ
- [x] Tin hết hạn không render form

## Tests cần viết
- RTL: file 6MB bị chặn client; submit thành công hiện `role="status"`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-04-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 CV hỏng (400 cvInvalid không details) bị form hiểu là "tin hết hạn"
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 3/3 xong (builder)
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm build` PASS; `pnpm test` 147/148 file, 1.566 test PASS (chạy 2 lần ổn định); `src/lib/contrast.test.ts` fail chỉ trong worktree do checkout CRLF (BL-004, không thuộc task)
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-7-task-04-round-2-review.md`)
- Residual: `invalidInput` multipart hỏng / 400 không JSON từ proxy vẫn hiện panel "hết hạn" (trình duyệt thật gần như không gặp); nên có `code: "postingClosed"` máy đọc được — follow-up dưới
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/API_SPEC.md` §3.2 — lỗi CV (`cvInvalid/cvMissing/cvTooLarge/cvUnsupported`) trả `details: [{ field: "cv" }]` (thêm phần tử, không đổi shape)
- Decision log: pending
- Gap chờ user quyết (MINOR-1, không tự đổi intent doc): design-spec §3.4 yêu cầu thanh tiến trình upload "%" và vùng kéo-thả ≥ md. Chưa làm vì (a) hook `usePublicForm` dùng `fetch`, không báo tiến trình upload (cần chuyển sang XHR/`upload.onprogress`, đổi hạ tầng form dùng chung), (b) ô file native của trình duyệt đã nhận kéo-thả trực tiếp. Hiện chỉ hiện "Đang gửi…". Đề xuất ghi vào gap register / để spec-validator cuối layer xử lý.

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-04 applyform` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/components/careers/ApplyForm.tsx
- src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx (ráp form)
- src/components/careers/ApplyForm.test.tsx, ApplyFormSlot.tsx, JobDetail.tsx, page.test.tsx
- src/components/forms/use-public-form.ts (thêm `additionalFields`)
- src/endpoints/public/job-applications.ts + .test.ts (lỗi CV kèm `details` field `cv`)
- src/i18n/messages/vi.json, en.json

## Notes
- Quyết định (builder): (1) File CV giữ trong state, kiểm đuôi + 5MB ngay khi chọn, hiện tên/dung lượng/nút xoá; `handleSubmit` của `usePublicForm` thêm tham số tuỳ chọn `additionalFields` (additive, ô không đọc được từ DOM). (2) Không làm thanh % upload (XHR) của design-spec §3.4: hook dùng `fetch`, chỉ hiện "Đang gửi…"; kéo-thả dựa vào ô file native. (3) 400 không kèm `details` = vị trí hết hạn (`postingClosed`) -> hiện thông báo + link danh sách tuyển dụng. Round 1 MAJOR-1: `cvInvalid`/lỗi CV khác trước đây cũng trả 400 không details nên bị nhầm; đã sửa server trả kèm `details: [{field:"cv"}]` (cách đơn giản, không đổi contract/shape, hook sẵn có gắn vào ô CV) và test khẳng định `postingClosed` là 400 duy nhất không details. (6) `page.tsx` đọc `process.env.TURNSTILE_SITE_KEY` thay vì `getEnv()` có chủ đích: `getEnv()` validate cả bộ env và ném lỗi, sập trang công khai khi thiếu biến không liên quan. (4) Site key Turnstile đọc `process.env.TURNSTILE_SITE_KEY` ở page (ISR, lúc chạy) rồi truyền xuống. (5) `ApplyFormSlot` luôn kèm email/hotline dưới form làm kênh dự phòng.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-7-task-04 round 2
- [ ] Tín hiệu máy đọc được cho tin hết hạn (vd `code: "postingClosed"` trong body lỗi) thay cho quy ước "400 không details"; sửa comment `job-applications.ts:58`, `ApplyForm.tsx:39` (MINOR-A).
