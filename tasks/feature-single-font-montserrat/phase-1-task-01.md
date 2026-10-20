# feature-single-font-montserrat · phase-1-task-01 — Toàn site công khai dùng 1 font Montserrat (BL-036)

- Change doc: `spec/changes/2026-10-20-single-font-montserrat.md` (BACKLOG BL-036).
- Phụ thuộc: không. Một task.
- Trạng thái: `done` — reviewer STRICT r1 FAIL (MAJOR doc) → r2 PASS; user chọn Montserrat + "làm đi" (AUTO PROCEED).

## Classification / Risk
- Type: **MODIFY** (typography toàn site công khai; đổi intent design-spec — user đã duyệt trong chat 2026-10-20).
- Risk: **MEDIUM** — token font dùng toàn site (~67 chỗ `font-display` / 50 file); không schema/API/quyền/dữ liệu/URL.
- Expected review level: **STRICT** (shared token, mọi trang công khai).
- Blast radius: mọi trang `(frontend)` (heading, giá, thông số, hotline, menu mobile, accordion…). Admin (`src/app/(payload)/custom.scss`, đã Montserrat), email (Arial), `src/app/global-error.tsx` — KHÔNG đổi.
- Spec delta: `SPECIFICATIONS.md` (Giao diện + bảng stack + S03 h1 + PostCard) → 1.31.0 (đã ghi).

## Thiết kế (đã chốt — làm đúng như dưới, chỉ lệch khi có lý do kỹ thuật và ghi lại)
1. **Bỏ EB Garamond hoàn toàn**
   - `src/lib/fonts.ts`: xoá `EB_Garamond`/`ebGaramond`; chỉ còn `montserrat` (subset `latin` + `vietnamese`, weight `400/500/600`, `display: swap`, variable `--font-montserrat`). Không nạp thêm 700.
   - `src/components/layout/PublicDocument.tsx`: bỏ `ebGaramond.variable` khỏi className `<html>`.
   - Grep xác nhận không còn `Garamond` / `eb-garamond` trong `src/`.
2. **Giữ token vai trò `--font-display` nhưng trỏ về Montserrat** (gọn nhất, không phải sửa ~67 chỗ class):
   `--font-display: var(--font-montserrat), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;` (cùng stack `--font-sans`; có thể viết `var(--font-sans)` nếu Tailwind v4 `@theme` resolve đúng — kiểm CSS build). Comment rõ: "vai trò tiêu đề, cùng font Montserrat (BL-036)".
   Nếu builder thấy chỗ nào `font-display` thừa hẳn thì KHÔNG cần xoá (giữ diff nhỏ).
3. **Phân cấp heading bằng cỡ + độ đậm** (sans 400 ở cỡ lớn trông mảnh): trong `@theme` của `src/app/(frontend)/globals.css` thêm weight mặc định cho thang chữ (Tailwind v4 `--text-<name>--font-weight`, utility `font-*` tường minh vẫn ghi đè):
   - `display`, `h1`, `h2`, `h2-sm`, `h3`: **500**; `h4`, `price`: **600**.
   - Rà các chỗ `font-display` đi kèm `font-normal` tường minh (ép 400) → đổi/bỏ cho hợp phân cấp mới (heading 500); `font-medium` hiện có giữ.
   - Kiểm chỗ dùng `text-h3`/`text-h4` cho chữ KHÔNG phải tiêu đề (menu mobile, accordion, giá…) — 500/600 chấp nhận được; nếu chỗ nào rõ ràng nên 400 (vd đoạn văn) thì thêm `font-normal`.
4. **Thang chữ hợp sans** (Montserrat rộng hơn Garamond ~15–20%, dấu tiếng Việt chồng cao):
   - Cỡ đề xuất (desktop max / mobile min): display `clamp(1.75rem, 1.2rem + 2.6vw, 3.25rem)` (28→52px); h1 `clamp(1.625rem, 1.15rem + 2.3vw, 3rem)` (26→48px); h2 `clamp(1.5rem, 1.15rem + 1.5vw, 2.375rem)` (24→38px); h2-sm `clamp(1.375rem, 1.3rem + 0.4vw, 1.625rem)` (22→26px); h3 `clamp(1.25rem, 1.2rem + 0.25vw, 1.375rem)` (20→22px); h4 1.125rem giữ; price giữ cỡ hiện tại hoặc giảm nhẹ nếu tràn. Giữ thứ tự h1 ≥ h2 ≥ h2-sm ≥ h3 ≥ h4 ở mọi viewport.
   - line-height: display/h1 **1.15**, h2 **1.2**, h2-sm **1.25**, h3 1.3 (đủ chỗ dấu chồng "Ầ/Ỗ/Ẫ").
   - letter-spacing: display/h1/h2 **-0.01em**; h2-sm/h3 0; không đổi eyebrow/button.
   - Cập nhật comment thang chữ (bỏ "EB Garamond, weight 400").
5. **Sentence case giữ nguyên** (BL-020): không thêm `uppercase` cho heading; menu mobile đang in hoa giữ như hiện tại.
6. **Không đổi** admin, email, `global-error.tsx`.

