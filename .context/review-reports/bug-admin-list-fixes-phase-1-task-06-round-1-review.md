Agent: reviewer

# Review: bug-admin-list-fixes · phase-1-task-06 · round 1 (BL-021 T6, #08)

> Primary ghi lại report do reviewer trả về (hook guard chặn reviewer ghi file trong worktree).

## Review level: NORMAL

## Reason
- Đổi slot component trong shared helper `withContentDefaults` (mọi collection nội dung) → rủi ro shared helper.
- Chỉ bố cục: không đụng access/RBAC, schema, endpoint export, `export-filters`, không đổi API/DTO.
- Mỗi thay đổi config có unit test trực tiếp; primary có bằng chứng trực quan.
- Không cần STRICT: không auth/tenant/data/contract; rủi ro shared đã phủ bằng test array-merge + omit của helper.

## Blast radius
- Danh sách admin của mọi collection bọc `withContentDefaults` (rentals, projects, property-posts, news…): "Trạng thái dịch" từ `BeforeList` (ngoài `Gutter`) → `BeforeListTable` (trong `Gutter`, sau `ListControls`).
- Danh sách Leads: nút "Xuất Excel" đổi slot tương tự.
- SCSS admin toàn cục: thêm `.list-toolbar-item` (`_lists.scss`); bỏ `max-width`/`margin-bottom` của `.translation-status-filter` (`_controls.scss`).
- List drawer + thùng rác: render qua cùng slot, logic component không đổi.
- Không ảnh hưởng dữ liệu/API/quyền.

## Diff verification
- `git diff --ignore-cr-at-eol --stat` trên `src/app/(payload)/admin/importMap.js`, `src/payload-types.ts`: rỗng → chỉ khác EOL, không commit.
- `content-defaults.ts:173`: `beforeList` → `beforeListTable`; spread `...collection.admin?.components` giữ slot khác; entry `beforeListTable` có sẵn giữ nguyên, ô lọc nối sau; `omit: ["translation"]` không nối. Chỉ Leads tự khai slot (`Leads.ts:218`) và Leads không bọc `withContentDefaults` → không collection nào mất entry `beforeList`.
- Payload 3.91: `@payloadcms/ui/dist/views/List/index.js` — `BeforeList` đứng trước `Gutter` (dòng 152); `BeforeListTable` sau `ListControls` (178–192), ngoài guard `docs?.length > 0`, `NoListResults` theo sau (197) → 0 kết quả vẫn thấy ô lọc. `@payloadcms/next/.../renderListViewSlots.js:47-65`: `BeforeListTable` là Fragment `[notFoundBanner, existingBeforeListTable]`, không wrapper → các mục là anh em trong Gutter, `inline-flex` xếp cùng hàng.
- `LeadExportButton` / `LeadExportSlot`: chỉ thay inline style bằng class; check `user?.role !== "admin" || isInDrawer`, check thùng rác phía server, `role=status/alert`, busy, map lỗi không đổi. Return sớm trước wrapper → không có mục rỗng cho sale/drawer/thùng rác.
- `TranslationStatusFilter`: giữ `SelectInput` + `<label>` bọc (BL-016), chỉ thêm class.
- Style select BL-016 (`_controls.scss:300-318`) còn nguyên: label 280px `max-width: 100%`, `.field-type` `margin-bottom: 0`, `.rs__control` `min-height: 44px`. `max-width: 100%` bỏ đi nay do `.list-toolbar-item` cấp; `margin-bottom: 12px` thay bằng `margin: 0 16px 12px 0`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run --project unit --project ui` | PASS 2019/2019 |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm typecheck` | PASS |

## Responsive Checklist Gate
| Item | Result | Evidence |
|---|---|---|
| Không cuộn ngang | OK | `.list-toolbar-item` `max-width: 100%`; note `flex: 1 1 200px; min-width: 0; overflow-wrap: anywhere`; primary đo `scrollWidth = 375` ở 375px |
| Mobile-first / media query | N/A | Không thêm media query; layout intrinsic (inline-flex + wrap) |
| Không cố định px container | OK | Chỉ 280px label select của BL-016, có `max-width: 100%` |
| Typography | N/A | Không thêm cỡ chữ; spacing px theo quy ước SCSS admin (MINOR-2) |
| Touch target ≥ 44px | OK | `.list-toolbar-item > .btn { min-height: 44px }`; `.rs__control` 44px; đo 44px ở 1024/375 |
| 100vh / reduced motion / overflow:hidden | OK | Không dùng |
- 1024/375 primary kiểm trên dev :3026; 768px chưa kiểm riêng (tính toán CSS: ~400px vừa một hàng).

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip — chưa cài |
| oxlint (anti-slop) | skip — chưa cấu hình; ESLint 0 error |
| ocr | skip — chưa cài |
| AI-readable | OK |
| ai-friendly-web / blitzstrike | N/A (admin nội bộ, không STRICT) |

## Findings
- CRITICAL: none.
- MAJOR: none.
- MINOR-1 `src/components/admin/LeadExportButton.tsx:70`: class `list-toolbar-item--export` không có rule CSS. → **Primary đã bỏ** sau review (test admin/_shared 157/157 PASS, lint 0 error).
- MINOR-2 `src/components/admin/styles/_lists.scss:196-215`: spacing px cứng, khớp SCSS xung quanh, không phải regression; tuỳ chọn chuyển `--base` sau.
- MINOR-3: đáy nút lệch đáy select ~5px (khoảng dưới wrapper field Payload); thẩm mỹ, chỉ lộ khi một collection có cả hai mục (hiện không có).

## Residual risk
- 768px chưa kiểm trực quan.
- "Cùng hàng" chỉ kiểm bằng chèn tạm DOM (không collection thật nào có cả hai mục).
- Phụ thuộc Payload 3.91 đặt `BeforeListTable` trong `Gutter` sau `ListControls`; test config chỉ ghim key slot, không ghim vị trí render.

## Verdict: PASS
