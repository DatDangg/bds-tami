# feature-homepage-redesign · phase-1-task-03 — Footer dùng chung theo mockup · tắt khối ngoài mockup · mobile · so khớp toàn trang với ảnh · doc reconcile (BL-044)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BL-044). Spec: `SPECIFICATIONS.md` "Khung trang" câu "Footer theo mockup trang chủ (BL-044)" + F1 mục "Khối ngoài mockup" / "Mobile (390)".
- **Mockup bắt buộc Read trước khi code:** `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp` (footer + toàn trang để so khớp).
- Phụ thuộc: **T01 + T02 xong** (so khớp toàn trang cần đủ khối).
- Trạng thái: `builder done (round 2, chờ reviewer; round 1 FAIL M1)` — plan đã duyệt 2026-10-20. **Q2 user chốt: footer chỉ 2 cột link như ảnh, KHÔNG có cột Liên hệ** (bỏ `FooterContact` + prop `contact` khỏi Footer nếu không còn dùng; hotline/email/địa chỉ vẫn ở nút nổi + trang Liên hệ).

## Ràng buộc user
Như T01/T02. Footer dùng chung → đổi **toàn site** (mọi trang công khai). Không đổi schema `footer`/`site-settings`: mô tả = `footer.contactBlock` (đã dùng làm tagline), mạng xã hội = `site-settings.socialLinks` (đã có `SocialLinks`).

## Classification / Risk
- Type: **MODIFY** (bố cục footer dùng chung + hướng dẫn tắt khối + responsive + reconcile doc).
- Risk: **MEDIUM** — footer ở mọi trang công khai (shared layout), accordion < md (`FooterLinkColumn`) giữ; BackToTop (BL-035) đã là nút nổi góc dưới phải — không dựng nút thứ hai.
- Expected review level: **STRICT** (shared layout toàn site + acceptance "khớp ảnh" là gate FAIL/PASS bằng mắt).
- Blast radius: `src/components/layout/Footer.tsx` (+ `Footer.test.tsx`, `PublicShell.test.tsx`), `src/globals/Homepage.ts` (mô tả tab Thứ tự khối — nếu T01 chưa đủ), docs.
- Doc impact: `.context/design-spec.md` §2.4 Footer + S01 (bảng thứ tự khối, mục 1/1b/2/3/7 + khối Điểm mạnh mới) as-built; `docs/ERD.md` §4.15 field mới global homepage; `docs/DESIGN.md` 1 dòng nếu CtaBanner `align`. **Không** sửa intent docs (BRD/PRD) — bố cục mới là quyết định user qua change request, ghi nguồn BL-044.

