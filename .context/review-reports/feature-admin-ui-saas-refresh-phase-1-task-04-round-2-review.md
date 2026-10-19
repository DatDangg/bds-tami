Agent: reviewer

# Review: BL-015 · feature-admin-ui-saas-refresh · phase-1-task-04 · round 2

Code chưa commit trong worktree `D:/prj/bds-wt15-t01` (branch `wt/bl15-t04`, so với HEAD `f2ce643`). Builder báo Attempt 2 trong task file, mục Attempt log.

- **Review level:** STRICT, giữ nguyên round 1
- **Reason:** đụng RBAC (thẻ/lối tắt/card theo quyền), PII lead, shared navigation (thay view dashboard mặc định cho mọi role), Local API trong Server Component.
- **Blast radius:** không đổi so với round 1. Trang `/admin` của mọi role, `payload.config.ts` (`views.dashboard`), `importMap.js`, `custom.scss` (+2 partial). Round 2 chỉ sửa SCSS (`_dashboard-lists.scss` block mobile) và `tests/integration/admin-dashboard.test.ts`. Không có API/schema/migration/access mới.

## Verify commands + result (chạy trong `D:/prj/bds-wt15-t01`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 249 file / 2623 test (exit 0), chạy full. Lần này `Header.test.tsx` cũng PASS. |
| `pnpm build` | PASS (exit 0) |

## Đóng finding round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: "Xem tất cả" < 44px trên mobile | **Đã đóng** | `_dashboard-lists.scss:179-184`, trong `@media (max-width:767px)`: `display:inline-flex; align-items:center; min-height:44px; padding:0 4px`. Tiêu đề card (`h2` flex, padding 16) cao khoảng 76px trên mobile, chấp nhận được. Chiều ngang: chữ 13px "Xem tất cả" khoảng 65px + 8px padding, nên ≥ 44px. |
| MINOR-1: integration flaky | **Đã đóng** | `admin-dashboard.test.ts:151-174`: đếm thủ công trước và sau, assert `min(before,after) ≤ thẻ ≤ max(before,after)`, giữ thêm sàn `≥ 4` / `≥ 1` cho dữ liệu tự tạo. Các assert `toBe` còn lại (`:136-139`) chỉ dùng cho tập riêng của sale (lead được giao / bài của chính tác giả test), không bị file khác ảnh hưởng. |
| MINOR-2: mất "…" trên mobile | **Đã đóng** | `_dashboard-lists.scss:187-190` dùng `display:block; line-height:44px`, vẫn giữ `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` từ `:72-78`. Title là flex item của `__main` (flex column, `min-width:0`, `align-items` mặc định stretch), nên rộng bằng container và ellipsis hoạt động. Do `nowrap`, title luôn 1 dòng (44px), không có trường hợp 2 dòng chồng lên nhau. Meta là flex item riêng (`line-height:18px`), xuống dòng bình thường. Hàng `li` mobile cao khoảng 82px (44 + 18 + padding 20). Badge vẫn wrap nhờ `flex-wrap`. Desktop không đổi. |
| MINOR-3: `user` thay `req` | **Chấp nhận (non-blocking)** | Access vẫn đúng: `overrideAccess:false` + `user` (`dashboard-data.ts:88,132-133,166-167`), test DB đã xác nhận. Tuy vậy, lý do Builder đưa ra ("view không có req") **không chính xác**: Payload truyền `initPageResult.req` cho view dashboard (`@payloadcms/next/dist/views/Dashboard/index.js:21-23`). Đây chỉ là khác biệt về hiệu năng/locale (không dùng chung dataloader), không phải lỗ hổng quyền. Ghi lại để sửa lý do trong task file. Không chặn. |
| MINOR-4: ghi nhận cho spec-validator | Giữ nguyên | Card nhóm không có số bản ghi. Gỡ `TranslationFailedBanner` khỏi importMap là đúng. |

