# feature-homepage-partners-block · phase-1-task-01 — Khối Đối tác trên trang chủ (BL-107, FR-PUB-17)

- Change doc: `spec/changes/2026-11-05-homepage-partners-block-missing.md` (BACKLOG BL-107) — mục "Điều tra (2026-11-09)" + "Quyết định (user 2026-11-09)".
- Spec delta: `SPECIFICATIONS.md` § F1, gạch đầu dòng **"Đối tác (FR-PUB-17, BL-107 …)"** (ngay sau "Tin tức (khối tối)") — ĐÂY LÀ NGUỒN YÊU CẦU, làm đúng từng ý.
- Phụ thuộc: không.
- Trạng thái: `done` — STRICT PASS round 3 (`.context/review-reports/feature-homepage-partners-block-phase-1-task-01-round-3-review.md`; r1 FAIL 3 MAJOR, r2 FAIL 1 MAJOR — focus chuột làm dải nhảy); attempt 4 BỔ SUNG do user duyệt ngoài giới hạn ("Cho sửa thêm", 2026-11-09). Spec-validation phase PASS (`.context/review-reports/spec-validation-feature-homepage-partners-block-phase-1.md`).

## Điều chỉnh sau spec-validation (change-request, 2026-11-09) — THAY các ý mâu thuẫn ở mục Thiết kế/Acceptance bên dưới
Spec-validator r1 FAIL → delta sửa → r2 PASS (`.context/review-reports/spec-validation-feature-homepage-partners-block-round-2.md`). Attempt 2 làm theo delta mới:
- `/en` theo BR-07: chỉ đối tác có bản EN (`findPublicList`), KHÔNG fallback tên VI.
- Mục có `website` http(s) hợp lệ → link tab mới `rel="noopener noreferrer"`; bỏ vùng `tabIndex=0`.
- Logo grayscale + opacity 70, hover/focus về màu gốc (design-spec S01).
- Nút Dừng / Phát nhìn thấy (như hero), ẩn khi reduced-motion / khi không chạy.
- ≤ 4 đối tác → hàng tĩnh căn giữa (xuống dòng ở 390), không bản nhân đôi, không nút; tối đa 24.

Acceptance bổ sung:
- [ ] /en không hiện đối tác thiếu bản EN.
- [ ] Mục có website là link tab mới; không website → không link; mỗi đối tác được đọc 1 lần (alt/tên không đọc trùng).
- [ ] Nút Dừng/Phát dừng/chạy dải, nhãn đổi theo trạng thái; ẩn khi reduced-motion hoặc ≤ 4 đối tác.
- [ ] ≤ 4 đối tác: tĩnh, căn giữa, không tràn ngang 390.
- [ ] 5–6 đối tác ở 1440: vòng lặp liền mạch (đủ bản lặp để lấp chiều rộng, bản thừa aria-hidden + inert) — hoặc residual có lý do.

## Classification / Risk
- Type: **ADDITIVE** (QA báo bug 26, phân loại lại: khối chưa từng có giao diện).
- Risk: **MEDIUM** — trang chủ (LCP/CLS, cache ISR), view model dùng chung `src/lib/home/home-view.ts`, animation (a11y reduced-motion, focus).
- Expected review level: NORMAL (STRICT nếu chạm cache/revalidate).
- Không schema/migration (dùng `developers.showAsPartner`, `logo`, `sortOrder`, `name` có sẵn; global `homepage.partners{enabled,title}` có sẵn).

## Hiện trạng (đã chứng minh)
- `src/lib/home/home-view.ts:24` `RENDERED_BLOCKS` không có `partners`; `toBlock` (`~:355`) trả `null` cho `partners`. Comment dòng 20 nói làm ở task riêng.
- `src/globals/Homepage.ts:222` khối `partners` = `{ enabled, title }`; danh sách lấy từ `developers.showAsPartner` (`src/collections/Developers.ts:47`, có `logo` upload, `sortOrder`, `defaultSort: "sortOrder"`).
- Truy vấn dữ liệu trang chủ: `src/lib/home/home-queries.ts` (gom `HomeDocs`); render khối: `src/components/home/HomeBlocks.tsx`; i18n `src/i18n/messages/{vi,en}.json` (namespace trang chủ đang dùng).

