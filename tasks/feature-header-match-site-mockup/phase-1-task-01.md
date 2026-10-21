# feature-header-match-site-mockup · phase-1-task-01 — Header theo mockup: chữ menu, header thấp xuống, khoảng trước thanh mục con

- Nguồn: `spec/changes/archive/2026-10-21-header-match-site-mockup.md` (BL-046), mục "Phạm vi user chốt". Mục "(Không làm)" ngoài phạm vi.
- Plan: 1 phase / 1 task. User 2026-10-21 "xử lý nốt đi" = auto proceed. Code đã sửa inline ở session trước; task này hợp thức hoá: verify → review → publish → commit.

## Classification / Risk
- Type: **MODIFY** (đổi kích thước header dùng chung + typography menu + khoảng cách thẻ tiêu đề chi tiết).
- Risk: **MEDIUM** — `--header-offset` là biến dùng chung (bù sticky, scroll-margin, thanh mục con, aside dính, hero bù header); header là shared component mọi trang. Không đổi schema/API/auth.
- Expected review level: **STRICT** (shared component/layout token).
- Blast radius: mọi trang public vi/en (header), trang chi tiết dự án / cho thuê / tin BĐS (thanh mục con + aside dính), hero trang chủ/trang con bù header.

## Scope (đã làm)
1. `src/components/layout/DesktopNav.tsx`: chữ menu `text-xsmall` 12px, `tracking-[0.04em]`, gap 24px (`gap-6`, 2xl giữ `gap-8`).
2. `src/app/(frontend)/globals.css`: `--header-offset` 4rem (64px), ≥ lg 4.5rem (72px); comment thanh nổi 6+52+6 / 8+56+8.
3. `src/components/layout/HeaderFrame.tsx`: lề trên thanh nổi `py-1.5` (6px), ≥ lg `py-2` (8px); hai bên giữ 8/16px.
4. `src/components/layout/Header.tsx`: hàng nội dung `h-full` (cao bằng thanh), logo ≥ lg `h-9` (36px).
5. `src/components/detail/DetailTitleCard.tsx`: `pb-8` → khoảng 32px trước thanh mục con (hồi quy BL-045 T04, mockup `.subnav` margin-top 32px).
6. Test: `Header.test.tsx`, `HeaderFrame.test.tsx` theo class mới.
7. Spec/doc: `SPECIFICATIONS.md` (Khung trang), `.context/design-spec.md` §2.1.

## Verify
- `pnpm typecheck` · `pnpm lint` · `pnpm test`

## Acceptance
- [x] Menu ≥ xl chữ 12px / .04em / gap 24px, 1280 VI/EN không tràn 1 hàng (kiểm tay session trước)
- [x] Header đầu trang 64px (≥ lg 72px); thanh nổi 52/56px, lề trên 6/8px; logo ≥ lg 36px
- [x] Nền kính + hành vi cuộn (nổi / ẩn ở trang chi tiết) giữ nguyên
- [x] Khoảng 32px giữa thẻ tiêu đề và thanh mục con ở chi tiết dự án / cho thuê / tin BĐS

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (Builder — inline session trước, chạy lại 2026-10-21)
- `pnpm typecheck`: PASS. `pnpm lint`: 0 error (2 warning cũ `tools/task-dashboard/server.mjs`, ngoài scope).
- `pnpm test`: 344 files / 3531 tests PASS (chạy chung working tree với BL-047).
- Kiểm thị giác session trước: 1440/375 header 72/64 không tràn; 1280 VI/EN menu 1 hàng; chi tiết 1440 khoảng 32px.

## Verification summary (attempt 2, sau reviewer round 1 FAIL)
- MAJOR-1: bo thanh nổi `rounded-[1.625rem]` / `lg:rounded-[1.75rem]` (26/28px = nửa 52/56px) ở `HeaderFrame.tsx`; cập nhật `Header.test.tsx`, `HeaderFrame.test.tsx`, design-spec dòng "Biến thể" (26/28px).
- MINOR-1: sửa chữ "lề trên header nổi 8/16px" -> "lề ngang" ở globals.css, DetailLayout, DetailSubNav, design-spec (Sticky), SPECIFICATIONS. Chỉ comment/chữ.
- MINOR-2: thêm test `--header-offset` 4rem / ≥ lg 4.5rem (`detail-header-css.test.ts`) và `pb-8` ở `DetailTitleCard.test.tsx`.
- MINOR-3: comment `DetailTitleCard` ghi BL-046.
- Verify: `pnpm vitest run src/components/layout src/components/detail` 26 files / 182 tests PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning có sẵn).

## Review
- Round 1: `.context/review-reports/feature-header-match-site-mockup-phase-1-task-01-round-1-review.md` — **STRICT, FAIL** (MAJOR-1 bo thanh nổi 32/36px ≠ nửa 52/56px; MINOR chữ "lề trên 8/16", thiếu test khoá chiều cao, sai mã BL comment).
- Round 2: `.context/review-reports/feature-header-match-site-mockup-phase-1-task-01-round-2-review.md` — **STRICT, PASS** (mọi finding r1 đóng). MINOR `docs/DESIGN.md` Header còn số cũ (từ BL-025) → sửa ở doc reconcile.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r2** (attempt 2). Full `pnpm test` / `pnpm lint` / `pnpm typecheck` chạy lại trên working tree chung trước commit.
- Spec Publisher: `SPECIFICATIONS.md` 1.41.0 → **1.42.0**, `spec/updates/2026-10-21-header-match-site-mockup.md`, CHANGELOG, test-scope **v52** (archive v51).
- Residual risk: chưa kiểm thị giác lại trên browser sau attempt 2 (bo 26/28px) — chỉ tính CSS; mục "(Không làm)" của change doc (nền trắng đặc, sticky phẳng, gạch chân vàng, CTA) chưa làm.

## Doc impact
- As-built: `docs/DESIGN.md` (Header), `.context/design-spec.md` §2.1. Intent: `SPECIFICATIONS.md` Khung trang qua change request đã duyệt (1.42.0). Không đổi API/schema.