## Quét lại regression quyền/PII

`dashboard-data.ts` không đổi so với round 1 (các dòng `count`/`find`/`select`/`overrideAccess` ở đúng vị trí cũ). `select` của lead vẫn hẹp (`:130`), không có phone/email/message. `granted()`, lọc thẻ trước khi đếm, lối tắt theo `create`, card nhóm theo `visibleEntities` và `read` đều giữ nguyên. Không có regression.

## Header.test.tsx focus-trap

File `src/components/layout/Header.test.tsx` là header của site public, không nằm trong diff và không import gì từ `components/admin/dashboard`. Lần chạy full của reviewer PASS 2623/2623. Kết luận: đây là flake timeout do tải máy, có sẵn từ trước, không liên quan diff. Residual: nên mở task riêng để ổn định test này (ngoài scope).

## Responsive Checklist Gate (CSS math, không có browser)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Grid dùng `minmax(0,1fr)`, card có `min-width:0`, header có `flex-wrap`. Phần sửa round 2 chỉ thêm chiều cao, không thêm chiều ngang cố định. |
| Mobile-first `min-width` | OK, ngoại lệ có lý do | Dùng `max-width` theo quy ước desktop-first của Payload, cùng tiền lệ T01. |
| Grid cột | OK, ngoại lệ có lý do | Design §6: 4/2/1 cột ở 1280/768/375 (`repeat(4)` → `≤1023px` 2 → `≤767px` 1). Card nhóm 3/2/1. |
| Font `rem` / `clamp()` | OK, ngoại lệ có lý do | Design chốt px cho admin, cùng tiền lệ T01. |
| Media | N/A | Chỉ có SVG inline. |
| Touch target ≥ 44×44 (mobile) | **OK** | "Xem tất cả" 44 (`lists:179-184`); title item danh sách 44 (`:187-190`); link card nhóm 44 (`:174-176`); nút "Tạo mới" có `min-height:44` (thắng `height:40`) và item menu 44 (`_dashboard.scss:184-187`); thẻ số liệu dạng link cao ≥ 32 padding + 28 icon + 36 value. Không còn phần tử bấm nào < 44px. |
| Nav mobile | N/A | Diff không đụng sidebar. |
| Bảng mobile | N/A | Không có table. |
| `100vh` | OK | Không dùng. |
| `prefers-reduced-motion` | OK / N/A | Không có animation. |
| `overflow:hidden` che lỗi | OK | Chỉ dùng cho ellipsis. |

Residual risk: chưa kiểm trực quan bằng trình duyệt ở 1440/768/390, sáng và tối (Builder cũng chưa kiểm). Trên mobile, `line-height:44px` để lại khoảng trống khoảng 13px giữa chữ tiêu đề và meta. Đây là vấn đề thẩm mỹ, không phải defect.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong verify commands được allow |
| oxlint (anti-slop) | skip: chưa cấu hình oxlint. ESLint PASS |
| ocr | skip: ocr chưa cài |
| AI-readable | OK: 0 indicator. Comment trong SCSS giải thích WHY (`:186`). File ≤ 300 dòng (lists 192, dashboard 194) |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | skip: không có môi trường. Không có input/API public mới |

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có (MAJOR-1 round 1 đã đóng).

### [MINOR]
1. Lý do giữ `user` trong Attempt log (`tasks/feature-admin-ui-saas-refresh/phase-1-task-04.md:62`) sai về sự thật: view có nhận `initPageResult.req`. Cách sửa: ghi lại lý do, hoặc ở task sau truyền `req: props.initPageResult.req` vào `count`/`find`. Không chặn.
2. `Header.test.tsx` có flake timeout khi chạy full (ngoài scope). Đề xuất mở task riêng.

## Verdict

✅ **PASS**: không còn CRITICAL/MAJOR. Cả 4 lệnh verify đều PASS. Mọi finding round 1 đã đóng hoặc đã được chấp nhận.
