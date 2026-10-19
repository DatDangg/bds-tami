Agent: reviewer

# Review — BL-015 · feature-admin-ui-saas-refresh · phase-1-task-04 · round 1

Màn Tổng quan (dashboard) admin theo quyền. Code chưa commit trong worktree `D:/prj/bds-wt15-t01` (branch `wt/bl15-t04`, so với HEAD `f2ce643`).

- **Review level:** STRICT
- **Reason:** đụng permission/RBAC (thẻ số liệu, lối tắt, card nhóm theo quyền), PII lead (họ tên khách), shared navigation (`admin.components.views.dashboard` thay view mặc định cho mọi role), Server Component gọi Local API.
- **Blast radius:** trang `/admin` (dashboard) của mọi role (admin, sale); `src/payload.config.ts` (bỏ `beforeDashboard`, thêm `views.dashboard`); `importMap.js` (thêm `DashboardView`, bỏ `TranslationFailedBanner`); `custom.scss` (+2 partial). Không có API/endpoint mới, không đổi access/schema/hook. `payload-types.ts` chỉ khác CRLF (`git diff --stat` rỗng), không có migration.

## Verify commands + result (chạy trong `D:/prj/bds-wt15-t01`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 249 file / 2623 test (exit 0), khớp số của Builder; `DATABASE_URL_TEST` → `tami_wt15_t01` |
| `pnpm build` | PASS (exit 0) |

## Đã kiểm (trọng tâm STRICT)

- `granted()` (`dashboard-data.ts:74-77`): chỉ `true` hoặc `{permission: true, ...}` mới được tính; `{permission:false}`/`undefined` → false. OK.
- Mọi `count`/`find` dùng `overrideAccess:false` + `user` (`dashboard-data.ts:88,132-133,166-167`). Thẻ bị lọc trước khi đếm: phải có `read` với MỌI collection trong thẻ (`:97`), nên không gọi `count` cho collection ngoài quyền. OK. (Dùng `user` chứ không dùng `req`, xem MINOR-3.)
- Sale: `saleCards` không có thẻ `applications-new`/`leads-unassigned`; vai trò ngoài admin rơi vào tập thẻ của sale (hẹp hơn). Thẻ "của mình" có thêm `author = userId` (N1). Test integration xác nhận số đếm chính xác. OK.
- Lối tắt: danh sách cố định (N3), lọc theo `create`; test xác nhận sale không có services/pages. OK.
- "Lead mới nhất": `select` hẹp (code, fullName, source, status, assignedTo, createdAt), populate staff chỉ lấy `fullName`; không có phone/email/message; test kiểm cả key set. Sale chỉ thấy lead được giao (access `isAssignedOrAdmin`). OK.
- Card nhóm: điều kiện là `visibleEntities` (đã loại `admin.hidden`) VÀ có `read`; globals có `read: () => true` vẫn bị loại vì `hideFromNonAdmin`. Đã có test. OK.
- Link lọc sẵn: field/status đúng (`leads.status` new/contacted/consulting, `assignedTo`, `job-applications.status = "new"` có trong `APPLICATION_STATUSES`). OK.
- Xoá mềm: test chứng minh `count` mặc định bỏ bản đã xoá (2 so với 3 khi `trash:true`); `find` cũng vậy. OK.
- `TranslationFailedBanner`: Payload 3.91 chỉ render `beforeDashboard` trong `DefaultDashboard` (`@payloadcms/next/dist/views/Dashboard/Default/index.js:23`), và thay view thì cả `DefaultDashboard` bị thay (`Dashboard/index.js:35-36`). View mới render banner trực tiếp (`DashboardView.tsx:26`). Gỡ entry khỏi importMap là an toàn: config không còn tham chiếu banner theo path, chỉ còn import trực tiếp. Đây đúng là output của generator nên CI check lệch importMap vẫn khớp. OK.
- Lời chào tính theo giờ `Asia/Ho_Chi_Minh` (`hourCycle: h23`), có unit test. OK.
- Không có migration, `payload-types.ts` không đổi shape. Mọi file ≤ 300 dòng (lớn nhất 216), mọi hàm ≤ 50 dòng. OK.

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS math vì không có browser)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Mọi grid dùng `minmax(0,1fr)`; `.tami-dash-card` có `min-width:0`; header dùng `flex-wrap` với `flex:1 1 240px`. Ở 375px nút "Tạo mới" xuống hàng; menu `min-width:220px`, `left:0` trên mobile nên vừa trong ~343px. |
| Mobile-first `min-width` | OK, ngoại lệ có lý do | Dùng `max-width` 1023/767 giống quy ước desktop-first của Payload, cùng tiền lệ đã chấp nhận ở T01. |
| Grid `auto-fit`/`minmax` | OK, ngoại lệ có lý do | Design §6 yêu cầu số cột cố định: 4 (≥1024) / 2 (768–1023) / 1 (<768). CSS: `repeat(4)` → `@media (max-width:1023px)` 2 → `(max-width:767px)` 1. Đúng ở cả 375/768/1280. |
| Font `rem`, heading `clamp()` | OK, ngoại lệ có lý do | Admin Payload dùng px; design §1.5/§1.6 chốt px. Cùng tiền lệ T01. |
| Media | N/A | Chỉ có SVG icon inline, không có ảnh/video. |
| Touch target ≥ 44×44 (mobile) | **FAIL** | Link "Xem tất cả" trong tiêu đề card (`_dashboard-lists.scss:225-230`) chỉ có `font-size:13px`, nằm trong h2 `line-height:24px`, nên vùng bấm cao khoảng 24px. Block `@media (max-width:767px)` (`:361-376`) không nâng vùng bấm này. Các mục khác đã đạt 44px trên mobile: nút "Tạo mới", item menu, item card nhóm, tiêu đề item danh sách. Thẻ số liệu đủ lớn. |
| Nav mobile | N/A | Diff không đụng sidebar/nav của Payload. |
| Bảng mobile | N/A | Không có table (dùng list). |
| `100vh` | OK | Không dùng. |
| `prefers-reduced-motion` | OK / N/A | Không có animation hay transition. |
| Không che lỗi bằng `overflow:hidden` | OK (xem MINOR-2) | `overflow:hidden` chỉ dùng cho ellipsis tiêu đề. |

