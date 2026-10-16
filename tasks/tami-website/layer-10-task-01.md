# Task 01: Ráp form lead vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ

## Layer
10 — Tích hợp: form lead, admin dịch, hoàn thiện bản EN

Checkpoint: ⏸ **Mốc M2** — dừng chờ user duyệt sau layer này (Tính năng Must xong (website VI/EN, lead, tuyển dụng, tự dịch) — staging sớm đã chạy từ L6)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — luồng thu lead chính (PII, consent) trên 4 bề mặt
- Blast radius: src/components/leads/LeadForm.tsx; src/lib/leads/utm.ts (đọc UTM từ URL/sessionStorage phía client); các trang chi tiết + liên hệ (ráp form)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-03, 05, 07, 11, 13
- BR-10, BR-17
- SPECIFICATIONS § Quy tắc biên (tin đã thuê)
- design-spec §1.2 (nhãn CTA), §3.3

## Description
Component `LeadForm` dùng chung, thay các `LeadFormSlot`.

## Dependencies
- `layer-9-task-02` Endpoint `POST /api/public/leads`: chống spam, chống trùng 7 ngày, tự giao, email (dùng kết quả của task này)
- `layer-2-task-09` Bộ form dùng chung: field có label/lỗi, ô consent, widget Turnstile lười (dùng kết quả của task này)
- `layer-7-task-03` Trang Chi tiết tin cho thuê (S07), gồm trạng thái "Đã thuê" và tin tương tự (dùng kết quả của task này)
- `layer-8-task-04` Trang Đăng tin BĐS: danh sách theo danh mục + chi tiết (S08, S09) (dùng kết quả của task này)
- `layer-6-task-05` Trang Chi tiết dự án (S03) (dùng kết quả của task này)
- `layer-6-task-07` Trang Dịch vụ (S14), Liên hệ (S15, chưa form), Pháp lý (S16) (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-14-task-01`, `layer-11-task-01`, `layer-14-task-02`

## Acceptance Criteria
- [ ] Nút gửi "Nhận tư vấn / Get advice"; tin rented → tiêu đề "Nhận tư vấn căn tương tự / Find similar units", nguồn vẫn là tin đó
- [ ] Gửi `source`, `sourceId`, `locale`, `utm`, `pageUrl`; consent link tới trang chính sách đúng ngôn ngữ
- [ ] Thành công: thông báo cảm ơn `role="status"`; lỗi map vào field
- [ ] Turnstile lười; HTML trang không đổi (form là client island)

## Tests cần viết
- RTL: payload gửi đúng theo từng `source`
- Integration (route + endpoint thật với Turnstile test key): gửi từ trang liên hệ tạo lead `source=contact`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-10-task-01-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-10): task-01 leadform` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-10/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/leads/LeadForm.tsx
- src/lib/leads/utm.ts (đọc UTM từ URL/sessionStorage phía client)
- các trang chi tiết + liên hệ (ráp form)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
