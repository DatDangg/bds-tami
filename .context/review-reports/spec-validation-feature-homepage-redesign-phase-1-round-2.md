Agent: spec-validator

# Phase Review — feature-homepage-redesign · phase 1 (BL-044) · round 2

- Mode: **Phase review**, round 2 (re-check sau T04)
- Date: 2026-10-20
- Round 1: `.context/review-reports/spec-validation-feature-homepage-redesign-phase-1.md` (FAIL vì G-M1 MAJOR)
- Delta kiểm: `git diff d01f1f7..5e8645b` (T04 `5e8645b`). File: `src/components/home/AboutBlock.tsx` (+ test), `src/components/home/FeaturedProjects.tsx`, `src/i18n/messages/{vi,en}.json`, `docs/ERD.md`, task `tasks/feature-homepage-redesign/phase-1-task-04.md`, review `.context/review-reports/feature-homepage-redesign-phase-1-task-04-round-1-review.md` (PASS, NORMAL, 3 MINOR).
- Không sửa source/spec. Chỉ ghi file report này.

## Verdict

**PASS (COMPLETE)**: 0 CRITICAL, 0 MAJOR. G-M1 và D1 đã đóng, có evidence code/doc ở dưới. Diff T04 không tạo gap mới so với spec. Còn 2 MINOR mới (không chặn): test name cũ và spacing chưa ghi vào spec/design-spec. Các mục S1–S5 và C1 vẫn mở. Theo phân công, chúng thuộc spec-publisher lúc close-out, nên không tính là chặn.

## Xác minh các gap của round 1

| Gap R1 | Requirement | Source | Evidence sau T04 | Status |
|---|---|---|---|---|
| **G-M1a**: `about.videoLabel` trống phải dùng i18n mặc định; nút play chỉ phụ thuộc link | SPEC F1 "Về TAMI" `SPECIFICATIONS.md:57` ("`about.videoLabel` localized, trống → i18n mặc định"; "chỉ hiện khi `about.videoUrl` … hợp lệ"); D3 | `AboutBlock.tsx` (ImageCluster): điều kiện đổi từ `videoEmbedUrl && videoLabel` thành `videoEmbedUrl`; `label={videoLabel ?? t("defaultVideoLabel")}` nên `DialogTitle` sr-only cũng nhận nhãn mặc định. `vi.json` `page.home.about.defaultVideoLabel` = "Khám phá TAMI HOMES", `en.json` = "Discover TAMI HOMES". Chuỗi rỗng/toàn khoảng trắng về `null` ở `home-view.ts:243` (`text(...) \|\| null`), sau đó mới qua `??`. Test `AboutBlock.test.tsx`: "có link video, nhãn trống → nút play dùng nhãn mặc định đúng ngôn ngữ (vi và /en)" và "không có link video → không có nút play" | ✅ Đóng |
| **G-M1b**: `about.eyebrow` trống → "Về chúng tôi" | SPEC `:57` ("`about.eyebrow` … trống → i18n 'Về chúng tôi'") | `AboutBlock.tsx`: eyebrow luôn render, nội dung `block.eyebrow ?? tAbout("defaultEyebrow")`. vi "Về chúng tôi", en "About us". Test kiểm cả vi, en và trường hợp có giá trị admin | ✅ Đóng |
| **G-M1c**: mô tả admin khớp hành vi | `Homepage.ts:162,170` | `:162` 'Để trống thì dùng "Về chúng tôi".' và `:170` 'Để trống thì dùng "Khám phá TAMI HOMES".' nay đúng hành vi. `:169` (`videoUrl` "Để trống thì ẩn nút") cũng đúng | ✅ Đóng |
| **D1**: ERD §4.15 thiếu field | AGENTS § Doc Impact (as-built) | `docs/ERD.md` §4.15: hàng `hero` có `slides[].titleAccent`, `eyebrow`, `caption`; hàng `about` có `ctaLabel`, `ctaLink` và ghi chú mặc định i18n; hàng `featuredProjects` có `eyebrow`, `description`; thêm ghi chú as-built trỏ migration `20261020_103248_homepage_redesign` | ✅ Đóng |
| **U4**: khoảng Về TAMI → Dự án | T03 r2 n1 / T04 scope 2 | `AboutBlock` `pt-section pb-6` + `data-block="about"`; `FeaturedProjects` `[[data-block=about]+&]:pt-4` (chỉ áp khi đứng liền sau Về TAMI; có khối khác chen giữa thì vẫn `pt-section`). Đo ở 1440 ≈ 40px, mockup ~42px (`assets/homepage-redesign-t04-1440.png`) | ✅ Đã xử lý trong code (lệch nhỏ còn lại: n2 của reviewer T04) |

## Kiểm gap mới trong diff T04

| Hạng mục | Kết quả |
|---|---|
| Ngôn ngữ `/en` thiếu chữ EN | Eyebrow giờ hiện "About us" thay vì ẩn. Đúng spec `:57` (i18n mặc định), và không lấy chữ tiếng Việt (BR-07). Các field không có mặc định (titleAccent, imageCaption, cta) vẫn ẩn như trước, theo test "thiếu chữ … ẩn accent/chú thích/nút" |
| Token / hex | Không có hex mới. `pb-6`/`pt-4` là scale Tailwind, `pt-section` là token sẵn có |
| 1 h1 / a11y | Không đổi heading. Nút play vẫn dùng `AboutVideoButton` cũ (≥ 44px) |
| Schema / migration / API | Không đổi |
| Intent docs | Không đổi (diff chỉ chạm `docs/ERD.md` as-built) |
| Verify | Reviewer T04: `pnpm typecheck` PASS, `pnpm lint` 0 error, `pnpm test` 305/3205 PASS. Build: builder báo PASS, reviewer không chạy (residual R1) |

