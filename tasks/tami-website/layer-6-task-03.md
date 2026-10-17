# Task 03: Redirect 301 tự động khi đổi slug (theo từng ngôn ngữ) + xử lý redirect phía website

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — hook dùng chung mọi collection có slug + routing
- Blast radius: src/payload.config.ts (plugin redirects, chỉ admin); src/hooks/create-slug-redirect.ts (gắn vào factory kit); src/lib/content/resolve-redirect.ts + dùng trong `not-found`/trang chi tiết; …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- BR-05
- FR-PUB-15 (redirect khi đổi slug)
- ERD §4.13 (`redirects`)
- API_SPEC §5

## Description
Cài `@payloadcms/plugin-redirects`; hook `beforeChange` tạo redirect khi slug của bản ghi **đã xuất bản** đổi; website tra redirect khi không tìm thấy trang.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-13-task-02`

## Acceptance Criteria
- [ ] Đổi slug VI của bài đã published → redirect `/tin-tuc/cu` → `/tin-tuc/moi`; đổi slug EN → `/en/news/old` → `/en/news/new`; bài nháp đổi slug không tạo redirect
- [ ] Không tạo chuỗi redirect (A→B, B→C ⇒ cập nhật A→C) và không vòng lặp
- [ ] Website: URL cũ trả 301 tới URL mới
- [ ] Chỉ admin xem/sửa `redirects`

## Tests cần viết
- Integration: đổi slug 2 lần → không có chuỗi
- Integration: route cũ → 301

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-03-round-<R>-review.md`

## Migration
- Bảng `redirects` (plugin). Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

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
- Commit gợi ý: `feat(layer-6): task-03 redirects` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/payload.config.ts (plugin redirects, chỉ admin)
- src/hooks/create-slug-redirect.ts (gắn vào factory kit)
- src/lib/content/resolve-redirect.ts + dùng trong `not-found`/trang chi tiết
- migrations/*

## Notes
- Giao diện quản lý redirect (Should FR-ADM-15) bổ sung kiểm tra ở task riêng.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5
- Nguồn: G15 (MEDIUM) + R16 trong `.context/review-reports/spec-validation-build-tami-website-layer-5.md`. Gốc: không có `src/app/layout.tsx`; root layout là `src/app/(frontend)/[locale]/layout.tsx` (segment động), nên `notFound()` (ở `[...rest]/page.tsx` và ở layout khi locale sai) trả HTML server là shell `__next_error__` rỗng; nội dung 404/500 đúng ngôn ngữ chỉ có sau hydrate (status 404 + noindex vẫn đúng). Cùng gốc với kế hoạch "dùng resolve-redirect trong `not-found`" của task này: tra redirect bên trong `not-found.tsx` khi shell lỗi đã gửi đi thì Next chỉ chuyển hướng phía client, KHÔNG trả HTTP 301 thật → BR-05 không đạt.
- [ ] (a) Sửa cấu trúc root: `src/app/layout.tsx` pass-through + `src/app/not-found.tsx` theo hướng dẫn next-intl, hoặc `experimental.globalNotFound`. Curl `next start` `/en/khong-ton-tai` và `/khong-ton-tai` → status 404 và HTML server (không chạy JS) có `h1` đúng ngôn ngữ cùng header/footer (design-spec S17/S18).
- [ ] (b) Tra redirect TRƯỚC `notFound()` (trong `[...rest]/page.tsx` / trang chi tiết, hoặc ở `src/proxy.ts`), KHÔNG tra trong `not-found.tsx`. Curl slug cũ → `301` + header `Location` đúng URL mới cùng ngôn ngữ.
- [ ] Locale sai ở `[locale]/layout.tsx` (`notFound()`) cũng ra HTML 404 có nội dung (cùng gốc).
- [ ] Sau khi xong: thêm note as-built về cấu trúc root layout / not-found vào `docs/ARCHITECTURE.md` §5.1 (R16).
- Review STRICT (đụng mọi route công khai).
