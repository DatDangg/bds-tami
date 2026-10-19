Agent: spec-validator

# Spec validation: feature-public-ui-market-vinhomes (BL-020) · Phase 1 (tokens + header)
> Report do primary lưu (guard chặn ghi `.context/review-reports/**` trong worktree).

- Mode: phase review sau P1-T01 + P1-T02 (STRICT PASS). Scope `git diff 1861843..HEAD` — `cca654d` (tokens), `9b8a8f0` (header).
- Nguồn: change doc (Acceptance), README (Quyết định user 1–4), task file P1-T01/T02, review report P1-T01 r1/r2 + P1-T02 r1, `docs/DESIGN.md`, `.context/design-spec.md`, `skills/react-nodejs/design-tokens.md`, `SPECIFICATIONS.md`, `docs/BRD.md`, `spec/updates/*`, test-scope 1.13.0-15, code `globals.css`, `Header.tsx`, `HeaderFrame.tsx`, `MobileMenu.tsx`.

## Verdict lần 1: ⚠️ GAPS FOUND (chỉ docs) → primary cho builder sửa G1–G4, xem "Đóng gap" cuối file

## Acceptance coverage (mục thuộc Phase 1)
| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| a1 | Radius (thẻ 20px, pill) | ✅ code · ⚠️ docs | `globals.css:99-103` 2/12/16/20/9999; thẻ `rounded-xl`. `DESIGN.md:216-225`, `:279` còn "góc vuông" |
| a2 | Nút viên thuốc (primary vàng, secondary trắng viền, chip) | ✅ code · ⚠️ docs | `button.tsx` + test; `rounded-pill` trong tailwind-merge. `DESIGN.md:265`, `design-tokens.md:307` thiếu |
| a3 | Heading serif viết thường, 400, giữ EB Garamond + Montserrat | ✅ code · ⚠️ docs | `fonts.ts` 400+500 (+test); display/h1/h2 60/56/44; `--text-h2-sm`. `DESIGN.md:23,:236,:261` còn "in hoa" |
| a4 | Bỏ watermark | ✅ code · ⚠️ docs | token/prop/i18n đã bỏ; còn nhắc ở design-spec `:285,:309,:560`, DESIGN.md `:236,:261` |
| a5 | Token kính mờ (kem ~80% + blur 24px) | ✅ | `--color-glass` `rgb(250 248 246 / 0.8)`, `--blur-glass` 24px; `@supports` + reduced-transparency |
| a6 | Màu TAMI + gradient vàng/xanh | ✅ | `--gradient-gold`, `--gradient-success`, `SALES_STATUS_BADGE_VARIANT` |
| a7 | AA khối sáng & tối | ✅ | `contrast.test.ts`: chữ trên kính 10.83/17.55; badge vàng 8.07/5.89; "Đang bán" 4.99/6.44; secondary 5.12/9.72; chip ≥ 4.5 trên tối; focus ring màu chữ |
| a8 | Cập nhật DESIGN.md + design-spec + tokens | ⚠️ PARTIAL | mục mới đúng, mục cũ chưa dọn (G1–G3) |
| b1 | Header nổi bo tròn kính mờ | ✅ | `HeaderFrame.tsx:11-13`, `Header.tsx:46`, `--header-offset` 5/6.5rem; kiểm trình duyệt 1280 VI/EN + 375 |
| b2 | ≥ xl menu ngang, không nút Menu (BL-019) | ✅ | `Header.tsx:51-53`, `MobileMenu.tsx:45` |
| b3 | Logo vàng trên nền sáng (BL-018) | ✅ | `BrandLogo image={logo.onLight}` |
| b4 | < xl giữ nút Menu | ✅ | `MobileMenu.tsx:45` |
| b5 | Hành vi trên hero | ✅ (lệch task có chủ đích) | task ghi "trong suốt → kính khi cuộn"; làm "luôn kính mờ sáng" theo quyết định user + AA. **Nêu ở checkpoint.** |
| — | Không CLS, VI/EN cùng bố cục | ✅ / residual | header trong luồng, không JS; chưa đo Lighthouse |

