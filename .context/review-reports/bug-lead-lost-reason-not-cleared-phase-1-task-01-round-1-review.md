Agent: reviewer

# Review — bug-lead-lost-reason-not-cleared · phase-1-task-01 · round 1 (BL-127)

- Task: `tasks/bug-lead-lost-reason-not-cleared/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-26-lead-lost-reason-not-cleared.md` (quyết định: xoá ở hook server-side)
- Diff scope: `src/hooks/leads/status-activity.ts`, `src/collections/Leads.ts`, mới `src/hooks/leads/status-activity.test.ts`. Bỏ qua các file bẩn khác, gồm cả thay đổi có sẵn trong `src/hooks/leads/on-assignment-change.ts` (không thuộc task này).

## Review level
**STRICT**

## Reason
Hook ghi dữ liệu collection `leads` (dữ liệu khách hàng, ghi đè `lostReason` về null), và Sale được sửa `status`/`lostReason` (có risk về quyền). Tôi không dựng DB/Docker; dựa vào source Payload + unit test.

## Blast radius
- Mọi thao tác ghi vào `leads` qua Payload (form admin, REST/Local API, bulk edit, xoá mềm/khôi phục, các hook/job khác gọi `payload.update` trên leads): lead nào có status sau khi lưu ≠ `lost` thì `lostReason` thành `null`.
- `recordStatusChange` (activity `status_change`): không đổi hành vi, vì nó chỉ đọc `doc.lostReason` khi `doc.status === "lost"`.
- Xuất Excel `src/endpoints/admin/leads-export.ts:46/81`: lead không lost sẽ xuất ô lý do trống, sau lần lưu kế tiếp. Không đổi schema/migration/API shape.

## Root cause — xác nhận
`Leads.ts:103-112`: `lostReason` chỉ có `validate` (BR-11) + `admin.condition`. Trước khi sửa, `beforeChange` (`Leads.ts:261`) không có hook nào xoá giá trị. Ô chỉ bị ẩn nên giá trị cũ vẫn nằm trong DB. Root cause đúng, đã xác định từ code.

## Phân tích semantics
- **Thứ tự Payload 3.91** (`node_modules/payload/dist/collections/operations/utilities/update.js:20-23,100-198`): field beforeValidate (có **field access**: `fields/hooks/beforeValidate/promise.js:220`) → collection beforeValidate (`guardTrashedEdit`, `guardAnonymizedCustomerData`, …) → **collection beforeChange (hook mới)** → field beforeChange (**validate**).
  - Field access chạy trước hook, nên giá trị `null` do hook ghi không bị access cắt. `lostReason` cũng không có `access` riêng; Sale (`isAssignedOrAdmin`) và Admin đều được ghi.
  - Validate chạy sau hook: khi status ≠ lost, `validate` trả `true` với `null`. Khi status = lost, hook giữ nguyên `data`, nên BR-11 vẫn bắt nhập lý do (lý do cũ đã bị xoá → ô trống → bắt buộc nhập lại). Đúng acceptance.
  - Guard đã xoá mềm và guard ẩn danh chạy ở beforeValidate, trước hook. Hook chỉ đụng `lostReason` (không phải field khách hàng thuộc guard ẩn danh), nên không vượt guard.
