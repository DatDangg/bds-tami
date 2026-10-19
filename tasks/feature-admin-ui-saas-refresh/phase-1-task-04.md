# feature-admin-ui-saas-refresh · phase-1-task-04 — Màn Tổng quan (dashboard) theo quyền

- Change doc: BL-015 · Spec: FR-ADM-19 (FR-ADM-14 cắm sau ở L13-T01) · Design: §3, §3.2, §7 Q1/Q2/Q4
- Phụ thuộc: T01 (tokens), T03 (const nhóm) · Song song: ∥ T05

## Classification / Risk
- Type: **MODIFY** · Risk: **HIGH** — phân quyền số liệu (sale không được thấy số/lối tắt ngoài quyền), Server Component chạy Local API.
- Expected review level: **STRICT** (auth/RBAC) · Blast radius: trang `/admin` mọi role.
- Doc impact: as-built `docs/ARCHITECTURE.md` (dashboard admin) + ghi chú vào `tasks/tami-website/layer-13-task-01.md` (FR-ADM-14 cắm vào khung BL-015). Decision: append `.context/decisions.md`.

## Yêu cầu
1. `admin.components.views.dashboard.Component` → Server Component trong `src/components/admin/dashboard/*` (chia file nhỏ). Giữ `TranslationFailedBanner` hiển thị (render trong dashboard hoặc giữ `beforeDashboard` — không mất).
2. Header: "Chào buổi sáng/chiều/tối, <tên>" theo giờ Asia/Ho_Chi_Minh + ngày; nút "Tạo mới" mở lối tắt theo quyền `create`.
3. Thẻ số liệu (§3.2, §7 Q1): admin — lead mới (status=new), lead chưa phân công (new & chưa có người phụ trách), hồ sơ ứng tuyển mới (job-applications status=new), nội dung đang hiển thị (published của projects, rentals, property-posts, news). Sale — lead mới được giao (access tự lọc), lead đang xử lý (contacted + consulting), bản nháp của mình (draft & author = mình, 4 loại), tin đang đăng của mình. **Không** "so với hôm qua". Đếm bằng `payload.count({ collection, where, req, overrideAccess: false })`. Đọc code để lấy đúng tên field/giá trị status trước khi viết where.
4. Thẻ/lối tắt/khối chỉ render khi user có quyền (`read` cho thẻ + danh sách, `create` cho lối tắt) — lấy từ permissions của Payload trong view props / `req`, không chỉ ẩn bằng CSS, không gọi count với collection không có quyền.
5. Click thẻ → list lọc sẵn (`/admin/collections/<slug>?where[...]`).
6. "Lead mới nhất" (5 dòng, `find limit 5`, `overrideAccess:false`, `select` hẹp) + "Bạn sửa gần đây" (nguồn rẻ, đúng quyền — builder chọn, ghi lý do). Badge: nếu `StatusBadge` (T05) chưa có thì badge tối giản bằng token; ghi follow-up để thay khi T05 merge.
7. Card "Danh mục quản lý" theo const nhóm T03, chỉ mục có quyền `read`; icon inline SVG nhỏ chỉ ở dashboard, không thêm dependency.
8. Responsive §6: 4 cột ≥ 1024, 2 cột 768–1023, 1 cột < 768.
9. Test integration (DB riêng như các integration test hiện có): admin vs sale — số đếm đúng phạm vi, sale không thấy thẻ hồ sơ ứng tuyển / lead chưa phân công, không có lối tắt collection không có quyền create (services/pages/staff…), không lộ PII ngoài quyền. Test unit phần trình bày.
10. `pnpm generate:importmap` — `importMap.js` chỉ thêm entry mới.