## Gaps
- **G1** `docs/DESIGN.md` tự mâu thuẫn: `:18-27` (vinhomes.vn, serif in hoa), `:216-225` Border Radius cũ, `:236` trang chủ in hoa/chữ chìm, `:261` Section Heading, `:265` Button row thiếu pill/secondary/chip, `:279` "góc vuông".
- **G2** `.context/design-spec.md`: `:94` menu toàn màn hình ghi `--text-h2` (code `text-h3`), `:560` 404 watermark, `:285` watermark 768, `:3,:6,:9` vinhomes.vn.
- **G3** `skills/react-nodejs/design-tokens.md`: `:307` Button thiếu pill/secondary/chip; `:467` radius 2/4px.
- **G4** checkbox Acceptance của P1-T01/T02 chưa tick.
- Ghi chú: `globals.css:207` shadcn `--radius: 2px` (khớp "`--radius-sm` cho ô nhỏ") — kiểm không component shadcn nào cần pill/12px lấy từ `--radius`.

## Mâu thuẫn intent-doc (session chính xử lý trong spec delta, KHÔNG sửa ở branch này)
| # | Intent | Vị trí | As-built mới | Mức |
|---|---|---|---|---|
| C1 | "bố cục và phong cách theo vinhomes.vn" | `SPECIFICATIONS.md:21` | phong cách market (thẻ 20px, nút pill, serif viết thường, header kính mờ), màu TAMI | MEDIUM |
| C2 | Khung trang: logo `logo`/`logoDark`, "bản trắng cho nền tối" | `SPECIFICATIONS.md:19` | header luôn kính sáng, chỉ logo vàng; `logoDark` chỉ ở menu toàn màn hình + footer | MEDIUM |
| C3 | FR-ADM-20 "Ngoài phạm vi (BL-020): … header trong suốt trên banner ảnh" | `SPECIFICATIONS.md:82`, `spec/updates/2026-10-19-list-page-banner-image.md:14`, `spec/CHANGELOG.md:22` | không còn header trong suốt; banner 240px + băng tìm kiếm vẫn ở P3 | MEDIUM |
| C4 | BL-018 "header trong suốt trên hero … logo trắng"; retest "trên hero = trắng" | `spec/updates/2026-10-19-header-logo-gold.md:10,26`; test-scope 1.13.0-15 dòng 58 | logo vàng mọi nơi trên header | MEDIUM (test-scope sẽ fail giả) |
| C5 | BRD "Tham khảo giao diện: vinhomes.vn"; Q2 font | `docs/BRD.md:12`, `:291` | tinh chỉnh sang market.vinhomes.vn; font giữ | LOW — intent doc, chỉ đổi khi user duyệt |
| C6 | NFR-07 AA | `SPECIFICATIONS.md:161` | khớp (contrast.test) | — |
| C7 | NFR-01 LCP/CLS | `SPECIFICATIONS.md:155` | khớp về thiết kế; thêm file font 400; chưa đo | LOW residual |

