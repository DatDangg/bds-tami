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
- [x] Chưa chọn/từ chối → không có script gtag, không cookie `_ga`
- [x] Đồng ý → chèn gtag với `site-settings.gaMeasurementId`; không có ID → không hiện banner
- [x] Đổi `privacyPolicyVersion` → hỏi lại
- [x] Rút lại đồng ý (footer "Cài đặt cookie") → xoá `_ga*`, lần tải sau không có GA4
- [x] Banner render client sau hydrate, overlay cố định (không CLS), không bẫy focus; dialog Tuỳ chọn là modal chuẩn
- [x] HTML trang không đổi theo cookie (an toàn cache CDN)

## Tests cần viết
- RTL: từ chối → không chèn script; đồng ý → chèn đúng ID
- Unit: parse cookie hỏng → coi như chưa chọn

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-07-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type: review FAIL round 1 (MAJOR-1: hydrate render enabled=false xoá `_ga` mỗi lần tải trang) — đã sửa attempt 2
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 6/6 PASS + follow-up L5-T06 (`--floating-bottom-offset`)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 95 file 991 PASS (gồm test hydrate renderToString + hydrateRoot giữ `_ga`); pnpm build PASS. Trình duyệt (next start, site-settings test `G-TEST1234`): 375/768/1280 không cuộn ngang, nút ≥44, nút nổi không bị che (offset 238px ở 375); đồng ý → reload giữ `_ga` + 1 request gtag; từ chối → không gtag/`_ga`; rút đồng ý từ footer xoá `_ga*` + `ga-disable`
- Reviewer verdict: STRICT FAIL round 1 → STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-5-task-07-round-2-review.md`
- Residual risk: chưa có dữ liệu GA4 thật (ID giả, `_ga` đặt tay). MINOR-A: bấm Từ chối/Đồng ý trên banner thì focus rơi về body (đề xuất focus `main#main`) → L15-T01 a11y sweep. CSP cho GA → AC L14-T01. CI kiểm importMap không lệch → đề xuất cho L6-T01/CI.
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `.context/design-spec.md` §3.10 thêm as-built note (cookie `pv`, footer mở dialog, ẩn khi không có GA ID)
- Decision log: reviewer chấp nhận 2 lệch (thêm `pv`; footer mở dialog thay banner) — không cần spec delta

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-07 cookie` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/components/consent/CookieBanner.tsx, ConsentPreferences.tsx
- src/lib/consent/consent-cookie.ts (`tami_consent` `{v:1, analytics, ts, pv}`, 12 tháng)
- src/components/analytics/GoogleAnalytics.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-06
- Khi CookieBanner đang hiện: đặt CSS var `--floating-bottom-offset` trên `<html>` = chiều cao banner (gỡ khi đóng) để FloatingContact (`src/components/layout/FloatingContact.tsx`) không bị đè. Từ `md` banner ở góc trái dưới thì không cần.