## Docs (đã được user duyệt đổi intent — cập nhật cùng task)
- `.context/design-spec.md`: dòng ~9 ("EB Garamond + Montserrat" → "Montserrat (một font)"), §typography ~68 (heading viết thường Montserrat 500, phân cấp bằng cỡ/đậm), ~479 (bỏ ghi chú "EB Garamond chỉ nạp 400/500"), bảng kiểm ~711 (Serif → "Một font Montserrat, không serif (BL-036)"); các mô tả "serif" khác của site công khai (~95, 273, 279, 285, 352, 357, 543, 545, …) → bỏ chữ "serif" hoặc thay "Montserrat". Ghi 1 dòng as-built BL-036 ở mục typography.
- `docs/DESIGN.md` § Typography (~179–198) + dòng ~18/23/238/246/263/267: bảng font chỉ Montserrat, bảng thang chữ cập nhật cỡ/weight/line-height mới; bỏ "serif".
- `skills/react-nodejs/design-tokens.md`: ~10, ~22, ~127–128, ~365–366, ~462–464 theo token mới.
- KHÔNG sửa `SPECIFICATIONS.md` (change-request đã ghi), spec/updates, CHANGELOG, test-scope, progress.json, BACKLOG.

## Files dự kiến
- Sửa: `src/lib/fonts.ts`, `src/lib/fonts.test.ts`, `src/components/layout/PublicDocument.tsx` (+ test nếu có assert className), `src/app/(frontend)/globals.css`, các component có `font-normal` cần đổi (nếu có), docs ở trên.
- KHÔNG đụng: `next.config.ts` (sửa dở của user), `src/payload-types.ts`, `src/components/projects/*` chỉ lệch CRLF (đừng stage — không cần sửa; nếu buộc phải sửa file trong đó vì `font-normal` thì báo lại), `.claude/launch.json`.

## Test (bắt buộc)
- `src/lib/fonts.test.ts`: viết lại — nguồn không còn `EB_Garamond`; Montserrat có subset `vietnamese` + weight `["400","500","600"]`.
- Test mới (đọc `globals.css` như fonts.test): `--font-display` dùng `--font-montserrat` (không serif); thang `display/h1/h2/h2-sm/h3` có `--font-weight: 500`, `h4/price` 600.
- Test nguồn `PublicDocument.tsx` không còn `ebGaramond` (hoặc render assert className chỉ có biến montserrat).
- Test component hiện có assert class `font-display` vẫn PASS (token giữ tên).

## Verification
- Lệnh từ `.context/project-config.md`: `pnpm vitest run src/lib src/components` (hoặc full `pnpm test` nếu đủ nhanh) + `pnpm typecheck` + `pnpm lint`.
- Grep: `grep -rn "Garamond\|eb-garamond" src` → rỗng.
- Kiểm trực quan (nếu dev server chạy được — xem `.claude/launch.json`): trang chủ, `/du-an`, chi tiết dự án, `/cho-thue` + chi tiết, `/tin-tuc` + chi tiết ở 390 và 1280: không tràn ngang, heading không vỡ/xén dấu. Không chạy được → ghi residual risk, không block.

## Retry / Escalation
- Max 3 attempt; sau 3 lần fail → `architecture_review_needed`, dừng.

## Verification summary
- fonts.ts chỉ còn Montserrat (latin+vietnamese, 400/500/600); PublicDocument bỏ ebGaramond; globals.css: --font-display trỏ --font-montserrat, thang chữ cỡ/line-height/letter-spacing mới + --text-*--font-weight (display/h1/h2/h2-sm/h3 500, h4/price 600).
- Bỏ font-normal ở ProjectHero h1 (ép 400); đổi assert test project-detail.test.tsx (not.toContain font-normal). font-normal còn lại (RentalSpecs/SaleContactBox hậu tố /tháng, LanguageSwitcher) là đúng ý.
- Docs: .context/design-spec.md, docs/DESIGN.md, skills/react-nodejs/design-tokens.md cập nhật (không còn Garamond/serif).
- Verify: pnpm vitest run src/lib src/components → 1 fail ban đầu (project-detail h1 font-normal), sửa xong PASS; pnpm typecheck sạch; pnpm lint 0 error (2 warning cũ ở tools/task-dashboard/server.mjs); grep Garamond trong src chỉ còn assert âm trong fonts.test.ts.
- Lưu ý: ProjectHero.tsx / project-detail.test.tsx nằm trong src/components/projects (đang lệch CRLF) — buộc phải sửa vì font-normal.

- Reviewer r1 STRICT FAIL: MAJOR `.context/design-spec.md:70` còn thang cỡ cũ → change-request sửa doc + MINOR `PublicDocument` className. r2 STRICT PASS `.context/review-reports/feature-single-font-montserrat-phase-1-task-01-round-2-review.md`: `pnpm vitest run src/lib src/components` 1919/1919, typecheck PASS, lint 0 error.
- Spec 1.30.0 → **1.31.0** (MINOR), scope **v38** — `spec/updates/2026-10-20-single-font-montserrat.md`.

## Residual risk
- Chưa kiểm trực quan 390/1280 (không chạy dev server) — cần reviewer/người xem: heading Montserrat không tràn/vỡ dấu, text-h3/h4 ở menu mobile/accordion/giá nay đậm 500/600.
- Test chỉ kiểm token `--text-*--font-weight` trong globals.css; reviewer r1 đã xác nhận qua nguồn tailwindcss 4.3.3 rằng utility `text-*` sinh `font-weight` và `font-*` tường minh ghi đè.
- `font-bold` (LanguageSwitcher) + `<strong>` (RichText) cần 700 chưa nạp → bold giả (có từ trước, ngoài scope; đề xuất backlog riêng).
