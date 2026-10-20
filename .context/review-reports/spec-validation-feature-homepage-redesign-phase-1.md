Agent: spec-validator

# Phase Review — feature-homepage-redesign · phase 1 (BL-044) · round 1

- Mode: **Phase review** (sau khi T00–T03 PASS review), round 1
- Date: 2026-10-20
- Commits: T00 `3a5fffe` · T01 `aa5a178` · T02 `1271db9` · T03 `d01f1f7` (đối chiếu `git diff 3a5fffe~1..d01f1f7 -- src docs migrations .context/design-spec.md SPECIFICATIONS.md` + `git show --stat`)
- Sources: `spec/changes/2026-10-20-homepage-redesign.md` (1→7, acceptance, 5 quyết định) · `SPECIFICATIONS.md:19` (Khung trang/Footer), `:51–62` (F1 BL-044), `:92` (F3 Tiện ích) · `spec/updates/2026-10-20-homepage-redesign.md` (D1–D6, Q1–Q4) · pre-plan `.context/review-reports/spec-validation-feature-homepage-redesign-pre-plan.md` (G1–G9) · `tasks/feature-homepage-redesign/phase-1-task-0{0..3}.md` · review reports T00 r1–r2, T01 r1–r2, T02 r1, T03 r1–r2.
- Không sửa source/spec; chỉ ghi file report này.

## Verdict

**FAIL (GAPS FOUND)** — 0 CRITICAL · **1 MAJOR** · 8 MINOR. Toàn bộ yêu cầu 1→7, Q1–Q4, D1–D5 có code tương ứng; migration additive, versioned, đã commit; intent docs không bị hạ cấp. Lý do FAIL: **G-M1**. Khi admin để trống `about.videoLabel`, code ẩn luôn nút play. Spec và chính mô tả trong admin lại ghi là dùng chữ mặc định i18n. Tương tự, `about.eyebrow` để trống thì code ẩn eyebrow, còn spec ghi là dùng "Về chúng tôi". Cách xử lý: hoặc sửa code (1 task nhỏ), hoặc user duyệt đổi spec và mô tả admin cho khớp. Các MINOR còn lại là spec/doc lệch as-built, ghi lại để spec-publisher xử lý lúc close-out, hoặc là điểm chờ user quyết.

## Ma trận coverage

