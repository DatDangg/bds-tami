Agent: reviewer

# Review: build/tami-website · layer-9-task-06 (job `data-retention`), round 2

- **Review level:** STRICT
- **Reason:** job xoá/ẩn danh dữ liệu hàng loạt không hoàn tác được, xoá object S3 (PII), migration enum, đổi access của collection `private-files`, registry khoá advisory dùng chung (last-admin, redirect slug, remind, retention), sửa job `remind-unassigned-leads` đã commit.
- **Blast radius:** `src/lib/retention/*` (mới), `src/lib/db/advisory-lock*.ts` (mới, dùng chung), `src/jobs/data-retention.ts`, `src/jobs/remind-unassigned-leads.ts`, `src/hooks/create-slug-redirect.ts`, `src/hooks/staff/last-admin-guard.ts`, `src/collections/PrivateFiles.ts` (access create/update), `src/collections/JobApplications.ts` (validate email), `src/lib/audit/actions.ts` + enum `audit_logs.action`, migration `20261018_130000_data_retention`, `src/payload-types.ts`, docs ERD/ARCHITECTURE/PERMISSION. Dữ liệu: `leads`, `lead-activities`, `job-applications`, `private-files` + bucket private, `audit-logs`, `payload_jobs(_log)`. Client: endpoint nộp CV công khai, endpoint tải CV admin, admin UI `private-files`.
- **Scope:** diff chưa commit trên HEAD c0f20ce, checkout `D:\prj\bds`; bỏ qua `.claude/launch.json`, `.context/`. Không đụng `D:\prj\bds-wt9-t05`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | **203/203 file, 2.143/2.143 test PASS** (integration chạy với DB + SeaweedFS thật, lần này không flaky nên không cần chạy riêng) |
| `pnpm build` | PASS (exit 0); `git status` sau build không đổi file tracked |

Không chạy job trên DB dev ngoài test, không chạy `pnpm payload migrate`.

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS). Đổi access `private-files` chỉ ẩn nút tạo trong admin, không đổi layout.

## Skill gates
- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, oxlint chưa cấu hình (repo dùng eslint, PASS)
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK. 0–1 indicator: `remindDueLeads` đã tách còn khoảng 13 dòng; `processDueRecords` khoảng 30 dòng; hằng số nằm trong `retention-config.ts`/registry; docs ERD/ARCH đã cập nhật luồng.
- ai-friendly-web: N/A (job nội bộ)
- blitzstrike: skip, không có môi trường pentest; không thêm bề mặt API công khai (chỉ thu hẹp quyền)

## Đối chiếu quyết định user (Q1–Q5) và finding round 1

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Q1 / C1: `private-files` chỉ CV, khoá upload | **Đóng** | `PrivateFiles.ts:24-25` `create`/`update: denyAll`; endpoint nộp CV `src/endpoints/public/job-applications.ts:112-123` tạo bằng Local API `overrideAccess: true` nên không bị chặn; tải CV `private-file-download.ts:64-68` dùng `overrideAccess`; xoá hồ sơ `delete-cv-and-audit.ts:14-18` dùng `overrideAccess`; `delete: isAdmin` giữ nguyên. Test `media-upload.test.ts` mới: admin POST 403 (đếm không đổi), PATCH 403. Full suite PASS gồm cả test nộp CV/tải CV. ERD §4.12, ARCH, PERMISSION cập nhật. |
| M1: lỗi S3 không còn bị nuốt | **Đóng** | `delete-private-file.ts:15-33`: `DeleteObjectCommand` tường minh, ném lỗi TRƯỚC khi `payload.delete` dòng. Key = `filename` đúng vì plugin private không có `prefix` (`payload.config.ts:118-123`). Test `data-retention.test.ts:109-114` mock `S3Client.prototype.send` reject cho mọi `DeleteObjectCommand` (cả client job lẫn adapter plugin), test `:347-385` xác nhận hồ sơ không ẩn danh, dòng + object còn, lần sau xoá được. |
| M2: trùng khoá 726002 | **Đóng** | `src/lib/db/advisory-lock-keys.ts` registry 726001–726004; `create-slug-redirect.ts`, `last-admin-guard.ts`, `remind-unassigned-leads.ts` dùng registry; có test unit `advisory-lock-keys.test.ts`. Remind giữ khoá rồi mới chọn lead, test chạy chồng ×3 PASS. |
| Q2: ẩn danh lead mở rộng | **Đúng, đủ** | `anonymize-leads.ts:71-90`: NULL `email/message/ipHash/userAgent/pageUrl`, `referrer` chỉ origin, placeholder `fullName/phone`; `note`/`call` content = placeholder qua `asSystemActivity` + `overrideAccess` cùng transaction. Giữ `status/source/mốc/mergedCount/utm` và activity khác. Update activity không đẩy `lastActivityAt` (`lead-activity-hooks.ts:72` chỉ `operation === "create"`). Test `:407-435`. |
| Q3: hồ sơ bất kể trạng thái | **Đúng** | `purge-applications.ts:9-11` không lọc `status`. |
| Q4: lead mở vẫn ẩn danh | **Đúng** | `anonymize-leads.ts:10-18` không lọc `status`. |
| Q5: xoá audit > 24 tháng; down không xoá audit `system.data_retention` | **Đúng** | `purge-logs` giữ xoá 24 tháng; migration `down` (`:12-27`) chỉ xoá `payload_jobs(_log)` của task, không đụng `audit_logs`, giữ enum audit. Task file + ERD ghi rõ. |
| MINOR-1 tally | **Đóng** | `RetentionTally` cộng trong `processOne` sau commit; audit ghi cả khi bước lỗi (`run-data-retention.ts:45-50`); test `:387-405`. |
| MINOR-2 poison record | **Đóng** | `drain-batches.ts:59-89`: lỗi → log id + `errorName` (không PII), loại id khỏi lô sau, dừng ở 20 lỗi, cuối bước throw. |
| MINOR-4 hàm dài | **Đóng** | `remind-unassigned-leads.ts` tách 4 hàm. |
| MINOR-5 task file migration | **Đóng** | `tasks/tami-website/layer-9-task-06.md` mục Migration. |

