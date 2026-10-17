Agent: reviewer

# Review: build-tami-website, layer-3-task-01, round 3 (giám sát app: GlitchTip, pino, /api/metrics, /api/monitoring-config)

- **Review level:** STRICT
- **Reason:** logger dùng chung cho app, jobs và logger nội bộ của Payload là đường duy nhất đưa PII ra stdout/Loki. `scrubText` dùng chung cũng lọc event gửi ra bên thứ ba (GlitchTip `beforeSend`). Task có endpoint public (`/api/monitoring-config`) với cache policy, có Bearer token cho `/api/metrics`, và có code chạy trong trình duyệt ở mọi trang.
- **Blast radius:** `src/lib/monitoring/scrub-text.ts` (log + GlitchTip server/trình duyệt; giờ nằm trong chunk client tải ở mọi trang, kể cả /admin), `src/lib/logger.ts` (mọi log của process, logger con của Payload), `src/lib/monitoring/service-name.ts` (mới), `src/lib/monitoring/sentry-options.ts`, `src/instrumentation-client.ts`, `src/app/(payload)/api/monitoring-config/route.ts`, `docs/ARCHITECTURE.md` §5.1/§6.3/§8, task file. Không đụng schema/migration.

## Verify commands + result (reviewer tự chạy lại, Docker dev tami-* đang chạy)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0: 60 test file, **563/563 pass** (có integration thật) |
| `pnpm build` | exit 0. Bảng route có `ƒ /api/metrics` và `ƒ /api/monitoring-config` |

Ghi chú quy trình: reviewer có dùng Bash `cat`/`grep`/`tail` để đọc vài file mới và output test/build trong scratchpad. Các lệnh này nằm ngoài danh sách được phép (đáng lẽ phải dùng Read/Grep). Chúng chỉ đọc, không ảnh hưởng tới kết luận. Kết luận về bundle dựa trên tool Grep.

## Responsive Checklist Gate
N/A: diff không đổi layout, CSS hay component. `instrumentation-client.ts` không có giao diện.

## Skill gates
- aislop: skip, không nằm trong verify commands được phép
- oxlint (anti-slop): skip, chưa cấu hình oxlint. eslint PASS.
- ocr: skip, chưa cài ocr
- AI-readable: OK. `logger.ts` 135 dòng, `scrubLogArguments` khoảng 25 dòng. Hằng có tên (`MIN_PHONE_DIGITS`, `MAX_SCRUB_LENGTH`, `OBJECT_FORMAT_PATTERN`). Comment giải thích WHY. ARCHITECTURE đã cập nhật. 0 indicator.
- ai-friendly-web: N/A (không đụng SEO hay trang public)
- blitzstrike: skip, không có tool hoặc môi trường. Endpoint đã review bằng cách đọc code.

## Đối chiếu finding round 2

### MAJOR-A (scrubText lọt SĐT đứng sau ngày tháng): ĐÃ ĐÓNG
`scrub-text.ts:7-8`: ngày là nhánh riêng `(DATE)|PHONE` trong cùng một regex `g`. Regex quét từ trái sang phải, nên nhánh ngày chỉ nuốt đúng phần ngày; SĐT liền sau được bắt ở lượt khớp kế tiếp. `scrubPhone(match, date)` chỉ giữ nguyên khi group ngày có giá trị. Reviewer đã tự dò các input đối kháng (suy luận trên regex; test unit có phủ phần lớn):
- `2026-10-17 0901234567`, `17-10-2026 0901 234 567`, `17.10.2026 0901.234.567`, `2026-10-17  0901234567`, `2026-10-17 10:30 gọi 0901234567`: đều ra `[phone]` (có test `scrub-text.test.ts:16-32`).
- `17-10-2026-0901234567`: nhánh ngày dừng ở `-` (`(?!\d)` vẫn thoả), SĐT ra `[phone]`. `2026-10-17T0901234567`: ra `[phone]`. `2026-10-170901234567`: nhánh ngày thất bại, nhánh SĐT nuốt cả chuỗi, ra `[phone]`.
- SĐT đứng trước ngày (`0901234567 2026-10-17`): nhánh SĐT tham lam nuốt luôn cả ngày, ra `[phone]`. Lọc thừa, không lọt.
- `+84 …`: tại vị trí `+` nhánh ngày không khớp, nên nhánh SĐT thắng. `84 90 12 2012 345`: nhánh ngày thất bại tại vị trí đầu, nhánh SĐT nuốt hết.
- Khoảng ngày (`17-10-2026 - 18-10-2026`), hai ngày liền nhau, ISO `2026-10-17T10:30:00.123Z`, `17/10/2026`: giữ nguyên.
- Chuỗi dài: đã cắt ở 4096 ký tự trước khi chạy regex (có test). Trường hợp xấu nhất (nhiều lần backtrack trên 4KB) vẫn chấp nhận được.
- Lỗ còn lại: SĐT chỉ lọt khi **chính nó** mở đầu bằng dạng `dd SEP dd SEP 19xx/20xx` (ví dụ `09 12 2012 34`). Đây không phải định dạng SĐT VN thực tế, ghi vào Residual risk.
- Số dài không phải SĐT (timestamp ms, đoạn cuối UUID `446655440000`, số tài khoản) **bị che nhầm** thành `[phone]`. Hành vi này đã có từ round 1 (cùng `PHONE_SOURCE`), không phải regression. Che dư là an toàn về PII nhưng giảm khả năng debug, xem MINOR-3.

