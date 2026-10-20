# feature-site-redesign-homepage-style · phase-1-task-07 — Tuyển dụng (danh sách + chi tiết) + Liên hệ + Chính sách / Điều khoản + Dịch vụ (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) mục 5–8. Spec delta: khối BL-045 mục "Tuyển dụng", "Liên hệ", "Chính sách / Điều khoản", "Dịch vụ" (Q5, Q9 đã chốt).
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` view `careers` (`.strengths`, `.jobs`, `.job`), `contact` (`.contact`, `.cinfo`, `.form`, `.map`), `legal` (`.legal`, `.toc`, `.block`).
- Phụ thuộc: **T01** (PageHero short, breadcrumb overlay, SectionHeading, ConsultBanner, chữ hero careers/contact, ảnh contact/legal, `careersPerks` + `loadCareersPerks`). Không cần T02.
- Song song: **được** với T03, T04, T06 (wave B). Trùng `vi/en.json` (namespace `page.careers.*`, `page.contact.*`, `page.legal.*`, `page.services.*`).
- Trạng thái: `done` — STRICT PASS round 2, commit `b77840d` (close-out BL-045 2026-10-21); trước đó `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01. Không đầu khối canh giữa ở Tuyển dụng.

## Classification / Risk
- Type: **MODIFY** (bố cục F6, F7).
- Risk: **MEDIUM** — form ứng tuyển (upload CV, BL-005) và form lead Liên hệ chỉ đổi vỏ, không đổi logic; JSON-LD JobPosting/noindex tin hết hạn giữ.
- Expected review level: **NORMAL** (nâng STRICT nếu phải động vào `ApplyForm`/`CvPicker` logic).
- Blast radius: `/tuyen-dung`, `/tuyen-dung/[slug]`, `/lien-he`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/dich-vu/[slug]` (+ `/en`).
- Doc impact: design-spec S12–S16 — T08.

## Scope / files
1. **Tuyển dụng** `src/components/careers/JobListPage.tsx`, `JobCard.tsx`, `JobFilters.tsx`: `PageHero short` + breadcrumb overlay → section: `SectionHeading` canh trái "Vì sao chọn TAMI / Môi trường làm việc" + dải ý dùng `StrengthsBlock` với dữ liệu `site-settings.careersPerks` (Q9; < 2 mục → ẩn cả đầu khối + dải) → section nền trắng: `SectionHeading` "Vị trí đang tuyển" + bộ lọc hiện có (hàng ô chọn ngay trên danh sách — lệch mockup, ghi lý do) + `JobCard` dạng thẻ hàng (`.job`: tên `h3`, specs địa điểm · loại hình · hạn nộp, Button "Ứng tuyển" → chi tiết `#apply-form`) + phân trang tròn → `ConsultBanner`.
2. **Chi tiết tuyển dụng** `src/components/careers/JobDetail.tsx` (Q5): hero thấp (ảnh `pageBanners.careers`, eyebrow "Tuyển dụng", tiêu đề = tên vị trí, mô tả = địa điểm · hạn nộp) + breadcrumb overlay → lưới nội dung thẻ trắng (mục mô tả / yêu cầu / quyền lợi có eyebrow + `h2`) + cột phải `ApplyFormSlot` thẻ trắng dính → việc khác (`JobCard`) → `ConsultBanner`. Hết hạn: băng + ẩn form + `noindex` + bỏ JSON-LD như hiện tại. `ProjectStickyCta` < lg giữ.
3. **Liên hệ** `src/app/(frontend)/[locale]/lien-he/page.tsx`, `src/components/contact/ContactDetails.tsx`: `PageHero short` (chữ `pageHeroes.contact`, ảnh `pageBanners.contact`) → lưới 2 cột: trái `SectionHeading` "Thông tin / Văn phòng TAMI" + danh sách icon tròn `bg-primary-subtle` (địa chỉ, hotline, email, giờ làm việc i18n) · phải `LeadFormSlot` thẻ trắng nổi `shadow-md` + `LeadForm source="contact"` (giữ trường) → bản đồ `LazyMap` bo 20px. Không banner tư vấn.
4. **Pháp lý** `src/components/legal/LegalPage.tsx`, `TableOfContents.tsx`: `PageHero short` (ảnh `pageBanners.legal`, eyebrow "Pháp lý", tiêu đề = tên trang, mô tả = dòng phiên bản) → lưới `[mục lục dính trái][thẻ trắng nội dung]` (`.legal`); < lg mục lục thu gọn trên nội dung. Banner EN chưa duyệt / ẩn `/en` (BR-08) giữ.
5. **Dịch vụ** `src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx` (Q5): `PageHero short` (ảnh `services.coverImage` → mặc định, tiêu đề = tên, mô tả = `summary`) + breadcrumb overlay → `SectionHeading` canh trái + nội dung thẻ trắng + cột phải thẻ tư vấn trắng dính: hotline (`tel:`) + nút "Nhận tư vấn" → `/lien-he` (trang dịch vụ hiện **không có** `LeadForm` — không thêm form / nguồn lead mới) → `ConsultBanner` (thay `CtaBanner` căn giữa).
6. i18n namespace của mình. Tests: `JobListPage`, `JobCard`, `JobDetail` (hết hạn), `ContactDetails`, `LegalPage`, dịch vụ page; 1 `h1`; JSON-LD JobPosting giữ.

