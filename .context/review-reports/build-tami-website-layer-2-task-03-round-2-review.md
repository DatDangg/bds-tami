Agent: reviewer

# Review — build/tami-website layer-2-task-03 (audit-logs + quản lý tài khoản sale có audit) — round 2

- **Review level:** STRICT
- **Reason:** RBAC tài khoản (role/active/password), bất biến "luôn còn ≥ 1 admin active" (có concurrency + transaction), audit trail bắt buộc (PERMISSION §6), schema/migration mới, shared util `writeAuditLog` cho các task sau. Round 1 FAIL vì bypass qua bulk.
- **Blast radius:** `src/collections/Staff.ts` (hooks beforeValidate/beforeOperation/beforeChange/beforeDelete/afterChange/afterDelete/afterError + endpoint reset-password), `src/hooks/staff/*`, `src/lib/audit/*`, `src/collections/AuditLogs.ts`, `src/payload.config.ts`, `migrations/20261016_105811_audit_logs.*` + `migrations/index.ts`, `src/payload-types.ts`. Client: REST `/api/staff*` (byID + bulk `where`), `/api/audit-logs*`, admin UI list "Edit many"/"Delete", Local API server code, các task sau dùng `writeAuditLog`.

## Verify commands + result (tự chạy, theo `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 34 files / 362 tests (exit 0). Log INFO "field is invalid: where" là lỗi cố ý của test bulk. Có `DeprecationWarning: Calling client.query() when the client is already executing a query` của `pg` (xem Residual risk) |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | không chạy (diff không đụng package.json/lockfile) |

## Responsive Checklist Gate

N/A — diff không đụng route/component/CSS (collection config/hook/migration/test).

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip — không nằm trong verify commands được allow cho reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (repo dùng eslint, `pnpm lint` PASS) |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK — hàm ngắn, tên rõ, hằng số có tên (`ADMIN_ROSTER_LOCK_KEY`, `LAST_ADMIN_MESSAGE`), comment nêu WHY. 1 indicator: chưa reconcile ERD/PERMISSION (MINOR-1, để close-out) → < 3 |
| ai-friendly-web | N/A — không public-facing |
| blitzstrike | skip — không có môi trường pentest được phép |

## Kiểm chứng fix MAJOR-1 (đối chiếu source Payload 3.91.0 đã cài)

| Điểm cần kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Lỗi ở `beforeOperation` làm hỏng cả lệnh, không commit từng phần | OK | `payload/dist/collections/operations/update.js:37` initTransaction → `:72-78` beforeOperation nằm trong try ngoài; catch `:351-362` gọi `killTransaction`. `delete.js:28-37` tương tự, catch `:273-274` killTransaction. Throw ở beforeOperation xảy ra trước mọi find/ghi → không có gì commit |
| Advisory xact lock nằm trong transaction của req | OK | `last-admin-guard.ts:32-39` lấy `adapter.sessions[await req.transactionID].db` — trùng cách drizzle chọn connection (`@payloadcms/drizzle/dist/utilities/getTransaction.js:17`); `execute({db, raw})` dùng `db ?? drizzle` (`drizzle/dist/postgres/execute.js:2-5`). Count kế tiếp truyền `req` → cùng session. `pg_advisory_xact_lock` giữ tới commit/rollback |
| beforeChange nhận `data` đã qua field access | OK | Field access chạy ở `fields/hooks/beforeValidate/promise.js:220-221`; thứ tự `utilities/update.js:20-23`: beforeValidate fields → beforeValidate collection → beforeChange collection. `role`/`active` cuối = `data` đè `originalDoc` (`last-admin-guard.ts:73-76`) |
| Guard chạy trước khi ghi (byID + bulk từng doc) | OK | `Staff.ts` diff: `beforeChange: [guardLastAdminOnUpdate]`, `beforeDelete: [guardLastAdminOnDelete]`; throw trước `db.updateOne/deleteOne` nên doc bị chặn không đổi, afterChange/afterDelete (audit) không chạy |
| Bulk nhiều admin trong 1 lệnh (song song cùng transaction, lock reentrant → cùng "thấy" người kia) | OK | `update.js:316` processSequentially=false với Postgres → song song; được chặn ở `rejectBulkChangeOfActiveAdmins` (`last-admin-guard.ts:94-113`) khi where chạm admin active và data có role/active (delete luôn kiểm) |
| Race 2 admin hạ quyền nhau by-ID | OK | Bên sau chờ lock rồi count dưới READ COMMITTED sau khi bên trước commit → thấy 0 → throw. Test `audit-staff.test.ts:406-423` (4 vòng) PASS |
| Bị chặn không có audit; hợp lệ đúng 1 audit | OK | Tests 365/376/385 (byID), 430/442/452/466 (bulk, `countAudits()` không đổi), 489 (bulk 3 sale → mỗi người 1 deactivate, 1 reset_password) |
| Test bulk có bắt được lỗi cũ không | OK (suy luận từ source) | Với guard cũ ở afterChange/afterDelete: bulk ghi xong rồi commit → test 430/442 fail ở assert `after.active === true`/doc còn tồn tại; test 452 fail vì bulk Local API trả `{errors}` chứ không throw (`expectLastAdminError` fail); test 466 fail nếu chỉ có beforeChange mà không có beforeOperation (2 admin song song cùng pass). Builder chưa chạy thực nghiệm trên bản cũ — chấp nhận dựa trên đọc source |

