# feature-site-redesign-homepage-style · phase-1-task-08 — Close-out: so khớp toàn site 1440/390, AA breadcrumb trên ảnh thật, seed dev, quét hồi quy, doc reconcile (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) — toàn bộ Acceptance.
- Mockup: `docs/specs/site-redesign-mockup/index.html` (9 view) + DECISIONS #1–#6.
- Phụ thuộc: **T01–T07** (+ T00 nếu có). Chạy **cuối**, tuần tự.
- Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (doc reconcile, seed dev, sửa lệch nhỏ phát hiện khi so khớp).
- Risk: **LOW–MEDIUM**. Expected review level: **NORMAL**.
- Doc impact (bắt buộc): `.context/design-spec.md` S02–S16 + §1.6 (ngân sách eyebrow) + §2.6 (breadcrumb) + §2.7 (banner → hero) + S01 dòng tim (`:236`) — ghi chú "As-built BL-045"; `docs/DESIGN.md` (hero trang con, breadcrumb, thẻ, chi tiết); `docs/ERD.md` (site-settings `pageHeroes`, ảnh contact/legal, cờ); `docs/API_SPEC.md` (tham số `/du-an` `q`/`developer`/`sort` của T00); `skills/react-nodejs/design-tokens.md` (`--blur-breadcrumb`).

## Scope
1. **Seed dev** (chỉ DB dev, idempotent, không staging/prod): chữ hero vi/en 6 trang + `careersPerks` 4 mục vi/en + ảnh Liên hệ / Pháp lý mẫu (dùng ảnh `docs/specs/site-redesign-mockup/assets/` hoặc media sẵn có) — script `scripts/seed-page-heroes.ts` + `pnpm seed:page-heroes`.
2. **So khớp** từng view mockup ↔ trang thật ở 1440 + 390 (+ Dịch vụ, chi tiết tuyển dụng, `/tin-bds` danh sách + chi tiết): ảnh chụp cạnh nhau `.context/review-reports/assets/site-redesign-t08-<view>-<w>.png`; lệch bố cục/thứ tự/vị trí → sửa tối thiểu trong task này (nhỏ) hoặc mở lại task gốc (lớn).
3. **AA breadcrumb** trên ảnh hero thật sáng nhất đang dùng (đo pixel vùng dưới khung, ghi tỉ lệ); không đạt → tăng scrim token đầu ảnh.
4. **Quét hồi quy**: grep `Heart` = 0; không `text-center` ở đầu khối Tin tức / Bài viết / Tuyển dụng / "tương tự"; 1 `h1`/trang (test hoặc script); JSON-LD BreadcrumbList còn ở mọi trang con; `/en` mọi trang; lọc/phân trang `/du-an` `/cho-thue` URL không đổi; form lead các trang gửi được (dev).
5. Doc reconcile như trên; `no doc impact` không áp dụng.

## Acceptance
- [ ] Toàn bộ Acceptance của change doc PASS với evidence ảnh.
- [ ] Doc reconcile xong (as-built), intent docs không bị hạ cấp.
- [ ] `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build` PASS.

## Verify
`pnpm test` → `pnpm typecheck` → `pnpm lint` → `pnpm build` → xem thật 1440 + 390 mọi trang.

## Retry / Escalation
Như T01.

## Verification summary (builder điền)
- Acceptance criteria: PASS (so khớp 9 view + Dịch vụ, chi tiết tuyển dụng, /tin-bds, chi tiết tin BĐS, danh mục cho thuê ở 1440 + 390; AA; hồi quy; doc reconcile). Chưa có reviewer.
- Seed dev (chỉ DB dev, idempotent, chặn APP_ENV=production, ảnh không vào git):
  - Tải thêm: `node scripts/fetch-scraped-extra.mjs` -> `seed/scraped-extra/` (gitignore) 140 ảnh webp (<= 1.5MB, rộng >= 600) từ trang bài viết dự án bdstanlong.vn (HTML đã cào sẵn), nguồn từng ảnh ở `seed/scraped-extra/manifest.json`; 28 dự án x 5 ảnh.
  - `pnpm seed:page-heroes` (scripts/seed-page-heroes.ts): chữ hero vi/en 6 trang, careersPerks 4 mục vi/en, ảnh banner Liên hệ + Pháp lý (ảnh mockup), xuất bản 2 trang pháp lý + 3 dịch vụ mẫu (gán ảnh bìa mockup).
  - `pnpm seed:galleries` (scripts/seed-galleries.ts): 28 dự án gallery tới 6 ảnh, 38 tin BĐS gallery 6 ảnh (mượn ảnh cho thuê, không tải thêm), 1 tin BĐS đã xuất bản isFeatured, 3 căn cho thuê đã xuất bản có videoUrl YouTube. pageBanners các trang khác + ảnh bìa tin tức đã có sẵn trong DB dev.
