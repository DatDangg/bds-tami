# Task 03: Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — navigation/middleware dùng chung, cache key theo URL
- Blast radius: src/i18n/routing.ts, request.ts, navigation.ts; src/i18n/messages/vi.json, en.json (khung khoá, en.json đầy đủ làm ở task EN); src/middleware.ts; …
- Doc impact: `docs/ARCHITECTURE.md` (§4 `proxy.ts` thay `middleware.ts`; §5.1 `/vi/*` 301, cookie `NEXT_LOCALE` do nút chuyển ngôn ngữ đặt)
- Decision impact: NO

## Requirements
- FR-PUB-18 (định tuyến)
- FR-PUB-19 (nền)
- BR-07
- BRD §2.1 (bảng URL vi ↔ en)
- ARCHITECTURE D6, §5.1

## Description
Cấu hình `next-intl` với `localePrefix: "as-needed"` và `pathnames` map đường dẫn Việt ↔ Anh; middleware không đọc `Accept-Language`, bỏ qua `/admin`, `/api`; nhớ lựa chọn qua cookie `NEXT_LOCALE`; helper định dạng số/ngày/tiền.

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-08`, `layer-2-task-09`, `layer-3-task-02`, `layer-4-task-03`, `layer-5-task-05`, `layer-5-task-06`, `layer-5-task-07`, `layer-5-task-08`

## Acceptance Criteria
- [x] `/du-an` → `vi`, `/en/projects` → `en`; đủ cặp đường dẫn theo BRD §2.1 (trang chủ, dự án, cho thuê, khu vực, Đăng tin BĐS, tin tức, tuyển dụng, dịch vụ, liên hệ, 2 trang pháp lý)
- [x] Không chuyển hướng theo `Accept-Language` (một URL luôn trả một ngôn ngữ); cookie `NEXT_LOCALE` chỉ đặt khi người dùng bấm chuyển ngôn ngữ
- [x] Middleware bỏ qua `/admin`, `/api`, `/_next`, file tĩnh, `sitemap.xml`, `robots.txt`
- [x] `<html lang="vi">` / `<html lang="en">` đúng theo URL
- [x] `formatVnd` luôn ra VNĐ, phân cách theo locale; ngày theo `Intl.DateTimeFormat` + múi giờ `Asia/Ho_Chi_Minh`

## Tests cần viết
- Unit `routing`: bảng pathnames vi ↔ en đầy đủ, không trùng
- Unit `format.ts`: vi/en cho tiền, diện tích, ngày
- Integration middleware: request có `Accept-Language: en` vào `/` vẫn ra tiếng Việt; `/admin` không bị rewrite

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS (reviewer xác minh)
- Verify commands + result: install --frozen-lockfile/lint/typecheck/test (78)/build = PASS; audit high exit 0; curl qua pnpm start (round 1): / 200 vi, /en 200 en, /vi→301 /, /admin không bị proxy đụng
- Reviewer verdict: STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-1-task-03-round-2-review.md`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/ARCHITECTURE.md (proxy.ts, /vi 301, cookie NEXT_LOCALE)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-03 i18n` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/i18n/routing.ts, request.ts, navigation.ts
- src/i18n/messages/vi.json, en.json (khung khoá, en.json đầy đủ làm ở task EN)
- src/middleware.ts
- src/lib/format.ts (formatVnd, formatDate, formatArea theo locale)
- src/app/(frontend)/[locale]/layout.tsx (`<html lang>`)

## Notes
- Nội dung trang thật làm ở các task trang công khai; task này chỉ dựng khung.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Decision (review round 1)
- `alternateLinks: false`: không để next-intl sinh header `Link` hreflang (sai khi slug EN riêng/không có bản EN, CDN cache); hreflang sinh ở metadata/sitemap (F11).
- Cookie `NEXT_LOCALE`: `localeCookie: false`, chỉ nút chuyển ngôn ngữ ghi (`buildLocaleCookie`). Hiện chưa có chỗ đọc; theo F12 KHÔNG được dùng để tự redirect `/`. Xem follow-up ở `layer-5-task-05.md`.

## Follow-up từ review layer-0-task-01 (16/10/2026)
- F4: hiện chỉ có `/vi`, `/` trả 404. Theo SPEC F12: tiếng Việt **không tiền tố** (`/`, `/du-an`…), tiếng Anh `/en/...` → next-intl `localePrefix: 'as-needed'`; `/vi/*` redirect 301 về bản không tiền tố. KHÔNG redirect `/` → `/vi`.
- Next 16 đổi `middleware.ts` → `proxy.ts`: dùng đúng quy ước Next 16 (ARCHITECTURE §4 ghi middleware.ts → cập nhật doc nếu đổi).
