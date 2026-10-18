Agent: reviewer

# Review — build/tami-website · layer-9-task-03 · round 2

- Review level: **STRICT**
- Reason: RBAC endpoint admin, rule server trên field `leads.assignedTo` áp cho mọi đường ghi (REST/Local API/form/tự giao BR-12), side effect email PII / audit / activity cùng transaction, helper dùng chung `asSystemActivity`, hợp đồng cho task L9-T02 sắp tới.
- Blast radius: `src/collections/Leads.ts` (`validateAssignee`, `filterOptions`, hooks), `src/lib/leads/assignable-sale.ts` (mới, dùng bởi endpoint + validate + email), `src/hooks/leads/on-assignment-change.ts`, `src/endpoints/admin/lead-assign.ts`, `src/hooks/leads/lead-activity-hooks.ts`, `src/payload.config.ts`; mọi `payload.create/update` collection `leads` (gồm endpoint công khai tạo lead L9-T02, `touchLeadLastActivity`, sửa hàng loạt); admin form lead (dropdown người phụ trách); bảng `lead_activities`, `audit_logs`, `payload_jobs`; docs API_SPEC §4, ERD, PERMISSION; tests `tests/integration/lead-assign.test.ts`, `leads.test.ts`.
- Scope: diff chưa commit trên HEAD b527146 tại `D:\prj\bds` (bỏ qua `.claude/launch.json`, `.context/`).

## Verify commands + result (theo `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 179 files / 1943 tests passed, 0 skipped (integration DB chạy thật, lần chạy đầu không lỗi DB) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS (chỉ thêm `filterOptions` cấu hình field, không phải UI code tự viết).

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint — PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`isAssignableSale`, `validateAssignee`, `ASSIGNEE_NOT_ASSIGNABLE_MESSAGE`), hàm < 50 dòng, file < 300 dòng, không magic number, comment giải thích WHY. 0 indicator (doc lệch nhỏ ở MINOR-A không đủ thành indicator).
- ai-friendly-web: N/A (endpoint/admin nội bộ).
- blitzstrike: skip, không có môi trường/tool được phép.

## Kiểm round-1 findings
- **MAJOR-1 — đã đóng.**
  - `validate` chạy ở mọi đường: Payload 3.91 `fields/hooks/beforeChange/promise.js:98-127` gọi `field.validate` khi `!skipValidationFromHere`; `skipValidation` chỉ bật khi lưu draft (`operations/create.js:234`, `operations/utilities/update.js:191`) — leads không có draft. `overrideAccess` KHÔNG bỏ qua validate (chỉ truyền vào options). Áp cả create (REST/Local), updateByID, update hàng loạt (cùng `utilities/update.js`).
  - `previousValue` = `siblingDoc[field.name]`, với update là `publicationHookDoc` dựng từ `originalDoc` đọc `depth: 0` (`utilities/update.js:54-58,128-131,183`) → id string; create → `{}` → `undefined` → `null`. `assigneeId()` chuẩn hoá cả object populate lẫn string trước khi so → so sánh "đổi" đúng.
  - Field không gửi (vd PATCH chỉ `status`, `touchLeadLastActivity` chỉ `lastActivityAt`): bị loại bởi `isOutsideSubmittedFieldScope` hoặc value `undefined` → `null` → pass. Không ảnh hưởng luồng khác.
  - Form admin: form-state (`@payloadcms/ui .../addFieldStatePromise.js:119-133`) gọi validate với `previousValue: previousFormState?.[path]?.initialValue` = giá trị đã lưu → lead đang gán sale đã khoá không bị báo lỗi khi sửa field khác. `filterOptions` không ẩn nhãn giá trị hiện tại: Relationship `Input.js:361-366` nạp nhãn giá trị đã chọn bằng `where: { id: { in } }` không kèm filterOptions.
  - `queueAssignedEmail` (`on-assignment-change.ts:38-39`) bỏ qua người nhận không phải sale active (phòng thủ).
  - Test `lead-assign.test.ts:242-261` (REST PATCH + Local API + create → 400, snapshot activity/audit/job không đổi, giữ người cũ) và `263-273` (status vẫn đổi được, bỏ giao vẫn cho). Logic test bắt được lỗi cũ: trước fix PATCH sẽ trả 200 và snapshot đổi.
