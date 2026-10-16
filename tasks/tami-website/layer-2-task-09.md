# Task 09: Bộ form dùng chung: field có label/lỗi, ô consent, widget Turnstile lười

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — component form dùng chung cho lead + ứng tuyển (consent, chống spam)
- Blast radius: src/components/forms/FormField.tsx, ConsentCheckbox.tsx, TurnstileWidget.tsx, FormStatus.tsx; src/components/forms/use-public-form.ts (submit JSON/multipart, map lỗi `details` vào field); src/i18n/messages/vi.json (khoá form.*)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-13
- BR-16
- BR-30
- NFR-07
- design-spec §1.4 (form), §3.3, §3.4

## Description
Primitive form client: FormField (label, helper, lỗi `aria-describedby`/`aria-invalid`), ConsentCheckbox (link chính sách theo locale), TurnstileWidget (tải khi form vào viewport/focus), tóm tắt lỗi `role="alert"`, trạng thái thành công `role="status"`.

## Dependencies
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-7-task-04`, `layer-10-task-01`

## Acceptance Criteria
- [ ] Consent không tick thì nút gửi không submit, hiện lỗi đúng ngôn ngữ
- [ ] Turnstile script chỉ tải khi form vào viewport hoặc focus ô đầu tiên
- [ ] Lỗi từ API (`details`) hiện cạnh đúng field; lỗi chung `role="alert"`; thành công chuyển focus tới tiêu đề thông báo
- [ ] Không dùng `placeholder` thay label

## Tests cần viết
- RTL: submit thiếu consent bị chặn
- RTL: map `details` → field lỗi + `aria-invalid`
- RTL: Turnstile chưa tải trước khi intersect

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-09-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-09 formkit` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-09` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/forms/FormField.tsx, ConsentCheckbox.tsx, TurnstileWidget.tsx, FormStatus.tsx
- src/components/forms/use-public-form.ts (submit JSON/multipart, map lỗi `details` vào field)
- src/i18n/messages/vi.json (khoá form.*)

## Notes
- Lead form và form ứng tuyển cụ thể ráp ở task riêng.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
