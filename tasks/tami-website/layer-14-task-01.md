# Task 01: Header bảo mật: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

## Layer
14 — Hardening: header bảo mật, CWV/a11y

Checkpoint: ⏸ **Mốc M5** — dừng chờ user duyệt sau layer này (Trước deploy production: hardening xong; user duyệt production)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — security header toàn site
- Blast radius: next.config.ts (headers); src/middleware.ts (nonce CSP nếu cần); docker/nginx/*.conf (HSTS nếu đặt ở Nginx)
- Doc impact (dự kiến): ARCHITECTURE §7 nếu chính sách khác
- Decision impact: NO

## Requirements
- NFR-04
- ARCHITECTURE §7 (Header)

## Description
Bật header bảo mật cho website và admin sau khi biết đủ bên thứ ba (Turnstile, GA4, OSM tiles, GlitchTip, YouTube/TikTok).

## Dependencies
- `layer-10-task-01` Ráp form lead vào chi tiết Cho thuê, Đăng tin BĐS, Dự án, Liên hệ (dùng kết quả của task này)
- `layer-5-task-07` Banner đồng ý cookie + tải GA4 sau khi đồng ý (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-3-task-01` Giám sát phía app: GlitchTip (Sentry SDK), log JSON cho Loki, metrics Prometheus nội bộ (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (cần staging đủ Must để đo/kiểm)
- `layer-13-task-01` Dashboard admin (FR-ADM-14): lead, nội dung, lượt bấm, cảnh báo dịch, chi phí dịch (thứ tự: làm sau khi Should xong)
- `layer-13-task-02` Quản lý chuyển hướng 301 trong admin (FR-ADM-15): kiểm tra hợp lệ, chống vòng/chuỗi (thứ tự: làm sau khi Should xong)
- `layer-13-task-03` Trang đích khu vực Cho thuê (FR-PUB-16, S06) (thứ tự: làm sau khi Should xong)
- `layer-13-task-04` Khối Đối tác / chủ đầu tư trên trang chủ (FR-PUB-17) (thứ tự: làm sau khi Should xong)

Mở khoá cho: `layer-15-task-01`

## Acceptance Criteria
- [ ] G14: gom 5 header bảo mật lặp ở `docker/nginx/tami-staging.conf` (location media) vào snippet `include` dùng chung (spec-validation layer 4)
- [ ] CSP chỉ cho phép nguồn cần thiết; không `unsafe-eval` ở trang công khai; admin Payload hoạt động bình thường
- [ ] `X-Frame-Options: DENY` (hoặc `frame-ancestors none`), `Referrer-Policy: strict-origin-when-cross-origin`, HSTS (production)
- [ ] Không vỡ: Turnstile, GA4 sau đồng ý, bản đồ, video facade, GlitchTip
- [ ] Chạy chế độ `Report-Only` trên staging trước, rồi mới enforce

## Tests cần viết
- Integration: response có đủ header
- Thủ công trên staging: console không có vi phạm CSP ở các trang chính

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-14-task-01-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: ARCHITECTURE §7 nếu chính sách khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-14): task-01 headers` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-14/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- next.config.ts (headers)
- src/middleware.ts (nonce CSP nếu cần)
- docker/nginx/*.conf (HSTS nếu đặt ở Nginx)

## Notes
- Làm sau Should để CSP bao phủ cả trang/khối mới.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-01 (16/10/2026)
- Pin GitHub Actions theo commit SHA (`.github/workflows/ci.yml` đang dùng tag `@v4`).
- Từ review layer-2-task-01: `X-Content-Type-Options: nosniff` cho `/api/media/file/*`; PDF trong `media` public ép `Content-Disposition: attachment` (hoặc phục vụ media từ domain riêng) để giảm rủi ro file polyglot.

## Follow-up từ review layer-5-task-07
- [ ] CSP cho phép GA4 (chỉ tải sau đồng ý cookie, `src/components/analytics/GoogleAnalytics.tsx`): `script-src` thêm `https://www.googletagmanager.com`; `connect-src` + `img-src` thêm `https://*.google-analytics.com`, `https://*.analytics.google.com`, `https://*.googletagmanager.com`. Kiểm: đồng ý cookie → gtag tải + gửi collect không bị CSP chặn.
