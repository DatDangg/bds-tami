# feature-listing-detail-redesign · phase-1-task-01 — Schema Dự án + `site-settings.listingPages` + loader (migration additive)

- Nguồn: `spec/changes/2026-10-21-listing-detail-redesign.md` (BL-052, MODIFY). Design: `docs/specs/listing-detail-redesign/list-du-an.webp`, `detail-du-an.webp`.
- Spec: `SPECIFICATIONS.md` 1.46.0 — khối "Redesign danh sách + chi tiết Dự án / Cho thuê / Tin BĐS (BL-052 …)" mục "Admin nội dung danh sách", "Dự án — trường mới", "Giá dự án".
- Plan: phase 1 wave A (song song P1-T02, P1-T03). **Task duy nhất của phase 1 tạo migration.**
- Phụ thuộc: không.

## Classification / Risk
- Type: **ADDITIVE** (schema) trong change MODIFY.
- Risk: **HIGH** — DB/schema/migration, collection dùng ở nhiều trang, global `site-settings`.
- Expected review level: **STRICT**.
- Blast radius: `src/collections/Projects.ts`, `src/collections/projects/*`, `src/globals/SiteSettings.ts`, `src/globals/site-settings/*`, `migrations/*`, `src/payload-types.ts`, cấu hình dịch (`TRANSLATABLE_FIELDS`), i18n messages, `docs/ERD.md`.
- Doc impact: `docs/ERD.md` (projects, site-settings).

## Scope
1. Hằng dùng chung (đặt nơi cả collection lẫn UI/public import được, vd `src/shared/listing-options.ts`): `PROPERTY_TYPES` = apartment, townhouse, villa, shophouse, land, resort, condotel, office; `PROJECT_FEATURES` = near_school, near_hospital, near_mall, near_metro, water_view, pool_gym_spa, green_park. Nhãn admin tiếng Việt; nhãn công khai VI/EN qua i18n (`messages/*`), không hard-code trong component.
2. `projects` thêm (mọi trường tuỳ chọn, không vào `englishRequiredFields`):
   - `productTypes` select `hasMany` index — "Loại sản phẩm".
   - `featuredAmenities` select `hasMany` index — "Tiện ích nổi bật (dùng cho bộ lọc)".
   - `products` array ≤ 8: `count` (number ≥ 0, tuỳ chọn), `type` (text localized, bắt buộc trong hàng), `areaFrom`/`areaTo` (m², ≥ 0, "đến" ≥ "từ" — dùng lại `notBelow` của `market-blocks.ts`). RowLabel theo `type`.
   - `videoUrl` — "Link video giới thiệu", validate như `rentals.videoUrl` (dùng lại validator).
   - `amenities[].description` textarea localized; `amenitiesImage` upload ảnh (chỉ image) — "Ảnh khối tiện ích".
   - Đặt hợp lý theo tab hiện có ("Thông tin dự án" / "Bảng giá & thông tin thêm" / "Hình ảnh"), nhãn + mô tả tiếng Việt dễ hiểu (theo chuẩn admin BL-051).
   - Thêm chữ localized mới vào `TRANSLATABLE_FIELDS.projects` (products.type, amenities.description).
3. `site-settings` tab mới **"Trang danh sách"**: group `listingPages` gồm `projects`, `rentals`, `propertyPosts`; mỗi group: `quickSearch` (array ≤ 8, `label` text localized bắt buộc trong hàng), `learnMore` (group: eyebrow, title, titleAccent, description localized; `image` upload ảnh; `videoUrl` validate như rentals; `ctaLabel` localized; `ctaHref` text — đường dẫn nội bộ bắt đầu `/` hoặc `https://`), `faqs` (array ≤ 10: `question` text + `answer` textarea, localized, bắt buộc trong hàng); `rentals` + `propertyPosts` thêm `showStrengths` checkbox mặc định `true`. Dịch tự động: thêm vào cấu hình dịch global nếu `site-settings` có (kiểm cách `pageHeroes` đang làm và theo đúng).
4. Loader công khai `src/lib/content/load-listing-page.ts` (+ test): `loadListingPageContent(locale, key)` → `{ quickSearch: string[], learnMore: {...} | null, faqs: {question, answer}[], showStrengths: boolean }`; `/en` bỏ hàng thiếu chữ EN (không fallback VI), `learnMore` null khi thiếu tiêu đề; dùng cache global sẵn có (như `loadPageHero`).
5. Migration: `pnpm payload migrate:create listing_detail_redesign` — chỉ ADD (cột nullable, bảng con `_products`, bảng hasMany select, enum mới). Inspect file: không DROP / đổi type / SET NOT NULL. `migrate` → `migrate:down` → `migrate` trên DB worktree. Regen `src/payload-types.ts` (`pnpm generate:types`), `pnpm generate:importmap` nếu thêm component admin.
6. `docs/ERD.md` §projects + site-settings cập nhật trường mới.