## Gaps

### CRITICAL / MAJOR
Không có.

### MINOR mới (không chặn)
- **N1 [test name]** `src/lib/home/home-view.test.ts:322`: tên test vẫn ghi "nút chỉ khi có nhãn + link", không còn đúng với hành vi mới (trùng n1 của reviewer T04). Sửa tên ở lần chạm file kế tiếp.
- **N2 [spec/design-spec as-built]** Quy tắc spacing mới (Về TAMI `pt-section pb-6`; Dự án nổi bật thu `pt-4` khi liền sau Về TAMI) chưa có trong `SPECIFICATIONS.md:57–58` hoặc `.context/design-spec.md` S01 (Grep không thấy `pb-6`/`data-block`). Spec-publisher ghi bổ sung cùng S3. Reviewer T04 còn n2 (từ mép nền kem tới eyebrow ~23px, mockup ~44px) và n3 (chưa có assertion class) là tuỳ chọn.

### MINOR còn mở từ R1 (spec-publisher xử lý ở close-out, không chặn)

| # | Vị trí cần sửa | Nội dung |
|---|---|---|
| S1 | `SPECIFICATIONS.md:56` (Điểm mạnh: "nền `--color-primary-subtle`, icon màu `--color-accent-display`"), `:57` (số liệu: "màu `--color-accent-display` trong ô tròn `--color-primary-subtle`"), `spec/updates/2026-10-20-homepage-redesign.md:39` | Đổi thành ô tròn `--color-primary-soft` + icon `--color-accent-text`. As-built: `StrengthsBlock.tsx:19`, `AboutBlock.tsx` StatsList |
| S2 | `SPECIFICATIONS.md:59` (Banner tư vấn), `spec/updates/...:42` | Thêm `size="compact"` (`min-h-[18rem] py-10`, nút chính có `ArrowRight`, chỉ dùng ở trang chủ; mặc định không đổi) và `FeaturedProjects` `pb-10` |
| S3 | `SPECIFICATIONS.md:57` ("ảnh lớn … bo 20px, 4:5", "thẻ chú thích … đè góc dưới trái ảnh lớn") | As-built: ảnh lớn vuông ~66% cột ≥ lg (4:3 < lg); thẻ chú thích nằm dưới ảnh phụ ở mép trái cụm; mảng be `primary-soft` sau ảnh phụ; nền khối `--color-primary-subtle`; thiếu ảnh lớn thì ẩn cả cụm, kể cả nút video. Gộp N2 vào đây |
| S4 | `SPECIFICATIONS.md:58` ("ảnh 4:3 phía trên"), `spec/updates/...:29` và `:41` | Đổi thành 11:10 (`ProjectsSlider.tsx:56`) |
| S5 | `SPECIFICATIONS.md:19` (câu "footer < md cột link dạng accordion (**cột Liên hệ luôn mở**)", vẫn còn, Grep 1 kết quả) và `:51` ("…, Footer liên hệ.") | Mâu thuẫn Q2 (footer không còn cột Liên hệ). Sửa câu chữ |
| C1 | `spec/changes/2026-10-20-homepage-redesign.md:4` `status: pending`; `spec/updates/2026-10-20-homepage-redesign.md:3` "planned", `:27–30` bảng task "planned" (chưa có P1-T04), `:73` "Chưa build" | Close-out: archive change doc, cập nhật bảng task T00–T04 + commit SHA + report, số đo verify, sinh `spec/test-scope/current.json` |

### Residual
- R1 (từ R1): reviewer không chạy `pnpm build` (dựa evidence của builder); 768/1280 chưa kiểm bằng trình duyệt; integration test flaky (`media-upload`, `jobs-email`). Lần chạy T04 full suite PASS.

## Điểm chờ user quyết (không chặn)

| # | Lệch | Trạng thái |
|---|---|---|
| U1 | Hero `100svh` (SPEC `:54`) cao hơn mockup | Chờ quyết |
| U2 | Bộ đếm hero canh mép chữ (khung 84rem), mockup sát mép trái ảnh | Chờ quyết |
| U3 | Hoa văn sóng nền footer và hoạ tiết mờ nền Về TAMI chưa dựng (cần asset/pattern) | Chờ quyết |
| U4 | Khoảng Về TAMI → Dự án | **Đã xử lý ở T04** (~40px so với ~42px). Chỉ còn lệch nhỏ n2 (mép nền kem → eyebrow ~23 so với ~44px). User xác nhận có chấp nhận hay không |
| U5 | `blockOrder` của bản ghi trang chủ staging/prod: không có data migration, admin phải tự thêm `strengths` và tắt Dịch vụ/Ưu đãi/Cho thuê/Tin tức theo hướng dẫn `tasks/feature-homepage-redesign/phase-1-task-03.md:40–44` | Chờ quyết / admin thực hiện |

## Kết luận cho dispatcher
- Phase 1 **PASS**. G-M1 và D1 đã đóng, không có gap chặn.
- Close-out: spec-publisher xử lý S1–S5 + N2 + C1 theo đúng các vị trí ở trên; N1 sửa ở lần chạm file kế tiếp.
- Hỏi user U1–U5 ở checkpoint cuối phase.
