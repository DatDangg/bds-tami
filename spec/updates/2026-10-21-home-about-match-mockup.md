# Spec Update — 2026-10-21 home-about-match-mockup (khối Về TAMI trang chủ làm lại đúng mockup + icon `medal` / `users-three`)

**spec_version:** 1.42.0 → 1.43.0 (MINOR — thêm 2 giá trị icon vào danh sách icon dùng chung (migration additive) + đổi bố cục ≥ lg khối Về TAMI; không đổi API, URL, quyền, hành vi dữ liệu/i18n)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-047**, MODIFY). Change doc `spec/changes/archive/2026-10-21-home-about-match-mockup.md`. Task `tasks/feature-home-about-match-mockup/phase-1-task-01.md`. Review: `.context/review-reports/feature-home-about-match-mockup-phase-1-task-01-round-2-review.md` (STRICT, PASS r2; r1 FAIL MAJOR-1 ảnh toà nhà trang trí đè cột chữ ở 1280–1392px + 4 MINOR — đã đóng; r2 còn 3 MINOR không chặn).

## Requirements (SPECIFICATIONS.md)

- **Overview — trang chủ, "Điểm mạnh" (SỬA danh sách icon):** danh sách icon cố định `strengths.items[].icon` thêm **`medal`**, **`users-three`** (BL-047, migration `20261021_020651_about_stats_icons` additive). Cùng danh sách dùng cho số liệu Về TAMI (`about.stats[].icon`) và quyền lợi Tuyển dụng (`site-settings.careersPerks[].icon`) qua field chung `strengthIconField`.
- **design-spec S01 "2 Về TAMI" (as-built BL-047):** ≥ lg cụm ảnh **7/12 cột** (ảnh lớn 62% ≈ 430px ở 1440, ảnh phụ 36% ≈ 250px, thẻ chú thích 34% ngay dưới ảnh phụ); chữ cột **8–12 tối đa 27rem**; tiêu đề `--text-h1`; `decorImage` rộng 10% mép phải, mờ 60% + mask nhạt dần sang trái, **chỉ hiện từ 1400px** (dưới đó đè cột chữ); số liệu dùng icon `medal` / `users-three`. < lg không đổi.

## Hành vi mới

| | Trước | Sau (BL-047) |
|---|---|---|
| Cụm ảnh Về TAMI ≥ lg | ảnh lớn ~388px, ảnh phụ ~212px (1440) | cột 7/12: ảnh lớn 62% (~430px), ảnh phụ 36% (~250px), chú thích 34% |
| Cột chữ Về TAMI ≥ lg | cột 7–12, rộng | cột 8–12, tối đa 27rem; tiêu đề `--text-h1` |
| Ảnh toà nhà trang trí `decorImage` | từ xl (chưa render đúng mockup) | 10% mép phải, mờ 60% + mask, chỉ ≥ 1400px — không đè chữ |
| Danh sách icon (Điểm mạnh / số liệu Về TAMI / quyền lợi Tuyển dụng) | 8 icon | 10 icon: + `medal`, `users-three` |
| < lg, nền kem, nút play video, thứ tự khối | — | không đổi |

## Code (as-built)

- `src/components/home/AboutBlock.tsx` (+ `AboutBlock.test.tsx`) — lưới cụm ảnh/cột chữ, decor `min-[1400px]`.
- `src/components/icons.ts` (+ `Medal`, `UsersThree`), `src/components/home/strength-icons.ts`, `src/globals/homepage/blocks.ts` (`STRENGTH_ICONS` + nhãn), `src/payload-types.ts` (regen).
- `migrations/20261021_020651_about_stats_icons.{ts,json}`, `migrations/index.ts` — `ALTER TYPE ... ADD VALUE` trên enum `homepage_about_stats`, `homepage_strengths_items`, `site_settings_careers_perks`.
- `scripts/seed-page-heroes.ts` — `seedHomeAbout` (dữ liệu dev).
- Doc: `docs/ERD.md`, `.context/design-spec.md` S01.

## Migration

- **up:** additive (thêm 2 giá trị enum), không HIGH_RISK.
- **down:** lossy — đổi `medal` → `star`, `users-three` → `users` rồi dựng lại enum cũ; không phục hồi lựa chọn icon sau rollback.

## Ảnh hưởng

- **Trực tiếp:** trang chủ vi/en khối Về TAMI (1024 / 1280 / 1400 / 1440 / 1920 + mobile).
- **Admin:** Trang chủ → Điểm mạnh + số liệu Về TAMI chọn được icon mới; Cài đặt → quyền lợi Tuyển dụng cùng danh sách icon.
- **Render icon:** dải Điểm mạnh trang chủ, `/tuyen-dung` (quyền lợi), `/du-an` (dải điểm mạnh).
- Không đổi quyền, không endpoint mới.
- **Ngoài phạm vi:** hoa văn sóng mép trái mockup.
