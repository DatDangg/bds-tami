Agent: reviewer

# Review — build/tami-website · layer-8-task-02 (collection `leads` + `lead-activities`) · round 1

- Review level: **STRICT**
- Reason: RBAC theo bản ghi (người được giao), PII khách hàng (BR-32), migration mới + sequence + index SQL tuỳ biến, sửa helper dùng chung của `rentals` (`nextSequenceValue`).
- Phạm vi: diff chưa commit trên `D:\prj\bds` (HEAD ce01ba1), bỏ qua `.claude/launch.json`, `.context/`.

## Blast radius
- Mới: `src/collections/Leads.ts`, `src/collections/LeadActivities.ts`, `src/hooks/leads/*`, `src/lib/leads/lead-values.ts`, `src/lib/payload/next-sequence-value.ts`, `src/components/admin/LeadAssigneeWarning.tsx`, migration `20261018_094454_leads` (+ json snapshot), tests.
- Sửa: `src/hooks/rentals/generate-code.ts` (mã `CT-` của rentals), `src/payload.config.ts`, `src/payload-types.ts`, `importMap.js`, `migrations/index.ts`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/ARCHITECTURE.md`.
- Ảnh hưởng tới: admin `/admin` (sale + admin), REST `/api/leads`, `/api/lead-activities`, bảng `payload_locked_documents_rels`, layer 9 (endpoint lead công khai, phân công, xuất Excel, ẩn danh).

## Verify commands + result (`.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 164 files, 1785 tests, 0 skipped (integration `leads.test.ts`/`leads-migration.test.ts` chạy với DB tạm) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff UI chỉ có một component cảnh báo nhỏ trong form admin Payload (`LeadAssigneeWarning`: 1 đoạn `<p role="alert">`, không layout/grid/media/kích thước cố định). Không có route/CSS public. Không có môi trường browser để kiểm.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); eslint + tsc PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — file ≤163 dòng, hàm ngắn, tên rõ, comment nói WHY; ERD/ARCHITECTURE/PERMISSION đã cập nhật. 0–1 indicator.
- ai-friendly-web: N/A (collection nội bộ, không public-facing).
- blitzstrike: skip, không cài / không có môi trường được phép.

## Đã kiểm, không thấy lỗi
- Đường đọc lead: `read: isAssignedOrAdmin` lọc tầng DB; findByID 404, probe theo `phoneNormalized` trả 0 (test). GraphQL tắt (`payload.config.ts:82`). Không collection nào khác có relationship/join tới `leads` ngoài `lead-activities.lead` (populate theo access của `leads`, nên sale chỉ thấy lead mình). `leads` không bật versions.
- Activity: `read` lọc `lead.assignedTo = user`; update/delete `denyAll`; đổi người phụ trách thì sale cũ mất quyền đọc lịch sử (test).
- Field access: `ipHash` read denyAll; `userAgent`/`assigneeInactive` chỉ admin; field hệ thống `create/update: denyAll` — chặn cả Local API không `overrideAccess` (test sale/admin sửa `code`, `phoneNormalized`, `mergedCount`, `firstContactedAt`…).
- PII không vào log/audit/error: audit chỉ id (test kiểm không chứa SĐT); thông báo validate không lặp lại giá trị; activity `status_change` chỉ chứa trạng thái + lý do.
- Migration: additive, down `IF EXISTS` + test up→down→down→up. Hai index DESC tuỳ biến **không** có trong snapshot json → `migrate:create` sau sẽ diff theo snapshot, không sinh DROP sai (cùng cách với `rentals_search_trgm`).
- Sequence: `nextval` trên kết nối của transaction, không cấp lại khi rollback; tên sequence được whitelist regex `^[a-z_]+$` trước khi nối vào SQL.
- Helper rentals: hành vi giữ nguyên (cùng SQL, cùng session, chỉ thêm tham số tên sequence + kiểm tên).
- `beforeDelete` xoá activities: chỉ chạy khi admin xoá hẳn (không chạy khi xoá mềm), có audit purge; khớp ERD "chỉ thêm, không sửa, không xoá" ở mức người dùng (access delete luôn deny) và tránh lỗi FK `SET NULL` trên cột NOT NULL.
- Anonymize (G23): cột NOT NULL dùng `ANONYMIZED_PLACEHOLDER`, `email`/`message` NULL, `phoneNormalized` bị ép về placeholder (test).

## Findings

