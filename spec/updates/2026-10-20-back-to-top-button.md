# Spec Update — 2026-10-20 back-to-top-button (nút nổi "Lên đầu trang")

**spec_version:** 1.29.0 → 1.30.0 (MINOR — thêm hành vi UI công khai mới ở F8; không đổi schema, API, quyền, dữ liệu CMS, URL, metadata, JSON-LD)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-035**, ADDITIVE UI). Change doc `spec/changes/2026-10-20-back-to-top-button.md` (archive ở close-out → `spec/changes/archive/2026-10-20-back-to-top-button.md`). Task `tasks/feature-back-to-top-button/phase-1-task-01.md`. Review: `.context/review-reports/feature-back-to-top-button-phase-1-task-01-round-1-review.md` (pending — reviewer điền).

**Quyết định (user 2026-10-20 "thêm cái lên đầu trang đi"; duyệt plan + AUTO PROCEED "Ok, chạy luôn"; giả định vị trí/ngưỡng trong change doc đã chốt):** D1 nút nằm **cùng cụm nổi** góc dưới phải với `FloatingContact` — một khung `fixed` chung mang toàn bộ định vị (đáy/phải theo safe-area, `--floating-bottom-offset`, `--sticky-cta-height`, `--z-floating`, `print:hidden`), cột bottom-anchored: `BackToTop` trên, `FloatingContact` dưới → nút lên đầu trang ẩn/hiện không xê dịch nút liên hệ; khung `pointer-events-none`, nút con `pointer-events-auto` (không chặn click vùng trống). D2 hiện khi `scrollY > innerHeight`; SSR/khởi tạo ẩn; scroll passive gom `requestAnimationFrame` + resize. D3 ẩn = `invisible opacity-0` (ra khỏi tab order + a11y tree), fade `--duration-fast` `--ease-standard`, reduced-motion tức thì (rule global). D4 bấm → `window.scrollTo({top: 0, behavior: reduced-motion ? "instant" : "smooth"})` + `#main.focus({preventScroll: true})`. D5 `<button>` tròn 48px, `bg-surface` + `border-border` + `shadow-lg`, icon Phosphor `ArrowUp` 24px, focus-visible ring theo token, `aria-label` i18n `page.floating.backToTop` (vi "Lên đầu trang", en "Back to top"). D6 mọi trang công khai qua `PublicShell`, không admin; hiện cả khi `FloatingContact` trả `null` (không cấu hình hotline/Zalo/fanpage). D7 không ghi nhận lượt bấm; không sửa header (về đầu trang header ẩn-khi-cuộn của `DetailLayout` tự hiện lại theo logic sẵn có).

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | ADDITIVE (component mới + khung nổi chung) | close-out BL-035 (commit chứa file này) | Mới: `src/components/layout/BackToTop.tsx`, `src/components/layout/BackToTop.test.tsx`, khung cụm nổi chung (file mới vd `src/components/layout/FloatingDock.tsx` hoặc trong `PublicShell`). Sửa: `src/components/layout/FloatingContact.tsx` (bỏ class định vị, giữ `role="group"` + logic sendBeacon / toggle / trả `null`), `src/components/layout/FloatingContact.test.tsx` (assert offset var chuyển sang khung chung), `src/components/layout/PublicShell.tsx` (+ test nếu cần), `src/components/icons.ts` (`ArrowUp`), `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`. Doc: `SPECIFICATIONS.md` F8, `.context/design-spec.md` §2.5 bullet "Lên đầu trang (BL-035)" | `.context/review-reports/feature-back-to-top-button-phase-1-task-01-round-1-review.md` (pending) |

## Requirements (SPECIFICATIONS.md)

- **F8. Nút liên hệ nổi: FR-PUB-12 (THÊM):** đoạn "Nút "Lên đầu trang" (BL-035)" — cùng cụm nổi góc dưới phải, đứng trên nút liên hệ, cùng khoảng cách đáy/phải, cùng đẩy lên trên banner cookie < md và thanh "Nhận tư vấn" dính đáy; mọi trang công khai (không admin), hiện cả khi không cấu hình hotline/Zalo/fanpage; hiện khi cuộn quá ~1 màn hình, fade (tức thì khi reduced-motion), khi ẩn không nhận focus/không được đọc; bấm cuộn mượt về đầu (instant khi reduced-motion) + focus `#main`; `<button>` tròn 48px, `aria-label` VI/EN, focus ring token, nền trắng viền + icon mũi tên lên, ẩn khi in; không ghi nhận lượt bấm.
- Design as-built: `.context/design-spec.md` §2.5 bullet "Lên đầu trang (BL-035)".

## Schema / Migration / API

Không. Migration: none. Không đổi endpoint thống kê lượt bấm của `FloatingContact`. i18n thêm 1 key `page.floating.backToTop`.

## Hành vi bị thay thế

| Trước | Sau (BL-035) |
|---|---|
| Không có nút lên đầu trang | Nút nổi tròn 48px trên nút liên hệ, hiện khi `scrollY > innerHeight` |
| `FloatingContact` tự định vị `fixed` (div ngoài mang offset var + z-index + `print:hidden`) | Định vị chuyển lên khung cụm nổi chung; `FloatingContact` chỉ còn nhóm nút (`role="group"`), hành vi/thống kê giữ nguyên |
| Site không cấu hình hotline/Zalo/fanpage → không có gì ở góc dưới phải | Vẫn có nút lên đầu trang (khi đã cuộn) |

## Số đo / verify

- Vùng chạm 48×48px (≥ 44px). Nền `--color-surface` + viền `--color-border` + icon màu chữ — tương phản theo token sẵn có.
- Verify (lệnh từ `.context/project-config.md`): `pnpm vitest run src/components/layout` + `pnpm typecheck` + `pnpm lint` — builder / reviewer điền ở task file + report.
- Chưa đo trên trình duyệt thật.

## Ảnh hưởng test

- Direct: mọi trang công khai VI/EN — cuộn quá 1 màn hình → nút hiện (fade), về gần đầu → ẩn; bấm → về đầu trang mượt, focus vào `#main`; reduced-motion → cuộn/ẩn hiện tức thì; Tab không vào nút khi đang ẩn; `aria-label` đúng locale; in trang → ẩn.
- Dependents: `FloatingContact` (hotline / Zalo / fanpage + toggle mobile + ghi lượt bấm sendBeacon) giờ nằm trong khung chung; cookie banner < md (`--floating-bottom-offset`) và CTA "Nhận tư vấn" dính đáy chi tiết (`--sticky-cta-height`) đẩy cả cụm lên; header ẩn khi cuộn ở `DetailLayout` hiện lại khi về đầu bằng nút.
- Regression: nút liên hệ không xê dịch khi nút lên đầu trang ẩn/hiện; không chồng cookie banner / CTA dính đáy; vùng trống của khung không chặn click nội dung phía sau; admin không có nút; không tràn ngang / CLS 375 / 768 / 1024 / 1280.
- Residual: khung chung thay đổi cách định vị `FloatingContact` (shared layout, mọi trang) — risk low-medium; chưa kiểm trực quan trên thiết bị thật (safe-area iOS).
