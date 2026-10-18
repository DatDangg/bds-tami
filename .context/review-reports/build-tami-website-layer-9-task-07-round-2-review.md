Agent: reviewer

# Review — build/tami-website · layer-9-task-07 (job `translate-content` + hook tự dịch) — round 2

- **Review level:** STRICT
- **Reason:** job nền gọi API trả tiền (hạn mức/chi phí), ghi đè dữ liệu nội dung dùng chung (global/collection, array không localized), transaction/lost update, hook dùng chung trên mọi collection/global dịch được, migration mới, email admin.
- **Blast radius:** `src/jobs/translate-content*.ts`, `src/hooks/translation/*` (afterChange/beforeChange trên news/projects/pages/developers/... + globals Header/Footer/Homepage/SiteSettings), `src/lib/translation/{budget,leaves,segments,job-input}.ts`, bảng `payload_jobs`, `payload_kv`, `translation_usage`, migration `20261018_140000_translate_content`, email template `translation-budget-exceeded`, ARCHITECTURE §5.4.
- **Scope:** diff chưa commit trên HEAD a183c53 (bỏ qua `.claude/launch.json`, `.context/`). Không gọi Claude API thật (test dùng SDK giả).

## Verify commands + result (theo `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 214 files, 2.284 tests |
| `pnpm test tests/integration/translate-content` | PASS — 2 files, 26 tests (không bị `skipIf`, chạy thật trên DB tạm) |
| `pnpm build` | PASS (exit 0) |

## Kiểm các điểm round 1

### MAJOR-1 (lost update) — ĐÓNG
- `translate-content-save.ts:44-59`: trong transaction đọc lại bản `en`, so `fresh.updatedAt !== args.sourceUpdatedAt` (`sourceUpdatedAt = vi.updatedAt`, `translate-content.ts:111`), khác → bỏ ghi, `row_changed`; giống → `buildEnglishWrite(fresh, …)` từ bản đọc lại.
- **Mốc so sánh đúng:** `updatedAt` là cột non-localized của dòng chính (cùng giá trị khi đọc locale vi hay en). Payload 3.91 luôn đặt lại `updatedAt` ở mọi lần lưu không phải draft, kể cả khi chỉ đổi locale vi: collection `payload/dist/collections/operations/utilities/update.js:311` (`dataToUpdate.updatedAt = new Date().toISOString()`), global `payload/dist/globals/operations/update.js:305-311`. Lưu draft (versions) không đụng dòng chính nên không làm job ghi đè bản đã xuất bản. Hai lần đọc cùng adapter nên định dạng chuỗi ISO giống hệt, so `!==` dùng được.
- Integration test (Footer: thêm cột, đổi link, xoá hàng trong lúc SDK giả "đang gọi") chứng minh thay đổi của admin còn nguyên và lần chạy sau dịch đủ (`tests/integration/translate-content.test.ts:504-541`).
- **Khe hở không khoá dòng:** xem MINOR-A. Em đánh giá là MINOR/residual, không phải MAJOR: `SELECT … FOR UPDATE` qua `payload.db.drizzle`/session của `req.transactionID` làm được trong khoảng 10 dòng, nhưng chỉ đóng được một chiều. Thao tác lưu của admin trong Payload cũng là đọc `originalDoc` → ghi, không có khoá, nên vẫn có TOCTOU ngược lại (admin ghi đè bản dịch, lỗi này tự sửa được vì `sourceHash` vẫn lệch). Khe hở còn lại cỡ thời gian chạy pipeline hook của một lần `update`, đã được ghi rõ trong comment và ARCH §5.4.

### MINOR-1 (email hạn mức) — ĐÓNG
- `budget.ts:91-111`: `INSERT INTO payload_kv … ON CONFLICT ("key") DO NOTHING RETURNING id`. `payload_kv_key_idx` là UNIQUE (`migrations/20261016_090115_init.ts:83`), nên câu lệnh là nguyên tử; nếu xếp email lỗi thì `releaseBudgetAlert`. Key `translation-budget-alert:YYYY-MM` tính theo `monthKey`, tức UTC (`budget.ts:49`), trùng với chu kỳ của `translation_usage`, nên hai bên không lệch tháng. Mỗi tháng thêm 1 dòng, không chứa PII; không dọn cũng không đáng kể.
- Test: `translate-content.test.ts:397-419` kiểm 1 email/tháng, chạy lại không thêm email, bản ghi khác cũng không thêm.

### MINOR-2 (`row_changed`) — ĐÓNG (test yếu, xem MINOR-C)
- `translate-content.ts:121-130`: log warn chỉ có slug/docId, `queueTranslation` xếp lại, lỗi khi xếp thì log và không ném.

