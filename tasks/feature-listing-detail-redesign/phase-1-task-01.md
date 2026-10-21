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
