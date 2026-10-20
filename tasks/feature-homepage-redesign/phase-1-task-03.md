# feature-homepage-redesign · phase-1-task-03 — Footer dùng chung theo mockup · tắt khối ngoài mockup · mobile · so khớp toàn trang với ảnh · doc reconcile (BL-044)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BL-044). Spec: `SPECIFICATIONS.md` "Khung trang" câu "Footer theo mockup trang chủ (BL-044)" + F1 mục "Khối ngoài mockup" / "Mobile (390)".
- **Mockup bắt buộc Read trước khi code:** `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp` (footer + toàn trang để so khớp).
- Phụ thuộc: **T01 + T02 xong** (so khớp toàn trang cần đủ khối).
- Trạng thái: `pending` — plan đã duyệt 2026-10-20. **Q2 user chốt: footer chỉ 2 cột link như ảnh, KHÔNG có cột Liên hệ** (bỏ `FooterContact` + prop `contact` khỏi Footer nếu không còn dùng; hotline/email/địa chỉ vẫn ở nút nổi + trang Liên hệ).

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

## Verification summary (builder điền)
- Acceptance criteria: … · Verify commands + result: … · Bảng so khớp mockup 1→7: … · Lệch + lý do: … · Reviewer verdict: …
