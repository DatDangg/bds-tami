Agent: reviewer

# Review — build-tami-website layer-10-task-05 (BL-008: xoá CV an toàn + quét object mồ côi) — round 2

- Worktree: `D:/prj/bds-wt10-t05` (branch `wt/l10-t05`, base `ef39df4`, chưa commit) — attempt 2
- Review level: **STRICT**
- Reason: xoá dữ liệu cá nhân (CV) trên S3, không hoàn tác được; bước job xoá dựa trên việc dòng DB không tồn tại; hook `beforeDelete` dùng chung mọi đường xoá `private-files`; env/compose staging/prod mới; output schema job và audit meta thay đổi.
- Blast radius: `src/collections/PrivateFiles.ts` + `src/hooks/private-files/delete-object-before-delete.ts` (mọi đường xoá `private-files`: admin xoá hồ sơ/file, `removeOrphanCv`, retention); `src/lib/private-objects/private-objects.ts`; `src/lib/retention/*` (bước `purge-orphan-objects`, `failedRecords`/`orphanObjectsFound`, audit meta); `src/lib/env.ts` (biến mới trong `envSchema` → validate lúc khởi động app + jobs qua `payload.config.ts:54`); `docker/docker-compose.{staging,prod}.yml`; bucket private của mọi môi trường; docs ARCHITECTURE/ERD/runbooks deploy+restore; `.env.example`.

## Verify commands + result

| Lệnh (trong worktree) | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | Exit 1: 211/214 file PASS, 2220 test PASS, 45 skipped. 3 file FAIL: `src/lib/contrast.test.ts` (lỗi môi trường đã biết BL-004, không tính); `tests/integration/access.test.ts` và `tests/integration/media-upload.test.ts` đều là `beforeAll` hết 10s lúc khởi tạo Payload (chậm do tải song song, không phải assertion lỗi). |
| `pnpm test tests/integration/access.test.ts tests/integration/media-upload.test.ts tests/integration/data-retention.test.ts` | PASS: 3/3 file, 65/65 test, 0 skipped. Vậy `data-retention` chạy thật với DB + S3 (không bị skip), và 2 file timeout ở trên PASS khi chạy riêng (`media-upload` phủ cả `private-files` có hook mới). |
| `pnpm build` | PASS (exit 0) |

Kiểm tra trước khi chạy `pnpm test` (theo chỉ thị): mọi đường gọi job/quét đã soát bằng Grep (`runDataRetention|dataRetentionTask|purgeOrphanObjects|listPrivateObjectsPage|jobs.run`):
- `tests/integration/data-retention.test.ts:64-69` `run()` mặc định `orphanObjectScanPrefix = NO_SCAN_PREFIX` (`retention-test-noscan-<uuid>/`, không có object nào).
- `:486-501` test handler (không truyền prefix) đặt `RETENTION_ORPHAN_OBJECT_SCAN=off` → bước return trước khi liệt kê.
- `:18-30` `vi.mock` bọc `listPrivateObjectsPage`: prefix không bắt đầu bằng `retention-test-` và không nằm trong `allowedExtraScanPrefixes` thì ném lỗi trước khi gọi S3. Đây là lớp chặn thứ hai (lỗi xảy ra trước `DeleteObject`). Prefix ngoại lệ duy nhất là `kept.filename` (tên CV UUID do chính test tạo, có dòng DB nên không bị coi là mồ côi).
- `jobs-email.test.ts` chạy `jobs.run` chỉ queue `test-email`; `translate-content.test.ts:564` chạy `jobs.run` theo id job → không đường nào kích hoạt `data-retention`.
→ Không còn đường quét ngoài prefix test, nên đã chạy `pnpm test`.

## Đóng finding round 1

