# feature-header-logo-gold · phase-1-task-01 — Header nền sáng dùng logo vàng mặc định

- Change doc: `spec/changes/2026-10-19-header-logo-gold.md` (BACKLOG BL-018)
- Spec: SPECIFICATIONS.md "Khung trang" (logo mặc định: vàng cho nền sáng, trắng cho nền tối), `docs/DESIGN.md` § Logo + bảng Header, design-spec §2.1 (biến thể Đặc, dòng Logo)

## Hiện trạng (change-request đã kiểm)
- `src/components/layout/BrandLogo.tsx:7` `STATIC_LOGO["on-light"]` = `/brand/tami-logo-dark.png` (800×416); `on-dark` = `/brand/tami-logo-white.png` (800×416).
- `public/brand/tami-logo-gold.png` 800×416 (cùng khung với bản đen/trắng → không đổi width/height, không CLS).
- Dùng: `Header.tsx:48` (`logo-on-light`, `image={logo.onLight}`), `Header.tsx:49` / `Footer.tsx:48` / `MobileMenu.tsx:55` dùng `tone="on-dark"` (giữ trắng).
- Test khoá đường dẫn tĩnh: `src/components/layout/Header.test.tsx:67` (`["/brand/tami-logo-dark.png", "/brand/tami-logo-white.png"]`).
- `site-settings.logo` (CMS) vẫn ưu tiên (`image ?? STATIC_LOGO[tone]`) — không đổi.

## Classification / Risk
- Type: **MODIFY** (đổi asset mặc định 1 tone). Không đổi schema/API/quyền.
- Risk: **LOW** — 1 hằng số trong component dùng chung của header. Reviewer: **NORMAL** (component dùng chung trên mọi trang, nhưng chỉ đổi URL ảnh tĩnh).

## Tương phản — user chấp nhận
Logo vàng trên nền sáng: trung vị 1.50:1 (1.04–2.01:1) trên #FFFFFF, 1.38:1 trên #F7F5F4 — **không đạt 3:1 non-text**. User chọn phương án B 2026-10-19 ("dùng vàng thử đi"): chấp nhận ~1.5:1 (logo được WCAG miễn trừ). Không thêm test contrast cho logo.

## Quyết định thiết kế (change-request)
1. Đổi `STATIC_LOGO["on-light"].url` → `/brand/tami-logo-gold.png` (giữ 800×416). Cập nhật JSDoc nếu nhắc bản đen.
2. Cập nhật test `Header.test.tsx:67` + test BrandLogo nếu có; thêm khẳng định footer/menu (on-dark) vẫn trắng nếu chưa có.
3. Không xoá `public/brand/tami-logo-dark.png` (bản in/dự phòng). Không đổi admin `Logo.tsx`, OG fallback.
4. Doc as-built: `docs/ARCHITECTURE.md` nếu có nhắc logo đen mặc định; intent docs change-request đã sửa — builder KHÔNG sửa.

## Acceptance
- [ ] Header đặc (sticky + trang không hero) hiện `/brand/tami-logo-gold.png` khi CMS chưa có `logo`
- [ ] Header trong suốt trên hero, footer, menu toàn màn hình giữ `/brand/tami-logo-white.png`
- [ ] `site-settings.logo` có → dùng logo CMS (không đổi)
- [ ] Test cập nhật, `pnpm lint` / `pnpm typecheck` / `pnpm test` PASS

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (liên quan + toàn bộ nếu khả thi)
- Report: `.context/review-reports/feature-header-logo-gold-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Xem "Quyết định thiết kế" 1–4; tương phản do user chấp nhận (phương án B).
- (builder) `STATIC_LOGO["on-light"]` → `/brand/tami-logo-gold.png` (800×416, không đổi kích thước); JSDoc cập nhật. `Header.test.tsx` đổi khẳng định đường dẫn tĩnh (gold + white; header đặc + header trong suốt). Thêm khẳng định logo trắng cho Footer (`Footer.test.tsx`) và MobileMenu (`MobileMenu.test.tsx`). Test logo CMS ưu tiên giữ nguyên (đã có). Không thêm test contrast. `docs/ARCHITECTURE.md` chỉ nói "logo tĩnh `/brand/*`" → no doc impact.

## Verification summary
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (257 files, 2677 tests).
- `pnpm build` bỏ qua: tránh đụng `.next` khi dev server khác có thể đang giữ.
- Files: `src/components/layout/BrandLogo.tsx`, `Header.test.tsx`, `Footer.test.tsx`, `MobileMenu.test.tsx`.

## Residual
- Tương phản logo vàng trên nền sáng ~1.5:1 (user chấp nhận, phương án B). Chưa xem trực quan trên trình duyệt.

## Review
- Round 1 — **NORMAL PASS** (`.context/review-reports/feature-header-logo-gold-phase-1-task-01-round-1-review.md`): 0 CRITICAL/MAJOR. MINOR: thiếu test footer/menu khi CMS có `logoDark` (hành vi không đổi); comment `BrandLogo.tsx:5` dài. Chấp nhận.

## Close-out (change-request)
- Spec-validator: không chạy riêng — PATCH làm rõ logo mặc định khớp intent sẵn có của `docs/DESIGN.md` § Logo, quyết định mơ hồ duy nhất (tương phản) do user chốt.
- Doc impact: intent `SPECIFICATIONS.md` Khung trang, `docs/DESIGN.md` § Logo + bảng Header, `.context/design-spec.md` §2.1 (change-request); as-built: no doc impact.
- Spec 1.12.1 · scopeVersion 14. Progress `features[]` `header-logo-gold` done; BACKLOG BL-018 done; change doc archive.
- Residual: tương phản ~1.5:1 (user chấp nhận); chưa xem trình duyệt; `pnpm build` chưa chạy.
