# feature-layer9-minor-export-reminder · phase-1-task-02 — Index cho truy vấn quét của job nhắc lead chưa giao (BR-14)

- Change doc: `spec/changes/2026-10-19-layer9-minor-export-reminder.md` (BACKLOG BL-009, mục 5)
- Nguồn: review L9-T04 round 1 MINOR-2 (`.context/review-reports/build-tami-website-layer-9-task-04-round-1-review.md:82`), `tasks/tami-website/layer-9-task-06.md:108` (index quét lead nhắc), spec-validation layer 9 G33
- Spec: không đổi requirement (hiệu năng, NFR A6 "thiết kế cho 100.000 tin / 1.000 người đồng thời")

## Hiện trạng (change-request đã đọc code)
- `src/jobs/remind-unassigned-leads.ts` `findDueLeads` (≈ `:58-80`): `payload.find leads` where `status = 'new'` AND `assignedTo exists:false` AND `remindedAt exists:false` AND `anonymizedAt exists:false` AND `createdAt <= now-30m`, `sort: createdAt`, `limit: MAX_LEADS_PER_RUN`, chạy 10 phút/lần trong transaction có khoá advisory. Payload trash bật cho `leads` → Payload thêm `deleted_at IS NULL`.
- Index hiện có trên `leads` (migration `migrations/20261018_094454_leads.ts`): đơn cột `status`, `assigned_to_id`, `created_at`, `deleted_at`, `phone_normalized`…, tổng hợp `leads_phone_source_created_idx` viết tay trong migration (`:98`). `reminded_at` (migration `20261018_113101_leads_reminded_at.ts`) không index.
- Collection-level `indexes` của Payload có dùng trong repo: `src/collections/AuditLogs.ts:28`, `ClickStatsDaily.ts:23`, `Wards.ts:25`.
- Pattern migration: `migrations/*.ts` + `.json` snapshot + `migrations/index.ts`; tạo bằng `pnpm payload migrate:create <name>`; apply `pnpm payload migrate`. Tiền lệ CONCURRENTLY: `migrations/20261018_082231_rentals_search_trgm.ts:8` ghi rõ không chạy được trong transaction của migration → dùng `CREATE INDEX IF NOT EXISTS` thường.
- Test migration mẫu: `tests/integration/leads-reminded-at-migration.test.ts`, `tests/integration/rentals-reindex-job-migration.test.ts` (DB tạm, up/down/up).

## Classification / Risk
- Type: **MODIFY** (hiệu năng — thêm index, không đổi hành vi).
- Risk: **MEDIUM** — DB migration (additive `CREATE INDEX` + `DROP INDEX` ở down). Không destructive với dữ liệu. Không phải HIGH_RISK_MIGRATION.
- Review level expected: **STRICT** (DB/schema/migration).

## Thiết kế (gợi ý — builder chốt theo code thật)
- Index btree tổng hợp `leads (status, assigned_to_id, reminded_at, created_at)` — đúng thứ tự cột yêu cầu: equality `status`, `IS NULL` của `assigned_to_id`/`reminded_at` (btree hỗ trợ IS NULL như điều kiện index), range + sort `created_at`. Dùng được cả với plan generic (tham số) — khác partial index `WHERE status='new' …` có thể không khớp predicate khi giá trị là tham số; nếu builder chọn partial thì phải chứng minh bằng EXPLAIN với câu truy vấn thật của Payload/Drizzle.
- Ưu tiên khai báo trong config collection `Leads` (`indexes: [{ fields: ["status", "assignedTo", "remindedAt", "createdAt"] }]`) rồi `pnpm payload migrate:create leads_remind_scan_index` để snapshot `.json` đồng bộ (lần `migrate:create` sau không sinh lại/drop). Kiểm SQL sinh ra: CHỈ `CREATE INDEX` (+ `DROP INDEX` ở down); có thứ gì khác (đổi cột/enum/DROP khác) → cắt bỏ hoặc dừng nếu destructive (`HIGH_RISK_MIGRATION`). Nếu Payload không hỗ trợ field relationship trong `indexes` → migration tay theo pattern `leads_phone_source_created_idx`, ghi decision.
- `IF NOT EXISTS` / `IF EXISTS` cho idempotent. CONCURRENTLY: chỉ dùng nếu migration runner Payload cho phép chạy ngoài transaction — tiền lệ repo nói không → dùng CREATE INDEX thường, ghi decision (bảng `leads` nhỏ lúc deploy; khoá SHARE ngắn chặn ghi trong thời gian dựng index).
- Kiểm planner: trên DB dev/tạm, `EXPLAIN` câu truy vấn quét (SQL Payload sinh ra, lấy qua log drizzle hoặc viết tay tương đương) với `SET enable_seqscan = off` → dùng index mới. Ghi kết quả vào verification summary (bảng nhỏ thì planner vẫn chọn seqscan khi bật — bình thường).
- Integration test migration: up → index tồn tại (`pg_indexes`, đúng cột/thứ tự) → down → không còn → up lại (pattern `leads-reminded-at-migration.test.ts`). Nếu test cũ assert "migration cuối cùng là X" → sửa thành assertion thứ tự (đã có tiền lệ).
- Apply dev DB: `pnpm payload migrate` (CẤM reset / db push / seed). `pnpm generate:types` nếu config đổi — chỉ commit `src/payload-types.ts` nếu nội dung đổi thật (không chỉ EOL).
- Doc impact: `docs/ERD.md` §4.11 (index của `leads`) + §7 as-built nếu có liệt kê migration; `docs/ARCHITECTURE.md` §5.4 dòng job nhắc nếu có nói về hiệu năng.

