# feature-admin-raw-slug-columns · phase-1-task-01 — Cột "Loại dữ liệu"/"Loại nội dung" hiện tên tiếng Việt thay slug thô (BL-043)

- Change doc: `spec/changes/2026-10-20-admin-raw-slug-columns.md` (BACKLOG BL-043).
- Spec delta: FR-ADM-19 câu "**Cột loại dữ liệu (BL-043)**" (SPECIFICATIONS.md).
- Trạng thái: `done` — Reviewer NORMAL r1 PASS → r2 PASS (`.context/review-reports/feature-admin-raw-slug-columns-phase-1-task-01-round-{1,2}-review.md`); spec-validator phase 1 COMPLETE (`.context/review-reports/spec-validation-feature-admin-raw-slug-columns-phase-1.md`, gap global → D5 đã xử lý); spec 1.35.0 / scope v45.

## Classification / Risk
- Type: **MODIFY** (chỉ đổi hiển thị admin: thêm Cell + mô tả ở màn chi tiết; **không đổi** `name`, schema, DB, access, API, export).
- Risk: **LOW** — 3 collection chỉ admin đọc (`audit-logs`, `click-events`, `click-stats-daily`), read-only.
- Expected review level: **NORMAL** (component admin dùng chung `LinkedCell`; có đổi `importMap.js`).
- Blast radius: danh sách + màn chi tiết 3 collection trên; `src/app/(payload)/admin/importMap.js`.
- Doc impact: FR-ADM-19 (spec delta đã ghi); `docs/ERD.md`/`docs/API_SPEC.md` không đổi (không đổi schema/contract) → no doc impact ngoài spec.
- Migration: không (chỉ `admin.components` — không sinh migration).

## Quyết định (auto proceed — user chỉ thị "tự xử lý hết không cần hỏi", 2026-10-21)
- D1 Nhãn dùng **số ít** (`singular`) của `ADMIN_COLLECTION_LABELS` — đọc tự nhiên cho từng dòng ("Tin cho thuê", "Hồ sơ ứng tuyển", "Lead", "Nhân viên", "Tệp CV"). Lý do: ô là loại của MỘT bản ghi.
- D2 Lọc: `collection`/`refCollection` là field `text` → ô lọc là ô chữ, không có select → điều kiện "option hiện tên tiếng Việt" không áp dụng; giữ lọc/sắp xếp theo giá trị gốc. Không đổi sang select (sẽ đổi schema enum → ngoài phạm vi, vi phạm "không đổi schema").
- D3 Màn chi tiết: field read-only vẫn hiện mã gốc trong ô (Payload text field); thêm mô tả động dưới ô hiện tên tiếng Việt (component `admin.components.Description` hoặc `afterInput`) — không thay ô nhập để không đụng lưu dữ liệu.
- D5 (sau spec-validator phase-1 gap PARTIAL) Nhật ký "Dịch lại nội dung" của global ghi mã global (`site-settings`, `homepage`, `header`, `footer` — `src/endpoints/admin/retranslate.ts:106-111`) → helper tra thêm `ADMIN_GLOBAL_LABELS` (sau collection) để hiện "Cấu hình chung"… Lý do: mục tiêu change doc là người dùng hiểu được, global là dữ liệu thật trong cột. Kèm sửa MINOR r1: hint không hiện khi tên = mã gốc; test assert `useField` nhận đúng `path`. Spec delta sửa "nhãn collection/global".
- D4 Spec-validator chạy 1 lần ở phase review (gộp kiểm delta + build) vì change 1 task, LOW risk.

## Scope
1. Helper thuần `collectionDisplayName(slug: unknown): string` trong `src/lib/admin/collection-labels.ts`: slug biết → `singular`; chuỗi lạ (không rỗng) → nguyên giá trị; `null`/`undefined`/`""`/không phải chuỗi → `—`. Không dùng `in` với prototype (dùng `Object.hasOwn`).
2. Cell client `src/components/admin/CollectionNameCell.tsx` (`CollectionNameCell`) dùng helper + `LinkedCell` (giữ hành vi cột link/drawer như `VndCell`).
3. Gắn Cell vào: `AuditLogs.collection`, `ClickEvents.refCollection`, `ClickStatsDaily.refCollection`. Thêm hiển thị tên tiếng Việt ở màn chi tiết (D3).
4. Cập nhật `src/app/(payload)/admin/importMap.js` (chạy `pnpm payload generate:importmap` nếu được, không thì sửa tay đúng format).
5. Test: `CollectionNameCell.test.tsx` (slug biết → nhãn, slug lạ → giữ nguyên, rỗng → `—`) + test helper trong `collection-labels.test.ts`.

## Acceptance
- [ ] Ô danh sách + màn chi tiết hiện tên tiếng Việt; slug lạ hiện nguyên, rỗng `—`, không lỗi.
- [ ] Lọc/sắp xếp theo giá trị gốc (không đổi `name`/type field).
- [ ] Không đổi export/API/schema/DB (không migration, `payload-types.ts` không đổi kiểu).
- [ ] Test cell: biết → nhãn, lạ → giữ, rỗng → `—`.

## Verify
`pnpm test` (file liên quan), `pnpm typecheck`, `pnpm lint`.

## Verification summary
Builder (2026-10-21):
- Acceptance 1 PASS (Cell + Description hiện tên VN; lạ giữ nguyên; rỗng/NO_REF `—`) · 2 PASS (không đổi name/type; lọc/sắp xếp theo giá trị gốc) · 3 PASS (chỉ `admin.components`; không migration, `payload-types.ts` không đổi) · 4 PASS (CollectionNameCell.test.tsx).
- Files: collection-labels.ts(+test), CollectionNameCell.tsx(+test), CollectionNameHint.tsx (Description, useField), 3 collections, importMap.js (sinh bằng `payload generate:importmap`).
- `vitest run src/lib/admin src/components/admin`: 31 files / 221 tests PASS · `pnpm typecheck` PASS · `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs).
- Residual: chưa xem trực quan trên trình duyệt (Description render dưới ô read-only chưa kiểm tay).

Round 2 (builder, D5): helper tra thêm `ADMIN_GLOBAL_LABELS` sau collection (+test 4 global); `CollectionNameHint` không render khi tên = mã gốc/rỗng; mock `useField` là `vi.fn`, assert gọi với `{ path }`, thêm test slug lạ/global; hằng dùng chung `COLLECTION_NAME_ADMIN` (`src/components/admin/collection-name-admin.ts`) cho 3 field (chuỗi khớp importMap, importMap không đổi thêm). `vitest run src/lib/admin src/components/admin`: 31 files / 224 tests PASS · typecheck PASS · lint 0 error (2 warning cũ).

## Close-out
- Acceptance criteria: PASS (4/4; mục select N/A theo D2).
- Verify: vitest src/lib/admin + src/components/admin 31 files / 224 tests PASS · typecheck PASS · lint 0 error.
- Reviewer verdict: PASS (r2, NORMAL).
- Doc impact: SPECIFICATIONS.md FR-ADM-19 (delta BL-043) + spec/updates + CHANGELOG + test-scope v45; docs/ERD.md, docs/API_SPEC.md, docs/DESIGN.md: no doc impact (không đổi schema/contract/flow).
- Residual risk: chưa xem trên trình duyệt (gợi ý dưới ô read-only); MINOR r2: `collection-name-admin.ts` nên ở `src/lib/admin/`, chưa có test khoá collection/global không trùng; build chưa chạy.
