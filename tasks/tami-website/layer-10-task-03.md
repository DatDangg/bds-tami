# Task 03: Hoàn thiện bản EN công khai: `en.json`, chuyển ngôn ngữ đúng trang tương ứng, hreflang toàn site

## Layer
10 — Tích hợp: form lead, admin dịch, hoàn thiện bản EN

Checkpoint: ⏸ **Mốc M2** — dừng chờ user duyệt sau layer này (Tính năng Must xong (website VI/EN, lead, tuyển dụng, tự dịch) — staging sớm đã chạy từ L6)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — navigation song ngữ toàn site
- Blast radius: src/i18n/messages/en.json (đầy đủ, khớp khoá vi.json); src/lib/i18n/counterpart-url.ts (tra slug ngôn ngữ kia theo id bản ghi); src/components/layout/LanguageSwitcher.tsx (dùng counterpart); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-18
- FR-PUB-19
- BR-07
- SPECIFICATIONS F12 (chuỗi giao diện en.json do AI dịch lúc làm code, review trong PR)

## Description
Bản tiếng Anh đầy đủ chuỗi giao diện; nút chuyển ngôn ngữ đưa tới trang tương ứng hoặc trang danh sách/trang chủ khi chưa có bản dịch.

## Dependencies
- `layer-9-task-01` Trang chủ (S01): hero slide, Về TAMI, dự án nổi bật, dịch vụ, ưu đãi, CTA (dùng kết quả của task này)
- `layer-8-task-03` Trang Danh sách Cho thuê (S04): bộ lọc trên URL, tìm không dấu, sắp xếp (dùng kết quả của task này)
- `layer-8-task-04` Trang Đăng tin BĐS: danh sách theo danh mục + chi tiết (S08, S09) (dùng kết quả của task này)
- `layer-6-task-04` Trang Danh sách dự án (S02) + trang danh mục dự án (dùng kết quả của task này)
- `layer-6-task-06` Trang Tin tức: danh sách theo danh mục + chi tiết + bài liên quan (S10, S11) (dùng kết quả của task này)
- `layer-6-task-08` Trang Tuyển dụng: danh sách + chi tiết, hết hạn, JSON-LD JobPosting (S12, S13) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-11-task-01`, `layer-14-task-02`

## Acceptance Criteria
- [ ] `en.json` đủ mọi khoá của `vi.json` (script kiểm, chạy trong `pnpm test`); không em-dash/en-dash trong chuỗi UI
- [ ] Chuyển ngôn ngữ trên trang chi tiết → trang tương ứng; chưa có bản dịch → trang danh sách ngôn ngữ kia (hoặc trang chủ)
- [ ] Mọi trang có hreflang đúng (chỉ khi có cả hai bản)
- [ ] Nhãn enum (nội thất, hướng nhà, loại việc…) dịch qua file chuỗi

## Tests cần viết
- Unit i18n-check: thiếu khoá → fail
- Integration: counterpart cho bản ghi có/không EN
- E2E nhẹ (nếu Playwright đã có) hoặc integration render: `/en/for-rent/<slug>` → switch → `/cho-thue/<slug-vi>`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-10-task-03-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-10): task-03 enpublic` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-10/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/i18n/messages/en.json (đầy đủ, khớp khoá vi.json)
- src/lib/i18n/counterpart-url.ts (tra slug ngôn ngữ kia theo id bản ghi)
- src/components/layout/LanguageSwitcher.tsx (dùng counterpart)
- scripts/i18n-check.ts (so khoá vi/en)

## Notes
- Bản dịch `en.json` do AI sinh một lần, reviewer kiểm câu chữ.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-9-task-01 round 2 (MINOR)
- [ ] `src/components/home/HomeBlocks.tsx:32`: nội dung `h1` sr-only = tiêu đề slide 1 (theo locale), không có thì tên site — khớp design-spec S01 `:284` mà không đưa h1 vào slide (tránh MAJOR-3 cũ).
- [ ] `src/components/home/HeroSlider.tsx:142,161`: mobile cụm điều khiển xếp dọc cao 88px có thể chạm CTA khi hero thấp → `pb-32 sm:pb-24` (hoặc tương đương); kiểm 320px (8 dot bị cắt ~16px mỗi bên).
- [ ] Header trong suốt đè hero (design-spec S01.1) chưa làm — cần biến thể Header + phát hiện cuộn.

## Follow-up từ review layer-9-task-07 round 2 (MINOR)
- [ ] `src/jobs/translate-content-save.ts:41-52`: khoá dòng `SELECT … FOR UPDATE` trên session `payload.db.sessions[req.transactionID]` trước khi đọc lại (đóng khe hở ms; tệ nhất mất bản dịch thay vì mất dữ liệu admin).
- [ ] `translate-content-save.ts:11,21-27`: lần thử bật `hasEnglish` lỗi kiểm tra → Payload rollback + gỡ transaction của job; ghi dự phòng chạy transaction riêng → quyết định `hasEnglish` trước khi ghi bằng predicate `requireEnglishFields` thay vì bắt lỗi (hoặc sửa comment).
- [ ] `tests/integration/translate-content.test.ts:533`: assertion `toBeGreaterThan(jobsBefore - 1)` lỏng → thêm case admin chỉ đổi link (hook không xếp job) và kiểm số job +1 từ `row_changed`.
