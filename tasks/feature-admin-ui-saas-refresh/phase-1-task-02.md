# feature-admin-ui-saas-refresh · phase-1-task-02 — Việt hoá toàn bộ nhãn admin + test quét config

- Change doc: BL-015 · Spec: FR-ADM-19 · Design: §0/§0.1 (bảng 489 field, 13 array), §5 (nhãn hàng array)
- Phụ thuộc: — · Song song: ∥ T01

## Classification / Risk
- Type: **MODIFY** · Risk: **MEDIUM** — chạm ~25 file collection/global/field nhưng chỉ `label`/`labels`/`admin.description`/`RowLabel`.
- Expected review level: **NORMAL** · Blast radius: config Payload (không runtime logic); `payload-types.ts` có thể đổi comment.
- Doc impact: no doc impact (nhãn hiển thị) trừ khi doc liệt kê nhãn.

## Yêu cầu
1. `labels: { singular, plural }` tiếng Việt cho **mọi** collection (21 + `redirects` qua `overrides` trong `src/collections/redirects-plugin.ts`, kể cả Media/PrivateFiles); dùng lại `COLLECTION_LABELS`/`GLOBAL_LABELS` ở `src/lib/translation/admin-ui.ts` làm nguồn chung (mở rộng cho đủ, không để hai nguồn lệch). `label` 4 global (đã có — kiểm).
2. `label` tiếng Việt cho **mọi field hiển thị** (không `admin.hidden: true`), kể cả trong group/array/row/collapsible/blocks, field dùng chung (`src/fields/*`, `src/collections/_shared/content-defaults.ts`) — gắn một lần ở nguồn chung. Field plugin redirects (from/to/type…) qua `overrides.fields` nếu cần.
3. Array/blocks: `labels: { singular, plural }` cho 13 array (§0.1); `admin.components.RowLabel` đơn giản (component trong `src/components/admin/row-labels/`) cho array có giá trị chính dễ đọc (gợi ý: floorPlans, navItems, columns/links, socialLinks, hero.slides — builder chọn, ghi lý do). Thêm component → `pnpm generate:importmap`.
4. `admin.description` 1 câu tiếng Việt cho collection chính (projects, rentals, property-posts, news, job-postings, job-applications, leads, services, pages, media).
5. Option select đã có nhãn — chỉ kiểm, sửa nếu còn tiếng Anh.
6. Test `tests/unit/admin-labels.test.ts` (hoặc vị trí hợp convention): đọc config thô (không cần DB), duyệt đệ quy mọi collection (gồm redirects) + global: (a) mọi collection có `labels.singular/plural` không rỗng; (b) mọi field có `name` và không `admin.hidden` có `label` (chuỗi hoặc object có `vi`); field `ui` không tên bỏ qua; (c) mọi array/blocks có `labels` hoặc RowLabel; (d) mọi option select có label. Chứng minh test FAIL khi bỏ 1 label (ghi vào verification summary).
7. **Không** đổi `name`, kiểu, `required`, `localized`, `index`, access, hook. **Không** thêm `admin.group` (T03 làm).

## Acceptance
- [ ] Test quét PASS + kiểm âm tính
- [ ] Admin hiện tiếng Việt cho nhãn field/collection/global/array (trình duyệt: form Projects, Leads, Site settings, list Redirects)
- [ ] Không migration, `payload-types.ts` không đổi kiểu
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

