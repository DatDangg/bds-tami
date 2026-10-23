# feature-ui-polish-sticky-underline-flags · phase-1-task-01 — Thanh mục con < lg không đè thẻ "Nhận thông tin dự án"

- Change doc: `spec/changes/2026-10-23-ui-polish-sticky-underline-flags.md` (BACKLOG BL-074, mục 1)
- Spec: SPECIFICATIONS.md Overview (bullet as-built BL-074) · design-spec S03 khối 3 + khối 11, §2.1 "Sticky"
- Auto proceed: user "tự làm tự quyết đừng hỏi t" — không checkpoint; quyết định ghi ở Decision log.

## Root cause (change-request đã tái hiện, dev :3000, `/du-an/astor-1`, 390×844)
- `DetailSubNav` (`src/components/detail/DetailSubNav.tsx:91`) là `nav sticky top-(--sticky-top)` đặt làm **con trực tiếp của gốc `[data-detail-page]`** (`src/components/detail/DetailLayout.tsx:74`), cùng cấp với lưới và `after`.
  → khối chứa (containing block) của sticky = **cả trang chi tiết** (lưới + `after`), nên thanh dính suốt tới cuối trang.
- ≥ lg `aside` nằm cột phải và tự dính **dưới** thanh (`--sticky-top + 4.5rem`) → không đè. Nhưng **< lg** `aside` (`DetailAsideFit pt-6`, `DetailLayout.tsx:89`) xếp **sau cột trái**; khi cuộn tới thẻ form, thanh vẫn dính ở `top 8px → bottom 62px` nên thẻ trượt **dưới** thanh: mép thẻ chạm sát đáy thanh (đo: thẻ `#lead-form` top 66px ↔ thanh bottom 62px, rồi bị đè khi cuộn tiếp) — đúng ảnh user. Hai khối cùng nền trắng + viền + `shadow-md` nên nhìn như dính liền.
- Thanh mục con < lg không có mục nào trỏ tới form (form không phải tab) → dính đè lên vùng form là vô ích và che ô nhập.
- Dùng chung: `DetailPageShell` → Dự án (`ProjectDetail`), Cho thuê (`RentalDetail`), Tin BĐS (`PostDetail`) — cả 3 cùng lỗi. Dịch vụ / Tuyển dụng dùng `DetailLayout` không `subNav` → không ảnh hưởng.

## Hướng sửa (quyết định change-request)
Giới hạn vùng dính của thanh **< lg = hết cột trái** bằng cấu trúc DOM/CSS (không JS, chạy cả khi chưa hydrate):
1. Trong `DetailLayout`, khi có `subNav`: đưa `DetailSubNav` vào **trong** lưới, bọc `[nav, (leading), cột chính]` bằng một `div` `lg:contents`.
   - < lg: wrapper là block chứa thanh + cột trái → thanh hết dính khi tới đáy cột trái; `aside` (`pt-6` = 24px, token spacing) bắt đầu SAU đó → thanh không bao giờ chạm/đè thẻ form.
   - ≥ lg: wrapper `contents` → thanh là grid item `lg:col-span-2` hàng đầu; cột chính + `aside` hàng 2 như cũ. Khối chứa sticky = lưới → thanh thôi dính ở cuối lưới cùng lúc với thẻ phụ (trước đây dính tiếp trên `after` — dải "… tương tự"/Điểm mạnh/banner, nơi scroll-spy đã không còn mục active). Chấp nhận thay đổi nhỏ này ở ≥ lg, ghi spec.
