Agent: reviewer

# Review — feature-admin-raw-slug-columns · phase-1-task-01 · round 1 (BL-043)

- Task: `tasks/feature-admin-raw-slug-columns/phase-1-task-01.md`
- Change doc: `spec/changes/2026-10-20-admin-raw-slug-columns.md`
- Spec delta: FR-ADM-19, câu "Cột loại dữ liệu (BL-043)" (SPECIFICATIONS.md)
- Diff: chưa commit (worktree `claude/admin-bl039-043`)

## Review level
NORMAL

## Reason
Chỉ đổi phần hiển thị admin: thêm Cell + Description vào 3 field `text` của 3 collection chỉ admin đọc, read-only. Không đổi schema/DB/access/API/export. Component mới tái dùng `LinkedCell` có sẵn, không sửa nó. `importMap.js` là file sinh. Không chạm red-risk nào bắt buộc STRICT (không đổi shared component, chỉ dùng lại; không auth/tenant/schema).

## Blast radius
- Danh sách + màn chi tiết của `audit-logs` (`collection`), `click-events` (`refCollection`), `click-stats-daily` (`refCollection`).
- `src/lib/admin/collection-labels.ts`: thêm export mới `collectionDisplayName`, không đổi export cũ.
- `src/app/(payload)/admin/importMap.js`: thêm 2 entry.
- Không ảnh hưởng: `payload-types.ts` (không đổi), migrations (không có), export/API (field name/type giữ nguyên).

## Verify commands + result
(Junction `node_modules` → `D:\prj\bds\node_modules` + copy tạm `.env.local`; cả hai đã xoá sau khi chạy, `git status` sạch, không còn artifact.)
- `pnpm vitest run src/lib/admin src/components/admin` → **PASS**, 31 files / 221 tests.
- `pnpm typecheck` (`tsc --noEmit`) → **PASS**, exit 0.
- `pnpm lint` → **PASS**, 0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff).

## Acceptance check
| Item | Result | Evidence |
|---|---|---|
| Ô danh sách + màn chi tiết hiện tên VN; lạ giữ nguyên; rỗng `—` | OK | `CollectionNameCell.tsx:9` → `collectionDisplayName(cellData)`; `CollectionNameHint.tsx` gọi `useField({ path })` và hiện "Tên gọi: …"; helper `collection-labels.ts:50-53` |
| Lọc/sắp xếp theo giá trị gốc | OK | Field `name`/`type: "text"` giữ nguyên ở cả 3 collection; chỉ thêm `admin.components` |
| Không đổi export/API/schema/DB | OK | `payload-types.ts` không có trong `git status`; không có file migration mới |
| Option select hiện tên VN | N/A | Field là `text`, ô lọc là ô chữ, không có option (D2 của task, spec delta có ghi rõ) |
| Test cell: biết / lạ / rỗng | OK | `CollectionNameCell.test.tsx` + `collection-labels.test.ts` |

## Helper edge cases
- Slug biết → `singular`: OK (`rentals`, `job-applications` có test).
- Slug lạ → giữ nguyên: OK.
- `""` / `null` / `undefined` / số / object → `—`: OK (`typeof !== "string" || === ""`, có test `it.each`).
- Key thuộc prototype (`constructor`, `toString`, `__proto__`): OK, dùng `Object.hasOwn`, có test `constructor`.
- `NO_REF` của `ClickStatsDaily` = `""` (`src/lib/click-stats/aggregate.ts:11`) → hiện `—`, đúng.

## LinkedCell link/drawer behavior
OK. `CollectionNameCell` truyền nguyên `props` vào `LinkedCell cell={props}`, nên `link`, `linkURL`, `viewType` (trash), `collectionSlug`, `rowData` và nhánh drawer `onSelect` vẫn giữ nguyên. Cách làm giống `VndCell`.

## Detail-view hint (Payload 3 Description API)
OK. Payload 3.91 có `FieldDescriptionClientProps = { field } & GenericDescriptionProps`, trong đó `GenericDescriptionProps.path: string` là bắt buộc (`payload/dist/admin/forms/Description.d.ts:12-24`). Component là `"use client"` và đọc `path` → `useField<string>({ path })` theo đúng API. Không có giá trị thì trả `null`, nên không có div trống.

## importMap
OK. Key `"/components/admin/CollectionNameCell#CollectionNameCell"` và `"/components/admin/CollectionNameHint#CollectionNameHint"` khớp đúng chuỗi trong config. Đường dẫn import `../../../components/admin/...` đúng, tên export khớp. Builder sinh file bằng `payload generate:importmap`.

## Responsive Checklist Gate
Diff chỉ đổi chữ hiển thị trong ô bảng có sẵn và thêm một dòng mô tả dùng class Payload `field-description`. Không có CSS/layout/route mới.
- Layout (horizontal scroll, grid, container): N/A, không thêm CSS hay layout. Độ dài chữ ngang mức slug cũ (vd "Tin cho thuê" so với `rentals`).
- Typography/Spacing: N/A, dùng style mặc định của Payload (`.field-description`), không có `px` mới.
- Media: N/A, không có ảnh/video.
- Touch/Interaction: N/A. Vùng bấm của link/nút trong ô do `LinkedCell` quyết định, không đổi.
- Viewport/A11y: N/A, không có `vh`, animation hay `overflow`.
- Residual: chưa xem trên trình duyệt (không có môi trường browser).

## Skill gates
- aislop: skip, `aislop` chưa cài (`command -v` không thấy).
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc.json`/`oxlint.json`). eslint 0 error.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK, 0 indicator. Tên rõ, hàm ngắn (≤5 dòng), indirection 2 bước (Cell → helper → labels), không magic number, comment nói lý do (WHY). Không đổi luồng chính nên không cần cập nhật README/ARCHITECTURE.
- ai-friendly-web: N/A, màn admin nội bộ.
- blitzstrike: N/A, level NORMAL, không có auth/API public/input.

## Security / Performance
- XSS: render qua text node của React, không dùng `dangerouslySetInnerHTML`. OK.
- Không có query mới, không N+1. `useField` chỉ đọc state của form. OK.

## Findings
- [MINOR] `src/components/admin/CollectionNameHint.tsx:10`: khi slug lạ, mô tả hiện "Tên gọi: old-collection", lặp lại đúng mã đang hiện trong ô nên không thêm thông tin. Fix đề xuất (tuỳ chọn): chỉ render khi `collectionDisplayName(value) !== value`.
- [MINOR] `src/components/admin/CollectionNameCell.test.tsx`: mock `useField` bỏ qua tham số nên test không chứng minh hint đọc đúng `path`. Thiếu case `link: true` cho `CollectionNameCell` (nhánh link đã có test riêng trong `LinkedCell.test.tsx`, nên rủi ro thấp). Fix đề xuất: mock `useField` bằng `vi.fn` rồi assert `toHaveBeenCalledWith({ path: "collection" })`.
- [MINOR] `src/collections/AuditLogs.ts:61`, `ClickEvents.ts:35`, `ClickStatsDaily.ts:36`: object field viết trên một dòng rất dài (>150 ký tự), khó đọc. Fix đề xuất: tách `admin.components` ra nhiều dòng, hoặc dùng một hằng chung (vd `COLLECTION_NAME_COMPONENTS`) cho 3 chỗ để DRY.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xác minh trên trình duyệt rằng Description hiện dưới ô read-only ở màn chi tiết. Type/API của Payload đã khớp, nhưng chưa xem trực quan.
- Description tuỳ biến thay luôn mô tả tĩnh của field. Hiện 3 field không có `admin.description` nên không mất gì.

## Verdict
PASS