### [MAJOR] M1 — Không thêm được ghi chú/cuộc gọi từ `/admin` (cả sale lẫn admin): access `create` của `lead-activities` trả `false` khi không có `data`
- `src/collections/LeadActivities.ts:27-34` (`addManualActivity`): `!MANUAL_ACTIVITY_TYPES.includes(data?.type)` → `false` khi `data` là `undefined`/`{}`.
- Payload tính quyền cho admin UI (`/api/access`, nút "Create New" ở list, nút "Add new" của trường join `activities` trong trang lead, quyền lưu ở create view) bằng cách gọi access `create` **không có data của form** (hoặc với doc rỗng). Hàm này khi đó trả `false` → admin UI coi là không có quyền tạo: sale không có chỗ thêm note/call trong `/admin` — mà `/admin` là giao diện duy nhất của sale. Không đạt AC "sale thêm được note/call trên lead được giao" ở mức sản phẩm; test chỉ chứng minh qua Local API có `data` (`tests/integration/leads.test.ts:300-347`).
- Fix đề xuất: tách hai việc. (1) Access `create`: active staff (admin/sale) → `true` khi không có `data` (lượt dò quyền của UI); có `data` thì giữ kiểm tra hiện tại. Hoặc gọn hơn: access trả `isStaff`, chuyển kiểm "loại chỉ note/call" và "sale chỉ lead được giao" sang hook `beforeValidate`/`beforeChange` (ném `Forbidden` 403) — chạy cả khi `overrideAccess: false` lẫn từ admin form. Nhớ hook phải bỏ qua khi `overrideAccess`/không có user để hệ thống vẫn ghi `status_change`/`assignment`/`merged`. (2) Thêm test: quyền tính cho admin UI (`getAccessResults({ req })` hoặc `GET /api/access` với sale) có `collections['lead-activities'].create.permission === true`, và các test 403 hiện có vẫn PASS. Trong admin form, trường `type` nên giới hạn options cho người dùng ở `note`/`call` (hoặc `filterOptions`) để không chọn loại hệ thống rồi nhận 403.

### [MINOR] m1 — `locale` thiếu index theo ERD
- `src/collections/Leads.ts:68-74` + migration: ERD §4.11 ghi `locale` là `R, I`, code không có `index: true`, migration không có `leads_locale_idx`. Fix: thêm `index: true` (migration mới hoặc cập nhật migration chưa commit — migration này đã áp DB dev nên cần cân nhắc), hoặc ghi lệch vào gap register nếu cố ý bỏ.

### [MINOR] m2 — Ghi chú as-built chèn giữa bảng làm vỡ bảng PERMISSION §3.3
- `docs/PERMISSION.md:68-69`: blockquote chèn sau dòng `lead-activities`, trước dòng `job-applications`/`private-files` → hai dòng sau bị tách khỏi header, render thành text rời. Fix: chuyển blockquote xuống dưới dòng cuối của bảng.

### [MINOR] m3 — Lead đã ẩn danh: admin vẫn sửa được `phone`/`fullName` thành giá trị bất kỳ (bỏ qua validate)
- `src/hooks/leads/sync-phone-normalized.ts:22-23` bỏ qua validate khi `anonymizedAt` đã đặt; `customerFieldAccess` vẫn cho admin sửa. Có thể đưa PII trở lại bản ghi đã ẩn danh. Fix: khi `originalDoc.anonymizedAt` đặt, chặn sửa trường khách (field access `update` kiểm `doc.anonymizedAt`) hoặc ép lại placeholder trong hook.

### [MINOR] m4 — `touchLeadLastActivity` cập nhật lại lead lồng trong `afterChange` của lead
- `src/hooks/leads/lead-activity-hooks.ts:19-32` + `status-activity.ts:23-40`: đổi status → tạo activity → update lead lần 2 trong cùng transaction (chạy lại toàn bộ hook của lead, bump `updatedAt`, `lastActivityAt` trả về ở lần lưu đầu lệch vài ms so với DB). Đúng chức năng, chỉ thừa 1 lần ghi + hook. Có thể bỏ qua cập nhật khi activity là `status_change` (lead đã tự đặt `lastActivityAt` ở `stampLeadTimestamps`) bằng `req.context` flag.

## Residual risk
- M1 dựa trên cách Payload tính permission cho admin UI (access gọi không có `data` của form); không có browser để quan sát trực tiếp, nhưng test của builder không phủ đường này. Builder cần thêm test permission để xác nhận/fix.
- Không chạy được admin UI để kiểm filter mặc định danh sách và hiển thị cảnh báo `assigneeInactive` (chỉ có unit test component).
- Concurrency sequence: dựa trên ngữ nghĩa `nextval`; không có test song song riêng cho `leads` (rentals đã có).

## Verdict
❌ **FAIL** — 1 MAJOR (M1). Sửa M1 (kèm test permission), nên sửa m2 cùng lượt; m1/m3/m4 tuỳ builder (ghi lý do nếu để lại).