## Thiết kế (builder quyết chi tiết, diff tối thiểu, theo mẫu các khối có sẵn)
1. Query: thêm vào `HomeDocs` danh sách developers `showAsPartner: true` (depth đủ cho `logo`, `select` chỉ trường cần, `sort: ["sortOrder","name"]`, giới hạn hợp lý vd 24), theo locale (tên EN fallback VI — xem spec). Chỉ truy vấn khi khối `partners` hiển thị được (như các khối khác nếu có cơ chế đó). Cache/revalidate: kiểm tag revalidate của trang chủ có bao gồm thay đổi `developers` không — nếu chưa, thêm tag/hook revalidate theo cơ chế sẵn có (`createRevalidate…`), ghi rõ.
2. View: `partners` vào `RENDERED_BLOCKS` + `TITLE_OPTIONAL_BLOCKS` (tiêu đề mặc định i18n); `toBlock` trả `{ kind: "partners", title, items: [{ id, name, logo: MediaImage|null }] }`, rỗng → `null` (ẩn khối). Logo dùng helper ảnh công khai sẵn có (`toPublicImage` / `renderableImage`).
3. Component mới `src/components/home/PartnersMarquee.tsx` (Server Component bọc phần cần client tối thiểu — ưu tiên **CSS-only** marquee: keyframes translateX, `animation-play-state: paused` khi `:hover`/`:focus-within`, `@media (prefers-reduced-motion: reduce)` tắt animation + cho cuộn ngang/xuống dòng). Danh sách gốc 1 lần (đọc được, focusable nếu có phần tử focus), bản nhân đôi cho vòng lặp `aria-hidden="true"` + `inert`/không phần tử focus. Logo kích thước đồng đều (vd cao 48–64px, `object-contain`), có `alt` = tên đối tác hoặc alt rỗng nếu tên hiển thị cạnh (tránh đọc trùng). Không CLS (khung kích thước cố định), ảnh lazy (khối dưới màn đầu). Dùng token màu/khoảng cách sẵn có; tiêu đề qua `SectionHeading`.
   - Dừng khi hover/focus: nếu không có phần tử focusable trong dải thì vùng dải cần `tabIndex={0}` + nhãn (`role="region"` + `aria-label`) để người dùng bàn phím dừng được — hoặc cách tương đương builder chọn và giải thích.
4. `HomeBlocks.tsx`: case `partners` render component.
5. i18n: tiêu đề mặc định "Đối tác" / "Partners" (+ nhãn vùng nếu cần) — `src/i18n/messages/*` (test `messages-check` cấm gạch dài trong chuỗi).
6. Comment cũ "partners làm ở task riêng" sửa lại.

## Files (dự kiến)
- Mới: `src/components/home/PartnersMarquee.tsx` (+ `.test.tsx`), CSS keyframes (trong component qua Tailwind arbitrary / `globals.css` nếu dự án đặt keyframes ở đó — kiểm `src/app/**/globals.css` có đang bẩn không; nếu bẩn ngoài scope → đặt keyframes trong component/CSS module).
- Sửa: `src/lib/home/home-view.ts` (+ test), `src/lib/home/home-queries.ts`, `src/components/home/HomeBlocks.tsx` (+ test), `src/i18n/messages/vi.json`, `en.json`, có thể hook revalidate `developers`.
- KHÔNG đụng: schema/migration, `src/payload-types.ts`, file bẩn ngoài scope (`src/jobs/**`, `src/lib/revalidate/internal-revalidate.ts` đang bẩn — nếu CẦN sửa file đó → DỪNG báo lại), `docs/**` (đang bẩn — ghi đề xuất doc impact vào task).

