Agent: reviewer

# Review — build/tami-website · layer-4-task-04 · round 2

- **Review level:** STRICT
- **Reason:** dữ liệu gửi ra ngoài (Claude API), secret `ANTHROPIC_API_KEY`, chi phí/hạn mức tháng, bảng mới + migration, env schema dùng chung (`src/lib/env.ts`), task file yêu cầu STRICT.
- **Diff:** working tree so với HEAD `6d92b09` (`git diff` + untracked `src/lib/translation/**`, `src/collections/TranslationUsage.ts`, `migrations/20261017_043315_translation_usage.*`, `tests/integration/translation-usage.test.ts`). Không gọi api.anthropic.com: chỉ SDK thật với fetch giả, hoặc client giả.

## Blast radius
- `src/lib/translation/*` (service, client, segments, budget, lexical, allowlist, prompt, errors): code mới, hiện chưa có chỗ nào gọi. Người dùng đầu tiên là job dịch ở `layer-9-task-07`.
- `src/lib/env.ts`: `ANTHROPIC_API_KEY` đổi từ bắt buộc sang tuỳ chọn (cố ý theo D7), dùng chung shape `translationEnvShape`.
- `src/payload.config.ts` + `migrations/index.ts` + migration additive `translation_usage` (unique `month`), `payload-types.ts`.
- `package.json`/lockfile: thêm `@anthropic-ai/sdk ^0.135.0`.
- Docs: `docs/ERD.md` §4.13, `docs/ARCHITECTURE.md` (đã reconcile as-built).

## Verify commands + result (reviewer tự chạy, theo `.context/project-config.md`)
`pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` → **EXIT=0**
- install: Lockfile is up to date, SDK 0.135.0 đã cài
- lint: OK · typecheck: OK
- test: **77 files / 827 tests passed**
- build: Compiled successfully

## Xác minh các điểm primary yêu cầu

### 1. MAJOR-1 (round 1): **ĐÃ ĐÓNG**
- `claude-client.ts:71-78` dùng `anthropic.messages.create` với `output_config: { format: { type, schema } }`. Ở SDK 0.135.0, `MessageCreateParams.output_config?: OutputConfig`, `OutputConfig.format?: JSONOutputFormat | null`, `JSONOutputFormat = { schema: {[k]: unknown}; type: 'json_schema' }` (`node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts:3362-3369, 3584-3597`). Kiểu khớp và typecheck PASS.
- `helpers/zod.js` trả `{type, schema, parse}`. Builder chỉ lấy `type` và `schema`, nên `parse` không được gửi (dù có gửi thì hàm cũng không serialize ra JSON). Tôi tự chạy `zodOutputFormat(modelOutputSchema)` và schema thực tế là:
  `{"type":"json_schema","schema":{"type":"object","properties":{"translations":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"additionalProperties":false,"required":["id","text"]}}},"additionalProperties":false,"required":["translations"],"description":"{$schema: \"https://json-schema.org/draft/2020-12/schema\"}"}}`
  Không có field lạ ở top-level của format. `$schema` đã được `transformJSONSchema` của SDK chuyển vào `description`, đúng như `.parse()` vẫn gửi. Có `additionalProperties:false` và `required` đầy đủ, nên không thấy nguy cơ 400 do shape.
- Response luôn trả `usage` và `stop_reason`. JSON chỉ được parse khi `end_turn`; parse hỏng hoặc sai schema thì `output: null` (`claude-client.ts:48-56, 79-90`).
- Service ghi chi phí **trước** `assertCompleted`/`validateModelOutput` (`translation-service.ts:77-88`). Lỗi HTTP/mạng không có usage nên không ghi (`:70-75`).
- Test chạy SDK thật với fetch giả và đi hết nhánh (a) `max_tokens` + JSON cụt → `truncated`, (b) `refusal` → `refused`, (c) sai schema/không phải JSON → `invalid_output`. Mỗi nhánh có `execute` (ghi chi phí) đúng 1 lần (`claude-client.test.ts:81-105`). `truncated`/`refused` giờ thực sự xảy ra được.

### 2. Chia lô
- Thứ tự và ghép kết quả đúng. `splitIntoBatches` giữ thứ tự và các lô liền kề nhau (`segments.ts:142-159`). Id `s<n>` là id toàn cục, `validateModelOutput` map theo id trong từng lô rồi trả về theo thứ tự lô. `translatedTexts.push(...)` theo thứ tự lô nên vị trí n tương ứng đúng `s<n>`, và `assemble` tra theo `segmentIndex` (`translation-service.ts:104-111`). Không có lô rỗng: lô hiện tại chỉ bị đẩy đi khi `currentTokens + tokens > budget`, mà một đoạn đơn đã vượt trần thì bị ném lỗi trước đó.
- Khi một lô lỗi giữa chừng thì cách xử lý nhất quán là **all-or-nothing**: kết quả các lô trước bị bỏ, không lưu một phần, nhưng chi phí của mọi lô đã có response đều được ghi. Như vậy **có trường hợp trả tiền mà không lưu được gì**. Ví dụ: lô 2 bị cắt cụt hoặc `invalid_output`, hoặc chạm hạn mức trước lô 2 vì `assertWithinBudget` chạy cho từng lô. Với trần 60.000 ký tự thì tối đa khoảng 3 lô, nên mỗi lần thất bại mất nhiều nhất khoảng 2 lô (mỗi lô ≤ ~12k token đầu ra). Việc này **chấp nhận được** ở task này: nhất quán, không lưu dữ liệu nửa vời, chi phí được ghi đủ để hạn mức vẫn chặn được. Rủi ro còn lại là job retry trả tiền lặp lại, xem MINOR-A.
- Ước lượng 2 ký tự/token cho VI → EN là **đủ bảo thủ**. Bản EN thường dài tương đương hoặc ngắn hơn số ký tự VI, và tiếng Anh khoảng 3,5-4 ký tự/token, nên thực tế rơi vào khoảng chars/3 đến chars/4. Hệ số /2 cho dư khoảng 1,5-2 lần. Thêm vào đó trần mỗi lô là 75% của `max_tokens` (dư thêm 33%) và overhead 30 token/đoạn cho vỏ JSON. Trường hợp xấu nhất là đoạn dày số (giá, diện tích) hoặc nhiều ký tự cần escape, vẫn nằm trong biên. Tôi không chứng minh được bằng token thật vì không gọi API (Residual risk).

