# feature-list-page-banner-image · phase-1-task-01 — Ảnh banner trang danh sách (site-settings.pageBanners) + biến thể Ảnh của PageBanner

- Change doc: `spec/changes/2026-10-19-list-page-banner-image.md` (BACKLOG BL-017)
- Spec: **FR-ADM-20** (SPECIFICATIONS.md F10), design-spec §2.7 / §6.3, docs/DESIGN.md (dòng "pageBanners làm ở BL-017")

## Hiện trạng (change-request đã kiểm)
- `src/components/layout/PageBanner.tsx`: đã có biến thể Ảnh (`image?: MediaImage` → `ResponsiveImage` `priority` + `bg-overlay` + chữ trắng căn giữa, cao `clamp(240px,42svh,440px)`), chưa trang nào truyền `image`.
- `src/components/templates/CategoryListTemplate.tsx:95` nhận `bannerImage` truyền xuống `PageBanner` nhưng `NewsListPage`, `PostListPage`, `ProjectListPage`, `JobListPage` không truyền. `src/components/rentals/RentalListPage.tsx:118` dùng `PageBanner` trực tiếp (không qua template).
- Trang danh sách công khai hiện có: `/du-an`, `/cho-thue` (+ `/cho-thue/danh-muc/[category]`), `/tin-bds` (+ danh-muc), `/tin-tuc` (+ danh-muc), `/tuyen-dung`. **Không có** trang danh sách Dịch vụ (chỉ `/dich-vu/[slug]`).
- `src/globals/SiteSettings.ts`: `formTabs([...])` 5 tab; `imageUpload(name,label)` helper (upload `media`, lọc `image/`). `getSiteSettings(locale)` (`src/lib/content/get-globals.ts`) cache theo tag, `findGlobal depth: 1, overrideAccess: false` → upload được populate.
- Scrim hiện tại `--color-overlay: rgb(10 12 16 / 0.55)`: trên ảnh trắng tinh nền hiệu dụng ≈ rgb(120,120,121) → chữ trắng ≈ 4.4:1 (dưới 4.5), mô tả `text-on-dark-muted` #B3B3B3 ≈ 2.1:1 → **không đạt AA** ở trường hợp xấu nhất.

## Classification / Risk
- Type: **ADDITIVE** (field mới trên global + dùng biến thể đã có). Không đổi quyền/API/field cũ.
- Risk: **MEDIUM** — DB/schema (migration additive trên `site_settings`), shared component (`PageBanner`, `CategoryListTemplate`) dùng ở nhiều trang → Reviewer **STRICT** (risk đỏ: DB/schema/migration + shared component).