| Finding r1 | Trạng thái | Bằng chứng |
|---|---|---|
| CRITICAL-1 test handler quét bucket dùng chung | **Đã đóng** | Có 3 lớp: prefix mặc định rỗng dữ liệu, env `off` cho test handler, `vi.mock` ném lỗi với prefix ngoài vùng test (đã nêu ở trên). |
| MAJOR-1 quét mồ côi không có guard | **Đã đóng** | (1) Opt-in: `parseOrphanObjectScanMode` (`src/lib/env.ts:234-238`) thiếu/rỗng → `dry-run`; `envSchema` default `dry-run` (`env.ts:247`); compose `${RETENTION_ORPHAN_OBJECT_SCAN:-dry-run}` (`docker-compose.prod.yml:44`, `docker-compose.staging.yml:46`; `:-` cũng phủ chuỗi rỗng); `.env.example` = `dry-run`. (2) Ngưỡng: `exceedsSafetyLimit` (`purge-orphan-objects.ts:54-61`) được kiểm TRƯỚC mọi lần xoá; vượt ngưỡng thì ném, không xoá key nào (`:96-100`) → bước vào `failedSteps`, audit vẫn ghi (`run-data-retention.ts:58`). Có test cả ngưỡng số lượng (`maxDelete: 1`) và ngưỡng tỉ lệ (12/12), kèm kiểm object còn nguyên. (3) Runbook: `deploy.md:97`, `restore.md:171` (tắt quét sau khi restore). |
| MINOR-1 thiếu advisory lock | **Đã đóng** | `purge-orphan-objects.ts:92` chạy cả bước trong `runInLockedTransaction(DATA_RETENTION_LOCK_KEY)`. |
| MINOR-2 thêm `findByID` mỗi lần xoá | Giữ nguyên (chấp nhận) | `delete-object-before-delete.ts:11`. |

## Đánh giá các điểm primary yêu cầu

1. **Ngưỡng đúng ngữ nghĩa:** OK. Bước quét xong toàn bộ, kiểm ngưỡng rồi mới xoá; vượt ngưỡng thì không xoá gì (`orphanObjectsDeleted` = 0, test xác nhận). Ở `dry-run` hoặc khi job chạy `dryRun` thì return trước khi kiểm ngưỡng và trước khi xoá (`:95`).
2. **Dry-run mặc định ở mọi môi trường không đặt env:** OK. Có ba lớp mặc định: parser (undefined/"" → dry-run), `envSchema` (preprocess `emptyToUndefined` + default) và compose `:-dry-run`. Có unit test `env.test.ts:209-217`.
3. **Env có giá trị lạ:** lỗi rõ ràng, chỉ nêu tên biến (`EnvValidationError(["RETENTION_ORPHAN_OBJECT_SCAN"])`, không lộ giá trị). Ở mức bước, `parseOrphanObjectScanMode` ném bên trong `attempt` → chỉ bước này lỗi, các bước khác vẫn chạy. Tuy nhiên vì biến này cũng nằm trong `envSchema` và `payload.config.ts:54` gọi `getEnv()` lúc khởi động, thực tế giá trị lạ sẽ làm **app web + process jobs không khởi động** (fail-fast lúc deploy, health check bắt được), không chỉ làm hỏng bước retention. Tôi đánh giá đây là đánh đổi chấp nhận được: lỗi gõ (vd `Delete`) lộ ra ngay lúc deploy thay vì im lặng. Nhưng chưa có tài liệu nào ghi rõ điều này (xem MINOR-1).
4. **Compose/runbook khớp code:** OK. Giá trị, mặc định, ngưỡng 100 / 20% / từ 10 trở lên trong `deploy.md`, `restore.md`, ARCHITECTURE và ERD §4.12 khớp `retention-config.ts:409-411`. Comment trong compose trỏ đúng `restore.md` §6 mục 6.
5. **Audit/log không lộ key:** OK. Log chỉ có `step`, `errorName`, `found`, `listed` (`purge-orphan-objects.ts:72,98`); message lỗi chỉ có số đếm; audit meta chỉ có số đếm, tên bước và `failedRecords`.
6. **Docs khớp code:** gần đủ. ARCHITECTURE bảng job, ERD §4.10/§4.12, runbooks khớp. ERD §7 (phần as-built của retention) chưa có dòng cho bước quét object (xem MINOR-3).

## Responsive Checklist Gate

N/A — diff không đụng UI (route/component/CSS).

## Skill gates

