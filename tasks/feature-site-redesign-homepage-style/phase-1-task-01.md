# feature-site-redesign-homepage-style · phase-1-task-01 — Nền tảng A: schema chữ hero + migration, PageHero 2 cỡ, breadcrumb trên ảnh (token), khung trang danh sách, phân trang tròn, banner tư vấn dùng chung (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BACKLOG BL-045). Spec delta: `SPECIFICATIONS.md` khối "Giao diện toàn site theo phong cách trang chủ mới (BL-045…)".
- **Mockup bắt buộc Read trước khi code:** `docs/specs/site-redesign-mockup/index.html` (CSS `.phero`, `.phero.short`, `.crumb.glass`, `.crumb.plain`, `.fcard`, `.toolbar`, `.pager`, `.cta`, `.shead.left`) + `docs/specs/site-redesign-mockup/DECISIONS.md` #1. Chạy mockup: `site-mockup` trong `.claude/launch.json` (port 4600).
- Phụ thuộc: không. **Song song được với T02** (và T00 nếu có) — không trùng file.
- Trạng thái: `built, cho review` (builder xong 2026-10-21; truoc do `pending`) — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user (không thương lượng)
- Bố cục đúng mockup; màu/token/font Montserrat/element giữ nguyên (`skills/react-nodejs/design-tokens.md`, `src/app/(frontend)/globals.css`). Không hex mới (`src/components/ui/no-raw-colors.test.ts` là gate). Ngoại lệ duy nhất: token breadcrumb (DECISIONS #1).
- Chỗ buộc lệch mockup → ghi "Lệch so với mockup + lý do" trong report.

## Classification / Risk
- Type: **MODIFY** (khung trang con) + ADDITIVE (field chữ hero, ảnh Liên hệ/Pháp lý, cờ dải Điểm mạnh).
- Risk: **HIGH** — schema global `site-settings` + migration versioned (additive), component dùng chung mọi trang con (`Breadcrumb` + JSON-LD, `CategoryListTemplate`, `Pagination`), SEO 1 `h1`.
- Expected review level: **STRICT**.
- Blast radius: mọi trang danh sách / danh mục / Liên hệ / Pháp lý / Dịch vụ / 404 (dùng `PageBanner`); admin tab "Ảnh banner"; `src/payload-types.ts` regen.
- Doc impact: `docs/ERD.md` (site-settings), design-spec §2.6/§2.7 — reconcile ở T08.
- Decision impact: thay "banner 240px căn giữa" (BL-020 P3 / FR-ADM-20) bằng hero chữ trái 2 cỡ.

## Scope / files
1. **Schema** `src/globals/SiteSettings.ts` tab "Ảnh banner": group `pageBanners` đổi nhãn "Ảnh banner trang con", **thêm** `contact`, `legal` (upload, không localized). Group mới `pageHeroes` (localized text): mỗi khoá `projects`, `rentals`, `news`, `propertyPosts`, `careers`, `contact` có `eyebrow` (text), `title` (text), `titleAccent` (text, "Dòng 2 tiêu đề, màu vàng"), `description` (textarea, ≤ 2 dòng). Cờ `showProjectStrengths` (checkbox, mặc định `true`, "Hiện dải Điểm mạnh ở trang Dự án"). **`careersPerks`** (Q9; array minRows 2 maxRows 6, label "Dải ý trang Tuyển dụng": `icon` select `STRENGTH_ICONS` của BL-044, `title` text localized bắt buộc, `description` text localized) — cùng migration này. View `loadCareersPerks(locale)`: `/en` bỏ mục thiếu `title` EN, < 2 mục → null.
2. **Migration**: `pnpm payload migrate:create site_redesign_page_heroes` → chỉ ADD COLUMN / CREATE TABLE (locales), kiểm không DROP / đổi type / SET NOT NULL; có lệnh destructive → dừng, báo `HIGH_RISK_MIGRATION`. `pnpm payload migrate` dev DB; regen `src/payload-types.ts` (chỉ thêm phần của mình — file có thể dirty việc khác).
3. **View** `src/lib/content/page-banner.ts` + `load-page-banner.ts`: `loadPageHero(locale, key)` → `{ image, eyebrow, title, titleAccent, description }`, chữ trống → i18n mặc định hiện tại (`page.<x>.title/description`), ảnh: riêng → mặc định → null. Test fallback vi/en.
4. **`PageHero`** mới `src/components/layout/PageHero.tsx` (Server Component), thay dần `PageBanner`: `size="list"` (440px, < md 360px) | `"short"` (340px, < md 280px), chiều cao cố định; ảnh `priority` decorative + scrim token (`bg-banner-scrim` / overlay sẵn có); chữ canh trái `max-w-container px-gutter`: eyebrow (`--text-eyebrow`, `text-primary`) → `h1` (dòng 1 + `<span class="block text-primary">` dòng 2) → mô tả `line-clamp-2`; slot `breadcrumb` góc trên-trái (dưới `--header-offset`); slot `overlap` chừa đáy cho thẻ lọc. Không ảnh → nền `bg-dark-deep` cùng chiều cao. `PageBanner` giữ cho 404 (không đổi hành vi 404).
5. **Breadcrumb** `src/components/layout/Breadcrumb.tsx`: prop `variant="overlay" | "plain"` (mặc định giữ kiểu cũ cho trang chưa chuyển). Overlay: `ol` trong khung `inline-flex rounded-full` chỉ bao chữ, nền `color-mix(in srgb, var(--color-primary-deep) 13%, transparent)`, `backdrop-filter: blur(var(--blur-breadcrumb))`, chữ `text-on-dark` + bóng chữ nhẹ (utility mới trong `globals.css`, không hex), ngăn `›` (`aria-hidden`); plain: chữ muted, ngăn `›`. Giữ JSON-LD, `aria-current`, "← mục cha" < md. **Token** `--blur-breadcrumb: 4px` + utility `.crumb-glass` trong `src/app/(frontend)/globals.css` (+ `skills/react-nodejs/design-tokens.md`). Fallback không `backdrop-filter` → nền giữ 13% + scrim đầu ảnh.
6. **Khung danh sách** `src/components/templates/CategoryListTemplate.tsx`: dùng `PageHero size="list"` (hoặc `short` khi không có thẻ lọc — Tin tức danh mục) + breadcrumb overlay trong hero; slot `filterCard` (thẻ trắng nổi `rounded-[20px] bg-surface shadow-md`, `-mt-*` đè đáy hero, như `.fcard`); hàng kết quả `toolbar` (trái "N kết quả", phải sắp xếp); chip hàng 2 nằm **trong** thẻ lọc khi có `filterCard` (prop), ngoài thẻ khi không; `belowContent` + `consultBanner`. Giữ `ListPendingProvider`/`PendingRegion`/EmptyState/props cũ để T03/T06 chuyển trang dần (không phá trang chưa chuyển trong wave B).
7. **Pagination** `src/components/layout/Pagination.tsx`: mũi tên tròn (`SliderArrow`-style, link có `aria-label`) hai bên + số trang giữa, trang hiện tại `aria-current="page"` nền `--color-primary`; logic `buildHref`/ẩn khi 1 trang giữ nguyên.
8. **Đầu khối** `src/components/layout/SectionHeading.tsx` (mới, nếu trang chủ chưa có bản dùng chung): eyebrow + `h2` (phần nhấn `text-accent-text` trên nền sáng) + mô tả, **canh trái**; `as` heading level.
9. **Banner tư vấn dùng chung** `src/components/layout/ConsultBanner.tsx` (Server): đọc `homepage.ctaBanner` ở locale (không xét `enabled`/`blockOrder`), render bằng `src/components/home/CtaBanner.tsx` (chữ trái, BL-044); thiếu chữ → i18n `page.cta.*` mặc định, nút → `/lien-he` (prop `actionHref` để chi tiết dự án truyền `#lead-form`); thiếu ảnh → nền tối token. Cache theo tag homepage hiện có.
10. **i18n** `src/i18n/messages/vi.json` + `en.json`: tạo sẵn key chung `page.hero.*`, `page.breadcrumb.*` mới, `page.pagination.*` (nếu thiếu), `page.consult.*`, `page.listing.{resultCount,sortLabel,moreOptions}` — task sau thêm key namespace riêng của mình.
11. **Tests**: `PageHero.test.tsx` (2 cỡ, 1 `h1`, titleAccent span, không ảnh), `Breadcrumb.test.tsx` (overlay/plain, `›`, JSON-LD không đổi), `page-banner.test.ts` (fallback), `Pagination.test.tsx`, `ConsultBanner.test.tsx`, `src/lib/contrast.test.ts` thêm cặp chữ trắng / nền breadcrumb trên ảnh sáng giả lập (≥ 4.5:1 với scrim), `no-raw-colors.test` PASS. Cập nhật test cũ của `CategoryListTemplate`/`PageBanner` nếu đổi DOM.

## Acceptance
- [ ] Admin tab "Ảnh banner": nhóm ảnh có Liên hệ + Pháp lý; nhóm chữ hero 6 trang (Dự án, Cho thuê, Tin tức, Đăng tin BĐS, Tuyển dụng, Liên hệ) + `careersPerks` nhập được vi + en; cờ Điểm mạnh `/du-an`; lưu không lỗi (Local API + REST như BL-044 T01).
- [ ] Migration additive, `pnpm payload migrate` PASS, không `HIGH_RISK_MIGRATION`.
- [ ] Trang dùng `CategoryListTemplate` (vd `/cho-thue/danh-muc/<slug>`, `/tin-tuc/danh-muc/<slug>`) đã lên `PageHero` + breadcrumb overlay + phân trang tròn: **so khớp `.phero` / `.crumb.glass` / `.pager` mockup ở 1440 + 390** (thẻ lọc / thẻ bài làm ở T03 / T06 — chưa cần khớp).
- [ ] Breadcrumb overlay: khung chỉ bao chữ, nền `#c9a15f21` (qua `color-mix`), blur 4px, chữ trắng, ngăn `›`, AA ≥ 4.5:1 trên ảnh sáng (có evidence).
- [ ] JSON-LD `BreadcrumbList` giữ nguyên trên mọi trang; trang chưa chuyển không đổi giao diện.
- [ ] Không hex/kiểu mới ngoài token breadcrumb; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify (lệnh từ `.context/project-config.md`)
`pnpm vitest run src/components/layout src/components/templates src/lib/content src/lib/contrast.test.ts src/components/ui` → `pnpm typecheck` → `pnpm lint` → `pnpm payload migrate` (dev DB) → xem thật http://localhost:3000 (dev server đang chạy, **không** chạy thêm `pnpm dev`) 1440 + 390, chụp màn hình đặt cạnh mockup (`.context/review-reports/assets/site-redesign-t01-*.png`).

## Retry / Escalation
Attempt 1 fail → `.agent/error-analyzer.md`, root cause lại, fix tối thiểu. Attempt 2 fail → so pattern đang chạy (`PageBanner`, `HeroSlider` BL-044, `Breadcrumb`), kiểm assumption. Attempt 3 fail → **không fix #4**, status `architecture_review_needed`, ghi blocker/residual/evidence, hỏi human. Mỗi fail append `.context/error-memory.md`.

## Verification summary (builder điền)
- Acceptance criteria: PASS|FAIL|BLOCKED
- Verify commands + result:
- Lệch so với mockup + lý do:
- Reviewer verdict:

## Builder notes (2026-10-21) - quyet dinh tu chon
- Worktree D:/prj/bds/.claude/worktrees/agent-a9d080d1055325786 (branch worktree-agent-a9d080d1055325786; da ff-merge len staging 9e96cbf vi cat tu commit cu hon). DB rieng tami_wt_bl045_t01. Migration migrations/20261020_183923_site_redesign_page_heroes.ts: up chi ADD COLUMN / CREATE TABLE / CREATE TYPE / FK / INDEX (DROP chi o down) - khong HIGH_RISK_MIGRATION.
- Header trang con nam TRONG luong (nhu mockup .hdr sticky phia tren hero) nen hero KHONG keo len duoi header; breadcrumb top-5 (20px) trong hero.
- Scrim hero = bg-banner-scrim phang + gradient trai from-banner-scrim to-transparent (khop mockup toi o phia chu; deu token) -> eyebrow vang/breadcrumb dat AA tren anh trang (contrast.test.ts).
- The loc .fcard dung shadow-lg theo mockup (task ghi shadow-md); day hero chua 120px (md)/96px, the keo -mt-[84px]/-mt-14 dung mockup.
- searchBar cu (ProjectListPage chua chuyen) giu prop, render o cung vi tri de hero (data-search-overlay); compactBanner giu @deprecated khong con tac dung de 4 trang goi khong vo kieu - T03/T06 bo.
- Hero co tu chon: co filterCard/searchBar -> list 440px; khong -> short 340px. Chu hero admin (loadPageHero) CHUA noi vao cac trang (task sau noi); template nhan eyebrow/titleAccent san.
- Breadcrumb overlay cao 44px (link min-h-11 de cham >= 44px), cao hon mockup ~38px.
- Pagination: mobile giu "< Trang n/N >" (mui ten tron 2 ben); tu md so tron 44px (mockup 40px), trang hien tai bg-primary (theo task; mockup dung nen dark).
- SectionHeading tao moi. ConsultBanner nhan locale (+ actionHref); buildCtaBannerView export tu home-view.ts (toCta -> export, title doc truc tiep ctaBanner.title).
- TRANSLATABLE_FIELDS["site-settings"] them pageHeroes, careersPerks (test buoc khop field localized that).
- i18n: chi them key thuc dung page.consult.{title,description}, page.listing.{resultCount,sortLabel,moreOptions}; KHONG tao page.hero.* / page.breadcrumb.* moi (chua co cho dung).
- Sua 6 assertion DOM banner cu trong test trang (JobList/NewsList/PostList/ProjectList) sang data-hero-size.

## Verification summary (builder)
- Acceptance criteria: PASS (schema/migration/integration; hero + breadcrumb + pager tren trang dung CategoryListTemplate; JSON-LD giu nguyen; token) - the loc / the bai cho T03/T06.
- Verify: pnpm typecheck PASS; pnpm lint 0 error (2 warning cu tools/task-dashboard); pnpm test PASS tru 3 file integration (access, jobs-email, media-upload) timeout beforeAll khi chay song song toan bo - chay rieng 3 file: 50/50 PASS; pnpm payload migrate tren DB rieng PASS; integration globals.test.ts 30/30 (them 2 test chu hero vi/en, careersPerks, co, anh Lien he/Phap ly).
- Evidence: .context/review-reports/assets/site-redesign-t01-{news-category-1440.png,news-category-390.jpg,projects-hero-1440.png,pager-1440.png}; khong h-scroll o 390.
- Reviewer verdict: (cho review)