- **MINOR-1 — đã đóng**: `lead-assign.ts:51-52` trả `changed:false` không update.
- **MINOR-2 — đã đóng**: `on-assignment-change.ts:81` thêm `!doc.deletedAt`; test `275-280`.
- **MINOR-3 — đã đóng**: `docs/PERMISSION.md:92` đúng 3 ô.
- **MINOR-4** (race giao đồng thời): vẫn là residual chấp nhận.

## Kiểm hợp đồng L9-T02
- Author sale active → validate pass, hook tự giao như cũ. Author admin/sale khoá → `payload.create` ném ValidationError (status 400, path `assignedTo`) trước khi ghi DB — rõ ràng, đã ghi trong Notes của task file (`tasks/tami-website/layer-9-task-03.md:93`) để T02 tự kiểm `isAssignableSale(author)` rồi fallback. Hiện chưa có code nào trong `src/` tạo lead với `assignedTo` (chỉ endpoint giao + hook nội bộ) → không có đường đang chạy bị gãy.

## Findings

Không có CRITICAL / MAJOR.

### [MINOR-A] API_SPEC as-built chưa phản ánh rule mới
- `docs/API_SPEC.md:200` — đoạn as-built L9-T03 vẫn ghi email "không gửi khi bỏ giao hoặc lead đã ẩn danh", thiếu: lead đã xoá mềm và người nhận không phải sale active; chưa nêu rule form/REST/Local API đổi `assignedTo` sang người không phải sale active → ValidationError 400 (PERMISSION.md:92 đã ghi). Fix: bổ sung 1 câu vào đoạn as-built.

### [MINOR-B] Thiếu test cho trường hợp form gửi lại nguyên giá trị sale đã khoá
- `tests/integration/lead-assign.test.ts:267` chỉ PATCH `{ status }` (assignedTo không được gửi → validate không xét giá trị). Form admin thực tế gửi cả `assignedTo` = sale đã khoá. Logic đúng theo đọc source Payload (previousValue = id đã lưu), nhưng chưa có test chốt. Đề xuất thêm `payload.update({ data: { status: "contacted", assignedTo: lockedSale.id } })` → 200, và 1 case giá trị dạng object `{ id }`.

### [MINOR-C] `validate` tuỳ chỉnh thay validator relationship mặc định
- `src/collections/Leads.ts:106-111` — id sai định dạng (không phải UUID) đi thẳng vào `findByID` trên cột uuid → lỗi Postgres → 500 thay vì 400 (trước đây cũng lỗi DB lúc insert, nên không phải regression). Đề xuất: id không khớp UUID → trả `ASSIGNEE_NOT_ASSIGNABLE_MESSAGE` trước khi query.

## Residual risk
- Không chạy app/browser: hành vi form admin (dropdown chỉ liệt kê sale active, nhãn giá trị cũ, không báo lỗi giả) xác minh bằng đọc source `@payloadcms/ui` 3.91, chưa thử thực tế. Trường hợp form-state đầu tiên không có `previousFormState` mà không skipValidation chưa xác minh.
- Race giao đồng thời (MINOR-4 round 1).
- `isSystemActivity` phạm vi cả `req` (như round 1).

## Verdict
✅ **PASS** — MAJOR-1 và MINOR-1..3 của round 1 đã đóng, verify commands PASS, không có CRITICAL/MAJOR mới. MINOR-A..C nên xử lý (MINOR-A là doc reconcile, có thể làm lúc close-out).