| # | Requirement | Source | Implementation (evidence) | Status | Note |
|---|---|---|---|---|---|
| 1 | Hero: chữ trái, eyebrow, 2 dòng (dòng 2 vàng), mô tả, nút + mũi tên; bộ đếm `01 / 03` + thanh tiến trình đáy trái thay chấm; mũi tên tròn; caption + nút cuộn đáy phải | change doc 1; SPEC `:54` | `HeroSlider.tsx:180–262` (eyebrow `:180`, `titleAccent` `text-primary` `:184–187`, bộ đếm `aria-hidden` `:219`, caption `:247`, nút cuộn `:249`, mũi tên `:259–262`); h1 sr-only = `title + titleAccent` `HomeBlocks.tsx:42`; schema `Homepage.ts:122,145,151` | ✅ | Lệch có lý do: nút Dừng/Phát (WCAG 2.2.2). Chờ user quyết: hero `100svh` (tỉ lệ cao hơn mockup) và vị trí bộ đếm (canh mép chữ thay vì sát mép ảnh) — xem U1/U2 |
| 2 | Ô tìm kiếm: kính lúp trong ô, nút "TÌM KIẾM →", chip 1 hàng + nút mở, hàng "Tùy chọn khác" 5 ô lọc thật | change doc 2, D2; SPEC `:55` | `HeroSearch.tsx:66–75` (submit → `amenities`), `:126–134` (5 ô: giá/diện tích/loại/nội thất/tiện ích), `:175` (CaretDown = nút mở chip, `aria-expanded`), `:224` (kính lúp trong ô), `:229–235` (hàng trong form → chạy không JS); `option-select.tsx` biến thể chip | ✅ | Q3 (không mũi tên xổ cuối hàng) đúng: chú thích `:126`. Ô đầu hiển thị tên ô thay "Tất cả", giá trị rỗng không lên URL — khớp spec |
| 2a | Q1 Tiện ích lọc thật (`amenities` mới, AND, API, ActiveFilters, RentalSpecs, seed dev) | SPEC `:92`; updates Q1 | T00 `3a5fffe`: `Rentals.ts`, `api.ts` `RENTAL_AMENITIES`, `url-params.ts`, `rental-search-sql.ts`, `endpoints/public/rentals.ts`, `FilterFields.tsx`, `ActiveFilters.tsx`, `RentalSpecs.tsx`, `scripts/seed-rental-amenities.ts`, migration `20261020_095907_rentals_amenities` | ✅ | T00 review r2 PASS (STRICT) |
| 3 | Dải 4 điểm mạnh (icon tròn + tiêu đề + mô tả), khối mới bật/tắt, không h2 | change doc 3; SPEC `:56` | `StrengthsBlock.tsx`; `blocks.ts:91–113` (items 2–6, title localized R); `home-view.ts:22` (TITLE_OPTIONAL_BLOCKS, G1), `:251–257` (< 2 mục → ẩn); `HOMEPAGE_BLOCKS` `Homepage.ts:31` | ✅ | Màu ô tròn đổi so với spec (MINOR S1) |
| 4 | Về TAMI: eyebrow, h2 + accent vàng, cụm ảnh chồng, thẻ chú thích, play YouTube, số liệu icon, nút "TÌM HIỂU THÊM →", ảnh trang trí mép phải | change doc 4, D3; SPEC `:57` | `AboutBlock.tsx:14–113`; `AboutVideoButton.tsx` (Dialog + `DialogTitle` sr-only, iframe chỉ dựng khi mở); validate YouTube ở server `Homepage.ts:80–83`; view `home-view.ts:229–248` (chỉ nhận provider youtube) | ⚠️ PARTIAL | **G-M1**: `videoLabel`/`eyebrow` trống thì code ẩn, trong khi spec ghi là dùng i18n mặc định. Cụm ảnh: spec ghi tỉ lệ 4:5 và thẻ chú thích đè ảnh lớn; as-built là ảnh vuông, thẻ nằm dưới ảnh phụ (MINOR S3) |
| 5 | Dự án nổi bật: eyebrow + mô tả, thẻ ảnh + badge + tim (trang trí) + phần trắng (tên, ghim, nút tròn), ~5 thẻ, điều khiển giữa dưới, "XEM TẤT CẢ DỰ ÁN →" | change doc 5, D1; SPEC `:58` | `FeaturedProjects.tsx:20–39`; `ProjectsSlider.tsx:56–108` (tim `aria-hidden` không state `:68–69`, ghim `:77`, nút tròn `:83`) | ✅ | Ảnh 11:10, spec ghi 4:3 (MINOR S4) |
| 6 | Banner tư vấn chữ trái | change doc 6; SPEC `:59` | `home/CtaBanner.tsx:15–16` (`align="start"`, `size="compact"`); `layout/CtaBanner.tsx` mặc định `center`/`default` (S14 + ProjectDetail không đổi — T03 r2) | ✅ | `size="compact"` (dải ~290px, nút có mũi tên) chưa có trong F1 (MINOR S2) |
| 7 | Footer nền tối: logo + mô tả + MXH; cột "Khám phá"/"Về TAMI"; VI\|EN; nút lên đầu (dùng chung toàn site) | change doc 7, Q2; SPEC `:19` | `Footer.tsx` (không còn `FooterContact`/`contact` — Grep 0 kết quả), `SocialLinks variant="circle"`, `--footer-cols`; `PublicShell.tsx` bỏ truyền contact; BackToTop nổi (BL-035) | ✅ | Lệch trang trí: hoa văn sóng nền chưa dựng (U3) |
| Q4 | `hero.eyebrow`/`caption` dùng chung cho mọi slide | updates Q4; SPEC `:55` | `Homepage.ts:121–122,151` (field ở cấp `hero`, ngoài `slides[]`) | ✅ | |
| D4 | Khối ngoài mockup tắt được, không xoá; bật lại qua admin | change doc QĐ4; SPEC `:60` | `HOMEPAGE_DEFAULT_BLOCK_ORDER` `Homepage.ts:34` dùng cho `defaultValue` `:248` **và** fallback `orderedBlocks` `home-view.ts:173–177` (G7 ✔); `HOMEPAGE_BLOCKS` giữ đủ 9 khối; `RENDERED_BLOCKS` giữ services/offers/rentals/news; mô tả tab "Thứ tự khối" `:252`; seed dev `seed/sample/homepage.ts` | ✅ | staging/prod: admin tự chỉnh `blockOrder` (không data migration) — U5 |
| D5 | Mobile 390 xếp dọc theo phong cách ảnh | change doc QĐ5; SPEC `:61` | T03 bảng so khớp + review r2 (`scrollWidth`=390, 1 h1, chạm ≥ 44px, footer accordion) | ✅ | 768/1280 chưa kiểm bằng trình duyệt (residual, T03 r2) |
| AC-layout | 1440 khớp bố cục mockup (1→7) | change doc Acceptance 1 | T03 r2 "ĐẠT"; ảnh `.context/review-reports/assets/homepage-redesign-r2-1440.png` | ✅ (kèm lệch chờ quyết) | U1–U4 |
| AC-token | Không thêm hex/kiểu mới | Acceptance 2; SPEC `:53` | Review T01–T03: chỉ dùng token có sẵn (`primary-soft`, `primary-subtle`, `dark-border`, `banner-scrim`…); `no-raw-colors.test` nằm trong `pnpm test` | ✅ | |
| AC-blocks | Chỉ khối trong ảnh, đúng thứ tự | Acceptance 3 | xem D4 | ✅ | Trên bản ghi mới / dev. Bản ghi cũ trên staging/prod → U5 |
| AC-admin-EN | Chữ/ảnh/số liệu mới sửa được trong admin, có EN | Acceptance 5 | Field localized `Homepage.ts:122,145,151,162–170,195–197`, `blocks.ts:108–109`; `translation/leaves.ts:24` thêm `strengths` vào luồng dịch | ⚠️ PARTIAL | Admin nhập được, nhưng mô tả 2 field nói sai hành vi khi để trống (G-M1) |
| AC-a11y | AA, 1 h1, test/typecheck/build PASS | Acceptance 6 | T03 r2: typecheck/lint PASS; test 304/305 (file lỗi là integration flaky do hạ tầng, chạy riêng PASS); build theo evidence của builder | ✅ (residual) | Reviewer không chạy build; integration test flaky (n2) |
| Schema | Migration additive, versioned, đã commit | SPEC `:62`; updates § Schema | `migrations/20261020_095907_rentals_amenities.ts` (T00), `migrations/20261020_103248_homepage_redesign.ts` (T01): up chỉ có CREATE TYPE/TABLE/INDEX, ADD COLUMN (nullable/default), `ALTER TYPE … ADD VALUE 'strengths'`, FK `set null`/`cascade` trên bảng mới; `migrations/index.ts` đăng ký cả hai; test `tests/integration/homepage-migration.test.ts` | ✅ | Không destructive, không cần gắn `HIGH_RISK_MIGRATION`. Hàm down tự viết có xoá hàng `strengths` khỏi `blockOrder`: chấp nhận được với rollback |
| Footer/site-settings | Không đổi schema | SPEC `:62` | Không có file `globals/Footer*`/`SiteSettings*` trong diff | ✅ | |
| Doc as-built | design-spec §2.4 + S01, ERD §4.15, DESIGN, API_SPEC | AGENTS § Doc Impact; task T03 §5 | `.context/design-spec.md:105–111` + S01 as-built; `docs/ERD.md` (`rentals.amenities`, `strengths`, `blockOrder`, ghi chú BL-044); `docs/DESIGN.md:238,278`; `docs/API_SPEC.md:113` (`amenities`) | ⚠️ PARTIAL | Bảng ERD §4.15 còn thiếu vài field (MINOR D1) |
| Intent docs | Không hạ cấp intent | AGENTS § Doc Impact | `docs/BRD.md`/PRD không có trong diff; SPECIFICATIONS chỉ đổi qua CR BL-044 (spec_version 1.34.0) | ✅ | |
| Pre-plan G1–G9 | Đã bổ sung vào spec + làm | pre-plan | G1 `home-view.ts:22` ✔ · G2 `option-select` chip ✔ · G3 icon Phosphor `icons.ts` ✔ · G4 `:57` ✔ · G5 → Q3 ✔ · G6 `:53` ✔ · G7 ✔ · G8 bộ đếm `aria-hidden`, `DialogTitle`, h1 gộp ✔ (màu icon đổi → S1) · G9 design-spec đã reconcile ✔ | ✅ | |