## Quyết định thiết kế (change-request, auto proceed)
1. Schema: trong `site-settings` thêm **group `pageBanners`** (label "Ảnh banner trang danh sách", **không localized**) gồm upload (dùng `imageUpload`): `default` ("Ảnh mặc định" — description: dùng cho trang danh sách chưa có ảnh riêng), `projects` ("Dự án"), `rentals` ("Cho thuê"), `propertyPosts` ("Đăng tin BĐS"), `news` ("Tin tức"), `careers` ("Tuyển dụng"). Đặt trong **tab mới** "Ảnh banner" (hoặc tab phù hợp theo `formTabs`, nhãn VI) — builder chọn, ghi decision log. Không có `contact` (ngoài phạm vi).
2. Quyền: kế thừa global (đọc công khai, chỉ admin sửa). Không thêm access riêng.
3. Migration: `pnpm payload migrate:create <tên>` (vd `site_settings_page_banners`) → kiểm SQL **chỉ** `ADD COLUMN ... _id uuid` nullable + FK `ON DELETE SET NULL` tới `media` + index (theo kiểu Payload sinh) trên bảng `site_settings` — không DROP/đổi type/NOT NULL/backfill. Không sửa migration cũ. Commit `.ts` + `.json` snapshot + `migrations/index.ts`. Chạy `pnpm payload migrate` trên DB dev để kiểm `up`; kiểm `down` chạy được nếu khả thi (DB tạm hoặc migrate:down rồi up lại trên dev — không đụng staging/prod).
4. Regenerate `src/payload-types.ts` (`pnpm payload generate:types`) + importMap nếu cần.
5. Resolver thuần (vd `src/lib/content/page-banner.ts`): `resolvePageBanner(settings, key) → MediaImage | undefined` = ảnh riêng (nếu là object media có url) ?? `default` ?? undefined. Key = `projects | rentals | propertyPosts | news | careers`. Có unit test (riêng, fallback default, không có gì, giá trị chỉ là id chưa populate → coi như không có).
6. Trang: `ProjectListPage`, `RentalListPage`, `PostListPage`, `NewsListPage`, `JobListPage` đọc `getSiteSettings(locale)` (đã cache; lỗi đọc → log warn + biến thể Chữ, theo mẫu `JobListPage.tsx:63-65`, không làm vỡ trang) và truyền ảnh vào `bannerImage`/`image`. Trang danh mục con dùng **cùng key của danh sách cha** (cùng component nên tự nhiên). VI/EN cùng ảnh (field không localized). Không đổi ISR/dynamic hiện có của route.
7. Biến thể Ảnh của `PageBanner` — AA: **không** đổi token toàn cục `--color-overlay` (hero dùng chung); dùng scrim riêng cho banner (vd lớp `bg-dark-deep/<alpha>` hoặc token mới `--color-banner-scrim`) sao cho trên ảnh trắng tinh: chữ trắng `h1` và **mô tả** ≥ 4.5:1 (mô tả đổi sang `text-on-dark` nếu `on-dark-muted` không đạt). Thêm test contrast tính toán (theo mẫu `src/lib/contrast.test.ts`) cho cặp chữ / scrim-trên-trắng. Ảnh `priority`, `sizes="100vw"`, khung cao cố định (đã có `h-[clamp(...)]`) → không CLS; `alt` rỗng/decorative như hiện tại (h1 mang nội dung).
8. **Không** đổi chiều cao banner, header trong suốt trên banner ảnh, băng tìm kiếm — để BL-020 (ghi Residual/Note). Không đổi biến thể Chữ (watermark, mô tả danh mục) khi không có ảnh.
9. Doc reconcile (as-built): `docs/ERD.md` §4.15 `site-settings` thêm `pageBanners` (group, không localized, 6 upload → media) + ghi migration; `docs/ARCHITECTURE.md` nếu có mục liệt kê global field/component tương ứng. Intent docs (SPECIFICATIONS/design-spec/DESIGN.md) change-request đã sửa — builder KHÔNG sửa thêm.

