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
- [x] G14: e2e lưu header/footer global → trang công khai vi/en đổi trong ≤ 1 lần tải (revalidateTag thật, `next start`) (spec-validation layer 4)
- [x] L3-T01 MINOR-1: bỏ regex lookbehind `(?<!d)` trong `src/lib/monitoring/scrub-text.ts:7` (chunk client → SyntaxError, không hydrate trên Safari/iOS < 16.4, in-app Zalo/Facebook); có test — PHẢI xong trước deploy prod (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [x] L3-T01 MINOR-2/3: logger lọc tham số `%s` là Error / `%d`; giảm che nhầm số dài (timestamp ms, UUID, số tài khoản) và che SĐT dạng `(028) 3823 4567` (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [x] Upload source map GlitchTip (stack trình duyệt đang minify) (spec-validation layer 3; chuyển từ layer-4-task-06 deferred)
- [→] Prometheus chạy trong container scrape được app (L3-T03 MINOR-1: `127.0.0.1:3010/3011` của host không tới được từ container — dùng network chung/host-gateway) (spec-validation layer 3; chuyển từ layer-4-task-06 deferred) → **trả về `layer-4-task-06`** (G11: không kiểm được khi chưa có Prometheus)
- [x] Menu: Trang chủ · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ (không có Mua bán)
- [x] Menu ngang chỉ ≥ xl; < xl dùng menu toàn màn hình (bẫy focus, Esc đóng, khoá cuộn nền)
- [x] Nút tìm kiếm header dẫn tới `/cho-thue?q=` (EN `/en/for-rent?q=`)
- [x] Header/footer thiếu bản EN → dùng menu cố định trong `en.json`
- [x] LanguageSwitcher ở header, menu, footer: tạm thời về trang chủ ngôn ngữ kia (map trang tương ứng hoàn thiện ở task EN); đặt cookie `NEXT_LOCALE` phía client
- [x] Skip link là phần tử focus đầu; landmark `header`/`nav[aria-label]`/`main#main`/`footer`
- [x] Responsive 375/768/1280 không cuộn ngang; footer có link "Cài đặt cookie"

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
- Attempt: 2 (builder, sau Reviewer round 1 FAIL: MAJOR-1 scrubText lọt SĐT 12 số, MAJOR-2 touch target, MAJOR-3 dropdown a11y)
- Last failure type: review FAIL (3 MAJOR), không phải lỗi verify
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: builder tự đánh dấu [x] (chờ Reviewer STRICT). Chi tiết:
  - G14: `tests/e2e/revalidate-globals.ts` (`pnpm e2e:revalidate`, cần `pnpm build` + `next start -p 3217`): lưu header/footer qua REST admin tạm → trang `/` và `/en` đổi ở LẦN TẢI ĐẦU (vi, en, footer, cột footer), EN chưa có bản EN thì không lộ nhãn VI; khôi phục dữ liệu qua REST rồi xoá admin tạm. 9/9 PASS, chạy 2 lần (DB global rỗng và đã seed).
  - L3-T01 MINOR-1: `scrub-text.ts` bỏ lookbehind, thay nhóm bắt `(^|D)`; test đối chiếu hành vi cũ (differential 22 mẫu: chỉ khác ở ca MINOR-3) + test cấm `(?<` trong code.
  - MINOR-2: `logger.ts` lọc tham số sau chuỗi format khi có `%s/%d/%i/%f/%o/%O/%j` (Error → `name: message` đã lọc, số chứa SĐT → `[phone]` và đổi `%d`→`%s`). MINOR-3: SĐT có ngoặc `(028) 3823 4567` bị che; dãy >= 12 chữ số liền (timestamp ms, đuôi UUID, số tài khoản) giữ nguyên, trừ khi dính liền một SĐT. Hạn chế còn lại: số tài khoản/mã đơn 9-11 chữ số vẫn bị che (chấp nhận, che dư an toàn PII).
  - Source map: `next.config.ts` `productionBrowserSourceMaps` chỉ khi có `GLITCHTIP_AUTH_TOKEN`; `scripts/upload-sourcemaps.mjs` (`sentry-cli sourcemaps inject` + `upload`, debug ID) luôn xoá `.map` (kể cả lỗi cấu hình/upload); Dockerfile dùng secret mount; `deploy.yml` truyền secret + vars; `.env.example` + runbook deploy §8. `@sentry/cli` 2.58.6 thêm làm devDependency trực tiếp (đã là phụ thuộc bắc cầu của `@sentry/nextjs`, lockfile chỉ +3 dòng; `withSentryConfig` bị loại vì bọc cả build Payload/Turbopack, rủi ro lớn hơn lợi ích). CHƯA kiểm với GlitchTip thật (xem Residual).
  - Prometheus: [→] trả `layer-4-task-06`, bỏ qua theo chỉ đạo.
  - Khung: 7 mục menu, menu ngang chỉ >= xl, menu toàn màn hình < xl (Radix Dialog: bẫy focus, Esc, khoá cuộn, trả focus, aria-expanded/controls), tìm kiếm `/cho-thue?q=` · `/en/for-rent?q=`, thiếu bản EN dùng `en.json`, LanguageSwitcher ở header/menu/footer ghi cookie phía client (không đọc để redirect), skip link đầu tiên, landmark, footer "Cài đặt cookie" (phát sự kiện `tami:open-cookie-settings`, layer-5-task-07 lắng nghe).
- Verify commands + result (lần chạy cuối, sau sửa cuối): `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi · `pnpm typecheck` OK · `pnpm test` 85 file / 915 test PASS (gồm integration với DB dev) · `pnpm build` OK (static /vi, /en; không có `.map` trong `.next/static` khi không có token; có token: 63 map sinh ra rồi bị script xoá).
- Responsive (builder tự đo nhanh bằng trình duyệt, `next start`): 375/768/1280 `scrollWidth` <= viewport (không cuộn ngang); menu toàn màn hình mở được ở 375, `body[data-scroll-locked]`. Primary vẫn nên tự kiểm 3 mốc.
- Attempt 2 (sửa review round 1):
  - MAJOR-1: `scrub-text.ts` che trước mọi dãy có hình dạng SĐT VN qua `normalizePhone` (src/lib/phone.ts) + dạng `+840…`; luật bỏ ID dài chỉ áp cho phần còn lại. Test: +842838234567, 842838234567, 0084912345678, 00842838234567, +840912345678, có dấu cách/chấm, trong JSON, URL query (`%2B84…`, `phone=84…`), sau chữ (`ABC0912345678`), lỗi unique Postgres; test timestamp/UUID/STK giữ PASS; không lookbehind.
  - MAJOR-2: LanguageSwitcher `min-h-11 min-w-11`, separator `px-2` (khoảng cách đo thật 20px); MenuContact tel/mailto `inline-flex min-h-11`; logo header `min-h-11 min-w-11`; footer link `min-w-11`, socials `gap-2`; skip link `min-h-11`. Đo `getBoundingClientRect` trên `next start` (trình duyệt pane) ở 375: 0 phần tử tương tác < 44×44 (cả khi focus skip link và khi mở menu toàn màn hình), `scrollWidth` 375; ở 1280: header 0 phần tử cao < 44, `scrollWidth` 1280.
  - MAJOR-3: `DesktopNav` mục con theo mẫu disclosure: nút caret riêng (`aria-expanded`, `aria-controls`, `aria-label` "Mở mục con của X", 44px), Enter/Space/chạm mở, Esc đóng + trả focus nút, click ngoài + focus rời nhóm đóng, chuột rê vào nhóm mở (chỉ `pointerType=mouse`; chuột click tiếp không đóng), nội dung xổ nằm trong nhóm (hoverable, WCAG 1.4.13), `hidden` khi đóng. Khoá i18n `layout.nav.openSubmenu`. RTL: `DesktopNav.test.tsx`.
  - MINOR-3: ngôn ngữ hiện tại là `<a href={pathname} aria-current hreflang lang>` (đúng spec §2.3). MINOR-5: `useCloseOnDesktop(close)` với `useCallback` (listener không đăng ký lại mỗi render). MINOR-6: e2e chỉ chạy khi `E2E_BASE_URL` là localhost/127.0.0.1/[::1].
  - Verify cuối: install OK · lint 0 lỗi · typecheck OK · `pnpm test` 86 file / 924 test PASS · build OK. Chạy lại đo: `pnpm build && pnpm start -p 3218`, mở `/` và `/en` ở 375 và 1280. Menu con (hover/Esc/touch) chưa đo trên trình duyệt thật vì menu seed không có mục con: cần thêm 1 mục con trong admin global `header`; hiện chỉ có RTL.
- Reviewer verdict: round 1 FAIL (MAJOR-1 scrubText lọt SĐT 12 số, MAJOR-2 touch target <44, MAJOR-3 DesktopNav submenu a11y) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-5-task-05-round-2-review.md`). Primary đo trình duyệt 375/768/1280 (round 1) + 375 touch target (round 2). Residual MINOR-1/4 → AC `layer-14-task-02`; MINOR-2/3 → AC `layer-15-task-01`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: có. `docs/ARCHITECTURE.md` §5 thêm As-built khung trang (load-shell, view model, menu đầy đủ-hoặc-cố-định, ISR 60s, sự kiện cookie) và §8 sửa dòng source map; `docs/runbooks/deploy.md` §8 (source map GlitchTip); `.env.example` (4 biến GLITCHTIP_*). Không đổi API/schema/ERD.
- Decision log (từ review round 1, không sửa trong task này):
  - MINOR-1: menu ngang 1 hàng ở xl (spec §2.1 2 hàng) chấp nhận như trạng thái "đã cuộn"; header trong suốt trên hero hoãn sang task trang có hero; `ctaButton` + logo CMS chưa dùng (follow-up); footer accordion < md, menu toàn màn hình thiếu accordion con/mạng xã hội/stagger (follow-up); nút tìm kiếm là link `/cho-thue?q=` (đúng AC) nên 404 tới khi làm task Cho thuê (residual).
  - MINOR-2: menu ngang không wrap, menu CMS dài có thể tràn ở 1280: follow-up (giới hạn số mục ở admin hoặc bố cục 2 hàng).
  - MINOR-4: giữ `focus:outline-none` trên `<main tabIndex=-1>` (mục tiêu skip link, không phải điều khiển tương tác; ngoại lệ phổ biến).
  - MINOR-7: upload source map lỗi mạng làm dừng build release là có chủ đích (runbook §8); cân nhắc đổi sang cảnh báo khi vận hành thật.
  - `MobileMenu` ~70 dòng (> 50), chưa tách `MenuNavList`: follow-up nhỏ.

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-05 shell` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

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
