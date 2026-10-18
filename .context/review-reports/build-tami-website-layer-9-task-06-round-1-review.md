Agent: reviewer

# Review: build/tami-website · layer-9-task-06 (job `data-retention`), round 1

- **Review level:** STRICT
- **Reason:** job xoá/ẩn danh dữ liệu hàng loạt (không hoàn tác được), xoá object S3, migration enum (`down` xoá dữ liệu), advisory lock dùng chung, sửa job `remind-unassigned-leads` đã commit.
- **Blast radius:** `src/jobs/data-retention.ts`, `src/lib/retention/*`, `src/lib/db/advisory-lock.ts` (helper dùng chung mới), `src/jobs/remind-unassigned-leads.ts`, `src/collections/JobApplications.ts` (validate email), `src/lib/audit/actions.ts` + enum `audit_logs.action`, migration `20261018_130000_data_retention`, `src/payload-types.ts`, `docs/ERD.md` §4.11/§7, `docs/ARCHITECTURE.md`. Dữ liệu: `leads`, `job-applications`, `private-files` + bucket private, `audit-logs`, `payload_jobs(_log)`.
- **Scope:** diff chưa commit trên HEAD c0f20ce; đã bỏ qua `.claude/launch.json`, `.context/`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS |
| `pnpm test` (toàn bộ) | 200/202 file PASS, 1 test FAIL ở `tests/integration/private-file-download.test.ts:178` (404, không phải 200) + 1 file lỗi `beforeAll`. Cả hai nằm ngoài diff, khớp với việc Postgres/S3 dev dùng chung hay chập chờn |
| `pnpm test` riêng 6 file/thư mục (`data-retention*.test.ts`, `remind-unassigned-leads.test.ts`, `private-file-download.test.ts`, `src/jobs/data-retention.test.ts`, `src/lib/retention`) | 6/6 file, 33/33 test PASS (integration chạy với DB + S3 thật) |
| `pnpm build` | PASS |

Tôi không chạy job trên DB dev ngoài test, và không chạy `pnpm payload migrate`.

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint (dùng eslint, PASS)
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK (1 indicator: `remindDueLeads` khoảng 65 dòng, quá 50; xem MINOR-4). Ít hơn 3 indicator.
- ai-friendly-web: N/A (job nội bộ)
- blitzstrike: skip, không có môi trường pentest; task không có bề mặt API công khai mới

## Findings

### [CRITICAL] C1: Dọn "CV mồ côi" xoá luôn file nội bộ admin tự upload
- `src/lib/retention/purge-orphan-cvs.ts:13-21,27-28,41-46`
- Code giả định "`private-files` chỉ chứa CV". Giả định này trái với thiết kế:
  - `src/collections/PrivateFiles.ts:12` ghi "CV ứng viên **và file nội bộ**".
  - `access.create: isAdmin` (`PrivateFiles.ts:22`), và collection hiện trong admin cho admin (`:19`), nên admin upload thẳng được.
  - `docs/ERD.md:107` và `:510` cũng ghi "CV và file nội bộ".
- Hậu quả: mọi file admin upload vào `private-files` mà không gắn hồ sơ ứng tuyển sẽ bị job **xoá vĩnh viễn (cả dòng DB lẫn object S3) sau 24 giờ**, không cảnh báo. Đây là mất dữ liệu nghiệp vụ không hoàn tác được.
- Cách fix (cần user chọn hướng, xem "Cần user quyết" Q1):
  - (a) Thêm trường phân loại, vd `kind: 'cv' | 'internal'`, chỉ hệ thống ghi được. Endpoint công khai `src/endpoints/public/job-applications.ts:113` đặt `kind='cv'`. Job chỉ dọn `kind='cv'`. Cần migration (thêm cột, default `internal` cho dòng cũ, hoặc backfill `cv` cho dòng đang được hồ sơ trỏ tới).
  - (b) Nếu chốt `private-files` chỉ dành cho CV: đổi `create: denyAll` (chỉ Local API) + ẩn khỏi admin, sửa `PrivateFiles.ts:12` và ERD §4.12. Việc đổi intent này phải đi qua user.
