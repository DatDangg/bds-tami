# feature-public-ui-market-vinhomes · phase-2-task-02 — Thanh thông báo + hero + ô tìm kiếm đè đáy hero

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT FAIL r1 (vị trí thanh) → PASS r2 code nhưng build route ● → ƒ → PASS r3
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI · ảnh hưởng LCP trang chủ → STRICT.

## Việc
- `AnnouncementBar` phía trên header: đóng được, nhớ theo hash nội dung (localStorage trong try/catch); chiều cao cố định, không CLS (builder chọn cách ẩn khi đã đóng, ghi decision log).
- HeroSlider: typography serif viết thường (theo P1), nút cuộn xuống.
- `HeroSearch`: ô tìm kiếm đè đáy hero (tab Cho thuê / Dự án → form GET tới `/cho-thue` hoặc `/du-an` dùng param từ khoá **hiện có**), chip "Dự án được quan tâm" link tới chi tiết dự án. Mobile: khối nằm dưới hero, chip vuốt ngang.
- Test component + URL param đúng; ảnh hero vẫn `priority`.

## Acceptance
- [ ] Thanh thông báo bật/tắt/chữ/link từ CMS, đóng được, VI/EN
- [ ] Tìm kiếm dùng URL param hiện có; chip từ CMS hoặc fallback nổi bật; không CLS, LCP không xấu đi


## Decision log (builder)
- Thanh thông báo nằm TRONG hero (`HeroSlider` nhận `children`), `absolute top-(--header-offset)`: không chiếm chỗ trong luồng → hiện/đóng CLS = 0, `--header-offset` và `-mt` của hero không đổi. Nền `--color-primary` + chữ `--color-primary-foreground` (không phụ thuộc ảnh hero). Hệ quả chấp nhận: trang chủ không có slide hero thì không hiện thanh (và không hiện ô tìm kiếm); thanh cuộn đi cùng hero, không dính.
- Chống nháy cho người đã đóng: HTML server luôn có thanh + `data-announcement-hash`; `<script>` inline ngay trong thanh (chạy lúc parse, trước paint) đặt `display:none` nếu `localStorage[tami:announcement-dismissed]` = hash; state React dùng `useSyncExternalStore` (server `false`, client đọc localStorage trong try/catch, nghe `storage` để đồng bộ tab) + `suppressHydrationWarning`. localStorage bị chặn → đóng chỉ trong phiên. Hash = djb2 của `text\nhref` (`src/lib/home/announcement-hash.ts`, dùng cả server/client).
- Hiện thanh khi: `enabled === true` (mặc định tắt) + chữ không trống (`/en` thiếu chữ EN → ẩn, global đọc `fallbackLocale: false`). Link qua `resolveNavLink` (sai → chỉ chữ; http(s) → tab mới `noopener`).
- `/du-an` KHÔNG có tham số từ khoá (chỉ `category/province/status/page`), `/cho-thue` dùng `q` (tối đa 100 ký tự theo `rentalSearchParamsSchema`). Quyết định: tab "Cho thuê" = form GET `?q=` → `/cho-thue`; tab "Dự án" không có ô nhập, chỉ lời dẫn + nút "Xem tất cả dự án" → `/du-an` (không thêm tham số mới). Chip là lối vào chi tiết dự án.
- Không JS: HTML server dựng sẵn tab Cho thuê (form GET hoạt động); nút tab Dự án cần JS (không JS thì bấm không đổi; lối vào dự án vẫn có chip + menu). Tablist ARIA đầy đủ (roving tabindex, mũi tên trái/phải).
- Vị trí ô tìm kiếm: sibling ngay sau hero trong `HomeBlocks`, `md:-mt-24` đè đáy hero (thẻ `pointer-events-auto`, vùng trong suốt `pointer-events-none`); < md nằm dưới hero. Hero nhận `overlapsSearch` (đệm dưới `md:pb-52`, nhóm chấm/Dừng + nút cuộn `md:bottom-28`) và `hasAnnouncement` (đệm trên +4.5rem).
- Nút cuộn xuống (chưa có trước đó): icon `ArrowDown` (thêm vào `icons.ts`), 44px, từ `sm`; `window.scrollTo` tới đáy hero trừ chiều cao `.site-header`, `behavior: auto` khi reduced-motion. Ghi đè dòng "không scroll cue" trong design-spec (cập nhật docs).
- Dữ liệu: `HomeView` thêm `announcement`, `heroSearch` (placeholder, `rentalsHref`/`projectsHref` đã bản địa hoá, chips); `HomeDocs.chipProjects` nạp trong `loadHomeDocs` song song, chỉ khi hero có slide và `heroSearch.enabled !== false`, select `{title, slug}`; chọn tay đọc như khách (published, `/en` chỉ bản có EN) theo thứ tự admin, ≤ 6; không còn bản ghi nào công khai → rơi về `isFeatured` mới nhất. Dùng chung đường cache/tag của homepage; không fetch client; ảnh slide 1 vẫn `priority`.
- i18n: `page.home.hero.scrollDown`, `page.home.announcement.{label,close}`, `page.home.search.*` (VI/EN); placeholder CMS trước, trống thì chuỗi mặc định.
- Docs: design-spec S01 (bảng khối, hero, 1a thanh thông báo, 1b ô tìm kiếm + chip, checklist), DESIGN.md Component Library (Hero Slider, Announcement Bar, Hero Search). Không đụng spec/BACKLOG/progress/runs; không đổi schema.

