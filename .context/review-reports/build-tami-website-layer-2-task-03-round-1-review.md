Agent: reviewer

# Review — build/tami-website layer-2-task-03 (audit-logs + quản lý tài khoản sale có audit) — round 1

- **Review level:** STRICT
- **Reason:** RBAC tài khoản (staff role/active/password), bất biến "luôn còn ≥ 1 admin active", audit trail bắt buộc (PERMISSION §6), schema/migration mới (`audit_logs` + enum + FK), shared util `writeAuditLog` sẽ dùng cho 7 task sau.
- **Blast radius:** `src/collections/Staff.ts` (hooks afterChange/afterDelete/afterError/beforeValidate + endpoint reset-password), `src/collections/AuditLogs.ts`, `src/hooks/staff/*`, `src/lib/audit/*`, `src/payload.config.ts`, `migrations/20261016_105811_audit_logs.*` + `migrations/index.ts` (thêm cột `audit_logs_id` vào `payload_locked_documents_rels`), `src/payload-types.ts` (generated). Client: REST `/api/staff*`, `/api/audit-logs*`, Payload admin UI (list view bulk edit/delete), các task sau gọi `writeAuditLog` (layer-3-task-02, layer-6-task-10, layer-8-task-02, layer-9-task-03/05/06, layer-10-task-02).

## Verify commands + result (tự chạy, theo `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 34 files / 356 tests (exit 0; log ERROR in ra là lỗi cố ý của test access) |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | không chạy (diff không đụng package.json/lockfile) |

## Responsive Checklist Gate

N/A — diff không đụng route/component/CSS (chỉ collection config/hook/migration). `admin.hidden` của audit-logs là config Payload, không phải UI tự viết.

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip — không nằm trong verify commands được allow cho reviewer |
| oxlint (anti-slop) | skip — repo dùng eslint (`pnpm lint` PASS), oxlint không cấu hình trong profile |
| ocr (open-code-review) | skip — ocr không nằm trong command được allow / chưa cài |
| AI-readable | OK — hàm ngắn (<50 dòng), tên rõ, hằng số có tên (`ADMIN_ROSTER_LOCK_KEY`, `MAX_SUMMARY_LENGTH`), comment giải thích WHY. 0–1 indicator (chưa cập nhật ERD/PERMISSION — xem MINOR-1) |
| ai-friendly-web | N/A — không phải thay đổi public-facing |
| blitzstrike | skip — không có môi trường pentest được phép |

## Kiểm chứng AC

| AC | Kết quả | Bằng chứng |
|---|---|---|
| audit-logs chỉ admin đọc; không ai update/delete qua API | OK | `AuditLogs.ts:20-25` read=isAdmin, create/update/delete=denyAll; test `audit-staff.test.ts:117,142` |
| `writeAuditLog` ghi ipHash, không mật khẩu/token | OK | `write-audit-log.ts:25-28,46-47`; `sanitize-meta.ts:2` lọc theo tên khoá mọi độ sâu; caller chỉ đưa field chọn lọc (`audit-staff-changes.ts`) |
| Ghi 5 action | OK (đường byID) | staff.create/update_role/deactivate/reset_password (admin, self, token), auth.login_failed (REST) — tests 154–322 |
| Luôn còn ≥ 1 admin active | **FAIL qua bulk endpoint** | xem MAJOR-1 |
| Admin tạo/khoá/reset; sale không làm được | OK | `Staff.ts:112-116` create/delete=isAdmin, update=selfOrAdmin; field `role`/`active` update=isAdmin (`Staff.ts:141,148`) → sale không tự nâng role/tự mở khoá; tests 172, 238 |

Các điểm Builder nhờ kiểm chứng:
- **Migration:** additive thuần (CREATE TYPE/TABLE/INDEX, ADD COLUMN nullable + FK trên cột mới toàn NULL). Không DROP/đổi type/SET NOT NULL/UNIQUE trên data cũ → **không HIGH_RISK_MIGRATION**. `down` dùng IF EXISTS, OK.
- **Index `created_at` btree mặc định thay `(created_at DESC)`:** chấp nhận được — index 1 cột Postgres scan ngược được cho `ORDER BY created_at DESC`, hiệu năng tương đương. Cần ghi chú lệch vào ERD §5 (MINOR-1).
- **auth.login_failed chỉ qua REST:** chấp nhận — GraphQL đã `disable: true` (`payload.config.ts:44`), form /admin dùng REST; Local API `payload.login` chỉ code server gọi. Ghi residual risk.
- **Advisory lock:** đúng dưới READ COMMITTED cho đường byID (bên chờ khoá đếm lại sau khi bên kia commit); test 406 có cover. `overrideAccess` vẫn bị chặn (test 385). Nhưng xem MAJOR-1 cho đường bulk.
- **`pool._clients` trong afterAll:** chỉ ở test teardown, có `?? []` phòng khi field private đổi → chấp nhận (MINOR-3).
- **Meta không lộ secret:** OK. login_failed lưu email (đã lọc dạng email, chặn mật khẩu gõ nhầm) — hợp lý.

## Findings

