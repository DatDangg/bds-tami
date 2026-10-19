# feature-admin-ui-saas-refresh · phase-1-task-05 — Màn danh sách: badge trạng thái, thumbnail, cột mặc định

- Change doc: BL-015 · Spec: FR-ADM-19 · Design: §1.3, §4, §7 Q5 (projects = gallery[0]) / Q6 (48px)
- Phụ thuộc: T01, T02, T03 · Song song: ∥ T04

## Classification / Risk
- Type: **MODIFY** · Risk: **MEDIUM** — Cell dùng chung nhiều collection; thumbnail đọc relation ảnh (không lộ ngoài quyền, không N+1 nặng).
- Expected review level: **NORMAL** · Blast radius: list view các collection chính.
- Doc impact: no doc impact (trừ ARCHITECTURE nếu liệt kê component admin).

## Yêu cầu
1. `src/components/admin/status-tones.ts`: map value → tone (neutral/success/warning/danger/info/accent) cho `CONTENT_STATUSES`, `LEAD_STATUSES`, `APPLICATION_STATUSES`, `SALES_STATUSES`, trạng thái rentals, translation status — import value từ nguồn hiện có; test: **mọi** value có tone (thiếu → FAIL).
2. `StatusBadge` (chữ + chấm 6px, token §1.3, nhãn lấy label option tiếng Việt) gắn `admin.components.Cell` cho field trạng thái các collection chính (projects status/salesStatus, rentals, property-posts, news, job-postings, job-applications, leads, services, pages — nơi có).
3. `ThumbnailCell` 40×40 bo 6px `object-fit: cover`, `loading="lazy"`, alt rỗng, size `thumbnail` của Media: projects + rentals = ảnh đầu `gallery`, property-posts + news = `cover`; cột đầu trong `defaultColumns`. Kiểm Payload list truyền `cellData` dạng id hay object — chọn cách không N+1 lớn; ghi lý do + số query/trang 10 dòng.
4. Rà `defaultColumns` theo mock (bỏ cột kỹ thuật; `assigneeInactive` → badge "Sale đã nghỉ" cạnh người phụ trách nếu làm được bằng Cell, không thì giữ).
5. Trạng thái rỗng: giữ Payload.
6. Test unit: StatusBadge (nhãn + tone), ThumbnailCell (có/không ảnh).
7. `pnpm generate:importmap`.
8. Không sửa file dashboard của T04 (primary điều phối việc thay badge tạm); chỉ xuất `StatusBadge` dùng lại được.

## Acceptance
- [ ] Badge có chữ, đủ tone mọi value (test), contrast theo token
- [ ] Thumbnail hiện ở 4 collection, không lộ dữ liệu ngoài quyền, query hợp lý
- [ ] Trình duyệt list Projects, Leads, Rentals, News 1440/390 sáng+tối
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
- `pnpm lint` PASS (0 warning) · `pnpm typecheck` PASS · `pnpm test` PASS (248 file / 2600 test, gồm status-tones.test.ts, StatusBadge.test.tsx, ThumbnailCell.test.tsx) · `pnpm build` PASS.
- `pnpm generate:importmap`: +8 dòng `importMap.js` (StatusBadgeCell, ThumbnailCell, TitleLinkCell, AssigneeCell). Primary regenerate sau merge T04.
- Không migration: `pnpm payload migrate:create --skip-empty` không tạo file; `pnpm generate:types` → `payload-types.ts` không đổi (chỉ khác EOL).
- Thumbnail: `ThumbnailCell` (client) dùng `useListRelationships` của Payload: list depth 0 nên cellData là id; Payload gom id media cả trang thành 1 request `GET /api/media?where[id][in]=…&depth=0` (media read công khai). Trang 10 dòng = +1 HTTP request (~2 truy vấn SQL: find + count), không N+1 (10). Size `thumb` (400px webp) → `thumbnailURL` → `url`. Thiếu/đang tải/lỗi ảnh → khung trung tính.
- Cột đầu là ảnh nên link sửa của Payload rơi vào ảnh (trang trí): thêm `TitleLinkCell` trên `titleField` ép `link` để tiêu đề vẫn bấm/Tab được.
- Chưa kiểm trình duyệt 1440/390 sáng+tối (không chạy dev server trong worktree): primary/reviewer kiểm; `assigneeInactive` đã bỏ khỏi defaultColumns, badge "Sale đã nghỉ" dựa vào rowData.assigneeInactive (list không dùng select API nên có dữ liệu) — cần xác nhận bằng mắt.

## Ghi chú spec-validator (pre-plan)
- Report spec-validator: `.context/review-reports/feature-admin-ui-saas-refresh-spec-validation.md` (PASS).
- **N8:** `ThumbnailCell` cần fallback khi ảnh đầu `gallery` hỏng/thiếu (placeholder trung tính).
- Song song với T04: `importMap.js` sẽ conflict — primary regenerate sau merge. Style list đặt trong khối riêng có comment ở `custom.scss`.

## Attempt log
- **Attempt 1:** implement StatusBadge/ThumbnailCell/TitleLinkCell/AssigneeCell + defaultColumns. Reviewer round 1 FAIL (MAJOR: ListDrawer không chọn được bản ghi).
- **Attempt 2 (sửa round 1):**
  - MAJOR: Cell tuỳ biến bỏ qua `RenderDefaultCell` (renderCell.js:129-136) nên mất nhánh drawer (`RenderDefaultCell/index.js:33-56`: cột link + `drawerSlug` → nút gọi `onSelect`). Thêm `LinkedCell.tsx` tái hiện đúng hành vi đó (`useListDrawerContext`): link → `<Link>` ngoài drawer, nút `onSelect` trong drawer. `TitleLinkCell`, `AssigneeCell`, `StatusBadgeCell` bọc nội dung bằng `LinkedCell` (theo cờ `props.link` của Payload).
  - MINOR 2: `TitleLinkCell` chỉ ép link khi cột đang bật đầu tiên là `gallery`/`cover` (`useTableColumns`); xếp cột khác lên đầu → theo `link` của Payload (một link/hàng). `ThumbnailCell` luôn trang trí (không link).
  - MINOR 3: `_badges.scss` font-size/line-height → rem. MINOR 5: ẩn `.sort-column__buttons` trong header cột ảnh (Payload không có cờ tắt sort cho field thật).
  - MINOR 4: test field thật (statusField, translation.status: Cell + nhãn tiếng Việt), LinkedCell/TitleLinkCell (link vs drawer onSelect)/AssigneeCell.