### MINOR-3 (xếp job ngoài transaction) — ĐÓNG
- `enqueue-translation.ts:86-88` dùng bản sao `{ ...req, transactionID: undefined }`. `createLocalReq` bù lại `headers`/`url` khi thiếu (`payload/dist/utilities/createLocalReq.js:60-106`), nên bản sao của một Request REST vẫn dùng được.
- Job mồ côi khi lần lưu rollback: job đọc lại bản ghi. Nếu là create bị rollback → `not_found`; nếu là update bị rollback thì `sourceHash` không đổi → `unchanged`, không gọi API. Chỉ khi bản ghi đã xuất bản mà chưa từng được dịch (`none`/`failed`) thì job mới dịch, và việc dịch đó vốn cần làm, không phải chi phí thừa. Debounce khoảng 1 phút nên job chạy sau khi transaction đã commit.
- **Test đổi tên `payload_jobs`:** chạy trên DB tạm riêng cho mỗi lần chạy (`tami_translate_<runId>`, `CREATE DATABASE` ở `:96-103`, `DROP DATABASE … WITH (FORCE)` ở `afterAll :123-135`), không phải DB dev dùng chung. Tên bảng được khôi phục trong `finally` (`:552-554`). Test song song ở file khác dùng DB riêng nên không bị ảnh hưởng. OK.

### MINOR-4 (`hasManualEnglishEdit`) — ĐÓNG
- `detect-manual-en.ts:26-…`: `""`/null/thiếu được coi như nhau; xoá trắng trường đã có chữ = sửa tay; chỉ xét field top-level có trong `data`. Có 6 unit test bao các nhánh, kể cả richText rỗng.

### MINOR-5 (kích thước file) — ĐÓNG
- `translate-content.ts` 222 dòng, `-save.ts` 65, `-failure.ts` 57, `-context.ts` 50; các hàm đều < 50 dòng.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]

- **MINOR-A — Khe hở không khoá dòng (residual, đã ghi tài liệu)** `src/jobs/translate-content-save.ts:41-52`. Ở READ COMMITTED, transaction không cô lập lần đọc lại với `update`. Một lần lưu của admin commit đúng trong khe giữa `readDoc` và `db.updateOne` thì phần không phải chữ (link, hàng array, ảnh) bị bản dịch ghi đè. Đề xuất (task sau, không chặn): ngay sau `initTransaction`, lấy khoá dòng `SELECT 1 FROM <payload.db.tables[slug]> WHERE id = $id FOR UPDATE` (global: bảng của global, `LIMIT 1`) trên session `payload.db.sessions[req.transactionID]`, rồi mới đọc lại và so `updatedAt`. Khi đó trường hợp xấu nhất chuyển từ "mất dữ liệu của admin" thành "mất bản dịch, tự sửa được".
- **MINOR-B — Nhánh fallback `hasEnglish` chạy NGOÀI transaction** `src/jobs/translate-content-save.ts:11,21-27`. Khi `update({ hasEnglish: true })` ném `ValidationError`, operation của Payload gọi `killTransaction(args.req)` (`payload/dist/collections/operations/updateByID.js:240`; `killTransaction` rollback và `delete req.transactionID` bất kể ai sở hữu transaction). Lần `update({})` sau đó vì vậy tự mở transaction riêng, còn `commitTransaction(req)` ở dòng 53 thành no-op. Hiện tại không gây sai dữ liệu: lần ghi đầu đã bị rollback hết, và hiện chưa có khoá nào. Nhưng comment "lần ghi nằm trong transaction" sai trên nhánh này, và nếu sau này thêm `FOR UPDATE` (MINOR-A) thì khoá sẽ mất ở đây. Nếu job runner đã có sẵn transaction trên `req` (`ownsTransaction=false`), lần kill này còn rollback cả transaction của bên ngoài. Đề xuất: quyết định `hasEnglish` trước khi ghi bằng cách gọi trực tiếp predicate của `requireEnglishFields` trên `write`, thay cho try/catch `ValidationError`; hoặc ít nhất sửa comment.
- **MINOR-C — Assertion "đã xếp lại job" không chứng minh được gì** `tests/integration/translate-content.test.ts:533`. `expect(length).toBeGreaterThan(jobsBefore - 1)` tương đương `>= jobsBefore`, và lần lưu của admin trong SDK giả (đổi chữ "Cột mới") đã tự xếp/lùi job qua hook. Vì vậy test vẫn PASS dù `rowChanged` không gọi `queueTranslation`. Đề xuất: thêm một case admin chỉ đổi link (hook không xếp job) rồi assert có job mới (số job +1) hoặc `waitUntil` bị lùi.

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS). Template email `translation-budget-exceeded` là nội dung email, không thuộc layout web.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip — lệnh `aislop` không có trong verify commands được phép của profile |
| oxlint (anti-slop) | skip, oxlint not configured (repo dùng ESLint; `pnpm lint` PASS) |
| open-code-review (`ocr`) | skip, ocr not installed / không nằm trong lệnh được phép |
| AI-readable | OK — file ≤ 222 dòng, hàm < 50 dòng, tên rõ, comment giải thích WHY; ARCH §5.4 đã cập nhật; 0 indicator chặn |
| ai-friendly-web | N/A — job/hook nội bộ, không phải trang public |
| blitzstrike | skip — không có môi trường pentest được phép; job nội bộ, không có endpoint public mới |

## Residual risk
- MINOR-A: khe hở cỡ mili-giây không khoá dòng (đã ghi trong ARCH §5.4).
- Luồng admin REST thật (Request instance spread qua `detachFromTransaction`) mới được suy luận qua `createLocalReq`; integration test chỉ chạy Local API.

## Verdict
**PASS**: không còn CRITICAL/MAJOR; MAJOR-1 và MINOR 1–5 của round 1 đã đóng; lint/typecheck/test/build PASS. Còn 3 MINOR (A/B/C), đề xuất làm trong task sau, không chặn close-out.