## Gaps

### CRITICAL
Không có.

### MAJOR
- **G-M1 [PARTIAL] — Chữ mặc định i18n cho `about.videoLabel` và `about.eyebrow` chưa làm.** Requirement: SPEC `:57` ghi "`about.videoLabel` localized, trống → i18n mặc định", "`about.eyebrow` … trống → i18n 'Về chúng tôi'"; D3 ghi nút play chỉ ẩn khi không có link. Code: `home-view.ts:234,243` trả `null` khi trống; `AboutBlock.tsx:21` chỉ hiện nút khi có cả `videoEmbedUrl && videoLabel`, nên **có link YouTube hợp lệ mà nhãn trống thì nút play bị ẩn**. Eyebrow trống cũng bị ẩn (`:89`). Trong `vi.json`, `page.home.about` chỉ có `closeVideo`, không có key chữ mặc định. Test `AboutBlock.test.tsx:95–100` còn chốt hành vi "thiếu nhãn → không có nút play". Thêm nữa, mô tả trong admin (`Homepage.ts:162` "Để trống thì dùng 'Về chúng tôi'", `:170` "Để trống thì dùng 'Khám phá TAMI HOMES'") nói sai so với hành vi thật, nên admin bị hướng dẫn sai. Task: T01 (schema/view), T02 (AboutBlock). Review T02 r1 `:22` đã chấp nhận hành vi "ẩn" mà không đối chiếu dòng spec này. **Cách xử lý (chọn 1):** (a) sửa code: thêm key i18n vi/en (`page.home.about.eyebrow`, `page.home.about.videoLabel`), fallback ở view hoặc component, sửa test; hoặc (b) user duyệt đổi spec `:57` thành "trống → ẩn" và sửa 2 mô tả admin. Spec viết trường hợp `/en` không có chữ EN dùng i18n mặc định giống ngoại lệ của `rentals`/`news` (BR-07 `:210`), nên phương án (a) là khớp intent.