## Phân tích các câu hỏi cụ thể

1. **DeleteObject xong rồi xoá dòng/commit lỗi (object mất, dòng `private-files` và con trỏ hồ sơ còn):** xử lý được ở lần sau. Transaction rollback nên hồ sơ còn `cv` + chưa `anonymizedAt`, dòng `private-files` còn. Lần sau `deletePrivateFile` `findByID` thấy dòng, `DeleteObject` trên key không còn trả thành công (S3 idempotent), xoá dòng, commit. Plugin `afterDelete` xoá lần nữa cũng vô hại. Trong khoảng giữa, admin tải CV sẽ lỗi (object mất), chấp nhận được với dữ liệu đã quá hạn. Còn thiếu test cho đúng kịch bản này: test `:437-445` mô phỏng trường hợp khác (cả dòng lẫn object đã mất). Xem MINOR-2.
2. **Khoá băm SĐT `create-or-merge.ts` va chạm 726001–726004:** `dedupeLockKey` (`src/lib/leads/dedupe.ts:45-48`) lấy 64 bit đầu SHA-256. Xác suất một khoá trùng một trong 4 id cố định khoảng 4/2^64 cho mỗi khoá. Với 10^6 tổ hợp SĐT thì khoảng 2·10^-13. Hậu quả nếu trùng chỉ là chờ khoá tạm thời: mỗi transaction chỉ giữ một khoá advisory nên không tạo chu trình. Dạng hai khoá `(namespace, key)` không bắt buộc. Không tính là defect.
3. **`referrer` origin còn PII không:** origin bỏ path/query/fragment/userinfo (`new URL().origin` không chứa `user:pass@`). Phần host vẫn có thể nhận diện trong ca hiếm (blog cá nhân `nguyenvana.blogspot.com`, hoặc giá trị referrer do client tự đặt). Việc này đúng phạm vi user đã duyệt ở Q2 ("query của referrer"), nên chỉ ghi MINOR-3 kèm gợi ý.
4. **Bỏ qua bản ghi lỗi có gây vòng lặp vô hạn hoặc ẩn lỗi mãi không:** không có vòng lặp vô hạn. Vòng lô bị chặn bởi `RETENTION_MAX_BATCHES_PER_STEP`; `processOne` trả `false` chỉ khi bản ghi không còn khớp điều kiện (nên không quay lại); lô toàn `false` thì dừng. Lỗi cũng không bị ẩn: bước lỗi thì job ném (Payload retry 3 lần), mỗi tuần ghi log error kèm id. Tuy nhiên audit `meta` không có số bản ghi lỗi, và job lỗi của chính `data-retention` bị bước `purge-failed-jobs` xoá sau 7 ngày, nên vết bền vững chỉ còn trong log. Xem MINOR-4.
5. **`denyAll` có phá luồng nào không:** không. Mọi đường ghi `private-files` trong code đều qua Local API `overrideAccess` (endpoint nộp CV, rollback CV khi tạo hồ sơ lỗi, hook xoá hồ sơ, retention). Admin vẫn đọc, xoá, tải được. Full suite PASS.