- Bổ sung test integration: file `private-files` do admin tạo, cũ hơn 24 giờ, phải còn nguyên sau khi job chạy.

### [MAJOR] M1: "Lỗi S3 thì rollback" là sai: plugin nuốt lỗi xoá S3, nên object chứa PII bị bỏ lại vĩnh viễn
- `src/lib/retention/purge-applications.ts:22-24,49-52`; `purge-orphan-cvs.ts:26,44-45`; `docs/ERD.md:634` (as-built ghi "lỗi S3 rollback cả ẩn danh").
- Bằng chứng: `node_modules/.pnpm/@payloadcms+plugin-cloud-storage@3.91.0…/dist/hooks/afterDelete.js` bọc `adapter.handleDelete` trong `try { … } catch (err) { req.payload.logger.error(...) }` rồi `return doc`. Nghĩa là lỗi S3 **không ném ra**:
  - `payload.delete` vẫn thành công, `deletion.errors` rỗng, transaction commit.
  - Hồ sơ đã ẩn danh và `cv = null`, dòng `private-files` đã xoá, nhưng **object CV (PII) vẫn nằm trong bucket private và không còn dòng nào trỏ tới**. Lần chạy sau không bao giờ tìm lại được, kể cả bước dọn mồ côi (bước này duyệt theo bảng DB).
  - Kết quả: vi phạm đúng mục tiêu BR-31/LGL-03, còn output/audit vẫn báo `cvFilesDeleted` như đã xoá.
- Test tạo niềm tin giả: `tests/integration/data-retention.test.ts:338-359` mock cả `payload.delete` reject, chứ không mock lỗi ở tầng S3 adapter, nên không bao giờ chạm đường nuốt lỗi thật.
- Cách fix:
  - Xoá object S3 tường minh và ném lỗi khi thất bại, TRƯỚC khi xoá dòng `private-files`. Ví dụ: `DeleteObjectCommand` với key `prefix/filename` (+ `sizes`) trong cùng transaction, rồi xoá dòng bằng `payload.db.deleteOne`. Một cách khác: sau `payload.delete`, gọi `HeadObject` để xác nhận object đã mất, còn thì `throw` để rollback.
  - Viết test mock lỗi ở S3 client/adapter (`handleDelete` reject): hồ sơ phải giữ nguyên, object còn, job báo lỗi.
  - Sửa ERD §7 cho đúng as-built.
  - Ghi chú: `src/hooks/job-applications/delete-cv-and-audit.ts:8` có cùng giả định sai. Phần đó nằm ngoài scope task này, đề xuất task riêng.

### [MAJOR] M2: Trùng id khoá advisory 726002 giữa `remind-unassigned-leads` và hook redirect slug
- `src/jobs/remind-unassigned-leads.ts:23-24` (`REMIND_LOCK_KEY = 726_002`) trùng với `src/hooks/create-slug-redirect.ts:21` (`REDIRECT_WRITE_LOCK_KEY = 726_002`, có từ trước).
- Comment `retention-config.ts:17`, `remind-unassigned-leads.ts:23` và `docs/ERD.md`/`ARCHITECTURE.md` đều khẳng định 726002 dành riêng cho job nhắc. Điều đó sai.
- Hậu quả:
  - Mỗi lần job nhắc chạy (10 phút/lần trong giờ làm, giữ khoá suốt transaction gồm cả update lead, activity, xếp email), admin lưu bài có đổi slug bị chặn chờ, và ngược lại.
  - Hai nghiệp vụ không liên quan bị buộc chặt. Hiện chưa thấy chu trình deadlock (redirect không đụng `leads`, remind không đụng `redirects`), nhưng bất biến "mỗi khoá một id" đã bị phá, và document ghi sai.
