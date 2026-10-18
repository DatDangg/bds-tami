Agent: reviewer

# Review — build/tami-website · layer-8-task-02 (collection `leads` + `lead-activities`) · round 2

- Review level: **STRICT**
- Reason: RBAC theo bản ghi (sale chỉ lead được giao), cờ bỏ qua guard trong `req.context` (có thể thành đường vượt quyền), PII khách (BR-32, ẩn danh), migration + snapshot JSON sửa tay, helper dùng chung `nextSequenceValue` với `rentals`.
- Phạm vi: diff chưa commit trên `D:\prj\bds` (HEAD ce01ba1), bỏ qua `.claude/launch.json`, `.context/`. Không đụng `D:\prj\bds-wt8-t03`, `D:\prj\bds-wt8-t05`.

## Blast radius
- Mới: `src/collections/Leads.ts`, `src/collections/LeadActivities.ts`, `src/hooks/leads/*`, `src/lib/leads/lead-values.ts`, `src/lib/payload/next-sequence-value.ts`, `src/components/admin/LeadAssigneeWarning.tsx`, migration `20261018_094454_leads` (.ts + .json), tests.
- Sửa: `src/hooks/rentals/generate-code.ts`, `src/payload.config.ts`, `src/payload-types.ts`, `importMap.js`, `migrations/index.ts`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/ARCHITECTURE.md`, `spec/changes/BACKLOG.md` (xem m3).
- Ảnh hưởng: `/admin` (sale + admin), REST `/api/leads`, `/api/lead-activities`, `/api/access`, `payload_locked_documents_rels`; layer 9 (endpoint lead công khai, phân công, gộp lead, gửi email, ẩn danh) sẽ phải ghi activity hệ thống qua `asSystemActivity`.

## Verify commands + result (`.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 164 files, 1788 tests (exit 0); log lỗi query media `khong-phai-uuid` là test âm có sẵn, không phải fail |
| `pnpm build` | PASS (exit 0) |
| `payload migrate:create --dry-run` | skip — không thuộc verify commands được phép; kiểm snapshot bằng đọc tay (xem dưới) |

## Kiểm lại các finding round 1
- **M1 — ĐÃ SỬA.** `LeadActivities.ts:27` access `create` = `isStaff` → admin UI dò quyền không có `data` vẫn nhận `true`. Kiểm loại/lead chuyển sang `guardManualActivity` (`lead-activity-hooks.ts:28-37`, `beforeValidate`, chạy trước `stampActivityActor` và trước validate field): không phải staff hoặc type ∉ {note, call} → 403; sale: `lead` phải là string và `findByID(..., overrideAccess:false, req)` thấy được (cùng transaction, lọc theo `assignedTo`), không thì 403; fail-closed với `lead` dạng object/thiếu. Test `getAccessResults` (`tests/integration/leads.test.ts:366-376`) kỳ vọng `create === true` cho sale/admin — với code cũ (`!MANUAL_ACTIVITY_TYPES.includes(data?.type)` → `false` khi không có data) test này sẽ đỏ, nên test thực sự bắt lỗi cũ dù viết sau khi sửa. Các test 403 (lead người khác/chưa giao/id không tồn tại; loại hệ thống cho cả sale lẫn admin) vẫn PASS → không nới quyền. `filterOptions` của `type` chỉ còn note/call trên form khi không có cờ hệ thống (test dòng 378-388).
- **Cờ `req.context` không client-đặt được:** `node_modules/payload/dist/utilities/createPayloadRequest.js:55` khởi tạo `context: {}` cho mỗi request REST/admin; không có đường nào trong `src` gán `req.context.systemActivity` ngoài `asSystemActivity`. Body/header/query không vào `req.context`.
- **`asSystemActivity` an toàn khi lỗi:** `try/finally` khôi phục giá trị cũ (`lead-activity-hooks.ts:13-21`); lỗi trong `create` vẫn trả cờ về trước khi lỗi lan ra.
- **m1 — ĐÃ SỬA.** `Leads.ts:72` `index: true`; migration `.ts:80` `CREATE INDEX "leads_locale_idx"`; snapshot `.json:14052-14066` cùng cấu trúc với entry Payload sinh bên cạnh (`leads_status_idx`: `columns[{expression,isExpression,asc,nulls}]`, `isUnique`, `concurrently`, `method`, `with`), đúng vị trí theo thứ tự field → `migrate:create` sau không thấy diff giả cho index này. `leads-migration.test.ts:10,61` kiểm index có sau up. Down: DROP TABLE kéo theo index.
- **m2 — ĐÃ SỬA.** `docs/PERMISSION.md:71` blockquote nằm sau dòng cuối bảng §3.3, bảng không còn bị cắt.
- **m3 — ĐÃ SỬA.** `guardAnonymizedCustomerData` (`sync-phone-normalized.ts:34-42`) 400 khi đổi `fullName/phone/email/message` của lead đã ẩn danh; gửi lại nguyên trạng OK; lượt ẩn danh đầu (originalDoc chưa có `anonymizedAt`) không bị chặn. Test dòng 130-145.
- **m4 — ĐÃ SỬA.** `touchLeadLastActivity` bỏ qua `status_change` (`lead-activity-hooks.ts:57`); `stampLeadTimestamps` đã đặt `lastActivityAt` khi đổi status → không còn update lead lồng.