MINOR-2 (cờ đổi mật khẩu): **đã sửa đúng về logic** — key theo doc id (`flag-password-change.ts:7`), mỗi update đặt/xoá cờ ở beforeValidate (`:14-19`), afterChange đọc/xoá đúng key (`audit-staff-changes.ts:50-52`). Bulk song song không còn chia chung cờ; cờ sót sau lỗi bị ghi đè ở lần update kế tiếp của chính doc đó. Test 489 cover bulk đổi mật khẩu. Riêng test tái dùng req yếu — xem MINOR-4.

## Findings

### [MINOR-1] Doc impact chưa reconcile (giữ từ round 1, primary làm ở close-out)
- `docs/ERD.md` (enum action thiếu `staff.activate`/`staff.delete`; index `created_at` ghi DESC), PERMISSION §6 thiếu 2 action mới + chưa ghi quy tắc mới "bulk sửa role/active hoặc xoá chạm admin active bị từ chối — phải làm từng người". Task vẫn `Doc impact: pending`.
- **Fix:** close-out cập nhật ERD §4.13/§5 + PERMISSION §6 trước commit (bổ sung action/quy tắc là intent → ghi lý do/duyệt theo Doc Impact rules).

### [MINOR-3] Test teardown dùng `pool._clients` (đã chấp nhận round 1) — giữ nguyên.

### [MINOR-4] Test "update lỗi rồi tái dùng req" không kiểm được kịch bản cờ sót (false-confidence)
- **File:** `tests/integration/audit-staff.test.ts:510-519`.
- Mật khẩu `"ngan"` bị `enforcePasswordLength` ném lỗi (`Staff.ts:38-41`) — hook này đứng TRƯỚC `flagPasswordChange` trong `beforeValidate` (`Staff.ts` diff: `[enforcePasswordLength, flagPasswordChange]`), nên cờ không bao giờ được đặt. Test sẽ PASS cả với bản cờ dùng chung cũ → không chứng minh fix.
- **Fix đề xuất:** gây lỗi SAU khi cờ đã đặt, vd update admin cuối `{ password: "<≥10 ký tự>", active: false }` (guard beforeChange ném) rồi tái dùng `req` cho update chỉ đổi tên trên cùng doc → kỳ vọng 0 bản `staff.reset_password`. Không chặn PASS vì logic code đúng khi đọc trực tiếp.

### [MINOR-5] File test 521 dòng (> 300)
- `tests/integration/audit-staff.test.ts`. Có thể tách `describe("bulk …")` + nhóm last-admin sang file riêng dùng chung helper. Không chặn.

## Residual risk
- `rejectBulkChangeOfActiveAdmins` count không truyền `req` và chạy trước khi giữ lock (TOCTOU hẹp): nếu có request khác đồng thời nâng doc thuộc `where` lên admin giữa lúc count và lúc bulk find, doc đó chỉ còn guard beforeChange per-doc (song song, cùng transaction). Chỉ hết admin khi nhiều doc được nâng đồng thời đúng khe đó và mọi admin cũ cũng nằm trong `where` — xác suất rất thấp; chấp nhận, nên ghi chú.
- `disableTransaction: true` (Local API) → `lockAdminRoster` bỏ qua lock (nhánh phòng thủ) → race by-ID không được tuần tự hoá. Chỉ code server; không có caller hiện tại.
- Cảnh báo `pg` "client.query() when the client is already executing a query": bulk của Payload chạy song song trên 1 connection transaction (lock + count trong hook góp thêm query song song). Hoạt động đúng với pg hiện tại, sẽ thành lỗi ở pg@9 — theo dõi khi nâng `pg`.
- `auth.login_failed` không ghi qua Local API `payload.login` (chấp nhận từ round 1).
- Kết luận "test bulk bắt được lỗi cũ" dựa trên đọc source Payload, không chạy lại test trên bản guard cũ.

## Verdict

✅ **PASS** — MAJOR-1 đã sửa đúng (guard trước khi ghi + chặn bulk chạm admin active ở beforeOperation, rollback toàn lệnh; lock trong đúng transaction; test bulk REST/Local API PASS). MINOR-2 sửa đúng. Còn MINOR-1 (doc, close-out), MINOR-3/4/5 không chặn.