- Verify: pnpm typecheck PASS; pnpm lint PASS (0 error; thêm seed/scraped/ vào ignore eslint); pnpm build PASS; pnpm vitest run: 3305+ pass, các file fail (RentalListPage amenity name, projects integration priceFrom, load-project-strengths server-only) đã sửa và chạy lại riêng PASS.
- Ảnh so khớp: `.context/review-reports/assets/site-redesign-t08-<view>-<1440|390>.png` (mockup trái, thật phải; view không có mockup = ảnh thật, file *-real.png là bản thật riêng).
- AA breadcrumb trên ảnh hero thật (đo pixel dưới khung, chữ ẩn): 1440 + 390, 8 trang: median >= 9.9:1, p95 >= 7.6:1 (chữ trắng); pixel sáng nhất chỉ ở góc bo ngoài khung. Không cần tăng scrim.
- Hồi quy: Heart = 0 trong src; mỗi trang 1 h1, không cuộn ngang ở 1440/390; BreadcrumbList còn (Breadcrumb.tsx/json-ld.ts); /en không chụp thêm (test i18n/messages-check + integration vẫn PASS).
- MINOR đã xử lý: T00 (không còn trần 50 chủ đầu tư, log cảnh báo chạm trần quét 1000; test developer hợp lệ đã có sẵn), T01 (text-shadow dùng token, nút phân trang disabled có nhãn sr-only, ConsultBanner tiêu đề+mô tả đi theo cặp), T02 (use-environment chuyển sang layout/, bỏ priceFrom của thẻ dự án, CardSlider.test khôi phục scrollTo), T03 (AmenityMultiSelect bỏ aria-label đè, test resolveProjectStrengths, dọn 6 key i18n), T04 (dọn key visitCta.title/description/button, heroConsult, heroDocuments, relatedTitle, sections.gallery; ProjectSpecs bỏ Loại hình/Giá từ), T05 (eyebrow chi tiết tin BĐS + video cho thuê đổi chữ khác tiêu đề; Pick amenities), T06 (xoá page.news.relatedTitle, page.posts.resultCount).
- MINOR bỏ: T01 pb-section-tight lặp trên form (không thấy lỗi thị giác ở 1440/390), ChipRow trùng markup (follow-up), sort /du-an cần JS (đã chấp nhận), NewsCard dùng chung CARD_LINK_CLASS (DRY nhỏ), dải nền sáng ~50px giữa banner và footer: không tái hiện ở 1440 (careers/contact/legal/services) nên không sửa.
- Lệch so với mockup + lý do: hero dùng min-h thay chiều cao cố định (đã ghi doc); /tin-bds bỏ "Có N kết quả"; Bài viết có thêm mắt xích tiêu đề trong breadcrumb (giữ BreadcrumbList); "Dự án tương tự" là lưới 3 thẻ khi chỉ có 3 dự án cùng tỉnh/loại (mockup là slider 4 thẻ); bản đồ/mặt bằng/tiện ích dự án dev trống nên khối ngắn hơn mockup; Liên hệ dev chưa có địa chỉ/hotline/email trong site-settings (dữ liệu, không phải bố cục); news dev có nhiều thẻ hơn mockup nên trang dài hơn. Không có lệch lớn.
- Doc reconcile: .context/design-spec.md (§1.6, §2.6, §2.7, S01 tim, khối As-built BL-045 đầu §4), docs/DESIGN.md, docs/ERD.md, docs/API_SPEC.md §3.9, skills/react-nodejs/design-tokens.md.
- Round 2 (sau reviewer round 1 FAIL): MAJOR-1 seed-page-heroes/seed-galleries dùng `checkSeedEnvironment` (từ chối NODE_ENV=production hoặc DATABASE_URL trùng staging/prod; đã chạy lại 2 seed trên DB dev, guard cho phép), chỉ xuất bản `pages` kind privacy/terms và 3 dịch vụ mẫu theo slug, comment đã sửa. MINOR-1 fetch-scraped-extra.mjs: timeout 20s, cap 8MB (content-length + đếm stream), try/catch decodeURI, `redirect: manual`, chỉ host bdstanlong.vn. MINOR-3 chi tiết cho thuê: Thông tin chi tiết + Điều khoản nhãn trái/giá trị phải (1 cột < md, 2 cột ≥ md), Tiện ích 2 cột ở 390; "Hướng" đã có trong dải thông số khi có dữ liệu (căn dev không có houseDirection); ảnh detail-rent 1440/390 chụp lại. MINOR-4 docs/DESIGN.md các hàng danh sách/chi tiết/tin tức/tuyển dụng/liên hệ/List Search Bar thêm "As-built BL-045". MINOR-5 hoàn nguyên 2 dòng chỉ-khoảng-trắng của docs/API_SPEC.md. MINOR-6 thêm 2 test ConsultBanner (có tiêu đề không mô tả; tiêu đề trống có mô tả). MINOR-2/7 giữ nguyên. Verify: typecheck PASS, lint 0 error, vitest run src 2496 PASS, integration projects PASS.
- Reviewer verdict: (chờ round 2)