## Findings

Không còn CRITICAL/MAJOR.

### [MINOR]
1. **Test bị nới lỏng:** `tests/integration/media-upload.test.ts:496` đổi `/^[0-9a-f-]{36}\.pdf$/` thành `/^[0-9a-f-]{36}.pdf$/`, mất `\.` nên `.` khớp ký tự bất kỳ. Fix: trả lại `\.pdf`.
2. **Thiếu test cho kịch bản "object đã xoá, commit lỗi"** (dòng `private-files` + con trỏ hồ sơ còn, object mất). Code xử lý đúng theo phân tích trên, nhưng chưa có test chứng minh. Fix: test xoá object bằng `DeleteObjectCommand` trực tiếp (giữ dòng + con trỏ), chạy job, rồi kỳ vọng hồ sơ ẩn danh, dòng mất, `cvFilesDeleted: 1`.
3. **Key S3 giả định không có prefix:** `delete-private-file.ts:27-28` dùng `filename` làm key. Nếu sau này cấu hình `prefix` cho plugin private, `DeleteObject` trên key sai vẫn "thành công" (idempotent), object PII lại mồ côi mà không ai biết. Fix: ghép key từ `file.prefix` nếu có, hoặc `HeadObject` xác nhận sau khi xoá, hoặc thêm test khẳng định cấu hình private không có `prefix`. Kèm theo đó, referrer (Q2) có thể chỉ giữ domain đăng ký (eTLD+1) hoặc map sang kênh (`google`/`facebook`/…) để bỏ subdomain cá nhân. Đây là gợi ý, user đã chấp nhận mức origin.
4. **Audit không ghi số bản ghi/bước lỗi:** `run-data-retention.ts:59-66`, `meta` chỉ có số thành công. Fix: thêm `failedSteps` (tên bước) / `failedRecords` (số lượng, không id) vào meta để vết lỗi bền hơn log (job lỗi tự bị xoá sau 7 ngày).

### Ngoài scope (xác nhận, đề xuất task riêng)
- **`src/hooks/job-applications/delete-cv-and-audit.ts:8,14-22`**: comment ghi "lỗi thì rollback cả hai" là sai. Hook dựa vào `payload.delete` của `private-files` để plugin `afterDelete` xoá object, mà plugin 3.91.0 nuốt lỗi S3 (chỉ log). Khi admin xoá hồ sơ lúc S3 lỗi: dòng hồ sơ + dòng `private-files` xoá, commit, `result.errors` rỗng, nhưng **object CV (PII) mồ côi vĩnh viễn trong bucket private**. Bước dọn CV mồ côi duyệt theo bảng DB nên không bao giờ tìm lại được.
- Cùng giả định ở `src/endpoints/public/job-applications.ts:128-133` (`removeOrphanCv` khi tạo hồ sơ lỗi), và khi admin xoá thẳng một `private-files` trong admin (`delete: isAdmin`).
- Hướng fix đề xuất: tập trung một `beforeDelete` hook trên `PrivateFiles` gọi `DeleteObjectCommand` tường minh và ném lỗi (tái dùng phần xoá object của `deletePrivateFile`). Khi đó mọi đường xoá (hook hồ sơ, endpoint, admin UI, retention) đều rollback được khi S3 lỗi. Tuỳ chọn thêm: job đối soát bucket (ListObjects so với DB) để vét object mồ côi đã có. Kèm test mock `S3Client.prototype.send` reject cho luồng xoá hồ sơ trong admin.

## Verdict
**PASS**: C1, M1, M2 đã đóng thật; Q1–Q5 thực hiện đúng và đủ; lint/typecheck/test (203 file, 2.143 test)/build PASS. Còn 4 MINOR không chặn, và 1 mục ngoài scope cần chuyển thành task riêng.

## Residual risk
- Hành vi idempotent của `DeleteObject` trên key không tồn tại được suy ra từ S3 API và SeaweedFS, chưa có test riêng (MINOR-2).
- Chưa chạy migration trên DB dev (đúng yêu cầu). Test up→down→down→up chạy trong DB tạm và PASS trong full suite.
- Không có môi trường để chạy job thật trên dữ liệu lớn: trần 50 lô × 100 bản ghi/bước/lần chạy, phần dư dọn ở tuần sau.