## Scope / files
1. **Footer** `src/components/layout/Footer.tsx`: ≥ md lưới `md:grid-cols-[1.4fr_repeat(auto-fit,minmax(10rem,1fr))]` (≥ xl cột trái ~40%): **cột trái** logo trắng (`BrandLogo tone="on-dark"`) → mô tả `tagline` (`text-small text-text-secondary max-w-text`) → `SocialLinks` dạng ô tròn 40px viền `border-dark-border` (token khối tối sẵn có; icon 20px; vùng chạm 44px, `aria-label` giữ) · **cột link** `FooterLinkColumn` (tiêu đề cột `text-eyebrow uppercase tracking-[0.12em] text-accent-text` — trong `.theme-dark-block` token = `#E0BF89`; link `text-small text-text-secondary hover:text-text`) · **không cột Liên hệ** (Q2). **Hàng cuối** (`border-t border-dark-border`): trái bản quyền `text-xsmall text-text-muted`; phải `LanguageSwitcher` (`VI | EN`) + `CookieSettingsButton` (khi có). Bỏ `SocialLinks` khỏi hàng cuối (đã lên cột trái). Nút "lên đầu trang" góc dưới phải trong ảnh = `BackToTop` nổi sẵn có (BL-035) — ghi rõ trong report, không thêm nút. < md: cột trái xếp dọc, cột link accordion (giữ `FooterLinkColumn`), cột Liên hệ luôn mở (nếu giữ). Mô tả footer ≤ 25 từ do admin nhập (seed/hướng dẫn không đổi).
2. **Tắt khối ngoài mockup** (Dịch vụ, Ưu đãi, Cho thuê, Tin tức): không xoá code. Kiểm `scripts/seed-shell-globals.ts` / seed homepage (nếu có seed `blockOrder`/`enabled`) → cập nhật seed dev để bản ghi mới theo bố cục mockup; bản ghi đang có trên staging/prod: **admin tự tắt** — ghi hướng dẫn 3 dòng vào report + mô tả tab "Thứ tự khối" (T01 đã làm → chỉ kiểm). Trên dev DB localhost: tắt 4 khối + thêm `strengths` qua admin (hoặc Local API script 1 lần, không commit data) để chụp so khớp.
3. **Mobile 390** toàn trang: rà lại hero/ô tìm kiếm/điểm mạnh/về TAMI/thẻ dự án/banner/footer; sửa lệch nhỏ của T01/T02 (chỉ class responsive, không đổi logic); không tràn ngang (`document.documentElement.scrollWidth === innerWidth`), vùng chạm ≥ 44px.
4. **So khớp mockup 1440** (gate của change doc): chụp full-page http://localhost:3000 (dev server đang chạy; không chạy thêm) → đặt cạnh ảnh mockup, so từng phần 1→7 (thứ tự khối, vị trí thành phần, tỉ lệ/khoảng cách); liệt kê bảng "Phần · Khớp/Lệch · Lý do" trong report + lưu ảnh chụp vào `.context/review-reports/assets/homepage-redesign-1440.png` + `-390.png` (không commit vào `public/`). Lệch còn lại có lý do kỹ thuật (vd nút Dừng/Phát WCAG, nút cookie) ghi rõ.
5. **Doc reconcile** (as-built): `.context/design-spec.md` §2.4 + S01 (bảng khối: thêm Điểm mạnh, ghi khối tắt mặc định theo mockup; mục 1 hero chữ trái + bộ đếm; 1b ô tìm kiếm 3 hàng + "Tùy chọn khác"; 2 Về TAMI cụm ảnh + video; 3 thẻ trắng + tim, bỏ số liệu; 7 banner chữ trái; responsive 375 cập nhật); `docs/ERD.md` §4.15 field mới (tham chiếu migration T01); `docs/DESIGN.md` dòng CtaBanner `align`. Change doc acceptance checklist tick.
6. **Tests**: `Footer.test.tsx` (cột trái có social, hàng cuối không social, tiêu đề cột, Q2), `PublicShell.test.tsx` nếu snapshot; test toàn bộ `pnpm test` PASS; `pnpm build` PASS (gate change doc).

## Acceptance
- [ ] Footer mọi trang công khai khớp ảnh: cột trái logo + mô tả + icon tròn MXH; cột "Khám phá"/"Về TAMI" (chữ từ CMS); hàng cuối bản quyền trái, VI | EN phải; nút lên đầu trang = BackToTop nổi. < md accordion giữ.
- [ ] Trang chủ chỉ còn các khối trong ảnh đúng thứ tự (dev DB sau khi tắt qua admin); 4 khối tắt bật lại được trong admin, code/dữ liệu còn nguyên.
- [ ] Bảng so khớp 1→7 ở 1440: không lệch bố cục/thứ tự/vị trí thấy được bằng mắt (reviewer đối chiếu ảnh chụp với mockup; FAIL nếu lệch không có lý do).
- [ ] 390: xếp dọc giữ phong cách ảnh, không tràn ngang, vùng chạm ≥ 44px.
- [ ] Không hex/kiểu mới; AA; 1 `h1`; `pnpm test` + `pnpm typecheck` + `pnpm lint` + `pnpm build` PASS.
- [ ] Doc as-built cập nhật (design-spec §2.4/S01, ERD §4.15); intent docs không đổi.

## Verify
`pnpm test` → `pnpm typecheck` → `pnpm lint` → `pnpm build` → xem http://localhost:3000 (1440, 390) + 1 trang khác (vd `/du-an`) để kiểm footer dùng chung; chụp đặt cạnh mockup.

## Retry / Escalation
Như T01 (3 attempt → `architecture_review_needed`). Mỗi fail append `.context/error-memory.md`.