- Cách fix:
  - Đổi khoá nhắc sang id chưa dùng, vd `726_004`.
  - Gom mọi id vào một registry, vd `src/lib/db/advisory-lock-keys.ts`, cho cả `last-admin-guard`, `create-slug-redirect`, `remind`, `data-retention`.
  - Tốt hơn nữa: dùng dạng hai khoá `pg_advisory_xact_lock(namespace, key)` để tách khỏi khoá băm SĐT của `src/lib/leads/create-or-merge.ts:32` (khoá đó dùng một số bigint, có xác suất cực nhỏ trùng 72600x).
  - Thêm test unit kiểm các id khoá đôi một khác nhau.

### [MINOR]
1. **Audit đếm thiếu khi có bước lỗi giữa chừng.** `src/lib/retention/run-data-retention.ts:58-62,73`. `purgeExpiredApplications` commit từng hồ sơ một. Nếu ném lỗi ở hồ sơ thứ N, N−1 hồ sơ/CV đã xoá thật nhưng `outcome.applicationsAnonymized/cvFilesDeleted` vẫn là 0 (chỉ gán khi hàm return), nên audit `system.data_retention` và log ghi thiếu. Cách fix: truyền một bộ đếm (mutable outcome) vào từng bước, hoặc bắt lỗi trong vòng lặp rồi ném lại sau khi đã ghi số. Áp dụng tương tự cho orphan/leads.
2. **Bản ghi độc (poison record) chặn cả bước mãi mãi.** `anonymize-leads.ts:43-53` (rollback cả lô) và `purge-applications.ts:81-87`: một bản ghi update lỗi, vd dữ liệu cũ không qua validate hiện hành, sẽ luôn đứng đầu lô (sắp theo `createdAt`). Hậu quả là mọi lần chạy đều hỏng ở cùng chỗ, các bản ghi sau không bao giờ được ẩn danh. Cách fix: bỏ qua bản ghi lỗi (ghi lại id hoặc số lượng, không ghi PII), xử lý tiếp các bản ghi khác, cuối bước vẫn báo lỗi; hoặc update thẳng bằng `payload.db.updateOne` cho các trường PII.
3. **Migration `down` xoá audit trail.** `migrations/20261018_130000_data_retention.ts:18` xoá dòng `audit_logs` có action `system.data_retention`, tức mất vết của các lần xoá dữ liệu hàng loạt. Phần `up` là additive (an toàn). Phần `down` là destructive, nên gắn `HIGH_RISK_MIGRATION` cho rollback, hoặc đổi thành giữ dòng (vd chuyển action sang một giá trị cũ kèm `meta.originalAction`). Cần user quyết (Q5).
4. **`remindDueLeads` khoảng 65 dòng**, quá giới hạn 50 dòng/hàm (`src/jobs/remind-unassigned-leads.ts`, từ khoảng dòng 54). Có thể tách phần "đánh dấu + activity" và "xếp email". Hàm gốc vốn đã dài, builder đã làm nó ngắn hơn.
5. **Lệch task file.** Task ghi "Không đụng schema (không tạo migration)", nhưng thực tế bắt buộc phải có migration (thêm giá trị enum task slug/audit action). Hợp lệ, nhưng cần ghi lệch này vào task file / Doc Impact khi close-out.
6. **Xoá file trước khi commit (đã ghi nhận).** `purge-applications.ts:23-24`: object bị xoá trước commit, nếu commit lỗi thì hồ sơ còn trỏ tới CV không còn file. Builder đã ghi nhận và có test (`data-retention.test.ts:361`). Chấp nhận được với dữ liệu đã quá hạn; chỉ để lưu ý.