### [MAJOR-1] Last-admin guard bị vô hiệu qua bulk update/delete (REST `PATCH/DELETE /api/staff?where=…`, admin UI "Edit many"/"Delete" ở list view) — thay đổi vẫn được commit
- **File:** `src/hooks/staff/last-admin-guard.ts:62-73`, đăng ký ở `src/collections/Staff.ts:122-123`.
- **Root cause (đã kiểm chứng trong Payload 3.91.0):** guard chạy ở `afterChange`/`afterDelete`, tức là SAU `db.updateOne`/`db.deleteOne`, và dựa vào việc "ném lỗi → Payload rollback". Điều này chỉ đúng ở operation byID. Ở operation bulk, `node_modules/payload/dist/collections/operations/delete.js:85-233` bọc từng doc trong `try/catch`, lỗi chỉ được `errors.push(...)`; `killTransaction` chỉ gọi khi `db.bulkOperationsSingleTransaction` (adapter Postgres không bật — không có trong `@payloadcms/db-postgres`, project không cấu hình), rồi `commitTransaction(req)` ở dòng 269-271 commit cả transaction. `update.js:205-293,347` y hệt. `ValidationError` của guard là lỗi JS (không phải lỗi SQL) nên transaction Postgres vẫn hợp lệ và commit thành công.
- **Hệ quả:** admin (hoặc admin UI bulk action) `DELETE /api/staff?where[id][equals]=<adminCuối>` hoặc `PATCH /api/staff?where[role][equals]=admin` body `{active:false}` → admin cuối bị xoá/khoá, hệ thống hết admin active (vi phạm AC4, FR-ADM-11/PERMISSION §3.4). Kèm theo: vì guard ném trước hook audit, thay đổi đã commit nhưng **không có bản audit** nào (vi phạm PERMISSION §6 "bắt buộc có dấu vết").
- **Test thiếu:** không có test bulk nào (`audit-staff.test.ts` chỉ dùng byID).
- **Fix đề xuất:** chuyển kiểm tra sang `beforeChange` (dùng `data` sau field access hợp với `originalDoc` để tính role/active cuối) và `beforeDelete` (đọc doc theo `id` trong cùng `req`), giữ advisory lock — ném lỗi trước khi ghi DB nên đúng cả byID lẫn bulk. Hoặc (tối thiểu) chặn bulk cho `staff` bằng `disableBulkEdit`/`disableBulkDelete` nếu Payload hỗ trợ, hoặc hook `beforeOperation` từ chối bulk update/delete chạm tới admin. Thêm integration test: bulk PATCH `{active:false}` và bulk DELETE trên admin cuối → admin vẫn active/tồn tại và không có thay đổi được commit; bulk trên nhiều admin trong đó có admin cuối → không hết admin.

### [MINOR-1] Doc impact chưa reconcile
- `docs/ERD.md:455` enum action chưa có `staff.activate`, `staff.delete`; `docs/ERD.md:524` ghi `(created_at DESC)` trong khi migration dùng btree ASC; PERMISSION §6 chưa liệt kê 2 action mới. Task ghi `Doc impact result: pending`.
- **Fix:** close-out cập nhật ERD §4.13/§5 + PERMISSION §6 (as-built) trước commit; vì đây là bổ sung danh sách action (intent), ghi rõ lý do/duyệt theo Doc Impact rules.

### [MINOR-2] Cờ `staffPasswordChanged` trong `req.context` dùng chung theo request
- `src/hooks/staff/flag-password-change.ts:10-13` + `audit-staff-changes.ts:50-51`. (a) Bulk update có `password`: các doc chia chung 1 cờ, doc đầu xoá cờ → các doc sau có thể không có audit `staff.reset_password` (thứ tự song song không xác định). (b) Nếu update bị lỗi sau `beforeValidate` (validate fail), cờ còn lại trong `req.context`; code server tái dùng `req` cho update khác sẽ ghi nhầm 1 bản reset_password.
- **Fix:** khoá cờ theo id doc (vd `context[FLAG] = Set<id>` hoặc key `${FLAG}:${originalDoc.id}`), xoá cờ ở cả nhánh lỗi; sẽ tự hết phần lớn nếu xử lý MAJOR-1 bằng cách chặn bulk.

### [MINOR-3] Test teardown dùng field private `pool._clients` của `pg`
- `tests/integration/audit-staff.test.ts:103-105`. Có fallback `?? []`, chỉ ảnh hưởng test — chấp nhận, nên gom vào helper test dùng chung nếu lặp lại ở file khác.

## Residual risk
- `auth.login_failed` không ghi khi đăng nhập qua Local API `payload.login` (chỉ code server) — chấp nhận theo thiết kế, nên ghi vào PERMISSION §6.
- Không chạy app/DB thủ công; kết luận MAJOR-1 dựa trên đọc source Payload 3.91.0 đã cài (`delete.js`, `update.js`) — Builder cần thêm test bulk để chứng minh cả lỗi lẫn bản fix.
- aislop/ocr/blitzstrike không chạy (không được allow/không cài).

## Verdict

❌ **FAIL** — 1 MAJOR (MAJOR-1: last-admin guard + audit bị bỏ qua qua bulk update/delete). Builder sửa MAJOR-1 + thêm test bulk; MINOR-1 xử lý ở close-out; MINOR-2 nên sửa cùng lượt.
