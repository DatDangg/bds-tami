Agent: reviewer

# Review — build/tami-website · layer-9-task-04 · round 1

- Work item: build `tami-website`, layer 9, task 04 — job `remind-unassigned-leads` (BR-14)
- Code: worktree `D:\prj\bds-wt9-t04`, branch `wt/l9-t04` (base 7d1907f, chưa commit)
- Review level: **STRICT**
- Reason: cron/background job + logic thời gian, migration (enum `ADD VALUE` + cột mới), email gửi admin (PII), ghi dữ liệu theo lô trong transaction.
- Blast radius: `src/lib/leads/business-hours.ts` (mới), `src/jobs/remind-unassigned-leads.ts` (mới), `src/jobs/index.ts` (đăng ký task), `src/lib/email/templates/{unassigned-reminder.ts,index.ts}` (template mới → mở rộng enum `template` của `send-notification-email`), `src/collections/Leads.ts` (`remindedAt`), `migrations/20261018_113101_leads_reminded_at.*` + `migrations/index.ts`, `src/payload-types.ts`, docs `ARCHITECTURE.md` §5.4 / `ERD.md` §4.11. Bảng ảnh hưởng: `leads` (cột mới), `lead_activities` (dòng `email_sent`), `payload_jobs`/`payload_jobs_log` (enum `task_slug`). Không đụng UI, auth, API công khai.

## Verify commands + result (chạy trong `D:\prj\bds-wt9-t04`)

| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 1938/1938 test PASS; 1 suite fail `src/lib/contrast.test.ts` (CRLF, đã biết, ngoài scope — không do diff này) |
| `pnpm test` (riêng 4 file của task: integration `remind-unassigned-leads`, integration `leads-reminded-at-migration`, unit `business-hours`, `templates`) | 4/4 file, 29/29 test PASS, không skip (Postgres test sẵn sàng) |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | không chạy (diff không đổi `package.json`/lockfile) |

## Kiểm đặc biệt

### Cron `0 */10 1-10 * * 1-6` (UTC, 6 trường có giây — cùng dạng job có sẵn `0 5 17 * * *`)
- Chạy 01:00…10:50 UTC = 08:00…17:50 VN cùng ngày; vì cả khung nằm trong cùng ngày lịch ở cả hai múi giờ, thứ 1-6 UTC = thứ 2–7 VN. Đúng.
- 08:00 VN (01:00 UTC): `isBusinessHour` dùng `>= WORK_START` → chạy. 17:30/17:40/17:50 VN (10:30/40/50 UTC): `< WORK_END` → bỏ qua, trả `{reminded:0}`. Đúng như thiết kế.
- Lần cuối có hiệu lực 17:20 VN. Lead tạo 17:00–17:30 VN chưa đủ 30 phút → tính tiếp sáng hôm sau (vd tạo 17:25 thứ 7 → đủ 30 phút lúc 08:25 thứ 2 → nhắc ở lần 08:30). Lead tạo tối thứ 7/Chủ nhật → đếm từ 08:00 thứ 2 → nhắc ở lần 08:30 thứ 2. Không lead nào bị bỏ sót (lần 01:00 UTC thứ 2 không bỏ ai, các lần sau vẫn quét vì điều kiện là `remindedAt IS NULL` chứ không phải cửa sổ thời gian). Có integration test cho trường hợp tối thứ 7 → Chủ nhật → 07:00 → 08:20 (0) → 08:30 (1).
- Độ trễ tối đa ~10 phút sau mốc 30 phút (do chu kỳ 10 phút) — chấp nhận được theo spec "10 phút/lần".