2. Giữ **đúng vị trí/khoảng cách thị giác hiện tại**: thanh trong lưới không còn cần `mx-auto max-w-container px-gutter` riêng (lưới đã có cùng khung) → mép thanh vẫn thẳng mép thẻ (BL-028). Khoảng cách: trước đây thanh nằm trên lưới, lưới `py-4 lg:py-8` tạo khe thanh→nội dung 16/32px. Sau khi đưa vào: lưới bỏ padding trên khi có subNav, thanh `mb-4 lg:mb-8` (hoặc tương đương token) → khe trên/dưới thanh như cũ (đo trước/sau ở 390 và 1440, chênh 0px).
3. `DetailSubNav` vẫn dùng chung, giữ `pointer-events` pattern, `print:hidden`, `z-(--z-sticky)`, scroll-spy (`OBSERVER_TOP_PX` không đổi vì thanh vẫn `top var(--sticky-top)` cao ~54px). Được thêm prop className/biến thể nếu cần cho khung mới — giữ đơn giản.
4. Đích cuộn `#lead-form` < lg: thanh không còn đè thẻ → `DetailContactAside` `SCROLL_MT_CLASS` đổi thành `scroll-mt-[calc(var(--sticky-top)+1rem)] lg:scroll-mt-[calc(var(--sticky-top)+4.5rem)]` (< lg thẻ đứng gọn đầu màn, thanh đã trôi khỏi màn hẳn; ≥ lg như cũ). Kiểm cả nút thanh CTA dính đáy + banner tư vấn (`#lead-form`).
5. Không đổi `DETAIL_ASIDE_CARD_CLASS`/`DETAIL_ASIDE_STICKY_CLASS` (Dịch vụ/Tuyển dụng không có subNav).

## Classification / Risk
- Type: **MODIFY** (UI layout, sửa lỗi chồng lớp). Không đổi API / schema / i18n / migration.
- Risk: **MEDIUM-HIGH** — component dùng chung 3 trang chi tiết (`DetailLayout`, `DetailSubNav`, `DetailContactAside`) + sticky + scroll-spy + anchor. Reviewer: **STRICT** (shared component).
- Blast radius: `/du-an/<slug>`, `/cho-thue/<slug>` (cả tin đã thuê + `belowSpecBar`), `/tin-bds/<slug>` (vi + en); `DetailLayout` không subNav (Dịch vụ, Tuyển dụng) phải giữ nguyên DOM/class.
- Doc impact: design-spec S03 khối 3 / khối 11 + §2.1 Sticky; SPECIFICATIONS Overview bullet BL-074 (change-request ghi).

