# feature-admin-ui-saas-refresh · phase-1-task-03 — Sidebar nhóm theo nghiệp vụ

- Change doc: BL-015 · Spec: FR-ADM-19 · Design: §2 (7 nhóm), §7 Q3 (giữ mọi mục) / Q4 (không icon)
- Phụ thuộc: T02 (cùng file collection), T01 (style nav)

## Classification / Risk
- Type: **MODIFY** · Risk: **LOW–MEDIUM** — `admin.group` + thứ tự mảng `collections`/`globals`; không đổi schema (chứng minh không migration).
- Expected review level: **NORMAL** (navigation dùng chung) · Blast radius: menu trái mọi role.
- Doc impact: as-built nếu `docs/ARCHITECTURE.md`/`docs/PERMISSION.md` mô tả menu admin.

## Yêu cầu
1. `admin.group` tiếng Việt cho mọi collection + global theo §2: Khách hàng (leads, lead-activities) · Nội dung (projects, rentals, property-posts, news, services, pages) · Tuyển dụng (job-postings, job-applications) · Thư viện (media, private-files) · Danh mục (categories, developers, provinces, wards) · Website (site-settings, homepage, header, footer, redirects qua overrides) · Hệ thống (staff, audit-logs, click-events, click-stats-daily, translation-usage). Tên nhóm + thứ tự ở **một** const (vd `src/components/admin/admin-groups.ts`) để T04 dashboard dùng lại.
2. Sắp lại mảng `collections`/`globals` trong `src/payload.config.ts` theo thứ tự trên. Kiểm Payload 3.91 trộn collection + global cùng group trong nav ra sao; ghi lại thứ tự thực tế.
3. Không ẩn/hiện thêm mục — `admin.hidden` giữ nguyên; quyền giữ nguyên.
4. Test unit: mọi collection/global có `admin.group` thuộc tập 7 nhóm; thứ tự nhóm trong config đúng §2.
5. Trình duyệt admin + sale: menu đúng nhóm, mục theo quyền như trước (so danh sách mục trước/sau cho từng role).

## Acceptance
- [ ] 7 nhóm đúng thứ tự, nhãn tiếng Việt; không mục nào mất/thêm so với trước theo từng role
- [ ] Không migration
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
- Cách làm: một const + plugin cuối `adminNavGroupsPlugin` (`src/components/admin/admin-groups.ts`, thêm vào cuối `plugins` ở `payload.config.ts`) gán `admin.group` và sắp lại `collections`/`globals` sau khi plugin redirects nối collection (N4). Không sửa 25 file collection/global. Slug chưa khai báo -> throw.
- Thứ tự nav thực tế (đọc `@payloadcms/ui` 3.91 `groupNavItems` + Nav: `[...collections, ...globals]`, nhóm tạo theo lần xuất hiện đầu, mục trong nhóm theo thứ tự mảng): Khách hàng > Nội dung > Tuyển dụng > Thư viện > Danh mục > Website > Hệ thống. Khác design §2 một chỗ: nhóm Website hiện **Chuyển hướng 301 (collection) TRƯỚC** Cấu hình chung/Trang chủ/Đầu trang/Chân trang (collection luôn đứng trước global trong cùng nhóm, không đổi được bằng config). Test mô phỏng đúng logic này.
- Test: `src/components/admin/admin-groups.test.ts` (4 test trên config thật: 7 nhóm, thứ tự nhóm/mục, không mất/thêm mục, slug lạ throw).
- Verify: pnpm lint PASS · typecheck PASS · test PASS (245 file, 2583 test) · build PASS.
- Không migration: `pnpm payload migrate:create --skip-empty` không tạo file (migrations/ giữ 57). `payload-types.ts` và `importMap.js`: Payload tự sinh lại khi init (autoGenerate) -> chỉ đổi THỨ TỰ (so sánh multiset dòng sort: 0 khác biệt), shape không đổi; giữ bản sinh lại để khỏi churn.
- Chưa kiểm trình duyệt admin/sale (không dựng DB + đăng nhập trong task này); quyền/`admin.hidden` không đụng.
- Kèm (reviewer T01 r3 MINOR): `_lists.scss` thêm rule mobile <768 bỏ `min-height` cho `.select-row/.select-all .checkbox-input` + căn giữa flex (giữ input 44x44) -> hàng bảng không còn 60px. Chưa đo bằng trình duyệt.

## Ghi chú spec-validator (pre-plan)
- Report spec-validator: `.context/review-reports/feature-admin-ui-saas-refresh-spec-validation.md` (PASS).
- **N4:** plugin redirects nối collection `redirects` vào **cuối** mảng (`payload.config.ts:114-115`) → chỉ sắp lại mảng trong `buildConfig` thì nhóm "Website" vẫn đứng sau "Hệ thống". Cách chỉ đổi config: plugin nhỏ chạy sau cùng sắp lại `collections` theo const nhóm. Kiểm thứ tự thật trong nav trình duyệt.
- **N9:** `pnpm payload migrate:create --skip-empty` (không tương tác); diff `payload-types.ts` so theo nghĩa (interface + shape), không đòi rỗng.