## Verification summary (builder)
- `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard) · `pnpm typecheck` PASS · `vitest run src/components src/lib src/i18n src/app` 173 file / 1707 PASS · `pnpm test` 266 file / 2794 PASS (DB `tami_wt_bl020`). `pnpm build` bỏ qua (theo yêu cầu).
- Test mới: `AnnouncementBar.test` (hash, đóng/nhớ/đổi nội dung hiện lại, localStorage throw, script + khoá, EN, link ngoài), `HeroSearch.test` (form GET action/`q`, đúng 1 field có name, EN, placeholder, tablist + phím, chip + fallback ẩn hàng), `HeroSlider.test` (nút cuộn mượt/reduced-motion, children ngoài aria-live, ảnh `fetchpriority=high`), `home-view.test` (thanh thông báo bật/tắt/EN/link/hash; heroSearch placeholder/href/chip), `home-queries.test` (chip chọn tay/fallback/không truy vấn), `HomeBlocks.test` (thanh trong hero, ô tìm kiếm đứng sau hero, EN, tắt).
- CHƯA kiểm bằng trình duyệt: không đo CLS/LCP thật, chưa xem 375/768/1280 (bố cục đè đáy hero md, chip vuốt ngang, nút cuộn vs chấm ở 640-767px, nội dung slide với 3 dòng tiêu đề khi có thanh) — residual risk cho reviewer/primary. Script inline + `suppressHydrationWarning` chỉ kiểm bằng jsdom (không chạy script lúc parse).

## Round 2 fixes (builder) — sau reviewer round 1 FAIL
- MAJOR 1: thanh thông báo chuyển lên TRÊN header, phần tử trong luồng. Cách làm: slot song song `src/app/(frontend)/[locale]/@banner/` (`page.tsx` cho `/` · `/en` đọc `loadAnnouncement(locale)` rồi render `AnnouncementBar`; `[...rest]/page.tsx` + `default.tsx` trả `null`). Layout nhận prop `banner` → `PublicDocument` → `PublicShell` render `{banner}` giữa skip link và `Header` (skip link vẫn focus đầu tiên). Lý do chọn slot: layout dùng chung không biết route (đọc pathname/headers sẽ phá ISR); catch-all bắt buộc, nếu không điều hướng client `/` → trang khác giữ lại thanh cũ. Chi phí: route khác `/` không truy vấn gì; `/` đọc global `homepage` qua cache tag đã có (cùng nguồn với trang chủ) → 0 truy vấn DB thêm. `announcement` bị bỏ khỏi `HomeView` (`buildAnnouncementView` export riêng); `HeroSlider` bỏ `children`/`hasAnnouncement`/padding 4.5rem; hero vẫn chỉ `-mt-(--header-offset)` nên offset không đổi. Hiện kể cả khi hero không có slide. `resolve-missing-page.test` bỏ qua thư mục slot `@…` khi duyệt route động (slot không tạo URL).
- Bố cục thanh: dải full-width `bg-primary`, `min-h-11` (chữ dài xuống dòng, chiều cao do HTML server quyết định → không CLS tải trang), nội dung trong `max-w-container`. Người đã đóng: script inline giấu trước paint (chưa vẽ nên không dịch chuyển). Bấm đóng dịch nội dung lên (user-initiated, không tính CLS).
- MINOR 2: nút cuộn nhắm `[data-hero-search]` kế sau hero (`scrollIntoView`, section có `scroll-mt-(--header-offset)`); không có ô tìm kiếm thì tới đáy hero − header như cũ.
- MINOR 3: tab Dự án = form GET → `/du-an` với đúng `province` (slug, từ `listProvinces` — loader như `/du-an`) + `status` (3 giá trị tĩnh) bằng `OptionSelect progressive`; nhãn dùng chuỗi `page.projects.*`; bỏ khoá `search.projectsHint`/`viewAllProjects`. Chi phí: +1 truy vấn `provinces.find` (nhỏ, không cache riêng) mỗi lần ISR dựng lại trang chủ (≤ 1 lần/60s/ngôn ngữ), chạy song song, chỉ khi có hero + ô tìm kiếm bật. Không fetch client. Chip giữ nguyên.
- MINOR 4: khoá localStorage theo ngôn ngữ `tami:announcement-dismissed:<locale>` (`announcementDismissedKey`).
- MINOR 5: Home/End trong tablist. MINOR 6: chú thích → S01.1b. MINOR 7: `<script>` chỉ dựng ở lượt render server/hydrate đầu (`useSyncExternalStore` snapshot server `true`, client `false`) nên điều hướng client không dựng script (hết lỗi dev React 19); có chú thích lý do.
- Docs: design-spec (bảng khối thêm dòng 0, hero scroll, 1a vị trí trên cùng, 1b form Dự án) + DESIGN.md (Announcement Bar, Hero Search) viết lại theo vị trí/hành vi mới.

### Verification summary (round 2)
- `pnpm lint` 0 error (2 warning cũ) · `pnpm typecheck` PASS · `vitest run src/components src/lib src/i18n src/app` 174 file / 1718 PASS · `pnpm test` 267 file / 2805 PASS.
- Test mới/đổi: `@banner/page.test` (slot: có thanh/null/locale lạ/route khác), `PublicShell.test` (banner trên header, skip link đầu), `AnnouncementBar.test` (khoá theo locale, script chỉ ở HTML server qua `renderToString`, trong luồng), `HeroSearch.test` (form Dự án chỉ `province`+`status`, select gốc ở HTML server, Home/End, `data-hero-search`), `HeroSlider.test` (scrollIntoView), `home-view.test`/`home-queries.test` (provinces, 1 truy vấn).
- CHƯA kiểm: slot song song chưa chạy trong Next thật (build/dev lỗi ở path `.claude/worktrees`; chỉ typecheck + unit) → primary cần build và xem `/`, `/en`, điều hướng client `/` → `/du-an` (thanh phải biến mất), tải cứng `/du-an`, ISR/header sticky dưới thanh, CLS/LCP, 375/768/1280.

## Round 3 fixes (builder) — bỏ slot `@banner`
- Lý do: build route table của primary cho thấy slot song song + catch-all `[...rest]` đổi `/[locale]/chinh-sach-bao-mat, cho-thue, dieu-khoan-su-dung, du-an, lien-he, tin-bds, tin-tuc, tuyen-dung`… từ ● (SSG/ISR) sang ƒ (dynamic) → phá ISR/NFR-01. Đã xoá `src/app/(frontend)/[locale]/@banner/**`, prop `banner` ở layout/`PublicDocument`/`PublicShell`, và bỏ phần bỏ-qua thư mục `@` trong `resolve-missing-page.test.ts` (không còn cần).
- Cách mới: `loadShell` đọc thêm `getHomepage(locale)` (cùng bản `unstable_cache`, tag `global:homepage`, không truy vấn mới; loader trả cả global nên không chọn riêng trường — dùng chung entry cache với trang chủ) qua `readOrNull`, dựng `shell.announcement` bằng `buildAnnouncementView` → `PublicShell` render `HomeAnnouncementBar` (client, `usePathname` của next-intl = `"/"` cho cả `/` và `/en`) giữa skip link và `Header`. Component client dùng `usePathname` vẫn SSR/tĩnh nên route giữ ISR; ở trang khác trả `null` (HTML cache không có thanh). Tag `global:homepage` được hook `revalidate-global` làm mới ⇒ cả HTML đã cache của `/` lẫn các trang khác (layout dùng chung) cập nhật khi lưu homepage. `loadAnnouncement` (slot) bị xoá. Giữ nguyên: script trước paint chỉ ở lượt server/hydrate đầu, khoá localStorage theo locale, skip link vẫn đầu, header dính dưới thanh, hero `-mt-(--header-offset)` không đổi.
- Reviewer r2 MINOR 1: layout trả lại một dòng `<PublicDocument locale={locale}>{children}</PublicDocument>`. MINOR 2: KHÔNG làm — `listProvinces` dùng chung bởi 4 trang (Dự án, Cho thuê, Tuyển dụng, trang chủ) và kiểu trả về `Province[]`; thu hẹp `select` đổi kiểu của cả 4 nơi, không "tầm thường" (chi phí: 1 truy vấn nhỏ/lần ISR, đã ghi ở round 2).
- Chưa có test cho `loadShell` (module server-only, không có test sẵn); logic ghép chỉ là `getHomepage` + `buildAnnouncementView` (đã test). Primary rebuild để so route table; kiểm `/`, `/en`, điều hướng client `/` ↔ `/du-an`.

### Verification summary (round 3)
- `pnpm lint` 0 error (2 warning cũ) · `pnpm typecheck` PASS · `vitest run src/components src/lib src/i18n src/app` 173 file / 1720 PASS. Test: `PublicShell.test` (bar trên header + skip link đầu; /en hiện; `/du-an`, `/cho-thue`, `/en/projects` không hiện; announcement null không dựng). Không chạy `pnpm build`.