### MINOR (spec/doc lệch as-built, chuyển spec-publisher hoặc doc reconcile)
- **S1 [PARTIAL-spec] Màu ô tròn icon.** SPEC `:56` (Điểm mạnh) và `:57` (số liệu Về TAMI) ghi nền `--color-primary-subtle` + icon `--color-accent-display`. As-built: `bg-primary-soft text-accent-text` (`StrengthsBlock.tsx:19`, `AboutBlock.tsx:57`), do reviewer T01 m6 chốt (ô tròn trên nền `primary-subtle` gần như không phân biệt được), và design-spec S01 đã ghi `--color-primary-soft`. Spec-publisher cập nhật `:56/:57` và `spec/updates` (dòng Điểm mạnh `:39`).
- **S2 [PARTIAL-spec] Banner tư vấn `size="compact"`.** SPEC `:59` và updates `:42` chỉ nhắc prop `align`. As-built còn có `size="compact"` (`min-h-[18rem] py-10`, nút chính có `ArrowRight`, chỉ ở trang chủ; mặc định không đổi) và khoảng cách Dự án nổi bật → banner là `pb-10` (`FeaturedProjects.tsx:25`). Cần ghi vào F1 `:59`.
- **S3 [PARTIAL-spec] Bố cục Về TAMI.** SPEC `:57`: ảnh lớn 4:5, thẻ chú thích "đè góc dưới trái ảnh lớn", không nói nền khối. As-built (`AboutBlock.tsx:19,29,37,81`): ảnh lớn vuông ~66% cột (≥ lg; 4:3 ở < lg), thẻ chú thích nằm dưới ảnh phụ ở mép trái cụm, có mảng nền be `primary-soft` sau ảnh phụ, nền khối `--color-primary-subtle`, thiếu ảnh lớn thì ẩn cả cụm (kể cả nút video). design-spec S01.2 đã ghi; spec F1 chưa cập nhật.
- **S4 [PARTIAL-spec] Tỉ lệ ảnh thẻ dự án.** SPEC `:58` và updates `:41` ghi 4:3; as-built là `aspect-[11/10]` (`ProjectsSlider.tsx:56`, design-spec S01.3 ghi 11:10). Cần cập nhật spec.
- **S5 [spec text cũ] Khung trang `:19`.** Câu trước đoạn BL-044 vẫn ghi "footer < md cột link dạng accordion (**cột Liên hệ luôn mở**)", mâu thuẫn với Q2 ngay trong cùng đoạn. F1 `:51` còn chữ "Footer liên hệ". Cần sửa câu chữ.
- **D1 [doc as-built] `docs/ERD.md` §4.15, bảng global `homepage`.** Hàng `hero` chưa có `eyebrow`, `caption`, `slides[].titleAccent`; hàng `about` thiếu `ctaLabel`, `ctaLink`; hàng `featuredProjects` thiếu `eyebrow`, `description`. Ghi chú as-built BL-044 nói các field này "nêu ở bảng trên" nhưng bảng chưa có. Cần bổ sung bảng.
- **C1 [close-out] Hồ sơ phát hành.** `spec/changes/2026-10-20-homepage-redesign.md` vẫn `status: pending` (chưa archive). `spec/updates/2026-10-20-homepage-redesign.md:3,27–30` vẫn "planned" / bảng task "pending/planned", chưa có commit/report/số đo. Mục "Số đo / verify" `:73` còn ghi "Chưa build". Spec-publisher cần cập nhật ở close-out, kèm `spec/test-scope/current.json`.
- **R1 [residual] Verify.** Reviewer chưa chạy `pnpm build` (dựa evidence của builder); 768/1280 chưa kiểm bằng trình duyệt; full suite có integration test flaky (`tests/integration/media-upload.test.ts:87`, `jobs-email.test.ts`), chạy riêng PASS. Đề xuất mở task riêng cho phần flaky.

