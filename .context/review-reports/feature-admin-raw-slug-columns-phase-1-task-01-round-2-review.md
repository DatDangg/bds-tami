Agent: reviewer

# Review — feature-admin-raw-slug-columns phase-1 task-01 — round 2 (BL-043)

- **Review level:** NORMAL
- **Reason:** Chỉ đổi phần hiển thị trong admin (Cell/Description) cho 3 field text chỉ đọc; không đổi schema/access/API/DTO. Có đụng file nhãn dùng chung (`collection-labels.ts`), nhưng chỉ thêm 1 hàm thuần mới, các export cũ giữ nguyên, nên không cần STRICT. Round 2 sửa theo D5 (thêm global code, ẩn hint khi trùng mã, assert mock, hằng số dùng chung).
- **Blast radius:** `src/lib/admin/collection-labels.ts` (thêm hàm mới `collectionDisplayName`), `src/components/admin/{CollectionNameCell,CollectionNameHint,collection-name-admin}.ts(x)`, `src/app/(payload)/admin/importMap.js` (+2 khoá), cấu hình field ở `AuditLogs.ts`/`ClickEvents.ts`/`ClickStatsDaily.ts` (chỉ `admin.components`), SPECIFICATIONS.md FR-ADM-19. Không đổi DB, migration, access hay endpoint.

## Verify commands + result
(junction node_modules -> D:\prj\bds\node_modules + copy tạm .env.local; đã xoá cả hai sau khi chạy, `git status` không thấy hai mục này)
- `pnpm vitest run src/lib/admin src/components/admin` → PASS (31 file, 224 test)
- `pnpm typecheck` (tsc --noEmit) → PASS, 0 lỗi
- `pnpm lint` → PASS, 0 lỗi, 2 warning có sẵn trong `tools/task-dashboard/server.mjs` (ngoài scope)

## Kiểm các điểm round 2
1. **Tra cả nhãn global (`ADMIN_GLOBAL_LABELS`)** — `collection-labels.ts:169-174`: tra collection trước (nhãn số ít), sau đó tra global; dùng `Object.hasOwn` nên không dính khoá prototype (test có case `constructor`). Test khoá đủ 4 global: site-settings/homepage/header/footer. OK.
2. **Hint ẩn khi tên = mã gốc** — `CollectionNameHint.tsx:12` trả `null`; test "slug lạ → không hiện" khẳng định container rỗng. OK.
3. **Mock `useField` assert `{ path }`** — `CollectionNameCell.test.tsx:47` `toHaveBeenCalledWith({ path: "collection" })`. OK.
4. **`collection-name-admin.ts` chạy được phía server** — không có `"use client"`, không import React; chỉ `import type { Field } from "payload"` (bị xoá khi build). Object chỉ chứa chuỗi path và dùng `satisfies` với kiểu admin của field text, nên an toàn khi import vào payload config. Đặt dưới `components/admin` thì hơi lạc chỗ nhưng chấp nhận được (xem MINOR-1). OK.
5. **Chuỗi khớp khoá importMap** — `"/components/admin/CollectionNameCell#CollectionNameCell"` và `"/components/admin/CollectionNameHint#CollectionNameHint"` trùng khít với `importMap.js:89-90`; tên export đúng với file component. OK.
6. **Câu spec FR-ADM-19 "Cột loại dữ liệu (BL-043)"** — khớp hành vi: collection → tên số ít (`leads` → "Lead", `rentals` → "Tin cho thuê" đúng theo test); global → nhãn global (`site-settings` → "Cấu hình chung"); hiện ở cả danh sách (Cell) lẫn màn chi tiết (Description "Tên gọi: …", chỉ hiện khi khác mã gốc); mã lạ giữ nguyên; rỗng → `—` (ở Cell; ở Hint thì không hiện gì, phù hợp với câu "chỉ hiện khi khác mã gốc"). Lọc/sắp xếp vẫn chạy trên giá trị gốc vì field vẫn `type: "text"`, không đổi schema. OK.

## Responsive Checklist Gate
Diff có đụng UI admin, nhưng chỉ đổi chữ bên trong ô bảng có sẵn (`LinkedCell`) và thêm một dòng mô tả dùng class `field-description` có sẵn của Payload. Không thêm CSS, layout, grid, media hay chỗ bấm mới.
- Layout (không tràn ngang): OK — không thêm CSS. Chữ tiếng Việt ngắn (≤ ~25 ký tự) đặt trong ô bảng Payload có sẵn.
- Typography/Spacing: N/A — không có CSS mới, dùng style có sẵn của Payload.
- Media: N/A
- Touch/Interaction: OK — vùng bấm vẫn là `LinkedCell` có sẵn, không thêm điều khiển mới.
- Viewport/A11y: N/A — không có `vh`/animation/`overflow`.
Residual: chưa xem trên browser ở 375/768/1280, mới xác minh bằng việc đọc diff (không có CSS mới).

## Skill gates
- aislop: skip, `aislop` không nằm trong verify commands được phép của reviewer.
- oxlint (anti-slop): skip, chưa cấu hình oxlint. ESLint (`pnpm lint`) 0 lỗi.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK — tên rõ nghĩa, các hàm ≤ 10 dòng, không có magic number, comment ghi lý do (WHY) chứ không thuật lại code; indirection 1 bước. 0 indicator.
- ai-friendly-web: N/A (admin nội bộ, không public).
- blitzstrike: N/A (không phải STRICT, không đụng auth/input công khai).
- Bảo mật: không có XSS — JSX tự escape, không dùng `dangerouslySetInnerHTML`. Không đổi access.

## Findings
- **[MINOR-1]** `src/components/admin/collection-name-admin.ts` là hằng số cấu hình (không phải component) nhưng nằm trong `components/admin`, nên 3 collection config import ngược từ thư mục components. Cách sửa (không bắt buộc): chuyển sang `src/lib/admin/`. Không chặn PASS.
- **[MINOR-2]** `collection-labels.ts:171-172`: nếu sau này có slug trùng ở cả collection lẫn global thì nhãn collection luôn thắng mà không có cảnh báo. Hiện tại chưa có slug nào trùng. Cách sửa (không bắt buộc): thêm 1 test khẳng định hai tập khoá không giao nhau.
- Đã kiểm lại 3 MINOR của round 1 trong giới hạn diff: global codes, hint trùng mã và assert mock đều đã xử lý.

## Verdict
✅ PASS — không có CRITICAL/MAJOR; verify (vitest, typecheck, lint) đều PASS.
