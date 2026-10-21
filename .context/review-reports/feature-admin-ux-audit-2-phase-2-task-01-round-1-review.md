Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-01 · round 1

Task: `tasks/feature-admin-ux-audit-2/phase-2-task-01.md` (BL-051 GĐ2 A6: thanh chọn hàng loạt nổi ở đáy, A12: cột "Thao tác")

## Review level
**STRICT**

## Reason
Nút xoá mềm / nhân bản / sửa theo từng dòng phải khớp quyền ở server (RBAC theo dòng: admin hoặc tác giả). CSS dùng chung cho mọi danh sách admin. Đi qua pipeline cấu hình collection dùng chung (`ADMIN_COLLECTIONS`). Có gọi REST (PATCH/POST) từ phía client.

## Blast radius
- `src/collections/admin-collections.ts` pipeline → 7 collection (projects, rentals, property-posts, news, job-postings, services, pages) có thêm trường `ui` `rowActions` ở cuối `fields` và `defaultColumns`. Các collection khác giữ nguyên (`withRowActionsColumn` dừng sớm theo slug).
- `_list-actions.scss` (import trong `custom.scss`) → mọi danh sách admin (thanh `.list-selection` / `.collection-list__list-selection`, đệm đáy qua `:has()`), drawer danh sách (đã loại trừ bằng `:not(.list-drawer__header)`).
- `importMap.js` có thêm 1 mục (`RowActionsCell`).
- REST: `PATCH /api/<slug>/<id> {deletedAt}` và `POST /api/<slug>/<id>/duplicate` là endpoint Payload có sẵn. Không đổi API/access/schema.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 lỗi, 2 cảnh báo cũ ở `tools/task-dashboard/server.mjs`, nằm ngoài diff) |
| `pnpm test` (toàn bộ suite) | PASS: 356 file / 3610 test, exit 0 (log stderr về revalidateTag/pg đã có từ trước, không làm test fail) |
| `git diff HEAD -- src/payload-types.ts` | không đổi; không có file migration mới |

## Server access cross-check (focus)
- Access mặc định cho collection nội dung (`src/collections/_shared/content-defaults.ts:188-194`): `update: isAuthorOrAdmin`, `delete: deleteAccess`. Trong đó `deleteAccess` (:80-83) trả `isAuthorOrAdmin` khi `data.deletedAt != null` (xoá mềm) và `isAdmin` khi xoá hẳn.
- Payload 3.91 `updateByID.js:95-119`: với PATCH có `deletedAt`, server áp **cả** `access.update` **lẫn** `access.delete(data)`. Với projects/rentals/property-posts/news/job-postings thì cả hai đều là admin-hoặc-tác-giả, nên quy tắc UI `trash = admin || author` khớp đúng server. Cách xoá mềm `PATCH {deletedAt}` giống nút Xoá của Payload (`@payloadcms/ui/.../DeleteDocument/index.js:93`).
- Sửa = `permissions.update` (đã sanitize: quyền bị từ chối thì key bị xoá, quyền có `where` thì vẫn là object truthy, xem `sanitizePermissions.js:94-108`) và admin-hoặc-tác-giả. Khớp `isAuthorOrAdmin`.
- Nhân bản = `permissions.create` và không `disableDuplicate`. Pages có `disableDuplicate: true` (Pages.ts:36). Dòng do sale nhân bản sẽ thuộc về sale, vì trường `author` có field access `create: isAdmin` cộng hook `defaultToCreator` (`src/fields/author.ts:21-23`). Mở bản sao bằng `router.push` là hợp lệ.
- Services/Pages ghi đè `update/delete: isAdmin` (Services.ts:41, Pages.ts:34). Pages không có `author` nên sale không thấy Sửa/Xoá. Services: xem MINOR-1.
- Trường `ui` không sinh cột DB. `payload-types.ts` không đổi. `hideTechnicalListFields` giữ được cột vì `uiHasCell` (`list-filter.ts:40-41,74`): chỉ ẩn khỏi bộ lọc. Có test ở `row-actions.test.ts:72-82`.
- CSRF/credentials: URL tương đối cùng origin (`config.routes.api`), `credentials: "include"`, `Content-Type: application/json`. Trình duyệt tự gửi `Origin` nên vẫn qua được kiểm CSRF của Payload. OK.
- Bấm đúp: `busy` làm nút Nhân bản/Xoá bị `disabled`. Cập nhật state trong discrete event của React 19 được flush trước lần click sau. Ở nút xác nhận, `ConfirmationModal` đã có trạng thái "đang xác nhận" riêng. Chấp nhận được.
- Làm mới danh sách: `router.refresh()` sau khi xoá, `router.push` tới bản sao sau khi nhân bản. Khi lỗi: toast tiếng Việt cố định và không refresh (có test).
- Thứ tự hooks: mọi hook được gọi trước `return null` sớm (RowActions.tsx:62-69). OK.
- A11y: icon-button có `aria-label` + `title`, SVG `aria-hidden`, link mở tab mới có ghi "(mở tab mới)", dùng `ConfirmationModal` của Payload (heading + body có tên bài + nhãn Huỷ/Xác nhận tiếng Việt), có `:focus-visible`.

