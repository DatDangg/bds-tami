# Task 05: Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — navigation + component dùng chung mọi trang
- Blast radius: src/app/(frontend)/[locale]/layout.tsx; src/components/layout/Header.tsx, MobileMenu.tsx, Footer.tsx, LanguageSwitcher.tsx, SkipLink.tsx; src/i18n/messages/vi.json (khoá layout.*)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-ADM-08 (menu/footer hiển thị)
- FR-PUB-19
- SPECIFICATIONS § Quy tắc biên (globals thiếu EN → menu cố định en.json)
- design-spec §2.1–§2.4, §1.4
- NFR-07

## Description
Layout công khai dùng chung VI/EN theo screen spec.

## Dependencies
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-04`, `layer-6-task-05`, `layer-6-task-06`, `layer-6-task-07`, `layer-6-task-08`, `layer-7-task-03`, `layer-8-task-03`, `layer-8-task-04`, `layer-9-task-01`, `layer-10-task-03`

## Acceptance Criteria
- [ ] G14: e2e lưu header/footer global → trang công khai vi/en đổi trong ≤ 1 lần tải (revalidateTag thật, `next start`) (spec-validation layer 4)
- [ ] L3-T01 MINOR-1: bỏ regex lookbehind `(?<!d)` trong `src/lib/monitoring/scrub-text.ts:7` (chunk client → SyntaxError, không hydrate trên Safari/iOS < 16.4, in-app Zalo/Facebook); có test — PHẢI xong trước deploy prod (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [ ] L3-T01 MINOR-2/3: logger lọc tham số `%s` là Error / `%d`; giảm che nhầm số dài (timestamp ms, UUID, số tài khoản) và che SĐT dạng `(028) 3823 4567` (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [ ] Upload source map GlitchTip (stack trình duyệt đang minify) (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [→] Prometheus chạy trong container scrape được app (L3-T03 MINOR-1: `127.0.0.1:3010/3011` của host không tới được từ container — dùng network chung/host-gateway) (spec-validation layer 3; chuyển từ layer-4-task-06 deferred) → **trả về `layer-4-task-06`** (G11: không kiểm được khi chưa có Prometheus)
- [ ] Menu: Trang chủ · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ (không có Mua bán)
- [ ] Menu ngang chỉ ≥ xl; < xl dùng menu toàn màn hình (bẫy focus, Esc đóng, khoá cuộn nền)
- [ ] Nút tìm kiếm header dẫn tới `/cho-thue?q=` (EN `/en/for-rent?q=`)
- [ ] Header/footer thiếu bản EN → dùng menu cố định trong `en.json`
- [ ] LanguageSwitcher ở header, menu, footer: tạm thời về trang chủ ngôn ngữ kia (map trang tương ứng hoàn thiện ở task EN); đặt cookie `NEXT_LOCALE` phía client
- [ ] Skip link là phần tử focus đầu; landmark `header`/`nav[aria-label]`/`main#main`/`footer`
- [ ] Responsive 375/768/1280 không cuộn ngang; footer có link "Cài đặt cookie"

## Tests cần viết
- RTL: menu mobile mở/đóng, trả focus
- RTL: header EN khi global thiếu EN → nhãn từ en.json
- Responsive check thủ công/Playwright screenshot ở 3 mốc (ghi evidence)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-05-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-5): task-05 shell` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/layout.tsx
- src/components/layout/Header.tsx, MobileMenu.tsx, Footer.tsx, LanguageSwitcher.tsx, SkipLink.tsx
- src/i18n/messages/vi.json (khoá layout.*)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-03
- `LanguageSwitcher` phải gọi `buildLocaleCookie(locale)` (`src/i18n/localeCookie.ts`) ghi `document.cookie` khi khách bấm chuyển ngôn ngữ; proxy không tự đặt cookie.
- Cookie chỉ dùng để giữ lựa chọn cho UI (vd đánh dấu ngôn ngữ đang chọn). KHÔNG đọc nó để redirect `/` hay đổi ngôn ngữ của URL (trái SPEC F12: không tự chuyển theo ngôn ngữ trình duyệt; mỗi URL một ngôn ngữ). Nếu muốn thêm hành vi dựa trên cookie phải qua Change Request.
