# bug-header-nav-gold-underline · phase-1-task-01 — Header: mục menu đang xem + hover dùng gạch chân vàng thay viên thuốc xám (BL-087)

- Change doc: `spec/changes/archive/2026-10-27-header-nav-gold-underline.md` (BACKLOG BL-087). User 2026-10-27: "gạch chân vàng vừa để cho active vừa để là hover, nhưng chỉ mỗi header thôi". User yêu cầu sửa trong chat — không checkpoint lại.
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer NORMAL PASS r1 (`.context/review-reports/bug-header-nav-gold-underline-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.59.0), test-scope v88. Doc impact: `.context/design-spec.md` §2.1 (as-built).

## Classification / Risk
- Type: **BUG** (regression UI do BL-074 T02 làm quá tay; không đổi API/schema/requirement).
- Risk: **LOW** — chỉ `src/components/layout/DesktopNav.tsx` (menu ngang header ≥ xl).
- Expected review level: **NORMAL** (1 component; có contrast + ảnh trước/sau).
- Doc impact: `.context/design-spec.md` §2.1 dòng "Mục đang xem" (as-built).

## Repro
- Mọi trang công khai ≥ xl (1280+), VI/EN: mục đang xem (vd "TRANG CHỦ") là viên thuốc nền `--color-text` 10%, hover nền 6%.
- Expected: gạch chân vàng cho mục đang xem VÀ khi hover mục khác; không nền viên thuốc.

## Root cause (change-request, từ code + git)
- Commit 82979e4 (BL-074 T02) đổi `src/components/layout/DesktopNav.tsx:65` từ `border-b-2 border-transparent hover:border-text/40 aria-[current=page]:border-text` sang `rounded-pill px-2.5 … hover:bg-text/6 aria-[current=page]:bg-text/10 2xl:px-3`, và `ul` từ `gap-6 2xl:gap-8` sang `gap-1 2xl:gap-2` (khoảng cách chữ giữ 24/32px nhờ padding viên thuốc). Ý user ở BL-074 chỉ là bỏ gạch chân link/nút khác, không áp cho menu header.

## Thiết kế fix
- Anchor menu ngang: bỏ `rounded-pill`, `px-*`, `hover:bg-*`, `aria-[current=page]:bg-*`; dùng vạch 2px `border-b-2 border-transparent` + `hover:border-accent-text` + `aria-[current=page]:border-accent-text`; `ul` về `gap-6 2xl:gap-8` (khoảng cách chữ y như hiện tại 24/32px).
- Màu: `--color-accent-text` #8c6733 (tính trước từ token: 4.88:1 trên kính sáng trên nền trắng, 4.83:1 trên kem, **3.01:1** trường hợp xấu nhất kính 80% trên nền đen tuyền — đạt ≥ 3:1 WCAG 1.4.11). `--color-accent-display` #a07a3f chỉ 2.31:1 trên kính/đen → KHÔNG dùng; `--color-primary-deep` càng thấp. Builder đo lại màu nền thật trong trình duyệt (computed bg của `.site-header-bar` ở đầu trang + khi đã cuộn qua ảnh tối) và ghi tỉ lệ.
- Transition `transition-colors duration-(--duration-fast)` (bao gồm border-color), `motion-reduce:transition-none` (hoặc xác nhận rule reduced-motion toàn cục ở globals.css đã tắt).
- Focus-visible giữ nguyên. Nút caret (`hover:bg-text/10` tròn) và menu con dropdown KHÔNG đổi. Menu toàn màn hình < xl KHÔNG đổi. Không đụng chỗ khác BL-074 đã bỏ gạch chân.
- Cập nhật comment dòng 37 cho khớp.

## Files
- `src/components/layout/DesktopNav.tsx`, `src/components/layout/DesktopNav.test.tsx` (test dòng ~138-142 đang khóa viên thuốc → đổi sang vạch vàng; FAIL trước / PASS sau), `.context/design-spec.md` §2.1 dòng "Mục đang xem".
- KHÔNG đụng file dirty của việc khác: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/ward-in-province.ts`, `tools/*`, `spec/changes/BACKLOG.md`, `tasks/bug-admin-province-ward-cascade/`, `template-feedback-2026-10-27.md`.

## Acceptance
- [ ] Mục đang xem (`aria-current="page"`) gạch chân 2px vàng `--color-accent-text`; hover mục khác gạch chân vàng; không còn nền viên thuốc (hover lẫn active).
- [ ] Chỉ menu ngang header; các link/nút khác, menu < xl, dropdown con không đổi.
- [ ] Tương phản vạch vàng/nền header ≥ 3:1 (đo, ghi tỉ lệ). Focus-visible giữ. Hover transition `--duration-fast`, tắt khi reduced motion.
- [ ] Không tràn, khoảng cách mục, chiều cao header giữ ở 1280/1440/1920; dropdown mở đúng.
- [ ] Ảnh trước/sau 1280 + 1920 (đầu trang, mục đang xem; thêm 1 ảnh hover; thêm 1440 sau) → `.context/review-reports/assets/bl087-{before,after}-*.png`. Dev server `http://localhost:3000` đang chạy, KHÔNG dừng.
- [ ] `pnpm typecheck` · `pnpm test` · eslint file đổi (`pnpm lint` repo-wide có lỗi sẵn của việc khác) · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause từ git 82979e4 (không spawn Explore). Chọn `--color-accent-text` vì là token vàng duy nhất ≥ 3:1 trên kính header ở mọi nền (design-spec cũ ghi "accent-text trên kính nền đen ~3:1" — tính lại 3.01:1, đạt 1.4.11 cho thành phần phi chữ).
- 2026-10-27 (builder): `DesktopNav.tsx` anchor → `border-b-2 border-transparent hover:border-accent-text aria-[current=page]:border-accent-text motion-reduce:transition-none` (utility `border-accent-text` sinh từ token `--color-accent-text`, xác nhận computed `rgb(140, 103, 51)`); bỏ `rounded-pill`/`px-*`/`bg-*`; `ul` `gap-6 2xl:gap-8`; comment cập nhật. Caret + dropdown + menu < xl không đổi. Dữ liệu nav live không có mục con (0 nút caret) nên không chụp được dropdown mở; code dropdown không đổi, test dropdown hiện có vẫn PASS.
- Đo tương phản (Edge headless có prefers-reduced-transparency = true → bar render nền đặc trắng; để đo kính thật đã ép `.site-header-bar` glass + blur qua addStyleTag, lấy pixel nền ngay cạnh vạch, 1920): scrollY 0 (đè hero) bg rgb(207,208,214) → **3.33:1**; 400 → 3.36; 800 → 4.88; 1400 → 3.75; 2200 → 4.88; 3200 → 4.83. Vạch render đúng rgb(140,103,51). Nền đặc trắng (reduced transparency) = 5.12:1 (reviewer r1 tính lại; builder ghi nhầm 4.88). Min đo được 3.33:1; worst-case lý thuyết 3.01:1 (≥ 3:1).
- Đo bố cục (trước → sau): chiều cao header 72 → 72 ở 1280/1440/1920; không h-scroll; link cao 44; khoảng cách giữa hộp link 4/8px → 24/32px (= khoảng cách chữ cũ 4+2×10 = 24, 8+2×12 = 32; chữ không đổi vị trí tương đối).

## Repro Verification
- Original repro: / (VI) ≥ xl: mục đang xem là viên thuốc nền xám; hover nền xám.
- Expected: vạch vàng 2px cho đang xem + hover; không nền.
- Actual before fix: computed border-bottom 0px; ảnh `bl087-before-{home-1280,home-1920,hover-1920}.png`; test mới FAIL (thiếu `border-b-2`).
- Actual after fix: border-bottom 2px rgb(140,103,51) ở mục đang xem và mục hover (1920); ảnh `bl087-after-{home-1280,home-1440,home-1920,hover-1920,scrolled-1920,glass-800-1920,glass-3200-1920}.png`.
- Evidence: vitest DesktopNav 8/8 PASS (trước fix 1 FAIL); số đo ở trên.
- Status: PASS (chờ review)

## Close-out (change-request)
- r1 NORMAL PASS, 3 MINOR: MINOR-1 regex test `(^|s)` → `(^|s)` (kiểm "không padding" giờ có hiệu lực) và MINOR-2 tỉ lệ nền đặc 5.12:1 — change-request sửa trước commit, vitest DesktopNav 8/8 + eslint lại PASS. MINOR-3 chữ nhích lên ~1px (border-b trong min-h-11, như trước BL-074) — chấp nhận.
- Residual: dropdown menu con chưa thấy trên dữ liệu nav thật (không mục nào có con) — code dropdown không đổi, unit test cũ PASS.
- Spec: no spec change (1.59.0); test-scope v88 (v87 archive). Doc impact: design-spec §2.1 1 dòng.