## Responsive Checklist Gate
Không có trình duyệt trong vai reviewer. Đối chiếu bằng CSS math cộng bằng chứng trình duyệt của builder (task file §Bằng chứng).
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang (375/768/1280) | OK | Thanh desktop `max-width: calc(100vw - 32px)` + `flex-wrap`. Ô thao tác `inline-flex nowrap`, tối đa 4×44px = 176px nằm trong bảng vốn đã có wrapper cuộn (BL-024). Builder đo ở 375: `scrollWidth = clientWidth = 375` |
| Mobile-first / grid | N/A | Không thêm grid hay media query mới. Chỗ ≤768px dùng thanh có sẵn của Payload |
| Container không fixed px | OK | Không đặt width cố định, chỉ có `max-width` theo viewport |
| Typography rem / clamp | N/A | Không thêm font-size. Spacing dùng px giống các file `styles/_*.scss` admin hiện có |
| Media | N/A | Chỉ có icon SVG inline 18px |
| Touch target ≥ 44×44 | OK | `.tami-row-action` có min 44×44, `.list-selection__button` có `min-height: 44px` (đã có test CSS) |
| Nav / table trên mobile | OK | Không đổi nav. Bảng giữ wrapper cuộn hiện có. Thanh nổi không đè lên BL-050 (header) |
| 100vh / reduced-motion | N/A | Không dùng vh, không có animation |
| Không che lỗi bằng overflow:hidden | OK | Không dùng overflow:hidden |
| Không che hàng cuối / phân trang | OK | `.collection-list:has(.list-selection) { padding-bottom: 140px }`. Builder đo được đáy phân trang 592px < đỉnh thanh 677px ở 375 |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong verify commands được phép chạy của reviewer |
| oxlint (anti-slop) | skip: oxlint chưa cấu hình (không có `.oxlintrc*`). ESLint PASS |
| ocr (open-code-review) | skip: ocr chưa cài / không được phép chạy |
| AI-readable | OK: hàm ≤ 50 dòng (`RowActions` khoảng 80 dòng nhưng phần lớn là JSX, logic quyền đã tách ra hàm thuần `rowActionVisibility`), file ≤ 300 dòng, tên rõ, comment nêu WHY. Có 0–1 indicator (vài magic px trong SCSS đã có comment giải thích) |
| ai-friendly-web | N/A: chỉ admin nội bộ |
| blitzstrike | skip: không có môi trường pentest được phép. Access phía server không đổi |

## Findings

### [MINOR-1] Nút Xoá không kiểm quyền `update`, trong khi server có kiểm
`src/lib/admin/row-actions.ts:51`: `trash: owns`.
- Server xoá mềm cần CẢ `access.update` lẫn `access.delete` (`payload/dist/collections/operations/updateByID.js:95-119`).
- Với Services (`update/delete: isAdmin`, Services.ts:41), nếu admin chuyển `author` sang một sale thì sale sẽ thấy nút Xoá nhưng server từ chối. Khi đó UI chỉ hiện toast tiếng Việt, trang không vỡ. Đây là ca hiếm và đúng nguyên văn spec ("không xét quyền delete cấp danh sách").
- Đề xuất: `trash: owns && Boolean(permissions?.update)`. Cách này vẫn không xét delete cấp danh sách, khớp server cho cả 7 collection, và sửa test `row-actions.test.ts:57` (admin không có permissions → trash false) cho phù hợp. Có thể gộp vào task sau kèm 1 dòng ghi chú ở spec.

### [MINOR-2] Server từ chối theo `where` trả 404, nên toast hiện thông báo chung
`src/components/admin/RowActions.tsx:53`: khi server lọc theo `where` (dòng không thuộc sale), Payload trả 404 chứ không phải 403. Người dùng nhận "Không thực hiện được. Vui lòng thử lại." thay vì thông báo không có quyền. Vẫn là tiếng Việt và không vỡ trang. Có thể map thêm 404 sang thông báo "Không tìm thấy hoặc bạn không có quyền…".

### [MINOR-3] Tham số `locale` chưa được encode khi điều hướng
`src/components/admin/RowActions.tsx:96`: `?locale=${locale}` không encode. Ở dòng 93 thì có `encodeURIComponent`. Locale chỉ là `vi`/`en` nên không gây lỗi thực tế. Nên encode cho nhất quán.

### [MINOR-4] Test CSS chỉ khớp chuỗi; phần loại trừ drawer chưa thử trên trình duyệt
`src/components/admin/list-actions-style.test.ts` dò regex trên source SCSS. Selector nội bộ của Payload (`.list-drawer__header`, `.list-selection`) chưa được kiểm trong ListDrawer thật. Builder đã ghi điều này vào Residual risk. Nên mở thử picker quan hệ một lần khi có dịp.

Không có CRITICAL, không có MAJOR.

## Residual risk
- Selector nội bộ của Payload 3.91 có thể đổi khi nâng cấp Payload (builder đã ghi).
- Bằng chứng trình duyệt (bulk bar ở 375/1280, sáng/tối, luồng sale/admin) đến từ builder. Reviewer chỉ đối chiếu bằng code, CSS math và test.
- Nhân bản rentals/projects (có trường unique/denyAll như `code`, `slug`) dùng cùng endpoint với nút Nhân bản sẵn có của Payload, nên hành vi giống màn sửa. Reviewer không chạy thử.

## Verdict
**PASS**: không có CRITICAL/MAJOR. Có 4 MINOR, có thể xử lý ở task sau.