## Acceptance
- [ ] Có ≥ 1 developer `showAsPartner` + khối `partners` trong `blockOrder` & bật → trang chủ (`/`, `/en`) hiện khối Đối tác đúng vị trí thứ tự.
- [ ] Không có đối tác → khối ẩn hoàn toàn; `enabled=false` hoặc không có trong `blockOrder` → ẩn.
- [ ] Dải chạy ngang; hover/focus dừng; `prefers-reduced-motion: reduce` không chạy, vẫn xem được hết đối tác.
- [ ] Trình đọc màn hình / Tab gặp mỗi đối tác đúng 1 lần.
- [ ] Tiêu đề trống → "Đối tác" / "Partners".
- [ ] Không tràn ngang ở 390 / 768 / 1440; không CLS.
- [ ] Đổi developer (showAsPartner/logo/tên/sortOrder) → trang chủ cập nhật theo cơ chế revalidate (hoặc ghi rõ thời gian ISR nếu dựa vào đó).
- [ ] Test: view model (rỗng → null, thứ tự, EN fallback, tiêu đề mặc định), component (bản nhân đôi aria-hidden, class reduced-motion/pause), HomeBlocks render case partners.
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/lib/home src/components/home src/i18n` PASS. Nếu chạy được dev server + DB: ảnh chụp 390/1440 lưu `.context/review-reports/assets/bl107-*.png`; không chạy được → ghi residual.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
Builder attempt 2 (sau spec-validator round 1 FAIL; spec delta đã sửa). Thay đổi so với attempt 1:
- `/en` (BR-07): `loadPartners` dùng `findPublicList` (lọc `hasEnglish`, không fallback VI); bỏ `fallbackLocale`. Select thêm `website`.
- View: `PartnerItemView.website` (chỉ http(s) hợp lệ qua `isHttpUrl`, trim; khác → `null`).
- Component: mục có `website` → `<a target="_blank" rel="noopener noreferrer">` (tên truy cập = tên đối tác, logo trang trí), focus-within trên link dừng dải; bỏ vùng `tabIndex=0` + `role=region` (không điểm Tab thừa; không có link thì bàn phím dùng nút Dừng/Phát). Logo `grayscale opacity-70`, hover/focus-within mục về gốc. Danh sách gốc có `aria-label` (i18n `region`); bản nhân đôi `aria-hidden` + `inert`.
- Nút Dừng/Phát: client nhỏ nhất `PartnersMarqueeShell.tsx` (state `paused` -> `data-paused` -> `animation-play-state`), icon Pause/Play như hero, nhãn đổi theo trạng thái (i18n `page.home.partners.pause/play`), 44px, ẩn khi `motion-reduce`, nằm NGOÀI vùng `group/partners` để focus nút không tự dừng dải.
- ≤ 4 đối tác (`PARTNERS_STATIC_MAX`): hàng tĩnh căn giữa, không bản nhân đôi, không nút, không animation (Server thuần, không vào shell).
- Giữ: trần 24, hook revalidate developers, tiêu đề mặc định, ẩn khi rỗng.
Kết quả: `pnpm typecheck` PASS; eslint (src/lib/home, src/components/home, src/hooks/developers, Developers.ts) sạch; `pnpm vitest run src/lib/home src/components/home src/i18n src/hooks src/collections` 53 file PASS (test mới: website an toàn, `/en` qua findPublicList, link tab mới, không tabindex, nút Dừng/Phát, ≤ 4 tĩnh, 5 thì chạy).
Acceptance map: như attempt 1 + Tab: link duy nhất mỗi đối tác (bản nhân đôi inert) + 1 nút; 390/768/1440 + CLS: CHƯA đo (xem Residual).

## Residual risk
- Không có dev server/DB → chưa chụp 390/768/1440 (`bl107-*.png`), chưa đo CLS/tràn ngang, chưa xem vòng lặp liền mạch bằng mắt (`min-w-[100vw]` mỗi bản + padding đối xứng; mask mép; nút Dừng/Phát trên dải).
- Nút Dừng/Phát đặt hàng riêng căn phải phía trên dải (dưới tiêu đề); vị trí/độ nặng thị giác cần reviewer nhìn thực tế.
- Link đối tác nằm trong dải chạy nên mục di chuyển khi bấm bằng chuột (hover dừng dải nên ổn); màn cảm ứng dùng nút Dừng.
- Sort phụ theo `name` localized ở DB (collation) chỉ khi `sortOrder` trùng. ISR 60s là lưới an toàn nếu `revalidatePath` thất bại.

## Doc impact
Đề xuất (không sửa `docs/**` vì đang bẩn): `docs/DESIGN.md` mục trang chủ: thêm khối Đối tác (marquee CSS, dừng hover/focus, reduced-motion, query `loadPartners`, hook revalidate developers); `.context/design-spec.md` S01: mô tả khối Đối tác (khung logo 96x48, tên bên cạnh, nền `bg-bg`); `docs/ARCHITECTURE.md`/revalidate map: `developers` → làm mới `/vi`,`/en` khi là đối tác. Không đổi API/ERD/PERMISSION (no schema change).

### Builder attempt 3 (sau reviewer round 1 FAIL)
- MAJOR-1: bỏ `var()` lồng trong `@theme` (còn `40s` mặc định); `animationDuration` đặt inline trên chính phần tử dải (`PartnersMarqueeShell`). Test kiểm `style.animationDuration` (40s / 24s).
- MAJOR-2: `PartnerList` truyền `running`; `whitespace-nowrap` chỉ khi dải chạy (`motion-reduce:whitespace-normal`); tên `min-w-0 [overflow-wrap:anywhere]`; `li` `max-w-full min-w-0`, `shrink-0 motion-reduce:shrink` chỉ ở chế độ chạy; link/span `min-w-0`. Test class cho tên dài (tĩnh + chạy).
- MAJOR-3: `group-focus-within/partners:animate-none` thay cho pause (dải về vị trí 0 khi focus, link gốc luôn trong khung); hover vẫn chỉ pause. Test class.
- MINOR-5: bỏ `sortOrder` khỏi `select` (sort vẫn ở DB) + cập nhật test.
- MINOR-4 residual: đổi logo/alt ở `media` không revalidate trang chủ, chờ ISR 60s.
- Verify: `pnpm typecheck` PASS; eslint src/components/home src/lib/home PASS; vitest src/lib/home src/components/home src/i18n src/hooks src/collections PASS (53 files, 459 tests).
- Residual: chưa đo trình duyệt 390/768/1440 + CLS; sau blur focus dải chạy lại từ 0 (nhảy nhẹ), chấp nhận.

### Builder attempt 4 BỔ SUNG (user duyệt "Cho sửa thêm"; sau reviewer round 2 FAIL)
- MAJOR: `group-focus-within/partners:animate-none` -> `group-has-[:focus-visible]/partners:animate-none` (chỉ focus BÀN PHÍM reset về 0) + `group-focus-within/partners:[animation-play-state:paused]` (focus chuột chỉ pause, không nhảy; click không trượt link). Hover vẫn pause. `animate-none` đặt `animation-name:none` nên thắng pause bất kể thứ tự. Test khẳng định đúng 2 class và không còn `group-focus-within/partners:animate-none`.
- MINOR-2: `has-[:focus-visible]:[mask-image:none]` trên khung `group/partners` (tắt mờ mép khi focus bàn phím).
- MINOR-3: `onBlur` trên khung đặt `scrollLeft = 0` khi focus rời hẳn dải (`resetScrollWhenFocusLeaves`).
- Residual: chưa kiểm trình duyệt thật (click chuột giữa vòng, Tab tới link xa) và CLS/390/768/1440.