- **Create**: status mặc định `new` được điền ở field beforeValidate, nên lead tạo mới không mang lý do. Lead tạo với `lost` vẫn giữ lý do.
- **Update đầy đủ / update một phần**: `data.status ?? originalDoc?.status` xử lý được cả hai trường hợp: chỉ gửi `status`, hoặc không gửi `status` mà lead không lost còn lý do cũ.
- **Bulk update**: Payload chạy `updateDocument` cho từng doc với `originalDoc` của chính doc đó, nên cùng logic.
- **Vẫn lost, sửa field khác**: trả nguyên `data` (không thêm key) → không có ghi ngoài ý muốn. Lưu lead không lost: thêm `lostReason: null`. Postgres adapter vốn ghi cả row đã merge, nên không phát sinh write mới. Trường hợp duy nhất đổi dữ liệu là dọn lý do thừa, đúng chủ đích.
- **Thứ tự trong beforeChange**: `[stampLeadTimestamps, clearLostReasonWhenNotLost, stampAssignedAt]`. Ba hook đụng các field khác nhau, cùng spread `data`, nên không phụ thuộc thứ tự.
- **recordStatusChange**: chuyển lost→new thì `content` = undefined (như cũ); chuyển new→lost thì content = lý do mới. Không đổi.
- **Form admin sau khi lưu**: form được nạp lại từ doc server trả về (`lostReason: null`), nên chọn lại "Không thành" thì ô trống. Nếu chưa lưu mà đổi qua lại trong cùng form thì vẫn thấy giá trị DB hiện tại, vì DB vẫn đang lost. Hợp lý.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/hooks/leads src/collections` | PASS — 16 files, 130/130 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — không có lỗi |
| `pnpm exec eslint src/hooks/leads/status-activity.ts src/hooks/leads/status-activity.test.ts src/collections/Leads.ts` | PASS — không có output |
| Integration DB / chạy app | skip — không có Docker/DB (theo chỉ dẫn) |

## Repro Verification (bug closure)
Status `PASS`. Evidence: unit test hook gồm 6 case (create, update đầy đủ, update một phần chỉ gửi status, update không có status nhưng còn lý do cũ, vẫn lost, create lost). Reviewer đã chạy lại: PASS. Tôi đã kiểm trên source Payload rằng hook chạy trước validate/persist, nên chứng minh được giá trị `null` đi xuống DB. Evidence kiểm chứng được.

## Responsive Checklist Gate
N/A — diff không đụng UI (không có route/component/CSS; chỉ hook server + config hook).

## Skill gates
- aislop: skip — chưa cài `aislop`.
- oxlint (anti-slop): skip — chưa cấu hình oxlint (không có `.oxlintrc*`). ESLint của repo PASS.
- ocr (open-code-review): skip — chưa cài `ocr`.
- AI-readable: OK — tên rõ (`clearLostReasonWhenNotLost`), hàm 4 dòng, không có magic number, comment giải thích WHY (BR-11, update một phần, không backfill). File `status-activity.ts` 90 dòng. 0 indicator.
- ai-friendly-web: N/A — không phải thay đổi public web.
- blitzstrike: skip — không có môi trường. Thay đổi không mở rộng bề mặt tấn công (chỉ xoá dữ liệu, không thêm quyền ghi).

## Findings
- [MINOR] Doc impact chưa reconcile: `docs/ERD.md:534` chỉ ghi "R khi `status=lost`". Nên bổ sung câu "rời `lost` → hệ thống xoá `lostReason` (hook `clearLostReasonWhenNotLost`)". ERD đang bẩn sẵn nên để close-out/spec-publisher xử lý (task đã ghi). Không chặn PASS.
- [MINOR] Test chỉ ở mức unit (gọi hook với args giả). Không có test integration chứng minh thứ tự hook/validate với Payload thật. Đã bù bằng việc kiểm source Payload; ghi vào Residual risk. Không chặn PASS.

Không có CRITICAL/MAJOR.

## Residual risk
- Không backfill: lead cũ không lost còn lý do thừa chỉ được dọn ở lần lưu kế tiếp. Trước đó, export Excel vẫn xuất lý do cũ (đúng quyết định trong task).
- Chưa chạy integration DB (no Docker). Thứ tự hook → validate → persist được suy ra từ source Payload 3.91; nâng Payload major phải kiểm lại.
- Mọi ghi `payload.update` lên lead không lost (kể cả hook/job hệ thống, xoá mềm) đều dọn lý do thừa. Đây là hành vi mong muốn, ghi lại để biết.

## Verdict
PASS
