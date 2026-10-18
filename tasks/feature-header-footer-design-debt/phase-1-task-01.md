# feature-header-footer-design-debt · phase-1-task-01 — header 1 hàng ở ≥ xl + nút CTA và logo từ CMS

- Change doc: `spec/changes/2026-10-19-header-footer-design-debt.md` (BACKLOG BL-001)
- Nguồn: L5-T05 decision log (MINOR-1/2, `tasks/tami-website/layer-5-task-05.md:91-92`), spec-validation layer 5 G18; user quyết 2026-10-19 làm ngay trước go-live
- Spec: `.context/design-spec.md` §2.1 (đã cập nhật intent "1 hàng ở ≥ xl", hàng Logo, hàng Nút CTA)

## Classification / Risk
- Type: **MODIFY** (khung trang công khai đã có từ L5-T05)
- Risk: **MEDIUM** — shared component trên MỌI trang công khai (`/` và `/en`), cache global `header`/`site-settings` (tag `global:<slug>`), view model client (không lộ trường nội bộ). Không đổi schema (dùng `header.ctaButton` + `site-settings.logo/logoDark` đã có) → không migration.
- Expected review level: **STRICT** (shared component/navigation).
- Blast radius: `src/components/layout/{Header,BrandLogo,MobileMenu,load-shell,shell-data,PublicShell}.tsx/ts` + test; mọi trang public.
- Doc impact dự kiến: `docs/DESIGN.md`/`docs/ARCHITECTURE.md` nếu mô tả khung trang (as-built); design-spec đã cập nhật (intent, user duyệt).

## Hiện trạng
- `Header.tsx`: ở ≥ xl đã xếp 1 hàng bằng `order-*` (logo · DesktopNav · tìm · VI|EN), nút Menu `xl:hidden`; `MobileMenu` tự đóng khi ≥ xl (`useCloseOnDesktop`).
- `ctaButton` (global `header`, `label` localized + `link` navLink) chưa được đọc ra view model.
- `BrandLogo` dùng file tĩnh; `site-settings.logo` / `logoDark` (upload → media) chưa dùng.

## Yêu cầu
1. ≥ xl một hàng: logo trái · menu ngang giữa (dropdown mục có con giữ nguyên) · phải: tìm kiếm, `VI | EN`, CTA (nếu bật), nút **Menu** (hiện cả ở ≥ xl, mở menu toàn màn hình). < xl không đổi bố cục (tìm trái · logo giữa · VI|EN + Menu phải). Không tràn/xuống dòng ở 1280 với 7 mục + CTA nhãn dài vừa phải (vd "Nhận tư vấn"/"Get advice"); nếu không vừa thì giảm gap/ẩn chữ "Menu" giữ icon ở xl, không cắt chữ menu.
2. Bỏ đóng-tự-động của menu toàn màn hình ở ≥ xl (giờ có nút Menu ở xl).
3. CTA: view model `cta?: LinkView` từ `header.ctaButton` qua `resolveNavLink` (theo locale); thiếu nhãn ở locale đang xem / link không hợp lệ → không có CTA. Hiện ở header từ ≥ md (nút chính cỡ nhỏ, `min-h-11`) và trong menu toàn màn hình. External link → `target=_blank rel=noopener noreferrer` theo `NavAnchor`.
4. Logo: view model `logo: { onLight?: {url,width,height,alt?}; onDark?: ... }` từ `site-settings.logo` (nền sáng) / `logoDark` (nền tối) — chỉ URL + kích thước, không đưa doc media nguyên vào client. Thiếu → logo tĩnh hiện tại. Header (cả 2 biến thể), menu toàn màn hình, footer dùng chung. Kiểm `readPublicGlobal` có populate upload (depth) không; ảnh qua `next/image` phải được `images.remotePatterns`/loader cho phép (hoặc dùng `unoptimized` nếu media phục vụ từ S3 public) — chọn theo cách các ảnh media khác trong repo đang render.
5. Revalidate: lưu `header` / `site-settings` vẫn làm mới `/` và `/en` (tag hiện có). Không đọc cookies()/headers() trong khung trang.