**Phạm vi đã làm (builder, worktree `D:\prj\bds-wt15-t02`)**
- Nhãn gắn mới: **251 `label`** (diff `src/collections`, `src/globals`, `src/fields`), **13 `labels`** array (đủ 13 array §0.1), **22 `labels` collection** (21 + `redirects` qua `overrides`), **4 `label` global** (kiểm lại), **`admin.description`** cho tất cả 22 collection + 4 global (26, gồm 10 collection chính yêu cầu; 47 dòng `description:` mới trong diff khi tính cả mô tả field) + mô tả 1 câu cho một số field khó hiểu (seo.metaTitle, gallery, hero video, GA4, số liệu, nút CTA…).
- Nguồn nhãn chung: **mới** `src/lib/admin/collection-labels.ts` (`ADMIN_COLLECTION_LABELS` 22 collection, `ADMIN_GLOBAL_LABELS` 4 global, helper `collectionLabels(slug)`). Theo bổ sung spec-validator N5: **không mở rộng khoá** `COLLECTION_LABELS` ở `src/lib/translation/admin-ui.ts` (banner dịch lỗi query theo tập khoá đó) — map cũ giữ 9 khoá, chuỗi lấy từ nguồn mới (`plural`), `GLOBAL_LABELS = ADMIN_GLOBAL_LABELS`. Nhãn lệch "Đầu trang" vs "Menu đầu trang" → chốt **"Menu đầu trang"** (khớp `Header.ts` hiện có).
- Field dùng chung gắn một lần ở nguồn: `src/fields/{author,is-featured,name,nav-link,published-at,scoped-category,search-reindex-pending,seo,slug,status,title,translation}.ts` (phủ `slug/status/publishedAt/author/isFeatured/hasEnglish/translation.*/seo.*/title/name/category/link` cho mọi collection nội dung + global).
- RowLabel: **một component dùng chung** `src/components/admin/row-labels/TextRowLabel.tsx` (client, `useRowLabel`, props `field`/`fallback`/`valueLabels`) + helper `src/lib/admin/row-label.ts` (`textRowLabel()`), gắn cho **cả 13 array**: projects.amenities(name), projects.floorPlans(title), wards.legacyNames(name), homepage.hero.slides(title), homepage.about.stats(label), homepage.blockOrder(block → nhãn Việt), site-settings.socialLinks(platform → nhãn), site-settings.notificationEmails(email), site-settings.translationGlossary(vi), header.navItems(label), header.navItems.children(label), footer.columns(title), footer.columns.links(label). Lý do chọn 1 component + `clientProps` thay vì 13 file: mọi array đều có đúng một trường chuỗi chính; đỡ 12 file gần giống nhau và 12 entry importMap. `pnpm generate:importmap` đã chạy (thêm 1 entry `TextRowLabel`).
- Option select còn mã thô tiếng Anh đã Việt hoá (giữ nguyên `value`): `translation.status` (Chưa dịch/Đang chờ dịch/Đã dịch/Dịch lỗi/Chờ duyệt), `translation.enSource` (AI dịch/Sửa tay), `staff.role` (Quản trị viên/Nhân viên sale), `audit-logs.action` (16 hành động), `click-events`/`click-stats-daily.type` (`CLICK_TYPE_LABELS` mới ở `src/lib/click-stats/click-types.ts`), `site-settings.socialLinks.platform`, `homepage.blockOrder.block`, `lead-activities.fromStatus/toStatus` (dùng `STATUS_LABELS` của Leads), `redirects.type` ("301 (vĩnh viễn)"). Các option đã có nhãn Việt sẵn giữ nguyên.
- Không đổi `name`, kiểu, `required`, `localized`, `index`, access, hook; không thêm `admin.group` (T03).

**Test quét** `tests/unit/admin-labels.test.ts` (project `unit`, không DB): nạp mọi export config trong `src/collections/*.ts`, `src/globals/*.ts` bằng `readdir` + `import` (collection mới tự được kiểm), `redirects` lấy bằng cách áp `contentRedirectsPlugin()` lên config rỗng. Rule: (a) `labels.singular/plural` không rỗng; (b) mọi field có `name` và không `admin.hidden` có `label` (chuỗi hoặc `{vi}`); tab phải có label; (c) array/blocks có `labels` hoặc `RowLabel`; (d) option select/radio là object có label không rỗng **và khác giá trị thô** (N6). Kết quả: **28/28 PASS**.
- Kiểm âm tính: (1) test fixture trong file (field thiếu label, array thiếu labels, option rỗng / dạng chuỗi / label = value, field trong `row`) → đúng 6 thông báo kỳ vọng; (2) chạy test TRƯỚC khi gắn nhãn: **26 failed / 2 passed** (toàn bộ 22 collection + 4 global); (3) mutation thật: bỏ `label: "Tên"` khỏi `src/fields/name.ts` → `2 failed | 26 passed` ("categories.name: thiếu label", "developers.name: thiếu label"); khôi phục → 28/28 PASS.