### 3. MINOR-2 (round 1): chặn URL / `](` / `<` / `>`
- Câu "diện tích > 100m2" **không bị chặn nhầm**: nguồn có `>` nên bản dịch được phép có `>` (`segments.ts:103`).
- Vẫn còn chặn nhầm trong hai trường hợp, xem MINOR-B. (1) Nguồn dùng `≥`/`≤`/`→` hoặc chữ ("trên/dưới 100m2") và model dịch ra `>=`, `<`, `->`. (2) URL trong nguồn dính dấu câu ở cuối ("www.tami.vn.") mà model đổi dấu câu thì bị coi là URL mới. Khi đó kết quả `invalid_output`, đã trả tiền nhưng không lưu gì. Xác suất thấp và lỗi theo hướng an toàn (không lưu nội dung độc), nên xếp MINOR.

### 4. MINOR-1/3 + bảng giá
- MINOR-3: `translate` bọc lỗi DB/env thành mã cố định `not_configured`/`provider_unavailable` mà không làm lộ message gốc (`translation-service.ts:115-123`). Có test ở `translation-service.test.ts:273-279`.
- MINOR-1: AC đã chuyển sang `tasks/tami-website/layer-9-task-07.md` (+1 dòng).
- Bảng giá đã có comment nguồn (`budget.ts:15`).

### Regression
Không thấy regression. Toàn bộ 827 test PASS và build OK. Các trường env khác giữ nguyên. Migration chỉ thêm (additive).

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, `aislop` chưa cài (`which aislop` không có)
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc.json`/`oxlint.json`). `pnpm lint` của project PASS.
- ocr (open-code-review): skip, `ocr` chưa cài
- AI-readable: OK. Tên rõ, hàm ≤ 50 dòng (`translateUnwrapped` khoảng 21 dòng), hằng số có tên và chú thích (`CHARS_PER_OUTPUT_TOKEN`, `OUTPUT_TOKEN_BUDGET_PER_BATCH`, `MAX_TOTAL_CHARS`), comment giải thích WHY, docs as-built đã cập nhật. Có 0 indicator.
- ai-friendly-web: N/A, service nội bộ phía server.
- blitzstrike: skip, không có môi trường được phép (không gọi API thật theo chỉ định của user).

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
- **MINOR-A: lỗi giữa các lô làm mất các lô đã trả tiền; retry có thể trả tiền lặp lại.** `src/lib/translation/translation-service.ts:104-110`. Cách làm all-or-nothing nhất quán và chấp nhận được, nhưng job ở `layer-9-task-07` cần đưa vào AC: **không tự retry** các mã lỗi có tính tất định hoặc gần tất định (`invalid_input`, `invalid_output`, `refused`, `truncated`, `budget_exceeded`, `not_configured`), chỉ retry `rate_limited`/`provider_unavailable`. Nếu muốn tiết kiệm hơn thì có thể cache kết quả từng lô theo hash nội dung (không bắt buộc).
- **MINOR-B: chặn `<`/`>` và URL có thể chặn nhầm.** `src/lib/translation/segments.ts:99-104` (và `URL_PATTERN` ở `:27`). Đề xuất: chỉ chặn `<` khi theo sau là `[a-z/!?]` (thẻ HTML đã có `HTML_TAG_PATTERN` lo), hoặc chấp nhận `<`/`>` khi nguồn có `≤`/`≥`/`→`/`←`. Với URL thì bỏ dấu câu cuối `[.,;:!?]+$` trước khi so sánh.
- **MINOR-C: test chưa bao phủ đủ.** (1) `translation-service.test.ts:281-296`: các item chia lô dùng cùng một chuỗi `"x".repeat(9000)`, nên nếu ghép sai thứ tự hoặc sai id giữa các lô thì test không phát hiện. Nên dùng nội dung khác nhau cho từng item. (2) `:298-304`: tên test có ý "đủ hạn mức giữa chừng thì dừng lô sau" nhưng không có assert cho nhánh `budget_exceeded` giữa các lô. (3) `claude-client.test.ts:74`: chỉ kiểm `output_config` có chứa `"translations"`. Nên assert `output_config.format.type === "json_schema"` và không có key `parse`, để khoá shape request.

## Residual risk
- Chưa xác minh với API thật rằng server chấp nhận schema trên (theo chỉ định không gọi api.anthropic.com). Shape giống hệt thứ SDK tự gửi ở `.parse()`, nên rủi ro thấp.
- Tỷ lệ token/ký tự là lập luận, chưa đo bằng tokenizer thật.
- Bảng giá ở `budget.ts` cần đối chiếu lại trước khi đặt budget production (ghi chú đã có trong code).

## Verdict
✅ **PASS**: không còn CRITICAL hay MAJOR. MAJOR-1 của round 1 đã đóng và được kiểm bằng SDK 0.135.0 thật với fetch giả. Ba MINOR (A/B/C) có thể làm task theo sau, hoặc gắn MINOR-A vào AC của `layer-9-task-07`.