## Acceptance
- [ ] ≥ xl header 1 hàng: logo trái · 7 mục giữa · tìm + VI|EN + CTA (nếu bật) + Menu phải; < xl không đổi
- [ ] `header.ctaButton` có nhãn+link → nút CTA trên header (nhãn/link theo locale); thiếu → ẩn; EN chưa có nhãn → ẩn ở `/en`
- [ ] `site-settings.logo`/`logoDark` có → dùng cho header/menu/footer; không có → logo mặc định
- [ ] Nút Menu ở ≥ xl mở menu toàn màn hình; menu không tự đóng khi resize lên xl
- [ ] Test unit (`shell-data.test.ts`, `Header.test.tsx`, …) cập nhật/thêm cho CTA + logo + bố cục
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` PASS (trừ fail sẵn job-applications "vị trí hết hạn → 400")

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
**Thiết kế chốt (builder, 2026-10-19):**
- View model (`shell-data.ts`): `ShellView.cta?: LinkView` từ `buildCta(header.ctaButton, locale)` — dùng lại `toLinkView` (nhãn trim + `resolveNavLink`), thiếu nhãn ở locale đang xem / link không hợp lệ → `undefined` (không mượn VI cho EN, BR-07). `ShellView.logo: LogoView { onLight?, onDark? }` từ `buildLogo(site-settings)`: mỗi bản chỉ `{url,width,height}`, ưu tiên `sizes.card` (800px webp) rồi mới ảnh gốc; id string (chưa populate) / thiếu url hoặc kích thước → bỏ. `readPublicGlobal` đọc `depth: 1` nên upload đã populate; không đổi schema, không migration.
- `BrandLogo` nhận `image?: LogoImageView`; có → `next/image` `unoptimized` (ảnh CMS đã là cỡ sinh sẵn, cùng cách `ResponsiveImage`/`VideoFacade`, không cần `remotePatterns`); không → file tĩnh `/brand/tami-logo-{dark,white}.png` như cũ (vẫn qua `/_next/image`).
- `Header`: props `logo`, `cta?`. ≥ xl một hàng (logo `order-1` · DesktopNav `order-2 flex-1` · tìm `order-3` · cụm phải `order-4`: VI|EN + CTA + Menu); < xl bố cục cũ. CTA = `NavAnchor` + `buttonVariants({size:"sm"})` + `min-h-11`, `hidden md:inline-flex`, `md:px-3 lg:px-5`. Nút Menu bỏ `xl:hidden`; nhãn "Menu" ẩn ở xl (icon + sr-only "Mở menu"), hiện lại từ 2xl; khi có CTA thì ẩn thêm ở md–lg để cụm phải ≤ nửa hàng, logo vẫn giữa. `DesktopNav` gap `gap-4 2xl:gap-8` (trước `gap-6 2xl:gap-8`).
- `MobileMenu`: bỏ `useCloseOnDesktop`/`DESKTOP_QUERY`; nhận `logo`, `cta`; logo nền tối từ CMS; CTA (nút chính md, `min-h-11`) đầu cột phải, bấm thì đóng. `Footer` nhận `logo` → `logo.onDark`. `PublicShell` truyền `shell.logo`/`shell.cta`.
- Không đọc `cookies()`/`headers()`; cache/tag `global:header`/`global:site-settings` không đổi. Không thêm message i18n.

**Test (TDD):** thêm 10 test, đều FAIL trước khi sửa (`buildCta is not a function`, thiếu CTA/logo, nút còn `xl:hidden`, dialog tự đóng) → PASS sau:
- `shell-data.test.ts`: `buildCta` (khoá trang vi/en, URL ngoài external, javascript:/thiếu nhãn/thiếu link/null → undefined); `buildLogo` (ưu tiên card, không lộ `uploadedBy`/`alt`/`id`; ảnh gốc khi không có card; id string/thiếu kích thước/null → `{}`).
- `Header.test.tsx`: nút Menu không `xl:hidden`; logo tĩnh (2 bản) vs URL CMS; CTA hiện (`hidden md:inline-flex`, href) / ẩn khi không có / external `target=_blank rel=noopener noreferrer`; menu toàn màn hình có logo tối CMS + CTA (đóng khi bấm); không tự đóng khi matchMedia xl `change`.
- `PublicShell.test.tsx`: thêm `logo: {}` vào fixture.

**Verify (2026-10-19):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 227/228 file PASS (2437/2438) — fail duy nhất là `job-applications.test.ts` "vị trí hết hạn → 400" đã fail sẵn, ngoài scope · `pnpm build` PASS (route table đầy đủ, không lỗi; `src/payload-types.ts` + `importMap.js` đã dirty từ trước, ngoài scope) · oxlint: repo không có config → skip.
- Browser (dev server, Chrome emulation): **1280** header 72px một hàng, nav 695px/712px chỗ, CTA mô phỏng 150px (chèn DOM cùng class để đo vì DB dev chưa cấu hình `ctaButton`) → không tràn (`scrollWidth` = viewport), nút Menu icon-only mở menu toàn màn hình 7 mục, khoá cuộn, Esc đóng. **768** header 64px, tìm trái · logo giữa · VI|EN + CTA + Menu phải; với CTA + nhãn Menu ẩn, logo lệch tâm ~19px trước khi thu `md:px-3` (sau thu ước ~3px, chưa đo lại do CTA chưa có trong DB). **375** 64px, không h-scroll, nút Menu 44px.

**Attempt 2 (builder, 2026-10-19 — sửa review round 1 MAJOR-1 + MINOR-1):**
- `BrandLogo`: thêm `max-w-[7.5rem] object-contain object-left` (mọi nơi dùng); `Header` siết thêm `xl:max-w-[6rem]` qua `className` cho 2 bản logo ở header — logo CMS quá ngang bị chặn rộng (giữ tỉ lệ, neo trái); logo tĩnh 800×416 ở h-12 rộng 92.3px nên không đổi hình dạng (đo). Footer/menu toàn màn hình chỉ chịu mức 7.5rem.
- `Header` CTA: `max-w-[10rem]` + `xl:px-4` (md `px-3`, lg `px-5` giữ nguyên), nhãn bọc `span.truncate` (text-overflow không áp dụng cho chính flex container), `title={cta.label}` giữ nhãn đầy đủ; CTA trong menu toàn màn hình không đổi (nhãn trọn).
- Test: `Header.test.tsx` thêm kiểm `max-w-[10rem]`, span `truncate`, `title`, class giới hạn logo (2 bản CMS). 16/16 PASS.
- **Đo thật** (dev server, `header.ctaButton` đặt tạm trong dev DB qua Payload Local API: vi "Nhận tư vấn", en "Get advice", link `contact`; trước đó vi/en = `{ link: null }` không nhãn; **đã khôi phục** về `label: null, link: null` sau khi đo, không reset/seed). Viewport 1280×800 có thanh cuộn dọc → `clientWidth = 1265`:
  - Trước fix: `/` nav 694.7px, cách logo 20.6px, cách nút tìm 20.6px (gồm `xl:gap-3` 12px); `/en` nav 704.8px, 23.4px mỗi bên. Không chồng nhưng tổ hợp xấu nhất (logo 3:1 120px + CTA 160px, giả lập DOM) ở `/en` → **−3.4px** (đè).
  - Sau fix: `/` CTA 141.8px, nav cách logo/tìm **24.6px** mỗi bên; `/en` CTA 126.2px, **27.4px** mỗi bên; `rowScrollW = clientWidth = 1265`, `docScrollW = 1265` (không cuộn ngang). Tổ hợp xấu nhất (logo bị chặn 96px + CTA bị chặn 160px có dấu "…", `text-overflow: ellipsis`): `/` **13.7px**, `/en` **8.6px** mỗi bên (≥ 0, không chồng, kiểm bằng `getBoundingClientRect`).
  - 768×1024 (`clientWidth` 753) có CTA: header 64px, logo lệch tâm `/` **−2.6px**, `/en` **0px** (cụm trái 296.8–299.4px, cụm phải 299.4–302px); không cuộn ngang → MINOR-1 không cần cân thêm.
- Verify: `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 227/228 file (2437/2438) — fail duy nhất `job-applications.test.ts` "vị trí hết hạn → 400" đã fail sẵn · `pnpm build` PASS.
- MINOR-2 (đổi file media logo có thể lệch tới 60s theo cache `global:site-settings`): không sửa, ghi residual.