**Bằng chứng không đổi schema**
- `pnpm generate:types`: `src/payload-types.ts` **+163 / −0 dòng**, lọc bỏ dòng comment (`/**`, `*`, `*/`) còn **0 dòng** → chỉ thêm JSDoc từ `admin.description`; không đổi tên interface/khoá/kiểu. Giữ bản sinh mới.
- `pnpm payload migrate:create bl015-t02-check --skip-empty` trên DB `tami_wt15_t02` (N9): log "Migration UP complete… DOWN statements generation complete", **không sinh file** (`ls migrations | grep bl015` rỗng, `git status migrations` sạch).

**Verify commands (worktree)**
- `pnpm lint` → PASS (0 lỗi). Không có config oxlint trong repo → bỏ qua `npx oxlint`.
- `pnpm typecheck` → PASS.
- `pnpm test` → 243 file: **242 PASS, 1 FAIL do timeout 5s** ở `src/components/layout/Header.test.tsx` ("bẫy focus: Tab / Shift+Tab…", test UI public không liên quan task, chạy dưới tải full suite 191s). Chạy lại riêng file: **16/16 PASS**. 2558/2559 test PASS ở lần full + file đó PASS khi chạy riêng.
- `pnpm build` → PASS (exit 0).
- Trình duyệt (dev server worktree cổng 3102, đã tắt sau khi xong; Postgres rơi vào recovery mode 1 lần lúc khởi động, chờ hồi rồi tải lại): sidebar đủ 22 collection + 4 global tiếng Việt; **list Projects** cột "Tiêu đề / Danh mục / Tình trạng mở bán / Trạng thái / Ngày xuất bản / Người tạo" + mô tả collection; **form Projects** mọi nhãn Việt (Chủ đầu tư, Quy mô dự án, Tiện ích với RowLabel hiện "Công viên cây xanh", Thư viện ảnh, Mặt bằng, Tài liệu (PDF), Bản dịch tiếng Anh, SEO, sidebar Đường dẫn (slug)/Trạng thái/Ngày xuất bản/Người tạo/Nổi bật trên trang chủ/Có bản tiếng Anh); **Leads**: DB worktree không có lead và admin không tạo được lead (`create: denyAll`) nên kiểm nhãn field qua ô tìm ("Tìm với Mã lead hoặc Họ tên khách") + bảng chọn cột (Nguồn lead, Sale phụ trách, Sale phụ trách đã bị khoá, Lý do không thành…) + mô tả collection; **Site settings** đủ nhãn (Tên website, Logo trên nền tối, Hotline, Link Zalo, Mạng xã hội, Email nhận thông báo, Thuật ngữ dịch cố định, Bật dịch tự động…); **Redirects** list "Chuyển hướng URL" + mô tả, form tạo: Đường dẫn cũ / Chuyển đến / Loại chuyển hướng.

**Residual risk**
- Form Leads chưa xem trực tiếp với bản ghi thật (không có dữ liệu lead trong DB worktree); nhãn đã được test quét + bảng chọn cột xác nhận.
- `payload-types.ts` sinh lại trên worktree; T01 không đụng file này nên không xung đột, nhưng primary cần giữ bản sinh của T02 khi gộp.
- Nhãn option `translation.status`/`enSource` đổi từ mã sang chữ Việt: chỉ ảnh hưởng hiển thị admin (filter FR-ADM-18 dùng điều kiện theo `value`, không theo nhãn).
- Doc impact: **no doc impact** (chỉ nhãn hiển thị; không đổi API/schema/behavior).