### `businessMinutesBetween` / `isBusinessHour`
- Quy đổi UTC+7 cố định, VN không có DST → đúng; không phụ thuộc TZ máy (có test).
- Vòng lặp theo ngày từ đầu ngày VN của `from`, cắt `[max(08:00,start), min(17:30,end)]`, bỏ Chủ nhật: đúng cho trong ngày, trước 08:00, sau 17:30, qua đêm, cuối tuần, nhiều ngày; `to <= from` → 0. 12 unit test phủ đủ các biên này.
- Tiền lọc DB `createdAt <= now − 30 phút` là điều kiện cần (phút làm việc ≤ phút thực) và phút làm việc giảm đơn điệu theo `createdAt`, nên sort `createdAt` + limit 200 không làm lead đến hạn bị đẩy ra sau lead chưa đến hạn.

### `remindedAt` — quyền & lộ dữ liệu
- `access: systemFieldAccess` = `{ create: denyAll, update: denyAll }` (`src/collections/Leads.ts:31,155`): admin/sale không ghi được qua REST/admin; job ghi bằng `overrideAccess: true`. Đọc theo collection (`isAssignedOrAdmin`) — collection `leads` không có quyền đọc công khai, nên field không lộ ra API khách.
- Không có giá trị client nào đặt được `remindedAt` lúc tạo (endpoint lead công khai ở staging tạo bằng data tường minh, và field `create: denyAll`).

### Transaction / idempotent
- Handler của Payload 3.91 không chạy trong transaction sẵn (chỉ `updateJob` mở transaction riêng) → `ownsTransaction = true`; update lead + activity + `jobs.queue` cùng commit/rollback. Test "queue down → rollback remindedAt và activity" PASS.
- Chạy tuần tự 2 lần → 1 email (test PASS). Chạy chồng song song: không có khoá/điều kiện update — xem MINOR-1. Rủi ro thực tế thấp vì chỉ 1 process `jobs` (`docs/ARCHITECTURE.md:263`), không `autoRun` (`src/jobs/index.ts:13`), và scheduler mặc định của Payload không xếp thêm job của cùng task khi đã có job đang chờ/chạy.

### Migration
- `ALTER TYPE … ADD VALUE IF NOT EXISTS` trong transaction: hợp lệ từ Postgres 12; giá trị mới không được dùng trong cùng transaction migration → không vướng giới hạn "unsafe use of new value". `ADD COLUMN IF NOT EXISTS reminded_at timestamptz` nullable → additive, không backfill, không khoá lâu.
- `down`: xoá dòng `payload_jobs_log`/`payload_jobs` của task rồi đổi cột về text, dựng lại enum, `DROP COLUMN IF EXISTS` — chạy lại được (test up→down→down→up PASS). Down làm mất lịch sử job của chính task này (đã ghi chú trong file; chấp nhận cho rollback).
- Không có migration mới nào trên staging sau 7d1907f (`git diff --stat 7d1907f staging -- migrations/` rỗng) → thứ tự nối tiếp đúng. Không phải `HIGH_RISK_MIGRATION`.

### PII
- Email: chỉ `code` + `leadUrl` (`${NEXT_PUBLIC_SITE_URL}/admin/collections/leads/<id>`), `escapeHtml` cho cả hai, zod giới hạn URL `http(s)`. Test khẳng định input job không chứa SĐT/tên.
- Activity `content` là chuỗi cố định, không PII. Log chỉ có số lượng (`reminded`, `leads`, `limit`).

### Hiệu năng
- ≤ 200 lead/lần, mỗi lead 3 lần ghi (update lead, tạo activity, hook activity cập nhật `lastActivityAt`) trong 1 transaction — chấp nhận được với lượng lead thực tế. Truy vấn ứng viên lọc `status`/`assignedTo`/`remindedAt`/`anonymizedAt`/`createdAt`; chạy 10 phút/lần trên bảng nhỏ → chưa cần index riêng (xem MINOR-2).