## Lệch còn chờ user quyết (không chặn, ghi để hỏi)

| # | Lệch | Spec/mockup | As-built | Nguồn |
|---|---|---|---|---|
| U1 | Chiều cao hero | Mockup thấp hơn; SPEC `:54` chốt `100svh` (560–1080px) | `100svh` → hero cao hơn ảnh | T03 bảng so khớp dòng 1; T03 r2 |
| U2 | Vị trí bộ đếm hero | Mockup: sát mép trái ảnh | Canh theo mép chữ (khung 84rem) | T01 n1; T03 |
| U3 | Hoa văn sóng nền footer + hoạ tiết mờ nền Về TAMI | Có trong mockup | Chưa dựng (cần asset/pattern ngoài token) | T03 m5 / r2 n3 |
| U4 | Khoảng cách Về TAMI → Dự án nổi bật | Mockup ~42px; khối Về TAMI ~508px | ~128px; khối ~625px (`AboutBlock.tsx:81` `py-section` + `FeaturedProjects.tsx:25` `pt-section`) | T03 r2 n1 |
| U5 | `blockOrder` bản ghi trang chủ có sẵn trên staging/prod | D4: tắt bằng admin | Không có data migration; admin làm theo hướng dẫn 3 bước (`tasks/.../phase-1-task-03.md:40–44`, mô tả tab `Homepage.ts:252`). Chưa làm thì staging/prod vẫn hiện Dịch vụ/Ưu đãi/Cho thuê/Tin tức và **không có** Điểm mạnh | ERD ghi chú BL-044; SPEC `:60` |

## Kết luận cho dispatcher
- G-M1: cần user chọn (a) sửa code, tạo task `phase-1-task-04` nhỏ (i18n fallback + test + sửa mô tả admin), hoặc (b) đổi spec qua CR. Sau đó chạy lại phase review round 2.
- S1–S5, D1, C1: giao spec-publisher/doc reconcile ở close-out (không cần builder, trừ D1 là doc as-built).
- U1–U5: hỏi user ở checkpoint cuối phase.