## Doc impact / Reconcile
- Intent (user duyệt 2026-10-19): `.context/design-spec.md` §2.1 (1 hàng ≥ xl, Logo, Nút CTA), §2.2, §2.4; `SPECIFICATIONS.md` đoạn "Khung trang".
- As-built: `docs/ARCHITECTURE.md` bullet layer-5-task-05 (khung trang) thêm BL-001. Không đổi schema/ERD (dùng `header.ctaButton`, `site-settings.logo/logoDark` đã có), không đổi API.
- `docs/DESIGN.md` §Header ("Desktop ≥ 1280px có thể hiện menu ngang") không mâu thuẫn — không sửa.
- Spec publish: spec_version 1.3.0 → 1.4.0 (MINOR), `spec/updates/2026-10-19-header-footer-design-debt.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` scopeVersion 3 (trigger feature-update, cập nhật files ở close-out task-02).

## Review
- Round 1 STRICT **FAIL** — `.context/review-reports/feature-header-footer-design-debt-phase-1-task-01-round-1-review.md` (MAJOR-1 tràn 1280: logo CMS + CTA không giới hạn rộng; MINOR-1 lệch tâm 768 chưa đo; MINOR-2 cache logo 60s).
- Round 2 STRICT **PASS** — `.context/review-reports/feature-header-footer-design-debt-phase-1-task-01-round-2-review.md` (0 CRITICAL/MAJOR; 2 MINOR: số đo tổ hợp xấu nhất dùng DOM giả lập; nhãn menu CMS không giới hạn rộng — rủi ro có từ trước).
- Acceptance: PASS. Reviewer verify: lint/typecheck PASS, `src/components/layout` 82/82, `pnpm test` 2437/2438 (fail sẵn job-applications).

## Residual risk
- Nhãn 7 mục menu lấy từ CMS không giới hạn rộng: menu CMS nhãn dài hơn menu cố định có thể chồng ở 1280 (rủi ro có từ L5-T05 MINOR-2; tách task nếu admin đổi nhãn dài).
- Đổi file media logo mà không lưu lại `site-settings` → URL cũ có thể lệch tới 60s (cache `global:site-settings`, trong ngưỡng ≤ 1 phút).
- Số đo tổ hợp xấu nhất (logo 3:1 + CTA 160px) dùng DOM giả lập, không phải logo upload thật; CTA thật đo trên dev DB rồi khôi phục.
- Chưa kiểm trên Windows có thanh cuộn 17px thật (đo emulation 15px; tính tay vẫn ≥ 6px).