## Acceptance
- [ ] Admin › Cài đặt website có nhóm "Ảnh banner trang danh sách": Ảnh mặc định + Dự án / Cho thuê / Đăng tin BĐS / Tin tức / Tuyển dụng (nhãn VI; test quét nhãn admin hiện có vẫn PASS)
- [ ] Trang danh sách: ảnh riêng → biến thể Ảnh; thiếu → ảnh mặc định; thiếu cả hai → biến thể Chữ y như trước (test)
- [ ] Trang danh mục con (cho-thue / tin-bds / tin-tuc danh-muc) dùng ảnh của danh sách cha
- [ ] Chữ trên ảnh ≥ 4.5:1 ở trường hợp ảnh trắng (test contrast); ảnh `priority`; khung cao cố định (không CLS)
- [ ] VI và EN cùng ảnh (field không localized)
- [ ] Migration versioned additive (chỉ ADD COLUMN nullable + FK/index), không HIGH_RISK; `pnpm payload migrate` PASS trên dev
- [ ] site-settings đọc lỗi → trang vẫn render biến thể Chữ (không 500)

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (hoặc test liên quan + toàn bộ nếu thời gian cho phép; ghi rõ) · `pnpm build` (nếu môi trường cho phép, không thì ghi lý do)
- `pnpm payload migrate` trên DB dev; in SQL migration vào Verification summary
- Report: `.context/review-reports/feature-list-page-banner-image-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Xem "Quyết định thiết kế" 1–9.
- (builder) Tab: tạo tab mới **"Ảnh banner"** (đặt giữa "Thông tin công ty" và "Liên hệ & mạng xã hội") chứa group `pageBanners`; không nhét vào "Thông tin công ty" để tab đó không phình. `default` có `admin.description` riêng; 5 key còn lại dùng `imageUpload` nguyên trạng.
- (builder) Resolver tách 2 file: `src/lib/content/page-banner.ts` (thuần, test được trong node) và `load-page-banner.ts` (server-only: `getSiteSettings` + try/catch + `logger.warn`). Các trang chỉ gọi `loadPageBanner(locale, key)` trong `Promise.all` sẵn có → không thêm lượt chờ tuần tự. Cache vẫn là tag `global:site-settings` (60s / revalidate khi lưu) → đổi ảnh trong admin lên web ≤ 1 phút.
- (builder) Scrim: token mới `--color-banner-scrim: rgb(10 12 16 / 0.6)` trong `globals.css`, `PageBanner` dùng `bg-banner-scrim`; `--color-overlay` (0.55) giữ nguyên (test khoá giá trị). Trên ảnh trắng tinh nền hiệu dụng = rgb(108,109,110) → chữ trắng ≈ 5.2:1. Mô tả đổi `text-on-dark-muted` → `text-on-dark` (muted #B3B3B3 chỉ ≈ 2.5:1 trên nền đó, test khẳng định "không đạt" để không ai đổi lại).
- (builder) Hook dịch: kiểm `enqueue-translation.ts` + `src/lib/translation/leaves.ts:23`. `maybeQueue` chỉ xếp job khi hash nguồn (`computeSourceHash`) đổi, mà hash chỉ tính các trường chữ localized trong `TRANSLATABLE_FIELDS` của site-settings = `siteName`, `address`; `pageBanners` (upload, không localized) không nằm trong đó và không bao giờ gửi tới Claude. **Kết luận: lưu site-settings chỉ đổi ảnh banner không xếp job dịch mới, không gọi Claude, không tốn chi phí** (ngoại lệ có sẵn, không do BL-017: bản ghi đang ở trạng thái `none`/`failed` vẫn được xếp job dịch ở lần lưu bất kỳ). Đây là kết luận đọc code, không chạy job thật (dev không có `ANTHROPIC_API_KEY` thật, hạn mức tháng = 0 bỏ qua êm).
- (builder) Không thêm test cho `NewsListPage`/`PostListPage` (repo chưa có file test cho 2 trang này); chúng đi qua `CategoryListTemplate` đã có prop `bannerImage` và dùng cùng `loadPageBanner` đã test ở 3 trang còn lại + resolver.

## Verification summary
| Lệnh | Kết quả |
|---|---|
| `pnpm payload migrate:create site_settings_page_banners` | OK → `migrations/20261019_082627_site_settings_page_banners.{ts,json}` + `migrations/index.ts` |
| `pnpm payload migrate` (DB dev `127.0.0.1:5433/tami`, không phải staging/prod) | PASS (21ms) |
| `pnpm payload migrate:down` rồi `pnpm payload migrate` lại (dev) | down PASS (15ms), up lại PASS (15ms) |
| `pnpm payload generate:types` | OK, `src/payload-types.ts` thêm `SiteSetting.pageBanners` (+ select type) |
| `pnpm lint` | PASS (không lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm test` (toàn bộ) | PASS: 257 file, 2675 test (gồm test quét nhãn admin FR-ADM-19 hiện có) |
| `pnpm build` | **Không chạy**: có dev server của session khác đang giữ thư mục `.next` của repo, build sẽ ghi đè/làm hỏng nó; không có thay đổi cấu hình/route ảnh hưởng build ngoài những gì `typecheck`/`lint` đã phủ. Reviewer/primary chạy khi dev server dừng |
| oxlint | Bỏ qua: repo không có config oxlint (dùng eslint) |

### SQL migration (up) — chỉ ADD COLUMN nullable + FK `ON DELETE set null` + index, trên `site_settings`
```sql
ALTER TABLE "site_settings" ADD COLUMN "page_banners_default_id" uuid;
ALTER TABLE "site_settings" ADD COLUMN "page_banners_projects_id" uuid;
ALTER TABLE "site_settings" ADD COLUMN "page_banners_rentals_id" uuid;
ALTER TABLE "site_settings" ADD COLUMN "page_banners_property_posts_id" uuid;
ALTER TABLE "site_settings" ADD COLUMN "page_banners_news_id" uuid;
ALTER TABLE "site_settings" ADD COLUMN "page_banners_careers_id" uuid;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_page_banners_<default|projects|rentals|property_posts|news|careers>_id_media_id_fk" FOREIGN KEY ("page_banners_<...>_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;   -- x6
CREATE INDEX "site_settings_page_banners_page_banners_<default|projects|rentals|property_posts|news|careers>_idx" ON "site_settings" USING btree ("page_banners_<...>_id");   -- x6
```
Down: DROP CONSTRAINT x6, DROP INDEX x6, DROP COLUMN x6 (chạy được trên dev). Không DROP/đổi type/NOT NULL/backfill → không `HIGH_RISK_MIGRATION`. FK trên cột mới toàn NULL nên không đụng data cũ.

