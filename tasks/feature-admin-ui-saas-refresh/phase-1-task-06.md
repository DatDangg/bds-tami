# feature-admin-ui-saas-refresh · phase-1-task-06 — Form sửa: tab không tên / row / collapsible, sidebar phải

- Change doc: BL-015 · Spec: FR-ADM-19 · Design: §5, §5.1–§5.3, §6
- Phụ thuộc: T02, T05 (cùng file) — chạy cuối

## Classification / Risk
- Type: **MODIFY** · Risk: **HIGH** — bọc field vào tab/row/collapsible: sai loại (tab có `name`, group) đổi đường dẫn dữ liệu → migration/mất dữ liệu; hook/validate/condition dùng `siblingData` có thể vỡ.
- Expected review level: **STRICT** (schema/data path) · Blast radius: form projects, rentals, property-posts, news, job-postings, services, leads + globals homepage, site-settings.
- Doc impact: no doc impact (data path không đổi) — phải chứng minh.

## Yêu cầu
1. §5.1 cho projects, rentals, property-posts, news, job-postings, services: tab **không tên** Nội dung · Thông tin (tên theo loại) · Hình ảnh · SEO (group `seo` giữ tên) · Bản dịch (group `translation` giữ tên); `row` 2 cột cho cặp field ngắn; sidebar phải: trạng thái, ngày xuất bản, tác giả, nổi bật, slug, có bản EN.
2. Leads §5.2: tab Khách hàng · Nguồn (group `utm` giữ tên) · Lịch sử chăm sóc (join); sidebar: trạng thái, lý do không thành, người phụ trách + `LeadAssigneeWarning`, mốc thời gian.
3. Globals §5.3: homepage tab theo khối; site-settings tab Thông tin công ty · Liên hệ & mạng xã hội · Email nhận thông báo · Dịch tự động · Kỹ thuật.
4. RowLabel còn thiếu (nếu T02 chưa làm) cho array nhiều hàng.
5. **Chứng minh không đổi dữ liệu:** (a) `pnpm generate:types` → `git diff src/payload-types.ts` không đổi kiểu; (b) `pnpm payload migrate:create bl015-check` trên DB dev riêng (đã migrate tới HEAD) → không sinh migration — ghi output; lỡ sinh thì xoá + FAIL; (c) test integration: tạo/lưu/đọc lại projects, leads, global site-settings + homepage qua Local API, so shape dữ liệu (path field giữ nguyên); (d) test hooks/validate hiện có vẫn PASS.
6. Liệt kê hook/validate/`admin.condition` dùng `siblingData` trong các collection đụng và xác nhận không đổi (tab không tên/row/collapsible không đổi siblingData).
7. Mobile < 768: sidebar xuống dưới, tab cuộn ngang (bổ sung CSS nhỏ nếu cần).

## Acceptance
- [ ] Form các collection/global chính chia tab/nhóm đúng §5, trường phụ ở sidebar
- [ ] Bằng chứng không migration + types không đổi + test lưu/đọc PASS
- [ ] Trình duyệt form Projects, Leads, Site settings 1440/390 sáng+tối, lưu được
- [ ] lint/typecheck/test/build PASS

