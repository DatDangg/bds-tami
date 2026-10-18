Agent: reviewer

# Review — build-tami-website layer-10-task-05 (BL-008: xoá CV an toàn + quét object mồ côi) — round 1

- Worktree: `D:/prj/bds-wt10-t05` (branch `wt/l10-t05`, base `ef39df4`, chưa commit)
- Review level: **STRICT**
- Reason: xoá dữ liệu cá nhân (CV) trên S3, không hoàn tác được; hook `beforeDelete` dùng chung mọi đường xoá `private-files`; job nền (cron) xoá hàng loạt object; đổi output schema job + audit meta.
- Blast radius: `src/collections/PrivateFiles.ts` (hook mới) → mọi đường xoá `private-files` (admin xoá hồ sơ `delete-cv-and-audit.ts`, admin xoá file trực tiếp REST/UI, `removeOrphanCv` của endpoint nộp CV, job `data-retention` qua `deletePrivateFile`); `src/lib/private-objects/private-objects.ts` (S3 client mới, list/delete); `src/lib/retention/*` (bước mới `purge-orphan-objects`, tally `failedRecords`, audit meta); output job `data-retention` (`payload-types.ts`); **toàn bộ bucket private mà process trỏ tới** (quét mồ côi mặc định cả bucket); docs ERD/ARCHITECTURE.

## Verify commands + result

| Lệnh (trong worktree) | Kết quả |
|---|---|
| `pnpm lint` | PASS (eslint, không lỗi) |
| `pnpm typecheck` | PASS (`tsc --noEmit` sạch) |
| `pnpm build` | PASS (Next build xong, liệt kê route đầy đủ) |
| `pnpm test` | **KHÔNG chạy (cố ý)** — suite có test `tests/integration/data-retention.test.ts:466-477` gọi handler job không qua prefix test → quét + XOÁ object trên bucket private dùng chung (xem CRITICAL-1). Theo chỉ thị primary, chỉ đọc code. Bằng chứng test PASS dựa trên report builder (chưa kiểm chứng độc lập). |

## Responsive Checklist Gate

N/A — diff không đụng UI (route/component/CSS).

## Skill gates

- aislop: skip — không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed / không trong allow list.
- AI-readable: OK — tên rõ (`deleteObjectBeforeDelete`, `buildPrivateObjectKey`, `purgeOrphanObjects`), hàm < 50 dòng, file < 300 dòng (`purge-orphan-objects.ts` 55 dòng), không magic number mới (dùng hằng trong `retention-config.ts`), comment nêu WHY; docs ERD/ARCHITECTURE đã cập nhật. 0 indicator.
- ai-friendly-web: N/A (job/hook nội bộ, không public-facing).
- blitzstrike: skip — không có môi trường pentest được phép; task không phải auth/API public.

## Đánh giá theo các điểm primary yêu cầu

1. **Hook `beforeDelete` trong transaction, xoá object trước commit:** đúng thiết kế. Commit lỗi sau khi object đã xoá → dòng còn, object mất; lần sau `DeleteObject` idempotent nên hook chạy lại thành công và xoá được dòng (`delete-object-before-delete.ts:10-14`). Có test mô phỏng (`data-retention.test.ts` "object đã xoá rồi commit lỗi", xoá object tay rồi chạy job → `cvFilesDeleted: 1`). OK.
2. **Xoá đôi với `afterDelete` của plugin cloud-storage:** plugin vẫn gọi `DeleteObject` sau hook; S3/SeaweedFS trả 204 cho key không tồn tại (không có `NoSuchKey` cho DeleteObject), và plugin nuốt lỗi dù có. Vô hại. Các test "lần sau xoá được" đi qua cả hai lần xoá. OK.
3. **Bulk delete theo `where`:** Payload bắt lỗi từng doc vào `errors` (không ném); `deletePrivateFile` (`delete-private-file.ts:10-11`) và `deleteApplicationCv` (`delete-cv-and-audit.ts:20-22`) đều ném lại khi `errors` khác rỗng → rollback. Xoá theo id (admin REST, `removeOrphanCv`) ném thẳng. OK.
4. **Key prefix:** `buildPrivateObjectKey` (`private-objects.ts:16-19`) theo đúng quy tắc plugin (`prefix/filename`; không prefix → filename); quét đối chiếu so key đầy đủ dựng từ dòng DB (`purge-orphan-objects.ts:17-18`). Tên file CV là `randomUUID()` (`job-applications.ts:118`) nên không có race trùng tên giữa quét và upload mới. OK.
5. **Log/PII:** quét chỉ log `errorName` + tên bước (`purge-orphan-objects.ts:47`), không log key; hook không log; lỗi job chỉ nêu số lượng. OK.
6. **Audit meta:** thêm `orphanObjectsDeleted`, `failedRecords`, `failedSteps`; ghi cả khi chỉ có lỗi; `totalChanged` loại `failedRecords` (`run-data-retention.ts:24`). Có test. OK (đóng MINOR L9-T06 r2).
7. **Comment sai `delete-cv-and-audit.ts:8`:** đã sửa. OK.
8. **Docs:** ERD §4.10/§4.12/§7 và ARCHITECTURE bảng job khớp code. Thiếu ghi chú vận hành cho rủi ro quét cả bucket (xem MAJOR-1).

## Findings

