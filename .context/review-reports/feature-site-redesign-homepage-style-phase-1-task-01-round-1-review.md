Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-01 · round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-a9d080d1055325786` (branch `worktree-agent-a9d080d1055325786`, chưa commit). Base xác nhận `git -C <wt> log -1` = `9e96cbf`.
- Diff: 24 file sửa (+594/-84) + untracked: migration `.ts/.json`, `PageHero`, `ConsultBanner`, `SectionHeading` (+ test), `src/globals/site-settings/page-heroes.ts`, `careers-perks(.test).ts`, `load-careers-perks.ts`.

## Review level
**STRICT**

## Reason
Schema global `site-settings` + migration versioned; component dùng chung mọi trang con (`Breadcrumb` + JSON-LD, `Pagination`, `CategoryListTemplate`); SEO (1 `h1`, LCP ảnh hero); i18n vi/en; translation leaves.

## Blast radius
- DB: `site_settings` (+3 cột), `site_settings_locales` (+24 cột), bảng mới `site_settings_careers_perks(_locales)`, enum mới. `src/payload-types.ts` (chỉ khối `SiteSetting` / `SiteSettingsSelect`, đã kiểm hunk).
- UI: mọi trang dùng `CategoryListTemplate` (`/du-an`, `/cho-thue/...`, `/tin-tuc` + danh mục, `/tin-bds`, `/tuyen-dung`): banner cũ → `PageHero`, breadcrumb chuyển vào hero (overlay). `Pagination` đổi giao diện ở mọi danh sách. `Breadcrumb` mặc định (trang chưa chuyển) giữ nguyên class/caret.
- `home-view.ts`: `toCta` → `buildCtaBannerView` (export). Đã đối chiếu `titleOf(homepage,"ctaBanner")` = `text(homepage.ctaBanner.title)` → tương đương, trang chủ không đổi hành vi.
- Translation tool: `TRANSLATABLE_FIELDS["site-settings"]` thêm `pageHeroes`, `careersPerks`.
- Admin: tab "Ảnh banner" đổi nhãn + thêm nhóm.

## Verify commands + result (chạy trong worktree, `.env.local` → DB `tami_wt_bl045_t01`)
| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm test` (lần 1) | PASS (exit 0) |
| `pnpm test` (lần 2, log đầy đủ) | 305/309 file PASS, 3180 test PASS / 55 skip; 4 file FAIL = `access`, `jobs-email`, `media-upload`, `session-refresh` — tất cả `Hook timed out in 10000ms` ở `beforeAll` (khởi tạo DB khi chạy song song), không liên quan diff |
| `pnpm test` 4 file trên + `tests/integration/globals.test.ts` chạy riêng | 5/5 file, 85/85 test PASS |
| `pnpm payload migrate` | Không chạy (reviewer không chạy migrate). Builder báo PASS trên DB riêng; integration `globals.test.ts` (đọc/ghi cột mới) PASS trên DB đó → gián tiếp xác nhận đã apply |
| `pnpm build` | skip (không bắt buộc cho task; ngoài budget) |

Kết luận flaky: xác nhận lời builder — integration timeout chỉ khi chạy song song toàn bộ, chạy riêng PASS. (Builder ghi 3 file; lần chạy của reviewer là 4 file, cùng nguyên nhân.)

## Migration gate (`migrations/20261020_183923_site_redesign_page_heroes.ts`)
- `up`: chỉ `CREATE TYPE`, `CREATE TABLE`, `ADD COLUMN` (nullable / `boolean DEFAULT true`), `ADD CONSTRAINT FK` (bảng mới + cột mới nullable `ON DELETE set null`), `CREATE INDEX`. Không DROP / đổi type / SET NOT NULL trên dữ liệu cũ. `NOT NULL` chỉ ở bảng mới tạo (rỗng) → an toàn. **Không HIGH_RISK_MIGRATION.**
- `down`: DROP đúng các đối tượng đã tạo, thứ tự hợp lệ (bảng con CASCADE → constraint → index → cột → type).
- Thứ tự: `20261020_183923` sau migration mới nhất trên staging `20261020_103248_homepage_redesign`; T00 (e07a160) không có migration. `migrations/index.ts` thêm cuối mảng đúng.
- `payload-types.ts`: chỉ 1 dòng mô tả đổi + 2 hunk thêm trong `SiteSetting`/`SiteSettingsSelect` — khớp schema.