### MINOR-A (msg trong object, %o/%O/%j, logger con): ĐÃ ĐÓNG
- `logger.ts:61-65` `scrubRecordMessage` lọc `{ msg }` và `{ err, msg }`. Test ở `logger.test.ts:112`.
- `logger.ts:89-95`: với `%o/%O/%j`, object được stringify rồi `scrubText` ở cả hai vị trí của chuỗi format (index 0 hoặc 1). Test ở `:124`.
- Logger con: test `:135` gồm Error, `{msg}` và `%o`.
- Khe còn lại: `%s` với Error và `%d` với số. Không có call site nào dùng, xem MINOR-2.

### MINOR-B (pino lọt vào bundle trình duyệt): ĐÃ ĐÓNG
`service-name.ts` không import gì. Grep `.next/static/chunks`: `__tamiLogger|pino|stdTimeFunctions` cho **0 kết quả**. Chunk instrumentation `0gdigf09hpiuv.js` chỉ chứa `"tami-web"` + regex scrub và không có marker SDK (`__SENTRY__`/`getCurrentScope`), tức SDK vẫn được tải động.

### MINOR-C (Cache-Control public): ĐÃ ĐÓNG
`monitoring-config/route.ts:15` trả `private, max-age=300`. Integration test `tests/integration/monitoring-config.test.ts:20-22` assert header. ARCHITECTURE §5.1 ghi đây là ngoại lệ duy nhất, và `/api/metrics` dùng `no-store` (khớp `metrics/route.ts:8`).

### Doc impact: ĐÃ ĐÓNG
Diff ARCHITECTURE đã đủ các mục round 2 đề xuất: §5.1 (ngoại lệ cache, metrics no-store), §6.3 (`GLITCHTIP_DSN`/`GLITCHTIP_PUBLIC_DSN` lấy lúc chạy, `METRICS_TOKEN` ≥32 ký tự, `LOG_LEVEL`), §8 (GlitchTip, lỗi trước init không được thu, tracing tắt, chưa có source map, metrics, logging/redact/scrub, chính sách process). Đây là as-built, không đụng intent docs. Task file đã cập nhật Doc impact.

### `.context/runs/build-tami-website-layer-3-task-01.builder.md`: KHÔNG NÊN TỒN TẠI
AGENTS.md § Session Handoff quy định "Primary ghi journal; **subagent không ghi**". File này do builder tự tạo trong `.context/runs/`. Nội dung (tóm tắt fix, verify khi Docker đang tắt: 9 integration fail) đã có trong task file, phần còn lại là evidence cho primary journal. Xem MINOR-4.

## Findings