## Responsive Checklist Gate
N/A — round 2 không đổi UI (chỉ `filterOptions` của select trong form admin Payload). `LeadAssigneeWarning` không đổi so với round 1 (1 `<p role="alert">`, không layout/media/kích thước cố định). Không có route/CSS public.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured; eslint + tsc PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — file ≤164 dòng, hàm ngắn, tên rõ (`guardManualActivity`, `asSystemActivity`, `isSystemActivity`), comment nói WHY; ERD/PERMISSION/ARCHITECTURE đã cập nhật. 1 indicator nhẹ (m2 dưới — doc chưa ghi contract cờ hệ thống).
- ai-friendly-web: N/A (collection nội bộ).
- blitzstrike: skip, không cài / không có môi trường được phép.

## Findings

### [MINOR] m1 — `asSystemActivity` lưu/khôi phục kiểu boolean không chịu được ghi song song trong cùng request
- `src/hooks/leads/lead-activity-hooks.ts:13-21`. Bulk update `leads` (admin list "Edit many" đổi `status` nhiều lead, sale cũng làm được) chạy `Promise.all(docs.map(processDocument))` với **chung `req`** cho collection không phải upload (`node_modules/payload/dist/collections/operations/update.js:316-324`, `documentReq = req` dòng 217). Hai `recordStatusChange` chồng nhau: A đặt `true` (prev `undefined`), B đặt `true` (prev `true`), A xong → `undefined` trong khi B còn đang chạy; B xong → khôi phục `true`, cờ kẹt `true` tới hết request. Không khai thác được từ client (request không có lượt tạo activity tay nào sau đó; mỗi request có `context` mới), và các bước của B trước insert chủ yếu là microtask nên khó lộ ra — không quan sát được lỗi, chưa có test. Nhưng nếu B có I/O giữa lúc đặt cờ và validate (select `type` dùng `filterOptions` theo cờ), B có thể nhận 403/400; lỗi per-doc trong bulk bị nuốt (`update.js:288-297`, Postgres không kill transaction) → lead đổi status mà không có `status_change`.
- Fix đề xuất: đổi sang bộ đếm (`req.context.systemActivity = (n ?? 0) + 1` / giảm trong `finally`, `isSystemActivity` = `> 0`), hoặc truyền cờ theo lượt ghi thay vì trạng thái dùng chung của request. Thêm test bulk update `status` cho ≥ 2 lead → mỗi lead đúng 1 `status_change`.

### [MINOR] m2 — Chưa ghi contract "hệ thống ghi activity phải bọc `asSystemActivity`" vào doc as-built
- `docs/ERD.md` (dòng `lead-activities` as-built) ghi "chỉ hệ thống ghi bằng Local API", nhưng `overrideAccess: true` một mình giờ **không đủ**: `guardManualActivity` vẫn ném 403 khi không có cờ (kể cả khi không có user — vd endpoint lead công khai gộp lead `merged`). Layer 9 (phân công/gộp/email) dễ vấp. Fail-closed nên không phải lỗ hổng.
- Fix đề xuất: thêm 1 câu vào ERD §4.11 as-built (và/hoặc comment ở `LeadActivities.ts:68-71`): "ghi `status_change`/`assignment`/`merged`/`email_sent` phải qua `asSystemActivity(req, …)`".

### [MINOR] m3 — `spec/changes/BACKLOG.md` có dòng BL-006 của L8-T03 trong checkout này
- Dòng BL-006 ("Reindex `rentals.searchText`…, review L8-T03 MINOR-2") không thuộc L8-T02. Primary khi commit T02 cần loại hunk này (hoặc commit theo task tương ứng) để giữ 1 task = 1 commit. Không phải lỗi code.

## Residual risk
- Không chạy được `payload migrate:create` để chứng minh snapshot không sinh diff; đánh giá dựa trên so khớp cấu trúc với entry Payload sinh và test up/down PASS.
- Sale gửi `lead` là chuỗi không phải UUID: `findByID` trên cột uuid có thể ra lỗi DB (500) thay vì 403 — không vượt quyền, chưa kiểm.
- Race ở m1 suy ra từ code Payload, không tái hiện được (reviewer không chạy script/app ngoài verify commands).
- Không có browser để quan sát form admin thật (nút "Add new" của join `activities`, danh sách option `type`); dựa trên `getAccessResults` + unit `filterOptions`.

## Verdict
✅ **PASS** — M1 và m1–m4 round 1 đã sửa, có test. Không còn CRITICAL/MAJOR. 3 MINOR (m1 nên sửa trước layer 9; m2 doc; m3 vệ sinh commit).