## Acceptance
- [ ] Migration versioned `CREATE INDEX` (không destructive) cho `leads (status, assigned_to_id, reminded_at, created_at)`; down xoá index
- [ ] Apply được trên dev DB; integration test up/down/up PASS
- [ ] EXPLAIN chứng minh truy vấn quét dùng được index
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` PASS

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`; `pnpm payload migrate` (dev DB 127.0.0.1:5433); `pnpm vitest run --project integration <file migration test>`.
- Test fail sẵn không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400".
- Report: `.context/review-reports/feature-layer9-minor-export-reminder-phase-1-task-02-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`. Migration destructive → `HIGH_RISK_MIGRATION` → blocked.

## Decision log
- (change-request) Index tổng hợp không partial làm mặc định (khớp đúng cột change doc, an toàn với plan generic).
- (builder) Khai `indexes: [{ fields: ["status", "assignedTo", "remindedAt", "createdAt"] }]` trong `src/collections/Leads.ts` (Payload 3.91 map key field relationship `assignedTo` → cột `assigned_to_id`, kiểm `@payloadcms/drizzle/dist/schema/build.js:200-240` + `traverseFields.js:743`), rồi `pnpm payload migrate:create leads_remind_scan_index` → `migrations/20261018_212611_leads_remind_scan_index.ts` + `.json`. SQL sinh ra CHỈ `CREATE INDEX` / `DROP INDEX` (snapshot `.json` chỉ khác `public.leads.indexes` so với `20261018_203017_rentals_reindex_job.json`; không enum/cột/DROP khác) → không `HIGH_RISK_MIGRATION`. Thêm `IF NOT EXISTS` / `IF EXISTS` + comment, bỏ tham số `payload, req` không dùng; không sửa phần khác Payload sinh.
- (builder) Tên index do Payload sinh `status_assignedTo_remindedAt_createdAt_idx` (quy ước Payload: ghép key field, không tiền tố bảng — như `province_slug_idx`, `collection_docId_idx`). Giữ nguyên để snapshot khớp; đổi tên tay sẽ làm `migrate:create` lần sau sinh rename/drop.
- (builder) Không CONCURRENTLY: `@payloadcms/drizzle` 3.91 `runMigrationFile` (`dist/migrate.js:62-90`) bọc `initTransaction` → `commitTransaction`, nên `CREATE INDEX CONCURRENTLY` lỗi "cannot run inside a transaction block". Dùng `CREATE INDEX` thường: bảng `leads` nhỏ lúc deploy (dev 0 dòng), khoá SHARE chặn ghi lead trong vài ms.
- (builder) Index cũ `leads_status_assignee_created_idx` `(status, assigned_to_id, created_at DESC)` (migration `leads`:99, phục vụ danh sách admin) vẫn giữ: thiếu `reminded_at` nên khi lead `new` chưa giao đã nhắc tích tụ phải lọc nhiều dòng; index mới có `reminded_at IS NULL` trong Index Cond. Test migration chèn dữ liệu hình dạng đó (20.000 lead, ~1% chưa nhắc) trong DB tạm để EXPLAIN có ý nghĩa (bảng rỗng planner chọn `leads_status_idx` ước lượng 1 dòng).
- (builder) `pnpm generate:types`: `src/payload-types.ts` không đổi (index không ảnh hưởng type; `git diff` rỗng, kể cả EOL).
- (builder) Không ghi `.context/runs/**` theo ràng buộc của change-request (primary ghi journal).