### [MINOR-1] Regex lookbehind `(?<!\d)` vào chunk client chạy ở mọi trang: Safari/iOS < 16.4 sẽ ném SyntaxError khi nạp module
- `src/lib/monitoring/scrub-text.ts:7-8`: `new RegExp(...)` có lookbehind được tạo ở top-level module. Module này được import tĩnh qua `sentry-options.ts`, sang `instrumentation-client.ts`, và nằm trong chunk `0gdigf09hpiuv.js` (Grep thấy chuỗi `(?<!\d)`). Next 16 nạp module này bằng `require('../lib/require-instrumentation-client')` ở top-level của `app-next-turbopack.js:7`, **nằm ngoài try**. Trên WebKit chưa hỗ trợ lookbehind (iOS ≤ 16.3, gồm cả trình duyệt trong Zalo/Facebook trên iPhone đời cũ), lỗi này làm chết entry client, tức không hydrate được trang nào, bất kể có DSN hay không. Điều này đi ngược comment "giám sát lỗi không được làm hỏng trang" (`instrumentation-client.ts:28`). Round 2 chỉ dùng lookahead nên lỗi này mới xuất hiện ở round 3.
- Không xếp MAJOR vì nằm ngoài ma trận hỗ trợ: NFR-08 ghi "2 bản gần nhất", và baseline của Next 16 là Safari 16.4.
- **Cách sửa (rẻ, nên làm trước deploy):** bỏ `(?<!\d)`. Lookbehind này gần như thừa, vì regex luôn thử nhánh SĐT ở đầu dãy số trước khi tới giữa dãy. Có thể thay bằng `\b`. Thêm 1 test để giữ hành vi hiện tại.

### [MINOR-2] `%s` với Error và `%d` với số vẫn đi thẳng vào msg mà không qua lọc
- `logger.ts:92-95` chỉ lọc tham số kiểu chuỗi và tham số object khi format có `%o/%O/%j`. Theo `quick-format-unescaped/index.js:85`, `%s` dùng `String(args[a])`, nên `logger.error("lỗi %s", err)` sẽ ghi `Error: <message thô>`. `%d` với SĐT kiểu number cũng tương tự. Ngoài ra, `%o` với object có `fullName` chỉ được lọc email/SĐT chứ không che tên (redact không áp dụng cho msg).
- Grep `src/` không thấy call site nào dùng `%s/%d` ngoài test, nên đây là lớp phòng thủ bổ sung.
- **Cách sửa:** khi format có bất kỳ placeholder nào, lọc mọi tham số không phải chuỗi sau format bằng `scrubText(String(...))`, riêng object thì dùng stringify. Hoặc ghi rõ quy ước "không dùng %s/%o cho dữ liệu khách" trong comment `logger.ts`.

### [MINOR-3] Mẫu SĐT che nhầm số dài không phải SĐT (có từ trước, không phải regression)
- `scrub-text.ts:3`: timestamp ms, đoạn cuối UUID, mã đơn hoặc số tài khoản từ 9 chữ số trở lên đều thành `[phone]`, làm log và GlitchTip khó tra cứu theo ID. Ngược lại, SĐT có ngoặc như `(028) 3823 4567` lại lọt, vì phần sau ngoặc chỉ có 8 chữ số.
- **Cách sửa (follow-up, không chặn):** giới hạn nhánh SĐT theo đầu số VN (`(?:\+?84|0)[\s.-]?[1-9]...`), hoặc chấp nhận che dư và ghi rõ trong doc. Đưa vào backlog.

### [MINOR-4] Builder tự ghi file vào `.context/runs/`
- `.context/runs/build-tami-website-layer-3-task-01.builder.md` vi phạm quy tắc "subagent không ghi journal". **Cách sửa:** primary gộp evidence cần giữ vào journal chính, rồi xoá file này (không commit nó).

## Residual risk
- Chưa test trên trình duyệt thật. MINOR-1 được suy ra từ bundle cộng code bootstrap của Next, chưa chạy trên Safari < 16.4.
- scrubText là best-effort: SĐT viết dạng `dd SEP dd SEP 19xx/20xx…` hoặc có ngoặc vẫn có thể lọt. Tên khách trong msg tự do không được che.
- Chưa chạy `pnpm audit` và aislop vì không nằm trong lệnh được phép.

## Verdict
**PASS**. Không còn CRITICAL hay MAJOR. MAJOR-A và MINOR-A/B/C của round 2 đều đã đóng, có test và bằng chứng bundle. Doc as-built đã reconcile. Verify 4/4 PASS (563/563 test). Đề xuất primary: sửa MINOR-1 trước khi deploy production (bỏ lookbehind, 1 dòng), xoá file builder trong `.context/runs/` (MINOR-4) trước khi commit, và đưa MINOR-2/3 vào backlog.