## Hướng dẫn admin: bật bố cục mockup trên bản ghi trang chủ có sẵn (staging/prod) — KHÔNG data migration (T01 m4)
1. Admin → Trang chủ → tab **Thứ tự khối**: xoá các dòng Dịch vụ, Ưu đãi nổi bật, Cho thuê, Tin tức, Đối tác (hoặc bỏ tích Hiển thị); thêm **Điểm mạnh** lên đầu, sau đó Giới thiệu → Dự án nổi bật → Mời tư vấn. (Bật lại khối nào chỉ cần thêm lại dòng — nội dung khối vẫn còn.)
2. Tab **Điểm mạnh**: nhập 2–6 mục (icon, tiêu đề, mô tả ngắn; 4 mục mẫu: Vị trí đắc địa · Căn hộ đa dạng · Hỗ trợ chuyên nghiệp · Thủ tục nhanh gọn), lưu cả VI và EN.
3. Tab **Banner đầu trang / Giới thiệu / Dự án nổi bật**: điền chữ nhỏ (eyebrow), dòng vàng (titleAccent), chú thích, ảnh phụ, link video YouTube. Footer: mô tả ở Footer → contactBlock, mạng xã hội ở Cài đặt website → Mạng xã hội.
Mô tả tab "Thứ tự khối" (`src/globals/Homepage.ts` blockOrderField) đã nói đúng việc này (kiểm lại, không phải sửa).

## Kết quả builder (round 1, attempt 1)
- **Footer** (`Footer.tsx`): cột trái logo + mô tả + `SocialLinks variant="circle"` (ô tròn 40px viền `dark-border`, vùng chạm 44px, icon 20px); cột link giữ `FooterLinkColumn`; hàng cuối bản quyền trái + VI|EN/cookie phải, không social; bỏ `FooterContact` + prop `contact` (PublicShell không truyền nữa; Header/MobileMenu vẫn dùng `shell.contact`). Lưới ≥ md `[minmax(0,1.4fr)_repeat(var(--footer-cols),minmax(0,1fr))]`: bản `auto-fit` trong spec task KHÔNG hợp lệ CSS khi đi cùng track `fr` (đo trên trình duyệt: computed = 1 cột) nên đổi sang biến `--footer-cols` = số cột link.
- **Seed dev** (`seed/sample/homepage.ts`): `blockOrder` theo mockup + dữ liệu mẫu `strengths` vi/en. DB dev localhost: `blockOrder` đã đúng mockup (strengths, about, featuredProjects, ctaBanner), strengths 4 mục vi/en, nhãn EN của số liệu About, `socialLinks` 4 mạng (qua Local API, script 1 lần đã xoá, không commit data, không seed reset).
- **MINOR gộp:** T02 m1 mảng nền `bg-primary-soft` sau ảnh phụ (AboutBlock, test); m2 `pt-1` khung cuộn ProjectsSlider; m3 ô tròn số liệu `size-12 sm:size-14` + `break-words` + `gap-3`; m4 thiếu ảnh lớn → ẩn cả cụm (ghi design-spec S01.2 + chú thích code + test); m5 dùng `parseVideoUrl` có sẵn thay `src/lib/home/youtube.ts` (reconcile ghi design-spec). T01 n3 đã có test 1 slide ẩn bộ đếm (`HeroSlider.test.tsx` "1 slide: ẩn bộ đếm…"); n5 key Điểm mạnh theo index (+ `StrengthsBlock.test.tsx`). T01 m4 = hướng dẫn trên.
- Files: `src/components/layout/{Footer,PublicShell}.tsx`, `Footer.test.tsx`, `PublicShell.test.tsx`, `src/components/home/{AboutBlock,AboutBlock.test,ProjectsSlider,StrengthsBlock,StrengthsBlock.test}.tsx`, `seed/sample/homepage.ts`, `.context/design-spec.md`, `docs/ERD.md`, `docs/DESIGN.md`, change doc (tick 5/6), task file. Không đổi schema.

