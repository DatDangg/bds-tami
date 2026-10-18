# Task 01: E2E smoke (Playwright): trang chủ, lọc cho thuê, gửi lead, ứng tuyển, chuyển EN

## Layer
11 — E2E smoke (Playwright)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **NORMAL** — chỉ thêm test
- Blast radius: playwright.config.ts; tests/e2e/*.spec.ts; .github/workflows/ci.yml (job e2e, có thể chạy sau unit)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- design doc D10 (e2e smoke luồng lead)
- NFR-08 (trình duyệt)

## Description
Bộ e2e chạy local/CI với DB seed mẫu và Turnstile test key.

## Dependencies
- `layer-10-task-01` Ráp form lead vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ (dùng kết quả của task này)
- `layer-7-task-04` Form ứng tuyển trên trang chi tiết tuyển dụng (dùng kết quả của task này)
- `layer-10-task-03` Hoàn thiện bản EN công khai: `en.json`, chuyển ngôn ngữ đúng trang tương ứng, hreflang toàn site (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [ ] Kịch bản: trang chủ render, lọc `/cho-thue` theo tỉnh + giá, gửi lead từ tin cho thuê, nộp CV PDF nhỏ, chuyển VI ↔ EN trên trang chi tiết
- [ ] Chạy Chromium + WebKit; viewport 375 và 1280
- [ ] Ổn định (không sleep cứng), dữ liệu seed riêng cho e2e

## Tests cần viết
- Chính là test

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-11-task-01-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-11): task-01 e2e` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-11/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- playwright.config.ts
- tests/e2e/*.spec.ts
- .github/workflows/ci.yml (job e2e, có thể chạy sau unit)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-10-task-01 round 1 (MINOR)
- [ ] `tests/integration/leads-public.test.ts:84-87`: gọi `handleLead` trực tiếp với Turnstile giả → E2E gửi lead đi qua route thật + Turnstile test key (phủ luôn đường đọc body stream).
- [ ] `src/lib/leads/turnstile-site-key.ts:3`: thêm cảnh báo — trang có form mà bị prerender lúc build sẽ nhúng site key placeholder vào HTML.
- [ ] `src/components/layout/Header.test.tsx` flaky khi máy tải nặng (timeout) → nới timeout/sửa chờ.
