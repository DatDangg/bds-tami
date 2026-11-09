# bug-footer-logo-not-linked · phase-1-task-01 — Bấm logo footer không về trang chủ (BL-117, QA 34)

- Change doc: `spec/changes/2026-11-09-footer-logo-not-linked.md` (BACKLOG BL-117).
- Phụ thuộc: không.
- Trạng thái: `done` — FAST PASS round 1 (`.context/review-reports/bug-footer-logo-not-linked-phase-1-task-01-round-1-review.md`); 2 MINOR không chặn

## Classification / Risk
- Type: **BUG**.
- Severity: low-medium.
- Risk: **LOW** — footer dùng chung mọi trang công khai, chỉ bọc link quanh logo.
- Expected review level: FAST/NORMAL.
- Doc impact dự kiến: `no doc impact` (builder grep design-spec §2.4 footer xem có câu "logo về trang chủ" — chỉ đề xuất, không sửa `.context/design-spec.md` đang bẩn).

## Root cause (đã chứng minh)
`src/components/layout/Footer.tsx:55` render `<BrandLogo tone="on-dark" image={logo.onDark} className="self-start" />` không bọc link; Header (`src/components/layout/Header.tsx:47`) bọc `<Link href={homeHref} aria-label={t("home")}>`.

## Thiết kế fix
- Bọc logo footer bằng `Link` (cùng cơ chế locale như Header — `@/i18n/navigation` hoặc `homeHref` theo locale: `/` cho vi, `/en` cho en) về trang chủ đúng ngôn ngữ.
- Tên truy cập: dùng lại key sẵn có `layout.header.home` ("TAMI, về trang chủ" / bản EN) — **KHÔNG thêm key mới vào `src/i18n/messages/*`** (task khác đang sửa các file đó). Footer hiện là Server Component? — builder chọn `getTranslations`/`useTranslations` phù hợp hoặc nhận chuỗi qua props từ nơi dựng footer.
- Alt logo rỗng khi nằm trong link (theo comment `BrandLogo` / như Header). Vùng chạm ≥ 44px (`min-h-11`), focus-visible rõ trên nền tối; giữ `self-start` (link không giãn hết cột).

## Files
- Sửa: `src/components/layout/Footer.tsx` (+ nơi truyền props nếu cần), test (`src/components/layout/Footer.test.tsx` nếu có, hoặc test mới).
- KHÔNG đụng: `src/i18n/messages/*`, file bẩn ngoài scope.

## Acceptance
- [ ] Logo footer là link về `/` (vi) và `/en` (en), có tên truy cập, alt ảnh rỗng.
- [ ] Test hồi quy (fail trước / pass sau) cho cả 2 locale.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm vitest run src/components/layout` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: mọi trang → footer → bấm logo → không điều hướng.
- Expected: bấm logo footer về trang chủ đúng ngôn ngữ (`/` vi, `/en` en).
- Actual before fix: logo là `BrandLogo` trần, không phải link (Footer.tsx:55), bấm không điều hướng.
- Actual after fix: logo bọc `Link` href `resolveNavLink("home", locale)` (vi `/`, en `/en`), `aria-label` = key sẵn có `layout.header.home`, ảnh alt rỗng, `min-h-11 min-w-11`, focus-visible outline, giữ `self-start`.
- Evidence: test hồi quy mới `Footer: logo là link về trang chủ (BL-117)` (it.each vi/en) trong `Footer.test.tsx`; trước fix footer không có link tên đó (getByRole fail), sau fix PASS. `pnpm vitest run src/components/layout` 22 file / 163 test PASS; `pnpm typecheck` sạch; eslint 2 file sạch.
- Status: PASS (chưa chạy trình duyệt thật; không stash để chạy fail-before do cây bẩn, fail-before suy ra từ code cũ).

## Residual risk
Thấp. Không kiểm tra trình duyệt/viewport thật; `pnpm lint` toàn repo chưa chạy (chỉ eslint file đổi). Footer dùng `next/link` + `resolveNavLink` như Header nên không đổi cơ chế locale.

## Doc impact
`no doc impact`. design-spec §2.4 (dòng 111) không nói logo footer có/không là link; đề xuất (không sửa file đang bẩn) thêm "logo là link về trang chủ" nếu muốn.