Residual risk: chưa kiểm trực quan 1440/768/390 sáng + tối, Builder cũng ghi là chưa chạy trình duyệt. Màu badge dark mode phụ thuộc token `--admin-badge-*` của T01.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: không có trong verify commands được allow |
| oxlint (anti-slop) | skip: chưa cấu hình oxlint (không có `.oxlintrc.json`). ESLint PASS |
| ocr (open-code-review) | skip: ocr chưa cài |
| AI-readable | OK: tên rõ nghĩa, hàm ngắn, comment giải thích WHY, magic number có tên (`RECENT_LIMIT`, `TIME_ZONE`). 0 indicator (doc `docs/ARCHITECTURE.md` được hoãn sang close-out, đã ghi trong task) |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | skip: không có môi trường được phép. Không có input/API public mới |

## Findings

### [MAJOR]
1. **Touch target "Xem tất cả" < 44px trên mobile.** Vị trí: `src/components/admin/styles/_dashboard-lists.scss:225-230` (không được xử lý trong block `@media (max-width: 767px)` tại `:361-376`). Vi phạm design §6 ("vùng chạm 44px" ở < 768) và gate responsive.
   **Cách fix:** trong block mobile, thêm `.tami-dash-card__title a { display: inline-flex; align-items: center; min-height: 44px; }`, có thể kèm padding ngang. Cần kiểm lại tiêu đề card không bị cao lên quá mức.

### [MINOR]
1. **Integration test admin có thể flaky khi chạy song song trên DB chung.** Vị trí: `tests/integration/admin-dashboard.test.ts:154-164`. Test assert `toBe(manualNew.totalDocs)` / `toBe(manualUnassigned.totalDocs)`, nhưng số thủ công lấy sau khi thẻ đã đếm. Vitest chạy nhiều file song song, nên file khác tạo/xoá lead trong khoảng giữa hai lần đếm sẽ làm test fail.
   **Cách fix:** đếm thủ công cả trước và sau, rồi assert `before ≤ card ≤ after` (hoặc chỉ giữ `>=` phần dữ liệu tự tạo).
2. **Mất dấu "…" của tiêu đề danh sách trên mobile.** Vị trí: `_dashboard-lists.scss:372-375`. Khi `.tami-dash-list__title` thành `display:inline-flex`, `text-overflow: ellipsis` không còn tác dụng với text con (text con là anonymous flex item), nên tên dài bị cắt cụt mà không có "…".
   **Cách fix:** giữ `display:block` và đạt 44px bằng `min-height` + `line-height`/padding, hoặc bọc text trong `<span>` có ellipsis.
3. Design §3 nói dùng `req`, nhưng code truyền `user` (`dashboard-data.ts:88,132,166`). Access vẫn đúng. Tuy nhiên mỗi lần gọi tạo req mới (không dùng chung dataloader/locale của request). Nên cân nhắc truyền `req` từ `initPageResult`. Không chặn.
4. Ghi nhận cho spec-validator, không phải defect: design §3.1 ghi card nhóm "+ số bản ghi", nhưng Builder cố ý bỏ (quyết định (5), tránh khoảng 25 `count`). Gỡ entry `TranslationFailedBanner` khỏi importMap lệch so với task mục 10, nhưng đúng và an toàn (xem trên).

## Verdict

❌ **FAIL**: còn 1 MAJOR (MAJOR-1, touch target responsive). Phần quyền/PII/soft-delete/banner/verify đều đạt. Builder chỉ cần sửa CSS MAJOR-1 (nên kèm MINOR-1, MINOR-2) rồi review round 2.