### [CRITICAL-1] Test integration xoá object thật ngoài phạm vi test trên bucket dùng chung
- `tests/integration/data-retention.test.ts:474` — `handler({ input: {}, req })` chạy `runDataRetention` qua `src/jobs/data-retention.ts:30` **không có `orphanObjectScanPrefix`** → `purgeOrphanObjects` quét **cả bucket `private`** (`purge-orphan-objects.ts:29`, prefix mặc định `""`) với `now = new Date()` thật → xoá mọi object > 24 giờ không có dòng `private-files` **trong DB test `tami_wt10_t05`**. Bucket SeaweedFS local dùng chung với checkout chính và các worktree khác, nên CV dev/fixture của DB khác bị xoá vĩnh viễn (S3 không hoàn tác). Dry-run ở dòng 471 chỉ đếm, vô hại; dòng 474 là lần chạy thật.
- Chính comment ở dòng 46-49 của test ("không được xoá object không do test này tạo") bị test này vi phạm.
- Cách fix: handler test phải không chạm bucket thật — vd cho task đọc prefix/flag từ env (xem MAJOR-1) và test đặt env tắt quét/đặt prefix rỗng-dữ-liệu; hoặc spy `listPrivateObjectsPage` trả trang rỗng trong test này; hoặc gọi handler với dryRun only + test chuyển `dryRun=false` bằng spy `runDataRetention` (kiểm tham số) thay vì chạy thật. Bổ sung assertion/guard trong test setup: mọi lời gọi `listPrivateObjectsPage` với prefix rỗng → fail test.
- **Hệ quả đã có thể xảy ra:** nếu builder đã chạy `pnpm test` có S3 local, object > 24h không có dòng trong `tami_wt10_t05` đã bị xoá khỏi bucket `private` dùng chung. Primary cần báo user/kiểm tra (DB dev chính có dòng `private-files` trỏ object đã mất → tải CV 404).

### [MAJOR-1] Quét object mồ côi mặc định cả bucket, không có guard môi trường/sanity
- `src/lib/retention/purge-orphan-objects.ts:29` (`orphanObjectScanPrefix = ""`), `src/lib/retention/run-data-retention.ts:311`, `src/jobs/data-retention.ts` (không truyền prefix/flag).
- Bước này xoá dựa trên **vắng mặt** dòng DB. Bất kỳ khi nào DB và bucket lệch nhau thì nó xoá dữ liệu hợp lệ: (a) dev/worktree dùng chung SeaweedFS mà chạy job tay (`payload jobs:run`) hoặc test; (b) staging cấu hình nhầm `S3_BUCKET_PRIVATE`/endpoint trỏ bucket prod; (c) restore PITR DB về mốc cũ hơn bucket (`docs/runbooks/restore.md`) → mọi CV upload sau mốc DB bị xoá ở lần chạy Chủ nhật kế tiếp; (d) DB trỏ nhầm DB rỗng → xoá sạch bucket. Hiện không có lớp chặn nào.
- Cách fix (chọn tối thiểu một, khuyến nghị cả hai):
  1. Opt-in tường minh: env (vd `RETENTION_ORPHAN_OBJECT_SCAN=delete|dry-run|off`, mặc định `off` hoặc `dry-run`), chỉ đặt `delete` trong `docker-compose.staging.yml`/`docker-compose.prod.yml`; khai trong `env.ts`, `.env.example`, deploy runbook.
  2. Sanity cap: nếu số object mồ côi trong lần quét vượt ngưỡng (vd > N tuyệt đối hoặc > X% số key đã liệt kê) thì KHÔNG xoá, log cảnh báo + ghi `failedSteps` để admin xem — chặn kịch bản DB rỗng/nhầm DB/restore.
  - Ghi vào ARCHITECTURE/restore runbook: tắt quét trong lúc/ sau restore cho tới khi DB và bucket đồng bộ.

### [MINOR-1] Bước quét object không giữ khoá advisory → chạy chồng đếm trùng
- `purge-orphan-objects.ts:41-43`: các bước khác giữ `pg_advisory_xact_lock(726003)`; bước này không. Hai lần chạy chồng cùng xoá một key (idempotent, không hại dữ liệu) nhưng `orphanObjectsDeleted` bị cộng ở cả hai → audit thổi phồng. Test chạy chồng (`data-retention.test.ts:450-464`) dùng `NO_SCAN_PREFIX` nên không phủ. Fix: `pg_try_advisory_lock` cấp bước (bỏ qua nếu đang có lần chạy khác) hoặc ghi chú chấp nhận trong docs.

### [MINOR-2] Mỗi lần xoá `private-files` thêm một `findByID`
- `delete-object-before-delete.ts:11`: truy vấn thêm 1 lần/dòng (Payload đã đọc doc trong operation nhưng không truyền vào `beforeDelete`). Chấp nhận được với khối lượng CV; chỉ ghi nhận.

## Residual risk
- Không tự chạy `pnpm test` (lý do CRITICAL-1); kết quả test của các ca mới (hook S3 lỗi, quét mồ côi dry-run/thật, audit failedRecords) chưa kiểm chứng độc lập — chỉ đọc code + report builder.
- Hành vi DeleteObject trên key không tồn tại của SeaweedFS (204) dựa trên tài liệu S3 + các test "lần sau xoá được" của builder, không tự xác minh.
- Có khả năng dữ liệu bucket `private` dùng chung đã bị xoá trong lần chạy test của builder (xem CRITICAL-1).

## Verdict
❌ **FAIL** — 1 CRITICAL (test xoá dữ liệu ngoài phạm vi trên bucket dùng chung), 1 MAJOR (quét cả bucket không guard). Logic hook `beforeDelete`, key prefix, đường xoá, log/PII, audit meta và docs đạt yêu cầu; sau khi sửa 2 lỗi trên cần round 2 (kèm `pnpm test` an toàn).