### Đã kiểm, không có lỗi
- **Cron:** `0 0 20 * * 6` (6 trường, giây đầu) = thứ 7 20:00 UTC = **Chủ nhật 03:00 giờ VN (UTC+7)**. Đúng.
- **`monthsBefore`:** kẹp ngày cuối tháng đúng, có test unit.
- **Mốc lead:** `lastActivityAt` ưu tiên, thiếu thì `createdAt`. Khớp BRD BR-31 ("kể từ lần tương tác cuối") và ERD §7 dòng 623. `lastActivityAt` được đẩy bởi activity + đổi status (`lead-activity-hooks.ts:68-77`, `status-activity.ts:13-17`). Có xử lý cả lead xoá mềm (`trash: true`).
- **Trường lead bị ẩn danh:** khớp AC + ERD §7 (fullName/phone/phoneNormalized/email/message). Giữ số liệu.
- **Hồ sơ ứng tuyển:** đặt `cv=null` + `anonymizedAt` trước, rồi xoá `private-files`. Theo id, không bulk delete (đúng follow-up L5-T04). Dùng placeholder cho cột NOT NULL (G23). Validate email bỏ qua khi đã ẩn danh. `job-applications` không bật trash/versions nên không sót PII trong bảng phụ.
- **Advisory lock:** dùng `pg_advisory_xact_lock` theo transaction của chính `req`, tự nhả khi commit/rollback. Fail-closed khi không có transaction. Mỗi job chỉ giữ một khoá, không lồng 726002/726003, nên không có chu trình khoá advisory. Có test chạy chồng ×3 PASS cho cả hai job.
- **Dọn log:** `audit-logs` 24 tháng khớp ERD §7. Job lỗi > 7 ngày (`hasError`, `processing=false`) khớp follow-up L1-T07. Không đụng `click-events` (job `aggregate-click-stats` đã xoá) và không đụng nội dung.
- **dryRun:** chỉ đếm, không ghi audit, có test integration.

## Cần user quyết (spec mơ hồ / A4)
- **Q1 (chặn C1):** `private-files` có lưu "file nội bộ" do admin upload không? Có thì cần trường phân loại + migration. Không thì khoá upload ở admin và sửa ERD/collection doc.
- **Q2:** Khi ẩn danh lead (BR-31/PDPL), có cần xoá/ẩn danh thêm không:
  - `lead-activities.content` loại `note`/`call` (sale gõ tự do, dễ có tên/SĐT);
  - `ipHash`, `userAgent`, `pageUrl` (URL có thể chứa query/UTM nhận diện được) của lead?

  Hiện ERD §7 chỉ liệt kê họ tên/SĐT/email/lời nhắn, nên code đúng spec hiện hành.
- **Q3:** Hồ sơ ứng tuyển đang ở trạng thái xử lý hoặc đã tuyển (`status`) quá 12 tháng từ `createdAt` vẫn bị ẩn danh và xoá CV. Spec không phân biệt status. Có cần loại trừ (vd hồ sơ đã tuyển, hoặc đổi mốc sang lần cập nhật cuối) không?
- **Q4:** Lead còn mở (`new`/`contacted`) nhưng không tương tác 24 tháng vẫn bị ẩn danh. Khớp BR-31, chỉ cần user xác nhận.
- **Q5:** Xoá `audit-logs` > 24 tháng (ERD §7) có trái nghĩa vụ lưu vết nào không (BRD không nêu)? Và `down` migration xoá audit `system.data_retention` có chấp nhận được không?

## Verdict
**FAIL**: 1 CRITICAL (C1) + 2 MAJOR (M1, M2). Không commit. Trả builder sửa C1 (sau khi user trả lời Q1), M1, M2, và nên sửa luôn MINOR-1/2.

## Residual risk
- Chưa xác minh được hành vi thật khi S3 lỗi trên môi trường (dựa vào source plugin 3.91.0).
- Chưa chạy migration trên DB dev (đúng yêu cầu). Test up→down→down→up PASS trong DB tạm.
- Hai lỗi ở full suite (`private-file-download`) được đánh giá là flaky do hạ tầng chung, vì chạy riêng thì PASS.
