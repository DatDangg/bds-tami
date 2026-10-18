Agent: reviewer

# Review: feature-rentals-reindex-background-job, phase-1-task-01, round 1

- **Review level:** STRICT
- **Reason:** DB migration (enum Payload Jobs), job/cron mới, hook chạy trong transaction lưu admin, field ảo đọc `payload-jobs` gắn vào 3 collection công khai (provinces/wards/projects).
- **Blast radius:** `src/lib/search/reindex-in-hook.ts` (hook afterChange của provinces/wards/projects), `src/jobs/index.ts` (jobsConfig chung, process `jobs`), enum `enum_payload_jobs_task_slug` / `enum_payload_jobs_log_task_slug`, mọi lần đọc provinces/wards/projects (REST/GraphQL/Local API, list admin, populate relation từ rentals) do field ảo `searchReindexPending` + afterRead, form admin của 3 collection (importMap), `payload-types.ts`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 236/237 file, 2506/2507 test PASS. 1 fail có sẵn, không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" |
| `pnpm vitest run --project integration tests/integration/rentals-reindex-job.test.ts tests/integration/rentals-reindex-job-migration.test.ts tests/integration/translate-content-migration.test.ts` | PASS 3 file / 5 test |
| `pnpm build` | PASS (exit 0) |
| `git diff --no-index` snapshot `20261018_140000_translate_content.json` → `20261018_203017_rentals_reindex_job.json` | Chỉ thêm `reindex-rentals-search` vào 2 enum + đổi `id`; `tables` không đổi, không có cột cho field ảo |

## Kiểm theo trọng tâm

1. **Migration:** up chỉ có `ALTER TYPE ... ADD VALUE IF NOT EXISTS` cho 2 enum của hàng đợi. Down xoá log/job của task này rồi dựng lại enum với danh sách cũ, có `translate-content`, khớp snapshot trước. Không đụng bảng nội dung, không backfill → **không phải HIGH_RISK_MIGRATION**. Down có xoá dòng hàng đợi của task này; đó là hàng đợi nên chấp nhận được (theo đúng mẫu translate_content). Integration chạy up/down/up PASS.
2. **Xếp job trong transaction:** dùng `req` gốc, nên job chỉ hiện sau khi commit và rollback thì không còn job (integration chứng minh: kết nối khác đếm 0 trước commit, 1 sau commit). Idempotent theo `input.scope`/`input.id`, bỏ qua job processing/hasError. Đánh đổi "xếp job lỗi thì hỏng cả lần lưu" đã ghi Decision log + ARCHITECTURE; vì migration deploy cùng code nên chấp nhận được. Hai lần lưu song song có thể tạo 2 job (find-then-insert không khoá), nhưng vô hại vì job idempotent.
3. **Job:** theo lô (`reindexRentalSearchText`), idempotent, retries 3 lần backoff mũ, zod sai → `JobCancelledError` (integration: input `city` → has_error, không treo). Log chỉ jobId/scope/id/số lượng/errorName, không lộ dữ liệu cá nhân. `req` của runner bị tách `transactionID` (`runJobs/index.js:250` `isolateObjectProperty(req,'transactionID')`), nên không nằm trong transaction lưu admin.
4. **Field ảo:** `virtual: true`, không có cột DB. Access read chỉ admin active; create/update `denyAll`. afterRead trả `undefined` khi không phải admin nên khách/sale không tốn truy vấn và response công khai không có giá trị (JSON bỏ `undefined`). Admin: 1 truy vấn `payload-jobs` cho mỗi scope trong mỗi request, nhớ trong `req.context`, nên list không bị N+1. `defaultColumns` của cả 3 collection đã khai báo nên field không lọt thành cột list.
5. **Component:** `role="status"`, chỉ đọc, không render khi `value !== true`.
6. **payload-types/importMap:** chỉ chứa đúng phần sinh cho task/field/component mới. `migrations/index.ts` thêm entry mới (thêm dấu phẩy ở entry trước, vô hại).
7. **translate-content-migration.test.ts:** bỏ assertion giòn "là migration cuối". Hợp lý; `toBeDefined` vẫn giữ.

## Responsive Checklist Gate

Diff chỉ đụng UI admin Payload: thêm 1 đoạn `<p>` cảnh báo inline trong form, không có layout/grid/media/nav/table/animation.
- Layout (không tràn ngang / mobile-first / grid / container px): **N/A**. Đoạn văn inline trong cột form của Payload, không có width cố định nên tự xuống dòng.
- Typography/Spacing: **OK**. Dùng class `field-description` của Payload, không có font-size px riêng.
- Media: **N/A** (không có ảnh hay video).
- Touch/Interaction: **N/A** (không có phần tử tương tác).
- Viewport/A11y: **OK**. Không dùng `100vh`, không animation (nên không cần xét reduced-motion), không dùng `overflow:hidden`.
- Residual: chưa xem bằng browser ở 375/768/1280. Theo CSS math thì không có nguy cơ tràn.