### Test thêm
- `src/lib/content/page-banner.test.ts` (resolver: riêng / fallback default / không có gì / chỉ id chưa populate / media không url).
- `src/components/layout/PageBanner.test.tsx` (biến thể Ảnh: scrim riêng, không `bg-overlay`, khung `clamp`, ảnh `alt=""`, mô tả `text-on-dark`; biến thể Chữ giữ nguyên).
- `src/lib/contrast.test.ts` (h1 trắng trên scrim-trên-ảnh-trắng ≥ 4.5:1; `on-dark-muted` không đạt; `--color-overlay` không đổi).
- `ProjectListPage`/`JobListPage`/`RentalListPage` `.test.tsx`: có ảnh → biến thể Ảnh + đúng key (`projects`/`careers`/`rentals`); không ảnh → banner chữ.

## Residual risk
- Chiều cao banner ảnh `clamp(240px,42svh,440px)`, header trong suốt trên banner ảnh, băng tìm kiếm dưới banner: **không đổi, thuộc BL-020** (design-spec §2.7 "header Trong suốt trên banner ảnh" chưa đúng tới khi BL-020 làm). Trên mobile banner ảnh cao 42svh đẩy bộ lọc Cho thuê xuống cho tới BL-020.
- Chưa xác minh bằng trình duyệt thật (ảnh thật + 375/768/1280); contrast kiểm bằng tính toán trường hợp ảnh trắng tinh, ảnh gradient/hoạ tiết sáng cục bộ vẫn bị scrim 0.6 che đồng đều nên ≥ mức đã tính.
- `pnpm build` chưa chạy (xem bảng).
- `NewsListPage`/`PostListPage` chưa có test cấp trang cho banner.
- Kết luận "không xếp job dịch" là từ đọc code, chưa chạy job.

## Review
- Round 1 — **STRICT PASS** (`.context/review-reports/feature-list-page-banner-image-phase-1-task-01-round-1-review.md`): 0 CRITICAL/MAJOR. MINOR-1 `page-banner.ts:11` truyền nguyên doc media xuống `ResponsiveImage` (client) — dư filename/mimeType/filesize, không PII; MINOR-2 thiếu test nhánh lỗi `load-page-banner.ts:14-19`; MINOR-3 thiếu test cấp trang `NewsListPage`/`PostListPage`; MINOR-4 xoá media đang làm banner → cache 60s có thể trỏ ảnh cũ. Chấp nhận, ghi residual. `pnpm test` toàn bộ: 1 test chập chờn `tests/integration/media-upload.test.ts:145` (ngoài diff, chạy riêng 20/20 PASS).

## Close-out (change-request)
- Doc impact: as-built `docs/ERD.md` §4.15 + `docs/ARCHITECTURE.md` (builder); intent `SPECIFICATIONS.md` FR-ADM-20, `.context/design-spec.md` §2.7/S04/§6/§6.3, `docs/DESIGN.md` (change-request, theo CR user duyệt).
- Spec 1.12.0 · `spec/test-scope/current.json` scopeVersion 13 (changed.files chốt theo diff thật).
- Progress: `.context/progress.json` features[] `list-page-banner-image` done. BACKLOG BL-017 done; change doc archive.
- Residual: `pnpm build` chưa chạy (dev server khác giữ `.next`); chưa xem trình duyệt 375/768/1280; MINOR 1–4 mở; banner 42svh đẩy bộ lọc Cho thuê xuống trên mobile + header trong suốt trên banner ảnh + băng tìm kiếm → BL-020; trang Liên hệ không có ảnh banner (U1, user có thể yêu cầu sau).
