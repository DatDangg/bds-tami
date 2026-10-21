# feature-home-about-match-mockup · phase-1-task-01 — Khối Về TAMI trang chủ làm lại đúng mockup

- Nguồn: `spec/changes/archive/2026-10-21-home-about-match-mockup.md` (BL-047).
- Plan: 1 phase / 1 task. User 2026-10-21 "xử lý nốt đi" = auto proceed. Code đã sửa inline ở session trước; task này hợp thức hoá: verify → review → publish → commit.

## Classification / Risk
- Type: **MODIFY** (bố cục khối Về TAMI ≥ lg + thêm 2 giá trị icon).
- Risk: **MEDIUM** — có migration (additive enum `ALTER TYPE ... ADD VALUE` trên 3 enum dùng chung field icon: `homepage_about_stats`, `homepage_strengths_items`, `site_settings_careers_perks`); down đổi giá trị mới về `star`/`users` trước khi dựng lại enum cũ. Không DROP dữ liệu khi up.
- Expected review level: **STRICT** (DB/migration).
- Blast radius: trang chủ vi/en (khối Về TAMI), admin Trang chủ (Điểm mạnh, số liệu Về TAMI), admin Cài đặt (Tuyển dụng — quyền lợi) do dùng chung `strengthIconField`; seed dev.

## Scope (đã làm)
1. `src/components/home/AboutBlock.tsx`: ≥ lg cụm ảnh 7/12 cột (ảnh lớn 62%, ảnh phụ 36%, chú thích 34%), chữ cột 8–12 tối đa 27rem, tiêu đề `lg:text-h1`; `decorImage` 10% mép phải, mờ 60% + mask nhạt dần.
2. Icon: `src/components/icons.ts` (+`Medal`, `UsersThree`), `src/components/home/strength-icons.ts`, `src/globals/homepage/blocks.ts` (`STRENGTH_ICONS` + nhãn), `src/payload-types.ts` (regen).
3. Migration `migrations/20261021_020651_about_stats_icons.{ts,json}` + `migrations/index.ts`.
4. `scripts/seed-page-heroes.ts`: `seedHomeAbout` (ảnh phụ, ảnh trang trí, đoạn giới thiệu + chú thích vi/en, icon số liệu) — dữ liệu dev.
5. Spec/doc: `SPECIFICATIONS.md` (danh sách icon), `.context/design-spec.md` (as-built Về TAMI).

## Verify
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · migration inspect (`pnpm payload migrate` đã chạy local session trước)

## Acceptance
- [x] Bố cục ≥ lg khớp mockup (cụm ảnh to hơn, chữ cột hẹp, tiêu đề h1)
- [x] Toà nhà trang trí mép phải không đè chữ
- [x] Icon `medal` / `users-three` chọn được trong admin, render đúng
- [x] Migration additive; down không lỗi cast
- [x] < lg không đổi; nền kem / nút video / thứ tự khối giữ nguyên

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (Builder — inline session trước, chạy lại 2026-10-21)
- `pnpm typecheck`: PASS. `pnpm lint`: 0 error (2 warning cũ ngoài scope).
- `pnpm test`: 344 files / 3531 tests PASS (chạy chung working tree với BL-046).
- Còn thiếu (ngoài phạm vi): hoa văn sóng mép trái mockup.

## Residual risk
- Down migration `20261021_020651_about_stats_icons` lossy: đổi `medal`/`users-three` về `star`/`users`, không phục hồi được sau rollback (up thuần additive, không HIGH_RISK).
- Responsive chỉ kiểm bằng tính CSS, chưa đo trình duyệt (caption EN ở 1024px, tương phản vùng decor).

## Verification summary attempt 2 (Builder)
- MAJOR-1: `decorImage` chỉ hiện từ `min-[1400px]` (tại 1400 mép chữ ~1257px < mép decor 1260px; 1280–1392 từng đè); test khoá class; design-spec as-built cập nhật.
- MINOR-1..4: gộp hàm upload ảnh seed; header seed + kiểm ảnh nguồn trước khi ghi + `?? row.icon`; test icon `medal`/`users-three`.

## Review
- Round 1: `.context/review-reports/feature-home-about-match-mockup-phase-1-task-01-round-1-review.md` — **STRICT, FAIL** (MAJOR-1 ảnh trang trí đè cột chữ 1280–1392px; MINOR seed lặp hàm upload / ENOENT thô / `?? null` xoá icon, residual down lossy, thiếu test icon mới). Migration OK.
- Round 2: `.context/review-reports/feature-home-about-match-mockup-phase-1-task-01-round-2-review.md` — **STRICT, PASS**. MINOR mở (không chặn): (A) đúng 1400px có scrollbar Windows mép mờ ảnh có thể chạm chữ ~3.5px tới ~1409px (vùng gần trong suốt); (B) JSDoc `AboutBlock.tsx:75` còn ghi "cụm ảnh cột 1-6, chữ cột 7-12"; (C) kiểm ảnh nguồn seed chạy sau các bước seed trước (dev, chạy lại được).

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r2** (attempt 2). Full `pnpm test` 344 files / 3533 PASS, `pnpm typecheck` PASS, `pnpm lint` 0 error — chạy lại sau fix attempt 2.
- Spec Publisher: `SPECIFICATIONS.md` 1.42.0 → **1.43.0**, `spec/updates/2026-10-21-home-about-match-mockup.md`, CHANGELOG, test-scope **v53** (archive v52).
- Migration `20261021_020651_about_stats_icons`: additive, không HIGH_RISK; down lossy (đã ghi Residual risk).

## Doc impact
- As-built: `docs/ERD.md` (icon `strengths`/`about.stats`/`careersPerks` 10 giá trị + migration), `.context/design-spec.md` (as-built Về TAMI). Intent: `SPECIFICATIONS.md` danh sách icon qua change request (1.43.0). Không đổi API.