## Skill gates

- aislop: **skip**, `aislop: command not found`.
- oxlint (anti-slop): **skip**, repo chưa cấu hình oxlint (eslint PASS).
- ocr (open-code-review): **skip**, ocr chưa cài.
- AI-readable: **OK**. Tên rõ, hàm ngắn (< 50 dòng), indirection ≤ 2 bước, ARCHITECTURE đã cập nhật. Có 1 magic number "500" trong text của component (MINOR-1). Tổng 1 indicator, dưới ngưỡng 3.
- ai-friendly-web: **N/A** (thay đổi chỉ ở admin nội bộ).
- blitzstrike: **skip**, không có môi trường pentest; field read chỉ admin đã kiểm qua code + integration.

## Findings

### [MAJOR-1] Cảnh báo KHÔNG hiện ngay sau lần lưu xếp job, trái với Acceptance "Admin thấy cảnh báo khi reindex được xếp chạy nền" và với khẳng định trong Decision log
- `src/fields/search-reindex-pending.ts:34-42` + `src/lib/search/reindex-in-hook.ts:57-59` + hooks `src/hooks/{provinces,wards,projects}/reindex-rentals.ts`.
- Bằng chứng trong Payload 3.91:
  - `node_modules/payload/dist/collections/operations/utilities/update.js`: thứ tự chạy là `afterRead - Fields` (dòng 339), rồi `afterChange - Fields` (371), rồi `afterChange - Collection` (384). Như vậy afterRead của `searchReindexPending` chạy **trước** hook afterChange gọi `queueReindexJob`, nên doc trả về của lần lưu có `searchReindexPending = false`.
  - `node_modules/@payloadcms/ui/dist/views/Edit/index.js:250,302-305`: sau khi lưu, form dựng lại state bằng `getFormState({ data: document })`, với `document = json.doc` là doc của response vừa lưu, không đọc lại từ DB. Vì vậy ngay sau khi lưu, form tỉnh/phường/dự án **không hiện cảnh báo**. Admin chỉ thấy khi tải lại trang hoặc mở lại form, đúng lúc họ cần thông báo nhất thì lại không có.
  - Decision log ghi "form reload sau lưu đã hiện cảnh báo ngay". Điều này không đúng với code Payload. Integration test chỉ kiểm bằng `findByID` riêng sau commit, nên không bắt được lỗi này.
- **Fix đề xuất:** khi `reindexRentalsFromHook` trả `"queued"`, 3 hook afterChange trả về `{ ...doc, searchReindexPending: true }`. Chỉ làm vậy khi `req.user?.role === admin`, để giữ đúng access, vì response update lấy kết quả của collection afterChange. Thêm unit test cho từng hook (outcome `queued` → doc trả về có cờ true; ≤ 500 → không đổi). Sửa lại câu trong Decision log.

### [MINOR-1] Magic number trong text cảnh báo
- `src/components/admin/SearchReindexPendingWarning.tsx:14`: "Có hơn 500 tin…" lặp lại `SYNC_REINDEX_LIMIT` (`reindex-in-hook.ts`). Đổi ngưỡng thì text sai. Đề xuất: tách hằng số sang module không phụ thuộc server (vd `reindex-job-input.ts`) rồi import vào cả hai chỗ, hoặc bỏ con số khỏi câu.

### [MINOR-2] Cảnh báo tắt khi job lỗi cuối hoặc treo `processing` vô hạn
- `src/fields/search-reindex-pending.ts:16`. Job lỗi cuối (`hasError`) thì cảnh báo biến mất, admin tưởng đã xong trong khi searchText vẫn cũ. Ngược lại, job kẹt `processing` (runner chết giữa chừng) thì cảnh báo hiện mãi. Builder đã ghi ở Residual risk. Đề xuất (task sau): hiện trạng thái "dựng lại thất bại — chạy `pnpm reindex:rentals-search`" khi `hasError`.

### [MINOR-3] Kiểm role không đồng nhất
- `src/fields/search-reindex-pending.ts:37` chỉ kiểm `role === admin`, trong khi access read (dòng 6) kiểm thêm `active === true`. Admin inactive không đăng nhập được nên tác động thực tế gần như bằng 0. Đề xuất: dùng chung một predicate.

## Verdict

**FAIL**, vì còn 1 MAJOR (MAJOR-1: Acceptance "admin thấy cảnh báo khi reindex được xếp chạy nền" không đạt ngay sau lần lưu; Decision log ghi sai hành vi). Migration, job, transaction và access đều đạt. Builder chỉ cần sửa MAJOR-1 (các MINOR tuỳ chọn), rồi review round 2.