## Bảng so khớp mockup 1→7 (1440; ảnh `.context/review-reports/assets/homepage-redesign-1440.png`, 390: `-390.png`, footer dùng chung: `footer-du-an-1440.png`)
| Phần | Khớp/Lệch | Lý do |
|---|---|---|
| 1 Hero + ô tìm kiếm | Khớp, lệch nhỏ | Chữ trái, 2 dòng (dòng 2 vàng), nút, bộ đếm + thanh tiến trình dưới trái, mũi tên tròn, chú thích + nút cuộn dưới phải, ô tìm kiếm 3 hàng đè đáy hero. Lệch: hero cao `100svh` (spec F1) nên tỉ lệ cao hơn ảnh; bộ đếm canh theo mép chữ (T01 n1, đã báo user); có nút Dừng/Phát (WCAG 2.2.2) cạnh bộ đếm; ô tìm kiếm rộng 56rem hơn một chút so với ảnh. Ảnh hero là ảnh vẽ minh hoạ dev (admin thay ảnh thật). |
| 2 Điểm mạnh | Khớp | 4 ô icon tròn be + tiêu đề + mô tả, ngay dưới ô tìm kiếm, nền bg. |
| 3 Về TAMI | Khớp, lệch nhỏ | Nền khối kem ấm `bg-primary-subtle` (m2, như mockup; mảng be `primary-soft` sau ảnh phụ vẫn phân biệt). Cụm ảnh chồng + mảng nền be + thẻ chú thích + nút play trên ảnh lớn, số liệu icon, nút. Lệch: ảnh toà nhà trang trí mép phải hiện rộng hơn ảnh mẫu do ảnh dev; chữ mô tả xuống 2 dòng (ảnh 3 dòng). | Họa tiết mờ trong nền mockup không dựng (cần asset). |
| 4 Dự án nổi bật | Khớp | Eyebrow + tiêu đề + mô tả; thẻ trắng + badge + tim; 5 thẻ/khung; mũi tên + chấm giữa; "Xem tất cả dự án →". Thẻ thứ 5 bị cắt mép phải như ảnh. |
| 5 Banner tư vấn | Khớp (sửa round 2, M1) | Dải thấp ~290px ở 1440 (`CtaBanner size="compact"`: `min-h-[18rem]` + `py-10`, chỉ trang chủ) như mockup; nút "Nhận tư vấn →" có `ArrowRight`; chữ trái trên ảnh nền; scrim một màu (token) thay gradient (T02 đã chấp nhận). Mặc định `default` (dịch vụ, chi tiết dự án) không đổi. Khoảng cách Dự án nổi bật → banner thu còn ~65px (`pb-10`, m3). |
| 6 Footer | Khớp, lệch trang trí | Logo + mô tả + 4 icon tròn MXH; 2 cột link; bản quyền trái, VI|EN phải; nút lên đầu = BackToTop nổi (BL-035) chỉ hiện sau khi cuộn nên không có trong ảnh full-page. Không cột Liên hệ (Q2). | Lệch trang trí: hoa văn sóng mờ nền footer trong mockup KHÔNG dựng (cần asset/kiểu mới ngoài tokens) — **cần user quyết** có thêm ảnh/pattern nền footer không (m5). |
| 7 Thứ tự khối / khối ngoài mockup | Khớp | DOM: Hero → Tìm kiếm → Điểm mạnh → Về TAMI → Dự án nổi bật → Banner → footer; 4 khối ngoài mockup tắt. |
Mobile 390 (trình duyệt thật, viewport 390): `scrollWidth` = 390, 1 `h1`, không link/nút nhỏ hơn 44px; phần tử vượt mép chỉ là slider chip/thẻ cuộn ngang có chủ đích. Footer < md: accordion giữ. Ảnh 390 chụp bằng iframe 390px (Edge headless không xuống < 500px).

## Verification summary (builder điền)
- Acceptance criteria: footer/khối/mobile/doc đã làm như trên; bảng so khớp ở trên — chờ reviewer đối chiếu ảnh.
- Verify: `pnpm typecheck` PASS; `pnpm lint` PASS (0 error, 2 warning cũ `tools/task-dashboard/server.mjs`); `pnpm test` PASS 305 files / 3200 tests (1 lần chạy đầu có 1 file fail không xác định được tên do log bị cắt, chạy lại toàn bộ PASS — nghi flaky integration DB dùng chung, residual risk); `pnpm build` PASS (đã dừng dev server trước, khởi động lại sau).
- Lệch + lý do: xem bảng. Cần user quyết: (1) hero `100svh` vs tỉ lệ ảnh; (2) bộ đếm hero canh theo mép chữ vs sát mép ảnh (T01 n1).
- Round 2 (sửa theo review round 1): M1 banner compact + mũi tên; m1 DESIGN.md dòng Trang chủ viết lại as-built; m2 nền Về TAMI `bg-primary-subtle` (text-muted/accent-text trên nền này 4.82/4.63 ≥ AA, tokens §AA); m3 khối Dự án nổi bật `pt-section pb-10`; m4 `SocialLinks` gap-1 chỉ cho `circle`, `plain` giữ gap-2; m5 chưa dựng, ghi bảng + cần user quyết. Test thêm: CtaBanner (default/compact), AboutBlock (nền), Footer (SocialLinks gap).
- Reviewer verdict: …