## Acceptance
- [ ] 390 / 768 / 1023: khi cuộn tới thẻ "Nhận thông tin dự án" (Dự án), thẻ liên hệ (Cho thuê, Tin BĐS): thanh mục con **không chạm/đè** thẻ — đo bằng `getBoundingClientRect` ở nhiều mức cuộn (thẻ top ≥ thanh bottom + 16px mọi lúc thanh còn trên màn); trạng thái chưa dính cũng có khe.
- [ ] Bấm thanh CTA dính đáy / nút banner tư vấn → thẻ form hiện đầu màn, không bị che.
- [ ] Trong cột trái (< lg và ≥ lg) thanh vẫn dính `top var(--sticky-top)`, scroll-spy + bấm mục cuộn tới khối như cũ, mục đang xem tự cuộn vào giữa < lg.
- [ ] ≥ lg (1024, 1440): mép thanh thẳng mép thẻ trắng trái + mép thẻ phụ phải (BL-028); khe trên/dưới thanh như trước (±0–2px); thẻ phụ dính dưới thanh như cũ.
- [ ] Dịch vụ + Tuyển dụng (DetailLayout không subNav, có `leading`?) DOM/class giữ nguyên.
- [ ] Test cập nhật: `DetailLayout.test.tsx` (thứ tự DOM mới, wrapper `lg:contents`, không subNav giữ cũ), `DetailPageShell.test.tsx`, `DetailContactAside`/`DetailBlocks` nếu kiểm scroll-mt; `project-detail.test.tsx` nếu kiểm cấu trúc.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md` (change-request reconcile), file dirty không thuộc change (`.claude/**`, `tools/**`, `docs/content-intake/**`, `template-feedback*`). Không đụng phần underline/cờ (task 02/03).
- KHÔNG commit (primary commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`)
- Dev server đang chạy ở http://localhost:3000 (không cần start lại; HMR). Đo bằng trình duyệt ở 390/768/1024/1440: `/du-an/astor-1`, một `/cho-thue/<slug>`, một `/tin-bds/<slug>`.
- Report: `.context/review-reports/feature-ui-polish-sticky-underline-flags-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Chọn sửa cấu trúc (giới hạn khối chứa sticky) thay vì JS ẩn thanh khi tới `aside`: deterministic, chạy không JS, không nháy; chi phí: ≥ lg thanh thôi dính ở cuối lưới (trên `after`) — chấp nhận, ghi spec.
- (change-request) < lg `#lead-form` scroll-mt = `--sticky-top + 1rem` vì thanh không còn phủ lên thẻ.
- (builder) `DetailSubNav` nhận prop `frameClassName` (mặc định = khung cũ `mx-auto w-full max-w-container px-gutter`, nên dùng đứng riêng/test cũ không đổi). Trong `DetailLayout` có `subNav`: lưới `pb-4 lg:pb-8` (bỏ padding trên), khối `div.lg:contents` bọc [nav (`mb-4 lg:col-span-2 lg:mb-8`), leading, cột chính], `aside` ngoài khối. Không `subNav`: DOM/class giữ nguyên (lưới vẫn `py-4 lg:py-8`).
- (builder) `DetailContactAside.SCROLL_MT_CLASS` = `scroll-mt-[calc(var(--sticky-top)+1rem)] lg:scroll-mt-[calc(var(--sticky-top)+4.5rem)]`. Tests cũ sửa vì thanh/cột chính không còn là con trực tiếp của gốc/lưới (project-detail, rental-detail, DetailLayout).

## Verification summary (builder)
Acceptance: PASS toàn bộ (đo dev :3000, Chromium).
- < lg (390 `/du-an/astor-1`, `/cho-thue/…xuan-dieu…`, `/tin-bds/chinh-chu-ban-nha-lien-ke…`; 768 dự án): thẻ top − thanh bottom ≥ 40px mọi mức cuộn (trước fix: âm tới −562, thẻ trượt dưới thanh). Thanh dính 8→62 tới hết cột trái rồi trôi đi cùng cột (t=6 ở bước ngay trước aside, rồi âm).
- Khe/mép trước → sau (page px): 390 dự án thanh 784–838, l16 r374, khe thanh→nội dung 16 → 16, card 7179 → 7179; 768 thanh 798–852, l23 r730, khe 16 → 16; 1440 dự án/cho thuê/tin ul l105 r1321 (= mép cột trái 105 và mép aside 1321), khe 32 → 32, thanh top 741/741/801 không đổi; 390 cho thuê/tin khe 16 → 16, vị trí giống hệt.
- ≥ lg (1440, 1024): thanh dính top 16, thẻ phụ dính dưới thanh khe tối thiểu 18px (như cũ); 1024: ul l27 r982 thẳng mép cột/aside, khe 32.
- Bấm mục thanh (390 cho thuê, 1440 tin): `aria-current="location"` đúng mục, khối đích ở top = thanh bottom + 18; `#lead-form` < lg đặt top 24px (8 + 16), thanh đã ra khỏi màn, không bị che (cho thuê + tin; dự án dùng cùng `DetailContactAside`).
- Verify: `pnpm lint` PASS (0 warning) · `pnpm typecheck` PASS · `pnpm test` 436 files / 4591 tests PASS.
- Residual risk: ≥ lg thanh là grid item hàng 1 (`lg:col-span-2`); Chromium cho dính suốt lưới (đã đo), Firefox/Safari chưa kiểm — nếu coi vùng dính = grid area (chỉ hàng 1) thanh sẽ không dính ≥ lg. Reviewer/QA nên soi thêm trên Firefox/Safari.
