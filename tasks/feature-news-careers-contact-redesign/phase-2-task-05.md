# feature-news-careers-contact-redesign · phase-2-task-05 — Liên hệ `/lien-he` theo design + văn phòng / giờ làm việc + backfill

- Nguồn: BL-054 Quyết định 4, 5, 6; design `docs/specs/listing-detail-redesign/lien-he.webp`. Spec 1.47.0 khối BL-054 mục "Liên hệ", "Văn phòng + giờ làm việc".
- Plan: phase 2 wave A (song song P2-T01, P2-T03).
- Phụ thuộc: P1-T01 (`offices`, `workingHours`).

## Classification / Risk
- Type: **MODIFY** (+ script backfill dev). Risk: **MEDIUM–HIGH** — form lead `source=contact` (giữ nguyên), dữ liệu site-settings (fallback không mất dữ liệu), script ghi global. Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/lien-he/page.tsx`, `src/components/contact/*` (`ContactDetails` → `ContactCards`, `OfficeSystem` (client: tab + bản đồ), `JoinTeamBanner`), `src/lib/content/contact-view.ts` (+ offices / workingHours / fallback), bản đồ nhúng hiện có, `scripts/backfill-offices.ts` (mới) + `package.json` script `backfill:offices`, i18n namespace `page.contact.v2`, `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Liên hệ), `docs/DESIGN.md`, `docs/reports/` (báo cáo backfill).

## Files to Create/Modify
- `src/app/(frontend)/[locale]/lien-he/page.tsx`
- `src/components/contact/ContactDetails.tsx`
- `src/components/contact/ContactCards.tsx`
- `src/components/contact/OfficeSystem.tsx`
- `src/components/contact/JoinTeamBanner.tsx`
- `src/lib/content/contact-view.ts`
- `scripts/backfill-offices.ts`
- `package.json`

## Scope (theo spec — xem ảnh design)
1. Hero ảnh (`pageHeroes.contact` + ảnh banner sẵn có): breadcrumb, eyebrow, `h1` 2 dòng, mô tả.
2. 4 thẻ nổi đè mép dưới hero: Hotline ("Gọi ngay" `tel:`), Email ("Gửi email" `mailto:`), Zalo OA (giá trị = `siteName`, "Nhắn tin" `zaloUrl`, tab mới `rel="noopener noreferrer"`), Giờ làm việc (`workingHours.hours` + `days`); thiếu dữ liệu → ẩn thẻ, lưới co theo số thẻ. Click Hotline / Zalo vẫn ghi `click-events` nếu nút liên hệ hiện đang ghi (tái dùng cơ chế sẵn có).
3. Trái: form "Bạn cần TAMI hỗ trợ điều gì?" (eyebrow "Gửi yêu cầu") — LeadForm `source=contact` hiện có (Họ tên, SĐT, Email, Nội dung, consent, "Gửi yêu cầu"); **không** chip loại yêu cầu; style theo design (icon trong ô nếu LeadForm có biến thể — không đổi trường / payload).
4. Phải: "Hệ thống văn phòng" + mô tả; tab chi nhánh (ẩn khi 1 văn phòng; ARIA tabs hoặc nút `aria-pressed`, bàn phím); bản đồ của văn phòng đang chọn (cách nhúng bản đồ hiện có của trang Liên hệ, lazy; không toạ độ → bản đồ theo địa chỉ hoặc ẩn); thẻ văn phòng (ảnh, tên, địa chỉ, điện thoại `tel:`, email `mailto:`, nút "Chỉ đường" → Google Maps theo toạ độ / địa chỉ, tab mới). View model: `offices` (`/en` bỏ hàng thiếu `name`/`address` EN) → rỗng thì **fallback 1 văn phòng từ `address` / `mapLocation` / `hotline` / `email`** (tên = tên công ty / chuỗi i18n "Văn phòng TAMI HOMES").
5. Banner "Gia nhập TAMI HOMES" (eyebrow, tiêu đề, mô tả i18n, nút "Xem vị trí đang tuyển" → `/tuyen-dung` theo locale, ảnh nền có sẵn trong media / ảnh hero tuyển dụng). Không banner tư vấn (giữ BL-045).
6. Script `pnpm backfill:offices` (mẫu `backfill:listing-fields`): mặc định dry-run, `--apply` ghi; chỉ khi `offices` trống; tạo 1 văn phòng VI (+ EN nếu `address` EN có) từ trường cũ; báo cáo `docs/reports/backfill-offices-<ngày-giờ>-<mode>.md`; idempotent; chỉ chạy DB dev (cảnh báo khi DATABASE_URL không phải local). Builder chạy dry-run + apply trên **DB worktree**; primary chạy trên DB dev.
7. Responsive 375 / 768 / 1280 / 1440 (thẻ nổi 2×2 tablet, 1 cột mobile).
8. Test: contact-view (fallback, EN lọc, workingHours rỗng ẩn), component (tab ẩn khi 1, chuyển tab đổi bản đồ / thẻ, link đúng), script (dry-run không ghi, apply idempotent); regression LeadForm; chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t05-*`.

## Acceptance
- [ ] Bố cục khớp `lien-he.webp` ở desktop; mobile hợp lý.
- [ ] Không có `offices` → vẫn hiện 1 văn phòng từ dữ liệu cũ; giờ làm việc trống → ẩn thẻ.
- [ ] Form lead liên hệ hoạt động như cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
- **i18n namespace `page.contact.v2`** (thêm cuối `page.contact`). Xoá 11 khoá cũ của `page.contact` không còn dùng sau redesign (`infoTitle`, `hotline`, `email`, `address`, `hours`, `hoursValue`, `mapLabel`, `formTitle`, `officeEyebrow`, `officeTitle`, `officeTitleAccent`) — grep toàn repo không còn chỗ dùng; giữ `title` / `description` (metadata + hero mặc định).
- **Không chip loại yêu cầu** (Quyết định 6). Form = `LeadForm` thêm layout **`contact`** (nhãn hiển thị + icon trong ô, Họ tên / SĐT một hàng ≥ sm, nút có mũi tên) + prop `submitLabel` ("Gửi yêu cầu"). Trường / payload / validate không đổi (test regression khoá đúng tập khoá body). Không thêm placeholder ví dụ ("Nguyễn Văn A"…) của design: sẽ cần khoá mới ở namespace `form.lead` (ngoài namespace task) và FormField quy định không dùng placeholder thay nhãn.
- **`LeadFormSlot`** thêm prop `eyebrow` (tuỳ chọn) cho "Gửi yêu cầu"; `id="lead-form"` giữ.
- **`LazyMap`** thêm prop `showGoogleMapsLink` (mặc định `true`, nơi khác không đổi); trang Liên hệ tắt vì thẻ văn phòng đã có "Chỉ đường".
- **Click-events:** trang Liên hệ cũ KHÔNG ghi `click-events` ở link hotline/email (chỉ nút nổi `FloatingContact` ở layout ghi, vẫn giữ nguyên) → thẻ Hotline / Zalo cũng không ghi (giữ hành vi, tránh đổi ý nghĩa thống kê `click-stats-daily`).
- **Thẻ Zalo OA** chỉ hiện khi có cả `zaloUrl` (http(s), qua `buildFloatingContact`) và `siteName`. **Giờ làm việc:** ẩn khi `hours` và `days` đều trống; chỉ có `days` → `days` lên dòng chính.
- **Văn phòng:** hàng `offices` cần đủ `name` + `address` ở ngôn ngữ đang xem; không còn hàng → 1 văn phòng dự phòng (`id office-main`) từ `address` / `mapLocation` / `hotline` / `email`, tên i18n `fallbackOfficeName` = "Văn phòng {siteName}" / "{siteName} office" (siteName từ `loadSiteIdentity`). Không có cả 4 trường cũ → ẩn khối văn phòng, form chiếm 1 cột. Văn phòng không toạ độ → không bản đồ (không geocode theo địa chỉ — không có dịch vụ geocode; "Chỉ đường" vẫn theo địa chỉ). Bản đồ 16:9, một `LazyMap` dùng lại khi đổi tab (effect theo toạ độ). Ảnh văn phòng chỉ giữ `url/alt/width/sizes` (props client serialize vào HTML).
- **Tab chi nhánh:** mẫu ARIA tabs (←/→ vòng, Home/End, roving tabindex), một `tabpanel` chung; ẩn tablist + mô tả "Lựa chọn chi nhánh…" khi 1 văn phòng.
- **Banner "Gia nhập TAMI HOMES"** (`JoinTeamBanner`): thẻ tối bo 20px trong container, ảnh = `resolvePageBanner(settings, "careers")` (ảnh hero Tuyển dụng → ảnh mặc định), không ảnh → nền `dark-deep`. Không tái dùng `CtaBanner` (full-bleed, chữ giữa) vì design là thẻ inset nút bên phải.
- **Hero:** `PageHero` cỡ `short` + `overlap` khi có thẻ (thẻ kéo lên `-mt-16 md:-mt-[88px]`); `ListingHero` ép `overlap={false}` nên dùng thẳng `PageHero` (component nền của `ListingHero`).
- **`load-home.ts`**: trang chủ trước dùng `buildContactPageView` chỉ để lấy `contact` + `socials` cho JSON-LD → đổi sang gọi thẳng `buildContact` / `buildSocialLinks` (cùng kết quả), vì `buildContactPageView` nay cần tên văn phòng dự phòng.
- **Backfill:** logic thuần + chạy ở `src/lib/backfill/offices.ts`, script `scripts/backfill-offices.ts` dùng lại guard `checkBackfillEnvironment` (từ chối DB không phải dev cục bộ, chặn staging/prod) và `writeBackfillReport` (thêm tham số `prefix`, mặc định giữ `backfill-listing-fields`). Tạo văn phòng chỉ khi `offices` VI trống **và** có `address` VI (`name` + `address` bắt buộc trong hàng); EN ghi cùng hàng (`id`) khi `address` EN có; context job dịch → không xếp dịch tự động. `.gitignore` thêm `docs/reports/backfill-offices-*-dry-run*.md`.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs`) · `pnpm i18n:check` PASS · `pnpm build` PASS.
- `pnpm test` (DATABASE_URL_TEST = DB worktree): **unit + ui PASS 336 file / 3193 test** (`vitest run --project unit --project ui --testTimeout=20000`). Ở lượt `pnpm test` đầy đủ có 3 test unit/ui chỉ **timeout 5s do máy quá tải** (`Header.test` bẫy focus, `HeroSearch.test`, `runtime-dependencies.test`; không đụng code task) — chạy riêng PASS. **Integration: BLOCKED do hạ tầng** — container dùng chung `tami-postgres` (cổng 5433, mọi worktree) **sập và vào crash recovery 2 lần** giữa lượt chạy (`the database system is in recovery mode`, fsync > 1000 s; lần 2 lúc ~04:26 UTC vẫn đang recovery khi kết thúc) → 34–38 file integration fail vì hook timeout / mất kết nối. Task không đổi schema / endpoint / hook; không có integration test riêng cho phần này. **Primary chạy lại `pnpm test` khi Postgres ổn định.**
- Test mới / sửa: `src/lib/content/contact-view.test.ts` (fallback văn phòng, `/en` lọc hàng thiếu EN, toạ độ sai, workingHours rỗng ẩn, Zalo chỉ http(s), chỉ đường toạ độ / địa chỉ), `src/components/contact/OfficeSystem.test.tsx` (1 văn phòng không tablist; đổi tab đổi thẻ + bản đồ; văn phòng không toạ độ không bản đồ; bàn phím ←/→/Home/End; link tel / mailto / Chỉ đường tab mới), `src/app/(frontend)/[locale]/lien-he/page.test.tsx` (4 thẻ / ẩn thẻ, form `source=contact` "Gửi yêu cầu", không banner tư vấn, ≥ 2 văn phòng có tab, DB lỗi vẫn dựng, `/en` không chữ Việt + `/en/careers`, JSON-LD), `src/components/leads/LeadForm.test.tsx` (+ layout `contact`: nhãn + icon, cùng tập khoá payload), `src/lib/backfill/offices.test.ts` (dry-run không ghi; `--apply` ghi VI rồi EN cùng hàng, context không xếp dịch; chạy lại bỏ qua; EN lỗi không ném; tên báo cáo).
- **Backfill trên DB worktree `tami_wt54_p2t05`** (builder điền trước trường cũ VI/EN vì DB worktree trống): dry-run → `fill` (không ghi); `--apply` → VI + EN đã ghi, lỗi 0 (đọc lại DB: 1 hàng `offices` cùng id ở cả 2 locale, trường cũ giữ nguyên); `--apply` lần 2 → `skip-has-offices` (idempotent). Guard dev-only dùng `checkBackfillEnvironment`.
- **Trình duyệt** (dev server cổng 3125, Edge headless qua CDP, full page; `scrollWidth == innerWidth` mọi ảnh → **không tràn ngang**): `.context/review-reports/assets/bl054-p2t05-{vi,en}-1office-{1440,390}.png`, `bl054-p2t05-{vi,en}-3offices-{1440,390}.png`, `bl054-p2t05-vi-3offices-768.png`. Bản đồ trong ảnh headless là ô xám (headless không WebGL); trên Browser pane thật đã kiểm: bản đồ dựng `canvas`, tải tile OSM, bấm tab "Văn phòng Bắc Ninh" → bản đồ + thẻ đổi đúng văn phòng.

## Review

## Doc impact
- `.context/design-spec.md` S15: thêm khối **As-built BL-054** (bố cục thẻ nổi / form layout `contact` / Hệ thống văn phòng / banner Gia nhập, quy tắc ẩn thẻ, fallback văn phòng, i18n `page.contact.v2`).
- `docs/DESIGN.md` bảng màn hình, hàng "Liên hệ": As-built BL-054 (BL-045 chuyển thành "Trước BL-054").
- `docs/reports/`: báo cáo backfill chạy trên **DB worktree** `tami_wt54_p2t05` (dữ liệu trường cũ do builder tự điền để thử): `backfill-offices-2026-10-22-1025-apply.md` (tạo 1 văn phòng VI + EN), `backfill-offices-2026-10-22-1025-apply-2.md` (chạy lại → bỏ qua, idempotent); 2 bản dry-run bị gitignore. **Primary chạy lại trên DB dev `tami`** để có báo cáo thật; 2 báo cáo worktree chỉ là bằng chứng, primary quyết có commit hay không.
- `docs/API_SPEC.md` / `docs/ERD.md`: no doc impact (không đổi endpoint / schema; `offices` / `workingHours` đã ghi ở P1-T01).
- `SPECIFICATIONS.md` (intent): không sửa.