## Verification summary (builder)
- Migration: `migrations/20261018_212611_leads_remind_scan_index.ts`
  - up: `CREATE INDEX IF NOT EXISTS "status_assignedTo_remindedAt_createdAt_idx" ON "leads" USING btree ("status","assigned_to_id","reminded_at","created_at");`
  - down: `DROP INDEX IF EXISTS "status_assignedTo_remindedAt_createdAt_idx";`
  - `pnpm payload migrate` trên dev DB 127.0.0.1:5433 (Postgres 17.5): `Migrated: 20261018_212611_leads_remind_scan_index (14ms)`; `pg_indexes.indexdef` = `CREATE INDEX "status_assignedTo_remindedAt_createdAt_idx" ON public.leads USING btree (status, assigned_to_id, reminded_at, created_at)`. Không reset/db push/seed; không chèn dữ liệu dev.
- Test mới `tests/integration/leads-remind-scan-index-migration.test.ts` (DB tạm): RED trước khi có migration (`expected undefined to be defined`), GREEN sau: thứ tự sau `20261018_113101_leads_reminded_at`; up → indexdef đúng cột/thứ tự; down → mất; down lần 2 êm; up → có lại; up lần 2 (IF NOT EXISTS) êm; chèn 20.000 lead + `ANALYZE` + `SET enable_seqscan = off` → EXPLAIN câu quét tương đương Payload (`status = 'new' AND assigned_to_id IS NULL AND reminded_at IS NULL AND anonymized_at IS NULL AND deleted_at IS NULL AND created_at <= now() ORDER BY created_at LIMIT 200`) dùng index mới.
- EXPLAIN (DB tạm, 20.000 dòng, seqscan off):
  ```
  Limit  (cost=149.27..149.39 rows=50 width=34)
    ->  Sort  (cost=149.27..149.39 rows=50 width=34)  Sort Key: created_at
          ->  Bitmap Heap Scan on leads  (cost=5.05..147.86 rows=50 width=34)
                Recheck Cond: ((status = 'new') AND (assigned_to_id IS NULL) AND (reminded_at IS NULL) AND (created_at <= now()))
                Filter: ((anonymized_at IS NULL) AND (deleted_at IS NULL))
                ->  Bitmap Index Scan on "status_assignedTo_remindedAt_createdAt_idx"  (cost=0.00..5.04 rows=50 width=0)
                      Index Cond: ((status = 'new') AND (assigned_to_id IS NULL) AND (reminded_at IS NULL) AND (created_at <= now()))
  ```
  Dev DB (0 dòng, seqscan off): planner chọn `leads_status_idx` (ước lượng 1 dòng) — bình thường với bảng rỗng, không phải lỗi index.
- `pnpm vitest run --project integration` cho `leads-remind-scan-index-migration`, `remind-unassigned-leads`, `leads-migration`, `leads-reminded-at-migration`: 10/10 PASS.
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test`: 2530 pass / 1 fail = fail sẵn đã biết `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (không liên quan) · `pnpm build` PASS (exit 0).
- `npx oxlint`: skip (repo không có oxlint config).
- Doc impact: `docs/ERD.md` §4.11 (ghi chú index, dòng as-built `code`/`phoneNormalized`) + §5 bảng Index (dòng mới `leads`); `docs/ARCHITECTURE.md` §5.4 dòng job `remind-unassigned-leads`. ERD §7 không liệt kê migration theo bảng → không sửa.
- Residual risk: chưa chạy migration trên staging/prod (bước deploy); EXPLAIN với seqscan bật trên dữ liệu thật chưa đo (bảng nhỏ thì planner vẫn seqscan — bình thường).

## Close-out (change-request)
- Review round 1: **STRICT PASS** — `.context/review-reports/feature-layer9-minor-export-reminder-phase-1-task-02-round-1-review.md`.
- MINOR-1 (runbook khi `leads` rất lớn): change-request thêm 1 dòng comment trong migration (tạo tay `CREATE INDEX CONCURRENTLY` cùng tên/cột trước deploy → câu `IF NOT EXISTS` thành no-op). Chỉ comment, không đổi SQL.
- MINOR-2 (`SET enable_seqscan = off` không reset trên DB tạm sẽ bị xoá): không sửa — vô hại hiện tại.
- MINOR-3 (plan có Sort sau index scan): chấp nhận, chỉ sắp các lead đến hạn.
- Doc impact: `docs/ERD.md` §4.11 + §5, `docs/ARCHITECTURE.md` §5.4 (as-built). API: no doc impact.
- Acceptance: [x] migration CREATE INDEX additive + down DROP · [x] apply dev DB (batch 28) + test up/down/up · [x] EXPLAIN dùng index · [x] lint/typecheck/test/build PASS.