## Acceptance
- [ ] Admin dự án: các trường mới hiện, nhãn tiếng Việt, lưu/xuất bản dự án cũ (để trống) vẫn được; `products.areaTo < areaFrom` bị chặn ở server.
- [ ] Admin Cài đặt website có tab "Trang danh sách" với 3 nhóm; lưu được VI + EN.
- [ ] Migration additive, up/down/up PASS, không HIGH_RISK; `payload-types.ts` khớp.
- [ ] Loader test: VI đủ, EN bỏ hàng thiếu chữ, khối trống → null/[].
- [ ] Test schema: trường mới tồn tại đúng kiểu/nhãn, `admin-labels.test` PASS.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
1. Hằng dùng chung ở `src/shared/listing-options.ts` (`PROPERTY_TYPES`, `PROJECT_FEATURES` + nhãn admin VI). Nhãn công khai VI/EN ở namespace i18n mới **`listingOptions`** (`propertyType.*`, `projectFeature.*`), thêm cuối `vi.json`/`en.json`.
2. Nhãn `pool_gym_spa` = "Hồ bơi, gym, spa" (không dùng gạch "–" vì `messages-check` cấm gạch dài); `near_mall` admin = "Gần TTTM" theo spec, EN "Near shopping malls".
3. Trường dự án mới ở `src/collections/projects/listing-fields.ts`; tab "Thông tin dự án": hàng (Loại sản phẩm · Tiện ích nổi bật) sau diện tích, `products` sau Quy mô, `amenitiesImage` ngay sau `amenities`; tab "Hình ảnh": `videoUrl` sau thư viện ảnh. `notBelow` của `market-blocks.ts` export để dùng lại; `videoUrl` dùng `validateVideoUrl` của rentals. `videoUrl` ẩn khỏi "Thêm bộ lọc" như rentals; `productTypes`/`featuredAmenities` vẫn lọc được trong admin (cập nhật `list-filter.test`).
4. `site-settings`: tab "Trang danh sách" đặt sau "Ảnh banner"; field ở `src/globals/site-settings/listing-pages.ts`. `quickSearch` dùng `dbName` `site_settings_lp_<nhóm>_quick_search` vì tên mặc định vượt 63 ký tự (Payload cảnh báo). `ctaHref` validate bằng `isInternalPathOrHttps` mới trong `lib/content/internal-path.ts` (đường dẫn nội bộ an toàn như redirects hoặc `https://`; chặn `javascript:`, `//host`, `http://`); loader kiểm lại cùng hàm.
5. Dịch tự động: thêm `products` vào `TRANSLATABLE_FIELDS.projects` (`amenities` đã có nên `description` tự vào), `listingPages` vào `TRANSLATABLE_FIELDS["site-settings"]` (cách làm như `pageHeroes`). Test `translatable-fields.test` sửa helper để duyệt `row` trong array (trước đó bỏ sót chữ localized nằm trong `formRow` của array; `collectLeaves` thật vẫn duyệt đúng).
6. Loader `loadListingPageContent(locale, key)` + `resolveListingPageContent` (thuần) cùng file `load-listing-page.ts`. `showStrengths`: Cho thuê / Tin BĐS theo `listingPages.*.showStrengths`, Dự án theo `showProjectStrengths` sẵn có (nhóm `projects` không có cờ riêng). Global lỗi → nội dung trống, `showStrengths: true`. `learnMore.cta` chỉ có khi đủ chữ + đường dẫn hợp lệ; ảnh chưa populate → `undefined`.
7. Hàng mảng có chữ bắt buộc (`quickSearch.label`, `faqs.question/answer`, `products.type`): khi lưu bản EN phải có chữ EN cho mọi hàng (hành vi Payload, giống `careersPerks`); trước khi lưu/dịch EN, `/en` đọc ra chữ trống và loader bỏ hàng.

