# feature-back-to-top-button · phase-1-task-01 — Nút nổi "Lên đầu trang" (BL-035)

- Change doc: `spec/changes/2026-10-20-back-to-top-button.md` (BACKLOG BL-035).
- Phụ thuộc: không. Một task.
- Trạng thái: `done` — reviewer NORMAL PASS r1; user duyệt plan + AUTO PROCEED ("Ok, chạy luôn"); giả định vị trí/ngưỡng trong change doc đã chốt.

## Classification / Risk
- Type: **ADDITIVE** (component mới; chỉnh khung nổi của `FloatingContact` để dùng chung vị trí).
- Risk: **LOW–MEDIUM** — client component trong shell công khai (mọi trang); không schema/API/quyền/dữ liệu/URL. Chạm `FloatingContact` (thống kê lượt bấm phải giữ nguyên).
- Expected review level: **NORMAL** (shared layout component, mọi trang công khai).
- Blast radius: mọi trang `(frontend)` qua `PublicShell`; nút liên hệ nổi; banner cookie < md; thanh "Nhận tư vấn" dính đáy trang chi tiết.
- Doc impact: `SPECIFICATIONS.md` F8 + `.context/design-spec.md` §2.5 (đã ghi spec delta). No API/ERD impact.

## Thiết kế
- **Khung cụm nổi chung** (`src/components/layout/FloatingDock.tsx` hoặc tên tương đương, server-safe wrapper): chuyển phần định vị từ div ngoài của `FloatingContact` lên khung chung:
  `fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--floating-bottom-offset,0px)+var(--sticky-cta-height,0px))] z-(--z-floating) flex flex-col items-end gap-3 print:hidden`.
  Thứ tự con: `BackToTop` (trên) → `FloatingContact` (dưới). Khung là bottom-anchored nên nút lên đầu trang hiện/ẩn không làm xê dịch nút liên hệ.
  Khung không được chặn click nội dung phía sau ở vùng trống: `pointer-events-none` trên khung + `pointer-events-auto` trên các nút/nhóm con (hoặc cách tương đương).
- `FloatingContact`: giữ `role="group"` + `aria-label`, giữ logic (sendBeacon, toggle mobile, trả `null` khi không có link); bỏ class định vị (đã lên khung). Cập nhật test đang assert offset var trên group (`FloatingContact.test.tsx:115`) sang khung chung.
- `PublicShell`: thay `<FloatingContact …/>` bằng khung chung chứa `<BackToTop />` + `<FloatingContact …/>`. Không áp dụng admin (admin không dùng PublicShell).
- **`BackToTop`** (`src/components/layout/BackToTop.tsx`, `"use client"`):
  - State `visible` = `window.scrollY > window.innerHeight`; SSR/khởi tạo = ẩn; lắng nghe `scroll` (passive, gom bằng `requestAnimationFrame`) + `resize`; tính lại một lần khi mount; dọn listener khi unmount.
  - `<button type="button" aria-label={t("backToTop")}>` tròn `size-12` (48px), `rounded-full shadow-lg`, nền `bg-surface` + `border border-border` + icon `ArrowUp` 24px `aria-hidden` (thêm `ArrowUp` vào barrel `src/components/icons.ts` nếu chưa có), hover token phù hợp, focus-visible ring theo token đang dùng ở các nút khác của dự án.
  - Ẩn: `invisible opacity-0` (+ `aria-hidden` không cần vì `visibility:hidden` đã loại khỏi a11y tree/tab order); hiện: `visible opacity-100`; `transition-[opacity,visibility] duration-(--duration-fast) ease-(--ease-standard)` (reduced-motion: rule global trong `globals.css` đã ép duration ~0 — xác minh).
  - Click: `const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;` → `window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" })`; rồi `document.getElementById("main")?.focus({ preventScroll: true })`.
- i18n: thêm `page.floating.backToTop` — vi "Lên đầu trang", en "Back to top" (`src/i18n/messages/{vi,en}.json`).
- Header ẩn khi cuộn (DetailLayout): không phụ thuộc; về đầu trang thì header tự hiện lại theo logic sẵn có — không sửa header.

## Files
- Mới: `src/components/layout/BackToTop.tsx`, `src/components/layout/BackToTop.test.tsx`, khung chung (file mới hoặc trong `PublicShell`).
- Sửa: `src/components/layout/FloatingContact.tsx`, `src/components/layout/FloatingContact.test.tsx`, `src/components/layout/PublicShell.tsx` (+ `PublicShell.test.tsx` nếu cần), `src/components/icons.ts`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`.
- KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, `src/components/projects/*` (sửa dở của user), `.claude/launch.json`, `template-feedback.md`.

## Test (bắt buộc)
- BackToTop: ẩn ban đầu (invisible); cuộn quá `innerHeight` → hiện; cuộn về gần đầu → ẩn; click → `scrollTo` với `behavior: "smooth"`; với `matchMedia` reduced-motion → `"instant"`; focus chuyển vào `#main`; `aria-label` đúng; dọn listener khi unmount.
- Khung chung / PublicShell: khi `floatingContact` không có link nào → vẫn render nút lên đầu trang; khung mang offset var `--floating-bottom-offset` + `--sticky-cta-height` + `print:hidden`.
- FloatingContact: test hiện có vẫn PASS (sendBeacon, toggle).

## Verification
- `pnpm vitest run src/components/layout` + `pnpm typecheck` + `pnpm lint` (lệnh từ `.context/project-config.md`).

## Retry / Escalation
- Max 3 attempt; sau 3 lần fail → `architecture_review_needed`, dừng.

## Verification summary
- Builder: mới `FloatingDock.tsx` (khung fixed + offset var + `print:hidden` + `pointer-events-none`), `BackToTop.tsx` (+ test 6 ca), PublicShell dùng dock chứa BackToTop -> FloatingContact; FloatingContact bỏ class định vị, thêm `pointer-events-auto`; icon `ArrowUp`; i18n `page.floating.backToTop` vi/en; test FloatingContact (offset -> pointer-events-auto) + 2 test dock trong PublicShell.test.
- Verify: `pnpm vitest run src/components/layout src/components/consent` PASS (trước đó 17 file/121 test layout PASS sau sửa stub rAF); `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope).
- Quyết định: `globals.css` KHÔNG có rule reduced-motion toàn cục ép transition -> thêm `motion-reduce:transition-none` trên nút. Focus sau click chuyển vào `#main` (preventScroll). Nút ẩn bằng `invisible` nên con trỏ không bắt click khi ẩn.

- Reviewer r1 NORMAL PASS (3 MINOR) `.context/review-reports/feature-back-to-top-button-phase-1-task-01-round-1-review.md`; `pnpm vitest run src/components/layout src/components/consent` 18 file / 141 test PASS, typecheck PASS, lint 0 error.
- Spec 1.29.0 → **1.30.0** (MINOR), scope **v37** — `spec/updates/2026-10-20-back-to-top-button.md`.

## Residual risk
- Chưa xem trình duyệt thật: nút xếp trên banner cookie < md / thanh "Nhận tư vấn" dính đáy / safe-area iOS chỉ xác minh bằng CSS + unit test (jsdom không cuộn thật).
- MINOR-1: `PublicShell.test.tsx` lấy khung bằng `button.parentElement` (giòn nếu bọc thêm lớp).
- MINOR-2: test dọn listener chỉ so tên sự kiện, không so handler.
- MINOR-3: `hover:bg-surface-muted` có thể dính sau khi chạm trên màn cảm ứng.
- `FloatingContact` group `pointer-events-auto` bao cả khe giữa các nút (vùng nhỏ, như hành vi cũ).