## Spec delta cho session chính (publish khi merge Phase 1)
1. `SPECIFICATIONS.md` § Khung trang (`:19`): header = thanh nổi bo tròn kính mờ sáng (kem ~80% + blur 24px), như nhau mọi trang kể cả trên hero/banner ảnh; lề 8/16px, cao 64/72px, `--header-offset` giữ chỗ trong luồng; nền đặc khi không có `backdrop-filter` hoặc `prefers-reduced-transparency`; mục đang xem gạch chân màu chữ (không accent), focus ring màu chữ. Logo: header chỉ dùng `site-settings.logo` (vàng mặc định); `logoDark` chỉ ở menu toàn màn hình + footer.
2. `SPECIFICATIONS.md:21` (Giao diện): "phong cách theo vinhomes.vn" → bố cục + cảm giác market.vinhomes.vn với màu TAMI; quy tắc: thẻ bo 20px, nút/badge viên thuốc, heading serif viết thường weight 400, không chữ chìm; tham chiếu `docs/DESIGN.md` § "Bo góc, kính mờ, gradient (BL-020)".
3. `SPECIFICATIONS.md:82` (FR-ADM-20): bỏ "header trong suốt trên banner ảnh" khỏi ghi chú "Ngoài phạm vi (BL-020)"; giữ banner 240px + băng tìm kiếm → P3.
4. `spec/updates/<date>-public-ui-market-vinhomes-p1.md` — quyết định thiết kế bị thay thế: S01.1/§2.1 header "Trong suốt ↔ Đặc" + IntersectionObserver → 1 biến thể kính; §1.7 heading in hoa → viết thường (in hoa chỉ còn nút, eyebrow, menu); §1.6 watermark → bỏ (`--text-watermark`, prop `watermark` của PageBanner, i18n `page.home.about/projects.watermark`); radius "vuông / 2–4px, không bo 8–16px" → 2/12/16/20/pill; gạch chân mục đang xem `--color-primary`/`--color-accent-text` → `--color-text`; BL-018 "logo trắng trên hero" → luôn vàng; cỡ chữ display 56→60, h1 40→56, h2 30→44, thêm `--text-h2-sm` (cỡ h2 cũ), h1 trang chi tiết cho thuê dùng `--text-h2`; token mới `--color-glass`, `--blur-glass`, `--gradient-gold`, `--gradient-success`, `--color-primary-deep`, `--header-offset`; Button thêm `secondary`, `chip`; Badge thêm `success`; badge trạng thái: selling → success, upcoming → vàng, handed_over → neutral.
5. `spec/CHANGELOG.md` + bump `spec_version` (MINOR — đổi hành vi hiển thị, không schema).
6. `spec/test-scope/current.json` (scopeVersion +1, risk medium — layout dùng chung mọi trang public): thay assert "Logo header (BL-018): đặc = vàng, trên hero = trắng" bằng "header luôn logo vàng trên kính"; retest: thanh kính trên trang có/không hero, VI/EN, 375/768/1280; ≥ xl không nút Menu, < xl có; 1280 EN 7 mục + CTA không tràn; `prefers-reduced-transparency` / không `@supports` → nền đặc; focus ring trong thanh; offset dính (ProjectSubNav, RentalFilters mobile, aside cho thuê/tuyển dụng, mục lục pháp lý, PostShare); `scroll-margin` neo (mục dự án, form lead/ứng tuyển, RichText h2); cầu hover dropdown; thứ bậc heading trang chi tiết; badge "Đang bán" gradient xanh, "Sắp mở bán" vàng; nút pill (secondary, chip); hết watermark (About/Dự án trang chủ, 404, PageBanner biến thể chữ); Lighthouse mobile LCP/CLS trang chủ + `/du-an` (thêm weight font).
7. BRD (tuỳ chọn, cần user duyệt): `docs/BRD.md:12` → market.vinhomes.vn; nếu không đổi, ghi trong update rằng change doc tinh chỉnh tham chiếu BRD (chỉ bố cục/cảm giác, giữ LGL-04).
8. BACKLOG/progress: BL-020 Phase 1 xong (`cca654d`, `9b8a8f0`); BL-018/BL-019 giữ, phần "logo trắng trên hero" bị thay như mục 4.

## File bảo vệ
`git diff --stat 1861843..HEAD -- SPECIFICATIONS.md spec/ .context/progress.json` rỗng ✅. Working tree chỉ có 2 run journal untracked ✅.

## Residual risk
LCP/CLS chưa đo lab sau khi thêm EB Garamond 400 (next/font swap + size-adjust → thấp); kính mờ Safari + cầu hover chưa thử thiết bị thật; skip link `#main` trên trang không hero vẫn nằm dưới header (có từ trước); khe trong suốt giữa thanh nổi và thanh dính (chấp nhận, restyle P4-T01); minor mang sang: m-b (`fonts.ts` chú thích), m-c (`lg:text-h2` NewsCard/PostCard → P3-T03), m5 (panel 2px).

## Đóng gap (primary, sau khi builder sửa docs)
- G1 `docs/DESIGN.md`: tham chiếu phong cách → market.vinhomes.vn (bố cục/cảm giác, màu TAMI), Border Radius → thang BL-020, trang chủ/Section Heading bỏ "in hoa"/"chữ chìm", Button (2 dòng) pill + Secondary/Chip, Badge pill + gradient, UI Library → thang radius. ✅
- G2 `.context/design-spec.md`: menu toàn màn hình `--text-h3`, bỏ watermark 404/768/bảng khối, Shape lock → BL-020, đầu file → market. ✅
- G3 `skills/react-nodejs/design-tokens.md`: §10 Button pill + Secondary/Chip, shadcn radius → BL-020, dòng Header thanh nổi. ✅
- G4 checkbox P1-T01/T02 đã tick (mục "không CLS" ghi rõ: suy luận layout + kiểm trình duyệt, chưa đo Lighthouse). ✅
- Kiểm lại: `grep "in hoa|góc vuông|radius 2px/4px"` chỉ còn mô tả nút/eyebrow/menu in hoa (đúng) và ghi chú lịch sử BL-020.

## Verdict cuối: PASS (Phase 1) — chuyển spec delta ở trên cho session chính