## Verification summary (Builder)
- Worktree DB `tami_wt52_p1t01` (copy dữ liệu từ DB dev `tami`, chỉ đọc `tami`), REDIS_DB 11.
- Migration `migrations/20261021_135620_listing_detail_redesign.ts`: UP chỉ CREATE TYPE (4 enum) / CREATE TABLE (8 bảng `projects`/`_projects_v`, 12 bảng `site_settings_*`) / ADD COLUMN nullable (hoặc `DEFAULT true` cho `show_strengths`) / FK + index trên cột/bảng mới. Không DROP / đổi kiểu / SET NOT NULL / backfill → **không HIGH_RISK**. `migrate` → `migrate:down` → `migrate` PASS trên DB worktree. Ba tên FK `site_settings_listing_pages_<nhóm>_learn_more_image_id_media_id_fk` > 63 ký tự, Postgres tự cắt (không trùng; down/up chạy đúng).
- `pnpm generate:types` (chỉ thêm, 269 dòng); không thêm component admin nên không cần `generate:importmap`.
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 lỗi, 2 warning sẵn có ở `tools/task-dashboard/server.mjs`) · `pnpm test` PASS 365 file / 3665 test (gồm integration `projects` + `globals` có test mới BL-052, `admin-labels`, `translatable-fields`).
- **Sau review r1 (MINOR-1/3):** MINOR-3 làm — `projects.videoUrl` thêm `hooks.beforeValidate: [trimText]` (rentals không đổi); typecheck/lint PASS, `src/collections` + `admin-labels` + integration `projects` + `src/lib/admin` 30 file / 293 test PASS. MINOR-1 **không làm được bằng `dbName`**: `@payloadcms/drizzle` 3.91 chỉ áp `dbName` cho tên bảng/enum (array, select hasMany, blocks); cột của group/upload luôn là `<tiền tố group>_<tên field>` và FK upload do drizzle đặt `<bảng>_<cột>_media_id_fk`, không có chỗ đặt tên. Muốn ≤ 63 ký tự phải đổi tên field spec (`listingPages`/`learnMore`/`propertyPosts`/`image`). Bằng chứng không sinh thao tác giả: snapshot `.json` giữ tên dài, DB giữ tên bị cắt; `migrate:create` chạy thử sau migration này → không có thay đổi, không tạo file (diff Payload so snapshot với snapshot, không introspect DB). DROP theo tên dài trong migration sau vẫn trúng vì Postgres cắt giống nhau. Migration giữ nguyên `20261021_135620_listing_detail_redesign` (trimText không đổi schema).
- Trình duyệt (dev :3101, admin test `@example.test` trên DB worktree): tab "Trang danh sách" có 3 nhóm, nhãn/mô tả tiếng Việt; form dự án hiện Loại sản phẩm, Tiện ích nổi bật, Sản phẩm, Mô tả ngắn tiện ích, Ảnh khối tiện ích; PATCH dự án đã xuất bản cũ (trống trường mới) → 200; `/du-an` 200.

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-01-round-1-review.md` — **STRICT PASS**. MINOR-1 (3 tên FK > 63 ký tự): Payload drizzle 3.91 không cho đặt tên FK cột upload trong group → **chấp nhận residual** (change-request): Postgres cắt tên ổn định, `migrate:create` sau đó "No schema changes"; ghi ERD. MINOR-2 nhãn "Hồ bơi, gym, spa" (i18n cấm gạch dài) → ghi as-built. MINOR-3 `trimText` cho `projects.videoUrl` → đã sửa.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **STRICT PASS r1**. typecheck · lint · test 365 file / 3665 PASS (r1); sau MINOR-3: 30 file / 293 PASS. Migration `20261021_135620_listing_detail_redesign` SAFE_ADDITIVE, up/down/up PASS.

## Doc impact
- `docs/ERD.md` (projects, site-settings `listingPages`).
