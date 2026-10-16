# Task 07: Banner đồng ý cookie + tải GA4 sau khi đồng ý

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — dữ liệu cá nhân/consent (LGL-03), script bên thứ ba
- Blast radius: src/components/consent/CookieBanner.tsx, ConsentPreferences.tsx; src/lib/consent/consent-cookie.ts (`tami_consent` `{v:1, analytics, ts}`, 12 tháng); src/components/analytics/GoogleAnalytics.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- LGL-03
- Tech stack Analytics (chốt 16/10/2026)
- design-spec §3.10

## Description
Không tải GA4 khi chưa đồng ý; banner không chặn trang, nút Từ chối ngang hàng Đồng ý.

## Dependencies
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-14-task-01`

## Acceptance Criteria
- [ ] Chưa chọn/từ chối → không có script gtag, không cookie `_ga`
- [ ] Đồng ý → chèn gtag với `site-settings.gaMeasurementId`; không có ID → không hiện banner
- [ ] Đổi `privacyPolicyVersion` → hỏi lại
- [ ] Rút lại đồng ý (footer "Cài đặt cookie") → xoá `_ga*`, lần tải sau không có GA4
- [ ] Banner render client sau hydrate, overlay cố định (không CLS), không bẫy focus; dialog Tuỳ chọn là modal chuẩn
- [ ] HTML trang không đổi theo cookie (an toàn cache CDN)

## Tests cần viết
- RTL: từ chối → không chèn script; đồng ý → chèn đúng ID
- Unit: parse cookie hỏng → coi như chưa chọn

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-07-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-5): task-07 cookie` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/consent/CookieBanner.tsx, ConsentPreferences.tsx
- src/lib/consent/consent-cookie.ts (`tami_consent` `{v:1, analytics, ts}`, 12 tháng)
- src/components/analytics/GoogleAnalytics.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