## Kiểm tra theo yêu cầu
- **1 `h1`/trang**: `PageHero` render đúng 1 `h1` (title + `span.block` accent); template không còn `PageBanner`; test `CategoryListTemplate` khẳng định 1 `h1`. OK.
- **JSON-LD BreadcrumbList**: logic JSON-LD trong `Breadcrumb.tsx` không đổi; test overlay khẳng định `itemListElement` 4 mục. OK.
- **AA tương phản**: `contrast.test.ts` thêm 2 case (chữ trắng trên khung 13% `primary-deep` đè scrim phẳng trên ảnh trắng; eyebrow `--color-primary` trên scrim + gradient). Tính tay: nền ≈ rgb(120,116,110) → trắng ≈ 4.7:1 (≥ 4.5, biên mỏng nhưng giả định ảnh trắng tinh là xấu nhất; có thêm text-shadow). PASS trong suite.
- **Không hex/kiểu tự chế**: không hex mới; token `--blur-breadcrumb` + `.crumb-glass` đúng DECISIONS #1 (`color-mix` 13%, blur 4px, chữ `text-on-dark`, ngăn `›`, fallback `@supports`, `prefers-reduced-transparency`). Ghi chú MINOR-2 (rgb literal trong text-shadow).
- **i18n vi/en**: `page.consult.*`, `page.listing.*` thêm cả 2 file, plural EN đúng; test en "1 result". `loadPageHero` fallback i18n theo namespace; `/en` không rơi về vi (integration test). OK.
- **Fallback thiếu ảnh/chữ**: không ảnh → `bg-dark-deep` cùng chiều cao (test JobList/ProjectList); chữ trống/khoảng trắng → mặc định (unit test); global lỗi → log + mặc định (`loadPageHero`, `ConsultBanner`, `loadCareersPerks`). OK.
- **4 trang danh sách chưa chuyển (T03/T06)**: vẫn compile (prop `compactBanner` giữ `@deprecated`, `searchBar` vẫn render ở vị trí đè hero); test trang cập nhật sang `data-hero-size` và PASS. Giao diện đổi sang hero mới là chủ đích (acceptance #3). OK.
- **Conflict với staging e07a160 (T00)**: file chung duy nhất `src/components/projects/ProjectListPage.test.tsx`. Hunk T00 ở base L68 và L246–251; hunk T01 ở base L127–136 và L262–267 → không chồng, merge 3-way dự kiến sạch. `ProjectListPage.tsx` (T00 sửa) vẫn truyền `compactBanner searchBar` — tương thích kiểu mới. Rủi ro thấp; dispatcher nên chạy lại `pnpm vitest run src/components/projects` sau merge.

## Responsive Checklist Gate (diff đụng UI; 375 / 768 / 1280; không có browser → CSS math + ảnh builder)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Hero `w-full`, nội dung `max-w-container px-gutter`; breadcrumb `nav w-fit max-w-full` + `ol flex-wrap max-w-full` → trail dài xuống dòng trong pill; >3 mục < md chỉ hiện "← mục cha". Pagination < md chỉ 2 mũi tên + "Trang n/N". Ảnh `news-category-390.jpg` có vẻ bị crop (logo header lệch phải) → xem Residual risk |
| Mobile-first `min-width` | OK | Mọi biến thể dùng `md:` (min-width) |
| Grid auto-fit/minmax | N/A | Diff không thêm grid |
| Container không fixed px | OK | Width theo `max-w-container`; chiều cao hero cố định px là theo spec (không CLS) |
| Font-size rem / heading fluid | OK | `text-h1` = `clamp(1.625rem, …, 3rem)`, `text-lead` clamp, `text-small`/`text-eyebrow` rem |
| Spacing theo scale | OK (MINOR-4) | Đa số scale; vài giá trị arbitrary theo mockup (`md:pb-[120px]`, `-mt-[84px]`, `md:px-[18px]`) có comment nguồn |
| Media max-width/aspect | OK | `ResponsiveImage` absolute inset-0 cover, `sizes="100vw"`, `priority`, decorative; khung chiều cao cố định thay aspect-ratio |
| Touch ≥ 44×44 | OK | Link breadcrumb `min-h-11`; pagination `size-11` mọi ô + mũi tên |
| Nav mobile | N/A | Diff không đụng header nav |
| Table scroll | N/A | Không có table |
| Không 100vh | OK | Không dùng vh |
| prefers-reduced-motion | OK | Chỉ `transition-colors`; thêm `prefers-reduced-transparency` bỏ blur |
| Không che lỗi bằng overflow:hidden | OK (MINOR-1) | `overflow-hidden` trên hero để giữ ảnh absolute/`isolate`; nội dung hiện tại (title + mô tả) vừa chiều cao ở 375 (short: ~248/280px; list: ~304/360px). Rủi ro tiềm ẩn khi wire eyebrow + titleAccent (xem MINOR-1) |

## Skill gates
| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, `aislop` not installed | `command -v aislop` rỗng |
| oxlint (anti-slop) | skip, oxlint not configured | Không có `.oxlintrc*`; eslint `pnpm lint` 0 error |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` rỗng |
| AI-readable | OK | Indicators: `CategoryListTemplate` hàm ~95 dòng (>50, đã dài từ trước, task làm dài thêm) = 1; magic px có comment nguồn mockup (không tính). < 3 → OK. File đều ≤ 300 dòng (template 174). Doc ERD/design-spec hoãn T08 đã ghi trong task |
| ai-friendly-web | N/A | Task không đụng robots/sitemap/llms |
| blitzstrike | skip | Không có môi trường/không phải bề mặt auth/input công khai mới (field admin dùng access global có sẵn) |
| no-raw-colors test | OK | Nằm trong suite PASS |

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. **Hero chiều cao cố định + `overflow-hidden` có thể cắt/đè chữ khi đủ eyebrow + titleAccent ở 375** — `src/components/layout/PageHero.tsx:26,35,49`. Short mobile 280px: `pt-20`(80) + eyebrow(17) + gap + h1 2 dòng + accent (~93, `max-w-[16ch]` làm dễ xuống dòng) + gap + mô tả 2 dòng (~54) + `pb-10`(40) ≈ 308px > 280 → do `items-end`, khối chữ trồi lên ~52px từ đỉnh, đè breadcrumb (20–64px). Hiện chưa xảy ra vì `loadPageHero` chưa nối vào trang. Fix đề xuất (trước/khi T03/T06 wire chữ admin): giảm `pt-20` thành khoảng chừa đúng breadcrumb (vd `pt-[calc(theme(spacing.5)+theme(spacing.11)+…)]`) hoặc dùng `min-h-*` thay `h-*` ở < md, và thêm test/ảnh 375 với đủ eyebrow + accent + mô tả 2 dòng.
2. **Màu rgb literal trong `.crumb-glass`** — `src/app/(frontend)/globals.css` (khối `.crumb-glass`, `text-shadow: 0 1px 3px rgb(10 12 16 / 0.6)`). Giá trị trùng `--color-banner-scrim`; dùng `var(--color-banner-scrim)` để không thêm màu ngoài token.
3. **Mũi tên phân trang bị vô hiệu: `aria-label` trên `span` generic** — `src/components/layout/Pagination.tsx:89` (`<span aria-disabled aria-label>`). ARIA cấm đặt tên cho role generic → trình đọc màn hình có thể bỏ qua; trước đây có chữ "Trước/Sau" hiển thị. Fix: thêm `role="link"` (kèm `aria-disabled="true"`) hoặc giữ chữ `sr-only` bên trong span.
4. **`ConsultBanner` trộn chữ CMS + chữ mặc định** — `src/components/layout/ConsultBanner.tsx:29`: khi admin có `title` nhưng cố ý để trống `description`, banner vẫn chèn mô tả mặc định i18n. Đề xuất chỉ dùng mô tả mặc định khi `title` CMS cũng trống (đi theo cặp).
5. **`hasOverlay = Boolean(filterCard ?? searchBar)`** — `src/components/templates/CategoryListTemplate.tsx` (~L92): nếu trang truyền `filterCard={false}` (pattern `cond && <X/>`) cùng `searchBar`, `??` không rơi sang `searchBar` → hero `short` trong khi băng vẫn đè. Dùng `Boolean(filterCard || searchBar)`.
6. **Nit**: i18n `page.listing.sortLabel` / `moreOptions` thêm trước khi có chỗ dùng (task cho phép tạo sẵn); `careersPerks.title` `localized + required` sẽ chặn lưu bản EN của site-settings khi EN chưa dịch các mục — cùng pattern có sẵn (Header/Footer/Homepage strengths), không phải lỗi mới, chỉ ghi nhận.

## Residual risk
- Ảnh `site-redesign-t01-news-category-390.jpg` có vẻ bị crop từ viewport rộng hơn (logo header lệch, pill breadcrumb chạm mép phải) → không xác nhận trực quan được pill breadcrumb ở 375; CSS math cho thấy wrap trong `max-w-full`. Không có ảnh 768. Đề nghị chụp lại 375/768 ở T03/T06.
- Không tự chạy `pnpm payload migrate`; tin vào evidence integration trên DB riêng.
- Merge với T02 song song: không xác minh được file chung (task T02 không nêu migrations/Breadcrumb/Pagination); nếu T02 có migration, `migrations/index.ts` sẽ conflict ở cuối mảng (dễ giải).
- Contrast breadcrumb ≈ 4.7:1 (biên mỏng); nếu sau này đổi `--color-banner-scrim` nhạt hơn, test sẽ bắt.

## Verdict
**PASS** — không CRITICAL/MAJOR; 6 MINOR chuyển builder xử lý tuỳ chọn (MINOR-1 nên xử lý trước khi T03/T06 nối chữ admin vào hero).