## Ràng buộc chung BL-015 (mọi task)
- Chỉ `/admin`: cấu hình `admin.*` của Payload + `src/app/(payload)/custom.scss` + component trong `src/components/admin/**`. **KHÔNG** đụng `src/app/(frontend)`, **KHÔNG** đổi schema/DB, access control, hook, API.
- Không sinh migration: không thêm/đổi `name` field, không bọc field vào `group`/`tabs` có `name`. Chỉ tab **không tên**, `row`, `collapsible`, `label`, `labels`, `admin.*`. Kiểm: `src/payload-types.ts` sau `pnpm generate:types` không đổi kiểu (chỉ có thể đổi comment/JSDoc), và `pnpm payload migrate:create` không tạo file mới (nếu tạo → xoá file đó, coi là FAIL).
- Không commit/push (primary commit). Không sửa `.context/project-config.md`, `.claude/**`.
- Design nguồn: `docs/specs/2026-10-19-admin-ui-saas-design.md` (§7 Đã chốt) + mock `docs/specs/2026-10-19-admin-ui-saas-mock.html`.
- Verify (project-config): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`. Fail đã biết từ trước (nếu có) ghi rõ, không che.
- File ≤ 300 dòng, hàm ≤ 50 dòng (project-config ui).
- Retry/Escalation: tối đa 3 attempt; review tối đa 2 vòng FAIL → `architecture_review_needed`.

## Verification summary
(builder, attempt 1)

**Thay đổi:** `src/lib/admin/form-layout.ts` (`formTabs`/`formRow` — tab KHÔNG tên, `flattenLayoutFields`, `findLayoutField`); `content-defaults.ts` (`placeSharedFields`: seo + translation thành tab SEO/Bản dịch khi collection có bộ tab gốc; cột phải đổi thứ tự status · publishedAt · author · isFeatured · slug · hasEnglish); `scoped-category.ts` (bỏ `position: sidebar` — category nằm tab Nội dung); Projects/Rentals/PropertyPosts/News/JobPostings/Services/Leads, globals Homepage + SiteSettings; follow-up T04: xoá `DashboardBadge.tsx` + block `.tami-dash-badge`, dashboard dùng `StatusBadge` (thêm prop `tone`); CSS mobile tab ≥ 44px (`_lists.scss`).

**5a — types:** `pnpm generate:types` → `git diff` chỉ đổi THỨ TỰ thuộc tính trong interface (do đổi thứ tự field dùng chung). `diff <(sort HEAD:payload-types.ts) <(sort file hiện tại)` = rỗng (3112 dòng ↔ 3112 dòng giống hệt) → không đổi kiểu. File đã regenerate (cần commit cùng).
**5b — migration:** `pnpm payload migrate:create --skip-empty` (DB dev `.env.local`) → log "Starting migration… Migration DOWN statements generation complete", `migrations/` vẫn 57 file, `git status migrations` sạch → KHÔNG sinh migration.
**5c — integration:** `tests/integration/admin-form-layout.test.ts` (DB tạm, migration THẬT đã commit): không tab nào có `name` (7 collection + 2 global); cột DB giữ path cũ (`price_from_vnd`, `scale_total_units`, `seo_meta_title`, `utm_source`, `rental_terms_min_lease_months`, `cta_banner_enabled`…); tạo→đọc lại projects (scale/seo/amenities/field trong row), leads (customer/utm/lostReason + validate), site-settings + homepage (socialLinks, notificationEmails, glossary, ctaBanner siblingData validate) giữ nguyên shape. 5/5 PASS.
**5d — test hiện có:** `pnpm test` = 255 file / 2658 test PASS (gồm projects/rentals/property-posts/news/job-postings/services-pages/leads/globals/homepage/retranslate/translate-content). Sửa 3 test duyệt field cấp gốc (property-posts `offer`, rentals `rentalTerms`, translatable-fields) sang helper trải phẳng — KHÔNG nới assert.
**6 — siblingData/condition (không đổi, vẫn ở cùng cấp dữ liệu):** `validateSalaryMax`↔`salaryMinVnd` (root, JobPostings) · `wardFilterOptions`/`validateWardInProvince`/`validateWardWithOptionalProvince`↔`province` (root, projects/rentals/property-posts) · `validatePriceMonthly`/`validateAreaM2`↔`priceNegotiable` (root, rentals) · `validateOfferEnd`↔`offer.startAt` (trong group `offer`) · slug hook ↔ `title`/`category` (root) · `validateCtaTitle`↔`ctaBanner.enabled` (trong group) · `lostReason` `admin.condition` + validate theo `data.status` (Leads). Tab không tên/row không thêm cấp vào `siblingData`; `collectLeaves` (translation) đã xử lý tab không tên (`leaves.ts:95-105`), `slug.ts` dùng `siblingData` gốc.
**Verify:** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS · `pnpm build` PASS · `generate:importmap` không cần (không thêm component).
**Chưa làm được — trình duyệt (Acceptance 3):** form Projects/Leads/Site settings 1440/390 sáng+tối KHÔNG xác minh được: dev server :3000 do session khác giữ, màn đăng nhập admin cần tài khoản (builder không có credential test hợp lệ và không tạo tài khoản). Cần reviewer/primary kiểm bằng tay (tab cuộn ngang, cột phải xuống dưới < 768, lưu được).

## Ghi chú spec-validator (pre-plan)
- Report spec-validator: `.context/review-reports/feature-admin-ui-saas-refresh-spec-validation.md` (PASS).
- **N7:** field dùng chung được nối vào **cuối** danh sách field (`content-defaults.ts:177`) → muốn đưa vào tab phải sửa `content-defaults.ts`. Field `position: sidebar` giữ ở cấp gốc. 6 file test đang tra field cấp gốc bằng `fields.find` sẽ vỡ → chuyển sang duyệt đệ quy (helper), **không** nới assert.
- **N9:** `pnpm payload migrate:create --skip-empty`; diff `payload-types.ts` so theo nghĩa.
- Code đã xử lý tab không tên ở `leaves.ts:95-105`, `slug.ts:42` — kiểm các chỗ duyệt field khác (translation, search text, sitemap…).