- aislop: skip — không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured; eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed / không trong allow list.
- AI-readable: OK. Tên rõ (`exceedsSafetyLimit`, `scanBucket`, `findKeysWithoutRow`); hàm < 50 dòng; `purge-orphan-objects.ts` 103 dòng; ngưỡng là hằng có tên trong `retention-config.ts`; comment giải thích lý do (WHY); docs đã cập nhật. 0 indicator.
- ai-friendly-web: N/A (job/hook nội bộ).
- blitzstrike: skip — không có môi trường pentest được phép; không phải auth/API public.

## Findings

Không có CRITICAL, không có MAJOR.

### [MINOR-1] Giá trị env lạ làm sập lúc khởi động toàn bộ app, không chỉ bước retention; phần parse ở mức bước gần như không bao giờ chạy tới
- `src/lib/env.ts:247` (`envSchema`) + `src/payload.config.ts:54` (`getEnv()` lúc khởi động); `src/lib/retention/purge-orphan-objects.ts:89` đọc lại thẳng `process.env`, nên cùng một giá trị đang được validate ở hai nơi.
- Fail-fast khi deploy là hợp lý, nhưng nên nói rõ trong `deploy.md:97` ("giá trị khác off/dry-run/delete → app không khởi động"). Cân nhắc cho bước đọc `getEnv().RETENTION_ORPHAN_OBJECT_SCAN` để chỉ còn một nguồn sự thật, hoặc giữ như hiện tại và ghi chú. Không chặn PASS.

### [MINOR-2] Test handler khôi phục env không nằm trong `try/finally`
- `tests/integration/data-retention.test.ts:489-500`: nếu một assertion fail, `RETENTION_ORPHAN_OBJECT_SCAN=off` bị giữ lại cho các test sau trong cùng worker. Không gây rủi ro dữ liệu: `run()` truyền mode tường minh và `vi.mock` vẫn chặn. Fix: bọc phần đặt/khôi phục env bằng `try/finally`.

### [MINOR-3] ERD §7 (as-built retention) thiếu dòng cho bước quét object mồ côi
- `docs/ERD.md` khoảng dòng 634: §7 chỉ nói "Cùng cơ chế cho dọn CV mồ côi"; chế độ env và ngưỡng chỉ có ở §4.12 và ARCHITECTURE. Fix: thêm một gạch đầu dòng tham chiếu §4.12 hoặc ARCHITECTURE.

### [MINOR-4] Ngưỡng không bắt được trường hợp restore làm lệch ít object
- `purge-orphan-objects.ts:54-61`: dưới 10 mồ côi thì không kiểm tỉ lệ, và một restore lùi vài ngày chỉ tạo ít "mồ côi" giả nên lọt qua cả hai ngưỡng. Rủi ro này đã được ghi ở `restore.md:171` ("chỉ là lớp chặn cuối", phải tắt quét khi restore). Ghi nhận, không cần sửa.

### [MINOR-5] (từ round 1) Thêm một `findByID` mỗi lần xoá `private-files`
- `delete-object-before-delete.ts:11`. Chấp nhận được.

## Residual risk
- Hai file integration (`access`, `media-upload`) bị timeout `beforeAll` khi chạy full suite; khi chạy riêng thì PASS. Có thể suite đang chạy chậm/flaky vì tải song song; không liên quan logic diff, nhưng CI có thể đỏ ngẫu nhiên.
- Chưa xác minh trực tiếp rằng service `jobs` trong compose dùng anchor `*app-environment`. Kể cả nếu không dùng, mặc định code vẫn là `dry-run`, nên không có rủi ro xoá.
- Mọi bước quét giữ một transaction + khoá advisory trong suốt quá trình liệt kê S3 (tối đa 50 trang) và tối đa 100 lần `DeleteObject`, nên transaction có thể kéo dài. Chấp nhận được với một job chạy hằng tuần.
- Kết quả DeleteObject trên SeaweedFS với key không tồn tại: các test "lần sau xoá được" đều PASS, phù hợp với tính idempotent.

## Verdict
✅ **PASS**: CRITICAL-1, MAJOR-1 và MINOR-1 của round 1 đã đóng. lint, typecheck và build PASS. Test retention/hook chạy thật với S3 và PASS (65/65 khi chạy riêng). Còn 5 MINOR, không chặn.