### Rủi ro merge với staging (c30fa45)
- `src/collections/Leads.ts`: staging sửa import (dòng ~13), `validateAssignee` (~109) và JSDoc (~164); diff này thêm 2 dòng ở `trackingFields` (~154) → khác hunk, dự kiến auto-merge.
- `docs/ERD.md`: staging thêm đoạn as-built L9-T01 ở ~dòng 569; diff này sửa ~452 và ~481 → khác hunk.
- `docs/ARCHITECTURE.md`: staging thêm 3 dòng; diff này sửa 1 dòng bảng job (~223) — cần xem khi merge nếu staging cũng sửa bảng job.
- `src/payload-types.ts`, `migrations/index.ts`: staging không đổi → không xung đột. Nếu L9-T05 (worktree song song) cũng thêm migration/enum task job thì phải sinh lại `payload-types.ts` và kiểm thứ tự migration sau khi merge.

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS (chỉ job, lib, collection field admin read-only, template email).

## Skill gates
- aislop: skip — không nằm trong verify commands được cho phép của reviewer; code soi tay không thấy dấu hiệu slop.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); ESLint `pnpm lint` PASS.
- ocr (open-code-review): skip, ocr not installed / không trong verify commands.
- AI-readable: OK — 0 indicator: tên rõ, `remindUnassignedLeads` ~80 dòng nhưng tuyến tính (find → filter → admins → transaction) — vượt nhẹ ngưỡng 50 dòng tính cả khối `payload.find` nhiều dòng tham số; hằng số có tên (`REMIND_AFTER_BUSINESS_MINUTES`, `MAX_LEADS_PER_RUN`, `MAX_LEADS_IN_EMAIL`, `WORK_START_MS`…); comment nêu WHY; ARCHITECTURE/ERD đã cập nhật. Tổng < 3 indicator.
- ai-friendly-web: N/A (không public-facing).
- blitzstrike: skip — không có môi trường/không phải API public.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. **Không chặn chạy chồng** — `src/jobs/remind-unassigned-leads.ts:33-51,76`: danh sách ứng viên đọc ngoài transaction, `payload.update` theo id không kiểm lại `remindedAt IS NULL`. Hai lần chạy đồng thời (vd admin gọi `/api/payload-jobs/run` đúng lúc job lịch đang chạy) sẽ nhắc trùng (2 email + 2 activity). Đã được giảm thiểu bởi kiến trúc 1 process `jobs`, nên không chặn PASS. Đề xuất (task sau hoặc khi sửa tiếp): `SELECT pg_advisory_xact_lock(<key>)` ngay sau `initTransaction` rồi đọc lại ứng viên trong transaction (cùng cách `src/hooks/staff/last-admin-guard.ts:38`), hoặc update có điều kiện `remindedAt exists:false` và chỉ đưa vào email những lead thực sự được cập nhật.
2. **Chưa có index cho truy vấn quét** — `src/collections/Leads.ts:155` (`remindedAt` không index): hiện bảng nhỏ và có index `createdAt`, chấp nhận được. Nếu lượng lead tăng, cân nhắc partial index `(created_at) WHERE status='new' AND assigned_to_id IS NULL AND reminded_at IS NULL`.
3. **Mỗi lần nhắc đẩy `lastActivityAt`** — hook `lead-activity-hooks.ts:61-70` cập nhật `lastActivityAt` khi tạo activity `email_sent` của hệ thống, nên mốc giữ lại 24 tháng (BR-31) lệch ~30 phút làm việc so với lúc tạo lead. Ảnh hưởng không đáng kể; chỉ ghi để biết.

## Residual risk
- Chưa xác minh hành vi `croner` với đúng biểu thức trên process `jobs` thật (không chạy app); dựa vào cùng dạng 6 trường mà các job có sẵn đang dùng và test gọi trực tiếp handler.
- Bản Postgres của staging/prod giả định ≥ 12 (cần cho `ADD VALUE` trong transaction); migration test đã chạy thật trên Postgres dev.
- Ngày lễ chưa trừ (theo spec).

## Verdict
✅ **PASS** — không có CRITICAL/MAJOR; 3 MINOR không chặn, có thể làm ở task sau.