## Acceptance
- [ ] `/tuyen-dung` khớp `careers`, `/lien-he` khớp `contact`, `/chinh-sach-bao-mat` + `/dieu-khoan-su-dung` khớp `legal` ở 1440 + 390; chi tiết tuyển dụng + dịch vụ: hero thấp + thẻ trắng + thẻ phải dính (Q5).
- [ ] Ứng tuyển (upload + %), form liên hệ, bản đồ, lọc tuyển dụng, BR-08 trang pháp lý EN hoạt động như trước.
- [ ] Không đầu khối canh giữa; không hex mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/careers src/components/contact src/components/legal src/components/services` → `pnpm typecheck` → `pnpm lint` → xem thật 1440 + 390, chụp màn hình (`.context/review-reports/assets/site-redesign-t07-*.png`).

## Retry / Escalation
Như T01.

## Verification summary (builder điền)
- Acceptance criteria: PASS (code + test); xem thật 1440 + 390: tuyển dụng, chi tiết tuyển dụng, liên hệ. Chính sách + Dịch vụ KHÔNG xem được vì dev DB không có trang pháp lý / dịch vụ (404 / rỗng) — chỉ test đơn vị.
- Verify commands + result: pnpm typecheck PASS; pnpm lint 0 error (2 warning cũ tools/task-dashboard); pnpm vitest run src 248 files / 2446 tests PASS. Ảnh: .context/review-reports/assets/site-redesign-t07-{careers,contact,job}-{1440,390}.png (-390 do Edge headless tối thiểu ~500px nên bị cắt phải; kiểm 390 thật bằng browser pane: scrollWidth = 390).
- Quyết định / lệch so với mockup + lý do:
  - Tuyển dụng: bộ lọc (chip nhóm + ô Nơi làm việc) nằm hàng ngay trên danh sách, trong khối nền trắng (lệch mockup, giữ chức năng lọc hiện có). Dải ý dùng StrengthsBlock (nhãn vùng lấy i18n trang chủ); < 2 mục careersPerks → ẩn cả đầu khối + dải (DB dev chưa có mục nào nên chưa thấy ảnh).
  - JobCard: cả hàng là MỘT link (BL-034), nút Ứng tuyển chỉ là hình thức (span kiểu Button, aria-hidden) → đích là chi tiết, không phải #apply-form.
  - Chi tiết tuyển dụng / dịch vụ dùng DetailLayout (nền vàng nhạt Q4, thẻ trắng + thẻ phải dính, không thanh mục con). Tóm tắt + chia sẻ chuyển vào đầu thẻ nội dung; thẻ phải = ApplyFormSlot (trong suốt, bọc DETAIL_ASIDE_CARD_CLASS). Tin hết hạn: cột phải chỉ có chia sẻ, giữ băng + gợi ý vị trí khác + noindex + không JSON-LD.
  - Liên hệ: icon tròn dùng bg-primary-soft (như StrengthsBlock; primary-subtle gần trùng nền trang); thêm icon EnvelopeSimple vào icons.ts; bản đồ aspect 16/7 như mockup (mobile khá thấp), bo 20px; địa chỉ/hotline/email chỉ hiện khi admin nhập.
  - Pháp lý: mục lục thẻ trắng dính từ lg (trước xl); KHÔNG có eyebrow "Mục n" trên từng h2 trong nội dung (RichText lexical, ngoài scope); không thêm banner tư vấn (spec không nêu). Key i18n legal.sectionLabel dư/không dùng.
  - Dịch vụ: ảnh = coverImage → pageBanners.default (mở rộng PageBannerKey thêm "default" trong page-banner.ts); thẻ tư vấn dính: hotline tel: + nút → /lien-he?service=<slug>; ConsultBanner nhận actionHref cùng đích. i18n services.ctaTitle/ctaDescription không còn dùng.
  - Không sửa PageHero/CategoryListTemplate. Phát hiện cần T03/PageHero xử lý: breadcrumb overlay 3 mục dài ở 390 xuống 2 dòng, đè eyebrow (chi tiết tuyển dụng tên dài).
- Reviewer verdict: **STRICT PASS** (round 2) — report `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-07-round-2-review.md`; commit `b77840d` trên `staging`.

### Round 2 (review round 1 FAIL)
- MAJOR-1: StrengthsBlock render ngoài khung container (chỉ SectionHeading trong khung) → hết lề kép; test cấu trúc khẳng định ul và khung tiêu đề cùng max-w-container px-gutter, không bọc kép. Chưa chụp ảnh với perks vì dev DB không có careersPerks (không ghi DB).
- MINOR-1: StrengthsBlock thêm prop label tuỳ chọn; Tuyển dụng truyền page.careers.perksRegion; mặc định giữ nhãn trang chủ.
- MINOR-2: xoá key i18n page.legal.sectionLabel, page.services.ctaTitle/ctaDescription (vi+en, grep không còn dùng).
- Verify: typecheck PASS, lint 0 error, vitest run src 248 files/2446 tests PASS.