## Acceptance
- [ ] Dashboard đúng thẻ/lối tắt theo quyền admin/sale; số đếm khớp truy vấn thủ công
- [ ] Không endpoint/API mới, không đổi access
- [ ] Test integration quyền PASS
- [ ] Responsive 1440/768/390 sáng + tối
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
- Builder (attempt 1, worktree bds-wt15-t01): `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (249 file / 2623 test, gồm `tests/integration/admin-dashboard.test.ts` 8 test trên DB thật + 3 file unit/ui mới) · `pnpm build` PASS (exit 0, SCSS biên dịch).
- Không migration: `pnpm payload migrate:create --skip-empty` không tạo file (migrations/ không đổi); `src/payload-types.ts` không đổi nội dung (chỉ cảnh báo CRLF của git). `pnpm generate:importmap`: thêm `DashboardView`, BỎ entry `TranslationFailedBanner` (không còn khai trong config vì view mới tự render banner) — lệch so với "chỉ thêm entry", cần primary chạy lại generate:importmap sau khi merge với T05.
- Quyết định: (1) `admin.components.views.dashboard.Component` = `DashboardView` (Server Component); bỏ `beforeDashboard` (chỉ chạy ở dashboard mặc định) và render `TranslationFailedBanner` trong view. (2) "Bạn sửa gần đây" -> "Bài của bạn cập nhật gần đây": bài mình là `author` ở 4 loại (projects/rentals/property-posts/news), 4 `find limit 5 sort -updatedAt` rồi gộp 5 — vì không có field người sửa cuối. (3) `permissions.collections[slug].read` có thể là `{permission:true, where}` (sale đọc lead) chứ không chỉ `true` -> helper `granted()`; bắt được qua test integration. (4) `count` mặc định bỏ bản xoá mềm (test chứng minh), không thêm `deletedAt`. (5) Card nhóm không kèm số bản ghi (tránh ~25 truy vấn `count`/lần tải; task mục 7 không bắt buộc). (6) Thẻ gộp nhiều loại (nội dung/bản nháp) không có link lọc.
- Follow-up: badge dashboard dùng bản tối giản `DashboardBadge.tsx` + class `.tami-dash-badge` (token `--admin-badge-*`) -> thay bằng `StatusBadge` T05 rồi xoá `DashboardBadge.tsx` và khối badge trong `_dashboard-lists.scss`.
- Chưa làm (primary/close-out): doc reconcile `docs/ARCHITECTURE.md` (dashboard admin), ghi chú vào `tasks/tami-website/layer-13-task-01.md`, append `.context/decisions.md`; kiểm trực quan 1440/768/390 sáng+tối (chưa chạy trình duyệt).

## Ghi chú spec-validator (pre-plan) — BẮT BUỘC
- Report spec-validator: `.context/review-reports/feature-admin-ui-saas-refresh-spec-validation.md` (PASS).
- **N1:** sale đọc được **mọi** bài nội dung (`src/access/publishedOnly.ts:20-24`) → `overrideAccess:false` KHÔNG lọc theo tác giả; thẻ "của mình" (bản nháp, tin đang đăng) phải thêm `author = req.user.id` rõ ràng (`src/fields/author.ts:14`; `pages` không có author).
- **N2:** thẻ "đang hiển thị" dùng lại `PUBLIC_STATUSES` / `buildPublicWhere` (cho thuê tính cả `rented`).
- **N3:** lối tắt = danh sách **cố định** collection nội dung, lọc theo quyền `create` (lặp mọi collection → sale có lối tắt "Lịch sử chăm sóc", `LeadActivities.ts:76`).
- Card nhóm: lọc theo cả quyền `read` **và** `admin.hidden` (globals `read: () => true` nhưng ẩn bằng `hideFromNonAdmin` — `Footer.ts:15-16`, `Header.ts:17-18`, `SiteSettings.ts:56-57`, `Homepage.ts:193-194`).
- Sale không đọc `job-applications` (`JobApplications.ts:83`); thẻ "chưa phân công" ẩn theo role (sale có read leads, `isAssignedOrAdmin` `Leads.ts:187`); người phụ trách = `assignedTo` (`Leads.ts:119`).
- "Bạn sửa gần đây": không có field người sửa cuối → nhãn phải đúng nghĩa nguồn dữ liệu thật (vd "Bài của bạn cập nhật gần đây" theo `author`, hoặc audit-logs nếu admin).
- Chưa xác minh: `count` trên collection có `trash` có loại bản xoá mềm không → chứng minh bằng test.
- Song song với T05: `importMap.js` sẽ conflict — primary chạy lại `pnpm generate:importmap` sau merge (CI kiểm lệch `ci.yml:148-151`). Style dashboard đặt trong khối riêng có comment ở `custom.scss` (hoặc SCSS module riêng).

## Verification summary (attempt 2)
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm build` PASS · `pnpm test` 2622/2623 ở lần chạy toàn bộ: 1 fail ngoài scope (`Header.test.tsx` bẫy focus — timeout do tải máy); chạy lại riêng file đó + `admin-dashboard.test.ts` PASS (24/24). Không migration.

## Attempt log
- Attempt 1: implement dashboard (xem trên). Reviewer round 1 FAIL: MAJOR-1 touch target "Xem tất cả" < 44px.
- Attempt 2: (1) `.tami-dash-card__title a` mobile `inline-flex; min-height:44px`; rà các link khác: thẻ số liệu (padding lớn), nút Tạo mới + item menu (44px), card nhóm (44px), item danh sách (44px) đều đạt. (2) test admin: đếm thủ công trước + sau, assert `min ≤ thẻ ≤ max`. (3) `.tami-dash-list__title` mobile `display:block; line-height:44px` giữ ellipsis (không đổi JSX). (4) Giữ `user` thay vì `req`: view nhận props server (payload/user/permissions) chứ không có `req`; tạo req chỉ để dùng chung dataloader đổi chữ ký context + test mà không đổi kết quả/quyền (`overrideAccess:false` + `user` vẫn áp access đầy đủ). Không đổi.
- Chưa kiểm trực quan trình duyệt 1440/768/390.

- Ghi chú primary (close-out): reviewer r2 MINOR — lý do "view không có req" không đúng: Payload 3.91 có truyền `initPageResult.req` cho view dashboard (`@payloadcms/next/dist/views/Dashboard/index.js:21-23`). Giữ `user` + `overrideAccess:false` vẫn đúng quyền; chuyển sang `req` là cải tiến tuỳ chọn.
- Follow-up: thay `DashboardBadge` bằng `StatusBadge` (T05) — làm trong T06.
